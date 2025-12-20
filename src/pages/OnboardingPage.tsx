import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { ChevronLeft, ChevronRight, Search, Globe, Check, AlertTriangle } from 'lucide-react';
import Logo from '../components/layout/Logo';
import { useTranslation } from 'react-i18next';
import Cookies from 'js-cookie';

const OnboardingPage: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [languageSearch, setLanguageSearch] = useState('');
  const [showLanguageWarning, setShowLanguageWarning] = useState(false);
  const { t, i18n } = useTranslation();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    age: 65,
    os: 'Windows Computer',
    techExperience: 'beginner' as const,
    primaryConcerns: [] as string[],
    assistiveNeeds: [] as string[],
    communicationStyle: 'simple' as const,
    selectedLanguages: [i18n.language] as string[],
    preferences: {
      textToSpeech: true,
      voiceInput: true,
      theme: 'light' as const,
      fontSize: 'normal' as const,
      highContrast: false,
      videoRecommendations: true,
      speechLanguages: [i18n.language] as string[]
    },
    dataPersonalization: {
      allowPersonalization: false,
      useConversationHistory: false,
      usePreferences: false
    }
  });
  const [loading, setLoading] = useState(false);

  const { userData, updateUserData } = useUser();
  const navigate = useNavigate();

  // Redirect to dashboard if onboarding is already completed
  useEffect(() => {
    if (userData && userData.onboardingCompleted) {
      navigate('/dashboard', { replace: true });
    }
  }, [userData, navigate]);

  // Comprehensive language list with native names including Hindi
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
    { code: 'th', name: 'Thai', nativeName: 'ไทย', region: 'Thailand' },
    { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', region: 'Vietnam' },
    { code: 'uk', name: 'Ukrainian', nativeName: 'Українська', region: 'Ukraine' },
    { code: 'cs', name: 'Czech', nativeName: 'Čeština', region: 'Czech Republic' },
    { code: 'hu', name: 'Hungarian', nativeName: 'Magyar', region: 'Hungary' },
    { code: 'ro', name: 'Romanian', nativeName: 'Română', region: 'Romania' },
    { code: 'bg', name: 'Bulgarian', nativeName: 'Български', region: 'Bulgaria' },
    { code: 'hr', name: 'Croatian', nativeName: 'Hrvatski', region: 'Croatia' },
    { code: 'sk', name: 'Slovak', nativeName: 'Slovenčina', region: 'Slovakia' },
    { code: 'sl', name: 'Slovenian', nativeName: 'Slovenščina', region: 'Slovenia' },
    { code: 'et', name: 'Estonian', nativeName: 'Eesti', region: 'Estonia' },
    { code: 'lv', name: 'Latvian', nativeName: 'Latviešu', region: 'Latvia' },
    { code: 'lt', name: 'Lithuanian', nativeName: 'Lietuvių', region: 'Lithuania' }
  ];

  // Filter languages based on search
  const filteredLanguages = allLanguages.filter(lang =>
    lang.name.toLowerCase().includes(languageSearch.toLowerCase()) ||
    lang.nativeName.toLowerCase().includes(languageSearch.toLowerCase()) ||
    lang.region.toLowerCase().includes(languageSearch.toLowerCase())
  );

  const handleLanguageToggle = (languageCode: string) => {
    setFormData(prev => {
      const currentLanguages = prev.selectedLanguages;
      let newLanguages: string[];

      if (currentLanguages.includes(languageCode)) {
        // Don't allow removing the last language
        if (currentLanguages.length === 1) {
          return prev;
        }
        newLanguages = currentLanguages.filter(code => code !== languageCode);
      } else {
        newLanguages = [...currentLanguages, languageCode];
      }

      return {
        ...prev,
        selectedLanguages: newLanguages,
        preferences: {
          ...prev.preferences,
          speechLanguages: newLanguages
        }
      };
    });
    setShowLanguageWarning(false);
  };

  const handleSelectAllLanguages = () => {
    const allCodes = allLanguages.map(lang => lang.code);
    setFormData(prev => ({
      ...prev,
      selectedLanguages: allCodes,
      preferences: {
        ...prev.preferences,
        speechLanguages: allCodes
      }
    }));
    setShowLanguageWarning(false);
  };

  const handleDeselectAllLanguages = () => {
    setFormData(prev => ({
      ...prev,
      selectedLanguages: [i18n.language], // Always keep current language as minimum
      preferences: {
        ...prev.preferences,
        speechLanguages: [i18n.language]
      }
    }));
  };

  const steps = [
    {
      title: t('onboarding.step1.title'),
      subtitle: t('onboarding.step1.subtitle'),
      content: (
        <div className="space-y-6">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
              {t('onboarding.step1.firstName')}
            </label>
            <input
              type="text"
              id="firstName"
              value={formData.firstName}
              onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
              placeholder={t('onboarding.step1.firstNamePlaceholder')}
              className="input-field text-lg"
              autoFocus
            />
          </div>
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
              {t('onboarding.step1.lastName')}
            </label>
            <input
              type="text"
              id="lastName"
              value={formData.lastName}
              onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
              placeholder={t('onboarding.step1.lastNamePlaceholder')}
              className="input-field text-lg"
            />
          </div>
          <div>
            <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-2">
              {t('onboarding.step1.age')}
            </label>
            <input
              type="number"
              id="age"
              min="50"
              max="100"
              value={formData.age}
              onChange={(e) => setFormData(prev => ({ ...prev, age: parseInt(e.target.value) || 65 }))}
              className="input-field text-lg"
            />
          </div>
        </div>
      )
    },
    {
      title: t('onboarding.step2.title'),
      subtitle: t('onboarding.step2.subtitle'),
      content: (
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 sm:p-4">
            <div className="flex items-start space-x-2 sm:space-x-3">
              <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 mt-0.5" />
              <div>
                <h2 className="font-medium text-blue-800 mb-1 text-base sm:text-lg">{t('onboarding.step2.languageSelection')}</h2>
                <p className="text-xs sm:text-sm text-blue-700">
                  {t('onboarding.step2.languageDescription')}
                </p>
                <ul className="text-xs sm:text-sm text-blue-700 mt-1 sm:mt-2 space-y-0.5 sm:space-y-1">
                  <li>• {t('onboarding.step2.speechToText')}</li>
                  <li>• {t('onboarding.step2.textInteractions')}</li>
                  <li>• {t('onboarding.step2.interfaceOptions')}</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Search and Controls */}
          <div className="space-y-3 sm:space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={languageSearch}
                onChange={(e) => setLanguageSearch(e.target.value)}
                placeholder={t('onboarding.step2.searchLanguages')}
                className="input-field pl-10 text-sm sm:text-base"
              />
            </div>

            <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-3">
              <button
                type="button"
                onClick={handleSelectAllLanguages}
                className="btn-secondary text-xs sm:text-sm px-3 py-1.5 sm:px-4 sm:py-2 w-full sm:w-auto"
              >
                {t('onboarding.step2.selectAll')}
              </button>
              <button
                type="button"
                onClick={handleDeselectAllLanguages}
                className="btn-secondary text-xs sm:text-sm px-3 py-1.5 sm:px-4 sm:py-2 w-full sm:w-auto"
              >
                {t('onboarding.step2.deselectAll')}
              </button>
            </div>

            <div className="text-xs sm:text-sm text-gray-600">
              {t('onboarding.step2.selected', { count: formData.selectedLanguages.length })}
            </div>
          </div>

          {/* Language Grid */}
          <div className="max-h-52 sm:max-h-64 overflow-y-auto border border-gray-200 rounded-xl">
            <div className="grid grid-cols-1 gap-0">
              {filteredLanguages.map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => handleLanguageToggle(lang.code)}
                  className={`p-3 sm:p-4 text-left border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors ${formData.selectedLanguages.includes(lang.code)
                    ? 'bg-blue-50 border-l-4 border-l-blue-500'
                    : ''
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center sm:space-x-2 md:space-x-3">
                        <div className="font-medium text-gray-800 text-sm sm:text-base">
                          {lang.nativeName}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-500">
                          {lang.name}
                        </div>
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5 sm:mt-1">
                        {lang.region}
                      </div>
                    </div>
                    {formData.selectedLanguages.includes(lang.code) && (
                      <Check className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {filteredLanguages.length === 0 && (
            <div className="text-center py-6 sm:py-8 text-gray-500">
              <Globe className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm sm:text-base">{t('onboarding.step2.noLanguagesFound', { search: languageSearch })}</p>
            </div>
          )}

          {showLanguageWarning && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 sm:p-4">
              <div className="flex items-start space-x-2 sm:space-x-3">
                <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-amber-800 mb-1 text-sm sm:text-base">{t('onboarding.step2.languageRequired')}</h4>
                  <p className="text-xs sm:text-sm text-amber-700">
                    {t('onboarding.step2.languageRequiredDesc')}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )
    },
    {
      title: t('onboarding.step3.title'),
      subtitle: t('onboarding.step3.subtitle'),
      content: (
        <div className="space-y-3">
          {[
            'windowscomputer',
            'macapplecomputer',
            'iphone',
            'ipad',
            'androidphoneortablet',
            'smarttv',
            'multipledevices'
          ].map((deviceKey) => (
            <button
              key={deviceKey}
              onClick={() => setFormData(prev => ({ ...prev, os: t(`onboarding.step3.devices.${deviceKey}`) }))}
              className={`w-full p-4 rounded-xl border-2 transition-all text-left ${formData.os === t(`onboarding.step3.devices.${deviceKey}`)
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 hover:border-gray-300'
                }`}
            >
              {t(`onboarding.step3.devices.${deviceKey}`)}
            </button>
          ))}
        </div>
      )
    },
    {
      title: t('onboarding.step4.title'),
      subtitle: t('onboarding.step4.subtitle'),
      content: (
        <div className="space-y-3">
          {[
            { value: 'beginner', label: t('onboarding.step4.beginner'), desc: t('onboarding.step4.beginnerDesc') },
            { value: 'some', label: t('onboarding.step4.some'), desc: t('onboarding.step4.someDesc') },
            { value: 'comfortable', label: t('onboarding.step4.comfortable'), desc: t('onboarding.step4.comfortableDesc') }
          ].map((level) => (
            <button
              key={level.value}
              onClick={() => setFormData(prev => ({ ...prev, techExperience: level.value as any }))}
              className={`w-full p-4 rounded-xl border-2 transition-all text-left ${formData.techExperience === level.value
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 hover:border-gray-300'
                }`}
            >
              <div className="font-medium">{level.label}</div>
              <div className="text-sm text-gray-600 mt-1">{level.desc}</div>
            </button>
          ))}
        </div>
      )
    },
    {
      title: t('onboarding.step5.title'),
      subtitle: t('onboarding.step5.subtitle'),
      content: (
        <div className="grid grid-cols-1 gap-3">
          {[
            'onlineSafety',
            'passwordManagement',
            'videoCalling',
            'socialMedia',
            'onlineBanking',
            'emailMessaging',
            'photoStorage',
            'appDownloads',
            'wifiInternet',
            'deviceSettings',
            'onlineShopping',
            'healthApps'
          ].map((concern) => (
            <button
              key={concern}
              onClick={() => {
                setFormData(prev => {
                  const concernKey = `onboarding.step5.concerns.${concern}`; // Store the key
                  return {
                    ...prev,
                    primaryConcerns: prev.primaryConcerns.includes(concernKey)
                      ? prev.primaryConcerns.filter(c => c !== concernKey)
                      : [...prev.primaryConcerns, concernKey]
                  };
                });
              }}
              className={`w-full p-3 sm:p-4 rounded-xl border-2 transition-all text-left text-sm sm:text-base ${formData.primaryConcerns.includes(`onboarding.step5.concerns.${concern}`) // Check against the key
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 hover:border-gray-300'
                }`}
            >
              {t(`onboarding.step5.concerns.${concern}`)} {/* Display translated text */}
            </button>
          ))}
        </div>
      )
    },
    {
      title: t('onboarding.step6.title'),
      subtitle: t('onboarding.step6.subtitle'),
      content: (
        <div className="space-y-3 sm:space-y-4">
          <div className="grid grid-cols-1 gap-3">
            {[
              'largerText',
              'highContrast',
              'voiceCommands',
              'screenReader',
              'slowerExplanations',
              'visualSteps',
              'noneNeeded'
            ].map((need) => (
              <button
                key={need}
                onClick={() => {
                  const needKey = `onboarding.step6.needs.${need}`; // Store the key
                  const noneNeededKey = `onboarding.step6.needs.noneNeeded`;
                  setFormData(prev => {
                    let newNeeds = [...prev.assistiveNeeds];
                    if (needKey === noneNeededKey) {
                      newNeeds = newNeeds.includes(needKey) ? [] : [needKey];
                    } else {
                      if (newNeeds.includes(needKey)) {
                        newNeeds = newNeeds.filter(n => n !== needKey);
                      } else {
                        newNeeds = [...newNeeds.filter(n => n !== noneNeededKey), needKey];
                      }
                    }
                    return { ...prev, assistiveNeeds: newNeeds };
                  });
                }}
                className={`w-full p-3 sm:p-4 rounded-xl border-2 transition-all text-left text-sm sm:text-base ${formData.assistiveNeeds.includes(`onboarding.step6.needs.${need}`) // Check against the key
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300'
                  }`}
              >
                {t(`onboarding.step6.needs.${need}`)} {/* Display translated text */}
              </button>
            ))}
          </div>
        </div>
      )
    },
    {
      title: t('onboarding.step7.title'),
      subtitle: t('onboarding.step7.subtitle'),
      content: (
        <div className="space-y-3">
          {[
            { value: 'simple', label: t('onboarding.step7.simple'), desc: t('onboarding.step7.simpleDesc') },
            { value: 'detailed', label: t('onboarding.step7.detailed'), desc: t('onboarding.step7.detailedDesc') },
            { value: 'visual', label: t('onboarding.step7.visual'), desc: t('onboarding.step7.visualDesc') }
          ].map((style) => (
            <button
              key={style.value}
              onClick={() => setFormData(prev => ({ ...prev, communicationStyle: style.value as any }))}
              className={`w-full p-3 sm:p-4 rounded-xl border-2 transition-all text-left ${formData.communicationStyle === style.value
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 hover:border-gray-300'
                }`}
            >
              <div className="font-medium text-sm sm:text-base">{style.label}</div>
              <div className="text-xs sm:text-sm text-gray-600 mt-1">{style.desc}</div>
            </button>
          ))}
        </div>
      )
    },
    {
      title: t('onboarding.step8.title', 'Data Personalization'),
      subtitle: t('onboarding.step8.subtitle', 'Help us personalize your experience while keeping your privacy secure'),
      content: (
        <div className="space-y-6">
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-green-800 mb-2">{t('onboarding.step8.privacy.title')}</h3>
                <ul className="text-sm text-green-700 space-y-1">
                  {(t('onboarding.step8.privacy.items', { returnObjects: true }) as string[]).map((item, idx) => (
                    <li key={idx}>• {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="border border-gray-200 rounded-xl p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 pr-4">
                  <h3 className="font-medium text-gray-800 mb-2">{t('onboarding.step8.personalization.title')}</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    {t('onboarding.step8.personalization.description')}
                  </p>
                  <p className="text-xs text-gray-500">
                    {t('onboarding.step8.personalization.note')}
                  </p>
                </div>
                <button
                  onClick={() => setFormData(prev => ({
                    ...prev,
                    dataPersonalization: {
                      ...prev.dataPersonalization,
                      allowPersonalization: !prev.dataPersonalization.allowPersonalization
                    }
                  }))}
                  className={`w-12 h-6 rounded-full transition-colors flex-shrink-0 ${formData.dataPersonalization.allowPersonalization ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${formData.dataPersonalization.allowPersonalization ? 'translate-x-7' : 'translate-x-0.5'
                    }`} />
                </button>
              </div>
            </div>

            <div className="border border-gray-200 rounded-xl p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 pr-4">
                  <h3 className="font-medium text-gray-800 mb-2">{t('onboarding.step8.history.title')}</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    {t('onboarding.step8.history.description')}
                  </p>
                  <p className="text-xs text-gray-500">
                    {t('onboarding.step8.history.note')}
                  </p>
                </div>
                <button
                  onClick={() => setFormData(prev => ({
                    ...prev,
                    dataPersonalization: {
                      ...prev.dataPersonalization,
                      useConversationHistory: !prev.dataPersonalization.useConversationHistory
                    }
                  }))}
                  className={`w-12 h-6 rounded-full transition-colors flex-shrink-0 ${formData.dataPersonalization.useConversationHistory ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${formData.dataPersonalization.useConversationHistory ? 'translate-x-7' : 'translate-x-0.5'
                    }`} />
                </button>
              </div>
            </div>

            <div className="border border-gray-200 rounded-xl p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 pr-4">
                  <h3 className="font-medium text-gray-800 mb-2">{t('onboarding.step8.learningPrefs.title')}</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    {t('onboarding.step8.learningPrefs.description')}
                  </p>
                  <p className="text-xs text-gray-500">
                    {t('onboarding.step8.learningPrefs.note')}
                  </p>
                </div>
                <button
                  onClick={() => setFormData(prev => ({
                    ...prev,
                    dataPersonalization: {
                      ...prev.dataPersonalization,
                      usePreferences: !prev.dataPersonalization.usePreferences
                    }
                  }))}
                  className={`w-12 h-6 rounded-full transition-colors flex-shrink-0 ${formData.dataPersonalization.usePreferences ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${formData.dataPersonalization.usePreferences ? 'translate-x-7' : 'translate-x-0.5'
                    }`} />
                </button>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <AlertTriangle className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium text-blue-800 mb-1">{t('onboarding.step8.noSelection.title')}</h4>
                <p className="text-sm text-blue-700">
                  {formData.dataPersonalization.allowPersonalization ||
                    formData.dataPersonalization.useConversationHistory ||
                    formData.dataPersonalization.usePreferences
                    ? t('onboarding.step8.noSelection.success')
                    : t('onboarding.step8.noSelection.default')}
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: t('onboarding.step9.title'),
      subtitle: t('onboarding.step9.subtitle'),
      content: (
        <div className="space-y-4 sm:space-y-6">
          <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-xl">
            <div>
              <h2 className="font-medium text-base sm:text-lg">{t('onboarding.step8.textToSpeech')}</h2>
              <p className="text-xs sm:text-sm text-gray-600">{t('onboarding.step8.textToSpeechDesc')}</p>
            </div>
            <button
              onClick={() => setFormData(prev => ({
                ...prev,
                preferences: { ...prev.preferences, textToSpeech: !prev.preferences.textToSpeech }
              }))}
              className={`w-12 h-6 rounded-full transition-colors ${formData.preferences.textToSpeech ? 'bg-blue-600' : 'bg-gray-300'
                }`}
            >
              <div className={`w-5 h-5 bg-white rounded-full transition-transform ${formData.preferences.textToSpeech ? 'translate-x-7' : 'translate-x-0.5'
                }`} />
            </button>
          </div>

          <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-xl">
            <div>
              <h2 className="font-medium text-base sm:text-lg">{t('onboarding.step8.voiceInput')}</h2>
              <p className="text-xs sm:text-sm text-gray-600">{t('onboarding.step8.voiceInputDesc')}</p>
            </div>
            <button
              onClick={() => setFormData(prev => ({
                ...prev,
                preferences: { ...prev.preferences, voiceInput: !prev.preferences.voiceInput }
              }))}
              className={`w-12 h-6 rounded-full transition-colors ${formData.preferences.voiceInput ? 'bg-blue-600' : 'bg-gray-300'
                }`}
            >
              <div className={`w-5 h-5 bg-white rounded-full transition-transform ${formData.preferences.voiceInput ? 'translate-x-7' : 'translate-x-0.5'
                }`} />
            </button>
          </div>

          <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-xl">
            <div>
              <h2 className="font-medium text-base sm:text-lg">{t('onboarding.step8.videoRecommendations')}</h2>
              <p className="text-xs sm:text-sm text-gray-600">{t('onboarding.step8.videoRecommendationsDesc')}</p>
            </div>
            <button
              onClick={() => setFormData(prev => ({
                ...prev,
                preferences: { ...prev.preferences, videoRecommendations: !prev.preferences.videoRecommendations }
              }))}
              className={`w-12 h-6 rounded-full transition-colors ${formData.preferences.videoRecommendations ? 'bg-blue-600' : 'bg-gray-300'
                }`}
            >
              <div className={`w-5 h-5 bg-white rounded-full transition-transform ${formData.preferences.videoRecommendations ? 'translate-x-7' : 'translate-x-0.5'
                }`} />
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('onboarding.step8.textSize')}
            </label>
            <select
              value={formData.preferences.fontSize}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                preferences: { ...prev.preferences, fontSize: e.target.value as any }
              }))}
              className="input-field"
            >
              <option value="normal">{t('onboarding.step8.textSizeNormal')}</option>
              <option value="large">{t('onboarding.step8.textSizeLarge')}</option>
              <option value="extra-large">{t('onboarding.step8.textSizeExtraLarge')}</option>
            </select>
          </div>
        </div>
      )
    }
  ];

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return formData.firstName.trim().length > 0 && formData.lastName.trim().length > 0;
      case 1:
        return formData.selectedLanguages.length > 0;
      case 2:
        return formData.os.length > 0;
      case 3:
        return formData.techExperience.length > 0;
      case 4:
        return true; // Step 5 (primary concerns) is now optional
      case 5:
        return formData.assistiveNeeds.length > 0;
      case 6:
        return formData.communicationStyle.length > 0;
      case 7:
        return true; // Data personalization step is optional
      case 8:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    // Check for language selection warning on language step
    if (currentStep === 1 && formData.selectedLanguages.length === 0) {
      setShowLanguageWarning(true);
      return;
    }

    setShowLanguageWarning(false);
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    if (!formData.firstName.trim()) return;

    setLoading(true);

    try {
      // Save user preferences to cookies for offline access
      Cookies.set('userPreferences', JSON.stringify(formData.preferences), { expires: 365 });
      Cookies.set('userName', formData.firstName, { expires: 365 });
      // Apply preferences immediately
      if (typeof window !== 'undefined') {
        applyPreferencesToDOM(formData.preferences);
      }
      const finalData = {
        ...formData,
        preferences: {
          autoTextToSpeech: formData.preferences.textToSpeech,
          textSize: (formData.preferences.fontSize === 'normal' ? 'normal' : 'large') as 'normal' | 'large' | 'extra-large' | 'small',
          theme: formData.preferences.theme as 'light' | 'high-contrast' | 'dark',
          language: 'en'
        },
        onboardingCompleted: true
      };
      await updateUserData(finalData);
      sessionStorage.setItem('onboardingJustCompleted', 'true'); // Keep this to prevent immediate assessment modal
      navigate('/dashboard');
    } catch (error) {
      console.error('Error saving onboarding data:', error);
      alert(t('onboarding.errorSaving'));
    } finally {
      setLoading(false);
    }
  };

  // Helper to apply preferences to DOM
  function applyPreferencesToDOM(preferences) {
    const body = document.body;
    // Font size
    body.classList.remove('font-normal', 'font-large', 'font-extralarge');
    if (preferences.fontSize === 'large') body.classList.add('font-large');
    else if (preferences.fontSize === 'extra-large') body.classList.add('font-extralarge');
    else body.classList.add('font-normal');
    // High contrast
    if (preferences.highContrast) body.classList.add('high-contrast');
    else body.classList.remove('high-contrast');
  }

  // On mount, apply preferences if available
  useEffect(() => {
    if (userData && userData.preferences) {
      applyPreferencesToDOM(userData.preferences);
    }
  }, [userData]);

  return (
    <div className="min-h-screen flex items-center justify-center py-8 sm:py-12 px-4">
      <div className="w-full max-w-2xl">
        <div className="card p-6 sm:p-8 animate-slide-up">
          <div className="text-center mb-6 sm:mb-8">
            <div className="flex justify-center mb-4 sm:mb-6">
              <Logo size="lg" showText={false} /> {/* Logo size might need responsive variants if it's too big */}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-1 sm:mb-2">
              {steps[currentStep].title}
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              {steps[currentStep].subtitle}
            </p>
          </div>

          <div className="mb-6 sm:mb-8 max-h-[60vh] sm:max-h-96 overflow-y-auto pr-2"> {/* Added pr-2 for scrollbar space */}
            {steps[currentStep].content}
          </div>

          {/* Progress indicators */}
          <div className="flex justify-center space-x-2 mb-8">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-3 h-3 rounded-full transition-colors ${index === currentStep
                  ? 'bg-blue-600'
                  : index < currentStep
                    ? 'bg-green-500'
                    : 'bg-gray-300'
                  }`}
              />
            ))}
          </div>

          <div className="flex space-x-4">
            {currentStep > 0 && (
              <button
                onClick={() => setCurrentStep(currentStep - 1)}
                className="btn-secondary flex-1 flex items-center justify-center"
                disabled={loading}
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                {t('onboarding.back')}
              </button>
            )}
            <button
              onClick={handleNext}
              disabled={!canProceed() || loading}
              className="btn-primary flex-1 flex items-center justify-center"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  {t('onboarding.settingUp')}
                </div>
              ) : currentStep === steps.length - 1 ? (
                t('onboarding.completeSetup')
              ) : (
                <>
                  {t('onboarding.next')}
                  <ChevronRight className="w-4 h-4 ml-2" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;