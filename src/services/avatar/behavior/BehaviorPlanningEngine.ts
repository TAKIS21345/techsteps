/**
 * AI-driven behavior planning engine for avatar behavior control
 */

import { 
  ContentAnalysis, 
  BehaviorPlan, 
  HandGesture, 
  FacialExpression, 
  HeadMovement,
  EmotionalTone,
  CulturalAdaptation,
  BehaviorResponse,
  SpeechContext
} from './types';

import { CulturalProfile } from '../movement/types';

interface BehaviorRule {
  contentType: string;
  sentiment: string;
  emotionalIntensity: { min: number; max: number };
  priority: 'low' | 'medium' | 'high';
  behaviors: {
    gestures: string[];
    expressions: string[];
    headMovements: string[];
  };
  culturalAdaptations: string[];
}

interface BehaviorConflict {
  type: 'gesture' | 'expression' | 'movement';
  conflictingBehaviors: string[];
  resolution: 'priority' | 'blend' | 'sequence';
}

export class BehaviorPlanningEngine {
  private behaviorRules: Map<string, BehaviorRule>;
  private gestureLibrary: Map<string, HandGesture[]>;
  private expressionLibrary: Map<string, FacialExpression[]>;
  private headMovementLibrary: Map<string, HeadMovement[]>;
  private currentBehaviorPlan: BehaviorPlan | null = null;
  private behaviorHistory: BehaviorPlan[] = [];
  private maxHistorySize = 10;
  constructor() {
    this.behaviorRules = new Map();
    this.gestureLibrary = new Map();
    this.expressionLibrary = new Map();
    this.headMovementLibrary = new Map();
    
    this.initializeBehaviorRules();
    this.initializeGestureLibrary();
    this.initializeExpressionLibrary();
    this.initializeHeadMovementLibrary();
  }

  /**
   * Creates a comprehensive behavior plan based on content analysis
   */
  public async planBehavior(
    analysis: ContentAnalysis,
    context: SpeechContext,
    previousPlan?: BehaviorPlan
  ): Promise<BehaviorResponse> {
    // Find matching behavior rules
    const matchingRules = this.findMatchingRules(analysis);
    
    // Generate base behavior plan
    const basePlan = this.generateBaseBehaviorPlan(analysis, matchingRules);
    
    // Apply cultural adaptations
    const culturallyAdaptedPlan = this.applyCulturalAdaptations(basePlan, analysis, context);
    
    // Resolve behavior conflicts
    const resolvedPlan = this.resolveBehaviorConflicts(culturallyAdaptedPlan);
    
    // Apply real-time adaptations based on previous behavior
    const adaptedPlan = this.applyRealTimeAdaptations(resolvedPlan, previousPlan, analysis);
    
    // Calculate confidence and generate alternatives
    const confidence = this.calculatePlanConfidence(adaptedPlan, analysis);
    const alternatives = this.generateAlternativePlans(analysis, context, adaptedPlan);
    
    // Store in history
    this.updateBehaviorHistory(adaptedPlan);
    this.currentBehaviorPlan = adaptedPlan;
    
    return {
      behaviors: adaptedPlan,
      confidence,
      reasoning: this.generateReasoningExplanation(analysis, adaptedPlan),
      alternatives
    };
  }



  /**
   * Adapts behavior plan in real-time based on changing content context
   */
  public adaptBehaviorRealTime(
    newAnalysis: ContentAnalysis,
    currentPlan: BehaviorPlan,
    context: SpeechContext
  ): BehaviorPlan {
    // Check if significant adaptation is needed
    const adaptationNeeded = this.assessAdaptationNeed(newAnalysis, currentPlan);
    
    if (!adaptationNeeded.isNeeded) {
      return currentPlan;
    }
    
    // Create incremental adaptations
    const adaptedPlan = { ...currentPlan };
    
    // Adapt gestures based on new content
    if (adaptationNeeded.gestureAdaptation) {
      adaptedPlan.handGestures = this.adaptGestures(
        currentPlan.handGestures,
        newAnalysis,
        context
      );
    }
    
    // Adapt expressions based on emotional changes
    if (adaptationNeeded.expressionAdaptation) {
      adaptedPlan.facialExpressions = this.adaptExpressions(
        currentPlan.facialExpressions,
        newAnalysis
      );
    }
    
    // Adapt head movements for emphasis changes
    if (adaptationNeeded.movementAdaptation) {
      adaptedPlan.headMovements = this.adaptHeadMovements(
        currentPlan.headMovements,
        newAnalysis
      );
    }
    
    // Update emotional tone
    adaptedPlan.emotionalTone = this.calculateEmotionalTone(newAnalysis, context);
    
    return adaptedPlan;
  }

  /**
   * Resolves conflicts between competing behaviors using priority system
   */
  public resolveBehaviorConflicts(plan: BehaviorPlan): BehaviorPlan {
    const conflicts = this.detectBehaviorConflicts(plan);
    
    if (conflicts.length === 0) {
      return plan;
    }
    
    let resolvedPlan = { ...plan };
    
    for (const conflict of conflicts) {
      switch (conflict.resolution) {
        case 'priority':
          resolvedPlan = this.resolvePriorityConflict(resolvedPlan, conflict);
          break;
        case 'blend':
          resolvedPlan = this.resolveBlendConflict(resolvedPlan, conflict);
          break;
        case 'sequence':
          resolvedPlan = this.resolveSequenceConflict(resolvedPlan, conflict);
          break;
      }
    }
    
    return resolvedPlan;
  }

  private findMatchingRules(analysis: ContentAnalysis): BehaviorRule[] {
    const matchingRules: BehaviorRule[] = [];
    
    for (const [key, rule] of this.behaviorRules) {
      const contentTypeMatch = rule.contentType === analysis.contentType || rule.contentType === 'any';
      const sentimentMatch = rule.sentiment === analysis.sentiment || rule.sentiment === 'any';
      const intensityMatch = analysis.emotionalIntensity >= rule.emotionalIntensity.min &&
                           analysis.emotionalIntensity <= rule.emotionalIntensity.max;
      
      if (contentTypeMatch && sentimentMatch && intensityMatch) {
        matchingRules.push(rule);
      }
    }
    
    // Sort by priority
    return matchingRules.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  private generateBaseBehaviorPlan(
    analysis: ContentAnalysis,
    rules: BehaviorRule[]
  ): BehaviorPlan {
    const plan: BehaviorPlan = {
      handGestures: [],
      facialExpressions: [],
      headMovements: [],
      emotionalTone: this.calculateEmotionalTone(analysis),
      priority: this.determinePlanPriority(analysis, rules),
      culturalAdaptations: []
    };
    
    // Aggregate behaviors from matching rules
    for (const rule of rules.slice(0, 3)) { // Use top 3 rules
      // Add gestures
      for (const gestureType of rule.behaviors.gestures) {
        const gestures = this.gestureLibrary.get(gestureType) || [];
        plan.handGestures.push(...this.selectAppropriateGestures(gestures, analysis));
      }
      
      // Add expressions
      for (const expressionType of rule.behaviors.expressions) {
        const expressions = this.expressionLibrary.get(expressionType) || [];
        plan.facialExpressions.push(...this.selectAppropriateExpressions(expressions, analysis));
      }
      
      // Add head movements
      for (const movementType of rule.behaviors.headMovements) {
        const movements = this.headMovementLibrary.get(movementType) || [];
        plan.headMovements.push(...this.selectAppropriateMovements(movements, analysis));
      }
    }
    
    return plan;
  }

  private applyCulturalAdaptations(
    plan: BehaviorPlan,
    analysis: ContentAnalysis,
    context: SpeechContext
  ): BehaviorPlan {
    const adaptedPlan = { ...plan };
    const culturalAdaptations: CulturalAdaptation[] = [];
    
    switch (context.culturalBackground) {
      case 'eastern':
        // Reduce gesture amplitude, increase formality
        adaptedPlan.handGestures = adaptedPlan.handGestures.map(gesture => ({
          ...gesture,
          intensity: gesture.intensity * 0.7,
          culturalVariant: 'eastern'
        }));
        culturalAdaptations.push({
          gestureModification: 'reduced_amplitude',
          intensityAdjustment: -0.3,
          appropriatenessFilter: true
        });
        break;
        
      case 'latin':
        // Increase expressiveness and gesture frequency
        adaptedPlan.handGestures = adaptedPlan.handGestures.map(gesture => ({
          ...gesture,
          intensity: Math.min(gesture.intensity * 1.3, 1),
          culturalVariant: 'latin'
        }));
        culturalAdaptations.push({
          gestureModification: 'increased_expressiveness',
          intensityAdjustment: 0.3,
          appropriatenessFilter: false
        });
        break;
        
      case 'western':
        // Balanced approach with emphasis on clarity
        adaptedPlan.headMovements = adaptedPlan.headMovements.map(movement => ({
          ...movement,
          intensity: movement.type === 'emphasis' ? movement.intensity * 1.2 : movement.intensity
        }));
        culturalAdaptations.push({
          gestureModification: 'clarity_emphasis',
          intensityAdjustment: 0.1,
          appropriatenessFilter: true
        });
        break;
    }
    
    adaptedPlan.culturalAdaptations = culturalAdaptations;
    return adaptedPlan;
  }

  private applyRealTimeAdaptations(
    plan: BehaviorPlan,
    previousPlan: BehaviorPlan | undefined,
    analysis: ContentAnalysis
  ): BehaviorPlan {
    if (!previousPlan) {
      return plan;
    }
    
    const adaptedPlan = { ...plan };
    
    // Avoid repetitive behaviors
    adaptedPlan.handGestures = this.avoidRepetitiveGestures(
      plan.handGestures,
      previousPlan.handGestures
    );
    
    // Smooth emotional transitions
    adaptedPlan.emotionalTone = this.smoothEmotionalTransition(
      plan.emotionalTone,
      previousPlan.emotionalTone,
      analysis.emotionalIntensity
    );
    
    // Maintain behavioral coherence
    adaptedPlan.priority = this.adjustPriorityBasedOnHistory(plan.priority, previousPlan.priority);
    
    return adaptedPlan;
  }

  private calculateEmotionalTone(
    analysis: ContentAnalysis,
    context?: SpeechContext
  ): EmotionalTone {
    const baseWarmth = analysis.sentiment === 'positive' ? 0.8 : 
                      analysis.sentiment === 'negative' ? 0.3 : 0.5;
    
    const baseEnergy = analysis.emotionalIntensity;
    
    const baseFormality = context?.formalityLevel === 'formal' ? 0.8 :
                         context?.formalityLevel === 'professional' ? 0.6 : 0.3;
    
    const baseEmpathy = analysis.contentType === 'question' ? 0.7 :
                       analysis.contentType === 'explanation' ? 0.6 : 0.5;
    
    return {
      warmth: Math.min(Math.max(baseWarmth + (analysis.emotionalIntensity * 0.2), 0), 1),
      energy: baseEnergy,
      formality: baseFormality,
      empathy: Math.min(Math.max(baseEmpathy + (analysis.emotionalIntensity * 0.1), 0), 1)
    };
  }

  private determinePlanPriority(
    analysis: ContentAnalysis,
    rules: BehaviorRule[]
  ): 'low' | 'medium' | 'high' {
    if (rules.length === 0) return 'low';
    
    const highPriorityTypes = ['question', 'celebration', 'instruction'];
    const highEmotionalIntensity = analysis.emotionalIntensity > 0.7;
    const highConfidence = analysis.confidence > 0.8;
    
    if (highPriorityTypes.includes(analysis.contentType) || 
        (highEmotionalIntensity && highConfidence)) {
      return 'high';
    }
    
    if (analysis.emotionalIntensity > 0.4 || analysis.confidence > 0.6) {
      return 'medium';
    }
    
    return 'low';
  }

  private selectAppropriateGestures(
    gestures: HandGesture[],
    analysis: ContentAnalysis
  ): HandGesture[] {
    return gestures
      .filter(gesture => this.isGestureAppropriate(gesture, analysis))
      .slice(0, 2) // Limit to 2 gestures to avoid overwhelming
      .map(gesture => ({
        ...gesture,
        intensity: gesture.intensity * analysis.emotionalIntensity,
        timing: this.calculateGestureTiming(gesture, analysis)
      }));
  }

  private selectAppropriateExpressions(
    expressions: FacialExpression[],
    analysis: ContentAnalysis
  ): FacialExpression[] {
    return expressions
      .filter(expression => this.isExpressionAppropriate(expression, analysis))
      .slice(0, 1) // Usually one primary expression
      .map(expression => ({
        ...expression,
        intensity: expression.intensity * analysis.emotionalIntensity,
        timing: this.calculateExpressionTiming(expression, analysis)
      }));
  }

  private selectAppropriateMovements(
    movements: HeadMovement[],
    analysis: ContentAnalysis
  ): HeadMovement[] {
    return movements
      .filter(movement => this.isMovementAppropriate(movement, analysis))
      .slice(0, 2)
      .map(movement => ({
        ...movement,
        intensity: movement.intensity * analysis.emotionalIntensity,
        timing: this.calculateMovementTiming(movement, analysis)
      }));
  }

  private isGestureAppropriate(gesture: HandGesture, analysis: ContentAnalysis): boolean {
    switch (analysis.contentType) {
      case 'question':
        return ['questioning', 'supportive'].includes(gesture.type);
      case 'explanation':
        return ['descriptive', 'pointing'].includes(gesture.type);
      case 'celebration':
        return ['celebratory', 'supportive'].includes(gesture.type);
      case 'instruction':
        return ['pointing', 'descriptive', 'counting'].includes(gesture.type);
      default:
        return true;
    }
  }

  private isExpressionAppropriate(expression: FacialExpression, analysis: ContentAnalysis): boolean {
    switch (analysis.sentiment) {
      case 'positive':
        return ['smile', 'excitement', 'neutral'].includes(expression.type);
      case 'negative':
        return ['concern', 'empathy', 'focus'].includes(expression.type);
      default:
        return ['neutral', 'focus'].includes(expression.type);
    }
  }

  private isMovementAppropriate(movement: HeadMovement, analysis: ContentAnalysis): boolean {
    switch (analysis.contentType) {
      case 'question':
        return ['tilt', 'turn'].includes(movement.type);
      case 'explanation':
        return ['nod', 'emphasis'].includes(movement.type);
      default:
        return true;
    }
  }

  private calculateGestureTiming(gesture: HandGesture, analysis: ContentAnalysis): number {
    // Base timing on content type and emotional intensity
    const baseDelay = analysis.contentType === 'question' ? 0.2 : 0.1;
    const intensityModifier = analysis.emotionalIntensity * 0.1;
    return Math.max(baseDelay - intensityModifier, 0);
  }

  private calculateExpressionTiming(expression: FacialExpression, analysis: ContentAnalysis): number {
    // Expressions should appear quickly for emotional content
    return analysis.emotionalIntensity > 0.6 ? 0.05 : 0.15;
  }

  private calculateMovementTiming(movement: HeadMovement, analysis: ContentAnalysis): number {
    // Head movements for emphasis should be synchronized with speech
    return movement.type === 'emphasis' ? 0 : 0.1;
  }

  private detectBehaviorConflicts(plan: BehaviorPlan): BehaviorConflict[] {
    const conflicts: BehaviorConflict[] = [];
    
    // Check for gesture conflicts (too many simultaneous gestures)
    if (plan.handGestures.length > 2) {
      conflicts.push({
        type: 'gesture',
        conflictingBehaviors: plan.handGestures.map(g => g.type),
        resolution: 'priority'
      });
    }
    
    // Check for expression conflicts (conflicting emotional expressions)
    const conflictingExpressions = this.findConflictingExpressions(plan.facialExpressions);
    if (conflictingExpressions.length > 0) {
      conflicts.push({
        type: 'expression',
        conflictingBehaviors: conflictingExpressions,
        resolution: 'blend'
      });
    }
    
    // Check for movement conflicts (too many head movements)
    if (plan.headMovements.length > 3) {
      conflicts.push({
        type: 'movement',
        conflictingBehaviors: plan.headMovements.map(m => m.type),
        resolution: 'sequence'
      });
    }
    
    return conflicts;
  }

  private findConflictingExpressions(expressions: FacialExpression[]): string[] {
    const conflictPairs = [
      ['smile', 'concern'],
      ['excitement', 'focus'],
      ['surprise', 'neutral']
    ];
    
    const expressionTypes = expressions.map(e => e.type);
    const conflicts: string[] = [];
    
    for (const [expr1, expr2] of conflictPairs) {
      if (expressionTypes.includes(expr1) && expressionTypes.includes(expr2)) {
        conflicts.push(expr1, expr2);
      }
    }
    
    return [...new Set(conflicts)];
  }

  private resolvePriorityConflict(plan: BehaviorPlan, conflict: BehaviorConflict): BehaviorPlan {
    const resolvedPlan = { ...plan };
    
    if (conflict.type === 'gesture') {
      // Keep only the highest priority gestures
      resolvedPlan.handGestures = plan.handGestures
        .sort((a, b) => b.intensity - a.intensity)
        .slice(0, 2);
    }
    
    return resolvedPlan;
  }

  private resolveBlendConflict(plan: BehaviorPlan, conflict: BehaviorConflict): BehaviorPlan {
    const resolvedPlan = { ...plan };
    
    if (conflict.type === 'expression') {
      // Blend conflicting expressions by reducing intensity
      resolvedPlan.facialExpressions = plan.facialExpressions.map(expr => ({
        ...expr,
        intensity: expr.intensity * 0.7
      }));
    }
    
    return resolvedPlan;
  }

  private resolveSequenceConflict(plan: BehaviorPlan, conflict: BehaviorConflict): BehaviorPlan {
    const resolvedPlan = { ...plan };
    
    if (conflict.type === 'movement') {
      // Sequence movements with appropriate delays
      resolvedPlan.headMovements = plan.headMovements
        .slice(0, 3)
        .map((movement, index) => ({
          ...movement,
          timing: movement.timing + (index * 0.3)
        }));
    }
    
    return resolvedPlan;
  }

  private assessAdaptationNeed(
    newAnalysis: ContentAnalysis,
    currentPlan: BehaviorPlan
  ): {
    isNeeded: boolean;
    gestureAdaptation: boolean;
    expressionAdaptation: boolean;
    movementAdaptation: boolean;
  } {
    // Simple adaptation assessment - in real implementation, this would be more sophisticated
    const significantChange = Math.abs(newAnalysis.emotionalIntensity - 0.5) > 0.3;
    
    return {
      isNeeded: significantChange,
      gestureAdaptation: significantChange && newAnalysis.contentType !== 'greeting',
      expressionAdaptation: significantChange,
      movementAdaptation: newAnalysis.contentType === 'question' || newAnalysis.contentType === 'instruction'
    };
  }

  private adaptGestures(
    currentGestures: HandGesture[],
    analysis: ContentAnalysis,
    context: SpeechContext
  ): HandGesture[] {
    return currentGestures.map(gesture => ({
      ...gesture,
      intensity: gesture.intensity * analysis.emotionalIntensity,
      culturalVariant: context.culturalBackground
    }));
  }

  private adaptExpressions(
    currentExpressions: FacialExpression[],
    analysis: ContentAnalysis
  ): FacialExpression[] {
    return currentExpressions.map(expression => ({
      ...expression,
      intensity: expression.intensity * analysis.emotionalIntensity
    }));
  }

  private adaptHeadMovements(
    currentMovements: HeadMovement[],
    analysis: ContentAnalysis
  ): HeadMovement[] {
    return currentMovements.map(movement => ({
      ...movement,
      intensity: movement.intensity * analysis.emotionalIntensity
    }));
  }

  private avoidRepetitiveGestures(
    newGestures: HandGesture[],
    previousGestures: HandGesture[]
  ): HandGesture[] {
    const previousTypes = previousGestures.map(g => g.type);
    return newGestures.filter(gesture => !previousTypes.includes(gesture.type));
  }

  private smoothEmotionalTransition(
    newTone: EmotionalTone,
    previousTone: EmotionalTone,
    intensity: number
  ): EmotionalTone {
    const blendFactor = Math.min(intensity, 0.7);
    
    return {
      warmth: newTone.warmth * blendFactor + previousTone.warmth * (1 - blendFactor),
      energy: newTone.energy * blendFactor + previousTone.energy * (1 - blendFactor),
      formality: newTone.formality * blendFactor + previousTone.formality * (1 - blendFactor),
      empathy: newTone.empathy * blendFactor + previousTone.empathy * (1 - blendFactor)
    };
  }

  private adjustPriorityBasedOnHistory(
    newPriority: 'low' | 'medium' | 'high',
    previousPriority: 'low' | 'medium' | 'high'
  ): 'low' | 'medium' | 'high' {
    // Avoid sudden priority jumps
    const priorityLevels = { low: 1, medium: 2, high: 3 };
    const newLevel = priorityLevels[newPriority];
    const prevLevel = priorityLevels[previousPriority];
    
    if (Math.abs(newLevel - prevLevel) > 1) {
      // Smooth the transition
      const adjustedLevel = prevLevel + Math.sign(newLevel - prevLevel);
      const levelMap = { 1: 'low', 2: 'medium', 3: 'high' } as const;
      return levelMap[adjustedLevel as keyof typeof levelMap];
    }
    
    return newPriority;
  }

  private calculatePlanConfidence(plan: BehaviorPlan, analysis: ContentAnalysis): number {
    const behaviorCount = plan.handGestures.length + plan.facialExpressions.length + plan.headMovements.length;
    const behaviorFactor = Math.min(behaviorCount / 5, 1); // Normalize to 5 behaviors
    const analysisFactor = analysis.confidence;
    const priorityFactor = plan.priority === 'high' ? 1 : plan.priority === 'medium' ? 0.8 : 0.6;
    
    return (behaviorFactor * 0.3 + analysisFactor * 0.5 + priorityFactor * 0.2);
  }

  private generateAlternativePlans(
    analysis: ContentAnalysis,
    context: SpeechContext,
    primaryPlan: BehaviorPlan
  ): BehaviorPlan[] {
    // Generate 2 alternative plans with different approaches
    const alternatives: BehaviorPlan[] = [];
    
    // Conservative alternative (reduced intensity)
    const conservativePlan: BehaviorPlan = {
      ...primaryPlan,
      handGestures: primaryPlan.handGestures.map(g => ({ ...g, intensity: g.intensity * 0.6 })),
      facialExpressions: primaryPlan.facialExpressions.map(e => ({ ...e, intensity: e.intensity * 0.6 })),
      headMovements: primaryPlan.headMovements.map(m => ({ ...m, intensity: m.intensity * 0.6 })),
      priority: 'low'
    };
    
    // Expressive alternative (increased intensity)
    const expressivePlan: BehaviorPlan = {
      ...primaryPlan,
      handGestures: primaryPlan.handGestures.map(g => ({ ...g, intensity: Math.min(g.intensity * 1.4, 1) })),
      facialExpressions: primaryPlan.facialExpressions.map(e => ({ ...e, intensity: Math.min(e.intensity * 1.4, 1) })),
      headMovements: primaryPlan.headMovements.map(m => ({ ...m, intensity: Math.min(m.intensity * 1.4, 1) })),
      priority: 'high'
    };
    
    alternatives.push(conservativePlan, expressivePlan);
    return alternatives;
  }

  private generateReasoningExplanation(analysis: ContentAnalysis, plan: BehaviorPlan): string {
    const reasons: string[] = [];
    
    reasons.push(`Content type: ${analysis.contentType} (${analysis.confidence.toFixed(2)} confidence)`);
    reasons.push(`Sentiment: ${analysis.sentiment} with ${(analysis.emotionalIntensity * 100).toFixed(0)}% intensity`);
    reasons.push(`Selected ${plan.handGestures.length} gestures, ${plan.facialExpressions.length} expressions, ${plan.headMovements.length} movements`);
    reasons.push(`Priority: ${plan.priority} based on content analysis`);
    
    if (plan.culturalAdaptations.length > 0) {
      reasons.push(`Applied ${plan.culturalAdaptations.length} cultural adaptations`);
    }
    
    return reasons.join('; ');
  }

  private updateBehaviorHistory(plan: BehaviorPlan): void {
    this.behaviorHistory.push(plan);
    if (this.behaviorHistory.length > this.maxHistorySize) {
      this.behaviorHistory.shift();
    }
  }

  private initializeBehaviorRules(): void {
    // Question-based behaviors
    this.behaviorRules.set('question_positive', {
      contentType: 'question',
      sentiment: 'positive',
      emotionalIntensity: { min: 0, max: 1 },
      priority: 'high',
      behaviors: {
        gestures: ['questioning', 'supportive'],
        expressions: ['smile', 'neutral'],
        headMovements: ['tilt', 'nod']
      },
      culturalAdaptations: ['respectful_pause', 'gentle_approach']
    });

    this.behaviorRules.set('question_neutral', {
      contentType: 'question',
      sentiment: 'neutral',
      emotionalIntensity: { min: 0, max: 1 },
      priority: 'high',
      behaviors: {
        gestures: ['questioning'],
        expressions: ['neutral', 'focus'],
        headMovements: ['tilt']
      },
      culturalAdaptations: ['clear_articulation']
    });

    // Explanation behaviors
    this.behaviorRules.set('explanation_any', {
      contentType: 'explanation',
      sentiment: 'any',
      emotionalIntensity: { min: 0, max: 1 },
      priority: 'medium',
      behaviors: {
        gestures: ['descriptive', 'pointing'],
        expressions: ['focus', 'neutral'],
        headMovements: ['nod', 'emphasis']
      },
      culturalAdaptations: ['clear_gestures', 'educational_tone']
    });

    // Celebration behaviors
    this.behaviorRules.set('celebration_positive', {
      contentType: 'celebration',
      sentiment: 'positive',
      emotionalIntensity: { min: 0.3, max: 1 },
      priority: 'high',
      behaviors: {
        gestures: ['celebratory', 'supportive'],
        expressions: ['smile', 'excitement'],
        headMovements: ['nod', 'emphasis']
      },
      culturalAdaptations: ['appropriate_enthusiasm']
    });

    // Instruction behaviors
    this.behaviorRules.set('instruction_any', {
      contentType: 'instruction',
      sentiment: 'any',
      emotionalIntensity: { min: 0, max: 1 },
      priority: 'high',
      behaviors: {
        gestures: ['pointing', 'descriptive', 'counting'],
        expressions: ['focus', 'neutral'],
        headMovements: ['nod', 'emphasis']
      },
      culturalAdaptations: ['clear_direction', 'step_by_step']
    });

    // Greeting behaviors
    this.behaviorRules.set('greeting_positive', {
      contentType: 'greeting',
      sentiment: 'positive',
      emotionalIntensity: { min: 0, max: 1 },
      priority: 'medium',
      behaviors: {
        gestures: ['supportive'],
        expressions: ['smile', 'neutral'],
        headMovements: ['nod']
      },
      culturalAdaptations: ['welcoming_tone']
    });

    // Farewell behaviors
    this.behaviorRules.set('farewell_any', {
      contentType: 'farewell',
      sentiment: 'any',
      emotionalIntensity: { min: 0, max: 1 },
      priority: 'medium',
      behaviors: {
        gestures: ['supportive'],
        expressions: ['smile', 'neutral'],
        headMovements: ['nod']
      },
      culturalAdaptations: ['polite_closure']
    });

    // High emotional intensity override
    this.behaviorRules.set('high_intensity_any', {
      contentType: 'any',
      sentiment: 'any',
      emotionalIntensity: { min: 0.8, max: 1 },
      priority: 'high',
      behaviors: {
        gestures: ['supportive', 'descriptive'],
        expressions: ['excitement', 'focus'],
        headMovements: ['emphasis', 'nod']
      },
      culturalAdaptations: ['intensity_moderation']
    });
  }

  private initializeGestureLibrary(): void {
    // Questioning gestures
    this.gestureLibrary.set('questioning', [
      {
        type: 'questioning',
        intensity: 0.6,
        duration: 1.5,
        timing: 0.2,
        synchronizeWithSpeech: true
      }
    ]);

    // Supportive gestures
    this.gestureLibrary.set('supportive', [
      {
        type: 'supportive',
        intensity: 0.7,
        duration: 2.0,
        timing: 0.1,
        synchronizeWithSpeech: true
      }
    ]);

    // Descriptive gestures
    this.gestureLibrary.set('descriptive', [
      {
        type: 'descriptive',
        intensity: 0.8,
        duration: 2.5,
        timing: 0.3,
        synchronizeWithSpeech: true
      }
    ]);

    // Pointing gestures
    this.gestureLibrary.set('pointing', [
      {
        type: 'pointing',
        intensity: 0.9,
        duration: 1.0,
        timing: 0.1,
        synchronizeWithSpeech: true
      }
    ]);

    // Counting gestures
    this.gestureLibrary.set('counting', [
      {
        type: 'counting',
        intensity: 0.8,
        duration: 1.5,
        timing: 0.2,
        synchronizeWithSpeech: true
      }
    ]);

    // Celebratory gestures
    this.gestureLibrary.set('celebratory', [
      {
        type: 'celebratory',
        intensity: 0.9,
        duration: 2.0,
        timing: 0.1,
        synchronizeWithSpeech: false
      }
    ]);
  }

  private initializeExpressionLibrary(): void {
    // Smile expressions
    this.expressionLibrary.set('smile', [
      {
        type: 'smile',
        intensity: 0.8,
        duration: 3.0,
        timing: 0.1,
        culturalModifier: 1.0
      }
    ]);

    // Neutral expressions
    this.expressionLibrary.set('neutral', [
      {
        type: 'neutral',
        intensity: 0.5,
        duration: 2.0,
        timing: 0.05,
        culturalModifier: 1.0
      }
    ]);

    // Focus expressions
    this.expressionLibrary.set('focus', [
      {
        type: 'focus',
        intensity: 0.7,
        duration: 2.5,
        timing: 0.1,
        culturalModifier: 1.0
      }
    ]);

    // Excitement expressions
    this.expressionLibrary.set('excitement', [
      {
        type: 'excitement',
        intensity: 0.9,
        duration: 2.0,
        timing: 0.05,
        culturalModifier: 1.0
      }
    ]);

    // Concern expressions
    this.expressionLibrary.set('concern', [
      {
        type: 'concern',
        intensity: 0.6,
        duration: 2.5,
        timing: 0.15,
        culturalModifier: 1.0
      }
    ]);

    // Empathy expressions
    this.expressionLibrary.set('empathy', [
      {
        type: 'empathy',
        intensity: 0.7,
        duration: 3.0,
        timing: 0.2,
        culturalModifier: 1.0
      }
    ]);

    // Surprise expressions
    this.expressionLibrary.set('surprise', [
      {
        type: 'surprise',
        intensity: 0.8,
        duration: 1.5,
        timing: 0.05,
        culturalModifier: 1.0
      }
    ]);
  }

  private initializeHeadMovementLibrary(): void {
    // Nod movements
    this.headMovementLibrary.set('nod', [
      {
        type: 'nod',
        direction: 'down',
        intensity: 0.7,
        duration: 0.8,
        timing: 0.1
      }
    ]);

    // Tilt movements
    this.headMovementLibrary.set('tilt', [
      {
        type: 'tilt',
        direction: 'left',
        intensity: 0.6,
        duration: 1.5,
        timing: 0.2
      },
      {
        type: 'tilt',
        direction: 'right',
        intensity: 0.6,
        duration: 1.5,
        timing: 0.2
      }
    ]);

    // Emphasis movements
    this.headMovementLibrary.set('emphasis', [
      {
        type: 'emphasis',
        direction: 'forward',
        intensity: 0.8,
        duration: 1.0,
        timing: 0.0
      }
    ]);

    // Turn movements
    this.headMovementLibrary.set('turn', [
      {
        type: 'turn',
        direction: 'left',
        intensity: 0.5,
        duration: 2.0,
        timing: 0.3
      },
      {
        type: 'turn',
        direction: 'right',
        intensity: 0.5,
        duration: 2.0,
        timing: 0.3
      }
    ]);

    // Shake movements
    this.headMovementLibrary.set('shake', [
      {
        type: 'shake',
        direction: 'left',
        intensity: 0.6,
        duration: 1.2,
        timing: 0.1
      }
    ]);
  }

  /**
   * Gets current behavior plan for external access
   */
  public getCurrentBehaviorPlan(): BehaviorPlan | null {
    return this.currentBehaviorPlan;
  }

  /**
   * Gets behavior history for analysis
   */
  public getBehaviorHistory(): BehaviorPlan[] {
    return [...this.behaviorHistory];
  }

  /**
   * Clears behavior history
   */
  public clearBehaviorHistory(): void {
    this.behaviorHistory = [];
    this.currentBehaviorPlan = null;
  }

  /**
   * Gets behavior statistics for monitoring
   */
  public getBehaviorStats(): {
    totalPlansGenerated: number;
    averageGesturesPerPlan: number;
    averageExpressionsPerPlan: number;
    averageMovementsPerPlan: number;
    mostCommonPriority: string;
  } {
    if (this.behaviorHistory.length === 0) {
      return {
        totalPlansGenerated: 0,
        averageGesturesPerPlan: 0,
        averageExpressionsPerPlan: 0,
        averageMovementsPerPlan: 0,
        mostCommonPriority: 'none'
      };
    }

    const totalGestures = this.behaviorHistory.reduce((sum, plan) => sum + plan.handGestures.length, 0);
    const totalExpressions = this.behaviorHistory.reduce((sum, plan) => sum + plan.facialExpressions.length, 0);
    const totalMovements = this.behaviorHistory.reduce((sum, plan) => sum + plan.headMovements.length, 0);

    const priorityCounts = this.behaviorHistory.reduce((counts, plan) => {
      counts[plan.priority] = (counts[plan.priority] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);

    const mostCommonPriority = Object.entries(priorityCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'none';

    return {
      totalPlansGenerated: this.behaviorHistory.length,
      averageGesturesPerPlan: totalGestures / this.behaviorHistory.length,
      averageExpressionsPerPlan: totalExpressions / this.behaviorHistory.length,
      averageMovementsPerPlan: totalMovements / this.behaviorHistory.length,
      mostCommonPriority
    };
  }
}