import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from './useTranslation';
import { culturalContentService } from '../services/culturalContentService';
import { culturalValidationService } from '../services/culturalValidation';
import { CulturalUserPreferences } from '../components/cultural/CulturalPreferences';

export interface AdaptedContent {
  original: string;
  adapted: string;
  culturallyAppropriate: boolean;
  adaptations: string[];
}

export interface CulturalContentHook {
  adaptContent: (content: string) => AdaptedContent;
  getCulturalNames: (count?: number) => string[];
  getCulturalLocations: () => string[];
  getCulturalScenarios: (count?: number) => any[];
  getUIPreferences: () => any;
  validateContent: (content: string) => any;
  preferences: CulturalUserPreferences | null;
  updatePreferences: (prefs: CulturalUserPreferences) => void;
  isLoading: boolean;
}

/**
 * Hook for managing cultural content adaptation
 */
export const useCulturalContent = (): CulturalContentHook => {
  const { currentLanguage } = useTranslation();
  const [preferences, setPreferences] = useState<CulturalUserPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load preferences from localStorage on mount
  useEffect(() => {
    const loadPreferences = () => {
      try {
        const stored = localStorage.getItem('cultural-preferences');
        if (stored) {
          const parsed = JSON.parse(stored);
          setPreferences(parsed);
        } else {
          // Set default preferences based on current language
          const culturalContent = culturalContentService.getCulturalContent(currentLanguage);
          if (culturalContent) {
            setPreferences({
              language: currentLanguage,
              region: culturalContent.region,
              colorScheme: culturalContent.preferences.colors,
              communicationStyle: culturalContent.communication.formality,
              contentExamples: 'local',
              culturalAdaptation: true,
              respectCulturalNorms: true
            });
          }
        }
      } catch (error) {
        console.error('Failed to load cultural preferences:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPreferences();
  }, [currentLanguage]);

  // Update preferences when language changes
  useEffect(() => {
    if (preferences && preferences.language !== currentLanguage) {
      const culturalContent = culturalContentService.getCulturalContent(currentLanguage);
      if (culturalContent) {
        const updatedPreferences = {
          ...preferences,
          language: currentLanguage,
          region: culturalContent.region,
          colorScheme: culturalContent.preferences.colors,
          communicationStyle: culturalContent.communication.formality
        };
        setPreferences(updatedPreferences);
        localStorage.setItem('cultural-preferences', JSON.stringify(updatedPreferences));
      }
    }
  }, [currentLanguage, preferences]);

  /**
   * Adapt content based on cultural preferences
   */
  const adaptContent = useCallback((content: string): AdaptedContent => {
    if (!preferences || !preferences.culturalAdaptation) {
      return {
        original: content,
        adapted: content,
        culturallyAppropriate: true,
        adaptations: []
      };
    }

    const adaptations: string[] = [];
    let adaptedContent = content;

    // Apply communication style adaptation
    if (preferences.communicationStyle !== 'mixed') {
      const originalContent = adaptedContent;
      adaptedContent = culturalContentService.adaptContentTone(adaptedContent, currentLanguage);
      if (originalContent !== adaptedContent) {
        adaptations.push(`Adjusted tone to ${preferences.communicationStyle}`);
      }
    }

    // Replace generic names with cultural names if using local examples
    if (preferences.contentExamples === 'local') {
      const culturalNames = getCulturalNames(6);
      const genericNames = ['John', 'Jane', 'User', 'Person', 'Someone'];
      
      genericNames.forEach((genericName, index) => {
        if (adaptedContent.includes(genericName) && culturalNames[index]) {
          adaptedContent = adaptedContent.replace(new RegExp(genericName, 'g'), culturalNames[index]);
          adaptations.push(`Replaced ${genericName} with ${culturalNames[index]}`);
        }
      });
    }

    // Replace generic locations with cultural locations
    if (preferences.contentExamples === 'local') {
      const culturalLocations = getCulturalLocations();
      const genericLocations = ['store', 'shop', 'office', 'center'];
      
      genericLocations.forEach((genericLocation, index) => {
        if (adaptedContent.includes(genericLocation) && culturalLocations[index]) {
          adaptedContent = adaptedContent.replace(new RegExp(genericLocation, 'g'), culturalLocations[index]);
          adaptations.push(`Replaced ${genericLocation} with ${culturalLocations[index]}`);
        }
      });
    }

    // Validate cultural appropriateness
    const validation = validateContent(adaptedContent);

    return {
      original: content,
      adapted: adaptedContent,
      culturallyAppropriate: validation.appropriate,
      adaptations
    };
  }, [preferences, currentLanguage]);

  /**
   * Get culturally appropriate names
   */
  const getCulturalNames = useCallback((count: number = 6): string[] => {
    if (!preferences || preferences.contentExamples === 'global') {
      return ['User', 'Person', 'Individual', 'Someone', 'Learner', 'Student'];
    }

    return culturalContentService.getCulturalNames(currentLanguage, count);
  }, [preferences, currentLanguage]);

  /**
   * Get culturally appropriate locations
   */
  const getCulturalLocations = useCallback((): string[] => {
    if (!preferences || preferences.contentExamples === 'global') {
      return ['community center', 'library', 'store', 'office'];
    }

    return culturalContentService.getCulturalLocations(currentLanguage);
  }, [preferences, currentLanguage]);

  /**
   * Get culturally appropriate scenarios
   */
  const getCulturalScenarios = useCallback((count: number = 10): any[] => {
    if (!preferences || preferences.contentExamples === 'global') {
      return []; // Return generic scenarios
    }

    return culturalContentService.generateSeniorScenarios(currentLanguage, count);
  }, [preferences, currentLanguage]);

  /**
   * Get age-appropriate scenarios for seniors
   */
  const getAgeAppropriateScenarios = useCallback((difficulty: 'beginner' | 'intermediate' | 'advanced' = 'beginner') => {
    return culturalContentService.generateAgeAppropriateScenarios(currentLanguage, difficulty);
  }, [currentLanguage]);

  /**
   * Get regional content information
   */
  const getRegionalContent = useCallback(() => {
    return culturalContentService.getRegionalContent(currentLanguage);
  }, [currentLanguage]);

  /**
   * Get layout preferences for UI adaptation
   */
  const getLayoutPreferences = useCallback(() => {
    return culturalContentService.getLayoutPreferences(currentLanguage);
  }, [currentLanguage]);

  /**
   * Adapt content for cultural context beyond language
   */
  const adaptForCulturalContext = useCallback((content: string, contentType: 'tutorial' | 'example' | 'scenario' = 'tutorial') => {
    return culturalContentService.adaptForCulturalContext(content, currentLanguage, contentType);
  }, [currentLanguage]);

  /**
   * Get UI preferences based on cultural context
   */
  const getUIPreferences = useCallback(() => {
    if (!preferences) {
      return {
        colorScheme: ['blue', 'gray', 'white'],
        preferredSymbols: ['✓', '→', '📞'],
        communicationStyle: { formality: 'mixed', directness: 'direct', honorifics: false }
      };
    }

    return culturalContentService.getUIPreferences(currentLanguage);
  }, [preferences, currentLanguage]);

  /**
   * Validate content for cultural appropriateness
   */
  const validateContent = useCallback((content: string) => {
    if (!preferences || !preferences.respectCulturalNorms) {
      return { appropriate: true, issues: [], suggestions: [] };
    }

    return culturalContentService.validateCulturalAppropriateness(content, currentLanguage);
  }, [preferences, currentLanguage]);

  /**
   * Update cultural preferences
   */
  const updatePreferences = useCallback((newPreferences: CulturalUserPreferences) => {
    setPreferences(newPreferences);
    localStorage.setItem('cultural-preferences', JSON.stringify(newPreferences));
  }, []);

  return {
    adaptContent,
    getCulturalNames,
    getCulturalLocations,
    getCulturalScenarios,
    getAgeAppropriateScenarios,
    getRegionalContent,
    getLayoutPreferences,
    adaptForCulturalContext,
    getUIPreferences,
    validateContent,
    preferences,
    updatePreferences,
    isLoading
  };
};

/**
 * Hook for cultural color validation
 */
export const useCulturalColors = () => {
  const { currentLanguage } = useTranslation();

  const validateColor = useCallback((color: string): boolean => {
    return culturalValidationService.isColorAppropriate(color, currentLanguage);
  }, [currentLanguage]);

  const getColorAlternatives = useCallback((color: string): string[] => {
    return culturalValidationService.getColorAlternatives(color, currentLanguage);
  }, [currentLanguage]);

  const getAppropriateColors = useCallback(() => {
    return culturalValidationService.getAppropriateColors(currentLanguage);
  }, [currentLanguage]);

  return {
    validateColor,
    getColorAlternatives,
    getAppropriateColors
  };
};

/**
 * Hook for cultural symbol validation
 */
export const useCulturalSymbols = () => {
  const { currentLanguage } = useTranslation();

  const validateSymbol = useCallback((symbol: string): boolean => {
    return culturalValidationService.isSymbolAppropriate(symbol, currentLanguage);
  }, [currentLanguage]);

  const getSymbolAlternatives = useCallback((symbol: string): string[] => {
    return culturalValidationService.getSymbolAlternatives(symbol, currentLanguage);
  }, [currentLanguage]);

  const getAppropriateSymbols = useCallback(() => {
    return culturalValidationService.getAppropriateSymbols(currentLanguage);
  }, [currentLanguage]);

  return {
    validateSymbol,
    getSymbolAlternatives,
    getAppropriateSymbols
  };
};