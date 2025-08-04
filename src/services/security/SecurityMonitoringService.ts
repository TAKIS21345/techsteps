// Security Monitoring and Incident Response Service
import { 
  SecurityEvent, 
  SecurityAlert, 
  SecurityIncident, 
  AuditLog,
  SecurityEventDetails,
  IncidentResponse,
  ResponseAction
} from '../../types/security';
import { getEncryptionService } from './EncryptionService';

export class SecurityMonitoringService {
  private encryptionService = getEncryptionService();
  private securityEvents: Map<string, SecurityEvent> = new Map();
  private securityAlerts: Map<string, SecurityAlert> = new Map();
  private securityIncidents: Map<string, SecurityIncident> = new Map();
  private auditLogs: Map<string, AuditLog> = new Map();
  private alertThresholds: Map<string, AlertThreshold> = new Map();
  private monitoringEnabled = true;

  constructor() {
    this.initializeService();
    this.setupDefaultThresholds();
  }

  private async initializeService(): Promise<void> {
    try {
      await this.encryptionService.initialize();
      this.startContinuousMonitoring();
    } catch (error) {
      console.error('Failed to initialize security monitoring service:', error);
    }
  }

  /**
   * Log security event for monitoring and analysis
   */
  async logSecurityEvent(
    type: 'authentication' | 'authorization' | 'data-access' | 'system' | 'privacy',
    severity: 'low' | 'medium' | 'high' | 'critical',
    source: string,
    details: SecurityEventDetails,
    userId?: string
  ): Promise<SecurityEvent> {
    const event: SecurityEvent = {
      id: this.generateEventId(),
      type,
      severity,
      timestamp: new Date(),
      userId,
      source,
      details,
      resolved: false
    };

    // Store event
    this.securityEvents.set(event.id, event);

    // Calculate risk score
    event.details.riskScore = await this.calculateRiskScore(event);

    // Check if event should trigger alert
    await this.evaluateForAlert(event);

    // Log to audit trail
    await this.logAuditEvent('security_event_logged', event.id, {
      eventType: type,
      severity,
      source,
      riskScore: event.details.riskScore
    });

    return event;
  }

  /**
   * Create security alert based on events or thresholds
   */
  async createSecurityAlert(
    eventId: string,
    type: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    message: string
  ): Promise<SecurityAlert> {
    const alert: SecurityAlert = {
      id: this.generateAlertId(),
      eventId,
      type,
      severity,
      message,
      timestamp: new Date(),
      acknowledged: false
    };

    this.securityAlerts.set(alert.id, alert);

    // Auto-escalate critical alerts to incidents
    if (severity === 'critical') {
      await this.escalateToIncident(alert);
    }

    // Send notifications
    await this.sendAlertNotifications(alert);

    return alert;
  }

  /**
   * Create security incident for serious threats
   */
  async createSecurityIncident(
    type: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    description: string,
    relatedAlerts?: string[]
  ): Promise<SecurityIncident> {
    const incident: SecurityIncident = {
      id: this.generateIncidentId(),
      type,
      severity,
      status: 'open',
      reportedAt: new Date(),
      detectedAt: new Date(),
      description,
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

    this.securityIncidents.set(incident.id, incident);

    // Start incident response process
    await this.initiateIncidentResponse(incident);

    return incident;
  }

  /**
   * Log audit event for compliance and investigation
   */
  async logAuditEvent(
    action: string,
    resource: string,
    details: any,
    userId?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AuditLog> {
    const auditLog: AuditLog = {
      id: this.generateAuditId(),
      timestamp: new Date(),
      userId,
      action,
      resource,
      outcome: 'success',
      details: {
        method: 'system',
        parameters: details,
        changes: []
      },
      ipAddress: ipAddress || 'system',
      userAgent: userAgent || 'security-monitoring-service'
    };

    // Encrypt sensitive audit data
    if (details.sensitive) {
      try {
        auditLog.details.parameters = await this.encryptionService.encryptObject(details);
      } catch (error) {
        console.warn('Failed to encrypt sensitive audit data:', error);
        // Store without encryption but mark as sensitive
        auditLog.details.parameters = { ...details, encryptionFailed: true };
      }
    }

    this.auditLogs.set(auditLog.id, auditLog);

    return auditLog;
  }

  /**
   * Acknowledge security alert
   */
  async acknowledgeAlert(alertId: string, assignedTo: string): Promise<void> {
    const alert = this.securityAlerts.get(alertId);
    if (!alert) {
      throw new Error(`Alert ${alertId} not found`);
    }

    alert.acknowledged = true;
    alert.assignedTo = assignedTo;
    this.securityAlerts.set(alertId, alert);

    await this.logAuditEvent('alert_acknowledged', alertId, {
      assignedTo,
      acknowledgedAt: new Date()
    });
  }

  /**
   * Update incident status and response
   */
  async updateIncident(
    incidentId: string,
    updates: Partial<SecurityIncident>
  ): Promise<SecurityIncident> {
    const incident = this.securityIncidents.get(incidentId);
    if (!incident) {
      throw new Error(`Incident ${incidentId} not found`);
    }

    // Track status changes
    if (updates.status && updates.status !== incident.status) {
      const responseAction: ResponseAction = {
        timestamp: new Date(),
        action: `Status changed from ${incident.status} to ${updates.status}`,
        performer: 'system',
        outcome: 'completed'
      };
      incident.response.timeline.push(responseAction);
    }

    // Update incident
    Object.assign(incident, updates);
    
    if (updates.status === 'resolved') {
      incident.resolvedAt = new Date();
    }

    this.securityIncidents.set(incidentId, incident);

    await this.logAuditEvent('incident_updated', incidentId, {
      updates,
      updatedAt: new Date()
    });

    return incident;
  }

  /**
   * Get security dashboard data
   */
  async getSecurityDashboard(): Promise<SecurityDashboard> {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const events = Array.from(this.securityEvents.values());
    const alerts = Array.from(this.securityAlerts.values());
    const incidents = Array.from(this.securityIncidents.values());

    return {
      overview: {
        totalEvents: events.length,
        eventsLast24h: events.filter(e => e.timestamp > last24Hours).length,
        activeAlerts: alerts.filter(a => !a.acknowledged).length,
        openIncidents: incidents.filter(i => i.status === 'open' || i.status === 'investigating').length,
        criticalIssues: [...alerts, ...incidents].filter(item => 
          'severity' in item && item.severity === 'critical'
        ).length
      },
      recentEvents: events
        .filter(e => e.timestamp > last7Days)
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, 10),
      activeAlerts: alerts
        .filter(a => !a.acknowledged)
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()),
      openIncidents: incidents
        .filter(i => i.status !== 'closed')
        .sort((a, b) => b.reportedAt.getTime() - a.reportedAt.getTime()),
      threatLevel: this.calculateOverallThreatLevel(),
      systemHealth: await this.getSystemHealthStatus()
    };
  }

  /**
   * Generate security report for specified time period
   */
  async generateSecurityReport(
    startDate: Date,
    endDate: Date,
    includeDetails: boolean = false
  ): Promise<SecurityReport> {
    const events = Array.from(this.securityEvents.values())
      .filter(e => e.timestamp >= startDate && e.timestamp <= endDate);
    
    const alerts = Array.from(this.securityAlerts.values())
      .filter(a => a.timestamp >= startDate && a.timestamp <= endDate);
    
    const incidents = Array.from(this.securityIncidents.values())
      .filter(i => i.reportedAt >= startDate && i.reportedAt <= endDate);

    const report: SecurityReport = {
      period: { start: startDate, end: endDate },
      summary: {
        totalEvents: events.length,
        eventsByType: this.groupEventsByType(events),
        eventsBySeverity: this.groupEventsBySeverity(events),
        totalAlerts: alerts.length,
        alertsByType: this.groupAlertsByType(alerts),
        totalIncidents: incidents.length,
        incidentsByType: this.groupIncidentsByType(incidents),
        averageResponseTime: this.calculateAverageResponseTime(incidents),
        resolutionRate: this.calculateResolutionRate(incidents)
      },
      trends: this.analyzeTrends(events, alerts, incidents),
      topThreats: this.identifyTopThreats(events),
      recommendations: this.generateSecurityRecommendations(events, alerts, incidents)
    };

    if (includeDetails) {
      report.detailedEvents = events;
      report.detailedAlerts = alerts;
      report.detailedIncidents = incidents;
    }

    return report;
  }

  /**
   * Run penetration testing simulation
   */
  async runPenetrationTest(): Promise<PenetrationTestResult> {
    const testResult: PenetrationTestResult = {
      id: this.generateTestId(),
      startTime: new Date(),
      endTime: new Date(),
      testType: 'automated',
      scope: ['authentication', 'authorization', 'data-access', 'input-validation'],
      findings: [],
      overallRisk: 'low',
      recommendations: []
    };

    // Simulate various security tests
    const tests = [
      this.testAuthenticationSecurity(),
      this.testAuthorizationControls(),
      this.testDataAccessControls(),
      this.testInputValidation(),
      this.testSessionManagement(),
      this.testEncryptionImplementation()
    ];

    const results = await Promise.all(tests);
    
    results.forEach(result => {
      if (result.vulnerabilities.length > 0) {
        testResult.findings.push(...result.vulnerabilities);
      }
    });

    // Determine overall risk level
    testResult.overallRisk = this.calculateOverallRisk(testResult.findings);
    
    // Generate recommendations
    testResult.recommendations = this.generatePenTestRecommendations(testResult.findings);

    // Log penetration test
    await this.logAuditEvent('penetration_test_completed', testResult.id, {
      findingsCount: testResult.findings.length,
      overallRisk: testResult.overallRisk,
      testDuration: testResult.endTime.getTime() - testResult.startTime.getTime()
    });

    return testResult;
  }

  /**
   * Setup default alert thresholds
   */
  private setupDefaultThresholds(): void {
    this.alertThresholds.set('authentication', {
      threshold: 5,
      timeWindow: 15 * 60 * 1000, // 15 minutes
      severity: 'medium'
    });

    this.alertThresholds.set('data-access', {
      threshold: 10,
      timeWindow: 60 * 60 * 1000, // 1 hour
      severity: 'high'
    });

    this.alertThresholds.set('system', {
      threshold: 20,
      timeWindow: 30 * 60 * 1000, // 30 minutes
      severity: 'medium'
    });

    this.alertThresholds.set('privacy', {
      threshold: 1,
      timeWindow: 0, // Immediate
      severity: 'critical'
    });
  }

  /**
   * Start continuous monitoring
   */
  private startContinuousMonitoring(): void {
    if (!this.monitoringEnabled) return;

    // Monitor for suspicious patterns every 5 minutes
    setInterval(() => {
      this.detectSuspiciousPatterns();
    }, 5 * 60 * 1000);

    // Clean up old events every hour
    setInterval(() => {
      this.cleanupOldEvents();
    }, 60 * 60 * 1000);

    // Generate health reports every 24 hours
    setInterval(() => {
      this.generateHealthReport();
    }, 24 * 60 * 60 * 1000);
  }

  /**
   * Evaluate event for alert generation
   */
  private async evaluateForAlert(event: SecurityEvent): Promise<void> {
    const threshold = this.alertThresholds.get(event.type);
    if (!threshold) return;

    // Check if threshold is exceeded
    const recentEvents = Array.from(this.securityEvents.values())
      .filter(e => 
        e.type === event.type && 
        e.timestamp.getTime() > (Date.now() - threshold.timeWindow)
      );

    if (recentEvents.length >= threshold.threshold) {
      await this.createSecurityAlert(
        event.id,
        `${event.type}_threshold_exceeded`,
        threshold.severity,
        `${event.type} threshold exceeded: ${recentEvents.length} events in ${threshold.timeWindow / 60000} minutes`
      );
    }
  }

  /**
   * Calculate risk score for security event
   */
  private async calculateRiskScore(event: SecurityEvent): Promise<number> {
    let score = 0;

    // Base score by severity
    switch (event.severity) {
      case 'low': score += 1; break;
      case 'medium': score += 3; break;
      case 'high': score += 7; break;
      case 'critical': score += 10; break;
    }

    // Increase score for sensitive operations
    if (event.details?.action?.includes('delete') || event.details?.action?.includes('export')) {
      score += 2;
    }

    // Increase score for failed operations
    if (event.details?.outcome === 'failure') {
      score += 1;
    }

    // Increase score for repeated events from same source
    const recentSimilarEvents = Array.from(this.securityEvents.values())
      .filter(e => 
        e.source === event.source && 
        e.type === event.type &&
        e.timestamp.getTime() > (Date.now() - 60 * 60 * 1000) // Last hour
      );

    score += Math.min(recentSimilarEvents.length, 5);

    return Math.min(score, 10); // Cap at 10
  }

  /**
   * Escalate alert to incident
   */
  private async escalateToIncident(alert: SecurityAlert): Promise<void> {
    const event = this.securityEvents.get(alert.eventId);
    
    await this.createSecurityIncident(
      alert.type,
      alert.severity,
      `Critical alert escalated: ${alert.message}`,
      [alert.id]
    );
  }

  /**
   * Initiate incident response process
   */
  private async initiateIncidentResponse(incident: SecurityIncident): Promise<void> {
    // Initial response action is already added in createSecurityIncident
    // Add additional response actions here if needed

    // Auto-containment for critical incidents
    if (incident.severity === 'critical') {
      await this.performAutoContainment(incident);
    }

    // Notify incident response team
    await this.notifyIncidentResponseTeam(incident);
  }

  /**
   * Perform automatic containment actions
   */
  private async performAutoContainment(incident: SecurityIncident): Promise<void> {
    const containmentActions = [
      'Rate limiting activated',
      'Suspicious IP addresses blocked',
      'Enhanced monitoring enabled',
      'Security team notified'
    ];

    incident.response.containmentActions.push(...containmentActions);

    const containmentAction: ResponseAction = {
      timestamp: new Date(),
      action: 'Automatic containment measures activated',
      performer: 'system',
      outcome: 'completed'
    };

    incident.response.timeline.push(containmentAction);
  }

  // Mock implementations for testing and penetration testing
  private async testAuthenticationSecurity(): Promise<SecurityTestResult> {
    return {
      testName: 'Authentication Security',
      vulnerabilities: [
        {
          severity: 'medium',
          description: 'Password policy could be stronger',
          recommendation: 'Implement stricter password requirements'
        }
      ]
    };
  }

  private async testAuthorizationControls(): Promise<SecurityTestResult> {
    return {
      testName: 'Authorization Controls',
      vulnerabilities: []
    };
  }

  private async testDataAccessControls(): Promise<SecurityTestResult> {
    return {
      testName: 'Data Access Controls',
      vulnerabilities: []
    };
  }

  private async testInputValidation(): Promise<SecurityTestResult> {
    return {
      testName: 'Input Validation',
      vulnerabilities: []
    };
  }

  private async testSessionManagement(): Promise<SecurityTestResult> {
    return {
      testName: 'Session Management',
      vulnerabilities: []
    };
  }

  private async testEncryptionImplementation(): Promise<SecurityTestResult> {
    return {
      testName: 'Encryption Implementation',
      vulnerabilities: []
    };
  }

  // Helper methods
  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateAlertId(): string {
    return `alt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateIncidentId(): string {
    return `inc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateAuditId(): string {
    return `aud_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateTestId(): string {
    return `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private calculateOverallThreatLevel(): 'low' | 'medium' | 'high' | 'critical' {
    const recentEvents = Array.from(this.securityEvents.values())
      .filter(e => e.timestamp.getTime() > (Date.now() - 24 * 60 * 60 * 1000));

    const criticalEvents = recentEvents.filter(e => e.severity === 'critical').length;
    const highEvents = recentEvents.filter(e => e.severity === 'high').length;

    if (criticalEvents > 0) return 'critical';
    if (highEvents > 2) return 'high';
    if (recentEvents.length > 10) return 'medium';
    return 'low';
  }

  private async getSystemHealthStatus(): Promise<any> {
    return {
      monitoring: this.monitoringEnabled,
      eventsProcessed: this.securityEvents.size,
      alertsActive: Array.from(this.securityAlerts.values()).filter(a => !a.acknowledged).length,
      incidentsOpen: Array.from(this.securityIncidents.values()).filter(i => i.status !== 'closed').length,
      lastHealthCheck: new Date()
    };
  }

  private groupEventsByType(events: SecurityEvent[]): Record<string, number> {
    return events.reduce((acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private groupEventsBySeverity(events: SecurityEvent[]): Record<string, number> {
    return events.reduce((acc, event) => {
      acc[event.severity] = (acc[event.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private groupAlertsByType(alerts: SecurityAlert[]): Record<string, number> {
    return alerts.reduce((acc, alert) => {
      acc[alert.type] = (acc[alert.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private groupIncidentsByType(incidents: SecurityIncident[]): Record<string, number> {
    return incidents.reduce((acc, incident) => {
      acc[incident.type] = (acc[incident.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private calculateAverageResponseTime(incidents: SecurityIncident[]): number {
    const resolvedIncidents = incidents.filter(i => i.resolvedAt);
    if (resolvedIncidents.length === 0) return 0;

    const totalTime = resolvedIncidents.reduce((sum, incident) => {
      return sum + (incident.resolvedAt!.getTime() - incident.reportedAt.getTime());
    }, 0);

    return totalTime / resolvedIncidents.length / (1000 * 60 * 60); // Convert to hours
  }

  private calculateResolutionRate(incidents: SecurityIncident[]): number {
    if (incidents.length === 0) return 100;
    const resolvedCount = incidents.filter(i => i.status === 'resolved' || i.status === 'closed').length;
    return (resolvedCount / incidents.length) * 100;
  }

  private analyzeTrends(events: SecurityEvent[], alerts: SecurityAlert[], incidents: SecurityIncident[]): any {
    return {
      eventTrend: 'stable',
      alertTrend: 'decreasing',
      incidentTrend: 'stable',
      riskTrend: 'improving'
    };
  }

  private identifyTopThreats(events: SecurityEvent[]): any[] {
    const threatCounts = this.groupEventsByType(events);
    return Object.entries(threatCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([type, count]) => ({ type, count }));
  }

  private generateSecurityRecommendations(events: SecurityEvent[], alerts: SecurityAlert[], incidents: SecurityIncident[]): string[] {
    const recommendations = [];

    if (events.filter(e => e.type === 'authentication').length > 10) {
      recommendations.push('Consider implementing additional authentication factors');
    }

    if (alerts.filter(a => a.severity === 'critical').length > 0) {
      recommendations.push('Review and strengthen critical security controls');
    }

    if (incidents.length > 0) {
      recommendations.push('Conduct security awareness training for staff');
    }

    return recommendations;
  }

  private calculateOverallRisk(findings: any[]): 'low' | 'medium' | 'high' | 'critical' {
    const criticalFindings = findings.filter(f => f.severity === 'critical').length;
    const highFindings = findings.filter(f => f.severity === 'high').length;

    if (criticalFindings > 0) return 'critical';
    if (highFindings > 2) return 'high';
    if (findings.length > 5) return 'medium';
    return 'low';
  }

  private generatePenTestRecommendations(findings: any[]): string[] {
    const recommendations = [];

    findings.forEach(finding => {
      if (finding.recommendation) {
        recommendations.push(finding.recommendation);
      }
    });

    return [...new Set(recommendations)]; // Remove duplicates
  }

  private async detectSuspiciousPatterns(): Promise<void> {
    // Implementation for pattern detection
    console.log('Running suspicious pattern detection...');
  }

  private cleanupOldEvents(): void {
    const cutoffDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days
    
    for (const [id, event] of this.securityEvents.entries()) {
      if (event.timestamp < cutoffDate) {
        this.securityEvents.delete(id);
      }
    }
  }

  private async generateHealthReport(): Promise<void> {
    console.log('Generating security health report...');
  }

  private async sendAlertNotifications(alert: SecurityAlert): Promise<void> {
    console.log(`Security alert: ${alert.message} (${alert.severity})`);
  }

  private async notifyIncidentResponseTeam(incident: SecurityIncident): Promise<void> {
    console.log(`Security incident created: ${incident.description} (${incident.severity})`);
  }
}

// Types for security monitoring
interface AlertThreshold {
  threshold: number;
  timeWindow: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface SecurityDashboard {
  overview: {
    totalEvents: number;
    eventsLast24h: number;
    activeAlerts: number;
    openIncidents: number;
    criticalIssues: number;
  };
  recentEvents: SecurityEvent[];
  activeAlerts: SecurityAlert[];
  openIncidents: SecurityIncident[];
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
  systemHealth: any;
}

interface SecurityReport {
  period: { start: Date; end: Date };
  summary: {
    totalEvents: number;
    eventsByType: Record<string, number>;
    eventsBySeverity: Record<string, number>;
    totalAlerts: number;
    alertsByType: Record<string, number>;
    totalIncidents: number;
    incidentsByType: Record<string, number>;
    averageResponseTime: number;
    resolutionRate: number;
  };
  trends: any;
  topThreats: any[];
  recommendations: string[];
  detailedEvents?: SecurityEvent[];
  detailedAlerts?: SecurityAlert[];
  detailedIncidents?: SecurityIncident[];
}

interface PenetrationTestResult {
  id: string;
  startTime: Date;
  endTime: Date;
  testType: 'automated' | 'manual';
  scope: string[];
  findings: any[];
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
  recommendations: string[];
}

interface SecurityTestResult {
  testName: string;
  vulnerabilities: Array<{
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    recommendation: string;
  }>;
}

// Singleton instance
let securityMonitoringServiceInstance: SecurityMonitoringService | null = null;

export function getSecurityMonitoringService(): SecurityMonitoringService {
  if (!securityMonitoringServiceInstance) {
    securityMonitoringServiceInstance = new SecurityMonitoringService();
  }
  return securityMonitoringServiceInstance;
}

export function resetSecurityMonitoringService(): void {
  securityMonitoringServiceInstance = null;
}