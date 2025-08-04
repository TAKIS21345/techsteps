export interface LanguageDetectionResult {
  language: string;
  confidence: number;
  region?: string;
  alternativeLanguages: Array<{
    language: string;
    confidence: number;
  }>;
}

export interface LanguagePattern {
  commonWords: string[];
  patterns: RegExp[];
  characterFrequency: Record<string, number>;
  weight: number;
}

/**
 * Advanced language detection utility for accent adaptation
 * Uses multiple detection methods for improved accuracy
 */
export class LanguageDetector {
  private languagePatterns: Map<string, LanguagePattern> = new Map();
  private detectionCache: Map<string, LanguageDetectionResult> = new Map();

  constructor() {
    this.initializeLanguagePatterns();
  }

  /**
   * Detect language from text with multiple analysis methods
   */
  detectLanguage(text: string): LanguageDetectionResult {
    const cacheKey = this.generateCacheKey(text);
    
    if (this.detectionCache.has(cacheKey)) {
      return this.detectionCache.get(cacheKey)!;
    }

    const result = this.performMultiMethodDetection(text);
    this.detectionCache.set(cacheKey, result);
    
    return result;
  }

  /**
   * Detect language from phoneme patterns
   */
  detectLanguageFromPhonemes(phonemes: string[]): LanguageDetectionResult {
    const phonemeText = phonemes.join(' ');
    return this.detectLanguage(phonemeText);
  }

  /**
   * Get supported languages
   */
  getSupportedLanguages(): string[] {
    return Array.from(this.languagePatterns.keys());
  }

  /**
   * Clear detection cache
   */
  clearCache(): void {
    this.detectionCache.clear();
  }

  /**
   * Initialize language patterns for detection
   */
  private initializeLanguagePatterns(): void {
    // English patterns
    this.languagePatterns.set('en', {
      commonWords: [
        'the', 'and', 'is', 'in', 'to', 'of', 'a', 'that', 'it', 'with',
        'for', 'as', 'was', 'on', 'are', 'you', 'this', 'be', 'at', 'or',
        'have', 'from', 'not', 'word', 'but', 'what', 'some', 'we', 'can',
        'out', 'other', 'were', 'all', 'there', 'when', 'up', 'use', 'your',
        'how', 'said', 'an', 'each', 'which', 'she', 'do', 'has', 'will',
        'one', 'our', 'had', 'by', 'hot', 'but', 'some', 'what', 'there'
      ],
      patterns: [
        /ing$/, /tion$/, /ly$/, /ed$/, /er$/, /est$/, /ness$/,
        /ful$/, /less$/, /ment$/, /able$/, /ible$/
      ],
      characterFrequency: {
        'e': 12.7, 't': 9.1, 'a': 8.2, 'o': 7.5, 'i': 7.0, 'n': 6.7,
        's': 6.3, 'h': 6.1, 'r': 6.0, 'd': 4.3, 'l': 4.0, 'c': 2.8
      },
      weight: 0
    });

    // Spanish patterns
    this.languagePatterns.set('es', {
      commonWords: [
        'el', 'la', 'de', 'que', 'y', 'en', 'un', 'es', 'se', 'no',
        'te', 'lo', 'le', 'da', 'su', 'por', 'son', 'con', 'para', 'al',
        'una', 'del', 'los', 'las', 'me', 'ya', 'muy', 'mi', 'sin', 'sobre',
        'este', 'ser', 'tiene', 'todo', 'esta', 'sus', 'le', 'ha', 'entre',
        'cuando', 'hasta', 'desde', 'están', 'tienen', 'puede', 'más'
      ],
      patterns: [
        /ción$/, /mente$/, /ando$/, /iendo$/, /ado$/, /ido$/,
        /ar$/, /er$/, /ir$/, /dad$/, /tad$/, /eza$/
      ],
      characterFrequency: {
        'e': 13.7, 'a': 11.7, 'o': 8.7, 's': 7.2, 'n': 6.7, 'r': 6.9,
        'i': 6.2, 'l': 5.0, 't': 4.6, 'd': 5.9, 'u': 4.0, 'c': 4.7
      },
      weight: 0
    });

    // French patterns
    this.languagePatterns.set('fr', {
      commonWords: [
        'le', 'de', 'et', 'à', 'un', 'il', 'être', 'et', 'en', 'avoir',
        'que', 'pour', 'dans', 'ce', 'son', 'une', 'sur', 'avec', 'ne',
        'se', 'pas', 'tout', 'plus', 'par', 'grand', 'en', 'une', 'être',
        'et', 'à', 'il', 'avoir', 'ne', 'je', 'son', 'que', 'se', 'qui',
        'ce', 'dans', 'en', 'du', 'elle', 'au', 'de', 'le', 'tout', 'si'
      ],
      patterns: [
        /tion$/, /ment$/, /eur$/, /euse$/, /ique$/, /able$/, /ible$/,
        /ais$/, /ait$/, /ant$/, /ent$/, /oux$/, /eaux$/
      ],
      characterFrequency: {
        'e': 17.3, 's': 7.9, 'a': 7.6, 'i': 7.5, 't': 7.2, 'n': 7.1,
        'r': 6.6, 'u': 6.3, 'l': 5.5, 'o': 5.4, 'd': 3.7, 'c': 3.2
      },
      weight: 0
    });

    // German patterns
    this.languagePatterns.set('de', {
      commonWords: [
        'der', 'die', 'und', 'in', 'den', 'von', 'zu', 'das', 'mit', 'sich',
        'des', 'auf', 'für', 'ist', 'im', 'dem', 'nicht', 'ein', 'eine',
        'als', 'auch', 'es', 'an', 'werden', 'aus', 'er', 'hat', 'dass',
        'sie', 'nach', 'wird', 'bei', 'einer', 'um', 'am', 'sind', 'noch',
        'wie', 'einem', 'über', 'einen', 'so', 'zum', 'war', 'haben', 'nur'
      ],
      patterns: [
        /ung$/, /keit$/, /lich$/, /isch$/, /heit$/, /tum$/, /schaft$/,
        /chen$/, /lein$/, /bar$/, /los$/, /voll$/, /reich$/
      ],
      characterFrequency: {
        'e': 17.4, 'n': 9.8, 'i': 7.5, 's': 7.3, 'r': 7.0, 'a': 6.5,
        't': 6.2, 'd': 5.1, 'h': 4.8, 'u': 4.4, 'l': 3.4, 'c': 3.1
      },
      weight: 0
    });

    // Italian patterns
    this.languagePatterns.set('it', {
      commonWords: [
        'il', 'di', 'che', 'e', 'la', 'un', 'a', 'per', 'non', 'in',
        'una', 'si', 'con', 'lo', 'da', 'del', 'sono', 'al', 'le', 'su',
        'come', 'più', 'questo', 'ma', 'tutto', 'anche', 'molto', 'essere',
        'fare', 'dire', 'andare', 'vedere', 'sapere', 'dare', 'volere',
        'venire', 'stare', 'dovere', 'potere', 'uscire', 'parlare'
      ],
      patterns: [
        /zione$/, /mente$/, /ando$/, /endo$/, /ato$/, /ito$/, /uto$/,
        /are$/, /ere$/, /ire$/, /oso$/, /osa$/, /ivo$/, /iva$/
      ],
      characterFrequency: {
        'e': 11.8, 'a': 11.7, 'i': 11.3, 'o': 9.8, 'n': 6.9, 'r': 6.4,
        't': 5.6, 'l': 6.5, 's': 5.0, 'c': 4.5, 'd': 3.7, 'u': 3.0
      },
      weight: 0
    });

    // Portuguese patterns
    this.languagePatterns.set('pt', {
      commonWords: [
        'o', 'de', 'a', 'e', 'do', 'da', 'em', 'um', 'para', 'é',
        'com', 'não', 'uma', 'os', 'no', 'se', 'na', 'por', 'mais', 'as',
        'dos', 'como', 'mas', 'foi', 'ao', 'ele', 'das', 'tem', 'à', 'seu',
        'sua', 'ou', 'ser', 'quando', 'muito', 'há', 'nos', 'já', 'está',
        'eu', 'também', 'só', 'pelo', 'pela', 'até', 'isso', 'ela'
      ],
      patterns: [
        /ção$/, /mente$/, /ando$/, /endo$/, /ado$/, /ido$/, /oso$/, /osa$/,
        /ar$/, /er$/, /ir$/, /dade$/, /tude$/, /agem$/, /ável$/, /ível$/
      ],
      characterFrequency: {
        'a': 14.6, 'e': 12.6, 'o': 10.7, 's': 7.8, 'r': 6.5, 'i': 6.2,
        'n': 5.2, 'd': 5.0, 'm': 4.7, 'u': 4.6, 't': 4.3, 'c': 3.9
      },
      weight: 0
    });
  }

  /**
   * Perform multi-method language detection
   */
  private performMultiMethodDetection(text: string): LanguageDetectionResult {
    const cleanText = text.toLowerCase().replace(/[^\w\s]/g, '');
    const words = cleanText.split(/\s+/).filter(word => word.length > 0);
    
    if (words.length === 0) {
      return {
        language: 'en',
        confidence: 0.1,
        alternativeLanguages: []
      };
    }

    // Reset weights
    this.languagePatterns.forEach(pattern => {
      pattern.weight = 0;
    });

    // Method 1: Common word analysis
    this.analyzeCommonWords(words);

    // Method 2: Pattern matching
    this.analyzePatterns(words);

    // Method 3: Character frequency analysis
    this.analyzeCharacterFrequency(cleanText);

    // Method 4: N-gram analysis
    this.analyzeNGrams(cleanText);

    // Calculate final scores
    const results = Array.from(this.languagePatterns.entries())
      .map(([lang, pattern]) => ({
        language: lang,
        score: pattern.weight
      }))
      .sort((a, b) => b.score - a.score);

    const topResult = results[0];
    const totalScore = results.reduce((sum, r) => sum + Math.max(0, r.score), 0);
    
    const confidence = totalScore > 0 
      ? Math.min(0.95, Math.max(0.1, topResult.score / totalScore))
      : 0.1;

    const alternativeLanguages = results
      .slice(1, 4)
      .filter(r => r.score > 0)
      .map(r => ({
        language: r.language,
        confidence: Math.min(0.8, Math.max(0.05, r.score / totalScore))
      }));

    return {
      language: topResult.language,
      confidence,
      alternativeLanguages
    };
  }

  /**
   * Analyze common words for language detection
   */
  private analyzeCommonWords(words: string[]): void {
    this.languagePatterns.forEach((pattern, lang) => {
      const matches = words.filter(word => pattern.commonWords.includes(word)).length;
      pattern.weight += matches * 3; // High weight for common words
    });
  }

  /**
   * Analyze morphological patterns
   */
  private analyzePatterns(words: string[]): void {
    this.languagePatterns.forEach((pattern, lang) => {
      const matches = words.filter(word => 
        pattern.patterns.some(regex => regex.test(word))
      ).length;
      pattern.weight += matches * 2; // Medium weight for patterns
    });
  }

  /**
   * Analyze character frequency
   */
  private analyzeCharacterFrequency(text: string): void {
    const charCounts: Record<string, number> = {};
    const totalChars = text.length;

    // Count character frequencies
    for (const char of text) {
      if (/[a-z]/.test(char)) {
        charCounts[char] = (charCounts[char] || 0) + 1;
      }
    }

    // Compare with expected frequencies
    this.languagePatterns.forEach((pattern, lang) => {
      let score = 0;
      Object.entries(pattern.characterFrequency).forEach(([char, expectedFreq]) => {
        const actualFreq = ((charCounts[char] || 0) / totalChars) * 100;
        const difference = Math.abs(actualFreq - expectedFreq);
        score += Math.max(0, 5 - difference); // Closer frequencies get higher scores
      });
      pattern.weight += score * 0.1; // Low weight for character frequency
    });
  }

  /**
   * Analyze n-grams for language detection
   */
  private analyzeNGrams(text: string): void {
    const bigrams = this.extractBigrams(text);
    const trigrams = this.extractTrigrams(text);

    // Language-specific n-gram patterns
    const ngramPatterns: Record<string, { bigrams: string[]; trigrams: string[] }> = {
      en: {
        bigrams: ['th', 'he', 'in', 'er', 'an', 're', 'ed', 'nd', 'on', 'en'],
        trigrams: ['the', 'and', 'ing', 'her', 'hat', 'his', 'tha', 'ere', 'for', 'ent']
      },
      es: {
        bigrams: ['de', 'la', 'el', 'en', 'es', 'un', 'te', 'al', 'qu', 'co'],
        trigrams: ['que', 'ent', 'ion', 'con', 'est', 'par', 'ado', 'del', 'los', 'las']
      },
      fr: {
        bigrams: ['le', 'de', 'es', 'en', 'on', 'nt', 're', 'er', 'te', 'el'],
        trigrams: ['les', 'des', 'ent', 'ion', 'que', 'lle', 'con', 'tre', 'men', 'tio']
      },
      de: {
        bigrams: ['er', 'en', 'ch', 'de', 'ei', 'ie', 'in', 'te', 'nd', 'st'],
        trigrams: ['der', 'die', 'und', 'ich', 'den', 'ein', 'sch', 'ver', 'ung', 'cht']
      },
      it: {
        bigrams: ['di', 'la', 'il', 'le', 'er', 'on', 'in', 'an', 'ar', 'en'],
        trigrams: ['che', 'per', 'con', 'del', 'una', 'ion', 'ent', 'are', 'ere', 'ire']
      },
      pt: {
        bigrams: ['de', 'da', 'do', 'em', 'os', 'as', 'es', 'te', 'en', 'ar'],
        trigrams: ['que', 'ent', 'ado', 'par', 'com', 'est', 'dos', 'das', 'ção', 'men']
      }
    };

    Object.entries(ngramPatterns).forEach(([lang, patterns]) => {
      const pattern = this.languagePatterns.get(lang);
      if (!pattern) return;

      // Score bigrams
      const bigramMatches = patterns.bigrams.filter(bg => bigrams.includes(bg)).length;
      pattern.weight += bigramMatches * 0.5;

      // Score trigrams
      const trigramMatches = patterns.trigrams.filter(tg => trigrams.includes(tg)).length;
      pattern.weight += trigramMatches * 0.8;
    });
  }

  /**
   * Extract bigrams from text
   */
  private extractBigrams(text: string): string[] {
    const bigrams: string[] = [];
    for (let i = 0; i < text.length - 1; i++) {
      const bigram = text.slice(i, i + 2);
      if (/^[a-z]{2}$/.test(bigram)) {
        bigrams.push(bigram);
      }
    }
    return [...new Set(bigrams)]; // Remove duplicates
  }

  /**
   * Extract trigrams from text
   */
  private extractTrigrams(text: string): string[] {
    const trigrams: string[] = [];
    for (let i = 0; i < text.length - 2; i++) {
      const trigram = text.slice(i, i + 3);
      if (/^[a-z]{3}$/.test(trigram)) {
        trigrams.push(trigram);
      }
    }
    return [...new Set(trigrams)]; // Remove duplicates
  }

  /**
   * Generate cache key for text
   */
  private generateCacheKey(text: string): string {
    // Create a hash-like key from the text
    const cleanText = text.toLowerCase().replace(/[^\w\s]/g, '').trim();
    if (cleanText.length <= 50) {
      return cleanText;
    }
    
    // For longer texts, create a representative key
    const words = cleanText.split(/\s+/);
    const keyWords = [
      ...words.slice(0, 5),  // First 5 words
      ...words.slice(-5)     // Last 5 words
    ].join(' ');
    
    return `${keyWords}_${words.length}_${cleanText.length}`;
  }
}