import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpApi from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

// RTL languages that require right-to-left layout
export const RTL_LANGUAGES = ['ar', 'he'];

// All supported languages with their display names and RTL status
export const SUPPORTED_LANGUAGES = {
  'en': { name: 'English', nativeName: 'English', rtl: false },
  'es': { name: 'Spanish', nativeName: 'Español', rtl: false },
  'fr': { name: 'French', nativeName: 'Français', rtl: false },
  'de': { name: 'German', nativeName: 'Deutsch', rtl: false },
  'it': { name: 'Italian', nativeName: 'Italiano', rtl: false },
  'pt': { name: 'Portuguese', nativeName: 'Português', rtl: false },
  'ru': { name: 'Russian', nativeName: 'Русский', rtl: false },
  'zh': { name: 'Chinese', nativeName: '中文', rtl: false },
  'ja': { name: 'Japanese', nativeName: '日本語', rtl: false },
  'ko': { name: 'Korean', nativeName: '한국어', rtl: false },
  'ar': { name: 'Arabic', nativeName: 'العربية', rtl: true },
  'he': { name: 'Hebrew', nativeName: 'עברית', rtl: true },
  'hi': { name: 'Hindi', nativeName: 'हिन्दी', rtl: false },
  'th': { name: 'Thai', nativeName: 'ไทย', rtl: false },
  'vi': { name: 'Vietnamese', nativeName: 'Tiếng Việt', rtl: false },
  'tr': { name: 'Turkish', nativeName: 'Türkçe', rtl: false },
  'pl': { name: 'Polish', nativeName: 'Polski', rtl: false },
  'nl': { name: 'Dutch', nativeName: 'Nederlands', rtl: false },
  'sv': { name: 'Swedish', nativeName: 'Svenska', rtl: false },
  'no': { name: 'Norwegian', nativeName: 'Norsk', rtl: false },
  'da': { name: 'Danish', nativeName: 'Dansk', rtl: false },
  'fi': { name: 'Finnish', nativeName: 'Suomi', rtl: false },
  'hu': { name: 'Hungarian', nativeName: 'Magyar', rtl: false },
  'cs': { name: 'Czech', nativeName: 'Čeština', rtl: false },
  'sk': { name: 'Slovak', nativeName: 'Slovenčina', rtl: false },
  'sl': { name: 'Slovenian', nativeName: 'Slovenščina', rtl: false },
  'hr': { name: 'Croatian', nativeName: 'Hrvatski', rtl: false },
  'bg': { name: 'Bulgarian', nativeName: 'Български', rtl: false },
  'ro': { name: 'Romanian', nativeName: 'Română', rtl: false },
  'et': { name: 'Estonian', nativeName: 'Eesti', rtl: false },
  'lv': { name: 'Latvian', nativeName: 'Latviešu', rtl: false },
  'lt': { name: 'Lithuanian', nativeName: 'Lietuvių', rtl: false },
  'uk': { name: 'Ukrainian', nativeName: 'Українська', rtl: false }
};

// Translation validation and reporting system
export const translationReporting = {
  reportIssue: (language: string, key: string, issue: string) => {
    console.warn(`Translation issue reported for ${language}:${key} - ${issue}`);
    // In production, this would send to a reporting service
    if (typeof window !== 'undefined' && window.localStorage) {
      const reports = JSON.parse(localStorage.getItem('translation-reports') || '[]');
      reports.push({
        language,
        key,
        issue,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent
      });
      localStorage.setItem('translation-reports', JSON.stringify(reports));
    }
  },
  
  getReports: () => {
    if (typeof window !== 'undefined' && window.localStorage) {
      return JSON.parse(localStorage.getItem('translation-reports') || '[]');
    }
    return [];
  }
};

// Check if a language is RTL
export const isRTL = (language: string): boolean => {
  return RTL_LANGUAGES.includes(language);
};

// Get language direction for CSS
export const getLanguageDirection = (language: string): 'ltr' | 'rtl' => {
  return isRTL(language) ? 'rtl' : 'ltr';
};

i18n
  // Load translations from a server (the /public folder)
  .use(HttpApi)
  // Detect user language
  .use(LanguageDetector)
  // Pass the i18n instance to react-i18next.
  .use(initReactI18next)
  .init({
    // The default language
    fallbackLng: 'en',
    // Supported languages - all languages with translation files
    supportedLngs: Object.keys(SUPPORTED_LANGUAGES),
    debug: process.env.NODE_ENV === 'development',
    interpolation: {
      escapeValue: false, // React already safes from xss
    },
    // Enable returning objects for arrays in translations
    returnObjects: true,
    // Options for language detection
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
    // Where to look for translation files
    backend: {
      loadPath: '/locales/{{lng}}/translation.json',
      // Add error handling for missing translations
      requestOptions: {
        cache: 'default'
      }
    },
    // Missing key handler for translation validation
    missingKeyHandler: (lng, ns, key) => {
      translationReporting.reportIssue(lng, key, 'Missing translation key');
    },
    // Save missing translations for reporting
    saveMissing: process.env.NODE_ENV === 'development',
    // Namespace configuration
    defaultNS: 'translation',
    ns: ['translation'],
    // React specific options
    react: {
      useSuspense: false // Avoid suspense for better senior user experience
    }
  });

// Set document direction based on current language
i18n.on('languageChanged', (lng) => {
  const direction = getLanguageDirection(lng);
  document.documentElement.dir = direction;
  document.documentElement.lang = lng;
});

export default i18n;