/**
 * Avatar Movement Enhancement System
 * 
 * This module provides deliberate, context-aware movement patterns for natural avatar interactions.
 * It replaces random movements with purposeful animations synchronized with speech content.
 */

// Core types and interfaces
export * from './types';

// Main orchestrator
export { MovementOrchestrator, MovementOrchestrationResult } from './MovementOrchestrator';

// Transition engine for smooth animations
export { TransitionEngine, TransitionResult, BlendState } from './TransitionEngine';

// Motion sensitivity and accessibility management
export { 
  MotionSensitivityManager, 
  MotionSensitivitySettings,
  MotionIntensityProfile,
  AlternativeFeedbackOptions 
} from './MotionSensitivityManager';

// Movement configuration management
export { 
  MovementConfigurationManager,
  MovementConfiguration,
  HeadMovementConfig,
  GestureConfig,
  IdleAnimationConfig,
  TransitionConfig,
  ContextMovementProfile,
  CulturalAdaptationConfig,
  LanguageMovementConfig,
  ConfigurationChangeEvent
} from './MovementConfigurationManager';

// Accessibility compliance features
export { 
  AccessibilityComplianceManager,
  AccessibilitySettings,
  AlternativeEmphasisConfig,
  AlternativeQuestionConfig,
  AlternativeFeedbackConfig,
  AccessibilityViolation,
  AccessibilityAuditResult,
  UserControlValidation,
  AlternativeCommunication
} from './AccessibilityComplianceManager';

// Re-export commonly used types for convenience
export type {
  MovementPlan,
  MovementContext,
  HeadMovement,
  Gesture,
  MovementState,
  MotionSettings,
  CulturalProfile,
  AccentProfile,
  MorphTargetMapping,
  MovementEvent,
  MovementEventType,
  MovementEventListener
} from './types';