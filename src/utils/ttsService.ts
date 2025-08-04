import { GoogleTTSService, GoogleTTSOptions, AudioPlaybackCallbacks } from '../services/tts/GoogleTTSService';

export interface TTSOptions {
  voice?: string;
  speed?: number;
  language?: string;
  accentModifications?: AccentModifications;
}

export interface AccentModifications {
  speechRate?: number; // Multiplier for speech rate
  pitch?: number; // Pitch adjustment (-20 to 20)
  emphasis?: number; // Emphasis level (0.0 to 2.0)
  pauseDuration?: number; // Pause duration multiplier
}

export class GeminiTTSService {
  private googleTTS: GoogleTTSService;
  private currentAudio: HTMLAudioElement | null = null;
  private isPlaying = false;
  private audioContext: AudioContext | null = null;

  constructor() {
    // Initialize with Google TTS API key
    this.googleTTS = new GoogleTTSService('AIzaSyCGnrz2QNBKLCsqwzDESePSfNEcq0m24JY');
    this.initializeAudioContext();
  }

  private async initializeAudioContext(): Promise<void> {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.warn('Could not initialize AudioContext:', error);
    }
  }

  async speak(
    text: string, 
    options: TTSOptions = {},
    onStart?: () => void,
    onEnd?: () => void,
    onError?: (error: string) => void
  ): Promise<void> {
    try {
      // Stop any currently playing audio
      this.stop();

      // Clean text for better speech synthesis
      const cleanText = this.cleanTextForSpeech(text);
      
      if (!cleanText.trim()) {
        onError?.('No text to speak');
        return;
      }

      this.isPlaying = true;

      // Apply accent modifications to speech parameters
      const baseSpeed = options.speed || 0.85;
      const basePitch = 0.0;
      
      let finalSpeed = baseSpeed;
      let finalPitch = basePitch;
      
      if (options.accentModifications) {
        finalSpeed *= (options.accentModifications.speechRate || 1.0);
        finalPitch += (options.accentModifications.pitch || 0);
        
        console.log(`🎭 Applying accent modifications: speed=${finalSpeed.toFixed(2)}, pitch=${finalPitch.toFixed(1)}`);
      }

      // Convert options to Google TTS format
      const googleOptions: GoogleTTSOptions = {
        voice: {
          languageCode: options.language || 'en-US',
          ssmlGender: 'MALE' // Male voice as requested
        },
        audioConfig: {
          audioEncoding: 'MP3',
          speakingRate: Math.max(0.25, Math.min(4.0, finalSpeed)), // Clamp to valid range
          pitch: Math.max(-20.0, Math.min(20.0, finalPitch)), // Clamp to valid range
          volumeGainDb: 0.0
        }
      };

      const callbacks: AudioPlaybackCallbacks = {
        onStart,
        onEnd: () => {
          this.isPlaying = false;
          onEnd?.();
        },
        onError: (error) => {
          this.isPlaying = false;
          onError?.(error);
        }
      };

      // Use Google TTS with fallback to browser TTS
      if (this.googleTTS.isConfigured()) {
        await this.googleTTS.speak(cleanText, googleOptions, callbacks);
      } else {
        // Fallback to browser TTS
        await this.synthesizeWithBrowserAPI(cleanText, options, onEnd, onError);
      }

    } catch (error) {
      this.isPlaying = false;
      console.error('TTS error:', error);
      
      // Try fallback to browser TTS
      try {
        await this.synthesizeWithBrowserAPI(text, options, onEnd, onError);
      } catch (fallbackError) {
        onError?.('Text-to-speech failed');
      }
    }
  }

  /**
   * Synthesize speech using browser's SpeechSynthesis API
   */
  private async synthesizeWithBrowserAPI(
    text: string,
    options: TTSOptions,
    onEnd?: () => void,
    onError?: (error: string) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!('speechSynthesis' in window)) {
        reject(new Error('Speech synthesis not supported'));
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      
      // Apply accent modifications to browser TTS
      let finalRate = options.speed || 0.85;
      let finalPitch = 1.0;
      
      if (options.accentModifications) {
        finalRate *= (options.accentModifications.speechRate || 1.0);
        finalPitch += (options.accentModifications.pitch || 0) * 0.05; // Scale pitch for browser API
      }

      // Configure voice options optimized for seniors with accent modifications
      utterance.rate = Math.max(0.1, Math.min(10, finalRate)); // Clamp to valid range
      utterance.pitch = Math.max(0, Math.min(2, finalPitch)); // Clamp to valid range
      utterance.volume = 1.0; // Full volume
      utterance.lang = options.language || 'en-US';

      // Find a suitable voice
      const voices = speechSynthesis.getVoices();
      if (voices.length > 0) {
        // Prefer clear, natural voices for seniors
        const preferredVoice = voices.find(voice => 
          voice.lang.startsWith(utterance.lang.split('-')[0]) && 
          (voice.name.includes('Google') || voice.name.includes('Microsoft') || voice.name.includes('Natural'))
        ) || voices.find(voice => 
          voice.lang.startsWith(utterance.lang.split('-')[0]) && voice.localService
        ) || voices.find(voice => 
          voice.lang.startsWith(utterance.lang.split('-')[0])
        ) || voices[0];
        
        utterance.voice = preferredVoice;
      }

      utterance.onend = () => {
        this.isPlaying = false;
        onEnd?.();
        resolve();
      };

      utterance.onerror = (event) => {
        this.isPlaying = false;
        const errorMsg = `Speech synthesis failed: ${event.error}`;
        onError?.(errorMsg);
        reject(new Error(errorMsg));
      };

      speechSynthesis.speak(utterance);
    });
  }

  stop(): void {
    // Stop Google TTS
    if (this.googleTTS) {
      this.googleTTS.stop();
    }

    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
    this.isPlaying = false;

    // Also stop any browser speech synthesis
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }

  getIsPlaying(): boolean {
    return this.isPlaying || (this.googleTTS && this.googleTTS.getIsPlaying());
  }

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
      .replace(/\b(URL|API|UI|UX|HTML|CSS|JS)\b/g, (match) => {
        // Spell out common tech acronyms
        const spellings: Record<string, string> = {
          'URL': 'U R L',
          'API': 'A P I',
          'UI': 'U I',
          'UX': 'U X',
          'HTML': 'H T M L',
          'CSS': 'C S S',
          'JS': 'JavaScript'
        };
        return spellings[match] || match;
      })
      .trim();

    return text;
  }

  /**
   * Get audio stream for lip sync (if supported)
   */
  async getAudioStreamForLipSync(text: string, options: TTSOptions = {}): Promise<MediaStream | null> {
    try {
      if (!this.audioContext) {
        return null;
      }

      // For now, we'll return null since browser TTS doesn't provide direct audio access
      // In the future, this could be enhanced with Web Audio API capture
      return null;
    } catch (error) {
      console.warn('Could not create audio stream for lip sync:', error);
      return null;
    }
  }

  /**
   * Synthesize speech and return audio data for lip sync
   */
  async synthesizeForLipSync(text: string, options: TTSOptions = {}): Promise<{
    audioBlob: Blob | null;
    duration: number;
    phonemes: Array<{ phoneme: string; timestamp: number; confidence: number }>;
  }> {
    try {
      if (this.googleTTS.isConfigured()) {
        // Use Google TTS for high-quality lip sync data
        const googleOptions: GoogleTTSOptions = {
          voice: {
            languageCode: options.language || 'en-US',
            ssmlGender: 'MALE'
          },
          audioConfig: {
            audioEncoding: 'MP3',
            speakingRate: options.speed || 0.85,
            pitch: 0.0,
            volumeGainDb: 0.0
          }
        };

        const lipSyncData = await this.googleTTS.synthesizeForLipSync(text, googleOptions);
        return {
          audioBlob: lipSyncData.audioBlob,
          duration: lipSyncData.duration,
          phonemes: lipSyncData.phonemes
        };
      }
    } catch (error) {
      console.warn('Google TTS lip sync failed, falling back to text analysis:', error);
    }

    // Fallback to text-based phoneme generation
    const cleanText = this.cleanTextForSpeech(text);
    const estimatedDuration = cleanText.length * 100; // ~100ms per character
    const phonemes = this.generatePhonemesFromText(cleanText);
    
    return {
      audioBlob: null, // Browser TTS doesn't provide direct audio access
      duration: estimatedDuration,
      phonemes
    };
  }

  /**
   * Generate phoneme sequence from text (simplified approach)
   */
  private generatePhonemesFromText(text: string): Array<{ phoneme: string; timestamp: number; confidence: number }> {
    const phonemes: Array<{ phoneme: string; timestamp: number; confidence: number }> = [];
    const words = text.toLowerCase().split(/\s+/);
    let currentTime = 0;
    
    for (const word of words) {
      const wordPhonemes = this.mapWordToPhonemes(word);
      
      for (const phoneme of wordPhonemes) {
        phonemes.push({
          phoneme,
          timestamp: currentTime,
          confidence: 0.8
        });
        currentTime += 100; // 100ms per phoneme
      }
      
      // Add pause between words
      phonemes.push({
        phoneme: 'SIL',
        timestamp: currentTime,
        confidence: 1.0
      });
      currentTime += 50; // 50ms pause
    }
    
    return phonemes;
  }

  /**
   * Simple word to phoneme mapping
   */
  private mapWordToPhonemes(word: string): string[] {
    // This is a very simplified phoneme mapping
    // In production, you'd use a proper phoneme dictionary
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
      'button': ['B', 'AH', 'T', 'AH', 'N']
    };
    
    if (phonemeMap[word]) {
      return phonemeMap[word];
    }
    
    // Fallback: generate phonemes based on vowels and consonants
    const phonemes: string[] = [];
    for (let i = 0; i < word.length; i++) {
      const char = word[i];
      if ('aeiou'.includes(char)) {
        phonemes.push('AA'); // Generic vowel
      } else if ('bcdfghjklmnpqrstvwxyz'.includes(char)) {
        phonemes.push('B'); // Generic consonant
      }
    }
    
    return phonemes.length > 0 ? phonemes : ['SIL'];
  }

  /**
   * Get available voices from browser
   */
  getAvailableVoices(): SpeechSynthesisVoice[] {
    if ('speechSynthesis' in window) {
      return speechSynthesis.getVoices();
    }
    return [];
  }

  /**
   * Check if TTS is supported
   */
  isSupported(): boolean {
    return 'speechSynthesis' in window;
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    this.stop();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

// Global TTS service instance
export const ttsService = new GeminiTTSService();