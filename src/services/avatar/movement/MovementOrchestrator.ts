/**
 * MovementOrchestrator - Central coordinator for avatar movement system
 * 
 * This class manages the overall movement state, coordinates between different
 * movement components, and provides the main interface for avatar animations.
 * 
 * Requirements addressed:
 * - 1.1: Deliberate head movements corresponding to speech emphasis
 * - 1.3: Smooth transitions between movement patterns
 * - 4.1: Configurable movement parameters for different contexts
 */

import {
  AvatarMovementState,
  MovementPlan,
  MovementContext,
  MovementState,
  MotionSettings,
  CulturalProfile,
  AccentProfile,
  HeadMovement,
  Gesture,
  MorphTargetMapping,
  MovementEvent,
  MovementEventType,
  MovementEventListener,
  PerformanceMetrics
} from './types';

import { TransitionEngine, TransitionResult } from './TransitionEngine';

export interface MovementOrchestrationResult {
  headRotation: { x: number; y: number; z: number };
  morphTargets: MorphTargetMapping[];
  isTransitioning: boolean;
  currentState: MovementState;
}

export class MovementOrchestrator {
  private state: AvatarMovementState;
  private transitionEngine: TransitionEngine;
  private eventListeners: Map<MovementEventType, MovementEventListener[]> = new Map();
  private lastUpdateTime: number = 0;
  private performanceMetrics: PerformanceMetrics = {
    calculationTime: 0,
    memoryUsage: 0,
    frameRate: 60,
    cacheHitRate: 0.95
  };

  constructor(
    initialMotionSettings: MotionSettings,
    culturalProfile: CulturalProfile,
    accentProfile: AccentProfile
  ) {
    this.transitionEngine = new TransitionEngine();
    
    this.state = {
      currentMovement: null,
      isTransitioning: false,
      transitionProgress: 0,
      motionSettings: initialMotionSettings,
      culturalProfile,
      accentProfile,
      lastUpdateTime: Date.now()
    };

    this.setupEventListeners();
  }

  /**
   * Main update loop - call this every frame
   */
  public update(deltaTime: number): MovementOrchestrationResult {
    const startTime = performance.now();
    
    this.lastUpdateTime = Date.now();
    this.state.lastUpdateTime = this.lastUpdateTime;

    // Update active transitions
    const transitionResults = this.transitionEngine.updateTransitions(deltaTime);
    
    // Determine current movement state
    const currentState = this.determineCurrentState();
    
    // Calculate final movement result
    const result = this.calculateMovementResult(transitionResults, currentState);
    
    // Update performance metrics
    this.updatePerformanceMetrics(startTime);
    
    return result;
  }

  /**
   * Initiates a new movement plan
   */
  public executeMovementPlan(plan: MovementPlan, context: MovementContext): void {
    // Apply cultural and motion sensitivity filters
    const filteredPlan = this.applyFilters(plan, context);
    
    // If we have a current movement, create a transition
    if (this.state.currentMovement) {
      this.createTransitionToNewPlan(filteredPlan);
    } else {
      this.state.currentMovement = filteredPlan;
    }

    this.emitEvent('movement_started', {
      plan: filteredPlan,
      context
    });
  }

  /**
   * Changes the movement state (idle, speaking, etc.)
   */
  public changeState(newState: MovementState, context?: MovementContext): void {
    const previousState = this.getCurrentState();
    
    if (previousState !== newState) {
      this.createStateTransition(previousState, newState, context);
      
      this.emitEvent('transition_started', {
        fromState: previousState,
        toState: newState,
        context
      });
    }
  }

  /**
   * Updates motion settings (for accessibility and user preferences)
   */
  public updateMotionSettings(newSettings: Partial<MotionSettings>): void {
    const oldSettings = { ...this.state.motionSettings };
    this.state.motionSettings = { ...this.state.motionSettings, ...newSettings };
    
    // Apply settings to current movement if active
    if (this.state.currentMovement) {
      this.state.currentMovement = this.applyMotionSettings(this.state.currentMovement);
    }

    this.emitEvent('settings_changed', {
      oldSettings,
      newSettings: this.state.motionSettings
    });
  }

  /**
   * Updates cultural profile for gesture adaptation
   */
  public updateCulturalProfile(profile: CulturalProfile): void {
    this.state.culturalProfile = profile;
    
    this.emitEvent('settings_changed', {
      culturalProfile: profile
    });
  }

  /**
   * Updates accent profile for speech-movement coordination
   */
  public updateAccentProfile(profile: AccentProfile): void {
    this.state.accentProfile = profile;
    
    this.emitEvent('language_changed', {
      accentProfile: profile
    });
  }

  /**
   * Gets current movement state
   */
  public getCurrentState(): MovementState {
    if (this.state.isTransitioning) {
      return 'transitioning';
    }
    
    if (this.state.currentMovement) {
      // Determine state based on movement content
      const hasQuestionGestures = this.state.currentMovement.gestures.some(
        g => g.type === 'head_tilt' || g.type === 'eyebrow_raise'
      );
      
      if (hasQuestionGestures) return 'questioning';
      
      const hasEmphasisGestures = this.state.currentMovement.gestures.some(
        g => g.type === 'emphasis'
      );
      
      if (hasEmphasisGestures) return 'emphasizing';
      
      return 'speaking';
    }
    
    return 'idle';
  }

  /**
   * Registers event listener
   */
  public addEventListener(eventType: MovementEventType, listener: MovementEventListener): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    this.eventListeners.get(eventType)!.push(listener);
  }

  /**
   * Removes event listener
   */
  public removeEventListener(eventType: MovementEventType, listener: MovementEventListener): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Gets current performance metrics
   */
  public getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.performanceMetrics };
  }

  /**
   * Stops all current movements and transitions
   */
  public stopAllMovements(): void {
    this.state.currentMovement = null;
    this.state.isTransitioning = false;
    this.state.transitionProgress = 0;
    this.transitionEngine.clearAllTransitions();
    
    this.emitEvent('movement_completed', {
      reason: 'stopped'
    });
  }

  // Private methods

  private setupEventListeners(): void {
    // Set up transition completion callbacks
    this.transitionEngine.onTransitionComplete = (transitionId: string, result: TransitionResult) => {
      this.state.isTransitioning = false;
      this.state.transitionProgress = 0;
      
      this.emitEvent('transition_completed', {
        transitionId,
        result
      });
    };
  }

  private determineCurrentState(): MovementState {
    return this.getCurrentState();
  }

  private calculateMovementResult(
    transitionResults: Map<string, TransitionResult>,
    currentState: MovementState
  ): MovementOrchestrationResult {
    let headRotation = { x: 0, y: 0, z: 0 };
    let morphTargets: MorphTargetMapping[] = [];
    let isTransitioning = false;

    // If we have active transitions, use their results
    if (transitionResults.size > 0) {
      isTransitioning = true;
      
      // Combine results from all active transitions
      for (const [, result] of transitionResults) {
        headRotation.x += result.headRotation.x;
        headRotation.y += result.headRotation.y;
        headRotation.z += result.headRotation.z;
        
        morphTargets.push(...result.morphTargets);
      }
    } else if (this.state.currentMovement) {
      // Use current movement plan
      headRotation = this.calculateHeadRotationFromPlan(this.state.currentMovement);
      morphTargets = this.calculateMorphTargetsFromPlan(this.state.currentMovement);
    }

    return {
      headRotation,
      morphTargets,
      isTransitioning,
      currentState
    };
  }

  private applyFilters(plan: MovementPlan, context: MovementContext): MovementPlan {
    let filteredPlan = { ...plan };

    // Apply motion sensitivity filters
    if (this.state.motionSettings.motionSensitivity) {
      filteredPlan = this.applyMotionSensitivityFilter(filteredPlan);
    }

    // Apply cultural filters
    filteredPlan = this.applyCulturalFilter(filteredPlan, context);

    // Apply motion settings
    filteredPlan = this.applyMotionSettings(filteredPlan);

    return filteredPlan;
  }

  private applyMotionSensitivityFilter(plan: MovementPlan): MovementPlan {
    const intensityScale = this.state.motionSettings.intensity === 'minimal' ? 0.2 :
                          this.state.motionSettings.intensity === 'reduced' ? 0.5 :
                          this.state.motionSettings.intensity === 'standard' ? 1.0 : 1.5;

    return {
      ...plan,
      headMovements: plan.headMovements.map(movement => ({
        ...movement,
        intensity: movement.intensity * intensityScale
      })),
      gestures: plan.gestures.map(gesture => ({
        ...gesture,
        intensity: gesture.intensity * intensityScale
      }))
    };
  }

  private applyCulturalFilter(plan: MovementPlan, context: MovementContext): MovementPlan {
    // Filter out restricted gestures for this culture
    const allowedGestures = plan.gestures.filter(gesture => 
      !this.state.culturalProfile.restrictedGestures.includes(gesture.type)
    );

    return {
      ...plan,
      gestures: allowedGestures
    };
  }

  private applyMotionSettings(plan: MovementPlan): MovementPlan {
    const settings = this.state.motionSettings;
    
    return {
      ...plan,
      headMovements: settings.enableHeadMovements ? plan.headMovements : [],
      gestures: settings.enableGestures ? plan.gestures : [],
      duration: plan.duration,
      priority: plan.priority
    };
  }

  private createTransitionToNewPlan(newPlan: MovementPlan): void {
    const transitionId = `plan_transition_${Date.now()}`;
    const currentState = this.getCurrentState();
    
    // Determine target state based on new plan
    const targetState: MovementState = newPlan.gestures.some(g => g.type === 'emphasis') ? 'emphasizing' : 'speaking';
    
    this.transitionEngine.createTransition(
      transitionId,
      currentState,
      targetState,
      300, // 300ms transition
      'ease_in_out'
    );

    // Set up blend state
    const currentMovements = this.state.currentMovement?.headMovements || [];
    const currentGestures = this.state.currentMovement?.gestures || [];
    
    this.transitionEngine.setupBlendState(
      transitionId,
      currentMovements,
      newPlan.headMovements,
      currentGestures,
      newPlan.gestures
    );

    this.state.isTransitioning = true;
    this.state.currentMovement = newPlan;
  }

  private createStateTransition(fromState: MovementState, toState: MovementState, context?: MovementContext): void {
    const transitionId = `state_transition_${Date.now()}`;
    
    this.transitionEngine.createTransition(
      transitionId,
      fromState,
      toState,
      200, // 200ms state transition
      'ease_in_out'
    );

    this.state.isTransitioning = true;
  }

  private calculateHeadRotationFromPlan(plan: MovementPlan): { x: number; y: number; z: number } {
    let x = 0, y = 0, z = 0;

    plan.headMovements.forEach(movement => {
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
        case 'micro_movement':
          // Subtle random micro-movements
          x += (Math.random() - 0.5) * intensity * 0.05;
          y += (Math.random() - 0.5) * intensity * 0.05;
          z += (Math.random() - 0.5) * intensity * 0.05;
          break;
      }
    });

    return { x, y, z };
  }

  private calculateMorphTargetsFromPlan(plan: MovementPlan): MorphTargetMapping[] {
    const morphTargets: MorphTargetMapping[] = [];

    plan.gestures.forEach(gesture => {
      morphTargets.push(...gesture.morphTargets);
    });

    return morphTargets;
  }

  private updatePerformanceMetrics(startTime: number): void {
    const endTime = performance.now();
    this.performanceMetrics.calculationTime = endTime - startTime;
    
    // Update frame rate (simplified)
    const deltaTime = endTime - startTime;
    this.performanceMetrics.frameRate = deltaTime > 0 ? 1000 / deltaTime : 60;
  }

  private emitEvent(type: MovementEventType, data: any): void {
    const event: MovementEvent = {
      type,
      timestamp: Date.now(),
      data,
      source: 'MovementOrchestrator'
    };

    const listeners = this.eventListeners.get(type);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(event);
        } catch (error) {
          console.error(`Error in movement event listener for ${type}:`, error);
        }
      });
    }
  }
}