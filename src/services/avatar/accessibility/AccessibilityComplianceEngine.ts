/**
 * AccessibilityComplianceEngine
 * 
 * Implements accessibility compliance features including reduced motion mode for vestibular sensitivity,
 * alternative communication methods for disabled movements, and user control validation and feedback.
 * 
 * Requirements: 7.1, 7.2, 7.3, 7.4
 */

import { 
  MovementPlan, 
  HeadMovement, 
  Gesture, 
  MovementEvent,
  MovementEventListener,
  MovementEventType
} from '../movement/types';
import { 
  MotionSensitivitySettings,
  MotionIntensityLevel,
  AlternativeIndicator,
  motionSensitivityManager 
} from './MotionSensitivityManager';

// ============================================================================
// Core Accessibility Types
// ============================================================================

export interface AccessibilitySettings {
  vestibularSafeMode: boolean;
  reducedMotionCompliance: boolean;
  alternativeCommunicationEnabled: boolean;
  userControlValidation: boolean;
  feedbackEnabled: boolean;
  motionThresholds: MotionThresholds;
  communicationMethods: AlternativeCommunicationMethod[];
  controlOverrides: ControlOverride[];
}

export interface MotionThresholds {
  maxHeadMovementVelocity: number;
  maxGestureAmplitude: number;
  maxTransitionSpeed: number;
  maxSimultaneousMovements: number;
  maxContinuousMotionDuration: number;
  minRestPeriodBetweenMotions: number;
}

export interface AlternativeCommunicationMethod {
  type: 'text_emphasis' | 'color_indication' | 'size_variation' | 'speech_emphasis';
  enabled: boolean;
  priority: number;
  configuration: {
    intensity: number;
    duration: number;
    customProperties: Record<string, any>;
  };
  fallbackFor: string[];
}

export interface ControlOverride {
  controlType: string;
  userCanOverride: boolean;
  requiresConfirmation: boolean;
  restrictions: ControlRestriction[];
}

export interface ControlRestriction {
  type: 'safety' | 'compliance' | 'system';
  description: string;
  canBypass: boolean;
}

export interface ValidationResult {
  valid: boolean;
  warnings: string[];
  errors: string[];
  requiresConfirmation: boolean;
}

export interface AccessibilityCheckResult {
  passed: boolean;
  issues: AccessibilityIssue[];
  recommendations: string[];
}

export interface AccessibilityIssue {
  id: string;
  description: string;
  severity: 'error' | 'warning' | 'info';
  suggestedFix?: string;
}

// ============================================================================
// AccessibilityComplianceEngine Class
// ============================================================================

export class AccessibilityComplianceEngine {
  private settings: AccessibilitySettings;
  private eventListeners: Map<string, Function[]> = new Map();
  private isInitialized: boolean = false;

  constructor() {
    this.settings = this.createDefaultSettings();
    this.setupIntegrations();
  }

  // ============================================================================
  // Initialization
  // ============================================================================

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await this.loadSettings();
      this.isInitialized = true;
      this.emitEvent('accessibility_engine_initialized', { settings: this.settings });
    } catch (error) {
      console.error('Failed to initialize AccessibilityComplianceEngine:', error);
      this.settings = this.createDefaultSettings();
      this.isInitialized = true;
    }
  }

  private createDefaultSettings(): AccessibilitySettings {
    return {
      vestibularSafeMode: false,
      reducedMotionCompliance: true,
      alternativeCommunicationEnabled: true,
      userControlValidation: true,
      feedbackEnabled: true,
      motionThresholds: {
        maxHeadMovementVelocity: 45,
        maxGestureAmplitude: 0.8,
        maxTransitionSpeed: 2,
        maxSimultaneousMovements: 2,
        maxContinuousMotionDuration: 3000,
        minRestPeriodBetweenMotions: 500
      },
      communicationMethods: [
        {
          type: 'text_emphasis',
          enabled: true,
          priority: 1,
          configuration: {
            intensity: 0.8,
            duration: 1000,
            customProperties: {
              fontWeight: 'bold',
              color: '#2563eb'
            }
          },
          fallbackFor: ['head_nod', 'emphasis_gesture']
        },
        {
          type: 'color_indication',
          enabled: true,
          priority: 2,
          configuration: {
            intensity: 0.7,
            duration: 800,
            customProperties: {
              backgroundColor: '#dbeafe',
              borderColor: '#3b82f6'
            }
          },
          fallbackFor: ['gesture', 'facial_expression']
        }
      ],
      controlOverrides: [
        {
          controlType: 'motion_intensity',
          userCanOverride: true,
          requiresConfirmation: false,
          restrictions: [
            {
              type: 'safety',
              description: 'Cannot exceed vestibular safety thresholds',
              canBypass: false
            }
          ]
        },
        {
          controlType: 'vestibular_safe_mode',
          userCanOverride: true,
          requiresConfirmation: true,
          restrictions: [
            {
              type: 'safety',
              description: 'Disabling may cause motion sensitivity issues',
              canBypass: true
            }
          ]
        }
      ]
    };
  }

  // ============================================================================
  // Reduced Motion Mode for Vestibular Sensitivity
  // ============================================================================

  public enableVestibularSafeMode(): void {
    this.settings.vestibularSafeMode = true;
    
    // Apply strict motion thresholds
    this.settings.motionThresholds = {
      maxHeadMovementVelocity: 15,
      maxGestureAmplitude: 0.3,
      maxTransitionSpeed: 0.5,
      maxSimultaneousMovements: 1,
      maxContinuousMotionDuration: 1000,
      minRestPeriodBetweenMotions: 1000
    };
    
    // Enable all alternative communication methods
    this.settings.communicationMethods.forEach(method => {
      method.enabled = true;
    });
    
    this.saveSettings();
    this.emitEvent('vestibular_safe_mode_enabled', { thresholds: this.settings.motionThresholds });
  }

  public disableVestibularSafeMode(): void {
    if (!this.canOverrideControl('vestibular_safe_mode')) {
      this.emitEvent('override_denied', { 
        controlType: 'vestibular_safe_mode',
        reason: 'Safety restrictions prevent disabling'
      });
      return;
    }

    this.settings.vestibularSafeMode = false;
    this.settings.motionThresholds = this.createDefaultSettings().motionThresholds;
    
    this.saveSettings();
    this.emitEvent('vestibular_safe_mode_disabled', {});
  }

  public applyReducedMotionCompliance(movementPlan: MovementPlan): MovementPlan {
    if (!this.settings.reducedMotionCompliance && !this.settings.vestibularSafeMode) {
      return movementPlan;
    }

    const compliantPlan: MovementPlan = {
      ...movementPlan,
      headMovements: this.filterMotionForCompliance(movementPlan.headMovements),
      gestures: this.filterGesturesForCompliance(movementPlan.gestures),
      transitions: this.filterTransitionsForCompliance(movementPlan.transitions)
    };

    // Generate alternative communication for filtered movements
    const filteredMovements = this.calculateFilteredMovements(movementPlan, compliantPlan);
    if (filteredMovements.length > 0) {
      this.generateAlternativeCommunication(filteredMovements);
    }

    return compliantPlan;
  }

  private filterMotionForCompliance(movements: HeadMovement[]): HeadMovement[] {
    return movements.filter(movement => {
      const velocity = this.estimateMovementVelocity(movement);
      return velocity <= this.settings.motionThresholds.maxHeadMovementVelocity &&
             movement.intensity <= this.settings.motionThresholds.maxGestureAmplitude &&
             movement.duration <= this.settings.motionThresholds.maxContinuousMotionDuration;
    }).map(movement => ({
      ...movement,
      intensity: Math.min(movement.intensity, this.settings.motionThresholds.maxGestureAmplitude),
      duration: Math.min(movement.duration, this.settings.motionThresholds.maxContinuousMotionDuration)
    }));
  }

  private filterGesturesForCompliance(gestures: Gesture[]): Gesture[] {
    return gestures
      .filter(gesture => gesture.intensity <= this.settings.motionThresholds.maxGestureAmplitude)
      .map(gesture => ({
        ...gesture,
        intensity: Math.min(gesture.intensity, this.settings.motionThresholds.maxGestureAmplitude)
      }));
  }

  private filterTransitionsForCompliance(transitions: any[]): any[] {
    return transitions.slice(0, this.settings.motionThresholds.maxSimultaneousMovements)
      .map(transition => ({
        ...transition,
        duration: Math.max(transition.duration, 1000 / this.settings.motionThresholds.maxTransitionSpeed)
      }));
  }

  private estimateMovementVelocity(movement: HeadMovement): number {
    const baseVelocities = {
      'nod': 30,
      'tilt': 25,
      'turn': 40,
      'shake': 50,
      'micro_movement': 10
    };
    const baseVelocity = baseVelocities[movement.type] || 30;
    return baseVelocity * movement.intensity;
  }

  // ============================================================================
  // Alternative Communication Methods
  // ============================================================================

  public generateAlternativeCommunication(filteredMovements: string[]): AlternativeIndicator[] {
    if (!this.settings.alternativeCommunicationEnabled) {
      return [];
    }

    const alternatives: AlternativeIndicator[] = [];

    for (const movementType of filteredMovements) {
      const methods = this.settings.communicationMethods
        .filter(method => method.enabled && method.fallbackFor.includes(movementType))
        .sort((a, b) => a.priority - b.priority);

      for (const method of methods) {
        const alternative = this.createAlternativeIndicator(method, movementType);
        if (alternative) {
          alternatives.push(alternative);
        }
      }
    }

    this.applyAlternativeIndicators(alternatives);
    return alternatives;
  }

  private createAlternativeIndicator(method: AlternativeCommunicationMethod, movementType: string): AlternativeIndicator | null {
    switch (method.type) {
      case 'text_emphasis':
        return {
          type: 'text_emphasis',
          target: 'speech_text',
          value: method.configuration.customProperties,
          duration: method.configuration.duration
        };

      case 'color_indication':
        return {
          type: 'color_change',
          target: 'avatar_container',
          value: method.configuration.customProperties,
          duration: method.configuration.duration
        };

      case 'speech_emphasis':
        return {
          type: 'text_emphasis',
          target: 'speech_audio',
          value: method.configuration.customProperties,
          duration: method.configuration.duration
        };

      default:
        return null;
    }
  }

  private applyAlternativeIndicators(indicators: AlternativeIndicator[]): void {
    for (const indicator of indicators) {
      this.emitEvent('alternative_indicator_applied', { indicator });
    }
  }

  // ============================================================================
  // User Control Validation and Feedback
  // ============================================================================

  public validateUserControl(controlType: string, newValue: any): ValidationResult {
    const override = this.settings.controlOverrides.find(o => o.controlType === controlType);
    
    if (!override) {
      return {
        valid: true,
        warnings: [],
        errors: [],
        requiresConfirmation: false
      };
    }

    const result: ValidationResult = {
      valid: true,
      warnings: [],
      errors: [],
      requiresConfirmation: override.requiresConfirmation
    };

    if (!override.userCanOverride) {
      result.valid = false;
      result.errors.push(`Control '${controlType}' cannot be overridden by user`);
      return result;
    }

    // Check restrictions
    for (const restriction of override.restrictions) {
      const restrictionResult = this.checkRestriction(restriction, controlType, newValue);
      
      if (!restrictionResult.passed) {
        if (restriction.canBypass) {
          result.warnings.push(restrictionResult.message);
        } else {
          result.valid = false;
          result.errors.push(restrictionResult.message);
        }
      }
    }

    return result;
  }

  private checkRestriction(restriction: ControlRestriction, controlType: string, newValue: any): { passed: boolean; message: string } {
    switch (restriction.type) {
      case 'safety':
        if (controlType === 'motion_intensity' && newValue > 1.0 && this.settings.vestibularSafeMode) {
          return {
            passed: false,
            message: 'Cannot increase motion intensity above safe levels when vestibular safe mode is enabled'
          };
        }
        if (controlType === 'vestibular_safe_mode' && newValue === false) {
          return {
            passed: false,
            message: 'Disabling vestibular safe mode may cause motion sensitivity issues'
          };
        }
        break;
    }
    return { passed: true, message: '' };
  }

  public applyUserControl(controlType: string, newValue: any): { success: boolean; errors: string[]; warnings: string[] } {
    const validation = this.validateUserControl(controlType, newValue);
    
    if (!validation.valid) {
      return {
        success: false,
        errors: validation.errors,
        warnings: validation.warnings
      };
    }

    try {
      this.applyControlChange(controlType, newValue);
      this.provideFeedback(controlType, newValue, validation.warnings);

      return {
        success: true,
        errors: [],
        warnings: validation.warnings
      };
    } catch (error) {
      return {
        success: false,
        errors: [`Failed to apply control change: ${error}`],
        warnings: []
      };
    }
  }

  private applyControlChange(controlType: string, newValue: any): void {
    switch (controlType) {
      case 'motion_intensity':
        motionSensitivityManager.updateSettings({ customIntensityScale: newValue });
        break;
      case 'vestibular_safe_mode':
        if (newValue) {
          this.enableVestibularSafeMode();
        } else {
          this.disableVestibularSafeMode();
        }
        break;
      case 'alternative_communication':
        this.settings.alternativeCommunicationEnabled = newValue;
        break;
      default:
        throw new Error(`Unknown control type: ${controlType}`);
    }
  }

  private provideFeedback(controlType: string, newValue: any, warnings: string[]): void {
    if (!this.settings.feedbackEnabled) return;

    this.emitEvent('user_feedback_provided', {
      controlType,
      newValue,
      warnings,
      timestamp: Date.now()
    });
  }

  // ============================================================================
  // Accessibility Compliance Checking
  // ============================================================================

  public runAccessibilityCheck(movementPlan: MovementPlan): AccessibilityCheckResult {
    const issues: AccessibilityIssue[] = [];
    const recommendations: string[] = [];

    // Check motion velocity
    for (const movement of movementPlan.headMovements) {
      const velocity = this.estimateMovementVelocity(movement);
      
      if (velocity > this.settings.motionThresholds.maxHeadMovementVelocity) {
        issues.push({
          id: 'excessive_motion_velocity',
          description: `Head movement velocity (${velocity.toFixed(1)}°/s) exceeds safe threshold`,
          severity: 'error',
          suggestedFix: 'Reduce movement intensity or increase duration'
        });
      }
    }

    // Check alternative communication
    if (!this.settings.alternativeCommunicationEnabled) {
      issues.push({
        id: 'alternative_communication_disabled',
        description: 'Alternative communication methods are disabled',
        severity: 'error',
        suggestedFix: 'Enable alternative communication methods'
      });
    }

    // Check user controls
    const overridableControls = this.settings.controlOverrides.filter(c => c.userCanOverride);
    if (overridableControls.length === 0) {
      issues.push({
        id: 'no_user_overrides',
        description: 'No controls can be overridden by users',
        severity: 'warning',
        suggestedFix: 'Allow user override for non-critical controls'
      });
    }

    if (issues.length > 0) {
      recommendations.push('Consider enabling vestibular safe mode to automatically limit motion');
      recommendations.push('Enable text emphasis as a reliable alternative communication method');
    }

    return {
      passed: issues.filter(issue => issue.severity === 'error').length === 0,
      issues,
      recommendations
    };
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  private calculateFilteredMovements(original: MovementPlan, filtered: MovementPlan): string[] {
    const filteredTypes: string[] = [];
    
    if (original.headMovements.length > filtered.headMovements.length) {
      filteredTypes.push('head_movement');
    }
    
    if (original.gestures.length > filtered.gestures.length) {
      filteredTypes.push('gesture');
    }
    
    if (original.transitions.length > filtered.transitions.length) {
      filteredTypes.push('transition');
    }
    
    return filteredTypes;
  }

  private canOverrideControl(controlType: string): boolean {
    const override = this.settings.controlOverrides.find(o => o.controlType === controlType);
    return override ? override.userCanOverride : false;
  }

  private setupIntegrations(): void {
    motionSensitivityManager.addEventListener('settings_changed', (event: MovementEvent) => {
      this.handleMotionSensitivityChange(event.data.newSettings);
    });
  }

  private handleMotionSensitivityChange(settings: MotionSensitivitySettings): void {
    if (settings.vestibularSafeMode && !this.settings.vestibularSafeMode) {
      this.enableVestibularSafeMode();
    }
    this.emitEvent('motion_sensitivity_integration_updated', { settings });
  }

  // ============================================================================
  // Storage and Event System
  // ============================================================================

  private async loadSettings(): Promise<void> {
    try {
      const stored = localStorage.getItem('accessibilitySettings');
      if (stored) {
        const parsedSettings = JSON.parse(stored);
        this.settings = { ...this.settings, ...parsedSettings };
      }
    } catch (error) {
      console.warn('Failed to load accessibility settings:', error);
    }
  }

  private saveSettings(): void {
    try {
      localStorage.setItem('accessibilitySettings', JSON.stringify(this.settings));
    } catch (error) {
      console.warn('Failed to save accessibility settings:', error);
    }
  }

  public addEventListener(eventType: string, listener: Function): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    this.eventListeners.get(eventType)!.push(listener);
  }

  private emitEvent(eventType: string, data: any): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error(`Error in accessibility event listener for ${eventType}:`, error);
        }
      });
    }
  }

  // ============================================================================
  // Public API
  // ============================================================================

  public getSettings(): AccessibilitySettings {
    return JSON.parse(JSON.stringify(this.settings));
  }

  public updateSettings(updates: Partial<AccessibilitySettings>): void {
    this.settings = { ...this.settings, ...updates };
    this.saveSettings();
    this.emitEvent('accessibility_settings_updated', { updates });
  }

  public isVestibularSafeModeEnabled(): boolean {
    return this.settings.vestibularSafeMode;
  }

  public reset(): void {
    this.settings = this.createDefaultSettings();
    this.saveSettings();
    this.emitEvent('accessibility_engine_reset', {});
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const accessibilityComplianceEngine = new AccessibilityComplianceEngine();