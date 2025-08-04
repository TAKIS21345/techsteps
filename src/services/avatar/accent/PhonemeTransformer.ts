import { PhonemeData } from '../PhonemePreprocessor';
import { PronunciationRules, StressPattern, RhythmPattern } from './AccentEngine';

export interface TransformationRule {
  sourcePhoneme: string;
  targetPhoneme: string;
  context?: 'vowel' | 'consonant' | 'initial' | 'final' | 'stressed' | 'unstressed';
  probability: number;
  description: string;
}

export interface PhonemeTransformationResult {
  originalPhonemes: PhonemeData[];
  transformedPhonemes: PhonemeData[];
  appliedRules: Array<{
    position: number;
    rule: TransformationRule;
    confidence: number;
  }>;
  qualityScore: number;
}

/**
 * Advanced phoneme transformation engine for accent adaptation
 * Handles complex phoneme mappings and contextual transformations
 */
export class PhonemeTransformer {
  private transformationRules: Map<string, TransformationRule[]> = new Map();
  private contextAnalyzer: PhonemeContextAnalyzer;

  constructor() {
    this.contextAnalyzer = new PhonemeContextAnalyzer();
    this.initializeTransformationRules();
  }

  /**
   * Transform phonemes according to accent rules
   */
  transformPhonemes(
    phonemes: PhonemeData[], 
    pronunciationRules: PronunciationRules,
    language: string
  ): PhonemeTransformationResult {
    const transformedPhonemes: PhonemeData[] = [];
    const appliedRules: Array<{ position: number; rule: TransformationRule; confidence: number }> = [];

    for (let i = 0; i < phonemes.length; i++) {
      const phoneme = phonemes[i];
      const context = this.contextAnalyzer.analyzeContext(phonemes, i);
      
      // Apply vowel mappings
      let transformedPhoneme = this.applyVowelMapping(phoneme, pronunciationRules.vowelMappings);
      
      // Apply consonant mappings
      transformedPhoneme = this.applyConsonantMapping(transformedPhoneme, pronunciationRules.consonantMappings);
      
      // Apply contextual transformations
      const contextualResult = this.applyContextualTransformations(
        transformedPhoneme, 
        context, 
        language
      );
      
      transformedPhonemes.push(contextualResult.phoneme);
      
      if (contextualResult.appliedRule) {
        appliedRules.push({
          position: i,
          rule: contextualResult.appliedRule,
          confidence: contextualResult.confidence
        });
      }
    }

    // Apply stress patterns
    const stressAdjustedPhonemes = this.applyStressPatterns(
      transformedPhonemes, 
      pronunciationRules.stressPatterns
    );

    // Apply rhythm adjustments
    const finalPhonemes = this.applyRhythmAdjustments(
      stressAdjustedPhonemes, 
      pronunciationRules.rhythmPattern
    );

    const qualityScore = this.calculateTransformationQuality(phonemes, finalPhonemes, appliedRules);

    return {
      originalPhonemes: phonemes,
      transformedPhonemes: finalPhonemes,
      appliedRules,
      qualityScore
    };
  }

  /**
   * Apply vowel mappings from pronunciation rules
   */
  private applyVowelMapping(phoneme: PhonemeData, vowelMappings: Record<string, string>): PhonemeData {
    if (vowelMappings[phoneme.phoneme]) {
      const newPhoneme = vowelMappings[phoneme.phoneme];
      return {
        ...phoneme,
        phoneme: newPhoneme,
        viseme: this.phonemeToViseme(newPhoneme)
      };
    }
    return phoneme;
  }

  /**
   * Apply consonant mappings from pronunciation rules
   */
  private applyConsonantMapping(phoneme: PhonemeData, consonantMappings: Record<string, string>): PhonemeData {
    if (consonantMappings[phoneme.phoneme]) {
      const newPhoneme = consonantMappings[phoneme.phoneme];
      return {
        ...phoneme,
        phoneme: newPhoneme,
        viseme: this.phonemeToViseme(newPhoneme)
      };
    }
    return phoneme;
  }

  /**
   * Apply contextual transformations based on surrounding phonemes
   */
  private applyContextualTransformations(
    phoneme: PhonemeData, 
    context: PhonemeContext, 
    language: string
  ): { phoneme: PhonemeData; appliedRule?: TransformationRule; confidence: number } {
    const rules = this.transformationRules.get(language) || [];
    
    for (const rule of rules) {
      if (rule.sourcePhoneme === phoneme.phoneme && this.matchesContext(context, rule.context)) {
        // Apply transformation with probability
        if (Math.random() < rule.probability) {
          const transformedPhoneme = {
            ...phoneme,
            phoneme: rule.targetPhoneme,
            viseme: this.phonemeToViseme(rule.targetPhoneme),
            confidence: phoneme.confidence * 0.9 // Slight confidence reduction for transformations
          };
          
          return {
            phoneme: transformedPhoneme,
            appliedRule: rule,
            confidence: rule.probability
          };
        }
      }
    }

    return { phoneme, confidence: 1.0 };
  }

  /**
   * Apply stress patterns to phonemes
   */
  private applyStressPatterns(phonemes: PhonemeData[], stressPatterns: StressPattern[]): PhonemeData[] {
    return phonemes.map(phoneme => {
      const stressPattern = stressPatterns.find(pattern => pattern.phoneme === phoneme.phoneme);
      
      if (stressPattern) {
        const duration = phoneme.endTime - phoneme.startTime;
        const adjustedDuration = duration * stressPattern.durationMultiplier;
        const adjustedConfidence = Math.min(1.0, phoneme.confidence * stressPattern.intensityMultiplier);

        return {
          ...phoneme,
          endTime: phoneme.startTime + adjustedDuration,
          confidence: adjustedConfidence
        };
      }

      return phoneme;
    });
  }

  /**
   * Apply rhythm adjustments to phoneme timing
   */
  private applyRhythmAdjustments(phonemes: PhonemeData[], rhythmPattern: RhythmPattern): PhonemeData[] {
    let currentTime = 0;

    return phonemes.map(phoneme => {
      const duration = phoneme.endTime - phoneme.startTime;
      let adjustedDuration = duration;

      // Apply speech rate multiplier
      adjustedDuration *= rhythmPattern.speechRateMultiplier;

      // Apply pause duration multiplier for silence
      if (phoneme.phoneme === 'SIL') {
        adjustedDuration *= rhythmPattern.pauseDurationMultiplier;
      }

      // Apply syllable stress adjustments
      if (this.isVowel(phoneme.phoneme)) {
        adjustedDuration *= rhythmPattern.syllableStressRatio;
      }

      const result = {
        ...phoneme,
        startTime: currentTime,
        endTime: currentTime + adjustedDuration
      };

      currentTime += adjustedDuration;
      return result;
    });
  }

  /**
   * Check if context matches rule requirements
   */
  private matchesContext(context: PhonemeContext, ruleContext?: string): boolean {
    if (!ruleContext) return true;

    switch (ruleContext) {
      case 'vowel':
        return context.isVowel;
      case 'consonant':
        return !context.isVowel;
      case 'initial':
        return context.position === 'initial';
      case 'final':
        return context.position === 'final';
      case 'stressed':
        return context.isStressed;
      case 'unstressed':
        return !context.isStressed;
      default:
        return true;
    }
  }

  /**
   * Calculate transformation quality score
   */
  private calculateTransformationQuality(
    original: PhonemeData[], 
    transformed: PhonemeData[], 
    appliedRules: Array<{ position: number; rule: TransformationRule; confidence: number }>
  ): number {
    if (original.length === 0) return 1.0;

    // Base quality on number of successful transformations
    const transformationRatio = appliedRules.length / original.length;
    
    // Weight by confidence of applied rules
    const averageConfidence = appliedRules.length > 0 
      ? appliedRules.reduce((sum, rule) => sum + rule.confidence, 0) / appliedRules.length
      : 1.0;

    // Consider timing preservation
    const originalDuration = original.length > 0 ? Math.max(...original.map(p => p.endTime)) : 0;
    const transformedDuration = transformed.length > 0 ? Math.max(...transformed.map(p => p.endTime)) : 0;
    const timingPreservation = originalDuration > 0 
      ? Math.min(1.0, transformedDuration / originalDuration)
      : 1.0;

    return (transformationRatio * 0.4 + averageConfidence * 0.4 + timingPreservation * 0.2);
  }

  /**
   * Check if phoneme is a vowel
   */
  private isVowel(phoneme: string): boolean {
    const vowels = ['AA', 'AE', 'AH', 'AO', 'AW', 'AY', 'EH', 'ER', 'EY', 'IH', 'IY', 'OW', 'OY', 'UH', 'UW'];
    return vowels.includes(phoneme);
  }

  /**
   * Convert phoneme to viseme
   */
  private phonemeToViseme(phoneme: string): string {
    const visemeMap: Record<string, string> = {
      'SIL': 'sil',
      'B': 'PP', 'P': 'PP', 'M': 'PP',
      'F': 'FF', 'V': 'FF',
      'TH': 'TH', 'DH': 'TH',
      'T': 'DD', 'D': 'DD', 'N': 'DD', 'L': 'DD',
      'S': 'SS', 'Z': 'SS',
      'SH': 'CH', 'ZH': 'CH', 'CH': 'CH', 'JH': 'CH',
      'K': 'kk', 'G': 'kk', 'NG': 'kk',
      'HH': 'sil',
      'R': 'RR', 'RR': 'RR', 'W': 'W', 'Y': 'I',
      'AA': 'AA', 'AE': 'AA', 'AH': 'AA', 'AO': 'O',
      'AW': 'O', 'AY': 'I', 'EH': 'E', 'ER': 'E',
      'EY': 'I', 'IH': 'I', 'IY': 'I', 'OW': 'O',
      'OY': 'O', 'UH': 'U', 'UW': 'U'
    };
    
    return visemeMap[phoneme] || 'sil';
  }

  /**
   * Initialize transformation rules for different languages
   */
  private initializeTransformationRules(): void {
    // Spanish transformation rules
    this.transformationRules.set('es', [
      {
        sourcePhoneme: 'TH',
        targetPhoneme: 'T',
        context: 'consonant',
        probability: 0.9,
        description: 'Spanish speakers often use /t/ for /θ/'
      },
      {
        sourcePhoneme: 'V',
        targetPhoneme: 'B',
        context: 'consonant',
        probability: 0.8,
        description: 'Spanish /v/ sounds more like /b/'
      },
      {
        sourcePhoneme: 'Z',
        targetPhoneme: 'S',
        context: 'consonant',
        probability: 0.9,
        description: 'Spanish /z/ is pronounced as /s/'
      },
      {
        sourcePhoneme: 'SH',
        targetPhoneme: 'CH',
        context: 'consonant',
        probability: 0.7,
        description: 'Spanish lacks /ʃ/ sound, uses /tʃ/'
      }
    ]);

    // French transformation rules
    this.transformationRules.set('fr', [
      {
        sourcePhoneme: 'TH',
        targetPhoneme: 'Z',
        context: 'consonant',
        probability: 0.8,
        description: 'French speakers use /z/ for /θ/'
      },
      {
        sourcePhoneme: 'H',
        targetPhoneme: 'SIL',
        context: 'initial',
        probability: 0.9,
        description: 'French /h/ is often silent'
      },
      {
        sourcePhoneme: 'W',
        targetPhoneme: 'V',
        context: 'consonant',
        probability: 0.8,
        description: 'French /w/ sounds like /v/'
      },
      {
        sourcePhoneme: 'R',
        targetPhoneme: 'RR',
        context: 'consonant',
        probability: 0.9,
        description: 'French uvular /r/'
      }
    ]);

    // German transformation rules
    this.transformationRules.set('de', [
      {
        sourcePhoneme: 'TH',
        targetPhoneme: 'Z',
        context: 'consonant',
        probability: 0.9,
        description: 'German speakers use /z/ for /θ/'
      },
      {
        sourcePhoneme: 'W',
        targetPhoneme: 'V',
        context: 'consonant',
        probability: 0.9,
        description: 'German /w/ is pronounced as /v/'
      },
      {
        sourcePhoneme: 'V',
        targetPhoneme: 'F',
        context: 'consonant',
        probability: 0.8,
        description: 'German /v/ sounds like /f/'
      },
      {
        sourcePhoneme: 'J',
        targetPhoneme: 'Y',
        context: 'consonant',
        probability: 0.9,
        description: 'German /j/ is pronounced as /y/'
      }
    ]);

    // Italian transformation rules
    this.transformationRules.set('it', [
      {
        sourcePhoneme: 'TH',
        targetPhoneme: 'T',
        context: 'consonant',
        probability: 0.9,
        description: 'Italian speakers use /t/ for /θ/'
      },
      {
        sourcePhoneme: 'H',
        targetPhoneme: 'SIL',
        context: 'initial',
        probability: 0.8,
        description: 'Italian /h/ is often silent'
      }
    ]);
  }
}

/**
 * Analyzes phoneme context for transformation decisions
 */
export class PhonemeContextAnalyzer {
  /**
   * Analyze context of a phoneme within a sequence
   */
  analyzeContext(phonemes: PhonemeData[], index: number): PhonemeContext {
    const phoneme = phonemes[index];
    const previousPhoneme = index > 0 ? phonemes[index - 1] : null;
    const nextPhoneme = index < phonemes.length - 1 ? phonemes[index + 1] : null;

    return {
      isVowel: this.isVowel(phoneme.phoneme),
      position: this.getPosition(index, phonemes.length),
      isStressed: this.isStressed(phoneme, previousPhoneme, nextPhoneme),
      previousPhoneme: previousPhoneme?.phoneme || null,
      nextPhoneme: nextPhoneme?.phoneme || null,
      syllablePosition: this.getSyllablePosition(phonemes, index)
    };
  }

  /**
   * Check if phoneme is a vowel
   */
  private isVowel(phoneme: string): boolean {
    const vowels = ['AA', 'AE', 'AH', 'AO', 'AW', 'AY', 'EH', 'ER', 'EY', 'IH', 'IY', 'OW', 'OY', 'UH', 'UW'];
    return vowels.includes(phoneme);
  }

  /**
   * Get position of phoneme in sequence
   */
  private getPosition(index: number, totalLength: number): 'initial' | 'medial' | 'final' {
    if (index === 0) return 'initial';
    if (index === totalLength - 1) return 'final';
    return 'medial';
  }

  /**
   * Determine if phoneme is stressed (simplified heuristic)
   */
  private isStressed(
    phoneme: PhonemeData, 
    previousPhoneme: PhonemeData | null, 
    nextPhoneme: PhonemeData | null
  ): boolean {
    // Simple heuristic: vowels with higher confidence are likely stressed
    if (this.isVowel(phoneme.phoneme)) {
      return phoneme.confidence > 0.8;
    }
    return false;
  }

  /**
   * Get syllable position (simplified)
   */
  private getSyllablePosition(phonemes: PhonemeData[], index: number): 'onset' | 'nucleus' | 'coda' {
    const phoneme = phonemes[index];
    
    if (this.isVowel(phoneme.phoneme)) {
      return 'nucleus';
    }
    
    // Look for adjacent vowels to determine onset vs coda
    const hasFollowingVowel = index < phonemes.length - 1 && 
      this.isVowel(phonemes[index + 1].phoneme);
    
    return hasFollowingVowel ? 'onset' : 'coda';
  }
}

export interface PhonemeContext {
  isVowel: boolean;
  position: 'initial' | 'medial' | 'final';
  isStressed: boolean;
  previousPhoneme: string | null;
  nextPhoneme: string | null;
  syllablePosition: 'onset' | 'nucleus' | 'coda';
}