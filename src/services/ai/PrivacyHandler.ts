// Privacy Handler for AI Service - Ensures no PII is sent to AI models
export class PrivacyHandler {
  private static readonly PII_PATTERNS = [
    // Email patterns
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    // Phone number patterns (various formats)
    /(\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/g,
    // Social Security Number patterns
    /\b\d{3}-?\d{2}-?\d{4}\b/g,
    // Credit card patterns (basic)
    /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
    // Address patterns (basic street addresses)
    /\b\d+\s+[A-Za-z0-9\s]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd|Court|Ct|Place|Pl)\b/gi,
    // ZIP codes
    /\b\d{5}(?:-\d{4})?\b/g
  ];

  private static readonly SENSITIVE_KEYWORDS = [
    'password', 'ssn', 'social security', 'credit card', 'bank account',
    'routing number', 'pin', 'security code', 'cvv', 'date of birth',
    'birthday', 'medicare', 'medicaid', 'insurance'
  ];

  /**
   * Sanitizes user input by removing or masking PII before sending to AI
   */
  static sanitizeUserInput(input: string): string {
    let sanitized = input;

    // Remove PII patterns
    this.PII_PATTERNS.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '[REDACTED]');
    });

    // Check for sensitive keywords and warn
    const lowerInput = sanitized.toLowerCase();
    this.SENSITIVE_KEYWORDS.forEach(keyword => {
      if (lowerInput.includes(keyword)) {
        // Replace the context around sensitive keywords
        const regex = new RegExp(`\\b[^\\s]*${keyword}[^\\s]*\\b`, 'gi');
        sanitized = sanitized.replace(regex, '[SENSITIVE_INFO]');
      }
    });

    return sanitized;
  }

  /**
   * Validates that no PII is present in the input
   */
  static validateNoPII(input: string): { isValid: boolean; violations: string[] } {
    const violations: string[] = [];

    // Check for PII patterns
    this.PII_PATTERNS.forEach((pattern, index) => {
      if (pattern.test(input)) {
        violations.push(`PII pattern detected (type ${index + 1})`);
      }
    });

    // Check for sensitive keywords
    const lowerInput = input.toLowerCase();
    this.SENSITIVE_KEYWORDS.forEach(keyword => {
      if (lowerInput.includes(keyword)) {
        violations.push(`Sensitive keyword detected: ${keyword}`);
      }
    });

    return {
      isValid: violations.length === 0,
      violations
    };
  }

  /**
   * Anonymizes conversation context for AI processing
   */
  static anonymizeContext(context: any): any {
    const anonymized = { ...context };

    // Remove user identifiers
    delete anonymized.userId;
    delete anonymized.email;
    delete anonymized.name;
    delete anonymized.personalInfo;

    // Sanitize any string fields
    Object.keys(anonymized).forEach(key => {
      if (typeof anonymized[key] === 'string') {
        anonymized[key] = this.sanitizeUserInput(anonymized[key]);
      }
    });

    return anonymized;
  }

  /**
   * Creates a privacy-safe conversation summary for quality tracking
   */
  static createPrivacySafeSummary(conversation: any[]): any {
    return conversation.map(message => ({
      timestamp: message.timestamp,
      sender: message.sender,
      messageLength: message.content?.length || 0,
      containedPII: !this.validateNoPII(message.content || '').isValid,
      // Don't include actual content in summary
      contentHash: this.hashContent(message.content || '')
    }));
  }

  /**
   * Encrypts sensitive data for storage
   */
  static encryptForStorage(data: string): string {
    // In a real implementation, use proper encryption
    // For now, we'll use base64 encoding as a placeholder
    try {
      return btoa(data);
    } catch (error) {
      console.error('Encryption failed:', error);
      return data;
    }
  }

  /**
   * Decrypts data from storage
   */
  static decryptFromStorage(encryptedData: string): string {
    // In a real implementation, use proper decryption
    // For now, we'll use base64 decoding as a placeholder
    try {
      return atob(encryptedData);
    } catch (error) {
      console.error('Decryption failed:', error);
      return encryptedData;
    }
  }

  /**
   * Creates a hash of content for tracking without storing actual content
   */
  private static hashContent(content: string): string {
    // Simple hash function for demonstration
    // In production, use a proper cryptographic hash
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  /**
   * Checks if user has consented to AI data usage
   */
  static hasAIConsent(userPreferences: any): boolean {
    return userPreferences?.privacy?.allowAITraining === true;
  }

  /**
   * Logs privacy violations for monitoring
   */
  static logPrivacyViolation(violation: string, context: any): void {
    console.warn('Privacy violation detected:', violation);
    
    // In a real implementation, this would send to a secure logging service
    // without including the actual violating content
    const logEntry = {
      timestamp: new Date().toISOString(),
      violation,
      contextType: typeof context,
      // Don't log the actual context to avoid storing PII
      hasContext: !!context
    };
    
    // Send to secure logging service
    console.log('Privacy violation logged:', logEntry);
  }

  /**
   * Generates privacy-compliant error messages
   */
  static getPrivacyErrorMessage(violationType: string): string {
    const messages = {
      'pii_detected': "I notice you may have shared personal information. For your privacy and security, I can't process messages containing personal details like email addresses, phone numbers, or other sensitive information. Please rephrase your question without including personal details.",
      
      'sensitive_info': "For your security, I can't help with questions involving passwords, account numbers, or other sensitive information. If you need help with account-related issues, please contact our support team directly.",
      
      'consent_required': "To provide AI assistance, we need your consent to process your messages. You can update your privacy preferences in your account settings.",
      
      'default': "I'm unable to process your message due to privacy and security guidelines. Please rephrase your question or contact our support team for assistance."
    };

    return messages[violationType] || messages['default'];
  }
}