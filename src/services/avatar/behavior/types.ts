/**
 * Type definitions for AI Behavior Controller system
 */

export interface ContentAnalysis {
  sentiment: 'positive' | 'negative' | 'neutral';
  emotionalIntensity: number;
  contentType: 'question' | 'explanation' | 'celebration' | 'instruction' | 'greeting' | 'farewell';
  keyPhrases: string[];
  culturalContext: string;
  confidence: number;
}

export interface SentimentData {
  polarity: number; // -1 to 1
  subjectivity: number; // 0 to 1
  confidence: number;
  emotionalTags: string[];
}

export interface EmotionalContext {
  primary: 'joy' | 'concern' | 'excitement' | 'focus' | 'surprise' | 'neutral' | 'empathy';
  secondary?: string;
  intensity: number;
  culturalModifier: number;
  duration: number;
}

export interface BehaviorPlan {
  handGestures: HandGesture[];
  facialExpressions: FacialExpression[];
  headMovements: HeadMovement[];
  emotionalTone: EmotionalTone;
  priority: 'low' | 'medium' | 'high';
  culturalAdaptations: CulturalAdaptation[];
}

export interface HandGesture {
  type: 'pointing' | 'counting' | 'descriptive' | 'celebratory' | 'supportive' | 'questioning';
  intensity: number;
  duration: number;
  timing: number;
  culturalVariant?: string;
  synchronizeWithSpeech: boolean;
}

export interface FacialExpression {
  type: 'smile' | 'concern' | 'excitement' | 'focus' | 'surprise' | 'neutral' | 'empathy';
  intensity: number;
  duration: number;
  timing: number;
  culturalModifier: number;
}

export interface HeadMovement {
  type: 'nod' | 'tilt' | 'shake' | 'turn' | 'emphasis';
  direction: 'up' | 'down' | 'left' | 'right' | 'forward' | 'back';
  intensity: number;
  duration: number;
  timing: number;
}

export interface EmotionalTone {
  warmth: number;
  energy: number;
  formality: number;
  empathy: number;
}

export interface CulturalAdaptation {
  gestureModification: string;
  intensityAdjustment: number;
  appropriatenessFilter: boolean;
}

export interface SpeechContext {
  language: string;
  culturalBackground: string;
  formalityLevel: 'casual' | 'formal' | 'professional';
  conversationStage: 'opening' | 'middle' | 'closing';
}

export interface BehaviorResponse {
  behaviors: BehaviorPlan;
  confidence: number;
  reasoning: string;
  alternatives: BehaviorPlan[];
}

export interface ContentClassificationResult {
  primaryType: string;
  secondaryTypes: string[];
  confidence: number;
  features: Record<string, number>;
}