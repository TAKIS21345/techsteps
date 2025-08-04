// Data Minimization Service - Collect only necessary data with explicit consent
import { ConsentRequest } from '../../types/security';
import { User, UserPreferences } from '../../types/core';
import { getPrivacyComplianceService } from './PrivacyComplianceService';
import { getEncryptionService } from './EncryptionService';

export class DataMinimizationService {
  private privacyService = getPrivacyComplianceService();
  private encryptionService = getEncryptionService();
  private minimumDataFields = new Set([
    'id', 'email', 'firstName', 'preferredLanguage', 'createdAt'
  ]);

  constructor() {
    this.initializeService();
  }

  private async initializeService(): Promise<void> {
    await this.encryptionService.initialize();
  }

  /**
   * Validate data collection against minimization principles
   */
  async validateDataCollection(
    dataType: string,
    fields: string[],
    purpose: string,
    userId?: string
  ): Promise<DataCollectionValidation> {
    const validation: DataCollectionValidation = {
      allowed: true,
      requiredFields: [],
      optionalFields: [],
      rejectedFields: [],
      consentRequired: [],
      reasons: []
    };

    // Check each field against minimization rules
    for (const field of fields) {
      const fieldValidation = await this.validateField(field, dataType, purpose, userId);
      
      if (fieldValidation.required) {
        validation.requiredFields.push(field);
      } else if (fieldValidation.allowed && fieldValidation.consentRequired) {
        validation.optionalFields.push(field);
        validation.consentRequired.push({
          field,
          purpose: fieldValidation.purpose,
          legalBasis: 'consent'
        });
      } else if (fieldValidation.allowed) {
        validation.optionalFields.push(field);
      } else {
        validation.rejectedFields.push(field);
        validation.reasons.push(`Field '${field}' not necessary for purpose '${purpose}'`);
      }
    }

    // Overall validation fails if any fields are rejected
    validation.allowed = validation.rejectedFields.length === 0;

    return validation;
  }

  /**
   * Create minimal user profile with only essential data
   */
  async createMinimalProfile(userData: Partial<User>): Promise<MinimalUserProfile> {
    const profile: MinimalUserProfile = {
      id: userData.id || this.generateUserId(),
      email: userData.email || '',
      firstName: userData.profile?.firstName || '',
      preferredLanguage: userData.profile?.preferredLanguage || 'en',
      createdAt: new Date(),
      consentStatus: {},
      dataMinimized: true
    };

    // Only include additional fields if user has given consent
    if (userData.profile?.lastName && await this.hasConsent(profile.id, 'full_name')) {
      profile.lastName = userData.profile.lastName;
    }

    if (userData.profile?.dateOfBirth && await this.hasConsent(profile.id, 'demographic_data')) {
      profile.dateOfBirth = userData.profile.dateOfBirth;
    }

    if (userData.profile?.timezone && await this.hasConsent(profile.id, 'location_data')) {
      profile.timezone = userData.profile.timezone;
    }

    return profile;
  }

  /**
   * Expand user profile based on new consents
   */
  async expandProfile(
    userId: string, 
    additionalData: Partial<User>,
    consents: Record<string, boolean>
  ): Promise<User> {
    const currentProfile = await this.getMinimalProfile(userId);
    const expandedProfile: Partial<User> = { ...currentProfile };

    // Process each consent and add corresponding data
    for (const [consentType, granted] of Object.entries(consents)) {
      if (granted) {
        await this.privacyService.recordConsent(userId, consentType, true, {
          ipAddress: 'system',
          userAgent: 'profile-expansion'
        });

        // Add data based on consent type
        switch (consentType) {
          case 'full_name':
            if (additionalData.profile?.lastName) {
              expandedProfile.profile = expandedProfile.profile || {};
              expandedProfile.profile.lastName = additionalData.profile.lastName;
            }
            break;

          case 'demographic_data':
            if (additionalData.profile?.dateOfBirth) {
              expandedProfile.profile = expandedProfile.profile || {};
              expandedProfile.profile.dateOfBirth = additionalData.profile.dateOfBirth;
            }
            break;

          case 'location_data':
            if (additionalData.profile?.timezone) {
              expandedProfile.profile = expandedProfile.profile || {};
              expandedProfile.profile.timezone = additionalData.profile.timezone;
            }
            break;

          case 'emergency_contact':
            if (additionalData.profile?.emergencyContact) {
              expandedProfile.profile = expandedProfile.profile || {};
              expandedProfile.profile.emergencyContact = additionalData.profile.emergencyContact;
            }
            break;

          case 'learning_analytics':
            if (additionalData.preferences?.privacy?.allowAnalytics) {
              expandedProfile.preferences = expandedProfile.preferences || {} as UserPreferences;
              expandedProfile.preferences.privacy = expandedProfile.preferences.privacy || {};
              expandedProfile.preferences.privacy.allowAnalytics = true;
            }
            break;
        }
      }
    }

    return expandedProfile as User;
  }

  /**
   * Generate consent requests based on data minimization principles
   */
  generateMinimalConsentRequests(): ConsentRequest[] {
    return [
      {
        type: 'full_name',
        purpose: 'Personalized experience and support',
        dataTypes: ['last_name'],
        required: false,
        description: 'We can provide more personalized assistance if we know your full name',
        consequences: 'You will be addressed by first name only'
      },
      {
        type: 'demographic_data',
        purpose: 'Age-appropriate content and features',
        dataTypes: ['date_of_birth'],
        required: false,
        description: 'Help us provide age-appropriate learning content and interface adjustments',
        consequences: 'Content will not be age-customized'
      },
      {
        type: 'location_data',
        purpose: 'Timezone-appropriate scheduling and regional content',
        dataTypes: ['timezone', 'region'],
        required: false,
        description: 'Show times in your timezone and provide region-specific examples',
        consequences: 'Times shown in UTC, generic examples used'
      },
      {
        type: 'emergency_contact',
        purpose: 'Safety and emergency support',
        dataTypes: ['emergency_contact_info'],
        required: false,
        description: 'Contact someone if you need emergency help while using the platform',
        consequences: 'Emergency support will be limited to platform-provided resources'
      },
      {
        type: 'learning_analytics',
        purpose: 'Improve learning experience and platform performance',
        dataTypes: ['usage_patterns', 'learning_progress', 'interaction_data'],
        required: false,
        description: 'Help us understand how to make the platform work better for seniors',
        consequences: 'Learning recommendations will be less personalized'
      }
    ];
  }

  /**
   * Anonymize user data for analytics while preserving utility
   */
  async anonymizeForAnalytics(userData: any): Promise<AnonymizedData> {
    const anonymized: AnonymizedData = {
      id: await this.generateAnonymousId(userData.id),
      ageGroup: this.getAgeGroup(userData.profile?.dateOfBirth),
      region: this.getRegion(userData.profile?.timezone),
      language: userData.profile?.preferredLanguage,
      accessibilityFeatures: this.extractAccessibilityFeatures(userData.accessibilitySettings),
      learningPatterns: await this.anonymizeLearningPatterns(userData.learningProgress),
      timestamp: new Date()
    };

    // Remove any potentially identifying information
    delete anonymized.id; // Use session-based anonymous ID instead
    
    return anonymized;
  }

  /**
   * Check if data retention period has expired
   */
  async checkRetentionExpiry(userId: string, dataType: string): Promise<boolean> {
    const retentionPolicies = this.getRetentionPolicies();
    const policy = retentionPolicies[dataType];
    
    if (!policy) return false;

    const userData = await this.getUserData(userId, dataType);
    if (!userData?.createdAt) return false;

    const expiryDate = new Date(userData.createdAt);
    expiryDate.setDate(expiryDate.getDate() + policy.retentionDays);

    return new Date() > expiryDate;
  }

  /**
   * Automatically delete expired data
   */
  async cleanupExpiredData(): Promise<CleanupReport> {
    const report: CleanupReport = {
      processedUsers: 0,
      deletedRecords: {},
      anonymizedRecords: {},
      errors: [],
      completedAt: new Date()
    };

    const users = await this.getAllUsers();
    
    for (const user of users) {
      try {
        report.processedUsers++;
        
        // Check each data type for expiry
        const dataTypes = ['learning_progress', 'ai_conversations', 'usage_analytics'];
        
        for (const dataType of dataTypes) {
          const expired = await this.checkRetentionExpiry(user.id, dataType);
          
          if (expired) {
            const policy = this.getRetentionPolicies()[dataType];
            
            if (policy.action === 'delete') {
              await this.deleteUserData(user.id, dataType);
              report.deletedRecords[dataType] = (report.deletedRecords[dataType] || 0) + 1;
            } else if (policy.action === 'anonymize') {
              await this.anonymizeUserData(user.id, dataType);
              report.anonymizedRecords[dataType] = (report.anonymizedRecords[dataType] || 0) + 1;
            }
          }
        }
      } catch (error) {
        report.errors.push(`Error processing user ${user.id}: ${error.message}`);
      }
    }

    return report;
  }

  /**
   * Validate field collection against minimization rules
   */
  private async validateField(
    field: string, 
    dataType: string, 
    purpose: string, 
    userId?: string
  ): Promise<FieldValidation> {
    // Essential fields are always allowed
    if (this.minimumDataFields.has(field)) {
      return {
        allowed: true,
        required: true,
        consentRequired: false,
        purpose: 'service_provision'
      };
    }

    // Check field against purpose mapping
    const fieldPurposeMap = this.getFieldPurposeMapping();
    const allowedPurposes = fieldPurposeMap[field] || [];
    
    if (!allowedPurposes.includes(purpose)) {
      return {
        allowed: false,
        required: false,
        consentRequired: false,
        purpose: ''
      };
    }

    // Check if user has already given consent
    if (userId) {
      const hasConsent = await this.hasConsent(userId, `${field}_${purpose}`);
      if (hasConsent) {
        return {
          allowed: true,
          required: false,
          consentRequired: false,
          purpose
        };
      }
    }

    // Field is allowed but requires consent
    return {
      allowed: true,
      required: false,
      consentRequired: true,
      purpose
    };
  }

  /**
   * Get field to purpose mapping for validation
   */
  private getFieldPurposeMapping(): Record<string, string[]> {
    return {
      'lastName': ['personalization', 'support'],
      'dateOfBirth': ['age_appropriate_content', 'accessibility'],
      'timezone': ['scheduling', 'regional_content'],
      'emergencyContact': ['safety', 'emergency_support'],
      'learningProgress': ['service_provision', 'analytics'],
      'aiConversations': ['ai_improvement', 'support'],
      'usageAnalytics': ['service_improvement', 'performance'],
      'accessibilitySettings': ['service_provision', 'accessibility']
    };
  }

  /**
   * Get data retention policies
   */
  private getRetentionPolicies(): Record<string, RetentionPolicy> {
    return {
      'learning_progress': {
        retentionDays: 1095, // 3 years
        action: 'anonymize'
      },
      'ai_conversations': {
        retentionDays: 365, // 1 year
        action: 'delete'
      },
      'usage_analytics': {
        retentionDays: 730, // 2 years
        action: 'anonymize'
      },
      'support_tickets': {
        retentionDays: 2555, // 7 years
        action: 'anonymize'
      }
    };
  }

  // Helper methods
  private async hasConsent(userId: string, consentType: string): Promise<boolean> {
    return await this.privacyService.checkConsent(userId, consentType);
  }

  private generateUserId(): string {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async generateAnonymousId(userId: string): Promise<string> {
    // Generate consistent anonymous ID for analytics
    const hash = await this.encryptionService.generateHash(userId + 'analytics_salt');
    return hash.substr(0, 16);
  }

  private getAgeGroup(dateOfBirth?: Date): string {
    if (!dateOfBirth) return 'unknown';
    
    const age = new Date().getFullYear() - dateOfBirth.getFullYear();
    
    if (age < 50) return 'under_50';
    if (age < 65) return '50_64';
    if (age < 75) return '65_74';
    return '75_plus';
  }

  private getRegion(timezone?: string): string {
    if (!timezone) return 'unknown';
    
    // Simple region mapping based on timezone
    if (timezone.includes('America')) return 'americas';
    if (timezone.includes('Europe')) return 'europe';
    if (timezone.includes('Asia')) return 'asia';
    if (timezone.includes('Australia')) return 'oceania';
    return 'other';
  }

  private extractAccessibilityFeatures(settings: any): string[] {
    const features: string[] = [];
    
    if (settings?.highContrast) features.push('high_contrast');
    if (settings?.reducedMotion) features.push('reduced_motion');
    if (settings?.screenReaderOptimized) features.push('screen_reader');
    if (settings?.keyboardNavigation) features.push('keyboard_nav');
    
    return features;
  }

  private async anonymizeLearningPatterns(progress: any): Promise<any> {
    // Remove identifying information while preserving learning patterns
    return {
      completionRate: progress?.completionRate || 0,
      averageSessionTime: progress?.averageSessionTime || 0,
      preferredDifficulty: progress?.preferredDifficulty || 'beginner',
      strugglingAreas: progress?.strugglingAreas || []
    };
  }

  // Mock data access methods (would integrate with actual data stores)
  private async getMinimalProfile(userId: string): Promise<MinimalUserProfile> {
    // Mock implementation
    return {
      id: userId,
      email: 'user@example.com',
      firstName: 'User',
      preferredLanguage: 'en',
      createdAt: new Date(),
      consentStatus: {},
      dataMinimized: true
    };
  }

  private async getUserData(userId: string, dataType: string): Promise<any> {
    // Mock implementation
    return { createdAt: new Date() };
  }

  private async getAllUsers(): Promise<{ id: string }[]> {
    // Mock implementation
    return [];
  }

  private async deleteUserData(userId: string, dataType: string): Promise<void> {
    console.log(`Deleting ${dataType} for user ${userId}`);
  }

  private async anonymizeUserData(userId: string, dataType: string): Promise<void> {
    console.log(`Anonymizing ${dataType} for user ${userId}`);
  }
}

// Types
interface DataCollectionValidation {
  allowed: boolean;
  requiredFields: string[];
  optionalFields: string[];
  rejectedFields: string[];
  consentRequired: Array<{
    field: string;
    purpose: string;
    legalBasis: string;
  }>;
  reasons: string[];
}

interface FieldValidation {
  allowed: boolean;
  required: boolean;
  consentRequired: boolean;
  purpose: string;
}

interface MinimalUserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName?: string;
  preferredLanguage: string;
  dateOfBirth?: Date;
  timezone?: string;
  createdAt: Date;
  consentStatus: Record<string, boolean>;
  dataMinimized: boolean;
}

interface AnonymizedData {
  id?: string;
  ageGroup: string;
  region: string;
  language: string;
  accessibilityFeatures: string[];
  learningPatterns: any;
  timestamp: Date;
}

interface RetentionPolicy {
  retentionDays: number;
  action: 'delete' | 'anonymize';
}

interface CleanupReport {
  processedUsers: number;
  deletedRecords: Record<string, number>;
  anonymizedRecords: Record<string, number>;
  errors: string[];
  completedAt: Date;
}

// Singleton instance
let dataMinimizationServiceInstance: DataMinimizationService | null = null;

export function getDataMinimizationService(): DataMinimizationService {
  if (!dataMinimizationServiceInstance) {
    dataMinimizationServiceInstance = new DataMinimizationService();
  }
  return dataMinimizationServiceInstance;
}

export function resetDataMinimizationService(): void {
  dataMinimizationServiceInstance = null;
}