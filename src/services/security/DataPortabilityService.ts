// Data Portability Service - Export user data in readable formats
import { 
  DataExportRequest, 
  DataExportResult, 
  DataDeletionRequest, 
  DeletionResult,
  ExportFile,
  ExportMetadata
} from '../../types/security';
// Data portability service for GDPR compliance
import { getEncryptionService } from './EncryptionService';
import { getPrivacyComplianceService } from './PrivacyComplianceService';

export class DataPortabilityService {
  private encryptionService = getEncryptionService();
  private privacyService = getPrivacyComplianceService();
  private exportRequests: Map<string, DataExportRequest> = new Map();
  private deletionRequests: Map<string, DataDeletionRequest> = new Map();

  constructor() {
    this.initializeService();
  }

  private async initializeService(): Promise<void> {
    try {
      await this.encryptionService.initialize();
    } catch (error) {
      console.error('Failed to initialize data portability service:', error);
    }
  }

  /**
   * Create data export request with 30-day response timeframe
   */
  async createExportRequest(
    userId: string,
    format: 'json' | 'csv' | 'xml' | 'pdf',
    dataTypes?: string[],
    dateRange?: { start: Date; end: Date }
  ): Promise<DataExportRequest> {
    const request: DataExportRequest = {
      id: this.generateRequestId(),
      userId,
      format,
      dataTypes: dataTypes || ['all'],
      dateRange,
      status: 'pending',
      requestDate: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    };

    this.exportRequests.set(request.id, request);

    // Process export asynchronously
    setTimeout(() => this.processExportRequest(request.id), 0);

    return request;
  }

  /**
   * Get export request status
   */
  async getExportStatus(requestId: string): Promise<DataExportRequest | null> {
    return this.exportRequests.get(requestId) || null;
  }

  /**
   * Download exported data
   */
  async downloadExport(requestId: string): Promise<DataExportResult | null> {
    const request = this.exportRequests.get(requestId);
    
    if (!request || request.status !== 'completed' || !request.downloadUrl) {
      return null;
    }

    // Check if download link has expired
    if (request.expiresAt && new Date() > request.expiresAt) {
      request.status = 'failed';
      this.exportRequests.set(requestId, request);
      return null;
    }

    // Generate export result with files and metadata
    const result: DataExportResult = {
      requestId,
      files: await this.generateExportFiles(request),
      metadata: await this.generateExportMetadata(request),
      checksum: await this.generateChecksum(request)
    };

    return result;
  }

  /**
   * Create complete data deletion request with 30-day completion timeframe
   */
  async createDeletionRequest(
    userId: string,
    type: 'partial' | 'complete',
    dataTypes?: string[],
    reason?: string
  ): Promise<DataDeletionRequest> {
    const request: DataDeletionRequest = {
      id: this.generateRequestId(),
      userId,
      type,
      dataTypes: dataTypes || ['all'],
      reason: reason || 'User requested deletion',
      status: 'pending',
      requestDate: new Date(),
      scheduledDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      verification: {
        method: 'email',
        code: this.generateVerificationCode(),
        verified: false,
        attempts: 0
      }
    };

    this.deletionRequests.set(request.id, request);

    // Send verification email/SMS
    await this.sendDeletionVerification(request);

    return request;
  }

  /**
   * Verify deletion request with code
   */
  async verifyDeletionRequest(requestId: string, verificationCode: string): Promise<boolean> {
    const request = this.deletionRequests.get(requestId);
    
    if (!request) {
      return false;
    }

    request.verification.attempts++;

    if (request.verification.attempts > 3) {
      request.status = 'failed';
      this.deletionRequests.set(requestId, request);
      return false;
    }

    if (request.verification.code === verificationCode) {
      request.verification.verified = true;
      request.verification.verifiedAt = new Date();
      request.status = 'processing';
      
      this.deletionRequests.set(requestId, request);

      // Process deletion
      setTimeout(() => this.processDeletionRequest(requestId), 0);
      
      return true;
    }

    this.deletionRequests.set(requestId, request);
    return false;
  }

  /**
   * Get deletion request status
   */
  async getDeletionStatus(requestId: string): Promise<DataDeletionRequest | null> {
    return this.deletionRequests.get(requestId) || null;
  }

  /**
   * Create AI data usage transparency dashboard
   */
  async getAIDataUsageDashboard(userId: string): Promise<AIDataUsageDashboard> {
    const dashboard: AIDataUsageDashboard = {
      userId,
      dataUsage: await this.getAIDataUsage(userId),
      consentStatus: await this.getAIConsentStatus(userId),
      dataRetention: await this.getAIDataRetention(userId),
      optOutOptions: this.getAIOptOutOptions(),
      lastUpdated: new Date()
    };

    return dashboard;
  }

  /**
   * Update user data sharing preferences
   */
  async updateDataSharingPreferences(
    userId: string,
    preferences: DataSharingPreferences
  ): Promise<void> {
    // Validate preferences
    const validation = await this.validateSharingPreferences(preferences);
    
    if (!validation.valid) {
      throw new Error(`Invalid preferences: ${validation.errors.join(', ')}`);
    }

    // Update consent records based on preferences
    for (const [dataType, allowed] of Object.entries(preferences.dataTypes)) {
      await this.privacyService.recordConsent(
        userId,
        `sharing_${dataType}`,
        allowed,
        {
          ipAddress: 'user_preferences',
          userAgent: 'preferences_update'
        }
      );
    }

    // Update third-party sharing preferences
    for (const [provider, allowed] of Object.entries(preferences.thirdPartySharing)) {
      await this.privacyService.recordConsent(
        userId,
        `third_party_${provider}`,
        allowed,
        {
          ipAddress: 'user_preferences',
          userAgent: 'preferences_update'
        }
      );
    }

    // Log preference update
    await this.logPreferenceUpdate(userId, preferences);
  }

  /**
   * Get current data sharing preferences
   */
  async getDataSharingPreferences(userId: string): Promise<DataSharingPreferences> {
    const preferences: DataSharingPreferences = {
      userId,
      dataTypes: {},
      thirdPartySharing: {},
      analyticsSharing: false,
      marketingSharing: false,
      researchSharing: false,
      lastUpdated: new Date()
    };

    // Check consent for each data type
    const dataTypes = ['profile', 'learning_progress', 'ai_conversations', 'usage_analytics'];
    
    for (const dataType of dataTypes) {
      preferences.dataTypes[dataType] = await this.privacyService.checkConsent(
        userId,
        `sharing_${dataType}`
      );
    }

    // Check third-party sharing consent
    const thirdParties = ['gemini', 'analytics_provider', 'support_system'];
    
    for (const provider of thirdParties) {
      preferences.thirdPartySharing[provider] = await this.privacyService.checkConsent(
        userId,
        `third_party_${provider}`
      );
    }

    // Check specific sharing types
    preferences.analyticsSharing = await this.privacyService.checkConsent(userId, 'analytics_sharing');
    preferences.marketingSharing = await this.privacyService.checkConsent(userId, 'marketing_sharing');
    preferences.researchSharing = await this.privacyService.checkConsent(userId, 'research_sharing');

    return preferences;
  }

  /**
   * Generate comprehensive user data report
   */
  async generateUserDataReport(userId: string): Promise<UserDataReport> {
    const report: UserDataReport = {
      userId,
      generatedAt: new Date(),
      dataCategories: await this.compileDataCategories(userId),
      consentHistory: await this.privacyService.getUserConsents(userId),
      dataSharing: await this.getDataSharingPreferences(userId),
      retentionSchedule: await this.getDataRetentionSchedule(userId),
      accessLog: await this.getDataAccessLog(userId),
      exportOptions: this.getExportOptions()
    };

    return report;
  }

  /**
   * Process export request
   */
  private async processExportRequest(requestId: string): Promise<void> {
    const request = this.exportRequests.get(requestId);
    if (!request) return;

    try {
      request.status = 'processing';
      this.exportRequests.set(requestId, request);

      // Compile user data based on request
      const userData = await this.compileUserDataForExport(request);

      // Generate export files
      const exportFiles = await this.generateExportFiles(request, userData);

      // Complete request
      request.status = 'completed';
      request.completionDate = new Date();
      request.downloadUrl = exportFiles[0]?.url;
      
      this.exportRequests.set(requestId, request);

      // Send notification to user
      await this.notifyExportComplete(request);

    } catch (error) {
      request.status = 'failed';
      this.exportRequests.set(requestId, request);
      console.error(`Export request ${requestId} failed:`, error);
    }
  }

  /**
   * Process deletion request
   */
  private async processDeletionRequest(requestId: string): Promise<void> {
    const request = this.deletionRequests.get(requestId);
    if (!request) return;

    try {
      // Perform data deletion
      const deletionResult = await this.performDataDeletion(request);

      // Complete request
      request.status = 'completed';
      request.completionDate = new Date();
      
      this.deletionRequests.set(requestId, request);

      // Generate deletion certificate
      await this.generateDeletionCertificate(request, deletionResult);

      // Notify user of completion
      await this.notifyDeletionComplete(request);

    } catch (error) {
      request.status = 'failed';
      this.deletionRequests.set(requestId, request);
      console.error(`Deletion request ${requestId} failed:`, error);
    }
  }

  /**
   * Compile user data for export
   */
  private async compileUserDataForExport(request: DataExportRequest): Promise<any> {
    const userData: any = {};

    if (request.dataTypes.includes('all') || request.dataTypes.includes('profile')) {
      userData.profile = await this.getUserProfile(request.userId);
    }

    if (request.dataTypes.includes('all') || request.dataTypes.includes('learning_progress')) {
      userData.learningProgress = await this.getLearningProgress(request.userId);
    }

    if (request.dataTypes.includes('all') || request.dataTypes.includes('ai_conversations')) {
      userData.aiConversations = await this.getAIConversations(request.userId, request.dateRange);
    }

    if (request.dataTypes.includes('all') || request.dataTypes.includes('support_tickets')) {
      userData.supportTickets = await this.getSupportTickets(request.userId);
    }

    if (request.dataTypes.includes('all') || request.dataTypes.includes('consent_records')) {
      userData.consentRecords = await this.privacyService.getUserConsents(request.userId);
    }

    return userData;
  }

  /**
   * Generate export files in requested format
   */
  private async generateExportFiles(request: DataExportRequest, userData?: any): Promise<ExportFile[]> {
    const data = userData || await this.compileUserDataForExport(request);
    const files: ExportFile[] = [];

    switch (request.format) {
      case 'json':
        files.push({
          name: `user_data_${request.userId}.json`,
          type: 'application/json',
          size: JSON.stringify(data).length,
          url: await this.generateDownloadUrl('json'),
          encrypted: false
        });
        break;

      case 'csv': {
        const csvData = await this.convertToCSV();
        files.push({
          name: `user_data_${request.userId}.csv`,
          type: 'text/csv',
          size: csvData.length,
          url: await this.generateDownloadUrl('csv'),
          encrypted: false
        });
        break;
      }

      case 'xml': {
        const xmlData = await this.convertToXML();
        files.push({
          name: `user_data_${request.userId}.xml`,
          type: 'application/xml',
          size: xmlData.length,
          url: await this.generateDownloadUrl('xml'),
          encrypted: false
        });
        break;
      }

      case 'pdf': {
        const pdfData = await this.convertToPDF();
        files.push({
          name: `user_data_${request.userId}.pdf`,
          type: 'application/pdf',
          size: pdfData.length,
          url: await this.generateDownloadUrl('pdf'),
          encrypted: false
        });
        break;
      }
    }

    return files;
  }

  // Helper methods (mock implementations)
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateVerificationCode(): string {
    return Math.random().toString(36).substr(2, 8).toUpperCase();
  }

  private async sendDeletionVerification(request: DataDeletionRequest): Promise<void> {
    console.log(`Sending deletion verification to user ${request.userId}: ${request.verification.code}`);
  }

  private async generateExportMetadata(request: DataExportRequest): Promise<ExportMetadata> {
    return {
      exportDate: new Date(),
      dataTypes: request.dataTypes,
      recordCount: 100, // Mock count
      format: request.format,
      version: '1.0'
    };
  }

  private async generateChecksum(request: DataExportRequest): Promise<string> {
    return await this.encryptionService.generateHash(`export_${request.id}_${request.userId}`);
  }

  private async getAIDataUsage(): Promise<any> {
    return {
      conversationsAnalyzed: 50,
      dataPointsUsed: 1000,
      modelTrainingContribution: 'anonymized',
      lastProcessed: new Date()
    };
  }

  private async getAIConsentStatus(userId: string): Promise<any> {
    return {
      aiTrainingConsent: await this.privacyService.checkConsent(userId, 'ai_training_improvement'),
      conversationAnalysis: await this.privacyService.checkConsent(userId, 'conversation_analysis'),
      responseImprovement: await this.privacyService.checkConsent(userId, 'response_improvement')
    };
  }

  private async getAIDataRetention(): Promise<any> {
    return {
      conversationRetention: '1 year',
      anonymizedDataRetention: '3 years',
      modelDataRetention: 'indefinite (anonymized)',
      nextReview: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    };
  }

  private getAIOptOutOptions(): any {
    return [
      {
        option: 'stop_ai_training',
        description: 'Stop using your data to improve AI responses',
        impact: 'AI responses may be less personalized'
      },
      {
        option: 'delete_conversation_history',
        description: 'Delete all stored conversation history',
        impact: 'AI will not remember previous conversations'
      },
      {
        option: 'anonymize_data',
        description: 'Convert your data to anonymous form',
        impact: 'Data cannot be linked back to you'
      }
    ];
  }

  private async validateSharingPreferences(preferences: DataSharingPreferences): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Validate data types
    const validDataTypes = ['profile', 'learning_progress', 'ai_conversations', 'usage_analytics'];
    for (const dataType of Object.keys(preferences.dataTypes)) {
      if (!validDataTypes.includes(dataType)) {
        errors.push(`Invalid data type: ${dataType}`);
      }
    }

    return { valid: errors.length === 0, errors };
  }

  private async logPreferenceUpdate(userId: string, preferences: DataSharingPreferences): Promise<void> {
    console.log(`Data sharing preferences updated for user ${userId}:`, preferences);
  }

  private async compileDataCategories(): Promise<any> {
    return {
      personalData: { records: 1, lastUpdated: new Date() },
      learningData: { records: 50, lastUpdated: new Date() },
      conversationData: { records: 25, lastUpdated: new Date() },
      analyticsData: { records: 1000, lastUpdated: new Date() }
    };
  }

  private async getDataRetentionSchedule(): Promise<any> {
    return {
      personalData: { retentionPeriod: '7 years', nextReview: new Date() },
      learningData: { retentionPeriod: '3 years', nextReview: new Date() },
      conversationData: { retentionPeriod: '1 year', nextReview: new Date() }
    };
  }

  private async getDataAccessLog(): Promise<any> {
    return [
      { timestamp: new Date(), action: 'data_access', source: 'user_dashboard' },
      { timestamp: new Date(), action: 'data_export', source: 'privacy_request' }
    ];
  }

  private getExportOptions(): any {
    return {
      formats: ['json', 'csv', 'xml', 'pdf'],
      maxFileSize: '100MB',
      retentionPeriod: '30 days',
      encryptionAvailable: true
    };
  }

  private async performDataDeletion(request: DataDeletionRequest): Promise<DeletionResult> {
    // Mock deletion implementation
    return {
      requestId: request.id,
      deletedRecords: {
        profile: 1,
        learning_progress: 50,
        ai_conversations: 25
      },
      retainedRecords: {
        support_tickets: 'Legal requirement to retain for 7 years'
      },
      completionDate: new Date(),
      certificate: 'deletion_certificate_' + request.id
    };
  }

  // Mock data access methods
  private async getUserProfile(userId: string): Promise<any> {
    return { id: userId, name: 'User Profile Data' };
  }

  private async getLearningProgress(userId: string): Promise<any> {
    return { userId, progress: 'Learning progress data' };
  }

  private async getAIConversations(userId: string): Promise<any> {
    return { userId, conversations: 'AI conversation data' };
  }

  private async getSupportTickets(userId: string): Promise<any> {
    return { userId, tickets: 'Support ticket data' };
  }

  private async generateDownloadUrl(format: string): Promise<string> {
    return `https://exports.example.com/download/${format}/${Date.now()}`;
  }

  private async convertToCSV(): Promise<string> {
    return 'CSV formatted data';
  }

  private async convertToXML(): Promise<string> {
    return '<xml>XML formatted data</xml>';
  }

  private async convertToPDF(): Promise<string> {
    return 'PDF formatted data';
  }

  private async notifyExportComplete(request: DataExportRequest): Promise<void> {
    console.log(`Export completed for user ${request.userId}, request ${request.id}`);
  }

  private async notifyDeletionComplete(request: DataDeletionRequest): Promise<void> {
    console.log(`Deletion completed for user ${request.userId}, request ${request.id}`);
  }

  private async generateDeletionCertificate(request: DataDeletionRequest, result: DeletionResult): Promise<void> {
    console.log(`Deletion certificate generated: ${result.certificate}`);
  }
}

// Types for data portability
interface AIDataUsageDashboard {
  userId: string;
  dataUsage: any;
  consentStatus: any;
  dataRetention: any;
  optOutOptions: any;
  lastUpdated: Date;
}

interface DataSharingPreferences {
  userId: string;
  dataTypes: Record<string, boolean>;
  thirdPartySharing: Record<string, boolean>;
  analyticsSharing: boolean;
  marketingSharing: boolean;
  researchSharing: boolean;
  lastUpdated: Date;
}

interface UserDataReport {
  userId: string;
  generatedAt: Date;
  dataCategories: any;
  consentHistory: any[];
  dataSharing: DataSharingPreferences;
  retentionSchedule: any;
  accessLog: any[];
  exportOptions: any;
}

// Singleton instance
let dataPortabilityServiceInstance: DataPortabilityService | null = null;

export function getDataPortabilityService(): DataPortabilityService {
  if (!dataPortabilityServiceInstance) {
    dataPortabilityServiceInstance = new DataPortabilityService();
  }
  return dataPortabilityServiceInstance;
}

export function resetDataPortabilityService(): void {
  dataPortabilityServiceInstance = null;
}