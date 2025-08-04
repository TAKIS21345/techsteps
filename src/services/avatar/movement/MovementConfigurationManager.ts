/**
 * MovementConfigurationManager - Manages configurable movement parameters
 * 
 * This class provides a configuration interface for movement intensity and frequency,
 * implements context-specific movement profiles, and handles real-time preference
 * changes without requiring system restart.
 * 
 * Requirements addressed:
 * - 4.1: Configuration options for movement intensity and frequency
 * - 4.2: Context-specific movement profiles (formal vs casual)
 * - 5.4: Real-time preference changes without restart
 */

import {
  MotionSettings,
  MovementContext,
  CulturalProfile,
  AccentProfile,
  MovementEvent,
  MovementEventType,
  MovementEventListener
} from './types';

import { MotionSensitivityManager, MotionSensitivitySettings } from './MotionSensitivityManager';

export interface MovementConfiguration {
  // Core movement parameters
  globalIntensity: number; // 0.0 to 2.0
  globalFrequency: number; // 0.1 to 3.0
  
  // Component-specific settings
  headMovementConfig: HeadMovementConfig;
  gestureConfig: GestureConfig;
  idleAnimationConfig: IdleAnimationConfig;
  transitionConfig: TransitionConfig;
  
  // Context-specific profiles
  contextProfiles: Map<string, ContextMovementProfile>;
  activeContextProfile: string;
  
  // Cultural and language settings
  culturalAdaptation: CulturalAdaptationConfig;
  languageSpecificSettings: Map<string, LanguageMovementConfig>;
  
  // Performance settings
  performanceMode: 'high_quality' | 'balanced' | 'performance';
  enableAdvancedFeatures: boolean;
}

export interface HeadMovementConfig {
  enabled: boolean;
  intensity: number; // 0.0 to 2.0
  frequency: number; // 0.1 to 3.0
  allowedTypes: HeadMovementType[];
  maxSimultaneousMovements: number;
  smoothingFactor: number; // 0.0 to 1.0
}

export interface GestureConfig {
  enabled: boolean;
  intensity: number; // 0.0 to 2.0
  frequency: number; // 0.1 to 3.0
  allowedTypes: GestureType[];
  maxSimultaneousGestures: number;
  emphasisMultiplier: number; // 1.0 to 3.0
  questionGestureBoost: number; // 1.0 to 2.0
}

export interface IdleAnimationConfig {
  enabled: boolean;
  intensity: number; // 0.0 to 2.0
  frequency: number; // 0.1 to 3.0
  breathingAmplitude: number; // 0.0 to 1.0
  microMovementChance: number; // 0.0 to 1.0
  blinkFrequency: number; // blinks per minute
}

export interface TransitionConfig {
  defaultDuration: number; // milliseconds
  easeInDuration: number; // milliseconds
  easeOutDuration: number; // milliseconds
  blendMode: 'linear' | 'smooth' | 'ease_in_out';
  allowInterruption: boolean;
}

export interface ContextMovementProfile {
  name: string;
  description: string;
  
  // Context-specific multipliers
  intensityMultiplier: number;
  frequencyMultiplier: number;
  
  // Behavioral adjustments
  formalityLevel: 'very_formal' | 'formal' | 'neutral' | 'casual' | 'very_casual';
  energyLevel: 'low' | 'medium' | 'high' | 'very_high';
  
  // Feature overrides
  overrides: Partial<MovementConfiguration>;
  
  // Conditions for auto-activation
  autoActivationRules: ContextActivationRule[];
}

export interface ContextActivationRule {
  type: 'content_analysis' | 'time_based' | 'user_preference' | 'language_based';
  condition: string;
  priority: number;
}

export interface CulturalAdaptationConfig {
  enabled: boolean;
  adaptationStrength: number; // 0.0 to 1.0
  respectCulturalNorms: boolean;
  allowCulturalOverrides: boolean;
}

export interface LanguageMovementConfig {
  language: string;
  headMovementStyle: 'subtle' | 'moderate' | 'expressive';
  gestureFrequency: number;
  emphasisStyle: 'minimal' | 'standard' | 'dramatic';
  pauseHandling: 'ignore' | 'subtle' | 'pronounced';
}

export type HeadMovementType = 'nod' | 'tilt' | 'turn' | 'shake' | 'micro_movement';
export type GestureType = 'head_nod' | 'head_tilt' | 'eyebrow_raise' | 'hand_gesture' | 'emphasis';

export interface ConfigurationChangeEvent {
  section: string;
  property: string;
  oldValue: any;
  newValue: any;
  timestamp: number;
  requiresRestart: boolean;
}

export class MovementConfigurationManager {
  private configuration: MovementConfiguration;
  private motionSensitivityManager: MotionSensitivityManager;
  private eventListeners: Map<MovementEventType, MovementEventListener[]> = new Map();
  
  // Change tracking
  private pendingChanges: Map<string, any> = new Map();
  private lastConfigurationSave: number = 0;
  private configurationVersion: number = 1;
  
  // Performance monitoring
  private configurationLoadTime: number = 0;
  private changeApplicationTime: number = 0;

  constructor(
    motionSensitivityManager: MotionSensitivityManager,
    initialConfig?: Partial<MovementConfiguration>
  ) {
    this.motionSensitivityManager = motionSensitivityManager;
    this.configuration = this.createDefaultConfiguration();
    
    if (initialConfig) {
      this.updateConfiguration(initialConfig);
    }

    this.initializeContextProfiles();
    this.setupMotionSensitivityIntegration();
  }

  /**
   * Updates movement configuration with real-time application
   */
  public updateConfiguration(updates: Partial<MovementConfiguration>): void {
    const startTime = performance.now();
    const oldConfig = { ...this.configuration };
    
    // Apply updates
    this.configuration = { ...this.configuration, ...updates };
    
    // Validate configuration
    this.validateConfiguration();
    
    // Track changes
    this.trackConfigurationChanges(oldConfig, this.configuration);
    
    // Apply changes immediately
    this.applyConfigurationChanges();
    
    this.changeApplicationTime = performance.now() - startTime;
    this.configurationVersion++;
    
    this.emitEvent('settings_changed', {
      oldConfig,
      newConfig: this.configuration,
      version: this.configurationVersion,
      applicationTime: this.changeApplicationTime
    });
  }

  /**
   * Updates specific movement parameter
   */
  public updateMovementParameter(section: keyof MovementConfiguration, property: string, value: any): void {
    const changeEvent: ConfigurationChangeEvent = {
      section: section as string,
      property,
      oldValue: (this.configuration[section] as any)?.[property],
      newValue: value,
      timestamp: Date.now(),
      requiresRestart: false
    };

    // Apply the change
    if (this.configuration[section] && typeof this.configuration[section] === 'object') {
      (this.configuration[section] as any)[property] = value;
    }

    // Validate and apply
    this.validateConfiguration();
    this.applyConfigurationChanges();

    this.emitEvent('settings_changed', changeEvent);
  }

  /**
   * Activates a context-specific movement profile
   */
  public activateContextProfile(profileName: string): boolean {
    const profile = this.configuration.contextProfiles.get(profileName);
    if (!profile) {
      return false;
    }

    const oldProfile = this.configuration.activeContextProfile;
    this.configuration.activeContextProfile = profileName;

    // Apply profile overrides
    if (profile.overrides) {
      this.updateConfiguration(profile.overrides);
    }

    // Apply multipliers
    this.applyContextMultipliers(profile);

    this.emitEvent('settings_changed', {
      type: 'context_profile_changed',
      oldProfile,
      newProfile: profileName,
      profile
    });

    return true;
  }

  /**
   * Creates a custom context profile
   */
  public createContextProfile(profile: ContextMovementProfile): void {
    this.configuration.contextProfiles.set(profile.name, profile);
    
    this.emitEvent('settings_changed', {
      type: 'context_profile_created',
      profile
    });
  }

  /**
   * Gets current movement configuration
   */
  public getCurrentConfiguration(): MovementConfiguration {
    return { ...this.configuration };
  }

  /**
   * Gets configuration for specific context
   */
  public getContextualConfiguration(context: MovementContext): MovementConfiguration {
    let config = { ...this.configuration };
    
    // Apply active context profile
    const activeProfile = this.configuration.contextProfiles.get(this.configuration.activeContextProfile);
    if (activeProfile) {
      config = this.applyContextProfileToConfig(config, activeProfile, context);
    }

    // Apply language-specific settings
    const languageConfig = this.configuration.languageSpecificSettings.get(context.language);
    if (languageConfig) {
      config = this.applyLanguageConfigToConfig(config, languageConfig);
    }

    return config;
  }

  /**
   * Gets motion settings compatible with MovementOrchestrator
   */
  public getMotionSettings(): MotionSettings {
    const motionSensitivitySettings = this.motionSensitivityManager.getCurrentSettings();
    
    return {
      intensity: this.mapIntensityLevel(this.configuration.globalIntensity),
      enableGestures: this.configuration.gestureConfig.enabled && motionSensitivitySettings.enableGestures,
      enableHeadMovements: this.configuration.headMovementConfig.enabled && motionSensitivitySettings.enableHeadMovements,
      enableIdleAnimations: this.configuration.idleAnimationConfig.enabled && motionSensitivitySettings.enableIdleAnimations,
      motionSensitivity: motionSensitivitySettings.motionSensitivityEnabled,
      customIntensityScale: this.configuration.globalIntensity
    };
  }

  /**
   * Exports configuration for persistence
   */
  public exportConfiguration(): string {
    const exportData = {
      configuration: this.configuration,
      version: this.configurationVersion,
      timestamp: Date.now()
    };

    return JSON.stringify(exportData, (key, value) => {
      // Handle Map serialization
      if (value instanceof Map) {
        return Object.fromEntries(value);
      }
      return value;
    }, 2);
  }

  /**
   * Imports configuration from saved data
   */
  public importConfiguration(configData: string): boolean {
    try {
      const data = JSON.parse(configData);
      
      if (data.configuration) {
        // Convert objects back to Maps
        if (data.configuration.contextProfiles) {
          data.configuration.contextProfiles = new Map(Object.entries(data.configuration.contextProfiles));
        }
        if (data.configuration.languageSpecificSettings) {
          data.configuration.languageSpecificSettings = new Map(Object.entries(data.configuration.languageSpecificSettings));
        }

        this.updateConfiguration(data.configuration);
        return true;
      }
    } catch (error) {
      console.error('Failed to import configuration:', error);
    }
    
    return false;
  }

  /**
   * Resets configuration to defaults
   */
  public resetToDefaults(): void {
    const defaultConfig = this.createDefaultConfiguration();
    this.updateConfiguration(defaultConfig);
  }

  /**
   * Gets available context profiles
   */
  public getAvailableContextProfiles(): ContextMovementProfile[] {
    return Array.from(this.configuration.contextProfiles.values());
  }

  /**
   * Auto-detects and activates appropriate context profile
   */
  public autoDetectContextProfile(context: MovementContext): string | null {
    let bestMatch: { profile: ContextMovementProfile; score: number } | null = null;

    for (const [name, profile] of this.configuration.contextProfiles) {
      const score = this.calculateContextMatchScore(profile, context);
      
      if (!bestMatch || score > bestMatch.score) {
        bestMatch = { profile, score };
      }
    }

    if (bestMatch && bestMatch.score > 0.7) {
      this.activateContextProfile(bestMatch.profile.name);
      return bestMatch.profile.name;
    }

    return null;
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

  private createDefaultConfiguration(): MovementConfiguration {
    return {
      globalIntensity: 1.0,
      globalFrequency: 1.0,
      
      headMovementConfig: {
        enabled: true,
        intensity: 1.0,
        frequency: 1.0,
        allowedTypes: ['nod', 'tilt', 'micro_movement'],
        maxSimultaneousMovements: 2,
        smoothingFactor: 0.8
      },
      
      gestureConfig: {
        enabled: true,
        intensity: 1.0,
        frequency: 1.0,
        allowedTypes: ['head_nod', 'head_tilt', 'eyebrow_raise', 'emphasis'],
        maxSimultaneousGestures: 1,
        emphasisMultiplier: 1.5,
        questionGestureBoost: 1.3
      },
      
      idleAnimationConfig: {
        enabled: true,
        intensity: 0.6,
        frequency: 0.8,
        breathingAmplitude: 0.3,
        microMovementChance: 0.2,
        blinkFrequency: 15
      },
      
      transitionConfig: {
        defaultDuration: 300,
        easeInDuration: 150,
        easeOutDuration: 150,
        blendMode: 'ease_in_out',
        allowInterruption: true
      },
      
      contextProfiles: new Map(),
      activeContextProfile: 'neutral',
      
      culturalAdaptation: {
        enabled: true,
        adaptationStrength: 0.7,
        respectCulturalNorms: true,
        allowCulturalOverrides: false
      },
      
      languageSpecificSettings: new Map(),
      
      performanceMode: 'balanced',
      enableAdvancedFeatures: true
    };
  }

  private initializeContextProfiles(): void {
    // Neutral/Default Profile
    this.configuration.contextProfiles.set('neutral', {
      name: 'neutral',
      description: 'Balanced movement profile for general use',
      intensityMultiplier: 1.0,
      frequencyMultiplier: 1.0,
      formalityLevel: 'neutral',
      energyLevel: 'medium',
      overrides: {},
      autoActivationRules: []
    });

    // Formal Profile
    this.configuration.contextProfiles.set('formal', {
      name: 'formal',
      description: 'Subdued movements for professional contexts',
      intensityMultiplier: 0.7,
      frequencyMultiplier: 0.8,
      formalityLevel: 'formal',
      energyLevel: 'low',
      overrides: {
        gestureConfig: {
          enabled: true,
          intensity: 0.6,
          frequency: 0.7,
          allowedTypes: ['head_nod', 'emphasis'],
          maxSimultaneousGestures: 1,
          emphasisMultiplier: 1.2,
          questionGestureBoost: 1.1
        }
      },
      autoActivationRules: [
        {
          type: 'content_analysis',
          condition: 'formal_language_detected',
          priority: 0.8
        }
      ]
    });

    // Casual Profile
    this.configuration.contextProfiles.set('casual', {
      name: 'casual',
      description: 'Expressive movements for informal interactions',
      intensityMultiplier: 1.3,
      frequencyMultiplier: 1.2,
      formalityLevel: 'casual',
      energyLevel: 'high',
      overrides: {
        gestureConfig: {
          enabled: true,
          intensity: 1.4,
          frequency: 1.3,
          allowedTypes: ['head_nod', 'head_tilt', 'eyebrow_raise', 'emphasis'],
          maxSimultaneousGestures: 2,
          emphasisMultiplier: 2.0,
          questionGestureBoost: 1.6
        }
      },
      autoActivationRules: [
        {
          type: 'content_analysis',
          condition: 'casual_language_detected',
          priority: 0.7
        }
      ]
    });

    // Educational Profile
    this.configuration.contextProfiles.set('educational', {
      name: 'educational',
      description: 'Clear, supportive movements for teaching',
      intensityMultiplier: 1.1,
      frequencyMultiplier: 0.9,
      formalityLevel: 'neutral',
      energyLevel: 'medium',
      overrides: {
        gestureConfig: {
          enabled: true,
          intensity: 1.2,
          frequency: 1.0,
          allowedTypes: ['head_nod', 'emphasis'],
          maxSimultaneousGestures: 1,
          emphasisMultiplier: 1.8,
          questionGestureBoost: 1.4
        }
      },
      autoActivationRules: [
        {
          type: 'content_analysis',
          condition: 'educational_content_detected',
          priority: 0.9
        }
      ]
    });
  }

  private setupMotionSensitivityIntegration(): void {
    this.motionSensitivityManager.addEventListener('settings_changed', (event) => {
      // Update our configuration based on motion sensitivity changes
      const motionSettings = this.motionSensitivityManager.getCurrentSettings();
      
      this.updateConfiguration({
        headMovementConfig: {
          ...this.configuration.headMovementConfig,
          enabled: motionSettings.enableHeadMovements,
          intensity: this.configuration.headMovementConfig.intensity * motionSettings.headMovementIntensity
        },
        gestureConfig: {
          ...this.configuration.gestureConfig,
          enabled: motionSettings.enableGestures,
          intensity: this.configuration.gestureConfig.intensity * motionSettings.gestureIntensity
        },
        idleAnimationConfig: {
          ...this.configuration.idleAnimationConfig,
          enabled: motionSettings.enableIdleAnimations,
          intensity: this.configuration.idleAnimationConfig.intensity * motionSettings.idleAnimationIntensity
        }
      });
    });
  }

  private validateConfiguration(): void {
    // Clamp values to valid ranges
    this.configuration.globalIntensity = Math.max(0, Math.min(2, this.configuration.globalIntensity));
    this.configuration.globalFrequency = Math.max(0.1, Math.min(3, this.configuration.globalFrequency));
    
    // Validate head movement config
    this.configuration.headMovementConfig.intensity = Math.max(0, Math.min(2, this.configuration.headMovementConfig.intensity));
    this.configuration.headMovementConfig.frequency = Math.max(0.1, Math.min(3, this.configuration.headMovementConfig.frequency));
    this.configuration.headMovementConfig.smoothingFactor = Math.max(0, Math.min(1, this.configuration.headMovementConfig.smoothingFactor));
    
    // Validate gesture config
    this.configuration.gestureConfig.intensity = Math.max(0, Math.min(2, this.configuration.gestureConfig.intensity));
    this.configuration.gestureConfig.frequency = Math.max(0.1, Math.min(3, this.configuration.gestureConfig.frequency));
    this.configuration.gestureConfig.emphasisMultiplier = Math.max(1, Math.min(3, this.configuration.gestureConfig.emphasisMultiplier));
    
    // Validate idle animation config
    this.configuration.idleAnimationConfig.intensity = Math.max(0, Math.min(2, this.configuration.idleAnimationConfig.intensity));
    this.configuration.idleAnimationConfig.frequency = Math.max(0.1, Math.min(3, this.configuration.idleAnimationConfig.frequency));
    this.configuration.idleAnimationConfig.breathingAmplitude = Math.max(0, Math.min(1, this.configuration.idleAnimationConfig.breathingAmplitude));
    this.configuration.idleAnimationConfig.microMovementChance = Math.max(0, Math.min(1, this.configuration.idleAnimationConfig.microMovementChance));
  }

  private trackConfigurationChanges(oldConfig: MovementConfiguration, newConfig: MovementConfiguration): void {
    // Track significant changes for analytics/debugging
    const changes: string[] = [];
    
    if (oldConfig.globalIntensity !== newConfig.globalIntensity) {
      changes.push(`globalIntensity: ${oldConfig.globalIntensity} → ${newConfig.globalIntensity}`);
    }
    
    if (oldConfig.activeContextProfile !== newConfig.activeContextProfile) {
      changes.push(`activeContextProfile: ${oldConfig.activeContextProfile} → ${newConfig.activeContextProfile}`);
    }
    
    if (changes.length > 0) {
      console.debug('Movement configuration changes:', changes);
    }
  }

  private applyConfigurationChanges(): void {
    // Apply changes immediately without restart
    // This method ensures all dependent systems are notified
    
    this.lastConfigurationSave = Date.now();
    
    // Clear any pending changes
    this.pendingChanges.clear();
  }

  private applyContextMultipliers(profile: ContextMovementProfile): void {
    // Apply intensity and frequency multipliers from the profile
    this.configuration.globalIntensity *= profile.intensityMultiplier;
    this.configuration.globalFrequency *= profile.frequencyMultiplier;
    
    // Ensure values stay within valid ranges
    this.validateConfiguration();
  }

  private applyContextProfileToConfig(
    config: MovementConfiguration,
    profile: ContextMovementProfile,
    context: MovementContext
  ): MovementConfiguration {
    const modifiedConfig = { ...config };
    
    // Apply multipliers
    modifiedConfig.globalIntensity *= profile.intensityMultiplier;
    modifiedConfig.globalFrequency *= profile.frequencyMultiplier;
    
    // Apply overrides
    if (profile.overrides) {
      Object.assign(modifiedConfig, profile.overrides);
    }
    
    return modifiedConfig;
  }

  private applyLanguageConfigToConfig(
    config: MovementConfiguration,
    languageConfig: LanguageMovementConfig
  ): MovementConfiguration {
    const modifiedConfig = { ...config };
    
    // Apply language-specific adjustments
    switch (languageConfig.headMovementStyle) {
      case 'subtle':
        modifiedConfig.headMovementConfig.intensity *= 0.7;
        break;
      case 'expressive':
        modifiedConfig.headMovementConfig.intensity *= 1.4;
        break;
    }
    
    modifiedConfig.gestureConfig.frequency *= languageConfig.gestureFrequency;
    
    return modifiedConfig;
  }

  private mapIntensityLevel(intensity: number): 'minimal' | 'reduced' | 'standard' | 'enhanced' {
    if (intensity <= 0.3) return 'minimal';
    if (intensity <= 0.7) return 'reduced';
    if (intensity <= 1.3) return 'standard';
    return 'enhanced';
  }

  private calculateContextMatchScore(profile: ContextMovementProfile, context: MovementContext): number {
    let score = 0;
    
    // Check auto-activation rules
    for (const rule of profile.autoActivationRules) {
      switch (rule.type) {
        case 'content_analysis':
          if (this.matchesContentCondition(rule.condition, context)) {
            score += rule.priority;
          }
          break;
        case 'language_based':
          if (context.language === rule.condition) {
            score += rule.priority;
          }
          break;
      }
    }
    
    return Math.min(score, 1.0);
  }

  private matchesContentCondition(condition: string, context: MovementContext): boolean {
    switch (condition) {
      case 'formal_language_detected':
        return context.speechContent.includes('please') || 
               context.speechContent.includes('thank you') ||
               /\b(sir|madam|mr|mrs|ms)\b/i.test(context.speechContent);
      case 'casual_language_detected':
        return /\b(hey|hi|yeah|cool|awesome)\b/i.test(context.speechContent);
      case 'educational_content_detected':
        return context.isExplanation || 
               /\b(learn|understand|explain|teach|lesson)\b/i.test(context.speechContent);
      default:
        return false;
    }
  }

  private emitEvent(type: MovementEventType, data: any): void {
    const event: MovementEvent = {
      type,
      timestamp: Date.now(),
      data,
      source: 'MovementConfigurationManager'
    };

    const listeners = this.eventListeners.get(type);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(event);
        } catch (error) {
          console.error(`Error in configuration event listener for ${type}:`, error);
        }
      });
    }
  }
}