/**
 * MotionSensitivityManager
 * 
 * Manages motion sensitivity settings and accessibility features for avatar movements.
 * Provides user preference system for motion control, intensity scaling algorithms,
 * and minimal motion mode with essential movements only.
 * 
 * Requirements: 7.1, 7.2, 7.3, 7.4
 */

import { 
  MotionSettings, 
  MovementPlan, 
  HeadMovement, 
  Gesture, 
  IdleMovement,
  MovementEvent,
  MovementEventListener,
  MovementEventType
} from '../movement/types';

// ============================================================================
// Motion Sensitivity Types
// ============================================================================

export interface MotionSensitivitySettings {
  // Core sensitivity settings
  motionSensitivityEnabled: boolean;
  motionIntensityLevel: MotionIntensityLevel;
  reducedMotionMode: boolean;
  
  // Specific movement controls
  enableHeadMovements: boolean;
  enableGestures: boolean;
  enableIdleAnimations: boolean;
  enableTransitions: boolean;
  
  // Intensity scaling factors (0.0 to 1.0)
  headMovementIntensity: number;
  gestureIntensity: number;
  idleAnimationIntensity: number;
  transitionSpeed: number;
  
  // Frequency controls (0.0 to 1.0)
  movementFrequency: number;
  gestureFrequency: number;
  
  // Accessibility preferences
  vestibularSafeMode: boolean;
  respectSystemReducedMotion: boolean;
  alternativeCommunicationEnabled: boolean;
  
  // User customization
  customIntensityScale: number;
  allowOverrides: boolean;
  profileName?: string;
}

export type MotionIntensityLevel = 'none' | 'minimal' | 'reduced' | 'standard' | 'enhanced';

export interface MotionProfile {
  name: string;
  description: string;
  settings: MotionSensitivitySettings;
  isDefault: boolean;
  isSystemProfile: boolean;
}

export interface MotionScalingResult {
  scaledMovementPlan: MovementPlan;
  appliedReductions: MotionReduction[];
  alternativeIndicators: AlternativeIndicator[];
}

export interface MotionReduction {
  type: 'intensity' | 'frequency' | 'duration' | 'disabled';
  originalValue: number;
  scaledValue: number;
  reason: string;
}

export interface AlternativeIndicator {
  type: 'text_emphasis' | 'color_change' | 'size_change' | 'opacity_change';
  target: string;
  value: any;
  duration: number;
}

// ============================================================================
// MotionSensitivityManager Class
// ============================================================================

export class MotionSensitivityManager {
  private settings: MotionSensitivitySettings;
  private profiles: Map<string, MotionProfile>;
  private eventListeners: Map<MovementEventType, MovementEventListener[]>;
  private systemReducedMotionPreference: boolean;
  private isInitialized: boolean = false;

  constructor() {
    this.settings = this.getDefaultSettings();
    this.profiles = new Map();
    this.eventListeners = new Map();
    this.systemReducedMotionPreference = this.detectSystemReducedMotionPreference();
    
    this.initializeDefaultProfiles();
    this.setupSystemPreferenceListener();
  }

  // ============================================================================
  // Initialization and Setup
  // ============================================================================

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Load user preferences from storage
      await this.loadUserPreferences();
      
      // Apply system preferences if enabled
      if (this.settings.respectSystemReducedMotion) {
        this.applySystemReducedMotionPreference();
      }
      
      this.isInitialized = true;
      this.emitEvent('settings_changed', { settings: this.settings });
      
    } catch (error) {
      console.error('Failed to initialize MotionSensitivityManager:', error);
      // Use default settings on error
      this.settings = this.getDefaultSettings();
      this.isInitialized = true;
    }
  }

  private getDefaultSettings(): MotionSensitivitySettings {
    return {
      motionSensitivityEnabled: false,
      motionIntensityLevel: 'standard',
      reducedMotionMode: false,
      
      enableHeadMovements: true,
      enableGestures: true,
      enableIdleAnimations: true,
      enableTransitions: true,
      
      headMovementIntensity: 1.0,
      gestureIntensity: 1.0,
      idleAnimationIntensity: 1.0,
      transitionSpeed: 1.0,
      
      movementFrequency: 1.0,
      gestureFrequency: 1.0,
      
      vestibularSafeMode: false,
      respectSystemReducedMotion: true,
      alternativeCommunicationEnabled: true,
      
      customIntensityScale: 1.0,
      allowOverrides: true
    };
  }

  private initializeDefaultProfiles(): void {
    // Standard profile (default)
    this.profiles.set('standard', {
      name: 'Standard',
      description: 'Full motion with all movements enabled',
      settings: this.getDefaultSettings(),
      isDefault: true,
      isSystemProfile: true
    });

    // Reduced motion profile
    this.profiles.set('reduced', {
      name: 'Reduced Motion',
      description: 'Reduced intensity and frequency of movements',
      settings: {
        ...this.getDefaultSettings(),
        motionSensitivityEnabled: true,
        motionIntensityLevel: 'reduced',
        headMovementIntensity: 0.5,
        gestureIntensity: 0.5,
        idleAnimationIntensity: 0.3,
        movementFrequency: 0.6,
        gestureFrequency: 0.4
      },
      isDefault: false,
      isSystemProfile: true
    });

    // Minimal motion profile
    this.profiles.set('minimal', {
      name: 'Minimal Motion',
      description: 'Essential movements only - lip sync and minimal gestures',
      settings: {
        ...this.getDefaultSettings(),
        motionSensitivityEnabled: true,
        motionIntensityLevel: 'minimal',
        enableGestures: false,
        enableIdleAnimations: false,
        headMovementIntensity: 0.2,
        gestureIntensity: 0.0,
        idleAnimationIntensity: 0.0,
        movementFrequency: 0.2,
        gestureFrequency: 0.0
      },
      isDefault: false,
      isSystemProfile: true
    });

    // No motion profile
    this.profiles.set('none', {
      name: 'No Motion',
      description: 'Lip sync only - all other movements disabled',
      settings: {
        ...this.getDefaultSettings(),
        motionSensitivityEnabled: true,
        motionIntensityLevel: 'none',
        reducedMotionMode: true,
        enableHeadMovements: false,
        enableGestures: false,
        enableIdleAnimations: false,
        enableTransitions: false,
        headMovementIntensity: 0.0,
        gestureIntensity: 0.0,
        idleAnimationIntensity: 0.0,
        transitionSpeed: 0.0,
        movementFrequency: 0.0,
        gestureFrequency: 0.0,
        vestibularSafeMode: true
      },
      isDefault: false,
      isSystemProfile: true
    });
  }

  // ============================================================================
  // Motion Intensity Scaling Algorithms
  // ============================================================================

  public scaleMovementPlan(originalPlan: MovementPlan): MotionScalingResult {
    if (!this.settings.motionSensitivityEnabled) {
      return {
        scaledMovementPlan: originalPlan,
        appliedReductions: [],
        alternativeIndicators: []
      };
    }

    const scaledPlan: MovementPlan = {
      ...originalPlan,
      headMovements: this.scaleHeadMovements(originalPlan.headMovements),
      gestures: this.scaleGestures(originalPlan.gestures),
      transitions: this.scaleTransitions(originalPlan.transitions),
      duration: this.scaleDuration(originalPlan.duration)
    };

    const appliedReductions = this.calculateAppliedReductions(originalPlan, scaledPlan);
    const alternativeIndicators = this.generateAlternativeIndicators(appliedReductions);

    return {
      scaledMovementPlan: scaledPlan,
      appliedReductions,
      alternativeIndicators
    };
  }

  private scaleHeadMovements(movements: HeadMovement[]): HeadMovement[] {
    if (!this.settings.enableHeadMovements) {
      return [];
    }

    return movements
      .filter(movement => this.shouldKeepMovement(movement.type, movement.intensity))
      .map(movement => ({
        ...movement,
        intensity: this.scaleIntensity(movement.intensity, this.settings.headMovementIntensity),
        duration: this.scaleDuration(movement.duration)
      }))
      .filter(movement => movement.intensity > 0.05); // Remove very weak movements
  }

  private scaleGestures(gestures: Gesture[]): Gesture[] {
    if (!this.settings.enableGestures) {
      return [];
    }

    const frequencyScale = this.settings.gestureFrequency;
    const keepCount = Math.ceil(gestures.length * frequencyScale);
    
    return gestures
      .slice(0, keepCount) // Reduce frequency by keeping fewer gestures
      .map(gesture => ({
        ...gesture,
        intensity: this.scaleIntensity(gesture.intensity, this.settings.gestureIntensity),
        duration: this.scaleDuration(gesture.duration)
      }))
      .filter(gesture => gesture.intensity > 0.1); // Remove very weak gestures
  }

  private scaleTransitions(transitions: any[]): any[] {
    if (!this.settings.enableTransitions) {
      return [];
    }

    return transitions.map(transition => ({
      ...transition,
      duration: transition.duration / this.settings.transitionSpeed
    }));
  }

  private scaleIntensity(originalIntensity: number, scaleFactor: number): number {
    const scaled = originalIntensity * scaleFactor * this.settings.customIntensityScale;
    return Math.max(0, Math.min(1, scaled));
  }

  private scaleDuration(originalDuration: number): number {
    // Longer durations for reduced motion to maintain visibility
    const durationScale = this.settings.motionIntensityLevel === 'minimal' ? 1.5 : 1.0;
    return originalDuration * durationScale;
  }

  private shouldKeepMovement(movementType: string, intensity: number): boolean {
    const frequencyThreshold = this.getFrequencyThreshold(movementType);
    return Math.random() < frequencyThreshold && intensity > 0.1;
  }

  private getFrequencyThreshold(movementType: string): number {
    switch (movementType) {
      case 'micro_movement':
        return this.settings.movementFrequency * 0.3;
      case 'nod':
      case 'tilt':
        return this.settings.movementFrequency * 0.7;
      default:
        return this.settings.movementFrequency;
    }
  }

  // ============================================================================
  // Minimal Motion Mode
  // ============================================================================

  public createMinimalMotionPlan(originalPlan: MovementPlan): MovementPlan {
    return {
      headMovements: this.getEssentialHeadMovements(originalPlan.headMovements),
      gestures: [], // No gestures in minimal mode
      transitions: this.getEssentialTransitions(originalPlan.transitions),
      duration: originalPlan.duration,
      priority: originalPlan.priority
    };
  }

  private getEssentialHeadMovements(movements: HeadMovement[]): HeadMovement[] {
    // Only keep essential movements like speech-synchronized nods
    return movements
      .filter(movement => 
        movement.type === 'nod' && 
        movement.intensity > 0.5 && 
        movement.duration < 500 // Short, essential movements only
      )
      .map(movement => ({
        ...movement,
        intensity: Math.min(0.3, movement.intensity), // Very subtle
        duration: Math.min(300, movement.duration) // Quick movements
      }));
  }

  private getEssentialTransitions(transitions: any[]): any[] {
    // Only essential state transitions, no decorative transitions
    return transitions
      .filter(transition => transition.fromState !== transition.toState)
      .map(transition => ({
        ...transition,
        duration: Math.min(200, transition.duration) // Very quick transitions
      }));
  }

  // ============================================================================
  // Alternative Communication Methods
  // ============================================================================

  private generateAlternativeIndicators(reductions: MotionReduction[]): AlternativeIndicator[] {
    if (!this.settings.alternativeCommunicationEnabled) {
      return [];
    }

    const indicators: AlternativeIndicator[] = [];

    for (const reduction of reductions) {
      if (reduction.type === 'disabled' || reduction.scaledValue < 0.2) {
        // Add alternative visual indicators for disabled movements
        indicators.push(...this.createAlternativeForReduction(reduction));
      }
    }

    return indicators;
  }

  private createAlternativeForReduction(reduction: MotionReduction): AlternativeIndicator[] {
    const indicators: AlternativeIndicator[] = [];

    switch (reduction.reason) {
      case 'gesture_disabled':
        indicators.push({
          type: 'text_emphasis',
          target: 'speech_text',
          value: { fontWeight: 'bold', textDecoration: 'underline' },
          duration: 1000
        });
        break;
        
      case 'head_movement_reduced':
        indicators.push({
          type: 'color_change',
          target: 'avatar_outline',
          value: { color: '#4A90E2', opacity: 0.8 },
          duration: 500
        });
        break;
        
      case 'emphasis_disabled':
        indicators.push({
          type: 'size_change',
          target: 'speech_bubble',
          value: { scale: 1.1 },
          duration: 300
        });
        break;
    }

    return indicators;
  }

  // ============================================================================
  // User Preference Management
  // ============================================================================

  public updateSettings(newSettings: Partial<MotionSensitivitySettings>): void {
    const previousSettings = { ...this.settings };
    this.settings = { ...this.settings, ...newSettings };
    
    // Validate settings
    this.validateSettings();
    
    // Save to storage
    this.saveUserPreferences();
    
    // Emit change event
    this.emitEvent('settings_changed', { 
      previousSettings, 
      newSettings: this.settings 
    });
  }

  public getSettings(): MotionSensitivitySettings {
    return { ...this.settings };
  }

  public applyProfile(profileName: string): boolean {
    const profile = this.profiles.get(profileName);
    if (!profile) {
      console.warn(`Motion profile '${profileName}' not found`);
      return false;
    }

    this.updateSettings(profile.settings);
    return true;
  }

  public createCustomProfile(name: string, description: string, settings: MotionSensitivitySettings): void {
    this.profiles.set(name, {
      name,
      description,
      settings: { ...settings },
      isDefault: false,
      isSystemProfile: false
    });
    
    this.saveUserPreferences();
  }

  public getAvailableProfiles(): MotionProfile[] {
    return Array.from(this.profiles.values());
  }

  // ============================================================================
  // System Integration
  // ============================================================================

  private detectSystemReducedMotionPreference(): boolean {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return false;
  }

  private setupSystemPreferenceListener(): void {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      mediaQuery.addEventListener('change', (e) => {
        this.systemReducedMotionPreference = e.matches;
        if (this.settings.respectSystemReducedMotion) {
          this.applySystemReducedMotionPreference();
        }
      });
    }
  }

  private applySystemReducedMotionPreference(): void {
    if (this.systemReducedMotionPreference) {
      this.updateSettings({
        motionSensitivityEnabled: true,
        motionIntensityLevel: 'reduced',
        reducedMotionMode: true,
        vestibularSafeMode: true
      });
    }
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  private calculateAppliedReductions(original: MovementPlan, scaled: MovementPlan): MotionReduction[] {
    const reductions: MotionReduction[] = [];

    // Check head movement reductions
    if (original.headMovements.length > scaled.headMovements.length) {
      reductions.push({
        type: 'frequency',
        originalValue: original.headMovements.length,
        scaledValue: scaled.headMovements.length,
        reason: 'head_movement_reduced'
      });
    }

    // Check gesture reductions
    if (original.gestures.length > scaled.gestures.length) {
      reductions.push({
        type: 'frequency',
        originalValue: original.gestures.length,
        scaledValue: scaled.gestures.length,
        reason: 'gesture_disabled'
      });
    }

    return reductions;
  }

  private validateSettings(): void {
    // Ensure intensity values are within valid range
    this.settings.headMovementIntensity = Math.max(0, Math.min(1, this.settings.headMovementIntensity));
    this.settings.gestureIntensity = Math.max(0, Math.min(1, this.settings.gestureIntensity));
    this.settings.idleAnimationIntensity = Math.max(0, Math.min(1, this.settings.idleAnimationIntensity));
    this.settings.customIntensityScale = Math.max(0, Math.min(2, this.settings.customIntensityScale));
    
    // Ensure frequency values are within valid range
    this.settings.movementFrequency = Math.max(0, Math.min(1, this.settings.movementFrequency));
    this.settings.gestureFrequency = Math.max(0, Math.min(1, this.settings.gestureFrequency));
  }

  private async loadUserPreferences(): Promise<void> {
    try {
      const stored = localStorage.getItem('motionSensitivitySettings');
      if (stored) {
        const parsedSettings = JSON.parse(stored);
        this.settings = { ...this.getDefaultSettings(), ...parsedSettings };
      }
    } catch (error) {
      console.warn('Failed to load motion sensitivity preferences:', error);
    }
  }

  private saveUserPreferences(): void {
    try {
      localStorage.setItem('motionSensitivitySettings', JSON.stringify(this.settings));
    } catch (error) {
      console.warn('Failed to save motion sensitivity preferences:', error);
    }
  }

  // ============================================================================
  // Event System
  // ============================================================================

  public addEventListener(eventType: MovementEventType, listener: MovementEventListener): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    this.eventListeners.get(eventType)!.push(listener);
  }

  public removeEventListener(eventType: MovementEventType, listener: MovementEventListener): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emitEvent(eventType: MovementEventType, data: any): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      const event: MovementEvent = {
        type: eventType,
        timestamp: Date.now(),
        data,
        source: 'MotionSensitivityManager'
      };
      
      listeners.forEach(listener => {
        try {
          listener(event);
        } catch (error) {
          console.error('Error in motion sensitivity event listener:', error);
        }
      });
    }
  }

  // ============================================================================
  // Public API
  // ============================================================================

  public isMotionSensitivityEnabled(): boolean {
    return this.settings.motionSensitivityEnabled;
  }

  public getCurrentIntensityLevel(): MotionIntensityLevel {
    return this.settings.motionIntensityLevel;
  }

  public isReducedMotionMode(): boolean {
    return this.settings.reducedMotionMode || this.systemReducedMotionPreference;
  }

  public canOverrideSettings(): boolean {
    return this.settings.allowOverrides;
  }

  public getSystemReducedMotionPreference(): boolean {
    return this.systemReducedMotionPreference;
  }

  public reset(): void {
    this.settings = this.getDefaultSettings();
    this.saveUserPreferences();
    this.emitEvent('settings_changed', { settings: this.settings });
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const motionSensitivityManager = new MotionSensitivityManager();