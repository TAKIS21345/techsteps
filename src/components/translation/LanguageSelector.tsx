import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES, getLanguageDirection } from '../../i18n';

interface LanguageSelectorProps {
  className?: string;
  showNativeNames?: boolean;
  compact?: boolean;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  className = '',
  showNativeNames = true,
  compact = false
}) => {
  const { i18n, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const currentLanguage = i18n.language;
  const currentLangInfo = SUPPORTED_LANGUAGES[currentLanguage as keyof typeof SUPPORTED_LANGUAGES];

  // Filter languages based on search term
  const filteredLanguages = Object.entries(SUPPORTED_LANGUAGES).filter(([code, info]) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      info.name.toLowerCase().includes(searchLower) ||
      info.nativeName.toLowerCase().includes(searchLower) ||
      code.toLowerCase().includes(searchLower)
    );
  });

  // Sort languages: current first, then alphabetically by native name
  const sortedLanguages = filteredLanguages.sort(([codeA, infoA], [codeB, infoB]) => {
    if (codeA === currentLanguage) return -1;
    if (codeB === currentLanguage) return 1;
    return infoA.nativeName.localeCompare(infoB.nativeName);
  });

  const handleLanguageChange = async (languageCode: string) => {
    try {
      await i18n.changeLanguage(languageCode);
      setIsOpen(false);
      setSearchTerm('');
      
      // Update document direction and language
      const direction = getLanguageDirection(languageCode);
      document.documentElement.dir = direction;
      document.documentElement.lang = languageCode;
      
      // Announce language change to screen readers
      const langInfo = SUPPORTED_LANGUAGES[languageCode as keyof typeof SUPPORTED_LANGUAGES];
      const announcement = t('accessibility.languageChanged', 'Language changed to {{language}}', {
        language: langInfo.nativeName
      });
      
      // Create temporary announcement element
      const announcer = document.createElement('div');
      announcer.setAttribute('aria-live', 'polite');
      announcer.setAttribute('aria-atomic', 'true');
      announcer.className = 'sr-only';
      announcer.textContent = announcement;
      document.body.appendChild(announcer);
      
      setTimeout(() => {
        document.body.removeChild(announcer);
      }, 1000);
      
    } catch (error) {
      console.error('Failed to change language:', error);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      setIsOpen(false);
      setSearchTerm('');
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        className={`
          flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-md 
          hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          ${compact ? 'text-sm' : 'text-base'}
        `}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={t('language.selectLanguage', 'Select language')}
      >
        <div className="flex items-center gap-2 min-w-0">
          {/* Language flag or indicator */}
          <div className={`
            flex-shrink-0 w-5 h-5 rounded-full border border-gray-200 flex items-center justify-center text-xs font-medium
            ${currentLangInfo?.rtl ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'}
          `}>
            {currentLanguage.toUpperCase()}
          </div>
          
          <div className="flex flex-col items-start min-w-0">
            {showNativeNames && (
              <span className="font-medium truncate">
                {currentLangInfo?.nativeName || currentLanguage}
              </span>
            )}
            {!compact && (
              <span className="text-sm text-gray-500 truncate">
                {currentLangInfo?.name || currentLanguage}
              </span>
            )}
          </div>
        </div>
        
        <svg 
          className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-50 max-h-80 overflow-hidden">
          {/* Search input */}
          <div className="p-3 border-b border-gray-200">
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('language.searchLanguages', 'Search languages...')}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              onKeyDown={handleKeyDown}
            />
          </div>

          {/* Language list */}
          <div className="max-h-60 overflow-y-auto" role="listbox">
            {sortedLanguages.length === 0 ? (
              <div className="px-3 py-4 text-sm text-gray-500 text-center">
                {t('language.noLanguagesFound', 'No languages found')}
              </div>
            ) : (
              sortedLanguages.map(([code, info]) => (
                <button
                  key={code}
                  onClick={() => handleLanguageChange(code)}
                  className={`
                    w-full px-3 py-3 text-left hover:bg-gray-50 focus:outline-none focus:bg-gray-50
                    flex items-center gap-3 border-b border-gray-100 last:border-b-0
                    ${code === currentLanguage ? 'bg-blue-50 text-blue-900' : 'text-gray-900'}
                  `}
                  role="option"
                  aria-selected={code === currentLanguage}
                  dir={info.rtl ? 'rtl' : 'ltr'}
                >
                  {/* Language indicator */}
                  <div className={`
                    flex-shrink-0 w-6 h-6 rounded-full border flex items-center justify-center text-xs font-medium
                    ${info.rtl ? 'bg-orange-100 text-orange-800 border-orange-200' : 'bg-blue-100 text-blue-800 border-blue-200'}
                    ${code === currentLanguage ? 'ring-2 ring-blue-500' : ''}
                  `}>
                    {code.toUpperCase()}
                  </div>

                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="font-medium truncate">
                      {info.nativeName}
                    </span>
                    <span className="text-sm text-gray-500 truncate">
                      {info.name}
                    </span>
                  </div>

                  {/* RTL indicator */}
                  {info.rtl && (
                    <span className="flex-shrink-0 text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                      RTL
                    </span>
                  )}

                  {/* Current language indicator */}
                  {code === currentLanguage && (
                    <svg className="flex-shrink-0 w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))
            )}
          </div>

          {/* Footer with translation reporting */}
          <div className="p-3 border-t border-gray-200 bg-gray-50">
            <p className="text-xs text-gray-600 mb-2">
              {t('language.translationQuality', 'Help us improve translations')}
            </p>
            <button
              onClick={() => setIsOpen(false)}
              className="text-xs text-blue-600 hover:text-blue-800 underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
            >
              {t('language.reportIssue', 'Report translation issue')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;