/**
 * CulturalGestureAdaptationEngine - Cultural gesture variation and sensitivity system
 * 
 * This class implements cultural gesture variation database, culture-specific gesture
 * selection logic, and cultural sensitivity filtering to avoid inappropriate gestures.
 * 
 * Requirements addressed:
 * - 3.1: Appropriate hand gestures or head movements to emphasize key points
 * - 3.3: Explanatory gestures that support the content being delivered
 * - 4.3: Cultural adaptation for gestures with sensitivity filtering
 */

import {
    Gesture,
    CulturalProfile,
    GesturePreference,
    MovementContext,
    MorphTargetMapping,
    EyeContactPattern,
    PersonalSpaceBehavior
} from './types';

export interface CulturalGestureDatabase {
    regions: Map<string, CulturalGestureSet>;
    restrictedGestures: Map<string, string[]>;
    culturalModifiers: Map<string, CulturalModifier>;
    appropriatenessRules: Map<string, AppropriatenessRule[]>;
}

export interface CulturalGestureSet {
    region: string;
    displayName: string;
    description: string;
    gestures: Map<string, CulturalGestureVariant[]>;
    intensityModifier: number;
    frequencyModifier: number;
    eyeContactPreferences: EyeContactPattern;
    personalSpacePreferences: PersonalSpaceBehavior;
    communicationStyle: CommunicationStyle;
}

export interface CulturalGestureVariant {
    baseGestureType: string;
    culturalVariantName: string;
    morphTargets: MorphTargetMapping[];
    intensity: number;
    duration: number;
    appropriatenessScore: number;
    contextRestrictions: string[];
    description: string;
}

export interface CulturalModifier {
    region: string;
    gestureAmplitudeScale: number;
    gestureFrequencyScale: number;
    eyeContactIntensity: number;
    personalSpaceDistance: number;
    expressivenessFactor: number;
    formalityAdjustment: number;
}

export interface AppropriatenessRule {
    gestureType: string;
    contexts: string[];
    appropriatenessLevel: 'appropriate' | 'neutral' | 'inappropriate' | 'offensive';
    reason: string;
    alternatives: string[];
}

export interface CommunicationStyle {
    directness: 'high' | 'medium' | 'low';
    expressiveness: 'high' | 'medium' | 'low';
    formality: 'high' | 'medium' | 'low';
    eyeContactNorms: 'direct' | 'moderate' | 'minimal';
    gestureFrequency: 'high' | 'medium' | 'low';
}

export interface CulturalAdaptationResult {
    adaptedGestures: Gesture[];
    filteredGestures: string[];
    culturalModifications: CulturalModification[];
    appropriatenessWarnings: AppropriatenessWarning[];
    confidence: number;
}

export interface CulturalModification {
    originalGesture: Gesture;
    modifiedGesture: Gesture;
    modificationType: 'intensity' | 'duration' | 'variant' | 'replacement';
    reason: string;
    culturalContext: string;
}

export interface AppropriatenessWarning {
    gestureType: string;
    warningLevel: 'info' | 'warning' | 'error';
    message: string;
    suggestedAlternatives: string[];
}

export class CulturalGestureAdaptationEngine {
    private culturalDatabase: CulturalGestureDatabase;
    private sensitivityFilter: CulturalSensitivityFilter;
    private gestureVariantSelector: GestureVariantSelector;
    private appropriatenessChecker: AppropriatenessChecker;

    constructor() {
        this.culturalDatabase = this.initializeCulturalDatabase();
        this.sensitivityFilter = new CulturalSensitivityFilter(this.culturalDatabase);
        this.gestureVariantSelector = new GestureVariantSelector(this.culturalDatabase);
        this.appropriatenessChecker = new AppropriatenessChecker(this.culturalDatabase);
    }

    /**
     * Adapts gestures for specific cultural context
     */
    public adaptGesturesForCulture(
        gestures: Gesture[],
        culturalProfile: CulturalProfile,
        context: MovementContext
    ): CulturalAdaptationResult {
        // Filter out culturally inappropriate gestures
        const filteredResult = this.sensitivityFilter.filterInappropriateGestures(
            gestures,
            culturalProfile,
            context
        );

        // Select cultural variants for remaining gestures
        const variantResult = this.gestureVariantSelector.selectCulturalVariants(
            filteredResult.appropriateGestures,
            culturalProfile,
            context
        );

        // Apply cultural modifications
        const modifiedGestures = this.applyCulturalModifications(
            variantResult.selectedGestures,
            culturalProfile,
            context
        );

        // Check appropriateness and generate warnings
        const appropriatenessResult = this.appropriatenessChecker.checkAppropriateness(
            modifiedGestures,
            culturalProfile,
            context
        );

        return {
            adaptedGestures: modifiedGestures,
            filteredGestures: filteredResult.filteredGestures,
            culturalModifications: variantResult.modifications,
            appropriatenessWarnings: appropriatenessResult.warnings,
            confidence: this.calculateAdaptationConfidence(
                gestures.length,
                modifiedGestures.length,
                appropriatenessResult.warnings
            )
        };
    }

    /**
     * Gets cultural gesture variants for a specific gesture type
     */
    public getCulturalVariants(
        gestureType: string,
        culturalRegion: string
    ): CulturalGestureVariant[] {
        const culturalSet = this.culturalDatabase.regions.get(culturalRegion);
        if (!culturalSet) return [];

        return culturalSet.gestures.get(gestureType) || [];
    }

    /**
     * Checks if a gesture is appropriate for a cultural context
     */
    public isGestureAppropriate(
        gestureType: string,
        culturalProfile: CulturalProfile,
        context: MovementContext
    ): boolean {
        return this.appropriatenessChecker.isAppropriate(gestureType, culturalProfile, context);
    }

    /**
     * Gets alternative gestures for culturally inappropriate ones
     */
    public getAlternativeGestures(
        inappropriateGesture: string,
        culturalProfile: CulturalProfile,
        context: MovementContext
    ): string[] {
        return this.appropriatenessChecker.getAlternatives(inappropriateGesture, culturalProfile, context);
    }

    /**
     * Creates a cultural profile from region identifier
     */
    public createCulturalProfile(region: string): CulturalProfile | null {
        const culturalSet = this.culturalDatabase.regions.get(region);
        if (!culturalSet) return null;

        const modifier = this.culturalDatabase.culturalModifiers.get(region);
        if (!modifier) return null;

        return {
            region,
            gesturePreferences: this.createGesturePreferences(culturalSet),
            movementAmplitude: modifier.gestureAmplitudeScale,
            eyeContactPatterns: culturalSet.eyeContactPreferences,
            personalSpaceBehavior: culturalSet.personalSpacePreferences,
            restrictedGestures: this.culturalDatabase.restrictedGestures.get(region) || []
        };
    }

    /**
     * Applies cultural modifications to gestures
     */
    private applyCulturalModifications(
        gestures: Gesture[],
        culturalProfile: CulturalProfile,
        context: MovementContext
    ): Gesture[] {
        const modifier = this.culturalDatabase.culturalModifiers.get(culturalProfile.region);
        if (!modifier) return gestures;

        return gestures.map(gesture => {
            let modifiedGesture = { ...gesture };

            // Apply amplitude scaling
            modifiedGesture.intensity *= modifier.gestureAmplitudeScale;
            modifiedGesture.intensity = Math.min(1.0, modifiedGesture.intensity);

            // Apply frequency scaling (affects duration)
            modifiedGesture.duration = Math.round(modifiedGesture.duration / modifier.gestureFrequencyScale);

            // Apply expressiveness factor
            modifiedGesture.morphTargets = modifiedGesture.morphTargets.map(target => ({
                ...target,
                weight: Math.min(1.0, target.weight * modifier.expressivenessFactor)
            }));

            // Apply formality adjustment
            if (context.isExplanation && modifier.formalityAdjustment < 1.0) {
                modifiedGesture.intensity *= modifier.formalityAdjustment;
            }

            return modifiedGesture;
        });
    }

    /**
     * Creates gesture preferences from cultural set
     */
    private createGesturePreferences(culturalSet: CulturalGestureSet): GesturePreference[] {
        const preferences: GesturePreference[] = [];

        culturalSet.gestures.forEach((variants, gestureType) => {
            if (variants.length > 0) {
                const avgIntensity = variants.reduce((sum, v) => sum + v.intensity, 0) / variants.length;
                const avgAppropriateness = variants.reduce((sum, v) => sum + v.appropriatenessScore, 0) / variants.length;

                preferences.push({
                    gestureType,
                    frequency: avgAppropriateness * culturalSet.frequencyModifier,
                    intensity: avgIntensity * culturalSet.intensityModifier,
                    contexts: this.getContextsForGesture(gestureType, variants)
                });
            }
        });

        return preferences;
    }

    /**
     * Gets contexts where a gesture is appropriate
     */
    private getContextsForGesture(gestureType: string, variants: CulturalGestureVariant[]): string[] {
        const contexts = new Set<string>();

        variants.forEach(variant => {
            if (variant.appropriatenessScore > 0.6) {
                // Add contexts where this variant is NOT restricted
                const allContexts = ['formal', 'informal', 'educational', 'social', 'professional'];
                allContexts.forEach(context => {
                    if (!variant.contextRestrictions.includes(context)) {
                        contexts.add(context);
                    }
                });
            }
        });

        return Array.from(contexts);
    }

    /**
     * Calculates confidence in cultural adaptation
     */
    private calculateAdaptationConfidence(
        originalCount: number,
        adaptedCount: number,
        warnings: AppropriatenessWarning[]
    ): number {
        if (originalCount === 0) return 0;

        // Base confidence on gesture retention rate
        const retentionRate = adaptedCount / originalCount;
        let confidence = retentionRate * 0.7;

        // Reduce confidence based on warnings
        const errorCount = warnings.filter(w => w.warningLevel === 'error').length;
        const warningCount = warnings.filter(w => w.warningLevel === 'warning').length;

        confidence -= (errorCount * 0.2) + (warningCount * 0.1);

        return Math.max(0, Math.min(1.0, confidence));
    }

    /**
     * Initializes the cultural gesture database
     */
    private initializeCulturalDatabase(): CulturalGestureDatabase {
        const database: CulturalGestureDatabase = {
            regions: new Map(),
            restrictedGestures: new Map(),
            culturalModifiers: new Map(),
            appropriatenessRules: new Map()
        };

        // Initialize Western cultural set
        this.initializeWesternCulture(database);

        // Initialize Eastern cultural set
        this.initializeEasternCulture(database);

        // Initialize Mediterranean cultural set
        this.initializeMediterraneanCulture(database);

        // Initialize Nordic cultural set
        this.initializeNordicCulture(database);

        // Initialize Middle Eastern cultural set
        this.initializeMiddleEasternCulture(database);

        return database;
    }

    /**
     * Initializes Western cultural gesture patterns
     */
    private initializeWesternCulture(database: CulturalGestureDatabase): void {
        const westernGestures = new Map<string, CulturalGestureVariant[]>();

        // Head nod variants
        westernGestures.set('head_nod', [
            {
                baseGestureType: 'head_nod',
                culturalVariantName: 'western_affirmative_nod',
                morphTargets: [
                    { targetName: 'head_nod_down', weight: 0.8, blendMode: 'replace' }
                ],
                intensity: 0.8,
                duration: 400,
                appropriatenessScore: 0.9,
                contextRestrictions: [],
                description: 'Standard Western affirmative head nod'
            }
        ]);

        // Head tilt variants
        westernGestures.set('head_tilt', [
            {
                baseGestureType: 'head_tilt',
                culturalVariantName: 'western_curious_tilt',
                morphTargets: [
                    { targetName: 'head_tilt_right', weight: 0.6, blendMode: 'replace' },
                    { targetName: 'eyebrow_raise_slight', weight: 0.4, blendMode: 'additive' }
                ],
                intensity: 0.6,
                duration: 600,
                appropriatenessScore: 0.8,
                contextRestrictions: ['formal'],
                description: 'Western curious head tilt with slight eyebrow raise'
            }
        ]);

        // Eyebrow raise variants
        westernGestures.set('eyebrow_raise', [
            {
                baseGestureType: 'eyebrow_raise',
                culturalVariantName: 'western_surprise',
                morphTargets: [
                    { targetName: 'eyebrow_raise_both', weight: 0.7, blendMode: 'replace' },
                    { targetName: 'eye_wide', weight: 0.3, blendMode: 'additive' }
                ],
                intensity: 0.7,
                duration: 300,
                appropriatenessScore: 0.8,
                contextRestrictions: [],
                description: 'Western surprise or questioning eyebrow raise'
            }
        ]);

        database.regions.set('western', {
            region: 'western',
            displayName: 'Western',
            description: 'Western cultural gesture patterns',
            gestures: westernGestures,
            intensityModifier: 1.0,
            frequencyModifier: 1.0,
            eyeContactPreferences: {
                frequency: 0.8,
                duration: 2000,
                avoidance: false
            },
            personalSpacePreferences: {
                preferredDistance: 1.2,
                approachStyle: 'direct',
                retreatTriggers: ['invasion']
            },
            communicationStyle: {
                directness: 'high',
                expressiveness: 'medium',
                formality: 'medium',
                eyeContactNorms: 'direct',
                gestureFrequency: 'medium'
            }
        });

        database.culturalModifiers.set('western', {
            region: 'western',
            gestureAmplitudeScale: 1.0,
            gestureFrequencyScale: 1.0,
            eyeContactIntensity: 0.8,
            personalSpaceDistance: 1.2,
            expressivenessFactor: 1.0,
            formalityAdjustment: 1.0
        });

        database.restrictedGestures.set('western', []);
    }

    /**
     * Initializes Eastern cultural gesture patterns
     */
    private initializeEasternCulture(database: CulturalGestureDatabase): void {
        const easternGestures = new Map<string, CulturalGestureVariant[]>();

        // Head nod variants (more subtle)
        easternGestures.set('head_nod', [
            {
                baseGestureType: 'head_nod',
                culturalVariantName: 'eastern_respectful_nod',
                morphTargets: [
                    { targetName: 'head_bow_slight', weight: 0.5, blendMode: 'replace' }
                ],
                intensity: 0.5,
                duration: 600,
                appropriatenessScore: 0.9,
                contextRestrictions: [],
                description: 'Eastern respectful slight bow'
            }
        ]);

        // Head tilt variants (minimal)
        easternGestures.set('head_tilt', [
            {
                baseGestureType: 'head_tilt',
                culturalVariantName: 'eastern_subtle_tilt',
                morphTargets: [
                    { targetName: 'head_tilt_minimal', weight: 0.3, blendMode: 'replace' }
                ],
                intensity: 0.3,
                duration: 800,
                appropriatenessScore: 0.7,
                contextRestrictions: ['informal'],
                description: 'Eastern subtle head tilt'
            }
        ]);

        database.regions.set('eastern', {
            region: 'eastern',
            displayName: 'Eastern',
            description: 'Eastern cultural gesture patterns',
            gestures: easternGestures,
            intensityModifier: 0.7,
            frequencyModifier: 0.8,
            eyeContactPreferences: {
                frequency: 0.5,
                duration: 1000,
                avoidance: true
            },
            personalSpacePreferences: {
                preferredDistance: 1.5,
                approachStyle: 'respectful',
                retreatTriggers: ['direct_approach', 'invasion']
            },
            communicationStyle: {
                directness: 'low',
                expressiveness: 'low',
                formality: 'high',
                eyeContactNorms: 'minimal',
                gestureFrequency: 'low'
            }
        });

        database.culturalModifiers.set('eastern', {
            region: 'eastern',
            gestureAmplitudeScale: 0.7,
            gestureFrequencyScale: 0.8,
            eyeContactIntensity: 0.4,
            personalSpaceDistance: 1.5,
            expressivenessFactor: 0.7,
            formalityAdjustment: 1.2
        });

        database.restrictedGestures.set('eastern', ['pointing', 'beckoning']);
    }

    /**
     * Initializes Mediterranean cultural gesture patterns
     */
    private initializeMediterraneanCulture(database: CulturalGestureDatabase): void {
        const mediterraneanGestures = new Map<string, CulturalGestureVariant[]>();

        // Head nod variants (expressive)
        mediterraneanGestures.set('head_nod', [
            {
                baseGestureType: 'head_nod',
                culturalVariantName: 'mediterranean_expressive_nod',
                morphTargets: [
                    { targetName: 'head_nod_strong', weight: 0.9, blendMode: 'replace' },
                    { targetName: 'eyebrow_emphasis', weight: 0.6, blendMode: 'additive' }
                ],
                intensity: 0.9,
                duration: 350,
                appropriatenessScore: 0.9,
                contextRestrictions: [],
                description: 'Mediterranean expressive head nod with eyebrow emphasis'
            }
        ]);

        // Head tilt variants (animated)
        mediterraneanGestures.set('head_tilt', [
            {
                baseGestureType: 'head_tilt',
                culturalVariantName: 'mediterranean_animated_tilt',
                morphTargets: [
                    { targetName: 'head_tilt_expressive', weight: 0.8, blendMode: 'replace' },
                    { targetName: 'eyebrow_expressive', weight: 0.7, blendMode: 'additive' },
                    { targetName: 'eye_focus_intent', weight: 0.5, blendMode: 'additive' }
                ],
                intensity: 0.8,
                duration: 500,
                appropriatenessScore: 0.8,
                contextRestrictions: ['formal'],
                description: 'Mediterranean animated head tilt with expressive features'
            }
        ]);

        database.regions.set('mediterranean', {
            region: 'mediterranean',
            displayName: 'Mediterranean',
            description: 'Mediterranean cultural gesture patterns',
            gestures: mediterraneanGestures,
            intensityModifier: 1.2,
            frequencyModifier: 1.3,
            eyeContactPreferences: {
                frequency: 0.9,
                duration: 2500,
                avoidance: false
            },
            personalSpacePreferences: {
                preferredDistance: 0.9,
                approachStyle: 'direct',
                retreatTriggers: []
            },
            communicationStyle: {
                directness: 'high',
                expressiveness: 'high',
                formality: 'low',
                eyeContactNorms: 'direct',
                gestureFrequency: 'high'
            }
        });

        database.culturalModifiers.set('mediterranean', {
            region: 'mediterranean',
            gestureAmplitudeScale: 1.2,
            gestureFrequencyScale: 1.3,
            eyeContactIntensity: 0.9,
            personalSpaceDistance: 0.9,
            expressivenessFactor: 1.3,
            formalityAdjustment: 0.8
        });

        database.restrictedGestures.set('mediterranean', []);
    }

    /**
     * Initializes Nordic cultural gesture patterns
     */
    private initializeNordicCulture(database: CulturalGestureDatabase): void {
        const nordicGestures = new Map<string, CulturalGestureVariant[]>();

        // Head nod variants (reserved)
        nordicGestures.set('head_nod', [
            {
                baseGestureType: 'head_nod',
                culturalVariantName: 'nordic_reserved_nod',
                morphTargets: [
                    { targetName: 'head_nod_minimal', weight: 0.6, blendMode: 'replace' }
                ],
                intensity: 0.6,
                duration: 500,
                appropriatenessScore: 0.9,
                contextRestrictions: [],
                description: 'Nordic reserved head nod'
            }
        ]);

        database.regions.set('nordic', {
            region: 'nordic',
            displayName: 'Nordic',
            description: 'Nordic cultural gesture patterns',
            gestures: nordicGestures,
            intensityModifier: 0.8,
            frequencyModifier: 0.7,
            eyeContactPreferences: {
                frequency: 0.6,
                duration: 1500,
                avoidance: false
            },
            personalSpacePreferences: {
                preferredDistance: 1.4,
                approachStyle: 'respectful',
                retreatTriggers: ['invasion']
            },
            communicationStyle: {
                directness: 'medium',
                expressiveness: 'low',
                formality: 'medium',
                eyeContactNorms: 'moderate',
                gestureFrequency: 'low'
            }
        });

        database.culturalModifiers.set('nordic', {
            region: 'nordic',
            gestureAmplitudeScale: 0.8,
            gestureFrequencyScale: 0.7,
            eyeContactIntensity: 0.6,
            personalSpaceDistance: 1.4,
            expressivenessFactor: 0.8,
            formalityAdjustment: 1.1
        });

        database.restrictedGestures.set('nordic', ['excessive_gesturing']);
    }

    /**
     * Initializes Middle Eastern cultural gesture patterns
     */
    private initializeMiddleEasternCulture(database: CulturalGestureDatabase): void {
        const middleEasternGestures = new Map<string, CulturalGestureVariant[]>();

        // Head nod variants (respectful)
        middleEasternGestures.set('head_nod', [
            {
                baseGestureType: 'head_nod',
                culturalVariantName: 'middle_eastern_respectful_nod',
                morphTargets: [
                    { targetName: 'head_nod_respectful', weight: 0.7, blendMode: 'replace' }
                ],
                intensity: 0.7,
                duration: 450,
                appropriatenessScore: 0.9,
                contextRestrictions: [],
                description: 'Middle Eastern respectful head nod'
            }
        ]);

        database.regions.set('middle_eastern', {
            region: 'middle_eastern',
            displayName: 'Middle Eastern',
            description: 'Middle Eastern cultural gesture patterns',
            gestures: middleEasternGestures,
            intensityModifier: 0.9,
            frequencyModifier: 0.9,
            eyeContactPreferences: {
                frequency: 0.7,
                duration: 1800,
                avoidance: false
            },
            personalSpacePreferences: {
                preferredDistance: 1.1,
                approachStyle: 'respectful',
                retreatTriggers: ['inappropriate_contact']
            },
            communicationStyle: {
                directness: 'medium',
                expressiveness: 'medium',
                formality: 'high',
                eyeContactNorms: 'moderate',
                gestureFrequency: 'medium'
            }
        });

        database.culturalModifiers.set('middle_eastern', {
            region: 'middle_eastern',
            gestureAmplitudeScale: 0.9,
            gestureFrequencyScale: 0.9,
            eyeContactIntensity: 0.7,
            personalSpaceDistance: 1.1,
            expressivenessFactor: 0.9,
            formalityAdjustment: 1.1
        });

        database.restrictedGestures.set('middle_eastern', ['thumbs_up', 'ok_sign']);
    }
}/**
 * 
Cultural sensitivity filter for inappropriate gesture filtering
 */
class CulturalSensitivityFilter {
    constructor(private database: CulturalGestureDatabase) { }

    public filterInappropriateGestures(
        gestures: Gesture[],
        culturalProfile: CulturalProfile,
        context: MovementContext
    ): { appropriateGestures: Gesture[]; filteredGestures: string[] } {
        const appropriateGestures: Gesture[] = [];
        const filteredGestures: string[] = [];

        gestures.forEach(gesture => {
            if (this.isGestureAppropriate(gesture, culturalProfile, context)) {
                appropriateGestures.push(gesture);
            } else {
                filteredGestures.push(gesture.type);
            }
        });

        return { appropriateGestures, filteredGestures };
    }

    private isGestureAppropriate(
        gesture: Gesture,
        culturalProfile: CulturalProfile,
        context: MovementContext
    ): boolean {
        // Check if gesture is in restricted list
        if (culturalProfile.restrictedGestures.includes(gesture.type)) {
            return false;
        }

        // Check appropriateness rules
        const rules = this.database.appropriatenessRules.get(culturalProfile.region) || [];
        const relevantRule = rules.find(rule => rule.gestureType === gesture.type);

        if (relevantRule) {
            // Check if current context is appropriate
            const contextKey = this.getContextKey(context);
            if (relevantRule.contexts.includes(contextKey)) {
                return relevantRule.appropriatenessLevel !== 'inappropriate' &&
                    relevantRule.appropriatenessLevel !== 'offensive';
            }
        }

        // Default to appropriate if no specific rules
        return true;
    }

    private getContextKey(context: MovementContext): string {
        if (context.isExplanation) return 'educational';
        if (context.isQuestion) return 'questioning';
        if (context.emphasisLevel === 'high') return 'emphatic';
        return 'general';
    }
}

/**
 * Gesture variant selector for cultural adaptations
 */
class GestureVariantSelector {
    constructor(private database: CulturalGestureDatabase) { }

    public selectCulturalVariants(
        gestures: Gesture[],
        culturalProfile: CulturalProfile,
        context: MovementContext
    ): { selectedGestures: Gesture[]; modifications: CulturalModification[] } {
        const selectedGestures: Gesture[] = [];
        const modifications: CulturalModification[] = [];

        const culturalSet = this.database.regions.get(culturalProfile.region);
        if (!culturalSet) {
            return { selectedGestures: gestures, modifications: [] };
        }

        gestures.forEach(gesture => {
            const variants = culturalSet.gestures.get(gesture.type);
            if (variants && variants.length > 0) {
                const bestVariant = this.selectBestVariant(variants, context);
                const modifiedGesture = this.applyVariant(gesture, bestVariant);

                selectedGestures.push(modifiedGesture);
                modifications.push({
                    originalGesture: gesture,
                    modifiedGesture,
                    modificationType: 'variant',
                    reason: `Applied ${bestVariant.culturalVariantName} for ${culturalProfile.region} culture`,
                    culturalContext: culturalProfile.region
                });
            } else {
                selectedGestures.push(gesture);
            }
        });

        return { selectedGestures, modifications };
    }

    private selectBestVariant(
        variants: CulturalGestureVariant[],
        context: MovementContext
    ): CulturalGestureVariant {
        // Score variants based on context appropriateness
        const scoredVariants = variants.map(variant => ({
            variant,
            score: this.calculateVariantScore(variant, context)
        }));

        // Return variant with highest score
        return scoredVariants.reduce((best, current) =>
            current.score > best.score ? current : best
        ).variant;
    }

    private calculateVariantScore(
        variant: CulturalGestureVariant,
        context: MovementContext
    ): number {
        let score = variant.appropriatenessScore;

        // Check context restrictions
        const contextKey = this.getContextKey(context);
        if (variant.contextRestrictions.includes(contextKey)) {
            score *= 0.5; // Penalize restricted contexts
        }

        // Boost score for intensity match
        const intensityMatch = 1 - Math.abs(variant.intensity - this.getDesiredIntensity(context));
        score += intensityMatch * 0.2;

        return score;
    }

    private getContextKey(context: MovementContext): string {
        if (context.isExplanation) return 'educational';
        if (context.isQuestion) return 'questioning';
        if (context.emphasisLevel === 'high') return 'emphatic';
        return 'general';
    }

    private getDesiredIntensity(context: MovementContext): number {
        switch (context.emphasisLevel) {
            case 'high': return 0.9;
            case 'medium': return 0.7;
            case 'low': return 0.5;
            default: return 0.6;
        }
    }

    private applyVariant(gesture: Gesture, variant: CulturalGestureVariant): Gesture {
        return {
            ...gesture,
            morphTargets: variant.morphTargets,
            intensity: variant.intensity,
            duration: variant.duration,
            culturalVariant: variant.culturalVariantName
        };
    }
}

/**
 * Appropriateness checker for cultural gesture validation
 */
class AppropriatenessChecker {
    constructor(private database: CulturalGestureDatabase) { }

    public checkAppropriateness(
        gestures: Gesture[],
        culturalProfile: CulturalProfile,
        context: MovementContext
    ): { warnings: AppropriatenessWarning[] } {
        const warnings: AppropriatenessWarning[] = [];

        gestures.forEach(gesture => {
            const warning = this.checkGestureAppropriateness(gesture, culturalProfile, context);
            if (warning) {
                warnings.push(warning);
            }
        });

        return { warnings };
    }

    public isAppropriate(
        gestureType: string,
        culturalProfile: CulturalProfile,
        context: MovementContext
    ): boolean {
        // Check restricted gestures
        if (culturalProfile.restrictedGestures.includes(gestureType)) {
            return false;
        }

        // Check appropriateness rules
        const rules = this.database.appropriatenessRules.get(culturalProfile.region) || [];
        const rule = rules.find(r => r.gestureType === gestureType);

        if (rule) {
            const contextKey = this.getContextKey(context);
            if (rule.contexts.includes(contextKey)) {
                return rule.appropriatenessLevel === 'appropriate' || rule.appropriatenessLevel === 'neutral';
            }
        }

        return true;
    }

    public getAlternatives(
        inappropriateGesture: string,
        culturalProfile: CulturalProfile,
        context: MovementContext
    ): string[] {
        const rules = this.database.appropriatenessRules.get(culturalProfile.region) || [];
        const rule = rules.find(r => r.gestureType === inappropriateGesture);

        if (rule && rule.alternatives.length > 0) {
            return rule.alternatives.filter(alt =>
                this.isAppropriate(alt, culturalProfile, context)
            );
        }

        // Default alternatives based on gesture type
        return this.getDefaultAlternatives(inappropriateGesture, culturalProfile);
    }

    private checkGestureAppropriateness(
        gesture: Gesture,
        culturalProfile: CulturalProfile,
        context: MovementContext
    ): AppropriatenessWarning | null {
        const rules = this.database.appropriatenessRules.get(culturalProfile.region) || [];
        const rule = rules.find(r => r.gestureType === gesture.type);

        if (!rule) return null;

        const contextKey = this.getContextKey(context);

        if (rule.contexts.includes(contextKey)) {
            if (rule.appropriatenessLevel === 'inappropriate') {
                return {
                    gestureType: gesture.type,
                    warningLevel: 'warning',
                    message: `Gesture "${gesture.type}" may be inappropriate in ${culturalProfile.region} culture: ${rule.reason}`,
                    suggestedAlternatives: rule.alternatives
                };
            } else if (rule.appropriatenessLevel === 'offensive') {
                return {
                    gestureType: gesture.type,
                    warningLevel: 'error',
                    message: `Gesture "${gesture.type}" is considered offensive in ${culturalProfile.region} culture: ${rule.reason}`,
                    suggestedAlternatives: rule.alternatives
                };
            }
        }

        return null;
    }

    private getContextKey(context: MovementContext): string {
        if (context.isExplanation) return 'educational';
        if (context.isQuestion) return 'questioning';
        if (context.emphasisLevel === 'high') return 'emphatic';
        return 'general';
    }

    private getDefaultAlternatives(gestureType: string, culturalProfile: CulturalProfile): string[] {
        // Provide safe default alternatives based on gesture type
        const alternatives: Record<string, string[]> = {
            'pointing': ['head_nod', 'eyebrow_raise'],
            'thumbs_up': ['head_nod', 'smile'],
            'ok_sign': ['head_nod'],
            'beckoning': ['head_tilt', 'eyebrow_raise'],
            'excessive_gesturing': ['head_nod', 'micro_movement']
        };

        return alternatives[gestureType] || ['head_nod'];
    }
}