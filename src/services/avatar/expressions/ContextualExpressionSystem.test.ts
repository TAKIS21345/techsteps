/**
 * Unit tests for ContextualExpressionSystem
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ContextualExpressionSystem } from './ContextualExpressionSystem';
import { FacialExpressionEngine } from './FacialExpressionEngine';

describe('ContextualExpressionSystem', () => {
  let system: ContextualExpressionSystem;
  let mockEngine: FacialExpressionEngine;

  beforeEach(() => {
    // Mock performance.now for consistent testing
    vi.spyOn(performance, 'now').mockReturnValue(1000);
    
    mockEngine = new FacialExpressionEngine();
    system = new ContextualExpressionSystem(mockEngine, {
      enableAutoExpressions: true,
      expressionIntensity: 0.8,
      culturalSensitivity: 0.9,
      contextSensitivity: 0.8,
      minExpressionDuration: 1000,
      maxExpressionDuration: 4000
    });
  });

  afterEach(() => {
    system.dispose();
    mockEngine.dispose();
    vi.restoreAllMocks();
  });

  describe('Content Analysis', () => {
    it('should detect positive content and apply smile', () => {
      const spy = vi.spyOn(mockEngine, 'applyExpression');
      
      system.processContent('This is great! Excellent work!', 'western');
      
      expect(spy).toHaveBeenCalled();
      const appliedExpression = spy.mock.calls[0][0];
      expect(appliedExpression.type).toBe('smile');
    });

    it('should detect concerning content', () => {
      const spy = vi.spyOn(mockEngine, 'applyExpression');
      
      system.processContent('This is a serious problem that needs attention', 'western');
      
      expect(spy).toHaveBeenCalled();
      const appliedExpression = spy.mock.calls[0][0];
      expect(appliedExpression.type).toBe('concern');
    });

    it('should detect celebratory content', () => {
      const spy = vi.spyOn(mockEngine, 'applyExpression');
      
      system.processContent('Congratulations! This is an amazing achievement!', 'western');
      
      expect(spy).toHaveBeenCalled();
      const appliedExpression = spy.mock.calls[0][0];
      expect(appliedExpression.type).toBe('excitement');
    });

    it('should detect questions and apply focus', () => {
      const spy = vi.spyOn(mockEngine, 'applyExpression');
      
      system.processContent('Can you help me understand this concept?', 'western');
      
      expect(spy).toHaveBeenCalled();
      const appliedExpression = spy.mock.calls[0][0];
      expect(appliedExpression.type).toBe('focus');
    });

    it('should detect greetings', () => {
      const spy = vi.spyOn(mockEngine, 'applyExpression');
      
      system.processContent('Hello! Welcome to our learning platform!', 'western');
      
      expect(spy).toHaveBeenCalled();
      const appliedExpression = spy.mock.calls[0][0];
      expect(appliedExpression.type).toBe('smile');
    });
  });

  describe('Manual Expression Application', () => {
    it('should apply positive expression manually', () => {
      const spy = vi.spyOn(mockEngine, 'applyExpression');
      
      system.applyPositiveExpression(0.9);
      
      expect(spy).toHaveBeenCalled();
      const appliedExpression = spy.mock.calls[0][0];
      expect(appliedExpression.type).toBe('smile');
      expect(appliedExpression.intensity).toBeCloseTo(0.9 * 0.8, 2); // intensity * config
    });

    it('should apply concern expression manually', () => {
      const spy = vi.spyOn(mockEngine, 'applyExpression');
      
      system.applyConcernExpression(0.7);
      
      expect(spy).toHaveBeenCalled();
      const appliedExpression = spy.mock.calls[0][0];
      expect(appliedExpression.type).toBe('concern');
    });

    it('should apply excitement expression manually', () => {
      const spy = vi.spyOn(mockEngine, 'applyExpression');
      
      system.applyExcitementExpression(1.0);
      
      expect(spy).toHaveBeenCalled();
      const appliedExpression = spy.mock.calls[0][0];
      expect(appliedExpression.type).toBe('excitement');
    });

    it('should apply focus expression manually', () => {
      const spy = vi.spyOn(mockEngine, 'applyExpression');
      
      system.applyFocusExpression(0.6);
      
      expect(spy).toHaveBeenCalled();
      const appliedExpression = spy.mock.calls[0][0];
      expect(appliedExpression.type).toBe('focus');
    });
  });

  describe('Configuration', () => {
    it('should update configuration', () => {
      system.updateConfig({
        expressionIntensity: 0.5,
        culturalSensitivity: 0.7
      });

      const spy = vi.spyOn(mockEngine, 'applyExpression');
      system.applyPositiveExpression(1.0);
      
      const appliedExpression = spy.mock.calls[0][0];
      expect(appliedExpression.intensity).toBeCloseTo(0.5, 2); // new intensity setting
    });

    it('should disable auto expressions when configured', () => {
      system.updateConfig({ enableAutoExpressions: false });
      
      const spy = vi.spyOn(mockEngine, 'applyExpression');
      system.processContent('This is great!', 'western');
      
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('State Management', () => {
    it('should track current context', () => {
      system.processContent('This is excellent work!', 'western');
      
      const context = system.getCurrentContext();
      expect(context).toBeTruthy();
      expect(context?.sentiment).toBe('positive');
      expect(context?.keyPhrases).toContain('excellent');
    });

    it('should reset to neutral', () => {
      const spy = vi.spyOn(mockEngine, 'resetToNeutral');
      
      system.resetToNeutral();
      
      expect(spy).toHaveBeenCalled();
      expect(system.getCurrentContext()).toBeNull();
    });
  });
});
