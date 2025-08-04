/**
 * AIBehaviorExpressionIntegrator - Integrates facial expressions with AI behavior controller
 * Provides automatic expression selection based on AI content analysis and sentiment
 */

import { FacialExpressionEngine } from './FacialExpressionEngine';
import { ContextualExpressionSystem } from './ContextualExpressionSystem';
import {
  FacialExpression,
  EmotionalContext,
  ContentAnalysisResult,
  SentimentType,
  ContentType
} from './types';

// Import behavior controller types
interface AIContentAnalysis {
  sentiment: 'positive' | 'negative' | 'neutral';
  emotionalIntensity: number;
  contentType: 'question' | 'explanation' | 'instruction' | 'celebration' | 'concern';
  keyPhrases: string[];
  confidence: number;
}

interface AIBehaviorContext {
  culturalRegion: string;
  language: string;
  formalityLevel: 'formal' | 'informal' | 'casual';
  conversationState: 'greeting' | 'teaching' | 'responding' | 'farewell';
  previousExpressions: string[];
}

export interface ExpressionIntegrationConfig {
  enableAutoExpressions: boolean;
  expressionIntensityScale: number; // 0.0 to 2.0
  culturalSensitivity: number; // 0.0 to 1.0
  sentimentThreshold: number; // Minimum confidence to trigger expression
  expressionCooldown: number; // Milliseconds between expressions
  blendWithSpeech: boolean; // Whether to blend with lip sync
}

export class AIBehaviorExpressionIntegrator {
  private expressionEngine: FacialExpressionEngine;
  private contextualSystem: ContextualExpressionSystem;
  private config: ExpressionIntegrationConfig;
  private lastExpressionTime: number = 0;
  private currentExpression: FacialExpression | null = null;
  private expressionHistory: Array<{ expression: string; timestamp: number }> = [];

  constructor(
    expressionEngine: FacialExpressionEngine,
    contextualSystem: ContextualExpressionSystem,
    config?: Partial<ExpressionIntegrationConfig>
  ) {
    this.expressionEngine = expressionEngine;
    this.contextualSystem = contextualSystem;
    this.config = {
      enableAutoExpressions: true,
      expressionIntensityScale: 1.0,
      culturalSensitivity: 0.8,
      sentimentThreshold: 0.6,
      expressionCooldown: 2000,
      blendWithSpeech: true,
      ...config
    };
  }

  /**
   * Process AI content analysis and apply appropriate facial expression
   */
  public processAIContentAnalysis(
    analysis: AIContentAnalysis,
    behaviorContext: AIBehaviorContext,
    textContent: string
  ): void {
    if (!this.config.enableAutoExpressions) {
      return;
    }

    // Check cooldown period
    const currentTime = performance.now();
    if (currentTime - this.lastExpressionTime < this.config.expressionCooldown) {
      console.log('😊 Expression cooldown active, skipping');
      return;
    }

    // Check confidence threshold
    if (analysis.confidence < this.config.sentimentThreshold) {
      console.log(`😊 Analysis confidence too low: ${analysis.confidence}`);
      return;
    }

    // Map AI analysis to emotional context
    const emotionalContext = this.mapAIAnalysisToEmotion(analysis, behaviorContext);
    
    // Apply cultural and behavioral context modifications
    const culturallyAdjustedContext = this.applyCulturalAdjustments(
      emotionalContext,
      behaviorContext
    );

    // Generate and apply expression
    const expression = this.expressionEngine.getEmotionalExpression(culturallyAdjustedContext);
    this.applyExpressionWithContext(expression, behaviorContext, textContent);

    // Update history
    this.updateExpressionHistory(expression.type, currentTime);
    this.lastExpressionTime = currentTime;

    console.log(`😊 AI-triggered expression: ${expression.type} (intensity: ${expression.intensity.toFixed(2)})`);
  }

  /**
   * Apply expression based on AI sentiment analysis
   */
  public applyAISentimentExpression(
    sentiment: SentimentType,
    intensity: number,
    culturalContext: string,
    textContent: string
  ): void {
    const emotionalContext: EmotionalContext = {
      primary: this.mapSentimentToEmotion(sentiment),
      intensity: intensity * this.config.expressionIntensityScale,
      culturalModifier: this.config.culturalSensitivity,
      duration: this.calculateExpressionDuration(sentiment, intensity)
    };

    const expression = this.expressionEngine.getEmotionalExpression(emotionalContext);
    this.expressionEngine.applyExpression(expression);

    console.log(`😊 AI sentiment expression: ${expression.type} for sentiment: ${sentiment}`);
  }

  /**
   * Apply expression with automatic intensity scaling based on emotional context
   */
  public applyContextualExpression(
    emotionType: string,
    baseIntensity: number,
    behaviorContext: AIBehaviorContext,
    textContent: string
  ): void {
    // Calculate intensity scaling based on context
    const contextualIntensity = this.calculateContextualIntensity(
      baseIntensity,
      behaviorContext,
      textContent
    );

    // Apply cultural sensitivity
    const culturalModifier = this.getCulturalModifier(
      behaviorContext.culturalRegion,
      emotionType
    );

    const emotionalContext: EmotionalContext = {
      primary: emotionType as any,
      intensity: contextualIntensity,
      culturalModifier,
      duration: this.calculateContextualDuration(emotionType, behaviorContext)
    };

    const expression = this.expressionEngine.getEmotionalExpression(emotionalContext);
    this.applyExpressionWithContext(expression, behaviorContext, textContent);

    console.log(`😊 Contextual expression: ${expression.type} (scaled intensity: ${contextualIntensity.toFixed(2)})`);
  } 
 /**
   * Connect facial expressions to AI content analysis pipeline
   */
  public connectToAIAnalysisPipeline(
    analysisCallback: (text: string) => Promise<AIContentAnalysis>,
    behaviorContextProvider: () => AIBehaviorContext
  ): void {
    // This method would be called by the AI behavior controller
    // to establish the connection between content analysis and expressions
    console.log('😊 Connected facial expressions to AI analysis pipeline');
  }

  /**
   * Get current expression state for AI behavior coordination
   */
  public getCurrentExpressionState(): {
    currentExpression: string | null;
    isTransitioning: boolean;
    intensity: number;
    remainingDuration: number;
  } {
    const current = this.expressionEngine.getCurrentExpression();
    return {
      currentExpression: current?.type || null,
      isTransitioning: this.expressionEngine.isTransitioning(),
      intensity: current?.intensity || 0,
      remainingDuration: current?.duration || 0
    };
  }

  /**
   * Coordinate expressions with other AI behaviors (gestures, movements)
   */
  public coordinateWithAIBehaviors(
    gestureIntensity: number,
    movementIntensity: number,
    speechIntensity: number
  ): void {
    // Adjust expression intensity based on other behaviors to avoid overwhelming
    const totalBehaviorIntensity = gestureIntensity + movementIntensity + speechIntensity;
    
    if (totalBehaviorIntensity > 2.0 && this.currentExpression) {
      // Reduce expression intensity if other behaviors are very active
      const adjustedExpression = {
        ...this.currentExpression,
        intensity: this.currentExpression.intensity * 0.7
      };
      
      this.expressionEngine.applyExpression(adjustedExpression);
      console.log('😊 Adjusted expression intensity for behavior coordination');
    }
  }

  /**
   * Update configuration for AI behavior integration
   */
  public updateIntegrationConfig(newConfig: Partial<ExpressionIntegrationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Update contextual system config as well
    this.contextualSystem.updateConfig({
      enableAutoExpressions: this.config.enableAutoExpressions,
      expressionIntensity: this.config.expressionIntensityScale,
      culturalSensitivity: this.config.culturalSensitivity
    });

    console.log('😊 Updated AI behavior expression integration config');
  }

  /**
   * Reset expressions and clear history
   */
  public reset(): void {
    this.expressionEngine.resetToNeutral();
    this.contextualSystem.resetToNeutral();
    this.currentExpression = null;
    this.expressionHistory = [];
    this.lastExpressionTime = 0;
    
    console.log('😊 Reset AI behavior expression integrator');
  }

  // Private methods

  private mapAIAnalysisToEmotion(
    analysis: AIContentAnalysis,
    behaviorContext: AIBehaviorContext
  ): EmotionalContext {
    let primaryEmotion: string = 'neutral';
    let secondaryEmotion: string | undefined;

    // Map content type to primary emotion
    switch (analysis.contentType) {
      case 'celebration':
        primaryEmotion = 'excitement';
        if (analysis.sentiment === 'positive') {
          secondaryEmotion = 'joy';
        }
        break;
      
      case 'concern':
        primaryEmotion = 'concern';
        break;
      
      case 'question':
        primaryEmotion = 'focus';
        if (analysis.sentiment === 'positive') {
          secondaryEmotion = 'joy';
        }
        break;
      
      case 'explanation':
        primaryEmotion = 'focus';
        break;
      
      case 'instruction':
        primaryEmotion = 'focus';
        break;
      
      default:
        // Use sentiment as fallback
        primaryEmotion = this.mapSentimentToEmotion(analysis.sentiment);
    }

    return {
      primary: primaryEmotion as any,
      secondary: secondaryEmotion as any,
      intensity: analysis.emotionalIntensity * this.config.expressionIntensityScale,
      culturalModifier: this.config.culturalSensitivity
    };
  }

  private applyCulturalAdjustments(
    emotionalContext: EmotionalContext,
    behaviorContext: AIBehaviorContext
  ): EmotionalContext {
    const culturalModifier = this.getCulturalModifier(
      behaviorContext.culturalRegion,
      emotionalContext.primary
    );

    const formalityAdjustment = this.getFormalityAdjustment(
      behaviorContext.formalityLevel,
      emotionalContext.primary
    );

    return {
      ...emotionalContext,
      intensity: Math.min(1.0, emotionalContext.intensity * formalityAdjustment),
      culturalModifier: culturalModifier * this.config.culturalSensitivity
    };
  }  p
rivate applyExpressionWithContext(
    expression: FacialExpression,
    behaviorContext: AIBehaviorContext,
    textContent: string
  ): void {
    // Check if we should avoid repeating recent expressions
    if (this.shouldAvoidRepetition(expression.type)) {
      console.log(`😊 Avoiding repetition of ${expression.type}, using neutral instead`);
      this.expressionEngine.resetToNeutral();
      return;
    }

    // Apply the expression
    this.expressionEngine.applyExpression(expression);
    this.currentExpression = expression;

    // If blending with speech is enabled, coordinate with lip sync
    if (this.config.blendWithSpeech) {
      this.coordinateWithSpeech(expression, textContent);
    }
  }

  private shouldAvoidRepetition(expressionType: string): boolean {
    const recentExpressions = this.expressionHistory
      .filter(entry => performance.now() - entry.timestamp < 10000) // Last 10 seconds
      .map(entry => entry.expression);

    // Avoid if same expression used more than twice recently
    const recentCount = recentExpressions.filter(expr => expr === expressionType).length;
    return recentCount >= 2;
  }

  private coordinateWithSpeech(expression: FacialExpression, textContent: string): void {
    // Adjust expression timing to coordinate with speech patterns
    const speechDuration = this.estimateSpeechDuration(textContent);
    
    if (speechDuration > 0) {
      const adjustedExpression = {
        ...expression,
        duration: Math.min(expression.duration, speechDuration * 1.2) // Slightly longer than speech
      };
      
      this.expressionEngine.applyExpression(adjustedExpression);
    }
  }

  private estimateSpeechDuration(text: string): number {
    // Rough estimation: ~150 words per minute
    const wordCount = text.split(' ').length;
    const wordsPerMinute = 150;
    return (wordCount / wordsPerMinute) * 60 * 1000; // Convert to milliseconds
  }

  private mapSentimentToEmotion(sentiment: SentimentType): string {
    switch (sentiment) {
      case 'positive':
        return 'joy';
      case 'negative':
        return 'concern';
      default:
        return 'neutral';
    }
  }

  private calculateContextualIntensity(
    baseIntensity: number,
    behaviorContext: AIBehaviorContext,
    textContent: string
  ): number {
    let intensity = baseIntensity * this.config.expressionIntensityScale;

    // Adjust based on conversation state
    switch (behaviorContext.conversationState) {
      case 'greeting':
        intensity *= 1.2; // More expressive for greetings
        break;
      case 'teaching':
        intensity *= 0.9; // Slightly more subdued for teaching
        break;
      case 'farewell':
        intensity *= 1.1; // Warm for farewells
        break;
    }

    // Adjust based on text characteristics
    if (textContent.includes('!')) {
      intensity *= 1.3; // More intense for exclamations
    }
    
    if (textContent.includes('?')) {
      intensity *= 1.1; // Slightly more expressive for questions
    }

    return Math.min(1.0, intensity);
  }

  private getCulturalModifier(culturalRegion: string, emotionType: string): number {
    const culturalModifiers: Record<string, Record<string, number>> = {
      'western': {
        'joy': 1.0,
        'concern': 1.0,
        'excitement': 1.0,
        'focus': 1.0,
        'neutral': 1.0
      },
      'eastern': {
        'joy': 0.8,
        'concern': 0.9,
        'excitement': 0.7,
        'focus': 1.0,
        'neutral': 1.0
      },
      'mediterranean': {
        'joy': 1.2,
        'concern': 1.1,
        'excitement': 1.3,
        'focus': 1.0,
        'neutral': 1.0
      },
      'nordic': {
        'joy': 0.9,
        'concern': 0.8,
        'excitement': 0.8,
        'focus': 1.0,
        'neutral': 1.0
      }
    };

    return culturalModifiers[culturalRegion]?.[emotionType] || 1.0;
  }

  private getFormalityAdjustment(formalityLevel: string, emotionType: string): number {
    const formalityAdjustments: Record<string, number> = {
      'formal': 0.7,
      'informal': 1.0,
      'casual': 1.2
    };

    let adjustment = formalityAdjustments[formalityLevel] || 1.0;

    // Some emotions are less affected by formality
    if (emotionType === 'focus' || emotionType === 'neutral') {
      adjustment = Math.max(0.9, adjustment);
    }

    return adjustment;
  }

  private calculateExpressionDuration(sentiment: SentimentType, intensity: number): number {
    const baseDurations: Record<SentimentType, number> = {
      'positive': 2500,
      'negative': 3500,
      'neutral': 2000
    };

    const baseDuration = baseDurations[sentiment];
    const intensityMultiplier = 0.5 + (intensity * 0.5); // 0.5 to 1.0 range

    return baseDuration * intensityMultiplier;
  }

  private calculateContextualDuration(emotionType: string, behaviorContext: AIBehaviorContext): number {
    const baseDurations: Record<string, number> = {
      'joy': 2500,
      'concern': 3500,
      'excitement': 2000,
      'focus': 4000,
      'neutral': 2000
    };

    let duration = baseDurations[emotionType] || 2000;

    // Adjust based on conversation state
    switch (behaviorContext.conversationState) {
      case 'greeting':
        duration *= 0.8; // Shorter for greetings
        break;
      case 'teaching':
        duration *= 1.2; // Longer for teaching
        break;
    }

    return duration;
  }

  private updateExpressionHistory(expressionType: string, timestamp: number): void {
    this.expressionHistory.push({ expression: expressionType, timestamp });
    
    // Keep only recent history (last 30 seconds)
    const cutoffTime = timestamp - 30000;
    this.expressionHistory = this.expressionHistory.filter(
      entry => entry.timestamp > cutoffTime
    );
  }

  /**
   * Dispose of the integrator and clean up resources
   */
  public dispose(): void {
    this.currentExpression = null;
    this.expressionHistory = [];
    this.lastExpressionTime = 0;
  }
}