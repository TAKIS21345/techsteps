/**
 * ContextualExpressionSystem - Manages context-aware facial expressions
 * Provides automatic expression selection based on content analysis
 */

import { FacialExpressionEngine } from './FacialExpressionEngine';
import {
  FacialExpression,
  EmotionalContext,
  ContentAnalysisResult,
  ContentType,
  SentimentType,
  EmotionType
} from './types';

export interface ContextualExpressionConfig {
  enableAutoExpressions: boolean;
  expressionIntensity: number; // 0.0 to 1.0
  culturalSensitivity: number; // 0.0 to 1.0
  contextSensitivity: number; // 0.0 to 1.0
  minExpressionDuration: number; // milliseconds
  maxExpressionDuration: number; // milliseconds
}

export class ContextualExpressionSystem {
  private expressionEngine: FacialExpressionEngine;
  private config: ContextualExpressionConfig;
  private currentContext: ContentAnalysisResult | null = null;
  private lastExpressionTime: number = 0;
  private expressionQueue: EmotionalContext[] = [];

  constructor(
    expressionEngine: FacialExpressionEngine,
    config?: Partial<ContextualExpressionConfig>
  ) {
    this.expressionEngine = expressionEngine;
    this.config = {
      enableAutoExpressions: true,
      expressionIntensity: 0.7,
      culturalSensitivity: 0.8,
      contextSensitivity: 0.9,
      minExpressionDuration: 1000,
      maxExpressionDuration: 5000,
      ...config
    };
  }

  /**
   * Analyze content and apply appropriate facial expression
   */
  public processContent(text: string, culturalContext: string = 'western'): void {
    if (!this.config.enableAutoExpressions) {
      return;
    }

    const analysisResult = this.analyzeContent(text, culturalContext);
    this.currentContext = analysisResult;

    const emotionalContext = this.mapContentToEmotion(analysisResult);
    const expression = this.expressionEngine.getEmotionalExpression(emotionalContext);

    console.log(`😊 Contextual expression: ${expression.type} for "${text.substring(0, 50)}..."`);
    
    this.expressionEngine.applyExpression(expression);
    this.lastExpressionTime = performance.now();
  }

  /**
   * Apply expression for positive content (smiling)
   */
  public applyPositiveExpression(intensity: number = 0.8): void {
    const emotionalContext: EmotionalContext = {
      primary: 'joy',
      intensity: intensity * this.config.expressionIntensity,
      culturalModifier: this.config.culturalSensitivity,
      duration: this.calculateExpressionDuration('positive')
    };

    const expression = this.expressionEngine.getEmotionalExpression(emotionalContext);
    this.expressionEngine.applyExpression(expression);
    
    console.log(`😊 Applied positive expression with intensity: ${intensity}`);
  }

  /**
   * Apply expression for serious/concerning content
   */
  public applyConcernExpression(intensity: number = 0.7): void {
    const emotionalContext: EmotionalContext = {
      primary: 'concern',
      intensity: intensity * this.config.expressionIntensity,
      culturalModifier: this.config.culturalSensitivity,
      duration: this.calculateExpressionDuration('concern')
    };

    const expression = this.expressionEngine.getEmotionalExpression(emotionalContext);
    this.expressionEngine.applyExpression(expression);
    
    console.log(`😟 Applied concern expression with intensity: ${intensity}`);
  }

  /**
   * Apply expression for celebratory/exciting content
   */
  public applyExcitementExpression(intensity: number = 0.9): void {
    const emotionalContext: EmotionalContext = {
      primary: 'excitement',
      intensity: intensity * this.config.expressionIntensity,
      culturalModifier: this.config.culturalSensitivity,
      duration: this.calculateExpressionDuration('excitement')
    };

    const expression = this.expressionEngine.getEmotionalExpression(emotionalContext);
    this.expressionEngine.applyExpression(expression);
    
    console.log(`🎉 Applied excitement expression with intensity: ${intensity}`);
  }  /*
*
   * Apply expression for focused/instructional content
   */
  public applyFocusExpression(intensity: number = 0.6): void {
    const emotionalContext: EmotionalContext = {
      primary: 'focus',
      intensity: intensity * this.config.expressionIntensity,
      culturalModifier: this.config.culturalSensitivity,
      duration: this.calculateExpressionDuration('focus')
    };

    const expression = this.expressionEngine.getEmotionalExpression(emotionalContext);
    this.expressionEngine.applyExpression(expression);
    
    console.log(`🎯 Applied focus expression with intensity: ${intensity}`);
  }

  /**
   * Get current contextual analysis
   */
  public getCurrentContext(): ContentAnalysisResult | null {
    return this.currentContext;
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<ContextualExpressionConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('😊 Updated contextual expression config:', newConfig);
  }

  /**
   * Reset to neutral expression
   */
  public resetToNeutral(): void {
    this.expressionEngine.resetToNeutral();
    this.currentContext = null;
  }

  // Private methods

  private analyzeContent(text: string, culturalContext: string): ContentAnalysisResult {
    // Simple content analysis - in a real implementation, this would use NLP
    const lowerText = text.toLowerCase();
    
    // Detect sentiment
    const positiveWords = ['great', 'excellent', 'wonderful', 'amazing', 'fantastic', 'good', 'happy', 'joy', 'success', 'congratulations', 'well done', 'perfect'];
    const negativeWords = ['problem', 'error', 'wrong', 'bad', 'terrible', 'awful', 'sad', 'worry', 'concern', 'difficult', 'challenge', 'issue'];
    const excitementWords = ['exciting', 'celebration', 'party', 'achievement', 'victory', 'win', 'awesome', 'incredible', 'breakthrough', 'milestone'];
    const concernWords = ['serious', 'important', 'careful', 'attention', 'warning', 'critical', 'urgent', 'significant', 'major'];

    let sentiment: SentimentType = 'neutral';
    let emotionalIntensity = 0.5;
    let contentType: ContentType = 'explanation';

    // Check for positive sentiment
    const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;
    const excitementCount = excitementWords.filter(word => lowerText.includes(word)).length;
    const concernCount = concernWords.filter(word => lowerText.includes(word)).length;

    if (excitementCount > 0) {
      sentiment = 'positive';
      contentType = 'celebration';
      emotionalIntensity = Math.min(1.0, 0.7 + (excitementCount * 0.1));
    } else if (positiveCount > negativeCount) {
      sentiment = 'positive';
      emotionalIntensity = Math.min(1.0, 0.6 + (positiveCount * 0.1));
    } else if (negativeCount > positiveCount || concernCount > 0) {
      sentiment = 'negative';
      contentType = 'concern';
      emotionalIntensity = Math.min(1.0, 0.6 + ((negativeCount + concernCount) * 0.1));
    }

    // Detect content type
    if (lowerText.includes('?')) {
      contentType = 'question';
    } else if (lowerText.includes('hello') || lowerText.includes('hi ') || lowerText.includes('welcome')) {
      contentType = 'greeting';
    } else if (lowerText.includes('goodbye') || lowerText.includes('bye') || lowerText.includes('farewell')) {
      contentType = 'farewell';
    } else if (lowerText.includes('learn') || lowerText.includes('understand') || lowerText.includes('explain')) {
      contentType = 'instruction';
    }

    // Extract key phrases (simplified)
    const keyPhrases = [
      ...positiveWords.filter(word => lowerText.includes(word)),
      ...negativeWords.filter(word => lowerText.includes(word)),
      ...excitementWords.filter(word => lowerText.includes(word)),
      ...concernWords.filter(word => lowerText.includes(word))
    ];

    return {
      sentiment,
      emotionalIntensity,
      contentType,
      keyPhrases,
      culturalContext,
      confidence: Math.min(1.0, (positiveCount + negativeCount + excitementCount + concernCount) * 0.2 + 0.3)
    };
  } 
 private mapContentToEmotion(analysis: ContentAnalysisResult): EmotionalContext {
    let primaryEmotion: EmotionType = 'neutral';
    let secondaryEmotion: EmotionType | undefined;

    // Map content type and sentiment to emotions
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
      
      case 'greeting':
        primaryEmotion = 'joy';
        break;
      
      case 'farewell':
        primaryEmotion = 'neutral';
        if (analysis.sentiment === 'positive') {
          secondaryEmotion = 'joy';
        }
        break;
      
      case 'instruction':
        primaryEmotion = 'focus';
        break;
      
      case 'question':
        primaryEmotion = 'focus';
        if (analysis.sentiment === 'positive') {
          secondaryEmotion = 'joy';
        }
        break;
      
      default:
        // Use sentiment as primary guide
        switch (analysis.sentiment) {
          case 'positive':
            primaryEmotion = 'joy';
            break;
          case 'negative':
            primaryEmotion = 'concern';
            break;
          default:
            primaryEmotion = 'neutral';
        }
    }

    // Apply cultural and context sensitivity
    const culturalModifier = this.config.culturalSensitivity;
    const contextModifier = this.config.contextSensitivity;
    
    const adjustedIntensity = analysis.emotionalIntensity * 
                             analysis.confidence * 
                             contextModifier * 
                             this.config.expressionIntensity;

    return {
      primary: primaryEmotion,
      secondary: secondaryEmotion,
      intensity: Math.min(1.0, adjustedIntensity),
      culturalModifier,
      duration: this.calculateExpressionDuration(analysis.contentType)
    };
  }

  private calculateExpressionDuration(contentType: ContentType | string): number {
    const baseDurations: Record<string, number> = {
      'celebration': 3000,
      'excitement': 2500,
      'concern': 4000,
      'greeting': 2000,
      'farewell': 2500,
      'instruction': 3500,
      'question': 2000,
      'explanation': 3000,
      'positive': 2500,
      'focus': 3500
    };

    const baseDuration = baseDurations[contentType] || 2000;
    
    // Apply random variation (±20%)
    const variation = (Math.random() - 0.5) * 0.4;
    const adjustedDuration = baseDuration * (1 + variation);
    
    // Clamp to configured limits
    return Math.max(
      this.config.minExpressionDuration,
      Math.min(this.config.maxExpressionDuration, adjustedDuration)
    );
  }

  /**
   * Dispose of the system and clean up resources
   */
  public dispose(): void {
    this.currentContext = null;
    this.expressionQueue = [];
  }
}