import React, { useState } from 'react';
import { FlashcardStep } from '../../types/services';
import FlashcardDisplay from './FlashcardDisplay';
import AudioPlaybackControls from './AudioPlaybackControls';
import { geminiTTSService } from '../../services/ai/GeminiTTSService';

// Sample flashcard data for demonstration
const sampleFlashcards: FlashcardStep[] = [
  {
    id: 'step-1',
    stepNumber: 1,
    title: 'Getting Started with Email',
    content: 'Email is a way to send messages to other people using the internet. Think of it like sending a letter, but much faster!',
    instructions: [
      'Open your email application or website',
      'Look for a button that says "Compose" or "New Email"',
      'Click on that button to start writing your message'
    ],
    estimatedDuration: 120
  },
  {
    id: 'step-2',
    stepNumber: 2,
    title: 'Writing Your Email',
    content: 'Now you\'ll write your email message. Every email has three main parts: who it\'s going to, what it\'s about, and your message.',
    instructions: [
      'In the "To" field, type the email address of the person you want to send to',
      'In the "Subject" field, write a short description of what your email is about',
      'In the large text box, type your message just like you would write a letter'
    ],
    estimatedDuration: 180
  },
  {
    id: 'step-3',
    stepNumber: 3,
    title: 'Sending Your Email',
    content: 'Once you\'ve written your email, it\'s time to send it! This is the final step to get your message to the other person.',
    instructions: [
      'Read through your email one more time to make sure it says what you want',
      'Look for a button that says "Send" - it\'s usually blue or green',
      'Click the "Send" button and your email will be delivered!'
    ],
    estimatedDuration: 60
  }
];

export const AudioPlaybackDemo: React.FC = () => {
  const [currentDemo, setCurrentDemo] = useState<'controls' | 'flashcards'>('controls');
  const [testText, setTestText] = useState(
    'Welcome to the senior learning platform! This is a demonstration of our audio playback system. The text-to-speech feature helps you listen to content at your own pace. You can adjust the speed and volume to make it comfortable for you.'
  );
  const [audioCapabilities, setAudioCapabilities] = useState<any>(null);

  // Test audio capabilities
  const testCapabilities = async () => {
    try {
      const capabilities = await geminiTTSService.testAudioCapabilities();
      setAudioCapabilities(capabilities);
    } catch (error) {
      console.error('Failed to test audio capabilities:', error);
      setAudioCapabilities({ error: 'Failed to test capabilities' });
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Audio Playback with Gemini TTS Demo
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
          Demonstration of the audio playback functionality for senior learners
        </p>
        
        {/* Demo selector */}
        <div className="flex justify-center space-x-4 mb-6">
          <button
            onClick={() => setCurrentDemo('controls')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              currentDemo === 'controls'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Audio Controls Demo
          </button>
          <button
            onClick={() => setCurrentDemo('flashcards')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              currentDemo === 'flashcards'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Flashcard Demo
          </button>
        </div>
      </div>

      {/* Audio Capabilities Test */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Audio System Status
          </h2>
          <button
            onClick={testCapabilities}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
          >
            Test Capabilities
          </button>
        </div>
        
        {audioCapabilities && (
          <div className="space-y-2 text-sm">
            {audioCapabilities.error ? (
              <p className="text-red-600">Error: {audioCapabilities.error}</p>
            ) : (
              <>
                <p className="text-gray-700 dark:text-gray-300">
                  <strong>Speech Synthesis:</strong> {audioCapabilities.speechSynthesis ? '✅ Available' : '❌ Not Available'}
                </p>
                <p className="text-gray-700 dark:text-gray-300">
                  <strong>Available Voices:</strong> {audioCapabilities.voicesAvailable}
                </p>
                {audioCapabilities.recommendedVoice && (
                  <p className="text-gray-700 dark:text-gray-300">
                    <strong>Recommended Voice:</strong> {audioCapabilities.recommendedVoice}
                  </p>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Demo Content */}
      {currentDemo === 'controls' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Audio Controls Demo
            </h2>
            
            {/* Text input for testing */}
            <div className="mb-6">
              <label htmlFor="test-text" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Test Text (edit to try different content):
              </label>
              <textarea
                id="test-text"
                value={testText}
                onChange={(e) => setTestText(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Enter text to test audio playback..."
              />
            </div>

            {/* Audio controls */}
            <AudioPlaybackControls
              text={testText}
              autoHighlight={true}
              onPlayStart={() => console.log('Audio started')}
              onPlayEnd={() => console.log('Audio ended')}
              onError={(error) => console.error('Audio error:', error)}
              className="border border-gray-200 dark:border-gray-600 rounded-lg p-4"
            />
          </div>

          {/* Features explanation */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-3">
              Audio Features for Seniors
            </h3>
            <ul className="space-y-2 text-blue-700 dark:text-blue-300">
              <li>• <strong>Slower Default Speed:</strong> Set to 0.8x for clearer comprehension</li>
              <li>• <strong>Large Controls:</strong> 44px+ touch targets for easy interaction</li>
              <li>• <strong>Visual Feedback:</strong> Text highlighting and progress indicators</li>
              <li>• <strong>Gemini Integration:</strong> Text optimization for better speech synthesis</li>
              <li>• <strong>Fallback Support:</strong> Browser SpeechSynthesis API as backup</li>
              <li>• <strong>Keyboard Navigation:</strong> Full keyboard accessibility support</li>
            </ul>
          </div>
        </div>
      )}

      {currentDemo === 'flashcards' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Flashcard with Audio Demo
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Navigate through the steps and use the "Read Aloud" feature to hear each step.
            </p>

            <FlashcardDisplay
              steps={sampleFlashcards}
              showAudioControls={true}
              autoPlayAudio={false}
              onComplete={() => {
                alert('Congratulations! You\'ve completed all the steps. Great job learning about email!');
              }}
            />
          </div>

          {/* Integration explanation */}
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-3">
              Flashcard Integration Features
            </h3>
            <ul className="space-y-2 text-green-700 dark:text-green-300">
              <li>• <strong>Step-by-Step Audio:</strong> Each flashcard can be read aloud completely</li>
              <li>• <strong>Progress Tracking:</strong> Visual indicators show completion status</li>
              <li>• <strong>Mobile Gestures:</strong> Swipe left/right to navigate on touch devices</li>
              <li>• <strong>Keyboard Shortcuts:</strong> Arrow keys, Home/End for navigation</li>
              <li>• <strong>Auto-Play Option:</strong> Automatically read new steps (can be enabled)</li>
              <li>• <strong>Restart Functionality:</strong> Easy way to start over from the beginning</li>
            </ul>
          </div>
        </div>
      )}

      {/* Technical Implementation Notes */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-3">
          Technical Implementation Notes
        </h3>
        <div className="space-y-2 text-yellow-700 dark:text-yellow-300 text-sm">
          <p><strong>Gemini Integration:</strong> Uses Google Gemini AI to optimize text for speech synthesis</p>
          <p><strong>Fallback Strategy:</strong> Browser SpeechSynthesis API when Gemini TTS is unavailable</p>
          <p><strong>Senior-Friendly Defaults:</strong> 0.8x speed, high contrast, large controls</p>
          <p><strong>Accessibility:</strong> WCAG 2.1 AA compliant with screen reader support</p>
          <p><strong>Performance:</strong> Lazy loading and efficient resource management</p>
          <p><strong>Error Handling:</strong> Graceful degradation with clear error messages</p>
        </div>
      </div>
    </div>
  );
};

export default AudioPlaybackDemo;