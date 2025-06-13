import React, { useState } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { useLanguage, Language } from '../contexts/LanguageContext';

interface LanguageSelectorProps {
  className?: string;
  showLabel?: boolean;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ 
  className = '', 
  showLabel = true 
}) => {
  const { language, setLanguage, t, getSupportedLanguages } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  
  const supportedLanguages = getSupportedLanguages();
  const currentLanguage = supportedLanguages.find(lang => lang.code === language);

  // Enhanced language data with flags and regions
  const languageFlags: Record<Language, string> = {
    en: '🇺🇸',
    es: '🇪🇸', 
    fr: '🇫🇷',
    de: '🇩🇪',
    it: '🇮🇹',
    pt: '🇧🇷',
    zh: '🇨🇳',
    ja: '🇯🇵',
    ko: '🇰🇷',
    ar: '🇸🇦',
    ru: '🇷🇺',
    hi: '🇮🇳',
    nl: '🇳🇱',
    sv: '🇸🇪',
    no: '🇳🇴',
    da: '🇩🇰',
    fi: '🇫🇮',
    pl: '🇵🇱',
    tr: '🇹🇷',
    he: '🇮🇱',
    th: '🇹🇭',
    vi: '🇻🇳',
    uk: '🇺🇦',
    cs: '🇨🇿',
    hu: '🇭🇺',
    ro: '🇷🇴',
    bg: '🇧🇬',
    hr: '🇭🇷',
    sk: '🇸🇰',
    sl: '🇸🇮',
    et: '🇪🇪',
    lv: '🇱🇻',
    lt: '🇱🇹'
  };

  const handleLanguageChange = (newLanguage: Language) => {
    setLanguage(newLanguage);
    setIsOpen(false);
    
    // Save preference immediately
    localStorage.setItem('preferredLanguage', newLanguage);
    
    // Announce language change for screen readers
    const announcement = `Language changed to ${supportedLanguages.find(l => l.code === newLanguage)?.name}`;
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
          {languageFlags[language] || '🌐'}
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
                Choose your preferred language for the interface
              </p>
            </div>
            
            <div className="py-2 max-h-80 overflow-y-auto">
              {supportedLanguages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center justify-between group focus:outline-none focus:bg-blue-50 ${
                    language === lang.code ? 'bg-blue-50 text-blue-700 border-r-4 border-blue-500' : 'text-gray-700'
                  }`}
                  role="option"
                  aria-selected={language === lang.code}
                  tabIndex={0}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-xl" role="img" aria-label="flag">
                      {languageFlags[lang.code] || '🌐'}
                    </span>
                    <div>
                      <div className={`font-medium ${language === lang.code ? 'text-blue-800' : 'text-gray-800'}`}>
                        {lang.nativeName}
                      </div>
                      <div className={`text-xs ${language === lang.code ? 'text-blue-600' : 'text-gray-500'}`}>
                        {lang.name} • {lang.code.toUpperCase()}
                      </div>
                    </div>
                  </div>
                  {language === lang.code && (
                    <Check className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>

            <div className="p-3 border-t border-gray-100 bg-gray-50">
              <p className="text-xs text-gray-500 text-center">
                🌍 More languages coming soon
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default LanguageSelector;