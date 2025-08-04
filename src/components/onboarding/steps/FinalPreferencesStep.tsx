import React from 'react';
import { useTranslation } from 'react-i18next';
import { Typography } from '../../design-system/Typography';

interface FinalPreferencesStepProps {
  data: any;
  updateData: (updates: any) => void;
}

export const FinalPreferencesStep: React.FC<FinalPreferencesStepProps> = ({ data, updateData }) => {
  const { t } = useTranslation();

  const togglePreference = (key: string) => {
    const currentSettings = data.accessibilitySettings || {};
    updateData({
      accessibilitySettings: {
        ...currentSettings,
        [key]: !currentSettings[key]
      }
    });
  };

  const updateFontSize = (fontSize: string) => {
    const currentSettings = data.accessibilitySettings || {};
    updateData({
      accessibilitySettings: {
        ...currentSettings,
        fontSize
      }
    });
  };

  const accessibilitySettings = data.accessibilitySettings || {};

  return (
    <div className="space-y-6" data-testid="final-preferences-step">
      {/* Text-to-Speech */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
        <div>
          <Typography variant="body" className="font-medium mb-1">
            {t('onboarding.step8.textToSpeech')}
          </Typography>
          <Typography variant="body-sm" color="secondary">
            {t('onboarding.step8.textToSpeechDesc')}
          </Typography>
        </div>
        <button
          onClick={() => togglePreference('textToSpeech')}
          className={`
            w-12 h-6 rounded-full transition-colors
            ${accessibilitySettings.textToSpeech ? 'bg-blue-600' : 'bg-gray-300'}
          `}
          data-testid="textToSpeech-toggle"
        >
          <div className={`
            w-5 h-5 bg-white rounded-full transition-transform
            ${accessibilitySettings.textToSpeech ? 'translate-x-7' : 'translate-x-0.5'}
          `} />
        </button>
      </div>

      {/* Voice Input */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
        <div>
          <Typography variant="body" className="font-medium mb-1">
            {t('onboarding.step8.voiceInput')}
          </Typography>
          <Typography variant="body-sm" color="secondary">
            {t('onboarding.step8.voiceInputDesc')}
          </Typography>
        </div>
        <button
          onClick={() => togglePreference('voiceInput')}
          className={`
            w-12 h-6 rounded-full transition-colors
            ${accessibilitySettings.voiceInput ? 'bg-blue-600' : 'bg-gray-300'}
          `}
          data-testid="voiceInput-toggle"
        >
          <div className={`
            w-5 h-5 bg-white rounded-full transition-transform
            ${accessibilitySettings.voiceInput ? 'translate-x-7' : 'translate-x-0.5'}
          `} />
        </button>
      </div>

      {/* Video Recommendations */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
        <div>
          <Typography variant="body" className="font-medium mb-1">
            {t('onboarding.step8.videoRecommendations')}
          </Typography>
          <Typography variant="body-sm" color="secondary">
            {t('onboarding.step8.videoRecommendationsDesc')}
          </Typography>
        </div>
        <button
          onClick={() => {
            const currentUI = data.uiPreferences || {};
            updateData({
              uiPreferences: {
                ...currentUI,
                videoRecommendations: !currentUI.videoRecommendations
              }
            });
          }}
          className={`
            w-12 h-6 rounded-full transition-colors
            ${data.uiPreferences?.videoRecommendations ? 'bg-blue-600' : 'bg-gray-300'}
          `}
          data-testid="videoRecommendations-toggle"
        >
          <div className={`
            w-5 h-5 bg-white rounded-full transition-transform
            ${data.uiPreferences?.videoRecommendations ? 'translate-x-7' : 'translate-x-0.5'}
          `} />
        </button>
      </div>

      {/* Text Size */}
      <div>
        <label className="block mb-2">
          <Typography variant="body" className="font-medium">
            {t('onboarding.step8.textSize')}
          </Typography>
        </label>
        <select
          value={accessibilitySettings.fontSize || 'medium'}
          onChange={(e) => updateFontSize(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg text-lg"
          data-testid="fontSize-select"
        >
          <option value="small">{t('onboarding.step8.textSizeNormal')}</option>
          <option value="medium">{t('onboarding.step8.textSizeLarge')}</option>
          <option value="large">{t('onboarding.step8.textSizeExtraLarge')}</option>
        </select>
      </div>
    </div>
  );
};