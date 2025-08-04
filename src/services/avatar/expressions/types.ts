/**
 * Types and interfaces for the Facial Expression System
 * Provides emotion-based facial expressions with smooth transitions
 */

// ============================================================================
// Core Expression Types
// ============================================================================

export interface FacialExpression {
  type: ExpressionType;
  intensity: number; // 0.0 to 1.0
  duration: number; // milliseconds
  morphTargets: Record<string, number>;
  eyeMovements: EyeMovement;
  eyebrowPosition: EyebrowPosition;
  blendMode: 'replace' | 'additive' | 'multiply';
}

export type ExpressionType = 
  | 'smile' 
  | 'concern' 
  | 'excitement' 
  | 'focus' 
  | 'surprise' 
  | 'neutral'
  | 'joy'
  | 'sadness'
  | 'anger'
  | 'fear'
  | 'disgust'
  | 'contempt';

export interface EmotionalContext {
  primary: EmotionType;
  secondary?: EmotionType;
  intensity: number; // 0.0 to 1.0
  culturalModifier: number; // Cultural expression intensity modifier
  duration?: number; // Optional duration override
}

export type EmotionType = 
  | 'joy' 
  | 'concern' 
  | 'excitement' 
  | 'focus' 
  | 'surprise' 
  | 'neutral'
  | 'sadness'
  | 'anger'
  | 'fear'
  | 'disgust'
  | 'contempt';

// ============================================================================
// Expression Components
// ============================================================================

export interface EyeMovement {
  lookDirection: Vector3;
  blinkRate: number; // blinks per minute
  eyeWidening: number; // 0.0 to 1.0
  squinting: number; // 0.0 to 1.0
}

export interface EyebrowPosition {
  leftRaise: number; // -1.0 to 1.0 (negative = lower, positive = raise)
  rightRaise: number; // -1.0 to 1.0
  furrow: number; // 0.0 to 1.0 (furrowing between brows)
}

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}/
/ ============================================================================
// Expression Blending and Transitions
// ============================================================================

export interface ExpressionBlend {
  expressions: WeightedExpression[];
  blendMode: BlendMode;
  transitionDuration: number; // milliseconds
}

export interface WeightedExpression {
  expression: FacialExpression;
  weight: number; // 0.0 to 1.0
}

export type BlendMode = 'linear' | 'smooth' | 'ease_in_out' | 'cultural_adaptive';

export interface ExpressionTransition {
  fromExpression: FacialExpression;
  toExpression: FacialExpression;
  progress: number; // 0.0 to 1.0
  duration: number; // milliseconds
  easing: EasingFunction;
  startTime: number;
}

export type EasingFunction = 
  | 'linear'
  | 'ease_in'
  | 'ease_out'
  | 'ease_in_out'
  | 'bounce'
  | 'elastic';

// ============================================================================
// Content Analysis Integration
// ============================================================================

export interface ContentAnalysisResult {
  sentiment: SentimentType;
  emotionalIntensity: number; // 0.0 to 1.0
  contentType: ContentType;
  keyPhrases: string[];
  culturalContext: string;
  confidence: number; // 0.0 to 1.0
}

export type SentimentType = 'positive' | 'negative' | 'neutral';

export type ContentType = 
  | 'question' 
  | 'explanation' 
  | 'celebration' 
  | 'instruction'
  | 'greeting'
  | 'farewell'
  | 'concern'
  | 'excitement';

// ============================================================================
// Expression Engine Configuration
// ============================================================================

export interface ExpressionEngineConfig {
  defaultIntensity: number; // 0.0 to 1.0
  transitionSpeed: number; // multiplier for transition durations
  culturalSensitivity: number; // 0.0 to 1.0
  enableMicroExpressions: boolean;
  expressionMemory: number; // milliseconds to remember previous expressions
  blendingEnabled: boolean;
}

export interface ExpressionState {
  currentExpression: FacialExpression | null;
  targetExpression: FacialExpression | null;
  isTransitioning: boolean;
  transitionProgress: number; // 0.0 to 1.0
  lastUpdateTime: number;
  expressionHistory: ExpressionHistoryEntry[];
}

export interface ExpressionHistoryEntry {
  expression: FacialExpression;
  timestamp: number;
  duration: number;
  context: EmotionalContext;
}