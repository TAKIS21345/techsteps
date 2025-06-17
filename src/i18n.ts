import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpApi from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

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
    // Supported languages
    supportedLngs: ['en', 'es', 'fr', 'hi'],
    debug: false, // Turn off in production
    interpolation: {
      escapeValue: false, // React already safes from xss
    },
    // Options for language detection
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
    // Where to look for translation files
    backend: {
      loadPath: '/locales/{{lng}}/translation.json',
    },
  });

export default i18n;