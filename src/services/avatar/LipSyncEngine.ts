import * as THREE from 'three';
import { VRM } from '@pixiv/three-vrm';
import { GoogleTTSService } from '../tts/GoogleTTSService';
// import { StreamingLipSyncEngine, Viseme } from './StreamingLipSyncEngine';
import { ttsService } from '../../utils/ttsService';

export interface Phoneme {
  symbol: string;
  confidence: number;
  duration: number;
  timestamp: number;
}

export interface LipSyncConfig {
  updateRate: number; // FPS for lip sync updates
  smoothingFactor: number; // 0-1, higher = more smoothing
  confidenceThreshold: number; // Minimum confidence to apply phoneme
  maxMorphWeight: number; // Maximum weight for morph targets
}

export class LipSyncEngine {
  private vrm: VRM;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private audioStream: MediaStream | null = null;
  private worker: Worker | null = null;
  private googleTTSService: GoogleTTSService;
  // private streamingEngine: StreamingLipSyncEngine | null = null;
  private isInitialized = false;
  private isActive = false;

  private config: LipSyncConfig = {
    updateRate: 30, // 30 FPS for lip sync
    smoothingFactor: 0.7,
    confidenceThreshold: 0.3,
    maxMorphWeight: 1.0
  };

  private currentPhonemes: Phoneme[] = [];
  private morphWeights: Map<string, number> = new Map();
  private lastUpdateTime = 0;

  constructor(vrm: VRM, config?: Partial<LipSyncConfig>) {
    this.vrm = vrm;
    this.googleTTSService = new GoogleTTSService('AIzaSyCGnrz2QNBKLCsqwzDESePSfNEcq0m24JY');
    
    // Initialize streaming lip sync engine with VRM morph targets
    // const morphTargets = this.extractMorphTargetsFromVRM();
    // this.streamingEngine = new StreamingLipSyncEngine(morphTargets, {
    //   sampleRate: 48000,
    //   frameSize: 1024,
    //   smoothingFactor: 0.8,
    //   intensityMultiplier: 1.5,
    //   enableRealTimeProcessing: true
    // });
    
    if (config) {
      this.config = { ...this.config, ...config };
    }
  }

  /**
   * Initialize the lip sync engine
   */
  async initialize(): Promise<void> {
    try {
      // Initialize Web Audio API
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

      // Create Web Worker for phoneme detection
      await this.initializeWorker();

      this.isInitialized = true;
      console.log('LipSyncEngine initialized successfully');
    } catch (error) {
      console.error('Failed to initialize LipSyncEngine:', error);
      throw error;
    }
  }

  /**
   * Initialize Web Worker for phoneme detection
   */
  private async initializeWorker(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Create inline worker for phoneme detection
        const workerCode = `
          class PhonemeDetector {
            constructor() {
              this.isInitialized = false;
              this.sampleRate = 16000;
              this.frameSize = 512;
              this.hopSize = 256;
            }

            async initialize() {
              // In a real implementation, this would load a phoneme detection model
              // For now, we'll use a simplified approach based on audio features
              this.isInitialized = true;
              return true;
            }

            detectPhonemes(audioData) {
              if (!this.isInitialized) {
                return [];
              }

              // Simplified phoneme detection based on audio features
              const phonemes = this.analyzeAudioFeatures(audioData);
              return phonemes;
            }

            analyzeAudioFeatures(audioData) {
              const phonemes = [];
              const frameCount = Math.floor((audioData.length - this.frameSize) / this.hopSize) + 1;
              
              for (let i = 0; i < frameCount; i++) {
                const start = i * this.hopSize;
                const end = start + this.frameSize;
                const frame = audioData.slice(start, end);
                
                // Calculate basic audio features
                const energy = this.calculateEnergy(frame);
                const spectralCentroid = this.calculateSpectralCentroid(frame);
                const zeroCrossingRate = this.calculateZeroCrossingRate(frame);
                
                // Map features to phonemes (simplified approach)
                const phoneme = this.mapFeaturesToPhoneme(energy, spectralCentroid, zeroCrossingRate);
                
                if (phoneme) {
                  phonemes.push({
                    symbol: phoneme,
                    confidence: Math.min(1.0, energy * 2),
                    duration: this.hopSize / this.sampleRate,
                    timestamp: (start / this.sampleRate) * 1000
                  });
                }
              }
              
              return phonemes;
            }

            calculateEnergy(frame) {
              let energy = 0;
              for (let i = 0; i < frame.length; i++) {
                energy += frame[i] * frame[i];
              }
              return Math.sqrt(energy / frame.length);
            }

            calculateSpectralCentroid(frame) {
              // Simplified spectral centroid calculation
              let weightedSum = 0;
              let magnitudeSum = 0;
              
              for (let i = 0; i < frame.length / 2; i++) {
                const magnitude = Math.abs(frame[i]);
                weightedSum += i * magnitude;
                magnitudeSum += magnitude;
              }
              
              return magnitudeSum > 0 ? weightedSum / magnitudeSum : 0;
            }

            calculateZeroCrossingRate(frame) {
              let crossings = 0;
              for (let i = 1; i < frame.length; i++) {
                if ((frame[i] >= 0) !== (frame[i - 1] >= 0)) {
                  crossings++;
                }
              }
              return crossings / frame.length;
            }

            mapFeaturesToPhoneme(energy, spectralCentroid, zeroCrossingRate) {
              // Simplified phoneme mapping based on audio features
              if (energy < 0.01) return 'SIL'; // Silence
              
              if (spectralCentroid > 0.7) {
                if (zeroCrossingRate > 0.1) return 'S'; // Sibilant
                return 'F'; // Fricative
              } else if (spectralCentroid > 0.4) {
                if (energy > 0.1) return 'IY'; // High vowel
                return 'EH'; // Mid vowel
              } else {
                if (energy > 0.15) return 'AA'; // Low vowel
                if (zeroCrossingRate < 0.05) return 'M'; // Nasal
                return 'B'; // Stop consonant
              }
            }
          }

          const detector = new PhonemeDetector();
          
          self.onmessage = async function(e) {
            const { type, data } = e.data;
            
            switch (type) {
              case 'initialize':
                try {
                  await detector.initialize();
                  self.postMessage({ type: 'initialized', success: true });
                } catch (error) {
                  self.postMessage({ type: 'initialized', success: false, error: error.message });
                }
                break;
                
              case 'detectPhonemes':
                try {
                  const phonemes = detector.detectPhonemes(data.audioData);
                  self.postMessage({ type: 'phonemes', phonemes });
                } catch (error) {
                  self.postMessage({ type: 'error', error: error.message });
                }
                break;
            }
          };
        `;

        const blob = new Blob([workerCode], { type: 'application/javascript' });
        this.worker = new Worker(URL.createObjectURL(blob));

        this.worker.onmessage = (e) => {
          const { type, phonemes, success, error } = e.data;

          switch (type) {
            case 'initialized':
              if (success) {
                resolve();
              } else {
                reject(new Error(error));
              }
              break;

            case 'phonemes':
              this.currentPhonemes = phonemes;
              break;

            case 'error':
              console.error('Worker error:', error);
              break;
          }
        };

        this.worker.onerror = (error) => {
          reject(error);
        };

        // Initialize the worker
        this.worker.postMessage({ type: 'initialize' });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Set audio stream for lip sync
   */
  setAudioStream(stream: MediaStream | null): void {
    if (this.audioStream) {
      this.stopLipSync();
    }

    this.audioStream = stream;

    if (stream && this.isInitialized) {
      this.startLipSync();
    }
  }

  /**
   * Start lip sync processing
   */
  private startLipSync(): void {
    if (!this.audioContext || !this.audioStream || this.isActive) return;

    try {
      // Create audio source from stream
      const source = this.audioContext.createMediaStreamSource(this.audioStream);

      // Create analyser for audio processing
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 1024;
      this.analyser.smoothingTimeConstant = 0.8;

      source.connect(this.analyser);

      this.isActive = true;
      this.processAudio();

      console.log('Lip sync started');
    } catch (error) {
      console.error('Failed to start lip sync:', error);
    }
  }

  /**
   * Stop lip sync processing
   */
  private stopLipSync(): void {
    this.isActive = false;

    if (this.analyser) {
      this.analyser.disconnect();
      this.analyser = null;
    }

    // Reset morph weights
    this.morphWeights.clear();
    this.updateVRMMorphTargets();

    console.log('Lip sync stopped');
  }

  /**
   * Process audio for phoneme detection
   */
  private processAudio(): void {
    if (!this.isActive || !this.analyser || !this.worker) return;

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Float32Array(bufferLength);
    this.analyser.getFloatFrequencyData(dataArray);

    // Send audio data to worker for phoneme detection
    this.worker.postMessage({
      type: 'detectPhonemes',
      data: { audioData: dataArray }
    });

    // Schedule next processing
    setTimeout(() => {
      if (this.isActive) {
        this.processAudio();
      }
    }, 1000 / this.config.updateRate);
  }

  /**
   * Update lip sync based on detected phonemes
   */
  update(): void {
    if (!this.isActive || !this.vrm.expressionManager) return;

    const now = Date.now();
    if (now - this.lastUpdateTime < 1000 / this.config.updateRate) return;

    this.lastUpdateTime = now;

    // Process current phonemes
    this.processPhonemes();

    // Update VRM morph targets
    this.updateVRMMorphTargets();
  }

  /**
   * Process detected phonemes and update morph weights
   */
  private processPhonemes(): void {
    // Clear previous weights
    this.morphWeights.clear();

    // Process current phonemes
    for (const phoneme of this.currentPhonemes) {
      if (phoneme.confidence < this.config.confidenceThreshold) continue;

      const morphTargets = this.getPhonemeToMorphMapping(phoneme.symbol);

      for (const { morphName, weight } of morphTargets) {
        const currentWeight = this.morphWeights.get(morphName) || 0;
        const newWeight = Math.min(
          this.config.maxMorphWeight,
          currentWeight + (weight * phoneme.confidence)
        );
        this.morphWeights.set(morphName, newWeight);
      }
    }

    // Apply smoothing
    this.applySmoothingToMorphWeights();
  }

  /**
   * Map phoneme to VRM morph targets
   */
  private getPhonemeToMorphMapping(phoneme: string): Array<{ morphName: string; weight: number }> {
    const mappings: Record<string, Array<{ morphName: string; weight: number }>> = {
      'AA': [{ morphName: 'aa', weight: 1.0 }],
      'AH': [{ morphName: 'aa', weight: 0.8 }],
      'IY': [{ morphName: 'ih', weight: 1.0 }],
      'IH': [{ morphName: 'ih', weight: 0.8 }],
      'UW': [{ morphName: 'ou', weight: 1.0 }],
      'EH': [{ morphName: 'ee', weight: 0.7 }],
      'AO': [{ morphName: 'oh', weight: 1.0 }],
      'B': [{ morphName: 'bmp', weight: 1.0 }],
      'M': [{ morphName: 'bmp', weight: 0.8 }],
      'P': [{ morphName: 'bmp', weight: 0.9 }],
      'F': [{ morphName: 'ff', weight: 1.0 }],
      'V': [{ morphName: 'ff', weight: 0.8 }],
      'S': [{ morphName: 'ss', weight: 1.0 }],
      'Z': [{ morphName: 'ss', weight: 0.8 }],
      'SIL': [{ morphName: 'sil', weight: 1.0 }]
    };

    return mappings[phoneme] || [{ morphName: 'sil', weight: 0.5 }];
  }

  /**
   * Apply smoothing to morph weights
   */
  private applySmoothingToMorphWeights(): void {
    const smoothingFactor = this.config.smoothingFactor;

    this.morphWeights.forEach((weight, morphName) => {
      const previousWeight = this.morphWeights.get(morphName) || 0;
      const smoothedWeight = previousWeight * smoothingFactor + weight * (1 - smoothingFactor);
      this.morphWeights.set(morphName, smoothedWeight);
    });
  }

  /**
   * Update VRM morph targets with current weights
   */
  private updateVRMMorphTargets(): void {
    if (!this.vrm.expressionManager) return;

    // Reset all lip sync related expressions
    const lipSyncExpressions = ['aa', 'ih', 'ou', 'ee', 'oh', 'bmp', 'ff', 'ss', 'sil'];

    for (const expression of lipSyncExpressions) {
      const weight = this.morphWeights.get(expression) || 0;
      this.vrm.expressionManager.setValue(expression, weight);
    }
  }

  /**
   * Get current lip sync confidence
   */
  getLipSyncConfidence(): number {
    if (this.currentPhonemes.length === 0) return 0;

    const totalConfidence = this.currentPhonemes.reduce((sum, phoneme) => sum + phoneme.confidence, 0);
    return totalConfidence / this.currentPhonemes.length;
  }

  /**
   * Set lip sync configuration
   */
  setConfig(config: Partial<LipSyncConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): LipSyncConfig {
    return { ...this.config };
  }

  /**
   * Extract morph targets from VRM for streaming lip sync
   */
  // private extractMorphTargetsFromVRM(): Map<string, THREE.Mesh> {
  //   const morphTargets = new Map<string, THREE.Mesh>();
    
  //   if (this.vrm.scene) {
  //     this.vrm.scene.traverse((child) => {
  //       if (child instanceof THREE.Mesh && child.morphTargetDictionary) {
  //         morphTargets.set('head', child);
  //       }
  //     });
  //   }
    
  //   return morphTargets;
  // }

  /**
   * Sync lip movements with TTS audio using streaming engine
   */
  async syncWithTTS(text: string): Promise<void> {
    if (!this.isInitialized) {
      console.warn('LipSyncEngine not initialized');
      return;
    }

    try {
      // Use streaming engine for high-quality lip sync
      // if (this.streamingEngine) {
      //   await this.streamingEngine.startStreamingLipSync(
      //     text,
      //     this.googleTTSService,
      //     (visemes: Viseme[]) => {
      //       // Update VRM expressions based on visemes
      //       this.applyVisemesToVRM(visemes);
      //     }
      //   );
      //   console.log('🎭 Streaming lip sync started for TTS');
      //   return;
      // }

      // Fallback to traditional method
      const lipSyncData = await ttsService.synthesizeForLipSync(text, {
        speed: 0.9, // Slightly slower for better lip sync
        language: 'en-US'
      });

      // Schedule phoneme playback
      this.schedulePhonemePlayback(lipSyncData.phonemes);

      console.log(`Lip sync scheduled for ${lipSyncData.phonemes.length} phonemes`);
    } catch (error) {
      console.error('Failed to sync with TTS:', error);
    }
  }

  /**
   * Apply visemes to VRM expressions
   */
  // private applyVisemesToVRM(visemes: Viseme[]): void {
  //   if (!this.vrm.expressionManager) return;

  //   // Reset all lip sync expressions
  //   const lipSyncExpressions = ['aa', 'ih', 'ou', 'ee', 'oh', 'bmp', 'ff', 'ss', 'sil'];
  //   for (const expression of lipSyncExpressions) {
  //     this.vrm.expressionManager.setValue(expression, 0);
  //   }

  //   // Apply visemes to VRM expressions
  //   for (const viseme of visemes) {
  //     const vrmExpression = this.mapVisemeToVRMExpression(viseme.name);
  //     if (vrmExpression) {
  //       this.vrm.expressionManager.setValue(vrmExpression, viseme.intensity);
  //     }
  //   }
  // }

  /**
   * Map viseme names to VRM expression names
   */
  // private mapVisemeToVRMExpression(visemeName: string): string | null {
  //   const mapping: Record<string, string> = {
  //     'sil': 'sil',
  //     'PP': 'bmp',
  //     'FF': 'ff',
  //     'TH': 'th',
  //     'DD': 'dd',
  //     'kk': 'kk',
  //     'CH': 'ch',
  //     'SS': 'ss',
  //     'nn': 'nn',
  //     'RR': 'rr',
  //     'aa': 'aa',
  //     'E': 'ee',
  //     'I': 'ih',
  //     'O': 'oh',
  //     'U': 'ou'
  //   };
    
  //   return mapping[visemeName] || null;
  // }

  /**
   * Start streaming lip sync with real-time audio processing
   */
  // async startStreamingLipSync(text: string): Promise<void> {
  //   if (!this.streamingEngine) {
  //     console.warn('Streaming engine not available');
  //     return this.syncWithTTS(text);
  //   }

  //   try {
  //     await this.streamingEngine.startStreamingLipSync(
  //       text,
  //       this.googleTTSService,
  //       (visemes: Viseme[]) => {
  //         this.applyVisemesToVRM(visemes);
  //       }
  //     );
  //     console.log('🎭 Streaming lip sync started');
  //   } catch (error) {
  //     console.error('Failed to start streaming lip sync:', error);
  //     // Fallback to traditional method
  //     await this.syncWithTTS(text);
  //   }
  // }

  /**
   * Stop streaming lip sync
   */
  // stopStreamingLipSync(): void {
  //   if (this.streamingEngine) {
  //     this.streamingEngine.stopStreamingLipSync();
  //   }
  // }

  /**
   * Schedule phoneme playback for lip sync
   */
  private schedulePhonemePlayback(phonemes: Array<{ phoneme: string; timestamp: number; confidence: number }>): void {
    phonemes.forEach(({ phoneme, timestamp, confidence }) => {
      setTimeout(() => {
        if (this.isActive && confidence > this.config.confidenceThreshold) {
          // Apply phoneme to morph targets
          const morphTargets = this.getPhonemeToMorphMapping(phoneme);

          for (const { morphName, weight } of morphTargets) {
            const adjustedWeight = weight * confidence * this.config.maxMorphWeight;
            this.morphWeights.set(morphName, adjustedWeight);
          }

          // Update VRM immediately
          this.updateVRMMorphTargets();

          // Schedule reset after phoneme duration
          setTimeout(() => {
            this.morphWeights.set(phoneme.toLowerCase(), 0);
            this.updateVRMMorphTargets();
          }, 100); // 100ms phoneme duration
        }
      }, timestamp);
    });
  }

  /**
   * Get lip sync confidence for current TTS playback
   */
  getTTSLipSyncConfidence(): number {
    // Return confidence based on active morph weights
    let totalWeight = 0;
    let activeTargets = 0;

    this.morphWeights.forEach((weight) => {
      if (weight > 0) {
        totalWeight += weight;
        activeTargets++;
      }
    });

    return activeTargets > 0 ? totalWeight / activeTargets : 0;
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.stopLipSync();

    // if (this.streamingEngine) {
    //   this.streamingEngine.dispose();
    //   this.streamingEngine = null;
    // }

    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }

    if (this.googleTTSService) {
      this.googleTTSService.stop();
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.isInitialized = false;
    console.log('LipSyncEngine cleaned up');
  }
}