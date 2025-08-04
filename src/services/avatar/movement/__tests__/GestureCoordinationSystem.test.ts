/**
 * Integration tests for the Gesture Coordination System
 * Tests the complete workflow from content analysis to cultural adaptation
 */

import { ContextAwareGestureSelector } from '../ContextAwareGestureSelector';
import { SynchronizedGestureTimingEngine } from '../SynchronizedGestureTimingEngine';
import { CulturalGestureAdaptationEngine } from '../CulturalGestureAdaptationEngine';
import { MovementContext, SpeechAnalysis, CulturalProfile } from '../types';

describe('Gesture Coordination System Integration', () => {
  let gestureSelector: ContextAwareGestureSelector;
  let timingEngine: SynchronizedGestureTimingEngine;
  let culturalEngine: CulturalGestureAdaptationEngine;

  beforeEach(() => {
    gestureSelector = new ContextAwareGestureSelector();
    timingEngine = new SynchronizedGestureTimingEngine();
    culturalEngine = new CulturalGestureAdaptationEngine();
  });

  describe('Context-Aware Gesture Selection', () => {
    it('should detect emphasis points in speech content', () => {
      const speechContent = "This is VERY important information that you need to remember!";
      const context: MovementContext = {
        isQuestion: false,
        isExplanation: true,
        emphasisLevel: 'high',
        culturalContext: 'western',
        language: 'en',
        speechContent
      };

      const emphasisPoints = gestureSelector.detectEmphasisPoints(speechContent, context);
      
      expect(emphasisPoints.length).toBeGreaterThan(0);
      expect(emphasisPoints.some(point => point.keywords.includes('important'))).toBe(true);
      expect(emphasisPoints.some(point => point.type === 'volume')).toBe(true);
    });

    it('should detect question segments in speech content', () => {
      const speechContent = "What do you think about this? Can you understand the concept?";
      
      const questionSegments = gestureSelector.detectQuestionSegments(speechContent);
      
      expect(questionSegments.length).toBe(2);
      expect(questionSegments[0].questionType).toBe('wh_question');
      expect(questionSegments[1].questionType).toBe('yes_no');
      expect(questionSegments[0].suggestedGestures).toContain('head_tilt');
    });

    it('should select appropriate gestures for content', () => {
      const speechContent = "Let me explain this important concept. What questions do you have?";
      const context: MovementContext = {
        isQuestion: true,
        isExplanation: true,
        emphasisLevel: 'medium',
        culturalContext: 'western',
        language: 'en',
        speechContent
      };

      const gestureSelection = gestureSelector.selectGesturesForContent(speechContent, context);
      
      expect(gestureSelection.primaryGestures.length).toBeGreaterThan(0);
      expect(gestureSelection.totalDuration).toBeGreaterThanOrEqual(0);
      expect(gestureSelection.priority).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Synchronized Gesture Timing', () => {
    it('should synchronize gestures with speech timing', () => {
      const gestures = [
        {
          type: 'head_nod' as const,
          intensity: 0.8,
          duration: 400,
          timing: 0,
          morphTargets: [
            { targetName: 'head_nod_down', weight: 0.8, blendMode: 'replace' as const }
          ]
        }
      ];

      const speechContent = "This is important";
      const speechAnalysis: SpeechAnalysis = {
        sentiment: 'neutral',
        energy: 0.7,
        pace: 120,
        questions: [],
        emphasis: {
          words: [
            {
              word: 'important',
              startTime: 500,
              endTime: 900,
              intensity: 0.8,
              type: 'stress'
            }
          ],
          overallIntensity: 0.8,
          type: 'statement'
        },
        pauses: []
      };

      const context: MovementContext = {
        isQuestion: false,
        isExplanation: true,
        emphasisLevel: 'high',
        culturalContext: 'western',
        language: 'en',
        speechContent
      };

      const result = timingEngine.synchronizeGesturesWithSpeech(
        gestures,
        speechContent,
        speechAnalysis,
        context
      );

      expect(result.synchronizedGestures.length).toBe(1);
      expect(result.speechMarkers.length).toBeGreaterThan(0);
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should calculate optimal gesture duration', () => {
      const gesture = {
        type: 'head_nod' as const,
        intensity: 0.7,
        duration: 400,
        timing: 0,
        morphTargets: []
      };

      const speechDuration = 800;
      const context: MovementContext = {
        isQuestion: false,
        isExplanation: false,
        emphasisLevel: 'medium',
        culturalContext: 'western',
        language: 'en',
        speechContent: 'test'
      };

      const durationCalc = timingEngine.calculateOptimalDuration(gesture, speechDuration, context);

      expect(durationCalc.adjustedDuration).toBeGreaterThan(0);
      expect(durationCalc.adjustedDuration).toBeGreaterThanOrEqual(durationCalc.minimumDuration);
      expect(durationCalc.adjustedDuration).toBeLessThanOrEqual(durationCalc.maximumDuration);
    });
  });

  describe('Cultural Gesture Adaptation', () => {
    it('should create cultural profiles for different regions', () => {
      const westernProfile = culturalEngine.createCulturalProfile('western');
      const easternProfile = culturalEngine.createCulturalProfile('eastern');

      expect(westernProfile).toBeTruthy();
      expect(easternProfile).toBeTruthy();
      expect(westernProfile?.region).toBe('western');
      expect(easternProfile?.region).toBe('eastern');
      expect(westernProfile?.movementAmplitude).toBeGreaterThan(easternProfile?.movementAmplitude || 0);
    });

    it('should adapt gestures for cultural context', () => {
      const gestures = [
        {
          type: 'head_nod' as const,
          intensity: 0.8,
          duration: 400,
          timing: 0,
          morphTargets: [
            { targetName: 'head_nod_down', weight: 0.8, blendMode: 'replace' as const }
          ]
        }
      ];

      const culturalProfile: CulturalProfile = {
        region: 'eastern',
        gesturePreferences: [],
        movementAmplitude: 0.7,
        eyeContactPatterns: {
          frequency: 0.5,
          duration: 1000,
          avoidance: true
        },
        personalSpaceBehavior: {
          preferredDistance: 1.5,
          approachStyle: 'respectful',
          retreatTriggers: []
        },
        restrictedGestures: []
      };

      const context: MovementContext = {
        isQuestion: false,
        isExplanation: true,
        emphasisLevel: 'medium',
        culturalContext: 'eastern',
        language: 'en',
        speechContent: 'test'
      };

      const result = culturalEngine.adaptGesturesForCulture(gestures, culturalProfile, context);

      expect(result.adaptedGestures.length).toBe(1);
      expect(result.adaptedGestures[0].intensity).toBeLessThan(gestures[0].intensity);
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should filter inappropriate gestures', () => {
      const gestures = [
        {
          type: 'pointing' as const,
          intensity: 0.8,
          duration: 400,
          timing: 0,
          morphTargets: []
        }
      ];

      const culturalProfile: CulturalProfile = {
        region: 'eastern',
        gesturePreferences: [],
        movementAmplitude: 0.7,
        eyeContactPatterns: {
          frequency: 0.5,
          duration: 1000,
          avoidance: true
        },
        personalSpaceBehavior: {
          preferredDistance: 1.5,
          approachStyle: 'respectful',
          retreatTriggers: []
        },
        restrictedGestures: ['pointing']
      };

      const context: MovementContext = {
        isQuestion: false,
        isExplanation: true,
        emphasisLevel: 'medium',
        culturalContext: 'eastern',
        language: 'en',
        speechContent: 'test'
      };

      const result = culturalEngine.adaptGesturesForCulture(gestures, culturalProfile, context);

      expect(result.filteredGestures).toContain('pointing');
      expect(result.adaptedGestures.length).toBe(0);
    });

    it('should provide alternative gestures for inappropriate ones', () => {
      const culturalProfile: CulturalProfile = {
        region: 'eastern',
        gesturePreferences: [],
        movementAmplitude: 0.7,
        eyeContactPatterns: {
          frequency: 0.5,
          duration: 1000,
          avoidance: true
        },
        personalSpaceBehavior: {
          preferredDistance: 1.5,
          approachStyle: 'respectful',
          retreatTriggers: []
        },
        restrictedGestures: ['pointing']
      };

      const context: MovementContext = {
        isQuestion: false,
        isExplanation: true,
        emphasisLevel: 'medium',
        culturalContext: 'eastern',
        language: 'en',
        speechContent: 'test'
      };

      const alternatives = culturalEngine.getAlternativeGestures('pointing', culturalProfile, context);

      expect(alternatives.length).toBeGreaterThan(0);
      expect(alternatives).toContain('head_nod');
    });
  });

  describe('End-to-End Integration', () => {
    it('should process speech content through complete gesture coordination pipeline', () => {
      const speechContent = "This is a very important question: What do you think about this concept?";
      const context: MovementContext = {
        isQuestion: true,
        isExplanation: true,
        emphasisLevel: 'high',
        culturalContext: 'western',
        language: 'en',
        speechContent
      };

      const culturalProfile = culturalEngine.createCulturalProfile('western');
      expect(culturalProfile).toBeTruthy();

      // Step 1: Select gestures based on content analysis
      const gestureSelection = gestureSelector.selectGesturesForContent(speechContent, context, culturalProfile!);
      expect(gestureSelection.primaryGestures.length).toBeGreaterThan(0);

      // Step 2: Synchronize timing with speech
      const speechAnalysis: SpeechAnalysis = {
        sentiment: 'neutral',
        energy: 0.8,
        pace: 120,
        questions: [
          {
            startTime: 1000,
            endTime: 2000,
            type: 'wh_question',
            confidence: 0.9
          }
        ],
        emphasis: {
          words: [
            {
              word: 'important',
              startTime: 300,
              endTime: 700,
              intensity: 0.9,
              type: 'stress'
            }
          ],
          overallIntensity: 0.8,
          type: 'question'
        },
        pauses: []
      };

      // Step 2: Synchronize timing with speech
      const timingResult = timingEngine.synchronizeGesturesWithSpeech(
        gestureSelection.primaryGestures,
        speechContent,
        speechAnalysis,
        context
      );
      expect(timingResult.synchronizedGestures.length).toBeGreaterThan(0);

      // Step 3: Apply cultural adaptations
      const adaptationResult = culturalEngine.adaptGesturesForCulture(
        timingResult.synchronizedGestures.map(sg => sg.gesture),
        culturalProfile!,
        context
      );
      expect(adaptationResult.adaptedGestures.length).toBeGreaterThan(0);
      expect(adaptationResult.confidence).toBeGreaterThan(0);

      // Verify the complete pipeline produces reasonable results
      expect(adaptationResult.adaptedGestures.every(g => g.intensity > 0)).toBe(true);
      expect(adaptationResult.adaptedGestures.every(g => g.duration > 0)).toBe(true);
    });
  });
});