// Tests for Data Portability Service
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DataPortabilityService, getDataPortabilityService } from '../DataPortabilityService';

// Mock the encryption service
vi.mock('../EncryptionService', () => ({
  getEncryptionService: () => ({
    initialize: vi.fn().mockResolvedValue(undefined),
    generateHash: vi.fn().mockResolvedValue('mock-hash-123'),
    encryptObject: vi.fn().mockResolvedValue('encrypted-data')
  })
}));

// Mock the privacy compliance service
vi.mock('../PrivacyComplianceService', () => ({
  getPrivacyComplianceService: () => ({
    recordConsent: vi.fn().mockResolvedValue(undefined),
    checkConsent: vi.fn().mockResolvedValue(true),
    getUserConsents: vi.fn().mockResolvedValue([])
  })
}));

describe('DataPortabilityService', () => {
  let service: DataPortabilityService;

  beforeEach(() => {
    service = getDataPortabilityService();
  });

  describe('Data Export', () => {
    it('creates export request with 30-day expiration', async () => {
      const userId = 'test-user-123';
      const format = 'json';

      const request = await service.createExportRequest(userId, format);

      expect(request).toMatchObject({
        userId,
        format,
        status: 'pending',
        dataTypes: ['all']
      });

      expect(request.id).toBeDefined();
      expect(request.requestDate).toBeInstanceOf(Date);
      expect(request.expiresAt).toBeInstanceOf(Date);

      // Check 30-day expiration
      const daysDiff = Math.ceil(
        (request.expiresAt!.getTime() - request.requestDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      expect(daysDiff).toBe(30);
    });

    it('supports different export formats', async () => {
      const userId = 'test-user-123';
      const formats = ['json', 'csv', 'xml', 'pdf'] as const;

      for (const format of formats) {
        const request = await service.createExportRequest(userId, format);
        expect(request.format).toBe(format);
      }
    });

    it('allows specifying data types and date range', async () => {
      const userId = 'test-user-123';
      const format = 'json';
      const dataTypes = ['profile', 'learning_progress'];
      const dateRange = {
        start: new Date('2024-01-01'),
        end: new Date('2024-12-31')
      };

      const request = await service.createExportRequest(userId, format, dataTypes, dateRange);

      expect(request.dataTypes).toEqual(dataTypes);
      expect(request.dateRange).toEqual(dateRange);
    });

    it('processes export request asynchronously', async () => {
      const userId = 'test-user-123';
      const format = 'json';

      const request = await service.createExportRequest(userId, format);
      
      // Initially pending
      expect(request.status).toBe('pending');

      // Allow async processing to complete
      await new Promise(resolve => setTimeout(resolve, 10));

      const updatedRequest = await service.getExportStatus(request.id);
      expect(updatedRequest?.status).toBe('completed');
    });

    it('generates download result with files and metadata', async () => {
      const userId = 'test-user-123';
      const format = 'json';

      const request = await service.createExportRequest(userId, format);
      
      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 10));

      const result = await service.downloadExport(request.id);

      expect(result).toMatchObject({
        requestId: request.id,
        files: expect.arrayContaining([
          expect.objectContaining({
            name: expect.stringContaining('.json'),
            type: 'application/json',
            url: expect.any(String),
            encrypted: false
          })
        ]),
        metadata: expect.objectContaining({
          exportDate: expect.any(Date),
          format: 'json',
          version: '1.0'
        }),
        checksum: expect.any(String)
      });
    });
  });

  describe('Data Deletion', () => {
    it('creates deletion request with 30-day completion timeframe', async () => {
      const userId = 'test-user-123';
      const type = 'complete';
      const reason = 'User requested deletion';

      const request = await service.createDeletionRequest(userId, type, undefined, reason);

      expect(request).toMatchObject({
        userId,
        type,
        reason,
        status: 'pending'
      });

      expect(request.id).toBeDefined();
      expect(request.requestDate).toBeInstanceOf(Date);
      expect(request.scheduledDate).toBeInstanceOf(Date);

      // Check 30-day completion timeframe
      const daysDiff = Math.ceil(
        (request.scheduledDate!.getTime() - request.requestDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      expect(daysDiff).toBe(30);
    });

    it('requires verification before processing', async () => {
      const userId = 'test-user-123';
      const type = 'complete';

      const request = await service.createDeletionRequest(userId, type);

      expect(request.verification).toMatchObject({
        method: 'email',
        code: expect.any(String),
        verified: false,
        attempts: 0
      });
    });

    it('verifies deletion request with correct code', async () => {
      const userId = 'test-user-123';
      const type = 'complete';

      const request = await service.createDeletionRequest(userId, type);
      const verificationCode = request.verification.code;

      const verified = await service.verifyDeletionRequest(request.id, verificationCode);

      expect(verified).toBe(true);

      const updatedRequest = await service.getDeletionStatus(request.id);
      expect(updatedRequest?.verification.verified).toBe(true);
      expect(updatedRequest?.status).toBe('processing');
    });

    it('rejects incorrect verification codes', async () => {
      const userId = 'test-user-123';
      const type = 'complete';

      const request = await service.createDeletionRequest(userId, type);

      const verified = await service.verifyDeletionRequest(request.id, 'wrong-code');

      expect(verified).toBe(false);

      const updatedRequest = await service.getDeletionStatus(request.id);
      expect(updatedRequest?.verification.verified).toBe(false);
      expect(updatedRequest?.verification.attempts).toBe(1);
    });

    it('fails after 3 incorrect verification attempts', async () => {
      const userId = 'test-user-123';
      const type = 'complete';

      const request = await service.createDeletionRequest(userId, type);

      // Make 3 incorrect attempts
      for (let i = 0; i < 3; i++) {
        await service.verifyDeletionRequest(request.id, 'wrong-code');
      }

      const verified = await service.verifyDeletionRequest(request.id, 'wrong-code');
      expect(verified).toBe(false);

      const updatedRequest = await service.getDeletionStatus(request.id);
      expect(updatedRequest?.status).toBe('failed');
    });
  });

  describe('AI Data Usage Dashboard', () => {
    it('provides AI data usage transparency', async () => {
      const userId = 'test-user-123';

      const dashboard = await service.getAIDataUsageDashboard(userId);

      expect(dashboard).toMatchObject({
        userId,
        dataUsage: expect.objectContaining({
          conversationsAnalyzed: expect.any(Number),
          dataPointsUsed: expect.any(Number),
          modelTrainingContribution: expect.any(String),
          lastProcessed: expect.any(Date)
        }),
        consentStatus: expect.any(Object),
        dataRetention: expect.any(Object),
        optOutOptions: expect.any(Array),
        lastUpdated: expect.any(Date)
      });
    });

    it('includes opt-out options for AI data usage', async () => {
      const userId = 'test-user-123';

      const dashboard = await service.getAIDataUsageDashboard(userId);

      expect(dashboard.optOutOptions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            option: 'stop_ai_training',
            description: expect.any(String),
            impact: expect.any(String)
          }),
          expect.objectContaining({
            option: 'delete_conversation_history',
            description: expect.any(String),
            impact: expect.any(String)
          }),
          expect.objectContaining({
            option: 'anonymize_data',
            description: expect.any(String),
            impact: expect.any(String)
          })
        ])
      );
    });
  });

  describe('Data Sharing Preferences', () => {
    it('updates data sharing preferences', async () => {
      const userId = 'test-user-123';
      const preferences = {
        userId,
        dataTypes: {
          profile: true,
          learning_progress: false,
          ai_conversations: true,
          usage_analytics: false
        },
        thirdPartySharing: {
          gemini: false,
          analytics_provider: true,
          support_system: true
        },
        analyticsSharing: true,
        marketingSharing: false,
        researchSharing: true,
        lastUpdated: new Date()
      };

      await expect(service.updateDataSharingPreferences(userId, preferences))
        .resolves.not.toThrow();
    });

    it('validates sharing preferences', async () => {
      const userId = 'test-user-123';
      const invalidPreferences = {
        userId,
        dataTypes: {
          invalid_type: true // Invalid data type
        },
        thirdPartySharing: {},
        analyticsSharing: false,
        marketingSharing: false,
        researchSharing: false,
        lastUpdated: new Date()
      };

      await expect(service.updateDataSharingPreferences(userId, invalidPreferences))
        .rejects.toThrow('Invalid preferences');
    });

    it('retrieves current data sharing preferences', async () => {
      const userId = 'test-user-123';

      const preferences = await service.getDataSharingPreferences(userId);

      expect(preferences).toMatchObject({
        userId,
        dataTypes: expect.any(Object),
        thirdPartySharing: expect.any(Object),
        analyticsSharing: expect.any(Boolean),
        marketingSharing: expect.any(Boolean),
        researchSharing: expect.any(Boolean),
        lastUpdated: expect.any(Date)
      });
    });
  });

  describe('User Data Report', () => {
    it('generates comprehensive user data report', async () => {
      const userId = 'test-user-123';

      const report = await service.generateUserDataReport(userId);

      expect(report).toMatchObject({
        userId,
        generatedAt: expect.any(Date),
        dataCategories: expect.any(Object),
        consentHistory: expect.any(Array),
        dataSharing: expect.any(Object),
        retentionSchedule: expect.any(Object),
        accessLog: expect.any(Array),
        exportOptions: expect.any(Object)
      });
    });
  });

  describe('Service Singleton', () => {
    it('returns same instance on multiple calls', () => {
      const service1 = getDataPortabilityService();
      const service2 = getDataPortabilityService();

      expect(service1).toBe(service2);
    });
  });
});