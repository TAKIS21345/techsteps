/**
 * Cultural Context Aware Controller for AI Behavior System
 * 
 * This controller integrates cultural adaptation into AI decision making,
 * implements culturally appropriate behavior selection, and provides
 * cultural sensitivity filtering for AI-generated behaviors.
 * 
 * Requirements addressed:
 * - 5.6: Cultural context awareness in AI decision making
 * - 6.3: Cultural adaptation for gestures and expressions
 */

import {
    ContentAnalysis,
    BehaviorPlan,
    SpeechContext,
    BehaviorResponse,
    CulturalAdaptation,
    HandGesture,
    FacialExpression,
    HeadMovement,
    EmotionalTone
} from './types';

import {
    CulturalProfile,
    MovementContext,
    Gesture
} from '../movement/types';

import { CulturalGestureAdaptationEngine } from '../movement/CulturalGestureAdaptationEngine';
import { BehaviorPlanningEngine } from './BehaviorPlanningEngine';
import { AIGestureSelector, AIGestureRequest } from './AIGestureSelector';

export interface CulturalBehaviorRule {
    culturalRegion: string;
    contentTypes: string[];
    behaviorModifications: CulturalBehaviorModification[];
    restrictedBehaviors: string[];
    preferredBehaviors: string[];
    contextualRules: ContextualCulturalRule[];
}

export interface CulturalBehaviorModification {
    behaviorType: 'gesture' | 'expression' | 'movement' | 'tone';
    modificationType: 'intensity' | 'frequency' | 'duration' | 'replacement';
    adjustmentFactor: number;
    reason: string;
}

export interface ContextualCulturalRule {
    context: string;
    culturalNorm: string;
    behaviorAdjustment: string;
    severity: 'low' | 'medium' | 'high';
}

export interface CulturalSensitivityFilter {
    region: string;
    offensiveGestures: string[];
    inappropriateExpressions: string[];
    contextualRestrictions: Record<string, string[]>;
    alternativeBehaviors: Record<string, string[]>;
}

export interface CulturalDecisionContext {
    culturalProfile: CulturalProfile;
    speechContext: SpeechContext;
    contentAnalysis: ContentAnalysis;
    previousBehaviors: BehaviorPlan[];
    culturalSensitivity: 'low' | 'medium' | 'high';
}

export class CulturalContextAwareController {
    private baseBehaviorEngine: BehaviorPlanningEngine;
    private culturalGestureEngine: CulturalGestureAdaptationEngine;
    private aiGestureSelector: AIGestureSelector;
    private culturalRules: Map<string, CulturalBehaviorRule>;
    private sensitivityFilters: Map<string, CulturalSensitivityFilter>;
    private culturalDecisionCache: Map<string, BehaviorResponse>;

    constructor() {
        this.baseBehaviorEngine = new BehaviorPlanningEngine();
        this.culturalGestureEngine = new CulturalGestureAdaptationEngine();
        this.aiGestureSelector = new AIGestureSelector();
        this.culturalRules = new Map();
        this.sensitivityFilters = new Map();
        this.culturalDecisionCache = new Map();

        this.initializeCulturalRules();
        this.initializeSensitivityFilters();
    }

    /**
     * Plans culturally-aware behavior using AI-powered gesture selection
     */
    public async planAIPoweredBehavior(
        textContent: string,
        culturalProfile: CulturalProfile,
        context: SpeechContext,
        previousPlan?: BehaviorPlan
    ): Promise<BehaviorResponse> {
        try {
            // Create AI gesture request
            const aiRequest: AIGestureRequest = {
                textContent,
                culturalContext: culturalProfile,
                conversationContext: {
                    isQuestion: textContent.includes('?') || textContent.toLowerCase().includes('what') || textContent.toLowerCase().includes('how'),
                    isExplanation: textContent.toLowerCase().includes('because') || textContent.toLowerCase().includes('explain') || textContent.toLowerCase().includes('understand'),
                    isInstruction: textContent.toLowerCase().includes('step') || textContent.toLowerCase().includes('first') || textContent.toLowerCase().includes('next'),
                    isCelebration: textContent.toLowerCase().includes('great') || textContent.toLowerCase().includes('excellent') || textContent.toLowerCase().includes('congratulations'),
                    emotionalTone: this.detectEmotionalTone(textContent),
                    formalityLevel: context.formalityLevel
                },
                previousGestures: previousPlan?.handGestures.map(g => g.type) || []
            };

            // Let AI select gestures
            const aiBehaviorPlan = await this.aiGestureSelector.selectGestures(aiRequest);

            // Calculate confidence based on AI response
            const confidence = this.calculateAIBehaviorConfidence(aiBehaviorPlan, textContent);

            // Generate alternatives using traditional method as backup
            const alternatives = await this.generateAIAlternatives(aiRequest);

            return {
                behaviors: aiBehaviorPlan,
                confidence,
                reasoning: `AI-selected gestures for "${textContent.substring(0, 50)}..." with cultural context: ${culturalProfile.region}`,
                alternatives
            };

        } catch (error) {
            console.error('AI-powered behavior planning failed:', error);
            // Fallback to traditional method
            return this.planCulturallyAwareBehavior(
                this.createContentAnalysisFromText(textContent),
                context,
                culturalProfile,
                previousPlan
            );
        }
    }

    /**
     * Plans culturally-aware behavior based on content analysis and cultural context
     */
    public async planCulturallyAwareBehavior(
        analysis: ContentAnalysis,
        context: SpeechContext,
        culturalProfile: CulturalProfile,
        previousPlan?: BehaviorPlan
    ): Promise<BehaviorResponse> {
        // Create cultural decision context
        const decisionContext: CulturalDecisionContext = {
            culturalProfile,
            speechContext: context,
            contentAnalysis: analysis,
            previousBehaviors: previousPlan ? [previousPlan] : [],
            culturalSensitivity: this.determineCulturalSensitivity(culturalProfile, context)
        };

        // Check cache for similar cultural decisions
        const cacheKey = this.generateCacheKey(analysis, context, culturalProfile);
        const cachedResponse = this.culturalDecisionCache.get(cacheKey);
        if (cachedResponse && this.isCacheValid(cachedResponse, decisionContext)) {
            return this.adaptCachedResponse(cachedResponse, decisionContext);
        }

        // Get base behavior plan from existing engine
        const baseBehaviorResponse = await this.baseBehaviorEngine.planBehavior(
            analysis,
            context,
            previousPlan
        );

        // Apply cultural context awareness
        const culturallyAdaptedResponse = await this.applyCulturalContextAwareness(
            baseBehaviorResponse,
            decisionContext
        );

        // Cache the response
        this.culturalDecisionCache.set(cacheKey, culturallyAdaptedResponse);

        return culturallyAdaptedResponse;
    }

    /**
     * Applies cultural context awareness to behavior decisions
     */
    private async applyCulturalContextAwareness(
        baseBehaviorResponse: BehaviorResponse,
        decisionContext: CulturalDecisionContext
    ): Promise<BehaviorResponse> {
        const { culturalProfile, speechContext, contentAnalysis } = decisionContext;

        // Step 1: Apply cultural sensitivity filtering
        const filteredBehaviors = this.applyCulturalSensitivityFilter(
            baseBehaviorResponse.behaviors,
            culturalProfile,
            speechContext
        );

        // Step 2: Integrate cultural adaptation into AI decision making
        const culturallyInformedBehaviors = this.integrateCulturalDecisionMaking(
            filteredBehaviors,
            decisionContext
        );

        // Step 3: Implement culturally appropriate behavior selection
        const appropriateBehaviors = await this.selectCulturallyAppropriateBehaviors(
            culturallyInformedBehaviors,
            decisionContext
        );

        // Step 4: Apply cultural gesture and expression adaptations
        const gestureAdaptedBehaviors = await this.adaptGesturesAndExpressions(
            appropriateBehaviors,
            culturalProfile,
            speechContext
        );

        // Step 5: Calculate cultural confidence and generate alternatives
        const culturalConfidence = this.calculateCulturalConfidence(
            baseBehaviorResponse.behaviors,
            gestureAdaptedBehaviors,
            culturalProfile
        );

        const culturalAlternatives = this.generateCulturalAlternatives(
            gestureAdaptedBehaviors,
            decisionContext
        );

        return {
            behaviors: gestureAdaptedBehaviors,
            confidence: culturalConfidence,
            reasoning: this.generateCulturalReasoning(
                baseBehaviorResponse,
                gestureAdaptedBehaviors,
                culturalProfile
            ),
            alternatives: culturalAlternatives
        };
    }

    /**
     * Applies cultural sensitivity filtering to remove inappropriate behaviors
     */
    private applyCulturalSensitivityFilter(
        behaviors: BehaviorPlan,
        culturalProfile: CulturalProfile,
        speechContext: SpeechContext
    ): BehaviorPlan {
        const sensitivityFilter = this.sensitivityFilters.get(culturalProfile.region);
        if (!sensitivityFilter) {
            return behaviors;
        }

        const filteredBehaviors: BehaviorPlan = {
            ...behaviors,
            handGestures: this.filterHandGestures(behaviors.handGestures, sensitivityFilter, speechContext),
            facialExpressions: this.filterFacialExpressions(behaviors.facialExpressions, sensitivityFilter, speechContext),
            headMovements: this.filterHeadMovements(behaviors.headMovements, sensitivityFilter, speechContext),
            culturalAdaptations: [...behaviors.culturalAdaptations]
        };

        // Add cultural sensitivity adaptations
        filteredBehaviors.culturalAdaptations.push({
            gestureModification: 'cultural_sensitivity_filter',
            intensityAdjustment: this.getCulturalIntensityAdjustment(culturalProfile),
            appropriatenessFilter: true
        });

        return filteredBehaviors;
    }

    /**
     * Integrates cultural adaptation into AI decision making process
     */
    private integrateCulturalDecisionMaking(
        behaviors: BehaviorPlan,
        decisionContext: CulturalDecisionContext
    ): BehaviorPlan {
        const { culturalProfile, contentAnalysis } = decisionContext;
        const culturalRule = this.culturalRules.get(culturalProfile.region);

        if (!culturalRule) {
            return behaviors;
        }

        // Apply cultural behavior modifications
        const modifiedBehaviors = { ...behaviors };

        // Modify gestures based on cultural rules
        modifiedBehaviors.handGestures = this.applyCulturalGestureModifications(
            behaviors.handGestures,
            culturalRule,
            contentAnalysis
        );

        // Modify expressions based on cultural norms
        modifiedBehaviors.facialExpressions = this.applyCulturalExpressionModifications(
            behaviors.facialExpressions,
            culturalRule,
            contentAnalysis
        );

        // Modify head movements based on cultural preferences
        modifiedBehaviors.headMovements = this.applyCulturalMovementModifications(
            behaviors.headMovements,
            culturalRule,
            contentAnalysis
        );

        // Adjust emotional tone for cultural context
        modifiedBehaviors.emotionalTone = this.adjustEmotionalToneForCulture(
            behaviors.emotionalTone,
            culturalProfile,
            contentAnalysis
        );

        return modifiedBehaviors;
    }

    /**
     * Selects culturally appropriate behaviors based on context and norms
     */
    private async selectCulturallyAppropriateBehaviors(
        behaviors: BehaviorPlan,
        decisionContext: CulturalDecisionContext
    ): Promise<BehaviorPlan> {
        const { culturalProfile, speechContext, contentAnalysis } = decisionContext;

        // Create movement context for gesture adaptation
        const movementContext: MovementContext = {
            isQuestion: contentAnalysis.contentType === 'question',
            isExplanation: contentAnalysis.contentType === 'explanation',
            emphasisLevel: this.mapEmotionalIntensityToEmphasis(contentAnalysis.emotionalIntensity),
            culturalContext: culturalProfile.region,
            language: speechContext.language,
            speechContent: contentAnalysis.keyPhrases.join(' ')
        };

        // Convert behavior plan gestures to movement gestures for adaptation
        const movementGestures: Gesture[] = behaviors.handGestures.map(this.convertToMovementGesture);

        // Apply cultural gesture adaptation
        const gestureAdaptationResult = this.culturalGestureEngine.adaptGesturesForCulture(
            movementGestures,
            culturalProfile,
            movementContext
        );

        // Convert back to behavior plan format
        const adaptedHandGestures = gestureAdaptationResult.adaptedGestures.map(
            this.convertToHandGesture
        );

        // Select appropriate expressions based on cultural norms
        const appropriateExpressions = this.selectCulturallyAppropriateExpressions(
            behaviors.facialExpressions,
            culturalProfile,
            contentAnalysis
        );

        // Select appropriate head movements
        const appropriateMovements = this.selectCulturallyAppropriateMovements(
            behaviors.headMovements,
            culturalProfile,
            contentAnalysis
        );

        return {
            ...behaviors,
            handGestures: adaptedHandGestures,
            facialExpressions: appropriateExpressions,
            headMovements: appropriateMovements,
            culturalAdaptations: [
                ...behaviors.culturalAdaptations,
                ...this.createCulturalAdaptationRecords(gestureAdaptationResult)
            ]
        };
    }

    /**
     * Adapts gestures and expressions using the cultural gesture engine
     */
    private async adaptGesturesAndExpressions(
        behaviors: BehaviorPlan,
        culturalProfile: CulturalProfile,
        speechContext: SpeechContext
    ): Promise<BehaviorPlan> {
        // Apply final cultural refinements
        const refinedBehaviors = { ...behaviors };

        // Apply cultural intensity scaling
        const intensityScale = this.getCulturalIntensityScale(culturalProfile, speechContext);

        refinedBehaviors.handGestures = refinedBehaviors.handGestures.map(gesture => ({
            ...gesture,
            intensity: Math.min(1.0, gesture.intensity * intensityScale)
        }));

        refinedBehaviors.facialExpressions = refinedBehaviors.facialExpressions.map(expression => ({
            ...expression,
            intensity: Math.min(1.0, expression.intensity * intensityScale),
            culturalModifier: this.getCulturalExpressionModifier(culturalProfile, expression.type)
        }));

        // Apply cultural timing adjustments
        refinedBehaviors.headMovements = this.applyCulturalTimingAdjustments(
            refinedBehaviors.headMovements,
            culturalProfile
        );

        return refinedBehaviors;
    }

    /**
     * Filters hand gestures based on cultural sensitivity
     */
    private filterHandGestures(
        gestures: HandGesture[],
        filter: CulturalSensitivityFilter,
        context: SpeechContext
    ): HandGesture[] {
        return gestures.filter(gesture => {
            // Check if gesture is offensive
            if (filter.offensiveGestures.includes(gesture.type)) {
                return false;
            }

            // Check contextual restrictions
            const contextRestrictions = filter.contextualRestrictions[context.formalityLevel] || [];
            if (contextRestrictions.includes(gesture.type)) {
                return false;
            }

            return true;
        }).map(gesture => {
            // Apply alternative behaviors if needed
            const alternative = filter.alternativeBehaviors[gesture.type];
            if (alternative && alternative.length > 0) {
                return {
                    ...gesture,
                    type: alternative[0] as any,
                    culturalVariant: `${filter.region}_alternative`
                };
            }
            return gesture;
        });
    }

    /**
     * Filters facial expressions based on cultural appropriateness
     */
    private filterFacialExpressions(
        expressions: FacialExpression[],
        filter: CulturalSensitivityFilter,
        context: SpeechContext
    ): FacialExpression[] {
        return expressions.filter(expression => {
            return !filter.inappropriateExpressions.includes(expression.type);
        }).map(expression => ({
            ...expression,
            culturalModifier: this.getCulturalExpressionModifier(
                { region: filter.region } as CulturalProfile,
                expression.type
            )
        }));
    }

    /**
     * Filters head movements based on cultural norms
     */
    private filterHeadMovements(
        movements: HeadMovement[],
        filter: CulturalSensitivityFilter,
        context: SpeechContext
    ): HeadMovement[] {
        // Apply cultural movement filtering logic
        return movements.filter(movement => {
            // Some cultures may restrict certain head movements
            const contextRestrictions = filter.contextualRestrictions[context.formalityLevel] || [];
            return !contextRestrictions.includes(movement.type);
        });
    }

    /**
     * Applies cultural gesture modifications based on rules
     */
    private applyCulturalGestureModifications(
        gestures: HandGesture[],
        culturalRule: CulturalBehaviorRule,
        analysis: ContentAnalysis
    ): HandGesture[] {
        return gestures.map(gesture => {
            const modification = culturalRule.behaviorModifications.find(
                mod => mod.behaviorType === 'gesture'
            );

            if (!modification) return gesture;

            let modifiedGesture = { ...gesture };

            switch (modification.modificationType) {
                case 'intensity':
                    modifiedGesture.intensity *= modification.adjustmentFactor;
                    break;
                case 'duration':
                    modifiedGesture.duration *= modification.adjustmentFactor;
                    break;
                case 'frequency':
                    // Frequency affects timing
                    modifiedGesture.timing *= (1 / modification.adjustmentFactor);
                    break;
            }

            return modifiedGesture;
        });
    }

    /**
     * Applies cultural expression modifications
     */
    private applyCulturalExpressionModifications(
        expressions: FacialExpression[],
        culturalRule: CulturalBehaviorRule,
        analysis: ContentAnalysis
    ): FacialExpression[] {
        return expressions.map(expression => {
            const modification = culturalRule.behaviorModifications.find(
                mod => mod.behaviorType === 'expression'
            );

            if (!modification) return expression;

            let modifiedExpression = { ...expression };

            switch (modification.modificationType) {
                case 'intensity':
                    modifiedExpression.intensity *= modification.adjustmentFactor;
                    break;
                case 'duration':
                    modifiedExpression.duration *= modification.adjustmentFactor;
                    break;
            }

            return modifiedExpression;
        });
    }

    /**
     * Applies cultural movement modifications
     */
    private applyCulturalMovementModifications(
        movements: HeadMovement[],
        culturalRule: CulturalBehaviorRule,
        analysis: ContentAnalysis
    ): HeadMovement[] {
        return movements.map(movement => {
            const modification = culturalRule.behaviorModifications.find(
                mod => mod.behaviorType === 'movement'
            );

            if (!modification) return movement;

            let modifiedMovement = { ...movement };

            switch (modification.modificationType) {
                case 'intensity':
                    modifiedMovement.intensity *= modification.adjustmentFactor;
                    break;
                case 'duration':
                    modifiedMovement.duration *= modification.adjustmentFactor;
                    break;
            }

            return modifiedMovement;
        });
    }

    /**
     * Adjusts emotional tone for cultural context
     */
    private adjustEmotionalToneForCulture(
        tone: EmotionalTone,
        culturalProfile: CulturalProfile,
        analysis: ContentAnalysis
    ): EmotionalTone {
        const culturalRule = this.culturalRules.get(culturalProfile.region);
        if (!culturalRule) return tone;

        const toneModification = culturalRule.behaviorModifications.find(
            mod => mod.behaviorType === 'tone'
        );

        if (!toneModification) return tone;

        return {
            warmth: Math.min(1.0, tone.warmth * toneModification.adjustmentFactor),
            energy: Math.min(1.0, tone.energy * toneModification.adjustmentFactor),
            formality: Math.min(1.0, tone.formality * toneModification.adjustmentFactor),
            empathy: Math.min(1.0, tone.empathy * toneModification.adjustmentFactor)
        };
    }

    /**
     * Helper methods for cultural adaptation
     */
    private determineCulturalSensitivity(
        culturalProfile: CulturalProfile,
        context: SpeechContext
    ): 'low' | 'medium' | 'high' {
        // Determine sensitivity level based on cultural profile and context
        if (context.formalityLevel === 'formal') return 'high';
        if (culturalProfile.region === 'eastern') return 'high';
        if (culturalProfile.region === 'middle_eastern') return 'high';
        return 'medium';
    }

    private getCulturalIntensityAdjustment(culturalProfile: CulturalProfile): number {
        switch (culturalProfile.region) {
            case 'eastern': return -0.3;
            case 'nordic': return -0.2;
            case 'mediterranean': return 0.2;
            case 'western': return 0.0;
            default: return 0.0;
        }
    }

    private mapEmotionalIntensityToEmphasis(intensity: number): 'low' | 'medium' | 'high' {
        if (intensity > 0.7) return 'high';
        if (intensity > 0.4) return 'medium';
        return 'low';
    }

    private convertToMovementGesture(handGesture: HandGesture): Gesture {
        return {
            type: handGesture.type as any,
            intensity: handGesture.intensity,
            duration: handGesture.duration,
            timing: handGesture.timing,
            culturalVariant: handGesture.culturalVariant,
            morphTargets: [] // Will be populated by gesture engine
        };
    }

    private convertToHandGesture(gesture: Gesture): HandGesture {
        return {
            type: gesture.type as any,
            intensity: gesture.intensity,
            duration: gesture.duration,
            timing: gesture.timing,
            culturalVariant: gesture.culturalVariant,
            synchronizeWithSpeech: true
        };
    }

    private selectCulturallyAppropriateExpressions(
        expressions: FacialExpression[],
        culturalProfile: CulturalProfile,
        analysis: ContentAnalysis
    ): FacialExpression[] {
        // Filter expressions based on cultural appropriateness
        return expressions.filter(expression => {
            // Some cultures may restrict certain expressions in formal contexts
            if (culturalProfile.region === 'eastern' && expression.type === 'excitement') {
                return analysis.contentType !== 'instruction';
            }
            return true;
        });
    }

    private selectCulturallyAppropriateMovements(
        movements: HeadMovement[],
        culturalProfile: CulturalProfile,
        analysis: ContentAnalysis
    ): HeadMovement[] {
        // Apply cultural movement selection logic
        return movements.filter(movement => {
            // Some cultures may prefer different head movement patterns
            if (culturalProfile.region === 'eastern' && movement.type === 'shake') {
                return false; // Head shaking may be less appropriate in some Eastern cultures
            }
            return true;
        });
    }

    private createCulturalAdaptationRecords(adaptationResult: any): CulturalAdaptation[] {
        return adaptationResult.culturalModifications?.map((mod: any) => ({
            gestureModification: mod.modificationType,
            intensityAdjustment: mod.modifiedGesture.intensity - mod.originalGesture.intensity,
            appropriatenessFilter: true
        })) || [];
    }

    private getCulturalIntensityScale(
        culturalProfile: CulturalProfile,
        context: SpeechContext
    ): number {
        let scale = 1.0;

        // Adjust based on cultural region
        switch (culturalProfile.region) {
            case 'eastern':
                scale *= 0.8;
                break;
            case 'mediterranean':
                scale *= 1.2;
                break;
            case 'nordic':
                scale *= 0.9;
                break;
        }

        // Adjust based on formality
        if (context.formalityLevel === 'formal') {
            scale *= 0.8;
        } else if (context.formalityLevel === 'casual') {
            scale *= 1.1;
        }

        return Math.min(1.5, Math.max(0.5, scale));
    }

    private getCulturalExpressionModifier(
        culturalProfile: CulturalProfile,
        expressionType: string
    ): number {
        // Return cultural modifier for expressions
        switch (culturalProfile.region) {
            case 'eastern':
                return expressionType === 'smile' ? 0.8 : 0.7;
            case 'mediterranean':
                return 1.2;
            case 'nordic':
                return 0.9;
            default:
                return 1.0;
        }
    }

    private applyCulturalTimingAdjustments(
        movements: HeadMovement[],
        culturalProfile: CulturalProfile
    ): HeadMovement[] {
        const timingAdjustment = culturalProfile.region === 'eastern' ? 1.2 : 1.0;

        return movements.map(movement => ({
            ...movement,
            duration: movement.duration * timingAdjustment
        }));
    }

    private calculateCulturalConfidence(
        originalBehaviors: BehaviorPlan,
        adaptedBehaviors: BehaviorPlan,
        culturalProfile: CulturalProfile
    ): number {
        // Calculate confidence based on how well behaviors were adapted
        const originalCount = originalBehaviors.handGestures.length +
            originalBehaviors.facialExpressions.length +
            originalBehaviors.headMovements.length;

        const adaptedCount = adaptedBehaviors.handGestures.length +
            adaptedBehaviors.facialExpressions.length +
            adaptedBehaviors.headMovements.length;

        const retentionRate = originalCount > 0 ? adaptedCount / originalCount : 1.0;
        const culturalAdaptationCount = adaptedBehaviors.culturalAdaptations.length;

        // Higher confidence with good retention and cultural adaptations
        return Math.min(1.0, retentionRate * 0.7 + (culturalAdaptationCount * 0.1));
    }

    private generateCulturalAlternatives(
        behaviors: BehaviorPlan,
        decisionContext: CulturalDecisionContext
    ): BehaviorPlan[] {
        // Generate alternative behavior plans with different cultural approaches
        const alternatives: BehaviorPlan[] = [];

        // Conservative cultural alternative
        const conservativeAlternative: BehaviorPlan = {
            ...behaviors,
            handGestures: behaviors.handGestures.map(g => ({ ...g, intensity: g.intensity * 0.7 })),
            facialExpressions: behaviors.facialExpressions.map(e => ({ ...e, intensity: e.intensity * 0.7 })),
            emotionalTone: {
                ...behaviors.emotionalTone,
                formality: Math.min(1.0, behaviors.emotionalTone.formality * 1.2)
            }
        };

        // Expressive cultural alternative (if appropriate for culture)
        if (decisionContext.culturalProfile.region !== 'eastern') {
            const expressiveAlternative: BehaviorPlan = {
                ...behaviors,
                handGestures: behaviors.handGestures.map(g => ({ ...g, intensity: Math.min(1.0, g.intensity * 1.2) })),
                facialExpressions: behaviors.facialExpressions.map(e => ({ ...e, intensity: Math.min(1.0, e.intensity * 1.2) })),
                emotionalTone: {
                    ...behaviors.emotionalTone,
                    warmth: Math.min(1.0, behaviors.emotionalTone.warmth * 1.1)
                }
            };
            alternatives.push(expressiveAlternative);
        }

        alternatives.push(conservativeAlternative);
        return alternatives;
    }

    private generateCulturalReasoning(
        originalResponse: BehaviorResponse,
        adaptedBehaviors: BehaviorPlan,
        culturalProfile: CulturalProfile
    ): string {
        const reasons: string[] = [];

        reasons.push(`Applied cultural adaptations for ${culturalProfile.region} cultural context`);
        reasons.push(`Cultural sensitivity filtering applied with ${adaptedBehaviors.culturalAdaptations.length} adaptations`);

        if (adaptedBehaviors.handGestures.length !== originalResponse.behaviors.handGestures.length) {
            reasons.push(`Gesture selection modified for cultural appropriateness`);
        }

        if (adaptedBehaviors.culturalAdaptations.some(ca => ca.appropriatenessFilter)) {
            reasons.push(`Cultural appropriateness filtering applied`);
        }

        return reasons.join('; ');
    }

    private generateCacheKey(
        analysis: ContentAnalysis,
        context: SpeechContext,
        culturalProfile: CulturalProfile
    ): string {
        return `${analysis.contentType}_${analysis.sentiment}_${context.culturalBackground}_${culturalProfile.region}_${context.formalityLevel}`;
    }

    private isCacheValid(response: BehaviorResponse, context: CulturalDecisionContext): boolean {
        // Simple cache validation - in production, this would be more sophisticated
        return response.confidence > 0.7;
    }

    private adaptCachedResponse(
        cachedResponse: BehaviorResponse,
        context: CulturalDecisionContext
    ): BehaviorResponse {
        // Adapt cached response to current context
        return {
            ...cachedResponse,
            behaviors: {
                ...cachedResponse.behaviors,
                emotionalTone: this.adjustEmotionalToneForCulture(
                    cachedResponse.behaviors.emotionalTone,
                    context.culturalProfile,
                    context.contentAnalysis
                )
            }
        };
    }

    /**
     * Initialize cultural behavior rules for different regions
     */
    private initializeCulturalRules(): void {
        // Western cultural rules
        this.culturalRules.set('western', {
            culturalRegion: 'western',
            contentTypes: ['question', 'explanation', 'celebration', 'instruction'],
            behaviorModifications: [
                {
                    behaviorType: 'gesture',
                    modificationType: 'intensity',
                    adjustmentFactor: 1.0,
                    reason: 'Western cultures generally accept moderate gesture intensity'
                },
                {
                    behaviorType: 'expression',
                    modificationType: 'intensity',
                    adjustmentFactor: 1.0,
                    reason: 'Western expressions can be moderately expressive'
                }
            ],
            restrictedBehaviors: [],
            preferredBehaviors: ['pointing', 'descriptive', 'smile', 'nod'],
            contextualRules: []
        });

        // Eastern cultural rules
        this.culturalRules.set('eastern', {
            culturalRegion: 'eastern',
            contentTypes: ['question', 'explanation', 'instruction'],
            behaviorModifications: [
                {
                    behaviorType: 'gesture',
                    modificationType: 'intensity',
                    adjustmentFactor: 0.7,
                    reason: 'Eastern cultures prefer more subtle gestures'
                },
                {
                    behaviorType: 'expression',
                    modificationType: 'intensity',
                    adjustmentFactor: 0.8,
                    reason: 'Eastern cultures value emotional restraint'
                },
                {
                    behaviorType: 'tone',
                    modificationType: 'intensity',
                    adjustmentFactor: 0.9,
                    reason: 'Eastern cultures prefer more formal tone'
                }
            ],
            restrictedBehaviors: ['pointing', 'celebratory'],
            preferredBehaviors: ['supportive', 'neutral', 'nod'],
            contextualRules: [
                {
                    context: 'formal',
                    culturalNorm: 'high_formality',
                    behaviorAdjustment: 'reduce_expressiveness',
                    severity: 'high'
                }
            ]
        });

        // Mediterranean cultural rules
        this.culturalRules.set('mediterranean', {
            culturalRegion: 'mediterranean',
            contentTypes: ['question', 'explanation', 'celebration', 'instruction'],
            behaviorModifications: [
                {
                    behaviorType: 'gesture',
                    modificationType: 'intensity',
                    adjustmentFactor: 1.2,
                    reason: 'Mediterranean cultures are more expressive with gestures'
                },
                {
                    behaviorType: 'expression',
                    modificationType: 'intensity',
                    adjustmentFactor: 1.1,
                    reason: 'Mediterranean cultures embrace emotional expression'
                }
            ],
            restrictedBehaviors: [],
            preferredBehaviors: ['descriptive', 'celebratory', 'smile', 'excitement', 'emphasis'],
            contextualRules: []
        });

        // Nordic cultural rules
        this.culturalRules.set('nordic', {
            culturalRegion: 'nordic',
            contentTypes: ['question', 'explanation', 'instruction'],
            behaviorModifications: [
                {
                    behaviorType: 'gesture',
                    modificationType: 'intensity',
                    adjustmentFactor: 0.8,
                    reason: 'Nordic cultures prefer reserved gestures'
                },
                {
                    behaviorType: 'expression',
                    modificationType: 'intensity',
                    adjustmentFactor: 0.9,
                    reason: 'Nordic cultures value emotional control'
                }
            ],
            restrictedBehaviors: ['celebratory'],
            preferredBehaviors: ['supportive', 'neutral', 'focus'],
            contextualRules: []
        });
    }

    /**
     * Initialize cultural sensitivity filters
     */
    private initializeSensitivityFilters(): void {
        // Western sensitivity filter
        this.sensitivityFilters.set('western', {
            region: 'western',
            offensiveGestures: [],
            inappropriateExpressions: [],
            contextualRestrictions: {
                formal: ['celebratory'],
                professional: ['celebratory'],
                casual: []
            },
            alternativeBehaviors: {}
        });

        // Eastern sensitivity filter
        this.sensitivityFilters.set('eastern', {
            region: 'eastern',
            offensiveGestures: ['pointing'],
            inappropriateExpressions: ['excitement'],
            contextualRestrictions: {
                formal: ['celebratory', 'pointing', 'excitement'],
                professional: ['celebratory', 'excitement'],
                casual: ['pointing']
            },
            alternativeBehaviors: {
                pointing: ['descriptive'],
                celebratory: ['supportive']
            }
        });

        // Mediterranean sensitivity filter
        this.sensitivityFilters.set('mediterranean', {
            region: 'mediterranean',
            offensiveGestures: [],
            inappropriateExpressions: [],
            contextualRestrictions: {
                formal: [],
                professional: [],
                casual: []
            },
            alternativeBehaviors: {}
        });

        // Nordic sensitivity filter
        this.sensitivityFilters.set('nordic', {
            region: 'nordic',
            offensiveGestures: [],
            inappropriateExpressions: ['excitement'],
            contextualRestrictions: {
                formal: ['celebratory', 'excitement'],
                professional: ['celebratory', 'excitement'],
                casual: ['excitement']
            },
            alternativeBehaviors: {
                celebratory: ['supportive'],
                excitement: ['focus']
            }
        });

        // Middle Eastern sensitivity filter
        this.sensitivityFilters.set('middle_eastern', {
            region: 'middle_eastern',
            offensiveGestures: ['pointing'],
            inappropriateExpressions: [],
            contextualRestrictions: {
                formal: ['pointing', 'celebratory'],
                professional: ['pointing'],
                casual: []
            },
            alternativeBehaviors: {
                pointing: ['descriptive']
            }
        });
    }

    /**
     * Helper methods for AI-powered gesture selection
     */
    private detectEmotionalTone(textContent: string): 'positive' | 'negative' | 'neutral' {
        const positiveWords = ['great', 'excellent', 'wonderful', 'amazing', 'fantastic', 'good', 'yes', 'correct', 'right'];
        const negativeWords = ['bad', 'wrong', 'error', 'mistake', 'problem', 'difficult', 'hard', 'no', 'incorrect'];
        
        const lowerText = textContent.toLowerCase();
        const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
        const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;
        
        if (positiveCount > negativeCount) return 'positive';
        if (negativeCount > positiveCount) return 'negative';
        return 'neutral';
    }

    private calculateAIBehaviorConfidence(behaviorPlan: BehaviorPlan, textContent: string): number {
        let confidence = 0.8; // Base confidence for AI selection
        
        // Increase confidence if we have multiple behavior types
        const behaviorCount = behaviorPlan.handGestures.length + 
                             behaviorPlan.facialExpressions.length + 
                             behaviorPlan.headMovements.length;
        
        if (behaviorCount > 0) confidence += 0.1;
        if (behaviorCount > 2) confidence += 0.05;
        
        // Increase confidence for longer, more complex text
        if (textContent.length > 50) confidence += 0.05;
        
        return Math.min(1.0, confidence);
    }

    private async generateAIAlternatives(aiRequest: AIGestureRequest): Promise<BehaviorPlan[]> {
        const alternatives: BehaviorPlan[] = [];
        
        try {
            // Generate a more conservative alternative
            const conservativeRequest = {
                ...aiRequest,
                conversationContext: {
                    ...aiRequest.conversationContext,
                    formalityLevel: 'formal' as const
                }
            };
            
            const conservativeAlt = await this.aiGestureSelector.selectGestures(conservativeRequest);
            alternatives.push(conservativeAlt);
            
            // Generate a more expressive alternative (if culturally appropriate)
            if (aiRequest.culturalContext.region !== 'eastern' && aiRequest.culturalContext.region !== 'nordic') {
                const expressiveRequest = {
                    ...aiRequest,
                    conversationContext: {
                        ...aiRequest.conversationContext,
                        formalityLevel: 'casual' as const
                    }
                };
                
                const expressiveAlt = await this.aiGestureSelector.selectGestures(expressiveRequest);
                alternatives.push(expressiveAlt);
            }
            
        } catch (error) {
            console.error('Failed to generate AI alternatives:', error);
            // Return empty alternatives if AI fails
        }
        
        return alternatives;
    }

    private createContentAnalysisFromText(textContent: string): ContentAnalysis {
        return {
            sentiment: this.detectEmotionalTone(textContent),
            emotionalIntensity: this.calculateEmotionalIntensity(textContent),
            contentType: this.detectContentType(textContent),
            keyPhrases: this.extractKeyPhrases(textContent),
            culturalContext: 'western', // Default
            confidence: 0.7
        };
    }

    private calculateEmotionalIntensity(textContent: string): number {
        const intensityWords = ['very', 'extremely', 'really', 'absolutely', 'completely', '!', '!!'];
        const lowerText = textContent.toLowerCase();
        const intensityCount = intensityWords.filter(word => lowerText.includes(word)).length;
        
        return Math.min(1.0, 0.3 + (intensityCount * 0.2));
    }

    private detectContentType(textContent: string): 'question' | 'explanation' | 'celebration' | 'instruction' | 'greeting' | 'farewell' {
        const lowerText = textContent.toLowerCase();
        
        if (lowerText.includes('?') || lowerText.includes('what') || lowerText.includes('how') || lowerText.includes('why')) {
            return 'question';
        }
        if (lowerText.includes('great') || lowerText.includes('excellent') || lowerText.includes('congratulations')) {
            return 'celebration';
        }
        if (lowerText.includes('step') || lowerText.includes('first') || lowerText.includes('next') || lowerText.includes('then')) {
            return 'instruction';
        }
        if (lowerText.includes('hello') || lowerText.includes('hi') || lowerText.includes('welcome')) {
            return 'greeting';
        }
        if (lowerText.includes('goodbye') || lowerText.includes('bye') || lowerText.includes('see you')) {
            return 'farewell';
        }
        
        return 'explanation';
    }

    private extractKeyPhrases(textContent: string): string[] {
        // Simple key phrase extraction
        const words = textContent.toLowerCase().split(/\s+/);
        const importantWords = words.filter(word => 
            word.length > 4 && 
            !['this', 'that', 'with', 'have', 'will', 'from', 'they', 'been', 'were', 'said'].includes(word)
        );
        
        return importantWords.slice(0, 5); // Return top 5 key phrases
    }
}