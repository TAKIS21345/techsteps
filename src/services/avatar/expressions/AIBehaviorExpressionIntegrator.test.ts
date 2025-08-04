/**
 * Unit tests for AIBehaviorExpressionIntegrator
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AIBehaviorExpressionIntegrator } from './AIBehaviorExpressionIntegrator';
import { FacialExpressionEngine } from './FacialExpressionEngine';
import { ContextualExpressionSystem } from './ContextualExpressionSystem';

describe('AIBehaviorExpressionIntegrator', () => {
  let integrator: AIBehaviorExpressionIntegrator;
  let mockExpressionEngine: FacialExpressionEngine;
  let mockContextualSystem: ContextualExpressionSystem;

  const mockAIAnalysis = {
    sentiment: 'positive' as const,
    emotionalIntensity: 0.8,
    contentType: 'celebration' as const,
    keyPhrases: ['great', 'excellent'],
    confidence: 0.9
  };

  const mockBehaviorContext = {
    culturalRegion: 'western',
    language: 'en-US',
    formalityLevel: 'informal' as const,
    conversationState: 'teaching' as const,
    previousExpressions: []
  };

  beforeEach(() => {
    vi.spyOn(performance, 'now').mockReturnValue(1000);
    
    mockExpressionEngine = new FacialExpressionEngine();
    mockContextualSystem = new ContextualExpressionSystem(mockExpressionEngine);
    
    integrator = new AIBehaviorExpressionIntegrator(
      mockExpressionEngine,
      mockContextualSystem,
      {
        enableAutoExpressions: true,
        expressionIntensityScale: 1.0,
        culturalSensitivity: 0.8,
        sentimentThreshold: 0.6,
        expressionCooldown: 1000,
        blendWithSpeech: true
      }
    );
  });

  afterEach(() => {
    integrator.dispose();
    mockExpressionEngine.dispose();
    mockContextualSystem.dispose();
    vi.restoreAllMocks();
  });

  describe('AI Content Analysis Processing', () => {
    it('should process AI analysis and apply appropriate expression', () => {
      const spy = vi.spyOn(mockExpressionEngine, 'applyExpression');
      
      integrator.processAIContentAnalysis(
        mockAIAnalysis,
        mockBehaviorContext,
        'This is excellent work!'
      );
      
      expect(spy).toHaveBeenCalled();
      const appliedExpression = spy.mock.calls[0][0];
      expect(appliedExpression.type).toBe('excitement');
    });

    it('should respect confidence threshold', () => {
      const spy = vi.spyOn(mockExpressionEngine, 'applyExpression');
      
      const lowConfidenceAnalysis = {
        ...mockAIAnalysis,
        confidence: 0.3 // Below threshold
      };
      
      integrator.processAIContentAnalysis(
        lowConfidenceAnalysis,
        mockBehaviorContext,
        'This is okay'
      );
      
      expect(spy).not.toHaveBeenCalled();
    });

    it('should respect cooldown period', () => {
      const spy = vi.spyOn(mockExpressionEngine, 'applyExpression');
      
      // First call should work
      integrator.processAIContentAnalysis(
        mockAIAnalysis,
        mockBehaviorContext,
        'First message'
      );
      expect(spy).toHaveBeenCalledTimes(1);
      
      // Second call within cooldown should be ignored
      vi.spyOn(performance, 'now').mockReturnValue(1500); // 500ms later
      integrator.processAIContentAnalysis(
        mockAIAnalysis,
        mockBehaviorContext,
        'Second message'
      );
      expect(spy).toHaveBeenCalledTimes(1); // Still only 1 call
    });

    it('should allow expression after cooldown period', () => {
      const spy = vi.spyOn(mockExpressionEngine, 'applyExpression');
      
      // First call
      integrator.processAIContentAnalysis(
        mockAIAnalysis,
        mockBehaviorContext,
        'First message'
      );
      expect(spy).toHaveBeenCalledTimes(1);
      
      // Second call after cooldown
      vi.spyOn(performance, 'now').mockReturnValue(2500); // 1500ms later (after cooldown)
      integrator.processAIContentAnalysis(
        mockAIAnalysis,
        mockBehaviorContext,
        'Second message'
      );
      expect(spy).toHaveBeenCalledTimes(2);
    });
  });

  describe('Sentiment-Based Expressions', () => {
    it('should apply positive sentiment expression', () => {
      const spy = vi.spyOn(mockExpressionEngine, 'applyExpression');
      
      integrator.applyAISentimentExpression(
        'positive',
        0.8,
        'western',
        'Great job!'
      );
      
      expect(spy).toHaveBeenCalled();
      const appliedExpression = spy.mock.calls[0][0];
      expect(appliedExpression.type).toBe('smile');
    });

    it('should apply negative sentiment expression', () => {
      const spy = vi.spyOn(mockExpressionEngine, 'applyExpression');
      
      integrator.applyAISentimentExpression(
        'negative',
        0.7,
        'western',
        'This is concerning'
      );
      
      expect(spy).toHaveBeenCalled();
      const appliedExpression = spy.mock.calls[0][0];
      expect(appliedExpression.type).toBe('concern');
    });

    it('should apply neutral sentiment expression', () => {
      const spy = vi.spyOn(mockExpressionEngine, 'applyExpression');
      
      integrator.applyAISentimentExpression(
        'neutral',
        0.5,
        'western',
        'This is information'
      );
      
      expect(spy).toHaveBeenCalled();
      const appliedExpression = spy.mock.calls[0][0];
      expect(appliedExpression.type).toBe('neutral');
    });
  });

  describe('Contextual Expressions', () => {
    it('should apply contextual expression with intensity scaling', () => {
      const spy = vi.spyOn(mockExpressionEngine, 'applyExpression');
      
      integrator.applyContextualExpression(
        'joy',
        0.8,
        mockBehaviorContext,
        'This is wonderful!'
      );
      
      expect(spy).toHaveBeenCalled();
      const appliedExpression = spy.mock.calls[0][0];
      expect(appliedExpression.type).toBe('smile');
      expect(appliedExpression.intensity).toBeGreaterThan(0);
    });

    it('should adjust intensity for formal contexts', () => {
      const spy = vi.spyOn(mockExpressionEngine, 'applyExpression');
      
      const formalContext = {
        ...mockBehaviorContext,
        formalityLevel: 'formal' as const
      };
      
      integrator.applyContextualExpression(
        'joy',
        0.8,
        formalContext,
        'This is good'
      );
      
      expect(spy).toHaveBeenCalled();
      const appliedExpression = spy.mock.calls[0][0];
      expect(appliedExpression.intensity).toBeLessThan(0.8); // Reduced for formal context
    });
  });

  describe('Cultural Adjustments', () => {
    it('should apply cultural modifiers for eastern cultures', () => {
      const spy = vi.spyOn(mockExpressionEngine, 'applyExpression');
      
      const easternContext = {
        ...mockBehaviorContext,
        culturalRegion: 'eastern'
      };
      
      integrator.processAIContentAnalysis(
        mockAIAnalysis,
        easternContext,
        'This is excellent!'
      );
      
      expect(spy).toHaveBeenCalled();
      const appliedExpression = spy.mock.calls[0][0];
      // Eastern cultures typically have more subdued expressions
      expect(appliedExpression.intensity).toBeLessThan(0.8);
    });

    it('should apply cultural modifiers for mediterranean cultures', () => {
      const spy = vi.spyOn(mockExpressionEngine, 'applyExpression');
      
      const mediterraneanContext = {
        ...mockBehaviorContext,
        culturalRegion: 'mediterranean'
      };
      
      integrator.processAIContentAnalysis(
        mockAIAnalysis,
        mediterraneanContext,
        'This is fantastic!'
      );
      
      expect(spy).toHaveBeenCalled();
      const appliedExpression = spy.mock.calls[0][0];
      // Mediterranean cultures typically have more expressive expressions
      expect(appliedExpression.intensity).toBeGreaterThan(0.5);
    });
  });

  describe('Behavior Coordination', () => {
    it('should coordinate with other AI behaviors', () => {
      const spy = vi.spyOn(mockExpressionEngine, 'applyExpression');
      
      // First apply an expression
      integrator.processAIContentAnalysis(
        mockAIAnalysis,
        mockBehaviorContext,
        'Great work!'
      );
      
      // Then coordinate with high-intensity behaviors
      integrator.coordinateWithAIBehaviors(0.9, 0.8, 0.7); // High intensity behaviors
      
      // Should have been called twice - once for initial, once for adjustment
      expect(spy).toHaveBeenCalledTimes(2);
    });

    it('should provide current expression state', () => {
      integrator.processAIContentAnalysis(
        mockAIAnalysis,
        mockBehaviorContext,
        'Excellent!'
      );
      
      const state = integrator.getCurrentExpressionState();
      
      expect(state.currentExpression).toBeTruthy();
      expect(typeof state.isTransitioning).toBe('boolean');
      expect(typeof state.intensity).toBe('number');
      expect(typeof state.remainingDuration).toBe('number');
    });
  });

  describe('Configuration and State Management', () => {
    it('should update integration configuration', () => {
      integrator.updateIntegrationConfig({
        expressionIntensityScale: 0.5,
        culturalSensitivity: 0.9
      });
      
      const spy = vi.spyOn(mockExpressionEngine, 'applyExpression');
      
      integrator.applyAISentimentExpression(
        'positive',
        1.0,
        'western',
        'Great!'
      );
      
      const appliedExpression = spy.mock.calls[0][0];
      expect(appliedExpression.intensity).toBeCloseTo(0.5, 1); // Scaled down
    });

    it('should reset state properly', () => {
      const resetSpy = vi.spyOn(mockExpressionEngine, 'resetToNeutral');
      const contextResetSpy = vi.spyOn(mockContextualSystem, 'resetToNeutral');
      
      integrator.reset();
      
      expect(resetSpy).toHaveBeenCalled();
      expect(contextResetSpy).toHaveBeenCalled();
      
      const state = integrator.getCurrentExpressionState();
      expect(state.currentExpression).toBeNull();
    });

    it('should disable auto expressions when configured', () => {
      integrator.updateIntegrationConfig({
        enableAutoExpressions: false
      });
      
      const spy = vi.spyOn(mockExpressionEngine, 'applyExpression');
      
      integrator.processAIContentAnalysis(
        mockAIAnalysis,
        mockBehaviorContext,
        'Great work!'
      );
      
      expect(spy).not.toHaveBeenCalled();
    });
  });
});
