/**
 * AvatarMovementDemoPage - Demonstration page for the enhanced avatar movement system
 * 
 * This page showcases the new movement configuration interface and allows users
 * to test different motion settings, language accents, and cultural adaptations.
 */

import React, { useState } from 'react';
import BasicVRMViewer from '../components/ai/avatar/BasicVRMViewer';
import { MotionSettings } from '../services/avatar/movement/types';

const AvatarMovementDemoPage: React.FC = () => {
  const [currentText, setCurrentText] = useState('');
  const [isAvatarVisible, setIsAvatarVisible] = useState(true);
  const [speechComplete, setSpeechComplete] = useState(true);

  const sampleTexts = [
    {
      language: 'en-US',
      text: 'Hello! Welcome to the enhanced avatar movement system. This demonstrates natural head movements and gestures.',
      label: 'English Sample'
    },
    {
      language: 'es-ES',
      text: '¡Hola! Bienvenido al sistema mejorado de movimientos del avatar. Esto demuestra movimientos naturales de cabeza y gestos.',
      label: 'Spanish Sample'
    },
    {
      language: 'fr-FR',
      text: 'Bonjour! Bienvenue dans le système de mouvement d\'avatar amélioré. Ceci démontre les mouvements naturels de la tête et les gestes.',
      label: 'French Sample'
    },
    {
      language: 'de-DE',
      text: 'Hallo! Willkommen im verbesserten Avatar-Bewegungssystem. Dies demonstriert natürliche Kopfbewegungen und Gesten.',
      label: 'German Sample'
    }
  ];

  const questionTexts = [
    'How are you feeling today?',
    'What would you like to learn?',
    'Do you understand this concept?',
    'Would you like me to explain that again?'
  ];

  const emphasisTexts = [
    'This is very important information!',
    'Pay close attention to this key concept.',
    'Remember: practice makes perfect!',
    'Excellent work! You\'re doing great!'
  ];

  const handleSpeak = (text: string) => {
    if (!speechComplete) return;
    
    setCurrentText(text);
    setSpeechComplete(false);
  };

  const handleSpeechComplete = () => {
    setSpeechComplete(true);
    setCurrentText('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Enhanced Avatar Movement System
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Experience the new deliberate movement patterns, accent adaptation, and cultural gesture variations. 
            Use the configuration panel to customize motion sensitivity, language settings, and cultural preferences.
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Control Panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* Avatar Controls */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Avatar Controls</h2>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setIsAvatarVisible(!isAvatarVisible)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      isAvatarVisible
                        ? 'bg-green-500 text-white hover:bg-green-600'
                        : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                    }`}
                  >
                    {isAvatarVisible ? 'Hide Avatar' : 'Show Avatar'}
                  </button>
                  
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${speechComplete ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`}></div>
                    <span className="text-sm text-gray-600">
                      {speechComplete ? 'Ready' : 'Speaking...'}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Custom Text
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      placeholder="Enter text for the avatar to speak..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleSpeak((e.target as HTMLInputElement).value);
                          (e.target as HTMLInputElement).value = '';
                        }
                      }}
                    />
                    <button
                      onClick={() => {
                        const input = document.querySelector('input[type="text"]') as HTMLInputElement;
                        if (input.value.trim()) {
                          handleSpeak(input.value);
                          input.value = '';
                        }
                      }}
                      disabled={!speechComplete}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Speak
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Language Samples */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Language & Accent Samples</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {sampleTexts.map((sample, index) => (
                  <button
                    key={index}
                    onClick={() => handleSpeak(sample.text)}
                    disabled={!speechComplete}
                    className="p-4 text-left bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="font-medium text-blue-800">{sample.label}</div>
                    <div className="text-sm text-blue-600 mt-1 line-clamp-2">
                      {sample.text.substring(0, 80)}...
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Movement Type Samples */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Movement Pattern Samples</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-700 mb-2">Questions (Head Tilts)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {questionTexts.map((text, index) => (
                      <button
                        key={index}
                        onClick={() => handleSpeak(text)}
                        disabled={!speechComplete}
                        className="p-3 text-left bg-yellow-50 hover:bg-yellow-100 rounded-lg border border-yellow-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <div className="text-sm text-yellow-800">{text}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-700 mb-2">Emphasis (Head Nods & Gestures)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {emphasisTexts.map((text, index) => (
                      <button
                        key={index}
                        onClick={() => handleSpeak(text)}
                        disabled={!speechComplete}
                        className="p-3 text-left bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <div className="text-sm text-green-800">{text}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature Information */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">New Features</h2>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div>
                    <h3 className="font-medium text-gray-800">Deliberate Movements</h3>
                    <p className="text-sm text-gray-600">Natural head movements that correspond to speech emphasis and conversation patterns.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <h3 className="font-medium text-gray-800">Accent Adaptation</h3>
                    <p className="text-sm text-gray-600">Speech patterns and pronunciation adapt based on the selected language.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                  <div>
                    <h3 className="font-medium text-gray-800">Cultural Gestures</h3>
                    <p className="text-sm text-gray-600">Gesture patterns adapt to different cultural contexts and preferences.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                  <div>
                    <h3 className="font-medium text-gray-800">Motion Sensitivity</h3>
                    <p className="text-sm text-gray-600">Configurable movement intensity for users with motion sensitivity.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">How to Use</h2>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-start space-x-2">
                  <span className="font-bold text-blue-600">1.</span>
                  <span>Click the "Movement Settings" button near the avatar to open the configuration panel.</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="font-bold text-blue-600">2.</span>
                  <span>Adjust motion intensity, enable/disable features, and set cultural preferences.</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="font-bold text-blue-600">3.</span>
                  <span>Try different language samples to see accent adaptation in action.</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="font-bold text-blue-600">4.</span>
                  <span>Use the preview buttons to test individual movement patterns.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Avatar Component */}
      <BasicVRMViewer
        isVisible={isAvatarVisible}
        textToSpeak={currentText}
        onSpeechComplete={handleSpeechComplete}
        showConfigurationPanel={true}
      />
    </div>
  );
};

export default AvatarMovementDemoPage;