// Consent Management Service for Minimal Data Collection
import { ConsentRecord, ConsentRequest } from '../../types/security';
import { getEncryptionService } from './EncryptionService';
import { getPrivacyComplianceService } from './PrivacyComplianceService';

export interface ConsentCategory {
  id: string;
  name: string;
  description: string;
  required: boolean;
  dataTypes: string[];
  purpose: string;
  legalBasis: 'consent' | 'contract' | 'legitimate_interest' | 'legal_obligation';
  consequences: string;
  retention: number; // days
}

export interface ConsentPreferences {
  userId: string;
  categories: Record<string, boolean>;
  timestamp: Date;
  version: string;
  method: 'explicit' | 'implicit';
  ipAddress: string;
  userAgent: string;
}

export class ConsentManagementService {
  private encryptionService = getEncryptionService();
  private privacyService = getPrivacyComplianceService();
  private consentCategories: ConsentCategory[];
  private userConsents: Map<string, ConsentPreferences> = new Map();

  constructor() {
    this.consentCategories = this.initializeConsentCategories();
    this.initializeService();
  }

  private async initializeService(): Promise<void> {
    try {
      await this.encryptionService.initialize();
      console.log('✓ Consent Management Service initialized');
    } catch (error) {
      console.error('Failed to initialize consent management service:', error);
    }
  }

  /**
   * Initialize minimal data collection consent categories
   */
  private initializeConsentCategories(): ConsentCategory[] {
    return [
      {
        id: 'essential',
        name: 'Essential Services',
        description: 'Data necessary for the platform to function properly',
        required: true,
        dataTypes: ['user_id', 'authentication_tokens', 'session_data'],
        purpose: 'service_provision',
        legalBasis: 'contract',
        consequences: 'Without this consent, you cannot use the platform',
        retention: 2555 // 7 years for legal compliance
      },
      {
        id: 'learning_progress',
        name: 'Learning Progress',
        description: 'Track your learning progress and provide personalized recommendations',
        required: true,
        dataTypes: ['lesson_completion', 'skill_assessments', 'learning_preferences'],
        purpose: 'service_provision',
        legalBasis: 'contract',
        consequences: 'Without this consent, we cannot save your progress or provide personalized learning',
        retention: 1095 // 3 years
      },
      {
        id: 'ai_assistance',
        name: 'AI Assistant',
        description: 'Enable AI-powered help and support features',
        required: false,
        dataTypes: ['conversation_history', 'help_requests', 'interaction_patterns'],
        purpose: 'ai_assistance',
        legalBasis: 'consent',
        consequences: 'Without this consent, AI features will be limited to basic responses',
        retention: 365 // 1 year
      },
      {
        id: 'accessibility',
        name: 'Accessibility Preferences',
        description: 'Remember your accessibility settings and preferences',
        required: false,
        dataTypes: ['font_size', 'contrast_settings', 'motion_preferences', 'screen_reader_usage'],
        purpose: 'accessibility_support',
        legalBasis: 'legitimate_interest',
        consequences: 'Without this consent, accessibility settings will reset each session',
        retention: 730 // 2 years
      },
      {
        id: 'performance_analytics',
        name: 'Performance Analytics',
        description: 'Anonymous usage data to improve platform performance',
        required: false,
        dataTypes: ['page_load_times', 'error_reports', 'feature_usage'],
        purpose: 'service_improvement',
        legalBasis: 'legitimate_interest',
        consequences: 'Without this consent, we cannot identify and fix performance issues',
        retention: 365 // 1 year
      },
      {
        id: 'caregiver_support',
        name: 'Caregiver Support',
        description: 'Allow designated caregivers to view your progress',
        required: false,
        dataTypes: ['learning_progress', 'usage_patterns', 'support_requests'],
        purpose: 'caregiver_assistance',
        legalBasis: 'consent',
        consequences: 'Without this consent, caregivers cannot help monitor your progress',
        retention: 1095 // 3 years
      }
    ];
  }

  /**
   * Get all consent categories for display
   */
  getConsentCategories(): ConsentCategory[] {
    return [...this.consentCategories];
  }

  /**
   * Get minimal required consent categories
   */
  getRequiredConsentCategories(): ConsentCategory[] {
    return this.consentCategories.filter(category => category.required);
  }

  /**
   * Get optional consent categories
   */
  getOptionalConsentCategories(): ConsentCategory[] {
    return this.consentCategories.filter(category => !category.required);
  }

  /**
   * Record user consent preferences
   */
  async recordConsentPreferences(
    userId: string,
    preferences: Record<string, boolean>,
    evidence: {
      ipAddress: string;
      userAgent: string;
      method: 'explicit' | 'implicit';
    }
  ): Promise<ConsentPreferences> {
    // Validate that all required categories are consented to
    const requiredCategories = this.getRequiredConsentCategories();
    for (const category of requiredCategories) {
      if (!preferences[category.id]) {
        throw new Error(`Consent required for category: ${category.name}`);
      }
    }

    const consentPreferences: ConsentPreferences = {
      userId,
      categories: preferences,
      timestamp: new Date(),
      version: '2.0',
      method: evidence.method,
      ipAddress: evidence.ipAddress,
      userAgent: evidence.userAgent
    };

    // Encrypt and store consent preferences
    const encryptedPreferences = await this.encryptionService.encryptObject(consentPreferences);
    this.userConsents.set(userId, consentPreferences);

    // Record individual consent records for audit trail
    for (const [categoryId, granted] of Object.entries(preferences)) {
      await this.privacyService.recordConsent(
        userId,
        categoryId,
        granted,
        {
          ipAddress: evidence.ipAddress,
          userAgent: evidence.userAgent,
          formData: { category: categoryId, granted },
          method: evidence.method
        }
      );
    }

    // Log consent recording
    console.log(`✓ Consent preferences recorded for user ${userId}`);
    
    return consentPreferences;
  }

  /**
   * Get user consent preferences
   */
  async getUserConsentPreferences(userId: string): Promise<ConsentPreferences | null> {
    return this.userConsents.get(userId) || null;
  }

  /**
   * Check if user has consented to specific data collection
   */
  async hasConsent(userId: string, categoryId: string): Promise<boolean> {
    const preferences = await this.getUserConsentPreferences(userId);
    if (!preferences) return false;

    return preferences.categories[categoryId] || false;
  }

  /**
   * Check if user has consented to data type
   */
  async hasDataTypeConsent(userId: string, dataType: string): Promise<boolean> {
    const preferences = await this.getUserConsentPreferences(userId);
    if (!preferences) return false;

    // Find categories that include this data type
    const relevantCategories = this.consentCategories.filter(
      category => category.dataTypes.includes(dataType)
    );

    // Check if user has consented to any relevant category
    return relevantCategories.some(category => 
      preferences.categories[category.id]
    );
  }

  /**
   * Update consent preferences
   */
  async updateConsentPreferences(
    userId: string,
    updates: Record<string, boolean>,
    evidence: {
      ipAddress: string;
      userAgent: string;
    }
  ): Promise<ConsentPreferences> {
    const currentPreferences = await this.getUserConsentPreferences(userId);
    if (!currentPreferences) {
      throw new Error('No existing consent preferences found');
    }

    // Merge updates with current preferences
    const updatedCategories = {
      ...currentPreferences.categories,
      ...updates
    };

    // Validate required categories
    const requiredCategories = this.getRequiredConsentCategories();
    for (const category of requiredCategories) {
      if (!updatedCategories[category.id]) {
        throw new Error(`Cannot withdraw consent for required category: ${category.name}`);
      }
    }

    // Create new consent preferences
    const newPreferences: ConsentPreferences = {
      ...currentPreferences,
      categories: updatedCategories,
      timestamp: new Date(),
      ipAddress: evidence.ipAddress,
      userAgent: evidence.userAgent,
      method: 'explicit'
    };

    // Store updated preferences
    this.userConsents.set(userId, newPreferences);

    // Record consent changes
    for (const [categoryId, granted] of Object.entries(updates)) {
      if (currentPreferences.categories[categoryId] !== granted) {
        await this.privacyService.recordConsent(
          userId,
          categoryId,
          granted,
          {
            ipAddress: evidence.ipAddress,
            userAgent: evidence.userAgent,
            formData: { category: categoryId, granted, action: 'update' }
          }
        );
      }
    }

    console.log(`✓ Consent preferences updated for user ${userId}`);
    
    return newPreferences;
  }

  /**
   * Withdraw consent for optional categories
   */
  async withdrawConsent(
    userId: string,
    categoryId: string,
    evidence: {
      ipAddress: string;
      userAgent: string;
      reason?: string;
    }
  ): Promise<void> {
    const category = this.consentCategories.find(c => c.id === categoryId);
    if (!category) {
      throw new Error(`Unknown consent category: ${categoryId}`);
    }

    if (category.required) {
      throw new Error(`Cannot withdraw consent for required category: ${category.name}`);
    }

    await this.updateConsentPreferences(
      userId,
      { [categoryId]: false },
      evidence
    );

    // Trigger data processing changes
    await this.handleConsentWithdrawal(userId, categoryId, evidence.reason);
  }

  /**
   * Handle consent withdrawal consequences
   */
  private async handleConsentWithdrawal(
    userId: string,
    categoryId: string,
    reason?: string
  ): Promise<void> {
    const category = this.consentCategories.find(c => c.id === categoryId);
    if (!category) return;

    console.log(`Processing consent withdrawal for ${userId}: ${categoryId}`);

    switch (categoryId) {
      case 'ai_assistance':
        // Clear AI conversation history
        await this.clearAIData(userId);
        break;
      
      case 'performance_analytics':
        // Stop analytics collection
        await this.stopAnalyticsCollection(userId);
        break;
      
      case 'caregiver_support':
        // Revoke caregiver access
        await this.revokeCaregiverAccess(userId);
        break;
      
      case 'accessibility':
        // Clear accessibility preferences (but keep session-only)
        await this.clearAccessibilityData(userId);
        break;
    }
  }

  /**
   * Generate consent banner configuration
   */
  generateConsentBannerConfig(): {
    required: ConsentCategory[];
    optional: ConsentCategory[];
    settings: {
      showBanner: boolean;
      allowGranular: boolean;
      requireExplicit: boolean;
    };
  } {
    return {
      required: this.getRequiredConsentCategories(),
      optional: this.getOptionalConsentCategories(),
      settings: {
        showBanner: true,
        allowGranular: true,
        requireExplicit: true
      }
    };
  }

  /**
   * Validate data collection against consent
   */
  async validateDataCollection(
    userId: string,
    dataType: string,
    purpose: string
  ): Promise<{ allowed: boolean; reason: string; category?: string }> {
    // Find relevant consent category
    const category = this.consentCategories.find(
      c => c.dataTypes.includes(dataType) && c.purpose === purpose
    );

    if (!category) {
      return {
        allowed: false,
        reason: 'No consent category defined for this data type and purpose'
      };
    }

    // Check if user has consented
    const hasConsent = await this.hasConsent(userId, category.id);

    if (!hasConsent && category.required) {
      return {
        allowed: false,
        reason: 'Required consent not granted',
        category: category.id
      };
    }

    if (!hasConsent && !category.required) {
      return {
        allowed: false,
        reason: 'Optional consent not granted',
        category: category.id
      };
    }

    return {
      allowed: true,
      reason: category.legalBasis,
      category: category.id
    };
  }

  /**
   * Get data retention schedule based on consent
   */
  getDataRetentionSchedule(userId: string): Promise<Record<string, number>> {
    const preferences = this.userConsents.get(userId);
    if (!preferences) return Promise.resolve({});

    const schedule: Record<string, number> = {};

    for (const [categoryId, granted] of Object.entries(preferences.categories)) {
      if (granted) {
        const category = this.consentCategories.find(c => c.id === categoryId);
        if (category) {
          for (const dataType of category.dataTypes) {
            schedule[dataType] = category.retention;
          }
        }
      }
    }

    return Promise.resolve(schedule);
  }

  // Helper methods for consent withdrawal
  private async clearAIData(userId: string): Promise<void> {
    console.log(`Clearing AI data for user ${userId}`);
    // Implementation would clear AI conversation history
  }

  private async stopAnalyticsCollection(userId: string): Promise<void> {
    console.log(`Stopping analytics collection for user ${userId}`);
    // Implementation would stop analytics tracking
  }

  private async revokeCaregiverAccess(userId: string): Promise<void> {
    console.log(`Revoking caregiver access for user ${userId}`);
    // Implementation would remove caregiver permissions
  }

  private async clearAccessibilityData(userId: string): Promise<void> {
    console.log(`Clearing stored accessibility data for user ${userId}`);
    // Implementation would clear stored accessibility preferences
  }
}

// Singleton instance
let consentManagementServiceInstance: ConsentManagementService | null = null;

export function getConsentManagementService(): ConsentManagementService {
  if (!consentManagementServiceInstance) {
    consentManagementServiceInstance = new ConsentManagementService();
  }
  return consentManagementServiceInstance;
}

export function resetConsentManagementService(): void {
  consentManagementServiceInstance = null;
}