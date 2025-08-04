export interface PhonemeData {
  phoneme: string;
  startTime: number;
  endTime: number;
  confidence: number;
  viseme: string; // Visual representation for lip sync
}

export interface ProcessedSpeechData {
  text: string;
  duration: number;
  phonemes: PhonemeData[];
  words: Array<{
    word: string;
    startTime: number;
    endTime: number;
    phonemes: PhonemeData[];
  }>;
}

/**
 * Advanced phoneme preprocessor for accurate lip sync timing
 * This generates phoneme timing data before TTS synthesis for precise lip sync
 */
export class PhonemePreprocessor {
  private readonly AVERAGE_SPEAKING_RATE = 150; // words per minute
  private readonly PHONEME_DURATION_MS = 80; // average phoneme duration in milliseconds
  private readonly PAUSE_DURATION_MS = 200; // pause between words
  private readonly SENTENCE_PAUSE_MS = 500; // pause between sentences

  /**
   * Process text and generate phoneme timing data
   */
  processText(text: string, languageCode: string = 'en-US'): ProcessedSpeechData {
    const cleanText = this.cleanText(text);
    const sentences = this.splitIntoSentences(cleanText);
    
    let currentTime = 0;
    const allPhonemes: PhonemeData[] = [];
    const allWords: Array<{
      word: string;
      startTime: number;
      endTime: number;
      phonemes: PhonemeData[];
    }> = [];

    // Add initial silence
    allPhonemes.push({
      phoneme: 'SIL',
      startTime: 0,
      endTime: 100,
      confidence: 1.0,
      viseme: 'sil'
    });
    currentTime = 100;

    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i];
      const words = this.tokenizeWords(sentence);
      
      for (let j = 0; j < words.length; j++) {
        const word = words[j];
        const wordPhonemes = this.getPhonemeSequence(word, languageCode);
        const wordStartTime = currentTime;
        
        const wordPhonemeData: PhonemeData[] = [];
        
        // Generate phonemes for this word
        for (const phoneme of wordPhonemes) {
          const duration = this.getPhonemeBaseDuration(phoneme);
          const phonemeData: PhonemeData = {
            phoneme,
            startTime: currentTime,
            endTime: currentTime + duration,
            confidence: 0.9,
            viseme: this.phonemeToViseme(phoneme)
          };
          
          allPhonemes.push(phonemeData);
          wordPhonemeData.push(phonemeData);
          currentTime += duration;
        }
        
        // Add word to words array
        allWords.push({
          word,
          startTime: wordStartTime,
          endTime: currentTime,
          phonemes: wordPhonemeData
        });
        
        // Add pause between words (except last word in sentence)
        if (j < words.length - 1) {
          allPhonemes.push({
            phoneme: 'SIL',
            startTime: currentTime,
            endTime: currentTime + this.PAUSE_DURATION_MS,
            confidence: 1.0,
            viseme: 'sil'
          });
          currentTime += this.PAUSE_DURATION_MS;
        }
      }
      
      // Add pause between sentences (except last sentence)
      if (i < sentences.length - 1) {
        allPhonemes.push({
          phoneme: 'SIL',
          startTime: currentTime,
          endTime: currentTime + this.SENTENCE_PAUSE_MS,
          confidence: 1.0,
          viseme: 'sil'
        });
        currentTime += this.SENTENCE_PAUSE_MS;
      }
    }

    // Add final silence
    allPhonemes.push({
      phoneme: 'SIL',
      startTime: currentTime,
      endTime: currentTime + 200,
      confidence: 1.0,
      viseme: 'sil'
    });
    currentTime += 200;

    return {
      text: cleanText,
      duration: currentTime,
      phonemes: allPhonemes,
      words: allWords
    };
  }

  /**
   * Clean text for processing
   */
  private cleanText(text: string): string {
    // Remove HTML tags
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = text;
    let cleanText = tempDiv.textContent || tempDiv.innerText || '';
    
    // Normalize text
    cleanText = cleanText
      .replace(/\s+/g, ' ')
      .replace(/[""]/g, '"')
      .replace(/['']/g, "'")
      .trim();
    
    return cleanText;
  }

  /**
   * Split text into sentences
   */
  private splitIntoSentences(text: string): string[] {
    return text
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
  }

  /**
   * Tokenize sentence into words
   */
  private tokenizeWords(sentence: string): string[] {
    return sentence
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 0);
  }

  /**
   * Get phoneme sequence for a word based on language
   */
  private getPhonemeSequence(word: string, languageCode: string): string[] {
    // Enhanced phoneme dictionary with better coverage
    const phonemeDictionary = this.getPhonemeDict(languageCode);
    
    if (phonemeDictionary[word]) {
      return phonemeDictionary[word];
    }
    
    // Fallback: generate phonemes using grapheme-to-phoneme rules
    return this.graphemeToPhoneme(word, languageCode);
  }

  /**
   * Get phoneme dictionary for language
   */
  private getPhonemeDict(languageCode: string): Record<string, string[]> {
    const baseDict = {
      // Common words with accurate phoneme mappings
      'hello': ['HH', 'AH', 'L', 'OW'],
      'help': ['HH', 'EH', 'L', 'P'],
      'how': ['HH', 'AW'],
      'are': ['AA', 'R'],
      'you': ['Y', 'UW'],
      'today': ['T', 'AH', 'D', 'EY'],
      'good': ['G', 'UH', 'D'],
      'great': ['G', 'R', 'EY', 'T'],
      'step': ['S', 'T', 'EH', 'P'],
      'click': ['K', 'L', 'IH', 'K'],
      'button': ['B', 'AH', 'T', 'AH', 'N'],
      'the': ['DH', 'AH'],
      'and': ['AE', 'N', 'D'],
      'with': ['W', 'IH', 'TH'],
      'this': ['DH', 'IH', 'S'],
      'that': ['DH', 'AE', 'T'],
      'will': ['W', 'IH', 'L'],
      'can': ['K', 'AE', 'N'],
      'now': ['N', 'AW'],
      'see': ['S', 'IY'],
      'get': ['G', 'EH', 'T'],
      'make': ['M', 'EY', 'K'],
      'go': ['G', 'OW'],
      'know': ['N', 'OW'],
      'take': ['T', 'EY', 'K'],
      'come': ['K', 'AH', 'M'],
      'think': ['TH', 'IH', 'NG', 'K'],
      'look': ['L', 'UH', 'K'],
      'want': ['W', 'AA', 'N', 'T'],
      'give': ['G', 'IH', 'V'],
      'use': ['Y', 'UW', 'Z'],
      'find': ['F', 'AY', 'N', 'D'],
      'tell': ['T', 'EH', 'L'],
      'ask': ['AE', 'S', 'K'],
      'work': ['W', 'ER', 'K'],
      'seem': ['S', 'IY', 'M'],
      'feel': ['F', 'IY', 'L'],
      'try': ['T', 'R', 'AY'],
      'leave': ['L', 'IY', 'V'],
      'call': ['K', 'AO', 'L'],
      'first': ['F', 'ER', 'S', 'T'],
      'next': ['N', 'EH', 'K', 'S', 'T'],
      'then': ['DH', 'EH', 'N'],
      'here': ['HH', 'IY', 'R'],
      'there': ['DH', 'EH', 'R'],
      'where': ['W', 'EH', 'R'],
      'when': ['W', 'EH', 'N'],
      'what': ['W', 'AH', 'T'],
      'why': ['W', 'AY'],
      'who': ['HH', 'UW'],
      'which': ['W', 'IH', 'CH'],
      'would': ['W', 'UH', 'D'],
      'could': ['K', 'UH', 'D'],
      'should': ['SH', 'UH', 'D'],
      'about': ['AH', 'B', 'AW', 'T'],
      'after': ['AE', 'F', 'T', 'ER'],
      'before': ['B', 'IH', 'F', 'AO', 'R'],
      'during': ['D', 'UH', 'R', 'IH', 'NG'],
      'through': ['TH', 'R', 'UW'],
      'between': ['B', 'IH', 'T', 'W', 'IY', 'N'],
      'under': ['AH', 'N', 'D', 'ER'],
      'over': ['OW', 'V', 'ER'],
      'above': ['AH', 'B', 'AH', 'V'],
      'below': ['B', 'IH', 'L', 'OW'],
      'inside': ['IH', 'N', 'S', 'AY', 'D'],
      'outside': ['AW', 'T', 'S', 'AY', 'D'],
      'computer': ['K', 'AH', 'M', 'P', 'Y', 'UW', 'T', 'ER'],
      'internet': ['IH', 'N', 'T', 'ER', 'N', 'EH', 'T'],
      'email': ['IY', 'M', 'EY', 'L'],
      'password': ['P', 'AE', 'S', 'W', 'ER', 'D'],
      'website': ['W', 'EH', 'B', 'S', 'AY', 'T'],
      'browser': ['B', 'R', 'AW', 'Z', 'ER'],
      'search': ['S', 'ER', 'CH'],
      'download': ['D', 'AW', 'N', 'L', 'OW', 'D'],
      'upload': ['AH', 'P', 'L', 'OW', 'D'],
      'save': ['S', 'EY', 'V'],
      'open': ['OW', 'P', 'AH', 'N'],
      'close': ['K', 'L', 'OW', 'Z'],
      'delete': ['D', 'IH', 'L', 'IY', 'T'],
      'copy': ['K', 'AA', 'P', 'IY'],
      'paste': ['P', 'EY', 'S', 'T'],
      'print': ['P', 'R', 'IH', 'N', 'T'],
      'file': ['F', 'AY', 'L'],
      'folder': ['F', 'OW', 'L', 'D', 'ER'],
      'document': ['D', 'AA', 'K', 'Y', 'AH', 'M', 'AH', 'N', 'T'],
      'picture': ['P', 'IH', 'K', 'CH', 'ER'],
      'video': ['V', 'IH', 'D', 'IY', 'OW'],
      'music': ['M', 'Y', 'UW', 'Z', 'IH', 'K'],
      'phone': ['F', 'OW', 'N'],
      'tablet': ['T', 'AE', 'B', 'L', 'AH', 'T'],
      'screen': ['S', 'K', 'R', 'IY', 'N'],
      'keyboard': ['K', 'IY', 'B', 'AO', 'R', 'D'],
      'mouse': ['M', 'AW', 'S'],
      'menu': ['M', 'EH', 'N', 'Y', 'UW'],
      'settings': ['S', 'EH', 'T', 'IH', 'NG', 'Z'],
      'options': ['AA', 'P', 'SH', 'AH', 'N', 'Z'],
      'preferences': ['P', 'R', 'EH', 'F', 'ER', 'AH', 'N', 'S', 'AH', 'Z']
    };

    // Language-specific extensions could be added here
    if (languageCode.startsWith('es')) {
      // Spanish phonemes would go here
    } else if (languageCode.startsWith('fr')) {
      // French phonemes would go here
    }
    // Add more languages as needed

    return baseDict;
  }

  /**
   * Convert graphemes to phonemes using basic rules
   */
  private graphemeToPhoneme(word: string, languageCode: string): string[] {
    const phonemes: string[] = [];
    
    for (let i = 0; i < word.length; i++) {
      const char = word[i].toLowerCase();
      const nextChar = i < word.length - 1 ? word[i + 1].toLowerCase() : '';
      
      // Handle common digraphs and trigraphs
      if (char === 't' && nextChar === 'h') {
        phonemes.push('TH');
        i++; // skip next character
      } else if (char === 's' && nextChar === 'h') {
        phonemes.push('SH');
        i++; // skip next character
      } else if (char === 'c' && nextChar === 'h') {
        phonemes.push('CH');
        i++; // skip next character
      } else if (char === 'n' && nextChar === 'g') {
        phonemes.push('NG');
        i++; // skip next character
      } else if ('aeiou'.includes(char)) {
        // Map vowels
        const vowelMap: Record<string, string> = {
          'a': 'AA', 'e': 'EH', 'i': 'IH', 'o': 'AO', 'u': 'UH'
        };
        phonemes.push(vowelMap[char] || 'AA');
      } else if ('bcdfghjklmnpqrstvwxyz'.includes(char)) {
        // Map consonants
        const consonantMap: Record<string, string> = {
          'b': 'B', 'c': 'K', 'd': 'D', 'f': 'F', 'g': 'G',
          'h': 'HH', 'j': 'JH', 'k': 'K', 'l': 'L', 'm': 'M',
          'n': 'N', 'p': 'P', 'q': 'K', 'r': 'R', 's': 'S',
          't': 'T', 'v': 'V', 'w': 'W', 'x': 'K', 'y': 'Y', 'z': 'Z'
        };
        phonemes.push(consonantMap[char] || 'B');
      }
    }
    
    return phonemes.length > 0 ? phonemes : ['SIL'];
  }

  /**
   * Get base duration for a phoneme
   */
  private getPhonemeBaseDuration(phoneme: string): number {
    // Different phonemes have different natural durations
    const durationMap: Record<string, number> = {
      // Vowels (longer)
      'AA': 120, 'AE': 110, 'AH': 90, 'AO': 130, 'AW': 140,
      'AY': 150, 'EH': 100, 'ER': 110, 'EY': 140, 'IH': 80,
      'IY': 120, 'OW': 140, 'OY': 150, 'UH': 90, 'UW': 130,
      
      // Consonants (shorter)
      'B': 60, 'CH': 80, 'D': 50, 'DH': 40, 'F': 70, 'G': 60,
      'HH': 50, 'JH': 80, 'K': 60, 'L': 70, 'M': 80, 'N': 70,
      'NG': 90, 'P': 60, 'R': 80, 'S': 90, 'SH': 100, 'T': 50,
      'TH': 70, 'V': 60, 'W': 70, 'Y': 60, 'Z': 80, 'ZH': 90,
      
      // Silence
      'SIL': 100
    };
    
    return durationMap[phoneme] || this.PHONEME_DURATION_MS;
  }

  /**
   * Convert phoneme to viseme for lip sync animation
   */
  private phonemeToViseme(phoneme: string): string {
    // Map phonemes to visemes (mouth shapes)
    const visemeMap: Record<string, string> = {
      // Silence
      'SIL': 'sil',
      
      // Bilabial sounds (lips together)
      'B': 'PP', 'P': 'PP', 'M': 'PP',
      
      // Labiodental sounds (lip to teeth)
      'F': 'FF', 'V': 'FF',
      
      // Dental/Alveolar sounds (tongue to teeth/ridge)
      'TH': 'TH', 'DH': 'TH',
      'T': 'DD', 'D': 'DD', 'N': 'DD', 'L': 'DD',
      'S': 'SS', 'Z': 'SS',
      
      // Post-alveolar sounds
      'SH': 'CH', 'ZH': 'CH', 'CH': 'CH', 'JH': 'CH',
      
      // Velar sounds (back of tongue)
      'K': 'kk', 'G': 'kk', 'NG': 'kk',
      
      // Glottal
      'HH': 'sil',
      
      // Approximants
      'R': 'RR', 'W': 'W', 'Y': 'I',
      
      // Vowels - mouth opening and shape
      'AA': 'AA', 'AE': 'AA', 'AH': 'AA', 'AO': 'O',
      'AW': 'O', 'AY': 'I', 'EH': 'E', 'ER': 'E',
      'EY': 'I', 'IH': 'I', 'IY': 'I', 'OW': 'O',
      'OY': 'O', 'UH': 'U', 'UW': 'U'
    };
    
    return visemeMap[phoneme] || 'sil';
  }

  /**
   * Adjust timing based on speaking rate
   */
  adjustTiming(phonemes: PhonemeData[], speakingRate: number = 1.0): PhonemeData[] {
    const rate = Math.max(0.5, Math.min(2.0, speakingRate));
    
    return phonemes.map(phoneme => ({
      ...phoneme,
      startTime: phoneme.startTime / rate,
      endTime: phoneme.endTime / rate
    }));
  }

  /**
   * Get phoneme at specific time
   */
  getPhonemeAtTime(phonemes: PhonemeData[], timeMs: number): PhonemeData | null {
    return phonemes.find(p => timeMs >= p.startTime && timeMs <= p.endTime) || null;
  }

  /**
   * Convert phoneme data to include proper visemes
   */
  convertPhonemesToVisemes(phonemes: Array<{ phoneme: string; timestamp: number; confidence: number }>): PhonemeData[] {
    return phonemes.map((p, index) => {
      const nextPhoneme = phonemes[index + 1];
      const endTime = nextPhoneme ? nextPhoneme.timestamp : p.timestamp + 100;
      
      return {
        phoneme: p.phoneme,
        startTime: p.timestamp,
        endTime: endTime,
        confidence: p.confidence,
        viseme: this.phonemeToViseme(p.phoneme)
      };
    });
  }
}