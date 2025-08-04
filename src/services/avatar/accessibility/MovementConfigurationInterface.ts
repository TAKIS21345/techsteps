/**
 * MovementConfigurationInterface
 * 
 * Provides configuration interface for movement intensity and frequency,
 * implements context-specific movement profiles, and handles real-time preference changes.
 * 
 * Requirements: 6.1, 6.2, 7.4
 */

import { 
  MotionSettings, 
  MovementContext,
  CulturalProfile,
  AccentProfile,
  MovementEvent,
  MovementEventListener,
  MovementEventType
} from '../movement/types';
import { 
  MotionSensitivitySettings, 
  MotionIntensityLevel,
  MotionProfile,
  motionSensitivityManager 
} from './MotionSensitivityManager';

// ============================================================================
// Configuration Types
// ============================================================================

export interface MovementConfiguration {
  // Core movement parameters
  intensity: MovementIntensityConfig;
  frequency: MovementFrequencyConfig;
  
  // Context-specific profiles
  contextProfiles: Map<string, ContextMovementProfile>;
  
  // Cultural and language settings
  culturalSettings: CulturalMovementConfig;
  languageSettings: LanguageMovementConfig;
  
  // Real-time adjustment settings
  realTimeAdjustments: RealTimeAdjustmentConfig;
  
  // User preferences
  userPreferences: UserMovementPreferences;
}

export interface MovementIntensityConfig {
  // Global intensity multiplier (0.0 to 2.0)
  globalIntensity: number;
  
  // Component-specific intensities (0.0 to 1.0)
  headMovementIntensity: number;
  gestureIntensity: number;
  facialExpressionIntensity: number;
  idleAnimationIntensity: number;
  transitionIntensity: number;
  
  // Adaptive intensity settings
  adaptToContent: boolean;
  adaptToCulture: boolean;
  adaptToContext: boolean;
  
  // Intensity curves for different scenarios
  intensityCurves: Map<string, IntensityCurve>;
}

export interface MovementFrequencyConfig {
  // Global frequency multiplier (0.0 to 2.0)
  globalFrequency: number;
  
  // Component-specific frequencies (0.0 to 1.0)
  headMovementFrequency: number;
  gestureFrequency: number;
  facialExpressionFrequency: number;
  idleAnimationFrequency: number;
  
  // Frequency adaptation settings
  adaptToSpeechPace: boolean;
  adaptToContentLength: boolean;
  adaptToUserEngagement: boolean;
  
  // Frequency patterns for different contexts
  frequencyPatterns: Map<string, FrequencyPattern>;
}

export interface ContextMovementProfile {
  name: string;
  description: string;
  contextType: MovementContextType;
  
  // Movement parameters for this context
  intensityModifiers: Record<string, number>;
  frequencyModifiers: Record<string, number>;
  enabledMovements: string[];
  disabledMovements: string[];
  
  // Transition settings
  transitionInDuration: number;
  transitionOutDuration: number;
  
  // Priority and conditions
  priority: number;
  activationConditions: ContextCondition[];
  
  // Cultural adaptations
  culturalAdaptations: Map<string, ContextCulturalAdaptation>;
}

export type MovementContextType = 
  | 'formal_presentation'
  | 'casual_conversation' 
  | 'educational_content'
  | 'entertainment'
  | 'accessibility_focused'
  | 'cultural_sensitive'
  | 'quiet_environment'
  | 'high_engagement'
  | 'low_engagement'
  | 'error_state'
  | 'celebration'
  | 'empathy_required';

export interface ContextCondition {
  type: 'content_type' | 'user_preference' | 'environment' | 'time_based' | 'engagement_level';
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'in_range';
  value: any;
  weight: number; // 0.0 to 1.0 - how much this condition influences activation
}

export interface ContextCulturalAdaptation {
  culturalContext: string;
  intensityAdjustment: number;
  frequencyAdjustment: number;
  gestureReplacements: Map<string, string>;
  restrictedMovements: string[];
}

export interface CulturalMovementConfig {
  enableCulturalAdaptation: boolean;
  defaultCulturalProfile: string;
  culturalProfiles: Map<string, CulturalProfile>;
  
  // Cultural sensitivity settings
  respectCulturalNorms: boolean;
  avoidOffensiveGestures: boolean;
  adaptGestureIntensity: boolean;
  
  // Regional preferences
  regionalGesturePreferences: Map<string, RegionalGesturePreference>;
}

export interface RegionalGesturePreference {
  region: string;
  preferredGestures: string[];
  avoidedGestures: string[];
  intensityModifier: number;
  frequencyModifier: number;
}

export interface LanguageMovementConfig {
  enableLanguageAdaptation: boolean;
  languageProfiles: Map<string, AccentProfile>;
  
  // Language-specific movement patterns
  headMovementStyles: Map<string, HeadMovementStyle>;
  gestureStyles: Map<string, GestureStyle>;
  
  // Accent-based adjustments
  accentIntensityModifiers: Map<string, number>;
  accentFrequencyModifiers: Map<string, number>;
}

export interface HeadMovementStyle {
  language: string;
  nodFrequency: number;
  tiltTendency: number;
  emphasisStyle: 'subtle' | 'moderate' | 'expressive';
  questioningStyle: 'head_tilt' | 'eyebrow_raise' | 'forward_lean';
}

export interface GestureStyle {
  language: string;
  handGestureFrequency: number;
  facialExpressionIntensity: number;
  personalSpaceRespect: number;
  eyeContactPattern: string;
}

export interface RealTimeAdjustmentConfig {
  enableRealTimeAdjustments: boolean;
  adjustmentSensitivity: number; // 0.0 to 1.0
  
  // Adjustment triggers
  contentAnalysisAdjustments: boolean;
  userEngagementAdjustments: boolean;
  environmentalAdjustments: boolean;
  performanceAdjustments: boolean;
  
  // Adjustment limits
  maxIntensityChange: number; // Maximum change per adjustment
  maxFrequencyChange: number;
  adjustmentCooldown: number; // Milliseconds between adjustments
  
  // Smoothing settings
  adjustmentSmoothing: boolean;
  smoothingFactor: number; // 0.0 to 1.0
}

export interface UserMovementPreferences {
  // Personal preferences
  preferredIntensityLevel: MotionIntensityLevel;
  preferredMovementTypes: string[];
  dislikedMovementTypes: string[];
  
  // Accessibility preferences
  motionSensitivity: boolean;
  vestibularSensitivity: boolean;
  attentionSensitivity: boolean;
  
  // Customization preferences
  allowSystemOverrides: boolean;
  allowContextualAdjustments: boolean;
  allowCulturalAdaptations: boolean;
  
  // Learning preferences
  learnFromInteractions: boolean;
  adaptToUsagePatterns: boolean;
  personalizeOverTime: boolean;
}

export interface IntensityCurve {
  name: string;
  points: IntensityPoint[];
  interpolation: 'linear' | 'smooth' | 'stepped';
}

export interface IntensityPoint {
  time: number; // 0.0 to 1.0 (normalized time)
  intensity: number; // 0.0 to 1.0
}

export interface FrequencyPattern {
  name: string;
  baseFrequency: number;
  variations: FrequencyVariation[];
  adaptToContent: boolean;
}

export interface FrequencyVariation {
  condition: string;
  frequencyMultiplier: number;
  duration: number; // milliseconds
}

// ============================================================================
// MovementConfigurationInterface Class
// ============================================================================

export class MovementConfigurationInterface {
  private configuration: MovementConfiguration;
  private activeContextProfile: ContextMovementProfile | null = null;
  private eventListeners: Map<string, Function[]> = new Map();
  private adjustmentHistory: AdjustmentHistoryEntry[] = [];
  private lastAdjustmentTime: number = 0;
  private isInitialized: boolean = false;

  constructor() {
    this.configuration = this.createDefaultConfiguration();
    this.setupMotionSensitivityIntegration();
  }

  // ============================================================================
  // Initialization
  // ============================================================================

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Load saved configuration
      await this.loadConfiguration();
      
      // Initialize default context profiles
      this.initializeContextProfiles();
      
      // Initialize cultural and language profiles
      this.initializeCulturalProfiles();
      this.initializeLanguageProfiles();
      
      // Setup real-time adjustment monitoring
      if (this.configuration.realTimeAdjustments.enableRealTimeAdjustments) {
        this.setupRealTimeAdjustments();
      }
      
      this.isInitialized = true;
      this.emitEvent('configuration_initialized', { configuration: this.configuration });
      
    } catch (error) {
      console.error('Failed to initialize MovementConfigurationInterface:', error);
      this.configuration = this.createDefaultConfiguration();
      this.isInitialized = true;
    }
  }

  private createDefaultConfiguration(): MovementConfiguration {
    return {
      intensity: {
        globalIntensity: 1.0,
        headMovementIntensity: 1.0,
        gestureIntensity: 1.0,
        facialExpressionIntensity: 1.0,
        idleAnimationIntensity: 1.0,
        transitionIntensity: 1.0,
        adaptToContent: true,
        adaptToCulture: true,
        adaptToContext: true,
        intensityCurves: new Map()
      },
      frequency: {
        globalFrequency: 1.0,
        headMovementFrequency: 1.0,
        gestureFrequency: 1.0,
        facialExpressionFrequency: 1.0,
        idleAnimationFrequency: 1.0,
        adaptToSpeechPace: true,
        adaptToContentLength: true,
        adaptToUserEngagement: true,
        frequencyPatterns: new Map()
      },
      contextProfiles: new Map(),
      culturalSettings: {
        enableCulturalAdaptation: true,
        defaultCulturalProfile: 'western',
        culturalProfiles: new Map(),
        respectCulturalNorms: true,
        avoidOffensiveGestures: true,
        adaptGestureIntensity: true,
        regionalGesturePreferences: new Map()
      },
      languageSettings: {
        enableLanguageAdaptation: true,
        languageProfiles: new Map(),
        headMovementStyles: new Map(),
        gestureStyles: new Map(),
        accentIntensityModifiers: new Map(),
        accentFrequencyModifiers: new Map()
      },
      realTimeAdjustments: {
        enableRealTimeAdjustments: true,
        adjustmentSensitivity: 0.5,
        contentAnalysisAdjustments: true,
        userEngagementAdjustments: true,
        environmentalAdjustments: false,
        performanceAdjustments: true,
        maxIntensityChange: 0.2,
        maxFrequencyChange: 0.2,
        adjustmentCooldown: 1000,
        adjustmentSmoothing: true,
        smoothingFactor: 0.3
      },
      userPreferences: {
        preferredIntensityLevel: 'standard',
        preferredMovementTypes: ['head_nod', 'gesture', 'facial_expression'],
        dislikedMovementTypes: [],
        motionSensitivity: false,
        vestibularSensitivity: false,
        attentionSensitivity: false,
        allowSystemOverrides: true,
        allowContextualAdjustments: true,
        allowCulturalAdaptations: true,
        learnFromInteractions: true,
        adaptToUsagePatterns: true,
        personalizeOverTime: true
      }
    };
  }

  // ============================================================================
  // Context-Specific Movement Profiles
  // ============================================================================

  private initializeContextProfiles(): void {
    // Formal presentation profile
    this.configuration.contextProfiles.set('formal_presentation', {
      name: 'Formal Presentation',
      description: 'Professional, controlled movements for formal settings',
      contextType: 'formal_presentation',
      intensityModifiers: {
        headMovement: 0.7,
        gesture: 0.6,
        facialExpression: 0.8,
        idleAnimation: 0.3
      },
      frequencyModifiers: {
        headMovement: 0.6,
        gesture: 0.5,
        facialExpression: 0.7,
        idleAnimation: 0.2
      },
      enabledMovements: ['head_nod', 'subtle_gesture', 'professional_expression'],
      disabledMovements: ['casual_gesture', 'playful_expression'],
      transitionInDuration: 1000,
      transitionOutDuration: 800,
      priority: 8,
      activationConditions: [
        {
          type: 'content_type',
          operator: 'contains',
          value: ['presentation', 'formal', 'business'],
          weight: 0.8
        }
      ],
      culturalAdaptations: new Map()
    });

    // Casual conversation profile
    this.configuration.contextProfiles.set('casual_conversation', {
      name: 'Casual Conversation',
      description: 'Natural, relaxed movements for informal interactions',
      contextType: 'casual_conversation',
      intensityModifiers: {
        headMovement: 1.0,
        gesture: 1.2,
        facialExpression: 1.1,
        idleAnimation: 0.8
      },
      frequencyModifiers: {
        headMovement: 1.0,
        gesture: 1.1,
        facialExpression: 1.0,
        idleAnimation: 0.9
      },
      enabledMovements: ['head_nod', 'head_tilt', 'casual_gesture', 'expressive_face'],
      disabledMovements: ['formal_gesture'],
      transitionInDuration: 500,
      transitionOutDuration: 500,
      priority: 5,
      activationConditions: [
        {
          type: 'content_type',
          operator: 'contains',
          value: ['casual', 'friendly', 'chat'],
          weight: 0.7
        }
      ],
      culturalAdaptations: new Map()
    });

    // Educational content profile
    this.configuration.contextProfiles.set('educational_content', {
      name: 'Educational Content',
      description: 'Clear, instructional movements for learning contexts',
      contextType: 'educational_content',
      intensityModifiers: {
        headMovement: 0.9,
        gesture: 1.0,
        facialExpression: 0.9,
        idleAnimation: 0.4
      },
      frequencyModifiers: {
        headMovement: 0.8,
        gesture: 0.9,
        facialExpression: 0.8,
        idleAnimation: 0.3
      },
      enabledMovements: ['explanatory_gesture', 'confirmation_nod', 'focused_expression'],
      disabledMovements: ['distracting_movement'],
      transitionInDuration: 700,
      transitionOutDuration: 700,
      priority: 7,
      activationConditions: [
        {
          type: 'content_type',
          operator: 'contains',
          value: ['learn', 'explain', 'teach', 'instruction'],
          weight: 0.9
        }
      ],
      culturalAdaptations: new Map()
    });

    // Accessibility focused profile
    this.configuration.contextProfiles.set('accessibility_focused', {
      name: 'Accessibility Focused',
      description: 'Minimal, essential movements for accessibility needs',
      contextType: 'accessibility_focused',
      intensityModifiers: {
        headMovement: 0.3,
        gesture: 0.2,
        facialExpression: 0.5,
        idleAnimation: 0.1
      },
      frequencyModifiers: {
        headMovement: 0.2,
        gesture: 0.1,
        facialExpression: 0.3,
        idleAnimation: 0.1
      },
      enabledMovements: ['essential_nod', 'lip_sync'],
      disabledMovements: ['decorative_movement', 'idle_animation'],
      transitionInDuration: 200,
      transitionOutDuration: 200,
      priority: 10,
      activationConditions: [
        {
          type: 'user_preference',
          operator: 'equals',
          value: 'accessibility_mode',
          weight: 1.0
        }
      ],
      culturalAdaptations: new Map()
    });
  }

  public activateContextProfile(contextType: MovementContextType, context?: MovementContext): boolean {
    const profile = this.configuration.contextProfiles.get(contextType);
    if (!profile) {
      console.warn(`Context profile '${contextType}' not found`);
      return false;
    }

    // Check activation conditions
    if (!this.checkActivationConditions(profile, context)) {
      return false;
    }

    // Transition from current profile
    if (this.activeContextProfile) {
      this.transitionFromProfile(this.activeContextProfile, profile);
    } else {
      this.transitionToProfile(profile);
    }

    this.activeContextProfile = profile;
    this.emitEvent('context_profile_activated', { profile, context });
    
    return true;
  }

  private checkActivationConditions(profile: ContextMovementProfile, context?: MovementContext): boolean {
    if (!context || profile.activationConditions.length === 0) {
      return true;
    }

    let totalWeight = 0;
    let satisfiedWeight = 0;

    for (const condition of profile.activationConditions) {
      totalWeight += condition.weight;
      
      if (this.evaluateCondition(condition, context)) {
        satisfiedWeight += condition.weight;
      }
    }

    return satisfiedWeight / totalWeight >= 0.5; // 50% threshold
  }

  private evaluateCondition(condition: ContextCondition, context: MovementContext): boolean {
    switch (condition.type) {
      case 'content_type':
        return this.evaluateContentCondition(condition, context);
      case 'user_preference':
        return this.evaluateUserPreferenceCondition(condition);
      case 'environment':
        return this.evaluateEnvironmentCondition(condition);
      default:
        return false;
    }
  }

  private evaluateContentCondition(condition: ContextCondition, context: MovementContext): boolean {
    const searchTerms = Array.isArray(condition.value) ? condition.value : [condition.value];
    const content = context.speechContent.toLowerCase();
    
    switch (condition.operator) {
      case 'contains':
        return searchTerms.some(term => content.includes(term.toLowerCase()));
      case 'equals':
        return searchTerms.some(term => content === term.toLowerCase());
      default:
        return false;
    }
  }

  private evaluateUserPreferenceCondition(condition: ContextCondition): boolean {
    // Check against user preferences
    return this.configuration.userPreferences.allowContextualAdjustments;
  }

  private evaluateEnvironmentCondition(condition: ContextCondition): boolean {
    // Placeholder for environment-based conditions
    return true;
  }

  // ============================================================================
  // Real-Time Preference Change Handling
  // ============================================================================

  private setupRealTimeAdjustments(): void {
    // Monitor content changes
    if (this.configuration.realTimeAdjustments.contentAnalysisAdjustments) {
      this.setupContentAnalysisMonitoring();
    }

    // Monitor user engagement
    if (this.configuration.realTimeAdjustments.userEngagementAdjustments) {
      this.setupUserEngagementMonitoring();
    }

    // Monitor performance
    if (this.configuration.realTimeAdjustments.performanceAdjustments) {
      this.setupPerformanceMonitoring();
    }
  }

  private setupContentAnalysisMonitoring(): void {
    // This would integrate with content analysis systems
    // For now, we'll set up a placeholder that can be extended
    this.addEventListener('content_analyzed', (data: any) => {
      this.handleContentAnalysisAdjustment(data);
    });
  }

  private setupUserEngagementMonitoring(): void {
    // Monitor user engagement metrics
    this.addEventListener('engagement_changed', (data: any) => {
      this.handleEngagementAdjustment(data);
    });
  }

  private setupPerformanceMonitoring(): void {
    // Monitor system performance
    this.addEventListener('performance_metrics', (data: any) => {
      this.handlePerformanceAdjustment(data);
    });
  }

  private handleContentAnalysisAdjustment(data: any): void {
    if (!this.canMakeAdjustment()) return;

    const adjustments: Partial<MovementIntensityConfig> = {};

    // Adjust based on content sentiment
    if (data.sentiment === 'positive') {
      adjustments.gestureIntensity = Math.min(1.0, 
        this.configuration.intensity.gestureIntensity + 0.1);
      adjustments.facialExpressionIntensity = Math.min(1.0, 
        this.configuration.intensity.facialExpressionIntensity + 0.1);
    } else if (data.sentiment === 'negative') {
      adjustments.gestureIntensity = Math.max(0.3, 
        this.configuration.intensity.gestureIntensity - 0.1);
    }

    // Adjust based on content complexity
    if (data.complexity === 'high') {
      adjustments.headMovementFrequency = Math.max(0.5, 
        this.configuration.frequency.headMovementFrequency - 0.1);
    }

    this.applyRealTimeAdjustments(adjustments, 'content_analysis');
  }

  private handleEngagementAdjustment(data: any): void {
    if (!this.canMakeAdjustment()) return;

    const adjustments: Partial<MovementIntensityConfig> = {};

    if (data.engagement < 0.3) {
      // Low engagement - increase movement to attract attention
      adjustments.gestureIntensity = Math.min(1.0, 
        this.configuration.intensity.gestureIntensity + 0.15);
      adjustments.facialExpressionIntensity = Math.min(1.0, 
        this.configuration.intensity.facialExpressionIntensity + 0.1);
    } else if (data.engagement > 0.8) {
      // High engagement - reduce movement to avoid distraction
      adjustments.idleAnimationIntensity = Math.max(0.2, 
        this.configuration.intensity.idleAnimationIntensity - 0.1);
    }

    this.applyRealTimeAdjustments(adjustments, 'engagement');
  }

  private handlePerformanceAdjustment(data: any): void {
    if (!this.canMakeAdjustment()) return;

    const adjustments: Partial<MovementIntensityConfig> = {};

    if (data.frameRate < 30) {
      // Poor performance - reduce movement complexity
      adjustments.globalIntensity = Math.max(0.5, 
        this.configuration.intensity.globalIntensity - 0.2);
      adjustments.idleAnimationIntensity = Math.max(0.1, 
        this.configuration.intensity.idleAnimationIntensity - 0.3);
    } else if (data.frameRate > 55 && data.cpuUsage < 0.5) {
      // Good performance - can increase movement quality
      adjustments.globalIntensity = Math.min(1.0, 
        this.configuration.intensity.globalIntensity + 0.1);
    }

    this.applyRealTimeAdjustments(adjustments, 'performance');
  }

  private canMakeAdjustment(): boolean {
    const now = Date.now();
    const timeSinceLastAdjustment = now - this.lastAdjustmentTime;
    return timeSinceLastAdjustment >= this.configuration.realTimeAdjustments.adjustmentCooldown;
  }

  private applyRealTimeAdjustments(adjustments: any, source: string): void {
    const smoothingFactor = this.configuration.realTimeAdjustments.adjustmentSmoothing 
      ? this.configuration.realTimeAdjustments.smoothingFactor 
      : 1.0;

    // Apply smoothing to adjustments
    for (const [key, value] of Object.entries(adjustments)) {
      const currentValue = (this.configuration.intensity as any)[key];
      const smoothedValue = currentValue + (value as number - currentValue) * smoothingFactor;
      (this.configuration.intensity as any)[key] = smoothedValue;
    }

    // Record adjustment
    this.adjustmentHistory.push({
      timestamp: Date.now(),
      source,
      adjustments,
      resultingConfiguration: { ...this.configuration.intensity }
    });

    // Limit history size
    if (this.adjustmentHistory.length > 100) {
      this.adjustmentHistory = this.adjustmentHistory.slice(-50);
    }

    this.lastAdjustmentTime = Date.now();
    this.emitEvent('real_time_adjustment_applied', { adjustments, source });
  }

  // ============================================================================
  // Configuration Management
  // ============================================================================

  public updateIntensityConfiguration(updates: Partial<MovementIntensityConfig>): void {
    this.configuration.intensity = { ...this.configuration.intensity, ...updates };
    this.saveConfiguration();
    this.emitEvent('intensity_configuration_updated', { updates });
  }

  public updateFrequencyConfiguration(updates: Partial<MovementFrequencyConfig>): void {
    this.configuration.frequency = { ...this.configuration.frequency, ...updates };
    this.saveConfiguration();
    this.emitEvent('frequency_configuration_updated', { updates });
  }

  public updateUserPreferences(updates: Partial<UserMovementPreferences>): void {
    this.configuration.userPreferences = { ...this.configuration.userPreferences, ...updates };
    this.saveConfiguration();
    this.emitEvent('user_preferences_updated', { updates });
  }

  public getConfiguration(): MovementConfiguration {
    return JSON.parse(JSON.stringify(this.configuration));
  }

  public getActiveContextProfile(): ContextMovementProfile | null {
    return this.activeContextProfile;
  }

  public getAdjustmentHistory(): AdjustmentHistoryEntry[] {
    return [...this.adjustmentHistory];
  }

  // ============================================================================
  // Integration with MotionSensitivityManager
  // ============================================================================

  private setupMotionSensitivityIntegration(): void {
    motionSensitivityManager.addEventListener('settings_changed', (event: MovementEvent) => {
      this.handleMotionSensitivityChange(event.data.newSettings);
    });
  }

  private handleMotionSensitivityChange(settings: MotionSensitivitySettings): void {
    // Update configuration based on motion sensitivity settings
    if (settings.motionSensitivityEnabled) {
      this.configuration.intensity.globalIntensity = settings.customIntensityScale;
      this.configuration.intensity.headMovementIntensity = settings.headMovementIntensity;
      this.configuration.intensity.gestureIntensity = settings.gestureIntensity;
      this.configuration.intensity.idleAnimationIntensity = settings.idleAnimationIntensity;
      
      this.configuration.frequency.headMovementFrequency = settings.movementFrequency;
      this.configuration.frequency.gestureFrequency = settings.gestureFrequency;
    }

    this.emitEvent('motion_sensitivity_integration_updated', { settings });
  }

  // ============================================================================
  // Cultural and Language Profile Initialization
  // ============================================================================

  private initializeCulturalProfiles(): void {
    // Western cultural profile
    this.configuration.culturalSettings.culturalProfiles.set('western', {
      region: 'western',
      gesturePreferences: [
        { gestureType: 'hand_gesture', frequency: 0.8, intensity: 0.7, contexts: ['explanation', 'emphasis'] },
        { gestureType: 'head_nod', frequency: 0.9, intensity: 0.6, contexts: ['agreement', 'understanding'] }
      ],
      movementAmplitude: 1.0,
      eyeContactPatterns: { frequency: 0.7, duration: 2000, avoidance: false },
      personalSpaceBehavior: { preferredDistance: 1.0, approachStyle: 'direct', retreatTriggers: [] },
      restrictedGestures: []
    });

    // Eastern cultural profile
    this.configuration.culturalSettings.culturalProfiles.set('eastern', {
      region: 'eastern',
      gesturePreferences: [
        { gestureType: 'head_bow', frequency: 0.6, intensity: 0.5, contexts: ['greeting', 'respect'] },
        { gestureType: 'subtle_gesture', frequency: 0.5, intensity: 0.4, contexts: ['explanation'] }
      ],
      movementAmplitude: 0.7,
      eyeContactPatterns: { frequency: 0.4, duration: 1000, avoidance: true },
      personalSpaceBehavior: { preferredDistance: 1.2, approachStyle: 'respectful', retreatTriggers: ['direct_approach'] },
      restrictedGestures: ['pointing_gesture', 'large_hand_gesture']
    });
  }

  private initializeLanguageProfiles(): void {
    // English head movement style
    this.configuration.languageSettings.headMovementStyles.set('en', {
      language: 'en',
      nodFrequency: 0.7,
      tiltTendency: 0.5,
      emphasisStyle: 'moderate',
      questioningStyle: 'head_tilt'
    });

    // Spanish head movement style
    this.configuration.languageSettings.headMovementStyles.set('es', {
      language: 'es',
      nodFrequency: 0.8,
      tiltTendency: 0.6,
      emphasisStyle: 'expressive',
      questioningStyle: 'eyebrow_raise'
    });

    // French head movement style
    this.configuration.languageSettings.headMovementStyles.set('fr', {
      language: 'fr',
      nodFrequency: 0.6,
      tiltTendency: 0.7,
      emphasisStyle: 'subtle',
      questioningStyle: 'forward_lean'
    });
  }

  // ============================================================================
  // Profile Transitions
  // ============================================================================

  private transitionToProfile(profile: ContextMovementProfile): void {
    // Implement smooth transition to new profile
    this.emitEvent('profile_transition_started', { toProfile: profile });
    
    // Apply profile settings gradually
    setTimeout(() => {
      this.applyProfileSettings(profile);
      this.emitEvent('profile_transition_completed', { profile });
    }, profile.transitionInDuration);
  }

  private transitionFromProfile(fromProfile: ContextMovementProfile, toProfile: ContextMovementProfile): void {
    this.emitEvent('profile_transition_started', { fromProfile, toProfile });
    
    // Implement smooth transition between profiles
    setTimeout(() => {
      this.applyProfileSettings(toProfile);
      this.emitEvent('profile_transition_completed', { fromProfile, toProfile });
    }, Math.max(fromProfile.transitionOutDuration, toProfile.transitionInDuration));
  }

  private applyProfileSettings(profile: ContextMovementProfile): void {
    // Apply intensity modifiers
    for (const [key, modifier] of Object.entries(profile.intensityModifiers)) {
      const configKey = `${key}Intensity` as keyof MovementIntensityConfig;
      if (configKey in this.configuration.intensity) {
        (this.configuration.intensity as any)[configKey] *= modifier;
      }
    }

    // Apply frequency modifiers
    for (const [key, modifier] of Object.entries(profile.frequencyModifiers)) {
      const configKey = `${key}Frequency` as keyof MovementFrequencyConfig;
      if (configKey in this.configuration.frequency) {
        (this.configuration.frequency as any)[configKey] *= modifier;
      }
    }
  }

  // ============================================================================
  // Storage and Persistence
  // ============================================================================

  private async loadConfiguration(): Promise<void> {
    try {
      const stored = localStorage.getItem('movementConfiguration');
      if (stored) {
        const parsedConfig = JSON.parse(stored);
        this.configuration = { ...this.configuration, ...parsedConfig };
      }
    } catch (error) {
      console.warn('Failed to load movement configuration:', error);
    }
  }

  private saveConfiguration(): void {
    try {
      localStorage.setItem('movementConfiguration', JSON.stringify(this.configuration));
    } catch (error) {
      console.warn('Failed to save movement configuration:', error);
    }
  }

  // ============================================================================
  // Event System
  // ============================================================================

  public addEventListener(eventType: string, listener: Function): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    this.eventListeners.get(eventType)!.push(listener);
  }

  public removeEventListener(eventType: string, listener: Function): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emitEvent(eventType: string, data: any): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error(`Error in movement configuration event listener for ${eventType}:`, error);
        }
      });
    }
  }

  // ============================================================================
  // Public API
  // ============================================================================

  public reset(): void {
    this.configuration = this.createDefaultConfiguration();
    this.activeContextProfile = null;
    this.adjustmentHistory = [];
    this.saveConfiguration();
    this.emitEvent('configuration_reset', {});
  }

  public exportConfiguration(): string {
    return JSON.stringify(this.configuration, null, 2);
  }

  public importConfiguration(configJson: string): boolean {
    try {
      const importedConfig = JSON.parse(configJson);
      this.configuration = { ...this.createDefaultConfiguration(), ...importedConfig };
      this.saveConfiguration();
      this.emitEvent('configuration_imported', { configuration: this.configuration });
      return true;
    } catch (error) {
      console.error('Failed to import configuration:', error);
      return false;
    }
  }
}

// ============================================================================
// Supporting Types
// ============================================================================

interface AdjustmentHistoryEntry {
  timestamp: number;
  source: string;
  adjustments: any;
  resultingConfiguration: any;
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const movementConfigurationInterface = new MovementConfigurationInterface();