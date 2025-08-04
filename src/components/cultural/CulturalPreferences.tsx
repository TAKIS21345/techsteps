import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import { culturalContentService } from '../../services/culturalContentService';
import { culturalValidationService } from '../../services/culturalValidation';
import { SUPPORTED_LANGUAGES } from '../../i18n';
import { Palette, Globe, Users, MessageSquare, Save, RefreshCw, Eye, Settings } from 'lucide-react';
import CommunityContributions from './CommunityContributions';
import CulturalContentValidator from './CulturalContentValidator';

interface CulturalPreferencesProps {
  onSave?: (preferences: CulturalUserPreferences) => void;
  className?: string;
}

export interface CulturalUserPreferences {
  language: string;
  region: string;
  colorScheme: string[];
  communicationStyle: 'formal' | 'informal' | 'mixed';
  contentExamples: 'local' | 'global' | 'mixed';
  culturalAdaptation: boolean;
  respectCulturalNorms: boolean;
}

export const CulturalPreferences: React.FC<CulturalPreferencesProps> = ({
  onSave,
  className = ''
}) => {
  const { t, currentLanguage } = useTranslation();
  const [preferences, setPreferences] = useState<CulturalUserPreferences>({
    language: currentLanguage,
    region: 'Global',
    colorScheme: ['blue', 'gray', 'white'],
    communicationStyle: 'mixed',
    contentExamples: 'local',
    culturalAdaptation: true,
    respectCulturalNorms: true
  });

  const [culturalContent, setCulturalContent] = useState<any>(null);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'preferences' | 'community' | 'preview'>('preferences');
  const [previewContent, setPreviewContent] = useState('Welcome to our learning platform! You can video call your family, check your bank account, and shop online safely.');

  // Load cultural content when language changes
  useEffect(() => {
    const content = culturalContentService.getCulturalContent(currentLanguage);
    setCulturalContent(content);

    const validation = culturalValidationService.validateCulturalAppropriatenesss(currentLanguage);
    setValidationResult(validation);

    if (content) {
      setPreferences(prev => ({
        ...prev,
        language: currentLanguage,
        region: content.region,
        colorScheme: content.preferences.colors,
        communicationStyle: content.communication.formality
      }));
    }
  }, [currentLanguage]);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Save preferences to localStorage or backend
      localStorage.setItem('cultural-preferences', JSON.stringify(preferences));
      
      // Call parent callback
      onSave?.(preferences);
      
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Failed to save cultural preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetToDefaults = () => {
    if (culturalContent) {
      setPreferences({
        language: currentLanguage,
        region: culturalContent.region,
        colorScheme: culturalContent.preferences.colors,
        communicationStyle: culturalContent.communication.formality,
        contentExamples: 'local',
        culturalAdaptation: true,
        respectCulturalNorms: true
      });
    }
  };

  const languageInfo = SUPPORTED_LANGUAGES[currentLanguage as keyof typeof SUPPORTED_LANGUAGES];

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Globe className="w-6 h-6 text-blue-600 me-3" />
          <h2 className="text-2xl font-bold text-gray-900">
            {t('cultural.preferences', 'Cultural Preferences')}
          </h2>
        </div>
        {saved && (
          <div className="flex items-center text-green-600">
            <Save className="w-4 h-4 me-2" />
            <span className="text-sm">{t('cultural.saved', 'Saved!')}</span>
          </div>
        )}
      </div>

      {/* Current Language Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="font-medium text-blue-900 mb-2">
          {t('cultural.currentLanguage', 'Current Language & Region')}
        </h3>
        <div className="flex items-center space-x-4">
          <div className={`
            w-8 h-8 rounded-full border flex items-center justify-center text-sm font-medium
            ${languageInfo?.rtl ? 'bg-orange-100 text-orange-800 border-orange-200' : 'bg-blue-100 text-blue-800 border-blue-200'}
          `}>
            {currentLanguage.toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-blue-900">
              {languageInfo?.nativeName} ({languageInfo?.name})
            </p>
            <p className="text-sm text-blue-700">
              {culturalContent?.region || 'Global'}
            </p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6 bg-gray-100 rounded-lg p-1">
        {[
          { key: 'preferences', label: t('cultural.preferences', 'Preferences'), icon: Settings },
          { key: 'community', label: t('cultural.community', 'Community'), icon: Users },
          { key: 'preview', label: t('cultural.preview', 'Preview'), icon: Eye }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`
              flex-1 flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md transition-colors
              ${activeTab === tab.key 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
              }
            `}
          >
            <tab.icon className="w-4 h-4 me-2" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Preferences Tab */}
      {activeTab === 'preferences' && (
      <div className="space-y-8">
        {/* Color Scheme Preferences */}
        <div>
          <div className="flex items-center mb-4">
            <Palette className="w-5 h-5 text-purple-600 me-2" />
            <h3 className="text-lg font-semibold text-gray-900">
              {t('cultural.colorScheme', 'Color Scheme')}
            </h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            {t('cultural.colorSchemeDesc', 'Choose colors that feel comfortable and culturally appropriate for you.')}
          </p>
          
          {culturalContent && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('cultural.recommendedColors', 'Recommended Colors for Your Culture')}
                </label>
                <div className="flex flex-wrap gap-2">
                  {culturalContent.preferences.colors.map((color: string, index: number) => (
                    <div
                      key={index}
                      className="flex items-center px-3 py-2 bg-gray-100 rounded-lg"
                    >
                      <div
                        className="w-4 h-4 rounded-full me-2 border border-gray-300"
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-sm text-gray-700 capitalize">{color}</span>
                    </div>
                  ))}
                </div>
              </div>

              {validationResult?.colorIssues?.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <h4 className="text-sm font-medium text-yellow-800 mb-2">
                    {t('cultural.colorWarnings', 'Cultural Color Considerations')}
                  </h4>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    {validationResult.colorIssues.map((issue: any, index: number) => (
                      <li key={index}>
                        • <strong>{issue.color}</strong>: {issue.meaning}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Communication Style */}
        <div>
          <div className="flex items-center mb-4">
            <MessageSquare className="w-5 h-5 text-green-600 me-2" />
            <h3 className="text-lg font-semibold text-gray-900">
              {t('cultural.communicationStyle', 'Communication Style')}
            </h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            {t('cultural.communicationStyleDesc', 'How would you like the system to communicate with you?')}
          </p>
          
          <div className="space-y-3">
            {[
              { value: 'formal', label: t('cultural.formal', 'Formal & Respectful'), desc: t('cultural.formalDesc', 'Uses polite language and respectful terms') },
              { value: 'informal', label: t('cultural.informal', 'Casual & Friendly'), desc: t('cultural.informalDesc', 'Uses everyday language and friendly tone') },
              { value: 'mixed', label: t('cultural.mixed', 'Balanced'), desc: t('cultural.mixedDesc', 'Adapts based on context and situation') }
            ].map(option => (
              <label key={option.value} className="flex items-start p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  name="communicationStyle"
                  value={option.value}
                  checked={preferences.communicationStyle === option.value}
                  onChange={(e) => setPreferences(prev => ({ ...prev, communicationStyle: e.target.value as any }))}
                  className="mt-1 me-3 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <div className="font-medium text-gray-900">{option.label}</div>
                  <div className="text-sm text-gray-600">{option.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Content Examples */}
        <div>
          <div className="flex items-center mb-4">
            <Users className="w-5 h-5 text-orange-600 me-2" />
            <h3 className="text-lg font-semibold text-gray-900">
              {t('cultural.contentExamples', 'Content Examples')}
            </h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            {t('cultural.contentExamplesDesc', 'What type of examples would you like to see in tutorials?')}
          </p>
          
          <div className="space-y-3">
            {[
              { value: 'local', label: t('cultural.localExamples', 'Local & Cultural'), desc: t('cultural.localExamplesDesc', 'Examples relevant to your culture and region') },
              { value: 'global', label: t('cultural.globalExamples', 'Global & Universal'), desc: t('cultural.globalExamplesDesc', 'Examples that work everywhere') },
              { value: 'mixed', label: t('cultural.mixedExamples', 'Mixed'), desc: t('cultural.mixedExamplesDesc', 'Combination of local and global examples') }
            ].map(option => (
              <label key={option.value} className="flex items-start p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  name="contentExamples"
                  value={option.value}
                  checked={preferences.contentExamples === option.value}
                  onChange={(e) => setPreferences(prev => ({ ...prev, contentExamples: e.target.value as any }))}
                  className="mt-1 me-3 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <div className="font-medium text-gray-900">{option.label}</div>
                  <div className="text-sm text-gray-600">{option.desc}</div>
                </div>
              </label>
            ))}
          </div>

          {/* Preview of cultural examples */}
          {culturalContent && preferences.contentExamples === 'local' && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">
                {t('cultural.examplePreview', 'Example Preview')}
              </h4>
              <div className="space-y-2 text-sm text-gray-700">
                <p><strong>{t('cultural.names', 'Names')}:</strong> {culturalContent.examples.names.slice(0, 3).join(', ')}</p>
                <p><strong>{t('cultural.locations', 'Locations')}:</strong> {culturalContent.examples.locations.slice(0, 2).join(', ')}</p>
                <p><strong>{t('cultural.scenarios', 'Scenarios')}:</strong> {culturalContent.examples.scenarios[0]}</p>
              </div>
            </div>
          )}
        </div>

        {/* Cultural Adaptation Toggles */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {t('cultural.adaptationSettings', 'Cultural Adaptation Settings')}
          </h3>
          
          <div className="space-y-4">
            <label className="flex items-start">
              <input
                type="checkbox"
                checked={preferences.culturalAdaptation}
                onChange={(e) => setPreferences(prev => ({ ...prev, culturalAdaptation: e.target.checked }))}
                className="mt-1 me-3 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <div className="font-medium text-gray-900">
                  {t('cultural.enableAdaptation', 'Enable Cultural Adaptation')}
                </div>
                <div className="text-sm text-gray-600">
                  {t('cultural.enableAdaptationDesc', 'Automatically adapt content, colors, and examples based on your cultural background')}
                </div>
              </div>
            </label>

            <label className="flex items-start">
              <input
                type="checkbox"
                checked={preferences.respectCulturalNorms}
                onChange={(e) => setPreferences(prev => ({ ...prev, respectCulturalNorms: e.target.checked }))}
                className="mt-1 me-3 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <div className="font-medium text-gray-900">
                  {t('cultural.respectNorms', 'Respect Cultural Norms')}
                </div>
                <div className="text-sm text-gray-600">
                  {t('cultural.respectNormsDesc', 'Avoid content and imagery that may be culturally inappropriate')}
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Recommendations */}
        {validationResult?.recommendations?.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-medium text-green-800 mb-2">
              {t('cultural.recommendations', 'Cultural Recommendations')}
            </h4>
            <ul className="text-sm text-green-700 space-y-1">
              {validationResult.recommendations.map((rec: string, index: number) => (
                <li key={index}>• {rec}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center pt-8 border-t border-gray-200">
        <button
          onClick={resetToDefaults}
          className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 rounded-md"
        >
          <RefreshCw className="w-4 h-4 me-2" />
          {t('cultural.resetDefaults', 'Reset to Defaults')}
        </button>

        <button
          onClick={handleSave}
          disabled={isLoading}
          className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-4 h-4 me-2" />
          {isLoading 
            ? t('cultural.saving', 'Saving...') 
            : t('cultural.savePreferences', 'Save Preferences')
          }
        </button>
      </div>
      )}

      {/* Community Tab */}
      {activeTab === 'community' && (
        <CommunityContributions />
      )}

      {/* Preview Tab */}
      {activeTab === 'preview' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {t('cultural.contentPreview', 'Cultural Content Preview')}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {t('cultural.previewDesc', 'See how content is adapted based on your cultural preferences.')}
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('cultural.sampleContent', 'Sample Content')}
                </label>
                <textarea
                  value={previewContent}
                  onChange={(e) => setPreviewContent(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-24"
                  placeholder={t('cultural.enterContent', 'Enter content to preview cultural adaptation...')}
                />
              </div>

              <CulturalContentValidator 
                content={previewContent}
                contentType="tutorial"
                showDetails={true}
              />

              {previewContent && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">
                    {t('cultural.adaptedContent', 'Culturally Adapted Content')}
                  </h4>
                  <p className="text-gray-700">
                    {culturalContentService.adaptForCulturalContext(previewContent, currentLanguage)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CulturalPreferences;