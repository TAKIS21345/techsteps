import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, User, Volume2, Palette, Globe, Save, Check } from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { useTranslation } from 'react-i18next';

import LanguageSelector from '../components/layout/LanguageSelector'; // Import LanguageSelector



const SettingsPage: React.FC = () => {
  const { userData, updateUserData } = useUser();
  const { t, i18n } = useTranslation();

  const [formData, setFormData] = useState({
    firstName: userData?.firstName || '',
    lastName: userData?.lastName || '',
    age: userData?.age || 65,
    primaryDevices: userData?.primaryDevices || [],
    techExperience: userData?.techExperience || 'beginner' as 'beginner' | 'some' | 'comfortable',
    preferences: {
      autoTextToSpeech: userData?.preferences?.autoTextToSpeech ?? true,
      textSize: userData?.preferences?.textSize || 'normal' as 'normal' | 'large' | 'extra-large',
      theme: userData?.preferences?.theme || 'light' as 'light' | 'dark' | 'high-contrast',
      language: userData?.preferences?.language || i18n.language,
      seniorMode: userData?.preferences?.seniorMode ?? false
    }
  });

  // Available devices with translation keys
  const devices = [
    { key: 'windowsComputer', label: t('settings.devices.windowsComputer', 'Windows Computer') },
    { key: 'macComputer', label: t('settings.devices.macComputer', 'Mac Computer') },
    { key: 'iphone', label: t('settings.devices.iphone', 'iPhone') },
    { key: 'ipad', label: t('settings.devices.ipad', 'iPad') },
    { key: 'androidPhone', label: t('settings.devices.androidPhone', 'Android Phone') },
    { key: 'androidTablet', label: t('settings.devices.androidTablet', 'Android Tablet') },
    { key: 'chromebook', label: t('settings.devices.chromebook', 'Chromebook') }
  ];

  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  // Apply theme changes immediately
  useEffect(() => {
    const root = document.documentElement;
    const theme = formData.preferences.theme;
    const seniorMode = formData.preferences.seniorMode;

    // Remove existing theme classes
    root.classList.remove('light', 'dark', 'high-contrast');

    // Add new theme class
    root.classList.add(theme);

    // Handle Senior Mode
    if (seniorMode) {
      root.classList.add('senior-mode');
    } else {
      root.classList.remove('senior-mode');
    }

    // Apply text size
    const textSize = formData.preferences.textSize;

    // In senior mode, minimum font size is larger
    if (seniorMode) {
      root.style.fontSize = textSize === 'extra-large' ? '22px' : '20px'; // Significantly larger base
    } else {
      root.style.fontSize = textSize === 'large' ? '18px' : textSize === 'extra-large' ? '20px' : '16px';
    }

  }, [formData.preferences.theme, formData.preferences.textSize, formData.preferences.seniorMode]);

  // Sync formData with i18n language changes (if changed from external Selector)
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      preferences: { ...prev.preferences, language: i18n.language }
    }));
  }, [i18n.language]);

  const handleSave = async () => {
    setLoading(true);
    setSaved(false);

    try {
      await updateUserData(formData);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Error saving settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleDevice = (device: string) => {
    setFormData(prev => ({
      ...prev,
      primaryDevices: (prev.primaryDevices || []).includes(device)
        ? (prev.primaryDevices || []).filter(d => d !== device)
        : [...(prev.primaryDevices || []), device]
    }));
  };

  return (
    <div className="min-h-screen w-full relative bg-gradient-to-br from-indigo-50 via-purple-50 to-fuchsia-50">
      {/* Background blobs */}
      <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-400/20 blur-3xl pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-400/20 blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-50 px-4 py-4">
        <div className="max-w-4xl mx-auto glass-panel rounded-2xl px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                to="/chat"
                className="p-2 text-indigo-900 hover:bg-white/50 rounded-lg transition-colors"
                title={t('common.back', 'Back')}
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-xl font-bold text-indigo-900">{t('settings.title', 'Settings')}</h1>
            </div>

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={loading}
              className={`
                flex items-center px-6 py-2 rounded-xl font-bold transition-all duration-200 shadow-md
                ${saved
                  ? 'bg-green-100 text-green-700 border border-green-300'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-lg hover:-translate-y-0.5'
                }
                ${loading ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              {saved ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  {t('settings.saved', 'Saved')}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? t('settings.saving', 'Saving...') : t('settings.saveChanges', 'Save Changes')}
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 pb-12 relative z-10">
        <div className="space-y-8">

          {/* Personal Information */}
          <div className="glass-panel p-8 rounded-3xl">
            <div className="flex items-center mb-6">
              <div className="p-3 bg-indigo-100 rounded-xl mr-4">
                <User className="w-6 h-6 text-indigo-600" />
              </div>
              <h2 className="text-xl font-bold text-indigo-900">{t('settings.personalInfo.title', 'Personal Information')}</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">
                  {t('settings.personalInfo.firstName', 'First Name')}
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  className="w-full px-4 py-3 glass-input rounded-xl focus:outline-none"
                  placeholder={t('settings.personalInfo.firstNamePlaceholder', 'Enter your first name')}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">
                  {t('settings.personalInfo.lastName', 'Last Name')}
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  className="w-full px-4 py-3 glass-input rounded-xl focus:outline-none"
                  placeholder={t('settings.personalInfo.lastNamePlaceholder', 'Enter your last name')}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">
                  {t('settings.personalInfo.age', 'Age')}
                </label>
                <input
                  type="number"
                  min="18"
                  max="120"
                  value={formData.age}
                  onChange={(e) => setFormData(prev => ({ ...prev, age: parseInt(e.target.value) || 0 }))}
                  className="w-full px-4 py-3 glass-input rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">
                  {t('settings.personalInfo.techExperience', 'Tech Experience Level')}
                </label>
                <div className="relative">
                  <select
                    value={formData.techExperience}
                    onChange={(e) => setFormData(prev => ({ ...prev, techExperience: e.target.value as 'beginner' | 'some' | 'comfortable' }))}
                    className="w-full px-4 py-3 glass-input rounded-xl focus:outline-none appearance-none"
                  >
                    <option value="beginner">{t('settings.personalInfo.techExperienceBeginner', "Beginner - I'm new to technology")}</option>
                    <option value="some">{t('settings.personalInfo.techExperienceSome', 'Some Experience - I know the basics')}</option>
                    <option value="comfortable">{t('settings.personalInfo.techExperienceComfortable', "Comfortable - I'm pretty good with tech")}</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Primary Devices */}
          <div className="glass-panel p-8 rounded-3xl">
            <h2 className="text-xl font-bold text-indigo-900 mb-2">{t('settings.devices.title', 'Primary Device(s)')}</h2>
            <p className="text-gray-600 mb-6">{t('settings.devices.description', 'Select all devices you use regularly')}</p>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {devices.map((device) => (
                <button
                  key={device.key}
                  onClick={() => toggleDevice(device.label)}
                  className={`
                    p-4 text-left border rounded-2xl transition-all duration-200
                    ${(formData.primaryDevices || []).includes(device.label)
                      ? 'border-indigo-500 bg-indigo-50/80 text-indigo-900 shadow-md scale-[1.02]'
                      : 'border-white/40 bg-white/40 hover:bg-white/60 text-gray-700 hover:border-indigo-200'
                    }
                  `}
                >
                  <div className="font-medium">{device.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Audio & Speech Settings */}
          <div className="glass-panel p-8 rounded-3xl">
            <div className="flex items-center mb-6">
              <div className="p-3 bg-purple-100 rounded-xl mr-4">
                <Volume2 className="w-6 h-6 text-purple-600" />
              </div>
              <h2 className="text-xl font-bold text-indigo-900">{t('settings.audio.title', 'Audio & Speech')}</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-5 bg-white/40 rounded-2xl border border-white/40">
                <div>
                  <h3 className="font-bold text-gray-900">{t('settings.audio.autoTTS', 'Auto Text-to-Speech')}</h3>
                  <p className="text-sm text-gray-600 mt-1">{t('settings.audio.autoTTSDesc', 'Automatically read AI messages aloud')}</p>
                </div>
                <button
                  onClick={() => setFormData(prev => ({
                    ...prev,
                    preferences: { ...prev.preferences, autoTextToSpeech: !prev.preferences.autoTextToSpeech }
                  }))}
                  className={`
                    relative inline-flex h-7 w-12 border-2 border-transparent rounded-full cursor-pointer 
                    transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
                    ${formData.preferences.autoTextToSpeech ? 'bg-indigo-600' : 'bg-gray-300'}
                  `}
                >
                  <span className={`
                    inline-block w-6 h-6 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200
                    ${formData.preferences.autoTextToSpeech ? 'translate-x-5' : 'translate-x-0'}
                  `} />
                </button>
              </div>
            </div>
          </div>

          {/* Display Settings */}
          <div className="glass-panel p-8 rounded-3xl">
            <div className="flex items-center mb-6">
              <div className="p-3 bg-pink-100 rounded-xl mr-4">
                <Palette className="w-6 h-6 text-pink-600" />
              </div>
              <h2 className="text-xl font-bold text-indigo-900">{t('settings.display.title', 'Display Settings')}</h2>
            </div>

            <div className="space-y-8">

              {/* Senior Mode Toggle */}
              <div className="flex items-center justify-between p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl shadow-sm">
                <div>
                  <div className="flex items-center">
                    <h3 className="font-bold text-indigo-900 text-lg">{t('settings.display.seniorMode', 'Senior Friendly Mode')}</h3>
                    <span className="ml-3 px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wide rounded-full">Recommended</span>
                  </div>
                  <p className="text-gray-700 mt-2 max-w-md">
                    {t('settings.display.seniorModeDesc', 'Larger text, simpler buttons, and higher contrast for easier use.')}
                  </p>
                </div>
                <button
                  onClick={() => {
                    const newValue = !formData.preferences.seniorMode;
                    setFormData(prev => ({
                      ...prev,
                      preferences: {
                        ...prev.preferences,
                        seniorMode: newValue,
                        // Auto-adjust specific settings when enabling
                        textSize: newValue ? 'large' : prev.preferences.textSize,
                        theme: newValue ? 'light' : prev.preferences.theme
                      }
                    }));
                  }}
                  className={`
                    relative inline-flex h-9 w-16 border-2 border-transparent rounded-full cursor-pointer 
                    transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                    ${formData.preferences.seniorMode ? 'bg-blue-600' : 'bg-gray-300'}
                  `}
                >
                  <span className={`
                    inline-block w-8 h-8 rounded-full bg-white shadow-lg transform ring-0 transition ease-in-out duration-200
                    ${formData.preferences.seniorMode ? 'translate-x-7' : 'translate-x-0'}
                  `} />
                </button>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3 ml-1">
                  {t('settings.display.textSize', 'Text Size')}
                </label>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { value: 'normal', label: t('settings.display.textSizeNormal', 'Normal'), preview: 'Aa' },
                    { value: 'large', label: t('settings.display.textSizeLarge', 'Large'), preview: 'Aa' },
                    { value: 'extra-large', label: t('settings.display.textSizeExtraLarge', 'Extra Large'), preview: 'Aa' }
                  ].map((size) => (
                    <button
                      key={size.value}
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        preferences: { ...prev.preferences, textSize: size.value as 'normal' | 'large' | 'extra-large' }
                      }))}
                      className={`
                        p-4 border rounded-2xl transition-all duration-200 text-center
                        ${formData.preferences.textSize === size.value
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-900 shadow-md'
                          : 'border-white/40 bg-white/40 hover:bg-white/60 text-gray-700'
                        }
                      `}
                    >
                      <div className={`font-bold mb-2 ${size.value === 'normal' ? 'text-lg' :
                        size.value === 'large' ? 'text-xl' : 'text-2xl'
                        }`}>
                        {size.preview}
                      </div>
                      <div className="text-sm font-medium">{size.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3 ml-1">
                  {t('settings.display.theme', 'Color Theme')}
                </label>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { value: 'light', label: t('settings.display.themeLight', 'Light'), bg: 'bg-white', text: 'text-gray-900', border: 'border-gray-200' },
                    { value: 'dark', label: t('settings.display.themeDark', 'Dark'), bg: 'bg-gray-900', text: 'text-white', border: 'border-gray-700' },
                    { value: 'high-contrast', label: t('settings.display.themeHighContrast', 'High Contrast'), bg: 'bg-black', text: 'text-yellow-400', border: 'border-yellow-400' }
                  ].map((theme) => (
                    <button
                      key={theme.value}
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        preferences: { ...prev.preferences, theme: theme.value as 'light' | 'dark' | 'high-contrast' }
                      }))}
                      className={`
                        p-4 border rounded-2xl transition-all duration-200
                        ${formData.preferences.theme === theme.value
                          ? 'border-indigo-500 ring-2 ring-indigo-200 shadow-md'
                          : 'border-white/40 hover:border-indigo-200'
                        }
                      `}
                    >
                      <div className={`w-full h-14 rounded-lg ${theme.bg} ${theme.border} border mb-3 flex items-center justify-center shadow-inner`}>
                        <span className={`text-lg font-bold ${theme.text}`}>Aa</span>
                      </div>
                      <div className="text-sm font-medium text-gray-700">{theme.label}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Language Settings */}
          <div className="glass-panel p-8 rounded-3xl">
            <div className="flex items-center mb-6">
              <div className="p-3 bg-teal-100 rounded-xl mr-4">
                <Globe className="w-6 h-6 text-teal-600" />
              </div>
              <h2 className="text-xl font-bold text-indigo-900">{t('settings.language.title', 'Language Preference')}</h2>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">
                {t('settings.language.interfaceLanguage', 'Interface Language')}
              </label>
              <div className="relative z-20"> {/* Increased z-index for dropdown */}
                <LanguageSelector
                  className="w-full"
                  showLabel={true}
                />
              </div>
              <p className="text-sm text-gray-500 mt-2 ml-1">
                {t('settings.language.description', 'This affects the interface language and voice for text-to-speech')}
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default SettingsPage;