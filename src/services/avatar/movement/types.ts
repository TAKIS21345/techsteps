/**
 * Core types and interfaces for the Avatar Movement Enhancement System
 * Provides deliberate, context-aware movement patterns for natural avatar interactions
 */

// ============================================================================
// Core Movement Types
// ============================================================================

export interface MovementPlan {
  headMovements: HeadMovement[];
  gestures: Gesture[];
  transitions: Transition[];
  duration: number;
  priority: number;
}

export interface MovementContext {
  isQuestion: boolean;
  isExplanation: boolean;
  emphasisLevel: 'low' | 'medium' | 'high';
  culturalContext: string;
  language: string;
  speechContent: string;
}

export interface HeadMovement {
  type: 'nod' | 'tilt' | 'turn' | 'shake' | 'micro_movement';
  direction: 'up' | 'down' | 'left' | 'right' | 'forward' | 'back';
  intensity: number; // 0.0 to 1.0
  duration: number; // milliseconds
  startTime: number; // milliseconds from start
  easing: EasingType;
}

export interface Gesture {
  type: 'head_nod' | 'head_tilt' | 'eyebrow_raise' | 'hand_gesture' | 'emphasis';
  intensity: number; // 0.0 to 1.0
  duration: number; // milliseconds
  timing: number; // milliseconds from start
  culturalVariant?: string;
  morphTargets: MorphTargetMapping[];
}

export interface IdleMovement {
  type: 'breathing' | 'micro_movement' | 'blink_pattern' | 'subtle_sway';
  amplitude: number; // 0.0 to 1.0
  frequency: number; // Hz
  phase: number; // radians
}

export interface Transition {
  fromState: MovementState;
  toState: MovementState;
  duration: number; // milliseconds
  easing: EasingType;
  blendMode: 'linear' | 'smooth' | 'ease_in_out';
}

// ============================================================================
// Movement State Management
// ============================================================================

export interface AvatarMovementState {
  currentMovement: MovementPlan | null;
  isTransitioning: boolean;
  transitionProgress: number; // 0.0 to 1.0
  motionSettings: MotionSettings;
  culturalProfile: CulturalProfile;
  accentProfile: AccentProfile;
  lastUpdateTime: number;
}

export type MovementState = 'idle' | 'speaking' | 'listening' | 'emphasizing' | 'questioning' | 'transitioning';

export interface MotionSettings {
  intensity: 'minimal' | 'reduced' | 'standard' | 'enhanced';
  enableGestures: boolean;
  enableHeadMovements: boolean;
  enableIdleAnimations: boolean;
  motionSensitivity: boolean;
  customIntensityScale: number; // 0.0 to 2.0
}

// ============================================================================
// Cultural and Language Adaptation
// ============================================================================

export interface CulturalProfile {
  region: string; // e.g., 'western', 'eastern', 'mediterranean'
  gesturePreferences: GesturePreference[];
  movementAmplitude: number; // Cultural modifier for movement intensity
  eyeContactPatterns: EyeContactPattern;
  personalSpaceBehavior: PersonalSpaceBehavior;
  restrictedGestures: string[]; // Gestures to avoid for this culture
}

export interface GesturePreference {
  gestureType: string;
  frequency: number; // How often to use this gesture
  intensity: number; // How intense the gesture should be
  contexts: string[]; // When to use this gesture
}

export interface AccentProfile {
  language: string;
  region?: string;
  pronunciationRules: PronunciationRules;
  speechRhythm: RhythmPattern;
  intonationPatterns: IntonationPattern[];
  headMovementStyle: HeadMovementStyle;
}

export interface PronunciationRules {
  vowelMappings: Record<string, string>;
  consonantMappings: Record<string, string>;
  rhythmPattern: RhythmPattern;
  stressPatterns: StressPattern[];
}

export interface RhythmPattern {
  beatsPerMinute: number;
  stressPattern: number[]; // Array of stress levels (0.0 to 1.0)
  pauseDurations: number[]; // Milliseconds
}

export interface IntonationPattern {
  type: 'rising' | 'falling' | 'flat' | 'question' | 'emphasis';
  curve: number[]; // Pitch curve points
  duration: number;
}

export interface HeadMovementStyle {
  nodFrequency: number; // How often to nod during speech
  tiltTendency: number; // Tendency to tilt head
  emphasisStyle: 'subtle' | 'moderate' | 'expressive';
}

// ============================================================================
// Animation and Morphing
// ============================================================================

export interface MorphTargetMapping {
  targetName: string;
  weight: number; // 0.0 to 1.0
  blendMode: 'replace' | 'additive' | 'multiply';
}

export interface AnimationCurve {
  keyframes: Keyframe[];
  interpolation: 'linear' | 'cubic' | 'bezier';
  loop: boolean;
}

export interface Keyframe {
  time: number; // 0.0 to 1.0 (normalized time)
  value: number;
  easing?: EasingType;
}

export type EasingType =
  | 'linear'
  | 'ease_in'
  | 'ease_out'
  | 'ease_in_out'
  | 'bounce'
  | 'elastic'
  | 'back';

// ============================================================================
// Context Analysis
// ============================================================================

export interface EmphasisData {
  words: EmphasisWord[];
  overallIntensity: number;
  type: 'question' | 'statement' | 'exclamation' | 'explanation';
}

export interface EmphasisWord {
  word: string;
  startTime: number;
  endTime: number;
  intensity: number; // 0.0 to 1.0
  type: 'stress' | 'pitch' | 'volume' | 'pause';
}

export interface SpeechAnalysis {
  sentiment: 'positive' | 'negative' | 'neutral';
  energy: number; // 0.0 to 1.0
  pace: number; // words per minute
  questions: QuestionMarker[];
  emphasis: EmphasisData;
  pauses: PauseMarker[];
}

export interface QuestionMarker {
  startTime: number;
  endTime: number;
  type: 'yes_no' | 'wh_question' | 'rhetorical';
  confidence: number;
}

export interface PauseMarker {
  startTime: number;
  duration: number;
  type: 'breath' | 'emphasis' | 'sentence_end';
}

// ============================================================================
// Accessibility and User Preferences
// ============================================================================

export interface EyeContactPattern {
  frequency: number; // How often to make "eye contact"
  duration: number; // How long to maintain eye contact
  avoidance: boolean; // Whether to avoid direct eye contact
}

export interface PersonalSpaceBehavior {
  preferredDistance: number; // Virtual distance preference
  approachStyle: 'direct' | 'gradual' | 'respectful';
  retreatTriggers: string[]; // Situations that trigger backing away
}

export interface StressPattern {
  syllableIndex: number;
  intensity: number; // 0.0 to 1.0
  type: 'primary' | 'secondary' | 'unstressed';
}

// ============================================================================
// Performance and Optimization
// ============================================================================

export interface MovementCache {
  gestures: Map<string, Gesture[]>;
  transitions: Map<string, Transition>;
  morphTargets: Map<string, MorphTargetMapping[]>;
  lastCleanup: number;
}

export interface PerformanceMetrics {
  calculationTime: number; // milliseconds
  memoryUsage: number; // bytes
  frameRate: number; // fps
  cacheHitRate: number; // 0.0 to 1.0
}

// ============================================================================
// Event System
// ============================================================================

export interface MovementEvent {
  type: MovementEventType;
  timestamp: number;
  data: any;
  source: string;
}

export type MovementEventType =
  | 'movement_started'
  | 'movement_completed'
  | 'transition_started'
  | 'transition_completed'
  | 'gesture_triggered'
  | 'settings_changed'
  | 'language_changed'
  | 'error_occurred';

export interface MovementEventListener {
  (event: MovementEvent): void;
}

// ============================================================================
// Configuration and Initialization
// ============================================================================

export interface MovementSystemConfig {
  defaultMotionSettings: MotionSettings;
  culturalProfiles: Record<string, CulturalProfile>;
  accentProfiles: Record<string, AccentProfile>;
  gestureLibraryPath: string;
  enablePerformanceMonitoring: boolean;
  cacheSize: number;
  updateFrequency: number; // Hz
}

export interface InitializationOptions {
  config: MovementSystemConfig;
  enableDebugMode: boolean;
  customGestureLibrary?: any;
  performanceCallback?: (metrics: PerformanceMetrics) => void;
}