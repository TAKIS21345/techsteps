// Tests for PrivacyComplianceService
import { describe, it, expect, beforeEach } from 'vitest';
import { PrivacyComplianceService } from '../PrivacyComplianceService';

describe('PrivacyComplianceService', () => {
  let privacyService: PrivacyComplianceService;
  const testUserId = 'test-user-123';

  beforeEach(async () => {
    privacyService = new PrivacyComplianceService();
    // Give the service time to initialize
    await new Promise(resolve => setTimeout(resolve, 10));
  });

  describe('Consent Management', () => {
    it('should record user consent correctly', async () => {
      const evidence = {
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0 Test Browser',
        formData: { newsletter: true },
        checkboxes: ['analytics', 'marketing']
      };

      const consentRecord = await privacyService.recordConsent(
        testUserId,
        'analytics_performance',
        true,
        evidence
      );

      expect(consentRecord.userId).toBe(testUserId);
      expect(consentRecord.consentType).toBe('analytics_performance');
      expect(consentRecord.granted).toBe(true);
      expect(consentRecord.evidence.ipAddress).toBe('192.168.1.1');
      expect(consentRecord.timestamp).toBeInstanceOf(Date);
    });

    it('should check consent status correctly', async () => {
      // Record consent first
      await privacyService.recordConsent(testUserId, 'marketing_communications', true, {
        ipAddress: '192.168.1.1',
        userAgent: 'Test Browser'
      });

      const hasConsent = await privacyService.checkConsent(testUserId, 'marketing_communications');
      expect(hasConsent).toBe(true);

      const noConsent = await privacyService.checkConsent(testUserId, 'unknown_consent_type');
      expect(noConsent).toBe(false);
    });

    it('should handle consent withdrawal', async () => {
      // Grant consent first
      await privacyService.recordConsent(testUserId, 'ai_training_improvement', true, {
        ipAddress: '192.168.1.1',
        userAgent: 'Test Browser'
      });

      let hasConsent = await privacyService.checkConsent(testUserId, 'ai_training_improvement');
      expect(hasConsent).toBe(true);

      // Withdraw consent
      await privacyService.withdrawConsent(testUserId, 'ai_training_improvement');

      hasConsent = await privacyService.checkConsent(testUserId, 'ai_training_improvement');
      expect(hasConsent).toBe(false);
    });

    it('should return most recent consent for type', async () => {
      // Grant consent
      await privacyService.recordConsent(testUserId, 'caregiver_sharing', true, {
        ipAddress: '192.168.1.1',
        userAgent: 'Test Browser'
      });

      // Wait a bit to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));

      // Withdraw consent
      await privacyService.recordConsent(testUserId, 'caregiver_sharing', false, {
        ipAddress: '192.168.1.1',
        userAgent: 'Test Browser'
      });

      const hasConsent = await privacyService.checkConsent(testUserId, 'caregiver_sharing');
      expect(hasConsent).toBe(false);
    });

    it('should retrieve all user consents', async () => {
      await privacyService.recordConsent(testUserId, 'analytics', true, {
        ipAddress: '192.168.1.1',
        userAgent: 'Test Browser'
      });

      await privacyService.recordConsent(testUserId, 'marketing', false, {
        ipAddress: '192.168.1.1',
        userAgent: 'Test Browser'
      });

      const consents = await privacyService.getUserConsents(testUserId);
      expect(consents).toHaveLength(2);
      expect(consents.some(c => c.consentType === 'analytics')).toBe(true);
      expect(consents.some(c => c.consentType === 'marketing')).toBe(true);
    });
  });

  describe('Data Subject Rights', () => {
    it('should handle access request', async () => {
      const request = await privacyService.handleAccessRequest(
        testUserId,
        'I want to see all my personal data'
      );

      expect(request.userId).toBe(testUserId);
      expect(request.type).toBe('access');
      expect(request.status).toBe('pending');
      expect(request.description).toBe('I want to see all my personal data');
      expect(request.requestDate).toBeInstanceOf(Date);
    });

    it('should handle erasure request', async () => {
      const request = await privacyService.handleErasureRequest(
        testUserId,
        'Please delete all my data'
      );

      expect(request.userId).toBe(testUserId);
      expect(request.type).toBe('erasure');
      expect(request.status).toBe('pending');
      expect(request.description).toBe('Please delete all my data');
    });

    it('should handle portability request', async () => {
      const request = await privacyService.handlePortabilityRequest(testUserId, 'json');

      expect(request.userId).toBe(testUserId);
      expect(request.type).toBe('portability');
      expect(request.status).toBe('pending');
      expect(request.description).toBe('Data export in json format');
    });

    it('should retrieve request status', async () => {
      const request = await privacyService.handleAccessRequest(testUserId, 'Test request');
      
      const retrievedRequest = await privacyService.getRequestStatus(request.id);
      expect(retrievedRequest).toEqual(request);

      const nonExistentRequest = await privacyService.getRequestStatus('non-existent-id');
      expect(nonExistentRequest).toBeNull();
    });
  });

  describe('Privacy Policy', () => {
    it('should return comprehensive privacy policy', () => {
      const policy = privacyService.getPrivacyPolicy();

      expect(policy.version).toBeDefined();
      expect(policy.effectiveDate).toBeInstanceOf(Date);
      expect(policy.dataTypes).toBeInstanceOf(Array);
      expect(policy.userRights).toBeInstanceOf(Array);
      expect(policy.retentionPolicies).toBeInstanceOf(Array);
      expect(policy.thirdPartySharing).toBeInstanceOf(Array);
    });

    it('should include all required user rights', () => {
      const policy = privacyService.getPrivacyPolicy();
      const rightTypes = policy.userRights.map(r => r.right);

      expect(rightTypes).toContain('access');
      expect(rightTypes).toContain('rectification');
      expect(rightTypes).toContain('erasure');
      expect(rightTypes).toContain('portability');
      expect(rightTypes).toContain('restriction');
      expect(rightTypes).toContain('objection');
    });

    it('should include data type policies with legal basis', () => {
      const policy = privacyService.getPrivacyPolicy();
      
      policy.dataTypes.forEach(dataType => {
        expect(dataType.type).toBeDefined();
        expect(dataType.purpose).toBeDefined();
        expect(dataType.legalBasis).toBeDefined();
        expect(dataType.retention).toBeGreaterThan(0);
        expect(typeof dataType.sharing).toBe('boolean');
        expect(typeof dataType.userControl).toBe('boolean');
      });
    });
  });

  describe('Data Processing Validation', () => {
    it('should allow processing with valid consent', async () => {
      await privacyService.recordConsent(testUserId, 'user_profile_personalization', true, {
        ipAddress: '192.168.1.1',
        userAgent: 'Test Browser'
      });

      const validation = await privacyService.validateDataProcessing(
        testUserId,
        'user_profile',
        'personalization'
      );

      expect(validation.allowed).toBe(true);
      expect(validation.reason).toBe('user_consent');
    });

    it('should allow processing based on legitimate interest', async () => {
      const validation = await privacyService.validateDataProcessing(
        testUserId,
        'usage_analytics',
        'service_improvement'
      );

      expect(validation.allowed).toBe(true);
      expect(validation.reason).toBe('legitimate_interest');
    });

    it('should allow processing based on contract', async () => {
      const validation = await privacyService.validateDataProcessing(
        testUserId,
        'user_profile',
        'service_provision'
      );

      expect(validation.allowed).toBe(true);
      expect(validation.reason).toBe('contractual_necessity');
    });

    it('should deny processing without legal basis', async () => {
      const validation = await privacyService.validateDataProcessing(
        testUserId,
        'unknown_data_type',
        'unknown_purpose'
      );

      expect(validation.allowed).toBe(false);
      expect(validation.reason).toBe('no_legal_basis');
    });
  });

  describe('Consent Requests Generation', () => {
    it('should generate appropriate consent requests', () => {
      const consentRequests = privacyService.generateConsentRequests();

      expect(consentRequests).toBeInstanceOf(Array);
      expect(consentRequests.length).toBeGreaterThan(0);

      consentRequests.forEach(request => {
        expect(request.type).toBeDefined();
        expect(request.purpose).toBeDefined();
        expect(request.dataTypes).toBeInstanceOf(Array);
        expect(typeof request.required).toBe('boolean');
        expect(request.description).toBeDefined();
        expect(request.consequences).toBeDefined();
      });
    });

    it('should include senior-specific consent requests', () => {
      const consentRequests = privacyService.generateConsentRequests();
      const requestTypes = consentRequests.map(r => r.type);

      expect(requestTypes).toContain('caregiver_sharing');
      expect(requestTypes).toContain('ai_training_improvement');
      expect(requestTypes).toContain('analytics_performance');
    });

    it('should mark appropriate consents as optional', () => {
      const consentRequests = privacyService.generateConsentRequests();
      
      // All consent requests should be optional (not required)
      // as per GDPR principles
      consentRequests.forEach(request => {
        expect(request.required).toBe(false);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid consent types gracefully', async () => {
      const hasConsent = await privacyService.checkConsent(testUserId, '');
      expect(hasConsent).toBe(false);
    });

    it('should handle non-existent users gracefully', async () => {
      const consents = await privacyService.getUserConsents('non-existent-user');
      expect(consents).toEqual([]);
    });
  });
});