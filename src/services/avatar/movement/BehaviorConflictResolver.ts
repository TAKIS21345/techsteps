/**
 * Behavior Conflict Resolver
 * 
 * Detects and resolves conflicts between competing behaviors
 * using various resolution strategies.
 */

import {
  BehaviorConflict,
  TimedHandGesture,
  TimedFacialExpression,
  TimedHeadMovement,
  ConflictResolutionStrategy
} from './MultiModalBehaviorCoordinator';

export interface ConflictDetectionRule {
  name: string;
  priority: number;
  detector: (behaviors: any[]) => BehaviorConflict[];
  resolver: (behaviors: any[], conflict: BehaviorConflict) => any[];
}

export class BehaviorConflictResolver {
  private conflictRules: ConflictDetectionRule[];
  private resolutionStrategies: Map<ConflictResolutionStrategy, ConflictResolutionHandler>;

  constructor() {
    this.conflictRules = this.initializeConflictRules();
    this.resolutionStrategies = this.initializeResolutionStrategies();
  }

  /**
   * Detects conflicts in timed behaviors
   */
  public detectConflicts(behaviors: {
    handGestures: TimedHandGesture[];
    facialExpressions: TimedFacialExpression[];
    headMovements: TimedHeadMovement[];
  }): BehaviorConflict[] {
    const allBehaviors = [
      ...behaviors.handGestures.map(g => ({ ...g, category: 'hand' })),
      ...behaviors.facialExpressions.map(e => ({ ...e, category: 'face' })),
      ...behaviors.headMovements.map(m => ({ ...m, category: 'head' }))
    ];

    const conflicts: BehaviorConflict[] = [];

    // Apply each conflict detection rule
    for (const rule of this.conflictRules) {
      const ruleConflicts = rule.detector(allBehaviors);
      conflicts.push(...ruleConflicts);
    }

    // Sort conflicts by severity and priority
    return conflicts.sort((a, b) => {
      const severityOrder = { high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  }

  /**
   * Resolves conflicts using appropriate strategies
   */
  public resolveConflicts(
    behaviors: {
      handGestures: TimedHandGesture[];
      facialExpressions: TimedFacialExpression[];
      headMovements: TimedHeadMovement[];
    },
    conflicts: BehaviorConflict[]
  ): {
    handGestures: TimedHandGesture[];
    facialExpressions: TimedFacialExpression[];
    headMovements: TimedHeadMovement[];
  } {
    let resolvedBehaviors = { ...behaviors };

    for (const conflict of conflicts) {
      const handler = this.resolutionStrategies.get(conflict.resolution);
      if (handler) {
        resolvedBehaviors = handler.resolve(resolvedBehaviors, conflict);
      }
    }

    return resolvedBehaviors;
  }

  private initializeConflictRules(): ConflictDetectionRule[] {
    return [
      {
        name: 'temporal_overlap',
        priority: 1,
        detector: this.detectTemporalOverlaps.bind(this),
        resolver: this.resolveTemporalOverlaps.bind(this)
      },
      {
        name: 'spatial_interference',
        priority: 2,
        detector: this.detectSpatialInterference.bind(this),
        resolver: this.resolveSpatialInterference.bind(this)
      },
      {
        name: 'semantic_contradiction',
        priority: 3,
        detector: this.detectSemanticContradictions.bind(this),
        resolver: this.resolveSemanticContradictions.bind(this)
      },
      {
        name: 'intensity_overload',
        priority: 4,
        detector: this.detectIntensityOverload.bind(this),
        resolver: this.resolveIntensityOverload.bind(this)
      }
    ];
  }

  private detectTemporalOverlaps(behaviors: any[]): BehaviorConflict[] {
    const conflicts: BehaviorConflict[] = [];
    
    // Group behaviors by category
    const behaviorsByCategory = behaviors.reduce((acc, behavior) => {
      if (!acc[behavior.category]) acc[behavior.category] = [];
      acc[behavior.category].push(behavior);
      return acc;
    }, {} as Record<string, any[]>);

    // Check for overlaps within each category
    for (const [category, categoryBehaviors] of Object.entries(behaviorsByCategory)) {
      for (let i = 0; i < categoryBehaviors.length; i++) {
        for (let j = i + 1; j < categoryBehaviors.length; j++) {
          const behavior1 = categoryBehaviors[i];
          const behavior2 = categoryBehaviors[j];
          
          const overlap = this.calculateTimeOverlap(behavior1, behavior2);
          if (overlap > 0.1) { // 100ms threshold
            conflicts.push({
              type: 'temporal',
              conflictingBehaviors: [behavior1.type, behavior2.type],
              severity: overlap > 1.0 ? 'high' : overlap > 0.5 ? 'medium' : 'low',
              resolution: 'temporal_sequence',
              affectedTimeRange: {
                start: Math.max(behavior1.absoluteStartTime, behavior2.absoluteStartTime),
                end: Math.min(behavior1.absoluteEndTime, behavior2.absoluteEndTime)
              }
            });
          }
        }
      }
    }

    return conflicts;
  }

  private detectSpatialInterference(behaviors: any[]): BehaviorConflict[] {
    const conflicts: BehaviorConflict[] = [];
    
    // Define spatial interference rules
    const interferenceRules = [
      {
        categories: ['hand', 'head'],
        threshold: 0.5,
        severity: 'medium' as const
      },
      {
        categories: ['hand', 'hand'],
        threshold: 0.3,
        severity: 'high' as const
      }
    ];

    for (const rule of interferenceRules) {
      const relevantBehaviors = behaviors.filter(b => 
        rule.categories.includes(b.category)
      );

      for (let i = 0; i < relevantBehaviors.length; i++) {
        for (let j = i + 1; j < relevantBehaviors.length; j++) {
          const behavior1 = relevantBehaviors[i];
          const behavior2 = relevantBehaviors[j];
          
          const spatialOverlap = this.calculateSpatialOverlap(behavior1, behavior2);
          if (spatialOverlap > rule.threshold) {
            conflicts.push({
              type: 'spatial',
              conflictingBehaviors: [behavior1.type, behavior2.type],
              severity: rule.severity,
              resolution: 'spatial_separation',
              affectedTimeRange: {
                start: Math.max(behavior1.absoluteStartTime, behavior2.absoluteStartTime),
                end: Math.min(behavior1.absoluteEndTime, behavior2.absoluteEndTime)
              }
            });
          }
        }
      }
    }

    return conflicts;
  }

  private detectSemanticContradictions(behaviors: any[]): BehaviorConflict[] {
    const conflicts: BehaviorConflict[] = [];
    
    // Define semantic contradiction rules
    const contradictionRules = [
      {
        types: ['smile', 'concern'],
        severity: 'high' as const
      },
      {
        types: ['celebratory', 'questioning'],
        severity: 'medium' as const
      },
      {
        types: ['excitement', 'neutral'],
        severity: 'low' as const
      }
    ];

    for (const rule of contradictionRules) {
      const conflictingBehaviors = behaviors.filter(b => 
        rule.types.includes(b.type)
      );

      if (conflictingBehaviors.length > 1) {
        const timeOverlap = this.findMaxTimeOverlap(conflictingBehaviors);
        if (timeOverlap > 0.2) {
          conflicts.push({
            type: 'semantic',
            conflictingBehaviors: conflictingBehaviors.map(b => b.type),
            severity: rule.severity,
            resolution: 'semantic_merge',
            affectedTimeRange: {
              start: Math.min(...conflictingBehaviors.map(b => b.absoluteStartTime)),
              end: Math.max(...conflictingBehaviors.map(b => b.absoluteEndTime))
            }
          });
        }
      }
    }

    return conflicts;
  }

  private detectIntensityOverload(behaviors: any[]): BehaviorConflict[] {
    const conflicts: BehaviorConflict[] = [];
    
    // Calculate total intensity at each time point
    const timePoints = this.generateTimePoints(behaviors);
    
    for (const timePoint of timePoints) {
      const activeBehaviors = behaviors.filter(b => 
        b.absoluteStartTime <= timePoint && b.absoluteEndTime >= timePoint
      );
      
      const totalIntensity = activeBehaviors.reduce((sum, b) => sum + b.intensity, 0);
      
      if (totalIntensity > 2.5) { // Threshold for intensity overload
        conflicts.push({
          type: 'intensity',
          conflictingBehaviors: activeBehaviors.map(b => b.type),
          severity: totalIntensity > 4 ? 'high' : totalIntensity > 3 ? 'medium' : 'low',
          resolution: 'intensity_blend',
          affectedTimeRange: {
            start: timePoint,
            end: timePoint + 0.1
          }
        });
      }
    }

    return conflicts;
  }

  private resolveTemporalOverlaps(behaviors: any[], conflict: BehaviorConflict): any[] {
    // Implement temporal sequencing
    return behaviors.map(behavior => {
      if (conflict.conflictingBehaviors.includes(behavior.type)) {
        const index = conflict.conflictingBehaviors.indexOf(behavior.type);
        const delay = index * 0.3; // 300ms delay between conflicting behaviors
        
        return {
          ...behavior,
          absoluteStartTime: behavior.absoluteStartTime + delay,
          absoluteEndTime: behavior.absoluteEndTime + delay,
          timing: behavior.timing + delay
        };
      }
      return behavior;
    });
  }

  private resolveSpatialInterference(behaviors: any[], conflict: BehaviorConflict): any[] {
    // Implement spatial separation by reducing intensity
    return behaviors.map(behavior => {
      if (conflict.conflictingBehaviors.includes(behavior.type)) {
        return {
          ...behavior,
          intensity: behavior.intensity * 0.7,
          blendWeight: (behavior.blendWeight || 1.0) * 0.7
        };
      }
      return behavior;
    });
  }

  private resolveSemanticContradictions(behaviors: any[], conflict: BehaviorConflict): any[] {
    // Implement semantic merging by creating neutral alternatives
    return behaviors.map(behavior => {
      if (conflict.conflictingBehaviors.includes(behavior.type)) {
        // Convert to neutral equivalent
        const neutralType = this.getNeutralEquivalent(behavior.type);
        return {
          ...behavior,
          type: neutralType,
          intensity: behavior.intensity * 0.8
        };
      }
      return behavior;
    });
  }

  private resolveIntensityOverload(behaviors: any[], conflict: BehaviorConflict): any[] {
    // Implement intensity blending by normalizing intensities
    const conflictingBehaviors = behaviors.filter(b => 
      conflict.conflictingBehaviors.includes(b.type)
    );
    
    const totalIntensity = conflictingBehaviors.reduce((sum, b) => sum + b.intensity, 0);
    const normalizationFactor = 2.0 / totalIntensity; // Target total intensity of 2.0
    
    return behaviors.map(behavior => {
      if (conflict.conflictingBehaviors.includes(behavior.type)) {
        return {
          ...behavior,
          intensity: behavior.intensity * normalizationFactor,
          blendWeight: (behavior.blendWeight || 1.0) * normalizationFactor
        };
      }
      return behavior;
    });
  }

  private calculateTimeOverlap(behavior1: any, behavior2: any): number {
    const start = Math.max(behavior1.absoluteStartTime, behavior2.absoluteStartTime);
    const end = Math.min(behavior1.absoluteEndTime, behavior2.absoluteEndTime);
    return Math.max(0, end - start);
  }

  private calculateSpatialOverlap(behavior1: any, behavior2: any): number {
    // Simplified spatial overlap calculation
    // In a real implementation, this would consider 3D spatial relationships
    
    if (behavior1.category === behavior2.category) {
      return 1.0; // Same body part = full overlap
    }
    
    // Define spatial relationships
    const spatialRelationships: Record<string, Record<string, number>> = {
      hand: { head: 0.3, face: 0.2 },
      head: { hand: 0.3, face: 0.8 },
      face: { head: 0.8, hand: 0.2 }
    };
    
    return spatialRelationships[behavior1.category]?.[behavior2.category] || 0;
  }

  private findMaxTimeOverlap(behaviors: any[]): number {
    let maxOverlap = 0;
    
    for (let i = 0; i < behaviors.length; i++) {
      for (let j = i + 1; j < behaviors.length; j++) {
        const overlap = this.calculateTimeOverlap(behaviors[i], behaviors[j]);
        maxOverlap = Math.max(maxOverlap, overlap);
      }
    }
    
    return maxOverlap;
  }

  private generateTimePoints(behaviors: any[]): number[] {
    const timePoints = new Set<number>();
    
    behaviors.forEach(behavior => {
      timePoints.add(behavior.absoluteStartTime);
      timePoints.add(behavior.absoluteEndTime);
      
      // Add intermediate points
      const duration = behavior.absoluteEndTime - behavior.absoluteStartTime;
      const steps = Math.ceil(duration / 0.1); // 100ms intervals
      
      for (let i = 1; i < steps; i++) {
        timePoints.add(behavior.absoluteStartTime + (i * duration / steps));
      }
    });
    
    return Array.from(timePoints).sort((a, b) => a - b);
  }

  private getNeutralEquivalent(behaviorType: string): string {
    const neutralMappings: Record<string, string> = {
      smile: 'neutral',
      concern: 'focus',
      excitement: 'neutral',
      celebratory: 'supportive',
      questioning: 'neutral'
    };
    
    return neutralMappings[behaviorType] || 'neutral';
  }

  private initializeResolutionStrategies(): Map<ConflictResolutionStrategy, ConflictResolutionHandler> {
    const strategies = new Map<ConflictResolutionStrategy, ConflictResolutionHandler>();
    
    strategies.set('priority_override', new PriorityOverrideHandler());
    strategies.set('temporal_sequence', new TemporalSequenceHandler());
    strategies.set('intensity_blend', new IntensityBlendHandler());
    strategies.set('spatial_separation', new SpatialSeparationHandler());
    strategies.set('semantic_merge', new SemanticMergeHandler());
    
    return strategies;
  }
}

interface ConflictResolutionHandler {
  resolve(behaviors: {
    handGestures: TimedHandGesture[];
    facialExpressions: TimedFacialExpression[];
    headMovements: TimedHeadMovement[];
  }, conflict: BehaviorConflict): {
    handGestures: TimedHandGesture[];
    facialExpressions: TimedFacialExpression[];
    headMovements: TimedHeadMovement[];
  };
}

class PriorityOverrideHandler implements ConflictResolutionHandler {
  resolve(behaviors: any, conflict: BehaviorConflict): any {
    // Keep highest priority behaviors, reduce others
    const reductionFactor = 0.5;
    
    return {
      handGestures: behaviors.handGestures.map((gesture: TimedHandGesture) => 
        conflict.conflictingBehaviors.includes(gesture.type) 
          ? { ...gesture, intensity: gesture.intensity * reductionFactor }
          : gesture
      ),
      facialExpressions: behaviors.facialExpressions.map((expression: TimedFacialExpression) => 
        conflict.conflictingBehaviors.includes(expression.type)
          ? { ...expression, intensity: expression.intensity * reductionFactor }
          : expression
      ),
      headMovements: behaviors.headMovements.map((movement: TimedHeadMovement) => 
        conflict.conflictingBehaviors.includes(movement.type)
          ? { ...movement, intensity: movement.intensity * reductionFactor }
          : movement
      )
    };
  }
}

class TemporalSequenceHandler implements ConflictResolutionHandler {
  resolve(behaviors: any, conflict: BehaviorConflict): any {
    const delayIncrement = 0.2;
    let delayIndex = 0;
    
    return {
      handGestures: behaviors.handGestures.map((gesture: TimedHandGesture) => {
        if (conflict.conflictingBehaviors.includes(gesture.type)) {
          const delay = delayIndex * delayIncrement;
          delayIndex++;
          return {
            ...gesture,
            absoluteStartTime: gesture.absoluteStartTime + delay,
            absoluteEndTime: gesture.absoluteEndTime + delay,
            timing: gesture.timing + delay
          };
        }
        return gesture;
      }),
      facialExpressions: behaviors.facialExpressions,
      headMovements: behaviors.headMovements
    };
  }
}

class IntensityBlendHandler implements ConflictResolutionHandler {
  resolve(behaviors: any, conflict: BehaviorConflict): any {
    const blendFactor = 0.7;
    
    return {
      handGestures: behaviors.handGestures.map((gesture: TimedHandGesture) => 
        conflict.conflictingBehaviors.includes(gesture.type)
          ? { ...gesture, intensity: gesture.intensity * blendFactor, blendWeight: blendFactor }
          : gesture
      ),
      facialExpressions: behaviors.facialExpressions.map((expression: TimedFacialExpression) => 
        conflict.conflictingBehaviors.includes(expression.type)
          ? { ...expression, intensity: expression.intensity * blendFactor, blendWeight: blendFactor }
          : expression
      ),
      headMovements: behaviors.headMovements.map((movement: TimedHeadMovement) => 
        conflict.conflictingBehaviors.includes(movement.type)
          ? { ...movement, intensity: movement.intensity * blendFactor, blendWeight: blendFactor }
          : movement
      )
    };
  }
}

class SpatialSeparationHandler implements ConflictResolutionHandler {
  resolve(behaviors: any, conflict: BehaviorConflict): any {
    // Reduce intensity to allow spatial coexistence
    const separationFactor = 0.6;
    
    return {
      handGestures: behaviors.handGestures.map((gesture: TimedHandGesture) => 
        conflict.conflictingBehaviors.includes(gesture.type)
          ? { ...gesture, intensity: gesture.intensity * separationFactor }
          : gesture
      ),
      facialExpressions: behaviors.facialExpressions,
      headMovements: behaviors.headMovements.map((movement: TimedHeadMovement) => 
        conflict.conflictingBehaviors.includes(movement.type)
          ? { ...movement, intensity: movement.intensity * separationFactor }
          : movement
      )
    };
  }
}

class SemanticMergeHandler implements ConflictResolutionHandler {
  resolve(behaviors: any, conflict: BehaviorConflict): any {
    const neutralMappings: Record<string, string> = {
      smile: 'neutral',
      concern: 'focus',
      excitement: 'neutral',
      celebratory: 'supportive'
    };
    
    return {
      handGestures: behaviors.handGestures,
      facialExpressions: behaviors.facialExpressions.map((expression: TimedFacialExpression) => 
        conflict.conflictingBehaviors.includes(expression.type)
          ? { 
              ...expression, 
              type: neutralMappings[expression.type] || 'neutral',
              intensity: expression.intensity * 0.8
            }
          : expression
      ),
      headMovements: behaviors.headMovements
    };
  }
}