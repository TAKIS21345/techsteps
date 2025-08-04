/**
 * GestureLibrary - Contextual gesture database and selection system
 * 
 * This class provides a comprehensive library of gestures and movements
 * that can be selected based on context, cultural preferences, and speech content.
 * 
 * Requirements addressed:
 * - 1.1: Deliberate head movements that correspond to speech emphasis
 * - 1.4: Appropriate head nods, tilts, or gestures that align with speech content
 * - 3.1: Appropriate hand gestures or head movements to emphasize key points
 */

import {
  Gesture,
  HeadMovement,
  IdleMovement,
  MovementContext,
  EmphasisData,
  CulturalProfile,
  MorphTargetMapping,
  EasingType,
  GesturePreference
} from './types';

export interface GestureDatabase {
  emphasis: Gesture[];
  questions: Gesture[];
  explanations: Gesture[];
  agreements: Gesture[];
  idle: IdleMovement[];
  cultural: Record<string, Gesture[]>;
}

export interface ContextAnalysisResult {
  primaryContext: string;
  confidence: number;
  suggestedGestures: Gesture[];
  culturalModifications: string[];
}

export class GestureLibrary {
  private gestureDatabase: GestureDatabase;
  private contextAnalyzer: ContextAnalyzer;
  private blendingEngine: GestureBlendingEngine;

  constructor() {
    this.gestureDatabase = this.initializeGestureDatabase();
    this.contextAnalyzer = new ContextAnalyzer();
    this.blendingEngine = new GestureBlendingEngine();
  }

  /**
   * Gets contextually appropriate gestures based on movement context
   */
  public getGestureForContext(context: MovementContext): Gesture[] {
    const analysisResult = this.contextAnalyzer.analyzeContext(context);
    let selectedGestures = [...analysisResult.suggestedGestures];

    // Apply cultural modifications
    if (context.culturalContext && context.culturalContext !== 'neutral') {
      selectedGestures = this.applyCulturalModifications(
        selectedGestures,
        context.culturalContext,
        analysisResult.culturalModifications
      );
    }

    // Apply emphasis level adjustments
    selectedGestures = this.adjustGestureIntensity(selectedGestures, context.emphasisLevel);

    return selectedGestures;
  }

  /**
   * Gets specific gesture for emphasis based on type and intensity
   */
  public getEmphasisGesture(emphasisType: string, intensity: number = 0.7): Gesture {
    const emphasisGestures = this.gestureDatabase.emphasis.filter(
      gesture => gesture.type === 'emphasis'
    );

    if (emphasisGestures.length === 0) {
      return this.createDefaultEmphasisGesture(intensity);
    }

    // Select gesture based on emphasis type
    let selectedGesture = emphasisGestures[0];
    
    switch (emphasisType) {
      case 'strong':
        selectedGesture = emphasisGestures.find(g => g.intensity > 0.8) || emphasisGestures[0];
        break;
      case 'moderate':
        selectedGesture = emphasisGestures.find(g => g.intensity >= 0.5 && g.intensity <= 0.8) || emphasisGestures[0];
        break;
      case 'subtle':
        selectedGesture = emphasisGestures.find(g => g.intensity < 0.5) || emphasisGestures[0];
        break;
    }

    // Clone and adjust intensity
    return {
      ...selectedGesture,
      intensity: Math.min(1.0, selectedGesture.intensity * intensity)
    };
  }

  /**
   * Gets natural idle movements with specified intensity
   */
  public getIdleMovements(intensity: number = 0.3): IdleMovement[] {
    const baseIdleMovements = this.gestureDatabase.idle;
    
    return baseIdleMovements.map(movement => ({
      ...movement,
      amplitude: movement.amplitude * intensity,
      frequency: movement.frequency * (0.8 + intensity * 0.4) // Slight frequency variation
    }));
  }

  /**
   * Gets question-specific gestures like head tilts and eyebrow raises
   */
  public getQuestionGestures(questionType: 'yes_no' | 'wh_question' | 'rhetorical' = 'yes_no'): Gesture[] {
    const questionGestures = this.gestureDatabase.questions;
    
    return questionGestures.filter(gesture => {
      switch (questionType) {
        case 'yes_no':
          return gesture.type === 'head_tilt' || gesture.type === 'eyebrow_raise';
        case 'wh_question':
          return gesture.type === 'head_tilt' && gesture.intensity > 0.6;
        case 'rhetorical':
          return gesture.type === 'head_nod' && gesture.intensity < 0.5;
        default:
          return true;
      }
    });
  }

  /**
   * Blends multiple gestures smoothly for natural transitions
   */
  public blendGestures(gestures: Gesture[], blendWeights: number[]): Gesture {
    return this.blendingEngine.blendGestures(gestures, blendWeights);
  }

  /**
   * Creates smooth transitions between gesture sets
   */
  public createGestureTransition(
    fromGestures: Gesture[],
    toGestures: Gesture[],
    duration: number
  ): Gesture[] {
    return this.blendingEngine.createTransition(fromGestures, toGestures, duration);
  }

  /**
   * Initializes the comprehensive gesture database
   */
  private initializeGestureDatabase(): GestureDatabase {
    return {
      emphasis: this.createEmphasisGestures(),
      questions: this.createQuestionGestures(),
      explanations: this.createExplanationGestures(),
      agreements: this.createAgreementGestures(),
      idle: this.createIdleMovements(),
      cultural: this.createCulturalGestures()
    };
  }

  /**
   * Creates emphasis gestures for highlighting important content
   */
  private createEmphasisGestures(): Gesture[] {
    return [
      {
        type: 'head_nod',
        intensity: 0.8,
        duration: 400,
        timing: 0,
        morphTargets: [
          { targetName: 'head_nod_down', weight: 0.8, blendMode: 'replace' },
          { targetName: 'eyebrow_emphasis', weight: 0.3, blendMode: 'additive' }
        ]
      },
      {
        type: 'head_tilt',
        intensity: 0.6,
        duration: 600,
        timing: 0,
        morphTargets: [
          { targetName: 'head_tilt_right', weight: 0.6, blendMode: 'replace' },
          { targetName: 'eye_focus', weight: 0.4, blendMode: 'additive' }
        ]
      },
      {
        type: 'emphasis',
        intensity: 0.9,
        duration: 300,
        timing: 0,
        morphTargets: [
          { targetName: 'head_forward', weight: 0.5, blendMode: 'replace' },
          { targetName: 'eyebrow_raise', weight: 0.7, blendMode: 'additive' },
          { targetName: 'eye_wide', weight: 0.4, blendMode: 'additive' }
        ]
      }
    ];
  }

  /**
   * Creates question-specific gestures
   */
  private createQuestionGestures(): Gesture[] {
    return [
      {
        type: 'head_tilt',
        intensity: 0.7,
        duration: 800,
        timing: 0,
        morphTargets: [
          { targetName: 'head_tilt_left', weight: 0.7, blendMode: 'replace' },
          { targetName: 'eyebrow_curious', weight: 0.6, blendMode: 'additive' }
        ]
      },
      {
        type: 'eyebrow_raise',
        intensity: 0.8,
        duration: 500,
        timing: 0,
        morphTargets: [
          { targetName: 'eyebrow_raise_both', weight: 0.8, blendMode: 'replace' },
          { targetName: 'eye_wide', weight: 0.3, blendMode: 'additive' }
        ]
      },
      {
        type: 'head_nod',
        intensity: 0.4,
        duration: 600,
        timing: 0,
        morphTargets: [
          { targetName: 'head_nod_slight', weight: 0.4, blendMode: 'replace' }
        ]
      }
    ];
  }

  /**
   * Creates explanation gestures for educational content
   */
  private createExplanationGestures(): Gesture[] {
    return [
      {
        type: 'head_nod',
        intensity: 0.5,
        duration: 700,
        timing: 0,
        morphTargets: [
          { targetName: 'head_nod_gentle', weight: 0.5, blendMode: 'replace' },
          { targetName: 'eye_focus', weight: 0.6, blendMode: 'additive' }
        ]
      },
      {
        type: 'head_tilt',
        intensity: 0.3,
        duration: 1000,
        timing: 0,
        morphTargets: [
          { targetName: 'head_tilt_slight', weight: 0.3, blendMode: 'replace' }
        ]
      }
    ];
  }

  /**
   * Creates agreement and acknowledgment gestures
   */
  private createAgreementGestures(): Gesture[] {
    return [
      {
        type: 'head_nod',
        intensity: 0.9,
        duration: 400,
        timing: 0,
        morphTargets: [
          { targetName: 'head_nod_strong', weight: 0.9, blendMode: 'replace' }
        ]
      }
    ];
  }

  /**
   * Creates natural idle movements
   */
  private createIdleMovements(): IdleMovement[] {
    return [
      {
        type: 'breathing',
        amplitude: 0.2,
        frequency: 0.25, // 15 breaths per minute
        phase: 0
      },
      {
        type: 'micro_movement',
        amplitude: 0.1,
        frequency: 0.1, // Very slow micro adjustments
        phase: Math.PI / 4
      },
      {
        type: 'blink_pattern',
        amplitude: 1.0,
        frequency: 0.2, // 12 blinks per minute
        phase: 0
      },
      {
        type: 'subtle_sway',
        amplitude: 0.05,
        frequency: 0.05, // Very subtle swaying
        phase: Math.PI / 2
      }
    ];
  }

  /**
   * Creates cultural-specific gesture variations
   */
  private createCulturalGestures(): Record<string, Gesture[]> {
    return {
      western: [
        {
          type: 'head_nod',
          intensity: 0.7,
          duration: 400,
          timing: 0,
          culturalVariant: 'western_nod',
          morphTargets: [
            { targetName: 'head_nod_western', weight: 0.7, blendMode: 'replace' }
          ]
        }
      ],
      eastern: [
        {
          type: 'head_nod',
          intensity: 0.4,
          duration: 600,
          timing: 0,
          culturalVariant: 'eastern_bow',
          morphTargets: [
            { targetName: 'head_bow_slight', weight: 0.4, blendMode: 'replace' }
          ]
        }
      ],
      mediterranean: [
        {
          type: 'head_tilt',
          intensity: 0.8,
          duration: 500,
          timing: 0,
          culturalVariant: 'mediterranean_expressive',
          morphTargets: [
            { targetName: 'head_tilt_expressive', weight: 0.8, blendMode: 'replace' },
            { targetName: 'eyebrow_expressive', weight: 0.6, blendMode: 'additive' }
          ]
        }
      ]
    };
  }

  /**
   * Applies cultural modifications to gestures
   */
  private applyCulturalModifications(
    gestures: Gesture[],
    culturalContext: string,
    modifications: string[]
  ): Gesture[] {
    const culturalGestures = this.gestureDatabase.cultural[culturalContext] || [];
    
    return gestures.map(gesture => {
      // Find cultural variant if available
      const culturalVariant = culturalGestures.find(
        cg => cg.type === gesture.type
      );

      if (culturalVariant) {
        return {
          ...gesture,
          ...culturalVariant,
          intensity: gesture.intensity * (culturalVariant.intensity / gesture.intensity)
        };
      }

      return gesture;
    });
  }

  /**
   * Adjusts gesture intensity based on emphasis level
   */
  private adjustGestureIntensity(gestures: Gesture[], emphasisLevel: 'low' | 'medium' | 'high'): Gesture[] {
    const intensityMultipliers = {
      low: 0.6,
      medium: 1.0,
      high: 1.4
    };

    const multiplier = intensityMultipliers[emphasisLevel];

    return gestures.map(gesture => ({
      ...gesture,
      intensity: Math.min(1.0, gesture.intensity * multiplier),
      morphTargets: gesture.morphTargets.map(target => ({
        ...target,
        weight: Math.min(1.0, target.weight * multiplier)
      }))
    }));
  }

  /**
   * Creates a default emphasis gesture when none are available
   */
  private createDefaultEmphasisGesture(intensity: number): Gesture {
    return {
      type: 'head_nod',
      intensity,
      duration: 400,
      timing: 0,
      morphTargets: [
        { targetName: 'head_nod_default', weight: intensity, blendMode: 'replace' }
      ]
    };
  }
}

/**
 * Context analyzer for determining appropriate gestures
 */
class ContextAnalyzer {
  public analyzeContext(context: MovementContext): ContextAnalysisResult {
    let primaryContext = 'neutral';
    let confidence = 0.5;
    let suggestedGestures: Gesture[] = [];
    let culturalModifications: string[] = [];

    // Analyze context type
    if (context.isQuestion) {
      primaryContext = 'question';
      confidence = 0.9;
      suggestedGestures = this.getQuestionContextGestures();
    } else if (context.isExplanation) {
      primaryContext = 'explanation';
      confidence = 0.8;
      suggestedGestures = this.getExplanationContextGestures();
    } else if (context.emphasisLevel === 'high') {
      primaryContext = 'emphasis';
      confidence = 0.85;
      suggestedGestures = this.getEmphasisContextGestures();
    }

    // Analyze cultural context
    if (context.culturalContext && context.culturalContext !== 'neutral') {
      culturalModifications = this.getCulturalModifications(context.culturalContext);
    }

    return {
      primaryContext,
      confidence,
      suggestedGestures,
      culturalModifications
    };
  }

  private getQuestionContextGestures(): Gesture[] {
    return [
      {
        type: 'head_tilt',
        intensity: 0.6,
        duration: 800,
        timing: 0,
        morphTargets: [
          { targetName: 'head_tilt_question', weight: 0.6, blendMode: 'replace' }
        ]
      }
    ];
  }

  private getExplanationContextGestures(): Gesture[] {
    return [
      {
        type: 'head_nod',
        intensity: 0.4,
        duration: 600,
        timing: 0,
        morphTargets: [
          { targetName: 'head_nod_explanation', weight: 0.4, blendMode: 'replace' }
        ]
      }
    ];
  }

  private getEmphasisContextGestures(): Gesture[] {
    return [
      {
        type: 'emphasis',
        intensity: 0.8,
        duration: 400,
        timing: 0,
        morphTargets: [
          { targetName: 'head_emphasis', weight: 0.8, blendMode: 'replace' }
        ]
      }
    ];
  }

  private getCulturalModifications(culturalContext: string): string[] {
    const modifications: Record<string, string[]> = {
      western: ['direct_eye_contact', 'moderate_gestures'],
      eastern: ['respectful_bow', 'subtle_movements'],
      mediterranean: ['expressive_gestures', 'animated_expressions']
    };

    return modifications[culturalContext] || [];
  }
}

/**
 * Gesture blending engine for smooth transitions
 */
class GestureBlendingEngine {
  public blendGestures(gestures: Gesture[], blendWeights: number[]): Gesture {
    if (gestures.length === 0) {
      throw new Error('Cannot blend empty gesture array');
    }

    if (gestures.length === 1) {
      return gestures[0];
    }

    // Normalize blend weights
    const totalWeight = blendWeights.reduce((sum, weight) => sum + weight, 0);
    const normalizedWeights = blendWeights.map(weight => weight / totalWeight);

    // Blend gesture properties
    let blendedIntensity = 0;
    let blendedDuration = 0;
    const blendedMorphTargets: MorphTargetMapping[] = [];

    gestures.forEach((gesture, index) => {
      const weight = normalizedWeights[index];
      blendedIntensity += gesture.intensity * weight;
      blendedDuration += gesture.duration * weight;

      // Blend morph targets
      gesture.morphTargets.forEach(target => {
        const existingTarget = blendedMorphTargets.find(
          bt => bt.targetName === target.targetName
        );

        if (existingTarget) {
          existingTarget.weight += target.weight * weight;
        } else {
          blendedMorphTargets.push({
            ...target,
            weight: target.weight * weight
          });
        }
      });
    });

    return {
      type: gestures[0].type, // Use primary gesture type
      intensity: blendedIntensity,
      duration: Math.round(blendedDuration),
      timing: gestures[0].timing,
      morphTargets: blendedMorphTargets
    };
  }

  public createTransition(
    fromGestures: Gesture[],
    toGestures: Gesture[],
    duration: number
  ): Gesture[] {
    const transitionSteps = 10;
    const stepDuration = duration / transitionSteps;
    const transitionGestures: Gesture[] = [];

    for (let i = 0; i <= transitionSteps; i++) {
      const progress = i / transitionSteps;
      const fromWeight = 1 - progress;
      const toWeight = progress;

      // Create blended gesture for this step
      const allGestures = [...fromGestures, ...toGestures];
      const weights = [
        ...fromGestures.map(() => fromWeight / fromGestures.length),
        ...toGestures.map(() => toWeight / toGestures.length)
      ];

      const blendedGesture = this.blendGestures(allGestures, weights);
      blendedGesture.timing = i * stepDuration;
      blendedGesture.duration = stepDuration;

      transitionGestures.push(blendedGesture);
    }

    return transitionGestures;
  }
}