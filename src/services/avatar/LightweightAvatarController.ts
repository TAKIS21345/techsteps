/**
 * Lightweight Avatar Controller
 * Manages state and animations for the 3x3 grid avatar system
 */

import {
  AvatarState,
  AnimationEvent,
  AnimationEngine,
  GridSquare,
  ColorScheme,
  ANIMATION_PATTERNS,
  COLOR_SCHEMES
} from '../../components/ai/avatar/types';
import { AnimationQueue, getGlobalAnimationQueue } from './AnimationQueue';

export class LightweightAvatarController implements AnimationEngine {
  public currentState: AvatarState = 'idle';
  public targetState: AvatarState = 'idle';
  public animationQueue: AnimationEvent[] = [];
  public isAnimating: boolean = false;

  private listeners: Set<(state: AvatarState) => void> = new Set();
  private animationCompleteListeners: Set<(state: AvatarState) => void> = new Set();
  private currentAnimation: number | null = null;
  private reducedMotion: boolean = false;
  private animationQueueService: AnimationQueue;
  private currentSquares: GridSquare[] = [];
  private squareUpdateListeners: Set<(squares: GridSquare[]) => void> = new Set();

  constructor(initialState: AvatarState = 'idle', reducedMotion: boolean = false) {
    this.currentState = initialState;
    this.targetState = initialState;
    this.reducedMotion = reducedMotion;
    this.animationQueueService = getGlobalAnimationQueue();

    // Initialize current squares
    this.currentSquares = this.createInitialSquares();

    // Set up animation queue listeners
    this.setupAnimationQueueListeners();

    // Check for reduced motion preference
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      this.reducedMotion = mediaQuery.matches || reducedMotion;

      // Listen for changes to reduced motion preference
      mediaQuery.addEventListener('change', (e) => {
        this.reducedMotion = e.matches;
      });
    }
  }

  /**
   * Set the avatar state
   */
  public setState(state: AvatarState): void {
    if (this.currentState === state) return;

    const previousState = this.currentState;
    this.targetState = state;

    // Use the animation queue service for smooth transitions
    this.animationQueueService.queueTransition(previousState, state, {
      priority: this.getStatePriority(state)
    });
  }

  /**
   * Queue an animation event
   */
  public queueAnimation(event: AnimationEvent): void {
    this.animationQueueService.enqueue(event);
  }

  /**
   * Process the animation queue
   */
  public processQueue(): void {
    // Queue processing is now handled by the AnimationQueue service
    const queueState = this.animationQueueService.getQueueState();
    this.isAnimating = queueState.isProcessing;
  }

  /**
   * Clear the animation queue
   */
  public clearQueue(): void {
    this.animationQueueService.clear();
    this.isAnimating = false;
  }

  /**
   * Get the current grid squares for the current state
   */
  public getCurrentSquares(): GridSquare[] {
    const pattern = ANIMATION_PATTERNS[this.currentState];
    const colorScheme = this.getColorScheme();

    // Create base squares
    const squares: GridSquare[] = [];
    for (let i = 0; i < 9; i++) {
      squares.push({
        id: i,
        opacity: 1.0,
        scale: 1.0,
        color: colorScheme.primary[i],
        delay: 0
      });
    }

    // Apply current animation frame if available
    if (pattern.keyframes.length > 0) {
      const firstFrame = pattern.keyframes[0];
      firstFrame.squares.forEach((squareUpdate, index) => {
        if (squares[index]) {
          Object.assign(squares[index], squareUpdate);
        }
      });
    }

    return squares;
  }

  /**
   * Get the appropriate color scheme for the current state
   */
  public getColorScheme(): ColorScheme {
    switch (this.currentState) {
      case 'celebrating':
        return COLOR_SCHEMES.celebrating;
      case 'error':
        return COLOR_SCHEMES.error;
      default:
        return COLOR_SCHEMES.default;
    }
  }

  /**
   * Add a state change listener
   */
  public addStateListener(listener: (state: AvatarState) => void): void {
    this.listeners.add(listener);
  }

  /**
   * Remove a state change listener
   */
  public removeStateListener(listener: (state: AvatarState) => void): void {
    this.listeners.delete(listener);
  }

  /**
   * Add an animation complete listener
   */
  public addAnimationCompleteListener(listener: (state: AvatarState) => void): void {
    this.animationCompleteListeners.add(listener);
  }

  /**
   * Remove an animation complete listener
   */
  public removeAnimationCompleteListener(listener: (state: AvatarState) => void): void {
    this.animationCompleteListeners.delete(listener);
  }

  /**
   * Update reduced motion setting
   */
  public setReducedMotion(enabled: boolean): void {
    this.reducedMotion = enabled;
  }

  /**
   * Get current reduced motion setting
   */
  public getReducedMotion(): boolean {
    return this.reducedMotion;
  }

  /**
   * Add a squares update listener
   */
  public addSquareUpdateListener(listener: (squares: GridSquare[]) => void): void {
    this.squareUpdateListeners.add(listener);
  }

  /**
   * Remove a squares update listener
   */
  public removeSquareUpdateListener(listener: (squares: GridSquare[]) => void): void {
    this.squareUpdateListeners.delete(listener);
  }

  /**
   * Update the current squares and notify listeners
   */
  public updateSquares(squares: GridSquare[]): void {
    this.currentSquares = squares;
    this.squareUpdateListeners.forEach(listener => {
      try {
        listener(squares);
      } catch (error) {
        console.warn('Error in squares update listener:', error);
      }
    });
  }

  /**
   * Create initial squares for the current state
   */
  private createInitialSquares(): GridSquare[] {
    const colorScheme = this.getColorScheme();
    const squares: GridSquare[] = [];

    for (let i = 0; i < 9; i++) {
      squares.push({
        id: i,
        opacity: 1.0,
        scale: 1.0,
        color: colorScheme.primary[i],
        delay: 0
      });
    }

    return squares;
  }

  /**
   * Set up animation queue listeners
   */
  private setupAnimationQueueListeners(): void {
    this.animationQueueService.onAnimationStart((event) => {
      this.currentState = event.type;
      this.isAnimating = true;

      // Notify state listeners
      this.listeners.forEach(listener => {
        try {
          listener(event.type);
        } catch (error) {
          console.warn('Error in avatar state listener:', error);
        }
      });
    });

    this.animationQueueService.onAnimationComplete((event) => {
      this.isAnimating = false;

      // Notify animation complete listeners
      this.animationCompleteListeners.forEach(listener => {
        try {
          listener(event.type);
        } catch (error) {
          console.warn('Error in avatar animation complete listener:', error);
        }
      });
    });

    this.animationQueueService.onAnimationError((error, event) => {
      console.warn('Animation error:', error, 'Event:', event);
      this.isAnimating = false;
    });
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    this.clearQueue();
    this.listeners.clear();
    this.animationCompleteListeners.clear();
    this.squareUpdateListeners.clear();
  }

  /**
   * Start a state transition
   */
  private startStateTransition(newState: AvatarState, customDuration?: number): void {
    if (this.reducedMotion && newState !== 'idle') {
      // In reduced motion mode, just set the state without animation
      this.completeStateTransition(newState);
      return;
    }

    const previousState = this.currentState;
    this.currentState = newState;
    this.isAnimating = true;

    // Notify listeners of state change
    this.listeners.forEach(listener => {
      try {
        listener(newState);
      } catch (error) {
        console.warn('Error in avatar state listener:', error);
      }
    });

    const pattern = ANIMATION_PATTERNS[newState];
    const duration = customDuration || pattern.duration;

    // If the pattern doesn't loop, set a timeout to complete the animation
    if (!pattern.loop) {
      setTimeout(() => {
        this.completeStateTransition(newState);
      }, duration);
    }
  }

  /**
   * Complete a state transition
   */
  private completeStateTransition(state: AvatarState): void {
    this.isAnimating = false;

    // Notify animation complete listeners
    this.animationCompleteListeners.forEach(listener => {
      try {
        listener(state);
      } catch (error) {
        console.warn('Error in avatar animation complete listener:', error);
      }
    });

    // Process next item in queue
    this.processQueue();
  }

  /**
   * Get priority for a given state
   */
  private getStatePriority(state: AvatarState): number {
    const pattern = ANIMATION_PATTERNS[state];
    return pattern.priority;
  }
}

// Singleton instance for global use
let globalAvatarController: LightweightAvatarController | null = null;

/**
 * Get the global avatar controller instance
 */
export function getGlobalAvatarController(): LightweightAvatarController {
  if (!globalAvatarController) {
    globalAvatarController = new LightweightAvatarController();
  }
  return globalAvatarController;
}

/**
 * Reset the global avatar controller (useful for testing)
 */
export function resetGlobalAvatarController(): void {
  if (globalAvatarController) {
    globalAvatarController.destroy();
  }
  globalAvatarController = null;
}