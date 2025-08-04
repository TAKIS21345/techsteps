import * as THREE from 'three';
import { PhonemeData, PhonemePreprocessor } from './PhonemePreprocessor';

export interface LipSyncState {
  currentPhoneme: string;
  currentViseme: string;
  intensity: number;
  mouthOpenness: number;
  lipPosition: number;
  tonguePosition: number;
}

export interface MorphTargetWeights {
  [key: string]: number;
}

/**
 * Precise lip sync engine using preprocessed phoneme timing data
 * This provides much more accurate lip sync than real-time audio analysis
 */
export class PreciseLipSyncEngine {
  private phonemes: PhonemeData[] = [];
  private currentTime = 0;
  private isPlaying = false;
  private startTime = 0;
  private preprocessor: PhonemePreprocessor;
  private animationFrameId: number | null = null;
  private onUpdateCallback?: (state: LipSyncState, morphWeights: MorphTargetWeights) => void;

  constructor() {
    this.preprocessor = new PhonemePreprocessor();
  }

  /**
   * Initialize with phoneme data
   */
  initialize(phonemes: PhonemeData[]): void {
    this.phonemes = phonemes;
    this.currentTime = 0;
    this.isPlaying = false;
  }

  /**
   * Start lip sync animation
   */
  start(onUpdate?: (state: LipSyncState, morphWeights: MorphTargetWeights) => void): void {
    if (this.phonemes.length === 0) {
      console.warn('No phoneme data available for lip sync');
      return;
    }

    this.onUpdateCallback = onUpdate;
    this.isPlaying = true;
    this.startTime = performance.now();
    this.animate();
  }

  /**
   * Stop lip sync animation
   */
  stop(): void {
    this.isPlaying = false;
    this.currentTime = 0;
    
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    // Reset to neutral position
    const neutralState: LipSyncState = {
      currentPhoneme: 'SIL',
      currentViseme: 'sil',
      intensity: 0,
      mouthOpenness: 0,
      lipPosition: 0,
      tonguePosition: 0
    };

    const neutralWeights = this.calculateMorphTargetWeights(neutralState);
    this.onUpdateCallback?.(neutralState, neutralWeights);
  }

  /**
   * Pause lip sync animation
   */
  pause(): void {
    this.isPlaying = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Resume lip sync animation
   */
  resume(): void {
    if (!this.isPlaying && this.phonemes.length > 0) {
      this.isPlaying = true;
      this.startTime = performance.now() - this.currentTime;
      this.animate();
    }
  }

  /**
   * Seek to specific time
   */
  seekTo(timeMs: number): void {
    this.currentTime = Math.max(0, timeMs);
    this.startTime = performance.now() - this.currentTime;
    
    if (this.isPlaying) {
      this.updateLipSync();
    }
  }

  /**
   * Main animation loop
   */
  private animate(): void {
    if (!this.isPlaying) return;

    this.currentTime = performance.now() - this.startTime;
    this.updateLipSync();

    this.animationFrameId = requestAnimationFrame(() => this.animate());
  }

  /**
   * Update lip sync based on current time
   */
  private updateLipSync(): void {
    const currentPhoneme = this.getCurrentPhoneme();
    
    if (!currentPhoneme) {
      // Use silence/neutral position
      const neutralState: LipSyncState = {
        currentPhoneme: 'SIL',
        currentViseme: 'sil',
        intensity: 0,
        mouthOpenness: 0,
        lipPosition: 0,
        tonguePosition: 0
      };
      
      const morphWeights = this.calculateMorphTargetWeights(neutralState);
      this.onUpdateCallback?.(neutralState, morphWeights);
      return;
    }

    // Calculate lip sync state based on current phoneme
    const lipSyncState = this.calculateLipSyncState(currentPhoneme);
    const morphWeights = this.calculateMorphTargetWeights(lipSyncState);
    
    this.onUpdateCallback?.(lipSyncState, morphWeights);
  }

  /**
   * Get current phoneme based on time
   */
  private getCurrentPhoneme(): PhonemeData | null {
    return this.preprocessor.getPhonemeAtTime(this.phonemes, this.currentTime);
  }

  /**
   * Calculate lip sync state from phoneme
   */
  private calculateLipSyncState(phoneme: PhonemeData): LipSyncState {
    const viseme = phoneme.viseme;
    const intensity = this.calculateIntensity(phoneme);
    
    // Calculate mouth parameters based on viseme
    const mouthParams = this.getVisemeMouthParameters(viseme);
    
    return {
      currentPhoneme: phoneme.phoneme,
      currentViseme: viseme,
      intensity,
      mouthOpenness: mouthParams.openness * intensity,
      lipPosition: mouthParams.lipPosition,
      tonguePosition: mouthParams.tonguePosition
    };
  }

  /**
   * Calculate intensity based on phoneme properties
   */
  private calculateIntensity(phoneme: PhonemeData): number {
    // Base intensity on phoneme type and confidence
    let baseIntensity = phoneme.confidence;
    
    // Vowels are generally more intense than consonants
    const vowels = ['AA', 'AE', 'AH', 'AO', 'AW', 'AY', 'EH', 'ER', 'EY', 'IH', 'IY', 'OW', 'OY', 'UH', 'UW'];
    if (vowels.includes(phoneme.phoneme)) {
      baseIntensity *= 1.2;
    }
    
    // Silence has no intensity
    if (phoneme.phoneme === 'SIL') {
      baseIntensity = 0;
    }
    
    return Math.min(1.0, baseIntensity);
  }

  /**
   * Get mouth parameters for a viseme
   */
  private getVisemeMouthParameters(viseme: string): {
    openness: number;
    lipPosition: number;
    tonguePosition: number;
  } {
    const visemeParams: Record<string, { openness: number; lipPosition: number; tonguePosition: number }> = {
      'sil': { openness: 0.0, lipPosition: 0.0, tonguePosition: 0.0 },
      
      // Bilabial (lips together)
      'PP': { openness: 0.1, lipPosition: 1.0, tonguePosition: 0.0 },
      
      // Labiodental (lip to teeth)
      'FF': { openness: 0.2, lipPosition: 0.8, tonguePosition: 0.0 },
      
      // Dental/Alveolar
      'TH': { openness: 0.3, lipPosition: 0.2, tonguePosition: 0.8 },
      'DD': { openness: 0.2, lipPosition: 0.1, tonguePosition: 0.9 },
      'SS': { openness: 0.1, lipPosition: 0.0, tonguePosition: 0.7 },
      
      // Post-alveolar
      'CH': { openness: 0.3, lipPosition: 0.3, tonguePosition: 0.6 },
      
      // Velar
      'kk': { openness: 0.4, lipPosition: 0.0, tonguePosition: 0.3 },
      
      // Approximants
      'RR': { openness: 0.3, lipPosition: 0.2, tonguePosition: 0.5 },
      'W': { openness: 0.2, lipPosition: 0.9, tonguePosition: 0.0 },
      
      // Vowels
      'AA': { openness: 0.8, lipPosition: 0.0, tonguePosition: 0.2 }, // "father"
      'E': { openness: 0.4, lipPosition: 0.1, tonguePosition: 0.6 },  // "bed"
      'I': { openness: 0.2, lipPosition: 0.2, tonguePosition: 0.8 },  // "bit"
      'O': { openness: 0.6, lipPosition: 0.7, tonguePosition: 0.3 },  // "boat"
      'U': { openness: 0.3, lipPosition: 0.9, tonguePosition: 0.2 }   // "book"
    };
    
    return visemeParams[viseme] || visemeParams['sil'];
  }

  /**
   * Calculate morph target weights for Ready Player Me avatar
   */
  private calculateMorphTargetWeights(state: LipSyncState): MorphTargetWeights {
    const weights: MorphTargetWeights = {};
    
    // Multiple possible naming conventions for morph targets
    const possibleTargetNames = [
      // Standard viseme naming
      'viseme_sil', 'viseme_PP', 'viseme_FF', 'viseme_TH', 'viseme_DD',
      'viseme_kk', 'viseme_CH', 'viseme_SS', 'viseme_nn', 'viseme_RR',
      'viseme_aa', 'viseme_E', 'viseme_I', 'viseme_O', 'viseme_U',
      
      // Alternative naming conventions
      'mouthOpen', 'mouthSmile', 'mouthFrown', 'mouthPucker', 'mouthFunnel',
      'mouthLeft', 'mouthRight', 'mouthRollUpper', 'mouthRollLower',
      'mouthShrugUpper', 'mouthShrugLower', 'mouthClose', 'mouthDimpleLeft',
      'mouthDimpleRight', 'mouthStretchLeft', 'mouthStretchRight',
      'mouthPressLeft', 'mouthPressRight', 'mouthLowerDownLeft', 'mouthLowerDownRight',
      'mouthUpperUpLeft', 'mouthUpperUpRight',
      
      // ARKit naming
      'jawOpen', 'jawForward', 'jawLeft', 'jawRight',
      'mouthClose', 'mouthFunnel', 'mouthPucker', 'mouthLeft', 'mouthRight',
      'mouthSmileLeft', 'mouthSmileRight', 'mouthFrownLeft', 'mouthFrownRight',
      'mouthDimpleLeft', 'mouthDimpleRight', 'mouthStretchLeft', 'mouthStretchRight',
      'mouthRollLower', 'mouthRollUpper', 'mouthShrugLower', 'mouthShrugUpper',
      'mouthPressLeft', 'mouthPressRight', 'mouthLowerDownLeft', 'mouthLowerDownRight',
      'mouthUpperUpLeft', 'mouthUpperUpRight'
    ];
    
    // Reset all possible weights
    possibleTargetNames.forEach(target => {
      weights[target] = 0;
    });
    
    // Map visemes to appropriate morph targets
    const visemeToMorphTargets = this.getVisemeToMorphTargetMapping(state.currentViseme);
    
    // Apply weights to mapped targets
    visemeToMorphTargets.forEach(({ target, weight }) => {
      weights[target] = weight * state.intensity;
    });
    
    return weights;
  }

  /**
   * Map visemes to VRM blend shapes with proper viseme targets
   * This version uses standard VRM viseme blend shapes for accurate lip sync
   */
  private getVisemeToMorphTargetMapping(viseme: string): Array<{ target: string; weight: number }> {
    const mappings: Record<string, Array<{ target: string; weight: number }>> = {
      'sil': [
        { target: 'viseme_sil', weight: 1.0 },
        { target: 'mouthClose', weight: 1.0 },
        { target: 'neutral', weight: 1.0 }
      ],
      'PP': [
        { target: 'viseme_PP', weight: 1.0 },
        { target: 'mouthClose', weight: 0.8 },
        { target: 'mouthPucker', weight: 0.3 }
      ],
      'FF': [
        { target: 'viseme_FF', weight: 1.0 },
        { target: 'mouthFunnel', weight: 0.6 },
        { target: 'mouthPucker', weight: 0.4 }
      ],
      'TH': [
        { target: 'viseme_TH', weight: 1.0 },
        { target: 'tongueOut', weight: 0.5 },
        { target: 'mouthOpen', weight: 0.3 }
      ],
      'DD': [
        { target: 'viseme_DD', weight: 1.0 },
        { target: 'mouthOpen', weight: 0.2 },
        { target: 'jawOpen', weight: 0.1 }
      ],
      'kk': [
        { target: 'viseme_kk', weight: 1.0 },
        { target: 'mouthOpen', weight: 0.4 },
        { target: 'jawOpen', weight: 0.2 }
      ],
      'CH': [
        { target: 'viseme_CH', weight: 1.0 },
        { target: 'mouthFunnel', weight: 0.5 },
        { target: 'mouthOpen', weight: 0.3 }
      ],
      'SS': [
        { target: 'viseme_SS', weight: 1.0 },
        { target: 'mouthFunnel', weight: 0.3 },
        { target: 'mouthSmile', weight: 0.2 }
      ],
      'RR': [
        { target: 'viseme_RR', weight: 1.0 },
        { target: 'mouthFunnel', weight: 0.4 },
        { target: 'mouthOpen', weight: 0.3 }
      ],
      'AA': [
        { target: 'viseme_aa', weight: 1.0 },
        { target: 'mouthOpen', weight: 0.8 },
        { target: 'jawOpen', weight: 0.6 }
      ],
      'E': [
        { target: 'viseme_E', weight: 1.0 },
        { target: 'mouthOpen', weight: 0.4 },
        { target: 'mouthSmile', weight: 0.3 }
      ],
      'I': [
        { target: 'viseme_I', weight: 1.0 },
        { target: 'mouthSmile', weight: 0.5 },
        { target: 'mouthOpen', weight: 0.2 }
      ],
      'O': [
        { target: 'viseme_O', weight: 1.0 },
        { target: 'mouthFunnel', weight: 0.7 },
        { target: 'mouthPucker', weight: 0.5 },
        { target: 'mouthOpen', weight: 0.6 }
      ],
      'U': [
        { target: 'viseme_U', weight: 1.0 },
        { target: 'mouthPucker', weight: 0.8 },
        { target: 'mouthFunnel', weight: 0.6 },
        { target: 'mouthOpen', weight: 0.3 }
      ]
    };
    
    return mappings[viseme] || [{ target: 'neutral', weight: 1.0 }];
  }

  /**
   * Get previous viseme for blending
   */
  private getPreviousViseme(): string | null {
    const currentPhoneme = this.getCurrentPhoneme();
    if (!currentPhoneme) return null;
    
    // Find previous phoneme
    const currentIndex = this.phonemes.findIndex(p => 
      p.startTime <= this.currentTime && p.endTime >= this.currentTime
    );
    
    if (currentIndex > 0) {
      return this.phonemes[currentIndex - 1].viseme;
    }
    
    return null;
  }

  /**
   * Get current playback time
   */
  getCurrentTime(): number {
    return this.currentTime;
  }

  /**
   * Check if animation is playing
   */
  isAnimationPlaying(): boolean {
    return this.isPlaying;
  }

  /**
   * Get total duration
   */
  getDuration(): number {
    if (this.phonemes.length === 0) return 0;
    return Math.max(...this.phonemes.map(p => p.endTime));
  }

  /**
   * Get current phoneme info for debugging
   */
  getCurrentPhonemeInfo(): { phoneme: string; viseme: string; time: number } | null {
    const current = this.getCurrentPhoneme();
    if (!current) return null;
    
    return {
      phoneme: current.phoneme,
      viseme: current.viseme,
      time: this.currentTime
    };
  }
}