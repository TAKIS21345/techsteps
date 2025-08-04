/**
 * SynchronizedGestureTimingEngine - Precise timing synchronization system
 * 
 * This class implements precise timing synchronization between speech and gestures,
 * creates gesture duration and intensity calculation systems, and adds smooth
 * gesture transitions and blending capabilities.
 * 
 * Requirements addressed:
 * - 3.1: Appropriate hand gestures or head movements to emphasize key points
 * - 3.2: Natural conversation flow with appropriate head positioning
 * - 3.3: Explanatory gestures that support the content being delivered
 */

import {
  Gesture,
  HeadMovement,
  MovementContext,
  EmphasisData,
  SpeechAnalysis,
  QuestionMarker,
  EmphasisWord,
  PauseMarker,
  MorphTargetMapping,
  AnimationCurve,
  Keyframe,
  EasingType,
  Transition
} from './types';

export interface TimingSynchronizationResult {
  synchronizedGestures: SynchronizedGesture[];
  speechMarkers: SpeechTimingMarker[];
  transitionPlan: GestureTransitionPlan;
  totalDuration: number;
  confidence: number;
}

export interface SynchronizedGesture {
  gesture: Gesture;
  speechAlignment: SpeechAlignment;
  timingAdjustments: TimingAdjustment[];
  blendingInfo: BlendingInfo;
  priority: number;
}

export interface SpeechAlignment {
  speechStartTime: number;
  speechEndTime: number;
  gestureStartTime: number;
  gestureEndTime: number;
  alignmentType: 'onset' | 'peak' | 'offset' | 'continuous';
  confidence: number;
}

export interface TimingAdjustment {
  type: 'delay' | 'extend' | 'compress' | 'split';
  originalTiming: number;
  adjustedTiming: number;
  reason: string;
  intensity: number;
}

export interface BlendingInfo {
  blendInDuration: number;
  blendOutDuration: number;
  blendingCurve: AnimationCurve;
  overlappingGestures: string[];
  blendingWeights: number[];
}

export interface SpeechTimingMarker {
  type: 'word_boundary' | 'syllable_stress' | 'phrase_boundary' | 'emphasis_peak';
  startTime: number;
  endTime: number;
  intensity: number;
  associatedGestures: string[];
}

export interface GestureTransitionPlan {
  transitions: GestureTransition[];
  smoothingFactors: SmoothingFactor[];
  continuityPoints: ContinuityPoint[];
}

export interface GestureTransition {
  fromGesture: Gesture;
  toGesture: Gesture;
  transitionDuration: number;
  transitionType: 'blend' | 'sequence' | 'overlap' | 'replace';
  easingFunction: EasingType;
  keyframes: Keyframe[];
}

export interface SmoothingFactor {
  gestureId: string;
  smoothingIntensity: number;
  smoothingDuration: number;
  smoothingType: 'velocity' | 'acceleration' | 'jerk';
}

export interface ContinuityPoint {
  time: number;
  gestureStates: GestureState[];
  transitionRequirements: TransitionRequirement[];
}

export interface GestureState {
  gestureId: string;
  morphTargetWeights: Record<string, number>;
  intensity: number;
  velocity: number;
}

export interface TransitionRequirement {
  type: 'smooth_velocity' | 'maintain_intensity' | 'preserve_direction';
  priority: number;
  tolerance: number;
}

export interface GestureDurationCalculation {
  baseDuration: number;
  speechDuration: number;
  adjustedDuration: number;
  scalingFactor: number;
  minimumDuration: number;
  maximumDuration: number;
}

export interface IntensityCalculation {
  baseIntensity: number;
  speechIntensity: number;
  contextualIntensity: number;
  finalIntensity: number;
  intensityProfile: IntensityProfile;
}

export interface IntensityProfile {
  attackTime: number;
  sustainTime: number;
  releaseTime: number;
  peakIntensity: number;
  curve: AnimationCurve;
}

export class SynchronizedGestureTimingEngine {
  private speechAnalyzer: SpeechTimingAnalyzer;
  private gestureCalculator: GestureDurationCalculator;
  private intensityCalculator: GestureIntensityCalculator;
  private transitionEngine: GestureTransitionEngine;
  private blendingEngine: GestureBlendingEngine;
  private synchronizationEngine: TimingSynchronizationEngine;

  constructor() {
    this.speechAnalyzer = new SpeechTimingAnalyzer();
    this.gestureCalculator = new GestureDurationCalculator();
    this.intensityCalculator = new GestureIntensityCalculator();
    this.transitionEngine = new GestureTransitionEngine();
    this.blendingEngine = new GestureBlendingEngine();
    this.synchronizationEngine = new TimingSynchronizationEngine();
  }

  /**
   * Synchronizes gestures with speech timing for precise alignment
   */
  public synchronizeGesturesWithSpeech(
    gestures: Gesture[],
    speechContent: string,
    speechAnalysis: SpeechAnalysis,
    context: MovementContext
  ): TimingSynchronizationResult {
    // Analyze speech timing markers
    const speechMarkers = this.speechAnalyzer.extractTimingMarkers(speechContent, speechAnalysis);

    // Calculate optimal gesture durations
    const gesturesWithDuration = this.calculateGestureDurations(gestures, speechMarkers, context);

    // Calculate gesture intensities based on speech
    const gesturesWithIntensity = this.calculateGestureIntensities(gesturesWithDuration, speechAnalysis, context);

    // Synchronize gesture timing with speech events
    const synchronizedGestures = this.synchronizationEngine.synchronizeWithSpeech(
      gesturesWithIntensity,
      speechMarkers,
      context
    );

    // Create transition plan for smooth gesture flow
    const transitionPlan = this.transitionEngine.createTransitionPlan(synchronizedGestures);

    // Apply blending for overlapping gestures
    const blendedGestures = this.blendingEngine.applyBlending(synchronizedGestures, transitionPlan);

    return {
      synchronizedGestures: blendedGestures,
      speechMarkers,
      transitionPlan,
      totalDuration: this.calculateTotalDuration(blendedGestures),
      confidence: this.calculateSynchronizationConfidence(blendedGestures, speechMarkers)
    };
  }

  /**
   * Creates smooth transitions between gesture sequences
   */
  public createGestureTransitions(
    fromGestures: Gesture[],
    toGestures: Gesture[],
    transitionDuration: number,
    transitionType: 'blend' | 'sequence' | 'overlap' | 'replace' = 'blend'
  ): GestureTransition[] {
    return this.transitionEngine.createTransitions(fromGestures, toGestures, transitionDuration, transitionType);
  }

  /**
   * Calculates optimal gesture duration based on speech content
   */
  public calculateOptimalDuration(
    gesture: Gesture,
    speechDuration: number,
    context: MovementContext
  ): GestureDurationCalculation {
    return this.gestureCalculator.calculateDuration(gesture, speechDuration, context);
  }

  /**
   * Calculates gesture intensity based on speech analysis
   */
  public calculateGestureIntensity(
    gesture: Gesture,
    speechAnalysis: SpeechAnalysis,
    context: MovementContext
  ): IntensityCalculation {
    return this.intensityCalculator.calculateIntensity(gesture, speechAnalysis, context);
  }

  /**
   * Applies smooth blending between overlapping gestures
   */
  public blendOverlappingGestures(
    gestures: SynchronizedGesture[],
    blendingDuration: number = 200
  ): SynchronizedGesture[] {
    return this.blendingEngine.blendOverlapping(gestures, blendingDuration);
  }

  /**
   * Calculates gesture durations for all gestures
   */
  private calculateGestureDurations(
    gestures: Gesture[],
    speechMarkers: SpeechTimingMarker[],
    context: MovementContext
  ): Gesture[] {
    return gestures.map(gesture => {
      const relevantMarkers = speechMarkers.filter(marker => 
        marker.associatedGestures.includes(gesture.type)
      );

      if (relevantMarkers.length > 0) {
        const speechDuration = relevantMarkers.reduce((total, marker) => 
          total + (marker.endTime - marker.startTime), 0
        ) / relevantMarkers.length;

        const durationCalc = this.gestureCalculator.calculateDuration(gesture, speechDuration, context);
        
        return {
          ...gesture,
          duration: durationCalc.adjustedDuration
        };
      }

      return gesture;
    });
  }

  /**
   * Calculates gesture intensities for all gestures
   */
  private calculateGestureIntensities(
    gestures: Gesture[],
    speechAnalysis: SpeechAnalysis,
    context: MovementContext
  ): Gesture[] {
    return gestures.map(gesture => {
      const intensityCalc = this.intensityCalculator.calculateIntensity(gesture, speechAnalysis, context);
      
      return {
        ...gesture,
        intensity: intensityCalc.finalIntensity,
        morphTargets: gesture.morphTargets.map(target => ({
          ...target,
          weight: target.weight * intensityCalc.finalIntensity
        }))
      };
    });
  }

  /**
   * Calculates total duration of synchronized gestures
   */
  private calculateTotalDuration(gestures: SynchronizedGesture[]): number {
    if (gestures.length === 0) return 0;

    return Math.max(...gestures.map(sg => 
      sg.speechAlignment.gestureEndTime
    ));
  }

  /**
   * Calculates confidence in synchronization quality
   */
  private calculateSynchronizationConfidence(
    gestures: SynchronizedGesture[],
    speechMarkers: SpeechTimingMarker[]
  ): number {
    if (gestures.length === 0) return 0;

    const totalConfidence = gestures.reduce((sum, gesture) => 
      sum + gesture.speechAlignment.confidence, 0
    );

    const avgGestureConfidence = totalConfidence / gestures.length;
    
    // Factor in speech marker coverage
    const markerCoverage = speechMarkers.filter(marker => 
      marker.associatedGestures.length > 0
    ).length / Math.max(speechMarkers.length, 1);

    return (avgGestureConfidence * 0.7) + (markerCoverage * 0.3);
  }
}

/**
 * Speech timing analyzer for extracting timing markers from speech
 */
class SpeechTimingAnalyzer {
  public extractTimingMarkers(speechContent: string, speechAnalysis: SpeechAnalysis): SpeechTimingMarker[] {
    const markers: SpeechTimingMarker[] = [];

    // Extract word boundary markers
    markers.push(...this.extractWordBoundaries(speechContent));

    // Extract emphasis peak markers
    markers.push(...this.extractEmphasisPeaks(speechAnalysis.emphasis));

    // Extract phrase boundary markers
    markers.push(...this.extractPhraseBoundaries(speechContent, speechAnalysis.pauses));

    // Extract syllable stress markers
    markers.push(...this.extractSyllableStress(speechContent, speechAnalysis.emphasis));

    return markers.sort((a, b) => a.startTime - b.startTime);
  }

  private extractWordBoundaries(speechContent: string): SpeechTimingMarker[] {
    const markers: SpeechTimingMarker[] = [];
    const words = speechContent.split(/\s+/);
    let currentTime = 0;

    words.forEach(word => {
      const wordDuration = word.length * 80; // Rough estimate
      
      markers.push({
        type: 'word_boundary',
        startTime: currentTime,
        endTime: currentTime + wordDuration,
        intensity: 0.5,
        associatedGestures: this.getGesturesForWord(word)
      });

      currentTime += wordDuration + 50; // Word + space
    });

    return markers;
  }

  private extractEmphasisPeaks(emphasisData: EmphasisData): SpeechTimingMarker[] {
    return emphasisData.words.map(word => ({
      type: 'emphasis_peak' as const,
      startTime: word.startTime,
      endTime: word.endTime,
      intensity: word.intensity,
      associatedGestures: ['head_nod', 'eyebrow_raise', 'emphasis']
    }));
  }

  private extractPhraseBoundaries(speechContent: string, pauses: PauseMarker[]): SpeechTimingMarker[] {
    return pauses.map(pause => ({
      type: 'phrase_boundary' as const,
      startTime: pause.startTime,
      endTime: pause.startTime + pause.duration,
      intensity: 0.3,
      associatedGestures: ['head_turn', 'pause_gesture']
    }));
  }

  private extractSyllableStress(speechContent: string, emphasisData: EmphasisData): SpeechTimingMarker[] {
    const markers: SpeechTimingMarker[] = [];
    
    emphasisData.words.forEach(word => {
      // Simple syllable stress detection
      const syllableCount = this.estimateSyllableCount(word.word);
      const syllableDuration = (word.endTime - word.startTime) / syllableCount;
      
      for (let i = 0; i < syllableCount; i++) {
        const syllableStart = word.startTime + (i * syllableDuration);
        const syllableEnd = syllableStart + syllableDuration;
        
        // Primary stress usually on first or second syllable
        const isStressed = i === 0 || (syllableCount > 2 && i === 1);
        
        if (isStressed) {
          markers.push({
            type: 'syllable_stress',
            startTime: syllableStart,
            endTime: syllableEnd,
            intensity: word.intensity * 0.8,
            associatedGestures: ['head_nod', 'micro_movement']
          });
        }
      }
    });

    return markers;
  }

  private estimateSyllableCount(word: string): number {
    // Simple syllable counting heuristic
    const vowels = word.toLowerCase().match(/[aeiouy]+/g);
    return Math.max(1, vowels ? vowels.length : 1);
  }

  private getGesturesForWord(word: string): string[] {
    const lowerWord = word.toLowerCase();
    
    // Question words
    if (['what', 'where', 'when', 'why', 'how', 'who'].includes(lowerWord)) {
      return ['head_tilt', 'eyebrow_raise'];
    }
    
    // Emphasis words
    if (['important', 'critical', 'key', 'main'].includes(lowerWord)) {
      return ['head_nod', 'emphasis'];
    }
    
    // Agreement words
    if (['yes', 'right', 'correct', 'exactly'].includes(lowerWord)) {
      return ['head_nod'];
    }
    
    return ['micro_movement'];
  }
}/**
 *
 Gesture duration calculator for optimal timing
 */
class GestureDurationCalculator {
  private baseDurations: Map<string, number>;
  private durationConstraints: Map<string, { min: number; max: number }>;

  constructor() {
    this.baseDurations = new Map([
      ['head_nod', 400],
      ['head_tilt', 600],
      ['eyebrow_raise', 300],
      ['emphasis', 500],
      ['hand_gesture', 800],
      ['micro_movement', 200]
    ]);

    this.durationConstraints = new Map([
      ['head_nod', { min: 200, max: 800 }],
      ['head_tilt', { min: 300, max: 1200 }],
      ['eyebrow_raise', { min: 150, max: 600 }],
      ['emphasis', { min: 250, max: 1000 }],
      ['hand_gesture', { min: 400, max: 1500 }],
      ['micro_movement', { min: 100, max: 400 }]
    ]);
  }

  public calculateDuration(
    gesture: Gesture,
    speechDuration: number,
    context: MovementContext
  ): GestureDurationCalculation {
    const baseDuration = this.baseDurations.get(gesture.type) || 400;
    const constraints = this.durationConstraints.get(gesture.type) || { min: 200, max: 800 };

    // Calculate scaling factor based on speech duration
    let scalingFactor = 1.0;
    
    if (speechDuration > 0) {
      // Gesture should be proportional to speech duration but not exceed reasonable limits
      const speechRatio = speechDuration / baseDuration;
      scalingFactor = Math.min(2.0, Math.max(0.5, speechRatio));
    }

    // Apply context-based adjustments
    if (context.emphasisLevel === 'high') {
      scalingFactor *= 1.2;
    } else if (context.emphasisLevel === 'low') {
      scalingFactor *= 0.8;
    }

    if (context.isQuestion) {
      scalingFactor *= 1.1; // Questions need slightly longer gestures
    }

    // Calculate adjusted duration
    let adjustedDuration = Math.round(baseDuration * scalingFactor);
    
    // Apply constraints
    adjustedDuration = Math.max(constraints.min, Math.min(constraints.max, adjustedDuration));

    return {
      baseDuration,
      speechDuration,
      adjustedDuration,
      scalingFactor,
      minimumDuration: constraints.min,
      maximumDuration: constraints.max
    };
  }
}

/**
 * Gesture intensity calculator for dynamic intensity adjustment
 */
class GestureIntensityCalculator {
  private baseIntensities: Map<string, number>;
  private intensityModifiers: Map<string, number>;

  constructor() {
    this.baseIntensities = new Map([
      ['head_nod', 0.7],
      ['head_tilt', 0.6],
      ['eyebrow_raise', 0.8],
      ['emphasis', 0.9],
      ['hand_gesture', 0.6],
      ['micro_movement', 0.3]
    ]);

    this.intensityModifiers = new Map([
      ['question', 1.1],
      ['emphasis', 1.3],
      ['explanation', 0.9],
      ['agreement', 1.2],
      ['uncertainty', 0.7]
    ]);
  }

  public calculateIntensity(
    gesture: Gesture,
    speechAnalysis: SpeechAnalysis,
    context: MovementContext
  ): IntensityCalculation {
    const baseIntensity = this.baseIntensities.get(gesture.type) || 0.6;
    
    // Calculate speech-based intensity
    const speechIntensity = this.calculateSpeechIntensity(speechAnalysis, gesture.timing);
    
    // Calculate contextual intensity
    const contextualIntensity = this.calculateContextualIntensity(context, gesture.type);
    
    // Combine intensities with weighted average
    const finalIntensity = Math.min(1.0, 
      (baseIntensity * 0.4) + 
      (speechIntensity * 0.4) + 
      (contextualIntensity * 0.2)
    );

    // Create intensity profile
    const intensityProfile = this.createIntensityProfile(gesture, finalIntensity);

    return {
      baseIntensity,
      speechIntensity,
      contextualIntensity,
      finalIntensity,
      intensityProfile
    };
  }

  private calculateSpeechIntensity(speechAnalysis: SpeechAnalysis, gestureTime: number): number {
    // Find emphasis words that overlap with gesture timing
    const relevantEmphasis = speechAnalysis.emphasis.words.filter(word => 
      gestureTime >= word.startTime && gestureTime <= word.endTime
    );

    if (relevantEmphasis.length > 0) {
      return relevantEmphasis.reduce((sum, word) => sum + word.intensity, 0) / relevantEmphasis.length;
    }

    // Use overall speech energy as fallback
    return speechAnalysis.energy;
  }

  private calculateContextualIntensity(context: MovementContext, gestureType: string): number {
    let intensity = 0.6; // Base contextual intensity

    // Apply emphasis level
    switch (context.emphasisLevel) {
      case 'high':
        intensity *= 1.3;
        break;
      case 'medium':
        intensity *= 1.0;
        break;
      case 'low':
        intensity *= 0.7;
        break;
    }

    // Apply context type modifiers
    if (context.isQuestion) {
      const modifier = this.intensityModifiers.get('question') || 1.0;
      intensity *= modifier;
    }

    if (context.isExplanation) {
      const modifier = this.intensityModifiers.get('explanation') || 1.0;
      intensity *= modifier;
    }

    return Math.min(1.0, intensity);
  }

  private createIntensityProfile(gesture: Gesture, finalIntensity: number): IntensityProfile {
    const totalDuration = gesture.duration;
    
    // Create attack-sustain-release profile
    const attackTime = Math.min(100, totalDuration * 0.2);
    const releaseTime = Math.min(150, totalDuration * 0.3);
    const sustainTime = totalDuration - attackTime - releaseTime;

    return {
      attackTime,
      sustainTime,
      releaseTime,
      peakIntensity: finalIntensity,
      curve: this.createIntensityCurve(attackTime, sustainTime, releaseTime, finalIntensity)
    };
  }

  private createIntensityCurve(
    attackTime: number,
    sustainTime: number,
    releaseTime: number,
    peakIntensity: number
  ): AnimationCurve {
    const totalTime = attackTime + sustainTime + releaseTime;
    
    const keyframes: Keyframe[] = [
      { time: 0, value: 0, easing: 'ease_out' },
      { time: attackTime / totalTime, value: peakIntensity, easing: 'linear' },
      { time: (attackTime + sustainTime) / totalTime, value: peakIntensity, easing: 'ease_in' },
      { time: 1, value: 0 }
    ];

    return {
      keyframes,
      interpolation: 'cubic',
      loop: false
    };
  }
}

/**
 * Gesture transition engine for smooth transitions
 */
class GestureTransitionEngine {
  public createTransitionPlan(gestures: SynchronizedGesture[]): GestureTransitionPlan {
    const transitions = this.createTransitions(
      gestures.map(sg => sg.gesture),
      [],
      200,
      'blend'
    );

    const smoothingFactors = this.calculateSmoothingFactors(gestures);
    const continuityPoints = this.identifyContinuityPoints(gestures);

    return {
      transitions,
      smoothingFactors,
      continuityPoints
    };
  }

  public createTransitions(
    fromGestures: Gesture[],
    toGestures: Gesture[],
    transitionDuration: number,
    transitionType: 'blend' | 'sequence' | 'overlap' | 'replace'
  ): GestureTransition[] {
    const transitions: GestureTransition[] = [];

    // Create transitions between consecutive gestures
    for (let i = 0; i < fromGestures.length - 1; i++) {
      const fromGesture = fromGestures[i];
      const toGesture = fromGestures[i + 1];

      const transition = this.createSingleTransition(
        fromGesture,
        toGesture,
        transitionDuration,
        transitionType
      );

      transitions.push(transition);
    }

    // Create transitions to new gesture set if provided
    if (toGestures.length > 0) {
      fromGestures.forEach(fromGesture => {
        const closestToGesture = this.findClosestGesture(fromGesture, toGestures);
        if (closestToGesture) {
          const transition = this.createSingleTransition(
            fromGesture,
            closestToGesture,
            transitionDuration,
            transitionType
          );
          transitions.push(transition);
        }
      });
    }

    return transitions;
  }

  private createSingleTransition(
    fromGesture: Gesture,
    toGesture: Gesture,
    transitionDuration: number,
    transitionType: 'blend' | 'sequence' | 'overlap' | 'replace'
  ): GestureTransition {
    const easingFunction = this.selectEasingFunction(fromGesture.type, toGesture.type);
    const keyframes = this.createTransitionKeyframes(fromGesture, toGesture, transitionType);

    return {
      fromGesture,
      toGesture,
      transitionDuration,
      transitionType,
      easingFunction,
      keyframes
    };
  }

  private selectEasingFunction(fromType: string, toType: string): EasingType {
    // Select appropriate easing based on gesture types
    if (fromType === 'emphasis' || toType === 'emphasis') {
      return 'ease_in_out';
    }
    
    if (fromType.includes('micro') || toType.includes('micro')) {
      return 'ease_out';
    }

    return 'ease_in_out';
  }

  private createTransitionKeyframes(
    fromGesture: Gesture,
    toGesture: Gesture,
    transitionType: 'blend' | 'sequence' | 'overlap' | 'replace'
  ): Keyframe[] {
    const keyframes: Keyframe[] = [];

    switch (transitionType) {
      case 'blend':
        keyframes.push(
          { time: 0, value: 1.0, easing: 'ease_out' }, // From gesture at full intensity
          { time: 0.5, value: 0.5 }, // Mid-blend
          { time: 1.0, value: 0.0, easing: 'ease_in' } // To gesture takes over
        );
        break;

      case 'sequence':
        keyframes.push(
          { time: 0, value: 1.0 },
          { time: 0.3, value: 0.0, easing: 'ease_in' },
          { time: 0.7, value: 0.0 },
          { time: 1.0, value: 1.0, easing: 'ease_out' }
        );
        break;

      case 'overlap':
        keyframes.push(
          { time: 0, value: 1.0 },
          { time: 0.6, value: 0.8, easing: 'linear' },
          { time: 1.0, value: 0.0, easing: 'ease_in' }
        );
        break;

      case 'replace':
        keyframes.push(
          { time: 0, value: 1.0 },
          { time: 0.1, value: 0.0, easing: 'ease_in' },
          { time: 0.9, value: 0.0 },
          { time: 1.0, value: 1.0, easing: 'ease_out' }
        );
        break;
    }

    return keyframes;
  }

  private findClosestGesture(targetGesture: Gesture, gestures: Gesture[]): Gesture | null {
    if (gestures.length === 0) return null;

    // Find gesture with most similar type or timing
    return gestures.reduce((closest, current) => {
      const targetSimilarity = this.calculateGestureSimilarity(targetGesture, current);
      const closestSimilarity = this.calculateGestureSimilarity(targetGesture, closest);
      
      return targetSimilarity > closestSimilarity ? current : closest;
    });
  }

  private calculateGestureSimilarity(gesture1: Gesture, gesture2: Gesture): number {
    let similarity = 0;

    // Type similarity
    if (gesture1.type === gesture2.type) {
      similarity += 0.5;
    } else if (gesture1.type.includes(gesture2.type.split('_')[0])) {
      similarity += 0.3;
    }

    // Intensity similarity
    const intensityDiff = Math.abs(gesture1.intensity - gesture2.intensity);
    similarity += (1 - intensityDiff) * 0.3;

    // Duration similarity
    const durationRatio = Math.min(gesture1.duration, gesture2.duration) / 
                         Math.max(gesture1.duration, gesture2.duration);
    similarity += durationRatio * 0.2;

    return similarity;
  }

  private calculateSmoothingFactors(gestures: SynchronizedGesture[]): SmoothingFactor[] {
    return gestures.map((gesture, index) => ({
      gestureId: `gesture_${index}`,
      smoothingIntensity: this.calculateSmoothingIntensity(gesture.gesture),
      smoothingDuration: Math.min(100, gesture.gesture.duration * 0.2),
      smoothingType: this.selectSmoothingType(gesture.gesture.type)
    }));
  }

  private calculateSmoothingIntensity(gesture: Gesture): number {
    // Higher intensity gestures need more smoothing
    return Math.min(1.0, gesture.intensity * 1.2);
  }

  private selectSmoothingType(gestureType: string): 'velocity' | 'acceleration' | 'jerk' {
    if (gestureType.includes('micro')) {
      return 'jerk'; // Micro movements need jerk smoothing
    } else if (gestureType.includes('emphasis')) {
      return 'acceleration'; // Emphasis gestures need acceleration smoothing
    } else {
      return 'velocity'; // Default to velocity smoothing
    }
  }

  private identifyContinuityPoints(gestures: SynchronizedGesture[]): ContinuityPoint[] {
    const continuityPoints: ContinuityPoint[] = [];
    
    // Find points where gestures overlap or transition
    for (let i = 0; i < gestures.length - 1; i++) {
      const currentGesture = gestures[i];
      const nextGesture = gestures[i + 1];
      
      const overlapStart = Math.max(
        currentGesture.speechAlignment.gestureStartTime,
        nextGesture.speechAlignment.gestureStartTime
      );
      
      const overlapEnd = Math.min(
        currentGesture.speechAlignment.gestureEndTime,
        nextGesture.speechAlignment.gestureEndTime
      );

      if (overlapStart < overlapEnd) {
        continuityPoints.push({
          time: overlapStart,
          gestureStates: [
            this.createGestureState(currentGesture, overlapStart),
            this.createGestureState(nextGesture, overlapStart)
          ],
          transitionRequirements: [
            { type: 'smooth_velocity', priority: 0.8, tolerance: 0.1 },
            { type: 'maintain_intensity', priority: 0.6, tolerance: 0.2 }
          ]
        });
      }
    }

    return continuityPoints;
  }

  private createGestureState(gesture: SynchronizedGesture, time: number): GestureState {
    const progress = (time - gesture.speechAlignment.gestureStartTime) / 
                    (gesture.speechAlignment.gestureEndTime - gesture.speechAlignment.gestureStartTime);
    
    const morphTargetWeights: Record<string, number> = {};
    gesture.gesture.morphTargets.forEach(target => {
      morphTargetWeights[target.targetName] = target.weight * Math.min(1.0, progress * 2);
    });

    return {
      gestureId: gesture.gesture.type,
      morphTargetWeights,
      intensity: gesture.gesture.intensity * Math.min(1.0, progress * 2),
      velocity: this.calculateVelocityAtTime(gesture, time)
    };
  }

  private calculateVelocityAtTime(gesture: SynchronizedGesture, time: number): number {
    // Simple velocity calculation based on gesture progress
    const progress = (time - gesture.speechAlignment.gestureStartTime) / 
                    (gesture.speechAlignment.gestureEndTime - gesture.speechAlignment.gestureStartTime);
    
    // Velocity peaks at mid-gesture
    return gesture.gesture.intensity * Math.sin(progress * Math.PI);
  }
}/**
 
* Gesture blending engine for smooth overlapping gestures
 */
class GestureBlendingEngine {
  public applyBlending(
    gestures: SynchronizedGesture[],
    transitionPlan: GestureTransitionPlan
  ): SynchronizedGesture[] {
    // Apply blending information to each gesture
    return gestures.map(gesture => ({
      ...gesture,
      blendingInfo: this.calculateBlendingInfo(gesture, gestures, transitionPlan)
    }));
  }

  public blendOverlapping(
    gestures: SynchronizedGesture[],
    blendingDuration: number
  ): SynchronizedGesture[] {
    const blendedGestures: SynchronizedGesture[] = [];

    for (let i = 0; i < gestures.length; i++) {
      const currentGesture = gestures[i];
      const overlappingGestures = this.findOverlappingGestures(currentGesture, gestures);

      if (overlappingGestures.length > 0) {
        const blendedGesture = this.createBlendedGesture(
          currentGesture,
          overlappingGestures,
          blendingDuration
        );
        blendedGestures.push(blendedGesture);
      } else {
        blendedGestures.push(currentGesture);
      }
    }

    return blendedGestures;
  }

  private calculateBlendingInfo(
    gesture: SynchronizedGesture,
    allGestures: SynchronizedGesture[],
    transitionPlan: GestureTransitionPlan
  ): BlendingInfo {
    const overlappingGestures = this.findOverlappingGestures(gesture, allGestures);
    const blendingCurve = this.createBlendingCurve(gesture.gesture.type);
    
    return {
      blendInDuration: this.calculateBlendInDuration(gesture, overlappingGestures),
      blendOutDuration: this.calculateBlendOutDuration(gesture, overlappingGestures),
      blendingCurve,
      overlappingGestures: overlappingGestures.map(g => g.gesture.type),
      blendingWeights: this.calculateBlendingWeights(gesture, overlappingGestures)
    };
  }

  private findOverlappingGestures(
    targetGesture: SynchronizedGesture,
    allGestures: SynchronizedGesture[]
  ): SynchronizedGesture[] {
    return allGestures.filter(gesture => {
      if (gesture === targetGesture) return false;

      const targetStart = targetGesture.speechAlignment.gestureStartTime;
      const targetEnd = targetGesture.speechAlignment.gestureEndTime;
      const gestureStart = gesture.speechAlignment.gestureStartTime;
      const gestureEnd = gesture.speechAlignment.gestureEndTime;

      // Check for overlap
      return !(targetEnd <= gestureStart || gestureEnd <= targetStart);
    });
  }

  private createBlendedGesture(
    primaryGesture: SynchronizedGesture,
    overlappingGestures: SynchronizedGesture[],
    blendingDuration: number
  ): SynchronizedGesture {
    const blendedMorphTargets = this.blendMorphTargets(
      primaryGesture.gesture.morphTargets,
      overlappingGestures.map(g => g.gesture.morphTargets).flat()
    );

    const blendedIntensity = this.blendIntensities(
      primaryGesture.gesture.intensity,
      overlappingGestures.map(g => g.gesture.intensity)
    );

    return {
      ...primaryGesture,
      gesture: {
        ...primaryGesture.gesture,
        morphTargets: blendedMorphTargets,
        intensity: blendedIntensity
      },
      blendingInfo: {
        ...primaryGesture.blendingInfo,
        blendInDuration: blendingDuration,
        blendOutDuration: blendingDuration,
        overlappingGestures: overlappingGestures.map(g => g.gesture.type),
        blendingWeights: this.calculateBlendingWeights(primaryGesture, overlappingGestures)
      }
    };
  }

  private blendMorphTargets(
    primaryTargets: MorphTargetMapping[],
    overlappingTargets: MorphTargetMapping[]
  ): MorphTargetMapping[] {
    const blendedTargets = new Map<string, MorphTargetMapping>();

    // Add primary targets
    primaryTargets.forEach(target => {
      blendedTargets.set(target.targetName, { ...target });
    });

    // Blend in overlapping targets
    overlappingTargets.forEach(target => {
      const existing = blendedTargets.get(target.targetName);
      if (existing) {
        // Blend weights based on blend mode
        if (target.blendMode === 'additive') {
          existing.weight = Math.min(1.0, existing.weight + target.weight * 0.5);
        } else if (target.blendMode === 'multiply') {
          existing.weight *= target.weight;
        } else {
          // Replace mode - use weighted average
          existing.weight = (existing.weight + target.weight) * 0.5;
        }
      } else {
        blendedTargets.set(target.targetName, {
          ...target,
          weight: target.weight * 0.5 // Reduce weight for secondary targets
        });
      }
    });

    return Array.from(blendedTargets.values());
  }

  private blendIntensities(primaryIntensity: number, overlappingIntensities: number[]): number {
    if (overlappingIntensities.length === 0) return primaryIntensity;

    const totalOverlappingIntensity = overlappingIntensities.reduce((sum, intensity) => sum + intensity, 0);
    const avgOverlappingIntensity = totalOverlappingIntensity / overlappingIntensities.length;

    // Weighted blend favoring primary gesture
    return Math.min(1.0, (primaryIntensity * 0.7) + (avgOverlappingIntensity * 0.3));
  }

  private calculateBlendInDuration(
    gesture: SynchronizedGesture,
    overlappingGestures: SynchronizedGesture[]
  ): number {
    if (overlappingGestures.length === 0) return 0;

    // Base blend duration on gesture type and overlaps
    const baseDuration = Math.min(200, gesture.gesture.duration * 0.3);
    
    // Adjust based on number of overlapping gestures
    const overlapFactor = Math.min(2.0, 1.0 + (overlappingGestures.length * 0.2));
    
    return Math.round(baseDuration * overlapFactor);
  }

  private calculateBlendOutDuration(
    gesture: SynchronizedGesture,
    overlappingGestures: SynchronizedGesture[]
  ): number {
    // Similar to blend in, but typically shorter
    return Math.round(this.calculateBlendInDuration(gesture, overlappingGestures) * 0.8);
  }

  private createBlendingCurve(gestureType: string): AnimationCurve {
    // Create appropriate blending curve based on gesture type
    let keyframes: Keyframe[];

    if (gestureType.includes('emphasis')) {
      // Sharp attack, sustained peak, gradual release
      keyframes = [
        { time: 0, value: 0, easing: 'ease_out' },
        { time: 0.2, value: 1.0, easing: 'linear' },
        { time: 0.8, value: 1.0, easing: 'ease_in' },
        { time: 1.0, value: 0 }
      ];
    } else if (gestureType.includes('micro')) {
      // Gentle curve for micro movements
      keyframes = [
        { time: 0, value: 0, easing: 'ease_in_out' },
        { time: 0.5, value: 1.0, easing: 'ease_in_out' },
        { time: 1.0, value: 0 }
      ];
    } else {
      // Standard curve
      keyframes = [
        { time: 0, value: 0, easing: 'ease_out' },
        { time: 0.3, value: 1.0, easing: 'linear' },
        { time: 0.7, value: 1.0, easing: 'ease_in' },
        { time: 1.0, value: 0 }
      ];
    }

    return {
      keyframes,
      interpolation: 'cubic',
      loop: false
    };
  }

  private calculateBlendingWeights(
    primaryGesture: SynchronizedGesture,
    overlappingGestures: SynchronizedGesture[]
  ): number[] {
    if (overlappingGestures.length === 0) return [1.0];

    const weights: number[] = [0.6]; // Primary gesture weight

    // Calculate weights for overlapping gestures based on priority and timing
    const totalOverlappingPriority = overlappingGestures.reduce((sum, g) => sum + g.priority, 0);
    
    overlappingGestures.forEach(gesture => {
      const weight = (gesture.priority / totalOverlappingPriority) * 0.4;
      weights.push(weight);
    });

    return weights;
  }
}

/**
 * Timing synchronization engine for precise speech-gesture alignment
 */
class TimingSynchronizationEngine {
  public synchronizeWithSpeech(
    gestures: Gesture[],
    speechMarkers: SpeechTimingMarker[],
    context: MovementContext
  ): SynchronizedGesture[] {
    return gestures.map(gesture => {
      const speechAlignment = this.findBestSpeechAlignment(gesture, speechMarkers);
      const timingAdjustments = this.calculateTimingAdjustments(gesture, speechAlignment);
      
      return {
        gesture: this.applyTimingAdjustments(gesture, timingAdjustments),
        speechAlignment,
        timingAdjustments,
        blendingInfo: this.createDefaultBlendingInfo(),
        priority: this.calculateGesturePriority(gesture, speechAlignment, context)
      };
    });
  }

  private findBestSpeechAlignment(
    gesture: Gesture,
    speechMarkers: SpeechTimingMarker[]
  ): SpeechAlignment {
    // Find speech markers that are relevant to this gesture
    const relevantMarkers = speechMarkers.filter(marker =>
      marker.associatedGestures.includes(gesture.type) ||
      this.isTemporallyRelevant(gesture, marker)
    );

    if (relevantMarkers.length === 0) {
      // No relevant markers, use gesture's original timing
      return {
        speechStartTime: gesture.timing,
        speechEndTime: gesture.timing + gesture.duration,
        gestureStartTime: gesture.timing,
        gestureEndTime: gesture.timing + gesture.duration,
        alignmentType: 'continuous',
        confidence: 0.3
      };
    }

    // Find the best alignment based on gesture type and speech markers
    const bestMarker = this.selectBestMarker(gesture, relevantMarkers);
    const alignmentType = this.determineAlignmentType(gesture.type, bestMarker.type);
    
    return this.createSpeechAlignment(gesture, bestMarker, alignmentType);
  }

  private isTemporallyRelevant(gesture: Gesture, marker: SpeechTimingMarker): boolean {
    const gestureEnd = gesture.timing + gesture.duration;
    const markerEnd = marker.endTime;
    
    // Check if there's temporal overlap or proximity
    const overlap = !(gestureEnd <= marker.startTime || markerEnd <= gesture.timing);
    const proximity = Math.abs(gesture.timing - marker.startTime) < 500; // 500ms proximity
    
    return overlap || proximity;
  }

  private selectBestMarker(
    gesture: Gesture,
    markers: SpeechTimingMarker[]
  ): SpeechTimingMarker {
    // Score markers based on relevance to gesture
    const scoredMarkers = markers.map(marker => ({
      marker,
      score: this.calculateMarkerRelevanceScore(gesture, marker)
    }));

    // Return marker with highest score
    return scoredMarkers.reduce((best, current) => 
      current.score > best.score ? current : best
    ).marker;
  }

  private calculateMarkerRelevanceScore(
    gesture: Gesture,
    marker: SpeechTimingMarker
  ): number {
    let score = 0;

    // Direct gesture association
    if (marker.associatedGestures.includes(gesture.type)) {
      score += 0.5;
    }

    // Intensity matching
    const intensityMatch = 1 - Math.abs(gesture.intensity - marker.intensity);
    score += intensityMatch * 0.3;

    // Temporal proximity
    const timeDiff = Math.abs(gesture.timing - marker.startTime);
    const proximityScore = Math.max(0, 1 - (timeDiff / 1000)); // 1 second max
    score += proximityScore * 0.2;

    return score;
  }

  private determineAlignmentType(
    gestureType: string,
    markerType: 'word_boundary' | 'syllable_stress' | 'phrase_boundary' | 'emphasis_peak'
  ): 'onset' | 'peak' | 'offset' | 'continuous' {
    // Determine how gesture should align with speech marker
    if (markerType === 'emphasis_peak') {
      return gestureType.includes('emphasis') ? 'peak' : 'onset';
    } else if (markerType === 'word_boundary') {
      return 'onset';
    } else if (markerType === 'phrase_boundary') {
      return 'offset';
    } else {
      return 'continuous';
    }
  }

  private createSpeechAlignment(
    gesture: Gesture,
    marker: SpeechTimingMarker,
    alignmentType: 'onset' | 'peak' | 'offset' | 'continuous'
  ): SpeechAlignment {
    let gestureStartTime: number;
    let gestureEndTime: number;
    let confidence = 0.8;

    switch (alignmentType) {
      case 'onset':
        // Gesture starts with speech marker
        gestureStartTime = marker.startTime;
        gestureEndTime = gestureStartTime + gesture.duration;
        break;

      case 'peak':
        // Gesture peaks with speech marker
        const peakTime = marker.startTime + ((marker.endTime - marker.startTime) * 0.5);
        gestureStartTime = peakTime - (gesture.duration * 0.3);
        gestureEndTime = peakTime + (gesture.duration * 0.7);
        break;

      case 'offset':
        // Gesture ends with speech marker
        gestureEndTime = marker.endTime;
        gestureStartTime = gestureEndTime - gesture.duration;
        break;

      case 'continuous':
        // Gesture spans the speech marker
        gestureStartTime = marker.startTime;
        gestureEndTime = Math.max(marker.endTime, gestureStartTime + gesture.duration);
        confidence = 0.6; // Lower confidence for continuous alignment
        break;
    }

    return {
      speechStartTime: marker.startTime,
      speechEndTime: marker.endTime,
      gestureStartTime,
      gestureEndTime,
      alignmentType,
      confidence
    };
  }

  private calculateTimingAdjustments(
    gesture: Gesture,
    speechAlignment: SpeechAlignment
  ): TimingAdjustment[] {
    const adjustments: TimingAdjustment[] = [];

    // Check if timing needs adjustment
    const originalEnd = gesture.timing + gesture.duration;
    const alignedEnd = speechAlignment.gestureEndTime;

    if (Math.abs(gesture.timing - speechAlignment.gestureStartTime) > 50) {
      adjustments.push({
        type: 'delay',
        originalTiming: gesture.timing,
        adjustedTiming: speechAlignment.gestureStartTime,
        reason: 'Speech alignment',
        intensity: Math.abs(gesture.timing - speechAlignment.gestureStartTime) / 1000
      });
    }

    if (Math.abs(originalEnd - alignedEnd) > 50) {
      const durationType = alignedEnd > originalEnd ? 'extend' : 'compress';
      adjustments.push({
        type: durationType,
        originalTiming: gesture.duration,
        adjustedTiming: speechAlignment.gestureEndTime - speechAlignment.gestureStartTime,
        reason: 'Duration alignment',
        intensity: Math.abs(originalEnd - alignedEnd) / gesture.duration
      });
    }

    return adjustments;
  }

  private applyTimingAdjustments(
    gesture: Gesture,
    adjustments: TimingAdjustment[]
  ): Gesture {
    let adjustedGesture = { ...gesture };

    adjustments.forEach(adjustment => {
      switch (adjustment.type) {
        case 'delay':
          adjustedGesture.timing = adjustment.adjustedTiming;
          break;
        case 'extend':
        case 'compress':
          adjustedGesture.duration = adjustment.adjustedTiming;
          break;
        case 'split':
          // For complex adjustments, might need to split gesture
          // This would require more complex logic
          break;
      }
    });

    return adjustedGesture;
  }

  private createDefaultBlendingInfo(): BlendingInfo {
    return {
      blendInDuration: 100,
      blendOutDuration: 100,
      blendingCurve: {
        keyframes: [
          { time: 0, value: 0 },
          { time: 1, value: 1 }
        ],
        interpolation: 'linear',
        loop: false
      },
      overlappingGestures: [],
      blendingWeights: [1.0]
    };
  }

  private calculateGesturePriority(
    gesture: Gesture,
    speechAlignment: SpeechAlignment,
    context: MovementContext
  ): number {
    let priority = gesture.intensity;

    // Boost priority based on alignment confidence
    priority *= speechAlignment.confidence;

    // Context-based priority adjustments
    if (context.emphasisLevel === 'high' && gesture.type.includes('emphasis')) {
      priority *= 1.2;
    }

    if (context.isQuestion && gesture.type.includes('tilt')) {
      priority *= 1.1;
    }

    return Math.min(1.0, priority);
  }
}