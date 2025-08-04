import * as THREE from 'three';

export interface PhonemeData {
  phoneme: string;
  timestamp: number;
  duration: number;
  confidence: number;
}

export interface LipSyncFrame {
  timestamp: number;
  morphWeights: Map<string, number>;
}

export class EchoMimicV3 {
  private morphTargetMeshes: Map<string, THREE.Mesh> = new Map();
  private currentAnimation: LipSyncFrame[] = [];
  private isPlaying = false;
  private startTime = 0;
  private animationId: number | null = null;

  // Phoneme to morph target mapping for Ready Player Me avatars
  private phonemeToMorphMap: Map<string, Array<{ target: string; weight: number }>> = new Map([
    // Vowels
    ['AA', [{ target: 'mouthOpen', weight: 0.8 }, { target: 'jawOpen', weight: 0.6 }]], // "father"
    ['AE', [{ target: 'mouthOpen', weight: 0.6 }, { target: 'mouthWide', weight: 0.4 }]], // "cat"
    ['AH', [{ target: 'mouthOpen', weight: 0.5 }]], // "but"
    ['AO', [{ target: 'mouthOpen', weight: 0.7 }, { target: 'mouthRound', weight: 0.8 }]], // "bought"
    ['AW', [{ target: 'mouthOpen', weight: 0.6 }, { target: 'mouthRound', weight: 0.6 }]], // "about"
    ['AY', [{ target: 'mouthWide', weight: 0.5 }]], // "bite"
    ['EH', [{ target: 'mouthOpen', weight: 0.4 }, { target: 'mouthWide', weight: 0.3 }]], // "bet"
    ['ER', [{ target: 'mouthOpen', weight: 0.3 }]], // "bird"
    ['EY', [{ target: 'mouthWide', weight: 0.4 }]], // "bait"
    ['IH', [{ target: 'mouthWide', weight: 0.2 }]], // "bit"
    ['IY', [{ target: 'mouthWide', weight: 0.3 }]], // "beat"
    ['OW', [{ target: 'mouthRound', weight: 0.8 }]], // "boat"
    ['OY', [{ target: 'mouthRound', weight: 0.6 }, { target: 'mouthWide', weight: 0.3 }]], // "boy"
    ['UH', [{ target: 'mouthRound', weight: 0.4 }]], // "book"
    ['UW', [{ target: 'mouthRound', weight: 0.9 }]], // "boot"

    // Consonants
    ['B', [{ target: 'mouthClose', weight: 1.0 }]], // "bat"
    ['CH', [{ target: 'mouthNarrow', weight: 0.6 }]], // "chat"
    ['D', [{ target: 'mouthOpen', weight: 0.3 }]], // "dog"
    ['DH', [{ target: 'mouthOpen', weight: 0.2 }]], // "that"
    ['F', [{ target: 'mouthNarrow', weight: 0.4 }]], // "fat"
    ['G', [{ target: 'mouthOpen', weight: 0.4 }]], // "go"
    ['HH', [{ target: 'mouthOpen', weight: 0.2 }]], // "hat"
    ['JH', [{ target: 'mouthNarrow', weight: 0.5 }]], // "joy"
    ['K', [{ target: 'mouthOpen', weight: 0.3 }]], // "cat"
    ['L', [{ target: 'mouthOpen', weight: 0.3 }]], // "let"
    ['M', [{ target: 'mouthClose', weight: 1.0 }]], // "mat"
    ['N', [{ target: 'mouthOpen', weight: 0.2 }]], // "net"
    ['NG', [{ target: 'mouthOpen', weight: 0.3 }]], // "sing"
    ['P', [{ target: 'mouthClose', weight: 1.0 }]], // "pat"
    ['R', [{ target: 'mouthNarrow', weight: 0.4 }]], // "rat"
    ['S', [{ target: 'mouthNarrow', weight: 0.5 }]], // "sat"
    ['SH', [{ target: 'mouthNarrow', weight: 0.6 }, { target: 'mouthRound', weight: 0.3 }]], // "she"
    ['T', [{ target: 'mouthOpen', weight: 0.2 }]], // "top"
    ['TH', [{ target: 'mouthOpen', weight: 0.3 }]], // "think"
    ['V', [{ target: 'mouthNarrow', weight: 0.4 }]], // "van"
    ['W', [{ target: 'mouthRound', weight: 0.7 }]], // "wet"
    ['Y', [{ target: 'mouthWide', weight: 0.3 }]], // "yes"
    ['Z', [{ target: 'mouthNarrow', weight: 0.4 }]], // "zoo"
    ['ZH', [{ target: 'mouthNarrow', weight: 0.5 }]], // "measure"

    // Silence
    ['SIL', [{ target: 'mouthClose', weight: 0.0 }]]
  ]);

  constructor(morphTargetMeshes: Map<string, THREE.Mesh>) {
    this.morphTargetMeshes = morphTargetMeshes;
  }

  /**
   * Generate lip sync animation from phoneme data
   */
  generateLipSyncAnimation(phonemes: PhonemeData[]): LipSyncFrame[] {
    const frames: LipSyncFrame[] = [];
    const frameRate = 30; // 30 FPS for smooth animation
    const frameDuration = 1000 / frameRate; // milliseconds per frame

    if (phonemes.length === 0) {
      return frames;
    }

    const totalDuration = Math.max(...phonemes.map(p => p.timestamp + p.duration));
    const totalFrames = Math.ceil(totalDuration / frameDuration);

    for (let frameIndex = 0; frameIndex < totalFrames; frameIndex++) {
      const currentTime = frameIndex * frameDuration;
      const morphWeights = new Map<string, number>();

      // Find active phonemes at current time
      const activePhonemes = phonemes.filter(p => 
        currentTime >= p.timestamp && currentTime < p.timestamp + p.duration
      );

      // Reset all morph targets
      this.resetMorphWeights(morphWeights);

      // Apply weights from active phonemes
      for (const phoneme of activePhonemes) {
        const morphTargets = this.phonemeToMorphMap.get(phoneme.phoneme);
        if (morphTargets) {
          // Calculate blend factor based on position within phoneme duration
          const phonemeProgress = (currentTime - phoneme.timestamp) / phoneme.duration;
          const blendFactor = this.calculateBlendFactor(phonemeProgress) * phoneme.confidence;

          for (const { target, weight } of morphTargets) {
            const currentWeight = morphWeights.get(target) || 0;
            morphWeights.set(target, Math.min(1.0, currentWeight + (weight * blendFactor)));
          }
        }
      }

      // Smooth transitions between frames
      if (frames.length > 0) {
        this.smoothTransition(frames[frames.length - 1].morphWeights, morphWeights, 0.3);
      }

      frames.push({
        timestamp: currentTime,
        morphWeights: new Map(morphWeights)
      });
    }

    return frames;
  }

  /**
   * Calculate blend factor for smooth phoneme transitions
   */
  private calculateBlendFactor(progress: number): number {
    // Use a smooth curve for natural-looking transitions
    if (progress < 0.2) {
      // Ease in
      return progress / 0.2;
    } else if (progress > 0.8) {
      // Ease out
      return (1.0 - progress) / 0.2;
    } else {
      // Full strength in middle
      return 1.0;
    }
  }

  /**
   * Reset all morph weights to neutral position
   */
  private resetMorphWeights(morphWeights: Map<string, number>): void {
    const morphTargets = ['mouthOpen', 'mouthClose', 'mouthWide', 'mouthNarrow', 'mouthRound', 'jawOpen'];
    for (const target of morphTargets) {
      morphWeights.set(target, 0.0);
    }
  }

  /**
   * Smooth transition between morph weight sets
   */
  private smoothTransition(
    previousWeights: Map<string, number>, 
    currentWeights: Map<string, number>, 
    smoothingFactor: number
  ): void {
    for (const [target, currentWeight] of currentWeights) {
      const previousWeight = previousWeights.get(target) || 0;
      const smoothedWeight = previousWeight * smoothingFactor + currentWeight * (1 - smoothingFactor);
      currentWeights.set(target, smoothedWeight);
    }
  }

  /**
   * Start lip sync animation playback
   */
  startAnimation(frames: LipSyncFrame[]): void {
    this.currentAnimation = frames;
    this.isPlaying = true;
    this.startTime = performance.now();
    this.animate();
  }

  /**
   * Stop lip sync animation
   */
  stopAnimation(): void {
    this.isPlaying = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    
    // Reset to neutral position
    this.applyMorphWeights(new Map([
      ['mouthOpen', 0],
      ['mouthClose', 0],
      ['mouthWide', 0],
      ['mouthNarrow', 0],
      ['mouthRound', 0],
      ['jawOpen', 0]
    ]));
  }

  /**
   * Animation loop
   */
  private animate(): void {
    if (!this.isPlaying) return;

    const currentTime = performance.now() - this.startTime;
    
    // Find the appropriate frame
    const frame = this.findFrameAtTime(currentTime);
    if (frame) {
      this.applyMorphWeights(frame.morphWeights);
    }

    // Check if animation is complete
    if (this.currentAnimation.length > 0) {
      const lastFrame = this.currentAnimation[this.currentAnimation.length - 1];
      if (currentTime >= lastFrame.timestamp) {
        this.stopAnimation();
        return;
      }
    }

    this.animationId = requestAnimationFrame(() => this.animate());
  }

  /**
   * Find the appropriate frame for the current time
   */
  private findFrameAtTime(time: number): LipSyncFrame | null {
    if (this.currentAnimation.length === 0) return null;

    // Find the frame closest to the current time
    let closestFrame = this.currentAnimation[0];
    let minDistance = Math.abs(time - closestFrame.timestamp);

    for (const frame of this.currentAnimation) {
      const distance = Math.abs(time - frame.timestamp);
      if (distance < minDistance) {
        minDistance = distance;
        closestFrame = frame;
      }
    }

    return closestFrame;
  }

  /**
   * Apply morph weights to the avatar meshes
   */
  private applyMorphWeights(weights: Map<string, number>): void {
    for (const [meshName, mesh] of this.morphTargetMeshes) {
      if (!mesh.morphTargetDictionary || !mesh.morphTargetInfluences) continue;

      for (const [targetName, weight] of weights) {
        const targetIndex = mesh.morphTargetDictionary[targetName];
        if (targetIndex !== undefined && targetIndex < mesh.morphTargetInfluences.length) {
          mesh.morphTargetInfluences[targetIndex] = weight;
        }
      }
    }
  }

  /**
   * Generate phonemes from text (simplified approach for demo)
   */
  generatePhonemesFromText(text: string, speechRate: number = 1.0): PhonemeData[] {
    const words = text.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/);
    const phonemes: PhonemeData[] = [];
    let currentTime = 0;

    for (const word of words) {
      const wordPhonemes = this.mapWordToPhonemes(word);
      
      for (const phoneme of wordPhonemes) {
        const duration = this.getPhonemeBaseDuration(phoneme) / speechRate;
        
        phonemes.push({
          phoneme,
          timestamp: currentTime,
          duration,
          confidence: 0.8
        });
        
        currentTime += duration;
      }
      
      // Add pause between words
      phonemes.push({
        phoneme: 'SIL',
        timestamp: currentTime,
        duration: 100 / speechRate,
        confidence: 1.0
      });
      
      currentTime += 100 / speechRate;
    }

    return phonemes;
  }

  /**
   * Simple word to phoneme mapping
   */
  private mapWordToPhonemes(word: string): string[] {
    // Simplified phoneme mapping - in production, use a proper phoneme dictionary
    const phonemeMap: Record<string, string[]> = {
      'hello': ['HH', 'EH', 'L', 'OW'],
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
      'next': ['N', 'EH', 'K', 'S', 'T'],
      'correct': ['K', 'AH', 'R', 'EH', 'K', 'T'],
      'wrong': ['R', 'AO', 'NG'],
      'try': ['T', 'R', 'AY'],
      'again': ['AH', 'G', 'EH', 'N']
    };

    if (phonemeMap[word]) {
      return phonemeMap[word];
    }

    // Fallback: generate phonemes based on simple rules
    const phonemes: string[] = [];
    for (let i = 0; i < word.length; i++) {
      const char = word[i];
      if ('aeiou'.includes(char)) {
        phonemes.push('AH'); // Generic vowel
      } else if ('bcdfghjklmnpqrstvwxyz'.includes(char)) {
        phonemes.push('T'); // Generic consonant
      }
    }

    return phonemes.length > 0 ? phonemes : ['SIL'];
  }

  /**
   * Get base duration for a phoneme
   */
  private getPhonemeBaseDuration(phoneme: string): number {
    // Base durations in milliseconds
    const durations: Record<string, number> = {
      // Vowels (longer)
      'AA': 120, 'AE': 110, 'AH': 100, 'AO': 130, 'AW': 140,
      'AY': 150, 'EH': 100, 'ER': 120, 'EY': 130, 'IH': 90,
      'IY': 110, 'OW': 140, 'OY': 150, 'UH': 100, 'UW': 130,
      
      // Consonants (shorter)
      'B': 80, 'CH': 90, 'D': 70, 'DH': 80, 'F': 90,
      'G': 70, 'HH': 60, 'JH': 90, 'K': 70, 'L': 80,
      'M': 80, 'N': 70, 'NG': 80, 'P': 80, 'R': 80,
      'S': 90, 'SH': 100, 'T': 70, 'TH': 80, 'V': 80,
      'W': 90, 'Y': 70, 'Z': 80, 'ZH': 90,
      
      // Silence
      'SIL': 50
    };

    return durations[phoneme] || 80;
  }

  /**
   * Check if animation is currently playing
   */
  isAnimationPlaying(): boolean {
    return this.isPlaying;
  }

  /**
   * Get current animation progress (0-1)
   */
  getAnimationProgress(): number {
    if (!this.isPlaying || this.currentAnimation.length === 0) return 0;

    const currentTime = performance.now() - this.startTime;
    const totalDuration = this.currentAnimation[this.currentAnimation.length - 1].timestamp;
    
    return Math.min(1.0, currentTime / totalDuration);
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    this.stopAnimation();
    this.morphTargetMeshes.clear();
    this.currentAnimation = [];
  }
}