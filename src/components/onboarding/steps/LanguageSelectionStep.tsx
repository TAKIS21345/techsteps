import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useOnboardingState } from '../../../hooks/useOnboardingState';
import { Input } from '../../design-system/Input';
import { Button } from '../../design-system/Button';
import { Typography } from '../../design-system/Typography';
import { Search, Globe, Check, AlertTriangle } from 'lucide-react';

interface LanguageSelectionStepProps {
  data: any;
  updateData: (updates: any) => void;
}

export const LanguageSelectionStep: React.FC<LanguageSelectionStepProps> = ({ data, updateData }) => {
  const { t, i18n } = useTranslation();
  const { errors } = useOnboardingState({ stepIndex: 1 });
  const [languageSearch, setLanguageSearch] = useState('');
  const [showLanguageWarning, setShowLanguageWarning] = useState(false);

  // Comprehensive language list with native names
  const allLanguages = [
    { code: 'en', name: 'English', nativeName: 'English', region: 'Global' },
    { code: 'es', name: 'Spanish', nativeName: 'Español', region: 'Spain/Latin America' },
    { code: 'fr', name: 'French', nativeName: 'Français', region: 'France/Canada' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', region: 'India' },
    { code: 'de', name: 'German', nativeName: 'Deutsch', region: 'Germany/Austria' },
    { code: 'it', name: 'Italian', nativeName: 'Italiano', region: 'Italy' },
    { code: 'pt', name: 'Portuguese', nativeName: 'Português', region: 'Brazil/Portugal' },
    { code: 'zh', name: 'Chinese', nativeName: '中文', region: 'China/Taiwan' },
    { code: 'ja', name: 'Japanese', nativeName: '日本語', region: 'Japan' },
    { code: 'ko', name: 'Korean', nativeName: '한국어', region: 'Korea' },
    { code: 'ar', name: 'Arabic', nativeName: 'العربية', region: 'Middle East/North Africa' },
    { code: 'ru', name: 'Russian', nativeName: 'Русский', region: 'Russia/Eastern Europe' },
    { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', region: 'Netherlands/Belgium' },
    { code: 'sv', name: 'Swedish', nativeName: 'Svenska', region: 'Sweden' },
    { code: 'no', name: 'Norwegian', nativeName: 'Norsk', region: 'Norway' },
    { code: 'da', name: 'Danish', nativeName: 'Dansk', region: 'Denmark' },
    { code: 'fi', name: 'Finnish', nativeName: 'Suomi', region: 'Finland' },
    { code: 'pl', name: 'Polish', nativeName: 'Polski', region: 'Poland' },
    { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', region: 'Turkey' },
    { code: 'he', name: 'Hebrew', nativeName: 'עברית', region: 'Israel' },
  ];

  // Filter languages based on search
  const filteredLanguages = allLanguages.filter(lang =>
    lang.name.toLowerCase().includes(languageSearch.toLowerCase()) ||
    lang.nativeName.toLowerCase().includes(languageSearch.toLowerCase()) ||
    lang.region.toLowerCase().includes(languageSearch.toLowerCase())
  );

  const selectedLanguages = data.preferredLanguages || [i18n.language];

  const handleLanguageToggle = (languageCode: string) => {
    let newLanguages: string[];
    
    if (selectedLanguages.includes(languageCode)) {
      // Don't allow removing the last language
      if (selectedLanguages.length === 1) {
        setShowLanguageWarning(true);
        return;
      }
      newLanguages = selectedLanguages.filter((code: string) => code !== languageCode);
    } else {
      newLanguages = [...selectedLanguages, languageCode];
    }
    
    updateData({ preferredLanguages: newLanguages });
    setShowLanguageWarning(false);
  };

  const handleSelectAllLanguages = () => {
    const allCodes = allLanguages.map(lang => lang.code);
    updateData({ preferredLanguages: allCodes });
    setShowLanguageWarning(false);
  };

  const handleDeselectAllLanguages = () => {
    updateData({ preferredLanguages: [i18n.language] }); // Always keep current language as minimum
  };

  return (
    <div className="space-y-6" data-testid="language-selection-step">
      {/* Information Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start space-x-3">
          <Globe className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <Typography variant="body" className="font-medium text-blue-800 mb-1">
              {t('onboarding.step2.languageSelection')}
            </Typography>
            <Typography variant="body-sm" className="text-blue-700 mb-2">
              {t('onboarding.step2.languageDescription')}
            </Typography>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• {t('onboarding.step2.speechToText')}</li>
              <li>• {t('onboarding.step2.textInteractions')}</li>
              <li>• {t('onboarding.step2.interfaceOptions')}</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Search and Controls */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            value={languageSearch}
            onChange={(e) => setLanguageSearch(e.target.value)}
            placeholder={t('onboarding.step2.searchLanguages')}
            className="pl-10"
            size="lg"
            data-testid="language-search"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="secondary"
            size="md"
            onClick={handleSelectAllLanguages}
            className="flex-1 sm:flex-none"
            data-testid="select-all-languages"
          >
            {t('onboarding.step2.selectAll')}
          </Button>
          <Button
            variant="secondary"
            size="md"
            onClick={handleDeselectAllLanguages}
            className="flex-1 sm:flex-none"
            data-testid="deselect-all-languages"
          >
            {t('onboarding.step2.deselectAll')}
          </Button>
        </div>

        <Typography variant="body-sm" color="secondary">
          {t('onboarding.step2.selected', { count: selectedLanguages.length })}
        </Typography>
      </div>

      {/* Language Grid */}
      <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-xl">
        <div className="grid grid-cols-1 gap-0">
          {filteredLanguages.map((lang) => (
            <button
              key={lang.code}
              type="button"
              onClick={() => handleLanguageToggle(lang.code)}
              className={`
                p-4 text-left border-b border-gray-100 last:border-b-0 
                hover:bg-gray-50 transition-colors
                ${selectedLanguages.includes(lang.code)
                  ? 'bg-blue-50 border-l-4 border-l-blue-500'
                  : ''
                }
              `}
              data-testid={`language-option-${lang.code}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center sm:space-x-3">
                    <Typography variant="body" className="font-medium text-gray-800">
                      {lang.nativeName}
                    </Typography>
                    <Typography variant="body-sm" color="secondary">
                      {lang.name}
                    </Typography>
                  </div>
                  <Typography variant="caption" color="secondary" className="mt-1">
                    {lang.region}
                  </Typography>
                </div>
                {selectedLanguages.includes(lang.code) && (
                  <Check className="w-5 h-5 text-blue-600" />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* No Results */}
      {filteredLanguages.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Globe className="w-8 h-8 mx-auto mb-2 text-gray-300" />
          <Typography variant="body" color="secondary">
            {t('onboarding.step2.noLanguagesFound', { search: languageSearch })}
          </Typography>
        </div>
      )}

      {/* Warning Messages */}
      {showLanguageWarning && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <Typography variant="body" className="font-medium text-amber-800 mb-1">
                {t('onboarding.step2.languageRequired')}
              </Typography>
              <Typography variant="body-sm" className="text-amber-700">
                {t('onboarding.step2.languageRequiredDesc')}
              </Typography>
            </div>
          </div>
        </div>
      )}

      {/* Validation Errors */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              {errors.map((error, index) => (
                <Typography key={index} variant="body-sm" className="text-red-700">
                  {error}
                </Typography>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};