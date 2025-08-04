/**
 * LanguageDetectionService - Detects language changes and manages accent switching
 * 
 * This service monitors text input for language changes and coordinates smooth
 * transitions between different accent profiles and TTS settings.
 * 
 * Requirements addressed:
 * - 2.1: Language change event handling
 * - 2.2: English pronunciation and speech timing
 * - 2.3: Spanish accent patterns and rhythm
 * - 2.4: French accent patterns and pronunciation
 * - 2.5: Other supported language adaptations
 */

export interface LanguageDetectionResult {
  language: string;
  confidence: number;
  region?: string;
  detectionMethod: 'pattern' | 'dictionary' | 'heuristic';
}

export interface LanguageChangeEvent {
  previousLanguage: string;
  newLanguage: string;
  confidence: number;
  timestamp: number;
  textSample: string;
}

export type LanguageChangeListener = (event: LanguageChangeEvent) => void;

export class LanguageDetectionService {
  private currentLanguage: string = 'en-US';
  private languageChangeListeners: LanguageChangeListener[] = [];
  private detectionCache: Map<string, LanguageDetectionResult> = new Map();
  private languagePatterns: Map<string, RegExp[]> = new Map();
  private commonWords: Map<string, string[]> = new Map();

  constructor() {
    this.initializeLanguagePatterns();
    this.initializeCommonWords();
  }

  /**
   * Detects the language of the given text
   */
  public detectLanguage(text: string): LanguageDetectionResult {
    // Check cache first
    const cacheKey = this.generateCacheKey(text);
    if (this.detectionCache.has(cacheKey)) {
      return this.detectionCache.get(cacheKey)!;
    }

    const result = this.performLanguageDetection(text);
    
    // Cache the result
    this.detectionCache.set(cacheKey, result);
    
    // Clean cache if it gets too large
    if (this.detectionCache.size > 1000) {
      this.cleanCache();
    }

    return result;
  }

  /**
   * Processes text and triggers language change events if needed
   */
  public processText(text: string): LanguageDetectionResult {
    const detectionResult = this.detectLanguage(text);
    
    // Check if language has changed
    if (detectionResult.language !== this.currentLanguage && detectionResult.confidence > 0.7) {
      const changeEvent: LanguageChangeEvent = {
        previousLanguage: this.currentLanguage,
        newLanguage: detectionResult.language,
        confidence: detectionResult.confidence,
        timestamp: Date.now(),
        textSample: text.substring(0, 100) // First 100 characters
      };

      this.currentLanguage = detectionResult.language;
      this.notifyLanguageChange(changeEvent);
    }

    return detectionResult;
  }

  /**
   * Gets the current detected language
   */
  public getCurrentLanguage(): string {
    return this.currentLanguage;
  }

  /**
   * Sets the current language manually (overrides detection)
   */
  public setCurrentLanguage(language: string): void {
    if (language !== this.currentLanguage) {
      const changeEvent: LanguageChangeEvent = {
        previousLanguage: this.currentLanguage,
        newLanguage: language,
        confidence: 1.0, // Manual setting has full confidence
        timestamp: Date.now(),
        textSample: 'Manual language change'
      };

      this.currentLanguage = language;
      this.notifyLanguageChange(changeEvent);
    }
  }

  /**
   * Adds a listener for language change events
   */
  public addLanguageChangeListener(listener: LanguageChangeListener): void {
    this.languageChangeListeners.push(listener);
  }

  /**
   * Removes a language change listener
   */
  public removeLanguageChangeListener(listener: LanguageChangeListener): void {
    const index = this.languageChangeListeners.indexOf(listener);
    if (index > -1) {
      this.languageChangeListeners.splice(index, 1);
    }
  }

  /**
   * Gets supported languages
   */
  public getSupportedLanguages(): string[] {
    return Array.from(this.languagePatterns.keys());
  }

  /**
   * Clears the detection cache
   */
  public clearCache(): void {
    this.detectionCache.clear();
  }

  // Private methods

  private initializeLanguagePatterns(): void {
    // English patterns
    this.languagePatterns.set('en-US', [
      /\b(the|and|or|but|in|on|at|to|for|of|with|by)\b/gi,
      /\b(is|are|was|were|be|been|being|have|has|had|do|does|did)\b/gi,
      /\b(this|that|these|those|here|there|where|when|what|who|how|why)\b/gi,
      /ing\b/gi,
      /\bed\b/gi
    ]);

    // Spanish patterns
    this.languagePatterns.set('es-ES', [
      /\b(el|la|los|las|un|una|y|o|pero|en|con|de|por|para)\b/gi,
      /\b(es|son|está|están|ser|estar|tener|hacer|ir|venir)\b/gi,
      /\b(que|qué|quién|cuándo|dónde|cómo|por qué|porque)\b/gi,
      /ción\b/gi,
      /ando\b|endo\b/gi,
      /[ñáéíóúü]/gi
    ]);

    // French patterns
    this.languagePatterns.set('fr-FR', [
      /\b(le|la|les|un|une|et|ou|mais|dans|avec|de|par|pour)\b/gi,
      /\b(est|sont|être|avoir|faire|aller|venir|voir|savoir)\b/gi,
      /\b(que|qu'|qui|quand|où|comment|pourquoi|parce que)\b/gi,
      /tion\b/gi,
      /ment\b/gi,
      /[àâäéèêëïîôöùûüÿç]/gi
    ]);

    // German patterns
    this.languagePatterns.set('de-DE', [
      /\b(der|die|das|ein|eine|und|oder|aber|in|mit|von|zu|für)\b/gi,
      /\b(ist|sind|war|waren|sein|haben|werden|können|müssen)\b/gi,
      /\b(was|wer|wann|wo|wie|warum|dass|wenn|weil)\b/gi,
      /ung\b/gi,
      /lich\b/gi,
      /[äöüß]/gi
    ]);

    // Italian patterns
    this.languagePatterns.set('it-IT', [
      /\b(il|la|lo|gli|le|un|una|e|o|ma|in|con|di|da|per)\b/gi,
      /\b(è|sono|essere|avere|fare|andare|venire|vedere|sapere)\b/gi,
      /\b(che|chi|quando|dove|come|perché|perchè)\b/gi,
      /zione\b/gi,
      /mente\b/gi,
      /[àèéìíîòóù]/gi
    ]);
  }

  private initializeCommonWords(): void {
    this.commonWords.set('en-US', [
      'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
      'this', 'that', 'these', 'those', 'here', 'there', 'where', 'when', 'what'
    ]);

    this.commonWords.set('es-ES', [
      'el', 'la', 'los', 'las', 'un', 'una', 'y', 'o', 'pero', 'en', 'con', 'de',
      'es', 'son', 'está', 'están', 'ser', 'estar', 'tener', 'hacer', 'ir',
      'que', 'qué', 'quién', 'cuándo', 'dónde', 'cómo', 'por', 'para'
    ]);

    this.commonWords.set('fr-FR', [
      'le', 'la', 'les', 'un', 'une', 'et', 'ou', 'mais', 'dans', 'avec', 'de',
      'est', 'sont', 'être', 'avoir', 'faire', 'aller', 'venir', 'voir',
      'que', 'qui', 'quand', 'où', 'comment', 'pourquoi', 'parce'
    ]);

    this.commonWords.set('de-DE', [
      'der', 'die', 'das', 'ein', 'eine', 'und', 'oder', 'aber', 'in', 'mit',
      'ist', 'sind', 'war', 'waren', 'sein', 'haben', 'werden', 'können',
      'was', 'wer', 'wann', 'wo', 'wie', 'warum', 'dass', 'wenn'
    ]);

    this.commonWords.set('it-IT', [
      'il', 'la', 'lo', 'gli', 'le', 'un', 'una', 'e', 'o', 'ma', 'in', 'con',
      'è', 'sono', 'essere', 'avere', 'fare', 'andare', 'venire', 'vedere',
      'che', 'chi', 'quando', 'dove', 'come', 'perché'
    ]);
  }

  private performLanguageDetection(text: string): LanguageDetectionResult {
    const cleanText = text.toLowerCase().trim();
    
    if (cleanText.length < 10) {
      // Too short for reliable detection, return current language
      return {
        language: this.currentLanguage,
        confidence: 0.5,
        detectionMethod: 'heuristic'
      };
    }

    const scores: Map<string, number> = new Map();

    // Pattern-based detection
    for (const [language, patterns] of this.languagePatterns) {
      let score = 0;
      for (const pattern of patterns) {
        const matches = cleanText.match(pattern);
        if (matches) {
          score += matches.length;
        }
      }
      scores.set(language, score);
    }

    // Dictionary-based detection
    for (const [language, words] of this.commonWords) {
      let currentScore = scores.get(language) || 0;
      for (const word of words) {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        const matches = cleanText.match(regex);
        if (matches) {
          currentScore += matches.length * 2; // Weight dictionary matches higher
        }
      }
      scores.set(language, currentScore);
    }

    // Find the language with the highest score
    let bestLanguage = this.currentLanguage;
    let bestScore = 0;
    
    for (const [language, score] of scores) {
      if (score > bestScore) {
        bestScore = score;
        bestLanguage = language;
      }
    }

    // Calculate confidence based on score and text length
    const textWords = cleanText.split(/\s+/).length;
    const confidence = Math.min(0.95, bestScore / (textWords * 0.5));

    return {
      language: bestLanguage,
      confidence,
      detectionMethod: bestScore > 0 ? 'pattern' : 'heuristic'
    };
  }

  private generateCacheKey(text: string): string {
    // Create a hash-like key from the text
    const cleanText = text.toLowerCase().replace(/[^\w\s]/g, '').substring(0, 200);
    return cleanText.split('').reduce((hash, char) => {
      return ((hash << 5) - hash + char.charCodeAt(0)) & 0xffffffff;
    }, 0).toString();
  }

  private cleanCache(): void {
    // Remove oldest entries (simple FIFO)
    const entries = Array.from(this.detectionCache.entries());
    const toKeep = entries.slice(-500); // Keep last 500 entries
    
    this.detectionCache.clear();
    toKeep.forEach(([key, value]) => {
      this.detectionCache.set(key, value);
    });
  }

  private notifyLanguageChange(event: LanguageChangeEvent): void {
    console.log(`🌍 Language changed: ${event.previousLanguage} → ${event.newLanguage} (confidence: ${event.confidence.toFixed(2)})`);
    
    this.languageChangeListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in language change listener:', error);
      }
    });
  }
}

// Singleton instance
export const languageDetectionService = new LanguageDetectionService();