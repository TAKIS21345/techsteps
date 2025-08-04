/**
 * Facial Expression System - Main exports
 * Provides emotion-based facial expressions with AI behavior integration
 */

// Core engine and types
export { FacialExpressionEngine } from './FacialExpressionEngine';
export { ContextualExpressionSystem } from './ContextualExpressionSystem';
export { AIBehaviorExpressionIntegrator } from './AIBehaviorExpressionIntegrator';

// Types and interfaces
export type {
  FacialExpression,
  ExpressionType,
  EmotionalContext,
  EmotionType,
  EyeMovement,
  EyebrowPosition,
  Vector3,
  ExpressionBlend,
  WeightedExpression,
  BlendMode,
  ExpressionTransition,
  EasingFunction,
  ContentAnalysisResult,
  SentimentType,
  ContentType,
  ExpressionEngineConfig,
  ExpressionState,
  ExpressionHistoryEntry
} from './types';

// Configuration interfaces
export type { ContextualExpressionConfig } from './ContextualExpressionSystem';
export type { ExpressionIntegrationConfig } from './AIBehaviorExpressionIntegrator';

/**
 * Factory function to create a complete facial expression system
 */
export function createFacialExpressionSystem(config?: {
  expressionConfig?: Partial<ExpressionEngineConfig>;
  contextualConfig?: Partial<ContextualExpressionConfig>;
  integrationConfig?: Partial<ExpressionIntegrationConfig>;
}) {
  const expressionEngine = new FacialExpressionEngine(config?.expressionConfig);
  const contextualSystem = new ContextualExpressionSystem(
    expressionEngine,
    config?.contextualConfig
  );
  const integrator = new AIBehaviorExpressionIntegrator(
    expressionEngine,
    contextualSystem,
    config?.integrationConfig
  );

  return {
    expressionEngine,
    contextualSystem,
    integrator,
    dispose: () => {
      integrator.dispose();
      contextualSystem.dispose();
      expressionEngine.dispose();
    }
  };
}

/**
 * Default configuration for the facial expression system
 */
export const DEFAULT_EXPRESSION_CONFIG = {
  expressionConfig: {
    defaultIntensity: 0.7,
    transitionSpeed: 1.0,
    culturalSensitivity: 0.8,
    enableMicroExpressions: true,
    expressionMemory: 5000,
    blendingEnabled: true
  },
  contextualConfig: {
    enableAutoExpressions: true,
    expressionIntensity: 0.7,
    culturalSensitivity: 0.8,
    contextSensitivity: 0.9,
    minExpressionDuration: 1000,
    maxExpressionDuration: 5000
  },
  integrationConfig: {
    enableAutoExpressions: true,
    expressionIntensityScale: 1.0,
    culturalSensitivity: 0.8,
    sentimentThreshold: 0.6,
    expressionCooldown: 2000,
    blendWithSpeech: true
  }
};