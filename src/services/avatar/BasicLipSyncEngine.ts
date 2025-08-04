import * as THREE from 'three';
import { GoogleTTSService } from '../tts/GoogleTTSService';

export interface LipSyncPhoneme {
  phoneme: string;
  timestamp: number;
  duration: number;
  intensity: number;
}

export interface BasicLipSyncConfig {
  updateRate: number; // FPS for lip sync updates
  smoothingFactor: number; // 0-1, higher = more smoothing
  intensityMultiplier: number; // Multiplier for mouth movement intensity
}

export class BasicLipSyncEngine {
  private scene: THREE.Scene | null = null;
  private morphTargets: THREE.Mesh[] = [];
  private isActive = false;
  private currentPhonemes: LipSyncPhoneme[] = [];
  private animationId: number | null = null;
  private startTime = 0;
  
  private config: BasicLipSyncConfig = {
    updateRate: 30, // 30 FPS
    smoothingFactor: 0.7,
    intensityMultiplier: 1.2
  };

  // Simple phoneme to mouth shape mapping
  private phonemeToMouthShape: Record<string, { openness: number; width: number }> = {
    // Vowels - open mouth
    'AA': { openness: 0.8, width: 0.6 }, // "father"
    'AE': { openness: 0.7, width: 0.7 }, // "cat"
    'AH': { openness: 0.6, width: 0.5 }, // "but"
    'AO': { openness: 0.8, width: 0.4 }, // "thought"
    'EH': { openness: 0.5, width: 0.6 }, // "bed"
    'ER': { openness: 0.4, width: 0.5 }, // "bird"
    'IH': { openness: 0.3, width: 0.7 }, // "bit"
    'IY': { openness: 0.2, width: 0.8 }, // "beat"
    'OW': { openness: 0.7, width: 0.3 }, // "boat"
    'UH': { openness: 0.3, width: 0.3 }, // "book"
    'UW': { openness: 0.4, width: 0.2 }, // "boot"
    
    // Consonants - various mouth positions
    'B': { openness: 0.0, width: 0.5 }, // Lips together
    'P': { openness: 0.0, width: 0.5 }, // Lips together
    'M': { openness: 0.0, width: 0.5 }, // Lips together
    'F': { openness: 0.2, width: 0.6 }, // Lip to teeth
    'V': { openness: 0.2, width: 0.6 }, // Lip to teeth
    'TH': { openness: 0.3, width: 0.5 }, // Tongue between teeth
    'S': { openness: 0.2, width: 0.7 }, // Narrow opening
    'Z': { openness: 0.2, width: 0.7 }, // Narrow opening
    'T': { openness: 0.1, width: 0.5 }, // Tongue to teeth
    'D': { openness: 0.1, width: 0.5 }, // Tongue to teeth
    'N': { openness: 0.2, width: 0.5 }, // Tongue to roof
    'L': { openness: 0.3, width: 0.5 }, // Tongue to roof
    'R': { openness: 0.4, width: 0.4 }, // Rounded
    'K': { openness: 0.2, width: 0.4 }, // Back of tongue
    'G': { openness: 0.2, width: 0.4 }, // Back of tongue
    
    // Silence
    'SIL': { openness: 0.0, width: 0.5 }
  };

  constructor(scene: THREE.Scene, config?: Partial<BasicLipSyncConfig>) {
    this.scene = scene;
    if (config) {
      this.config = { ...this.config, ...config };
    }
    this.findMorphTargets();
  }

  /**
   * Find meshes with morph targets in the scene
   */
  private findMorphTargets(): void {
    if (!this.scene) return;

    this.morphTargets = [];
    this.scene.traverse((child) => {
      if (child instanceof THREE.Mesh && child.morphTargetInfluences && child.morphTargetInfluences.length > 0) {
        this.morphTargets.push(child);
        console.log('🎭 Found mesh with morph targets:', child.name, 'targets:', child.morphTargetInfluences.length);
      }
    });

    console.log(`🎭 Found ${this.morphTargets.length} meshes with morph targets for lip sync`);
  }

  /**
   * Generate phonemes from text (simplified approach)
   */
  generatePhonemesFromText(text: string, duration: number): LipSyncPhoneme[] {
    const words = text.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/);
    const phonemes: LipSyncPhoneme[] = [];
    
    let currentTime = 0;
    const timePerWord = duration / words.length;

    for (const word of words) {
      const wordPhonemes = this.mapWordToPhonemes(word);
      const timePerPhoneme = timePerWord / wordPhonemes.length;

      for (const phoneme of wordPhonemes) {
        phonemes.push({
          phoneme,
          timestamp: currentTime,
          duration: timePerPhoneme,
          intensity: 0.8 + Math.random() * 0.2 // Slight variation
        });
        currentTime += timePerPhoneme;
      }

      // Add pause between words
      phonemes.push({
        phoneme: 'SIL',
        timestamp: currentTime,
        duration: timePerPhoneme * 0.3,
        intensity: 1.0
      });
      currentTime += timePerPhoneme * 0.3;
    }

    return phonemes;
  }

  /**
   * Simple word to phoneme mapping
   */
  private mapWordToPhonemes(word: string): string[] {
    // Enhanced phoneme dictionary for common words
    const phonemeDict: Record<string, string[]> = {
      'hello': ['HH', 'EH', 'L', 'OW'],
      'hi': ['HH', 'AY'],
      'help': ['HH', 'EH', 'L', 'P'],
      'how': ['HH', 'AW'],
      'are': ['AA', 'R'],
      'you': ['Y', 'UW'],
      'today': ['T', 'AH', 'D', 'EY'],
      'good': ['G', 'UH', 'D'],
      'great': ['G', 'R', 'EY', 'T'],
      'step': ['S', 'T', 'EH', 'P'],
      'click': ['K', 'L', 'IH', 'K'],
      'button': ['B', 'AH', 'T', 'AH', 'N'],
      'the': ['DH', 'AH'],
      'and': ['AE', 'N', 'D'],
      'with': ['W', 'IH', 'TH'],
      'this': ['DH', 'IH', 'S'],
      'that': ['DH', 'AE', 'T'],
      'will': ['W', 'IH', 'L'],
      'can': ['K', 'AE', 'N'],
      'now': ['N', 'AW'],
      'see': ['S', 'IY'],
      'get': ['G', 'EH', 'T'],
      'make': ['M', 'EY', 'K'],
      'go': ['G', 'OW'],
      'know': ['N', 'OW'],
      'take': ['T', 'EY', 'K'],
      'come': ['K', 'AH', 'M'],
      'think': ['TH', 'IH', 'NG', 'K'],
      'look': ['L', 'UH', 'K'],
      'want': ['W', 'AA', 'N', 'T'],
      'give': ['G', 'IH', 'V'],
      'use': ['Y', 'UW', 'Z'],
      'find': ['F', 'AY', 'N', 'D'],
      'tell': ['T', 'EH', 'L'],
      'ask': ['AE', 'S', 'K'],
      'work': ['W', 'ER', 'K'],
      'seem': ['S', 'IY', 'M'],
      'feel': ['F', 'IY', 'L'],
      'try': ['T', 'R', 'AY'],
      'leave': ['L', 'IY', 'V'],
      'call': ['K', 'AO', 'L'],
      'technology': ['T', 'EH', 'K', 'N', 'AA', 'L', 'AH', 'JH', 'IY'],
      'computer': ['K', 'AH', 'M', 'P', 'Y', 'UW', 'T', 'ER'],
      'internet': ['IH', 'N', 'T', 'ER', 'N', 'EH', 'T'],
      'email': ['IY', 'M', 'EY', 'L'],
      'phone': ['F', 'OW', 'N'],
      'website': ['W', 'EH', 'B', 'S', 'AY', 'T']
    };

    if (phonemeDict[word]) {
      return phonemeDict[word];
    }

    // Fallback: generate phonemes based on vowels and consonants
    const phonemes: string[] = [];
    for (let i = 0; i < word.length; i++) {
      const char = word[i];
      if ('aeiou'.includes(char)) {
        const vowelMap: Record<string, string> = {
          'a': 'AA', 'e': 'EH', 'i': 'IH', 'o': 'AO', 'u': 'UH'
        };
        phonemes.push(vowelMap[char] || 'AH');
      } else if ('bcdfghjklmnpqrstvwxyz'.includes(char)) {
        const consonantMap: Record<string, string> = {
          'b': 'B', 'c': 'K', 'd': 'D', 'f': 'F', 'g': 'G',
          'h': 'HH', 'j': 'JH', 'k': 'K', 'l': 'L', 'm': 'M',
          'n': 'N', 'p': 'P', 'q': 'K', 'r': 'R', 's': 'S',
          't': 'T', 'v': 'V', 'w': 'W', 'x': 'K', 'y': 'Y', 'z': 'Z'
        };
        phonemes.push(consonantMap[char] || 'T');
      }
    }

    return phonemes.length > 0 ? phonemes : ['SIL'];
  }

  /**
   * Start lip sync animation with phonemes
   */
  startLipSync(phonemes: LipSyncPhoneme[]): void {
    if (this.morphTargets.length === 0) {
      console.warn('🎭 No morph targets found for lip sync');
      return;
    }

    this.currentPhonemes = phonemes;
    this.isActive = true;
    this.startTime = Date.now();
    
    console.log(`🎭 Starting lip sync with ${phonemes.length} phonemes`);
    this.animate();
  }

  /**
   * Stop lip sync animation
   */
  stopLipSync(): void {
    this.isActive = false;
    
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    // Reset mouth to neutral position
    this.applyMouthShape({ openness: 0, width: 0.5 }, 0);
    console.log('🎭 Lip sync stopped');
  }

  /**
   * Animation loop
   */
  private animate(): void {
    if (!this.isActive) return;

    const elapsed = Date.now() - this.startTime;
    
    // Find current phoneme
    const currentPhoneme = this.getCurrentPhoneme(elapsed);
    
    if (currentPhoneme) {
      const mouthShape = this.phonemeToMouthShape[currentPhoneme.phoneme] || { openness: 0, width: 0.5 };
      this.applyMouthShape(mouthShape, currentPhoneme.intensity);
    } else {
      // No current phoneme, return to neutral
      this.applyMouthShape({ openness: 0, width: 0.5 }, 0);
    }

    // Continue animation
    this.animationId = requestAnimationFrame(() => this.animate());
  }

  /**
   * Get current phoneme based on elapsed time
   */
  private getCurrentPhoneme(elapsed: number): LipSyncPhoneme | null {
    for (const phoneme of this.currentPhonemes) {
      if (elapsed >= phoneme.timestamp && elapsed < phoneme.timestamp + phoneme.duration) {
        return phoneme;
      }
    }
    return null;
  }

  /**
   * Apply mouth shape to morph targets
   */
  private applyMouthShape(shape: { openness: number; width: number }, intensity: number): void {
    const smoothedIntensity = intensity * this.config.intensityMultiplier;
    
    for (const mesh of this.morphTargets) {
      if (!mesh.morphTargetInfluences || !mesh.morphTargetDictionary) continue;

      // Apply smoothing to existing influences
      for (let i = 0; i < mesh.morphTargetInfluences.length; i++) {
        mesh.morphTargetInfluences[i] *= this.config.smoothingFactor;
      }

      // Try to find mouth-related morph targets and apply the shape
      this.applyToMorphTarget(mesh, 'mouth_open', shape.openness * smoothedIntensity);
      this.applyToMorphTarget(mesh, 'mouth_smile', shape.width * smoothedIntensity * 0.3);
      this.applyToMorphTarget(mesh, 'mouth_frown', (1 - shape.width) * smoothedIntensity * 0.2);
      
      // Try common Ready Player Me morph target names
      this.applyToMorphTarget(mesh, 'mouthOpen', shape.openness * smoothedIntensity);
      this.applyToMorphTarget(mesh, 'mouthSmile', shape.width * smoothedIntensity * 0.3);
      this.applyToMorphTarget(mesh, 'mouthFrown', (1 - shape.width) * smoothedIntensity * 0.2);
      
      // Try VRM standard names
      this.applyToMorphTarget(mesh, 'aa', shape.openness * smoothedIntensity);
      this.applyToMorphTarget(mesh, 'ih', shape.width * smoothedIntensity);
      this.applyToMorphTarget(mesh, 'ou', (1 - shape.width) * smoothedIntensity);
    }
  }

  /**
   * Apply value to specific morph target if it exists
   */
  private applyToMorphTarget(mesh: THREE.Mesh, targetName: string, value: number): void {
    if (!mesh.morphTargetDictionary || !mesh.morphTargetInfluences) return;

    const index = mesh.morphTargetDictionary[targetName];
    if (index !== undefined && index < mesh.morphTargetInfluences.length) {
      mesh.morphTargetInfluences[index] = Math.max(0, Math.min(1, value));
    }
  }

  /**
   * Sync with TTS audio
   */
  async syncWithTTS(text: string, googleTTS: GoogleTTSService): Promise<void> {
    try {
      // Get lip sync data from Google TTS
      const lipSyncData = await googleTTS.synthesizeForLipSync(text);
      
      // Convert Google TTS phonemes to our format
      const phonemes: LipSyncPhoneme[] = lipSyncData.phonemes.map(p => ({
        phoneme: p.phoneme,
        timestamp: p.timestamp,
        duration: 100, // Default duration
        intensity: p.confidence
      }));

      // If we have phonemes from Google TTS, use them
      if (phonemes.length > 0) {
        console.log('🎭 Using Google TTS phonemes for lip sync');
        this.startLipSync(phonemes);
      } else {
        // Fallback to text-based phoneme generation
        console.log('🎭 Using text-based phonemes for lip sync');
        const fallbackPhonemes = this.generatePhonemesFromText(text, lipSyncData.duration);
        this.startLipSync(fallbackPhonemes);
      }
    } catch (error) {
      console.error('🎭 Failed to sync with TTS:', error);
      
      // Fallback to simple text-based lip sync
      const estimatedDuration = text.length * 100; // ~100ms per character
      const fallbackPhonemes = this.generatePhonemesFromText(text, estimatedDuration);
      this.startLipSync(fallbackPhonemes);
    }
  }

  /**
   * Simple lip sync without TTS integration
   */
  syncWithText(text: string, duration: number = 0): void {
    const actualDuration = duration || text.length * 100;
    const phonemes = this.generatePhonemesFromText(text, actualDuration);
    this.startLipSync(phonemes);
  }

  /**
   * Check if lip sync is currently active
   */
  isLipSyncActive(): boolean {
    return this.isActive;
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<BasicLipSyncConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    this.stopLipSync();
    this.morphTargets = [];
    this.scene = null;
  }
}