/**
 * Multi-Modal Behavior Coordinator
 * 
 * Coordinates hand gestures, facial expressions, and head movements
 * with precise timing synchronization and conflict resolution.
 * 
 * Requirements addressed:
 * - 3.1: Appropriate hand gestures or head movements to emphasize key points
 * - 3.2: Questioning gestures like slight head tilts or raised eyebrows
 * - 3.3: Explanatory gestures that support the content being delivered
 * - 3.4: Vary gestures to avoid repetitive patterns
 * - 4.1: Appropriate hand gestures like pointing, counting, or descriptive movements
 */

import {
  BehaviorPlan,
  HandGesture,
  FacialExpression,
  HeadMovement,
  EmotionalTone,
  ContentAnalysis,
  SpeechContext
} from '../behavior/types';

import {
  MovementContext,
  Gesture,
  MovementPlan,
  Transition,
  EasingType
} from './types';

export interface SynchronizedBehavior {
  id: string;
  startTime: number;
  endTime: number;
  behaviors: {
    handGestures: TimedHandGesture[];
    facialExpressions: TimedFacialExpression[];
    headMovements: TimedHeadMovement[];
  };
  priority: number;
  conflictResolution: ConflictResolutionStrategy;
}

export interface TimedHandGesture extends HandGesture {
  absoluteStartTime: number;
  absoluteEndTime: number;
  blendWeight: number;
  conflictGroup?: string;
}

export interface TimedFacialExpression extends FacialExpression {
  absoluteStartTime: number;
  absoluteEndTime: number;
  blendWeight: number;
  conflictGroup?: string;
}

export interface TimedHeadMovement extends HeadMovement {
  absoluteStartTime: number;
  absoluteEndTime: number;
  blendWeight: number;
  conflictGroup?: string;
}

export interface BehaviorConflict {
  type: 'temporal' | 'spatial' | 'semantic' | 'intensity';
  conflictingBehaviors: string[];
  severity: 'low' | 'medium' | 'high';
  resolution: ConflictResolutionStrategy;
  affectedTimeRange: { start: number; end: number };
}

export type ConflictResolutionStrategy = 
  | 'priority_override'
  | 'temporal_sequence'
  | 'intensity_blend'
  | 'spatial_separation'
  | 'semantic_merge';

export interface CoordinationMetrics {
  totalBehaviors: number;
  conflictsDetected: number;
  conflictsResolved: number;
  synchronizationAccuracy: number;
  blendingComplexity: number;
}

export class MultiModalBehaviorCoordinator {
  private activeBehaviors: Map<string, SynchronizedBehavior> = new Map();
  private behaviorQueue: SynchronizedBehavior[] = [];
  private conflictResolver: BehaviorConflictResolver;
  private timingEngine: BehaviorTimingEngine;
  private blendingEngine: BehaviorBlendingEngine;
  private currentTime: number = 0;
  private coordinationMetrics: CoordinationMetrics;

  constructor() {
    this.conflictResolver = new BehaviorConflictResolver();
    this.timingEngine = new BehaviorTimingEngine();
    this.blendingEngine = new BehaviorBlendingEngine();
    this.coordinationMetrics = this.initializeMetrics();
  }

  /**
   * Coordinates multiple behavior types into a synchronized plan
   */
  public coordinateBehaviors(
    behaviorPlan: BehaviorPlan,
    context: SpeechContext,
    speechDuration: number
  ): SynchronizedBehavior {
    // Create timed behaviors from the plan
    const timedBehaviors = this.createTimedBehaviors(behaviorPlan, speechDuration);
    
    // Detect potential conflicts
    const conflicts = this.conflictResolver.detectConflicts(timedBehaviors);
    
    // Resolve conflicts using appropriate strategies
    const resolvedBehaviors = this.conflictResolver.resolveConflicts(
      timedBehaviors,
      conflicts
    );
    
    // Apply timing synchronization
    const synchronizedBehaviors = this.timingEngine.synchronizeBehaviors(
      resolvedBehaviors,
      context,
      speechDuration
    );
    
    // Create final synchronized behavior
    const synchronizedBehavior: SynchronizedBehavior = {
      id: this.generateBehaviorId(),
      startTime: this.currentTime,
      endTime: this.currentTime + speechDuration,
      behaviors: synchronizedBehaviors,
      priority: behaviorPlan.priority === 'high' ? 3 : behaviorPlan.priority === 'medium' ? 2 : 1,
      conflictResolution: this.determineOverallResolutionStrategy(conflicts)
    };
    
    // Update metrics
    this.updateCoordinationMetrics(synchronizedBehavior, conflicts);
    
    return synchronizedBehavior;
  }

  /**
   * Executes synchronized behavior with real-time coordination
   */
  public executeSynchronizedBehavior(
    behavior: SynchronizedBehavior,
    onBehaviorUpdate: (update: BehaviorUpdate) => void
  ): void {
    this.activeBehaviors.set(behavior.id, behavior);
    
    // Schedule behavior execution
    this.scheduleBehaviorExecution(behavior, onBehaviorUpdate);
    
    // Monitor for real-time conflicts
    this.monitorRealTimeConflicts(behavior);
  }

  /**
   * Adapts ongoing behavior based on new content analysis
   */
  public adaptBehaviorRealTime(
    behaviorId: string,
    newAnalysis: ContentAnalysis,
    adaptationIntensity: number = 0.5
  ): SynchronizedBehavior | null {
    const activeBehavior = this.activeBehaviors.get(behaviorId);
    if (!activeBehavior) {
      return null;
    }
    
    // Create adaptation based on new analysis
    const adaptedBehavior = this.createBehaviorAdaptation(
      activeBehavior,
      newAnalysis,
      adaptationIntensity
    );
    
    // Apply smooth transition to adapted behavior
    const transitionedBehavior = this.blendingEngine.createBehaviorTransition(
      activeBehavior,
      adaptedBehavior,
      0.3 // 300ms transition
    );
    
    // Update active behavior
    this.activeBehaviors.set(behaviorId, transitionedBehavior);
    
    return transitionedBehavior;
  }

  /**
   * Gets current coordination metrics
   */
  public getCoordinationMetrics(): CoordinationMetrics {
    return { ...this.coordinationMetrics };
  }

  /**
   * Clears completed behaviors and updates timing
   */
  public updateTime(currentTime: number): void {
    this.currentTime = currentTime;
    
    // Remove completed behaviors
    for (const [id, behavior] of this.activeBehaviors) {
      if (behavior.endTime <= currentTime) {
        this.activeBehaviors.delete(id);
      }
    }
  }

  private createTimedBehaviors(
    behaviorPlan: BehaviorPlan,
    speechDuration: number
  ): {
    handGestures: TimedHandGesture[];
    facialExpressions: TimedFacialExpression[];
    headMovements: TimedHeadMovement[];
  } {
    const baseTime = this.currentTime;
    
    // Convert hand gestures to timed gestures
    const timedHandGestures: TimedHandGesture[] = behaviorPlan.handGestures.map((gesture, index) => ({
      ...gesture,
      absoluteStartTime: baseTime + gesture.timing,
      absoluteEndTime: baseTime + gesture.timing + gesture.duration,
      blendWeight: 1.0,
      conflictGroup: `hand_${gesture.type}`
    }));
    
    // Convert facial expressions to timed expressions
    const timedFacialExpressions: TimedFacialExpression[] = behaviorPlan.facialExpressions.map((expression, index) => ({
      ...expression,
      absoluteStartTime: baseTime + expression.timing,
      absoluteEndTime: baseTime + expression.timing + expression.duration,
      blendWeight: 1.0,
      conflictGroup: `face_${expression.type}`
    }));
    
    // Convert head movements to timed movements
    const timedHeadMovements: TimedHeadMovement[] = behaviorPlan.headMovements.map((movement, index) => ({
      ...movement,
      absoluteStartTime: baseTime + movement.timing,
      absoluteEndTime: baseTime + movement.timing + movement.duration,
      blendWeight: 1.0,
      conflictGroup: `head_${movement.type}`
    }));
    
    return {
      handGestures: timedHandGestures,
      facialExpressions: timedFacialExpressions,
      headMovements: timedHeadMovements
    };
  }

  private scheduleBehaviorExecution(
    behavior: SynchronizedBehavior,
    onBehaviorUpdate: (update: BehaviorUpdate) => void
  ): void {
    const allBehaviors = [
      ...behavior.behaviors.handGestures.map(g => ({ ...g, type: 'hand' as const })),
      ...behavior.behaviors.facialExpressions.map(e => ({ ...e, type: 'face' as const })),
      ...behavior.behaviors.headMovements.map(m => ({ ...m, type: 'head' as const }))
    ];
    
    // Sort by start time
    allBehaviors.sort((a, b) => a.absoluteStartTime - b.absoluteStartTime);
    
    // Schedule each behavior
    allBehaviors.forEach(behaviorItem => {
      const delay = Math.max(0, behaviorItem.absoluteStartTime - this.currentTime);
      
      setTimeout(() => {
        onBehaviorUpdate({
          type: 'behavior_start',
          behaviorType: behaviorItem.type,
          behavior: behaviorItem,
          timestamp: Date.now()
        });
      }, delay);
      
      // Schedule behavior end
      const endDelay = Math.max(0, behaviorItem.absoluteEndTime - this.currentTime);
      setTimeout(() => {
        onBehaviorUpdate({
          type: 'behavior_end',
          behaviorType: behaviorItem.type,
          behavior: behaviorItem,
          timestamp: Date.now()
        });
      }, endDelay);
    });
  }

  private monitorRealTimeConflicts(behavior: SynchronizedBehavior): void {
    // Check for conflicts with other active behaviors
    const conflicts: BehaviorConflict[] = [];
    
    for (const [otherId, otherBehavior] of this.activeBehaviors) {
      if (otherId !== behavior.id) {
        const timeOverlap = this.calculateTimeOverlap(behavior, otherBehavior);
        if (timeOverlap > 0) {
          const conflict = this.analyzeRealTimeConflict(behavior, otherBehavior, timeOverlap);
          if (conflict) {
            conflicts.push(conflict);
          }
        }
      }
    }
    
    // Resolve real-time conflicts
    if (conflicts.length > 0) {
      this.resolveRealTimeConflicts(behavior, conflicts);
    }
  }

  private createBehaviorAdaptation(
    originalBehavior: SynchronizedBehavior,
    newAnalysis: ContentAnalysis,
    adaptationIntensity: number
  ): SynchronizedBehavior {
    const adaptedBehavior = { ...originalBehavior };
    
    // Adapt hand gestures based on new content
    adaptedBehavior.behaviors.handGestures = originalBehavior.behaviors.handGestures.map(gesture => ({
      ...gesture,
      intensity: this.adaptIntensity(gesture.intensity, newAnalysis.emotionalIntensity, adaptationIntensity),
      blendWeight: this.calculateAdaptationBlendWeight(gesture, newAnalysis)
    }));
    
    // Adapt facial expressions based on sentiment changes
    adaptedBehavior.behaviors.facialExpressions = originalBehavior.behaviors.facialExpressions.map(expression => ({
      ...expression,
      intensity: this.adaptIntensity(expression.intensity, newAnalysis.emotionalIntensity, adaptationIntensity),
      culturalModifier: this.adaptCulturalModifier(expression.culturalModifier, newAnalysis)
    }));
    
    // Adapt head movements for emphasis changes
    adaptedBehavior.behaviors.headMovements = originalBehavior.behaviors.headMovements.map(movement => ({
      ...movement,
      intensity: this.adaptIntensity(movement.intensity, newAnalysis.emotionalIntensity, adaptationIntensity)
    }));
    
    return adaptedBehavior;
  }

  private adaptIntensity(
    originalIntensity: number,
    newEmotionalIntensity: number,
    adaptationIntensity: number
  ): number {
    const targetIntensity = originalIntensity * newEmotionalIntensity;
    return originalIntensity + (targetIntensity - originalIntensity) * adaptationIntensity;
  }

  private calculateAdaptationBlendWeight(
    gesture: TimedHandGesture,
    analysis: ContentAnalysis
  ): number {
    // Adjust blend weight based on content relevance
    const contentRelevance = this.calculateContentRelevance(gesture.type, analysis.contentType);
    return Math.min(1.0, gesture.blendWeight * contentRelevance);
  }

  private adaptCulturalModifier(
    originalModifier: number,
    analysis: ContentAnalysis
  ): number {
    // Adapt cultural modifier based on cultural context
    const culturalIntensity = analysis.culturalContext === 'expressive' ? 1.2 : 
                             analysis.culturalContext === 'reserved' ? 0.8 : 1.0;
    return Math.min(1.0, originalModifier * culturalIntensity);
  }

  private calculateContentRelevance(gestureType: string, contentType: string): number {
    const relevanceMap: Record<string, Record<string, number>> = {
      pointing: { explanation: 1.0, instruction: 1.0, question: 0.7, celebration: 0.3 },
      counting: { instruction: 1.0, explanation: 0.8, question: 0.5, celebration: 0.2 },
      descriptive: { explanation: 1.0, instruction: 0.8, question: 0.6, celebration: 0.4 },
      celebratory: { celebration: 1.0, greeting: 0.7, question: 0.2, instruction: 0.1 },
      supportive: { question: 1.0, explanation: 0.8, celebration: 0.7, instruction: 0.6 },
      questioning: { question: 1.0, explanation: 0.5, instruction: 0.3, celebration: 0.1 }
    };
    
    return relevanceMap[gestureType]?.[contentType] || 0.5;
  }

  private calculateTimeOverlap(
    behavior1: SynchronizedBehavior,
    behavior2: SynchronizedBehavior
  ): number {
    const start = Math.max(behavior1.startTime, behavior2.startTime);
    const end = Math.min(behavior1.endTime, behavior2.endTime);
    return Math.max(0, end - start);
  }

  private analyzeRealTimeConflict(
    behavior1: SynchronizedBehavior,
    behavior2: SynchronizedBehavior,
    timeOverlap: number
  ): BehaviorConflict | null {
    // Analyze spatial conflicts (same body parts)
    const spatialConflicts = this.detectSpatialConflicts(behavior1, behavior2);
    
    // Analyze semantic conflicts (contradictory meanings)
    const semanticConflicts = this.detectSemanticConflicts(behavior1, behavior2);
    
    if (spatialConflicts.length > 0 || semanticConflicts.length > 0) {
      return {
        type: spatialConflicts.length > 0 ? 'spatial' : 'semantic',
        conflictingBehaviors: [behavior1.id, behavior2.id],
        severity: this.calculateConflictSeverity(timeOverlap, behavior1.priority, behavior2.priority),
        resolution: this.selectConflictResolution(spatialConflicts, semanticConflicts),
        affectedTimeRange: {
          start: Math.max(behavior1.startTime, behavior2.startTime),
          end: Math.min(behavior1.endTime, behavior2.endTime)
        }
      };
    }
    
    return null;
  }

  private detectSpatialConflicts(
    behavior1: SynchronizedBehavior,
    behavior2: SynchronizedBehavior
  ): string[] {
    const conflicts: string[] = [];
    
    // Check hand gesture conflicts
    if (behavior1.behaviors.handGestures.length > 0 && behavior2.behaviors.handGestures.length > 0) {
      conflicts.push('hand_gestures');
    }
    
    // Check head movement conflicts
    if (behavior1.behaviors.headMovements.length > 0 && behavior2.behaviors.headMovements.length > 0) {
      conflicts.push('head_movements');
    }
    
    return conflicts;
  }

  private detectSemanticConflicts(
    behavior1: SynchronizedBehavior,
    behavior2: SynchronizedBehavior
  ): string[] {
    const conflicts: string[] = [];
    
    // Check for contradictory facial expressions
    const expressions1 = behavior1.behaviors.facialExpressions.map(e => e.type);
    const expressions2 = behavior2.behaviors.facialExpressions.map(e => e.type);
    
    const contradictoryPairs = [
      ['smile', 'concern'],
      ['excitement', 'neutral'],
      ['surprise', 'focus']
    ];
    
    for (const [expr1, expr2] of contradictoryPairs) {
      if ((expressions1.includes(expr1 as any) && expressions2.includes(expr2 as any)) ||
          (expressions1.includes(expr2 as any) && expressions2.includes(expr1 as any))) {
        conflicts.push('contradictory_expressions');
      }
    }
    
    return conflicts;
  }

  private calculateConflictSeverity(
    timeOverlap: number,
    priority1: number,
    priority2: number
  ): 'low' | 'medium' | 'high' {
    const overlapRatio = timeOverlap / 1000; // Convert to seconds
    const priorityDiff = Math.abs(priority1 - priority2);
    
    if (overlapRatio > 2 && priorityDiff <= 1) return 'high';
    if (overlapRatio > 1 || priorityDiff > 1) return 'medium';
    return 'low';
  }

  private selectConflictResolution(
    spatialConflicts: string[],
    semanticConflicts: string[]
  ): ConflictResolutionStrategy {
    if (semanticConflicts.length > 0) return 'semantic_merge';
    if (spatialConflicts.includes('hand_gestures')) return 'temporal_sequence';
    if (spatialConflicts.includes('head_movements')) return 'intensity_blend';
    return 'priority_override';
  }

  private resolveRealTimeConflicts(
    behavior: SynchronizedBehavior,
    conflicts: BehaviorConflict[]
  ): void {
    for (const conflict of conflicts) {
      switch (conflict.resolution) {
        case 'priority_override':
          this.applyPriorityOverride(behavior, conflict);
          break;
        case 'temporal_sequence':
          this.applyTemporalSequencing(behavior, conflict);
          break;
        case 'intensity_blend':
          this.applyIntensityBlending(behavior, conflict);
          break;
        case 'semantic_merge':
          this.applySemanticMerging(behavior, conflict);
          break;
      }
    }
  }

  private applyPriorityOverride(behavior: SynchronizedBehavior, conflict: BehaviorConflict): void {
    // Reduce intensity of lower priority behaviors
    const reductionFactor = 0.6;
    
    behavior.behaviors.handGestures.forEach(gesture => {
      gesture.intensity *= reductionFactor;
      gesture.blendWeight *= reductionFactor;
    });
  }

  private applyTemporalSequencing(behavior: SynchronizedBehavior, conflict: BehaviorConflict): void {
    // Delay conflicting behaviors by small amounts
    const delayIncrement = 0.2; // 200ms
    
    behavior.behaviors.handGestures.forEach((gesture, index) => {
      gesture.absoluteStartTime += index * delayIncrement;
      gesture.absoluteEndTime += index * delayIncrement;
    });
  }

  private applyIntensityBlending(behavior: SynchronizedBehavior, conflict: BehaviorConflict): void {
    // Reduce intensity to allow blending
    const blendFactor = 0.7;
    
    behavior.behaviors.headMovements.forEach(movement => {
      movement.intensity *= blendFactor;
      movement.blendWeight = blendFactor;
    });
  }

  private applySemanticMerging(behavior: SynchronizedBehavior, conflict: BehaviorConflict): void {
    // Create neutral expressions to resolve semantic conflicts
    behavior.behaviors.facialExpressions = behavior.behaviors.facialExpressions.map(expression => ({
      ...expression,
      type: 'neutral',
      intensity: expression.intensity * 0.8
    }));
  }

  private determineOverallResolutionStrategy(conflicts: BehaviorConflict[]): ConflictResolutionStrategy {
    if (conflicts.length === 0) return 'priority_override';
    
    const strategies = conflicts.map(c => c.resolution);
    const strategyCounts = strategies.reduce((acc, strategy) => {
      acc[strategy] = (acc[strategy] || 0) + 1;
      return acc;
    }, {} as Record<ConflictResolutionStrategy, number>);
    
    // Return most common strategy
    return Object.entries(strategyCounts)
      .sort(([,a], [,b]) => b - a)[0][0] as ConflictResolutionStrategy;
  }

  private updateCoordinationMetrics(
    behavior: SynchronizedBehavior,
    conflicts: BehaviorConflict[]
  ): void {
    const totalBehaviors = 
      behavior.behaviors.handGestures.length +
      behavior.behaviors.facialExpressions.length +
      behavior.behaviors.headMovements.length;
    
    this.coordinationMetrics.totalBehaviors += totalBehaviors;
    this.coordinationMetrics.conflictsDetected += conflicts.length;
    this.coordinationMetrics.conflictsResolved += conflicts.length;
    
    // Calculate synchronization accuracy (simplified)
    const timingVariance = this.calculateTimingVariance(behavior);
    this.coordinationMetrics.synchronizationAccuracy = Math.max(0, 1 - timingVariance);
    
    // Calculate blending complexity
    const blendingComplexity = this.calculateBlendingComplexity(behavior);
    this.coordinationMetrics.blendingComplexity = blendingComplexity;
  }

  private calculateTimingVariance(behavior: SynchronizedBehavior): number {
    const allTimings = [
      ...behavior.behaviors.handGestures.map(g => g.timing),
      ...behavior.behaviors.facialExpressions.map(e => e.timing),
      ...behavior.behaviors.headMovements.map(m => m.timing)
    ];
    
    if (allTimings.length === 0) return 0;
    
    const mean = allTimings.reduce((sum, timing) => sum + timing, 0) / allTimings.length;
    const variance = allTimings.reduce((sum, timing) => sum + Math.pow(timing - mean, 2), 0) / allTimings.length;
    
    return Math.sqrt(variance) / 1000; // Normalize to seconds
  }

  private calculateBlendingComplexity(behavior: SynchronizedBehavior): number {
    const totalBlendWeights = [
      ...behavior.behaviors.handGestures.map(g => g.blendWeight),
      ...behavior.behaviors.facialExpressions.map(e => e.blendWeight || 1),
      ...behavior.behaviors.headMovements.map(m => m.blendWeight)
    ];
    
    const nonUnityWeights = totalBlendWeights.filter(weight => weight !== 1.0);
    return nonUnityWeights.length / totalBlendWeights.length;
  }

  private generateBehaviorId(): string {
    return `behavior_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeMetrics(): CoordinationMetrics {
    return {
      totalBehaviors: 0,
      conflictsDetected: 0,
      conflictsResolved: 0,
      synchronizationAccuracy: 1.0,
      blendingComplexity: 0.0
    };
  }
}

export interface BehaviorUpdate {
  type: 'behavior_start' | 'behavior_end' | 'behavior_adapt' | 'conflict_resolved';
  behaviorType: 'hand' | 'face' | 'head';
  behavior: any;
  timestamp: number;
}