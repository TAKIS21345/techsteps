import { SUPPORTED_LANGUAGES } from '../i18n';

export interface TranslationValidationResult {
  language: string;
  missingKeys: string[];
  emptyValues: string[];
  coverage: number;
  isComplete: boolean;
}

export interface TranslationIssue {
  language: string;
  key: string;
  issue: 'missing' | 'empty' | 'quality' | 'cultural';
  description: string;
  timestamp: string;
  reportedBy?: string;
}

class TranslationValidationService {
  private baseLanguage = 'en';
  private validationCache = new Map<string, TranslationValidationResult>();

  /**
   * Validate translation completeness for a specific language
   */
  async validateLanguage(language: string): Promise<TranslationValidationResult> {
    try {
      // Load base language (English) for comparison
      const baseTranslations = await this.loadTranslations(this.baseLanguage);
      const targetTranslations = await this.loadTranslations(language);

      const baseKeys = this.flattenObject(baseTranslations);
      const targetKeys = this.flattenObject(targetTranslations);

      const missingKeys: string[] = [];
      const emptyValues: string[] = [];

      // Check for missing keys and empty values
      Object.keys(baseKeys).forEach(key => {
        if (!(key in targetKeys)) {
          missingKeys.push(key);
        } else if (!targetKeys[key] || targetKeys[key].trim() === '') {
          emptyValues.push(key);
        }
      });

      const totalKeys = Object.keys(baseKeys).length;
      const translatedKeys = totalKeys - missingKeys.length - emptyValues.length;
      const coverage = totalKeys > 0 ? (translatedKeys / totalKeys) * 100 : 0;

      const result: TranslationValidationResult = {
        language,
        missingKeys,
        emptyValues,
        coverage,
        isComplete: coverage === 100
      };

      this.validationCache.set(language, result);
      return result;
    } catch (error) {
      console.error(`Failed to validate translations for ${language}:`, error);
      return {
        language,
        missingKeys: [],
        emptyValues: [],
        coverage: 0,
        isComplete: false
      };
    }
  }

  /**
   * Validate all supported languages
   */
  async validateAllLanguages(): Promise<TranslationValidationResult[]> {
    const results: TranslationValidationResult[] = [];
    
    for (const language of Object.keys(SUPPORTED_LANGUAGES)) {
      if (language !== this.baseLanguage) {
        const result = await this.validateLanguage(language);
        results.push(result);
      }
    }

    return results;
  }

  /**
   * Report a translation quality issue
   */
  reportTranslationIssue(issue: Omit<TranslationIssue, 'timestamp'>): void {
    const fullIssue: TranslationIssue = {
      ...issue,
      timestamp: new Date().toISOString()
    };

    // Store in localStorage for now (in production, would send to backend)
    const existingIssues = this.getStoredIssues();
    existingIssues.push(fullIssue);
    
    try {
      localStorage.setItem('translation-issues', JSON.stringify(existingIssues));
      console.log('Translation issue reported:', fullIssue);
    } catch (error) {
      console.error('Failed to store translation issue:', error);
    }
  }

  /**
   * Get all reported translation issues
   */
  getTranslationIssues(): TranslationIssue[] {
    return this.getStoredIssues();
  }

  /**
   * Clear all reported issues (for admin use)
   */
  clearTranslationIssues(): void {
    try {
      localStorage.removeItem('translation-issues');
    } catch (error) {
      console.error('Failed to clear translation issues:', error);
    }
  }

  /**
   * Get translation coverage summary
   */
  async getTranslationSummary(): Promise<{
    totalLanguages: number;
    completeLanguages: number;
    averageCoverage: number;
    languagesNeedingAttention: string[];
  }> {
    const results = await this.validateAllLanguages();
    const completeLanguages = results.filter(r => r.isComplete).length;
    const averageCoverage = results.reduce((sum, r) => sum + r.coverage, 0) / results.length;
    const languagesNeedingAttention = results
      .filter(r => r.coverage < 95)
      .map(r => r.language);

    return {
      totalLanguages: results.length,
      completeLanguages,
      averageCoverage,
      languagesNeedingAttention
    };
  }

  /**
   * Load translations from public folder
   */
  private async loadTranslations(language: string): Promise<any> {
    try {
      const response = await fetch(`/locales/${language}/translation.json`);
      if (!response.ok) {
        throw new Error(`Failed to load translations for ${language}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error loading translations for ${language}:`, error);
      return {};
    }
  }

  /**
   * Flatten nested object to dot notation keys
   */
  private flattenObject(obj: any, prefix = ''): Record<string, string> {
    const flattened: Record<string, string> = {};

    Object.keys(obj).forEach(key => {
      const value = obj[key];
      const newKey = prefix ? `${prefix}.${key}` : key;

      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        Object.assign(flattened, this.flattenObject(value, newKey));
      } else {
        flattened[newKey] = String(value);
      }
    });

    return flattened;
  }

  /**
   * Get stored issues from localStorage
   */
  private getStoredIssues(): TranslationIssue[] {
    try {
      const stored = localStorage.getItem('translation-issues');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to retrieve stored translation issues:', error);
      return [];
    }
  }
}

export const translationValidationService = new TranslationValidationService();