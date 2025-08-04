/**
 * Tests for BehaviorPlanningEngine
 */

import { BehaviorPlanningEngine } from '../BehaviorPlanningEngine';
import { ContentAnalysis, SpeechContext } from '../types';

describe('BehaviorPlanningEngine', () => {
  let engine: BehaviorPlanningEngine;

  beforeEach(() => {
    engine = new BehaviorPlanningEngine();
  });

  describe('planBehavior', () => {
    it('should generate behavior plan for positive question', async () => {
      const analysis: ContentAnalysis = {
        sentiment: 'positive',
        emotionalIntensity: 0.7,
        contentType: 'question',
        keyPhrases: ['how', 'help'],
        culturalContext: 'western',
        confidence: 0.8
      };

      const context: SpeechContext = {
        language: 'en',
        culturalBackground: 'western',
        formalityLevel: 'casual',
        conversationStage: 'middle'
      };

      const response = await engine.planBehavior(analysis, context);

      expect(response.behaviors).toBeDefined();
      expect(response.behaviors.priority).toBe('high');
      expect(response.behaviors.handGestures.length).toBeGreaterThan(0);
      expect(response.behaviors.facialExpressions.length).toBeGreaterThan(0);
      expect(response.behaviors.headMovements.length).toBeGreaterThan(0);
      expect(response.confidence).toBeGreaterThan(0);
      expect(response.reasoning).toContain('question');
    });

    it('should generate behavior plan for explanation content', async () => {
      const analysis: ContentAnalysis = {
        sentiment: 'neutral',
        emotionalIntensity: 0.5,
        contentType: 'explanation',
        keyPhrases: ['because', 'therefore'],
        culturalContext: 'western',
        confidence: 0.7
      };

      const context: SpeechContext = {
        language: 'en',
        culturalBackground: 'western',
        formalityLevel: 'formal',
        conversationStage: 'middle'
      };

      const response = await engine.planBehavior(analysis, context);

      expect(response.behaviors.priority).toBe('medium');
      expect(response.behaviors.handGestures.some(g => g.type === 'descriptive')).toBe(true);
      expect(response.behaviors.facialExpressions.some(e => e.type === 'focus')).toBe(true);
    });

    it('should apply cultural adaptations for eastern context', async () => {
      const analysis: ContentAnalysis = {
        sentiment: 'positive',
        emotionalIntensity: 0.8,
        contentType: 'celebration',
        keyPhrases: ['great', 'excellent'],
        culturalContext: 'eastern',
        confidence: 0.9
      };

      const context: SpeechContext = {
        language: 'ja',
        culturalBackground: 'eastern',
        formalityLevel: 'formal',
        conversationStage: 'middle'
      };

      const response = await engine.planBehavior(analysis, context);

      expect(response.behaviors.culturalAdaptations.length).toBeGreaterThan(0);
      expect(response.behaviors.handGestures.every(g => g.intensity <= 0.8)).toBe(true);
      expect(response.behaviors.handGestures.some(g => g.culturalVariant === 'eastern')).toBe(true);
    });
  });

  describe('adaptBehaviorRealTime', () => {
    it('should adapt behavior based on new analysis', () => {
      const currentPlan = {
        handGestures: [{
          type: 'supportive' as const,
          intensity: 0.5,
          duration: 2.0,
          timing: 0.1,
          synchronizeWithSpeech: true
        }],
        facialExpressions: [{
          type: 'neutral' as const,
          intensity: 0.5,
          duration: 2.0,
          timing: 0.1,
          culturalModifier: 1.0
        }],
        headMovements: [{
          type: 'nod' as const,
          direction: 'down' as const,
          intensity: 0.5,
          duration: 1.0,
          timing: 0.1
        }],
        emotionalTone: {
          warmth: 0.5,
          energy: 0.5,
          formality: 0.5,
          empathy: 0.5
        },
        priority: 'medium' as const,
        culturalAdaptations: []
      };

      const newAnalysis: ContentAnalysis = {
        sentiment: 'positive',
        emotionalIntensity: 0.9,
        contentType: 'celebration',
        keyPhrases: ['amazing', 'wonderful'],
        culturalContext: 'western',
        confidence: 0.8
      };

      const context: SpeechContext = {
        language: 'en',
        culturalBackground: 'western',
        formalityLevel: 'casual',
        conversationStage: 'middle'
      };

      const adaptedPlan = engine.adaptBehaviorRealTime(newAnalysis, currentPlan, context);

      // The adaptation multiplies by emotionalIntensity (0.9), so 0.5 * 0.9 = 0.45
      expect(adaptedPlan.handGestures[0].intensity).toBe(currentPlan.handGestures[0].intensity * newAnalysis.emotionalIntensity);
      expect(adaptedPlan.facialExpressions[0].intensity).toBe(currentPlan.facialExpressions[0].intensity * newAnalysis.emotionalIntensity);
    });
  });

  describe('resolveBehaviorConflicts', () => {
    it('should resolve gesture conflicts by priority', () => {
      const conflictedPlan = {
        handGestures: [
          {
            type: 'pointing' as const,
            intensity: 0.9,
            duration: 1.0,
            timing: 0.1,
            synchronizeWithSpeech: true
          },
          {
            type: 'descriptive' as const,
            intensity: 0.8,
            duration: 2.0,
            timing: 0.1,
            synchronizeWithSpeech: true
          },
          {
            type: 'celebratory' as const,
            intensity: 0.7,
            duration: 2.0,
            timing: 0.1,
            synchronizeWithSpeech: false
          }
        ],
        facialExpressions: [],
        headMovements: [],
        emotionalTone: {
          warmth: 0.5,
          energy: 0.5,
          formality: 0.5,
          empathy: 0.5
        },
        priority: 'high' as const,
        culturalAdaptations: []
      };

      const resolvedPlan = engine.resolveBehaviorConflicts(conflictedPlan);

      expect(resolvedPlan.handGestures.length).toBeLessThanOrEqual(2);
      expect(resolvedPlan.handGestures[0].intensity).toBeGreaterThanOrEqual(resolvedPlan.handGestures[1]?.intensity || 0);
    });
  });

  describe('behavior statistics', () => {
    it('should track behavior statistics correctly', async () => {
      const analysis: ContentAnalysis = {
        sentiment: 'positive',
        emotionalIntensity: 0.6,
        contentType: 'question',
        keyPhrases: ['test'],
        culturalContext: 'western',
        confidence: 0.8
      };

      const context: SpeechContext = {
        language: 'en',
        culturalBackground: 'western',
        formalityLevel: 'casual',
        conversationStage: 'middle'
      };

      // Generate a few behavior plans
      await engine.planBehavior(analysis, context);
      await engine.planBehavior(analysis, context);

      const stats = engine.getBehaviorStats();

      expect(stats.totalPlansGenerated).toBe(2);
      expect(stats.averageGesturesPerPlan).toBeGreaterThan(0);
      expect(stats.mostCommonPriority).toBe('high');
    });

    it('should clear behavior history', async () => {
      const analysis: ContentAnalysis = {
        sentiment: 'neutral',
        emotionalIntensity: 0.5,
        contentType: 'explanation',
        keyPhrases: ['test'],
        culturalContext: 'western',
        confidence: 0.7
      };

      const context: SpeechContext = {
        language: 'en',
        culturalBackground: 'western',
        formalityLevel: 'casual',
        conversationStage: 'middle'
      };

      await engine.planBehavior(analysis, context);
      expect(engine.getBehaviorHistory().length).toBe(1);

      engine.clearBehaviorHistory();
      expect(engine.getBehaviorHistory().length).toBe(0);
      expect(engine.getCurrentBehaviorPlan()).toBeNull();
    });
  });
});