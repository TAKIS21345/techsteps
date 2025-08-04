/**
 * SpeechSynchronizedMovementEngine - Speech-aligned head movement system
 * 
 * This class implements head movement patterns that align with speech emphasis,
 * natural conversation flow, and question-specific movements like head tilts
 * and eyebrow raises.
 * 
 * Requirements addressed:
 * - 1.1: Deliberate head movements that correspond to speech emphasis
 * - 1.4: Appropriate head nods, tilts, or gestures that align with speech content
 * - 3.2: Natural conversation flow with appropriate head positioning
 */

import {
    HeadMovement,
    Gesture,
    MovementContext,
    EmphasisData,
    SpeechAnalysis,
    QuestionMarker,
    EmphasisWord,
    MorphTargetMapping
} from './types';

export interface SpeechMovementState {
    currentMovements: HeadMovement[];
    activeGestures: Gesture[];
    speechPhase: 'idle' | 'speaking' | 'emphasizing' | 'questioning' | 'pausing';
    lastEmphasisTime: number;
    conversationFlow: ConversationFlow;
}

export interface ConversationFlow {
    isListening: boolean;
    isResponding: boolean;
    questionPending: boolean;
    emphasisLevel: number;
    naturalPauses: number[];
}

export interface SpeechMovementResult {
    headRotation: { x: number; y: number; z: number };
    morphTargets: MorphTargetMapping[];
    gestureIntensity: number;
    movementType: string;
}

export class SpeechSynchronizedMovementEngine {
    private movementState: SpeechMovementState;
    private speechAnalyzer: SpeechContentAnalyzer;
    private movementGenerator: HeadMovementGenerator;
    private gestureCoordinator: GestureCoordinator;

    constructor() {
        this.movementState = this.initializeMovementState();
        this.speechAnalyzer = new SpeechContentAnalyzer();
        this.movementGenerator = new HeadMovementGenerator();
        this.gestureCoordinator = new GestureCoordinator();
    }

    /**
     * Analyzes speech content and generates synchronized head movements
     */
    public generateSpeechMovements(
        speechContent: string,
        currentTime: number,
        context: MovementContext
    ): SpeechMovementResult {
        // Analyze speech content for emphasis and questions
        const speechAnalysis = this.speechAnalyzer.analyzeSpeechContent(speechContent, context);

        // Update movement state based on analysis
        this.updateMovementState(speechAnalysis, currentTime);

        // Generate appropriate head movements
        const headMovements = this.movementGenerator.generateMovements(
            speechAnalysis,
            this.movementState,
            currentTime
        );

        // Coordinate gestures with speech timing
        const gestures = this.gestureCoordinator.coordinateGestures(
            headMovements,
            speechAnalysis,
            currentTime
        );

        // Calculate final movement result
        return this.calculateMovementResult(headMovements, gestures, currentTime);
    }

    /**
     * Handles question-specific movements like head tilts and eyebrow raises
     */
    public generateQuestionMovements(
        questionType: 'yes_no' | 'wh_question' | 'rhetorical',
        intensity: number = 0.7
    ): SpeechMovementResult {
        const questionGestures = this.createQuestionGestures(questionType, intensity);
        const headMovements = this.createQuestionHeadMovements(questionType, intensity);

        return this.calculateMovementResult(headMovements, questionGestures, Date.now());
    }

    /**
     * Generates emphasis movements for highlighting important content
     */
    public generateEmphasisMovements(
        emphasisData: EmphasisData,
        currentTime: number
    ): SpeechMovementResult {
        const emphasisMovements = this.createEmphasisMovements(emphasisData);
        const emphasisGestures = this.createEmphasisGestures(emphasisData);

        this.movementState.lastEmphasisTime = currentTime;
        this.movementState.speechPhase = 'emphasizing';

        return this.calculateMovementResult(emphasisMovements, emphasisGestures, currentTime);
    }

    /**
     * Updates conversation flow for natural head positioning
     */
    public updateConversationFlow(
        isListening: boolean,
        isResponding: boolean,
        questionPending: boolean = false
    ): void {
        this.movementState.conversationFlow = {
            isListening,
            isResponding,
            questionPending,
            emphasisLevel: this.movementState.conversationFlow.emphasisLevel,
            naturalPauses: this.movementState.conversationFlow.naturalPauses
        };

        // Adjust speech phase based on conversation flow
        if (isListening) {
            this.movementState.speechPhase = 'idle';
        } else if (isResponding) {
            this.movementState.speechPhase = 'speaking';
        }
    }

    /**
     * Initializes movement state
     */
    private initializeMovementState(): SpeechMovementState {
        return {
            currentMovements: [],
            activeGestures: [],
            speechPhase: 'idle',
            lastEmphasisTime: 0,
            conversationFlow: {
                isListening: false,
                isResponding: false,
                questionPending: false,
                emphasisLevel: 0,
                naturalPauses: []
            }
        };
    }

    /**
     * Updates movement state based on speech analysis
     */
    private updateMovementState(analysis: SpeechAnalysis, currentTime: number): void {
        // Update speech phase based on analysis
        if (analysis.questions.length > 0) {
            this.movementState.speechPhase = 'questioning';
        } else if (analysis.emphasis.overallIntensity > 0.7) {
            this.movementState.speechPhase = 'emphasizing';
        } else {
            this.movementState.speechPhase = 'speaking';
        }

        // Update conversation flow
        this.movementState.conversationFlow.emphasisLevel = analysis.emphasis.overallIntensity;
        this.movementState.conversationFlow.naturalPauses = analysis.pauses.map(p => p.startTime);
    }

    /**
     * Creates question-specific gestures
     */
    private createQuestionGestures(
        questionType: 'yes_no' | 'wh_question' | 'rhetorical',
        intensity: number
    ): Gesture[] {
        const gestures: Gesture[] = [];

        switch (questionType) {
            case 'yes_no':
                gestures.push({
                    type: 'head_tilt',
                    intensity: intensity * 0.8,
                    duration: 800,
                    timing: 0,
                    morphTargets: [
                        { targetName: 'head_tilt_curious', weight: intensity * 0.8, blendMode: 'replace' },
                        { targetName: 'eyebrow_raise_slight', weight: intensity * 0.6, blendMode: 'additive' }
                    ]
                });
                break;

            case 'wh_question':
                gestures.push({
                    type: 'head_tilt',
                    intensity: intensity,
                    duration: 1000,
                    timing: 0,
                    morphTargets: [
                        { targetName: 'head_tilt_inquisitive', weight: intensity, blendMode: 'replace' },
                        { targetName: 'eyebrow_raise_both', weight: intensity * 0.8, blendMode: 'additive' },
                        { targetName: 'eye_focus_intent', weight: intensity * 0.5, blendMode: 'additive' }
                    ]
                });
                break;

            case 'rhetorical':
                gestures.push({
                    type: 'head_nod',
                    intensity: intensity * 0.4,
                    duration: 600,
                    timing: 0,
                    morphTargets: [
                        { targetName: 'head_nod_knowing', weight: intensity * 0.4, blendMode: 'replace' }
                    ]
                });
                break;
        }

        return gestures;
    }

    /**
     * Creates question-specific head movements
     */
    private createQuestionHeadMovements(
        questionType: 'yes_no' | 'wh_question' | 'rhetorical',
        intensity: number
    ): HeadMovement[] {
        const movements: HeadMovement[] = [];

        switch (questionType) {
            case 'yes_no':
                movements.push({
                    type: 'tilt',
                    direction: 'right',
                    intensity: intensity * 0.7,
                    duration: 800,
                    startTime: 0,
                    easing: 'ease_in_out'
                });
                break;

            case 'wh_question':
                movements.push({
                    type: 'tilt',
                    direction: 'left',
                    intensity: intensity * 0.8,
                    duration: 1000,
                    startTime: 0,
                    easing: 'ease_in_out'
                });
                movements.push({
                    type: 'nod',
                    direction: 'down',
                    intensity: intensity * 0.3,
                    duration: 400,
                    startTime: 200,
                    easing: 'ease_out'
                });
                break;

            case 'rhetorical':
                movements.push({
                    type: 'nod',
                    direction: 'down',
                    intensity: intensity * 0.5,
                    duration: 600,
                    startTime: 0,
                    easing: 'ease_in_out'
                });
                break;
        }

        return movements;
    }

    /**
     * Creates emphasis movements for important content
     */
    private createEmphasisMovements(emphasisData: EmphasisData): HeadMovement[] {
        const movements: HeadMovement[] = [];

        emphasisData.words.forEach((word, index) => {
            if (word.intensity > 0.6) {
                movements.push({
                    type: 'nod',
                    direction: 'down',
                    intensity: word.intensity,
                    duration: Math.min(400, word.endTime - word.startTime),
                    startTime: word.startTime,
                    easing: 'ease_in_out'
                });
            }
        });

        return movements;
    }

    /**
     * Creates emphasis gestures for important content
     */
    private createEmphasisGestures(emphasisData: EmphasisData): Gesture[] {
        const gestures: Gesture[] = [];

        if (emphasisData.overallIntensity > 0.8) {
            gestures.push({
                type: 'emphasis',
                intensity: emphasisData.overallIntensity,
                duration: 500,
                timing: 0,
                morphTargets: [
                    { targetName: 'head_forward_emphasis', weight: emphasisData.overallIntensity * 0.6, blendMode: 'replace' },
                    { targetName: 'eyebrow_emphasis_strong', weight: emphasisData.overallIntensity * 0.8, blendMode: 'additive' },
                    { targetName: 'eye_intensity', weight: emphasisData.overallIntensity * 0.5, blendMode: 'additive' }
                ]
            });
        }

        return gestures;
    }

    /**
     * Calculates final movement result from head movements and gestures
     */
    private calculateMovementResult(
        headMovements: HeadMovement[],
        gestures: Gesture[],
        currentTime: number
    ): SpeechMovementResult {
        let headRotation = { x: 0, y: 0, z: 0 };
        let morphTargets: MorphTargetMapping[] = [];
        let gestureIntensity = 0;
        let movementType = 'neutral';

        // Calculate head rotation from movements
        headMovements.forEach(movement => {
            const intensity = movement.intensity;

            switch (movement.type) {
                case 'nod':
                    headRotation.x += movement.direction === 'up' ? -intensity * 0.3 : intensity * 0.3;
                    movementType = 'nod';
                    break;
                case 'tilt':
                    headRotation.z += movement.direction === 'left' ? -intensity * 0.25 : intensity * 0.25;
                    movementType = 'tilt';
                    break;
                case 'turn':
                    headRotation.y += movement.direction === 'left' ? -intensity * 0.4 : intensity * 0.4;
                    movementType = 'turn';
                    break;
                case 'shake':
                    headRotation.y += Math.sin(currentTime * 0.01) * intensity * 0.2;
                    movementType = 'shake';
                    break;
            }
        });

        // Collect morph targets from gestures
        gestures.forEach(gesture => {
            gestureIntensity = Math.max(gestureIntensity, gesture.intensity);
            morphTargets.push(...gesture.morphTargets);

            if (gesture.type === 'emphasis') {
                movementType = 'emphasis';
            } else if (gesture.type === 'head_tilt') {
                movementType = 'question';
            }
        });

        return {
            headRotation,
            morphTargets,
            gestureIntensity,
            movementType
        };
    }

    /**
     * Gets current movement state
     */
    public getMovementState(): SpeechMovementState {
        return { ...this.movementState };
    }

    /**
     * Resets movement state
     */
    public resetMovementState(): void {
        this.movementState = this.initializeMovementState();
    }
}

/**
 * Speech content analyzer for detecting emphasis and questions
 */
class SpeechContentAnalyzer {
    public analyzeSpeechContent(speechContent: string, context: MovementContext): SpeechAnalysis {
        const words = speechContent.toLowerCase().split(/\s+/);
        const questions = this.detectQuestions(speechContent);
        const emphasis = this.detectEmphasis(speechContent, context);
        const pauses = this.detectPauses(speechContent);

        return {
            sentiment: this.analyzeSentiment(speechContent),
            energy: context.emphasisLevel === 'high' ? 0.8 : context.emphasisLevel === 'medium' ? 0.6 : 0.4,
            pace: words.length * 2, // Rough words per minute estimate
            questions,
            emphasis,
            pauses
        };
    }

    private detectQuestions(text: string): QuestionMarker[] {
        const questions: QuestionMarker[] = [];
        const sentences = text.split(/[.!?]+/);
        let currentTime = 0;

        sentences.forEach(sentence => {
            const trimmed = sentence.trim();
            if (trimmed.endsWith('?') || this.isQuestionPattern(trimmed)) {
                const duration = trimmed.length * 100; // Rough timing
                questions.push({
                    startTime: currentTime,
                    endTime: currentTime + duration,
                    type: this.classifyQuestionType(trimmed),
                    confidence: 0.8
                });
            }
            currentTime += trimmed.length * 100;
        });

        return questions;
    }

    private detectEmphasis(text: string, context: MovementContext): EmphasisData {
        const words = text.split(/\s+/);
        const emphasisWords: EmphasisWord[] = [];
        let currentTime = 0;

        words.forEach(word => {
            const intensity = this.calculateWordEmphasis(word, context);
            if (intensity > 0.3) {
                const duration = word.length * 80;
                emphasisWords.push({
                    word,
                    startTime: currentTime,
                    endTime: currentTime + duration,
                    intensity,
                    type: 'stress'
                });
            }
            currentTime += word.length * 80 + 50; // Word duration + space
        });

        return {
            words: emphasisWords,
            overallIntensity: context.emphasisLevel === 'high' ? 0.9 : context.emphasisLevel === 'medium' ? 0.6 : 0.3,
            type: context.isQuestion ? 'question' : context.isExplanation ? 'explanation' : 'statement'
        };
    }

    private detectPauses(text: string) {
        // Simple pause detection based on punctuation
        const pauses = [];
        let currentTime = 0;

        for (let i = 0; i < text.length; i++) {
            if (['.', ',', ';', ':', '!', '?'].includes(text[i])) {
                pauses.push({
                    startTime: currentTime,
                    duration: text[i] === '.' ? 300 : 150,
                    type: 'sentence_end' as const
                });
            }
            currentTime += 80; // Rough character timing
        }

        return pauses;
    }

    private isQuestionPattern(text: string): boolean {
        const questionWords = ['what', 'where', 'when', 'why', 'how', 'who', 'which', 'can', 'could', 'would', 'should', 'do', 'does', 'did', 'is', 'are', 'was', 'were'];
        const firstWord = text.trim().split(' ')[0].toLowerCase();
        return questionWords.includes(firstWord);
    }

    private classifyQuestionType(text: string): 'yes_no' | 'wh_question' | 'rhetorical' {
        const whWords = ['what', 'where', 'when', 'why', 'how', 'who', 'which'];
        const firstWord = text.trim().split(' ')[0].toLowerCase();

        if (whWords.includes(firstWord)) {
            return 'wh_question';
        } else if (text.includes('right?') || text.includes("isn't it") || text.includes("don't you think")) {
            return 'rhetorical';
        } else {
            return 'yes_no';
        }
    }

    private calculateWordEmphasis(word: string, context: MovementContext): number {
        // Simple emphasis calculation based on word characteristics and context
        let intensity = 0;

        // Check for emphasis indicators
        if (word.toUpperCase() === word && word.length > 1) {
            intensity += 0.8; // ALL CAPS
        }

        if (word.includes('!')) {
            intensity += 0.6;
        }

        // Important words get more emphasis
        const importantWords = ['important', 'critical', 'essential', 'key', 'main', 'primary', 'significant'];
        if (importantWords.some(iw => word.toLowerCase().includes(iw))) {
            intensity += 0.5;
        }

        // Context-based emphasis
        if (context.emphasisLevel === 'high') {
            intensity *= 1.5;
        } else if (context.emphasisLevel === 'low') {
            intensity *= 0.5;
        }

        return Math.min(1.0, intensity);
    }

    private analyzeSentiment(text: string): 'positive' | 'negative' | 'neutral' {
        const positiveWords = ['good', 'great', 'excellent', 'wonderful', 'amazing', 'fantastic'];
        const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'disappointing', 'wrong'];

        const words = text.toLowerCase().split(/\s+/);
        const positiveCount = words.filter(word => positiveWords.includes(word)).length;
        const negativeCount = words.filter(word => negativeWords.includes(word)).length;

        if (positiveCount > negativeCount) return 'positive';
        if (negativeCount > positiveCount) return 'negative';
        return 'neutral';
    }
}

/**
 * Head movement generator for speech-synchronized movements
 */
class HeadMovementGenerator {
    public generateMovements(
        analysis: SpeechAnalysis,
        state: SpeechMovementState,
        currentTime: number
    ): HeadMovement[] {
        const movements: HeadMovement[] = [];

        // Generate movements based on speech analysis
        if (analysis.questions.length > 0) {
            movements.push(...this.generateQuestionMovements(analysis.questions));
        }

        if (analysis.emphasis.words.length > 0) {
            movements.push(...this.generateEmphasisMovements(analysis.emphasis.words));
        }

        // Add natural conversation flow movements
        movements.push(...this.generateConversationFlowMovements(state.conversationFlow));

        return movements;
    }

    private generateQuestionMovements(questions: QuestionMarker[]): HeadMovement[] {
        return questions.map(question => ({
            type: 'tilt' as const,
            direction: question.type === 'wh_question' ? 'left' : 'right',
            intensity: 0.6 * question.confidence,
            duration: question.endTime - question.startTime,
            startTime: question.startTime,
            easing: 'ease_in_out' as const
        }));
    }

    private generateEmphasisMovements(words: EmphasisWord[]): HeadMovement[] {
        return words.filter(word => word.intensity > 0.6).map(word => ({
            type: 'nod' as const,
            direction: 'down' as const,
            intensity: word.intensity,
            duration: Math.min(300, word.endTime - word.startTime),
            startTime: word.startTime,
            easing: 'ease_in_out' as const
        }));
    }

    private generateConversationFlowMovements(flow: ConversationFlow): HeadMovement[] {
        const movements: HeadMovement[] = [];

        if (flow.isListening) {
            movements.push({
                type: 'nod',
                direction: 'down',
                intensity: 0.3,
                duration: 800,
                startTime: 0,
                easing: 'ease_in_out'
            });
        }

        return movements;
    }
}

/**
 * Gesture coordinator for timing gestures with speech
 */
class GestureCoordinator {
    public coordinateGestures(
        headMovements: HeadMovement[],
        analysis: SpeechAnalysis,
        currentTime: number
    ): Gesture[] {
        const gestures: Gesture[] = [];

        // Coordinate gestures with head movements
        headMovements.forEach(movement => {
            if (movement.type === 'nod' && movement.intensity > 0.7) {
                gestures.push(this.createEmphasisGesture(movement));
            } else if (movement.type === 'tilt') {
                gestures.push(this.createQuestionGesture(movement));
            }
        });

        return gestures;
    }

    private createEmphasisGesture(movement: HeadMovement): Gesture {
        return {
            type: 'emphasis',
            intensity: movement.intensity,
            duration: movement.duration,
            timing: movement.startTime,
            morphTargets: [
                { targetName: 'eyebrow_emphasis', weight: movement.intensity * 0.6, blendMode: 'additive' },
                { targetName: 'eye_focus', weight: movement.intensity * 0.4, blendMode: 'additive' }
            ]
        };
    }

    private createQuestionGesture(movement: HeadMovement): Gesture {
        return {
            type: 'head_tilt',
            intensity: movement.intensity,
            duration: movement.duration,
            timing: movement.startTime,
            morphTargets: [
                { targetName: 'eyebrow_curious', weight: movement.intensity * 0.7, blendMode: 'additive' }
            ]
        };
    }
}