/**
 * FacialExpressionEngine - Core engine for emotion-based facial expressions
 * Provides smooth transitions, blending, and cultural adaptation
 */

import {
  FacialExpression,
  ExpressionType,
  EmotionalContext,
  EmotionType,
  ExpressionBlend,
  ExpressionTransition,
  ExpressionEngineConfig,
  ExpressionState,
  EyeMovement,
  EyebrowPosition,
  Vector3,
  BlendMode,
  EasingFunction,
  ExpressionHistoryEntry
} from './types';

export class FacialExpressionEngine {
  private config: ExpressionEngineConfig;
  private state: ExpressionState;
  private expressionLibrary: Map<ExpressionType, FacialExpression>;
  private activeTransition: ExpressionTransition | null = null;
  private updateInterval: number | null = null;
  private readonly UPDATE_FREQUENCY = 60; // 60 FPS

  constructor(config?: Partial<ExpressionEngineConfig>) {
    this.config = {
      defaultIntensity: 0.7,
      transitionSpeed: 1.0,
      culturalSensitivity: 0.8,
      enableMicroExpressions: true,
      expressionMemory: 5000, // 5 seconds
      blendingEnabled: true,
      ...config
    };

    this.state = {
      currentExpression: null,
      targetExpression: null,
      isTransitioning: false,
      transitionProgress: 0,
      lastUpdateTime: performance.now(),
      expressionHistory: []
    };

    this.expressionLibrary = new Map();
    this.initializeExpressionLibrary();
    this.startUpdateLoop();
  }

  /**
   * Initialize the expression library with predefined expressions
   */
  private initializeExpressionLibrary(): void {
    // Neutral expression
    this.expressionLibrary.set('neutral', {
      type: 'neutral',
      intensity: 0.0,
      duration: 1000,
      morphTargets: {},
      eyeMovements: {
        lookDirection: { x: 0, y: 0, z: 1 },
        blinkRate: 15, // normal blink rate
        eyeWidening: 0,
        squinting: 0
      },
      eyebrowPosition: {
        leftRaise: 0,
        rightRaise: 0,
        furrow: 0
      },
      blendMode: 'replace'
    });

    // Smile expression
    this.expressionLibrary.set('smile', {
      type: 'smile',
      intensity: 0.8,
      duration: 2000,
      morphTargets: {
        'mouthSmile': 0.8,
        'cheekPuff': 0.3,
        'eyeSquintLeft': 0.2,
        'eyeSquintRight': 0.2
      },
      eyeMovements: {
        lookDirection: { x: 0, y: 0, z: 1 },
        blinkRate: 12,
        eyeWidening: 0.1,
        squinting: 0.2
      },
      eyebrowPosition: {
        leftRaise: 0.1,
        rightRaise: 0.1,
        furrow: 0
      },
      blendMode: 'additive'
    });  
  // Concern expression
    this.expressionLibrary.set('concern', {
      type: 'concern',
      intensity: 0.7,
      duration: 3000,
      morphTargets: {
        'browDownLeft': 0.6,
        'browDownRight': 0.6,
        'mouthFrown': 0.4,
        'eyeSquintLeft': 0.3,
        'eyeSquintRight': 0.3
      },
      eyeMovements: {
        lookDirection: { x: 0, y: -0.1, z: 1 },
        blinkRate: 18,
        eyeWidening: 0,
        squinting: 0.3
      },
      eyebrowPosition: {
        leftRaise: -0.4,
        rightRaise: -0.4,
        furrow: 0.6
      },
      blendMode: 'additive'
    });

    // Excitement expression
    this.expressionLibrary.set('excitement', {
      type: 'excitement',
      intensity: 0.9,
      duration: 1500,
      morphTargets: {
        'mouthSmile': 1.0,
        'eyeWideLeft': 0.7,
        'eyeWideRight': 0.7,
        'browUpLeft': 0.5,
        'browUpRight': 0.5,
        'cheekPuff': 0.4
      },
      eyeMovements: {
        lookDirection: { x: 0, y: 0.1, z: 1 },
        blinkRate: 8,
        eyeWidening: 0.7,
        squinting: 0
      },
      eyebrowPosition: {
        leftRaise: 0.5,
        rightRaise: 0.5,
        furrow: 0
      },
      blendMode: 'additive'
    });

    // Focus expression
    this.expressionLibrary.set('focus', {
      type: 'focus',
      intensity: 0.6,
      duration: 4000,
      morphTargets: {
        'eyeSquintLeft': 0.2,
        'eyeSquintRight': 0.2,
        'browDownLeft': 0.3,
        'browDownRight': 0.3
      },
      eyeMovements: {
        lookDirection: { x: 0, y: 0, z: 1 },
        blinkRate: 10,
        eyeWidening: 0,
        squinting: 0.2
      },
      eyebrowPosition: {
        leftRaise: -0.2,
        rightRaise: -0.2,
        furrow: 0.3
      },
      blendMode: 'additive'
    });

    // Surprise expression
    this.expressionLibrary.set('surprise', {
      type: 'surprise',
      intensity: 0.8,
      duration: 1000,
      morphTargets: {
        'eyeWideLeft': 0.9,
        'eyeWideRight': 0.9,
        'browUpLeft': 0.8,
        'browUpRight': 0.8,
        'mouthOpen': 0.5
      },
      eyeMovements: {
        lookDirection: { x: 0, y: 0.2, z: 1 },
        blinkRate: 5,
        eyeWidening: 0.9,
        squinting: 0
      },
      eyebrowPosition: {
        leftRaise: 0.8,
        rightRaise: 0.8,
        furrow: 0
      },
      blendMode: 'additive'
    });
  }  /
**
   * Apply a facial expression with smooth transition
   */
  public applyExpression(expression: FacialExpression): void {
    console.log(`😊 Applying expression: ${expression.type} (intensity: ${expression.intensity})`);
    
    this.state.targetExpression = { ...expression };
    
    if (this.state.currentExpression) {
      this.startTransition(this.state.currentExpression, expression);
    } else {
      this.state.currentExpression = { ...expression };
      this.state.isTransitioning = false;
    }

    this.addToHistory(expression);
  }

  /**
   * Get expression for emotional context
   */
  public getEmotionalExpression(emotion: EmotionalContext): FacialExpression {
    const baseExpression = this.expressionLibrary.get(this.mapEmotionToExpression(emotion.primary));
    
    if (!baseExpression) {
      console.warn(`😊 No expression found for emotion: ${emotion.primary}`);
      return this.expressionLibrary.get('neutral')!;
    }

    // Apply cultural and intensity modifiers
    const modifiedExpression: FacialExpression = {
      ...baseExpression,
      intensity: Math.min(1.0, baseExpression.intensity * emotion.intensity * emotion.culturalModifier),
      duration: emotion.duration || baseExpression.duration
    };

    // Apply intensity scaling to morph targets
    Object.keys(modifiedExpression.morphTargets).forEach(key => {
      modifiedExpression.morphTargets[key] *= modifiedExpression.intensity;
    });

    return modifiedExpression;
  }

  /**
   * Blend multiple expressions together
   */
  public blendExpressions(expressions: FacialExpression[]): FacialExpression {
    if (expressions.length === 0) {
      return this.expressionLibrary.get('neutral')!;
    }

    if (expressions.length === 1) {
      return expressions[0];
    }

    const blendedExpression: FacialExpression = {
      type: 'neutral',
      intensity: 0,
      duration: Math.max(...expressions.map(e => e.duration)),
      morphTargets: {},
      eyeMovements: {
        lookDirection: { x: 0, y: 0, z: 1 },
        blinkRate: 15,
        eyeWidening: 0,
        squinting: 0
      },
      eyebrowPosition: {
        leftRaise: 0,
        rightRaise: 0,
        furrow: 0
      },
      blendMode: 'linear'
    };

    const weight = 1.0 / expressions.length;

    // Blend morph targets
    expressions.forEach(expr => {
      Object.entries(expr.morphTargets).forEach(([key, value]) => {
        blendedExpression.morphTargets[key] = (blendedExpression.morphTargets[key] || 0) + (value * weight);
      });

      // Blend eye movements
      blendedExpression.eyeMovements.lookDirection.x += expr.eyeMovements.lookDirection.x * weight;
      blendedExpression.eyeMovements.lookDirection.y += expr.eyeMovements.lookDirection.y * weight;
      blendedExpression.eyeMovements.lookDirection.z += expr.eyeMovements.lookDirection.z * weight;
      blendedExpression.eyeMovements.blinkRate += expr.eyeMovements.blinkRate * weight;
      blendedExpression.eyeMovements.eyeWidening += expr.eyeMovements.eyeWidening * weight;
      blendedExpression.eyeMovements.squinting += expr.eyeMovements.squinting * weight;

      // Blend eyebrow positions
      blendedExpression.eyebrowPosition.leftRaise += expr.eyebrowPosition.leftRaise * weight;
      blendedExpression.eyebrowPosition.rightRaise += expr.eyebrowPosition.rightRaise * weight;
      blendedExpression.eyebrowPosition.furrow += expr.eyebrowPosition.furrow * weight;

      blendedExpression.intensity += expr.intensity * weight;
    });

    return blendedExpression;
  }  
/**
   * Transition to a new expression smoothly
   */
  public transitionToExpression(target: FacialExpression, duration: number): void {
    if (!this.state.currentExpression) {
      this.applyExpression(target);
      return;
    }

    this.startTransition(this.state.currentExpression, target, duration);
  }

  /**
   * Get current expression state
   */
  public getCurrentExpression(): FacialExpression | null {
    return this.state.currentExpression;
  }

  /**
   * Check if currently transitioning
   */
  public isTransitioning(): boolean {
    return this.state.isTransitioning;
  }

  /**
   * Get transition progress (0.0 to 1.0)
   */
  public getTransitionProgress(): number {
    return this.state.transitionProgress;
  }

  /**
   * Stop all expressions and return to neutral
   */
  public resetToNeutral(): void {
    const neutral = this.expressionLibrary.get('neutral')!;
    this.transitionToExpression(neutral, 1000);
  }

  /**
   * Dispose of the engine and clean up resources
   */
  public dispose(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    this.activeTransition = null;
    this.state.expressionHistory = [];
  }

  // Private methods

  private startTransition(from: FacialExpression, to: FacialExpression, duration?: number): void {
    const transitionDuration = duration || (1000 / this.config.transitionSpeed);
    
    this.activeTransition = {
      fromExpression: { ...from },
      toExpression: { ...to },
      progress: 0,
      duration: transitionDuration,
      easing: 'ease_in_out',
      startTime: performance.now()
    };

    this.state.isTransitioning = true;
    this.state.transitionProgress = 0;
    this.state.targetExpression = { ...to };

    console.log(`😊 Starting transition: ${from.type} → ${to.type} (${transitionDuration}ms)`);
  }

  private startUpdateLoop(): void {
    this.updateInterval = setInterval(() => {
      this.update();
    }, 1000 / this.UPDATE_FREQUENCY) as unknown as number;
  }

  private update(): void {
    const currentTime = performance.now();
    const deltaTime = currentTime - this.state.lastUpdateTime;
    this.state.lastUpdateTime = currentTime;

    if (this.activeTransition) {
      this.updateTransition(currentTime);
    }

    this.cleanupHistory(currentTime);
  }  private
 updateTransition(currentTime: number): void {
    if (!this.activeTransition) return;

    const elapsed = currentTime - this.activeTransition.startTime;
    const progress = Math.min(1.0, elapsed / this.activeTransition.duration);
    
    // Apply easing function
    const easedProgress = this.applyEasing(progress, this.activeTransition.easing);
    
    this.state.transitionProgress = easedProgress;

    // Interpolate between expressions
    this.state.currentExpression = this.interpolateExpressions(
      this.activeTransition.fromExpression,
      this.activeTransition.toExpression,
      easedProgress
    );

    // Check if transition is complete
    if (progress >= 1.0) {
      this.state.currentExpression = { ...this.activeTransition.toExpression };
      this.state.isTransitioning = false;
      this.state.transitionProgress = 1.0;
      this.activeTransition = null;
      
      console.log(`😊 Transition complete: ${this.state.currentExpression.type}`);
    }
  }

  private interpolateExpressions(from: FacialExpression, to: FacialExpression, progress: number): FacialExpression {
    const interpolated: FacialExpression = {
      type: progress < 0.5 ? from.type : to.type,
      intensity: this.lerp(from.intensity, to.intensity, progress),
      duration: to.duration,
      morphTargets: {},
      eyeMovements: {
        lookDirection: {
          x: this.lerp(from.eyeMovements.lookDirection.x, to.eyeMovements.lookDirection.x, progress),
          y: this.lerp(from.eyeMovements.lookDirection.y, to.eyeMovements.lookDirection.y, progress),
          z: this.lerp(from.eyeMovements.lookDirection.z, to.eyeMovements.lookDirection.z, progress)
        },
        blinkRate: this.lerp(from.eyeMovements.blinkRate, to.eyeMovements.blinkRate, progress),
        eyeWidening: this.lerp(from.eyeMovements.eyeWidening, to.eyeMovements.eyeWidening, progress),
        squinting: this.lerp(from.eyeMovements.squinting, to.eyeMovements.squinting, progress)
      },
      eyebrowPosition: {
        leftRaise: this.lerp(from.eyebrowPosition.leftRaise, to.eyebrowPosition.leftRaise, progress),
        rightRaise: this.lerp(from.eyebrowPosition.rightRaise, to.eyebrowPosition.rightRaise, progress),
        furrow: this.lerp(from.eyebrowPosition.furrow, to.eyebrowPosition.furrow, progress)
      },
      blendMode: to.blendMode
    };

    // Interpolate morph targets
    const allMorphTargets = new Set([
      ...Object.keys(from.morphTargets),
      ...Object.keys(to.morphTargets)
    ]);

    allMorphTargets.forEach(key => {
      const fromValue = from.morphTargets[key] || 0;
      const toValue = to.morphTargets[key] || 0;
      interpolated.morphTargets[key] = this.lerp(fromValue, toValue, progress);
    });

    return interpolated;
  }

  private applyEasing(progress: number, easing: EasingFunction): number {
    switch (easing) {
      case 'linear':
        return progress;
      case 'ease_in':
        return progress * progress;
      case 'ease_out':
        return 1 - Math.pow(1 - progress, 2);
      case 'ease_in_out':
        return progress < 0.5 
          ? 2 * progress * progress 
          : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      case 'bounce':
        return this.bounceEasing(progress);
      case 'elastic':
        return this.elasticEasing(progress);
      default:
        return progress;
    }
  }  private 
bounceEasing(progress: number): number {
    const n1 = 7.5625;
    const d1 = 2.75;

    if (progress < 1 / d1) {
      return n1 * progress * progress;
    } else if (progress < 2 / d1) {
      return n1 * (progress -= 1.5 / d1) * progress + 0.75;
    } else if (progress < 2.5 / d1) {
      return n1 * (progress -= 2.25 / d1) * progress + 0.9375;
    } else {
      return n1 * (progress -= 2.625 / d1) * progress + 0.984375;
    }
  }

  private elasticEasing(progress: number): number {
    const c4 = (2 * Math.PI) / 3;
    return progress === 0
      ? 0
      : progress === 1
      ? 1
      : Math.pow(2, -10 * progress) * Math.sin((progress * 10 - 0.75) * c4) + 1;
  }

  private lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }

  private mapEmotionToExpression(emotion: EmotionType): ExpressionType {
    const mapping: Record<EmotionType, ExpressionType> = {
      'joy': 'smile',
      'concern': 'concern',
      'excitement': 'excitement',
      'focus': 'focus',
      'surprise': 'surprise',
      'neutral': 'neutral',
      'sadness': 'concern',
      'anger': 'concern',
      'fear': 'concern',
      'disgust': 'concern',
      'contempt': 'concern'
    };

    return mapping[emotion] || 'neutral';
  }

  private addToHistory(expression: FacialExpression): void {
    const entry: ExpressionHistoryEntry = {
      expression: { ...expression },
      timestamp: performance.now(),
      duration: expression.duration,
      context: {
        primary: this.mapExpressionToEmotion(expression.type),
        intensity: expression.intensity,
        culturalModifier: this.config.culturalSensitivity
      }
    };

    this.state.expressionHistory.push(entry);
  }

  private mapExpressionToEmotion(expression: ExpressionType): EmotionType {
    const mapping: Record<ExpressionType, EmotionType> = {
      'smile': 'joy',
      'concern': 'concern',
      'excitement': 'excitement',
      'focus': 'focus',
      'surprise': 'surprise',
      'neutral': 'neutral',
      'joy': 'joy',
      'sadness': 'sadness',
      'anger': 'anger',
      'fear': 'fear',
      'disgust': 'disgust',
      'contempt': 'contempt'
    };

    return mapping[expression] || 'neutral';
  }

  private cleanupHistory(currentTime: number): void {
    const cutoffTime = currentTime - this.config.expressionMemory;
    this.state.expressionHistory = this.state.expressionHistory.filter(
      entry => entry.timestamp > cutoffTime
    );
  }
}