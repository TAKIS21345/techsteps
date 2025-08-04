import * as THREE from 'three';

export interface RealTimePhoneme {
  phoneme: string;
  startTime: number;
  endTime: number;
  intensity: number;
  mouthShape: MouthShape;
}

export interface MouthShape {
  jawOpen: number;      // 0-1: How open the jaw is
  lipsPucker: number;   // 0-1: How puckered the lips are
  lipsSpread: number;   // 0-1: How spread the lips are
  tongueUp: number;     // 0-1: Tongue position
  teethShow: number;    // 0-1: How much teeth show
}

export interface LipSyncConfig {
  frameRate: number;
  smoothingFactor: number;
  intensityMultiplier: number;
  anticipationTime: number; // ms to start mouth movement before sound
}

export class RealTimeLipSyncEngine {
  private scene: THREE.Scene;
  private morphTargets: THREE.Mesh[] = [];
  private isActive = false;
  private animationId: number | null = null;
  private startTime = 0;
  private currentPhonemes: RealTimePhoneme[] = [];
  private lastMouthShape: MouthShape = { jawOpen: 0, lipsPucker: 0, lipsSpread: 0.5, tongueUp: 0, teethShow: 0 };
  
  private config: LipSyncConfig = {
    frameRate: 60, // Higher frame rate for smoother animation
    smoothingFactor: 0.3, // Less smoothing for more responsive animation
    intensityMultiplier: 1.5,
    anticipationTime: 50 // Start mouth movement 50ms early
  };

  // Comprehensive phoneme to mouth shape mapping
  private phonemeToMouthShape: Record<string, MouthShape> = {
    // Vowels - different jaw and lip positions
    'AA': { jawOpen: 0.9, lipsPucker: 0.0, lipsSpread: 0.8, tongueUp: 0.0, teethShow: 0.3 }, // "father"
    'AE': { jawOpen: 0.7, lipsPucker: 0.0, lipsSpread: 0.9, tongueUp: 0.2, teethShow: 0.4 }, // "cat"
    'AH': { jawOpen: 0.6, lipsPucker: 0.0, lipsSpread: 0.5, tongueUp: 0.1, teethShow: 0.2 }, // "but"
    'AO': { jawOpen: 0.8, lipsPucker: 0.6, lipsSpread: 0.2, tongueUp: 0.0, teethShow: 0.1 }, // "thought"
    'AW': { jawOpen: 0.7, lipsPucker: 0.4, lipsSpread: 0.3, tongueUp: 0.0, teethShow: 0.2 }, // "how"
    'AY': { jawOpen: 0.5, lipsPucker: 0.0, lipsSpread: 0.7, tongueUp: 0.3, teethShow: 0.3 }, // "my"
    'EH': { jawOpen: 0.5, lipsPucker: 0.0, lipsSpread: 0.6, tongueUp: 0.3, teethShow: 0.4 }, // "bed"
    'ER': { jawOpen: 0.4, lipsPucker: 0.2, lipsSpread: 0.4, tongueUp: 0.6, teethShow: 0.2 }, // "bird"
    'EY': { jawOpen: 0.4, lipsPucker: 0.0, lipsSpread: 0.7, tongueUp: 0.4, teethShow: 0.5 }, // "say"
    'IH': { jawOpen: 0.3, lipsPucker: 0.0, lipsSpread: 0.7, tongueUp: 0.5, teethShow: 0.6 }, // "bit"
    'IY': { jawOpen: 0.2, lipsPucker: 0.0, lipsSpread: 0.9, tongueUp: 0.7, teethShow: 0.8 }, // "beat"
    'OW': { jawOpen: 0.6, lipsPucker: 0.8, lipsSpread: 0.1, tongueUp: 0.0, teethShow: 0.0 }, // "boat"
    'OY': { jawOpen: 0.5, lipsPucker: 0.6, lipsSpread: 0.2, tongueUp: 0.2, teethShow: 0.1 }, // "boy"
    'UH': { jawOpen: 0.3, lipsPucker: 0.4, lipsSpread: 0.3, tongueUp: 0.2, teethShow: 0.0 }, // "book"
    'UW': { jawOpen: 0.3, lipsPucker: 0.9, lipsSpread: 0.0, tongueUp: 0.1, teethShow: 0.0 }, // "boot"

    // Consonants - specific mouth positions
    'B': { jawOpen: 0.0, lipsPucker: 0.0, lipsSpread: 0.5, tongueUp: 0.0, teethShow: 0.0 }, // Lips together
    'P': { jawOpen: 0.0, lipsPucker: 0.0, lipsSpread: 0.5, tongueUp: 0.0, teethShow: 0.0 }, // Lips together
    'M': { jawOpen: 0.0, lipsPucker: 0.0, lipsSpread: 0.5, tongueUp: 0.0, teethShow: 0.0 }, // Lips together
    
    'F': { jawOpen: 0.2, lipsPucker: 0.0, lipsSpread: 0.6, tongueUp: 0.0, teethShow: 0.8 }, // Lip to teeth
    'V': { jawOpen: 0.2, lipsPucker: 0.0, lipsSpread: 0.6, tongueUp: 0.0, teethShow: 0.8 }, // Lip to teeth
    
    'TH': { jawOpen: 0.3, lipsPucker: 0.0, lipsSpread: 0.5, tongueUp: 0.8, teethShow: 0.9 }, // Tongue between teeth
    'DH': { jawOpen: 0.3, lipsPucker: 0.0, lipsSpread: 0.5, tongueUp: 0.8, teethShow: 0.9 }, // Tongue between teeth
    
    'S': { jawOpen: 0.2, lipsPucker: 0.0, lipsSpread: 0.7, tongueUp: 0.6, teethShow: 0.7 }, // Narrow opening
    'Z': { jawOpen: 0.2, lipsPucker: 0.0, lipsSpread: 0.7, tongueUp: 0.6, teethShow: 0.7 }, // Narrow opening
    'SH': { jawOpen: 0.3, lipsPucker: 0.3, lipsSpread: 0.4, tongueUp: 0.5, teethShow: 0.3 }, // Rounded sibilant
    'ZH': { jawOpen: 0.3, lipsPucker: 0.3, lipsSpread: 0.4, tongueUp: 0.5, teethShow: 0.3 }, // Rounded sibilant
    
    'T': { jawOpen: 0.1, lipsPucker: 0.0, lipsSpread: 0.5, tongueUp: 0.9, teethShow: 0.5 }, // Tongue to teeth
    'D': { jawOpen: 0.1, lipsPucker: 0.0, lipsSpread: 0.5, tongueUp: 0.9, teethShow: 0.5 }, // Tongue to teeth
    'N': { jawOpen: 0.2, lipsPucker: 0.0, lipsSpread: 0.5, tongueUp: 0.8, teethShow: 0.3 }, // Tongue to roof
    'L': { jawOpen: 0.3, lipsPucker: 0.0, lipsSpread: 0.5, tongueUp: 0.7, teethShow: 0.4 }, // Tongue to roof
    
    'R': { jawOpen: 0.4, lipsPucker: 0.3, lipsSpread: 0.4, tongueUp: 0.6, teethShow: 0.2 }, // Rounded
    
    'K': { jawOpen: 0.2, lipsPucker: 0.0, lipsSpread: 0.4, tongueUp: 0.5, teethShow: 0.2 }, // Back of tongue
    'G': { jawOpen: 0.2, lipsPucker: 0.0, lipsSpread: 0.4, tongueUp: 0.5, teethShow: 0.2 }, // Back of tongue
    'NG': { jawOpen: 0.2, lipsPucker: 0.0, lipsSpread: 0.4, tongueUp: 0.6, teethShow: 0.1 }, // Nasal
    
    'CH': { jawOpen: 0.3, lipsPucker: 0.2, lipsSpread: 0.4, tongueUp: 0.7, teethShow: 0.4 }, // Affricate
    'JH': { jawOpen: 0.3, lipsPucker: 0.2, lipsSpread: 0.4, tongueUp: 0.7, teethShow: 0.4 }, // Affricate
    
    'W': { jawOpen: 0.3, lipsPucker: 0.8, lipsSpread: 0.1, tongueUp: 0.2, teethShow: 0.0 }, // Rounded
    'Y': { jawOpen: 0.2, lipsPucker: 0.0, lipsSpread: 0.8, tongueUp: 0.6, teethShow: 0.5 }, // Palatal
    
    'H': { jawOpen: 0.4, lipsPucker: 0.0, lipsSpread: 0.5, tongueUp: 0.0, teethShow: 0.2 }, // Breathy
    'HH': { jawOpen: 0.4, lipsPucker: 0.0, lipsSpread: 0.5, tongueUp: 0.0, teethShow: 0.2 }, // Breathy
    
    // Silence
    'SIL': { jawOpen: 0.0, lipsPucker: 0.0, lipsSpread: 0.5, tongueUp: 0.0, teethShow: 0.0 }
  };

  // Enhanced word to phoneme dictionary with timing
  private wordToPhonemes: Record<string, Array<{phoneme: string, duration: number}>> = {
    'hello': [
      {phoneme: 'HH', duration: 0.08},
      {phoneme: 'EH', duration: 0.12},
      {phoneme: 'L', duration: 0.10},
      {phoneme: 'OW', duration: 0.15}
    ],
    'hi': [
      {phoneme: 'HH', duration: 0.10},
      {phoneme: 'AY', duration: 0.20}
    ],
    'how': [
      {phoneme: 'HH', duration: 0.08},
      {phoneme: 'AW', duration: 0.18}
    ],
    'are': [
      {phoneme: 'AA', duration: 0.12},
      {phoneme: 'R', duration: 0.10}
    ],
    'you': [
      {phoneme: 'Y', duration: 0.08},
      {phoneme: 'UW', duration: 0.15}
    ],
    'today': [
      {phoneme: 'T', duration: 0.06},
      {phoneme: 'AH', duration: 0.08},
      {phoneme: 'D', duration: 0.06},
      {phoneme: 'EY', duration: 0.12}
    ],
    'watch': [
      {phoneme: 'W', duration: 0.08},
      {phoneme: 'AA', duration: 0.10},
      {phoneme: 'CH', duration: 0.12}
    ],
    'mouth': [
      {phoneme: 'M', duration: 0.08},
      {phoneme: 'AW', duration: 0.12},
      {phoneme: 'TH', duration: 0.10}
    ],
    'move': [
      {phoneme: 'M', duration: 0.08},
      {phoneme: 'UW', duration: 0.12},
      {phoneme: 'V', duration: 0.08}
    ],
    'speak': [
      {phoneme: 'S', duration: 0.10},
      {phoneme: 'P', duration: 0.06},
      {phoneme: 'IY', duration: 0.12},
      {phoneme: 'K', duration: 0.08}
    ],
    'this': [
      {phoneme: 'DH', duration: 0.06},
      {phoneme: 'IH', duration: 0.08},
      {phoneme: 'S', duration: 0.10}
    ],
    'test': [
      {phoneme: 'T', duration: 0.06},
      {phoneme: 'EH', duration: 0.10},
      {phoneme: 'S', duration: 0.08},
      {phoneme: 'T', duration: 0.06}
    ],
    'system': [
      {phoneme: 'S', duration: 0.08},
      {phoneme: 'IH', duration: 0.06},
      {phoneme: 'S', duration: 0.06},
      {phoneme: 'T', duration: 0.04},
      {phoneme: 'AH', duration: 0.06},
      {phoneme: 'M', duration: 0.08}
    ],
    'with': [
      {phoneme: 'W', duration: 0.06},
      {phoneme: 'IH', duration: 0.08},
      {phoneme: 'TH', duration: 0.10}
    ],
    'animation': [
      {phoneme: 'AE', duration: 0.08},
      {phoneme: 'N', duration: 0.06},
      {phoneme: 'AH', duration: 0.06},
      {phoneme: 'M', duration: 0.06},
      {phoneme: 'EY', duration: 0.10},
      {phoneme: 'SH', duration: 0.08},
      {phoneme: 'AH', duration: 0.06},
      {phoneme: 'N', duration: 0.08}
    ]
  };

  constructor(scene: THREE.Scene, config?: Partial<LipSyncConfig>) {
    this.scene = scene;
    if (config) {
      this.config = { ...this.config, ...config };
    }
    this.findMorphTargets();
  }

  private findMorphTargets(): void {
    this.morphTargets = [];
    this.scene.traverse((child) => {
      if (child instanceof THREE.Mesh && child.morphTargetInfluences && child.morphTargetInfluences.length > 0) {
        this.morphTargets.push(child);
        console.log('🎭 Found morph target mesh:', child.name, 'with', child.morphTargetInfluences.length, 'targets');
        if (child.morphTargetDictionary) {
          console.log('🎭 Available morph targets:', Object.keys(child.morphTargetDictionary));
        }
      }
    });
  }

  /**
   * Generate precise phonemes with timing from text
   */
  generateTimedPhonemes(text: string, totalDuration: number): RealTimePhoneme[] {
    const words = text.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(w => w.length > 0);
    const phonemes: RealTimePhoneme[] = [];
    
    let currentTime = 0;
    const totalWords = words.length;
    const averageWordTime = totalDuration / totalWords;
    
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const wordPhonemes = this.wordToPhonemes[word] || this.generateFallbackPhonemes(word);
      
      // Calculate word duration (with some variation)
      const wordDuration = averageWordTime * (0.8 + Math.random() * 0.4); // ±20% variation
      const totalPhonemeDuration = wordPhonemes.reduce((sum, p) => sum + p.duration, 0);
      const timeScale = wordDuration / totalPhonemeDuration;
      
      // Add phonemes for this word
      for (const phonemeData of wordPhonemes) {
        const duration = phonemeData.duration * timeScale;
        const mouthShape = this.phonemeToMouthShape[phonemeData.phoneme] || this.phonemeToMouthShape['SIL'];
        
        phonemes.push({
          phoneme: phonemeData.phoneme,
          startTime: currentTime - this.config.anticipationTime, // Start slightly early
          endTime: currentTime + duration,
          intensity: 0.8 + Math.random() * 0.2, // Slight variation
          mouthShape: { ...mouthShape }
        });
        
        currentTime += duration;
      }
      
      // Add pause between words (except last word)
      if (i < words.length - 1) {
        const pauseDuration = averageWordTime * 0.1; // 10% of word time
        phonemes.push({
          phoneme: 'SIL',
          startTime: currentTime,
          endTime: currentTime + pauseDuration,
          intensity: 1.0,
          mouthShape: { ...this.phonemeToMouthShape['SIL'] }
        });
        currentTime += pauseDuration;
      }
    }
    
    console.log(`🎭 Generated ${phonemes.length} timed phonemes for "${text}"`);
    return phonemes;
  }

  /**
   * Generate fallback phonemes for unknown words
   */
  private generateFallbackPhonemes(word: string): Array<{phoneme: string, duration: number}> {
    const phonemes: Array<{phoneme: string, duration: number}> = [];
    const avgDuration = 0.08; // 80ms average per phoneme
    
    for (let i = 0; i < word.length; i++) {
      const char = word[i];
      let phoneme = 'SIL';
      let duration = avgDuration;
      
      if ('aeiou'.includes(char)) {
        const vowelMap: Record<string, string> = {
          'a': 'AA', 'e': 'EH', 'i': 'IH', 'o': 'AO', 'u': 'UH'
        };
        phoneme = vowelMap[char] || 'AH';
        duration = avgDuration * 1.5; // Vowels are longer
      } else if ('bcdfghjklmnpqrstvwxyz'.includes(char)) {
        const consonantMap: Record<string, string> = {
          'b': 'B', 'c': 'K', 'd': 'D', 'f': 'F', 'g': 'G',
          'h': 'HH', 'j': 'JH', 'k': 'K', 'l': 'L', 'm': 'M',
          'n': 'N', 'p': 'P', 'q': 'K', 'r': 'R', 's': 'S',
          't': 'T', 'v': 'V', 'w': 'W', 'x': 'K', 'y': 'Y', 'z': 'Z'
        };
        phoneme = consonantMap[char] || 'T';
        duration = avgDuration * 0.8; // Consonants are shorter
      }
      
      phonemes.push({ phoneme, duration });
    }
    
    return phonemes.length > 0 ? phonemes : [{ phoneme: 'SIL', duration: avgDuration }];
  }

  /**
   * Start real-time lip sync
   */
  startLipSync(phonemes: RealTimePhoneme[]): void {
    if (this.morphTargets.length === 0) {
      console.warn('🎭 No morph targets found for lip sync');
      return;
    }

    this.currentPhonemes = phonemes;
    this.isActive = true;
    this.startTime = performance.now(); // Use high-precision timer
    
    console.log(`🎭 Starting real-time lip sync with ${phonemes.length} phonemes`);
    this.animate();
  }

  /**
   * Stop lip sync
   */
  stopLipSync(): void {
    this.isActive = false;
    
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    // Smoothly return to neutral position
    this.smoothTransitionToNeutral();
    console.log('🎭 Real-time lip sync stopped');
  }

  /**
   * High-frequency animation loop
   */
  private animate(): void {
    if (!this.isActive) return;

    const elapsed = performance.now() - this.startTime;
    
    // Find current and next phonemes for interpolation
    const currentPhoneme = this.getCurrentPhoneme(elapsed);
    const nextPhoneme = this.getNextPhoneme(elapsed);
    
    if (currentPhoneme) {
      let targetShape = currentPhoneme.mouthShape;
      
      // Interpolate between current and next phoneme for smoother transitions
      if (nextPhoneme && elapsed > currentPhoneme.endTime - 50) { // 50ms before end
        const transitionProgress = Math.min(1, (elapsed - (currentPhoneme.endTime - 50)) / 50);
        targetShape = this.interpolateMouthShapes(currentPhoneme.mouthShape, nextPhoneme.mouthShape, transitionProgress);
      }
      
      this.applyMouthShape(targetShape, currentPhoneme.intensity);
    } else {
      // No current phoneme, return to neutral
      this.applyMouthShape(this.phonemeToMouthShape['SIL'], 0.5);
    }

    // Continue at 60fps
    this.animationId = requestAnimationFrame(() => this.animate());
  }

  /**
   * Get current phoneme based on precise timing
   */
  private getCurrentPhoneme(elapsed: number): RealTimePhoneme | null {
    for (const phoneme of this.currentPhonemes) {
      if (elapsed >= phoneme.startTime && elapsed < phoneme.endTime) {
        return phoneme;
      }
    }
    return null;
  }

  /**
   * Get next phoneme for smooth transitions
   */
  private getNextPhoneme(elapsed: number): RealTimePhoneme | null {
    for (let i = 0; i < this.currentPhonemes.length; i++) {
      const phoneme = this.currentPhonemes[i];
      if (elapsed >= phoneme.startTime && elapsed < phoneme.endTime) {
        return this.currentPhonemes[i + 1] || null;
      }
    }
    return null;
  }

  /**
   * Interpolate between two mouth shapes
   */
  private interpolateMouthShapes(shape1: MouthShape, shape2: MouthShape, progress: number): MouthShape {
    const smoothProgress = this.easeInOutCubic(progress);
    
    return {
      jawOpen: this.lerp(shape1.jawOpen, shape2.jawOpen, smoothProgress),
      lipsPucker: this.lerp(shape1.lipsPucker, shape2.lipsPucker, smoothProgress),
      lipsSpread: this.lerp(shape1.lipsSpread, shape2.lipsSpread, smoothProgress),
      tongueUp: this.lerp(shape1.tongueUp, shape2.tongueUp, smoothProgress),
      teethShow: this.lerp(shape1.teethShow, shape2.teethShow, smoothProgress)
    };
  }

  /**
   * Smooth easing function
   */
  private easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  /**
   * Linear interpolation
   */
  private lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }

  /**
   * Apply mouth shape to morph targets with advanced mapping
   */
  private applyMouthShape(shape: MouthShape, intensity: number): void {
    const smoothedIntensity = intensity * this.config.intensityMultiplier;
    
    // Apply smoothing to current mouth shape
    this.lastMouthShape = this.interpolateMouthShapes(
      this.lastMouthShape, 
      shape, 
      1 - this.config.smoothingFactor
    );
    
    for (const mesh of this.morphTargets) {
      if (!mesh.morphTargetInfluences || !mesh.morphTargetDictionary) continue;

      // Apply gentle decay to all influences
      for (let i = 0; i < mesh.morphTargetInfluences.length; i++) {
        mesh.morphTargetInfluences[i] *= 0.95;
      }

      // Apply new mouth shape with multiple morph target mappings
      const finalShape = this.lastMouthShape;
      
      // Jaw/mouth opening
      this.applyToMorphTarget(mesh, 'mouthOpen', finalShape.jawOpen * smoothedIntensity);
      this.applyToMorphTarget(mesh, 'mouth_open', finalShape.jawOpen * smoothedIntensity);
      this.applyToMorphTarget(mesh, 'aa', finalShape.jawOpen * smoothedIntensity * 0.8);
      
      // Lip puckering
      this.applyToMorphTarget(mesh, 'mouthPucker', finalShape.lipsPucker * smoothedIntensity);
      this.applyToMorphTarget(mesh, 'mouth_pucker', finalShape.lipsPucker * smoothedIntensity);
      this.applyToMorphTarget(mesh, 'ou', finalShape.lipsPucker * smoothedIntensity);
      
      // Lip spreading/smiling
      this.applyToMorphTarget(mesh, 'mouthSmile', finalShape.lipsSpread * smoothedIntensity * 0.5);
      this.applyToMorphTarget(mesh, 'mouth_smile', finalShape.lipsSpread * smoothedIntensity * 0.5);
      this.applyToMorphTarget(mesh, 'ih', finalShape.lipsSpread * smoothedIntensity * 0.6);
      
      // Teeth showing
      this.applyToMorphTarget(mesh, 'mouthGrin', finalShape.teethShow * smoothedIntensity * 0.3);
      this.applyToMorphTarget(mesh, 'mouth_grin', finalShape.teethShow * smoothedIntensity * 0.3);
      
      // Additional expressions for realism
      this.applyToMorphTarget(mesh, 'mouthFrown', (1 - finalShape.lipsSpread) * smoothedIntensity * 0.2);
      this.applyToMorphTarget(mesh, 'mouth_frown', (1 - finalShape.lipsSpread) * smoothedIntensity * 0.2);
    }
  }

  /**
   * Apply value to specific morph target
   */
  private applyToMorphTarget(mesh: THREE.Mesh, targetName: string, value: number): void {
    if (!mesh.morphTargetDictionary || !mesh.morphTargetInfluences) return;

    const index = mesh.morphTargetDictionary[targetName];
    if (index !== undefined && index < mesh.morphTargetInfluences.length) {
      const clampedValue = Math.max(0, Math.min(1, value));
      mesh.morphTargetInfluences[index] = Math.max(mesh.morphTargetInfluences[index], clampedValue);
    }
  }

  /**
   * Smooth transition to neutral position
   */
  private smoothTransitionToNeutral(): void {
    const neutralShape = this.phonemeToMouthShape['SIL'];
    let progress = 0;
    const duration = 300; // 300ms transition
    const startTime = performance.now();
    
    const transition = () => {
      const elapsed = performance.now() - startTime;
      progress = Math.min(1, elapsed / duration);
      
      const currentShape = this.interpolateMouthShapes(this.lastMouthShape, neutralShape, progress);
      this.applyMouthShape(currentShape, 0.5 * (1 - progress));
      
      if (progress < 1) {
        requestAnimationFrame(transition);
      }
    };
    
    transition();
  }

  /**
   * Sync with audio timing
   */
  async syncWithAudio(text: string, audioDuration: number): Promise<void> {
    const phonemes = this.generateTimedPhonemes(text, audioDuration);
    this.startLipSync(phonemes);
  }

  /**
   * Check if lip sync is active
   */
  isLipSyncActive(): boolean {
    return this.isActive;
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<LipSyncConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Dispose resources
   */
  dispose(): void {
    this.stopLipSync();
    this.morphTargets = [];
  }
}