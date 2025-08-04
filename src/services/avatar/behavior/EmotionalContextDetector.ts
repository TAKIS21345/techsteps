/**
 * Emotional context detection for avatar behavior control
 */

import { EmotionalContext, SentimentData, ContentClassificationResult } from './types';

export class EmotionalContextDetector {
  private emotionalKeywords: Map<string, { emotion: string; intensity: number }>;
  private contextualModifiers: Map<string, number>;

  constructor() {
    this.initializeEmotionalKeywords();
    this.initializeContextualModifiers();
  }

  /**
   * Detects emotional context from text, sentiment, and content classification
   */
  public detectEmotionalContext(
    text: string,
    sentimentData: SentimentData,
    contentClassification: ContentClassificationResult,
    culturalContext: string = 'neutral'
  ): EmotionalContext {
    const lowerText = text.toLowerCase();
    const emotionScores: Record<string, number> = {
      joy: 0,
      concern: 0,
      excitement: 0,
      focus: 0,
      surprise: 0,
      neutral: 0.5,
      empathy: 0
    };

    // Analyze emotional keywords
    for (const [keyword, data] of this.emotionalKeywords.entries()) {
      if (lowerText.includes(keyword)) {
        emotionScores[data.emotion] += data.intensity;
      }
    }

    // Apply sentiment influence
    if (sentimentData.polarity > 0.3) {
      emotionScores.joy += sentimentData.polarity * 0.8;
      emotionScores.excitement += sentimentData.polarity * 0.6;
    } else if (sentimentData.polarity < -0.3) {
      emotionScores.concern += Math.abs(sentimentData.polarity) * 0.7;
      emotionScores.empathy += Math.abs(sentimentData.polarity) * 0.5;
    }

    // Apply content type influence
    switch (contentClassification.primaryType) {
      case 'question':
        emotionScores.focus += 0.6;
        emotionScores.surprise += 0.3;
        break;
      case 'explanation':
        emotionScores.focus += 0.8;
        break;
      case 'celebration':
        emotionScores.joy += 0.9;
        emotionScores.excitement += 0.7;
        break;
      case 'instruction':
        emotionScores.focus += 0.7;
        break;
      case 'greeting':
        emotionScores.joy += 0.5;
        break;
      case 'farewell':
        emotionScores.empathy += 0.4;
        break;
    }

    // Apply contextual modifiers
    for (const [modifier, multiplier] of this.contextualModifiers.entries()) {
      if (lowerText.includes(modifier)) {
        Object.keys(emotionScores).forEach(emotion => {
          if (emotion !== 'neutral') {
            emotionScores[emotion] *= multiplier;
          }
        });
      }
    }

    // Find primary emotion
    const primary = Object.entries(emotionScores).reduce((a, b) => 
      emotionScores[a[0]] > emotionScores[b[0]] ? a : b
    )[0] as EmotionalContext['primary'];

    // Find secondary emotion (if significantly different)
    const sortedEmotions = Object.entries(emotionScores)
      .sort(([, a], [, b]) => b - a);
    
    const secondary = sortedEmotions[1] && 
      sortedEmotions[1][1] > 0.3 && 
      sortedEmotions[1][1] > sortedEmotions[0][1] * 0.6 
        ? sortedEmotions[1][0] 
        : undefined;

    // Calculate intensity
    const maxScore = Math.max(...Object.values(emotionScores));
    const intensity = Math.min(maxScore, 1);

    // Apply cultural modifier
    const culturalModifier = this.getCulturalModifier(culturalContext, primary);

    // Determine duration based on content type and intensity
    const duration = this.calculateEmotionalDuration(
      contentClassification.primaryType,
      intensity,
      text.length
    );

    return {
      primary,
      secondary,
      intensity,
      culturalModifier,
      duration
    };
  }

  /**
   * Analyzes emotional transitions in conversation
   */
  public analyzeEmotionalTransition(
    previousContext: EmotionalContext | null,
    currentContext: EmotionalContext
  ): { transitionType: string; smoothness: number } {
    if (!previousContext) {
      return { transitionType: 'initial', smoothness: 1 };
    }

    const emotionDistance = this.calculateEmotionDistance(
      previousContext.primary,
      currentContext.primary
    );

    const intensityChange = Math.abs(
      currentContext.intensity - previousContext.intensity
    );

    let transitionType: string;
    if (emotionDistance < 0.3 && intensityChange < 0.2) {
      transitionType = 'stable';
    } else if (emotionDistance < 0.5) {
      transitionType = 'gradual';
    } else {
      transitionType = 'dramatic';
    }

    const smoothness = 1 - (emotionDistance * 0.7 + intensityChange * 0.3);

    return { transitionType, smoothness: Math.max(0, smoothness) };
  }

  private getCulturalModifier(culturalContext: string, emotion: string): number {
    const culturalAdjustments: Record<string, Record<string, number>> = {
      'western': {
        joy: 1.0,
        excitement: 1.0,
        concern: 0.9,
        empathy: 0.8
      },
      'eastern': {
        joy: 0.8,
        excitement: 0.7,
        concern: 1.1,
        empathy: 1.2
      },
      'latin': {
        joy: 1.2,
        excitement: 1.3,
        concern: 1.0,
        empathy: 1.1
      }
    };

    return culturalAdjustments[culturalContext]?.[emotion] || 1.0;
  }

  private calculateEmotionalDuration(
    contentType: string,
    intensity: number,
    textLength: number
  ): number {
    const baseDuration = Math.min(textLength * 50, 3000); // 50ms per character, max 3s
    
    const typeMultipliers: Record<string, number> = {
      celebration: 1.5,
      question: 1.2,
      explanation: 1.0,
      instruction: 0.8,
      greeting: 1.3,
      farewell: 1.1
    };

    const intensityMultiplier = 0.5 + (intensity * 0.5);
    const typeMultiplier = typeMultipliers[contentType] || 1.0;

    return baseDuration * intensityMultiplier * typeMultiplier;
  }

  private calculateEmotionDistance(emotion1: string, emotion2: string): number {
    const emotionCoordinates: Record<string, [number, number]> = {
      joy: [0.8, 0.7],
      excitement: [0.9, 0.9],
      neutral: [0, 0],
      focus: [0.3, -0.2],
      concern: [-0.5, -0.3],
      empathy: [0.2, -0.6],
      surprise: [0.1, 0.8]
    };

    const coord1 = emotionCoordinates[emotion1] || [0, 0];
    const coord2 = emotionCoordinates[emotion2] || [0, 0];

    return Math.sqrt(
      Math.pow(coord1[0] - coord2[0], 2) + 
      Math.pow(coord1[1] - coord2[1], 2)
    );
  }

  private initializeEmotionalKeywords(): void {
    this.emotionalKeywords = new Map([
      // Joy keywords
      ['happy', { emotion: 'joy', intensity: 0.7 }],
      ['delighted', { emotion: 'joy', intensity: 0.8 }],
      ['pleased', { emotion: 'joy', intensity: 0.6 }],
      ['wonderful', { emotion: 'joy', intensity: 0.8 }],
      ['excellent', { emotion: 'joy', intensity: 0.7 }],
      ['great', { emotion: 'joy', intensity: 0.6 }],
      
      // Excitement keywords
      ['amazing', { emotion: 'excitement', intensity: 0.9 }],
      ['incredible', { emotion: 'excitement', intensity: 0.9 }],
      ['fantastic', { emotion: 'excitement', intensity: 0.8 }],
      ['wow', { emotion: 'excitement', intensity: 0.8 }],
      ['thrilling', { emotion: 'excitement', intensity: 0.9 }],
      
      // Concern keywords
      ['worried', { emotion: 'concern', intensity: 0.7 }],
      ['concerned', { emotion: 'concern', intensity: 0.6 }],
      ['problem', { emotion: 'concern', intensity: 0.5 }],
      ['issue', { emotion: 'concern', intensity: 0.5 }],
      ['difficult', { emotion: 'concern', intensity: 0.6 }],
      ['trouble', { emotion: 'concern', intensity: 0.7 }],
      
      // Focus keywords
      ['important', { emotion: 'focus', intensity: 0.7 }],
      ['attention', { emotion: 'focus', intensity: 0.8 }],
      ['concentrate', { emotion: 'focus', intensity: 0.8 }],
      ['focus', { emotion: 'focus', intensity: 0.9 }],
      ['carefully', { emotion: 'focus', intensity: 0.6 }],
      
      // Surprise keywords
      ['surprising', { emotion: 'surprise', intensity: 0.7 }],
      ['unexpected', { emotion: 'surprise', intensity: 0.8 }],
      ['suddenly', { emotion: 'surprise', intensity: 0.6 }],
      ['oh', { emotion: 'surprise', intensity: 0.5 }],
      
      // Empathy keywords
      ['understand', { emotion: 'empathy', intensity: 0.6 }],
      ['feel', { emotion: 'empathy', intensity: 0.5 }],
      ['sorry', { emotion: 'empathy', intensity: 0.7 }],
      ['support', { emotion: 'empathy', intensity: 0.8 }],
      ['help', { emotion: 'empathy', intensity: 0.6 }]
    ]);
  }

  private initializeContextualModifiers(): void {
    this.contextualModifiers = new Map([
      ['very', 1.3],
      ['extremely', 1.5],
      ['incredibly', 1.4],
      ['absolutely', 1.3],
      ['really', 1.2],
      ['quite', 1.1],
      ['somewhat', 0.8],
      ['slightly', 0.7],
      ['barely', 0.5]
    ]);
  }
}