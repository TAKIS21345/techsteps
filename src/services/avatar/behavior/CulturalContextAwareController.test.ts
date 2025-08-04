/**
 * Tests for Cultural Context Aware Controller
 * 
 * Verifies cultural adaptation integration, culturally appropriate behavior selection,
 * and cultural sensitivity filtering for AI-generated behaviors.
 */

import { CulturalContextAwareController } from './CulturalContextAwareController';
import { 
  ContentAnalysis, 
  SpeechContext, 
  BehaviorPlan,
  HandGesture,
  FacialExpression,
  HeadMovement,
  EmotionalTone
} from './types';
import { CulturalProfile } from '../movement/types';

describe('CulturalContextAwareController', () => {
  let controller: CulturalContextAwareController;
  let mockContentAnalysis: ContentAnalysis;
  let mockSpeechContext: SpeechContext;
  let mockCulturalProfile: CulturalProfile;

  beforeEach(() => {
    controller = new CulturalContextAwareController();
    
    mockContentAnalysis = {
      sentiment: 'positive',
      emotionalIntensity: 0.7,
      contentType: 'explanation',
      keyPhrases: ['important concept', 'understand'],
      culturalContext: 'western',
      confidence: 0.8
    };

    mockSpeechContext = {
      language: 'en',
      culturalBackground: 'western',
      formalityLevel: 'professional',
      conversationStage: 'middle'
    };

    mockCulturalProfile = {
      region: 'western',
      gesturePreferences: [
        {
          gestureType: 'descriptive',
          frequency: 0.8,
          intensity: 0.7,
          contexts: ['educational', 'professional']
        }
      ],
      movementAmplitude: 1.0,
      eyeContactPatterns: {
        frequency: 0.8,
        duration: 2000,
        avoidance: false
      },
      personalSpaceBehavior: {
        preferredDistance: 1.2,
        approachStyle: 'direct',
        retreatTriggers: ['invasion']
      },
      restrictedGestures: []
    };
  });

  describe('Cultural Adaptation Integration', () => {
    it('should integrate cultural adaptation into AI decision making', async () => {
      const result = await controller.planCulturallyAwareBehavior(
        mockContentAnalysis,
        mockSpeechContext,
        mockCulturalProfile
      );

      expect(result.behaviors.culturalAdaptations).toBeDefined();
      expect(result.behaviors.culturalAdaptations.length).toBeGreaterThan(0);
      expect(result.reasoning).toContain('cultural adaptations');
    });

    it('should apply different adaptations for different cultural regions', async () => {
      // Test Western culture
      const westernResult = await controller.planCulturallyAwareBehavior(
        mockContentAnalysis,
        mockSpeechContext,
        mockCulturalProfile
      );

      // Test Eastern culture
      const easternProfile: CulturalProfile = {
        ...mockCulturalProfile,
        region: 'eastern'
      };
      const easternContext: SpeechContext = {
        ...mockSpeechContext,
        culturalBackground: 'eastern'
      };

      const easternResult = await controller.planCulturallyAwareBehavior(
        mockContentAnalysis,
        easternContext,
        easternProfile
      );

      // Eastern culture should have more subdued behaviors
      const westernIntensity = westernResult.behaviors.handGestures.reduce(
        (sum, g) => sum + g.intensity, 0
      );
      const easternIntensity = easternResult.behaviors.handGestures.reduce(
        (sum, g) => sum + g.intensity, 0
      );

      expect(easternIntensity).toBeLessThan(westernIntensity);
    });

    it('should adjust emotional tone based on cultural context', async () => {
      const mediterraneanProfile: CulturalProfile = {
        ...mockCulturalProfile,
        region: 'mediterranean'
      };

      const result = await controller.planCulturallyAwareBehavior(
        mockContentAnalysis,
        mockSpeechContext,
        mediterraneanProfile
      );

      // Mediterranean cultures should have higher warmth and energy
      expect(result.behaviors.emotionalTone.warmth).toBeGreaterThan(0.5);
      expect(result.behaviors.emotionalTone.energy).toBeGreaterThan(0.5);
    });
  });

  describe('Culturally Appropriate Behavior Selection', () => {
    it('should select appropriate behaviors for formal contexts', async () => {
      const formalContext: SpeechContext = {
        ...mockSpeechContext,
        formalityLevel: 'formal'
      };

      const result = await controller.planCulturallyAwareBehavior(
        mockContentAnalysis,
        formalContext,
        mockCulturalProfile
      );

      // Formal contexts should have higher formality in emotional tone
      expect(result.behaviors.emotionalTone.formality).toBeGreaterThan(0.6);
      
      // Should not include celebratory gestures in formal contexts
      const hasCelebratoryGestures = result.behaviors.handGestures.some(
        g => g.type === 'celebratory'
      );
      expect(hasCelebratoryGestures).toBeFalsy();
    });

    it('should filter inappropriate gestures for Eastern cultures', async () => {
      const easternProfile: CulturalProfile = {
        ...mockCulturalProfile,
        region: 'eastern',
        restrictedGestures: ['pointing']
      };

      const result = await controller.planCulturallyAwareBehavior(
        mockContentAnalysis,
        mockSpeechContext,
        easternProfile
      );

      // Should not include pointing gestures for Eastern cultures
      const hasPointingGestures = result.behaviors.handGestures.some(
        g => g.type === 'pointing'
      );
      expect(hasPointingGestures).toBeFalsy();
    });

    it('should provide alternative behaviors for restricted gestures', async () => {
      const easternProfile: CulturalProfile = {
        ...mockCulturalProfile,
        region: 'eastern',
        restrictedGestures: ['pointing']
      };

      const result = await controller.planCulturallyAwareBehavior(
        mockContentAnalysis,
        mockSpeechContext,
        easternProfile
      );

      // Should have alternative gestures like 'descriptive' instead of 'pointing'
      const hasDescriptiveGestures = result.behaviors.handGestures.some(
        g => g.type === 'descriptive'
      );
      expect(hasDescriptiveGestures).toBeTruthy();
    });
  });

  describe('Cultural Sensitivity Filtering', () => {
    it('should apply cultural sensitivity filtering', async () => {
      const result = await controller.planCulturallyAwareBehavior(
        mockContentAnalysis,
        mockSpeechContext,
        mockCulturalProfile
      );

      // Should have cultural sensitivity adaptations
      const hasSensitivityFilter = result.behaviors.culturalAdaptations.some(
        ca => ca.appropriatenessFilter === true
      );
      expect(hasSensitivityFilter).toBeTruthy();
    });

    it('should filter offensive gestures for specific cultures', async () => {
      const middleEasternProfile: CulturalProfile = {
        ...mockCulturalProfile,
        region: 'middle_eastern'
      };

      const result = await controller.planCulturallyAwareBehavior(
        mockContentAnalysis,
        mockSpeechContext,
        middleEasternProfile
      );

      // Should not include potentially offensive gestures
      const hasOffensiveGestures = result.behaviors.handGestures.some(
        g => ['pointing'].includes(g.type)
      );
      expect(hasOffensiveGestures).toBeFalsy();
    });

    it('should adjust behavior intensity based on cultural norms', async () => {
      const nordicProfile: CulturalProfile = {
        ...mockCulturalProfile,
        region: 'nordic'
      };

      const result = await controller.planCulturallyAwareBehavior(
        mockContentAnalysis,
        mockSpeechContext,
        nordicProfile
      );

      // Nordic cultures should have more reserved behaviors
      const avgGestureIntensity = result.behaviors.handGestures.reduce(
        (sum, g) => sum + g.intensity, 0
      ) / Math.max(1, result.behaviors.handGestures.length);

      expect(avgGestureIntensity).toBeLessThan(0.9);
    });
  });

  describe('Cultural Context Integration', () => {
    it('should generate culturally-informed reasoning', async () => {
      const result = await controller.planCulturallyAwareBehavior(
        mockContentAnalysis,
        mockSpeechContext,
        mockCulturalProfile
      );

      expect(result.reasoning).toContain('cultural');
      expect(result.reasoning).toContain(mockCulturalProfile.region);
    });

    it('should provide cultural alternatives', async () => {
      const result = await controller.planCulturallyAwareBehavior(
        mockContentAnalysis,
        mockSpeechContext,
        mockCulturalProfile
      );

      expect(result.alternatives).toBeDefined();
      expect(result.alternatives.length).toBeGreaterThan(0);
      
      // Alternatives should have different intensity levels
      const originalIntensity = result.behaviors.handGestures.reduce(
        (sum, g) => sum + g.intensity, 0
      );
      const alternativeIntensity = result.alternatives[0].handGestures.reduce(
        (sum, g) => sum + g.intensity, 0
      );

      expect(alternativeIntensity).not.toEqual(originalIntensity);
    });

    it('should maintain high confidence for well-adapted behaviors', async () => {
      const result = await controller.planCulturallyAwareBehavior(
        mockContentAnalysis,
        mockSpeechContext,
        mockCulturalProfile
      );

      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should handle question content type with cultural awareness', async () => {
      const questionAnalysis: ContentAnalysis = {
        ...mockContentAnalysis,
        contentType: 'question',
        sentiment: 'neutral'
      };

      const result = await controller.planCulturallyAwareBehavior(
        questionAnalysis,
        mockSpeechContext,
        mockCulturalProfile
      );

      // Should include appropriate questioning behaviors
      const hasQuestioningBehaviors = result.behaviors.handGestures.some(
        g => g.type === 'questioning'
      ) || result.behaviors.headMovements.some(
        m => m.type === 'tilt'
      );

      expect(hasQuestioningBehaviors).toBeTruthy();
    });

    it('should handle celebration content type with cultural sensitivity', async () => {
      const celebrationAnalysis: ContentAnalysis = {
        ...mockContentAnalysis,
        contentType: 'celebration',
        sentiment: 'positive',
        emotionalIntensity: 0.9
      };

      const easternProfile: CulturalProfile = {
        ...mockCulturalProfile,
        region: 'eastern'
      };

      const result = await controller.planCulturallyAwareBehavior(
        celebrationAnalysis,
        mockSpeechContext,
        easternProfile
      );

      // Eastern cultures should have more subdued celebrations
      const avgIntensity = result.behaviors.handGestures.reduce(
        (sum, g) => sum + g.intensity, 0
      ) / Math.max(1, result.behaviors.handGestures.length);

      expect(avgIntensity).toBeLessThan(0.8);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle unknown cultural regions gracefully', async () => {
      const unknownProfile: CulturalProfile = {
        ...mockCulturalProfile,
        region: 'unknown_region'
      };

      const result = await controller.planCulturallyAwareBehavior(
        mockContentAnalysis,
        mockSpeechContext,
        unknownProfile
      );

      expect(result).toBeDefined();
      expect(result.behaviors).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should handle empty gesture preferences', async () => {
      const emptyProfile: CulturalProfile = {
        ...mockCulturalProfile,
        gesturePreferences: []
      };

      const result = await controller.planCulturallyAwareBehavior(
        mockContentAnalysis,
        mockSpeechContext,
        emptyProfile
      );

      expect(result).toBeDefined();
      expect(result.behaviors).toBeDefined();
    });

    it('should handle high emotional intensity with cultural moderation', async () => {
      const highIntensityAnalysis: ContentAnalysis = {
        ...mockContentAnalysis,
        emotionalIntensity: 1.0
      };

      const easternProfile: CulturalProfile = {
        ...mockCulturalProfile,
        region: 'eastern'
      };

      const result = await controller.planCulturallyAwareBehavior(
        highIntensityAnalysis,
        mockSpeechContext,
        easternProfile
      );

      // Even with high emotional intensity, Eastern cultures should moderate
      const maxGestureIntensity = Math.max(
        ...result.behaviors.handGestures.map(g => g.intensity)
      );

      expect(maxGestureIntensity).toBeLessThan(1.0);
    });
  });
});