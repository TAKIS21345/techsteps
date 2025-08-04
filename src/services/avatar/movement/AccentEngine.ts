/**
 * AccentEngine - Handles language-specific pronunciation and speech patterns
 * 
 * This engine adapts speech patterns, timing, and pronunciation based on the selected language
 * to provide authentic accent and cultural speech patterns for the avatar.
 * 
 * Requirements addressed:
 * - 2.1: Language-specific accent adaptation
 * - 2.2: English pronunciation and speech timing
 * - 2.3: Spanish accent patterns and rhythm
 * - 2.4: French accent patterns and pronunciation
 * - 2.5: Other supported language adaptations
 */

import {
  AccentProfile,
  PronunciationRules,
  RhythmPattern,
  IntonationPattern,
  HeadMovementStyle
} from './types';

import { PhonemeData } from '../PhonemePreprocessor';

export interface AccentedSpeechData {
  modifiedPhonemes: PhonemeData[];
  speechTiming: TimingData;
  accentMarkers: AccentMarker[];
  headMovementCues: HeadMovementCue[];
}

export interface TimingData {
  overallDuration: number;
  pauseDurations: number[];
  speechRate: number; // words per minute
  rhythmPattern: number[]; // timing multipliers
}

export interface AccentMarker {
  phoneme: string;
  originalPronunciation: string;
  accentedPronunciation: string;
  confidence: number;
  timestamp: number;
}

export interface HeadMovementCue {
  type: 'stress' | 'intonation' | 'rhythm';
  timestamp: number;
  intensity: number;
  direction: 'nod' | 'tilt' | 'turn';
}

export class AccentEngine {
  private accentProfiles: Map<string, AccentProfile> = new Map();
  private currentProfile: AccentProfile | null = null;
  private pronunciationCache: Map<string, string> = new Map();

  constructor() {
    this.initializeDefaultProfiles();
  }

  /**
   * Adapts speech data to match the specified language accent
   */
  public adaptAccent(phonemes: PhonemeData[], language: string): AccentedSpeechData {
    const profile = this.getAccentProfile(language);
    if (!profile) {
      console.warn(`No accent profile found for language: ${language}`);
      return this.createNeutralAccentData(phonemes);
    }

    this.currentProfile = profile;

    // Apply pronunciation rules
    const modifiedPhonemes = this.applyPronunciationRules(phonemes, profile.pronunciationRules);
    
    // Adjust speech timing based on language rhythm
    const speechTiming = this.calculateSpeechTiming(modifiedPhonemes, profile.speechRhythm);
    
    // Generate accent markers for debugging/visualization
    const accentMarkers = this.generateAccentMarkers(phonemes, modifiedPhonemes);
    
    // Generate head movement cues based on accent style
    const headMovementCues = this.generateHeadMovementCues(modifiedPhonemes, profile.headMovementStyle);

    return {
      modifiedPhonemes,
      speechTiming,
      accentMarkers,
      headMovementCues
    };
  }

  /**
   * Gets pronunciation rules for a specific language
   */
  public getPronunciationRules(language: string): PronunciationRules | null {
    const profile = this.getAccentProfile(language);
    return profile?.pronunciationRules || null;
  }

  /**
   * Adjusts speech timing for language-specific rhythm patterns
   */
  public adjustSpeechTiming(phonemes: PhonemeData[], language: string): PhonemeData[] {
    const profile = this.getAccentProfile(language);
    if (!profile) return phonemes;

    return this.applyRhythmPattern(phonemes, profile.speechRhythm);
  }

  /**
   * Updates or adds an accent profile
   */
  public setAccentProfile(language: string, profile: AccentProfile): void {
    this.accentProfiles.set(language, profile);
  }

  /**
   * Gets the current active accent profile
   */
  public getCurrentProfile(): AccentProfile | null {
    return this.currentProfile;
  }

  /**
   * Clears the pronunciation cache
   */
  public clearCache(): void {
    this.pronunciationCache.clear();
  }

  // Private methods

  private initializeDefaultProfiles(): void {
    // English (Neutral)
    this.accentProfiles.set('en-US', {
      language: 'en-US',
      region: 'US',
      pronunciationRules: {
        vowelMappings: {
          'AA': 'AA', // Standard American vowels
          'AE': 'AE',
          'AH': 'AH',
          'AO': 'AO',
          'AW': 'AW',
          'AY': 'AY',
          'EH': 'EH',
          'ER': 'ER',
          'EY': 'EY',
          'IH': 'IH',
          'IY': 'IY',
          'OW': 'OW',
          'OY': 'OY',
          'UH': 'UH',
          'UW': 'UW'
        },
        consonantMappings: {
          'B': 'B', 'CH': 'CH', 'D': 'D', 'DH': 'DH',
          'F': 'F', 'G': 'G', 'HH': 'HH', 'JH': 'JH',
          'K': 'K', 'L': 'L', 'M': 'M', 'N': 'N',
          'NG': 'NG', 'P': 'P', 'R': 'R', 'S': 'S',
          'SH': 'SH', 'T': 'T', 'TH': 'TH', 'V': 'V',
          'W': 'W', 'Y': 'Y', 'Z': 'Z', 'ZH': 'ZH'
        },
        rhythmPattern: {
          beatsPerMinute: 140,
          stressPattern: [1.0, 0.7, 0.8, 0.6],
          pauseDurations: [200, 400, 600]
        },
        stressPatterns: [
          { syllableIndex: 0, intensity: 1.0, type: 'primary' },
          { syllableIndex: 2, intensity: 0.7, type: 'secondary' }
        ]
      },
      speechRhythm: {
        beatsPerMinute: 140,
        stressPattern: [1.0, 0.7, 0.8, 0.6],
        pauseDurations: [200, 400, 600]
      },
      intonationPatterns: [
        {
          type: 'rising',
          curve: [0, 0.3, 0.7, 1.0],
          duration: 500
        },
        {
          type: 'falling',
          curve: [1.0, 0.7, 0.3, 0],
          duration: 600
        }
      ],
      headMovementStyle: {
        nodFrequency: 0.3,
        tiltTendency: 0.2,
        emphasisStyle: 'moderate'
      }
    });

    // Spanish
    this.accentProfiles.set('es-ES', {
      language: 'es-ES',
      region: 'ES',
      pronunciationRules: {
        vowelMappings: {
          'AA': 'AA', // Spanish has clearer vowel distinctions
          'AE': 'AA', // AE -> AA (Spanish doesn't have AE sound)
          'AH': 'AA',
          'AO': 'OW',
          'AW': 'AW',
          'AY': 'AY',
          'EH': 'EH',
          'ER': 'EH', // Spanish R is different
          'EY': 'EY',
          'IH': 'IY', // Spanish I is more like IY
          'IY': 'IY',
          'OW': 'OW',
          'OY': 'OY',
          'UH': 'UW', // Spanish U is more like UW
          'UW': 'UW'
        },
        consonantMappings: {
          'B': 'B', 'CH': 'CH', 'D': 'D', 'DH': 'D', // TH -> D
          'F': 'F', 'G': 'G', 'HH': 'HH', 'JH': 'HH', // J -> H sound
          'K': 'K', 'L': 'L', 'M': 'M', 'N': 'N',
          'NG': 'N', 'P': 'P', 'R': 'RR', // Rolled R
          'S': 'S', 'SH': 'S', 'T': 'T', 'TH': 'S', // TH -> S
          'V': 'B', 'W': 'W', 'Y': 'Y', 'Z': 'S', 'ZH': 'S'
        },
        rhythmPattern: {
          beatsPerMinute: 160, // Faster rhythm
          stressPattern: [1.0, 0.5, 0.8, 0.5],
          pauseDurations: [150, 300, 450]
        },
        stressPatterns: [
          { syllableIndex: -2, intensity: 1.0, type: 'primary' } // Penultimate stress
        ]
      },
      speechRhythm: {
        beatsPerMinute: 160,
        stressPattern: [1.0, 0.5, 0.8, 0.5],
        pauseDurations: [150, 300, 450]
      },
      intonationPatterns: [
        {
          type: 'rising',
          curve: [0, 0.4, 0.8, 1.0],
          duration: 400
        }
      ],
      headMovementStyle: {
        nodFrequency: 0.5, // More expressive
        tiltTendency: 0.4,
        emphasisStyle: 'expressive'
      }
    });

    // French
    this.accentProfiles.set('fr-FR', {
      language: 'fr-FR',
      region: 'FR',
      pronunciationRules: {
        vowelMappings: {
          'AA': 'AA',
          'AE': 'EH', // French doesn't have AE
          'AH': 'AA',
          'AO': 'OW',
          'AW': 'OW',
          'AY': 'EY',
          'EH': 'EH',
          'ER': 'ER', // French R is uvular
          'EY': 'EY',
          'IH': 'IY',
          'IY': 'IY',
          'OW': 'UW', // French O is more rounded
          'OY': 'OY',
          'UH': 'UW',
          'UW': 'UW'
        },
        consonantMappings: {
          'B': 'B', 'CH': 'SH', 'D': 'D', 'DH': 'Z',
          'F': 'F', 'G': 'G', 'HH': '', // French H is often silent
          'JH': 'ZH', 'K': 'K', 'L': 'L', 'M': 'M',
          'N': 'N', 'NG': 'N', 'P': 'P', 'R': 'RR', // Uvular R
          'S': 'S', 'SH': 'SH', 'T': 'T', 'TH': 'S',
          'V': 'V', 'W': 'V', 'Y': 'Y', 'Z': 'Z', 'ZH': 'ZH'
        },
        rhythmPattern: {
          beatsPerMinute: 130, // Slightly slower, more melodic
          stressPattern: [0.8, 0.6, 0.7, 1.0], // Final syllable stress
          pauseDurations: [250, 500, 750]
        },
        stressPatterns: [
          { syllableIndex: -1, intensity: 1.0, type: 'primary' } // Final syllable stress
        ]
      },
      speechRhythm: {
        beatsPerMinute: 130,
        stressPattern: [0.8, 0.6, 0.7, 1.0],
        pauseDurations: [250, 500, 750]
      },
      intonationPatterns: [
        {
          type: 'rising',
          curve: [0, 0.2, 0.6, 1.0],
          duration: 600
        }
      ],
      headMovementStyle: {
        nodFrequency: 0.25,
        tiltTendency: 0.3,
        emphasisStyle: 'subtle'
      }
    });
  }

  private getAccentProfile(language: string): AccentProfile | null {
    return this.accentProfiles.get(language) || null;
  }

  private createNeutralAccentData(phonemes: PhonemeData[]): AccentedSpeechData {
    return {
      modifiedPhonemes: phonemes,
      speechTiming: {
        overallDuration: phonemes.reduce((sum, p) => sum + (p.endTime - p.startTime), 0),
        pauseDurations: [],
        speechRate: 140,
        rhythmPattern: [1.0]
      },
      accentMarkers: [],
      headMovementCues: []
    };
  }

  private applyPronunciationRules(phonemes: PhonemeData[], rules: PronunciationRules): PhonemeData[] {
    return phonemes.map(phoneme => {
      const cacheKey = `${phoneme.phoneme}_${this.currentProfile?.language}`;
      
      if (this.pronunciationCache.has(cacheKey)) {
        return {
          ...phoneme,
          phoneme: this.pronunciationCache.get(cacheKey)!
        };
      }

      let modifiedPhoneme = phoneme.phoneme;

      // Apply vowel mappings
      if (rules.vowelMappings[phoneme.phoneme]) {
        modifiedPhoneme = rules.vowelMappings[phoneme.phoneme];
      }
      // Apply consonant mappings
      else if (rules.consonantMappings[phoneme.phoneme]) {
        modifiedPhoneme = rules.consonantMappings[phoneme.phoneme];
      }

      this.pronunciationCache.set(cacheKey, modifiedPhoneme);

      return {
        ...phoneme,
        phoneme: modifiedPhoneme
      };
    });
  }

  private calculateSpeechTiming(phonemes: PhonemeData[], rhythm: RhythmPattern): TimingData {
    const overallDuration = phonemes.reduce((sum, p) => sum + (p.endTime - p.startTime), 0);
    
    return {
      overallDuration,
      pauseDurations: rhythm.pauseDurations,
      speechRate: rhythm.beatsPerMinute,
      rhythmPattern: rhythm.stressPattern
    };
  }

  private generateAccentMarkers(original: PhonemeData[], modified: PhonemeData[]): AccentMarker[] {
    const markers: AccentMarker[] = [];

    for (let i = 0; i < Math.min(original.length, modified.length); i++) {
      if (original[i].phoneme !== modified[i].phoneme) {
        markers.push({
          phoneme: original[i].phoneme,
          originalPronunciation: original[i].phoneme,
          accentedPronunciation: modified[i].phoneme,
          confidence: original[i].confidence,
          timestamp: original[i].startTime
        });
      }
    }

    return markers;
  }

  private generateHeadMovementCues(phonemes: PhonemeData[], style: HeadMovementStyle): HeadMovementCue[] {
    const cues: HeadMovementCue[] = [];

    phonemes.forEach((phoneme, index) => {
      // Generate stress-based head movements
      if (phoneme.confidence > 0.8 && Math.random() < style.nodFrequency) {
        cues.push({
          type: 'stress',
          timestamp: phoneme.startTime,
          intensity: style.emphasisStyle === 'expressive' ? 0.8 : 
                    style.emphasisStyle === 'moderate' ? 0.6 : 0.4,
          direction: 'nod'
        });
      }

      // Generate tilt movements for questions or emphasis
      if (phoneme.phoneme.includes('?') && Math.random() < style.tiltTendency) {
        cues.push({
          type: 'intonation',
          timestamp: phoneme.startTime,
          intensity: 0.5,
          direction: 'tilt'
        });
      }
    });

    return cues;
  }

  private applyRhythmPattern(phonemes: PhonemeData[], rhythm: RhythmPattern): PhonemeData[] {
    const patternLength = rhythm.stressPattern.length;
    
    return phonemes.map((phoneme, index) => {
      const patternIndex = index % patternLength;
      const stressMultiplier = rhythm.stressPattern[patternIndex];
      const duration = phoneme.endTime - phoneme.startTime;
      const adjustedDuration = duration * stressMultiplier;

      return {
        ...phoneme,
        endTime: phoneme.startTime + adjustedDuration,
        confidence: phoneme.confidence * stressMultiplier
      };
    });
  }
}