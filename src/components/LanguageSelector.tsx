import React, { useState } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTranslationAnimation } from '../contexts/TranslationAnimationContext'; // Import the hook

interface LanguageSelectorProps {
  className?: string;
  showLabel?: boolean;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  className = '',
  showLabel = true
}) => {
  const { i18n, t } = useTranslation();
  const { triggerTranslationAnimation } = useTranslationAnimation(); // Use the hook
  const [isOpen, setIsOpen] = useState(false);

  const supportedLanguages = [
    { code: 'en', name: 'English', nativeName: 'English', rtl: false },
    { code: 'es', name: 'Spanish', nativeName: 'Español', rtl: false },
    { code: 'fr', name: 'French', nativeName: 'Français', rtl: false },
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', rtl: false },
    { code: 'zh', name: 'Chinese', nativeName: '中文', rtl: false },
    { code: 'cs', name: 'Czech', nativeName: 'Čeština', rtl: false },
    { code: 'hr', name: 'Croatian', nativeName: 'Hrvatski', rtl: false },
    { code: 'et', name: 'Estonian', nativeName: 'Eesti', rtl: false },
    { code: 'ar', name: 'Arabic', nativeName: 'العربية', rtl: true },
    { code: 'bg', name: 'Bulgarian', nativeName: 'Български', rtl: false },
    { code: 'da', name: 'Danish', nativeName: 'Dansk', rtl: false },
    { code: 'de', name: 'German', nativeName: 'Deutsch', rtl: false },
    { code: 'fi', name: 'Finnish', nativeName: 'Suomi', rtl: false },
    { code: 'he', name: 'Hebrew', nativeName: 'עברית', rtl: true },
    { code: 'hu', name: 'Hungarian', nativeName: 'Magyar', rtl: false },
    { code: 'it', name: 'Italian', nativeName: 'Italiano', rtl: false },
    { code: 'ja', name: 'Japanese', nativeName: '日本語', rtl: false },
    { code: 'ko', name: 'Korean', nativeName: '한국어', rtl: false },
    { code: 'lt', name: 'Lithuanian', nativeName: 'Lietuvių', rtl: false },
    { code: 'lv', name: 'Latvian', nativeName: 'Latviešu', rtl: false },
    { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', rtl: false },
    { code: 'no', name: 'Norwegian', nativeName: 'Norsk', rtl: false },
    { code: 'pl', name: 'Polish', nativeName: 'Polski', rtl: false },
    { code: 'pt', name: 'Portuguese', nativeName: 'Português', rtl: false },
    { code: 'ro', name: 'Romanian', nativeName: 'Română', rtl: false },
    { code: 'ru', name: 'Russian', nativeName: 'Русский', rtl: false },
    { code: 'sk', name: 'Slovak', nativeName: 'Slovenčina', rtl: false },
    { code: 'sl', name: 'Slovenian', nativeName: 'Slovenščina', rtl: false },
    { code: 'sv', name: 'Swedish', nativeName: 'Svenska', rtl: false },
    { code: 'th', name: 'Thai', nativeName: 'ไทย', rtl: false },
    { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', rtl: false },
    { code: 'uk', name: 'Ukrainian', nativeName: 'Українська', rtl: false },
    { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', rtl: false }
  ];

  const currentLanguage = supportedLanguages.find(lang => lang.code === i18n.language);

  // Enhanced language data with flags and regions
  const languageFlags: Record<string, string> = {
    en: '🇺🇸',
    es: '🇪🇸',
    fr: '🇫🇷',
    hi: '🇮🇳',
    zh: '🇨🇳',
    cs: '🇨🇿',
    hr: '🇭🇷',
    et: '🇪🇪',
    ar: '🇸🇦',
    bg: '🇧🇬',
    da: '🇩🇰',
    de: '🇩🇪',
    fi: '🇫🇮',
    he: '🇮🇱',
    hu: '🇭🇺',
    it: '🇮🇹',
    ja: '🇯🇵',
    ko: '🇰🇷',
    lt: '🇱🇹',
    lv: '🇱🇻',
    nl: '🇳🇱',
    no: '🇳🇴',
    pl: '🇵🇱',
    pt: '🇵🇹',
    ro: '🇷🇴',
    ru: '🇷🇺',
    sk: '🇸🇰',
    sl: '🇸🇮',
    sv: '🇸🇪',
    th: '🇹🇭',
    tr: '🇹🇷',
    uk: '🇺🇦',
    vi: '🇻🇳'
  };

  const handleLanguageChange = async (newLanguage: string) => {
    const selectedLang = supportedLanguages.find(l => l.code === newLanguage);

    // Don't allow RTL languages to be selected
    if (selectedLang?.rtl) {
      return;
    }

    await triggerTranslationAnimation(async () => {
      await i18n.changeLanguage(newLanguage);
    });
    setIsOpen(false);

    // Announce language change for screen readers
    // This should ideally happen AFTER the language has actually changed and content is updated.
    // The i18next 'languageChanged' event listener in App.tsx is a better place for global announcements,
    // or this announcement needs to be delayed until after the change is fully processed.
    // For now, keeping it here, but it might announce in the old language.
    const announcement = `Language changed to ${selectedLang?.name}`;
    const ariaLive = document.createElement('div');
    ariaLive.setAttribute('aria-live', 'polite');
    ariaLive.setAttribute('aria-atomic', 'true');
    ariaLive.className = 'sr-only';
    ariaLive.textContent = announcement;
    document.body.appendChild(ariaLive);
    setTimeout(() => document.body.removeChild(ariaLive), 1000);
  };

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.language-selector')) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      setIsOpen(false);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setIsOpen(!isOpen);
    }
  };

  return (
    <div className={`relative language-selector ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        aria-label={t('language.select')}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        type="button"
      >
        <span className="text-lg" role="img" aria-label="flag">
          {languageFlags[i18n.language] || '🌐'}
        </span>
        <Globe className="w-4 h-4" />
        {showLabel && (
          <>
            <span className="text-sm font-medium hidden sm:inline">
              {currentLanguage?.nativeName || 'English'}
            </span>
            <span className="text-xs text-gray-500 hidden md:inline">
              ({currentLanguage?.code.toUpperCase()})
            </span>
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </>
        )}
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Dropdown */}
          <div
            className="absolute top-full left-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 max-h-96 overflow-hidden"
            role="listbox"
            aria-label={t('language.select')}
          >
            <div className="p-4 border-b border-gray-100 bg-gray-50">
              <h3 className="text-sm font-semibold text-gray-800 flex items-center">
                <Globe className="w-4 h-4 mr-2" />
                {t('language.select')}
              </h3>
              <p className="text-xs text-gray-600 mt-1">
                {t('languageSelector.choosePrompt')}
              </p>
            </div>

            <div className="py-2 max-h-80 overflow-y-auto">
              {supportedLanguages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  disabled={lang.rtl}
                  className={`w-full px-4 py-3 text-left transition-colors flex items-center justify-between group focus:outline-none ${lang.rtl
                    ? 'cursor-not-allowed opacity-60 bg-gray-50'
                    : 'hover:bg-gray-50 focus:bg-blue-50'
                    } ${i18n.language === lang.code ? 'bg-blue-50 text-blue-700 border-r-4 border-blue-500' : 'text-gray-700'
                    }`}
                  role="option"
                  aria-selected={i18n.language === lang.code}
                  aria-disabled={lang.rtl}
                  tabIndex={lang.rtl ? -1 : 0}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-xl" role="img" aria-label="flag">
                      {languageFlags[lang.code] || '🌐'}
                    </span>
                    <div>
                      <div className={`font-medium ${i18n.language === lang.code ? 'text-blue-800' : 'text-gray-800'}`}>
                        {lang.nativeName}
                      </div>
                      <div className={`text-xs ${i18n.language === lang.code ? 'text-blue-600' : 'text-gray-500'}`}>
                        {lang.name} • {lang.code.toUpperCase()}
                        {lang.rtl && (
                          <span className="ml-2 px-2 py-0.5 bg-orange-100 text-orange-800 rounded text-xs font-medium">
                            Coming Soon
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {i18n.language === lang.code && !lang.rtl && (
                    <Check className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  )}
                  {lang.rtl && (
                    <span className="text-xs text-orange-600 font-medium">RTL</span>
                  )}
                </button>
              ))}
            </div>

            <div className="p-3 border-t border-gray-100 bg-gray-50">
              <p className="text-xs text-gray-500 text-center">
                {t('languageSelector.moreComingSoon')}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default LanguageSelector;