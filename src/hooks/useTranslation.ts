import { useTranslation as useI18nextTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { SUPPORTED_LANGUAGES, isRTL, getLanguageDirection } from '../i18n';
import { translationValidationService } from '../services/translationValidation';

export interface ExtendedTranslationHook {
  t: (key: string, defaultValueOrOptions?: string | object, options?: any) => any;
  i18n: any;
  ready: boolean;
  currentLanguage: string;
  isRTL: boolean;
  direction: 'ltr' | 'rtl';
  languageInfo: typeof SUPPORTED_LANGUAGES[keyof typeof SUPPORTED_LANGUAGES] | undefined;
  changeLanguage: (language: string) => Promise<void>;
  reportTranslationIssue: (key: string, issue: string) => void;
  getSafeTranslation: (key: string, fallback: string, options?: any) => any;
}

/**
 * Enhanced useTranslation hook with RTL support and translation validation
 */
export const useTranslation = (namespace?: string): ExtendedTranslationHook => {
  const { t: originalT, i18n, ready } = useI18nextTranslation(namespace);
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language);

  const languageInfo = SUPPORTED_LANGUAGES[currentLanguage as keyof typeof SUPPORTED_LANGUAGES];
  const isCurrentRTL = isRTL(currentLanguage);
  const direction = getLanguageDirection(currentLanguage);

  // Enhanced translation function with fallback and validation
  const getSafeTranslation = (key: string, fallback: string, options?: any): any => {
    try {
      const translation = originalT(key, fallback, options);

      // Check if translation is missing or empty
      if (!translation || translation === key) {
        // Report missing translation
        translationValidationService.reportTranslationIssue({
          language: currentLanguage,
          key,
          issue: 'missing',
          description: `Missing translation for key: ${key}`
        });
        return fallback;
      }

      return translation;
    } catch (error) {
      console.error(`Translation error for key ${key}:`, error);
      return fallback;
    }
  };

  // Wrapper for the original t function with validation
  const t = (key: string, defaultValueOrOptions?: string | object, options?: any): any => {
    let defaultValue: string | undefined;
    let actualOptions = options;

    if (typeof defaultValueOrOptions === 'object') {
      actualOptions = defaultValueOrOptions;
      defaultValue = undefined;
    } else {
      defaultValue = defaultValueOrOptions as string;
    }

    return getSafeTranslation(key, defaultValue || key, actualOptions);
  };

  // Enhanced language change function
  const changeLanguage = async (language: string): Promise<void> => {
    try {
      await i18n.changeLanguage(language);
      setCurrentLanguage(language);

      // Update document attributes
      const newDirection = getLanguageDirection(language);
      document.documentElement.dir = newDirection;
      document.documentElement.lang = language;

      // Update page title if it exists
      const titleElement = document.querySelector('title');
      if (titleElement) {
        const newTitle = t('meta.title', 'Senior Learning Platform');
        titleElement.textContent = newTitle;
      }

      // Dispatch custom event for other components to react to language change
      window.dispatchEvent(new CustomEvent('languageChanged', {
        detail: { language, direction: newDirection, isRTL: isRTL(language) }
      }));

    } catch (error) {
      console.error('Failed to change language:', error);
      throw error;
    }
  };

  // Report translation issue
  const reportTranslationIssue = (key: string, issue: string): void => {
    translationValidationService.reportTranslationIssue({
      language: currentLanguage,
      key,
      issue: 'quality',
      description: issue
    });
  };

  // Listen for language changes
  useEffect(() => {
    const handleLanguageChanged = () => {
      setCurrentLanguage(i18n.language);
    };

    i18n.on('languageChanged', handleLanguageChanged);
    return () => {
      i18n.off('languageChanged', handleLanguageChanged);
    };
  }, [i18n]);

  // Set initial document direction
  useEffect(() => {
    if (ready) {
      document.documentElement.dir = direction;
      document.documentElement.lang = currentLanguage;
    }
  }, [ready, direction, currentLanguage]);

  return {
    t,
    i18n,
    ready,
    currentLanguage,
    isRTL: isCurrentRTL,
    direction,
    languageInfo,
    changeLanguage,
    reportTranslationIssue,
    getSafeTranslation
  };
};

/**
 * Hook for managing RTL-specific styles and animations
 */
export const useRTLStyles = () => {
  const { isRTL, direction } = useTranslation();

  const getRTLStyle = (ltrStyle: any, rtlStyle: any) => {
    return isRTL ? rtlStyle : ltrStyle;
  };

  const getDirectionalValue = (ltr: any, rtl: any) => {
    return isRTL ? rtl : ltr;
  };

  // Animation direction helpers
  const getAnimationDirection = (baseDirection: 'left' | 'right' | 'normal') => {
    if (baseDirection === 'normal') return baseDirection;
    if (!isRTL) return baseDirection;
    return baseDirection === 'left' ? 'right' : 'left';
  };

  // Transform helpers for RTL
  const getTransform = (transform: string) => {
    if (!isRTL) return transform;

    // Flip translateX values
    return transform.replace(/translateX\(([^)]+)\)/g, (_match, value) => {
      if (value.includes('-')) {
        return `translateX(${value.replace('-', '')})`;
      } else {
        return `translateX(-${value})`;
      }
    });
  };

  return {
    isRTL,
    direction,
    getRTLStyle,
    getDirectionalValue,
    getAnimationDirection,
    getTransform
  };
};