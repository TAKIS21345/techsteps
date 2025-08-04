/**
 * MovementConfigurationPanel - User interface for avatar movement settings
 * 
 * This component provides controls for motion sensitivity, language preferences,
 * cultural settings, and real-time preview of movement changes.
 * 
 * Requirements addressed:
 * - 4.1: Configurable movement parameters for different contexts
 * - 4.2: Context-specific movement profiles
 * - 4.3: Culture-specific gesture and movement patterns
 * - 5.4: Real-time preference change handling
 */

import React, { useState, useEffect } from 'react';
import { MotionSettings, CulturalProfile, AccentProfile } from '../../../services/avatar/movement/types';
import { languageDetectionService } from '../../../services/avatar/LanguageDetectionService';

export interface MovementConfigurationProps {
  currentMotionSettings: MotionSettings;
  currentCulturalProfile: CulturalProfile;
  currentAccentProfile: AccentProfile;
  onMotionSettingsChange: (settings: Partial<MotionSettings>) => void;
  onCulturalProfileChange: (profile: Partial<CulturalProfile>) => void;
  onAccentProfileChange: (profile: Partial<AccentProfile>) => void;
  onPreviewMovement?: (movementType: string) => void;
  className?: string;
}

const MovementConfigurationPanel: React.FC<MovementConfigurationProps> = ({
  currentMotionSettings,
  currentCulturalProfile,
  currentAccentProfile,
  onMotionSettingsChange,
  onCulturalProfileChange,
  onAccentProfileChange,
  onPreviewMovement,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'motion' | 'language' | 'culture'>('motion');
  const [previewActive, setPreviewActive] = useState(false);

  // Available options
  const intensityOptions = [
    { value: 'minimal', label: 'Minimal', description: 'Essential movements only' },
    { value: 'reduced', label: 'Reduced', description: 'Subtle movements' },
    { value: 'standard', label: 'Standard', description: 'Natural movements' },
    { value: 'enhanced', label: 'Enhanced', description: 'Expressive movements' }
  ];

  const languageOptions = [
    { value: 'en-US', label: 'English (US)', flag: '🇺🇸' },
    { value: 'es-ES', label: 'Spanish (Spain)', flag: '🇪🇸' },
    { value: 'fr-FR', label: 'French (France)', flag: '🇫🇷' },
    { value: 'de-DE', label: 'German (Germany)', flag: '🇩🇪' },
    { value: 'it-IT', label: 'Italian (Italy)', flag: '🇮🇹' }
  ];

  const culturalOptions = [
    { value: 'western', label: 'Western', description: 'Moderate gestures, direct eye contact' },
    { value: 'eastern', label: 'Eastern', description: 'Subtle gestures, respectful movements' },
    { value: 'mediterranean', label: 'Mediterranean', description: 'Expressive gestures, animated movements' },
    { value: 'nordic', label: 'Nordic', description: 'Reserved movements, minimal gestures' }
  ];

  const handlePreviewMovement = (movementType: string) => {
    setPreviewActive(true);
    onPreviewMovement?.(movementType);
    
    // Reset preview state after 2 seconds
    setTimeout(() => {
      setPreviewActive(false);
    }, 2000);
  };

  const renderMotionSettings = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Movement Intensity
        </label>
        <div className="grid grid-cols-2 gap-2">
          {intensityOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => onMotionSettingsChange({ intensity: option.value as any })}
              className={`p-3 text-left rounded-lg border transition-all ${
                currentMotionSettings.intensity === option.value
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="font-medium">{option.label}</div>
              <div className="text-xs text-gray-500 mt-1">{option.description}</div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Movement Features
        </label>
        <div className="space-y-3">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={currentMotionSettings.enableHeadMovements}
              onChange={(e) => onMotionSettingsChange({ enableHeadMovements: e.target.checked })}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Head movements</span>
          </label>
          
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={currentMotionSettings.enableGestures}
              onChange={(e) => onMotionSettingsChange({ enableGestures: e.target.checked })}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Hand gestures</span>
          </label>
          
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={currentMotionSettings.enableIdleAnimations}
              onChange={(e) => onMotionSettingsChange({ enableIdleAnimations: e.target.checked })}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Idle animations</span>
          </label>
        </div>
      </div>

      <div>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={currentMotionSettings.motionSensitivity}
            onChange={(e) => onMotionSettingsChange({ motionSensitivity: e.target.checked })}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="ml-2 text-sm text-gray-700">
            Motion sensitivity mode
            <span className="block text-xs text-gray-500">Reduces movement for comfort</span>
          </span>
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Custom Intensity Scale: {(currentMotionSettings.customIntensityScale * 100).toFixed(0)}%
        </label>
        <input
          type="range"
          min="0.1"
          max="2.0"
          step="0.1"
          value={currentMotionSettings.customIntensityScale}
          onChange={(e) => onMotionSettingsChange({ customIntensityScale: parseFloat(e.target.value) })}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>10%</span>
          <span>100%</span>
          <span>200%</span>
        </div>
      </div>

      <div className="pt-4 border-t">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Preview Movements</h4>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => handlePreviewMovement('nod')}
            disabled={previewActive}
            className="px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50"
          >
            Head Nod
          </button>
          <button
            onClick={() => handlePreviewMovement('tilt')}
            disabled={previewActive}
            className="px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50"
          >
            Head Tilt
          </button>
          <button
            onClick={() => handlePreviewMovement('gesture')}
            disabled={previewActive}
            className="px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50"
          >
            Hand Gesture
          </button>
          <button
            onClick={() => handlePreviewMovement('idle')}
            disabled={previewActive}
            className="px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50"
          >
            Idle Animation
          </button>
        </div>
        {previewActive && (
          <div className="mt-2 text-xs text-blue-600 text-center">
            Previewing movement...
          </div>
        )}
      </div>
    </div>
  );

  const renderLanguageSettings = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Language & Accent
        </label>
        <div className="space-y-2">
          {languageOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onAccentProfileChange({ language: option.value });
                languageDetectionService.setCurrentLanguage(option.value);
              }}
              className={`w-full p-3 text-left rounded-lg border transition-all ${
                currentAccentProfile.language === option.value
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center">
                <span className="text-lg mr-3">{option.flag}</span>
                <span className="font-medium">{option.label}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Speech Characteristics
        </label>
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-600 mb-1">
              Speech Rate: {currentAccentProfile.speechRhythm.beatsPerMinute} BPM
            </label>
            <input
              type="range"
              min="100"
              max="200"
              value={currentAccentProfile.speechRhythm.beatsPerMinute}
              onChange={(e) => onAccentProfileChange({
                speechRhythm: {
                  ...currentAccentProfile.speechRhythm,
                  beatsPerMinute: parseInt(e.target.value)
                }
              })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Slow</span>
              <span>Normal</span>
              <span>Fast</span>
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-600 mb-1">
              Head Movement Frequency: {(currentAccentProfile.headMovementStyle.nodFrequency * 100).toFixed(0)}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={currentAccentProfile.headMovementStyle.nodFrequency}
              onChange={(e) => onAccentProfileChange({
                headMovementStyle: {
                  ...currentAccentProfile.headMovementStyle,
                  nodFrequency: parseFloat(e.target.value)
                }
              })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-600 mb-2">Emphasis Style</label>
            <div className="grid grid-cols-3 gap-2">
              {['subtle', 'moderate', 'expressive'].map((style) => (
                <button
                  key={style}
                  onClick={() => onAccentProfileChange({
                    headMovementStyle: {
                      ...currentAccentProfile.headMovementStyle,
                      emphasisStyle: style as any
                    }
                  })}
                  className={`px-3 py-2 text-xs rounded capitalize ${
                    currentAccentProfile.headMovementStyle.emphasisStyle === style
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCulturalSettings = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Cultural Context
        </label>
        <div className="space-y-2">
          {culturalOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => onCulturalProfileChange({ region: option.value })}
              className={`w-full p-3 text-left rounded-lg border transition-all ${
                currentCulturalProfile.region === option.value
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="font-medium">{option.label}</div>
              <div className="text-xs text-gray-500 mt-1">{option.description}</div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Movement Amplitude
        </label>
        <input
          type="range"
          min="0.5"
          max="2.0"
          step="0.1"
          value={currentCulturalProfile.movementAmplitude}
          onChange={(e) => onCulturalProfileChange({ movementAmplitude: parseFloat(e.target.value) })}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Reserved</span>
          <span>Natural</span>
          <span>Expressive</span>
        </div>
        <div className="text-center text-xs text-gray-600 mt-1">
          {(currentCulturalProfile.movementAmplitude * 100).toFixed(0)}%
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Eye Contact Patterns
        </label>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1">
              Frequency: {(currentCulturalProfile.eyeContactPatterns.frequency * 100).toFixed(0)}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={currentCulturalProfile.eyeContactPatterns.frequency}
              onChange={(e) => onCulturalProfileChange({
                eyeContactPatterns: {
                  ...currentCulturalProfile.eyeContactPatterns,
                  frequency: parseFloat(e.target.value)
                }
              })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-600 mb-1">
              Duration: {(currentCulturalProfile.eyeContactPatterns.duration / 1000).toFixed(1)}s
            </label>
            <input
              type="range"
              min="500"
              max="5000"
              step="100"
              value={currentCulturalProfile.eyeContactPatterns.duration}
              onChange={(e) => onCulturalProfileChange({
                eyeContactPatterns: {
                  ...currentCulturalProfile.eyeContactPatterns,
                  duration: parseInt(e.target.value)
                }
              })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={currentCulturalProfile.eyeContactPatterns.avoidance}
              onChange={(e) => onCulturalProfileChange({
                eyeContactPatterns: {
                  ...currentCulturalProfile.eyeContactPatterns,
                  avoidance: e.target.checked
                }
              })}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Avoid direct eye contact</span>
          </label>
        </div>
      </div>
    </div>
  );

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className={`fixed bottom-20 right-4 z-30 bg-white border border-gray-200 rounded-lg shadow-lg p-3 hover:shadow-xl transition-shadow ${className}`}
      >
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium text-gray-700">Movement Settings</span>
        </div>
      </button>
    );
  }

  return (
    <div className={`fixed bottom-4 right-4 z-30 bg-white border border-gray-200 rounded-lg shadow-xl w-80 max-h-96 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800">Avatar Settings</h3>
        <button
          onClick={() => setIsExpanded(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {[
          { id: 'motion', label: 'Motion', icon: '🎭' },
          { id: 'language', label: 'Language', icon: '🌍' },
          { id: 'culture', label: 'Culture', icon: '🎨' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <span className="mr-1">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-4 overflow-y-auto max-h-80">
        {activeTab === 'motion' && renderMotionSettings()}
        {activeTab === 'language' && renderLanguageSettings()}
        {activeTab === 'culture' && renderCulturalSettings()}
      </div>
    </div>
  );
};

export default MovementConfigurationPanel;