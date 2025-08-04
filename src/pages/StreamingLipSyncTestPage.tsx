import React, { useState, useRef, useEffect } from 'react';
import { StreamingLipSyncEngine, Viseme } from '../services/avatar/StreamingLipSyncEngine';
import { GoogleTTSService } from '../services/tts/GoogleTTSService';
import * as THREE from 'three';

const StreamingLipSyncTestPage: React.FC = () => {
  const [testText, setTestText] = useState('Hello! This is a test of streaming lip sync with Google Text-to-Speech. Watch how the avatar\'s mouth moves in real-time with the audio.');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visemeData, setVisemeData] = useState<Viseme[]>([]);
  const [audioAnalysis, setAudioAnalysis] = useState<any>(null);
  const [streamingEngine, setStreamingEngine] = useState<StreamingLipSyncEngine | null>(null);
  const [googleTTS] = useState(() => new GoogleTTSService('AIzaSyCGnrz2QNBKLCsqwzDESePSfNEcq0m24JY'));

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationIdRef = useRef<number | null>(null);

  useEffect(() => {
    initializeStreamingEngine();
    return () => {
      if (streamingEngine) {
        streamingEngine.dispose();
      }
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
    };
  }, []);

  const initializeStreamingEngine = () => {
    try {
      // Create mock morph targets for testing
      const mockMorphTargets = createMockMorphTargets();
      
      const engine = new StreamingLipSyncEngine(mockMorphTargets, {
        sampleRate: 48000,
        frameSize: 1024,
        smoothingFactor: 0.8,
        intensityMultiplier: 1.5,
        enableRealTimeProcessing: true
      });

      setStreamingEngine(engine);
      console.log('✅ Streaming lip sync engine initialized');
    } catch (err) {
      setError(`Failed to initialize streaming engine: ${err instanceof Error ? err.message : 'Unknown error'}`);
      console.error('❌ Engine initialization failed:', err);
    }
  };

  const createMockMorphTargets = (): Map<string, THREE.Mesh> => {
    const morphTargets = new Map<string, THREE.Mesh>();
    
    // Create a simple mesh with morph targets for testing
    const geometry = new THREE.PlaneGeometry(1, 1);
    const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const mesh = new THREE.Mesh(geometry, material);
    
    // Add mock morph target influences
    mesh.morphTargetInfluences = new Array(15).fill(0);
    mesh.morphTargetDictionary = {
      'viseme_sil': 0,
      'viseme_PP': 1,
      'viseme_FF': 2,
      'viseme_TH': 3,
      'viseme_DD': 4,
      'viseme_kk': 5,
      'viseme_CH': 6,
      'viseme_SS': 7,
      'viseme_nn': 8,
      'viseme_RR': 9,
      'viseme_aa': 10,
      'viseme_E': 11,
      'viseme_I': 12,
      'viseme_O': 13,
      'viseme_U': 14
    };
    
    morphTargets.set('head', mesh);
    return morphTargets;
  };

  const handleStartStreamingLipSync = async () => {
    if (!streamingEngine || isProcessing) return;

    try {
      setError(null);
      setIsProcessing(true);
      setVisemeData([]);
      setAudioAnalysis(null);

      console.log('🎭 Starting streaming lip sync test...');

      await streamingEngine.startStreamingLipSync(
        testText,
        googleTTS,
        (visemes: Viseme[]) => {
          setVisemeData([...visemes]);
          console.log('🗣️ Visemes updated:', visemes);
        }
      );

      console.log('✅ Streaming lip sync completed');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Streaming lip sync failed');
      console.error('❌ Streaming lip sync error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStopStreamingLipSync = () => {
    if (streamingEngine) {
      streamingEngine.stopStreamingLipSync();
      setIsProcessing(false);
      setVisemeData([]);
      console.log('🛑 Streaming lip sync stopped');
    }
  };

  const handleTestPhonemeProcessing = async () => {
    if (!streamingEngine) return;

    try {
      setError(null);
      console.log('🧪 Testing phoneme processing...');

      // Generate mock phoneme data
      const mockPhonemes = [
        { phoneme: 'HH', timestamp: 0, confidence: 0.9 },
        { phoneme: 'EH', timestamp: 100, confidence: 0.8 },
        { phoneme: 'L', timestamp: 200, confidence: 0.7 },
        { phoneme: 'OW', timestamp: 300, confidence: 0.9 },
        { phoneme: 'SIL', timestamp: 400, confidence: 1.0 }
      ];

      await streamingEngine.processPhonemeData(
        mockPhonemes,
        500,
        (visemes: Viseme[]) => {
          setVisemeData([...visemes]);
          console.log('📊 Phoneme visemes:', visemes);
        }
      );

      console.log('✅ Phoneme processing test completed');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Phoneme processing failed');
      console.error('❌ Phoneme processing error:', err);
    }
  };

  const renderVisemeVisualization = () => {
    if (visemeData.length === 0) return null;

    return (
      <div className="grid grid-cols-3 gap-2">
        {visemeData.map((viseme, index) => (
          <div
            key={index}
            className="bg-blue-100 p-2 rounded text-center"
            style={{
              backgroundColor: `rgba(59, 130, 246, ${viseme.intensity})`,
              color: viseme.intensity > 0.5 ? 'white' : 'black'
            }}
          >
            <div className="font-semibold">{viseme.name}</div>
            <div className="text-sm">{(viseme.intensity * 100).toFixed(1)}%</div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Streaming Lip Sync Test</h1>

          {/* Status */}
          <div className="mb-6 p-4 rounded-lg border">
            <h2 className="text-lg font-semibold mb-2">Engine Status</h2>
            <div className="flex items-center space-x-2">
              {streamingEngine ? (
                <>
                  <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                  <span className="text-green-600">Streaming engine ready</span>
                  {isProcessing && (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 ml-4"></div>
                      <span className="text-blue-600">Processing...</span>
                    </>
                  )}
                </>
              ) : (
                <>
                  <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                  <span className="text-red-600">Engine not initialized</span>
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
              placeholder="Enter text for lip sync testing..."
            />
          </div>

          {/* Control Buttons */}
          <div className="mb-6 flex flex-wrap gap-4">
            <button
              onClick={handleStartStreamingLipSync}
              disabled={!streamingEngine || isProcessing}
              className={`px-6 py-3 rounded-lg font-semibold ${
                isProcessing
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              } disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors`}
            >
              {isProcessing ? '⏹️ Stop Streaming' : '🎭 Start Streaming Lip Sync'}
            </button>

            <button
              onClick={handleStopStreamingLipSync}
              disabled={!streamingEngine || !isProcessing}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              🛑 Stop
            </button>

            <button
              onClick={handleTestPhonemeProcessing}
              disabled={!streamingEngine || isProcessing}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              🧪 Test Phoneme Processing
            </button>

            <button
              onClick={initializeStreamingEngine}
              className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition-colors"
            >
              🔄 Reinitialize Engine
            </button>
          </div>

          {/* Viseme Visualization */}
          {visemeData.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Current Visemes</h3>
              {renderVisemeVisualization()}
            </div>
          )}

          {/* Real-time Data Display */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Viseme Data */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-3">Viseme Data</h3>
              <div className="max-h-64 overflow-y-auto">
                {visemeData.length > 0 ? (
                  <pre className="text-sm text-gray-700">
                    {JSON.stringify(visemeData, null, 2)}
                  </pre>
                ) : (
                  <p className="text-gray-500">No viseme data available</p>
                )}
              </div>
            </div>

            {/* Audio Analysis */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-3">Audio Analysis</h3>
              <div className="max-h-64 overflow-y-auto">
                {audioAnalysis ? (
                  <pre className="text-sm text-gray-700">
                    {JSON.stringify(audioAnalysis, null, 2)}
                  </pre>
                ) : (
                  <p className="text-gray-500">No audio analysis data available</p>
                )}
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-blue-800 font-semibold mb-2">How to Use:</h3>
            <ul className="text-blue-700 space-y-1 text-sm">
              <li>• <strong>Start Streaming Lip Sync:</strong> Processes Google TTS audio in real-time</li>
              <li>• <strong>Test Phoneme Processing:</strong> Tests phoneme-to-viseme conversion</li>
              <li>• <strong>Viseme Visualization:</strong> Shows current mouth shapes and intensities</li>
              <li>• Check the browser console for detailed processing logs</li>
              <li>• The system analyzes audio frequency, amplitude, and spectral features</li>
            </ul>
          </div>

          {/* Technical Info */}
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="text-green-800 font-semibold mb-2">Technical Features:</h3>
            <ul className="text-green-700 space-y-1 text-sm">
              <li>• <strong>Real-time Audio Analysis:</strong> Web Audio API with FFT processing</li>
              <li>• <strong>Viseme Mapping:</strong> Oculus/Meta standard viseme set</li>
              <li>• <strong>Phoneme Classification:</strong> MFCC-based audio feature analysis</li>
              <li>• <strong>Smooth Transitions:</strong> Configurable smoothing and intensity control</li>
              <li>• <strong>Google TTS Integration:</strong> High-quality neural voice synthesis</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StreamingLipSyncTestPage;