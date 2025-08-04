/**
 * Cultural Behavior Coordinator
 * 
 * Integrates cultural adaptation with the multi-modal behavior coordination system
 * to ensure culturally appropriate gestures and expressions across all behavior types.
 * 
 * Requirements addressed:
 * - 3.1: Appropriate hand gestures or head movements to emphasize key points
 * - 3.3: Explanatory gestures that support the content being delivered  
 * - 6.3: Cultural context awareness and adaptation
 */

import {
  SynchronizedBehavior,
  TimedHandGesture,
  TimedFacialExpression,
  TimedHeadMovement,
  MultiModalBehaviorCoordinator
} from './MultiModalBehaviorCoordinator';

import {
  CulturalGestureAdaptationEngine,
  CulturalAdaptationResult
} from './CulturalGestureAdaptationEngine';

import {
  BehaviorPlan,
  SpeechContext,
  ContentAnalysis
} from '../behavior/types';

import {
  CulturalProfile,
  MovementContext,
  Gesture
} from './types';

export interface CulturalBehaviorAdaptation {
  originalBehavior: SynchronizedBehavior;
  adaptedBehavior: SynchronizedBehavior;
  culturalModifications: CulturalBehaviorModification[];
  appropriatenessScore: number;
  culturalContext: string;
}

export interface CulturalBehaviorModification {
  behaviorType: 'hand_gesture' | 'facial_expression' | 'head_movement';
  originalId: string;
  modificationType: 'intensity_reduction' | 'cultural_variant' | 'replacement' | 'removal' | 'timing_adjustment';
  reason: string;
  culturalRule: string;
  alternativeSuggestion?: string;
}

export interface CulturalExpressionDatabase {
  regions: Map<string, CulturalExpressionSet>;
  expressionMappings: Map<string, CulturalExpressionMapping[]>;
  appropriatenessRules: Map<string, ExpressionAppropriatenessRule[]>;
}

export interface CulturalExpressionSet {
  region: string;
  expressions: Map<string, CulturalExpressionVariant[]>;
  intensityModifiers: Map<string, number>;
  contextualRestrictions: Map<string, string[]>;
}

export interface CulturalExpressionVariant {
  baseExpressionType: string;
  culturalVariantName: string;
  intensity: number;
  duration: number;
  culturalModifier: number;
  appropriatenessScore: number;
  contextRestrictions: string[];
  description: string;
}

export interface CulturalExpressionMapping {
  sourceExpression: string;
  targetExpression: string;
  culturalContext: string;
  mappingReason: string;
  intensityAdjustment: number;
}

export interface ExpressionAppropriatenessRule {
  expressionType: string;
  culturalContext: string;
  appropriatenessLevel: 'appropriate' | 'neutral' | 'inappropriate' | 'offensive';
  contexts: string[];
  reason: string;
  alternatives: string[];
}

export class CulturalBehaviorCoordinator {
  private gestureAdaptationEngine: CulturalGestureAdaptationEngine;
  private expressionDatabase: CulturalExpressionDatabase;
  private behaviorCoordinator: MultiModalBehaviorCoordinator;
  private culturalProfiles: Map<string, CulturalProfile>;

  constructor() {
    this.gestureAdaptationEngine = new CulturalGestureAdaptationEngine();
    this.expressionDatabase = this.initializeExpressionDatabase();
    this.behaviorCoordinator = new MultiModalBehaviorCoordinator();
    this.culturalProfiles = this.initializeCulturalProfiles();
  }

  /**
   * Adapts a behavior plan for specific cultural context
   */
  public adaptBehaviorForCulture(
    behaviorPlan: BehaviorPlan,
    culturalContext: string,
    speechContext: SpeechContext,
    contentAnalysis: ContentAnalysis
  ): CulturalBehaviorAdaptation {
    const culturalProfile = this.culturalProfiles.get(culturalContext);
    if (!culturalProfile) {
      throw new Error(`Unknown cultural context: ${culturalContext}`);
    }

    // Create movement context from speech and content analysis
    const movementContext = this.createMovementContext(speechContext, contentAnalysis);

    // Adapt hand gestures using existing gesture adaptation engine
    const gestureAdaptation = this.adaptHandGestures(
      behaviorPlan.handGestures,
      culturalProfile,
      movementContext
    );

    // Adapt facial expressions using cultural expression database
    const expressionAdaptation = this.adaptFacialExpressions(
      behaviorPlan.facialExpressions,
      culturalProfile,
      movementContext
    );

    // Adapt head movements for cultural appropriateness
    const headMovementAdaptation = this.adaptHeadMovements(
      behaviorPlan.headMovements,
      culturalProfile,
      movementContext
    );

    // Create adapted behavior plan
    const adaptedBehaviorPlan: BehaviorPlan = {
      ...behaviorPlan,
      handGestures: gestureAdaptation.adaptedGestures,
      facialExpressions: expressionAdaptation.adaptedExpressions,
      headMovements: headMovementAdaptation.adaptedMovements
    };

    // Coordinate the adapted behaviors
    const originalBehavior = this.behaviorCoordinator.coordinateBehaviors(
      behaviorPlan,
      speechContext,
      contentAnalysis.estimatedDuration || 3.0
    );

    const adaptedBehavior = this.behaviorCoordinator.coordinateBehaviors(
      adaptedBehaviorPlan,
      speechContext,
      contentAnalysis.estimatedDuration || 3.0
    );

    // Combine all modifications
    const allModifications = [
      ...gestureAdaptation.modifications,
      ...expressionAdaptation.modifications,
      ...headMovementAdaptation.modifications
    ];

    // Calculate overall appropriateness score
    const appropriatenessScore = this.calculateOverallAppropriateness(
      allModifications,
      culturalProfile
    );

    return {
      originalBehavior,
      adaptedBehavior,
      culturalModifications: allModifications,
      appropriatenessScore,
      culturalContext
    };
  }

  /**
   * Validates cultural appropriateness of a synchronized behavior
   */
  public validateCulturalAppropriateness(
    behavior: SynchronizedBehavior,
    culturalContext: string
  ): {
    isAppropriate: boolean;
    violations: CulturalViolation[];
    suggestions: CulturalSuggestion[];
  } {
    const culturalProfile = this.culturalProfiles.get(culturalContext);
    if (!culturalProfile) {
      return { isAppropriate: true, violations: [], suggestions: [] };
    }

    const violations: CulturalViolation[] = [];
    const suggestions: CulturalSuggestion[] = [];

    // Check hand gestures
    behavior.behaviors.handGestures.forEach(gesture => {
      const gestureViolations = this.checkGestureViolations(gesture, culturalProfile);
      violations.push(...gestureViolations);

      if (gestureViolations.length > 0) {
        const gestureSuggestions = this.getGestureSuggestions(gesture, culturalProfile);
        suggestions.push(...gestureSuggestions);
      }
    });

    // Check facial expressions
    behavior.behaviors.facialExpressions.forEach(expression => {
      const expressionViolations = this.checkExpressionViolations(expression, culturalProfile);
      violations.push(...expressionViolations);

      if (expressionViolations.length > 0) {
        const expressionSuggestions = this.getExpressionSuggestions(expression, culturalProfile);
        suggestions.push(...expressionSuggestions);
      }
    });

    // Check head movements
    behavior.behaviors.headMovements.forEach(movement => {
      const movementViolations = this.checkMovementViolations(movement, culturalProfile);
      violations.push(...movementViolations);
    });

    return {
      isAppropriate: violations.length === 0,
      violations,
      suggestions
    };
  }

  /**
   * Creates culturally appropriate alternatives for inappropriate behaviors
   */
  public createCulturalAlternatives(
    inappropriateBehavior: SynchronizedBehavior,
    culturalContext: string,
    speechContext: SpeechContext
  ): SynchronizedBehavior[] {
    const culturalProfile = this.culturalProfiles.get(culturalContext);
    if (!culturalProfile) {
      return [inappropriateBehavior];
    }

    const alternatives: SynchronizedBehavior[] = [];

    // Create conservative alternative (reduced intensity)
    const conservativeAlternative = this.createConservativeAlternative(
      inappropriateBehavior,
      culturalProfile
    );
    alternatives.push(conservativeAlternative);

    // Create culturally adapted alternative
    const culturallyAdaptedAlternative = this.createCulturallyAdaptedAlternative(
      inappropriateBehavior,
      culturalProfile,
      speechContext
    );
    alternatives.push(culturallyAdaptedAlternative);

    // Create minimal alternative (essential behaviors only)
    const minimalAlternative = this.createMinimalAlternative(
      inappropriateBehavior,
      culturalProfile
    );
    alternatives.push(minimalAlternative);

    return alternatives;
  }

  private adaptHandGestures(
    handGestures: any[],
    culturalProfile: CulturalProfile,
    movementContext: MovementContext
  ): {
    adaptedGestures: any[];
    modifications: CulturalBehaviorModification[];
  } {
    // Convert hand gestures to gesture format for adaptation engine
    const gestures: Gesture[] = handGestures.map(hg => ({
      type: hg.type as any,
      intensity: hg.intensity,
      duration: hg.duration,
      timing: hg.timing,
      morphTargets: [] // Simplified for this implementation
    }));

    // Use existing gesture adaptation engine
    const adaptationResult = this.gestureAdaptationEngine.adaptGesturesForCulture(
      gestures,
      culturalProfile,
      movementContext
    );

    // Convert back to hand gesture format
    const adaptedGestures = adaptationResult.adaptedGestures.map((gesture, index) => ({
      ...handGestures[index],
      intensity: gesture.intensity,
      duration: gesture.duration,
      timing: gesture.timing,
      culturalVariant: culturalProfile.region
    }));

    // Convert modifications to behavior modifications
    const modifications: CulturalBehaviorModification[] = adaptationResult.culturalModifications.map(mod => ({
      behaviorType: 'hand_gesture' as const,
      originalId: mod.originalGesture.type,
      modificationType: mod.modificationType as any,
      reason: mod.reason,
      culturalRule: `Cultural adaptation for ${mod.culturalContext}`,
      alternativeSuggestion: undefined
    }));

    return { adaptedGestures, modifications };
  }

  private adaptFacialExpressions(
    facialExpressions: TimedFacialExpression[],
    culturalProfile: CulturalProfile,
    movementContext: MovementContext
  ): {
    adaptedExpressions: TimedFacialExpression[];
    modifications: CulturalBehaviorModification[];
  } {
    const adaptedExpressions: TimedFacialExpression[] = [];
    const modifications: CulturalBehaviorModification[] = [];

    const expressionSet = this.expressionDatabase.regions.get(culturalProfile.region);
    if (!expressionSet) {
      return { adaptedExpressions: facialExpressions, modifications: [] };
    }

    facialExpressions.forEach(expression => {
      const variants = expressionSet.expressions.get(expression.type);
      if (variants && variants.length > 0) {
        // Select best cultural variant
        const bestVariant = this.selectBestExpressionVariant(variants, movementContext);
        const adaptedExpression = this.applyExpressionVariant(expression, bestVariant);

        adaptedExpressions.push(adaptedExpression);
        modifications.push({
          behaviorType: 'facial_expression',
          originalId: expression.type,
          modificationType: 'cultural_variant',
          reason: `Applied ${bestVariant.culturalVariantName} for ${culturalProfile.region} culture`,
          culturalRule: `Expression adaptation rule for ${culturalProfile.region}`,
          alternativeSuggestion: bestVariant.description
        });
      } else {
        // Apply cultural intensity modifier
        const intensityModifier = expressionSet.intensityModifiers.get(expression.type) || 1.0;
        const adaptedExpression = {
          ...expression,
          intensity: expression.intensity * intensityModifier,
          culturalModifier: expression.culturalModifier * intensityModifier
        };

        adaptedExpressions.push(adaptedExpression);

        if (intensityModifier !== 1.0) {
          modifications.push({
            behaviorType: 'facial_expression',
            originalId: expression.type,
            modificationType: 'intensity_reduction',
            reason: `Adjusted intensity for ${culturalProfile.region} cultural norms`,
            culturalRule: `Intensity modifier: ${intensityModifier}`,
            alternativeSuggestion: undefined
          });
        }
      }
    });

    return { adaptedExpressions, modifications };
  }

  private adaptHeadMovements(
    headMovements: TimedHeadMovement[],
    culturalProfile: CulturalProfile,
    movementContext: MovementContext
  ): {
    adaptedMovements: TimedHeadMovement[];
    modifications: CulturalBehaviorModification[];
  } {
    const adaptedMovements: TimedHeadMovement[] = [];
    const modifications: CulturalBehaviorModification[] = [];

    // Define cultural head movement rules
    const culturalRules = this.getHeadMovementRules(culturalProfile.region);

    headMovements.forEach(movement => {
      const applicableRule = culturalRules.find(rule => 
        rule.movementType === movement.type && rule.direction === movement.direction
      );

      if (applicableRule) {
        const adaptedMovement = {
          ...movement,
          intensity: movement.intensity * applicableRule.intensityModifier,
          duration: Math.round(movement.duration * applicableRule.durationModifier)
        };

        adaptedMovements.push(adaptedMovement);

        if (applicableRule.intensityModifier !== 1.0 || applicableRule.durationModifier !== 1.0) {
          modifications.push({
            behaviorType: 'head_movement',
            originalId: `${movement.type}_${movement.direction}`,
            modificationType: 'intensity_reduction',
            reason: applicableRule.reason,
            culturalRule: `Head movement rule for ${culturalProfile.region}`,
            alternativeSuggestion: applicableRule.alternative
          });
        }
      } else {
        adaptedMovements.push(movement);
      }
    });

    return { adaptedMovements, modifications };
  }

  private createMovementContext(
    speechContext: SpeechContext,
    contentAnalysis: ContentAnalysis
  ): MovementContext {
    return {
      isQuestion: contentAnalysis.contentType === 'question',
      isExplanation: contentAnalysis.contentType === 'explanation',
      emphasisLevel: contentAnalysis.emotionalIntensity > 0.7 ? 'high' : 
                    contentAnalysis.emotionalIntensity > 0.4 ? 'medium' : 'low',
      culturalContext: speechContext.culturalBackground,
      language: speechContext.language,
      speechContent: contentAnalysis.keyPhrases.join(' ')
    };
  }

  private selectBestExpressionVariant(
    variants: CulturalExpressionVariant[],
    context: MovementContext
  ): CulturalExpressionVariant {
    // Score variants based on context appropriateness
    const scoredVariants = variants.map(variant => {
      let score = variant.appropriatenessScore;

      // Adjust score based on context restrictions
      const contextKey = this.getContextKey(context);
      if (variant.contextRestrictions.includes(contextKey)) {
        score *= 0.5; // Penalize restricted contexts
      }

      // Adjust score based on emphasis level
      if (context.emphasisLevel === 'high' && variant.intensity < 0.5) {
        score *= 0.7; // Penalize low intensity for high emphasis
      }

      return { variant, score };
    });

    // Return highest scoring variant
    scoredVariants.sort((a, b) => b.score - a.score);
    return scoredVariants[0].variant;
  }

  private applyExpressionVariant(
    expression: TimedFacialExpression,
    variant: CulturalExpressionVariant
  ): TimedFacialExpression {
    return {
      ...expression,
      intensity: variant.intensity,
      duration: variant.duration,
      culturalModifier: variant.culturalModifier
    };
  }

  private getContextKey(context: MovementContext): string {
    if (context.isExplanation) return 'educational';
    if (context.isQuestion) return 'questioning';
    if (context.emphasisLevel === 'high') return 'emphatic';
    return 'general';
  }

  private getHeadMovementRules(culturalRegion: string): HeadMovementRule[] {
    const rules: Record<string, HeadMovementRule[]> = {
      western: [
        {
          movementType: 'nod',
          direction: 'down',
          intensityModifier: 1.0,
          durationModifier: 1.0,
          reason: 'Standard Western nod',
          alternative: undefined
        }
      ],
      eastern: [
        {
          movementType: 'nod',
          direction: 'down',
          intensityModifier: 0.7,
          durationModifier: 1.2,
          reason: 'More subtle nod for Eastern culture',
          alternative: 'Slight bow gesture'
        },
        {
          movementType: 'tilt',
          direction: 'left',
          intensityModifier: 0.5,
          durationModifier: 1.5,
          reason: 'Reduced head tilt intensity for Eastern culture',
          alternative: 'Minimal questioning gesture'
        }
      ],
      mediterranean: [
        {
          movementType: 'nod',
          direction: 'down',
          intensityModifier: 1.2,
          durationModifier: 0.9,
          reason: 'More expressive nod for Mediterranean culture',
          alternative: undefined
        },
        {
          movementType: 'tilt',
          direction: 'left',
          intensityModifier: 1.3,
          durationModifier: 0.8,
          reason: 'More animated head tilt for Mediterranean culture',
          alternative: undefined
        }
      ]
    };

    return rules[culturalRegion] || [];
  }

  private checkGestureViolations(
    gesture: TimedHandGesture,
    culturalProfile: CulturalProfile
  ): CulturalViolation[] {
    const violations: CulturalViolation[] = [];

    // Check if gesture is in restricted list
    if (culturalProfile.restrictedGestures.includes(gesture.type)) {
      violations.push({
        type: 'restricted_gesture',
        severity: 'high',
        description: `Gesture "${gesture.type}" is culturally inappropriate for ${culturalProfile.region}`,
        behaviorId: gesture.type,
        culturalRule: `Restricted gesture list for ${culturalProfile.region}`
      });
    }

    // Check intensity appropriateness
    if (gesture.intensity > 0.8 && culturalProfile.region === 'eastern') {
      violations.push({
        type: 'excessive_intensity',
        severity: 'medium',
        description: 'Gesture intensity too high for Eastern cultural norms',
        behaviorId: gesture.type,
        culturalRule: 'Eastern culture prefers subtle gestures'
      });
    }

    return violations;
  }

  private checkExpressionViolations(
    expression: TimedFacialExpression,
    culturalProfile: CulturalProfile
  ): CulturalViolation[] {
    const violations: CulturalViolation[] = [];

    // Check expression appropriateness rules
    const rules = this.expressionDatabase.appropriatenessRules.get(culturalProfile.region) || [];
    const relevantRule = rules.find(rule => rule.expressionType === expression.type);

    if (relevantRule && relevantRule.appropriatenessLevel === 'inappropriate') {
      violations.push({
        type: 'inappropriate_expression',
        severity: 'high',
        description: `Expression "${expression.type}" is inappropriate for ${culturalProfile.region}: ${relevantRule.reason}`,
        behaviorId: expression.type,
        culturalRule: relevantRule.reason
      });
    }

    return violations;
  }

  private checkMovementViolations(
    movement: TimedHeadMovement,
    culturalProfile: CulturalProfile
  ): CulturalViolation[] {
    const violations: CulturalViolation[] = [];

    // Check for excessive head movement in conservative cultures
    if (movement.intensity > 0.8 && ['eastern', 'nordic'].includes(culturalProfile.region)) {
      violations.push({
        type: 'excessive_movement',
        severity: 'medium',
        description: `Head movement intensity too high for ${culturalProfile.region} cultural norms`,
        behaviorId: `${movement.type}_${movement.direction}`,
        culturalRule: `${culturalProfile.region} culture prefers subtle head movements`
      });
    }

    return violations;
  }

  private getGestureSuggestions(
    gesture: TimedHandGesture,
    culturalProfile: CulturalProfile
  ): CulturalSuggestion[] {
    const alternatives = this.gestureAdaptationEngine.getAlternativeGestures(
      gesture.type,
      culturalProfile,
      { isQuestion: false, isExplanation: false, emphasisLevel: 'medium', culturalContext: culturalProfile.region, language: 'en', speechContent: '' }
    );

    return alternatives.map(alt => ({
      type: 'alternative_gesture',
      description: `Consider using "${alt}" instead of "${gesture.type}"`,
      behaviorId: gesture.type,
      suggestion: alt,
      culturalReason: `Better suited for ${culturalProfile.region} culture`
    }));
  }

  private getExpressionSuggestions(
    expression: TimedFacialExpression,
    culturalProfile: CulturalProfile
  ): CulturalSuggestion[] {
    const rules = this.expressionDatabase.appropriatenessRules.get(culturalProfile.region) || [];
    const relevantRule = rules.find(rule => rule.expressionType === expression.type);

    if (relevantRule && relevantRule.alternatives.length > 0) {
      return relevantRule.alternatives.map(alt => ({
        type: 'alternative_expression',
        description: `Consider using "${alt}" instead of "${expression.type}"`,
        behaviorId: expression.type,
        suggestion: alt,
        culturalReason: relevantRule.reason
      }));
    }

    return [];
  }

  private calculateOverallAppropriateness(
    modifications: CulturalBehaviorModification[],
    culturalProfile: CulturalProfile
  ): number {
    if (modifications.length === 0) return 1.0;

    // Calculate score based on modification types
    let score = 1.0;
    
    modifications.forEach(mod => {
      switch (mod.modificationType) {
        case 'removal':
          score -= 0.3;
          break;
        case 'replacement':
          score -= 0.2;
          break;
        case 'intensity_reduction':
          score -= 0.1;
          break;
        case 'cultural_variant':
          score += 0.1; // Positive for good cultural adaptation
          break;
        case 'timing_adjustment':
          score -= 0.05;
          break;
      }
    });

    return Math.max(0, Math.min(1.0, score));
  }

  private createConservativeAlternative(
    behavior: SynchronizedBehavior,
    culturalProfile: CulturalProfile
  ): SynchronizedBehavior {
    return {
      ...behavior,
      behaviors: {
        handGestures: behavior.behaviors.handGestures.map(g => ({
          ...g,
          intensity: g.intensity * 0.6
        })),
        facialExpressions: behavior.behaviors.facialExpressions.map(e => ({
          ...e,
          intensity: e.intensity * 0.7
        })),
        headMovements: behavior.behaviors.headMovements.map(m => ({
          ...m,
          intensity: m.intensity * 0.6
        }))
      }
    };
  }

  private createCulturallyAdaptedAlternative(
    behavior: SynchronizedBehavior,
    culturalProfile: CulturalProfile,
    speechContext: SpeechContext
  ): SynchronizedBehavior {
    // This would use the full cultural adaptation process
    // For now, return a simplified version
    return {
      ...behavior,
      behaviors: {
        handGestures: behavior.behaviors.handGestures.map(g => ({
          ...g,
          culturalVariant: culturalProfile.region
        })),
        facialExpressions: behavior.behaviors.facialExpressions.map(e => ({
          ...e,
          culturalModifier: culturalProfile.movementAmplitude
        })),
        headMovements: behavior.behaviors.headMovements
      }
    };
  }

  private createMinimalAlternative(
    behavior: SynchronizedBehavior,
    culturalProfile: CulturalProfile
  ): SynchronizedBehavior {
    return {
      ...behavior,
      behaviors: {
        handGestures: behavior.behaviors.handGestures.filter(g => g.intensity > 0.7).slice(0, 1),
        facialExpressions: behavior.behaviors.facialExpressions.filter(e => e.type === 'neutral' || e.type === 'focus'),
        headMovements: behavior.behaviors.headMovements.filter(m => m.type === 'nod').slice(0, 1)
      }
    };
  }

  private initializeExpressionDatabase(): CulturalExpressionDatabase {
    const database: CulturalExpressionDatabase = {
      regions: new Map(),
      expressionMappings: new Map(),
      appropriatenessRules: new Map()
    };

    // Initialize Western expressions
    this.initializeWesternExpressions(database);
    
    // Initialize Eastern expressions
    this.initializeEasternExpressions(database);
    
    // Initialize Mediterranean expressions
    this.initializeMediterraneanExpressions(database);

    return database;
  }

  private initializeWesternExpressions(database: CulturalExpressionDatabase): void {
    const westernExpressions = new Map<string, CulturalExpressionVariant[]>();

    westernExpressions.set('smile', [
      {
        baseExpressionType: 'smile',
        culturalVariantName: 'western_friendly_smile',
        intensity: 0.8,
        duration: 2000,
        culturalModifier: 1.0,
        appropriatenessScore: 0.9,
        contextRestrictions: [],
        description: 'Standard Western friendly smile'
      }
    ]);

    westernExpressions.set('neutral', [
      {
        baseExpressionType: 'neutral',
        culturalVariantName: 'western_professional_neutral',
        intensity: 0.5,
        duration: 1500,
        culturalModifier: 1.0,
        appropriatenessScore: 1.0,
        contextRestrictions: [],
        description: 'Professional neutral expression'
      }
    ]);

    database.regions.set('western', {
      region: 'western',
      expressions: westernExpressions,
      intensityModifiers: new Map([
        ['smile', 1.0],
        ['excitement', 0.9],
        ['concern', 0.8]
      ]),
      contextualRestrictions: new Map()
    });

    database.appropriatenessRules.set('western', [
      {
        expressionType: 'smile',
        culturalContext: 'western',
        appropriatenessLevel: 'appropriate',
        contexts: ['general', 'professional', 'social'],
        reason: 'Smiling is generally appropriate in Western culture',
        alternatives: []
      }
    ]);
  }

  private initializeEasternExpressions(database: CulturalExpressionDatabase): void {
    const easternExpressions = new Map<string, CulturalExpressionVariant[]>();

    easternExpressions.set('smile', [
      {
        baseExpressionType: 'smile',
        culturalVariantName: 'eastern_subtle_smile',
        intensity: 0.5,
        duration: 1800,
        culturalModifier: 0.7,
        appropriatenessScore: 0.8,
        contextRestrictions: ['formal'],
        description: 'Subtle Eastern smile'
      }
    ]);

    easternExpressions.set('neutral', [
      {
        baseExpressionType: 'neutral',
        culturalVariantName: 'eastern_respectful_neutral',
        intensity: 0.4,
        duration: 2000,
        culturalModifier: 0.8,
        appropriatenessScore: 1.0,
        contextRestrictions: [],
        description: 'Respectful neutral expression'
      }
    ]);

    database.regions.set('eastern', {
      region: 'eastern',
      expressions: easternExpressions,
      intensityModifiers: new Map([
        ['smile', 0.7],
        ['excitement', 0.5],
        ['concern', 0.9]
      ]),
      contextualRestrictions: new Map([
        ['smile', ['formal', 'hierarchical']]
      ])
    });

    database.appropriatenessRules.set('eastern', [
      {
        expressionType: 'excitement',
        culturalContext: 'eastern',
        appropriatenessLevel: 'inappropriate',
        contexts: ['formal', 'hierarchical'],
        reason: 'Excessive excitement may be seen as disrespectful in formal Eastern contexts',
        alternatives: ['neutral', 'focus']
      }
    ]);
  }

  private initializeMediterraneanExpressions(database: CulturalExpressionDatabase): void {
    const mediterraneanExpressions = new Map<string, CulturalExpressionVariant[]>();

    mediterraneanExpressions.set('smile', [
      {
        baseExpressionType: 'smile',
        culturalVariantName: 'mediterranean_warm_smile',
        intensity: 0.9,
        duration: 2500,
        culturalModifier: 1.2,
        appropriatenessScore: 0.95,
        contextRestrictions: [],
        description: 'Warm Mediterranean smile'
      }
    ]);

    database.regions.set('mediterranean', {
      region: 'mediterranean',
      expressions: mediterraneanExpressions,
      intensityModifiers: new Map([
        ['smile', 1.2],
        ['excitement', 1.3],
        ['concern', 1.1]
      ]),
      contextualRestrictions: new Map()
    });

    database.appropriatenessRules.set('mediterranean', [
      {
        expressionType: 'neutral',
        culturalContext: 'mediterranean',
        appropriatenessLevel: 'neutral',
        contexts: ['social'],
        reason: 'Mediterranean culture values expressiveness over neutrality in social contexts',
        alternatives: ['smile', 'excitement']
      }
    ]);
  }

  private initializeCulturalProfiles(): Map<string, CulturalProfile> {
    const profiles = new Map<string, CulturalProfile>();

    // Use the gesture adaptation engine to create profiles
    const regions = ['western', 'eastern', 'mediterranean', 'nordic', 'middle_eastern'];
    
    regions.forEach(region => {
      const profile = this.gestureAdaptationEngine.createCulturalProfile(region);
      if (profile) {
        profiles.set(region, profile);
      }
    });

    return profiles;
  }
}

interface HeadMovementRule {
  movementType: string;
  direction: string;
  intensityModifier: number;
  durationModifier: number;
  reason: string;
  alternative?: string;
}

interface CulturalViolation {
  type: 'restricted_gesture' | 'inappropriate_expression' | 'excessive_intensity' | 'excessive_movement';
  severity: 'low' | 'medium' | 'high';
  description: string;
  behaviorId: string;
  culturalRule: string;
}

interface CulturalSuggestion {
  type: 'alternative_gesture' | 'alternative_expression' | 'intensity_adjustment';
  description: string;
  behaviorId: string;
  suggestion: string;
  culturalReason: string;
}