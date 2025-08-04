/**
 * MotionSensitivityManager - Manages motion sensitivity and accessibility features
 * 
 * This class handles user preferences for motion control, implements motion intensity
 * scaling algorithms, and provides minimal motion mode for users with vestibular
 * sensitivity or motion-related accessibility needs.
 * 
 * Requirements addressed:
 * - 5.1: Motion sensitivity settings to reduce movement amplitude and frequency
 * - 5.2: Minimal motion mode with essential movements only
 * - 5.3: Standard motion mode with full deliberate movement patterns
 * - 5.4: Real-time preference changes without restart
 */

import {
  MotionSettings,
  MovementPlan,
  HeadMovement,
  Gesture,
  IdleMovement,
  MovementContext,
  MovementEvent,
  MovementEventType,
  MovementEventListener
} from './types';

export interface MotionSensitivitySettings {
  // Core sensitivity settings
  motionSensitivityEnabled: boolean;
  intensityLevel: 'minimal' | 'reduced' | 'standard' | 'enhanced';
  
  // Granular control
  headMovementIntensity: number; // 0.0 to 1.0
  gestureIntensity: number; // 0.0 to 1.0
  idleAnimationIntensity: number; // 0.0 to 1.0
  
  // Feature toggles
  enableHeadMovements: boolean;
  enableGestures: boolean;
  enableIdleAnimations: boolean;
  enableMicroMovements: boolean;
  
  // Timing controls
  movementFrequencyScale: number; // 0.1 to 2.0
  transitionDurationScale: number; // 0.5 to 2.0
  
  // Accessibility features
  reducedMotionMode: boolean; // Respects prefers-reduced-motion
  vestibularSafeMode: boolean; // Extra conservative settings
  alternativeFeedbackEnabled: boolean; // Use alternative communication methods
}

export interface MotionIntensityProfile {
  name: string;
  description: string;
  settings: MotionSensitivitySettings;
  isDefault: boolean;
}

export interface AlternativeFeedbackOptions {
  useTextEmphasis: boolean;
  useColorChanges: boolean;
  useSubtleHighlights: boolean;
  useSoundCues: boolean;
}

export class MotionSensitivityManager {
  private settings: MotionSensitivitySettings;
  private eventListeners: Map<MovementEventType, MovementEventListener[]> = new Map();
  private alternativeFeedback: AlternativeFeedbackOptions;
  private presetProfiles: Map<string, MotionIntensityProfile> = new Map();
  
  // Performance tracking
  private lastSettingsChange: number = 0;
  private settingsChangeCount: number = 0;

  constructor(initialSettings?: Partial<MotionSensitivitySettings>) {
    this.settings = this.createDefaultSettings();
    
    if (initialSettings) {
      this.updateSettings(initialSettings);
    }

    this.alternativeFeedback = {
      useTextEmphasis: true,
      useColorChanges: true,
      useSubtleHighlights: true,
      useSoundCues: false
    };

    this.initializePresetProfiles();
    this.detectSystemPreferences();
  }

  /**
   * Updates motion sensitivity settings with real-time application
   */
  public updateSettings(newSettings: Partial<MotionSensitivitySettings>): void {
    const oldSettings = { ...this.settings };
    this.settings = { ...this.settings, ...newSettings };
    
    this.lastSettingsChange = Date.now();
    this.settingsChangeCount++;

    // Validate settings
    this.validateSettings();

    // Emit settings change event
    this.emitEvent('settings_changed', {
      oldSettings,
      newSettings: this.settings,
      timestamp: this.lastSettingsChange
    });
  }

  /**
   * Applies motion sensitivity filters to a movement plan
   */
  public applyMotionSensitivityFilter(plan: MovementPlan, context: MovementContext): MovementPlan {
    if (!this.settings.motionSensitivityEnabled) {
      return plan;
    }

    const filteredPlan: MovementPlan = {
      ...plan,
      headMovements: this.filterHeadMovements(plan.headMovements, context),
      gestures: this.filterGestures(plan.gestures, context),
      transitions: plan.transitions.map(transition => ({
        ...transition,
        duration: transition.duration * this.settings.transitionDurationScale
      })),
      duration: plan.duration * this.settings.transitionDurationScale,
      priority: plan.priority
    };

    return filteredPlan;
  }

  /**
   * Applies motion sensitivity to idle movements
   */
  public applyIdleMovementFilter(idleMovements: IdleMovement[]): IdleMovement[] {
    if (!this.settings.enableIdleAnimations || this.settings.reducedMotionMode) {
      return this.getMinimalIdleMovements();
    }

    return idleMovements.map(movement => ({
      ...movement,
      amplitude: movement.amplitude * this.settings.idleAnimationIntensity,
      frequency: movement.frequency * this.settings.movementFrequencyScale
    }));
  }

  /**
   * Gets current motion settings as MotionSettings interface
   */
  public getMotionSettings(): MotionSettings {
    return {
      intensity: this.settings.intensityLevel,
      enableGestures: this.settings.enableGestures,
      enableHeadMovements: this.settings.enableHeadMovements,
      enableIdleAnimations: this.settings.enableIdleAnimations,
      motionSensitivity: this.settings.motionSensitivityEnabled,
      customIntensityScale: this.calculateOverallIntensityScale()
    };
  }

  /**
   * Activates minimal motion mode for maximum accessibility
   */
  public activateMinimalMotionMode(): void {
    this.updateSettings({
      intensityLevel: 'minimal',
      motionSensitivityEnabled: true,
      reducedMotionMode: true,
      vestibularSafeMode: true,
      headMovementIntensity: 0.1,
      gestureIntensity: 0.0,
      idleAnimationIntensity: 0.05,
      enableGestures: false,
      enableMicroMovements: false,
      movementFrequencyScale: 0.3,
      transitionDurationScale: 1.5,
      alternativeFeedbackEnabled: true
    });
  }

  /**
   * Activates standard motion mode with full movement patterns
   */
  public activateStandardMotionMode(): void {
    this.updateSettings({
      intensityLevel: 'standard',
      motionSensitivityEnabled: false,
      reducedMotionMode: false,
      vestibularSafeMode: false,
      headMovementIntensity: 1.0,
      gestureIntensity: 1.0,
      idleAnimationIntensity: 1.0,
      enableGestures: true,
      enableHeadMovements: true,
      enableIdleAnimations: true,
      enableMicroMovements: true,
      movementFrequencyScale: 1.0,
      transitionDurationScale: 1.0,
      alternativeFeedbackEnabled: false
    });
  }

  /**
   * Loads a preset motion profile
   */
  public loadPresetProfile(profileName: string): boolean {
    const profile = this.presetProfiles.get(profileName);
    if (!profile) {
      return false;
    }

    this.updateSettings(profile.settings);
    return true;
  }

  /**
   * Gets available preset profiles
   */
  public getPresetProfiles(): MotionIntensityProfile[] {
    return Array.from(this.presetProfiles.values());
  }

  /**
   * Creates a custom preset profile
   */
  public createCustomProfile(name: string, description: string, settings: MotionSensitivitySettings): void {
    const profile: MotionIntensityProfile = {
      name,
      description,
      settings: { ...settings },
      isDefault: false
    };

    this.presetProfiles.set(name, profile);
  }

  /**
   * Gets alternative feedback options when movements are disabled
   */
  public getAlternativeFeedbackOptions(): AlternativeFeedbackOptions {
    return { ...this.alternativeFeedback };
  }

  /**
   * Updates alternative feedback settings
   */
  public updateAlternativeFeedback(options: Partial<AlternativeFeedbackOptions>): void {
    this.alternativeFeedback = { ...this.alternativeFeedback, ...options };
  }

  /**
   * Checks if movement should be replaced with alternative feedback
   */
  public shouldUseAlternativeFeedback(movementType: 'gesture' | 'head' | 'idle'): boolean {
    if (!this.settings.alternativeFeedbackEnabled) {
      return false;
    }

    switch (movementType) {
      case 'gesture':
        return !this.settings.enableGestures;
      case 'head':
        return !this.settings.enableHeadMovements;
      case 'idle':
        return !this.settings.enableIdleAnimations;
      default:
        return false;
    }
  }

  /**
   * Gets current settings
   */
  public getCurrentSettings(): MotionSensitivitySettings {
    return { ...this.settings };
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

  // Private methods

  private createDefaultSettings(): MotionSensitivitySettings {
    return {
      motionSensitivityEnabled: false,
      intensityLevel: 'standard',
      headMovementIntensity: 1.0,
      gestureIntensity: 1.0,
      idleAnimationIntensity: 1.0,
      enableHeadMovements: true,
      enableGestures: true,
      enableIdleAnimations: true,
      enableMicroMovements: true,
      movementFrequencyScale: 1.0,
      transitionDurationScale: 1.0,
      reducedMotionMode: false,
      vestibularSafeMode: false,
      alternativeFeedbackEnabled: false
    };
  }

  private filterHeadMovements(movements: HeadMovement[], context: MovementContext): HeadMovement[] {
    if (!this.settings.enableHeadMovements) {
      return [];
    }

    if (this.settings.vestibularSafeMode) {
      // Only allow very subtle movements in vestibular safe mode
      return movements
        .filter(movement => movement.type !== 'shake' && movement.type !== 'turn')
        .map(movement => ({
          ...movement,
          intensity: Math.min(movement.intensity * this.settings.headMovementIntensity, 0.2),
          duration: movement.duration * this.settings.transitionDurationScale
        }));
    }

    return movements.map(movement => ({
      ...movement,
      intensity: movement.intensity * this.settings.headMovementIntensity,
      duration: movement.duration * this.settings.transitionDurationScale
    }));
  }

  private filterGestures(gestures: Gesture[], context: MovementContext): Gesture[] {
    if (!this.settings.enableGestures) {
      return [];
    }

    let filteredGestures = gestures;

    // Apply frequency scaling
    if (this.settings.movementFrequencyScale < 1.0) {
      const keepRatio = this.settings.movementFrequencyScale;
      filteredGestures = gestures.filter(() => Math.random() < keepRatio);
    }

    return filteredGestures.map(gesture => ({
      ...gesture,
      intensity: gesture.intensity * this.settings.gestureIntensity,
      duration: gesture.duration * this.settings.transitionDurationScale,
      morphTargets: gesture.morphTargets.map(target => ({
        ...target,
        weight: target.weight * this.settings.gestureIntensity
      }))
    }));
  }

  private getMinimalIdleMovements(): IdleMovement[] {
    // Only essential breathing movement in minimal mode
    return [{
      type: 'breathing',
      amplitude: 0.05,
      frequency: 0.2, // Very slow breathing
      phase: 0
    }];
  }

  private calculateOverallIntensityScale(): number {
    const intensityMap = {
      'minimal': 0.2,
      'reduced': 0.5,
      'standard': 1.0,
      'enhanced': 1.5
    };

    return intensityMap[this.settings.intensityLevel];
  }

  private validateSettings(): void {
    // Clamp values to valid ranges
    this.settings.headMovementIntensity = Math.max(0, Math.min(1, this.settings.headMovementIntensity));
    this.settings.gestureIntensity = Math.max(0, Math.min(1, this.settings.gestureIntensity));
    this.settings.idleAnimationIntensity = Math.max(0, Math.min(1, this.settings.idleAnimationIntensity));
    this.settings.movementFrequencyScale = Math.max(0.1, Math.min(2, this.settings.movementFrequencyScale));
    this.settings.transitionDurationScale = Math.max(0.5, Math.min(2, this.settings.transitionDurationScale));

    // Ensure consistency
    if (this.settings.vestibularSafeMode) {
      this.settings.reducedMotionMode = true;
      this.settings.motionSensitivityEnabled = true;
    }

    if (this.settings.reducedMotionMode) {
      this.settings.motionSensitivityEnabled = true;
    }
  }

  private initializePresetProfiles(): void {
    // Minimal Motion Profile
    this.presetProfiles.set('minimal', {
      name: 'Minimal Motion',
      description: 'Essential movements only, ideal for motion sensitivity',
      isDefault: false,
      settings: {
        ...this.createDefaultSettings(),
        intensityLevel: 'minimal',
        motionSensitivityEnabled: true,
        reducedMotionMode: true,
        headMovementIntensity: 0.1,
        gestureIntensity: 0.0,
        idleAnimationIntensity: 0.05,
        enableGestures: false,
        enableMicroMovements: false,
        movementFrequencyScale: 0.3,
        transitionDurationScale: 1.5,
        alternativeFeedbackEnabled: true
      }
    });

    // Reduced Motion Profile
    this.presetProfiles.set('reduced', {
      name: 'Reduced Motion',
      description: 'Gentle movements with reduced intensity',
      isDefault: false,
      settings: {
        ...this.createDefaultSettings(),
        intensityLevel: 'reduced',
        motionSensitivityEnabled: true,
        headMovementIntensity: 0.4,
        gestureIntensity: 0.3,
        idleAnimationIntensity: 0.2,
        enableMicroMovements: false,
        movementFrequencyScale: 0.6,
        transitionDurationScale: 1.2
      }
    });

    // Standard Profile
    this.presetProfiles.set('standard', {
      name: 'Standard Motion',
      description: 'Full natural movements and gestures',
      isDefault: true,
      settings: this.createDefaultSettings()
    });

    // Vestibular Safe Profile
    this.presetProfiles.set('vestibular-safe', {
      name: 'Vestibular Safe',
      description: 'Extra conservative settings for vestibular disorders',
      isDefault: false,
      settings: {
        ...this.createDefaultSettings(),
        intensityLevel: 'minimal',
        motionSensitivityEnabled: true,
        reducedMotionMode: true,
        vestibularSafeMode: true,
        headMovementIntensity: 0.05,
        gestureIntensity: 0.0,
        idleAnimationIntensity: 0.02,
        enableGestures: false,
        enableMicroMovements: false,
        movementFrequencyScale: 0.2,
        transitionDurationScale: 2.0,
        alternativeFeedbackEnabled: true
      }
    });
  }

  private detectSystemPreferences(): void {
    // Check for prefers-reduced-motion media query
    if (typeof window !== 'undefined' && window.matchMedia) {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
      
      if (prefersReducedMotion.matches) {
        this.updateSettings({
          reducedMotionMode: true,
          motionSensitivityEnabled: true,
          intensityLevel: 'reduced'
        });
      }

      // Listen for changes
      prefersReducedMotion.addEventListener('change', (e) => {
        if (e.matches) {
          this.updateSettings({
            reducedMotionMode: true,
            motionSensitivityEnabled: true,
            intensityLevel: 'reduced'
          });
        }
      });
    }
  }

  private emitEvent(type: MovementEventType, data: any): void {
    const event: MovementEvent = {
      type,
      timestamp: Date.now(),
      data,
      source: 'MotionSensitivityManager'
    };

    const listeners = this.eventListeners.get(type);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(event);
        } catch (error) {
          console.error(`Error in motion sensitivity event listener for ${type}:`, error);
        }
      });
    }
  }
}