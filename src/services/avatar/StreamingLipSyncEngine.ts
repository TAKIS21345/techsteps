import * as THREE from 'three';
import { GoogleTTSService } from '../tts/GoogleTTSService';

// Viseme mapping based on Oculus/Meta standards
export interface Viseme {
  name: string;
  index: number;
  intensity: number;
}

export interface StreamingLipSyncConfig {
  sampleRate: number;
  frameSize: number;
  smoothingFactor: number;
  intensityMultiplier: number;
  enableRealTimeProcessing: boolean;
}

export interface AudioAnalysisData {
  frequency: Float32Array;
  amplitude: number;
  spectralCentroid: number;
  zeroCrossingRate: number;
  mfcc: Float32Array;
}

export class StreamingLipSyncEngine {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaElementAudioSourceNode | null = null;
  
  private morphTargets: Map<string, THREE.Mesh> | null = null;
  private isProcessing = false;
  private animationId: number | null = null;
  
  private config: StreamingLipSyncConfig = {
    sampleRate: 48000,
    frameSize: 1024,
    smoothingFactor: 0.8,
    intensityMultiplier: 1.5,
    enableRealTimeProcessing: true
  };

  // Viseme to morph target mapping (Oculus/Meta standard)
  private visemeMapping: Record<string, string> = {
    'sil': 'viseme_sil',      // Silence
    'PP': 'viseme_PP',        // P, B, M
    'FF': 'viseme_FF',        // F, V
    'TH': 'viseme_TH',        // TH
    'DD': 'viseme_DD',        // T, D
    'kk': 'viseme_kk',        // K, G
    'CH': 'viseme_CH',        // CH, J, SH
    'SS': 'viseme_SS',        // S, Z
    'nn': 'viseme_nn',        // N, L
    'RR': 'viseme_RR',        // R
    'aa': 'viseme_aa',        // A (father)
    'E': 'viseme_E',          // E (bed)
    'I': 'viseme_I',          // I (bit)
    'O': 'viseme_O',          // O (thought)
    'U': 'viseme_U'           // U (book)
  };

  // Phoneme to viseme mapping for better accuracy
  private phonemeToViseme: Record<string, string> = {
    // Silence
    'SIL': 'sil',
    
    // Bilabials (lips together)
    'P': 'PP', 'B': 'PP', 'M': 'PP',
    
    // Labiodentals (lip to teeth)
    'F': 'FF', 'V': 'FF',
    
    // Dental/Interdental
    'TH': 'TH', 'DH': 'TH',
    
    // Alveolar (tongue to alveolar ridge)
    'T': 'DD', 'D': 'DD', 'N': 'nn', 'L': 'nn', 'S': 'SS', 'Z': 'SS',
    
    // Post-alveolar
    'SH': 'CH', 'ZH': 'CH', 'CH': 'CH', 'JH': 'CH',
    
    // Retroflex
    'R': 'RR',
    
    // Velar
    'K': 'kk', 'G': 'kk', 'NG': 'nn',
    
    // Vowels
    'AA': 'aa', 'AE': 'aa', 'AH': 'aa', 'AO': 'O', 'AW': 'aa',
    'AY': 'aa', 'EH': 'E', 'ER': 'E', 'EY': 'E',
    'IH': 'I', 'IY': 'I', 'OW': 'O', 'OY': 'O',
    'UH': 'U', 'UW': 'U', 'Y': 'I'
  };

  constructor(morphTargets: Map<string, THREE.Mesh>, config?: Partial<StreamingLipSyncConfig>) {
    this.morphTargets = morphTargets;
    if (config) {
      this.config = { ...this.config, ...config };
    }
    this.initializeAudioContext();
  }

  /**
   * Initialize Web Audio API context for real-time processing
   */
  private async initializeAudioContext(): Promise<void> {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: this.config.sampleRate
      });

      // Create analyser for frequency analysis
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = this.config.frameSize * 2;
      this.analyser.smoothingTimeConstant = this.config.smoothingFactor;

      console.log('✅ Streaming lip sync audio context initialized');
    } catch (error) {
      console.error('❌ Failed to initialize audio context:', error);
    }
  }

  /**
   * Start streaming lip sync with Google TTS audio
   */
  async startStreamingLipSync(
    text: string, 
    googleTTS: GoogleTTSService,
    onVisemeUpdate?: (visemes: Viseme[]) => void
  ): Promise<void> {
    if (!this.audioContext || !this.analyser) {
      console.error('Audio context not initialized');
      return;
    }

    try {
      this.isProcessing = true;

      // Generate audio with Google TTS
      const lipSyncData = await googleTTS.synthesizeForLipSync(text);
      
      // Create audio element for playback
      const audio = new Audio();
      const audioUrl = URL.createObjectURL(lipSyncData.audioBlob);
      audio.src = audioUrl;

      // Connect audio to Web Audio API for analysis
      this.source = this.audioContext.createMediaElementSource(audio);
      this.source.connect(this.analyser);
      this.analyser.connect(this.audioContext.destination);

      // Start real-time processing
      this.startRealTimeProcessing(onVisemeUpdate);

      // Start audio playback
      await audio.play();

      // Clean up when audio ends
      audio.onended = () => {
        this.stopStreamingLipSync();
        URL.revokeObjectURL(audioUrl);
      };

      console.log('🎭 Streaming lip sync started');

    } catch (error) {
      console.error('❌ Failed to start streaming lip sync:', error);
      this.isProcessing = false;
    }
  }

  /**
   * Start real-time audio processing for viseme generation
   */
  private startRealTimeProcessing(onVisemeUpdate?: (visemes: Viseme[]) => void): void {
    if (!this.analyser || !this.config.enableRealTimeProcessing) return;

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const frequencyData = new Float32Array(bufferLength);

    const processFrame = () => {
      if (!this.isProcessing || !this.analyser) return;

      // Get frequency and time domain data
      this.analyser.getByteFrequencyData(dataArray);
      this.analyser.getFloatFrequencyData(frequencyData);

      // Analyze audio characteristics
      const analysisData = this.analyzeAudioFrame(dataArray, frequencyData);
      
      // Generate visemes from audio analysis
      const visemes = this.generateVisemesFromAudio(analysisData);
      
      // Apply visemes to morph targets
      this.applyVisemesToMorphTargets(visemes);
      
      // Callback for external processing
      if (onVisemeUpdate) {
        onVisemeUpdate(visemes);
      }

      // Continue processing
      this.animationId = requestAnimationFrame(processFrame);
    };

    processFrame();
  }

  /**
   * Analyze audio frame for lip sync characteristics
   */
  private analyzeAudioFrame(timeData: Uint8Array, frequencyData: Float32Array): AudioAnalysisData {
    // Calculate amplitude (volume)
    let amplitude = 0;
    for (let i = 0; i < timeData.length; i++) {
      amplitude += timeData[i];
    }
    amplitude = amplitude / timeData.length / 255.0;

    // Calculate spectral centroid (brightness)
    let weightedSum = 0;
    let magnitudeSum = 0;
    for (let i = 0; i < frequencyData.length; i++) {
      const magnitude = Math.pow(10, frequencyData[i] / 20); // Convert dB to linear
      weightedSum += i * magnitude;
      magnitudeSum += magnitude;
    }
    const spectralCentroid = magnitudeSum > 0 ? weightedSum / magnitudeSum : 0;

    // Calculate zero crossing rate (roughness)
    let crossings = 0;
    for (let i = 1; i < timeData.length; i++) {
      if ((timeData[i] >= 128) !== (timeData[i - 1] >= 128)) {
        crossings++;
      }
    }
    const zeroCrossingRate = crossings / timeData.length;

    // Simple MFCC-like features (simplified)
    const mfcc = this.calculateSimpleMFCC(frequencyData);

    return {
      frequency: frequencyData,
      amplitude,
      spectralCentroid: spectralCentroid / frequencyData.length,
      zeroCrossingRate,
      mfcc
    };
  }

  /**
   * Calculate simplified MFCC features for phoneme classification
   */
  private calculateSimpleMFCC(frequencyData: Float32Array): Float32Array {
    const numCoefficients = 13;
    const mfcc = new Float32Array(numCoefficients);
    
    // Simplified mel-scale filterbank
    const melFilters = this.createMelFilterbank(frequencyData.length, numCoefficients);
    
    for (let i = 0; i < numCoefficients; i++) {
      let sum = 0;
      for (let j = 0; j < frequencyData.length; j++) {
        const magnitude = Math.pow(10, frequencyData[j] / 20);
        sum += magnitude * melFilters[i][j];
      }
      mfcc[i] = Math.log(Math.max(sum, 1e-10));
    }
    
    return mfcc;
  }

  /**
   * Create simplified mel-scale filterbank
   */
  private createMelFilterbank(fftSize: number, numFilters: number): Float32Array[] {
    const filters: Float32Array[] = [];
    
    for (let i = 0; i < numFilters; i++) {
      const filter = new Float32Array(fftSize);
      const center = (i + 1) * fftSize / (numFilters + 1);
      const width = fftSize / numFilters;
      
      for (let j = 0; j < fftSize; j++) {
        const distance = Math.abs(j - center);
        if (distance < width) {
          filter[j] = 1 - distance / width;
        }
      }
      
      filters.push(filter);
    }
    
    return filters;
  }

  /**
   * Generate visemes from real-time audio analysis
   */
  private generateVisemesFromAudio(analysisData: AudioAnalysisData): Viseme[] {
    const visemes: Viseme[] = [];

    // Silence detection
    if (analysisData.amplitude < 0.01) {
      visemes.push({
        name: 'sil',
        index: 0,
        intensity: 1.0
      });
      return visemes;
    }

    // Classify phoneme based on audio characteristics
    const phoneme = this.classifyPhonemeFromAudio(analysisData);
    const visemeName = this.phonemeToViseme[phoneme] || 'sil';
    
    // Calculate intensity based on amplitude
    const intensity = Math.min(1.0, analysisData.amplitude * this.config.intensityMultiplier);

    visemes.push({
      name: visemeName,
      index: this.getVisemeIndex(visemeName),
      intensity
    });

    // Add secondary visemes for smoother transitions
    const secondaryVisemes = this.generateSecondaryVisemes(analysisData, visemeName);
    visemes.push(...secondaryVisemes);

    return visemes;
  }

  /**
   * Classify phoneme from audio characteristics using simplified rules
   */
  private classifyPhonemeFromAudio(analysisData: AudioAnalysisData): string {
    const { amplitude, spectralCentroid, zeroCrossingRate, mfcc } = analysisData;

    // Silence
    if (amplitude < 0.01) return 'SIL';

    // High-frequency content (sibilants)
    if (spectralCentroid > 0.7 && zeroCrossingRate > 0.1) {
      return Math.random() > 0.5 ? 'S' : 'SH';
    }

    // Fricatives (high frequency, moderate amplitude)
    if (spectralCentroid > 0.6 && amplitude > 0.05) {
      return Math.random() > 0.5 ? 'F' : 'TH';
    }

    // Vowels (low frequency, high amplitude)
    if (spectralCentroid < 0.4 && amplitude > 0.1) {
      // Use MFCC to distinguish vowels
      if (mfcc[1] > mfcc[2]) return 'AA'; // Open vowel
      if (mfcc[2] > mfcc[1]) return 'IY'; // Close vowel
      return 'EH'; // Mid vowel
    }

    // Nasals (moderate frequency, steady amplitude)
    if (spectralCentroid > 0.3 && spectralCentroid < 0.6 && zeroCrossingRate < 0.05) {
      return 'M';
    }

    // Stops (low frequency, variable amplitude)
    if (spectralCentroid < 0.3) {
      return Math.random() > 0.5 ? 'P' : 'T';
    }

    // Default to a neutral vowel
    return 'AH';
  }

  /**
   * Generate secondary visemes for smoother animation
   */
  private generateSecondaryVisemes(analysisData: AudioAnalysisData, primaryViseme: string): Viseme[] {
    const secondaryVisemes: Viseme[] = [];
    
    // Add subtle mouth opening based on amplitude
    if (analysisData.amplitude > 0.05 && primaryViseme !== 'sil') {
      secondaryVisemes.push({
        name: 'aa',
        index: this.getVisemeIndex('aa'),
        intensity: analysisData.amplitude * 0.3
      });
    }

    return secondaryVisemes;
  }

  /**
   * Get viseme index for morph target mapping
   */
  private getVisemeIndex(visemeName: string): number {
    const visemeIndices: Record<string, number> = {
      'sil': 0, 'PP': 1, 'FF': 2, 'TH': 3, 'DD': 4,
      'kk': 5, 'CH': 6, 'SS': 7, 'nn': 8, 'RR': 9,
      'aa': 10, 'E': 11, 'I': 12, 'O': 13, 'U': 14
    };
    return visemeIndices[visemeName] || 0;
  }

  /**
   * Apply visemes to Three.js morph targets
   */
  private applyVisemesToMorphTargets(visemes: Viseme[]): void {
    if (!this.morphTargets) return;

    // Reset all morph targets
    this.morphTargets.forEach((mesh) => {
      if (mesh.morphTargetInfluences) {
        for (let i = 0; i < mesh.morphTargetInfluences.length; i++) {
          mesh.morphTargetInfluences[i] *= 0.9; // Smooth decay
        }
      }
    });

    // Apply new viseme intensities
    visemes.forEach((viseme) => {
      const morphTargetName = this.visemeMapping[viseme.name];
      if (morphTargetName) {
        this.morphTargets!.forEach((mesh) => {
          if (mesh.morphTargetInfluences && mesh.morphTargetDictionary) {
            const index = mesh.morphTargetDictionary[morphTargetName];
            if (index !== undefined) {
              mesh.morphTargetInfluences[index] = Math.min(1.0, 
                mesh.morphTargetInfluences[index] + viseme.intensity
              );
            }
          }
        });
      }
    });
  }

  /**
   * Process pre-generated phoneme data for non-streaming mode
   */
  async processPhonemeData(
    phonemes: Array<{ phoneme: string; timestamp: number; confidence: number }>,
    duration: number,
    onVisemeUpdate?: (visemes: Viseme[]) => void
  ): Promise<void> {
    if (!phonemes.length) return;

    this.isProcessing = true;
    let currentIndex = 0;
    const startTime = Date.now();

    const processPhonemes = () => {
      if (!this.isProcessing || currentIndex >= phonemes.length) {
        this.isProcessing = false;
        return;
      }

      const elapsed = Date.now() - startTime;
      const currentPhoneme = phonemes[currentIndex];

      if (elapsed >= currentPhoneme.timestamp) {
        // Convert phoneme to viseme
        const visemeName = this.phonemeToViseme[currentPhoneme.phoneme] || 'sil';
        const viseme: Viseme = {
          name: visemeName,
          index: this.getVisemeIndex(visemeName),
          intensity: currentPhoneme.confidence
        };

        // Apply to morph targets
        this.applyVisemesToMorphTargets([viseme]);
        
        // Callback
        if (onVisemeUpdate) {
          onVisemeUpdate([viseme]);
        }

        currentIndex++;
      }

      this.animationId = requestAnimationFrame(processPhonemes);
    };

    processPhonemes();
  }

  /**
   * Stop streaming lip sync processing
   */
  stopStreamingLipSync(): void {
    this.isProcessing = false;

    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }

    // Reset morph targets
    if (this.morphTargets) {
      this.morphTargets.forEach((mesh) => {
        if (mesh.morphTargetInfluences) {
          for (let i = 0; i < mesh.morphTargetInfluences.length; i++) {
            mesh.morphTargetInfluences[i] = 0;
          }
        }
      });
    }

    console.log('🛑 Streaming lip sync stopped');
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<StreamingLipSyncConfig>): void {
    this.config = { ...this.config, ...config };
    
    if (this.analyser) {
      this.analyser.smoothingTimeConstant = this.config.smoothingFactor;
    }
  }

  /**
   * Get current processing status
   */
  isActive(): boolean {
    return this.isProcessing;
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    this.stopStreamingLipSync();
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.morphTargets = null;
  }
}