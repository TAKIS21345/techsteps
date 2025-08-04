// Privacy Compliance Service for GDPR and CCPA
import { 
  ConsentRecord, 
  ConsentRequest, 
  DataSubjectRequest, 
  DataSubjectResponse,
  PrivacyPolicy,
  DataTypePolicy,
  UserRight
} from '../../types/security';
// Privacy compliance service for GDPR/CCPA compliance
import { getEncryptionService } from './EncryptionService';

export class PrivacyComplianceService {
  private encryptionService = getEncryptionService();
  private consentRecords: Map<string, ConsentRecord[]> = new Map();
  private dataSubjectRequests: Map<string, DataSubjectRequest> = new Map();

  constructor() {
    // Initialize service asynchronously
    this.initializeService();
  }

  private async initializeService(): Promise<void> {
    try {
      await this.encryptionService.initialize();
    } catch (error) {
      console.error('Failed to initialize privacy compliance service:', error);
    }
  }

  /**
   * Record user consent for data processing
   */
  async recordConsent(
    userId: string, 
    consentType: string, 
    granted: boolean,
    evidence: any
  ): Promise<ConsentRecord> {
    const consentRecord: ConsentRecord = {
      userId,
      consentType,
      granted,
      timestamp: new Date(),
      version: '1.0',
      method: 'explicit',
      evidence: {
        ipAddress: evidence.ipAddress || 'unknown',
        userAgent: evidence.userAgent || 'unknown',
        formData: evidence.formData,
        checkboxes: evidence.checkboxes,
        signature: evidence.signature
      }
    };

    // Encrypt sensitive evidence data if encryption service is ready
    if (consentRecord.evidence.formData) {
      try {
        const encrypted = await this.encryptionService.encryptObject(consentRecord.evidence.formData);
        consentRecord.evidence.formData = { encrypted: true, data: encrypted };
      } catch (error) {
        // If encryption fails, store without encryption but log the issue
        console.warn('Failed to encrypt consent evidence data:', error);
      }
    }

    // Store consent record
    const userConsents = this.consentRecords.get(userId) || [];
    userConsents.push(consentRecord);
    this.consentRecords.set(userId, userConsents);

    // Log consent action for audit
    await this.logConsentAction(userId, consentType, granted);

    return consentRecord;
  }

  /**
   * Check if user has given consent for specific data processing
   */
  async checkConsent(userId: string, consentType: string): Promise<boolean> {
    const userConsents = this.consentRecords.get(userId) || [];
    
    // Find the most recent consent record for this type
    const latestConsent = userConsents
      .filter(consent => consent.consentType === consentType)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];

    return latestConsent?.granted || false;
  }

  /**
   * Withdraw user consent
   */
  async withdrawConsent(userId: string, consentType: string): Promise<void> {
    await this.recordConsent(userId, consentType, false, {
      ipAddress: 'system',
      userAgent: 'withdrawal-system'
    });

    // Trigger data processing changes based on withdrawn consent
    await this.handleConsentWithdrawal(userId, consentType);
  }

  /**
   * Get all consent records for a user
   */
  async getUserConsents(userId: string): Promise<ConsentRecord[]> {
    return this.consentRecords.get(userId) || [];
  }

  /**
   * Handle data subject access request (GDPR Article 15)
   */
  async handleAccessRequest(userId: string, description: string): Promise<DataSubjectRequest> {
    const request: DataSubjectRequest = {
      id: this.generateRequestId(),
      userId,
      type: 'access',
      status: 'pending',
      requestDate: new Date(),
      description
    };

    this.dataSubjectRequests.set(request.id, request);

    // Process request asynchronously (don't await to return immediately)
    setTimeout(() => this.processAccessRequest(request.id), 0);

    return request;
  }

  /**
   * Handle data subject erasure request (GDPR Article 17 - Right to be forgotten)
   */
  async handleErasureRequest(userId: string, description: string): Promise<DataSubjectRequest> {
    const request: DataSubjectRequest = {
      id: this.generateRequestId(),
      userId,
      type: 'erasure',
      status: 'pending',
      requestDate: new Date(),
      description
    };

    this.dataSubjectRequests.set(request.id, request);

    // Process request asynchronously (don't await to return immediately)
    setTimeout(() => this.processErasureRequest(request.id), 0);

    return request;
  }

  /**
   * Handle data portability request (GDPR Article 20)
   */
  async handlePortabilityRequest(userId: string, format: 'json' | 'csv' | 'xml'): Promise<DataSubjectRequest> {
    const request: DataSubjectRequest = {
      id: this.generateRequestId(),
      userId,
      type: 'portability',
      status: 'pending',
      requestDate: new Date(),
      description: `Data export in ${format} format`
    };

    this.dataSubjectRequests.set(request.id, request);

    // Process request asynchronously (don't await to return immediately)
    setTimeout(() => this.processPortabilityRequest(request.id, format), 0);

    return request;
  }

  /**
   * Get data subject request status
   */
  async getRequestStatus(requestId: string): Promise<DataSubjectRequest | null> {
    return this.dataSubjectRequests.get(requestId) || null;
  }

  /**
   * Get privacy policy with user rights information
   */
  getPrivacyPolicy(): PrivacyPolicy {
    return {
      version: '2.0',
      effectiveDate: new Date('2024-01-01'),
      dataTypes: this.getDataTypePolicies(),
      userRights: this.getUserRights(),
      retentionPolicies: [
        {
          dataType: 'user_profile',
          retentionPeriod: 2555, // 7 years
          deletionMethod: 'hard',
          exceptions: ['legal_hold', 'active_dispute']
        },
        {
          dataType: 'learning_progress',
          retentionPeriod: 1095, // 3 years
          deletionMethod: 'anonymization',
          exceptions: ['user_request_retention']
        },
        {
          dataType: 'ai_conversations',
          retentionPeriod: 365, // 1 year
          deletionMethod: 'hard',
          exceptions: ['quality_improvement_consent']
        }
      ],
      thirdPartySharing: [
        {
          provider: 'Google Gemini',
          purpose: 'AI assistance',
          dataTypes: ['anonymized_conversations'],
          safeguards: ['data_processing_agreement', 'encryption', 'access_controls'],
          userConsent: true
        }
      ]
    };
  }

  /**
   * Validate data processing against consent and legal basis
   */
  async validateDataProcessing(
    userId: string, 
    dataType: string, 
    purpose: string
  ): Promise<{ allowed: boolean; reason: string }> {
    // Check consent
    const hasConsent = await this.checkConsent(userId, `${dataType}_${purpose}`);
    
    if (hasConsent) {
      return { allowed: true, reason: 'user_consent' };
    }

    // Check for legitimate interest or other legal basis
    const policy = this.getDataTypePolicies().find(p => p.type === dataType);
    
    if (policy?.legalBasis === 'legitimate_interest' && purpose === policy.purpose) {
      return { allowed: true, reason: 'legitimate_interest' };
    }

    if (policy?.legalBasis === 'contract' && purpose === 'service_provision') {
      return { allowed: true, reason: 'contractual_necessity' };
    }

    return { allowed: false, reason: 'no_legal_basis' };
  }

  /**
   * Generate consent requests for new users
   */
  generateConsentRequests(): ConsentRequest[] {
    return [
      {
        type: 'analytics_performance',
        purpose: 'Improve platform performance and user experience',
        dataTypes: ['usage_analytics', 'performance_metrics'],
        required: false,
        description: 'Help us understand how you use the platform to make improvements',
        consequences: 'Without this consent, we cannot provide personalized recommendations'
      },
      {
        type: 'ai_training_improvement',
        purpose: 'Improve AI assistant responses',
        dataTypes: ['anonymized_conversations', 'interaction_feedback'],
        required: false,
        description: 'Allow us to use anonymized conversation data to improve AI responses',
        consequences: 'AI responses may be less personalized without this data'
      },
      {
        type: 'marketing_communications',
        purpose: 'Send helpful tips and platform updates',
        dataTypes: ['email_address', 'learning_preferences'],
        required: false,
        description: 'Receive emails about new features and learning tips',
        consequences: 'You will not receive platform updates and learning tips'
      },
      {
        type: 'caregiver_sharing',
        purpose: 'Share progress with designated caregivers',
        dataTypes: ['learning_progress', 'usage_patterns'],
        required: false,
        description: 'Allow designated family members to view your learning progress',
        consequences: 'Caregivers will not be able to help monitor your progress'
      }
    ];
  }

  /**
   * Process access request - compile user data
   */
  private async processAccessRequest(requestId: string): Promise<void> {
    const request = this.dataSubjectRequests.get(requestId);
    if (!request) return;

    try {
      // Update status
      request.status = 'processing';
      this.dataSubjectRequests.set(requestId, request);

      // Compile user data (this would integrate with actual data stores)
      const userData = await this.compileUserData(request.userId);

      // Create response
      const response: DataSubjectResponse = {
        data: userData,
        actions: ['data_compiled', 'privacy_review_completed'],
        explanation: 'Your personal data has been compiled according to GDPR Article 15 requirements.',
        appealProcess: 'If you believe this response is incomplete, please contact our Data Protection Officer.'
      };

      // Complete request
      request.status = 'completed';
      request.completionDate = new Date();
      request.response = response;
      this.dataSubjectRequests.set(requestId, request);

    } catch {
      request.status = 'rejected';
      request.response = {
        actions: ['request_failed'],
        explanation: 'Unable to process your request due to technical issues. Please try again.',
        appealProcess: 'Contact our support team for assistance.'
      };
      this.dataSubjectRequests.set(requestId, request);
    }
  }

  /**
   * Process erasure request - delete user data
   */
  private async processErasureRequest(requestId: string): Promise<void> {
    const request = this.dataSubjectRequests.get(requestId);
    if (!request) return;

    try {
      request.status = 'processing';
      this.dataSubjectRequests.set(requestId, request);

      // Check for legal obligations to retain data
      const retentionCheck = await this.checkRetentionObligations(request.userId);
      
      if (retentionCheck.mustRetain) {
        request.status = 'rejected';
        request.response = {
          actions: ['retention_required'],
          explanation: `Data cannot be deleted due to: ${retentionCheck.reasons.join(', ')}`,
          appealProcess: 'You may appeal this decision by contacting our Data Protection Officer.'
        };
      } else {
        // Perform data deletion
        await this.performDataDeletion(request.userId);
        
        request.status = 'completed';
        request.completionDate = new Date();
        request.response = {
          actions: ['data_deleted', 'anonymization_completed'],
          explanation: 'Your personal data has been deleted or anonymized according to GDPR Article 17.',
          appealProcess: 'This action cannot be undone. If you believe this was done in error, contact support immediately.'
        };
      }

      this.dataSubjectRequests.set(requestId, request);

    } catch {
      request.status = 'rejected';
      request.response = {
        actions: ['deletion_failed'],
        explanation: 'Unable to process deletion request due to technical issues.',
        appealProcess: 'Contact our Data Protection Officer for assistance.'
      };
      this.dataSubjectRequests.set(requestId, request);
    }
  }

  /**
   * Process portability request - export user data
   */
  private async processPortabilityRequest(requestId: string, format: string): Promise<void> {
    const request = this.dataSubjectRequests.get(requestId);
    if (!request) return;

    try {
      request.status = 'processing';
      this.dataSubjectRequests.set(requestId, request);

      // Export user data in requested format
      const exportData = await this.exportUserData(request.userId, format);

      request.status = 'completed';
      request.completionDate = new Date();
      request.response = {
        data: exportData,
        actions: ['data_exported', 'download_link_generated'],
        explanation: `Your data has been exported in ${format} format and is available for download.`,
        appealProcess: 'If the export is incomplete, please contact our Data Protection Officer.'
      };

      this.dataSubjectRequests.set(requestId, request);

    } catch {
      request.status = 'rejected';
      request.response = {
        actions: ['export_failed'],
        explanation: 'Unable to export your data due to technical issues.',
        appealProcess: 'Contact our support team for assistance.'
      };
      this.dataSubjectRequests.set(requestId, request);
    }
  }

  /**
   * Handle consent withdrawal consequences
   */
  private async handleConsentWithdrawal(userId: string, consentType: string): Promise<void> {
    switch (consentType) {
      case 'analytics_performance':
        // Stop collecting analytics data
        await this.stopAnalyticsCollection(userId);
        break;
      case 'ai_training_improvement':
        // Remove user data from AI training datasets
        await this.removeFromAITraining(userId);
        break;
      case 'marketing_communications':
        // Unsubscribe from marketing emails
        await this.unsubscribeMarketing(userId);
        break;
      case 'caregiver_sharing':
        // Revoke caregiver access
        await this.revokeCaregiverAccess(userId);
        break;
    }
  }

  /**
   * Get data type policies
   */
  private getDataTypePolicies(): DataTypePolicy[] {
    return [
      {
        type: 'user_profile',
        purpose: 'service_provision',
        legalBasis: 'contract',
        retention: 2555, // 7 years
        sharing: false,
        userControl: true
      },
      {
        type: 'learning_progress',
        purpose: 'service_provision',
        legalBasis: 'contract',
        retention: 1095, // 3 years
        sharing: false,
        userControl: true
      },
      {
        type: 'ai_conversations',
        purpose: 'ai_assistance',
        legalBasis: 'consent',
        retention: 365, // 1 year
        sharing: true,
        userControl: true
      },
      {
        type: 'usage_analytics',
        purpose: 'service_improvement',
        legalBasis: 'legitimate_interest',
        retention: 730, // 2 years
        sharing: false,
        userControl: true
      }
    ];
  }

  /**
   * Get user rights information
   */
  private getUserRights(): UserRight[] {
    return [
      {
        right: 'access',
        description: 'Request a copy of your personal data',
        process: 'Submit request through privacy dashboard or contact support',
        timeframe: 30
      },
      {
        right: 'rectification',
        description: 'Correct inaccurate personal data',
        process: 'Update through account settings or contact support',
        timeframe: 30
      },
      {
        right: 'erasure',
        description: 'Request deletion of your personal data',
        process: 'Submit deletion request through privacy dashboard',
        timeframe: 30
      },
      {
        right: 'portability',
        description: 'Export your data in a machine-readable format',
        process: 'Request data export through privacy dashboard',
        timeframe: 30
      },
      {
        right: 'restriction',
        description: 'Limit how we process your data',
        process: 'Contact our Data Protection Officer',
        timeframe: 30
      },
      {
        right: 'objection',
        description: 'Object to processing based on legitimate interests',
        process: 'Contact our Data Protection Officer',
        timeframe: 30
      }
    ];
  }

  // Helper methods (would integrate with actual data stores)
  private async compileUserData(userId: string): Promise<any> {
    // This would compile data from all systems
    return {
      profile: 'encrypted_user_profile_data',
      progress: 'encrypted_learning_progress',
      conversations: 'encrypted_ai_conversations',
      consents: await this.getUserConsents(userId)
    };
  }

  private async checkRetentionObligations(): Promise<{ mustRetain: boolean; reasons: string[] }> {
    // Check for legal holds, active disputes, etc.
    return { mustRetain: false, reasons: [] };
  }

  private async performDataDeletion(userId: string): Promise<void> {
    // Implement actual data deletion across all systems
    console.log(`Performing data deletion for user ${userId}`);
  }

  private async exportUserData(userId: string, format: string): Promise<any> {
    // Export user data in requested format
    return { exportUrl: `https://exports.example.com/${userId}.${format}` };
  }

  private async logConsentAction(userId: string, consentType: string, granted: boolean): Promise<void> {
    // Log consent action for audit trail
    console.log(`Consent ${granted ? 'granted' : 'withdrawn'} for ${userId}: ${consentType}`);
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Consent withdrawal handlers
  private async stopAnalyticsCollection(userId: string): Promise<void> {
    console.log(`Stopping analytics collection for user ${userId}`);
  }

  private async removeFromAITraining(userId: string): Promise<void> {
    console.log(`Removing user ${userId} data from AI training`);
  }

  private async unsubscribeMarketing(userId: string): Promise<void> {
    console.log(`Unsubscribing user ${userId} from marketing`);
  }

  private async revokeCaregiverAccess(userId: string): Promise<void> {
    console.log(`Revoking caregiver access for user ${userId}`);
  }
}

// Singleton instance
let privacyComplianceServiceInstance: PrivacyComplianceService | null = null;

export function getPrivacyComplianceService(): PrivacyComplianceService {
  if (!privacyComplianceServiceInstance) {
    privacyComplianceServiceInstance = new PrivacyComplianceService();
  }
  return privacyComplianceServiceInstance;
}

export function resetPrivacyComplianceService(): void {
  privacyComplianceServiceInstance = null;
}