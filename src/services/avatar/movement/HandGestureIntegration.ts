/**
 * HandGestureIntegration - Integration layer for hand gesture systems
 * 
 * This class integrates all hand gesture components into a unified system
 * that can be easily used by the avatar movement orchestrator.
 */

import { VRM } from '@pixiv/three-vrm';
import { MovementContext, CulturalProfile, MotionSettings } from './types';
import { HandGestureEngine } from './HandGestureEngine';
import { ContextualHandGestureSelector } from './ContextualHandGestureSelector';
import { 
  CelebratoryGestureSystem, 
  AchievementContext, 
  EncouragementContext, 
  EmphasisContext 
} from './CelebratoryGestureSystem';

export interface HandGestureSystemConfig {
  enableContextualGestures: boolean;
  enableCelebratoryGestures: boolean;
  gestureIntensityScale: number;
  culturalAdaptation: boolean;
}

export class HandGestureIntegration {
  private handGestureEngine: HandGestureEngine;
  private contextualSelector: ContextualHandGestureSelector;
  private celebratorySystem: CelebratoryGestureSystem;
  private config: HandGestureSystemConfig;
  private isInitialized: boolean = false;

  constructor(
    motionSettings: MotionSettings,
    culturalProfile: CulturalProfile,
    config: Partial<HandGestureSystemConfig> = {}
  ) {
    this.config = {
      enableContextualGestures: true,
      enableCelebratoryGestures: true,
      gestureIntensityScale: 1.0,
      culturalAdaptation: true,
      ...config
    };

    // Initialize core components
    this.handGestureEngine = new HandGestureEngine(motionSettings, culturalProfile);
    this.contextualSelector = new ContextualHandGestureSelector(
      this.handGestureEngine,
      motionSettings,
      culturalProfile
    );
    this.celebratorySystem = new CelebratoryGestureSystem(
      this.handGestureEngine,
      motionSettings,
      culturalProfile
    );
  }

  /**
   * Initializes the hand gesture system with VRM model
   */
  public initialize(vrm: VRM): void {
    this.handGestureEngine.initialize(vrm);
    this.isInitialized = true;
    console.log('🤲 Hand gesture integration system initialized');
  }

  /**
   * Processes speech content and triggers appropriate hand gestures
   */
  public processSpeechForGestures(
    speechContent: string,
    context: MovementContext,
    speechDuration: number
  ): void {
    if (!this.isInitialized || !this.config.enableContextualGestures) {
      return;
    }

    const gestureAnalyses = this.contextualSelector.selectContextualGestures(
      speechContent,
      context,
      speechDuration
    );

    this.contextualSelector.executeContextualGestures(gestureAnalyses);
  }

  /**
   * Triggers celebratory gesture for achievements
   */
  public celebrateAchievement(context: AchievementContext): void {
    if (!this.isInitialized || !this.config.enableCelebratoryGestures) {
      return;
    }

    this.celebratorySystem.celebrateAchievement(context);
  }

  /**
   * Provides encouragement through gestures
   */
  public provideEncouragement(context: EncouragementContext): void {
    if (!this.isInitialized || !this.config.enableCelebratoryGestures) {
      return;
    }

    this.celebratorySystem.provideEncouragement(context);
  }

  /**
   * Emphasizes important points with gestures
   */
  public emphasizePoint(context: EmphasisContext): void {
    if (!this.isInitialized || !this.config.enableCelebratoryGestures) {
      return;
    }

    this.celebratorySystem.emphasizePoint(context);
  }

  /**
   * Updates the gesture system animation
   */
  public update(deltaTime: number): void {
    if (!this.isInitialized) {
      return;
    }

    this.handGestureEngine.update(deltaTime);
  }

  /**
   * Stops all active gestures
   */
  public stopAllGestures(): void {
    if (!this.isInitialized) {
      return;
    }

    this.handGestureEngine.stopGesture();
  }

  /**
   * Updates system configuration
   */
  public updateConfig(newConfig: Partial<HandGestureSystemConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Updates motion settings
   */
  public updateMotionSettings(settings: Partial<MotionSettings>): void {
    this.handGestureEngine.updateMotionSettings(settings);
  }

  /**
   * Updates cultural profile
   */
  public updateCulturalProfile(profile: CulturalProfile): void {
    this.handGestureEngine.updateCulturalProfile(profile);
  }

  /**
   * Gets current system status
   */
  public getSystemStatus(): {
    initialized: boolean;
    contextualGesturesEnabled: boolean;
    celebratoryGesturesEnabled: boolean;
    activeGestures: number;
  } {
    return {
      initialized: this.isInitialized,
      contextualGesturesEnabled: this.config.enableContextualGestures,
      celebratoryGesturesEnabled: this.config.enableCelebratoryGestures,
      activeGestures: 0 // Would track active gestures in real implementation
    };
  }
}