import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { IncidentResponseService, getIncidentResponseService, resetIncidentResponseService } from '../IncidentResponseService';
import { SecurityIncident } from '../../../types/security';

describe('IncidentResponseService', () => {
  let service: IncidentResponseService;

  beforeEach(() => {
    resetIncidentResponseService();
    service = getIncidentResponseService();
  });

  afterEach(() => {
    resetIncidentResponseService();
  });

  describe('Incident Response Playbooks', () => {
    it('should handle data breach incidents with appropriate playbook', async () => {
      const incident: SecurityIncident = {
        id: 'test-incident-1',
        type: 'privacy_violation',
        severity: 'critical',
        status: 'open',
        reportedAt: new Date(),
        detectedAt: new Date(),
        description: 'Potential data breach detected in user database',
        impact: {
          usersAffected: 1000,
          dataCompromised: true,
          servicesImpacted: ['user-authentication', 'profile-management']
        },
        response: {
          timeline: [],
          containmentActions: [],
          recoveryActions: [],
          lessonsLearned: [],
          preventiveMeasures: []
        }
      };

      const response = await service.handleIncident(incident);

      expect(response.timeline).toHaveLength(4); // Data breach playbook has 4 steps
      expect(response.timeline[0].action).toBe('Immediate containment');
      expect(response.timeline[1].action).toBe('Assessment and notification');
      expect(response.timeline[2].action).toBe('Legal and regulatory notification');
      expect(response.timeline[3].action).toBe('User notification');
    });

    it('should handle authentication attacks with appropriate playbook', async () => {
      const incident: SecurityIncident = {
        id: 'test-incident-2',
        type: 'failed_login_threshold',
        severity: 'high',
        status: 'open',
        reportedAt: new Date(),
        detectedAt: new Date(),
        description: 'Multiple failed login attempts detected',
        impact: {
          usersAffected: 50,
          dataCompromised: false,
          servicesImpacted: ['authentication']
        },
        response: {
          timeline: [],
          containmentActions: [],
          recoveryActions: [],
          lessonsLearned: [],
          preventiveMeasures: []
        }
      };

      const response = await service.handleIncident(incident);

      expect(response.timeline).toHaveLength(3); // Authentication attack playbook has 3 steps
      expect(response.timeline[0].action).toBe('Account lockout');
      expect(response.timeline[1].action).toBe('IP blocking');
      expect(response.timeline[2].action).toBe('User notification');
    });

    it('should handle senior user emergency incidents', async () => {
      const incident: SecurityIncident = {
        id: 'test-incident-3',
        type: 'emergency_support_requested',
        severity: 'high',
        status: 'open',
        reportedAt: new Date(),
        detectedAt: new Date(),
        description: 'Senior user requested emergency support',
        impact: {
          usersAffected: 1,
          dataCompromised: false,
          servicesImpacted: ['support-system']
        },
        response: {
          timeline: [],
          containmentActions: [],
          recoveryActions: [],
          lessonsLearned: [],
          preventiveMeasures: []
        }
      };

      const response = await service.handleIncident(incident);

      expect(response.timeline).toHaveLength(3); // Senior user emergency playbook has 3 steps
      expect(response.timeline[0].action).toBe('Immediate human support');
      expect(response.timeline[1].action).toBe('Assess situation');
      expect(response.timeline[2].action).toBe('Escalate if needed');
    });

    it('should throw error for unknown incident types', async () => {
      const incident: SecurityIncident = {
        id: 'test-incident-unknown',
        type: 'unknown_incident_type',
        severity: 'medium',
        status: 'open',
        reportedAt: new Date(),
        detectedAt: new Date(),
        description: 'Unknown incident type',
        impact: {
          usersAffected: 0,
          dataCompromised: false,
          servicesImpacted: []
        },
        response: {
          timeline: [],
          containmentActions: [],
          recoveryActions: [],
          lessonsLearned: [],
          preventiveMeasures: []
        }
      };

      await expect(service.handleIncident(incident)).rejects.toThrow(
        'No playbook found for incident type: unknown_incident_type'
      );
    });
  });

  describe('Automation Rules', () => {
    it('should execute automation rules for critical incidents', async () => {
      const incident: SecurityIncident = {
        id: 'test-critical-incident',
        type: 'data_breach',
        severity: 'critical',
        status: 'open',
        reportedAt: new Date(),
        detectedAt: new Date(),
        description: 'Critical security incident',
        impact: {
          usersAffected: 5000,
          dataCompromised: true,
          servicesImpacted: ['all-services']
        },
        response: {
          timeline: [],
          containmentActions: [],
          recoveryActions: [],
          lessonsLearned: [],
          preventiveMeasures: []
        }
      };

      const response = await service.handleIncident(incident);

      // Should have executed automation rules
      expect(response.timeline.length).toBeGreaterThan(0);
      
      // Check that automated steps were executed
      const automatedSteps = response.timeline.filter(step => 
        step.performer === 'automation-system'
      );
      expect(automatedSteps.length).toBeGreaterThan(0);
    });

    it('should handle AI failure escalation', async () => {
      const incident: SecurityIncident = {
        id: 'test-ai-failure',
        type: 'ai_failure_pattern',
        severity: 'medium',
        status: 'open',
        reportedAt: new Date(),
        detectedAt: new Date(),
        description: 'AI system failure pattern detected',
        impact: {
          usersAffected: 100,
          dataCompromised: false,
          servicesImpacted: ['ai-assistant']
        },
        response: {
          timeline: [],
          containmentActions: [],
          recoveryActions: [],
          lessonsLearned: [],
          preventiveMeasures: []
        }
      };

      const response = await service.handleIncident(incident);
      expect(response.timeline.length).toBeGreaterThan(0);
    });

    it('should handle privacy violations with immediate response', async () => {
      const incident: SecurityIncident = {
        id: 'test-privacy-violation',
        type: 'privacy_violation',
        severity: 'critical',
        status: 'open',
        reportedAt: new Date(),
        detectedAt: new Date(),
        description: 'Privacy violation detected',
        impact: {
          usersAffected: 200,
          dataCompromised: true,
          servicesImpacted: ['data-processing']
        },
        response: {
          timeline: [],
          containmentActions: [],
          recoveryActions: [],
          lessonsLearned: [],
          preventiveMeasures: []
        }
      };

      const response = await service.handleIncident(incident);
      expect(response.timeline.length).toBeGreaterThan(0);
    });
  });

  describe('Response Metrics', () => {
    it('should generate response metrics for specified time period', async () => {
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
      const endDate = new Date();

      const metrics = await service.getResponseMetrics(startDate, endDate);

      expect(metrics).toHaveProperty('period');
      expect(metrics).toHaveProperty('totalIncidents');
      expect(metrics).toHaveProperty('incidentsByPlaybook');
      expect(metrics).toHaveProperty('averageResponseTime');
      expect(metrics).toHaveProperty('automationEffectiveness');
      expect(metrics).toHaveProperty('escalationRate');
      expect(metrics).toHaveProperty('teamPerformance');
      expect(metrics).toHaveProperty('playbookEffectiveness');
      expect(metrics).toHaveProperty('recommendations');

      expect(metrics.period.start).toEqual(startDate);
      expect(metrics.period.end).toEqual(endDate);
      expect(typeof metrics.totalIncidents).toBe('number');
      expect(typeof metrics.averageResponseTime).toBe('number');
      expect(typeof metrics.automationEffectiveness).toBe('number');
      expect(typeof metrics.escalationRate).toBe('number');
      expect(Array.isArray(metrics.recommendations)).toBe(true);
    });

    it('should calculate automation effectiveness', async () => {
      const metrics = await service.getResponseMetrics(
        new Date(Date.now() - 24 * 60 * 60 * 1000),
        new Date()
      );

      expect(metrics.automationEffectiveness).toBeGreaterThanOrEqual(0);
      expect(metrics.automationEffectiveness).toBeLessThanOrEqual(100);
    });

    it('should provide team performance metrics', async () => {
      const metrics = await service.getResponseMetrics(
        new Date(Date.now() - 24 * 60 * 60 * 1000),
        new Date()
      );

      expect(typeof metrics.teamPerformance).toBe('object');
      expect(metrics.teamPerformance).toHaveProperty('incident-commander');
      expect(metrics.teamPerformance).toHaveProperty('security-engineer');
      expect(metrics.teamPerformance).toHaveProperty('senior-support-specialist');
    });

    it('should provide playbook effectiveness metrics', async () => {
      const metrics = await service.getResponseMetrics(
        new Date(Date.now() - 24 * 60 * 60 * 1000),
        new Date()
      );

      expect(typeof metrics.playbookEffectiveness).toBe('object');
      expect(metrics.playbookEffectiveness).toHaveProperty('data-breach');
      expect(metrics.playbookEffectiveness).toHaveProperty('authentication-attack');
      expect(metrics.playbookEffectiveness).toHaveProperty('senior-user-emergency');
    });
  });

  describe('Incident Response Drills', () => {
    it('should run incident response drill for data breach scenario', async () => {
      const participants = ['security-team-1', 'security-team-2', 'incident-commander'];
      
      const drillResult = await service.runIncidentResponseDrill('privacy_violation', participants);

      expect(drillResult).toHaveProperty('id');
      expect(drillResult).toHaveProperty('scenarioType');
      expect(drillResult).toHaveProperty('startTime');
      expect(drillResult).toHaveProperty('endTime');
      expect(drillResult).toHaveProperty('participants');
      expect(drillResult).toHaveProperty('steps');
      expect(drillResult).toHaveProperty('metrics');
      expect(drillResult).toHaveProperty('findings');
      expect(drillResult).toHaveProperty('recommendations');

      expect(drillResult.scenarioType).toBe('privacy_violation');
      expect(drillResult.participants).toEqual(participants);
      expect(drillResult.startTime).toBeInstanceOf(Date);
      expect(drillResult.endTime).toBeInstanceOf(Date);
      expect(Array.isArray(drillResult.steps)).toBe(true);
      expect(Array.isArray(drillResult.findings)).toBe(true);
      expect(Array.isArray(drillResult.recommendations)).toBe(true);
    });

    it('should calculate drill metrics correctly', async () => {
      const drillResult = await service.runIncidentResponseDrill('failed_login_threshold', ['team-member']);

      expect(drillResult.metrics).toHaveProperty('totalTime');
      expect(drillResult.metrics).toHaveProperty('stepsCompleted');
      expect(drillResult.metrics).toHaveProperty('stepsSkipped');
      expect(drillResult.metrics).toHaveProperty('averageResponseTime');

      expect(typeof drillResult.metrics.totalTime).toBe('number');
      expect(typeof drillResult.metrics.stepsCompleted).toBe('number');
      expect(typeof drillResult.metrics.stepsSkipped).toBe('number');
      expect(typeof drillResult.metrics.averageResponseTime).toBe('number');
    });

    it('should generate findings and recommendations from drill results', async () => {
      const drillResult = await service.runIncidentResponseDrill('emergency_support_requested', ['support-team']);

      expect(Array.isArray(drillResult.findings)).toBe(true);
      expect(Array.isArray(drillResult.recommendations)).toBe(true);

      // Should have findings if there were issues
      if (drillResult.metrics.stepsSkipped > 0 || drillResult.metrics.averageResponseTime > 30) {
        expect(drillResult.findings.length).toBeGreaterThan(0);
        expect(drillResult.recommendations.length).toBeGreaterThan(0);
      }
    });

    it('should handle unknown drill scenarios', async () => {
      const drillResult = await service.runIncidentResponseDrill('unknown_scenario', ['team-member']);

      expect(drillResult.steps).toHaveLength(0);
      expect(drillResult.metrics.stepsCompleted).toBe(0);
    });
  });

  describe('Service Integration', () => {
    it('should maintain singleton instance', () => {
      const service1 = getIncidentResponseService();
      const service2 = getIncidentResponseService();
      expect(service1).toBe(service2);
    });

    it('should reset service instance', () => {
      const service1 = getIncidentResponseService();
      resetIncidentResponseService();
      const service2 = getIncidentResponseService();
      expect(service1).not.toBe(service2);
    });
  });

  describe('Error Handling', () => {
    it('should handle automation rule failures gracefully', async () => {
      const incident: SecurityIncident = {
        id: 'test-automation-failure',
        type: 'system_error',
        severity: 'high',
        status: 'open',
        reportedAt: new Date(),
        detectedAt: new Date(),
        description: 'System error that might cause automation failure',
        impact: {
          usersAffected: 10,
          dataCompromised: false,
          servicesImpacted: ['automation-system']
        },
        response: {
          timeline: [],
          containmentActions: [],
          recoveryActions: [],
          lessonsLearned: [],
          preventiveMeasures: []
        }
      };

      // Should not throw even if automation fails
      await expect(service.handleIncident(incident)).resolves.toBeDefined();
    });

    it('should handle missing team members gracefully', async () => {
      const incident: SecurityIncident = {
        id: 'test-no-team',
        type: 'privacy_violation',
        severity: 'critical',
        status: 'open',
        reportedAt: new Date(),
        detectedAt: new Date(),
        description: 'Incident when no team members available',
        impact: {
          usersAffected: 100,
          dataCompromised: true,
          servicesImpacted: ['all']
        },
        response: {
          timeline: [],
          containmentActions: [],
          recoveryActions: [],
          lessonsLearned: [],
          preventiveMeasures: []
        }
      };

      // Should handle gracefully even if no team members are available
      const response = await service.handleIncident(incident);
      expect(response.timeline.length).toBeGreaterThan(0);
    });
  });

  describe('Performance', () => {
    it('should handle multiple concurrent incidents', async () => {
      const incidents = Array.from({ length: 5 }, (_, i) => ({
        id: `concurrent-incident-${i}`,
        type: 'failed_login_threshold',
        severity: 'medium' as const,
        status: 'open' as const,
        reportedAt: new Date(),
        detectedAt: new Date(),
        description: `Concurrent incident ${i}`,
        impact: {
          usersAffected: 10,
          dataCompromised: false,
          servicesImpacted: ['auth']
        },
        response: {
          timeline: [],
          containmentActions: [],
          recoveryActions: [],
          lessonsLearned: [],
          preventiveMeasures: []
        }
      }));

      const promises = incidents.map(incident => service.handleIncident(incident));
      const responses = await Promise.all(promises);

      expect(responses).toHaveLength(5);
      responses.forEach((response, index) => {
        expect(response.timeline.length).toBeGreaterThan(0);
      });
    });

    it('should complete incident response within reasonable time', async () => {
      const incident: SecurityIncident = {
        id: 'performance-test-incident',
        type: 'failed_login_threshold',
        severity: 'high',
        status: 'open',
        reportedAt: new Date(),
        detectedAt: new Date(),
        description: 'Performance test incident',
        impact: {
          usersAffected: 50,
          dataCompromised: false,
          servicesImpacted: ['auth']
        },
        response: {
          timeline: [],
          containmentActions: [],
          recoveryActions: [],
          lessonsLearned: [],
          preventiveMeasures: []
        }
      };

      const startTime = Date.now();
      await service.handleIncident(incident);
      const endTime = Date.now();

      // Should complete within 1 second for automated response
      expect(endTime - startTime).toBeLessThan(1000);
    });
  });
});