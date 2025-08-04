/**
 * Integration test for Cultural Context Awareness
 * 
 * This test verifies that the cultural context awareness functionality
 * works correctly without circular dependencies.
 */

import { CulturalContextAwareController } from './CulturalContextAwareController';
import { 
  ContentAnalysis, 
  SpeechContext
} from './types';
import { CulturalProfile } from '../movement/types';

// Simple test to verify cultural context awareness works
export async function testCulturalContextAwareness(): Promise<boolean> {
  try {
    const controller = new CulturalContextAwareController();
    
    const mockContentAnalysis: ContentAnalysis = {
      sentiment: 'positive',
      emotionalIntensity: 0.7,
      contentType: 'explanation',
      keyPhrases: ['important concept'],
      culturalContext: 'western',
      confidence: 0.8
    };

    const mockSpeechContext: SpeechContext = {
      language: 'en',
      culturalBackground: 'western',
      formalityLevel: 'professional',
      conversationStage: 'middle'
    };

    const mockCulturalProfile: CulturalProfile = {
      region: 'western',
      gesturePreferences: [],
      movementAmplitude: 1.0,
      eyeContactPatterns: {
        frequency: 0.8,
        duration: 2000,
        avoidance: false
      },
      personalSpaceBehavior: {
        preferredDistance: 1.2,
        approachStyle: 'direct',
        retreatTriggers: []
      },
      restrictedGestures: []
    };

    const result = await controller.planCulturallyAwareBehavior(
      mockContentAnalysis,
      mockSpeechContext,
      mockCulturalProfile
    );

    // Verify basic functionality
    const hasValidResult = result && 
                          result.behaviors && 
                          result.confidence > 0 &&
                          result.reasoning.includes('cultural');

    console.log('Cultural Context Awareness Test:', hasValidResult ? 'PASSED' : 'FAILED');
    console.log('Result confidence:', result.confidence);
    console.log('Cultural adaptations:', result.behaviors.culturalAdaptations.length);
    
    return hasValidResult;
  } catch (error) {
    console.error('Cultural Context Awareness Test FAILED:', error);
    return false;
  }
}

// Test different cultural regions
export async function testCulturalRegionDifferences(): Promise<boolean> {
  try {
    const controller = new CulturalContextAwareController();
    
    const mockContentAnalysis: ContentAnalysis = {
      sentiment: 'positive',
      emotionalIntensity: 0.8,
      contentType: 'celebration',
      keyPhrases: ['great job'],
      culturalContext: 'western',
      confidence: 0.9
    };

    const mockSpeechContext: SpeechContext = {
      language: 'en',
      culturalBackground: 'western',
      formalityLevel: 'casual',
      conversationStage: 'middle'
    };

    // Test Western culture
    const westernProfile: CulturalProfile = {
      region: 'western',
      gesturePreferences: [],
      movementAmplitude: 1.0,
      eyeContactPatterns: { frequency: 0.8, duration: 2000, avoidance: false },
      personalSpaceBehavior: { preferredDistance: 1.2, approachStyle: 'direct', retreatTriggers: [] },
      restrictedGestures: []
    };

    // Test Eastern culture
    const easternProfile: CulturalProfile = {
      region: 'eastern',
      gesturePreferences: [],
      movementAmplitude: 0.7,
      eyeContactPatterns: { frequency: 0.5, duration: 1000, avoidance: true },
      personalSpaceBehavior: { preferredDistance: 1.5, approachStyle: 'respectful', retreatTriggers: [] },
      restrictedGestures: ['pointing']
    };

    const westernResult = await controller.planCulturallyAwareBehavior(
      mockContentAnalysis,
      mockSpeechContext,
      westernProfile
    );

    const easternContext = { ...mockSpeechContext, culturalBackground: 'eastern' };
    const easternResult = await controller.planCulturallyAwareBehavior(
      mockContentAnalysis,
      easternContext,
      easternProfile
    );

    // Verify different behaviors for different cultures
    const westernIntensity = westernResult.behaviors.handGestures.reduce((sum, g) => sum + g.intensity, 0);
    const easternIntensity = easternResult.behaviors.handGestures.reduce((sum, g) => sum + g.intensity, 0);

    const hasDifferences = westernIntensity !== easternIntensity;
    
    console.log('Cultural Region Differences Test:', hasDifferences ? 'PASSED' : 'FAILED');
    console.log('Western intensity:', westernIntensity);
    console.log('Eastern intensity:', easternIntensity);
    
    return hasDifferences;
  } catch (error) {
    console.error('Cultural Region Differences Test FAILED:', error);
    return false;
  }
}

// Test cultural sensitivity filtering
export async function testCulturalSensitivityFiltering(): Promise<boolean> {
  try {
    const controller = new CulturalContextAwareController();
    
    const mockContentAnalysis: ContentAnalysis = {
      sentiment: 'neutral',
      emotionalIntensity: 0.6,
      contentType: 'instruction',
      keyPhrases: ['follow these steps'],
      culturalContext: 'eastern',
      confidence: 0.8
    };

    const mockSpeechContext: SpeechContext = {
      language: 'en',
      culturalBackground: 'eastern',
      formalityLevel: 'formal',
      conversationStage: 'middle'
    };

    const easternProfile: CulturalProfile = {
      region: 'eastern',
      gesturePreferences: [],
      movementAmplitude: 0.7,
      eyeContactPatterns: { frequency: 0.5, duration: 1000, avoidance: true },
      personalSpaceBehavior: { preferredDistance: 1.5, approachStyle: 'respectful', retreatTriggers: [] },
      restrictedGestures: ['pointing']
    };

    const result = await controller.planCulturallyAwareBehavior(
      mockContentAnalysis,
      mockSpeechContext,
      easternProfile
    );

    // Verify no pointing gestures for Eastern culture
    const hasPointingGestures = result.behaviors.handGestures.some(g => g.type === 'pointing');
    const hasCulturalAdaptations = result.behaviors.culturalAdaptations.length > 0;
    
    const passedTest = !hasPointingGestures && hasCulturalAdaptations;
    
    console.log('Cultural Sensitivity Filtering Test:', passedTest ? 'PASSED' : 'FAILED');
    console.log('Has pointing gestures:', hasPointingGestures);
    console.log('Cultural adaptations:', result.behaviors.culturalAdaptations.length);
    
    return passedTest;
  } catch (error) {
    console.error('Cultural Sensitivity Filtering Test FAILED:', error);
    return false;
  }
}

// Run all tests
export async function runAllCulturalTests(): Promise<void> {
  console.log('Running Cultural Context Awareness Tests...\n');
  
  const test1 = await testCulturalContextAwareness();
  const test2 = await testCulturalRegionDifferences();
  const test3 = await testCulturalSensitivityFiltering();
  
  const allPassed = test1 && test2 && test3;
  
  console.log('\n=== Cultural Context Awareness Test Results ===');
  console.log('Basic Functionality:', test1 ? 'PASSED' : 'FAILED');
  console.log('Regional Differences:', test2 ? 'PASSED' : 'FAILED');
  console.log('Sensitivity Filtering:', test3 ? 'PASSED' : 'FAILED');
  console.log('Overall Result:', allPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED');
}