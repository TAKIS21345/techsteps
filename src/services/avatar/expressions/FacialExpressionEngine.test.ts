/**
 * Unit tests for FacialExpressionEngine
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { FacialExpressionEngine } from './FacialExpressionEngine';
import { FacialExpression, EmotionalContext, ExpressionType } from './types';

describe('FacialExpressionEngine', () => {
  let engine: FacialExpressionEngine;

  beforeEach(() => {
    // Mock performance.now for consistent testing
    vi.spyOn(performance, 'now').mockReturnValue(1000);
    
    engine = new FacialExpressionEngine({
      defaultIntensity: 0.8,
      transitionSpeed: 2.0, // Faster transitions for testing
      culturalSensitivity: 0.9,
      enableMicroExpressions: true,
      expressionMemory: 3000,
      blendingEnabled: true
    });
  });

  afterEach(() => {
    engine.dispose();
    vi.restoreAllMocks();
  });

  describe('Expression Application', () => {
    it('should apply a basic expression', () => {
      const smileExpression: FacialExpression = {
        type: 'smile',
        intensity: 0.8,
        duration: 2000,
        morphTargets: { 'mouthSmile': 0.8 },
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
      };

      engine.applyExpression(smileExpression);
      
      const current = engine.getCurrentExpression();
      expect(current).toBeTruthy();
      expect(current?.type).toBe('smile');
      expect(current?.intensity).toBe(0.8);
    });

    it('should handle neutral expression', () => {
      engine.resetToNeutral();
      
      // Allow time for transition
      vi.spyOn(performance, 'now').mockReturnValue(2000);
      
      const current = engine.getCurrentExpression();
      expect(current?.type).toBe('neutral');
    });
  });

  describe('Emotional Context Processing', () => {
    it('should generate expression from emotional context', () => {
      const emotionalContext: EmotionalContext = {
        primary: 'joy',
        intensity: 0.9,
        culturalModifier: 0.8
      };

      const expression = engine.getEmotionalExpression(emotionalContext);
      
      expect(expression.type).toBe('smile');
      expect(expression.intensity).toBeCloseTo(0.9 * 0.8 * 0.8, 2); // base * intensity * cultural
    });

    it('should handle concern emotion', () => {
      const emotionalContext: EmotionalContext = {
        primary: 'concern',
        intensity: 0.7,
        culturalModifier: 1.0
      };

      const expression = engine.getEmotionalExpression(emotionalContext);
      
      expect(expression.type).toBe('concern');
      expect(expression.morphTargets['browDownLeft']).toBeDefined();
      expect(expression.morphTargets['mouthFrown']).toBeDefined();
    });

    it('should handle excitement emotion', () => {
      const emotionalContext: EmotionalContext = {
        primary: 'excitement',
        intensity: 1.0,
        culturalModifier: 0.9
      };

      const expression = engine.getEmotionalExpression(emotionalContext);
      
      expect(expression.type).toBe('excitement');
      expect(expression.morphTargets['eyeWideLeft']).toBeDefined();
      expect(expression.morphTargets['browUpLeft']).toBeDefined();
    });
  });  desc
ribe('Expression Blending', () => {
    it('should blend multiple expressions', () => {
      const smile: FacialExpression = {
        type: 'smile',
        intensity: 0.8,
        duration: 2000,
        morphTargets: { 'mouthSmile': 0.8 },
        eyeMovements: {
          lookDirection: { x: 0, y: 0, z: 1 },
          blinkRate: 12,
          eyeWidening: 0.1,
          squinting: 0.2
        },
        eyebrowPosition: { leftRaise: 0.1, rightRaise: 0.1, furrow: 0 },
        blendMode: 'additive'
      };

      const concern: FacialExpression = {
        type: 'concern',
        intensity: 0.6,
        duration: 3000,
        morphTargets: { 'browDownLeft': 0.6 },
        eyeMovements: {
          lookDirection: { x: 0, y: -0.1, z: 1 },
          blinkRate: 18,
          eyeWidening: 0,
          squinting: 0.3
        },
        eyebrowPosition: { leftRaise: -0.4, rightRaise: -0.4, furrow: 0.6 },
        blendMode: 'additive'
      };

      const blended = engine.blendExpressions([smile, concern]);
      
      expect(blended.morphTargets['mouthSmile']).toBeCloseTo(0.4, 2); // 0.8 * 0.5
      expect(blended.morphTargets['browDownLeft']).toBeCloseTo(0.3, 2); // 0.6 * 0.5
      expect(blended.intensity).toBeCloseTo(0.7, 2); // (0.8 + 0.6) * 0.5
    });

    it('should handle empty expression array', () => {
      const blended = engine.blendExpressions([]);
      expect(blended.type).toBe('neutral');
    });

    it('should return single expression when only one provided', () => {
      const smile: FacialExpression = {
        type: 'smile',
        intensity: 0.8,
        duration: 2000,
        morphTargets: { 'mouthSmile': 0.8 },
        eyeMovements: {
          lookDirection: { x: 0, y: 0, z: 1 },
          blinkRate: 12,
          eyeWidening: 0.1,
          squinting: 0.2
        },
        eyebrowPosition: { leftRaise: 0.1, rightRaise: 0.1, furrow: 0 },
        blendMode: 'additive'
      };

      const result = engine.blendExpressions([smile]);
      expect(result).toEqual(smile);
    });
  });

  describe('Transitions', () => {
    it('should start transition between expressions', () => {
      const smile: FacialExpression = {
        type: 'smile',
        intensity: 0.8,
        duration: 2000,
        morphTargets: { 'mouthSmile': 0.8 },
        eyeMovements: {
          lookDirection: { x: 0, y: 0, z: 1 },
          blinkRate: 12,
          eyeWidening: 0.1,
          squinting: 0.2
        },
        eyebrowPosition: { leftRaise: 0.1, rightRaise: 0.1, furrow: 0 },
        blendMode: 'additive'
      };

      engine.applyExpression(smile);
      
      const concern: FacialExpression = {
        type: 'concern',
        intensity: 0.6,
        duration: 3000,
        morphTargets: { 'browDownLeft': 0.6 },
        eyeMovements: {
          lookDirection: { x: 0, y: -0.1, z: 1 },
          blinkRate: 18,
          eyeWidening: 0,
          squinting: 0.3
        },
        eyebrowPosition: { leftRaise: -0.4, rightRaise: -0.4, furrow: 0.6 },
        blendMode: 'additive'
      };

      engine.transitionToExpression(concern, 1000);
      
      expect(engine.isTransitioning()).toBe(true);
      expect(engine.getTransitionProgress()).toBe(0);
    });

    it('should complete transition over time', (done) => {
      const smile: FacialExpression = {
        type: 'smile',
        intensity: 0.8,
        duration: 2000,
        morphTargets: { 'mouthSmile': 0.8 },
        eyeMovements: {
          lookDirection: { x: 0, y: 0, z: 1 },
          blinkRate: 12,
          eyeWidening: 0.1,
          squinting: 0.2
        },
        eyebrowPosition: { leftRaise: 0.1, rightRaise: 0.1, furrow: 0 },
        blendMode: 'additive'
      };

      engine.applyExpression(smile);
      engine.resetToNeutral();

      // Check transition after some time
      setTimeout(() => {
        expect(engine.isTransitioning()).toBe(true);
        expect(engine.getTransitionProgress()).toBeGreaterThan(0);
        done();
      }, 100);
    });
  });

  describe('State Management', () => {
    it('should track current expression', () => {
      expect(engine.getCurrentExpression()).toBeNull();
      
      engine.resetToNeutral();
      
      const current = engine.getCurrentExpression();
      expect(current?.type).toBe('neutral');
    });

    it('should handle disposal', () => {
      engine.dispose();
      expect(engine.getCurrentExpression()).toBeNull();
    });
  });
});