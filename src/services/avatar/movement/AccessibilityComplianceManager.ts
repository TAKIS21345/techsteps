/**
 * AccessibilityComplianceManager - Ensures avatar movement system meets accessibility standards
 * 
 * This class implements accessibility compliance features including reduced motion mode
 * for vestibular sensitivity, alternative communication methods when movements are
 * disabled, and user control validation with feedback.
 * 
 * Requirements addressed:
 * - 5.1: Reduced motion mode for vestibular sensitivity
 * - 5.2: Alternative communication methods for disabled movements
 * - 5.3: User control validation and feedback
 * - 5.4: Immediate effect of accessibility changes
 */

import {
  MovementContext,
  MovementEvent,
  MovementEventType,
  MovementEventListener,
  EmphasisData,
  QuestionMarker
} from './types';

import { MotionSensitivityManager, MotionSensitivitySettings } from './MotionSensitivityManager';

export interface AccessibilitySettings {
  // Core accessibility features
  reducedMotionCompliance: boolean; // Respects prefers-reduced-motion
  vestibularSafeMode: boolean; // Extra conservative for vestibular disorders
  seizurePreventionMode: boolean; // Prevents rapid flashing/movement
  
  // Alternative communication methods
  alternativeEmphasis: AlternativeEmphasisConfig;
  alternativeQuestions: AlternativeQuestionConfig;
  alternativeFeedback: AlternativeFeedbackConfig;
  
  // User control and validation
  userControlLevel: 'full' | 'guided' | 'minimal';
  requireConfirmation: boolean;
  provideFeedback: boolean;
  
  // Compliance standards
  wcagLevel: 'A' | 'AA' | 'AAA';
  enableAuditLogging: boolean;
}

export interface AlternativeEmphasisConfig {
  enabled: boolean;
  methods: AlternativeEmphasisMethod[];
  intensity: number; // 0.0 to 1.0
  duration: number; // milliseconds
}

export interface AlternativeQuestionConfig {
  enabled: boolean;
  methods: AlternativeQuestionMethod[];
  visualCues: boolean;
  audioCues: boolean;
}

export interface AlternativeFeedbackConfig {
  enabled: boolean;
  methods: AlternativeFeedbackMethod[];
  responseTime: number; // milliseconds
  persistentIndicators: boolean;
}

export type AlternativeEmphasisMethod = 
  | 'text_highlight'
  | 'color_change'
  | 'size_increase'
  | 'underline'
  | 'bold_text'
  | 'background_highlight'
  | 'border_emphasis';

export type AlternativeQuestionMethod = 
  | 'question_mark_highlight'
  | 'color_shift'
  | 'text_styling'
  | 'icon_display'
  | 'background_change';

export type AlternativeFeedbackMethod = 
  | 'status_text'
  | 'progress_indicator'
  | 'completion_message'
  | 'error_notification'
  | 'success_confirmation';

export interface AccessibilityViolation {
  type: 'motion_too_intense' | 'rapid_movement' | 'missing_alternative' | 'user_control_issue';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  recommendation: string;
  timestamp: number;
}

export interface AccessibilityAuditResult {
  compliant: boolean;
  wcagLevel: 'A' | 'AA' | 'AAA';
  violations: AccessibilityViolation[];
  score: number; // 0.0 to 1.0
  recommendations: string[];
}

export interface UserControlValidation {
  canDisableMotion: boolean;
  canAdjustIntensity: boolean;
  canChooseAlternatives: boolean;
  hasImmediateEffect: boolean;
  providesConfirmation: boolean;
}

export class AccessibilityComplianceManager {
  private settings: AccessibilitySettings;
  private motionSensitivityManager: MotionSensitivityManager;
  private eventListeners: Map<MovementEventType, MovementEventListener[]> = new Map();
  
  // Compliance tracking
  private violations: AccessibilityViolation[] = [];
  private auditHistory: AccessibilityAuditResult[] = [];
  private lastComplianceCheck: number = 0;
  
  // Alternative communication state
  private activeAlternatives: Map<string, any> = new Map();
  private alternativeQueue: Array<{ type: string; data: any; timestamp: number }> = [];
  
  // User preference detection
  private systemPreferences: {
    prefersReducedMotion: boolean;
    highContrast: boolean;
    forcedColors: boolean;
  } = {
    prefersReducedMotion: false,
    highContrast: false,
    forcedColors: false
  };

  constructor(
    motionSensitivityManager: MotionSensitivityManager,
    initialSettings?: Partial<AccessibilitySettings>
  ) {
    this.motionSensitivityManager = motionSensitivityManager;
    this.settings = this.createDefaultSettings();
    
    if (initialSettings) {
      this.updateSettings(initialSettings);
    }

    this.detectSystemPreferences();
    this.setupComplianceMonitoring();
    this.initializeAlternativeMethods();
  }

  /**
   * Updates accessibility settings with immediate effect
   */
  public updateSettings(newSettings: Partial<AccessibilitySettings>): void {
    const oldSettings = { ...this.settings };
    this.settings = { ...this.settings, ...newSettings };
    
    // Validate settings
    this.validateSettings();
    
    // Apply changes immediately
    this.applyAccessibilityChanges();
    
    // Update motion sensitivity manager if needed
    this.syncWithMotionSensitivity();
    
    this.emitEvent('settings_changed', {
      oldSettings,
      newSettings: this.settings,
      immediate: true
    });
  }

  /**
   * Processes movement context and applies alternative communication if needed
   */
  public processMovementContext(context: MovementContext): {
    useAlternatives: boolean;
    alternatives: AlternativeCommunication[];
    originalAllowed: boolean;
  } {
    const useAlternatives = this.shouldUseAlternatives(context);
    const alternatives: AlternativeCommunication[] = [];
    
    if (useAlternatives) {
      // Generate emphasis alternatives
      if (context.emphasisLevel !== 'low') {
        alternatives.push(...this.generateEmphasisAlternatives(context));
      }
      
      // Generate question alternatives
      if (context.isQuestion) {
        alternatives.push(...this.generateQuestionAlternatives(context));
      }
      
      // Generate explanation alternatives
      if (context.isExplanation) {
        alternatives.push(...this.generateExplanationAlternatives(context));
      }
    }
    
    return {
      useAlternatives,
      alternatives,
      originalAllowed: !this.isMovementProhibited(context)
    };
  }

  /**
   * Validates user control capabilities
   */
  public validateUserControl(): UserControlValidation {
    return {
      canDisableMotion: true, // Always allow disabling motion
      canAdjustIntensity: this.settings.userControlLevel !== 'minimal',
      canChooseAlternatives: this.settings.alternativeFeedback.enabled,
      hasImmediateEffect: true, // Our system applies changes immediately
      providesConfirmation: this.settings.provideFeedback
    };
  }

  /**
   * Performs comprehensive accessibility audit
   */
  public performAccessibilityAudit(): AccessibilityAuditResult {
    const violations: AccessibilityViolation[] = [];
    let score = 1.0;
    const recommendations: string[] = [];
    
    // Check motion compliance
    if (!this.settings.reducedMotionCompliance) {
      violations.push({
        type: 'motion_too_intense',
        severity: 'high',
        description: 'System does not respect prefers-reduced-motion',
        recommendation: 'Enable reduced motion compliance',
        timestamp: Date.now()
      });
      score -= 0.3;
    }
    
    // Check alternative methods
    if (!this.settings.alternativeEmphasis.enabled) {
      violations.push({
        type: 'missing_alternative',
        severity: 'medium',
        description: 'No alternative emphasis methods available',
        recommendation: 'Enable alternative emphasis methods',
        timestamp: Date.now()
      });
      score -= 0.2;
    }
    
    // Check user control
    const userControl = this.validateUserControl();
    if (!userControl.canDisableMotion) {
      violations.push({
        type: 'user_control_issue',
        severity: 'critical',
        description: 'Users cannot disable motion',
        recommendation: 'Provide motion disable controls',
        timestamp: Date.now()
      });
      score -= 0.4;
    }
    
    // Determine WCAG compliance level
    let wcagLevel: 'A' | 'AA' | 'AAA' = 'AAA';
    if (violations.some(v => v.severity === 'critical')) {
      wcagLevel = 'A';
    } else if (violations.some(v => v.severity === 'high')) {
      wcagLevel = 'AA';
    }
    
    const result: AccessibilityAuditResult = {
      compliant: violations.length === 0,
      wcagLevel,
      violations,
      score: Math.max(0, score),
      recommendations
    };
    
    this.auditHistory.push(result);
    this.lastComplianceCheck = Date.now();
    
    return result;
  }

  /**
   * Enables vestibular safe mode with maximum safety
   */
  public enableVestibularSafeMode(): void {
    this.updateSettings({
      vestibularSafeMode: true,
      reducedMotionCompliance: true,
      seizurePreventionMode: true,
      alternativeEmphasis: {
        enabled: true,
        methods: ['text_highlight', 'bold_text', 'underline'],
        intensity: 0.8,
        duration: 1000
      },
      alternativeQuestions: {
        enabled: true,
        methods: ['question_mark_highlight', 'text_styling'],
        visualCues: true,
        audioCues: false
      },
      alternativeFeedback: {
        enabled: true,
        methods: ['status_text', 'completion_message'],
        responseTime: 500,
        persistentIndicators: true
      },
      wcagLevel: 'AAA'
    });
    
    // Also update motion sensitivity to most conservative settings
    this.motionSensitivityManager.activateMinimalMotionMode();
  }

  /**
   * Gets current accessibility status
   */
  public getAccessibilityStatus(): {
    compliant: boolean;
    level: 'A' | 'AA' | 'AAA';
    activeFeatures: string[];
    lastAudit: AccessibilityAuditResult | null;
  } {
    const lastAudit = this.auditHistory[this.auditHistory.length - 1] || null;
    
    return {
      compliant: lastAudit?.compliant ?? false,
      level: this.settings.wcagLevel,
      activeFeatures: this.getActiveAccessibilityFeatures(),
      lastAudit
    };
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

  private createDefaultSettings(): AccessibilitySettings {
    return {
      reducedMotionCompliance: true,
      vestibularSafeMode: false,
      seizurePreventionMode: true,
      
      alternativeEmphasis: {
        enabled: true,
        methods: ['text_highlight', 'bold_text'],
        intensity: 0.7,
        duration: 800
      },
      
      alternativeQuestions: {
        enabled: true,
        methods: ['question_mark_highlight', 'color_shift'],
        visualCues: true,
        audioCues: false
      },
      
      alternativeFeedback: {
        enabled: true,
        methods: ['status_text', 'progress_indicator'],
        responseTime: 300,
        persistentIndicators: false
      },
      
      userControlLevel: 'full',
      requireConfirmation: false,
      provideFeedback: true,
      
      wcagLevel: 'AA',
      enableAuditLogging: true
    };
  }

  private detectSystemPreferences(): void {
    if (typeof window !== 'undefined' && window.matchMedia) {
      // Detect prefers-reduced-motion
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
      this.systemPreferences.prefersReducedMotion = prefersReducedMotion.matches;
      
      // Detect high contrast
      const prefersHighContrast = window.matchMedia('(prefers-contrast: high)');
      this.systemPreferences.highContrast = prefersHighContrast.matches;
      
      // Detect forced colors
      const forcedColors = window.matchMedia('(forced-colors: active)');
      this.systemPreferences.forcedColors = forcedColors.matches;
      
      // Listen for changes
      prefersReducedMotion.addEventListener('change', (e) => {
        this.systemPreferences.prefersReducedMotion = e.matches;
        if (e.matches && this.settings.reducedMotionCompliance) {
          this.enableVestibularSafeMode();
        }
      });
      
      prefersHighContrast.addEventListener('change', (e) => {
        this.systemPreferences.highContrast = e.matches;
        this.updateAlternativeMethodsForContrast();
      });
    }
  }

  private setupComplianceMonitoring(): void {
    // Perform initial audit
    setTimeout(() => {
      this.performAccessibilityAudit();
    }, 100);
    
    // Set up periodic compliance checks
    setInterval(() => {
      if (Date.now() - this.lastComplianceCheck > 300000) { // 5 minutes
        this.performAccessibilityAudit();
      }
    }, 60000); // Check every minute
  }

  private initializeAlternativeMethods(): void {
    // Initialize alternative communication methods
    this.activeAlternatives.set('emphasis', new Map());
    this.activeAlternatives.set('questions', new Map());
    this.activeAlternatives.set('feedback', new Map());
  }

  private validateSettings(): void {
    // Ensure intensity is within valid range
    this.settings.alternativeEmphasis.intensity = Math.max(0, Math.min(1, this.settings.alternativeEmphasis.intensity));
    
    // Ensure duration is reasonable
    this.settings.alternativeEmphasis.duration = Math.max(100, Math.min(5000, this.settings.alternativeEmphasis.duration));
    this.settings.alternativeFeedback.responseTime = Math.max(50, Math.min(2000, this.settings.alternativeFeedback.responseTime));
    
    // Ensure at least one alternative method is enabled if alternatives are enabled
    if (this.settings.alternativeEmphasis.enabled && this.settings.alternativeEmphasis.methods.length === 0) {
      this.settings.alternativeEmphasis.methods = ['text_highlight'];
    }
  }

  private applyAccessibilityChanges(): void {
    // Apply changes immediately to the system
    if (this.settings.reducedMotionCompliance && this.systemPreferences.prefersReducedMotion) {
      this.motionSensitivityManager.updateSettings({
        reducedMotionMode: true,
        motionSensitivityEnabled: true
      });
    }
    
    if (this.settings.vestibularSafeMode) {
      this.motionSensitivityManager.updateSettings({
        vestibularSafeMode: true,
        intensityLevel: 'minimal'
      });
    }
  }

  private syncWithMotionSensitivity(): void {
    // Ensure motion sensitivity manager is aligned with accessibility settings
    const motionSettings = this.motionSensitivityManager.getCurrentSettings();
    
    if (this.settings.vestibularSafeMode && !motionSettings.vestibularSafeMode) {
      this.motionSensitivityManager.updateSettings({
        vestibularSafeMode: true
      });
    }
  }

  private shouldUseAlternatives(context: MovementContext): boolean {
    const motionSettings = this.motionSensitivityManager.getCurrentSettings();
    
    return (
      this.settings.alternativeEmphasis.enabled &&
      (motionSettings.reducedMotionMode || 
       !motionSettings.enableGestures || 
       !motionSettings.enableHeadMovements)
    );
  }

  private isMovementProhibited(context: MovementContext): boolean {
    return (
      this.settings.vestibularSafeMode ||
      (this.settings.reducedMotionCompliance && this.systemPreferences.prefersReducedMotion) ||
      this.settings.seizurePreventionMode
    );
  }

  private generateEmphasisAlternatives(context: MovementContext): AlternativeCommunication[] {
    const alternatives: AlternativeCommunication[] = [];
    
    for (const method of this.settings.alternativeEmphasis.methods) {
      alternatives.push({
        type: 'emphasis',
        method,
        intensity: this.settings.alternativeEmphasis.intensity,
        duration: this.settings.alternativeEmphasis.duration,
        target: context.speechContent,
        timestamp: Date.now()
      });
    }
    
    return alternatives;
  }

  private generateQuestionAlternatives(context: MovementContext): AlternativeCommunication[] {
    const alternatives: AlternativeCommunication[] = [];
    
    for (const method of this.settings.alternativeQuestions.methods) {
      alternatives.push({
        type: 'question',
        method,
        intensity: 0.8,
        duration: 1000,
        target: context.speechContent,
        timestamp: Date.now()
      });
    }
    
    return alternatives;
  }

  private generateExplanationAlternatives(context: MovementContext): AlternativeCommunication[] {
    const alternatives: AlternativeCommunication[] = [];
    
    // For explanations, use subtle highlighting
    alternatives.push({
      type: 'explanation',
      method: 'background_highlight',
      intensity: 0.3,
      duration: 2000,
      target: context.speechContent,
      timestamp: Date.now()
    });
    
    return alternatives;
  }

  private getActiveAccessibilityFeatures(): string[] {
    const features: string[] = [];
    
    if (this.settings.reducedMotionCompliance) features.push('Reduced Motion Compliance');
    if (this.settings.vestibularSafeMode) features.push('Vestibular Safe Mode');
    if (this.settings.seizurePreventionMode) features.push('Seizure Prevention');
    if (this.settings.alternativeEmphasis.enabled) features.push('Alternative Emphasis');
    if (this.settings.alternativeQuestions.enabled) features.push('Alternative Questions');
    if (this.settings.alternativeFeedback.enabled) features.push('Alternative Feedback');
    
    return features;
  }

  private updateAlternativeMethodsForContrast(): void {
    if (this.systemPreferences.highContrast) {
      // Adjust alternative methods for high contrast
      this.updateSettings({
        alternativeEmphasis: {
          ...this.settings.alternativeEmphasis,
          methods: ['bold_text', 'underline', 'border_emphasis'],
          intensity: 1.0
        }
      });
    }
  }

  private emitEvent(type: MovementEventType, data: any): void {
    const event: MovementEvent = {
      type,
      timestamp: Date.now(),
      data,
      source: 'AccessibilityComplianceManager'
    };

    const listeners = this.eventListeners.get(type);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(event);
        } catch (error) {
          console.error(`Error in accessibility event listener for ${type}:`, error);
        }
      });
    }
  }
}

// Supporting interfaces
export interface AlternativeCommunication {
  type: 'emphasis' | 'question' | 'explanation' | 'feedback';
  method: string;
  intensity: number;
  duration: number;
  target: string;
  timestamp: number;
}