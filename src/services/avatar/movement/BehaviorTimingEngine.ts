/**
 * Behavior Timing Engine
 * 
 * Handles precise timing synchronization across all behavior types
 * to ensure natural, coordinated avatar movements.
 */

import {
  TimedHandGesture,
  TimedFacialExpression,
  TimedHeadMovement,
  SynchronizedBehavior
} from './MultiModalBehaviorCoordinator';

import { SpeechContext } from '../behavior/types';

export interface TimingSyncRule {
  name: string;
  priority: number;
  condition: (behavior: any, context: SpeechContext) => boolean;
  adjustment: (behavior: any, context: SpeechContext, speechDuration: number) => any;
}

export interface SpeechSyncPoint {
  time: number;
  type: 'word_start' | 'word_end' | 'phrase_start' | 'phrase_end' | 'emphasis' | 'pause';
  content: string;
  intensity: number;
}

export class BehaviorTimingEngine {
  private syncRules: TimingSyncRule[];
  private speechAnalyzer: SpeechTimingAnalyzer;

  constructor() {
    this.syncRules = this.initializeSyncRules();
    this.speechAnalyzer = new SpeechTimingAnalyzer();
  }

  /**
   * Synchronizes behaviors with speech timing and context
   */
  public synchronizeBehaviors(
    behaviors: {
      handGestures: TimedHandGesture[];
      facialExpressions: TimedFacialExpression[];
      headMovements: TimedHeadMovement[];
    },
    context: SpeechContext,
    speechDuration: number
  ): {
    handGestures: TimedHandGesture[];
    facialExpressions: TimedFacialExpression[];
    headMovements: TimedHeadMovement[];
  } {
    // Analyze speech timing patterns
    const speechSyncPoints = this.speechAnalyzer.analyzeSpeechTiming(
      context,
      speechDuration
    );

    // Apply timing synchronization rules
    const synchronizedBehaviors = {
      handGestures: this.synchronizeHandGestures(behaviors.handGestures, context, speechSyncPoints, speechDuration),
      facialExpressions: this.synchronizeFacialExpressions(behaviors.facialExpressions, context, speechSyncPoints, speechDuration),
      headMovements: this.synchronizeHeadMovements(behaviors.headMovements, context, speechSyncPoints, speechDuration)
    };

    // Apply cross-modal synchronization
    return this.applyCrossModalSync(synchronizedBehaviors, speechSyncPoints);
  }

  /**
   * Creates smooth transitions between behavior sets
   */
  public createBehaviorTransition(
    fromBehaviors: {
      handGestures: TimedHandGesture[];
      facialExpressions: TimedFacialExpression[];
      headMovements: TimedHeadMovement[];
    },
    toBehaviors: {
      handGestures: TimedHandGesture[];
      facialExpressions: TimedFacialExpression[];
      headMovements: TimedHeadMovement[];
    },
    transitionDuration: number
  ): {
    handGestures: TimedHandGesture[];
    facialExpressions: TimedFacialExpression[];
    headMovements: TimedHeadMovement[];
  } {
    const transitionSteps = Math.ceil(transitionDuration / 0.1); // 100ms steps
    const stepDuration = transitionDuration / transitionSteps;

    return {
      handGestures: this.createGestureTransition(fromBehaviors.handGestures, toBehaviors.handGestures, transitionSteps, stepDuration),
      facialExpressions: this.createExpressionTransition(fromBehaviors.facialExpressions, toBehaviors.facialExpressions, transitionSteps, stepDuration),
      headMovements: this.createMovementTransition(fromBehaviors.headMovements, toBehaviors.headMovements, transitionSteps, stepDuration)
    };
  }

  private synchronizeHandGestures(
    gestures: TimedHandGesture[],
    context: SpeechContext,
    syncPoints: SpeechSyncPoint[],
    speechDuration: number
  ): TimedHandGesture[] {
    return gestures.map(gesture => {
      // Apply sync rules
      let synchronizedGesture = { ...gesture };
      
      for (const rule of this.syncRules) {
        if (rule.condition(gesture, context)) {
          synchronizedGesture = rule.adjustment(synchronizedGesture, context, speechDuration);
        }
      }

      // Sync with speech emphasis points
      if (gesture.synchronizeWithSpeech) {
        const nearestEmphasis = this.findNearestSyncPoint(
          gesture.absoluteStartTime,
          syncPoints.filter(sp => sp.type === 'emphasis')
        );

        if (nearestEmphasis && Math.abs(nearestEmphasis.time - gesture.absoluteStartTime) < 0.5) {
          synchronizedGesture.absoluteStartTime = nearestEmphasis.time;
          synchronizedGesture.absoluteEndTime = nearestEmphasis.time + gesture.duration;
          synchronizedGesture.intensity *= nearestEmphasis.intensity;
        }
      }

      return synchronizedGesture;
    });
  }

  private synchronizeFacialExpressions(
    expressions: TimedFacialExpression[],
    context: SpeechContext,
    syncPoints: SpeechSyncPoint[],
    speechDuration: number
  ): TimedFacialExpression[] {
    return expressions.map(expression => {
      let synchronizedExpression = { ...expression };

      // Apply sync rules
      for (const rule of this.syncRules) {
        if (rule.condition(expression, context)) {
          synchronizedExpression = rule.adjustment(synchronizedExpression, context, speechDuration);
        }
      }

      // Sync with phrase boundaries for natural expression timing
      const nearestPhraseStart = this.findNearestSyncPoint(
        expression.absoluteStartTime,
        syncPoints.filter(sp => sp.type === 'phrase_start')
      );

      if (nearestPhraseStart && Math.abs(nearestPhraseStart.time - expression.absoluteStartTime) < 0.3) {
        synchronizedExpression.absoluteStartTime = nearestPhraseStart.time - 0.1; // Slightly before phrase
        synchronizedExpression.absoluteEndTime = synchronizedExpression.absoluteStartTime + expression.duration;
      }

      return synchronizedExpression;
    });
  }

  private synchronizeHeadMovements(
    movements: TimedHeadMovement[],
    context: SpeechContext,
    syncPoints: SpeechSyncPoint[],
    speechDuration: number
  ): TimedHeadMovement[] {
    return movements.map(movement => {
      let synchronizedMovement = { ...movement };

      // Apply sync rules
      for (const rule of this.syncRules) {
        if (rule.condition(movement, context)) {
          synchronizedMovement = rule.adjustment(synchronizedMovement, context, speechDuration);
        }
      }

      // Sync emphasis movements with speech stress
      if (movement.type === 'emphasis') {
        const nearestEmphasis = this.findNearestSyncPoint(
          movement.absoluteStartTime,
          syncPoints.filter(sp => sp.type === 'emphasis')
        );

        if (nearestEmphasis) {
          synchronizedMovement.absoluteStartTime = nearestEmphasis.time;
          synchronizedMovement.absoluteEndTime = nearestEmphasis.time + movement.duration;
          synchronizedMovement.intensity *= nearestEmphasis.intensity;
        }
      }

      // Sync nods with natural speech rhythm
      if (movement.type === 'nod') {
        const rhythmPoints = syncPoints.filter(sp => sp.type === 'word_start');
        const nearestRhythm = this.findNearestSyncPoint(movement.absoluteStartTime, rhythmPoints);

        if (nearestRhythm && Math.abs(nearestRhythm.time - movement.absoluteStartTime) < 0.2) {
          synchronizedMovement.absoluteStartTime = nearestRhythm.time;
          synchronizedMovement.absoluteEndTime = nearestRhythm.time + movement.duration;
        }
      }

      return synchronizedMovement;
    });
  }

  private applyCrossModalSync(
    behaviors: {
      handGestures: TimedHandGesture[];
      facialExpressions: TimedFacialExpression[];
      headMovements: TimedHeadMovement[];
    },
    syncPoints: SpeechSyncPoint[]
  ): {
    handGestures: TimedHandGesture[];
    facialExpressions: TimedFacialExpression[];
    headMovements: TimedHeadMovement[];
  } {
    // Ensure complementary behaviors are properly timed
    const allBehaviors = [
      ...behaviors.handGestures.map(g => ({ ...g, category: 'hand' })),
      ...behaviors.facialExpressions.map(e => ({ ...e, category: 'face' })),
      ...behaviors.headMovements.map(m => ({ ...m, category: 'head' }))
    ];

    // Group behaviors by time windows
    const timeWindows = this.createTimeWindows(allBehaviors, 0.5); // 500ms windows

    // Apply cross-modal synchronization within each window
    for (const window of timeWindows) {
      this.synchronizeWithinWindow(window);
    }

    // Separate back into categories
    return {
      handGestures: allBehaviors.filter(b => b.category === 'hand') as TimedHandGesture[],
      facialExpressions: allBehaviors.filter(b => b.category === 'face') as TimedFacialExpression[],
      headMovements: allBehaviors.filter(b => b.category === 'head') as TimedHeadMovement[]
    };
  }

  private createGestureTransition(
    fromGestures: TimedHandGesture[],
    toGestures: TimedHandGesture[],
    steps: number,
    stepDuration: number
  ): TimedHandGesture[] {
    const transitionGestures: TimedHandGesture[] = [];

    for (let i = 0; i <= steps; i++) {
      const progress = i / steps;
      const blendWeight = this.easeInOutCubic(progress);

      // Create blended gestures for this step
      const blendedGestures = this.blendGestureSets(fromGestures, toGestures, blendWeight);
      
      blendedGestures.forEach(gesture => {
        gesture.absoluteStartTime += i * stepDuration;
        gesture.absoluteEndTime = gesture.absoluteStartTime + stepDuration;
        gesture.blendWeight = blendWeight;
      });

      transitionGestures.push(...blendedGestures);
    }

    return transitionGestures;
  }

  private createExpressionTransition(
    fromExpressions: TimedFacialExpression[],
    toExpressions: TimedFacialExpression[],
    steps: number,
    stepDuration: number
  ): TimedFacialExpression[] {
    const transitionExpressions: TimedFacialExpression[] = [];

    for (let i = 0; i <= steps; i++) {
      const progress = i / steps;
      const blendWeight = this.easeInOutCubic(progress);

      const blendedExpressions = this.blendExpressionSets(fromExpressions, toExpressions, blendWeight);
      
      blendedExpressions.forEach(expression => {
        expression.absoluteStartTime += i * stepDuration;
        expression.absoluteEndTime = expression.absoluteStartTime + stepDuration;
        expression.blendWeight = blendWeight;
      });

      transitionExpressions.push(...blendedExpressions);
    }

    return transitionExpressions;
  }

  private createMovementTransition(
    fromMovements: TimedHeadMovement[],
    toMovements: TimedHeadMovement[],
    steps: number,
    stepDuration: number
  ): TimedHeadMovement[] {
    const transitionMovements: TimedHeadMovement[] = [];

    for (let i = 0; i <= steps; i++) {
      const progress = i / steps;
      const blendWeight = this.easeInOutCubic(progress);

      const blendedMovements = this.blendMovementSets(fromMovements, toMovements, blendWeight);
      
      blendedMovements.forEach(movement => {
        movement.absoluteStartTime += i * stepDuration;
        movement.absoluteEndTime = movement.absoluteStartTime + stepDuration;
        movement.blendWeight = blendWeight;
      });

      transitionMovements.push(...blendedMovements);
    }

    return transitionMovements;
  }

  private findNearestSyncPoint(targetTime: number, syncPoints: SpeechSyncPoint[]): SpeechSyncPoint | null {
    if (syncPoints.length === 0) return null;

    return syncPoints.reduce((nearest, current) => {
      const currentDistance = Math.abs(current.time - targetTime);
      const nearestDistance = Math.abs(nearest.time - targetTime);
      return currentDistance < nearestDistance ? current : nearest;
    });
  }

  private createTimeWindows(behaviors: any[], windowSize: number): any[][] {
    const windows: any[][] = [];
    const sortedBehaviors = behaviors.sort((a, b) => a.absoluteStartTime - b.absoluteStartTime);

    let currentWindow: any[] = [];
    let windowStartTime = 0;

    for (const behavior of sortedBehaviors) {
      if (behavior.absoluteStartTime - windowStartTime > windowSize) {
        if (currentWindow.length > 0) {
          windows.push(currentWindow);
        }
        currentWindow = [behavior];
        windowStartTime = behavior.absoluteStartTime;
      } else {
        currentWindow.push(behavior);
      }
    }

    if (currentWindow.length > 0) {
      windows.push(currentWindow);
    }

    return windows;
  }

  private synchronizeWithinWindow(windowBehaviors: any[]): void {
    if (windowBehaviors.length <= 1) return;

    // Find the primary behavior (highest intensity or priority)
    const primaryBehavior = windowBehaviors.reduce((primary, current) => 
      current.intensity > primary.intensity ? current : primary
    );

    // Align other behaviors to the primary behavior's timing
    const alignmentTime = primaryBehavior.absoluteStartTime;

    windowBehaviors.forEach(behavior => {
      if (behavior !== primaryBehavior) {
        const offset = behavior.absoluteStartTime - alignmentTime;
        if (Math.abs(offset) < 0.2) { // Within 200ms
          behavior.absoluteStartTime = alignmentTime + (offset * 0.5); // Partial alignment
          behavior.absoluteEndTime = behavior.absoluteStartTime + behavior.duration;
        }
      }
    });
  }

  private blendGestureSets(
    fromGestures: TimedHandGesture[],
    toGestures: TimedHandGesture[],
    blendWeight: number
  ): TimedHandGesture[] {
    const blended: TimedHandGesture[] = [];

    // Blend existing gestures
    fromGestures.forEach(fromGesture => {
      const matchingTo = toGestures.find(to => to.type === fromGesture.type);
      if (matchingTo) {
        blended.push({
          ...fromGesture,
          intensity: fromGesture.intensity * (1 - blendWeight) + matchingTo.intensity * blendWeight,
          duration: fromGesture.duration * (1 - blendWeight) + matchingTo.duration * blendWeight
        });
      } else {
        blended.push({
          ...fromGesture,
          intensity: fromGesture.intensity * (1 - blendWeight)
        });
      }
    });

    // Add new gestures
    toGestures.forEach(toGesture => {
      const existingFrom = fromGestures.find(from => from.type === toGesture.type);
      if (!existingFrom) {
        blended.push({
          ...toGesture,
          intensity: toGesture.intensity * blendWeight
        });
      }
    });

    return blended;
  }

  private blendExpressionSets(
    fromExpressions: TimedFacialExpression[],
    toExpressions: TimedFacialExpression[],
    blendWeight: number
  ): TimedFacialExpression[] {
    const blended: TimedFacialExpression[] = [];

    fromExpressions.forEach(fromExpr => {
      const matchingTo = toExpressions.find(to => to.type === fromExpr.type);
      if (matchingTo) {
        blended.push({
          ...fromExpr,
          intensity: fromExpr.intensity * (1 - blendWeight) + matchingTo.intensity * blendWeight,
          culturalModifier: fromExpr.culturalModifier * (1 - blendWeight) + matchingTo.culturalModifier * blendWeight
        });
      } else {
        blended.push({
          ...fromExpr,
          intensity: fromExpr.intensity * (1 - blendWeight)
        });
      }
    });

    toExpressions.forEach(toExpr => {
      const existingFrom = fromExpressions.find(from => from.type === toExpr.type);
      if (!existingFrom) {
        blended.push({
          ...toExpr,
          intensity: toExpr.intensity * blendWeight
        });
      }
    });

    return blended;
  }

  private blendMovementSets(
    fromMovements: TimedHeadMovement[],
    toMovements: TimedHeadMovement[],
    blendWeight: number
  ): TimedHeadMovement[] {
    const blended: TimedHeadMovement[] = [];

    fromMovements.forEach(fromMove => {
      const matchingTo = toMovements.find(to => to.type === fromMove.type && to.direction === fromMove.direction);
      if (matchingTo) {
        blended.push({
          ...fromMove,
          intensity: fromMove.intensity * (1 - blendWeight) + matchingTo.intensity * blendWeight
        });
      } else {
        blended.push({
          ...fromMove,
          intensity: fromMove.intensity * (1 - blendWeight)
        });
      }
    });

    toMovements.forEach(toMove => {
      const existingFrom = fromMovements.find(from => from.type === toMove.type && from.direction === toMove.direction);
      if (!existingFrom) {
        blended.push({
          ...toMove,
          intensity: toMove.intensity * blendWeight
        });
      }
    });

    return blended;
  }

  private easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  private initializeSyncRules(): TimingSyncRule[] {
    return [
      {
        name: 'question_timing',
        priority: 1,
        condition: (behavior, context) => 
          behavior.type === 'questioning' || behavior.type === 'tilt',
        adjustment: (behavior, context, speechDuration) => ({
          ...behavior,
          absoluteStartTime: Math.max(0, speechDuration * 0.8), // Near end of question
          timing: Math.max(0, speechDuration * 0.8)
        })
      },
      {
        name: 'emphasis_sync',
        priority: 2,
        condition: (behavior, context) => 
          behavior.type === 'emphasis' || behavior.type === 'celebratory',
        adjustment: (behavior, context, speechDuration) => ({
          ...behavior,
          duration: Math.min(behavior.duration, speechDuration * 0.3) // Limit to 30% of speech
        })
      },
      {
        name: 'cultural_timing',
        priority: 3,
        condition: (behavior, context) => 
          context.culturalBackground === 'eastern',
        adjustment: (behavior, context, speechDuration) => ({
          ...behavior,
          absoluteStartTime: behavior.absoluteStartTime + 0.1, // Slight delay for respectfulness
          timing: behavior.timing + 0.1
        })
      }
    ];
  }
}

class SpeechTimingAnalyzer {
  public analyzeSpeechTiming(context: SpeechContext, speechDuration: number): SpeechSyncPoint[] {
    const syncPoints: SpeechSyncPoint[] = [];
    
    // Generate synthetic sync points based on speech duration and context
    // In a real implementation, this would analyze actual speech audio
    
    const wordsPerSecond = this.estimateWordsPerSecond(context);
    const totalWords = Math.ceil(speechDuration * wordsPerSecond);
    
    for (let i = 0; i < totalWords; i++) {
      const wordTime = (i / wordsPerSecond);
      
      syncPoints.push({
        time: wordTime,
        type: 'word_start',
        content: `word_${i}`,
        intensity: 0.5
      });
      
      // Add emphasis points at natural intervals
      if (i % 5 === 0 && i > 0) {
        syncPoints.push({
          time: wordTime,
          type: 'emphasis',
          content: `emphasis_${i}`,
          intensity: 0.8
        });
      }
      
      // Add phrase boundaries
      if (i % 8 === 0 && i > 0) {
        syncPoints.push({
          time: wordTime,
          type: 'phrase_start',
          content: `phrase_${Math.floor(i / 8)}`,
          intensity: 0.6
        });
      }
    }
    
    // Add pauses at natural break points
    const pauseInterval = speechDuration / 4;
    for (let i = 1; i < 4; i++) {
      syncPoints.push({
        time: i * pauseInterval,
        type: 'pause',
        content: `pause_${i}`,
        intensity: 0.3
      });
    }
    
    return syncPoints.sort((a, b) => a.time - b.time);
  }
  
  private estimateWordsPerSecond(context: SpeechContext): number {
    const baseRate = 2.5; // Average words per second
    
    // Adjust based on formality
    const formalityMultiplier = {
      casual: 1.2,
      professional: 1.0,
      formal: 0.8
    };
    
    // Adjust based on cultural background
    const culturalMultiplier = {
      western: 1.0,
      eastern: 0.9,
      latin: 1.1
    };
    
    return baseRate * 
           (formalityMultiplier[context.formalityLevel] || 1.0) * 
           (culturalMultiplier[context.culturalBackground] || 1.0);
  }
}