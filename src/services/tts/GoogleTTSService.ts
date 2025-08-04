export interface GoogleTTSOptions {
  voice?: {
    languageCode: string;
    name?: string;
    ssmlGender?: 'NEUTRAL' | 'FEMALE' | 'MALE';
  };
  audioConfig?: {
    audioEncoding: 'MP3' | 'LINEAR16' | 'OGG_OPUS';
    speakingRate?: number;
    pitch?: number;
    volumeGainDb?: number;
    sampleRateHertz?: number;
  };
}

export interface AudioPlaybackState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  speed: number;
  volume: number;
}

export interface AudioPlaybackCallbacks {
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: string) => void;
  onProgress?: (currentTime: number, duration: number) => void;
  onSpeedChange?: (speed: number) => void;
}

export interface LipSyncData {
  audioBlob: Blob;
  duration: number;
  phonemes: Array<{ phoneme: string; timestamp: number; confidence: number }>;
}

export class GoogleTTSService {
  private apiKey: string;
  private currentAudio: HTMLAudioElement | null = null;
  private isPlaying = false;
  private currentSpeed = 1.0;
  private currentVolume = 1.0;
  private progressInterval: NodeJS.Timeout | null = null;
  private callbacks: AudioPlaybackCallbacks = {};
  private baseUrl = 'https://texttospeech.googleapis.com/v1/text:synthesize';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Convert text to speech using Google Cloud Text-to-Speech API
   */
  async speak(
    text: string,
    options: GoogleTTSOptions = {},
    callbacks: AudioPlaybackCallbacks = {}
  ): Promise<void> {
    try {
      this.callbacks = callbacks;
      
      // Stop any currently playing audio
      this.stop();

      // Clean text for better speech synthesis
      const cleanText = this.cleanTextForSpeech(text);
      
      if (!cleanText.trim()) {
        callbacks.onError?.('No text to speak');
        return;
      }

      callbacks.onStart?.();
      this.isPlaying = true;

      // Synthesize speech with Google TTS
      const audioBlob = await this.synthesizeSpeech(cleanText, options);
      
      // Play the audio
      await this.playAudioBlob(audioBlob, callbacks);

    } catch (error) {
      this.isPlaying = false;
      console.error('Google TTS error:', error);
      callbacks.onError?.(`Text-to-speech failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Synthesize speech using Google Cloud TTS API
   */
  async synthesizeSpeech(text: string, options: GoogleTTSOptions = {}): Promise<Blob> {
    const languageCode = options.voice?.languageCode || 'en-US';
    
    const requestBody = {
      input: { text },
      voice: {
        languageCode: languageCode,
        name: options.voice?.name || this.getMaleVoiceForLanguage(languageCode),
        ssmlGender: options.voice?.ssmlGender || 'MALE'
      },
      audioConfig: {
        audioEncoding: options.audioConfig?.audioEncoding || 'MP3',
        speakingRate: options.audioConfig?.speakingRate || this.getSpeakingRateForLanguage(languageCode),
        pitch: options.audioConfig?.pitch || this.getPitchForLanguage(languageCode),
        volumeGainDb: options.audioConfig?.volumeGainDb || 0.0,
        sampleRateHertz: options.audioConfig?.sampleRateHertz || 24000
      }
    };

    const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Google TTS API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.audioContent) {
      throw new Error('No audio content received from Google TTS API');
    }

    // Convert base64 audio to blob
    const audioBytes = atob(data.audioContent);
    const audioArray = new Uint8Array(audioBytes.length);
    for (let i = 0; i < audioBytes.length; i++) {
      audioArray[i] = audioBytes.charCodeAt(i);
    }

    return new Blob([audioArray], { type: 'audio/mpeg' });
  }

  /**
   * Play audio blob with progress tracking
   */
  private async playAudioBlob(audioBlob: Blob, callbacks: AudioPlaybackCallbacks): Promise<void> {
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      this.currentAudio = audio;

      // Create object URL for the audio blob
      const audioUrl = URL.createObjectURL(audioBlob);
      audio.src = audioUrl;

      // Configure audio for seniors
      audio.volume = this.currentVolume;
      audio.playbackRate = this.currentSpeed;

      audio.onloadedmetadata = () => {
        this.startProgressTracking(callbacks);
      };

      audio.onplay = () => {
        this.isPlaying = true;
        callbacks.onStart?.();
      };

      audio.onended = () => {
        this.isPlaying = false;
        this.stopProgressTracking();
        URL.revokeObjectURL(audioUrl); // Clean up object URL
        callbacks.onEnd?.();
        resolve();
      };

      audio.onerror = (event) => {
        this.isPlaying = false;
        this.stopProgressTracking();
        URL.revokeObjectURL(audioUrl); // Clean up object URL
        const errorMessage = 'Audio playback failed';
        callbacks.onError?.(errorMessage);
        reject(new Error(errorMessage));
      };

      // Start playback
      audio.play().catch((error) => {
        this.isPlaying = false;
        this.stopProgressTracking();
        URL.revokeObjectURL(audioUrl);
        callbacks.onError?.(`Failed to start audio playback: ${error.message}`);
        reject(error);
      });
    });
  }

  /**
   * Start tracking progress for visual feedback
   */
  private startProgressTracking(callbacks: AudioPlaybackCallbacks): void {
    this.progressInterval = setInterval(() => {
      if (this.currentAudio && this.isPlaying) {
        const currentTime = this.currentAudio.currentTime * 1000; // Convert to milliseconds
        const duration = this.currentAudio.duration * 1000; // Convert to milliseconds
        callbacks.onProgress?.(currentTime, duration);
      }
    }, 100); // Update every 100ms
  }

  /**
   * Stop progress tracking
   */
  private stopProgressTracking(): void {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
  }

  /**
   * Pause audio playback
   */
  pause(): void {
    if (this.currentAudio && this.isPlaying) {
      this.currentAudio.pause();
    }
  }

  /**
   * Resume audio playback
   */
  resume(): void {
    if (this.currentAudio && this.currentAudio.paused) {
      this.currentAudio.play().catch((error) => {
        this.callbacks.onError?.(`Failed to resume audio: ${error.message}`);
      });
    }
  }

  /**
   * Stop audio playback completely
   */
  stop(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
    
    this.isPlaying = false;
    this.stopProgressTracking();
  }

  /**
   * Adjust playback speed
   */
  setSpeed(speed: number): void {
    this.currentSpeed = Math.max(0.5, Math.min(2.0, speed)); // Clamp between 0.5x and 2.0x
    
    if (this.currentAudio) {
      this.currentAudio.playbackRate = this.currentSpeed;
    }
    
    this.callbacks.onSpeedChange?.(this.currentSpeed);
  }

  /**
   * Adjust volume
   */
  setVolume(volume: number): void {
    this.currentVolume = Math.max(0, Math.min(1, volume)); // Clamp between 0 and 1
    
    if (this.currentAudio) {
      this.currentAudio.volume = this.currentVolume;
    }
  }

  /**
   * Get current playback state
   */
  getPlaybackState(): AudioPlaybackState {
    return {
      isPlaying: this.isPlaying,
      currentTime: this.currentAudio?.currentTime || 0,
      duration: this.currentAudio?.duration || 0,
      speed: this.currentSpeed,
      volume: this.currentVolume
    };
  }

  /**
   * Check if audio is currently playing
   */
  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  /**
   * Synthesize speech and return data for lip sync
   */
  async synthesizeForLipSync(text: string, options: GoogleTTSOptions = {}): Promise<LipSyncData> {
    try {
      const cleanText = this.cleanTextForSpeech(text);
      
      // Import phoneme preprocessor
      const { PhonemePreprocessor } = await import('../avatar/PhonemePreprocessor');
      const preprocessor = new PhonemePreprocessor();
      
      // Generate accurate phoneme timing data
      const processedData = preprocessor.processText(cleanText, options.voice?.languageCode || 'en-US');
      
      // Synthesize audio
      const audioBlob = await this.synthesizeSpeech(cleanText, options);
      
      // Get actual audio duration and adjust phoneme timing if needed
      const actualDuration = await this.getAudioDuration(audioBlob);
      const timingRatio = actualDuration / processedData.duration;
      
      // Adjust phoneme timing to match actual audio duration
      const adjustedPhonemes = processedData.phonemes.map(p => ({
        phoneme: p.phoneme,
        timestamp: p.startTime * timingRatio,
        confidence: p.confidence
      }));
      
      return {
        audioBlob,
        duration: actualDuration,
        phonemes: adjustedPhonemes
      };
    } catch (error) {
      console.error('Failed to synthesize for lip sync:', error);
      throw error;
    }
  }

  /**
   * Get audio duration from blob
   */
  private async getAudioDuration(audioBlob: Blob): Promise<number> {
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      audio.onloadedmetadata = () => {
        const duration = audio.duration * 1000; // Convert to milliseconds
        URL.revokeObjectURL(audioUrl);
        resolve(duration);
      };
      
      audio.onerror = () => {
        URL.revokeObjectURL(audioUrl);
        reject(new Error('Failed to load audio for duration calculation'));
      };
      
      audio.src = audioUrl;
    });
  }

  /**
   * Generate phoneme sequence from text (simplified approach)
   */
  private generatePhonemesFromText(text: string, duration: number): Array<{ phoneme: string; timestamp: number; confidence: number }> {
    const phonemes: Array<{ phoneme: string; timestamp: number; confidence: number }> = [];
    const words = text.toLowerCase().split(/\s+/);
    const totalWords = words.length;
    const timePerWord = duration / totalWords;
    
    let currentTime = 0;
    
    for (const word of words) {
      const wordPhonemes = this.mapWordToPhonemes(word);
      const timePerPhoneme = timePerWord / wordPhonemes.length;
      
      for (const phoneme of wordPhonemes) {
        phonemes.push({
          phoneme,
          timestamp: currentTime,
          confidence: 0.8
        });
        currentTime += timePerPhoneme;
      }
      
      // Add pause between words
      phonemes.push({
        phoneme: 'SIL',
        timestamp: currentTime,
        confidence: 1.0
      });
      currentTime += timePerPhoneme * 0.2; // Short pause
    }
    
    return phonemes;
  }

  /**
   * Simple word to phoneme mapping for lip sync
   */
  private mapWordToPhonemes(word: string): string[] {
    // Enhanced phoneme mapping for better lip sync
    const phonemeMap: Record<string, string[]> = {
      'hello': ['HH', 'EH', 'L', 'OW'],
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
      'call': ['K', 'AO', 'L']
    };
    
    if (phonemeMap[word]) {
      return phonemeMap[word];
    }
    
    // Fallback: generate phonemes based on vowels and consonants
    const phonemes: string[] = [];
    for (let i = 0; i < word.length; i++) {
      const char = word[i];
      if ('aeiou'.includes(char)) {
        // Map vowels to appropriate phonemes
        const vowelMap: Record<string, string> = {
          'a': 'AA', 'e': 'EH', 'i': 'IH', 'o': 'AO', 'u': 'UH'
        };
        phonemes.push(vowelMap[char] || 'AA');
      } else if ('bcdfghjklmnpqrstvwxyz'.includes(char)) {
        // Map consonants to appropriate phonemes
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
   * Clean text for better speech synthesis
   */
  private cleanTextForSpeech(html: string): string {
    // Remove HTML tags
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    let text = tempDiv.textContent || tempDiv.innerText || '';
    
    // Clean up common patterns for better speech
    text = text
      .replace(/\s+/g, ' ') // Multiple spaces to single space
      .replace(/([.!?])\s*([A-Z])/g, '$1 $2') // Ensure pause after sentences
      .replace(/(\d+)\./g, '$1 dot') // Numbers with dots
      .replace(/([a-z])([A-Z])/g, '$1. $2') // Add pause between camelCase
      .replace(/\b(URL|API|UI|UX|HTML|CSS|JS|TTS|AI|FAQ|PDF|USB|WiFi|GPS)\b/g, (match) => {
        // Spell out common tech acronyms for better pronunciation
        const spellings: Record<string, string> = {
          'URL': 'U R L',
          'API': 'A P I',
          'UI': 'User Interface',
          'UX': 'User Experience',
          'HTML': 'H T M L',
          'CSS': 'C S S',
          'JS': 'JavaScript',
          'TTS': 'text to speech',
          'AI': 'A I',
          'FAQ': 'F A Q',
          'PDF': 'P D F',
          'USB': 'U S B',
          'WiFi': 'Wi-Fi',
          'GPS': 'G P S'
        };
        return spellings[match] || match;
      })
      .replace(/\b(\d+)%\b/g, '$1 percent') // Convert percentages
      .replace(/\b(\d+)\s*x\s*(\d+)\b/g, '$1 by $2') // Convert dimensions
      .replace(/\$(\d+)/g, '$1 dollars') // Convert currency
      .replace(/(\d+):\d{2}/g, (match) => {
        // Convert time format
        const [hours, minutes] = match.split(':');
        return `${hours} ${minutes}`;
      })
      .trim();

    return text;
  }

  /**
   * Get available voices from Google TTS
   */
  async getAvailableVoices(): Promise<any[]> {
    try {
      const response = await fetch(`https://texttospeech.googleapis.com/v1/voices?key=${this.apiKey}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch voices: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.voices || [];
    } catch (error) {
      console.error('Failed to get available voices:', error);
      return [];
    }
  }

  /**
   * Test Google TTS API connection
   */
  async testConnection(): Promise<{
    success: boolean;
    error?: string;
    voicesAvailable?: number;
  }> {
    try {
      const voices = await this.getAvailableVoices();
      return {
        success: true,
        voicesAvailable: voices.length
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get the best male voice for a given language with regional accent support
   */
  private getMaleVoiceForLanguage(languageCode: string): string {
    // Enhanced voice mapping with regional accents and better male voices
    const maleVoices: Record<string, string> = {
      // English variants
      'en-US': 'en-US-Neural2-D',      // American English - Deep male voice
      'en-GB': 'en-GB-Neural2-D',      // British English - Distinguished male voice
      'en-AU': 'en-AU-Neural2-D',      // Australian English
      'en-CA': 'en-US-Neural2-A',      // Canadian English (similar to US)
      'en-IN': 'en-IN-Neural2-D',      // Indian English
      
      // Spanish variants
      'es-ES': 'es-ES-Neural2-F',      // Spain Spanish - Castilian accent
      'es-US': 'es-US-Neural2-A',      // US Spanish - Latino accent
      'es-MX': 'es-US-Neural2-C',      // Mexican Spanish
      'es-AR': 'es-US-Neural2-A',      // Argentinian Spanish
      'es-CO': 'es-US-Neural2-B',      // Colombian Spanish
      
      // French variants
      'fr-FR': 'fr-FR-Neural2-D',      // France French - Parisian accent
      'fr-CA': 'fr-CA-Neural2-D',      // Canadian French - Quebec accent
      'fr-BE': 'fr-FR-Neural2-B',      // Belgian French
      'fr-CH': 'fr-FR-Neural2-C',      // Swiss French
      
      // German variants
      'de-DE': 'de-DE-Neural2-D',      // Germany German - Standard German
      'de-AT': 'de-DE-Neural2-B',      // Austrian German
      'de-CH': 'de-DE-Neural2-C',      // Swiss German
      
      // Portuguese variants
      'pt-BR': 'pt-BR-Neural2-C',      // Brazilian Portuguese
      'pt-PT': 'pt-PT-Wavenet-D',      // European Portuguese
      
      // Italian variants
      'it-IT': 'it-IT-Neural2-D',      // Italian - Standard Italian
      
      // Chinese variants
      'zh-CN': 'cmn-CN-Wavenet-D',     // Simplified Chinese - Mandarin
      'zh-TW': 'cmn-TW-Wavenet-C',     // Traditional Chinese - Taiwan Mandarin
      'zh-HK': 'yue-HK-Standard-D',    // Hong Kong Cantonese
      
      // Arabic variants
      'ar': 'ar-XA-Wavenet-D',         // Modern Standard Arabic
      'ar-SA': 'ar-XA-Wavenet-C',      // Saudi Arabic
      'ar-EG': 'ar-XA-Wavenet-B',      // Egyptian Arabic
      
      // Other major languages
      'ru-RU': 'ru-RU-Wavenet-D',      // Russian
      'ja-JP': 'ja-JP-Neural2-D',      // Japanese
      'ko-KR': 'ko-KR-Neural2-C',      // Korean
      'hi-IN': 'hi-IN-Neural2-D',      // Hindi (India)
      'th-TH': 'th-TH-Neural2-C',      // Thai
      'vi-VN': 'vi-VN-Neural2-D',      // Vietnamese
      'tr-TR': 'tr-TR-Wavenet-E',      // Turkish
      'pl-PL': 'pl-PL-Wavenet-E',      // Polish
      'nl-NL': 'nl-NL-Wavenet-E',      // Dutch (Netherlands)
      'nl-BE': 'nl-BE-Wavenet-B',      // Dutch (Belgium)
      'sv-SE': 'sv-SE-Wavenet-E',      // Swedish
      'da-DK': 'da-DK-Wavenet-D',      // Danish
      'no-NO': 'nb-NO-Wavenet-E',      // Norwegian
      'fi-FI': 'fi-FI-Wavenet-A',      // Finnish
      'cs-CZ': 'cs-CZ-Wavenet-D',      // Czech
      'sk-SK': 'sk-SK-Wavenet-A',      // Slovak
      'hu-HU': 'hu-HU-Wavenet-A',      // Hungarian
      'ro-RO': 'ro-RO-Wavenet-A',      // Romanian
      'bg-BG': 'bg-BG-Standard-A',     // Bulgarian
      'hr-HR': 'hr-HR-Wavenet-A',      // Croatian
      'sl-SI': 'sl-SI-Wavenet-A',      // Slovenian
      'et-EE': 'et-EE-Standard-A',     // Estonian
      'lv-LV': 'lv-LV-Standard-A',     // Latvian
      'lt-LT': 'lt-LT-Standard-A',     // Lithuanian
      'he-IL': 'he-IL-Wavenet-D',      // Hebrew
      'uk-UA': 'uk-UA-Wavenet-A'       // Ukrainian
    };

    return maleVoices[languageCode] || 'en-US-Neural2-D';
  }

  /**
   * Get appropriate speaking rate for different languages and regions
   */
  private getSpeakingRateForLanguage(languageCode: string): number {
    const speakingRates: Record<string, number> = {
      // Slower rates for senior-friendly speech
      'en-US': 0.85,    // American English - moderate pace
      'en-GB': 0.80,    // British English - slightly slower, more formal
      'es-ES': 0.90,    // Spain Spanish - naturally faster language
      'es-US': 0.85,    // US Spanish - moderate for seniors
      'fr-FR': 0.80,    // French - slower for clarity
      'de-DE': 0.75,    // German - slower due to compound words
      'it-IT': 0.85,    // Italian - moderate pace
      'pt-BR': 0.85,    // Brazilian Portuguese
      'pt-PT': 0.80,    // European Portuguese - more formal
      'ru-RU': 0.75,    // Russian - slower for complex grammar
      'ja-JP': 0.80,    // Japanese - respectful pace
      'ko-KR': 0.80,    // Korean - respectful pace
      'zh-CN': 0.85,    // Mandarin Chinese
      'ar': 0.80,       // Arabic - slower for clarity
      'hi-IN': 0.85,    // Hindi
      'th-TH': 0.85,    // Thai
      'vi-VN': 0.85,    // Vietnamese
      'tr-TR': 0.80,    // Turkish
      'pl-PL': 0.75,    // Polish - complex grammar
      'nl-NL': 0.80,    // Dutch
      'sv-SE': 0.80,    // Swedish
      'da-DK': 0.80,    // Danish
      'no-NO': 0.80,    // Norwegian
      'fi-FI': 0.75,    // Finnish - complex grammar
      'cs-CZ': 0.75,    // Czech - complex grammar
      'sk-SK': 0.75,    // Slovak
      'hu-HU': 0.75,    // Hungarian - very complex grammar
      'ro-RO': 0.80,    // Romanian
      'bg-BG': 0.80,    // Bulgarian
      'hr-HR': 0.80,    // Croatian
      'sl-SI': 0.80,    // Slovenian
      'et-EE': 0.80,    // Estonian
      'lv-LV': 0.80,    // Latvian
      'lt-LT': 0.80,    // Lithuanian
      'he-IL': 0.80,    // Hebrew
      'uk-UA': 0.80     // Ukrainian
    };

    return speakingRates[languageCode] || 0.85;
  }

  /**
   * Get appropriate pitch adjustment for male voices in different languages
   */
  private getPitchForLanguage(languageCode: string): number {
    const pitchAdjustments: Record<string, number> = {
      'en-US': -2.0,    // Slightly lower for authoritative American male
      'en-GB': -1.5,    // British male - distinguished but not too deep
      'es-ES': -1.0,    // Spanish male - warm and friendly
      'es-US': -1.5,    // Latino male - warm but authoritative
      'fr-FR': -1.0,    // French male - sophisticated
      'de-DE': -2.5,    // German male - deeper, more authoritative
      'it-IT': -1.0,    // Italian male - warm and expressive
      'pt-BR': -1.5,    // Brazilian male - friendly
      'pt-PT': -2.0,    // European Portuguese - more formal
      'ru-RU': -2.5,    // Russian male - deep and strong
      'ja-JP': -1.0,    // Japanese male - respectful, not too deep
      'ko-KR': -1.0,    // Korean male - respectful
      'zh-CN': -1.5,    // Mandarin male - authoritative but friendly
      'ar': -2.0,       // Arabic male - deep and respectful
      'hi-IN': -1.5,    // Hindi male - warm and authoritative
      'th-TH': -1.0,    // Thai male - gentle and respectful
      'vi-VN': -1.0,    // Vietnamese male
      'tr-TR': -1.5,    // Turkish male
      'pl-PL': -2.0,    // Polish male
      'nl-NL': -1.5,    // Dutch male
      'sv-SE': -1.5,    // Swedish male
      'da-DK': -1.5,    // Danish male
      'no-NO': -1.5,    // Norwegian male
      'fi-FI': -2.0,    // Finnish male
      'cs-CZ': -2.0,    // Czech male
      'sk-SK': -2.0,    // Slovak male
      'hu-HU': -2.0,    // Hungarian male
      'ro-RO': -1.5,    // Romanian male
      'bg-BG': -2.0,    // Bulgarian male
      'hr-HR': -1.5,    // Croatian male
      'sl-SI': -1.5,    // Slovenian male
      'et-EE': -1.5,    // Estonian male
      'lv-LV': -1.5,    // Latvian male
      'lt-LT': -1.5,    // Lithuanian male
      'he-IL': -1.5,    // Hebrew male
      'uk-UA': -2.0     // Ukrainian male
    };

    return pitchAdjustments[languageCode] || -1.5;
  }

  /**
   * Check if the service is properly configured
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }
}