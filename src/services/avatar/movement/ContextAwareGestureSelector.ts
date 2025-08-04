/**
 * ContextAwareGestureSelector - Advanced content analysis and gesture selection system
 * 
 * This class implements sophisticated content analysis to detect emphasis, questions,
 * and other contextual cues, then selects appropriate gestures based on speech content.
 * It includes gesture priority management and conflict resolution systems.
 * 
 * Requirements addressed:
 * - 3.1: Appropriate hand gestures or head movements to emphasize key points
 * - 3.2: Questioning gestures like slight head tilts or raised eyebrows
 * - 3.3: Explanatory gestures that support the content being delivered
 * - 3.4: Varied gestures to avoid repetitive patterns
 */

import {
  Gesture,
  MovementContext,
  EmphasisData,
  SpeechAnalysis,
  QuestionMarker,
  EmphasisWord,
  PauseMarker,
  GesturePreference,
  CulturalProfile,
  MorphTargetMapping
} from './types';

export interface ContentAnalysisResult {
  emphasisPoints: EmphasisPoint[];
  questionSegments: QuestionSegment[];
  explanatorySegments: ExplanatorySegment[];
  sentimentMarkers: SentimentMarker[];
  contextualCues: ContextualCue[];
  confidence: number;
}

export interface EmphasisPoint {
  startTime: number;
  endTime: number;
  intensity: number;
  type: 'stress' | 'volume' | 'pitch' | 'semantic';
  keywords: string[];
  suggestedGestures: string[];
}

export interface QuestionSegment {
  startTime: number;
  endTime: number;
  questionType: 'yes_no' | 'wh_question' | 'rhetorical' | 'confirmation';
  confidence: number;
  keywords: string[];
  suggestedGestures: string[];
}

export interface ExplanatorySegment {
  startTime: number;
  endTime: number;
  explanationType: 'definition' | 'process' | 'comparison' | 'example';
  complexity: 'simple' | 'moderate' | 'complex';
  suggestedGestures: string[];
}

export interface SentimentMarker {
  startTime: number;
  endTime: number;
  sentiment: 'positive' | 'negative' | 'neutral' | 'excited' | 'concerned';
  intensity: number;
  suggestedGestures: string[];
}

export interface ContextualCue {
  type: 'transition' | 'emphasis' | 'agreement' | 'disagreement' | 'uncertainty';
  startTime: number;
  confidence: number;
  suggestedGestures: string[];
}

export interface GestureSelection {
  primaryGestures: Gesture[];
  secondaryGestures: Gesture[];
  conflictResolutions: ConflictResolution[];
  totalDuration: number;
  priority: number;
}

export interface ConflictResolution {
  conflictType: 'timing_overlap' | 'intensity_conflict' | 'cultural_inappropriate' | 'motion_sensitivity';
  originalGestures: Gesture[];
  resolvedGestures: Gesture[];
  resolution: string;
}

export interface GesturePriority {
  gestureId: string;
  priority: number;
  context: string;
  culturalWeight: number;
  accessibilityWeight: number;
}

export class ContextAwareGestureSelector {
  private contentAnalyzer: ContentAnalyzer;
  private gestureDatabase: GestureDatabase;
  private priorityManager: GesturePriorityManager;
  private conflictResolver: GestureConflictResolver;
  private patternTracker: GesturePatternTracker;

  constructor() {
    this.contentAnalyzer = new ContentAnalyzer();
    this.gestureDatabase = new GestureDatabase();
    this.priorityManager = new GesturePriorityManager();
    this.conflictResolver = new GestureConflictResolver();
    this.patternTracker = new GesturePatternTracker();
  }

  /**
   * Analyzes speech content and selects contextually appropriate gestures
   */
  public selectGesturesForContent(
    speechContent: string,
    context: MovementContext,
    culturalProfile?: CulturalProfile
  ): GestureSelection {
    // Analyze content for contextual cues
    const analysisResult = this.contentAnalyzer.analyzeContent(speechContent, context);

    // Generate gesture candidates based on analysis
    const gestureCandidates = this.generateGestureCandidates(analysisResult, context);

    // Apply cultural filtering and preferences
    const culturallyFilteredGestures = this.applyCulturalFiltering(
      gestureCandidates,
      culturalProfile
    );

    // Prioritize gestures based on context and importance
    const prioritizedGestures = this.priorityManager.prioritizeGestures(
      culturallyFilteredGestures,
      analysisResult,
      context
    );

    // Resolve conflicts and overlaps
    const resolvedGestures = this.conflictResolver.resolveConflicts(
      prioritizedGestures,
      context
    );

    // Apply pattern variation to avoid repetition
    const variedGestures = this.patternTracker.applyPatternVariation(
      resolvedGestures,
      speechContent
    );

    return {
      primaryGestures: variedGestures.primary,
      secondaryGestures: variedGestures.secondary,
      conflictResolutions: resolvedGestures.resolutions,
      totalDuration: this.calculateTotalDuration(variedGestures.primary),
      priority: this.calculateOverallPriority(variedGestures.primary)
    };
  }

  /**
   * Detects emphasis points in speech content
   */
  public detectEmphasisPoints(speechContent: string, context: MovementContext): EmphasisPoint[] {
    return this.contentAnalyzer.detectEmphasis(speechContent, context);
  }

  /**
   * Detects question segments in speech content
   */
  public detectQuestionSegments(speechContent: string): QuestionSegment[] {
    return this.contentAnalyzer.detectQuestions(speechContent);
  }

  /**
   * Gets gesture recommendations for specific content types
   */
  public getGestureRecommendations(
    contentType: 'emphasis' | 'question' | 'explanation' | 'agreement',
    intensity: number = 0.7,
    culturalContext?: string
  ): Gesture[] {
    return this.gestureDatabase.getGesturesForType(contentType, intensity, culturalContext);
  }

  /**
   * Updates gesture pattern tracking to avoid repetition
   */
  public updatePatternHistory(gestures: Gesture[], timestamp: number): void {
    this.patternTracker.updateHistory(gestures, timestamp);
  }  /**

   * Generates gesture candidates based on content analysis
   */
  private generateGestureCandidates(
    analysis: ContentAnalysisResult,
    context: MovementContext
  ): Gesture[] {
    const candidates: Gesture[] = [];

    // Generate gestures for emphasis points
    analysis.emphasisPoints.forEach(point => {
      const emphasisGestures = this.gestureDatabase.getEmphasisGestures(
        point.type,
        point.intensity,
        point.keywords
      );
      candidates.push(...emphasisGestures.map(gesture => ({
        ...gesture,
        timing: point.startTime,
        duration: Math.min(gesture.duration, point.endTime - point.startTime)
      })));
    });

    // Generate gestures for questions
    analysis.questionSegments.forEach(segment => {
      const questionGestures = this.gestureDatabase.getQuestionGestures(
        segment.questionType,
        segment.confidence
      );
      candidates.push(...questionGestures.map(gesture => ({
        ...gesture,
        timing: segment.startTime,
        duration: Math.min(gesture.duration, segment.endTime - segment.startTime)
      })));
    });

    // Generate gestures for explanatory content
    analysis.explanatorySegments.forEach(segment => {
      const explanationGestures = this.gestureDatabase.getExplanationGestures(
        segment.explanationType,
        segment.complexity
      );
      candidates.push(...explanationGestures.map(gesture => ({
        ...gesture,
        timing: segment.startTime,
        duration: Math.min(gesture.duration, segment.endTime - segment.startTime)
      })));
    });

    // Generate gestures for sentiment markers
    analysis.sentimentMarkers.forEach(marker => {
      const sentimentGestures = this.gestureDatabase.getSentimentGestures(
        marker.sentiment,
        marker.intensity
      );
      candidates.push(...sentimentGestures.map(gesture => ({
        ...gesture,
        timing: marker.startTime,
        duration: Math.min(gesture.duration, marker.endTime - marker.startTime)
      })));
    });

    return candidates;
  }

  /**
   * Applies cultural filtering to gesture candidates
   */
  private applyCulturalFiltering(
    gestures: Gesture[],
    culturalProfile?: CulturalProfile
  ): Gesture[] {
    if (!culturalProfile) {
      return gestures;
    }

    return gestures.filter(gesture => {
      // Filter out culturally inappropriate gestures
      if (culturalProfile.restrictedGestures.includes(gesture.type)) {
        return false;
      }

      return true;
    }).map(gesture => {
      // Apply cultural modifications
      const preference = culturalProfile.gesturePreferences.find(
        pref => pref.gestureType === gesture.type
      );

      if (preference) {
        return {
          ...gesture,
          intensity: gesture.intensity * preference.intensity,
          culturalVariant: culturalProfile.region
        };
      }

      return {
        ...gesture,
        intensity: gesture.intensity * culturalProfile.movementAmplitude
      };
    });
  }

  /**
   * Calculates total duration of gesture sequence
   */
  private calculateTotalDuration(gestures: Gesture[]): number {
    if (gestures.length === 0) return 0;

    const lastGesture = gestures.reduce((latest, current) => 
      (current.timing + current.duration) > (latest.timing + latest.duration) ? current : latest
    );

    return lastGesture.timing + lastGesture.duration;
  }

  /**
   * Calculates overall priority of gesture sequence
   */
  private calculateOverallPriority(gestures: Gesture[]): number {
    if (gestures.length === 0) return 0;

    const totalIntensity = gestures.reduce((sum, gesture) => sum + gesture.intensity, 0);
    return Math.min(1.0, totalIntensity / gestures.length);
  }
}

/**
 * Content analyzer for detecting contextual cues in speech
 */
class ContentAnalyzer {
  private emphasisDetector: EmphasisDetector;
  private questionDetector: QuestionDetector;
  private explanationDetector: ExplanationDetector;
  private sentimentAnalyzer: SentimentAnalyzer;

  constructor() {
    this.emphasisDetector = new EmphasisDetector();
    this.questionDetector = new QuestionDetector();
    this.explanationDetector = new ExplanationDetector();
    this.sentimentAnalyzer = new SentimentAnalyzer();
  }

  public analyzeContent(speechContent: string, context: MovementContext): ContentAnalysisResult {
    const emphasisPoints = this.detectEmphasis(speechContent, context);
    const questionSegments = this.detectQuestions(speechContent);
    const explanatorySegments = this.detectExplanations(speechContent);
    const sentimentMarkers = this.detectSentiment(speechContent);
    const contextualCues = this.detectContextualCues(speechContent, context);

    const confidence = this.calculateAnalysisConfidence(
      emphasisPoints,
      questionSegments,
      explanatorySegments,
      sentimentMarkers
    );

    return {
      emphasisPoints,
      questionSegments,
      explanatorySegments,
      sentimentMarkers,
      contextualCues,
      confidence
    };
  }

  public detectEmphasis(speechContent: string, context: MovementContext): EmphasisPoint[] {
    return this.emphasisDetector.detect(speechContent, context);
  }

  public detectQuestions(speechContent: string): QuestionSegment[] {
    return this.questionDetector.detect(speechContent);
  }

  private detectExplanations(speechContent: string): ExplanatorySegment[] {
    return this.explanationDetector.detect(speechContent);
  }

  private detectSentiment(speechContent: string): SentimentMarker[] {
    return this.sentimentAnalyzer.detect(speechContent);
  }

  private detectContextualCues(speechContent: string, context: MovementContext): ContextualCue[] {
    const cues: ContextualCue[] = [];
    const words = speechContent.toLowerCase().split(/\s+/);
    let currentTime = 0;

    // Detect transition words
    const transitionWords = ['however', 'therefore', 'moreover', 'furthermore', 'in addition', 'on the other hand'];
    words.forEach((word) => {
      if (transitionWords.includes(word)) {
        cues.push({
          type: 'transition',
          startTime: currentTime,
          confidence: 0.8,
          suggestedGestures: ['head_nod', 'hand_gesture']
        });
      }
      currentTime += word.length * 80 + 50;
    });

    // Detect agreement/disagreement markers
    const agreementWords = ['yes', 'exactly', 'absolutely', 'correct', 'right'];
    const disagreementWords = ['no', 'wrong', 'incorrect', 'disagree', 'however'];

    words.forEach((word) => {
      if (agreementWords.includes(word)) {
        cues.push({
          type: 'agreement',
          startTime: currentTime,
          confidence: 0.9,
          suggestedGestures: ['head_nod', 'eyebrow_raise']
        });
      } else if (disagreementWords.includes(word)) {
        cues.push({
          type: 'disagreement',
          startTime: currentTime,
          confidence: 0.8,
          suggestedGestures: ['head_shake', 'head_tilt']
        });
      }
      currentTime += word.length * 80 + 50;
    });

    return cues;
  }

  private calculateAnalysisConfidence(
    emphasisPoints: EmphasisPoint[],
    questionSegments: QuestionSegment[],
    explanatorySegments: ExplanatorySegment[],
    sentimentMarkers: SentimentMarker[]
  ): number {
    const totalElements = emphasisPoints.length + questionSegments.length + 
                         explanatorySegments.length + sentimentMarkers.length;

    if (totalElements === 0) return 0.3; // Low confidence for empty content

    const avgConfidence = (
      emphasisPoints.reduce((sum, point) => sum + point.intensity, 0) +
      questionSegments.reduce((sum, segment) => sum + segment.confidence, 0) +
      explanatorySegments.length * 0.7 + // Moderate confidence for explanations
      sentimentMarkers.reduce((sum, marker) => sum + marker.intensity, 0)
    ) / totalElements;

    return Math.min(1.0, avgConfidence);
  }
}/**
 *
 Emphasis detector for identifying stressed words and phrases
 */
class EmphasisDetector {
  private emphasisKeywords: Set<string>;
  private intensityModifiers: Map<string, number>;

  constructor() {
    this.emphasisKeywords = new Set([
      'important', 'critical', 'essential', 'key', 'main', 'primary', 'significant',
      'crucial', 'vital', 'fundamental', 'major', 'central', 'core', 'basic',
      'remember', 'note', 'notice', 'pay attention', 'focus', 'concentrate'
    ]);

    this.intensityModifiers = new Map([
      ['very', 1.3],
      ['extremely', 1.5],
      ['really', 1.2],
      ['absolutely', 1.4],
      ['completely', 1.3],
      ['totally', 1.3],
      ['quite', 1.1],
      ['rather', 1.1]
    ]);
  }

  public detect(speechContent: string, context: MovementContext): EmphasisPoint[] {
    const points: EmphasisPoint[] = [];
    const sentences = speechContent.split(/[.!?]+/);
    let currentTime = 0;

    sentences.forEach(sentence => {
      const words = sentence.trim().toLowerCase().split(/\s+/);
      let sentenceTime = currentTime;

      words.forEach((word, index) => {
        const cleanWord = word.replace(/[^\w]/g, '');
        let intensity = 0;
        let type: 'stress' | 'volume' | 'pitch' | 'semantic' = 'semantic';
        const keywords: string[] = [];

        // Check for emphasis keywords
        if (this.emphasisKeywords.has(cleanWord)) {
          intensity += 0.7;
          keywords.push(cleanWord);
          type = 'semantic';
        }

        // Check for intensity modifiers
        if (index > 0) {
          const prevWord = words[index - 1].replace(/[^\w]/g, '');
          const modifier = this.intensityModifiers.get(prevWord);
          if (modifier) {
            intensity *= modifier;
          }
        }

        // Check for capitalization (in original text)
        const originalWords = speechContent.split(/\s+/);
        const originalWord = originalWords.find(ow => ow.toLowerCase().includes(cleanWord));
        if (originalWord && originalWord === originalWord.toUpperCase() && originalWord.length > 1) {
          intensity += 0.5;
          type = 'volume';
        }

        // Check for punctuation emphasis
        if (word.includes('!')) {
          intensity += 0.4;
          type = 'volume';
        }

        // Apply context-based emphasis
        if (context.emphasisLevel === 'high') {
          intensity *= 1.3;
        } else if (context.emphasisLevel === 'low') {
          intensity *= 0.7;
        }

        if (intensity > 0.3) {
          const wordDuration = cleanWord.length * 80;
          points.push({
            startTime: sentenceTime,
            endTime: sentenceTime + wordDuration,
            intensity: Math.min(1.0, intensity),
            type,
            keywords: keywords.length > 0 ? keywords : [cleanWord],
            suggestedGestures: this.getSuggestedGestures(intensity, type)
          });
        }

        sentenceTime += cleanWord.length * 80 + 50;
      });

      currentTime += sentence.length * 80 + 200; // Sentence pause
    });

    return points;
  }

  private getSuggestedGestures(intensity: number, type: 'stress' | 'volume' | 'pitch' | 'semantic'): string[] {
    const gestures: string[] = [];

    if (intensity > 0.8) {
      gestures.push('head_nod', 'eyebrow_raise', 'emphasis');
    } else if (intensity > 0.6) {
      gestures.push('head_nod', 'head_tilt');
    } else {
      gestures.push('head_nod');
    }

    if (type === 'volume') {
      gestures.push('head_forward');
    } else if (type === 'semantic') {
      gestures.push('eyebrow_raise');
    }

    return gestures;
  }
}

/**
 * Question detector for identifying different types of questions
 */
class QuestionDetector {
  private whWords: Set<string>;
  private yesNoIndicators: Set<string>;
  private rhetoricalIndicators: Set<string>;

  constructor() {
    this.whWords = new Set(['what', 'where', 'when', 'why', 'how', 'who', 'which', 'whose', 'whom']);
    this.yesNoIndicators = new Set(['is', 'are', 'was', 'were', 'do', 'does', 'did', 'can', 'could', 'would', 'should', 'will', 'shall']);
    this.rhetoricalIndicators = new Set(['right?', "isn't it", "don't you think", "wouldn't you say", "you know"]);
  }

  public detect(speechContent: string): QuestionSegment[] {
    const segments: QuestionSegment[] = [];
    const sentences = speechContent.split(/[.!?]+/);
    let currentTime = 0;

    sentences.forEach(sentence => {
      const trimmed = sentence.trim();
      if (trimmed.endsWith('?') || this.containsQuestionPattern(trimmed)) {
        const words = trimmed.toLowerCase().split(/\s+/);
        const duration = trimmed.length * 80;
        
        const questionType = this.classifyQuestion(trimmed);
        const confidence = this.calculateQuestionConfidence(trimmed, questionType);
        const keywords = this.extractQuestionKeywords(words);

        segments.push({
          startTime: currentTime,
          endTime: currentTime + duration,
          questionType,
          confidence,
          keywords,
          suggestedGestures: this.getSuggestedGestures(questionType, confidence)
        });
      }

      currentTime += trimmed.length * 80 + 200;
    });

    return segments;
  }

  private containsQuestionPattern(text: string): boolean {
    const words = text.toLowerCase().split(/\s+/);
    const firstWord = words[0];

    return this.whWords.has(firstWord) || 
           this.yesNoIndicators.has(firstWord) ||
           this.rhetoricalIndicators.has(text.toLowerCase());
  }

  private classifyQuestion(text: string): 'yes_no' | 'wh_question' | 'rhetorical' | 'confirmation' {
    const lowerText = text.toLowerCase();
    const words = lowerText.split(/\s+/);
    const firstWord = words[0];

    // Check for rhetorical questions
    for (const indicator of this.rhetoricalIndicators) {
      if (lowerText.includes(indicator)) {
        return 'rhetorical';
      }
    }

    // Check for WH questions
    if (this.whWords.has(firstWord)) {
      return 'wh_question';
    }

    // Check for confirmation questions
    if (lowerText.includes('correct?') || lowerText.includes('right?') || lowerText.includes('agree?')) {
      return 'confirmation';
    }

    // Default to yes/no
    return 'yes_no';
  }

  private calculateQuestionConfidence(text: string, questionType: 'yes_no' | 'wh_question' | 'rhetorical' | 'confirmation'): number {
    let confidence = 0.5;

    if (text.endsWith('?')) {
      confidence += 0.4;
    }

    const words = text.toLowerCase().split(/\s+/);
    const firstWord = words[0];

    if (questionType === 'wh_question' && this.whWords.has(firstWord)) {
      confidence += 0.3;
    } else if (questionType === 'yes_no' && this.yesNoIndicators.has(firstWord)) {
      confidence += 0.2;
    }

    return Math.min(1.0, confidence);
  }

  private extractQuestionKeywords(words: string[]): string[] {
    return words.filter(word => 
      this.whWords.has(word) || 
      this.yesNoIndicators.has(word) ||
      ['question', 'ask', 'wonder', 'curious'].includes(word)
    );
  }

  private getSuggestedGestures(
    questionType: 'yes_no' | 'wh_question' | 'rhetorical' | 'confirmation',
    confidence: number
  ): string[] {
    const gestures: string[] = [];

    switch (questionType) {
      case 'wh_question':
        gestures.push('head_tilt', 'eyebrow_raise');
        if (confidence > 0.8) {
          gestures.push('head_forward');
        }
        break;
      case 'yes_no':
        gestures.push('head_tilt', 'eyebrow_raise');
        break;
      case 'rhetorical':
        gestures.push('head_nod', 'eyebrow_raise');
        break;
      case 'confirmation':
        gestures.push('head_nod', 'head_tilt');
        break;
    }

    return gestures;
  }
}/**
 * 
Explanation detector for identifying explanatory content
 */
class ExplanationDetector {
  private definitionIndicators: Set<string>;
  private processIndicators: Set<string>;
  private comparisonIndicators: Set<string>;
  private exampleIndicators: Set<string>;

  constructor() {
    this.definitionIndicators = new Set(['is', 'means', 'refers to', 'defined as', 'definition', 'meaning']);
    this.processIndicators = new Set(['first', 'then', 'next', 'finally', 'step', 'process', 'procedure']);
    this.comparisonIndicators = new Set(['like', 'similar to', 'different from', 'compared to', 'versus', 'while']);
    this.exampleIndicators = new Set(['for example', 'such as', 'like', 'including', 'instance', 'case']);
  }

  public detect(speechContent: string): ExplanatorySegment[] {
    const segments: ExplanatorySegment[] = [];
    const sentences = speechContent.split(/[.!?]+/);
    let currentTime = 0;

    sentences.forEach(sentence => {
      const trimmed = sentence.trim().toLowerCase();
      const explanationType = this.classifyExplanation(trimmed);
      
      if (explanationType) {
        const complexity = this.assessComplexity(trimmed);
        const duration = sentence.length * 80;

        segments.push({
          startTime: currentTime,
          endTime: currentTime + duration,
          explanationType,
          complexity,
          suggestedGestures: this.getSuggestedGestures(explanationType, complexity)
        });
      }

      currentTime += sentence.length * 80 + 200;
    });

    return segments;
  }

  private classifyExplanation(text: string): 'definition' | 'process' | 'comparison' | 'example' | null {
    for (const indicator of this.definitionIndicators) {
      if (text.includes(indicator)) {
        return 'definition';
      }
    }

    for (const indicator of this.processIndicators) {
      if (text.includes(indicator)) {
        return 'process';
      }
    }

    for (const indicator of this.comparisonIndicators) {
      if (text.includes(indicator)) {
        return 'comparison';
      }
    }

    for (const indicator of this.exampleIndicators) {
      if (text.includes(indicator)) {
        return 'example';
      }
    }

    return null;
  }

  private assessComplexity(text: string): 'simple' | 'moderate' | 'complex' {
    const words = text.split(/\s+/);
    const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
    const sentenceLength = words.length;

    if (sentenceLength < 10 && avgWordLength < 5) {
      return 'simple';
    } else if (sentenceLength < 20 && avgWordLength < 7) {
      return 'moderate';
    } else {
      return 'complex';
    }
  }

  private getSuggestedGestures(
    explanationType: 'definition' | 'process' | 'comparison' | 'example',
    complexity: 'simple' | 'moderate' | 'complex'
  ): string[] {
    const gestures: string[] = [];

    switch (explanationType) {
      case 'definition':
        gestures.push('head_nod', 'hand_gesture');
        break;
      case 'process':
        gestures.push('head_nod', 'hand_gesture', 'head_turn');
        break;
      case 'comparison':
        gestures.push('head_tilt', 'hand_gesture');
        break;
      case 'example':
        gestures.push('head_nod', 'eyebrow_raise');
        break;
    }

    if (complexity === 'complex') {
      gestures.push('head_forward', 'eyebrow_raise');
    }

    return gestures;
  }
}

/**
 * Sentiment analyzer for detecting emotional content
 */
class SentimentAnalyzer {
  private positiveWords: Set<string>;
  private negativeWords: Set<string>;
  private excitedWords: Set<string>;
  private concernedWords: Set<string>;

  constructor() {
    this.positiveWords = new Set(['good', 'great', 'excellent', 'wonderful', 'amazing', 'fantastic', 'perfect', 'awesome']);
    this.negativeWords = new Set(['bad', 'terrible', 'awful', 'horrible', 'disappointing', 'wrong', 'poor', 'worst']);
    this.excitedWords = new Set(['exciting', 'thrilling', 'incredible', 'unbelievable', 'wow', 'amazing']);
    this.concernedWords = new Set(['worried', 'concerned', 'anxious', 'troubled', 'problematic', 'issue', 'problem']);
  }

  public detect(speechContent: string): SentimentMarker[] {
    const markers: SentimentMarker[] = [];
    const sentences = speechContent.split(/[.!?]+/);
    let currentTime = 0;

    sentences.forEach(sentence => {
      const words = sentence.toLowerCase().split(/\s+/);
      const sentiment = this.analyzeSentiment(words);
      const intensity = this.calculateIntensity(words, sentence);

      if (sentiment !== 'neutral' && intensity > 0.3) {
        const duration = sentence.length * 80;
        markers.push({
          startTime: currentTime,
          endTime: currentTime + duration,
          sentiment,
          intensity,
          suggestedGestures: this.getSuggestedGestures(sentiment, intensity)
        });
      }

      currentTime += sentence.length * 80 + 200;
    });

    return markers;
  }

  private analyzeSentiment(words: string[]): 'positive' | 'negative' | 'neutral' | 'excited' | 'concerned' {
    let positiveCount = 0;
    let negativeCount = 0;
    let excitedCount = 0;
    let concernedCount = 0;

    words.forEach(word => {
      if (this.positiveWords.has(word)) positiveCount++;
      if (this.negativeWords.has(word)) negativeCount++;
      if (this.excitedWords.has(word)) excitedCount++;
      if (this.concernedWords.has(word)) concernedCount++;
    });

    if (excitedCount > 0) return 'excited';
    if (concernedCount > 0) return 'concerned';
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  private calculateIntensity(words: string[], sentence: string): number {
    let intensity = 0;

    // Check for exclamation marks
    if (sentence.includes('!')) {
      intensity += 0.3;
    }

    // Check for intensity modifiers
    const intensifiers = ['very', 'extremely', 'really', 'absolutely', 'completely'];
    words.forEach(word => {
      if (intensifiers.includes(word)) {
        intensity += 0.2;
      }
    });

    // Check for capitalization
    if (sentence !== sentence.toLowerCase()) {
      intensity += 0.1;
    }

    return Math.min(1.0, intensity);
  }

  private getSuggestedGestures(
    sentiment: 'positive' | 'negative' | 'neutral' | 'excited' | 'concerned',
    intensity: number
  ): string[] {
    const gestures: string[] = [];

    switch (sentiment) {
      case 'positive':
        gestures.push('head_nod', 'eyebrow_raise');
        if (intensity > 0.7) {
          gestures.push('head_forward');
        }
        break;
      case 'negative':
        gestures.push('head_shake', 'head_tilt');
        break;
      case 'excited':
        gestures.push('head_nod', 'eyebrow_raise', 'head_forward');
        break;
      case 'concerned':
        gestures.push('head_tilt', 'eyebrow_furrow');
        break;
    }

    return gestures;
  }
}/**
 
* Gesture database for storing and retrieving gesture patterns
 */
class GestureDatabase {
  private emphasisGestures: Map<string, Gesture[]>;
  private questionGestures: Map<string, Gesture[]>;
  private explanationGestures: Map<string, Gesture[]>;
  private sentimentGestures: Map<string, Gesture[]>;

  constructor() {
    this.emphasisGestures = new Map();
    this.questionGestures = new Map();
    this.explanationGestures = new Map();
    this.sentimentGestures = new Map();
    this.initializeDatabase();
  }

  public getEmphasisGestures(type: string, intensity: number, keywords: string[]): Gesture[] {
    const baseGestures = this.emphasisGestures.get(type) || this.emphasisGestures.get('default') || [];
    return baseGestures.map(gesture => ({
      ...gesture,
      intensity: Math.min(1.0, gesture.intensity * intensity)
    }));
  }

  public getQuestionGestures(questionType: string, confidence: number): Gesture[] {
    const baseGestures = this.questionGestures.get(questionType) || this.questionGestures.get('default') || [];
    return baseGestures.map(gesture => ({
      ...gesture,
      intensity: Math.min(1.0, gesture.intensity * confidence)
    }));
  }

  public getExplanationGestures(explanationType: string, complexity: string): Gesture[] {
    const baseGestures = this.explanationGestures.get(explanationType) || this.explanationGestures.get('default') || [];
    const complexityMultiplier = complexity === 'complex' ? 1.2 : complexity === 'simple' ? 0.8 : 1.0;
    
    return baseGestures.map(gesture => ({
      ...gesture,
      intensity: Math.min(1.0, gesture.intensity * complexityMultiplier)
    }));
  }

  public getSentimentGestures(sentiment: string, intensity: number): Gesture[] {
    const baseGestures = this.sentimentGestures.get(sentiment) || this.sentimentGestures.get('neutral') || [];
    return baseGestures.map(gesture => ({
      ...gesture,
      intensity: Math.min(1.0, gesture.intensity * intensity)
    }));
  }

  public getGesturesForType(
    contentType: 'emphasis' | 'question' | 'explanation' | 'agreement',
    intensity: number,
    culturalContext?: string
  ): Gesture[] {
    let gestures: Gesture[] = [];

    switch (contentType) {
      case 'emphasis':
        gestures = this.emphasisGestures.get('semantic') || [];
        break;
      case 'question':
        gestures = this.questionGestures.get('yes_no') || [];
        break;
      case 'explanation':
        gestures = this.explanationGestures.get('definition') || [];
        break;
      case 'agreement':
        gestures = [{
          type: 'head_nod',
          intensity: 0.8,
          duration: 400,
          timing: 0,
          morphTargets: [
            { targetName: 'head_nod_agreement', weight: 0.8, blendMode: 'replace' }
          ]
        }];
        break;
    }

    return gestures.map(gesture => ({
      ...gesture,
      intensity: Math.min(1.0, gesture.intensity * intensity),
      culturalVariant: culturalContext
    }));
  }

  private initializeDatabase(): void {
    // Initialize emphasis gestures
    this.emphasisGestures.set('semantic', [
      {
        type: 'head_nod',
        intensity: 0.8,
        duration: 400,
        timing: 0,
        morphTargets: [
          { targetName: 'head_nod_emphasis', weight: 0.8, blendMode: 'replace' },
          { targetName: 'eyebrow_emphasis', weight: 0.6, blendMode: 'additive' }
        ]
      }
    ]);

    this.emphasisGestures.set('volume', [
      {
        type: 'head_forward',
        intensity: 0.7,
        duration: 300,
        timing: 0,
        morphTargets: [
          { targetName: 'head_forward_strong', weight: 0.7, blendMode: 'replace' }
        ]
      }
    ]);

    this.emphasisGestures.set('default', [
      {
        type: 'head_nod',
        intensity: 0.6,
        duration: 400,
        timing: 0,
        morphTargets: [
          { targetName: 'head_nod_default', weight: 0.6, blendMode: 'replace' }
        ]
      }
    ]);

    // Initialize question gestures
    this.questionGestures.set('wh_question', [
      {
        type: 'head_tilt',
        intensity: 0.8,
        duration: 800,
        timing: 0,
        morphTargets: [
          { targetName: 'head_tilt_curious', weight: 0.8, blendMode: 'replace' },
          { targetName: 'eyebrow_raise_both', weight: 0.7, blendMode: 'additive' }
        ]
      }
    ]);

    this.questionGestures.set('yes_no', [
      {
        type: 'head_tilt',
        intensity: 0.6,
        duration: 600,
        timing: 0,
        morphTargets: [
          { targetName: 'head_tilt_slight', weight: 0.6, blendMode: 'replace' },
          { targetName: 'eyebrow_raise_one', weight: 0.5, blendMode: 'additive' }
        ]
      }
    ]);

    this.questionGestures.set('rhetorical', [
      {
        type: 'head_nod',
        intensity: 0.4,
        duration: 500,
        timing: 0,
        morphTargets: [
          { targetName: 'head_nod_knowing', weight: 0.4, blendMode: 'replace' }
        ]
      }
    ]);

    this.questionGestures.set('default', [
      {
        type: 'head_tilt',
        intensity: 0.5,
        duration: 600,
        timing: 0,
        morphTargets: [
          { targetName: 'head_tilt_default', weight: 0.5, blendMode: 'replace' }
        ]
      }
    ]);

    // Initialize explanation gestures
    this.explanationGestures.set('definition', [
      {
        type: 'head_nod',
        intensity: 0.5,
        duration: 600,
        timing: 0,
        morphTargets: [
          { targetName: 'head_nod_gentle', weight: 0.5, blendMode: 'replace' }
        ]
      }
    ]);

    this.explanationGestures.set('process', [
      {
        type: 'head_nod',
        intensity: 0.6,
        duration: 500,
        timing: 0,
        morphTargets: [
          { targetName: 'head_nod_process', weight: 0.6, blendMode: 'replace' },
          { targetName: 'hand_gesture_point', weight: 0.4, blendMode: 'additive' }
        ]
      }
    ]);

    this.explanationGestures.set('default', [
      {
        type: 'head_nod',
        intensity: 0.4,
        duration: 600,
        timing: 0,
        morphTargets: [
          { targetName: 'head_nod_explanation', weight: 0.4, blendMode: 'replace' }
        ]
      }
    ]);

    // Initialize sentiment gestures
    this.sentimentGestures.set('positive', [
      {
        type: 'head_nod',
        intensity: 0.7,
        duration: 500,
        timing: 0,
        morphTargets: [
          { targetName: 'head_nod_positive', weight: 0.7, blendMode: 'replace' },
          { targetName: 'eyebrow_raise_slight', weight: 0.4, blendMode: 'additive' }
        ]
      }
    ]);

    this.sentimentGestures.set('excited', [
      {
        type: 'head_nod',
        intensity: 0.9,
        duration: 400,
        timing: 0,
        morphTargets: [
          { targetName: 'head_nod_excited', weight: 0.9, blendMode: 'replace' },
          { targetName: 'eyebrow_raise_both', weight: 0.8, blendMode: 'additive' },
          { targetName: 'eye_wide', weight: 0.5, blendMode: 'additive' }
        ]
      }
    ]);

    this.sentimentGestures.set('negative', [
      {
        type: 'head_shake',
        intensity: 0.6,
        duration: 600,
        timing: 0,
        morphTargets: [
          { targetName: 'head_shake_slight', weight: 0.6, blendMode: 'replace' }
        ]
      }
    ]);

    this.sentimentGestures.set('neutral', [
      {
        type: 'head_nod',
        intensity: 0.3,
        duration: 600,
        timing: 0,
        morphTargets: [
          { targetName: 'head_nod_neutral', weight: 0.3, blendMode: 'replace' }
        ]
      }
    ]);
  }
}/**
 
* Gesture priority manager for handling gesture importance and conflicts
 */
class GesturePriorityManager {
  private priorityRules: Map<string, number>;

  constructor() {
    this.priorityRules = new Map([
      ['emphasis', 0.9],
      ['question', 0.8],
      ['agreement', 0.7],
      ['explanation', 0.6],
      ['sentiment', 0.5],
      ['idle', 0.2]
    ]);
  }

  public prioritizeGestures(
    gestures: Gesture[],
    analysis: ContentAnalysisResult,
    context: MovementContext
  ): { primary: Gesture[]; secondary: Gesture[] } {
    const gesturesWithPriority = gestures.map(gesture => ({
      gesture,
      priority: this.calculateGesturePriority(gesture, analysis, context)
    }));

    // Sort by priority
    gesturesWithPriority.sort((a, b) => b.priority - a.priority);

    // Split into primary and secondary based on priority threshold
    const primaryThreshold = 0.4;
    const primary = gesturesWithPriority
      .filter(item => item.priority >= primaryThreshold)
      .map(item => item.gesture);
    
    const secondary = gesturesWithPriority
      .filter(item => item.priority < primaryThreshold)
      .map(item => item.gesture);

    return { primary, secondary };
  }

  private calculateGesturePriority(
    gesture: Gesture,
    analysis: ContentAnalysisResult,
    context: MovementContext
  ): number {
    let priority = this.priorityRules.get(gesture.type) || 0.5;

    // Boost priority based on context
    if (context.isQuestion && gesture.type.includes('tilt')) {
      priority += 0.2;
    }

    if (context.emphasisLevel === 'high' && gesture.type.includes('nod')) {
      priority += 0.15;
    }

    // Boost priority based on analysis confidence
    priority *= analysis.confidence;

    // Apply gesture intensity as a factor
    priority *= (0.5 + gesture.intensity * 0.5);

    return Math.min(1.0, priority);
  }
}

/**
 * Gesture conflict resolver for handling overlapping and conflicting gestures
 */
class GestureConflictResolver {
  public resolveConflicts(
    prioritizedGestures: { primary: Gesture[]; secondary: Gesture[] },
    context: MovementContext
  ): { primary: Gesture[]; secondary: Gesture[]; resolutions: ConflictResolution[] } {
    const resolutions: ConflictResolution[] = [];
    
    // Resolve timing overlaps in primary gestures
    const resolvedPrimary = this.resolveTimingConflicts(prioritizedGestures.primary, resolutions);
    
    // Resolve intensity conflicts
    const intensityResolvedPrimary = this.resolveIntensityConflicts(resolvedPrimary, context, resolutions);
    
    // Filter secondary gestures that don't conflict with primary
    const resolvedSecondary = this.filterConflictingSecondary(
      prioritizedGestures.secondary,
      intensityResolvedPrimary,
      resolutions
    );

    return {
      primary: intensityResolvedPrimary,
      secondary: resolvedSecondary,
      resolutions
    };
  }

  private resolveTimingConflicts(gestures: Gesture[], resolutions: ConflictResolution[]): Gesture[] {
    const resolved: Gesture[] = [];
    const sortedGestures = [...gestures].sort((a, b) => a.timing - b.timing);

    for (let i = 0; i < sortedGestures.length; i++) {
      const currentGesture = sortedGestures[i];
      const overlappingGestures = resolved.filter(gesture => 
        this.gesturesOverlap(currentGesture, gesture)
      );

      if (overlappingGestures.length === 0) {
        resolved.push(currentGesture);
      } else {
        // Resolve overlap by adjusting timing or blending
        const resolvedGesture = this.resolveOverlap(currentGesture, overlappingGestures[0]);
        resolved.push(resolvedGesture);
        
        resolutions.push({
          conflictType: 'timing_overlap',
          originalGestures: [currentGesture, overlappingGestures[0]],
          resolvedGestures: [resolvedGesture],
          resolution: 'Adjusted timing to prevent overlap'
        });
      }
    }

    return resolved;
  }

  private resolveIntensityConflicts(
    gestures: Gesture[],
    context: MovementContext,
    resolutions: ConflictResolution[]
  ): Gesture[] {
    // Apply motion sensitivity adjustments
    if (context.culturalContext && context.culturalContext !== 'neutral') {
      return gestures.map(gesture => {
        const culturalModifier = this.getCulturalIntensityModifier(context.culturalContext);
        const adjustedGesture = {
          ...gesture,
          intensity: Math.min(1.0, gesture.intensity * culturalModifier)
        };

        if (adjustedGesture.intensity !== gesture.intensity) {
          resolutions.push({
            conflictType: 'cultural_inappropriate',
            originalGestures: [gesture],
            resolvedGestures: [adjustedGesture],
            resolution: `Adjusted intensity for cultural context: ${context.culturalContext}`
          });
        }

        return adjustedGesture;
      });
    }

    return gestures;
  }

  private filterConflictingSecondary(
    secondaryGestures: Gesture[],
    primaryGestures: Gesture[],
    resolutions: ConflictResolution[]
  ): Gesture[] {
    return secondaryGestures.filter(secondary => {
      const conflicts = primaryGestures.some(primary => 
        this.gesturesOverlap(secondary, primary) || 
        this.gesturesConflict(secondary, primary)
      );

      if (conflicts) {
        resolutions.push({
          conflictType: 'timing_overlap',
          originalGestures: [secondary],
          resolvedGestures: [],
          resolution: 'Removed secondary gesture due to conflict with primary'
        });
        return false;
      }

      return true;
    });
  }

  private gesturesOverlap(gesture1: Gesture, gesture2: Gesture): boolean {
    const end1 = gesture1.timing + gesture1.duration;
    const end2 = gesture2.timing + gesture2.duration;
    
    return !(end1 <= gesture2.timing || end2 <= gesture1.timing);
  }

  private gesturesConflict(gesture1: Gesture, gesture2: Gesture): boolean {
    // Check if gestures use conflicting morph targets
    const targets1 = new Set(gesture1.morphTargets.map(t => t.targetName));
    const targets2 = new Set(gesture2.morphTargets.map(t => t.targetName));
    
    // Find intersection
    for (const target of targets1) {
      if (targets2.has(target)) {
        return true;
      }
    }

    return false;
  }

  private resolveOverlap(gesture1: Gesture, gesture2: Gesture): Gesture {
    // Simple resolution: adjust timing of the later gesture
    if (gesture1.timing > gesture2.timing) {
      return {
        ...gesture1,
        timing: gesture2.timing + gesture2.duration + 50 // 50ms gap
      };
    }

    return gesture1;
  }

  private getCulturalIntensityModifier(culturalContext: string): number {
    const modifiers: Record<string, number> = {
      'western': 1.0,
      'eastern': 0.7,
      'mediterranean': 1.2,
      'nordic': 0.8
    };

    return modifiers[culturalContext] || 1.0;
  }
}

/**
 * Gesture pattern tracker for avoiding repetitive movements
 */
class GesturePatternTracker {
  private recentGestures: Array<{ gesture: Gesture; timestamp: number }>;
  private patternHistory: Map<string, number>;
  private maxHistorySize: number;
  private repetitionThreshold: number;

  constructor() {
    this.recentGestures = [];
    this.patternHistory = new Map();
    this.maxHistorySize = 20;
    this.repetitionThreshold = 3;
  }

  public applyPatternVariation(
    resolvedGestures: { primary: Gesture[]; secondary: Gesture[] },
    speechContent: string
  ): { primary: Gesture[]; secondary: Gesture[] } {
    const currentTime = Date.now();
    
    // Clean old history
    this.cleanHistory(currentTime);

    // Apply variation to primary gestures
    const variedPrimary = this.varyGestures(resolvedGestures.primary, speechContent);
    
    // Apply variation to secondary gestures
    const variedSecondary = this.varyGestures(resolvedGestures.secondary, speechContent);

    return {
      primary: variedPrimary,
      secondary: variedSecondary
    };
  }

  public updateHistory(gestures: Gesture[], timestamp: number): void {
    gestures.forEach(gesture => {
      this.recentGestures.push({ gesture, timestamp });
      
      const patternKey = this.getPatternKey(gesture);
      const count = this.patternHistory.get(patternKey) || 0;
      this.patternHistory.set(patternKey, count + 1);
    });

    // Limit history size
    if (this.recentGestures.length > this.maxHistorySize) {
      this.recentGestures = this.recentGestures.slice(-this.maxHistorySize);
    }
  }

  private varyGestures(gestures: Gesture[], speechContent: string): Gesture[] {
    return gestures.map(gesture => {
      const patternKey = this.getPatternKey(gesture);
      const recentCount = this.patternHistory.get(patternKey) || 0;

      if (recentCount >= this.repetitionThreshold) {
        return this.createVariation(gesture, speechContent);
      }

      return gesture;
    });
  }

  private createVariation(gesture: Gesture, speechContent: string): Gesture {
    // Create a variation by adjusting intensity, duration, or type
    const variations = this.getGestureVariations(gesture.type);
    
    if (variations.length > 0) {
      const randomVariation = variations[Math.floor(Math.random() * variations.length)];
      return {
        ...gesture,
        type: randomVariation,
        intensity: gesture.intensity * (0.8 + Math.random() * 0.4), // ±20% variation
        duration: Math.round(gesture.duration * (0.9 + Math.random() * 0.2)) // ±10% variation
      };
    }

    // If no variations available, just adjust intensity and duration
    return {
      ...gesture,
      intensity: Math.min(1.0, gesture.intensity * (0.8 + Math.random() * 0.4)),
      duration: Math.round(gesture.duration * (0.9 + Math.random() * 0.2))
    };
  }

  private getPatternKey(gesture: Gesture): string {
    return `${gesture.type}_${Math.round(gesture.intensity * 10)}`;
  }

  private getGestureVariations(gestureType: string): string[] {
    const variations: Record<string, string[]> = {
      'head_nod': ['head_tilt', 'eyebrow_raise'],
      'head_tilt': ['head_nod', 'head_turn'],
      'eyebrow_raise': ['head_nod', 'head_tilt'],
      'emphasis': ['head_nod', 'head_forward']
    };

    return variations[gestureType] || [];
  }

  private cleanHistory(currentTime: number): void {
    const maxAge = 30000; // 30 seconds
    this.recentGestures = this.recentGestures.filter(
      item => currentTime - item.timestamp < maxAge
    );

    // Reset pattern counts for old patterns
    this.patternHistory.clear();
    this.recentGestures.forEach(item => {
      const patternKey = this.getPatternKey(item.gesture);
      const count = this.patternHistory.get(patternKey) || 0;
      this.patternHistory.set(patternKey, count + 1);
    });
  }
}