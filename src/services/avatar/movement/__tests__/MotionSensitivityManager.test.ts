/**
 * Tests for MotionSensitivityManager
 */

import { MotionSensitivityManager } from '../MotionSensitivityManager';
import { MovementPlan, MovementContext, HeadMovement, Gesture, IdleMovement } from '../types';

describe('MotionSensitivityManager', () => {
  let manager: MotionSensitivityManager;

  beforeEach(() => {
    manager = new MotionSensitivityManager();
  });

  describe('Settings Management', () => {
    it('should initialize with default settings', () => {
      const settings = manager.getCurrentSettings();
      expect(settings.motionSensitivityEnabled).toBe(false);
      expect(settings.intensityLevel).toBe('standard');
      expect(settings.enableHeadMovements).toBe(true);
      expect(settings.enableGestures).toBe(true);
    });

    it('should update settings with real-time application', () => {
      const newSettings = {
        motionSensitivityEnabled: true,
        intensityLevel: 'reduced' as const,
        headMovementIntensity: 0.5
      };

      manager.updateSettings(newSettings);
      const updatedSettings = manager.getCurrentSettings();

      expect(updatedSettings.motionSensitivityEnabled).toBe(true);
      expect(updatedSettings.intensityLevel).toBe('reduced');
      expect(updatedSettings.headMovementIntensity).toBe(0.5);
    });

    it('should validate settings within valid ranges', () => {
      manager.updateSettings({
        headMovementIntensity: 2.5, // Should be clamped to 1.0
        gestureIntensity: -0.5, // Should be clamped to 0.0
        movementFrequencyScale: 5.0 // Should be clamped to 2.0
      });

      const settings = manager.getCurrentSettings();
      expect(settings.headMovementIntensity).toBe(1.0);
      expect(settings.gestureIntensity).toBe(0.0);
      expect(settings.movementFrequencyScale).toBe(2.0);
    });
  });

  describe('Motion Filtering', () => {
    it('should apply motion sensitivity filter to movement plan', () => {
      manager.updateSettings({
        motionSensitivityEnabled: true,
        intensityLevel: 'reduced',
        headMovementIntensity: 0.5,
        gestureIntensity: 0.3
      });

      const originalPlan: MovementPlan = {
        headMovements: [{
          type: 'nod',
          direction: 'up',
          intensity: 1.0,
          duration: 500,
          startTime: 0,
          easing: 'ease_in_out'
        }],
        gestures: [{
          type: 'emphasis',
          intensity: 1.0,
          duration: 800,
          timing: 0,
          morphTargets: [{
            targetName: 'eyebrow_raise',
            weight: 1.0,
            blendMode: 'replace'
          }]
        }],
        transitions: [],
        duration: 1000,
        priority: 1
      };

      const context: MovementContext = {
        isQuestion: false,
        isExplanation: false,
        emphasisLevel: 'medium',
        culturalContext: 'western',
        language: 'en',
        speechContent: 'This is important'
      };

      const filteredPlan = manager.applyMotionSensitivityFilter(originalPlan, context);

      expect(filteredPlan.headMovements[0].intensity).toBe(0.5); // 1.0 * 0.5
      expect(filteredPlan.gestures[0].intensity).toBe(0.3); // 1.0 * 0.3
    });

    it('should return original plan when motion sensitivity is disabled', () => {
      manager.updateSettings({
        motionSensitivityEnabled: false
      });

      const originalPlan: MovementPlan = {
        headMovements: [{
          type: 'nod',
          direction: 'up',
          intensity: 1.0,
          duration: 500,
          startTime: 0,
          easing: 'ease_in_out'
        }],
        gestures: [],
        transitions: [],
        duration: 1000,
        priority: 1
      };

      const context: MovementContext = {
        isQuestion: false,
        isExplanation: false,
        emphasisLevel: 'medium',
        culturalContext: 'western',
        language: 'en',
        speechContent: 'Test content'
      };

      const filteredPlan = manager.applyMotionSensitivityFilter(originalPlan, context);

      expect(filteredPlan).toEqual(originalPlan);
    });
  });

  describe('Idle Movement Filtering', () => {
    it('should filter idle movements based on settings', () => {
      manager.updateSettings({
        enableIdleAnimations: true,
        idleAnimationIntensity: 0.5,
        movementFrequencyScale: 0.8
      });

      const idleMovements: IdleMovement[] = [{
        type: 'breathing',
        amplitude: 1.0,
        frequency: 1.0,
        phase: 0
      }];

      const filteredMovements = manager.applyIdleMovementFilter(idleMovements);

      expect(filteredMovements[0].amplitude).toBe(0.5); // 1.0 * 0.5
      expect(filteredMovements[0].frequency).toBe(0.8); // 1.0 * 0.8
    });

    it('should return minimal idle movements in reduced motion mode', () => {
      manager.updateSettings({
        reducedMotionMode: true
      });

      const idleMovements: IdleMovement[] = [{
        type: 'breathing',
        amplitude: 1.0,
        frequency: 1.0,
        phase: 0
      }, {
        type: 'micro_movement',
        amplitude: 0.5,
        frequency: 2.0,
        phase: 0
      }];

      const filteredMovements = manager.applyIdleMovementFilter(idleMovements);

      expect(filteredMovements).toHaveLength(1);
      expect(filteredMovements[0].type).toBe('breathing');
      expect(filteredMovements[0].amplitude).toBe(0.05);
      expect(filteredMovements[0].frequency).toBe(0.2);
    });
  });

  describe('Preset Profiles', () => {
    it('should load minimal motion profile', () => {
      const success = manager.loadPresetProfile('minimal');
      expect(success).toBe(true);

      const settings = manager.getCurrentSettings();
      expect(settings.intensityLevel).toBe('minimal');
      expect(settings.enableGestures).toBe(false);
      expect(settings.alternativeFeedbackEnabled).toBe(true);
    });

    it('should load standard motion profile', () => {
      const success = manager.loadPresetProfile('standard');
      expect(success).toBe(true);

      const settings = manager.getCurrentSettings();
      expect(settings.intensityLevel).toBe('standard');
      expect(settings.enableGestures).toBe(true);
      expect(settings.enableHeadMovements).toBe(true);
    });

    it('should return false for non-existent profile', () => {
      const success = manager.loadPresetProfile('non-existent');
      expect(success).toBe(false);
    });
  });

  describe('Mode Activation', () => {
    it('should activate minimal motion mode', () => {
      manager.activateMinimalMotionMode();

      const settings = manager.getCurrentSettings();
      expect(settings.intensityLevel).toBe('minimal');
      expect(settings.motionSensitivityEnabled).toBe(true);
      expect(settings.reducedMotionMode).toBe(true);
      expect(settings.vestibularSafeMode).toBe(true);
      expect(settings.enableGestures).toBe(false);
    });

    it('should activate standard motion mode', () => {
      // First activate minimal mode
      manager.activateMinimalMotionMode();
      
      // Then activate standard mode
      manager.activateStandardMotionMode();

      const settings = manager.getCurrentSettings();
      expect(settings.intensityLevel).toBe('standard');
      expect(settings.motionSensitivityEnabled).toBe(false);
      expect(settings.reducedMotionMode).toBe(false);
      expect(settings.enableGestures).toBe(true);
      expect(settings.enableHeadMovements).toBe(true);
    });
  });

  describe('Alternative Feedback', () => {
    it('should determine when to use alternative feedback', () => {
      manager.updateSettings({
        alternativeFeedbackEnabled: true,
        enableGestures: false
      });

      expect(manager.shouldUseAlternativeFeedback('gesture')).toBe(true);
      expect(manager.shouldUseAlternativeFeedback('head')).toBe(false);
    });

    it('should not use alternative feedback when disabled', () => {
      manager.updateSettings({
        alternativeFeedbackEnabled: false,
        enableGestures: false
      });

      expect(manager.shouldUseAlternativeFeedback('gesture')).toBe(false);
    });
  });
});