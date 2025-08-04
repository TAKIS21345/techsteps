import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Play, Square, Volume2, VolumeX } from 'lucide-react';
import AvatarSystem from './AvatarSystem';

const AvatarDemo: React.FC = () => {
  const { t } = useTranslation();
  const [avatarEnabled, setAvatarEnabled] = useState(true);
  const [performanceMode, setPerformanceMode] = useState<'high' | 'medium' | 'low' | 'off'>('medium');
  const [textToSpeak, setTextToSpeak] = useState('');
  const [currentSpeechText, setCurrentSpeechText] = useState<string | undefined>();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [emotionalState, setEmotionalState] = useState({
    primary: 'neutral' as 'neutral' | 'happy' | 'concerned' | 'encouraging' | 'thinking',
    intensity: 0.5,
    duration: 1000
  });

  const sampleTexts = [
    "Hello! I'm your AI assistant. How can I help you today?",
    "Let me guide you through this step by step.",
    "Great job! You're doing wonderfully.",
    "Don't worry, we'll figure this out together.",
    "I'm thinking about the best way to help you with this."
  ];

  const handleSpeak = (text: string) => {
    if (isSpeaking) return;
    
    setCurrentSpeechText(text);
    setIsSpeaking(true);
    
    // Set appropriate emotional state based on text content
    if (text.includes('Great') || text.includes('wonderful')) {
      setEmotionalState({ primary: 'happy', intensity: 0.8, duration: 3000 });
    } else if (text.includes('thinking')) {
      setEmotionalState({ primary: 'thinking', intensity: 0.7, duration: 2000 });
    } else if (text.includes('help') || text.includes('guide')) {
      setEmotionalState({ primary: 'encouraging', intensity: 0.6, duration: 2000 });
    } else {
      setEmotionalState({ primary: 'neutral', intensity: 0.5, duration: 1000 });
    }
  };

  const handleSpeechComplete = () => {
    setCurrentSpeechText(undefined);
    setIsSpeaking(false);
    setEmotionalState({ primary: 'neutral', intensity: 0.5, duration: 1000 });
  };

  const handleCustomSpeak = () => {
    if (textToSpeak.trim() && !isSpeaking) {
      handleSpeak(textToSpeak.trim());
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            Avatar Lip Sync Demo
          </h1>
          <p className="text-gray-600 mb-6">
            Test the 3D avatar system with phoneme-based lip synchronization. 
            Click the sample texts below or enter your own text to see the avatar speak with realistic lip movements.
          </p>

          {/* Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Avatar Controls */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700">Avatar Controls</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Performance Mode
                </label>
                <select
                  value={performanceMode}
                  onChange={(e) => setPerformanceMode(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="high">High Quality</option>
                  <option value="medium">Medium Quality</option>
                  <option value="low">Low Quality</option>
                  <option value="off">Avatar Off</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Emotional State
                </label>
                <select
                  value={emotionalState.primary}
                  onChange={(e) => setEmotionalState({
                    ...emotionalState,
                    primary: e.target.value as any
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="neutral">Neutral</option>
                  <option value="happy">Happy</option>
                  <option value="encouraging">Encouraging</option>
                  <option value="thinking">Thinking</option>
                  <option value="concerned">Concerned</option>
                </select>
              </div>
            </div>

            {/* Speech Controls */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700">Speech Controls</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Custom Text
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={textToSpeak}
                    onChange={(e) => setTextToSpeak(e.target.value)}
                    placeholder="Enter text for the avatar to speak..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleCustomSpeak();
                      }
                    }}
                  />
                  <button
                    onClick={handleCustomSpeak}
                    disabled={!textToSpeak.trim() || isSpeaking}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    {isSpeaking ? <Square size={16} /> : <Play size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">Sample Texts:</p>
                <div className="space-y-2">
                  {sampleTexts.map((text, index) => (
                    <button
                      key={index}
                      onClick={() => handleSpeak(text)}
                      disabled={isSpeaking}
                      className="w-full text-left px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 disabled:bg-gray-200 disabled:cursor-not-allowed rounded-lg transition-colors duration-200"
                    >
                      {text}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Status */}
          {isSpeaking && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2">
                <Volume2 className="w-5 h-5 text-blue-600" />
                <span className="text-blue-800 font-medium">Speaking:</span>
                <span className="text-blue-700">"{currentSpeechText}"</span>
              </div>
            </div>
          )}

          {/* TTS Test */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-green-800 mb-2">TTS Service Test</h3>
            <p className="text-green-700 text-sm mb-3">
              Test the updated TTS service (now using browser speech synthesis instead of Camb.ai)
            </p>
            <button
              onClick={() => {
                import('../../../utils/ttsService').then(({ ttsService }) => {
                  ttsService.speak(
                    "Hello! This is a test of the updated TTS service. It now uses browser speech synthesis for better compatibility.",
                    { speed: 0.85 },
                    () => console.log('TTS started'),
                    () => console.log('TTS ended'),
                    (error) => console.error('TTS error:', error)
                  );
                });
              }}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
            >
              Test TTS Service
            </button>
          </div>
        </div>

        {/* Avatar System */}
        <AvatarSystem
          isActive={avatarEnabled}
          emotionalState={emotionalState}
          performanceMode={performanceMode}
          onPerformanceChange={(mode) => setPerformanceMode(mode as any)}
          onToggleAvatar={setAvatarEnabled}
          textToSpeak={currentSpeechText}
          onSpeechComplete={handleSpeechComplete}
        />
      </div>
    </div>
  );
};

export default AvatarDemo;