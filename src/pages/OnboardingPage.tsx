import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { ChevronLeft, ChevronRight, Search, Globe, Check, AlertTriangle } from 'lucide-react';
import Logo from '../components/Logo';
import { useLanguage } from '../contexts/LanguageContext';
import Cookies from 'js-cookie';

const OnboardingPage: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [languageSearch, setLanguageSearch] = useState('');
  const [showLanguageWarning, setShowLanguageWarning] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    age: 65,
    os: 'Windows Computer',
    techExperience: 'beginner' as const,
    primaryConcerns: [] as string[],
    assistiveNeeds: [] as string[],
    communicationStyle: 'simple' as const,
    selectedLanguages: ['en'] as string[],
    preferences: {
      textToSpeech: true,
      voiceInput: true,
      theme: 'light' as const,
      fontSize: 'normal' as const,
      highContrast: false,
      videoRecommendations: true,
      speechLanguages: ['en'] as string[]
    }
  });
  const [loading, setLoading] = useState(false);

  const { updateUserData } = useUser();
  const { getSupportedLanguages } = useLanguage();
  const navigate = useNavigate();

  // Comprehensive language list with native names
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
      selectedLanguages: ['en'], // Always keep English as minimum
      preferences: {
        ...prev.preferences,
        speechLanguages: ['en']
      }
    }));
  };
  const steps = [
    {
      title: "Let's get to know you",
      subtitle: "Help me personalize your experience",
      content: (
        <div className="space-y-6">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
              First Name
            </label>
            <input
              type="text"
              id="firstName"
              value={formData.firstName}
              onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
              placeholder="Your first name"
              className="input-field text-lg"
              autoFocus
            />
          </div>
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
              Last Name
            </label>
            <input
              type="text"
              id="lastName"
              value={formData.lastName}
              onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
              placeholder="Your last name"
              className="input-field text-lg"
            />
          </div>
          <div>
            <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-2">
              Age (helps me adjust my explanations)
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
      title: "Choose your preferred languages",
      subtitle: "Select the languages you'd like to use for communication and voice input",
      content: (
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <Globe className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-800 mb-1">Language Selection</h4>
                <p className="text-sm text-blue-700">
                  Choose the languages you're comfortable with. This will:
                </p>
                <ul className="text-sm text-blue-700 mt-2 space-y-1">
                  <li>• Configure speech-to-text to understand your voice in these languages</li>
                  <li>• Enable text interactions in your chosen languages</li>
                  <li>• Customize interface options for better accessibility</li>
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

          {showLanguageWarning && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-amber-800 mb-1">Language Selection Required</h4>
                  <p className="text-sm text-amber-700">
                    Please select at least one language to continue. This ensures the best experience for voice input and text interactions.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )
    },
    {
      title: "What device do you use most?",
      subtitle: "This helps me give you better instructions",
      content: (
        <div className="space-y-3">
          {[
            'Windows Computer',
            'Mac (Apple Computer)',
            'iPhone',
            'iPad',
            'Android Phone',
            'Android Tablet',
            'Smart TV',
            'Multiple devices'
          ].map((device) => (
            <button
              key={device}
              onClick={() => setFormData(prev => ({ ...prev, os: device }))}
              className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                formData.os === device 
                  ? 'border-blue-500 bg-blue-50 text-blue-700' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {device}
            </button>
          ))}
        </div>
      )
    },
    {
      title: "How comfortable are you with technology?",
      subtitle: "Be honest - this helps me explain things at the right level",
      content: (
        <div className="space-y-3">
          {[
            { value: 'beginner', label: 'Beginner', desc: 'I need step-by-step help with most things' },
            { value: 'some', label: 'Some Experience', desc: 'I can do basic tasks but need help with new things' },
            { value: 'comfortable', label: 'Comfortable', desc: 'I can figure out most things but sometimes need guidance' }
          ].map((level) => (
            <button
              key={level.value}
              onClick={() => setFormData(prev => ({ ...prev, techExperience: level.value as any }))}
              className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                formData.techExperience === level.value 
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
      title: "What tech topics worry you most?",
      subtitle: "Select all that apply - I'll prioritize help in these areas",
      content: (
        <div className="grid grid-cols-1 gap-3">
          {[
            'Online Safety & Scams',
            'Password Management',
            'Video Calling Family',
            'Social Media',
            'Online Banking',
            'Email & Messaging',
            'Photo Storage & Sharing',
            'App Downloads & Updates',
            'Wi-Fi & Internet Issues',
            'Device Settings',
            'Online Shopping',
            'Health Apps & Portals'
          ].map((concern) => (
            <button
              key={concern}
              onClick={() => {
                setFormData(prev => ({
                  ...prev,
                  primaryConcerns: prev.primaryConcerns.includes(concern)
                    ? prev.primaryConcerns.filter(c => c !== concern)
                    : [...prev.primaryConcerns, concern]
                }));
              }}
              className={`w-full p-3 rounded-xl border-2 transition-all text-left ${
                formData.primaryConcerns.includes(concern)
                  ? 'border-blue-500 bg-blue-50 text-blue-700' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {concern}
            </button>
          ))}
        </div>
      )
    },
    {
      title: "Do you need any accessibility features?",
      subtitle: "I want to make sure you can use this comfortably",
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3">
            {[
              'Larger text and buttons',
              'High contrast colors',
              'Voice commands',
              'Screen reader support',
              'Slower explanations',
              'Visual step indicators',
              'None needed'
            ].map((need) => (
              <button
                key={need}
                onClick={() => {
                  if (need === 'None needed') {
                    setFormData(prev => ({ ...prev, assistiveNeeds: ['None needed'] }));
                  } else {
                    setFormData(prev => ({
                      ...prev,
                      assistiveNeeds: prev.assistiveNeeds.includes('None needed')
                        ? [need]
                        : prev.assistiveNeeds.includes(need)
                          ? prev.assistiveNeeds.filter(n => n !== need)
                          : [...prev.assistiveNeeds.filter(n => n !== 'None needed'), need]
                    }));
                  }
                }}
                className={`w-full p-3 rounded-xl border-2 transition-all text-left ${
                  formData.assistiveNeeds.includes(need)
                    ? 'border-blue-500 bg-blue-50 text-blue-700' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {need}
              </button>
            ))}
          </div>
        </div>
      )
    },
    {
      title: "How do you prefer to learn?",
      subtitle: "I'll adjust my teaching style to match your preference",
      content: (
        <div className="space-y-3">
          {[
            { value: 'simple', label: 'Simple & Quick', desc: 'Just tell me what to do, step by step' },
            { value: 'detailed', label: 'Detailed Explanations', desc: 'Explain why I\'m doing each step' },
            { value: 'visual', label: 'Visual Learning', desc: 'Show me pictures and videos when possible' }
          ].map((style) => (
            <button
              key={style.value}
              onClick={() => setFormData(prev => ({ ...prev, communicationStyle: style.value as any }))}
              className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                formData.communicationStyle === style.value 
                  ? 'border-blue-500 bg-blue-50 text-blue-700' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-medium">{style.label}</div>
              <div className="text-sm text-gray-600 mt-1">{style.desc}</div>
            </button>
          ))}
        </div>
      )
    },
    {
      title: "Final touches",
      subtitle: "Set up your perfect learning environment",
      content: (
        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div>
              <h4 className="font-medium">Text-to-Speech</h4>
              <p className="text-sm text-gray-600">Have answers read aloud</p>
            </div>
            <button
              onClick={() => setFormData(prev => ({ 
                ...prev, 
                preferences: { ...prev.preferences, textToSpeech: !prev.preferences.textToSpeech }
              }))}
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
            <div>
              <h4 className="font-medium">Voice Input</h4>
              <p className="text-sm text-gray-600">Ask questions by speaking</p>
            </div>
            <button
              onClick={() => setFormData(prev => ({ 
                ...prev, 
                preferences: { ...prev.preferences, voiceInput: !prev.preferences.voiceInput }
              }))}
              className={`w-12 h-6 rounded-full transition-colors ${
                formData.preferences.voiceInput ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                formData.preferences.voiceInput ? 'translate-x-7' : 'translate-x-0.5'
              }`} />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div>
              <h4 className="font-medium">Video Recommendations</h4>
              <p className="text-sm text-gray-600">Show helpful videos and articles</p>
            </div>
            <button
              onClick={() => setFormData(prev => ({ 
                ...prev, 
                preferences: { ...prev.preferences, videoRecommendations: !prev.preferences.videoRecommendations }
              }))}
              className={`w-12 h-6 rounded-full transition-colors ${
                formData.preferences.videoRecommendations ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                formData.preferences.videoRecommendations ? 'translate-x-7' : 'translate-x-0.5'
              }`} />
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Text Size Preference
            </label>
            <select
              value={formData.preferences.fontSize}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                preferences: { ...prev.preferences, fontSize: e.target.value as any }
              }))}
              className="input-field"
            >
              <option value="normal">Normal</option>
              <option value="large">Large</option>
              <option value="extra-large">Extra Large</option>
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
        return formData.primaryConcerns.length > 0;
      case 5:
        return formData.assistiveNeeds.length > 0;
      case 6:
        return formData.communicationStyle.length > 0;
      case 7:
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
      
      await updateUserData(formData);
      navigate('/dashboard');
    } catch (error) {
      console.error('Error saving onboarding data:', error);
      alert('Could not save your preferences. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-2xl">
        <div className="card p-8 animate-slide-up">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <Logo size="lg" showText={false} />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              {steps[currentStep].title}
            </h1>
            <p className="text-gray-600">
              {steps[currentStep].subtitle}
            </p>
          </div>

          <div className="mb-8 max-h-96 overflow-y-auto">
            {steps[currentStep].content}
          </div>

          {/* Progress indicators */}
          <div className="flex justify-center space-x-2 mb-8">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index === currentStep 
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
                Back
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
                  Setting up...
                </div>
              ) : currentStep === steps.length - 1 ? (
                'Complete Setup'
              ) : (
                <>
                  Next
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