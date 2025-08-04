import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { VRM, VRMLoaderPlugin } from '@pixiv/three-vrm';
import { ttsService } from '../../../utils/ttsService';
import type { AccentModifications } from '../../../utils/ttsService';
import { PreciseLipSyncEngine, LipSyncState, MorphTargetWeights } from '../../../services/avatar/PreciseLipSyncEngine';
import { PhonemePreprocessor, PhonemeData } from '../../../services/avatar/PhonemePreprocessor';
import { IdleAnimationEngine, IdleAnimationResult } from '../../../services/avatar/movement/IdleAnimationEngine';
import { SpeechSynchronizedMovementEngine, SpeechMovementResult } from '../../../services/avatar/movement/SpeechSynchronizedMovementEngine';
import { MotionSettings, MovementContext, CulturalProfile, AccentProfile } from '../../../services/avatar/movement/types';
import { MovementOrchestrator, MovementOrchestrationResult } from '../../../services/avatar/movement/MovementOrchestrator';
import { AccentEngine, AccentedSpeechData } from '../../../services/avatar/movement/AccentEngine';
import { languageDetectionService, LanguageChangeEvent } from '../../../services/avatar/LanguageDetectionService';
import { AccentTransitionSystem, BlendedAccentProfile } from '../../../services/avatar/AccentTransitionSystem';
import MovementConfigurationPanel from './MovementConfigurationPanel';

interface BasicVRMViewerProps {
    isVisible: boolean;
    textToSpeak?: string;
    onSpeechComplete?: () => void;
    className?: string;
    language?: string; // Language for accent adaptation
    culturalContext?: string; // Cultural context for gesture adaptation
    motionSettings?: Partial<MotionSettings>; // Motion sensitivity settings
    showConfigurationPanel?: boolean; // Whether to show the configuration panel
}

const BasicVRMViewer: React.FC<BasicVRMViewerProps> = ({
    isVisible,
    textToSpeak,
    onSpeechComplete,
    className = '',
    language = 'en-US',
    culturalContext = 'western',
    motionSettings,
    showConfigurationPanel = false
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const modelRef = useRef<VRM | null>(null);
    const sceneRef = useRef(new THREE.Scene());
    const animationIdRef = useRef<number | null>(null);
    const clock = new THREE.Clock();
    const animationStateRef = useRef({
        headLookTime: 0,
        blinkTime: 0,
        breatheTime: 0,
        idleTime: 0,
        lastBlinkTime: 0,
        blinkDuration: 0,
        isBlinking: false
    });

    // Initialize movement system components
    const movementOrchestratorRef = useRef<MovementOrchestrator | null>(null);
    const accentEngineRef = useRef<AccentEngine | null>(null);
    const accentTransitionSystemRef = useRef<AccentTransitionSystem | null>(null);
    const idleAnimationEngineRef = useRef<IdleAnimationEngine | null>(null);
    const speechMovementEngineRef = useRef<SpeechSynchronizedMovementEngine | null>(null);

    const motionSettingsRef = useRef<MotionSettings>({
        intensity: 'standard',
        enableGestures: true,
        enableHeadMovements: true,
        enableIdleAnimations: true,
        motionSensitivity: false,
        customIntensityScale: 1.0
    });

    const culturalProfileRef = useRef<CulturalProfile>({
        region: 'western',
        gesturePreferences: [
            { gestureType: 'head_nod', frequency: 0.3, intensity: 0.6, contexts: ['agreement', 'emphasis'] },
            { gestureType: 'head_tilt', frequency: 0.2, intensity: 0.4, contexts: ['question', 'curiosity'] }
        ],
        movementAmplitude: 1.0,
        eyeContactPatterns: { frequency: 0.7, duration: 2000, avoidance: false },
        personalSpaceBehavior: { preferredDistance: 1.5, approachStyle: 'respectful', retreatTriggers: [] },
        restrictedGestures: []
    });

    const accentProfileRef = useRef<AccentProfile>({
        language: 'en-US',
        region: 'US',
        pronunciationRules: {
            vowelMappings: {},
            consonantMappings: {},
            rhythmPattern: { beatsPerMinute: 140, stressPattern: [1.0, 0.7], pauseDurations: [200, 400] },
            stressPatterns: []
        },
        speechRhythm: { beatsPerMinute: 140, stressPattern: [1.0, 0.7], pauseDurations: [200, 400] },
        intonationPatterns: [],
        headMovementStyle: { nodFrequency: 0.3, tiltTendency: 0.2, emphasisStyle: 'moderate' }
    });
    const [isLoaded, setIsLoaded] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSpeaking, setIsSpeaking] = useState(false);

    // Natural blinking function
    const handleBlinking = (vrm: VRM, state: any, elapsedTime: number) => {
        // Natural blinking pattern - random intervals between 4-8 seconds (slower)
        if (elapsedTime - state.lastBlinkTime > (4000 + Math.random() * 4000)) {
            state.lastBlinkTime = elapsedTime;
            state.isBlinking = true;
            state.blinkDuration = 150 + Math.random() * 100; // 150-250ms blink
        }

        // Handle blink animation
        if (state.isBlinking) {
            const blinkProgress = (elapsedTime - state.lastBlinkTime) / state.blinkDuration;

            if (blinkProgress >= 1) {
                state.isBlinking = false;
                applyBlinkToVRM(vrm, 0); // Eyes fully open
            } else {
                // Smooth blink curve - quick close, slower open
                let blinkValue;
                if (blinkProgress < 0.3) {
                    // Quick close (30% of duration)
                    blinkValue = Math.sin((blinkProgress / 0.3) * Math.PI * 0.5);
                } else {
                    // Slower open (70% of duration)
                    blinkValue = Math.cos(((blinkProgress - 0.3) / 0.7) * Math.PI * 0.5);
                }
                applyBlinkToVRM(vrm, blinkValue);
            }
        }
    };

    // Apply blink using VRM expression manager (preferred) or direct morph targets (fallback)
    const applyBlinkToVRM = (vrm: VRM, blinkValue: number) => {
        let blinkApplied = false;

        // Method 1: Try using VRM expression manager (modern approach)
        if (vrm.expressionManager) {
            try {
                // Use the exact VRM expression names from your model
                const blinkExpressions = ['blink', 'blinkLeft', 'blinkRight'];

                blinkExpressions.forEach(expressionName => {
                    if (vrm.expressionManager!.expressionMap[expressionName]) {
                        vrm.expressionManager!.setValue(expressionName, blinkValue);
                        blinkApplied = true;
                    }
                });
            } catch (error) {
                console.warn('⚠️ VRM expression manager error:', error);
            }
        }

        // Method 2: Fallback to direct morph target manipulation
        if (!blinkApplied) {
            vrm.scene.traverse((child) => {
                if (child instanceof THREE.Mesh && child.morphTargetDictionary && child.morphTargetInfluences) {
                    // Use the exact blend shape names from your VRM model
                    const blinkTargets = ['Head_BlinkL', 'Head_BlinkR', 'blink', 'Blink', 'blink_L', 'blink_R'];

                    blinkTargets.forEach(targetName => {
                        const index = child.morphTargetDictionary![targetName];
                        if (index !== undefined && index < child.morphTargetInfluences!.length) {
                            child.morphTargetInfluences![index] = blinkValue;
                            blinkApplied = true;
                        }
                    });
                }
            });
        }
    };

    // Apply mouth shapes using VRM expression manager (preferred) or direct morph targets (fallback)
    const applyMouthShape = (vrm: VRM, shapeName: string, intensity: number) => {
        let shapeApplied = false;

        // Method 1: Try using VRM expression manager (modern approach)
        if (vrm.expressionManager) {
            try {
                // Reset all mouth expressions first using the exact names from your VRM
                const mouthExpressions = ['aa', 'ih', 'ou', 'ee', 'oh'];
                mouthExpressions.forEach(expr => {
                    if (vrm.expressionManager!.expressionMap[expr]) {
                        vrm.expressionManager!.setValue(expr, 0);
                    }
                });

                // Map Head_ morph targets to VRM expressions
                const expressionMap: Record<string, string> = {
                    'Head_A': 'aa',
                    'Head_I': 'ih',
                    'Head_U': 'ou',
                    'Head_E': 'ee',
                    'Head_O': 'oh'
                };

                const expressionName = expressionMap[shapeName];
                if (expressionName && vrm.expressionManager!.expressionMap[expressionName]) {
                    vrm.expressionManager!.setValue(expressionName, intensity);
                    shapeApplied = true;
                }
            } catch (error) {
                console.warn('⚠️ VRM expression manager error:', error);
            }
        }

        // Method 2: Fallback to direct morph target manipulation
        if (!shapeApplied) {
            vrm.scene.traverse((child) => {
                if (child instanceof THREE.Mesh && child.morphTargetDictionary && child.morphTargetInfluences) {
                    // Reset all mouth shapes first
                    const mouthShapes = ['Head_A', 'Head_I', 'Head_U', 'Head_E', 'Head_O', 'a', 'i', 'u', 'e', 'o'];
                    mouthShapes.forEach(shape => {
                        const index = child.morphTargetDictionary![shape];
                        if (index !== undefined && index < child.morphTargetInfluences!.length) {
                            child.morphTargetInfluences![index] = 0;
                        }
                    });

                    // Apply the specific mouth shape
                    const index = child.morphTargetDictionary![shapeName];
                    if (index !== undefined && index < child.morphTargetInfluences!.length) {
                        child.morphTargetInfluences![index] = intensity;
                        shapeApplied = true;
                    }
                }
            });
        }
    };

    // Professional-grade lip sync engine instances
    const lipSyncEngineRef = useRef<PreciseLipSyncEngine | null>(null);
    const phonemePreprocessorRef = useRef<PhonemePreprocessor | null>(null);

    // Initialize professional lip sync components and enhanced movement system
    useEffect(() => {
        lipSyncEngineRef.current = new PreciseLipSyncEngine();
        phonemePreprocessorRef.current = new PhonemePreprocessor();
        accentEngineRef.current = new AccentEngine();

        // Initialize accent transition system
        accentTransitionSystemRef.current = new AccentTransitionSystem(accentEngineRef.current);

        // Initialize MovementOrchestrator with current settings and profiles
        movementOrchestratorRef.current = new MovementOrchestrator(
            motionSettingsRef.current,
            culturalProfileRef.current,
            accentProfileRef.current
        );

        // Set up language change detection
        const handleLanguageChange = (event: LanguageChangeEvent) => {
            console.log(`🌍 Language change detected: ${event.previousLanguage} → ${event.newLanguage}`);

            // Get the new accent profile
            const newAccentProfile = accentEngineRef.current?.getPronunciationRules(event.newLanguage);
            if (newAccentProfile && accentTransitionSystemRef.current) {
                // Create a full accent profile for the new language
                const fullNewProfile: AccentProfile = {
                    language: event.newLanguage,
                    region: event.newLanguage.split('-')[1] || 'US',
                    pronunciationRules: newAccentProfile,
                    speechRhythm: newAccentProfile.rhythmPattern,
                    intonationPatterns: [],
                    headMovementStyle: {
                        nodFrequency: 0.3,
                        tiltTendency: 0.2,
                        emphasisStyle: 'moderate'
                    }
                };

                // Start smooth transition to new accent
                accentTransitionSystemRef.current.startTransition(
                    accentProfileRef.current,
                    fullNewProfile,
                    1500 // 1.5 second transition
                );
            }
        };

        languageDetectionService.addLanguageChangeListener(handleLanguageChange);

        // Keep legacy engines for backward compatibility during transition
        idleAnimationEngineRef.current = new IdleAnimationEngine(motionSettingsRef.current);
        speechMovementEngineRef.current = new SpeechSynchronizedMovementEngine();

        return () => {
            lipSyncEngineRef.current?.stop();
            movementOrchestratorRef.current?.stopAllMovements();
            languageDetectionService.removeLanguageChangeListener(handleLanguageChange);
        };
    }, []);

    // Advanced morph target smoothing state for ultra-realistic animation
    const morphSmoothingRef = useRef<Record<string, number>>({});
    const lastMorphApplicationRef = useRef<number>(0);

    // ULTRA-ADVANCED Professional VRM morph target application with smoothing
    const applyProfessionalMorphTargets = (vrm: VRM, morphWeights: MorphTargetWeights) => {
        const currentTime = performance.now();
        const deltaTime = currentTime - lastMorphApplicationRef.current;
        lastMorphApplicationRef.current = currentTime;

        // Advanced smoothing parameters for cinema-quality animation
        const SMOOTHING_FACTOR = 0.12; // Lower = smoother, higher = more responsive
        const MIN_CHANGE_THRESHOLD = 0.002; // Ignore tiny changes to reduce jitter
        const INTENSITY_BOOST = 1.4; // Boost intensity for more visible movements
        const VOWEL_BOOST = 1.6; // Extra boost for vowels (more important for lip reading)
        let appliedCount = 0;

        // Method 1: Enhanced VRM Expression Manager with cinema-quality smoothing
        if (vrm.expressionManager) {
            // Reset all expressions to 0 first for clean slate
            const allExpressions = ['aa', 'ih', 'ou', 'ee', 'oh', 'neutral'];
            allExpressions.forEach(expr => {
                if (vrm.expressionManager!.expressionMap[expr]) {
                    const currentWeight = morphSmoothingRef.current[expr] || 0;
                    const smoothedWeight = currentWeight * (1 - SMOOTHING_FACTOR * 0.5); // Gradual decay

                    if (smoothedWeight > MIN_CHANGE_THRESHOLD) {
                        morphSmoothingRef.current[expr] = smoothedWeight;
                        vrm.expressionManager!.setValue(expr, smoothedWeight);
                    } else {
                        morphSmoothingRef.current[expr] = 0;
                        vrm.expressionManager!.setValue(expr, 0);
                    }
                }
            });

            Object.entries(morphWeights).forEach(([targetName, weight]) => {
                // Enhanced professional viseme mapping with intensity scaling
                const vrmExpressionMap: Record<string, { expression: string; intensityMultiplier: number; isVowel: boolean }> = {
                    'viseme_sil': { expression: 'neutral', intensityMultiplier: 1.0, isVowel: false },
                    'viseme_PP': { expression: 'aa', intensityMultiplier: 0.7, isVowel: false }, // Bilabial - subtle
                    'viseme_FF': { expression: 'ou', intensityMultiplier: 0.8, isVowel: false }, // Labiodental
                    'viseme_TH': { expression: 'ee', intensityMultiplier: 0.6, isVowel: false }, // Dental - very subtle
                    'viseme_DD': { expression: 'aa', intensityMultiplier: 0.5, isVowel: false }, // Alveolar - quick
                    'viseme_kk': { expression: 'aa', intensityMultiplier: 0.9, isVowel: false }, // Velar - more open
                    'viseme_CH': { expression: 'ou', intensityMultiplier: 0.7, isVowel: false }, // Post-alveolar
                    'viseme_SS': { expression: 'ih', intensityMultiplier: 0.4, isVowel: false }, // Sibilant - tight
                    'viseme_RR': { expression: 'ou', intensityMultiplier: 0.8, isVowel: false }, // Rhotic
                    'viseme_aa': { expression: 'aa', intensityMultiplier: 1.0, isVowel: true }, // Open vowel - very open
                    'viseme_E': { expression: 'ee', intensityMultiplier: 0.9, isVowel: true },  // Mid-front vowel
                    'viseme_I': { expression: 'ih', intensityMultiplier: 0.7, isVowel: true },  // Close-front vowel
                    'viseme_O': { expression: 'oh', intensityMultiplier: 1.0, isVowel: true },  // Mid-back vowel - rounded
                    'viseme_U': { expression: 'ou', intensityMultiplier: 0.9, isVowel: true },  // Close-back vowel
                    // Direct VRM expressions with intensity scaling
                    'aa': { expression: 'aa', intensityMultiplier: 1.0, isVowel: true },
                    'ih': { expression: 'ih', intensityMultiplier: 0.7, isVowel: true },
                    'ou': { expression: 'ou', intensityMultiplier: 0.9, isVowel: true },
                    'ee': { expression: 'ee', intensityMultiplier: 0.9, isVowel: true },
                    'oh': { expression: 'oh', intensityMultiplier: 1.0, isVowel: true }
                };

                const mapping = vrmExpressionMap[targetName];
                if (mapping && vrm.expressionManager!.expressionMap[mapping.expression]) {
                    // Apply advanced intensity calculation
                    const baseIntensity = mapping.isVowel ? VOWEL_BOOST : INTENSITY_BOOST;
                    const targetWeight = Math.min(1.0, weight * mapping.intensityMultiplier * baseIntensity);
                    const currentWeight = morphSmoothingRef.current[mapping.expression] || 0;

                    // Ultra-smooth transition with adaptive smoothing
                    const adaptiveSmoothingFactor = mapping.isVowel ? SMOOTHING_FACTOR * 0.8 : SMOOTHING_FACTOR;
                    const smoothedWeight = currentWeight + (targetWeight - currentWeight) * adaptiveSmoothingFactor;

                    // Apply only if change is significant
                    if (Math.abs(smoothedWeight - currentWeight) > MIN_CHANGE_THRESHOLD) {
                        morphSmoothingRef.current[mapping.expression] = smoothedWeight;
                        vrm.expressionManager!.setValue(mapping.expression, smoothedWeight);
                        appliedCount++;

                        if (smoothedWeight > 0.05) { // Only log significant values
                            console.log(`🎭 💎 CINEMA: ${mapping.expression} = ${smoothedWeight.toFixed(3)} (${mapping.isVowel ? 'VOWEL' : 'CONS'})`);
                        }
                    }
                }
            });
        }

        // Method 2: Direct morph target manipulation (fallback)
        if (appliedCount === 0) {
            vrm.scene.traverse((child) => {
                if (child instanceof THREE.Mesh && child.morphTargetDictionary && child.morphTargetInfluences) {
                    // Reset all mouth-related morph targets
                    const mouthTargets = ['Head_A', 'Head_I', 'Head_U', 'Head_E', 'Head_O',
                        'aa', 'ih', 'ou', 'ee', 'oh', 'neutral',
                        'mouthOpen', 'mouthClose', 'mouthSmile', 'mouthFrown',
                        'mouthPucker', 'mouthFunnel', 'jawOpen'];

                    mouthTargets.forEach(target => {
                        const index = child.morphTargetDictionary![target];
                        if (index !== undefined && index < child.morphTargetInfluences!.length) {
                            child.morphTargetInfluences![index] = 0;
                        }
                    });

                    // Apply professional morph weights
                    Object.entries(morphWeights).forEach(([targetName, weight]) => {
                        // Map professional targets to VRM morph targets
                        const morphTargetMap: Record<string, string[]> = {
                            'viseme_sil': ['neutral'],
                            'viseme_PP': ['Head_A', 'aa', 'mouthClose'],
                            'viseme_FF': ['Head_U', 'ou', 'mouthPucker'],
                            'viseme_TH': ['Head_E', 'ee'],
                            'viseme_DD': ['Head_A', 'aa', 'mouthOpen'],
                            'viseme_kk': ['Head_A', 'aa', 'mouthOpen', 'jawOpen'],
                            'viseme_CH': ['Head_U', 'ou', 'mouthFunnel'],
                            'viseme_SS': ['Head_I', 'ih', 'mouthSmile'],
                            'viseme_RR': ['Head_U', 'ou', 'mouthFunnel'],
                            'viseme_aa': ['Head_A', 'aa', 'mouthOpen', 'jawOpen'],
                            'viseme_E': ['Head_E', 'ee', 'mouthSmile'],
                            'viseme_I': ['Head_I', 'ih', 'mouthSmile'],
                            'viseme_O': ['Head_O', 'oh', 'mouthPucker'],
                            'viseme_U': ['Head_U', 'ou', 'mouthPucker', 'mouthFunnel']
                        };

                        const targets = morphTargetMap[targetName] || [targetName];
                        targets.forEach(target => {
                            const index = child.morphTargetDictionary![target];
                            if (index !== undefined && index < child.morphTargetInfluences!.length) {
                                child.morphTargetInfluences![index] = Math.max(
                                    child.morphTargetInfluences![index],
                                    weight
                                );
                                appliedCount++;
                                console.log(`🎭 Professional Morph: ${target} = ${weight.toFixed(3)}`);
                            }
                        });
                    });
                }
            });
        }

        if (appliedCount === 0) {
            console.warn('⚠️ No professional morph targets could be applied');
        }
    };

    // PROFESSIONAL-GRADE INDISTINGUISHABLE LIP SYNC WITH ACCENT ENGINE
    const startLipSyncWithAudio = async (text: string) => {
        console.log('🎭 🚀 Starting PROFESSIONAL-GRADE lip sync with accent adaptation for:', text);
        setIsSpeaking(true);

        // Detect language from text
        const detectionResult = languageDetectionService.processText(text);
        console.log(`🌍 Language detection result: ${detectionResult.language} (confidence: ${detectionResult.confidence.toFixed(2)})`);

        // Get current accent profile (may be transitioning)
        let currentAccentProfile = accentProfileRef.current;
        if (accentTransitionSystemRef.current?.isTransitioning()) {
            const blendedProfile = accentTransitionSystemRef.current.updateTransition();
            if (blendedProfile) {
                currentAccentProfile = blendedProfile;
                console.log(`🎭 Using blended accent profile (${(blendedProfile.blendRatio * 100).toFixed(1)}% transition)`);
            }
        }

        // Update MovementOrchestrator state to speaking
        if (movementOrchestratorRef.current) {
            movementOrchestratorRef.current.changeState('speaking', {
                isQuestion: text.includes('?'),
                isExplanation: text.includes('because') || text.includes('therefore'),
                emphasisLevel: text.includes('!') ? 'high' : 'medium',
                culturalContext: culturalProfileRef.current.region,
                language: currentAccentProfile.language,
                speechContent: text
            });
        }

        // Update legacy speech movement engine for backward compatibility
        if (speechMovementEngineRef.current) {
            speechMovementEngineRef.current.updateConversationFlow(false, true, text.includes('?'));
        }

        // CRITICAL TIMING CONFIGURATION FOR PERFECT SYNC
        const TIMING_OFFSET_MS = -300; // Start lip sync 300ms BEFORE audio for perfect sync
        const PREDICTIVE_BUFFER_MS = 400; // Look ahead for smoother transitions

        if (!modelRef.current || !lipSyncEngineRef.current || !phonemePreprocessorRef.current || !accentEngineRef.current) {
            console.warn('🎭 Professional lip sync components not available');
            setIsSpeaking(false);
            return;
        }

        try {
            if (!ttsService) {
                throw new Error('TTS service not available');
            }

            console.log('🎭 🧠 PHASE 1: Advanced phoneme preprocessing...');

            // PHASE 1: Professional phoneme preprocessing with detected language
            const currentLanguage = currentAccentProfile.language;
            const processedSpeechData = phonemePreprocessorRef.current.processText(text, currentLanguage);
            console.log('🎭 ✅ Professional phoneme analysis:', {
                duration: processedSpeechData.duration,
                phonemeCount: processedSpeechData.phonemes.length,
                wordCount: processedSpeechData.words.length,
                language: currentLanguage
            });

            // PHASE 2: Apply accent adaptation
            console.log('🎭 🌍 PHASE 2: Accent adaptation...');
            const accentedSpeechData: AccentedSpeechData = accentEngineRef.current.adaptAccent(
                processedSpeechData.phonemes,
                currentLanguage
            );
            console.log('🎭 ✅ Accent adaptation complete:', {
                accentMarkers: accentedSpeechData.accentMarkers.length,
                headMovementCues: accentedSpeechData.headMovementCues.length,
                speechRate: accentedSpeechData.speechTiming.speechRate
            });

            // PHASE 3: Get TTS phoneme data for cross-validation and timing adjustment
            console.log('🎭 🔊 PHASE 3: TTS phoneme cross-validation...');
            const ttsLipSyncData = await ttsService.synthesizeForLipSync(text, {
                speed: 0.85,
                language: currentLanguage
            });

            // PHASE 4: Merge and optimize phoneme data with accent modifications
            console.log('🎭 ⚡ PHASE 4: Phoneme data fusion with accent optimization...');
            const optimizedPhonemes = mergeAndOptimizePhonemeData(
                accentedSpeechData.modifiedPhonemes,
                ttsLipSyncData.phonemes
            );

            console.log('🎭 ✅ Optimized phoneme data with accent:', {
                originalCount: processedSpeechData.phonemes.length,
                accentedCount: accentedSpeechData.modifiedPhonemes.length,
                ttsCount: ttsLipSyncData.phonemes.length,
                optimizedCount: optimizedPhonemes.length
            });

            // PHASE 5: Initialize professional lip sync engine with accent-modified phonemes
            console.log('🎭 🎯 PHASE 5: Initializing professional lip sync engine with accent...');
            lipSyncEngineRef.current.initialize(optimizedPhonemes);

            // PHASE 6: Setup professional lip sync callback with movement orchestration
            const lipSyncCallback = (state: LipSyncState, morphWeights: MorphTargetWeights) => {
                if (modelRef.current) {
                    applyProfessionalMorphTargets(modelRef.current, morphWeights);
                    console.log(`🎭 💎 Professional with accent: ${state.currentPhoneme} → ${state.currentViseme} (${state.intensity.toFixed(3)})`);
                }
            };

            // PHASE 7: Start synchronized professional audio and lip sync
            console.log('🔊 🎯 PHASE 7: Starting PROFESSIONAL synchronized audio and lip sync with accent...');

            // PHASE 8: Ultra-precise timing synchronization with predictive animation
            console.log('🔊 ⚡ PHASE 8: Ultra-precise timing synchronization...');

            let audioStartTime = 0;
            let lipSyncStartTime = 0;
            const TIMING_OFFSET_MS = -150; // Start lip sync 150ms BEFORE audio for perfect sync
            const PREDICTIVE_BUFFER_MS = 100; // Look ahead for smoother transitions

            // Enhanced lip sync callback with timing compensation
            const enhancedLipSyncCallback = (state: LipSyncState, morphWeights: MorphTargetWeights) => {
                if (modelRef.current) {
                    // Apply timing compensation and predictive smoothing
                    const currentTime = performance.now() - lipSyncStartTime;
                    const audioTime = performance.now() - audioStartTime;
                    const timingDrift = audioTime - currentTime;

                    // Log timing for calibration
                    if (Math.abs(timingDrift) > 20) {
                        console.log(`🎯 Timing drift: ${timingDrift.toFixed(1)}ms`);
                    }

                    // Apply enhanced morph targets with smoothing
                    applyProfessionalMorphTargets(modelRef.current, morphWeights);
                    console.log(`🎭 💎 SYNC: ${state.currentPhoneme} → ${state.currentViseme} (${state.intensity.toFixed(3)}) [${timingDrift.toFixed(1)}ms]`);
                }
            };

            // Create accent modifications based on current accent profile
            const accentModifications = {
                speechRate: currentAccentProfile.speechRhythm.beatsPerMinute / 140, // Normalize to English baseline
                pitch: currentAccentProfile.headMovementStyle.emphasisStyle === 'expressive' ? 2 :
                    currentAccentProfile.headMovementStyle.emphasisStyle === 'subtle' ? -1 : 0,
                emphasis: currentAccentProfile.headMovementStyle.nodFrequency,
                pauseDuration: 1.0
            };

            await ttsService.speak(
                text,
                {
                    speed: 0.85,
                    language: currentLanguage,
                    accentModifications
                },
                () => {
                    audioStartTime = performance.now();
                    console.log('🔊 ✅ Audio started - beginning ULTRA-PRECISE lip sync');

                    // Start lip sync with timing offset for perfect synchronization
                    // For negative offsets, start immediately (lip sync leads audio)
                    const delayMs = TIMING_OFFSET_MS < 0 ? 0 : TIMING_OFFSET_MS;
                    setTimeout(() => {
                        lipSyncStartTime = performance.now() + TIMING_OFFSET_MS; // Adjust start time for negative offset
                        lipSyncEngineRef.current?.start(enhancedLipSyncCallback);
                        console.log(`🎯 Lip sync started with ${TIMING_OFFSET_MS}ms offset (delay: ${delayMs}ms)`);
                    }, delayMs);
                },
                () => {
                    console.log('🔊 ✅ Audio completed - stopping professional lip sync');
                    lipSyncEngineRef.current?.stop();
                    setIsSpeaking(false);

                    // Update MovementOrchestrator state to idle
                    if (movementOrchestratorRef.current) {
                        movementOrchestratorRef.current.changeState('idle');
                    }

                    // Update legacy speech movement engine conversation flow
                    if (speechMovementEngineRef.current) {
                        speechMovementEngineRef.current.updateConversationFlow(true, false, false);
                    }

                    onSpeechComplete?.();
                },
                (error) => {
                    console.error('🔊 ❌ Audio error:', error);
                    lipSyncEngineRef.current?.stop();
                    setIsSpeaking(false);

                    // Update MovementOrchestrator state to idle
                    if (movementOrchestratorRef.current) {
                        movementOrchestratorRef.current.changeState('idle');
                    }

                    // Update legacy speech movement engine conversation flow
                    if (speechMovementEngineRef.current) {
                        speechMovementEngineRef.current.updateConversationFlow(true, false, false);
                    }

                    onSpeechComplete?.();
                }
            );

        } catch (error) {
            console.error('🎭 💥 Professional lip sync failed:', error);
            lipSyncEngineRef.current?.stop();
            startSimpleLipSync(text);
        }
    };

    // Advanced phoneme data fusion algorithm
    const mergeAndOptimizePhonemeData = (
        preprocessedPhonemes: PhonemeData[],
        ttsPhonemes: Array<{ phoneme: string; timestamp: number; confidence: number }>
    ): PhonemeData[] => {
        console.log('🎭 🔬 Merging phoneme data sources...');

        // Convert TTS phonemes to PhonemeData format
        const convertedTTSPhonemes = phonemePreprocessorRef.current!.convertPhonemesToVisemes(ttsPhonemes);

        // Use TTS timing but preprocessed phoneme accuracy
        const mergedPhonemes: PhonemeData[] = [];

        // If TTS has timing data, use it; otherwise use preprocessed timing
        if (convertedTTSPhonemes.length > 0) {
            // Use TTS timing with preprocessed phoneme mapping
            convertedTTSPhonemes.forEach((ttsPhoneme, index) => {
                // Find corresponding preprocessed phoneme for better accuracy
                const matchingPreprocessed = preprocessedPhonemes.find(p =>
                    p.phoneme === ttsPhoneme.phoneme ||
                    Math.abs(p.startTime - ttsPhoneme.startTime) < 100
                );

                mergedPhonemes.push({
                    phoneme: matchingPreprocessed?.phoneme || ttsPhoneme.phoneme,
                    startTime: ttsPhoneme.startTime,
                    endTime: ttsPhoneme.endTime,
                    confidence: Math.max(ttsPhoneme.confidence, matchingPreprocessed?.confidence || 0),
                    viseme: matchingPreprocessed?.viseme || ttsPhoneme.viseme
                });
            });
        } else {
            // Fallback to preprocessed data
            mergedPhonemes.push(...preprocessedPhonemes);
        }

        // Apply timing smoothing and optimization
        return optimizePhonemeTimings(mergedPhonemes);
    };

    // Phoneme timing optimization for ultra-smooth lip sync
    const optimizePhonemeTimings = (phonemes: PhonemeData[]): PhonemeData[] => {
        console.log('🎭 ⚡ Optimizing phoneme timings for ultra-smooth animation...');

        return phonemes.map((phoneme, index) => {
            const nextPhoneme = phonemes[index + 1];
            const prevPhoneme = phonemes[index - 1];

            // Ensure minimum duration for visibility
            const minDuration = 50;
            const maxDuration = 300;
            let duration = phoneme.endTime - phoneme.startTime;

            // Adjust duration based on phoneme type
            if (phoneme.phoneme === 'SIL') {
                duration = Math.min(duration, 150); // Shorter silences
            } else if (['AA', 'AE', 'AO', 'AW', 'AY', 'EY', 'OW', 'OY'].includes(phoneme.phoneme)) {
                duration = Math.max(duration, 80); // Longer vowels
            }

            duration = Math.max(minDuration, Math.min(maxDuration, duration));

            return {
                ...phoneme,
                endTime: phoneme.startTime + duration,
                confidence: Math.min(1.0, phoneme.confidence * 1.1) // Boost confidence slightly
            };
        });
    };

    // Fallback simple lip sync (text-based) with TTS audio
    const startSimpleLipSync = (text: string) => {
        console.log('🎭 Starting simple lip sync with TTS audio for:', text);

        if (!modelRef.current) {
            console.warn('🎭 No VRM model available for simple lip sync');
            setIsSpeaking(false);
            return;
        }

        // Update MovementOrchestrator state
        if (movementOrchestratorRef.current) {
            movementOrchestratorRef.current.changeState('speaking', {
                isQuestion: text.includes('?'),
                isExplanation: false,
                emphasisLevel: 'medium',
                culturalContext: culturalProfileRef.current.region,
                language: accentProfileRef.current.language,
                speechContent: text
            });
        }

        // Update legacy speech movement engine conversation flow
        if (speechMovementEngineRef.current) {
            speechMovementEngineRef.current.updateConversationFlow(false, true, text.includes('?'));
        }

        // Start TTS audio playback even in fallback mode
        if (ttsService && ttsService.isSupported()) {
            console.log('🔊 Starting TTS audio in fallback mode...');
            const currentLanguage = accentProfileRef.current.language;

            // Create accent modifications for fallback TTS
            const accentModifications = {
                speechRate: accentProfileRef.current.speechRhythm.beatsPerMinute / 140,
                pitch: accentProfileRef.current.headMovementStyle.emphasisStyle === 'expressive' ? 2 :
                    accentProfileRef.current.headMovementStyle.emphasisStyle === 'subtle' ? -1 : 0,
                emphasis: accentProfileRef.current.headMovementStyle.nodFrequency,
                pauseDuration: 1.0
            };

            ttsService.speak(
                text,
                {
                    speed: 0.85,
                    language: currentLanguage,
                    accentModifications
                },
                () => {
                    console.log('🔊 Fallback TTS audio started');
                },
                () => {
                    console.log('🔊 Fallback TTS audio completed');
                    if (modelRef.current) {
                        applyMouthShape(modelRef.current, 'Head_A', 0);
                    }
                    setIsSpeaking(false);

                    // Update MovementOrchestrator state to idle
                    if (movementOrchestratorRef.current) {
                        movementOrchestratorRef.current.changeState('idle');
                    }

                    // Update legacy speech movement engine conversation flow
                    if (speechMovementEngineRef.current) {
                        speechMovementEngineRef.current.updateConversationFlow(true, false, false);
                    }

                    onSpeechComplete?.();
                },
                (error) => {
                    console.error('🔊 Fallback TTS audio error:', error);
                    setIsSpeaking(false);

                    // Update MovementOrchestrator state to idle
                    if (movementOrchestratorRef.current) {
                        movementOrchestratorRef.current.changeState('idle');
                    }

                    // Update legacy speech movement engine conversation flow
                    if (speechMovementEngineRef.current) {
                        speechMovementEngineRef.current.updateConversationFlow(true, false, false);
                    }

                    onSpeechComplete?.();
                }
            );
        }

        // Simple phoneme-to-viseme mapping
        const getVisemeForChar = (char: string): string => {
            const lowerChar = char.toLowerCase();
            if ('aá'.includes(lowerChar)) return 'Head_A';
            if ('iíy'.includes(lowerChar)) return 'Head_I';
            if ('uúoó'.includes(lowerChar)) return 'Head_U';
            if ('eé'.includes(lowerChar)) return 'Head_E';
            if ('oó'.includes(lowerChar)) return 'Head_O';
            return 'Head_A';
        };

        // Animate through the text
        let charIndex = 0;
        const chars = text.split('');
        const charDuration = 150;

        const animateChar = () => {
            if (charIndex >= chars.length || !modelRef.current) {
                if (!ttsService || !ttsService.isSupported()) {
                    applyMouthShape(modelRef.current!, 'Head_A', 0);
                    setIsSpeaking(false);

                    // Update MovementOrchestrator state to idle
                    if (movementOrchestratorRef.current) {
                        movementOrchestratorRef.current.changeState('idle');
                    }

                    // Update legacy speech movement engine conversation flow
                    if (speechMovementEngineRef.current) {
                        speechMovementEngineRef.current.updateConversationFlow(true, false, false);
                    }

                    onSpeechComplete?.();
                }
                return;
            }

            const char = chars[charIndex];
            if (char !== ' ') {
                const viseme = getVisemeForChar(char);
                const intensity = 0.6 + Math.random() * 0.4;
                applyMouthShape(modelRef.current!, viseme, intensity);
            }

            charIndex++;
            setTimeout(animateChar, charDuration);
        };

        animateChar();
    };

    // Handle textToSpeak prop changes
    useEffect(() => {
        if (textToSpeak && isLoaded) {
            startLipSyncWithAudio(textToSpeak);
        }
    }, [textToSpeak, isLoaded]);

    // Handle language changes
    useEffect(() => {
        if (language !== accentProfileRef.current.language) {
            updateAccentProfile({ language });
        }
    }, [language]);

    // Handle cultural context changes
    useEffect(() => {
        if (culturalContext !== culturalProfileRef.current.region) {
            updateCulturalProfile({ region: culturalContext });
        }
    }, [culturalContext]);

    // Handle motion settings changes
    useEffect(() => {
        if (motionSettings) {
            updateMotionSettings(motionSettings);
        }
    }, [motionSettings]);

    // Function to update motion settings
    const updateMotionSettings = (newSettings: Partial<MotionSettings>) => {
        motionSettingsRef.current = { ...motionSettingsRef.current, ...newSettings };

        // Update MovementOrchestrator with new settings
        if (movementOrchestratorRef.current) {
            movementOrchestratorRef.current.updateMotionSettings(newSettings);
        }

        // Update legacy engines for backward compatibility
        if (idleAnimationEngineRef.current) {
            idleAnimationEngineRef.current.updateMotionSettings(motionSettingsRef.current);
        }
    };

    // Function to update cultural profile
    const updateCulturalProfile = (newProfile: Partial<CulturalProfile>) => {
        culturalProfileRef.current = { ...culturalProfileRef.current, ...newProfile };

        // Update MovementOrchestrator with new cultural profile
        if (movementOrchestratorRef.current) {
            movementOrchestratorRef.current.updateCulturalProfile(culturalProfileRef.current);
        }
    };

    // Function to update accent profile (for language changes)
    const updateAccentProfile = (newProfile: Partial<AccentProfile>) => {
        accentProfileRef.current = { ...accentProfileRef.current, ...newProfile };

        // Update MovementOrchestrator with new accent profile
        if (movementOrchestratorRef.current) {
            movementOrchestratorRef.current.updateAccentProfile(accentProfileRef.current);
        }
    };

    // Function to preview movements
    const previewMovement = (movementType: string) => {
        if (!movementOrchestratorRef.current || !modelRef.current) return;

        console.log(`🎭 Previewing movement: ${movementType}`);

        // Create a temporary movement context for preview
        const previewContext: MovementContext = {
            isQuestion: movementType === 'tilt',
            isExplanation: movementType === 'gesture',
            emphasisLevel: 'medium',
            culturalContext: culturalProfileRef.current.region,
            language: accentProfileRef.current.language,
            speechContent: `Preview ${movementType} movement`
        };

        // Trigger the appropriate movement state
        switch (movementType) {
            case 'nod':
                movementOrchestratorRef.current.changeState('emphasizing', previewContext);
                break;
            case 'tilt':
                movementOrchestratorRef.current.changeState('questioning', previewContext);
                break;
            case 'gesture':
                movementOrchestratorRef.current.changeState('speaking', previewContext);
                break;
            case 'idle':
                movementOrchestratorRef.current.changeState('idle', previewContext);
                break;
        }

        // Return to idle after preview
        setTimeout(() => {
            if (movementOrchestratorRef.current) {
                movementOrchestratorRef.current.changeState('idle');
            }
        }, 2000);
    };

    // Motion settings update function is available internally
    // If needed by parent components, this could be exposed via props or context

    useEffect(() => {
        if (!isVisible || !canvasRef.current) return;

        console.log('🔄 Starting VRM setup...');

        // Enhanced Renderer setup for better quality
        const canvas = canvasRef.current;
        const renderer = new THREE.WebGLRenderer({
            canvas,
            alpha: true,
            antialias: true,
            powerPreference: "high-performance",
            preserveDrawingBuffer: true
        });
        renderer.setSize(250, 300);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.0;

        rendererRef.current = renderer;

        // Camera
        const camera = new THREE.PerspectiveCamera(35, 250 / 300, 0.1, 1000);
        camera.position.set(0, 1.2, 1.6);

        // Enhanced Lighting Setup
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        sceneRef.current.add(ambientLight);

        const keyLight = new THREE.DirectionalLight(0xffffff, 0.8);
        keyLight.position.set(2, 3, 2);
        keyLight.castShadow = true;
        keyLight.shadow.mapSize.width = 1024;
        keyLight.shadow.mapSize.height = 1024;
        keyLight.shadow.camera.near = 0.1;
        keyLight.shadow.camera.far = 10;
        sceneRef.current.add(keyLight);

        const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
        fillLight.position.set(-1, 1, 1);
        sceneRef.current.add(fillLight);

        const rimLight = new THREE.DirectionalLight(0xffffff, 0.2);
        rimLight.position.set(0, 1, -2);
        sceneRef.current.add(rimLight);

        // Load VRM
        const loader = new GLTFLoader();
        loader.register((parser) => new VRMLoaderPlugin(parser));

        console.log('🔄 Loading VRM file...');
        loader.load(
            '/models/viverse_avatar_model_164400.vrm',
            (gltf) => {
                console.log('✅ GLTF loaded:', gltf);
                const vrm = gltf.userData.vrm as VRM;
                if (vrm) {
                    console.log('✅ VRM found:', vrm);

                    // Rotate the VRM to face forward (180 degrees around Y-axis)
                    vrm.scene.rotation.y = Math.PI;

                    // Position the VRM (center it and adjust height)
                    const box = new THREE.Box3().setFromObject(vrm.scene);
                    const center = box.getCenter(new THREE.Vector3());
                    const size = box.getSize(new THREE.Vector3());

                    vrm.scene.position.x = -center.x;
                    vrm.scene.position.z = -center.z;
                    vrm.scene.position.y = -center.y + size.y * 0.3;

                    const maxDim = Math.max(size.x, size.y, size.z);
                    if (maxDim > 2) {
                        const scale = 1.8 / maxDim;
                        vrm.scene.scale.setScalar(scale);
                    }

                    // Position arms naturally at sides
                    if (vrm.humanoid) {
                        console.log('🔄 Positioning arms naturally...');

                        try {
                            const leftShoulder = vrm.humanoid.getNormalizedBoneNode('leftShoulder');
                            const rightShoulder = vrm.humanoid.getNormalizedBoneNode('rightShoulder');
                            const leftUpperArm = vrm.humanoid.getNormalizedBoneNode('leftUpperArm');
                            const rightUpperArm = vrm.humanoid.getNormalizedBoneNode('rightUpperArm');
                            const leftLowerArm = vrm.humanoid.getNormalizedBoneNode('leftLowerArm');
                            const rightLowerArm = vrm.humanoid.getNormalizedBoneNode('rightLowerArm');
                            const leftHand = vrm.humanoid.getNormalizedBoneNode('leftHand');
                            const rightHand = vrm.humanoid.getNormalizedBoneNode('rightHand');

                            if (leftShoulder) leftShoulder.quaternion.set(0, 0, 0, 1);
                            if (rightShoulder) rightShoulder.quaternion.set(0, 0, 0, 1);

                            if (leftUpperArm) {
                                const rotation = new THREE.Euler(
                                    THREE.MathUtils.degToRad(-150),
                                    THREE.MathUtils.degToRad(-45),
                                    THREE.MathUtils.degToRad(-30)
                                );
                                leftUpperArm.quaternion.setFromEuler(rotation);
                            }

                            if (rightUpperArm) {
                                const rotation = new THREE.Euler(
                                    THREE.MathUtils.degToRad(-150),
                                    THREE.MathUtils.degToRad(45),
                                    THREE.MathUtils.degToRad(30)
                                );
                                rightUpperArm.quaternion.setFromEuler(rotation);
                            }

                            if (leftLowerArm) leftLowerArm.quaternion.set(0, 0, 0, 1);
                            if (rightLowerArm) rightLowerArm.quaternion.set(0, 0, 0, 1);
                            if (leftHand) leftHand.quaternion.set(0, 0, 0, 1);
                            if (rightHand) rightHand.quaternion.set(0, 0, 0, 1);

                            console.log('✅ Arms positioned naturally');
                        } catch (error) {
                            console.warn('⚠️ Could not adjust arm positions:', error);
                        }
                    }

                    sceneRef.current.add(vrm.scene);
                    modelRef.current = vrm;

                    setIsLoaded(true);
                    console.log('✅ VRM positioned and ready');
                } else {
                    console.error('❌ No VRM data found');
                    setError('No VRM data found in file');
                }
            },
            (progress) => {
                const percent = Math.round((progress.loaded / progress.total) * 100);
                console.log(`📈 Loading: ${percent}%`);
            },
            (err) => {
                console.error('❌ Failed to load VRM:', err);
                setError('Failed to load VRM file');
            }
        );

        // Enhanced Animation loop with purposeful idle movements
        const animate = () => {
            animationIdRef.current = requestAnimationFrame(animate);

            const delta = clock.getDelta();
            const elapsedTime = clock.getElapsedTime();

            if (modelRef.current && modelRef.current.humanoid && movementOrchestratorRef.current) {
                const vrm = modelRef.current;
                const state = animationStateRef.current;

                // Update legacy state for compatibility
                state.headLookTime += delta;
                state.blinkTime += delta;
                state.breatheTime += delta;
                state.idleTime += delta;

                // Update accent transition if active
                if (accentTransitionSystemRef.current?.isTransitioning()) {
                    const blendedProfile = accentTransitionSystemRef.current.updateTransition();
                    if (blendedProfile) {
                        // Update the accent profile reference for smooth transitions
                        accentProfileRef.current = blendedProfile;

                        // Update MovementOrchestrator with the transitioning accent profile
                        movementOrchestratorRef.current.updateAccentProfile(blendedProfile);
                    }
                }

                // Use MovementOrchestrator for coordinated movement system
                const movementResult: MovementOrchestrationResult = movementOrchestratorRef.current.update(delta);

                // Apply head movements from MovementOrchestrator
                const head = vrm.humanoid.getNormalizedBoneNode('head');
                if (head && motionSettingsRef.current.enableHeadMovements) {
                    head.rotation.x = movementResult.headRotation.x;
                    head.rotation.y = movementResult.headRotation.y;
                    head.rotation.z = movementResult.headRotation.z;
                }

                // Apply morph targets from MovementOrchestrator
                if (movementResult.morphTargets.length > 0 && vrm.expressionManager) {
                    movementResult.morphTargets.forEach(target => {
                        if (vrm.expressionManager!.expressionMap[target.targetName]) {
                            const currentValue = vrm.expressionManager!.getValue(target.targetName) || 0;
                            const blendedValue = target.blendMode === 'additive' ?
                                Math.min(1.0, currentValue + target.weight) :
                                target.blendMode === 'multiply' ? currentValue * target.weight : target.weight;
                            vrm.expressionManager!.setValue(target.targetName, blendedValue);
                        }
                    });
                }

                // Fallback to legacy system if MovementOrchestrator is in idle state
                if (movementResult.currentState === 'idle' && idleAnimationEngineRef.current) {
                    const idleResult: IdleAnimationResult = idleAnimationEngineRef.current.updateIdleAnimations(delta, elapsedTime);

                    // Apply natural blinking (enhanced system)
                    if (idleResult.shouldBlink) {
                        applyBlinkToVRM(vrm, idleResult.blinkWeight);
                    } else {
                        // Use fallback blinking system if idle engine doesn't trigger blink
                        handleBlinking(vrm, state, elapsedTime * 1000);
                    }

                    // Apply natural breathing animation (enhanced)
                    const spine = vrm.humanoid.getNormalizedBoneNode('spine');
                    if (spine) {
                        spine.rotation.x = idleResult.spineRotation.x;
                        spine.rotation.y = idleResult.spineRotation.y;
                        spine.rotation.z = idleResult.spineRotation.z;
                    }

                    // Apply subtle body sway (replaces random torso movement)
                    const hips = vrm.humanoid.getNormalizedBoneNode('hips');
                    if (hips) {
                        hips.rotation.x = idleResult.hipsRotation.x;
                        hips.rotation.y = idleResult.hipsRotation.y;
                        hips.rotation.z = idleResult.hipsRotation.z;
                    }

                    // Blend idle head movements with orchestrator movements if not overridden
                    if (head && motionSettingsRef.current.enableHeadMovements &&
                        Math.abs(movementResult.headRotation.x) < 0.01 &&
                        Math.abs(movementResult.headRotation.y) < 0.01 &&
                        Math.abs(movementResult.headRotation.z) < 0.01) {
                        head.rotation.x = idleResult.headRotation.x;
                        head.rotation.y = idleResult.headRotation.y;
                        head.rotation.z = idleResult.headRotation.z;
                    }
                }

                console.log(`🎭 Movement State: ${movementResult.currentState} (transitioning: ${movementResult.isTransitioning})`);

                vrm.update(delta);
            }

            if (rendererRef.current && sceneRef.current) {
                rendererRef.current.render(sceneRef.current, camera);
            }
        };
        animate();

        // Cleanup function
        return () => {
            console.log('🧹 Cleaning up VRM viewer...');

            if (animationIdRef.current) {
                cancelAnimationFrame(animationIdRef.current);
                animationIdRef.current = null;
            }

            setIsSpeaking(false);

            if (modelRef.current) {
                modelRef.current = null;
            }

            if (sceneRef.current) {
                sceneRef.current.traverse((object) => {
                    if (object instanceof THREE.Mesh) {
                        object.geometry?.dispose();
                        if (object.material) {
                            if (Array.isArray(object.material)) {
                                object.material.forEach(material => material.dispose());
                            } else {
                                object.material.dispose();
                            }
                        }
                    }
                });
                sceneRef.current.clear();
            }

            if (rendererRef.current) {
                rendererRef.current.dispose();
                rendererRef.current = null;
            }

            setIsLoaded(false);
            setError(null);

            console.log('✅ VRM viewer cleanup complete');
        };
    }, [isVisible]);

    if (!isVisible) return null;

    return (
        <>
            <div className={`fixed bottom-4 right-4 z-40 ${className}`}>
                {!isLoaded && !error && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/10 rounded-lg backdrop-blur-sm">
                        <div className="flex flex-col items-center space-y-2">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            <div className="text-xs text-gray-600">Loading VRM...</div>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="absolute inset-0 flex items-center justify-center bg-red-100 rounded-lg backdrop-blur-sm">
                        <div className="flex flex-col items-center space-y-1">
                            <div className="text-red-600 text-lg">⚠️</div>
                            <div className="text-xs text-red-600 text-center px-2">{error}</div>
                        </div>
                    </div>
                )}

                <div className="relative">
                    <canvas
                        ref={canvasRef}
                        className="w-[250px] h-[300px] rounded-lg shadow-lg border border-white/20"
                        style={{ pointerEvents: 'none' }}
                    />
                    {isLoaded && (
                        <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                            <div className="text-white text-xs font-bold">V</div>
                        </div>
                    )}
                    {isSpeaking && (
                        <div className="absolute -top-2 -left-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                            <div className="text-white text-xs font-bold">🎤</div>
                        </div>
                    )}
                </div>
            </div>

            {/* Movement Configuration Panel */}
            {showConfigurationPanel && (
                <MovementConfigurationPanel
                    currentMotionSettings={motionSettingsRef.current}
                    currentCulturalProfile={culturalProfileRef.current}
                    currentAccentProfile={accentProfileRef.current}
                    onMotionSettingsChange={updateMotionSettings}
                    onCulturalProfileChange={updateCulturalProfile}
                    onAccentProfileChange={updateAccentProfile}
                    onPreviewMovement={previewMovement}
                />
            )}
        </>
    );
};

export default BasicVRMViewer;