import { describe, it, expect, beforeEach } from 'vitest';
import { AccentEngine } from '../AccentEngine';
import { PhonemeData } from '../../PhonemePreprocessor';

describe('AccentEngine', () => {
  let accentEngine: AccentEngine;

  beforeEach(() => {
    accentEngine = new AccentEngine();
  });

  describe('Language Detection', () => {
    it('should detect English text correctly', () => {
      const text = 'Hello, how are you today? This is a test of the English language detection system.';
      const result = accentEngine.detectLanguage(text);
      
      expect(result.language).toBe('en');
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should detect Spanish text correctly', () => {
      const text = 'Hola, ¿cómo estás hoy? Esta es una prueba del sistema de detección de idioma español.';
      const result = accentEngine.detectLanguage(text);
      
      expect(result.language).toBe('es');
      expect(result.confidence).toBeGreaterThan(0.3);
    });

    it('should detect French text correctly', () => {
      const text = 'Bonjour, comment allez-vous aujourd\'hui? Ceci est un test du système de détection de langue française.';
      const result = accentEngine.detectLanguage(text);
      
      expect(result.language).toBe('fr');
      expect(result.confidence).toBeGreaterThan(0.3);
    });

    it('should detect German text correctly', () => {
      const text = 'Hallo, wie geht es Ihnen heute? Dies ist ein Test des deutschen Spracherkennungssystems.';
      const result = accentEngine.detectLanguage(text);
      
      expect(result.language).toBe('de');
      expect(result.confidence).toBeGreaterThan(0.3);
    });

    it('should provide alternative language suggestions', () => {
      const text = 'Hello world';
      const result = accentEngine.detectLanguage(text);
      
      expect(result.alternativeLanguages).toBeDefined();
      expect(Array.isArray(result.alternativeLanguages)).toBe(true);
    });

    it('should handle empty text gracefully', () => {
      const result = accentEngine.detectLanguage('');
      
      expect(result.language).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0);
    });
  });

  describe('Accent Profile Loading', () => {
    it('should load English accent profile', () => {
      const profile = accentEngine.loadAccentProfile('en');
      
      expect(profile).toBeDefined();
      expect(profile?.language).toBe('en');
      expect(profile?.pronunciationRules).toBeDefined();
      expect(profile?.speechRhythm).toBeDefined();
    });

    it('should load Spanish accent profile', () => {
      const profile = accentEngine.loadAccentProfile('es');
      
      expect(profile).toBeDefined();
      expect(profile?.language).toBe('es');
      expect(profile?.pronunciationRules.vowelMappings).toBeDefined();
      expect(profile?.pronunciationRules.consonantMappings).toBeDefined();
    });

    it('should return null for unsupported language', () => {
      const profile = accentEngine.loadAccentProfile('unsupported');
      
      expect(profile).toBeNull();
    });

    it('should set current accent profile when loading', () => {
      accentEngine.loadAccentProfile('es');
      const currentProfile = accentEngine.getCurrentAccentProfile();
      
      expect(currentProfile).toBeDefined();
      expect(currentProfile?.language).toBe('es');
    });
  });

  describe('Pronunciation Rules', () => {
    it('should return pronunciation rules for supported language', () => {
      const rules = accentEngine.getPronunciationRules('es');
      
      expect(rules).toBeDefined();
      expect(rules?.vowelMappings).toBeDefined();
      expect(rules?.consonantMappings).toBeDefined();
      expect(rules?.rhythmPattern).toBeDefined();
    });

    it('should return null for unsupported language', () => {
      const rules = accentEngine.getPronunciationRules('unsupported');
      
      expect(rules).toBeNull();
    });
  });

  describe('Accent Adaptation', () => {
    const samplePhonemes: PhonemeData[] = [
      {
        phoneme: 'HH',
        startTime: 0,
        endTime: 100,
        confidence: 0.9,
        viseme: 'sil'
      },
      {
        phoneme: 'AH',
        startTime: 100,
        endTime: 200,
        confidence: 0.8,
        viseme: 'AA'
      },
      {
        phoneme: 'L',
        startTime: 200,
        endTime: 300,
        confidence: 0.9,
        viseme: 'DD'
      },
      {
        phoneme: 'OW',
        startTime: 300,
        endTime: 400,
        confidence: 0.8,
        viseme: 'O'
      }
    ];

    it('should adapt phonemes for Spanish accent', () => {
      const result = accentEngine.adaptAccent(samplePhonemes, 'es');
      
      expect(result.modifiedPhonemes).toBeDefined();
      expect(result.speechTiming).toBeDefined();
      expect(result.accentMarkers).toBeDefined();
      expect(result.modifiedPhonemes.length).toBe(samplePhonemes.length);
    });

    it('should apply Spanish vowel mappings', () => {
      const result = accentEngine.adaptAccent(samplePhonemes, 'es');
      
      // Check if AH -> AA mapping was applied (Spanish 'a' is more open)
      // The original AH phoneme should be transformed to AA
      const originalAhIndex = samplePhonemes.findIndex(p => p.phoneme === 'AH');
      if (originalAhIndex >= 0) {
        expect(result.modifiedPhonemes[originalAhIndex].phoneme).toBe('AA');
      }
    });

    it('should adjust speech timing for Spanish rhythm', () => {
      const result = accentEngine.adaptAccent(samplePhonemes, 'es');
      
      expect(result.speechTiming.speechRateAdjustment).toBeCloseTo(1.1, 1);
      expect(result.speechTiming.totalDuration).toBeGreaterThan(0);
    });

    it('should return original phonemes for unsupported language', () => {
      const result = accentEngine.adaptAccent(samplePhonemes, 'unsupported');
      
      expect(result.modifiedPhonemes).toEqual(samplePhonemes);
      expect(result.speechTiming.speechRateAdjustment).toBe(1.0);
    });

    it('should generate accent markers', () => {
      const result = accentEngine.adaptAccent(samplePhonemes, 'es');
      
      expect(result.accentMarkers).toBeDefined();
      expect(Array.isArray(result.accentMarkers)).toBe(true);
    });
  });

  describe('Speech Timing Adjustment', () => {
    const samplePhonemes: PhonemeData[] = [
      {
        phoneme: 'AA',
        startTime: 0,
        endTime: 100,
        confidence: 0.9,
        viseme: 'AA'
      },
      {
        phoneme: 'SIL',
        startTime: 100,
        endTime: 200,
        confidence: 1.0,
        viseme: 'sil'
      },
      {
        phoneme: 'EH',
        startTime: 200,
        endTime: 300,
        confidence: 0.8,
        viseme: 'E'
      }
    ];

    it('should adjust timing for Spanish speech rhythm', () => {
      const adjusted = accentEngine.adjustSpeechTiming(samplePhonemes, 'es');
      
      expect(adjusted.length).toBe(samplePhonemes.length);
      
      // Check that timing was adjusted (Spanish has faster speech rate of 1.1x)
      const totalOriginalDuration = Math.max(...samplePhonemes.map(p => p.endTime));
      const totalAdjustedDuration = Math.max(...adjusted.map(p => p.endTime));
      
      // Spanish speech rate multiplier is 1.1, so duration should increase
      expect(totalAdjustedDuration).toBeGreaterThan(totalOriginalDuration * 1.0);
    });

    it('should preserve phoneme order', () => {
      const adjusted = accentEngine.adjustSpeechTiming(samplePhonemes, 'es');
      
      for (let i = 0; i < adjusted.length; i++) {
        expect(adjusted[i].phoneme).toBe(samplePhonemes[i].phoneme);
      }
    });

    it('should maintain continuous timing', () => {
      const adjusted = accentEngine.adjustSpeechTiming(samplePhonemes, 'es');
      
      for (let i = 1; i < adjusted.length; i++) {
        expect(adjusted[i].startTime).toBeCloseTo(adjusted[i - 1].endTime, 1);
      }
    });
  });

  describe('Available Languages', () => {
    it('should return list of supported languages', () => {
      const languages = accentEngine.getAvailableLanguages();
      
      expect(Array.isArray(languages)).toBe(true);
      expect(languages.length).toBeGreaterThan(0);
      expect(languages).toContain('en');
      expect(languages).toContain('es');
      expect(languages).toContain('fr');
      expect(languages).toContain('de');
    });
  });

  describe('Current Accent Profile', () => {
    it('should return null initially', () => {
      const profile = accentEngine.getCurrentAccentProfile();
      expect(profile).toBeNull();
    });

    it('should return current profile after loading', () => {
      accentEngine.loadAccentProfile('fr');
      const profile = accentEngine.getCurrentAccentProfile();
      
      expect(profile).toBeDefined();
      expect(profile?.language).toBe('fr');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty phoneme array', () => {
      const result = accentEngine.adaptAccent([], 'es');
      
      expect(result.modifiedPhonemes).toEqual([]);
      expect(result.speechTiming.totalDuration).toBe(0);
      expect(result.accentMarkers).toEqual([]);
    });

    it('should handle single phoneme', () => {
      const singlePhoneme: PhonemeData[] = [{
        phoneme: 'AA',
        startTime: 0,
        endTime: 100,
        confidence: 0.9,
        viseme: 'AA'
      }];
      
      const result = accentEngine.adaptAccent(singlePhoneme, 'es');
      
      expect(result.modifiedPhonemes.length).toBe(1);
      expect(result.speechTiming.totalDuration).toBeGreaterThan(0);
    });

    it('should handle phonemes with zero duration', () => {
      const zeroPhonemes: PhonemeData[] = [{
        phoneme: 'SIL',
        startTime: 100,
        endTime: 100,
        confidence: 1.0,
        viseme: 'sil'
      }];
      
      const result = accentEngine.adaptAccent(zeroPhonemes, 'es');
      
      expect(result.modifiedPhonemes.length).toBe(1);
      expect(result.speechTiming.totalDuration).toBeGreaterThanOrEqual(0);
    });
  });
});