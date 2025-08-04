/**
 * Behavior Blending Engine
 * 
 * Handles smooth blending and transitions between different behavior states
 * to create natural, fluid avatar movements.
 */

import {
  SynchronizedBehavior,
  TimedHandGesture,
  TimedFacialExpression,
  TimedHeadMovement
} from './MultiModalBehaviorCoordinator';

export interface BlendingRule {
  name: string;
  priority: number;
  condition: (from: any, to: any) => boolean;
  blendFunction: (from: any, to: any, weight: number) => any;
}

export interface TransitionCurve {
  type: 'linear' | 'ease_in' | 'ease_out' | 'ease_in_out' | 'bounce' | 'elastic';
  duration: number;
  keyframes?: { time: number; value: number }[];
}

export class BehaviorBlendingEngine {
  private blendingRules: BlendingRule[];
  private transitionCurves: Map<string, TransitionCurve>;

  constructor() {
    this.blendingRules = this.initializeBlendingRules();
    this.transitionCurves = this.initializeTransitionCurves();
  }

  /**
   * Creates smooth transition between two synchronized behaviors
   */
  public createBehaviorTransition(
    fromBehavior: SynchronizedBehavior,
    toBehavior: SynchronizedBehavior,
    transitionDuration: number
  ): SynchronizedBehavior {
    const transitionSteps = Math.ceil(transitionDuration * 10); // 100ms steps
    const stepDuration = transitionDuration / transitionSteps;

    // Create blended behavior for each step
    const transitionBehaviors: any[] = [];

    for (let i = 0; i <= transitionSteps; i++) {
      const progress = i / transitionSteps;
      const blendWeight = this.calculateBlendWeight(progress, 'ease_in_out');

      const blendedStep = this.blendBehaviors(fromBehavior, toBehavior, blendWeight);
      blendedStep.startTime = fromBehavior.startTime + (i * stepDuration);
      blendedStep.endTime = blendedStep.startTime + stepDuration;

      transitionBehaviors.push(blendedStep);
    }

    // Return the final blended behavior
    return transitionBehaviors[transitionBehaviors.length - 1];
  }

  /**
   * Blends two behaviors with specified weight
   */
  public blendBehaviors(
    fromBehavior: SynchronizedBehavior,
    toBehavior: SynchronizedBehavior,
    blendWeight: number
  ): SynchronizedBehavior {
    return {
      id: this.generateBlendedId(fromBehavior.id, toBehavior.id),
      startTime: this.interpolate(fromBehavior.startTime, toBehavior.startTime, blendWeight),
      endTime: this.interpolate(fromBehavior.endTime, toBehavior.endTime, blendWeight),
      behaviors: {
        handGestures: this.blendHandGestures(
          fromBehavior.behaviors.handGestures,
          toBehavior.behaviors.handGestures,
          blendWeight
        ),
        facialExpressions: this.blendFacialExpressions(
          fromBehavior.behaviors.facialExpressions,
          toBehavior.behaviors.facialExpressions,
          blendWeight
        ),
        headMovements: this.blendHeadMovements(
          fromBehavior.behaviors.headMovements,
          toBehavior.behaviors.headMovements,
          blendWeight
        )
      },
      priority: Math.round(this.interpolate(fromBehavior.priority, toBehavior.priority, blendWeight)),
      conflictResolution: blendWeight > 0.5 ? toBehavior.conflictResolution : fromBehavior.conflictResolution
    };
  }

  /**
   * Blends multiple behaviors with specified weights
   */
  public blendMultipleBehaviors(
    behaviors: SynchronizedBehavior[],
    weights: number[]
  ): SynchronizedBehavior {
    if (behaviors.length === 0) {
      throw new Error('Cannot blend empty behavior array');
    }

    if (behaviors.length === 1) {
      return behaviors[0];
    }

    // Normalize weights
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    const normalizedWeights = weights.map(weight => weight / totalWeight);

    // Start with the first behavior as base
    let blendedBehavior = { ...behaviors[0] };

    // Progressively blend with each subsequent behavior
    for (let i = 1; i < behaviors.length; i++) {
      const cumulativeWeight = normalizedWeights.slice(0, i + 1).reduce((sum, w) => sum + w, 0);
      const currentWeight = normalizedWeights[i] / cumulativeWeight;

      blendedBehavior = this.blendBehaviors(blendedBehavior, behaviors[i], currentWeight);
    }

    return blendedBehavior;
  }

  /**
   * Creates adaptive blending based on behavior compatibility
   */
  public createAdaptiveBlend(
    behaviors: SynchronizedBehavior[],
    adaptationContext: {
      emotionalIntensity: number;
      culturalContext: string;
      speechContext: string;
    }
  ): SynchronizedBehavior {
    // Calculate compatibility scores between behaviors
    const compatibilityMatrix = this.calculateCompatibilityMatrix(behaviors);

    // Determine optimal blending weights based on compatibility and context
    const optimalWeights = this.calculateOptimalWeights(
      behaviors,
      compatibilityMatrix,
      adaptationContext
    );

    return this.blendMultipleBehaviors(behaviors, optimalWeights);
  }

  private blendHandGestures(
    fromGestures: TimedHandGesture[],
    toGestures: TimedHandGesture[],
    blendWeight: number
  ): TimedHandGesture[] {
    const blendedGestures: TimedHandGesture[] = [];

    // Create a map of all unique gesture types
    const allGestureTypes = new Set([
      ...fromGestures.map(g => g.type),
      ...toGestures.map(g => g.type)
    ]);

    for (const gestureType of allGestureTypes) {
      const fromGesture = fromGestures.find(g => g.type === gestureType);
      const toGesture = toGestures.find(g => g.type === gestureType);

      if (fromGesture && toGesture) {
        // Blend both gestures
        blendedGestures.push(this.blendSingleHandGesture(fromGesture, toGesture, blendWeight));
      } else if (fromGesture) {
        // Fade out from gesture
        blendedGestures.push({
          ...fromGesture,
          intensity: fromGesture.intensity * (1 - blendWeight),
          blendWeight: 1 - blendWeight
        });
      } else if (toGesture) {
        // Fade in to gesture
        blendedGestures.push({
          ...toGesture,
          intensity: toGesture.intensity * blendWeight,
          blendWeight: blendWeight
        });
      }
    }

    return blendedGestures.filter(gesture => gesture.intensity > 0.1); // Remove very weak gestures
  }

  private blendFacialExpressions(
    fromExpressions: TimedFacialExpression[],
    toExpressions: TimedFacialExpression[],
    blendWeight: number
  ): TimedFacialExpression[] {
    const blendedExpressions: TimedFacialExpression[] = [];

    const allExpressionTypes = new Set([
      ...fromExpressions.map(e => e.type),
      ...toExpressions.map(e => e.type)
    ]);

    for (const expressionType of allExpressionTypes) {
      const fromExpression = fromExpressions.find(e => e.type === expressionType);
      const toExpression = toExpressions.find(e => e.type === expressionType);

      if (fromExpression && toExpression) {
        blendedExpressions.push(this.blendSingleFacialExpression(fromExpression, toExpression, blendWeight));
      } else if (fromExpression) {
        blendedExpressions.push({
          ...fromExpression,
          intensity: fromExpression.intensity * (1 - blendWeight),
          blendWeight: 1 - blendWeight
        });
      } else if (toExpression) {
        blendedExpressions.push({
          ...toExpression,
          intensity: toExpression.intensity * blendWeight,
          blendWeight: blendWeight
        });
      }
    }

    return blendedExpressions.filter(expression => expression.intensity > 0.1);
  }

  private blendHeadMovements(
    fromMovements: TimedHeadMovement[],
    toMovements: TimedHeadMovement[],
    blendWeight: number
  ): TimedHeadMovement[] {
    const blendedMovements: TimedHeadMovement[] = [];

    const allMovementKeys = new Set([
      ...fromMovements.map(m => `${m.type}_${m.direction}`),
      ...toMovements.map(m => `${m.type}_${m.direction}`)
    ]);

    for (const movementKey of allMovementKeys) {
      const [type, direction] = movementKey.split('_');
      const fromMovement = fromMovements.find(m => m.type === type && m.direction === direction);
      const toMovement = toMovements.find(m => m.type === type && m.direction === direction);

      if (fromMovement && toMovement) {
        blendedMovements.push(this.blendSingleHeadMovement(fromMovement, toMovement, blendWeight));
      } else if (fromMovement) {
        blendedMovements.push({
          ...fromMovement,
          intensity: fromMovement.intensity * (1 - blendWeight),
          blendWeight: 1 - blendWeight
        });
      } else if (toMovement) {
        blendedMovements.push({
          ...toMovement,
          intensity: toMovement.intensity * blendWeight,
          blendWeight: blendWeight
        });
      }
    }

    return blendedMovements.filter(movement => movement.intensity > 0.1);
  }

  private blendSingleHandGesture(
    fromGesture: TimedHandGesture,
    toGesture: TimedHandGesture,
    blendWeight: number
  ): TimedHandGesture {
    // Apply blending rules if available
    const applicableRule = this.blendingRules.find(rule => 
      rule.condition(fromGesture, toGesture)
    );

    if (applicableRule) {
      return applicableRule.blendFunction(fromGesture, toGesture, blendWeight);
    }

    // Default blending
    return {
      ...fromGesture,
      intensity: this.interpolate(fromGesture.intensity, toGesture.intensity, blendWeight),
      duration: this.interpolate(fromGesture.duration, toGesture.duration, blendWeight),
      timing: this.interpolate(fromGesture.timing, toGesture.timing, blendWeight),
      absoluteStartTime: this.interpolate(fromGesture.absoluteStartTime, toGesture.absoluteStartTime, blendWeight),
      absoluteEndTime: this.interpolate(fromGesture.absoluteEndTime, toGesture.absoluteEndTime, blendWeight),
      blendWeight: blendWeight,
      synchronizeWithSpeech: blendWeight > 0.5 ? toGesture.synchronizeWithSpeech : fromGesture.synchronizeWithSpeech,
      culturalVariant: blendWeight > 0.5 ? toGesture.culturalVariant : fromGesture.culturalVariant
    };
  }

  private blendSingleFacialExpression(
    fromExpression: TimedFacialExpression,
    toExpression: TimedFacialExpression,
    blendWeight: number
  ): TimedFacialExpression {
    const applicableRule = this.blendingRules.find(rule => 
      rule.condition(fromExpression, toExpression)
    );

    if (applicableRule) {
      return applicableRule.blendFunction(fromExpression, toExpression, blendWeight);
    }

    return {
      ...fromExpression,
      intensity: this.interpolate(fromExpression.intensity, toExpression.intensity, blendWeight),
      duration: this.interpolate(fromExpression.duration, toExpression.duration, blendWeight),
      timing: this.interpolate(fromExpression.timing, toExpression.timing, blendWeight),
      absoluteStartTime: this.interpolate(fromExpression.absoluteStartTime, toExpression.absoluteStartTime, blendWeight),
      absoluteEndTime: this.interpolate(fromExpression.absoluteEndTime, toExpression.absoluteEndTime, blendWeight),
      culturalModifier: this.interpolate(fromExpression.culturalModifier, toExpression.culturalModifier, blendWeight),
      blendWeight: blendWeight
    };
  }

  private blendSingleHeadMovement(
    fromMovement: TimedHeadMovement,
    toMovement: TimedHeadMovement,
    blendWeight: number
  ): TimedHeadMovement {
    const applicableRule = this.blendingRules.find(rule => 
      rule.condition(fromMovement, toMovement)
    );

    if (applicableRule) {
      return applicableRule.blendFunction(fromMovement, toMovement, blendWeight);
    }

    return {
      ...fromMovement,
      intensity: this.interpolate(fromMovement.intensity, toMovement.intensity, blendWeight),
      duration: this.interpolate(fromMovement.duration, toMovement.duration, blendWeight),
      timing: this.interpolate(fromMovement.timing, toMovement.timing, blendWeight),
      absoluteStartTime: this.interpolate(fromMovement.absoluteStartTime, toMovement.absoluteStartTime, blendWeight),
      absoluteEndTime: this.interpolate(fromMovement.absoluteEndTime, toMovement.absoluteEndTime, blendWeight),
      blendWeight: blendWeight
    };
  }

  private calculateCompatibilityMatrix(behaviors: SynchronizedBehavior[]): number[][] {
    const matrix: number[][] = [];

    for (let i = 0; i < behaviors.length; i++) {
      matrix[i] = [];
      for (let j = 0; j < behaviors.length; j++) {
        if (i === j) {
          matrix[i][j] = 1.0;
        } else {
          matrix[i][j] = this.calculateBehaviorCompatibility(behaviors[i], behaviors[j]);
        }
      }
    }

    return matrix;
  }

  private calculateBehaviorCompatibility(
    behavior1: SynchronizedBehavior,
    behavior2: SynchronizedBehavior
  ): number {
    let compatibility = 1.0;

    // Check temporal compatibility
    const timeOverlap = this.calculateTimeOverlap(behavior1, behavior2);
    if (timeOverlap > 0) {
      compatibility *= 0.8; // Reduce compatibility for overlapping behaviors
    }

    // Check semantic compatibility
    const semanticCompatibility = this.calculateSemanticCompatibility(behavior1, behavior2);
    compatibility *= semanticCompatibility;

    // Check priority compatibility
    const priorityDiff = Math.abs(behavior1.priority - behavior2.priority);
    compatibility *= Math.max(0.5, 1 - (priorityDiff / 3));

    return Math.max(0, Math.min(1, compatibility));
  }

  private calculateSemanticCompatibility(
    behavior1: SynchronizedBehavior,
    behavior2: SynchronizedBehavior
  ): number {
    // Define semantic compatibility rules
    const compatibilityRules: Record<string, Record<string, number>> = {
      smile: { excitement: 0.9, neutral: 0.8, concern: 0.2, focus: 0.6 },
      concern: { focus: 0.8, empathy: 0.9, smile: 0.2, excitement: 0.1 },
      excitement: { smile: 0.9, celebratory: 0.9, neutral: 0.5, concern: 0.1 },
      neutral: { focus: 0.9, smile: 0.8, concern: 0.7, excitement: 0.5 },
      celebratory: { excitement: 0.9, supportive: 0.8, questioning: 0.3 },
      questioning: { supportive: 0.7, neutral: 0.8, celebratory: 0.3 }
    };

    let totalCompatibility = 1.0;
    let comparisons = 0;

    // Compare facial expressions
    for (const expr1 of behavior1.behaviors.facialExpressions) {
      for (const expr2 of behavior2.behaviors.facialExpressions) {
        const compatibility = compatibilityRules[expr1.type]?.[expr2.type] || 0.5;
        totalCompatibility *= compatibility;
        comparisons++;
      }
    }

    // Compare hand gestures
    for (const gesture1 of behavior1.behaviors.handGestures) {
      for (const gesture2 of behavior2.behaviors.handGestures) {
        const compatibility = compatibilityRules[gesture1.type]?.[gesture2.type] || 0.5;
        totalCompatibility *= compatibility;
        comparisons++;
      }
    }

    return comparisons > 0 ? Math.pow(totalCompatibility, 1 / comparisons) : 1.0;
  }

  private calculateOptimalWeights(
    behaviors: SynchronizedBehavior[],
    compatibilityMatrix: number[][],
    context: {
      emotionalIntensity: number;
      culturalContext: string;
      speechContext: string;
    }
  ): number[] {
    const weights = new Array(behaviors.length).fill(1 / behaviors.length);

    // Adjust weights based on compatibility
    for (let i = 0; i < behaviors.length; i++) {
      let compatibilityScore = 0;
      for (let j = 0; j < behaviors.length; j++) {
        if (i !== j) {
          compatibilityScore += compatibilityMatrix[i][j];
        }
      }
      weights[i] *= (compatibilityScore / (behaviors.length - 1));
    }

    // Adjust weights based on context
    for (let i = 0; i < behaviors.length; i++) {
      const behavior = behaviors[i];
      
      // Emotional intensity adjustment
      const intensityMatch = this.calculateIntensityMatch(behavior, context.emotionalIntensity);
      weights[i] *= intensityMatch;

      // Cultural context adjustment
      const culturalMatch = this.calculateCulturalMatch(behavior, context.culturalContext);
      weights[i] *= culturalMatch;

      // Speech context adjustment
      const speechMatch = this.calculateSpeechMatch(behavior, context.speechContext);
      weights[i] *= speechMatch;
    }

    // Normalize weights
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    return weights.map(weight => weight / totalWeight);
  }

  private calculateIntensityMatch(behavior: SynchronizedBehavior, targetIntensity: number): number {
    const behaviorIntensity = this.calculateBehaviorIntensity(behavior);
    const intensityDiff = Math.abs(behaviorIntensity - targetIntensity);
    return Math.max(0.3, 1 - intensityDiff);
  }

  private calculateBehaviorIntensity(behavior: SynchronizedBehavior): number {
    const gestureIntensity = behavior.behaviors.handGestures.reduce((sum, g) => sum + g.intensity, 0) / 
                            Math.max(1, behavior.behaviors.handGestures.length);
    const expressionIntensity = behavior.behaviors.facialExpressions.reduce((sum, e) => sum + e.intensity, 0) / 
                               Math.max(1, behavior.behaviors.facialExpressions.length);
    const movementIntensity = behavior.behaviors.headMovements.reduce((sum, m) => sum + m.intensity, 0) / 
                             Math.max(1, behavior.behaviors.headMovements.length);

    return (gestureIntensity + expressionIntensity + movementIntensity) / 3;
  }

  private calculateCulturalMatch(behavior: SynchronizedBehavior, culturalContext: string): number {
    // Simplified cultural matching - in real implementation, this would be more sophisticated
    const culturalVariants = [
      ...behavior.behaviors.handGestures.map(g => g.culturalVariant),
      ...behavior.behaviors.facialExpressions.map(e => e.culturalModifier)
    ].filter(Boolean);

    if (culturalVariants.length === 0) return 1.0;

    // Check if behavior has appropriate cultural adaptations
    const hasMatchingCulture = culturalVariants.some(variant => 
      typeof variant === 'string' ? variant.includes(culturalContext) : true
    );

    return hasMatchingCulture ? 1.2 : 0.8;
  }

  private calculateSpeechMatch(behavior: SynchronizedBehavior, speechContext: string): number {
    const contextRelevance: Record<string, string[]> = {
      question: ['questioning', 'tilt', 'supportive'],
      explanation: ['descriptive', 'pointing', 'nod', 'focus'],
      celebration: ['celebratory', 'excitement', 'smile'],
      instruction: ['pointing', 'counting', 'emphasis', 'focus']
    };

    const relevantTypes = contextRelevance[speechContext] || [];
    const behaviorTypes = [
      ...behavior.behaviors.handGestures.map(g => g.type),
      ...behavior.behaviors.facialExpressions.map(e => e.type),
      ...behavior.behaviors.headMovements.map(m => m.type)
    ];

    const matchingTypes = behaviorTypes.filter(type => relevantTypes.includes(type));
    const matchRatio = matchingTypes.length / Math.max(1, behaviorTypes.length);

    return 0.5 + (matchRatio * 0.5); // Scale from 0.5 to 1.0
  }

  private calculateTimeOverlap(behavior1: SynchronizedBehavior, behavior2: SynchronizedBehavior): number {
    const start = Math.max(behavior1.startTime, behavior2.startTime);
    const end = Math.min(behavior1.endTime, behavior2.endTime);
    return Math.max(0, end - start);
  }

  private calculateBlendWeight(progress: number, curveType: string): number {
    const curve = this.transitionCurves.get(curveType);
    if (!curve) return progress;

    switch (curve.type) {
      case 'linear':
        return progress;
      case 'ease_in':
        return progress * progress;
      case 'ease_out':
        return 1 - Math.pow(1 - progress, 2);
      case 'ease_in_out':
        return progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      case 'bounce':
        return this.bounceEasing(progress);
      case 'elastic':
        return this.elasticEasing(progress);
      default:
        return progress;
    }
  }

  private bounceEasing(t: number): number {
    const n1 = 7.5625;
    const d1 = 2.75;

    if (t < 1 / d1) {
      return n1 * t * t;
    } else if (t < 2 / d1) {
      return n1 * (t -= 1.5 / d1) * t + 0.75;
    } else if (t < 2.5 / d1) {
      return n1 * (t -= 2.25 / d1) * t + 0.9375;
    } else {
      return n1 * (t -= 2.625 / d1) * t + 0.984375;
    }
  }

  private elasticEasing(t: number): number {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 : -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * c4);
  }

  private interpolate(from: number, to: number, weight: number): number {
    return from + (to - from) * weight;
  }

  private generateBlendedId(id1: string, id2: string): string {
    return `blended_${id1.split('_')[1]}_${id2.split('_')[1]}_${Date.now()}`;
  }

  private initializeBlendingRules(): BlendingRule[] {
    return [
      {
        name: 'gesture_intensity_preservation',
        priority: 1,
        condition: (from, to) => from.type === to.type && from.category === 'hand',
        blendFunction: (from, to, weight) => ({
          ...from,
          intensity: Math.max(from.intensity, to.intensity) * (0.7 + weight * 0.3),
          duration: this.interpolate(from.duration, to.duration, weight),
          blendWeight: weight
        })
      },
      {
        name: 'expression_smooth_transition',
        priority: 2,
        condition: (from, to) => from.category === 'face' && to.category === 'face',
        blendFunction: (from, to, weight) => {
          const smoothWeight = this.calculateBlendWeight(weight, 'ease_in_out');
          return {
            ...from,
            intensity: this.interpolate(from.intensity, to.intensity, smoothWeight),
            culturalModifier: this.interpolate(from.culturalModifier, to.culturalModifier, smoothWeight),
            blendWeight: smoothWeight
          };
        }
      },
      {
        name: 'head_movement_momentum',
        priority: 3,
        condition: (from, to) => from.category === 'head' && to.category === 'head',
        blendFunction: (from, to, weight) => {
          // Preserve momentum in head movements
          const momentumWeight = weight * 0.8 + 0.2; // Slower transitions for head movements
          return {
            ...from,
            intensity: this.interpolate(from.intensity, to.intensity, momentumWeight),
            duration: Math.max(from.duration, to.duration), // Use longer duration
            blendWeight: momentumWeight
          };
        }
      }
    ];
  }

  private initializeTransitionCurves(): Map<string, TransitionCurve> {
    const curves = new Map<string, TransitionCurve>();

    curves.set('linear', { type: 'linear', duration: 1.0 });
    curves.set('ease_in', { type: 'ease_in', duration: 1.0 });
    curves.set('ease_out', { type: 'ease_out', duration: 1.0 });
    curves.set('ease_in_out', { type: 'ease_in_out', duration: 1.0 });
    curves.set('bounce', { type: 'bounce', duration: 1.0 });
    curves.set('elastic', { type: 'elastic', duration: 1.0 });

    return curves;
  }
}