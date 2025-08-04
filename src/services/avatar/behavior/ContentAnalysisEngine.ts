/**
 * Real-time content analysis engine for AI behavior control
 * Integrates sentiment analysis, content classification, and emotional context detection
 */

import { ContentAnalysis, SpeechContext } from './types';
import { SentimentAnalyzer } from './SentimentAnalyzer';
import { ContentClassifier } from './ContentClassifier';
import { EmotionalContextDetector } from './EmotionalContextDetector';

export class ContentAnalysisEngine {
  private sentimentAnalyzer: SentimentAnalyzer;
  private contentClassifier: ContentClassifier;
  private emotionalContextDetector: EmotionalContextDetector;
  private analysisCache: Map<string, ContentAnalysis>;
  private cacheMaxSize: number = 100;

  constructor() {
    this.sentimentAnalyzer = new SentimentAnalyzer();
    this.contentClassifier = new ContentClassifier();
    this.emotionalContextDetector = new EmotionalContextDetector();
    this.analysisCache = new Map();
  }

  /**
   * Performs comprehensive real-time analysis of speech content
   */
  public async analyzeContent(
    text: string, 
    context: SpeechContext
  ): Promise<ContentAnalysis> {
    // Check cache first
    const cacheKey = this.generateCacheKey(text, context);
    if (this.analysisCache.has(cacheKey)) {
      return this.analysisCache.get(cacheKey)!;
    }

    // Perform parallel analysis
    const [sentimentData, contentClassification] = await Promise.all([
      Promise.resolve(this.sentimentAnalyzer.analyzeSentiment(text)),
      Promise.resolve(this.contentClassifier.classifyContent(text))
    ]);

    // Detect emotional context
    const emotionalContext = this.emotionalContextDetector.detectEmotionalContext(
      text,
      sentimentData,
      contentClassification,
      context.culturalBackground
    );

    // Extract key phrases
    const keyPhrases = this.contentClassifier.extractKeyPhrases(text);

    // Calculate overall confidence
    const confidence = this.calculateOverallConfidence(
      sentimentData.confidence,
      contentClassification.confidence,
      text.length
    );

    // Map sentiment to simplified categories
    const sentiment = this.mapSentimentToCategory(sentimentData.polarity);

    // Calculate emotional intensity
    const emotionalIntensity = this.calculateEmotionalIntensity(
      sentimentData,
      emotionalContext,
      contentClassification
    );

    const analysis: ContentAnalysis = {
      sentiment,
      emotionalIntensity,
      contentType: contentClassification.primaryType as ContentAnalysis['contentType'],
      keyPhrases,
      culturalContext: context.culturalBackground,
      confidence
    };

    // Cache the result
    this.cacheAnalysis(cacheKey, analysis);

    return analysis;
  }

  /**
   * Analyzes content in streaming mode for real-time processing
   */
  public analyzeStreamingContent(
    textChunk: string,
    previousAnalysis: ContentAnalysis | null,
    context: SpeechContext
  ): Promise<ContentAnalysis> {
    // For streaming, we need to consider the context of previous analysis
    if (previousAnalysis && textChunk.length < 20) {
      // For short chunks, blend with previous analysis
      return this.blendWithPreviousAnalysis(textChunk, previousAnalysis, context);
    }

    return this.analyzeContent(textChunk, context);
  }

  /**
   * Detects significant changes in emotional context for behavior adaptation
   */
  public detectContextualShift(
    currentAnalysis: ContentAnalysis,
    previousAnalysis: ContentAnalysis | null
  ): { hasShift: boolean; shiftIntensity: number; shiftType: string } {
    if (!previousAnalysis) {
      return { hasShift: false, shiftIntensity: 0, shiftType: 'none' };
    }

    const sentimentShift = Math.abs(
      this.getSentimentScore(currentAnalysis.sentiment) - 
      this.getSentimentScore(previousAnalysis.sentiment)
    );

    const emotionalShift = Math.abs(
      currentAnalysis.emotionalIntensity - previousAnalysis.emotionalIntensity
    );

    const contentTypeChanged = currentAnalysis.contentType !== previousAnalysis.contentType;

    const shiftIntensity = Math.max(sentimentShift, emotionalShift);
    const hasShift = shiftIntensity > 0.3 || contentTypeChanged;

    let shiftType = 'none';
    if (contentTypeChanged) {
      shiftType = 'content_type';
    } else if (sentimentShift > emotionalShift) {
      shiftType = 'sentiment';
    } else if (emotionalShift > 0.3) {
      shiftType = 'emotional_intensity';
    }

    return { hasShift, shiftIntensity, shiftType };
  }

  /**
   * Gets cultural adaptation recommendations based on analysis
   */
  public getCulturalAdaptations(analysis: ContentAnalysis): string[] {
    const adaptations: string[] = [];

    switch (analysis.culturalContext) {
      case 'eastern':
        if (analysis.sentiment === 'positive' && analysis.emotionalIntensity > 0.7) {
          adaptations.push('reduce_gesture_amplitude');
          adaptations.push('increase_bow_frequency');
        }
        if (analysis.contentType === 'question') {
          adaptations.push('add_respectful_pause');
        }
        break;

      case 'latin':
        if (analysis.emotionalIntensity > 0.5) {
          adaptations.push('increase_gesture_expressiveness');
          adaptations.push('enhance_facial_animation');
        }
        break;

      case 'western':
        if (analysis.contentType === 'instruction') {
          adaptations.push('increase_eye_contact');
          adaptations.push('add_pointing_gestures');
        }
        break;
    }

    return adaptations;
  }

  private async blendWithPreviousAnalysis(
    textChunk: string,
    previousAnalysis: ContentAnalysis,
    context: SpeechContext
  ): Promise<ContentAnalysis> {
    const chunkAnalysis = await this.analyzeContent(textChunk, context);
    
    // Blend the analyses with weighted average
    const blendWeight = 0.3; // 30% new, 70% previous for short chunks
    
    return {
      sentiment: chunkAnalysis.sentiment, // Use new sentiment
      emotionalIntensity: (
        chunkAnalysis.emotionalIntensity * blendWeight +
        previousAnalysis.emotionalIntensity * (1 - blendWeight)
      ),
      contentType: chunkAnalysis.contentType,
      keyPhrases: [
        ...previousAnalysis.keyPhrases.slice(0, 3),
        ...chunkAnalysis.keyPhrases.slice(0, 2)
      ],
      culturalContext: context.culturalBackground,
      confidence: Math.min(
        chunkAnalysis.confidence,
        previousAnalysis.confidence
      )
    };
  }

  private calculateOverallConfidence(
    sentimentConfidence: number,
    classificationConfidence: number,
    textLength: number
  ): number {
    const lengthFactor = Math.min(textLength / 50, 1); // Normalize to 50 chars
    return (
      sentimentConfidence * 0.4 +
      classificationConfidence * 0.4 +
      lengthFactor * 0.2
    );
  }

  private mapSentimentToCategory(polarity: number): 'positive' | 'negative' | 'neutral' {
    if (polarity > 0.2) return 'positive';
    if (polarity < -0.2) return 'negative';
    return 'neutral';
  }

  private calculateEmotionalIntensity(
    sentimentData: any,
    emotionalContext: any,
    contentClassification: any
  ): number {
    const sentimentIntensity = Math.abs(sentimentData.polarity);
    const emotionalIntensity = emotionalContext.intensity;
    const classificationConfidence = contentClassification.confidence;

    return Math.min(
      (sentimentIntensity * 0.4 + 
       emotionalIntensity * 0.4 + 
       classificationConfidence * 0.2),
      1
    );
  }

  private getSentimentScore(sentiment: string): number {
    switch (sentiment) {
      case 'positive': return 1;
      case 'negative': return -1;
      default: return 0;
    }
  }

  private generateCacheKey(text: string, context: SpeechContext): string {
    return `${text.substring(0, 50)}_${context.language}_${context.culturalBackground}`;
  }

  private cacheAnalysis(key: string, analysis: ContentAnalysis): void {
    if (this.analysisCache.size >= this.cacheMaxSize) {
      const firstKey = this.analysisCache.keys().next().value;
      this.analysisCache.delete(firstKey);
    }
    this.analysisCache.set(key, analysis);
  }

  /**
   * Clears the analysis cache
   */
  public clearCache(): void {
    this.analysisCache.clear();
  }

  /**
   * Gets cache statistics for monitoring
   */
  public getCacheStats(): { size: number; maxSize: number; hitRate: number } {
    return {
      size: this.analysisCache.size,
      maxSize: this.cacheMaxSize,
      hitRate: 0 // Would need to track hits/misses for actual implementation
    };
  }
}