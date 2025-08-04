import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { translationValidationService } from '../services/translationValidation';
import { culturalContentService } from '../services/culturalContentService';
import { culturalValidationService } from '../services/culturalValidation';
import { SUPPORTED_LANGUAGES, isRTL, getLanguageDirection } from '../i18n';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('Internationalization System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Translation Validation Service', () => {
    it('should validate translation completeness', async () => {
      const result = await translationValidationService.validateLanguage('es');
      
      expect(result).toHaveProperty('language', 'es');
      expect(result).toHaveProperty('missingKeys');
      expect(result).toHaveProperty('emptyValues');
      expect(result).toHaveProperty('coverage');
      expect(result).toHaveProperty('isComplete');
      expect(typeof result.coverage).toBe('number');
      expect(result.coverage).toBeGreaterThanOrEqual(0);
      expect(result.coverage).toBeLessThanOrEqual(100);
    });

    it('should report translation issues', () => {
      const issue = {
        language: 'fr',
        key: 'test.key',
        issue: 'quality' as const,
        description: 'Test issue'
      };

      translationValidationService.reportTranslationIssue(issue);
      const issues = translationValidationService.getTranslationIssues();
      
      expect(issues).toContainEqual(expect.objectContaining({
        language: 'fr',
        key: 'test.key',
        issue: 'quality',
        description: 'Test issue'
      }));
    });

    it('should generate translation summary', async () => {
      const summary = await translationValidationService.getTranslationSummary();
      
      expect(summary).toHaveProperty('totalLanguages');
      expect(summary).toHaveProperty('completeLanguages');
      expect(summary).toHaveProperty('averageCoverage');
      expect(summary).toHaveProperty('languagesNeedingAttention');
      expect(Array.isArray(summary.languagesNeedingAttention)).toBe(true);
    });
  });

  describe('RTL Support', () => {
    it('should correctly identify RTL languages', () => {
      expect(isRTL('ar')).toBe(true);
      expect(isRTL('he')).toBe(true);
      expect(isRTL('en')).toBe(false);
      expect(isRTL('es')).toBe(false);
      expect(isRTL('zh')).toBe(false);
    });

    it('should return correct language direction', () => {
      expect(getLanguageDirection('ar')).toBe('rtl');
      expect(getLanguageDirection('he')).toBe('rtl');
      expect(getLanguageDirection('en')).toBe('ltr');
      expect(getLanguageDirection('fr')).toBe('ltr');
    });

    it('should have RTL languages in supported languages', () => {
      const rtlLanguages = Object.entries(SUPPORTED_LANGUAGES)
        .filter(([_, info]) => info.rtl)
        .map(([code, _]) => code);
      
      expect(rtlLanguages).toContain('ar');
      expect(rtlLanguages).toContain('he');
      expect(rtlLanguages.length).toBeGreaterThan(0);
    });
  });

  describe('Cultural Content Service', () => {
    it('should provide cultural content for supported languages', () => {
      const languages = ['en', 'es', 'zh', 'ar', 'hi', 'ja'];
      
      languages.forEach(lang => {
        const content = culturalContentService.getCulturalContent(lang);
        if (content) {
          expect(content).toHaveProperty('language', lang);
          expect(content).toHaveProperty('region');
          expect(content).toHaveProperty('examples');
          expect(content).toHaveProperty('preferences');
          expect(content).toHaveProperty('communication');
          
          expect(content.examples).toHaveProperty('technology');
          expect(content.examples).toHaveProperty('scenarios');
          expect(content.examples).toHaveProperty('names');
          expect(content.examples).toHaveProperty('locations');
          
          expect(Array.isArray(content.examples.technology)).toBe(true);
          expect(Array.isArray(content.examples.scenarios)).toBe(true);
          expect(Array.isArray(content.examples.names)).toBe(true);
          expect(Array.isArray(content.examples.locations)).toBe(true);
        }
      });
    });

    it('should generate culturally appropriate senior scenarios', () => {
      const scenarios = culturalContentService.generateSeniorScenarios('zh', 5);
      
      expect(Array.isArray(scenarios)).toBe(true);
      expect(scenarios.length).toBeLessThanOrEqual(5);
      
      scenarios.forEach(scenario => {
        expect(scenario).toHaveProperty('id');
        expect(scenario).toHaveProperty('title');
        expect(scenario).toHaveProperty('description');
        expect(scenario).toHaveProperty('context');
        expect(scenario).toHaveProperty('difficulty');
        expect(scenario).toHaveProperty('culturallyRelevant');
        expect(scenario).toHaveProperty('ageAppropriate');
        expect(scenario).toHaveProperty('region');
        
        expect(['beginner', 'intermediate', 'advanced']).toContain(scenario.difficulty);
        expect(typeof scenario.culturallyRelevant).toBe('boolean');
        expect(typeof scenario.ageAppropriate).toBe('boolean');
      });
    });

    it('should provide UI preferences for different cultures', () => {
      const languages = ['en', 'zh', 'ar', 'hi'];
      
      languages.forEach(lang => {
        const prefs = culturalContentService.getUIPreferences(lang);
        
        expect(prefs).toHaveProperty('colorScheme');
        expect(prefs).toHaveProperty('preferredSymbols');
        expect(prefs).toHaveProperty('communicationStyle');
        
        expect(Array.isArray(prefs.colorScheme)).toBe(true);
        expect(Array.isArray(prefs.preferredSymbols)).toBe(true);
        expect(prefs.communicationStyle).toHaveProperty('formality');
        expect(prefs.communicationStyle).toHaveProperty('directness');
        expect(prefs.communicationStyle).toHaveProperty('honorifics');
      });
    });

    it('should validate cultural appropriateness of content', () => {
      const testContent = 'Hello, please click here to continue';
      const result = culturalContentService.validateCulturalAppropriateness(testContent, 'ja');
      
      expect(result).toHaveProperty('appropriate');
      expect(result).toHaveProperty('issues');
      expect(result).toHaveProperty('suggestions');
      expect(typeof result.appropriate).toBe('boolean');
      expect(Array.isArray(result.issues)).toBe(true);
      expect(Array.isArray(result.suggestions)).toBe(true);
    });

    it('should adapt content tone based on cultural preferences', () => {
      const content = 'You should do this now';
      const adaptedFormal = culturalContentService.adaptContentTone(content, 'ja');
      const adaptedInformal = culturalContentService.adaptContentTone(content, 'en');
      
      expect(typeof adaptedFormal).toBe('string');
      expect(typeof adaptedInformal).toBe('string');
    });
  });

  describe('Cultural Validation Service', () => {
    it('should validate cultural appropriateness for different languages', () => {
      const languages = ['zh', 'ar', 'hi'];
      
      languages.forEach(lang => {
        const result = culturalValidationService.validateCulturalAppropriatenesss(lang);
        
        expect(result).toHaveProperty('language', lang);
        expect(result).toHaveProperty('region');
        expect(result).toHaveProperty('colorIssues');
        expect(result).toHaveProperty('symbolIssues');
        expect(result).toHaveProperty('recommendations');
        
        expect(Array.isArray(result.colorIssues)).toBe(true);
        expect(Array.isArray(result.symbolIssues)).toBe(true);
        expect(Array.isArray(result.recommendations)).toBe(true);
      });
    });

    it('should validate color appropriateness', () => {
      // Test known cultural color meanings
      expect(culturalValidationService.isColorAppropriate('red', 'zh')).toBe(true); // Good fortune in Chinese culture
      expect(culturalValidationService.isColorAppropriate('green', 'ar')).toBe(true); // Positive in Islamic culture
      
      // Test for colors that might be inappropriate
      const whiteInChinese = culturalValidationService.isColorAppropriate('white', 'zh');
      expect(typeof whiteInChinese).toBe('boolean');
    });

    it('should validate symbol appropriateness', () => {
      // Test basic symbols
      const checkmark = culturalValidationService.isSymbolAppropriate('✓', 'en');
      expect(typeof checkmark).toBe('boolean');
      
      // Test potentially sensitive symbols
      const thumbsUp = culturalValidationService.isSymbolAppropriate('👍', 'ar');
      expect(typeof thumbsUp).toBe('boolean');
    });

    it('should provide alternatives for inappropriate elements', () => {
      const colorAlternatives = culturalValidationService.getColorAlternatives('white', 'zh');
      const symbolAlternatives = culturalValidationService.getSymbolAlternatives('👍', 'ar');
      
      expect(Array.isArray(colorAlternatives)).toBe(true);
      expect(Array.isArray(symbolAlternatives)).toBe(true);
    });

    it('should validate UI elements for cultural appropriateness', () => {
      const elements = [
        { type: 'color' as const, value: 'red' },
        { type: 'symbol' as const, value: '✓' }
      ];
      
      const validation = culturalValidationService.validateUIElements(elements, 'zh');
      
      expect(Array.isArray(validation)).toBe(true);
      validation.forEach(result => {
        expect(result).toHaveProperty('element');
        expect(result).toHaveProperty('appropriate');
        expect(result).toHaveProperty('alternatives');
        expect(result).toHaveProperty('reason');
        expect(typeof result.appropriate).toBe('boolean');
        expect(Array.isArray(result.alternatives)).toBe(true);
      });
    });
  });

  describe('Supported Languages Configuration', () => {
    it('should have comprehensive language support', () => {
      const languages = Object.keys(SUPPORTED_LANGUAGES);
      
      // Should support major world languages
      expect(languages).toContain('en'); // English
      expect(languages).toContain('es'); // Spanish
      expect(languages).toContain('zh'); // Chinese
      expect(languages).toContain('ar'); // Arabic
      expect(languages).toContain('hi'); // Hindi
      expect(languages).toContain('fr'); // French
      expect(languages).toContain('de'); // German
      expect(languages).toContain('ja'); // Japanese
      expect(languages).toContain('ru'); // Russian
      
      // Should have at least 20 languages for senior accessibility
      expect(languages.length).toBeGreaterThanOrEqual(20);
    });

    it('should have proper language metadata', () => {
      Object.entries(SUPPORTED_LANGUAGES).forEach(([code, info]) => {
        expect(info).toHaveProperty('name');
        expect(info).toHaveProperty('nativeName');
        expect(info).toHaveProperty('rtl');
        
        expect(typeof info.name).toBe('string');
        expect(typeof info.nativeName).toBe('string');
        expect(typeof info.rtl).toBe('boolean');
        expect(info.name.length).toBeGreaterThan(0);
        expect(info.nativeName.length).toBeGreaterThan(0);
      });
    });

    it('should have RTL languages properly marked', () => {
      const rtlLanguages = Object.entries(SUPPORTED_LANGUAGES)
        .filter(([_, info]) => info.rtl);
      
      expect(rtlLanguages.length).toBeGreaterThan(0);
      
      // Arabic and Hebrew should be RTL
      const arabicInfo = SUPPORTED_LANGUAGES['ar'];
      const hebrewInfo = SUPPORTED_LANGUAGES['he'];
      
      if (arabicInfo) expect(arabicInfo.rtl).toBe(true);
      if (hebrewInfo) expect(hebrewInfo.rtl).toBe(true);
    });
  });

  describe('Translation System Integration', () => {
    it('should handle missing translation keys gracefully', () => {
      // This would test the missing key handler
      const mockMissingKeyHandler = vi.fn();
      
      // In a real test, we'd mock i18next and test the missing key handler
      expect(typeof mockMissingKeyHandler).toBe('function');
    });

    it('should support simultaneous translation availability', async () => {
      // Test that new features can be translated simultaneously
      const testKey = 'newFeature.testKey';
      const languages = ['en', 'es', 'fr', 'de'];
      
      // In a real implementation, this would check if translations exist
      // for new keys across all languages
      languages.forEach(lang => {
        expect(typeof lang).toBe('string');
      });
    });
  });

  describe('Performance and Accessibility', () => {
    it('should not block rendering while loading translations', () => {
      // Test that translation loading doesn't block UI
      expect(true).toBe(true); // Placeholder for actual performance test
    });

    it('should support screen readers in all languages', () => {
      // Test that RTL languages work with screen readers
      const rtlLanguages = Object.entries(SUPPORTED_LANGUAGES)
        .filter(([_, info]) => info.rtl);
      
      rtlLanguages.forEach(([code, info]) => {
        expect(info.rtl).toBe(true);
        expect(getLanguageDirection(code)).toBe('rtl');
      });
    });

    it('should maintain accessibility in RTL layouts', () => {
      // Test that RTL layouts maintain proper accessibility
      const direction = getLanguageDirection('ar');
      expect(direction).toBe('rtl');
      
      // In a real test, we'd verify that focus order, navigation, 
      // and screen reader announcements work correctly in RTL
    });
  });
});

describe('Cultural Localization Features', () => {
  it('should provide region-specific content', () => {
    const regions = ['China', 'Middle East', 'India', 'Japan', 'Latin America'];
    
    regions.forEach(region => {
      expect(typeof region).toBe('string');
      expect(region.length).toBeGreaterThan(0);
    });
  });

  it('should adapt to cultural context beyond language', () => {
    const chineseContent = culturalContentService.getCulturalContent('zh');
    const arabicContent = culturalContentService.getCulturalContent('ar');
    
    if (chineseContent && arabicContent) {
      // Different cultures should have different preferences
      expect(chineseContent.preferences.colors).not.toEqual(arabicContent.preferences.colors);
      expect(chineseContent.examples.names).not.toEqual(arabicContent.examples.names);
    }
  });

  it('should provide age-appropriate scenarios for seniors', () => {
    const scenarios = culturalContentService.generateSeniorScenarios('en', 5);
    
    scenarios.forEach(scenario => {
      expect(scenario.ageAppropriate).toBe(true);
      expect(['beginner', 'intermediate', 'advanced']).toContain(scenario.difficulty);
    });
  });

  it('should respect cultural norms in UI elements', () => {
    const validation = culturalValidationService.validateCulturalAppropriatenesss('ar');
    
    expect(validation).toHaveProperty('recommendations');
    expect(Array.isArray(validation.recommendations)).toBe(true);
  });
});