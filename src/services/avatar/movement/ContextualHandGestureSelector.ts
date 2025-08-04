/**
 * ContextualHandGestureSelector - Context-aware hand gesture selection system
 * 
 * This class analyzes speech content and context to select appropriate hand gestures
 * including pointing for explanatory content, counting for numerical content,
 * and descriptive movements for spatial concepts.
 * 
 * Requirements addressed:
 * - 4.1: Appropriate hand gestures like pointing, counting, or descriptive movements
 * - 4.4: Context-aware gesture selection based on speech content
 */

import { MovementContext, CulturalProfile, MotionSettings } from './types';
import { HandGesture, HandGestureEngine } from './HandGestureEngine';

export interface ContextualGestureAnalysis {
  gestureType: string;
  confidence: number;
  triggers: string[];
  timing: GestureTiming[];
  intensity: number;
  culturalAdaptation: string[];
}

export interface GestureTiming {
  startTime: number; // milliseconds from speech start
  duration: number;
  gestureId: string;
  priority: number;
}

export interface SpatialConcept {
  type: 'size' | 'shape' | 'direction' | 'distance' | 'position';
  value: string;
  confidence: number;
  suggestedGesture: string;
}

export interface NumericalContent {
  numbers: number[];
  contexts: string[];
  countingOpportunities: CountingOpportunity[];
}

export interface CountingOpportunity {
  number: number;
  context: string;
  startTime: number;
  confidence: number;
}

export interface ExplanatoryContent {
  concepts: string[];
  pointingTargets: PointingTarget[];
  demonstrationNeeds: DemonstrationNeed[];
}

export interface PointingTarget {
  concept: string;
  direction: 'forward' | 'left' | 'right' | 'up' | 'down';
  intensity: number;
  timing: number;
}

export interface DemonstrationNeed {
  concept: string;
  gestureType: 'descriptive' | 'comparative' | 'sequential';
  complexity: 'simple' | 'moderate' | 'complex';
}

export class ContextualHandGestureSelector {
  private handGestureEngine: HandGestureEngine;
  private motionSettings: MotionSettings;
  private culturalProfile: CulturalProfile;
  private contentAnalyzer: ContentAnalyzer;
  private gestureMapper: GestureMapper;
  private timingCalculator: TimingCalculator;

  constructor(
    handGestureEngine: HandGestureEngine,
    motionSettings: MotionSettings,
    culturalProfile: CulturalProfile
  ) {
    this.handGestureEngine = handGestureEngine;
    this.motionSettings = motionSettings;
    this.culturalProfile = culturalProfile;
    this.contentAnalyzer = new ContentAnalyzer();
    this.gestureMapper = new GestureMapper();
    this.timingCalculator = new TimingCalculator();
  }

  /**
   * Analyzes speech content and selects appropriate contextual gestures
   */
  public selectContextualGestures(
    speechContent: string,
    context: MovementContext,
    speechDuration: number
  ): ContextualGestureAnalysis[] {
    console.log('🤲 Analyzing speech content for contextual gestures:', speechContent);

    const analyses: ContextualGestureAnalysis[] = [];

    // Analyze for pointing gestures (explanatory content)
    const pointingAnalysis = this.analyzeForPointingGestures(speechContent, context);
    if (pointingAnalysis) {
      analyses.push(pointingAnalysis);
    }

    // Analyze for counting gestures (numerical content)
    const countingAnalysis = this.analyzeForCountingGestures(speechContent, context);
    if (countingAnalysis.length > 0) {
      analyses.push(...countingAnalysis);
    }

    // Analyze for descriptive gestures (spatial concepts)
    const descriptiveAnalysis = this.analyzeForDescriptiveGestures(speechContent, context);
    if (descriptiveAnalysis.length > 0) {
      analyses.push(...descriptiveAnalysis);
    }

    // Calculate timing for all gestures
    analyses.forEach(analysis => {
      analysis.timing = this.timingCalculator.calculateGestureTiming(
        analysis,
        speechContent,
        speechDuration
      );
    });

    // Apply cultural adaptations
    this.applyCulturalAdaptations(analyses);

    console.log(`🤲 Selected ${analyses.length} contextual gestures`);
    return analyses;
  }

  /**
   * Executes selected contextual gestures
   */
  public executeContextualGestures(analyses: ContextualGestureAnalysis[]): void {
    analyses.forEach(analysis => {
      analysis.timing.forEach(timing => {
        setTimeout(() => {
          this.handGestureEngine.startGesture(
            timing.gestureId,
            this.createGestureContext(analysis),
            analysis.intensity
          );
        }, timing.startTime);
      });
    });
  }

  /**
   * Analyzes content for pointing gesture opportunities
   */
  private analyzeForPointingGestures(
    speechContent: string,
    context: MovementContext
  ): ContextualGestureAnalysis | null {
    const explanatoryContent = this.contentAnalyzer.analyzeExplanatoryContent(speechContent);
    
    if (explanatoryContent.pointingTargets.length === 0) {
      return null;
    }

    const triggers = this.extractPointingTriggers(speechContent);
    if (triggers.length === 0) {
      return null;
    }

    return {
      gestureType: 'pointing',
      confidence: this.calculatePointingConfidence(explanatoryContent, context),
      triggers,
      timing: [], // Will be calculated later
      intensity: this.calculatePointingIntensity(context),
      culturalAdaptation: []
    };
  }

  /**
   * Analyzes content for counting gesture opportunities
   */
  private analyzeForCountingGestures(
    speechContent: string,
    context: MovementContext
  ): ContextualGestureAnalysis[] {
    const numericalContent = this.contentAnalyzer.analyzeNumericalContent(speechContent);
    const analyses: ContextualGestureAnalysis[] = [];

    numericalContent.countingOpportunities.forEach(opportunity => {
      if (opportunity.number >= 1 && opportunity.number <= 5 && opportunity.confidence > 0.6) {
        analyses.push({
          gestureType: `counting_${opportunity.number}`,
          confidence: opportunity.confidence,
          triggers: [opportunity.context],
          timing: [], // Will be calculated later
          intensity: this.calculateCountingIntensity(opportunity.number, context),
          culturalAdaptation: []
        });
      }
    });

    return analyses;
  }

  /**
   * Analyzes content for descriptive gesture opportunities
   */
  private analyzeForDescriptiveGestures(
    speechContent: string,
    context: MovementContext
  ): ContextualGestureAnalysis[] {
    const spatialConcepts = this.contentAnalyzer.analyzeSpatialConcepts(speechContent);
    const analyses: ContextualGestureAnalysis[] = [];

    spatialConcepts.forEach(concept => {
      if (concept.confidence > 0.5) {
        analyses.push({
          gestureType: concept.suggestedGesture,
          confidence: concept.confidence,
          triggers: [concept.value],
          timing: [], // Will be calculated later
          intensity: this.calculateDescriptiveIntensity(concept, context),
          culturalAdaptation: []
        });
      }
    });

    return analyses;
  }

  /**
   * Extracts pointing triggers from speech content
   */
  private extractPointingTriggers(speechContent: string): string[] {
    const pointingKeywords = [
      'this', 'that', 'here', 'there', 'look at', 'see this', 'notice',
      'observe', 'check out', 'focus on', 'pay attention to', 'consider',
      'examine', 'over here', 'over there', 'right here', 'right there',
      'for example', 'such as', 'like this', 'as shown', 'demonstrated'
    ];

    const triggers: string[] = [];
    const lowerContent = speechContent.toLowerCase();

    pointingKeywords.forEach(keyword => {
      if (lowerContent.includes(keyword)) {
        triggers.push(keyword);
      }
    });

    return triggers;
  }

  /**
   * Calculates pointing gesture confidence
   */
  private calculatePointingConfidence(
    explanatoryContent: ExplanatoryContent,
    context: MovementContext
  ): number {
    let confidence = 0.3; // Base confidence

    // Increase confidence for explanatory context
    if (context.isExplanation) {
      confidence += 0.4;
    }

    // Increase confidence based on pointing targets
    confidence += Math.min(0.3, explanatoryContent.pointingTargets.length * 0.1);

    // Increase confidence for educational content
    if (explanatoryContent.concepts.length > 0) {
      confidence += 0.2;
    }

    return Math.min(1.0, confidence);
  }

  /**
   * Calculates pointing gesture intensity
   */
  private calculatePointingIntensity(context: MovementContext): number {
    let intensity = 0.7; // Base intensity

    // Adjust for emphasis level
    switch (context.emphasisLevel) {
      case 'high':
        intensity = 0.9;
        break;
      case 'medium':
        intensity = 0.7;
        break;
      case 'low':
        intensity = 0.5;
        break;
    }

    // Apply motion settings
    intensity *= this.motionSettings.customIntensityScale;

    // Apply cultural modifications
    intensity *= this.culturalProfile.movementAmplitude;

    return Math.min(1.0, intensity);
  }

  /**
   * Calculates counting gesture intensity
   */
  private calculateCountingIntensity(number: number, context: MovementContext): number {
    let intensity = 0.6 + (number * 0.05); // Slightly more intense for higher numbers

    // Adjust for emphasis level
    switch (context.emphasisLevel) {
      case 'high':
        intensity *= 1.2;
        break;
      case 'low':
        intensity *= 0.8;
        break;
    }

    // Apply motion settings
    intensity *= this.motionSettings.customIntensityScale;

    return Math.min(1.0, intensity);
  }

  /**
   * Calculates descriptive gesture intensity
   */
  private calculateDescriptiveIntensity(
    concept: SpatialConcept,
    context: MovementContext
  ): number {
    let intensity = 0.5 + (concept.confidence * 0.3);

    // Adjust based on concept type
    switch (concept.type) {
      case 'size':
        intensity += 0.1;
        break;
      case 'shape':
        intensity += 0.15;
        break;
      case 'direction':
        intensity += 0.2;
        break;
    }

    // Apply motion settings
    intensity *= this.motionSettings.customIntensityScale;

    return Math.min(1.0, intensity);
  }

  /**
   * Applies cultural adaptations to gesture analyses
   */
  private applyCulturalAdaptations(analyses: ContextualGestureAnalysis[]): void {
    analyses.forEach(analysis => {
      // Check for culturally restricted gestures
      if (this.culturalProfile.restrictedGestures.includes(analysis.gestureType)) {
        analysis.confidence *= 0.3; // Reduce confidence for restricted gestures
        analysis.culturalAdaptation.push('gesture_restricted');
      }

      // Apply cultural gesture preferences
      const preference = this.culturalProfile.gesturePreferences.find(
        p => p.gestureType === analysis.gestureType
      );

      if (preference) {
        analysis.intensity *= preference.intensity;
        analysis.culturalAdaptation.push('intensity_adjusted');
      }

      // Apply regional modifications
      switch (this.culturalProfile.region) {
        case 'eastern':
          analysis.intensity *= 0.7; // More subtle gestures
          analysis.culturalAdaptation.push('eastern_subtlety');
          break;
        case 'mediterranean':
          analysis.intensity *= 1.2; // More expressive gestures
          analysis.culturalAdaptation.push('mediterranean_expressiveness');
          break;
        case 'nordic':
          analysis.intensity *= 0.8; // Reserved gestures
          analysis.culturalAdaptation.push('nordic_reserve');
          break;
      }
    });
  }

  /**
   * Creates gesture context for execution
   */
  private createGestureContext(analysis: ContextualGestureAnalysis): MovementContext {
    return {
      isQuestion: false,
      isExplanation: analysis.gestureType === 'pointing',
      emphasisLevel: analysis.intensity > 0.8 ? 'high' : analysis.intensity > 0.5 ? 'medium' : 'low',
      culturalContext: this.culturalProfile.region,
      language: 'en-US', // Default, should be passed from context
      speechContent: analysis.triggers.join(' ')
    };
  }
}

/**
 * Content analyzer for extracting gesture-relevant information
 */
class ContentAnalyzer {
  /**
   * Analyzes content for explanatory elements
   */
  public analyzeExplanatoryContent(speechContent: string): ExplanatoryContent {
    const concepts = this.extractConcepts(speechContent);
    const pointingTargets = this.identifyPointingTargets(speechContent);
    const demonstrationNeeds = this.identifyDemonstrationNeeds(speechContent);

    return {
      concepts,
      pointingTargets,
      demonstrationNeeds
    };
  }

  /**
   * Analyzes content for numerical elements
   */
  public analyzeNumericalContent(speechContent: string): NumericalContent {
    const numbers = this.extractNumbers(speechContent);
    const contexts = this.extractNumericalContexts(speechContent);
    const countingOpportunities = this.identifyCountingOpportunities(speechContent, numbers);

    return {
      numbers,
      contexts,
      countingOpportunities
    };
  }

  /**
   * Analyzes content for spatial concepts
   */
  public analyzeSpatialConcepts(speechContent: string): SpatialConcept[] {
    const concepts: SpatialConcept[] = [];

    // Size concepts
    const sizeKeywords = ['small', 'tiny', 'little', 'big', 'large', 'huge', 'enormous', 'massive'];
    sizeKeywords.forEach(keyword => {
      if (speechContent.toLowerCase().includes(keyword)) {
        concepts.push({
          type: 'size',
          value: keyword,
          confidence: 0.8,
          suggestedGesture: keyword.includes('small') || keyword.includes('tiny') || keyword.includes('little') 
            ? 'descriptive_small' : 'descriptive_large'
        });
      }
    });

    // Shape concepts
    const shapeKeywords = ['round', 'circular', 'square', 'rectangular', 'triangular', 'oval'];
    shapeKeywords.forEach(keyword => {
      if (speechContent.toLowerCase().includes(keyword)) {
        concepts.push({
          type: 'shape',
          value: keyword,
          confidence: 0.7,
          suggestedGesture: 'descriptive_round'
        });
      }
    });

    // Direction concepts
    const directionKeywords = ['up', 'down', 'left', 'right', 'forward', 'backward', 'above', 'below'];
    directionKeywords.forEach(keyword => {
      if (speechContent.toLowerCase().includes(keyword)) {
        concepts.push({
          type: 'direction',
          value: keyword,
          confidence: 0.9,
          suggestedGesture: 'pointing'
        });
      }
    });

    return concepts;
  }

  /**
   * Extracts concepts from speech content
   */
  private extractConcepts(speechContent: string): string[] {
    const conceptKeywords = [
      'concept', 'idea', 'principle', 'theory', 'method', 'approach',
      'technique', 'strategy', 'process', 'system', 'framework'
    ];

    const concepts: string[] = [];
    const lowerContent = speechContent.toLowerCase();

    conceptKeywords.forEach(keyword => {
      if (lowerContent.includes(keyword)) {
        concepts.push(keyword);
      }
    });

    return concepts;
  }

  /**
   * Identifies pointing targets in content
   */
  private identifyPointingTargets(speechContent: string): PointingTarget[] {
    const targets: PointingTarget[] = [];
    const words = speechContent.toLowerCase().split(' ');

    words.forEach((word, index) => {
      if (['this', 'that', 'here', 'there'].includes(word)) {
        targets.push({
          concept: word,
          direction: this.determinePointingDirection(word, words, index),
          intensity: 0.7,
          timing: index * 100 // Rough timing based on word position
        });
      }
    });

    return targets;
  }

  /**
   * Determines pointing direction based on context
   */
  private determinePointingDirection(
    word: string,
    words: string[],
    index: number
  ): 'forward' | 'left' | 'right' | 'up' | 'down' {
    // Look for directional clues in surrounding words
    const surroundingWords = words.slice(Math.max(0, index - 2), Math.min(words.length, index + 3));
    
    if (surroundingWords.some(w => ['up', 'above', 'top'].includes(w))) {
      return 'up';
    }
    if (surroundingWords.some(w => ['down', 'below', 'bottom'].includes(w))) {
      return 'down';
    }
    if (surroundingWords.some(w => ['left', 'west'].includes(w))) {
      return 'left';
    }
    if (surroundingWords.some(w => ['right', 'east'].includes(w))) {
      return 'right';
    }

    // Default to forward pointing
    return 'forward';
  }

  /**
   * Identifies demonstration needs
   */
  private identifyDemonstrationNeeds(speechContent: string): DemonstrationNeed[] {
    const needs: DemonstrationNeed[] = [];
    const lowerContent = speechContent.toLowerCase();

    if (lowerContent.includes('demonstrate') || lowerContent.includes('show')) {
      needs.push({
        concept: 'demonstration',
        gestureType: 'descriptive',
        complexity: 'moderate'
      });
    }

    if (lowerContent.includes('compare') || lowerContent.includes('versus')) {
      needs.push({
        concept: 'comparison',
        gestureType: 'comparative',
        complexity: 'complex'
      });
    }

    if (lowerContent.includes('step') || lowerContent.includes('sequence')) {
      needs.push({
        concept: 'sequence',
        gestureType: 'sequential',
        complexity: 'complex'
      });
    }

    return needs;
  }

  /**
   * Extracts numbers from speech content
   */
  private extractNumbers(speechContent: string): number[] {
    const numbers: number[] = [];
    const numberWords = {
      'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
      'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
      'first': 1, 'second': 2, 'third': 3, 'fourth': 4, 'fifth': 5
    };

    // Extract written numbers
    Object.entries(numberWords).forEach(([word, num]) => {
      if (speechContent.toLowerCase().includes(word)) {
        numbers.push(num);
      }
    });

    // Extract digit numbers
    const digitMatches = speechContent.match(/\b\d+\b/g);
    if (digitMatches) {
      digitMatches.forEach(match => {
        const num = parseInt(match);
        if (num >= 1 && num <= 10) {
          numbers.push(num);
        }
      });
    }

    return [...new Set(numbers)]; // Remove duplicates
  }

  /**
   * Extracts numerical contexts
   */
  private extractNumericalContexts(speechContent: string): string[] {
    const contexts: string[] = [];
    const contextKeywords = [
      'steps', 'points', 'items', 'things', 'elements', 'parts',
      'sections', 'chapters', 'lessons', 'examples', 'reasons'
    ];

    contextKeywords.forEach(keyword => {
      if (speechContent.toLowerCase().includes(keyword)) {
        contexts.push(keyword);
      }
    });

    return contexts;
  }

  /**
   * Identifies counting opportunities
   */
  private identifyCountingOpportunities(
    speechContent: string,
    numbers: number[]
  ): CountingOpportunity[] {
    const opportunities: CountingOpportunity[] = [];
    const words = speechContent.toLowerCase().split(' ');

    numbers.forEach(number => {
      if (number >= 1 && number <= 5) {
        // Find the position of the number in the text
        const numberWord = this.getNumberWord(number);
        const index = words.findIndex(word => 
          word.includes(numberWord) || word.includes(number.toString())
        );

        if (index !== -1) {
          // Look for context clues around the number
          const context = this.identifyNumberContext(words, index);
          
          opportunities.push({
            number,
            context,
            startTime: index * 100, // Rough timing
            confidence: this.calculateCountingConfidence(context, number)
          });
        }
      }
    });

    return opportunities;
  }

  /**
   * Gets word representation of number
   */
  private getNumberWord(number: number): string {
    const numberWords = ['', 'one', 'two', 'three', 'four', 'five'];
    return numberWords[number] || number.toString();
  }

  /**
   * Identifies context around a number
   */
  private identifyNumberContext(words: string[], index: number): string {
    const contextWords = words.slice(Math.max(0, index - 2), Math.min(words.length, index + 3));
    return contextWords.join(' ');
  }

  /**
   * Calculates confidence for counting opportunity
   */
  private calculateCountingConfidence(context: string, number: number): number {
    let confidence = 0.5; // Base confidence

    // Increase confidence for explicit counting contexts
    const countingKeywords = ['steps', 'points', 'items', 'things', 'reasons', 'ways'];
    if (countingKeywords.some(keyword => context.includes(keyword))) {
      confidence += 0.3;
    }

    // Increase confidence for smaller numbers (easier to count)
    if (number <= 3) {
      confidence += 0.2;
    }

    // Increase confidence for ordinal numbers
    if (context.includes('first') || context.includes('second') || context.includes('third')) {
      confidence += 0.2;
    }

    return Math.min(1.0, confidence);
  }
}

/**
 * Gesture mapper for converting analysis to gestures
 */
class GestureMapper {
  /**
   * Maps analysis results to specific gestures
   */
  public mapToGestures(analyses: ContextualGestureAnalysis[]): string[] {
    return analyses.map(analysis => analysis.gestureType);
  }
}

/**
 * Timing calculator for gesture synchronization
 */
class TimingCalculator {
  /**
   * Calculates timing for gesture execution
   */
  public calculateGestureTiming(
    analysis: ContextualGestureAnalysis,
    speechContent: string,
    speechDuration: number
  ): GestureTiming[] {
    const timings: GestureTiming[] = [];
    const words = speechContent.split(' ');
    const wordsPerSecond = words.length / (speechDuration / 1000);

    analysis.triggers.forEach((trigger, index) => {
      const triggerIndex = words.findIndex(word => 
        word.toLowerCase().includes(trigger.toLowerCase())
      );

      if (triggerIndex !== -1) {
        const startTime = (triggerIndex / wordsPerSecond) * 1000;
        const duration = this.calculateGestureDuration(analysis.gestureType);

        timings.push({
          startTime: Math.max(0, startTime - 200), // Start slightly before trigger
          duration,
          gestureId: analysis.gestureType,
          priority: this.calculateGesturePriority(analysis.gestureType, analysis.confidence)
        });
      }
    });

    return timings;
  }

  /**
   * Calculates gesture duration based on type
   */
  private calculateGestureDuration(gestureType: string): number {
    const baseDurations: Record<string, number> = {
      'pointing': 800,
      'counting_one': 600,
      'counting_two': 700,
      'counting_three': 800,
      'counting_four': 900,
      'counting_five': 1000,
      'descriptive_small': 600,
      'descriptive_large': 800,
      'descriptive_round': 700
    };

    return baseDurations[gestureType] || 600;
  }

  /**
   * Calculates gesture priority
   */
  private calculateGesturePriority(gestureType: string, confidence: number): number {
    const basePriorities: Record<string, number> = {
      'pointing': 0.8,
      'counting_one': 0.7,
      'counting_two': 0.7,
      'counting_three': 0.7,
      'counting_four': 0.6,
      'counting_five': 0.6,
      'descriptive_small': 0.5,
      'descriptive_large': 0.5,
      'descriptive_round': 0.5
    };

    const basePriority = basePriorities[gestureType] || 0.5;
    return basePriority * confidence;
  }
}