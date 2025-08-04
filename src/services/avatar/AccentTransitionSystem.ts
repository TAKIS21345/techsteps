/**
 * AccentTransitionSystem - Manages smooth transitions between different accent profiles
 * 
 * This system handles the gradual transition from one accent to another to avoid
 * jarring changes in the avatar's speech patterns and movements.
 * 
 * Requirements addressed:
 * - 2.1: Smooth accent transition system
 * - 2.2: English to other language transitions
 * - 2.3: Spanish accent integration
 * - 2.4: French accent integration
 * - 2.5: Multi-language accent support
 */

import { AccentProfile, HeadMovementStyle, RhythmPattern } from './movement/types';
import { AccentEngine } from './movement/AccentEngine';

export interface AccentTransitionState {
  fromProfile: AccentProfile;
  toProfile: AccentProfile;
  progress: number; // 0.0 to 1.0
  duration: number; // milliseconds
  startTime: number;
  isActive: boolean;
}

export interface BlendedAccentProfile extends AccentProfile {
  blendRatio: number; // How much of the target accent is applied
}

export type AccentTransitionCompleteCallback = (finalProfile: AccentProfile) => void;

export class AccentTransitionSystem {
  private currentTransition: AccentTransitionState | null = null;
  private accentEngine: AccentEngine;
  private transitionCallbacks: AccentTransitionCompleteCallback[] = [];

  constructor(accentEngine: AccentEngine) {
    this.accentEngine = accentEngine;
  }

  /**
   * Starts a transition from the current accent to a new accent
   */
  public startTransition(
    fromProfile: AccentProfile,
    toProfile: AccentProfile,
    durationMs: number = 2000
  ): void {
    // If there's already a transition in progress, complete it immediately
    if (this.currentTransition) {
      this.completeCurrentTransition();
    }

    this.currentTransition = {
      fromProfile,
      toProfile,
      progress: 0,
      duration: durationMs,
      startTime: Date.now(),
      isActive: true
    };

    console.log(`🎭 Starting accent transition: ${fromProfile.language} → ${toProfile.language} (${durationMs}ms)`);
  }

  /**
   * Updates the transition progress and returns the current blended profile
   */
  public updateTransition(): BlendedAccentProfile | null {
    if (!this.currentTransition || !this.currentTransition.isActive) {
      return null;
    }

    const elapsed = Date.now() - this.currentTransition.startTime;
    const progress = Math.min(1.0, elapsed / this.currentTransition.duration);
    
    this.currentTransition.progress = progress;

    // Create blended profile
    const blendedProfile = this.createBlendedProfile(
      this.currentTransition.fromProfile,
      this.currentTransition.toProfile,
      progress
    );

    // Check if transition is complete
    if (progress >= 1.0) {
      this.completeCurrentTransition();
    }

    return blendedProfile;
  }

  /**
   * Checks if a transition is currently active
   */
  public isTransitioning(): boolean {
    return this.currentTransition?.isActive || false;
  }

  /**
   * Gets the current transition progress (0.0 to 1.0)
   */
  public getTransitionProgress(): number {
    return this.currentTransition?.progress || 0;
  }

  /**
   * Immediately completes the current transition
   */
  public completeCurrentTransition(): void {
    if (this.currentTransition) {
      const finalProfile = this.currentTransition.toProfile;
      this.currentTransition.isActive = false;
      
      console.log(`🎭 ✅ Accent transition completed: ${finalProfile.language}`);
      
      // Notify callbacks
      this.transitionCallbacks.forEach(callback => {
        try {
          callback(finalProfile);
        } catch (error) {
          console.error('Error in accent transition callback:', error);
        }
      });

      this.currentTransition = null;
    }
  }

  /**
   * Cancels the current transition and reverts to the original accent
   */
  public cancelTransition(): void {
    if (this.currentTransition) {
      const originalProfile = this.currentTransition.fromProfile;
      this.currentTransition.isActive = false;
      
      console.log(`🎭 ❌ Accent transition cancelled, reverting to: ${originalProfile.language}`);
      
      // Notify callbacks with original profile
      this.transitionCallbacks.forEach(callback => {
        try {
          callback(originalProfile);
        } catch (error) {
          console.error('Error in accent transition callback:', error);
        }
      });

      this.currentTransition = null;
    }
  }

  /**
   * Adds a callback for when transitions complete
   */
  public addTransitionCompleteCallback(callback: AccentTransitionCompleteCallback): void {
    this.transitionCallbacks.push(callback);
  }

  /**
   * Removes a transition complete callback
   */
  public removeTransitionCompleteCallback(callback: AccentTransitionCompleteCallback): void {
    const index = this.transitionCallbacks.indexOf(callback);
    if (index > -1) {
      this.transitionCallbacks.splice(index, 1);
    }
  }

  // Private methods

  private createBlendedProfile(
    fromProfile: AccentProfile,
    toProfile: AccentProfile,
    progress: number
  ): BlendedAccentProfile {
    // Use easing function for smoother transitions
    const easedProgress = this.easeInOutCubic(progress);

    return {
      language: toProfile.language, // Always use target language
      region: toProfile.region,
      pronunciationRules: this.blendPronunciationRules(
        fromProfile.pronunciationRules,
        toProfile.pronunciationRules,
        easedProgress
      ),
      speechRhythm: this.blendRhythmPattern(
        fromProfile.speechRhythm,
        toProfile.speechRhythm,
        easedProgress
      ),
      intonationPatterns: this.blendIntonationPatterns(
        fromProfile.intonationPatterns,
        toProfile.intonationPatterns,
        easedProgress
      ),
      headMovementStyle: this.blendHeadMovementStyle(
        fromProfile.headMovementStyle,
        toProfile.headMovementStyle,
        easedProgress
      ),
      blendRatio: easedProgress
    };
  }

  private blendPronunciationRules(
    fromRules: any,
    toRules: any,
    progress: number
  ): any {
    // For pronunciation rules, we gradually shift from source to target mappings
    const blendedRules = {
      vowelMappings: { ...fromRules.vowelMappings },
      consonantMappings: { ...fromRules.consonantMappings },
      rhythmPattern: this.blendRhythmPattern(fromRules.rhythmPattern, toRules.rhythmPattern, progress),
      stressPatterns: progress > 0.5 ? toRules.stressPatterns : fromRules.stressPatterns
    };

    // Gradually replace mappings based on progress
    if (progress > 0.3) {
      // Start blending vowel mappings
      Object.keys(toRules.vowelMappings).forEach(key => {
        if (Math.random() < progress) {
          blendedRules.vowelMappings[key] = toRules.vowelMappings[key];
        }
      });
    }

    if (progress > 0.5) {
      // Start blending consonant mappings
      Object.keys(toRules.consonantMappings).forEach(key => {
        if (Math.random() < (progress - 0.3)) {
          blendedRules.consonantMappings[key] = toRules.consonantMappings[key];
        }
      });
    }

    return blendedRules;
  }

  private blendRhythmPattern(
    fromRhythm: RhythmPattern,
    toRhythm: RhythmPattern,
    progress: number
  ): RhythmPattern {
    return {
      beatsPerMinute: this.lerp(fromRhythm.beatsPerMinute, toRhythm.beatsPerMinute, progress),
      stressPattern: fromRhythm.stressPattern.map((fromValue, index) => {
        const toValue = toRhythm.stressPattern[index] || fromValue;
        return this.lerp(fromValue, toValue, progress);
      }),
      pauseDurations: fromRhythm.pauseDurations.map((fromValue, index) => {
        const toValue = toRhythm.pauseDurations[index] || fromValue;
        return this.lerp(fromValue, toValue, progress);
      })
    };
  }

  private blendIntonationPatterns(
    fromPatterns: any[],
    toPatterns: any[],
    progress: number
  ): any[] {
    // Gradually transition from source to target intonation patterns
    if (progress < 0.5) {
      return fromPatterns;
    } else {
      return toPatterns;
    }
  }

  private blendHeadMovementStyle(
    fromStyle: HeadMovementStyle,
    toStyle: HeadMovementStyle,
    progress: number
  ): HeadMovementStyle {
    return {
      nodFrequency: this.lerp(fromStyle.nodFrequency, toStyle.nodFrequency, progress),
      tiltTendency: this.lerp(fromStyle.tiltTendency, toStyle.tiltTendency, progress),
      emphasisStyle: progress > 0.5 ? toStyle.emphasisStyle : fromStyle.emphasisStyle
    };
  }

  private lerp(from: number, to: number, progress: number): number {
    return from + (to - from) * progress;
  }

  private easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }
}