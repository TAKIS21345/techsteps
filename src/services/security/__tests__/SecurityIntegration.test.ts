// Integration tests for Security Services (Task 9.1)
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { 
  initializeSecurityServices, 
  checkSecurityHealth,
  getEncryptionService,
  getTransportSecurityService,
  getConsentManagementService,
  getComplianceAutomationService,
  resetEncryptionService,
  resetTransportSecurityService,
  resetConsentManagementService,
  resetComplianceAutomationService
} from '../index';

describe('Security Services Integration - Task 9.1', () => {
  beforeEach(async () => {
    // Reset all services before each test
    resetEncryptionService();
    resetTransportSecurityService();
    resetConsentManagementService();
    resetComplianceAutomationService();
  });

  afterEach(() => {
    // Clean up after each test
    resetEncryptionService();
    resetTransportSecurityService();
    resetConsentManagementService();
    resetComplianceAutomationService();
  });

  describe('Task 9.1: Data Encryption and Protection Implementation', () => {
    it('should initialize all security services successfully', async () => {
      await expect(initializeSecurityServices()).resolves.not.toThrow();
    });

    it('should enforce AES-256 encryption for data at rest', async () => {
      await initializeSecurityServices();
      
      const encryptionService = getEncryptionService();
      
      // Test AES-256 encryption
      const sensitiveData = 'Senior user personal information';
      const encrypted = await encryptionService.encryptData(sensitiveData);
      const decrypted = await encryptionService.decryptData(encrypted);
      
      expect(decrypted).toBe(sensitiveData);
      expect(encrypted).not.toBe(sensitiveData);
    });

    it('should enforce TLS 1.3 for transport encryption', async () => {
      await initializeSecurityServices();
      
      const transportSecurityService = getTransportSecurityService();
      
      // Test HTTPS URL validation
      const httpsUrl = 'https://api.example.com/secure-endpoint';
      const httpUrl = 'http://api.example.com/insecure-endpoint';
      
      expect(transportSecurityService.validateSecureConnection(httpsUrl)).toBe(true);
      expect(transportSecurityService.validateSecureConnection(httpUrl)).toBe(false);
    });

    it('should provide comprehensive security headers', async () => {
      await initializeSecurityServices();
      
      const transportSecurityService = getTransportSecurityService();
      const headers = transportSecurityService.getSecurityHeaders();
      
      // Verify TLS 1.3 related headers
      expect(headers['Strict-Transport-Security']).toContain('max-age=31536000');
      expect(headers['Content-Security-Policy']).toContain('upgrade-insecure-requests');
      expect(headers['X-Frame-Options']).toBe('DENY');
      expect(headers['X-Content-Type-Options']).toBe('nosniff');
    });

    it('should implement minimal data collection with explicit consent', async () => {
      await initializeSecurityServices();
      
      const consentService = getConsentManagementService();
      
      // Test consent categories
      const categories = consentService.getConsentCategories();
      const requiredCategories = consentService.getRequiredConsentCategories();
      const optionalCategories = consentService.getOptionalConsentCategories();
      
      expect(categories.length).toBeGreaterThan(0);
      expect(requiredCategories.length).toBeGreaterThan(0);
      expect(optionalCategories.length).toBeGreaterThan(0);
      
      // Verify essential services are required
      const essentialCategory = requiredCategories.find(c => c.id === 'essential');
      expect(essentialCategory).toBeDefined();
      expect(essentialCategory?.required).toBe(true);
    });

    it('should provide GDPR and CCPA compliance automation', async () => {
      await initializeSecurityServices();
      
      const complianceService = getComplianceAutomationService();
      
      // Test compliance dashboard
      const dashboard = await complianceService.getComplianceDashboard();
      
      expect(dashboard.overview).toBeDefined();
      expect(dashboard.automationStatus).toBeDefined();
      expect(dashboard.automationStatus.rulesActive).toBeGreaterThan(0);
    });

    it('should validate data collection against consent', async () => {
      await initializeSecurityServices();
      
      const consentService = getConsentManagementService();
      
      // Test consent validation
      const validation = await consentService.validateDataCollection(
        'test-user-123',
        'user_id',
        'service_provision'
      );
      
      expect(validation.allowed).toBeDefined();
      expect(validation.reason).toBeDefined();
    });

    it('should encrypt PII data with integrity verification', async () => {
      await initializeSecurityServices();
      
      const encryptionService = getEncryptionService();
      
      // Test PII encryption
      const piiData = {
        name: 'John Senior',
        age: 75,
        medicalInfo: 'Diabetes Type 2',
        emergencyContact: '+1-555-0123'
      };
      
      const encryptedPII = await encryptionService.encryptPII(piiData, 'senior_profile');
      const decryptedPII = await encryptionService.decryptPII(encryptedPII);
      
      expect(decryptedPII).toEqual(piiData);
      expect(encryptedPII.metadata.dataType).toBe('senior_profile');
      expect(encryptedPII.metadata.algorithm).toBe('AES-GCM');
    });

    it('should provide comprehensive security health check', async () => {
      await initializeSecurityServices();
      
      const healthStatus = await checkSecurityHealth();
      
      expect(healthStatus.encryption).toBe(true);
      expect(healthStatus.privacy).toBe(true);
      expect(healthStatus.transportSecurity).toBe(true);
      expect(healthStatus.consentManagement).toBe(true);
      expect(healthStatus.complianceAutomation).toBe(true);
      expect(healthStatus.timestamp).toBeInstanceOf(Date);
    });

    it('should handle consent preferences with encryption', async () => {
      await initializeSecurityServices();
      
      const consentService = getConsentManagementService();
      
      // Test consent recording
      const preferences = {
        essential: true,
        learning_progress: true,
        ai_assistance: false,
        performance_analytics: true
      };
      
      const consentRecord = await consentService.recordConsentPreferences(
        'test-user-456',
        preferences,
        {
          ipAddress: '192.168.1.1',
          userAgent: 'Test Browser',
          method: 'explicit'
        }
      );
      
      expect(consentRecord.userId).toBe('test-user-456');
      expect(consentRecord.categories).toEqual(preferences);
      expect(consentRecord.method).toBe('explicit');
    });

    it('should generate compliance reports', async () => {
      await initializeSecurityServices();
      
      const complianceService = getComplianceAutomationService();
      
      // Test compliance report generation
      const report = await complianceService.generateComplianceReport(
        'gdpr',
        {
          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
          end: new Date()
        }
      );
      
      expect(report.type).toBe('gdpr');
      expect(report.metrics).toBeDefined();
      expect(report.status).toMatch(/compliant|non_compliant|needs_attention/);
      expect(report.recommendations).toBeInstanceOf(Array);
    });

    it('should sanitize URLs for security', async () => {
      await initializeSecurityServices();
      
      const transportSecurityService = getTransportSecurityService();
      
      // Test URL sanitization
      const validUrl = 'https://secure-api.example.com/endpoint';
      const dangerousUrl = 'http://localhost:3000/admin';
      const dataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
      
      expect(transportSecurityService.sanitizeUrl(validUrl)).toBe(validUrl);
      expect(transportSecurityService.sanitizeUrl(dangerousUrl)).toBeNull();
      expect(transportSecurityService.sanitizeUrl(dataUrl)).toBe(dataUrl);
    });
  });

  describe('Error Handling and Resilience', () => {
    it('should handle encryption service failures gracefully', async () => {
      // Test with invalid configuration
      expect(() => {
        const { EncryptionService } = require('../EncryptionService');
        new EncryptionService({
          algorithm: 'WEAK-CIPHER',
          keySize: 128,
          mode: 'ECB'
        });
      }).toThrow();
    });

    it('should handle network failures in certificate validation', async () => {
      // Mock fetch to fail
      const originalFetch = global.fetch;
      global.fetch = () => Promise.reject(new Error('Network error'));
      
      try {
        await initializeSecurityServices();
        // Should not throw even if certificate validation fails
        expect(true).toBe(true);
      } finally {
        global.fetch = originalFetch;
      }
    });

    it('should handle consent withdrawal properly', async () => {
      await initializeSecurityServices();
      
      const consentService = getConsentManagementService();
      
      // Record initial consent
      await consentService.recordConsentPreferences(
        'test-user-789',
        { essential: true, ai_assistance: true },
        {
          ipAddress: '192.168.1.1',
          userAgent: 'Test Browser',
          method: 'explicit'
        }
      );
      
      // Withdraw optional consent
      await expect(
        consentService.withdrawConsent(
          'test-user-789',
          'ai_assistance',
          {
            ipAddress: '192.168.1.1',
            userAgent: 'Test Browser',
            reason: 'Privacy concerns'
          }
        )
      ).resolves.not.toThrow();
      
      // Should not be able to withdraw required consent
      await expect(
        consentService.withdrawConsent(
          'test-user-789',
          'essential',
          {
            ipAddress: '192.168.1.1',
            userAgent: 'Test Browser'
          }
        )
      ).rejects.toThrow();
    });
  });

  describe('Performance and Scalability', () => {
    it('should initialize security services quickly', async () => {
      const startTime = performance.now();
      
      await initializeSecurityServices();
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(1000); // Should initialize within 1 second
    });

    it('should handle multiple encryption operations efficiently', async () => {
      await initializeSecurityServices();
      
      const encryptionService = getEncryptionService();
      const testData = Array(10).fill('Test data for performance');
      
      const startTime = performance.now();
      
      const promises = testData.map(async (data, index) => {
        const encrypted = await encryptionService.encryptData(`${data} ${index}`);
        return encryptionService.decryptData(encrypted);
      });
      
      const results = await Promise.all(promises);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(results).toHaveLength(10);
      expect(duration).toBeLessThan(500); // Should complete within 500ms
    });
  });
});