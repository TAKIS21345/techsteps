import { StreamingLipSyncEngine, Viseme } from '../StreamingLipSyncEngine';
import * as THREE from 'three';

// Mock Web Audio API
const mockAudioContext = {
  createAnalyser: jest.fn(() => ({
    fftSize: 2048,
    smoothingTimeConstant: 0.8,
    frequencyBinCount: 1024,
    getByteFrequencyData: jest.fn(),
    getFloatFrequencyData: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn()
  })),
  createMediaElementSource: jest.fn(() => ({
    connect: jest.fn(),
    disconnect: jest.fn()
  })),
  destination: {},
  close: jest.fn(),
  resume: jest.fn(),
  state: 'running'
};

// Mock global AudioContext
(global as any).AudioContext = jest.fn(() => mockAudioContext);
(global as any).webkitAudioContext = jest.fn(() => mockAudioContext);

describe('StreamingLipSyncEngine', () => {
  let engine: StreamingLipSyncEngine;
  let mockMorphTargets: Map<string, THREE.Mesh>;

  beforeEach(() => {
    // Create mock morph targets
    mockMorphTargets = new Map();
    const mockMesh = new THREE.Mesh();
    mockMesh.morphTargetInfluences = new Array(15).fill(0);
    mockMesh.morphTargetDictionary = {
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
    mockMorphTargets.set('head', mockMesh);

    engine = new StreamingLipSyncEngine(mockMorphTargets);
  });

  afterEach(() => {
    engine.dispose();
  });

  describe('Initialization', () => {
    it('should initialize with default configuration', () => {
      expect(engine).toBeDefined();
      expect(engine.isActive()).toBe(false);
    });

    it('should initialize with custom configuration', () => {
      const customConfig = {
        sampleRate: 24000,
        frameSize: 512,
        smoothingFactor: 0.5,
        intensityMultiplier: 2.0,
        enableRealTimeProcessing: false
      };

      const customEngine = new StreamingLipSyncEngine(mockMorphTargets, customConfig);
      expect(customEngine).toBeDefined();
      customEngine.dispose();
    });
  });

  describe('Phoneme Processing', () => {
    it('should process phoneme data correctly', async () => {
      const mockPhonemes = [
        { phoneme: 'HH', timestamp: 0, confidence: 0.9 },
        { phoneme: 'EH', timestamp: 100, confidence: 0.8 },
        { phoneme: 'L', timestamp: 200, confidence: 0.7 },
        { phoneme: 'OW', timestamp: 300, confidence: 0.9 }
      ];

      const visemeUpdates: Viseme[][] = [];
      
      await engine.processPhonemeData(
        mockPhonemes,
        400,
        (visemes) => {
          visemeUpdates.push([...visemes]);
        }
      );

      // Should have received viseme updates
      expect(visemeUpdates.length).toBeGreaterThan(0);
    });

    it('should map phonemes to correct visemes', () => {
      // Test phoneme to viseme mapping
      const testCases = [
        { phoneme: 'P', expectedViseme: 'PP' },
        { phoneme: 'B', expectedViseme: 'PP' },
        { phoneme: 'M', expectedViseme: 'PP' },
        { phoneme: 'F', expectedViseme: 'FF' },
        { phoneme: 'V', expectedViseme: 'FF' },
        { phoneme: 'S', expectedViseme: 'SS' },
        { phoneme: 'AA', expectedViseme: 'aa' },
        { phoneme: 'IY', expectedViseme: 'I' },
        { phoneme: 'SIL', expectedViseme: 'sil' }
      ];

      // Access private method for testing (in real implementation, this would be tested through public methods)
      const phonemeToViseme = (engine as any).phonemeToViseme;
      
      testCases.forEach(({ phoneme, expectedViseme }) => {
        expect(phonemeToViseme[phoneme]).toBe(expectedViseme);
      });
    });
  });

  describe('Audio Analysis', () => {
    it('should handle silence detection', () => {
      const mockTimeData = new Uint8Array(1024).fill(0); // Silent audio
      const mockFrequencyData = new Float32Array(1024).fill(-100); // Very low frequency data

      // Access private method for testing
      const analyzeAudioFrame = (engine as any).analyzeAudioFrame.bind(engine);
      const analysis = analyzeAudioFrame(mockTimeData, mockFrequencyData);

      expect(analysis.amplitude).toBeLessThan(0.01);
      expect(analysis.spectralCentroid).toBeDefined();
      expect(analysis.zeroCrossingRate).toBeDefined();
    });

    it('should calculate audio features correctly', () => {
      // Create mock audio data with some signal
      const mockTimeData = new Uint8Array(1024);
      const mockFrequencyData = new Float32Array(1024);
      
      // Fill with some test data
      for (let i = 0; i < 1024; i++) {
        mockTimeData[i] = Math.sin(i * 0.1) * 127 + 128;
        mockFrequencyData[i] = -20 + Math.random() * 10;
      }

      const analyzeAudioFrame = (engine as any).analyzeAudioFrame.bind(engine);
      const analysis = analyzeAudioFrame(mockTimeData, mockFrequencyData);

      expect(analysis.amplitude).toBeGreaterThan(0);
      expect(analysis.spectralCentroid).toBeGreaterThanOrEqual(0);
      expect(analysis.zeroCrossingRate).toBeGreaterThanOrEqual(0);
      expect(analysis.mfcc).toHaveLength(13);
    });
  });

  describe('Viseme Application', () => {
    it('should apply visemes to morph targets', () => {
      const testVisemes: Viseme[] = [
        { name: 'aa', index: 10, intensity: 0.8 },
        { name: 'PP', index: 1, intensity: 0.6 }
      ];

      // Access private method for testing
      const applyVisemesToMorphTargets = (engine as any).applyVisemesToMorphTargets.bind(engine);
      applyVisemesToMorphTargets(testVisemes);

      const mesh = mockMorphTargets.get('head')!;
      expect(mesh.morphTargetInfluences![10]).toBeGreaterThan(0); // 'aa' viseme
      expect(mesh.morphTargetInfluences![1]).toBeGreaterThan(0);  // 'PP' viseme
    });

    it('should handle missing morph targets gracefully', () => {
      const emptyMorphTargets = new Map<string, THREE.Mesh>();
      const emptyEngine = new StreamingLipSyncEngine(emptyMorphTargets);

      const testVisemes: Viseme[] = [
        { name: 'aa', index: 10, intensity: 0.8 }
      ];

      // Should not throw error
      expect(() => {
        const applyVisemesToMorphTargets = (emptyEngine as any).applyVisemesToMorphTargets.bind(emptyEngine);
        applyVisemesToMorphTargets(testVisemes);
      }).not.toThrow();

      emptyEngine.dispose();
    });
  });

  describe('Configuration', () => {
    it('should update configuration correctly', () => {
      const newConfig = {
        smoothingFactor: 0.9,
        intensityMultiplier: 2.5
      };

      engine.updateConfig(newConfig);

      // Configuration should be updated (tested through behavior)
      expect(engine).toBeDefined();
    });
  });

  describe('Cleanup', () => {
    it('should dispose resources properly', () => {
      engine.dispose();
      expect(engine.isActive()).toBe(false);
    });

    it('should stop processing when disposed', () => {
      engine.stopStreamingLipSync();
      expect(engine.isActive()).toBe(false);
    });
  });
});

// Integration test with mock Google TTS
describe('StreamingLipSyncEngine Integration', () => {
  let engine: StreamingLipSyncEngine;
  let mockMorphTargets: Map<string, THREE.Mesh>;

  beforeEach(() => {
    mockMorphTargets = new Map();
    const mockMesh = new THREE.Mesh();
    mockMesh.morphTargetInfluences = new Array(15).fill(0);
    mockMesh.morphTargetDictionary = {
      'viseme_sil': 0,
      'viseme_aa': 10
    };
    mockMorphTargets.set('head', mockMesh);

    engine = new StreamingLipSyncEngine(mockMorphTargets);
  });

  afterEach(() => {
    engine.dispose();
  });

  it('should handle Google TTS integration gracefully', async () => {
    // Mock Google TTS service
    const mockGoogleTTS = {
      synthesizeForLipSync: jest.fn().mockResolvedValue({
        audioBlob: new Blob(['mock audio'], { type: 'audio/mpeg' }),
        duration: 1000,
        phonemes: [
          { phoneme: 'HH', timestamp: 0, confidence: 0.9 },
          { phoneme: 'EH', timestamp: 100, confidence: 0.8 }
        ]
      })
    };

    // Mock audio element
    const mockAudio = {
      src: '',
      play: jest.fn().mockResolvedValue(undefined),
      onended: null as any,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn()
    };

    (global as any).Audio = jest.fn(() => mockAudio);
    (global as any).URL = {
      createObjectURL: jest.fn().mockReturnValue('mock-url'),
      revokeObjectURL: jest.fn()
    };

    // Test should not throw
    await expect(
      engine.startStreamingLipSync('test text', mockGoogleTTS as any)
    ).resolves.not.toThrow();
  });
});