import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, User, Smartphone, Volume2, Mic, Palette, Save, Globe, Search, Check, AlertTriangle } from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { useAuth } from '../contexts/AuthContext';
import Logo from '../components/Logo';

const SettingsPage: React.FC = () => {
  const { userData, updateUserData } = useUser();
  const { logout } = useAuth();
  const { getSupportedLanguages, defaultLanguage, setDefaultLanguage } = useLanguage();
  
  const [languageSearch, setLanguageSearch] = useState('');
  const [showLanguageSection, setShowLanguageSection] = useState(false);
  const [formData, setFormData] = useState({
    firstName: userData?.firstName || '',
    os: userData?.os || 'Windows Computer',
    selectedLanguages: userData?.selectedLanguages || ['en'],
    defaultLanguage: defaultLanguage,
    preferences: {
      textToSpeech: userData?.preferences?.textToSpeech ?? true,
      voiceInput: userData?.preferences?.voiceInput ?? true,
      theme: userData?.preferences?.theme || 'light',
      speechLanguages: userData?.preferences?.speechLanguages || ['en']
    }
  });
  
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  // Comprehensive language list
  const allLanguages = [
    { code: 'en', name: 'English', nativeName: 'English', region: 'Global' },
    { code: 'es', name: 'Spanish', nativeName: 'Español', region: 'Spain/Latin America' },
    { code: 'fr', name: 'French', nativeName: 'Français', region: 'France/Canada' },
    { code: 'de', name: 'German', nativeName: 'Deutsch', region: 'Germany/Austria' },
    { code: 'it', name: 'Italian', nativeName: 'Italiano', region: 'Italy' },
    { code: 'pt', name: 'Portuguese', nativeName: 'Português', region: 'Brazil/Portugal' },
    { code: 'zh', name: 'Chinese', nativeName: '中文', region: 'China/Taiwan' },
    { code: 'ja', name: 'Japanese', nativeName: '日本語', region: 'Japan' },
    { code: 'ko', name: 'Korean', nativeName: '한국어', region: 'Korea' },
    { code: 'ar', name: 'Arabic', nativeName: 'العربية', region: 'Middle East/North Africa' },
    { code: 'ru', name: 'Russian', nativeName: 'Русский', region: 'Russia/Eastern Europe' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', region: 'India' },
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
  };

  const handleDeselectAllLanguages = () => {
    setFormData(prev => ({
      ...prev,
      selectedLanguages: ['en'], // Always keep English as minimum
      preferences: {
        ...prev.preferences,
        speechLanguages: ['en']
      }
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    setSaved(false);

    try {
      // Update default language if changed
      if (formData.defaultLanguage !== defaultLanguage) {
        setDefaultLanguage(formData.defaultLanguage);
      }

      await updateUserData(formData);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Could not save settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const togglePreference = (key: keyof typeof formData.preferences) => {
    setFormData(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [key]: !prev.preferences[key]
      }
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link 
                to="/dashboard" 
                className="p-2 text-gray-600 hover:text-gray-800 rounded-full hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <Logo size="sm" />
              <h1 className="text-xl font-semibold text-gray-800">Settings</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-12 max-w-2xl">
        <div className="space-y-8">
          {/* Personal Information */}
          <div className="card p-8">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Personal Information</h2>
            </div>

            <div className="space-y-6">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                  First Name
                </label>
                <input
                  id="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  className="input-field"
                  placeholder="Your first name"
                />
              </div>

              <div>
                <label htmlFor="os" className="block text-sm font-medium text-gray-700 mb-2">
                  Primary Device
                </label>
                <select
                  id="os"
                  value={formData.os}
                  onChange={(e) => setFormData(prev => ({ ...prev, os: e.target.value }))}
                  className="input-field"
                >
                  <option>Windows Computer</option>
                  <option>Mac (Apple Computer)</option>
                  <option>iPhone</option>
                  <option>iPad</option>
                  <option>Android Phone or Tablet</option>
                </select>
              </div>
            </div>
          </div>

          {/* Accessibility Preferences */}
          <div className="card p-8">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                <Volume2 className="w-5 h-5 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Accessibility</h2>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center">
                  <Volume2 className="w-5 h-5 text-gray-600 mr-3" />
                  <div>
                    <h4 className="font-medium">Text-to-Speech</h4>
                    <p className="text-sm text-gray-600">Have answers read aloud to you</p>
                  </div>
                </div>
                <button
                  onClick={() => togglePreference('textToSpeech')}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    formData.preferences.textToSpeech ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    formData.preferences.textToSpeech ? 'translate-x-7' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center">
                  <Mic className="w-5 h-5 text-gray-600 mr-3" />
                  <div>
                    <h4 className="font-medium">Voice Input</h4>
                    <p className="text-sm text-gray-600">Ask questions by speaking</p>
                  </div>
                </div>
                <button
                  onClick={() => togglePreference('voiceInput')}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    formData.preferences.voiceInput ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    formData.preferences.voiceInput ? 'translate-x-7' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>
            </div>
          </div>

          {/* Language Preferences */}
          <div className="card p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                  <Globe className="w-5 h-5 text-purple-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Language Preferences</h2>
              </div>
              <button
                onClick={() => setShowLanguageSection(!showLanguageSection)}
                className="btn-secondary text-sm"
              >
                {showLanguageSection ? 'Hide' : 'Modify Languages'}
              </button>
            </div>

            {/* Default Language Selection */}
            <div className="mb-6">
              <label htmlFor="defaultLanguage" className="block text-sm font-medium text-gray-700 mb-2">
                Default Language (entire website will use this language)
              </label>
              <select
                id="defaultLanguage"
                value={formData.defaultLanguage}
                onChange={(e) => setFormData(prev => ({ ...prev, defaultLanguage: e.target.value as Language }))}
                className="input-field max-w-md"
              >
                {allLanguages.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.nativeName} ({lang.name})
                  </option>
                ))}
              </select>
              <p className="text-sm text-gray-500 mt-1">
                This will be the primary language for all interface elements and interactions.
              </p>
            </div>

            <div className="mb-4">
              <p className="text-gray-600 mb-3">
                Other languages you'd like to use:
              </p>
              <div className="flex flex-wrap gap-2">
                {formData.selectedLanguages.map(code => {
                  const lang = allLanguages.find(l => l.code === code);
                  return lang ? (
                    <span
                      key={code}
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
                        code === formData.defaultLanguage 
                          ? 'bg-green-100 text-green-800 border border-green-300' 
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {lang.nativeName} ({lang.name})
                      {code === formData.defaultLanguage && <span className="ml-1 text-xs">• Default</span>}
                    </span>
                  ) : null;
                })}
              </div>
            </div>

            {showLanguageSection && (
              <div className="space-y-4 border-t border-gray-200 pt-6">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-start space-x-3">
                    <Globe className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-800 mb-1">Language Configuration</h4>
                      <p className="text-sm text-blue-700">
                        Your selected languages will be used for:
                      </p>
                      <ul className="text-sm text-blue-700 mt-2 space-y-1">
                        <li>• Speech-to-text recognition and processing</li>
                        <li>• Multilingual text interactions and responses</li>
                        <li>• Interface language options and accessibility</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Search and Controls */}
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={languageSearch}
                      onChange={(e) => setLanguageSearch(e.target.value)}
                      placeholder="Search languages..."
                      className="input-field pl-10"
                    />
                  </div>

                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={handleSelectAllLanguages}
                      className="btn-secondary text-sm px-4 py-2"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={handleDeselectAllLanguages}
                      className="btn-secondary text-sm px-4 py-2"
                    >
                      Deselect All
                    </button>
                  </div>

                  <div className="text-sm text-gray-600">
                    Selected: {formData.selectedLanguages.length} language{formData.selectedLanguages.length !== 1 ? 's' : ''}
                  </div>
                </div>

                {/* Language Grid */}
                <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-xl">
                  <div className="grid grid-cols-1 gap-0">
                    {filteredLanguages.map((lang) => (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => handleLanguageToggle(lang.code)}
                        className={`p-4 text-left border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors ${
                          formData.selectedLanguages.includes(lang.code)
                            ? 'bg-blue-50 border-l-4 border-l-blue-500'
                            : ''
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <div className="font-medium text-gray-800">
                                {lang.nativeName}
                              </div>
                              <div className="text-sm text-gray-500">
                                {lang.name}
                              </div>
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              {lang.region}
                            </div>
                          </div>
                          {formData.selectedLanguages.includes(lang.code) && (
                            <Check className="w-5 h-5 text-blue-600" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {filteredLanguages.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Globe className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p>No languages found matching "{languageSearch}"</p>
                  </div>
                )}

                {formData.selectedLanguages.length === 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <div className="flex items-start space-x-3">
                      <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-amber-800 mb-1">At Least One Language Required</h4>
                        <p className="text-sm text-amber-700">
                          Please select at least one language to ensure proper functionality of voice input and text interactions.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Account Actions */}
          <div className="card p-8">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mr-4">
                <User className="w-5 h-5 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Account</h2>
            </div>

            <div className="space-y-4">
              <button
                onClick={logout}
                className="w-full p-4 text-left text-red-600 hover:bg-red-50 rounded-xl transition-colors border border-red-200"
              >
                <div className="font-medium">Sign Out</div>
                <div className="text-sm text-red-500">Sign out of your account</div>
              </button>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end space-x-4">
            <Link to="/dashboard" className="btn-secondary">
              Cancel
            </Link>
            <button
              onClick={handleSave}
              disabled={loading || formData.selectedLanguages.length === 0}
              className={`btn-primary inline-flex items-center ${
                saved ? 'bg-green-600 hover:bg-green-700' : ''
              }`}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Saving...
                </>
              ) : saved ? (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Saved!
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;