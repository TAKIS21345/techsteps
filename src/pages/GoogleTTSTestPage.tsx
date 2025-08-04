import React, { useState, useEffect } from 'react';
import { GoogleTTSService } from '../services/tts/GoogleTTSService';
import { ttsService } from '../utils/ttsService';

const GoogleTTSTestPage: React.FC = () => {
  const [testText, setTestText] = useState('Hello! This is a test of Google Text-to-Speech. How does it sound?');
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'testing' | 'connected' | 'failed'>('testing');
  const [availableVoices, setAvailableVoices] = useState<any[]>([]);
  const [selectedVoice, setSelectedVoice] = useState('en-US-Neural2-F');
  const [speed, setSpeed] = useState(0.85);
  const [pitch, setPitch] = useState(0.0);

  const googleTTS = new GoogleTTSService('AIzaSyCGnrz2QNBKLCsqwzDESePSfNEcq0m24JY');

  useEffect(() => {
    testConnection();
    loadVoices();
  }, []);

  const testConnection = async () => {
    try {
      const result = await googleTTS.testConnection();
      if (result.success) {
        setConnectionStatus('connected');
        console.log('✅ Google TTS connected successfully');
        console.log(`📢 ${result.voicesAvailable} voices available`);
      } else {
        setConnectionStatus('failed');
        setError(result.error || 'Connection failed');
        console.error('❌ Google TTS connection failed:', result.error);
      }
    } catch (err) {
      setConnectionStatus('failed');
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('❌ Connection test error:', err);
    }
  };

  const loadVoices = async () => {
    try {
      const voices = await googleTTS.getAvailableVoices();
      // Filter for English voices suitable for seniors
      const englishVoices = voices.filter(voice => 
        voice.languageCodes.includes('en-US') && 
        (voice.name.includes('Neural') || voice.name.includes('Standard'))
      );
      setAvailableVoices(englishVoices);
      console.log('🎤 Available voices:', englishVoices.length);
    } catch (err) {
      console.error('Failed to load voices:', err);
    }
  };

  const handleSpeak = async () => {
    if (isPlaying) {
      googleTTS.stop();
      setIsPlaying(false);
      return;
    }

    try {
      setError(null);
      setIsPlaying(true);

      const options = {
        voice: {
          languageCode: 'en-US',
          name: selectedVoice,
          ssmlGender: 'FEMALE' as const
        },
        audioConfig: {
          audioEncoding: 'MP3' as const,
          speakingRate: speed,
          pitch: pitch,
          volumeGainDb: 0.0
        }
      };

      await googleTTS.speak(testText, options, {
        onStart: () => {
          console.log('🗣️ Speech started');
        },
        onEnd: () => {
          console.log('✅ Speech completed');
          setIsPlaying(false);
        },
        onError: (error) => {
          console.error('❌ Speech error:', error);
          setError(error);
          setIsPlaying(false);
        },
        onProgress: (currentTime, duration) => {
          console.log(`⏱️ Progress: ${Math.round(currentTime)}ms / ${Math.round(duration)}ms`);
        }
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Speech failed');
      setIsPlaying(false);
      console.error('❌ Speech error:', err);
    }
  };

  const handleTestMainService = async () => {
    if (isPlaying) {
      ttsService.stop();
      setIsPlaying(false);
      return;
    }

    try {
      setError(null);
      setIsPlaying(true);

      await new Promise<void>((resolve, reject) => {
        ttsService.speak(
          testText,
          { speed: speed, language: 'en-US' },
          () => console.log('🗣️ Main service speech started'),
          () => {
            console.log('✅ Main service speech completed');
            setIsPlaying(false);
            resolve();
          },
          (error) => {
            console.error('❌ Main service speech error:', error);
            setError(error);
            setIsPlaying(false);
            reject(new Error(error));
          }
        );
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Speech failed');
      setIsPlaying(false);
    }
  };

  const handleTestLipSync = async () => {
    try {
      setError(null);
      console.log('🎭 Testing lip sync data generation...');

      const lipSyncData = await ttsService.synthesizeForLipSync(testText, {
        speed: speed,
        language: 'en-US'
      });

      console.log('✅ Lip sync data generated:');
      console.log(`📊 Duration: ${lipSyncData.duration}ms`);
      console.log(`🗣️ Phonemes: ${lipSyncData.phonemes.length}`);
      console.log('📝 First 10 phonemes:', lipSyncData.phonemes.slice(0, 10));

      if (lipSyncData.audioBlob) {
        console.log(`🎵 Audio blob size: ${lipSyncData.audioBlob.size} bytes`);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lip sync test failed');
      console.error('❌ Lip sync test error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Google TTS Test Page</h1>

          {/* Connection Status */}
          <div className="mb-6 p-4 rounded-lg border">
            <h2 className="text-lg font-semibold mb-2">Connection Status</h2>
            <div className="flex items-center space-x-2">
              {connectionStatus === 'testing' && (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-gray-600">Testing connection...</span>
                </>
              )}
              {connectionStatus === 'connected' && (
                <>
                  <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                  <span className="text-green-600">Connected to Google TTS</span>
                  <span className="text-gray-500">({availableVoices.length} voices available)</span>
                </>
              )}
              {connectionStatus === 'failed' && (
                <>
                  <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                  <span className="text-red-600">Connection failed</span>
                </>
              )}
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="text-red-800 font-semibold">Error:</h3>
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Test Text Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Test Text
            </label>
            <textarea
              value={testText}
              onChange={(e) => setTestText(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              placeholder="Enter text to speak..."
            />
          </div>

          {/* Voice Selection */}
          {availableVoices.length > 0 && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Voice Selection
              </label>
              <select
                value={selectedVoice}
                onChange={(e) => setSelectedVoice(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {availableVoices.map((voice) => (
                  <option key={voice.name} value={voice.name}>
                    {voice.name} ({voice.ssmlGender})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Speed Control */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Speaking Speed: {speed}x
            </label>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={speed}
              onChange={(e) => setSpeed(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Pitch Control */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pitch: {pitch}
            </label>
            <input
              type="range"
              min="-20"
              max="20"
              step="1"
              value={pitch}
              onChange={(e) => setPitch(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Test Buttons */}
          <div className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <button
                onClick={handleSpeak}
                disabled={connectionStatus !== 'connected'}
                className={`px-6 py-3 rounded-lg font-semibold ${
                  isPlaying
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                } disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors`}
              >
                {isPlaying ? '⏹️ Stop' : '🗣️ Test Google TTS Direct'}
              </button>

              <button
                onClick={handleTestMainService}
                className={`px-6 py-3 rounded-lg font-semibold ${
                  isPlaying
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                } transition-colors`}
              >
                {isPlaying ? '⏹️ Stop' : '🎤 Test Main TTS Service'}
              </button>

              <button
                onClick={handleTestLipSync}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors"
              >
                🎭 Test Lip Sync Data
              </button>
            </div>

            <button
              onClick={testConnection}
              className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition-colors"
            >
              🔄 Retry Connection
            </button>
          </div>

          {/* Instructions */}
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-blue-800 font-semibold mb-2">Instructions:</h3>
            <ul className="text-blue-700 space-y-1 text-sm">
              <li>• <strong>Test Google TTS Direct:</strong> Tests the Google TTS service directly</li>
              <li>• <strong>Test Main TTS Service:</strong> Tests the integrated TTS service (with Google TTS + fallback)</li>
              <li>• <strong>Test Lip Sync Data:</strong> Tests phoneme generation for avatar lip sync</li>
              <li>• Check the browser console for detailed logs</li>
              <li>• The service will fallback to browser TTS if Google TTS fails</li>
            </ul>
          </div>

          {/* API Key Info */}
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="text-yellow-800 font-semibold mb-2">API Key Status:</h3>
            <p className="text-yellow-700 text-sm">
              Using API Key: AIzaSyCGnrz2QNBKLCsqwzDESePSfNEcq0m24JY
              <br />
              {connectionStatus === 'connected' ? '✅ Key is working' : '❌ Key may be invalid or quota exceeded'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoogleTTSTestPage;