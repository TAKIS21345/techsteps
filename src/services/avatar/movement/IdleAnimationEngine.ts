/**
 * IdleAnimationEngine - Natural idle animation system
 * 
 * This class replaces random side-to-side movements with natural, purposeful
 * idle animations including breathing patterns, micro-movements, and subtle
 * life-like behaviors that feel alive but not distracting.
 * 
 * Requirements addressed:
 * - 1.2: Subtle, natural breathing and micro-movements instead of random side-to-side motion
 * - 1.3: Smooth transitions between movement patterns
 */

import { IdleMovement, MotionSettings } from './types';
import * as THREE from 'three';

export interface IdleAnimationState {
  breathingPhase: number;
  microMovementPhase: number;
  blinkPhase: number;
  subtleSwayPhase: number;
  lastBlinkTime: number;
  isBlinking: boolean;
  blinkDuration: number;
  intensity: number;
}

export interface IdleAnimationResult {
  headRotation: { x: number; y: number; z: number };
  spineRotation: { x: number; y: number; z: number };
  hipsRotation: { x: number; y: number; z: number };
  blinkWeight: number;
  shouldBlink: boolean;
}

export class IdleAnimationEngine {
  private animationState: IdleAnimationState;
  private idleMovements: IdleMovement[];
  private motionSettings: MotionSettings;
  private lastUpdateTime: number = 0;

  constructor(motionSettings: MotionSettings) {
    this.motionSettings = motionSettings;
    this.animationState = this.initializeAnimationState();
    this.idleMovements = this.createNaturalIdleMovements();
  }

  /**
   * Updates idle animations and returns current animation state
   */
  public updateIdleAnimations(deltaTime: number, elapsedTime: number): IdleAnimationResult {
    this.lastUpdateTime = elapsedTime;
    
    // Update animation phases
    this.updateAnimationPhases(deltaTime);
    
    // Calculate natural breathing
    const breathingResult = this.calculateBreathing();
    
    // Calculate micro-movements
    const microMovementResult = this.calculateMicroMovements();
    
    // Calculate subtle sway
    const swayResult = this.calculateSubtleSway();
    
    // Calculate natural blinking
    const blinkResult = this.calculateNaturalBlinking(elapsedTime);
    
    // Combine all movements with intensity scaling
    const intensityScale = this.getIntensityScale();
    
    return {
      headRotation: {
        x: (microMovementResult.x + breathingResult.headInfluence.x) * intensityScale,
        y: microMovementResult.y * intensityScale,
        z: swayResult.headInfluence.z * intensityScale
      },
      spineRotation: {
        x: breathingResult.spine.x * intensityScale,
        y: 0,
        z: swayResult.spine.z * intensityScale * 0.5
      },
      hipsRotation: {
        x: 0,
        y: 0,
        z: swayResult.hips.z * intensityScale * 0.3
      },
      blinkWeight: blinkResult.weight,
      shouldBlink: blinkResult.shouldBlink
    };
  }

  /**
   * Updates motion settings and adjusts animation intensity
   */
  public updateMotionSettings(settings: MotionSettings): void {
    this.motionSettings = settings;
    this.animationState.intensity = this.getIntensityScale();
  }

  /**
   * Smoothly transitions to a new idle state
   */
  public transitionToIdleState(targetIntensity: number, duration: number): void {
    // Implement smooth transition logic
    const currentIntensity = this.animationState.intensity;
    const intensityDiff = targetIntensity - currentIntensity;
    
    // This would be expanded with proper transition timing
    this.animationState.intensity = targetIntensity;
  }

  /**
   * Initializes the animation state
   */
  private initializeAnimationState(): IdleAnimationState {
    return {
      breathingPhase: 0,
      microMovementPhase: Math.random() * Math.PI * 2, // Random start phase
      blinkPhase: 0,
      subtleSwayPhase: Math.random() * Math.PI * 2,
      lastBlinkTime: 0,
      isBlinking: false,
      blinkDuration: 0,
      intensity: this.getIntensityScale()
    };
  }

  /**
   * Creates natural idle movement patterns
   */
  private createNaturalIdleMovements(): IdleMovement[] {
    return [
      {
        type: 'breathing',
        amplitude: 0.02, // Subtle breathing movement
        frequency: 0.25, // 15 breaths per minute (0.25 Hz)
        phase: 0
      },
      {
        type: 'micro_movement',
        amplitude: 0.05, // Very small adjustments
        frequency: 0.08, // Slow micro adjustments
        phase: Math.PI / 4
      },
      {
        type: 'blink_pattern',
        amplitude: 1.0,
        frequency: 0.2, // 12 blinks per minute
        phase: 0
      },
      {
        type: 'subtle_sway',
        amplitude: 0.01, // Very subtle swaying
        frequency: 0.03, // Very slow sway
        phase: Math.PI / 2
      }
    ];
  }

  /**
   * Updates all animation phases based on delta time
   */
  private updateAnimationPhases(deltaTime: number): void {
    const breathingMovement = this.idleMovements.find(m => m.type === 'breathing');
    const microMovement = this.idleMovements.find(m => m.type === 'micro_movement');
    const swayMovement = this.idleMovements.find(m => m.type === 'subtle_sway');

    if (breathingMovement) {
      this.animationState.breathingPhase += deltaTime * breathingMovement.frequency * 2 * Math.PI;
    }

    if (microMovement) {
      this.animationState.microMovementPhase += deltaTime * microMovement.frequency * 2 * Math.PI;
    }

    if (swayMovement) {
      this.animationState.subtleSwayPhase += deltaTime * swayMovement.frequency * 2 * Math.PI;
    }

    // Keep phases within reasonable bounds
    this.animationState.breathingPhase = this.animationState.breathingPhase % (2 * Math.PI);
    this.animationState.microMovementPhase = this.animationState.microMovementPhase % (2 * Math.PI);
    this.animationState.subtleSwayPhase = this.animationState.subtleSwayPhase % (2 * Math.PI);
  }

  /**
   * Calculates natural breathing animation
   */
  private calculateBreathing(): { spine: { x: number; y: number; z: number }, headInfluence: { x: number; y: number; z: number } } {
    const breathingMovement = this.idleMovements.find(m => m.type === 'breathing');
    if (!breathingMovement) {
      return { spine: { x: 0, y: 0, z: 0 }, headInfluence: { x: 0, y: 0, z: 0 } };
    }

    // Natural breathing curve - more realistic than simple sine wave
    const breathPhase = this.animationState.breathingPhase;
    const breathCycle = Math.sin(breathPhase);
    
    // Add slight variation to make breathing more natural
    const breathVariation = Math.sin(breathPhase * 1.3) * 0.3;
    const naturalBreath = (breathCycle + breathVariation) * breathingMovement.amplitude;

    return {
      spine: {
        x: naturalBreath, // Forward/backward chest movement
        y: 0,
        z: naturalBreath * 0.2 // Slight side expansion
      },
      headInfluence: {
        x: naturalBreath * 0.1, // Subtle head movement with breathing
        y: 0,
        z: 0
      }
    };
  }

  /**
   * Calculates natural micro-movements
   */
  private calculateMicroMovements(): { x: number; y: number; z: number } {
    const microMovement = this.idleMovements.find(m => m.type === 'micro_movement');
    if (!microMovement) {
      return { x: 0, y: 0, z: 0 };
    }

    const phase = this.animationState.microMovementPhase;
    
    // Create natural, non-repetitive micro-movements
    const xMovement = Math.sin(phase) * microMovement.amplitude * 0.5;
    const yMovement = Math.sin(phase * 0.7 + Math.PI / 3) * microMovement.amplitude * 0.3;
    const zMovement = Math.sin(phase * 1.1 + Math.PI / 6) * microMovement.amplitude * 0.2;

    return { x: xMovement, y: yMovement, z: zMovement };
  }

  /**
   * Calculates subtle body sway
   */
  private calculateSubtleSway(): { 
    spine: { x: number; y: number; z: number },
    hips: { x: number; y: number; z: number },
    headInfluence: { x: number; y: number; z: number }
  } {
    const swayMovement = this.idleMovements.find(m => m.type === 'subtle_sway');
    if (!swayMovement) {
      return { 
        spine: { x: 0, y: 0, z: 0 },
        hips: { x: 0, y: 0, z: 0 },
        headInfluence: { x: 0, y: 0, z: 0 }
      };
    }

    const phase = this.animationState.subtleSwayPhase;
    const swayAmount = Math.sin(phase) * swayMovement.amplitude;
    
    // Create a natural weight shift
    const counterSway = -swayAmount * 0.6; // Counter-movement for natural balance

    return {
      spine: {
        x: 0,
        y: 0,
        z: swayAmount * 0.8 // Spine follows the sway
      },
      hips: {
        x: 0,
        y: 0,
        z: counterSway // Hips counter-balance
      },
      headInfluence: {
        x: 0,
        y: 0,
        z: swayAmount * 0.3 // Head follows subtly
      }
    };
  }

  /**
   * Calculates natural blinking pattern
   */
  private calculateNaturalBlinking(elapsedTime: number): { weight: number; shouldBlink: boolean } {
    const currentTime = elapsedTime * 1000; // Convert to milliseconds
    
    // Natural blinking intervals (4-8 seconds with variation)
    const baseInterval = 5000; // 5 seconds base
    const variation = 3000; // ±3 seconds variation
    const blinkInterval = baseInterval + (Math.sin(elapsedTime * 0.1) * variation);
    
    // Check if it's time for a new blink
    if (!this.animationState.isBlinking && 
        currentTime - this.animationState.lastBlinkTime > blinkInterval) {
      
      this.animationState.isBlinking = true;
      this.animationState.lastBlinkTime = currentTime;
      this.animationState.blinkDuration = 150 + Math.random() * 100; // 150-250ms
    }

    // Calculate blink animation
    if (this.animationState.isBlinking) {
      const blinkProgress = (currentTime - this.animationState.lastBlinkTime) / this.animationState.blinkDuration;
      
      if (blinkProgress >= 1) {
        this.animationState.isBlinking = false;
        return { weight: 0, shouldBlink: false };
      }

      // Natural blink curve - quick close, slower open
      let blinkWeight;
      if (blinkProgress < 0.3) {
        // Quick close (30% of duration)
        blinkWeight = Math.sin((blinkProgress / 0.3) * Math.PI * 0.5);
      } else {
        // Slower open (70% of duration)
        blinkWeight = Math.cos(((blinkProgress - 0.3) / 0.7) * Math.PI * 0.5);
      }

      return { weight: blinkWeight, shouldBlink: true };
    }

    return { weight: 0, shouldBlink: false };
  }

  /**
   * Gets intensity scale based on motion settings
   */
  private getIntensityScale(): number {
    if (!this.motionSettings.enableIdleAnimations) {
      return 0;
    }

    const baseIntensity = this.motionSettings.customIntensityScale || 1.0;

    switch (this.motionSettings.intensity) {
      case 'minimal':
        return baseIntensity * 0.2;
      case 'reduced':
        return baseIntensity * 0.5;
      case 'standard':
        return baseIntensity * 1.0;
      case 'enhanced':
        return baseIntensity * 1.5;
      default:
        return baseIntensity;
    }
  }

  /**
   * Gets current animation state for debugging
   */
  public getAnimationState(): IdleAnimationState {
    return { ...this.animationState };
  }

  /**
   * Resets animation state
   */
  public resetAnimationState(): void {
    this.animationState = this.initializeAnimationState();
  }

  /**
   * Checks if idle animations are enabled
   */
  public isEnabled(): boolean {
    return this.motionSettings.enableIdleAnimations && this.getIntensityScale() > 0;
  }
}