import { PhonemeData } from '../PhonemePreprocessor';

export interface AccentProfile {
  language: string;
  region?: string;
  pronunciationRules: PronunciationRules;
  speechRhythm: RhythmPattern;
  intonationPatterns: IntonationPattern[];
}

export interface PronunciationRules {
  vowelMappings: Record<string, string>;
  consonantMappings: Record<string, string>;
  rhythmPattern: RhythmPattern;
  stressPatterns: StressPattern[];
}

export interface RhythmPattern {
  syllableStressRatio: number;
  pauseDurationMultiplier: number;
  speechRateMultiplier: number;
  emphasisIntensity: number;
}

export interface StressPattern {
  phoneme: string;
  stressLevel: 'primary' | 'secondary' | 'unstressed';
  durationMultiplier: number;
  intensityMultiplier: number;
}

export interface IntonationPattern {
  context: 'statement' | 'question' | 'emphasis' | 'list';
  pitchContour: number[];
  durationAdjustment: number;
}

export interface AccentedSpeechData {
  modifiedPhonemes: PhonemeData[];
  speechTiming: TimingData;
  accentMarkers: AccentMarker[];
}

export interface TimingData {
  totalDuration: number;
  pauseAdjustments: Array<{
    position: number;
    originalDuration: number;
    adjustedDuration: number;
  }>;
  speechRateAdjustment: number;
}

export interface AccentMarker {
  position: number;
  type: 'stress' | 'intonation' | 'rhythm';
  intensity: number;
  description: string;
}

export interface LanguageDetectionResult {
  language: string;
  confidence: number;
  region?: string;
  alternativeLanguages: Array<{
    language: string;
    confidence: number;
  }>;
}

/**
 * AccentEngine handles language-specific pronunciation and speech patterns
 * for creating authentic accent adaptations in avatar speech
 */
export class AccentEngine {
  private accentProfiles: Map<string, AccentProfile> = new Map();
  private currentAccentProfile: AccentProfile | null = null;
  private languageDetectionCache: Map<string, LanguageDetectionResult> = new Map();

  constructor() {
    this.initializeAccentProfiles();
  }

  /**
   * Detect language from text content
   */
  detectLanguage(text: string): LanguageDetectionResult {
    // Check cache first
    const cacheKey = text.toLowerCase().trim();
    if (this.languageDetectionCache.has(cacheKey)) {
      return this.languageDetectionCache.get(cacheKey)!;
    }

    const result = this.performLanguageDetection(text);
    
    // Cache result for future use
    this.languageDetectionCache.set(cacheKey, result);
    
    return result;
  }

  /**
   * Load accent profile for a specific language
   */
  loadAccentProfile(language: string, region?: string): AccentProfile | null {
    const profileKey = region ? `${language}-${region}` : language;
    const profile = this.accentProfiles.get(profileKey) || this.accentProfiles.get(language);
    
    if (profile) {
      this.currentAccentProfile = profile;
      return profile;
    }
    
    console.warn(`Accent profile not found for language: ${language}${region ? `-${region}` : ''}`);
    return null;
  }

  /**
   * Get pronunciation rules for a specific language
   */
  getPronunciationRules(language: string): PronunciationRules | null {
    const profile = this.accentProfiles.get(language);
    return profile ? profile.pronunciationRules : null;
  }

  /**
   * Adapt phoneme data to apply accent modifications
   */
  adaptAccent(phonemes: PhonemeData[], language: string, region?: string): AccentedSpeechData {
    const profile = this.loadAccentProfile(language, region);
    
    if (!profile) {
      // Return original data if no accent profile available
      return {
        modifiedPhonemes: phonemes,
        speechTiming: {
          totalDuration: phonemes.length > 0 ? Math.max(...phonemes.map(p => p.endTime)) : 0,
          pauseAdjustments: [],
          speechRateAdjustment: 1.0
        },
        accentMarkers: []
      };
    }

    const modifiedPhonemes = this.applyPronunciationRules(phonemes, profile.pronunciationRules);
    const timingAdjustedPhonemes = this.applySpeechRhythm(modifiedPhonemes, profile.speechRhythm);
    const finalPhonemes = this.applyStressPatterns(timingAdjustedPhonemes, profile.pronunciationRules.stressPatterns);
    
    const speechTiming = this.calculateTimingData(phonemes, finalPhonemes, profile.speechRhythm);
    const accentMarkers = this.generateAccentMarkers(finalPhonemes, profile);

    return {
      modifiedPhonemes: finalPhonemes,
      speechTiming,
      accentMarkers
    };
  }

  /**
   * Adjust speech timing for natural accent flow
   */
  adjustSpeechTiming(phonemes: PhonemeData[], language: string): PhonemeData[] {
    const profile = this.accentProfiles.get(language);
    if (!profile) return phonemes;

    return this.applySpeechRhythm(phonemes, profile.speechRhythm);
  }

  /**
   * Get available accent languages
   */
  getAvailableLanguages(): string[] {
    return Array.from(this.accentProfiles.keys());
  }

  /**
   * Get current accent profile
   */
  getCurrentAccentProfile(): AccentProfile | null {
    return this.currentAccentProfile;
  }

  /**
   * Initialize built-in accent profiles
   */
  private initializeAccentProfiles(): void {
    // English (Neutral)
    this.accentProfiles.set('en', {
      language: 'en',
      pronunciationRules: {
        vowelMappings: {},
        consonantMappings: {},
        rhythmPattern: {
          syllableStressRatio: 1.0,
          pauseDurationMultiplier: 1.0,
          speechRateMultiplier: 1.0,
          emphasisIntensity: 1.0
        },
        stressPatterns: []
      },
      speechRhythm: {
        syllableStressRatio: 1.0,
        pauseDurationMultiplier: 1.0,
        speechRateMultiplier: 1.0,
        emphasisIntensity: 1.0
      },
      intonationPatterns: [
        {
          context: 'statement',
          pitchContour: [0, -0.1, -0.2],
          durationAdjustment: 1.0
        },
        {
          context: 'question',
          pitchContour: [0, 0.1, 0.3],
          durationAdjustment: 1.1
        }
      ]
    });

    // Spanish
    this.accentProfiles.set('es', {
      language: 'es',
      pronunciationRules: {
        vowelMappings: {
          'AE': 'AA',  // Spanish 'a' is more open
          'AH': 'AA',  // Spanish 'a' is more open (schwa -> open a)
          'IH': 'IY',  // Spanish 'i' is more closed
          'UH': 'UW',  // Spanish 'u' is more closed
          'ER': 'EH'   // Spanish doesn't have schwa-r
        },
        consonantMappings: {
          'TH': 'T',   // Spanish speakers often use 't' for 'th'
          'V': 'B',    // Spanish 'v' sounds more like 'b'
          'Z': 'S',    // Spanish 'z' sounds like 's'
          'SH': 'CH'   // Spanish doesn't have 'sh' sound
        },
        rhythmPattern: {
          syllableStressRatio: 1.2,
          pauseDurationMultiplier: 0.8,
          speechRateMultiplier: 1.1,
          emphasisIntensity: 1.3
        },
        stressPatterns: [
          {
            phoneme: 'AA',
            stressLevel: 'primary',
            durationMultiplier: 1.3,
            intensityMultiplier: 1.2
          }
        ]
      },
      speechRhythm: {
        syllableStressRatio: 1.2,
        pauseDurationMultiplier: 0.8,
        speechRateMultiplier: 1.1,
        emphasisIntensity: 1.3
      },
      intonationPatterns: [
        {
          context: 'statement',
          pitchContour: [0, 0.1, -0.1],
          durationAdjustment: 1.0
        },
        {
          context: 'question',
          pitchContour: [0, 0.2, 0.4],
          durationAdjustment: 1.2
        }
      ]
    });

    // French
    this.accentProfiles.set('fr', {
      language: 'fr',
      pronunciationRules: {
        vowelMappings: {
          'AE': 'AA',  // French 'a' is different
          'AH': 'AA',  // French doesn't have schwa in same way
          'ER': 'EH',  // French 'r' affects vowels differently
          'UW': 'UH'   // French 'u' is different
        },
        consonantMappings: {
          'TH': 'Z',   // French speakers use 'z' for 'th'
          'H': '',     // French 'h' is often silent
          'R': 'RR',   // French 'r' is uvular
          'W': 'V'     // French 'w' sounds like 'v'
        },
        rhythmPattern: {
          syllableStressRatio: 0.9,
          pauseDurationMultiplier: 1.1,
          speechRateMultiplier: 0.95,
          emphasisIntensity: 0.9
        },
        stressPatterns: [
          {
            phoneme: 'EH',
            stressLevel: 'primary',
            durationMultiplier: 1.1,
            intensityMultiplier: 1.0
          }
        ]
      },
      speechRhythm: {
        syllableStressRatio: 0.9,
        pauseDurationMultiplier: 1.1,
        speechRateMultiplier: 0.95,
        emphasisIntensity: 0.9
      },
      intonationPatterns: [
        {
          context: 'statement',
          pitchContour: [0, 0.05, -0.05],
          durationAdjustment: 1.0
        },
        {
          context: 'question',
          pitchContour: [0, 0.15, 0.25],
          durationAdjustment: 1.15
        }
      ]
    });

    // German
    this.accentProfiles.set('de', {
      language: 'de',
      pronunciationRules: {
        vowelMappings: {
          'AE': 'EH',  // German 'ä' sound
          'AH': 'AA',  // German 'a' is more open
          'IH': 'IY',  // German 'i' is more closed
          'UH': 'UW'   // German 'u' is more closed
        },
        consonantMappings: {
          'TH': 'Z',   // German speakers use 'z' for 'th'
          'W': 'V',    // German 'w' sounds like 'v'
          'V': 'F',    // German 'v' sounds like 'f'
          'J': 'Y'     // German 'j' sounds like 'y'
        },
        rhythmPattern: {
          syllableStressRatio: 1.3,
          pauseDurationMultiplier: 1.2,
          speechRateMultiplier: 0.9,
          emphasisIntensity: 1.4
        },
        stressPatterns: [
          {
            phoneme: 'AA',
            stressLevel: 'primary',
            durationMultiplier: 1.4,
            intensityMultiplier: 1.3
          }
        ]
      },
      speechRhythm: {
        syllableStressRatio: 1.3,
        pauseDurationMultiplier: 1.2,
        speechRateMultiplier: 0.9,
        emphasisIntensity: 1.4
      },
      intonationPatterns: [
        {
          context: 'statement',
          pitchContour: [0, -0.05, -0.15],
          durationAdjustment: 1.0
        },
        {
          context: 'question',
          pitchContour: [0, 0.1, 0.2],
          durationAdjustment: 1.1
        }
      ]
    });
  }

  /**
   * Perform language detection using text analysis
   */
  private performLanguageDetection(text: string): LanguageDetectionResult {
    const cleanText = text.toLowerCase().replace(/[^\w\s]/g, '');
    const words = cleanText.split(/\s+/).filter(word => word.length > 0);
    
    // Language-specific word patterns and common words
    const languagePatterns = {
      en: {
        commonWords: ['the', 'and', 'is', 'in', 'to', 'of', 'a', 'that', 'it', 'with', 'for', 'as', 'was', 'on', 'are'],
        patterns: [/ing$/, /tion$/, /ly$/, /ed$/],
        weight: 0
      },
      es: {
        commonWords: ['el', 'la', 'de', 'que', 'y', 'en', 'un', 'es', 'se', 'no', 'te', 'lo', 'le', 'da', 'su'],
        patterns: [/ción$/, /mente$/, /ando$/, /iendo$/],
        weight: 0
      },
      fr: {
        commonWords: ['le', 'de', 'et', 'à', 'un', 'il', 'être', 'et', 'en', 'avoir', 'que', 'pour', 'dans', 'ce', 'son'],
        patterns: [/tion$/, /ment$/, /eur$/, /euse$/],
        weight: 0
      },
      de: {
        commonWords: ['der', 'die', 'und', 'in', 'den', 'von', 'zu', 'das', 'mit', 'sich', 'des', 'auf', 'für', 'ist', 'im'],
        patterns: [/ung$/, /keit$/, /lich$/, /isch$/],
        weight: 0
      }
    };

    // Calculate weights for each language
    Object.entries(languagePatterns).forEach(([lang, data]) => {
      // Check common words
      const commonWordMatches = words.filter(word => data.commonWords.includes(word)).length;
      data.weight += commonWordMatches * 2;

      // Check patterns
      const patternMatches = words.filter(word => 
        data.patterns.some(pattern => pattern.test(word))
      ).length;
      data.weight += patternMatches;

      // Normalize by text length
      data.weight = data.weight / Math.max(words.length, 1);
    });

    // Find the language with highest weight
    const sortedLanguages = Object.entries(languagePatterns)
      .sort(([, a], [, b]) => b.weight - a.weight);

    const topLanguage = sortedLanguages[0];
    const confidence = Math.min(0.95, Math.max(0.1, topLanguage[1].weight));

    // Create alternative languages list
    const alternativeLanguages = sortedLanguages
      .slice(1, 3)
      .map(([lang, data]) => ({
        language: lang,
        confidence: Math.min(0.8, Math.max(0.05, data.weight))
      }));

    return {
      language: topLanguage[0],
      confidence,
      alternativeLanguages
    };
  }

  /**
   * Apply pronunciation rules to phoneme data
   */
  private applyPronunciationRules(phonemes: PhonemeData[], rules: PronunciationRules): PhonemeData[] {
    return phonemes.map(phoneme => {
      let modifiedPhoneme = phoneme.phoneme;

      // Apply vowel mappings
      if (rules.vowelMappings[phoneme.phoneme]) {
        modifiedPhoneme = rules.vowelMappings[phoneme.phoneme];
      }

      // Apply consonant mappings
      if (rules.consonantMappings[phoneme.phoneme]) {
        modifiedPhoneme = rules.consonantMappings[phoneme.phoneme];
      }

      return {
        ...phoneme,
        phoneme: modifiedPhoneme,
        // Update viseme if phoneme changed
        viseme: modifiedPhoneme !== phoneme.phoneme ? this.phonemeToViseme(modifiedPhoneme) : phoneme.viseme
      };
    });
  }

  /**
   * Apply speech rhythm patterns
   */
  private applySpeechRhythm(phonemes: PhonemeData[], rhythm: RhythmPattern): PhonemeData[] {
    let currentTime = 0;

    return phonemes.map(phoneme => {
      const duration = phoneme.endTime - phoneme.startTime;
      let adjustedDuration = duration;

      // Apply speech rate multiplier
      adjustedDuration *= rhythm.speechRateMultiplier;

      // Apply pause duration multiplier for silence
      if (phoneme.phoneme === 'SIL') {
        adjustedDuration *= rhythm.pauseDurationMultiplier;
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
   * Calculate timing data for accent adaptation
   */
  private calculateTimingData(originalPhonemes: PhonemeData[], modifiedPhonemes: PhonemeData[], rhythm: RhythmPattern): TimingData {
    const originalDuration = originalPhonemes.length > 0 ? Math.max(...originalPhonemes.map(p => p.endTime)) : 0;
    const modifiedDuration = modifiedPhonemes.length > 0 ? Math.max(...modifiedPhonemes.map(p => p.endTime)) : 0;

    const pauseAdjustments = originalPhonemes
      .filter(p => p.phoneme === 'SIL')
      .map((originalPause, index) => {
        const modifiedPause = modifiedPhonemes.find(mp => 
          mp.phoneme === 'SIL' && Math.abs(mp.startTime - originalPause.startTime) < 50
        );

        return {
          position: originalPause.startTime,
          originalDuration: originalPause.endTime - originalPause.startTime,
          adjustedDuration: modifiedPause ? modifiedPause.endTime - modifiedPause.startTime : originalPause.endTime - originalPause.startTime
        };
      });

    return {
      totalDuration: modifiedDuration,
      pauseAdjustments,
      speechRateAdjustment: rhythm.speechRateMultiplier
    };
  }

  /**
   * Generate accent markers for debugging and analysis
   */
  private generateAccentMarkers(phonemes: PhonemeData[], profile: AccentProfile): AccentMarker[] {
    const markers: AccentMarker[] = [];

    phonemes.forEach((phoneme, index) => {
      // Mark stress patterns
      const stressPattern = profile.pronunciationRules.stressPatterns.find(sp => sp.phoneme === phoneme.phoneme);
      if (stressPattern && stressPattern.stressLevel === 'primary') {
        markers.push({
          position: phoneme.startTime,
          type: 'stress',
          intensity: stressPattern.intensityMultiplier,
          description: `Primary stress on ${phoneme.phoneme}`
        });
      }

      // Mark rhythm changes
      if (phoneme.phoneme === 'SIL' && profile.speechRhythm.pauseDurationMultiplier !== 1.0) {
        markers.push({
          position: phoneme.startTime,
          type: 'rhythm',
          intensity: profile.speechRhythm.pauseDurationMultiplier,
          description: `Pause adjustment: ${profile.speechRhythm.pauseDurationMultiplier}x`
        });
      }
    });

    return markers;
  }

  /**
   * Convert phoneme to viseme (replicating PhonemePreprocessor logic)
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
}