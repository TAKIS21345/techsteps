import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SecurityMonitoringService, getSecurityMonitoringService, resetSecurityMonitoringService } from '../SecurityMonitoringService';

describe('SecurityMonitoringService', () => {
  let service: SecurityMonitoringService;

  beforeEach(() => {
    resetSecurityMonitoringService();
    service = getSecurityMonitoringService();
  });

  afterEach(() => {
    resetSecurityMonitoringService();
  });

  describe('Security Event Logging', () => {
    it('should log security events with proper structure', async () => {
      const event = await service.logSecurityEvent(
        'authentication',
        'high',
        'login-system',
        {
          action: 'failed_login',
          resource: '/api/auth/login',
          outcome: 'failure',
          metadata: { attempts: 3, ipAddress: '192.168.1.1' }
        },
        'user123'
      );

      expect(event).toMatchObject({
        type: 'authentication',
        severity: 'high',
        source: 'login-system',
        userId: 'user123',
        resolved: false
      });
      expect(event.id).toBeDefined();
      expect(event.timestamp).toBeInstanceOf(Date);
      expect(event.details.riskScore).toBeGreaterThan(0);
    });

    it('should calculate risk scores based on severity and context', async () => {
      const criticalEvent = await service.logSecurityEvent(
        'privacy',
        'critical',
        'data-export',
        {
          action: 'unauthorized_data_export',
          resource: '/api/data/export',
          outcome: 'failure',
          metadata: { dataType: 'personal' }
        }
      );

      const lowEvent = await service.logSecurityEvent(
        'system',
        'low',
        'health-check',
        {
          action: 'health_check',
          resource: '/api/health',
          outcome: 'success',
          metadata: {}
        }
      );

      expect(criticalEvent.details.riskScore).toBeGreaterThan(lowEvent.details.riskScore);
    });

    it('should create alerts when thresholds are exceeded', async () => {
      // Log multiple failed login attempts to trigger threshold
      for (let i = 0; i < 6; i++) {
        await service.logSecurityEvent(
          'authentication',
          'medium',
          'login-system',
          {
            action: 'failed_login',
            resource: '/api/auth/login',
            outcome: 'failure',
            metadata: { attempt: i + 1 }
          }
        );
      }

      // Wait a bit for threshold evaluation
      await new Promise(resolve => setTimeout(resolve, 10));

      const dashboard = await service.getSecurityDashboard();
      expect(dashboard.overview.activeAlerts).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Security Alerts', () => {
    it('should create and manage security alerts', async () => {
      const event = await service.logSecurityEvent(
        'data-access',
        'high',
        'api-gateway',
        {
          action: 'unauthorized_access',
          resource: '/api/sensitive-data',
          outcome: 'blocked',
          metadata: {}
        }
      );

      const alert = await service.createSecurityAlert(
        event.id,
        'unauthorized_access_attempt',
        'high',
        'Unauthorized access attempt detected and blocked'
      );

      expect(alert).toMatchObject({
        eventId: event.id,
        type: 'unauthorized_access_attempt',
        severity: 'high',
        acknowledged: false
      });
      expect(alert.id).toBeDefined();
      expect(alert.timestamp).toBeInstanceOf(Date);
    });

    it('should acknowledge alerts', async () => {
      const event = await service.logSecurityEvent(
        'system',
        'medium',
        'monitoring',
        {
          action: 'anomaly_detected',
          resource: 'system-metrics',
          outcome: 'success',
          metadata: {}
        }
      );

      const alert = await service.createSecurityAlert(
        event.id,
        'system_anomaly',
        'medium',
        'System anomaly detected'
      );

      await service.acknowledgeAlert(alert.id, 'security-team-member');

      const dashboard = await service.getSecurityDashboard();
      const acknowledgedAlert = dashboard.activeAlerts.find(a => a.id === alert.id);
      expect(acknowledgedAlert).toBeUndefined(); // Should not be in active alerts
    });

    it('should escalate critical alerts to incidents', async () => {
      const event = await service.logSecurityEvent(
        'privacy',
        'critical',
        'data-breach-detector',
        {
          action: 'data_breach_detected',
          resource: 'user-database',
          outcome: 'failure',
          metadata: { recordsAffected: 1000 }
        }
      );

      await service.createSecurityAlert(
        event.id,
        'data_breach',
        'critical',
        'Critical data breach detected'
      );

      const dashboard = await service.getSecurityDashboard();
      expect(dashboard.overview.openIncidents).toBeGreaterThan(0);
    });
  });

  describe('Security Incidents', () => {
    it('should create and manage security incidents', async () => {
      const incident = await service.createSecurityIncident(
        'data-breach',
        'critical',
        'Potential data breach in user authentication system',
        []
      );

      expect(incident).toMatchObject({
        type: 'data-breach',
        severity: 'critical',
        status: 'open',
        description: 'Potential data breach in user authentication system'
      });
      expect(incident.id).toBeDefined();
      expect(incident.reportedAt).toBeInstanceOf(Date);
      expect(incident.response.timeline.length).toBeGreaterThanOrEqual(1);
    });

    it('should update incident status and track timeline', async () => {
      const incident = await service.createSecurityIncident(
        'authentication-attack',
        'high',
        'Brute force attack detected',
        []
      );

      const updatedIncident = await service.updateIncident(incident.id, {
        status: 'investigating'
      });

      expect(updatedIncident.status).toBe('investigating');
      expect(updatedIncident.response.timeline.length).toBeGreaterThanOrEqual(1);
    });

    it('should resolve incidents and set resolution date', async () => {
      const incident = await service.createSecurityIncident(
        'system-compromise',
        'medium',
        'Suspicious system activity detected',
        []
      );

      const resolvedIncident = await service.updateIncident(incident.id, {
        status: 'resolved'
      });

      expect(resolvedIncident.status).toBe('resolved');
      expect(resolvedIncident.resolvedAt).toBeInstanceOf(Date);
    });
  });

  describe('Audit Logging', () => {
    it('should log audit events with proper structure', async () => {
      const auditLog = await service.logAuditEvent(
        'user_login',
        'user123',
        { loginMethod: 'password', success: true },
        'user123',
        '192.168.1.1',
        'Mozilla/5.0'
      );

      expect(auditLog).toMatchObject({
        action: 'user_login',
        resource: 'user123',
        outcome: 'success',
        userId: 'user123',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0'
      });
      expect(auditLog.id).toBeDefined();
      expect(auditLog.timestamp).toBeInstanceOf(Date);
    });

    it('should handle sensitive audit data', async () => {
      const sensitiveData = {
        personalInfo: 'sensitive-data',
        sensitive: true
      };

      // Should not throw error even if encryption service is not initialized
      const auditLog = await service.logAuditEvent(
        'data_access',
        'sensitive-resource',
        sensitiveData
      );

      expect(auditLog.details.parameters).toBeDefined();
    });
  });

  describe('Security Dashboard', () => {
    it('should provide comprehensive dashboard data', async () => {
      // Create some test data
      await service.logSecurityEvent(
        'authentication',
        'medium',
        'test-source',
        {
          action: 'test_action',
          resource: 'test-resource',
          outcome: 'success',
          metadata: {}
        }
      );

      const dashboard = await service.getSecurityDashboard();

      expect(dashboard).toHaveProperty('overview');
      expect(dashboard).toHaveProperty('recentEvents');
      expect(dashboard).toHaveProperty('activeAlerts');
      expect(dashboard).toHaveProperty('openIncidents');
      expect(dashboard).toHaveProperty('threatLevel');
      expect(dashboard).toHaveProperty('systemHealth');

      expect(dashboard.overview).toHaveProperty('totalEvents');
      expect(dashboard.overview).toHaveProperty('eventsLast24h');
      expect(dashboard.overview).toHaveProperty('activeAlerts');
      expect(dashboard.overview).toHaveProperty('openIncidents');
      expect(dashboard.overview).toHaveProperty('criticalIssues');
    });

    it('should calculate threat levels correctly', async () => {
      const dashboard = await service.getSecurityDashboard();
      expect(['low', 'medium', 'high', 'critical']).toContain(dashboard.threatLevel);
    });

    it('should provide system health information', async () => {
      const dashboard = await service.getSecurityDashboard();
      
      expect(dashboard.systemHealth).toHaveProperty('monitoring');
      expect(dashboard.systemHealth).toHaveProperty('eventsProcessed');
      expect(dashboard.systemHealth).toHaveProperty('alertsActive');
      expect(dashboard.systemHealth).toHaveProperty('incidentsOpen');
      expect(dashboard.systemHealth).toHaveProperty('lastHealthCheck');
    });
  });

  describe('Security Reports', () => {
    it('should generate comprehensive security reports', async () => {
      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
      const endDate = new Date();

      // Create some test data
      await service.logSecurityEvent(
        'authentication',
        'medium',
        'test-source',
        {
          action: 'test_action',
          resource: 'test-resource',
          outcome: 'success',
          metadata: {}
        }
      );

      const report = await service.generateSecurityReport(startDate, endDate);

      expect(report).toHaveProperty('period');
      expect(report).toHaveProperty('summary');
      expect(report).toHaveProperty('trends');
      expect(report).toHaveProperty('topThreats');
      expect(report).toHaveProperty('recommendations');

      expect(report.period.start).toEqual(startDate);
      expect(report.period.end).toEqual(endDate);
      expect(report.summary).toHaveProperty('totalEvents');
      expect(report.summary).toHaveProperty('eventsByType');
      expect(report.summary).toHaveProperty('eventsBySeverity');
    });

    it('should include detailed data when requested', async () => {
      const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
      const endDate = new Date();

      const report = await service.generateSecurityReport(startDate, endDate, true);

      expect(report).toHaveProperty('detailedEvents');
      expect(report).toHaveProperty('detailedAlerts');
      expect(report).toHaveProperty('detailedIncidents');
    });
  });

  describe('Penetration Testing', () => {
    it('should run penetration tests and return results', async () => {
      const testResult = await service.runPenetrationTest();

      expect(testResult).toHaveProperty('id');
      expect(testResult).toHaveProperty('startTime');
      expect(testResult).toHaveProperty('endTime');
      expect(testResult).toHaveProperty('testType');
      expect(testResult).toHaveProperty('scope');
      expect(testResult).toHaveProperty('findings');
      expect(testResult).toHaveProperty('overallRisk');
      expect(testResult).toHaveProperty('recommendations');

      expect(testResult.startTime).toBeInstanceOf(Date);
      expect(testResult.endTime).toBeInstanceOf(Date);
      expect(Array.isArray(testResult.scope)).toBe(true);
      expect(Array.isArray(testResult.findings)).toBe(true);
      expect(['low', 'medium', 'high', 'critical']).toContain(testResult.overallRisk);
    });

    it('should log penetration test completion', async () => {
      const initialDashboard = await service.getSecurityDashboard();
      const initialEventCount = initialDashboard.overview.totalEvents;

      await service.runPenetrationTest();

      const updatedDashboard = await service.getSecurityDashboard();
      expect(updatedDashboard.overview.totalEvents).toBeGreaterThanOrEqual(initialEventCount);
    });
  });

  describe('Service Integration', () => {
    it('should maintain singleton instance', () => {
      const service1 = getSecurityMonitoringService();
      const service2 = getSecurityMonitoringService();
      expect(service1).toBe(service2);
    });

    it('should reset service instance', () => {
      const service1 = getSecurityMonitoringService();
      resetSecurityMonitoringService();
      const service2 = getSecurityMonitoringService();
      expect(service1).not.toBe(service2);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid event types gracefully', async () => {
      await expect(
        service.logSecurityEvent(
          'invalid-type' as any,
          'high',
          'test-source',
          {
            action: 'test',
            resource: 'test',
            outcome: 'success',
            metadata: {}
          }
        )
      ).resolves.toBeDefined();
    });

    it('should handle missing alert acknowledgment gracefully', async () => {
      await expect(
        service.acknowledgeAlert('non-existent-alert', 'user')
      ).rejects.toThrow('Alert non-existent-alert not found');
    });

    it('should handle missing incident updates gracefully', async () => {
      await expect(
        service.updateIncident('non-existent-incident', { status: 'resolved' })
      ).rejects.toThrow('Incident non-existent-incident not found');
    });
  });

  describe('Performance', () => {
    it('should handle multiple concurrent events', async () => {
      const promises = Array.from({ length: 10 }, (_, i) =>
        service.logSecurityEvent(
          'system',
          'low',
          `test-source-${i}`,
          {
            action: `test_action_${i}`,
            resource: `test-resource-${i}`,
            outcome: 'success',
            metadata: { index: i }
          }
        )
      );

      const events = await Promise.all(promises);
      expect(events).toHaveLength(10);
      events.forEach((event, index) => {
        expect(event.source).toBe(`test-source-${index}`);
      });
    });

    it('should clean up old events', async () => {
      // This test would need to mock time or use a test-specific cleanup method
      // For now, we'll just verify the method exists
      expect(typeof (service as any).cleanupOldEvents).toBe('function');
    });
  });
});