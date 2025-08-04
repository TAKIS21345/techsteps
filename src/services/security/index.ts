// Security Services exports
export { EncryptionService, getEncryptionService, resetEncryptionService } from './EncryptionService';
export { PrivacyComplianceService, getPrivacyComplianceService, resetPrivacyComplianceService } from './PrivacyComplianceService';
export { DataMinimizationService, getDataMinimizationService, resetDataMinimizationService } from './DataMinimizationService';
export { DataPortabilityService, getDataPortabilityService, resetDataPortabilityService } from './DataPortabilityService';
export { SecurityMonitoringService, getSecurityMonitoringService, resetSecurityMonitoringService } from './SecurityMonitoringService';
export { SecurityTrainingService, getSecurityTrainingService, resetSecurityTrainingService } from './SecurityTrainingService';
export { TransportSecurityService, getTransportSecurityService, resetTransportSecurityService } from './TransportSecurityService';
export { ConsentManagementService, getConsentManagementService, resetConsentManagementService } from './ConsentManagementService';
export { ComplianceAutomationService, getComplianceAutomationService, resetComplianceAutomationService } from './ComplianceAutomationService';
export { IncidentResponseService, getIncidentResponseService, resetIncidentResponseService } from './IncidentResponseService';
export { PenetrationTestingService, getPenetrationTestingService, resetPenetrationTestingService } from './PenetrationTestingService';

// Re-export security types
export * from '../../types/security';

// Security configuration
export const SECURITY_CONFIG = {
  encryption: {
    algorithm: 'AES-GCM',
    keySize: 256,
    keyRotationInterval: 90 // days
  },
  privacy: {
    consentExpiryDays: 365,
    dataRetentionDays: 2555, // 7 years default
    anonymizationThreshold: 1095 // 3 years
  },
  compliance: {
    gdprEnabled: true,
    ccpaEnabled: true,
    dataSubjectRequestTimeframe: 30 // days
  }
} as const;

// Initialize all security services
export async function initializeSecurityServices(): Promise<void> {
  try {
    // Import services dynamically to avoid circular dependencies
    const { getEncryptionService } = await import('./EncryptionService');
    const { getTransportSecurityService } = await import('./TransportSecurityService');
    const { getConsentManagementService } = await import('./ConsentManagementService');
    const { getComplianceAutomationService } = await import('./ComplianceAutomationService');
    const { getSecurityMonitoringService } = await import('./SecurityMonitoringService');
    const { getSecurityTrainingService } = await import('./SecurityTrainingService');
    const { getIncidentResponseService } = await import('./IncidentResponseService');
    const { getPenetrationTestingService } = await import('./PenetrationTestingService');
    
    const encryptionService = getEncryptionService();
    await encryptionService.initialize();
    
    // Initialize transport security (TLS 1.3 enforcement)
    getTransportSecurityService();
    
    // Initialize consent management (minimal data collection)
    getConsentManagementService();
    
    // Initialize compliance automation (GDPR/CCPA)
    getComplianceAutomationService();
    
    // Initialize monitoring service (starts background monitoring)
    getSecurityMonitoringService();
    
    // Initialize training service (loads training modules)
    getSecurityTrainingService();
    
    // Initialize incident response service (loads playbooks and automation rules)
    getIncidentResponseService();
    
    // Initialize penetration testing service (schedules regular tests)
    getPenetrationTestingService();
    
    console.log('✓ All security services initialized successfully');
    console.log('✓ TLS 1.3 transport encryption enforced');
    console.log('✓ AES-256 data at rest encryption enabled');
    console.log('✓ GDPR/CCPA compliance automation active');
    console.log('✓ Minimal data collection consent system ready');
    console.log('✓ Security monitoring and incident response active');
    console.log('✓ Penetration testing automation scheduled');
    console.log('✓ Security training tracking enabled');
  } catch (error) {
    console.error('Failed to initialize security services:', error);
    throw error;
  }
}

// Security service health check
export async function checkSecurityHealth(): Promise<SecurityHealthStatus> {
  const status: SecurityHealthStatus = {
    encryption: false,
    privacy: false,
    dataMinimization: false,
    dataPortability: false,
    monitoring: false,
    training: false,
    transportSecurity: false,
    consentManagement: false,
    complianceAutomation: false,
    incidentResponse: false,
    penetrationTesting: false,
    overall: false,
    timestamp: new Date()
  };

  try {
    // Import services dynamically to avoid circular dependencies
    const { getEncryptionService } = await import('./EncryptionService');
    const { getPrivacyComplianceService } = await import('./PrivacyComplianceService');
    const { getDataMinimizationService } = await import('./DataMinimizationService');
    const { getDataPortabilityService } = await import('./DataPortabilityService');
    const { getSecurityMonitoringService } = await import('./SecurityMonitoringService');
    const { getSecurityTrainingService } = await import('./SecurityTrainingService');
    const { getTransportSecurityService } = await import('./TransportSecurityService');
    const { getConsentManagementService } = await import('./ConsentManagementService');
    const { getComplianceAutomationService } = await import('./ComplianceAutomationService');
    const { getIncidentResponseService } = await import('./IncidentResponseService');
    const { getPenetrationTestingService } = await import('./PenetrationTestingService');

    // Check encryption service
    const encryptionService = getEncryptionService();
    const testData = 'health-check-test';
    const encrypted = await encryptionService.encryptData(testData);
    const decrypted = await encryptionService.decryptData(encrypted);
    status.encryption = decrypted === testData;

    // Check privacy compliance service
    const privacyService = getPrivacyComplianceService();
    const policy = privacyService.getPrivacyPolicy();
    status.privacy = policy.version !== undefined;

    // Check data minimization service
    const dataMinService = getDataMinimizationService();
    const consentRequests = dataMinService.generateMinimalConsentRequests();
    status.dataMinimization = consentRequests.length > 0;

    // Check data portability service
    const dataPortabilityService = getDataPortabilityService();
    const dashboard = await dataPortabilityService.getAIDataUsageDashboard('health-check-user');
    status.dataPortability = dashboard.userId === 'health-check-user';

    // Check monitoring service
    const monitoringService = getSecurityMonitoringService();
    const securityDashboard = await monitoringService.getSecurityDashboard();
    status.monitoring = securityDashboard.overview !== undefined;

    // Check training service
    const trainingService = getSecurityTrainingService();
    const teamDashboard = await trainingService.getTeamTrainingDashboard();
    status.training = teamDashboard.overview !== undefined;

    // Check transport security service
    const transportSecurityService = getTransportSecurityService();
    status.transportSecurity = window.location.protocol === 'https:' || !import.meta.env.PROD;

    // Check consent management service
    const consentService = getConsentManagementService();
    const consentCategories = consentService.getConsentCategories();
    status.consentManagement = consentCategories.length > 0;

    // Check compliance automation service
    const complianceService = getComplianceAutomationService();
    const complianceDashboard = await complianceService.getComplianceDashboard();
    status.complianceAutomation = complianceDashboard.automationStatus.rulesActive > 0;

    // Check incident response service
    const incidentResponseService = getIncidentResponseService();
    const responseMetrics = await incidentResponseService.getResponseMetrics(
      new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
      new Date()
    );
    status.incidentResponse = responseMetrics.totalIncidents !== undefined;

    // Check penetration testing service
    const penTestingService = getPenetrationTestingService();
    const penTestDashboard = await penTestingService.getPenTestDashboard();
    status.penetrationTesting = penTestDashboard.overview !== undefined;

    status.overall = status.encryption && status.privacy && status.dataMinimization && 
                    status.dataPortability && status.monitoring && status.training &&
                    status.transportSecurity && status.consentManagement && status.complianceAutomation &&
                    status.incidentResponse && status.penetrationTesting;
  } catch (error) {
    console.error('Security health check failed:', error);
    status.overall = false;
  }

  return status;
}

interface SecurityHealthStatus {
  encryption: boolean;
  privacy: boolean;
  dataMinimization: boolean;
  dataPortability: boolean;
  monitoring: boolean;
  training: boolean;
  transportSecurity: boolean;
  consentManagement: boolean;
  complianceAutomation: boolean;
  incidentResponse: boolean;
  penetrationTesting: boolean;
  overall: boolean;
  timestamp: Date;
}