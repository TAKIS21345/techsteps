/**
 * TransitionEngine - Advanced smooth transition algorithms for avatar movements
 * 
 * This class provides sophisticated transition algorithms to ensure smooth,
 * natural movement changes between different animation states.
 * 
 * Requirements addressed:
 * - 1.3: Smooth transitions between movement patterns
 * - 4.1: Configurable movement parameters for different contexts
 */

import {
  Transition,
  MovementState,
  EasingType,
  AnimationCurve,
  Keyframe,
  HeadMovement,
  Gesture,
  MorphTargetMapping
} from './types';

export interface TransitionResult {
  progress: number; // 0.0 to 1.0
  morphTargets: MorphTargetMapping[];
  headRotation: { x: number; y: number; z: number };
  isComplete: boolean;
}

export interface BlendState {
  fromMovements: HeadMovement[];
  toMovements: HeadMovement[];
  fromGestures: Gesture[];
  toGestures: Gesture[];
  blendWeight: number; // 0.0 = fully from, 1.0 = fully to
}

export class TransitionEngine {
  private activeTransitions: Map<string, Transition> = new Map();
  private blendStates: Map<string, BlendState> = new Map();
  private transitionCallbacks: Map<string, (result: TransitionResult) => void> = new Map();

  /**
   * Creates a smooth transition between two movement states
   */
  public createTransition(
    transitionId: string,
    fromState: MovementState,
    toState: MovementState,
    duration: number,
    easing: EasingType = 'ease_in_out'
  ): void {
    const transition: Transition = {
      fromState,
      toState,
      duration,
      easing,
      blendMode: 'smooth'
    };

    this.activeTransitions.set(transitionId, transition);
  }

  /**
   * Updates all active transitions and returns current blend states
   */
  public updateTransitions(deltaTime: number): Map<string, TransitionResult> {
    const results = new Map<string, TransitionResult>();
    const completedTransitions: string[] = [];

    for (const [transitionId, transition] of this.activeTransitions) {
      const blendState = this.blendStates.get(transitionId);
      if (!blendState) continue;

      // Calculate transition progress
      const progress = this.calculateTransitionProgress(transition, deltaTime);

      // Apply easing function
      const easedProgress = this.applyEasing(progress, transition.easing);

      // Blend movements and gestures
      const result = this.blendMovements(blendState, easedProgress);

      results.set(transitionId, result);

      // Check if transition is complete
      if (progress >= 1.0) {
        completedTransitions.push(transitionId);
        this.notifyTransitionComplete(transitionId, result);
      }
    }

    // Clean up completed transitions
    completedTransitions.forEach(id => {
      this.activeTransitions.delete(id);
      this.blendStates.delete(id);
      this.transitionCallbacks.delete(id);
    });

    return results;
  }

  /**
   * Sets up blend state for smooth transitions between movements
   */
  public setupBlendState(
    transitionId: string,
    fromMovements: HeadMovement[],
    toMovements: HeadMovement[],
    fromGestures: Gesture[] = [],
    toGestures: Gesture[] = []
  ): void {
    const blendState: BlendState = {
      fromMovements,
      toMovements,
      fromGestures,
      toGestures,
      blendWeight: 0.0
    };

    this.blendStates.set(transitionId, blendState);
  }

  /**
   * Registers a callback for when a transition completes
   */
  public onTransitionComplete(
    transitionId: string,
    callback: (result: TransitionResult) => void
  ): void {
    this.transitionCallbacks.set(transitionId, callback);
  }

  /**
   * Calculates transition progress based on elapsed time
   */
  private calculateTransitionProgress(transition: Transition, deltaTime: number): number {
    // This is a simplified implementation - in practice, you'd track elapsed time
    // For now, we'll use deltaTime as a progress increment
    const progressIncrement = deltaTime / transition.duration;
    return Math.min(1.0, progressIncrement);
  }

  /**
   * Applies easing function to transition progress
   */
  private applyEasing(progress: number, easing: EasingType): number {
    switch (easing) {
      case 'linear':
        return progress;

      case 'ease_in':
        return progress * progress;

      case 'ease_out':
        return 1 - Math.pow(1 - progress, 2);

      case 'ease_in_out':
        return progress < 0.5
          ? 2 * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 2) / 2;

      case 'bounce':
        return this.bounceEasing(progress);

      case 'elastic':
        return this.elasticEasing(progress);

      case 'back':
        return this.backEasing(progress);

      default:
        return progress;
    }
  }

  /**
   * Blends movements and gestures based on transition progress
   */
  private blendMovements(blendState: BlendState, progress: number): TransitionResult {
    blendState.blendWeight = progress;

    // Blend head movements
    const blendedHeadRotation = this.blendHeadMovements(
      blendState.fromMovements,
      blendState.toMovements,
      progress
    );

    // Blend gestures to morph targets
    const blendedMorphTargets = this.blendGestures(
      blendState.fromGestures,
      blendState.toGestures,
      progress
    );

    return {
      progress,
      morphTargets: blendedMorphTargets,
      headRotation: blendedHeadRotation,
      isComplete: progress >= 1.0
    };
  }

  /**
   * Blends head movements between two states
   */
  private blendHeadMovements(
    fromMovements: HeadMovement[],
    toMovements: HeadMovement[],
    blendWeight: number
  ): { x: number; y: number; z: number } {
    // Simplified blending - in practice, you'd have more sophisticated blending
    const fromRotation = this.calculateHeadRotationFromMovements(fromMovements);
    const toRotation = this.calculateHeadRotationFromMovements(toMovements);

    return {
      x: this.lerp(fromRotation.x, toRotation.x, blendWeight),
      y: this.lerp(fromRotation.y, toRotation.y, blendWeight),
      z: this.lerp(fromRotation.z, toRotation.z, blendWeight)
    };
  }

  /**
   * Blends gestures into morph target mappings
   */
  private blendGestures(
    fromGestures: Gesture[],
    toGestures: Gesture[],
    blendWeight: number
  ): MorphTargetMapping[] {
    const morphTargets: MorphTargetMapping[] = [];

    // Blend from gestures (decreasing influence)
    fromGestures.forEach(gesture => {
      gesture.morphTargets.forEach(target => {
        morphTargets.push({
          targetName: target.targetName,
          weight: target.weight * (1 - blendWeight),
          blendMode: target.blendMode
        });
      });
    });

    // Blend to gestures (increasing influence)
    toGestures.forEach(gesture => {
      gesture.morphTargets.forEach(target => {
        const existingTarget = morphTargets.find(mt => mt.targetName === target.targetName);
        if (existingTarget) {
          existingTarget.weight += target.weight * blendWeight;
        } else {
          morphTargets.push({
            targetName: target.targetName,
            weight: target.weight * blendWeight,
            blendMode: target.blendMode
          });
        }
      });
    });

    return morphTargets;
  }

  /**
   * Calculates head rotation from movement array
   */
  private calculateHeadRotationFromMovements(movements: HeadMovement[]): { x: number; y: number; z: number } {
    let x = 0, y = 0, z = 0;

    movements.forEach(movement => {
      const intensity = movement.intensity;

      switch (movement.type) {
        case 'nod':
          x += movement.direction === 'up' ? -intensity * 0.2 : intensity * 0.2;
          break;
        case 'tilt':
          z += movement.direction === 'left' ? -intensity * 0.15 : intensity * 0.15;
          break;
        case 'turn':
          y += movement.direction === 'left' ? -intensity * 0.3 : intensity * 0.3;
          break;
        case 'shake':
          y += Math.sin(Date.now() * 0.01) * intensity * 0.1;
          break;
      }
    });

    return { x, y, z };
  }

  /**
   * Linear interpolation utility
   */
  private lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }

  /**
   * Bounce easing function
   */
  private bounceEasing(t: number): number {
    const n1 = 7.5625;
    const d1 = 2.75;

    if (t < 1 / d1) {
      return n1 * t * t;
    } else if (t < 2 / d1) {
      return n1 * (t -= 1.5 / d1) * t + 0.75;
    } else if (t < 2.5 / d1) {
      return n1 * (t -= 2.25 / d1) * t + 0.9375;
    } else {
      return n1 * (t -= 2.625 / d1) * t + 0.984375;
    }
  }

  /**
   * Elastic easing function
   */
  private elasticEasing(t: number): number {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  }

  /**
   * Back easing function
   */
  private backEasing(t: number): number {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return c3 * t * t * t - c1 * t * t;
  }

  /**
   * Notifies registered callbacks when transition completes
   */
  private notifyTransitionComplete(transitionId: string, result: TransitionResult): void {
    const callback = this.transitionCallbacks.get(transitionId);
    if (callback) {
      callback(result);
    }
  }

  /**
   * Clears all active transitions
   */
  public clearAllTransitions(): void {
    this.activeTransitions.clear();
    this.blendStates.clear();
    this.transitionCallbacks.clear();
  }

  /**
   * Gets the current state of a specific transition
   */
  public getTransitionState(transitionId: string): BlendState | null {
    return this.blendStates.get(transitionId) || null;
  }

  /**
   * Checks if a transition is currently active
   */
  public isTransitionActive(transitionId: string): boolean {
    return this.activeTransitions.has(transitionId);
  }
}
