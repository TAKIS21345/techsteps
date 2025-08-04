import { GoogleGenerativeAI } from '@google/generative-ai';

export interface TTSOptions {
  voice?: string;
  speed?: number;
  language?: string;
  pitch?: number;
  volume?: number;
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

export class GeminiTTSService {
  private genAI: GoogleGenerativeAI;
  private currentAudio: HTMLAudioElement | null = null;
  private isPlaying = false;
  private currentSpeed = 1.0;
  private currentVolume = 1.0;
  private progressInterval: NodeJS.Timeout | null = null;
  private callbacks: AudioPlaybackCallbacks = {};

  constructor(apiKey?: string) {
    const key = apiKey || import.meta.env.VITE_GEMINI_API_KEY;
    if (!key) {
      throw new Error('Gemini API key is required for TTS service');
    }
    this.genAI = new GoogleGenerativeAI(key);
  }

  /**
   * Convert text to speech using Gemini's TTS capabilities
   * Falls back to browser SpeechSynthesis API if Gemini TTS is not available
   */
  async speak(
    text: string,
    options: TTSOptions = {},
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

      // Try Gemini TTS first (Note: As of now, Gemini doesn't have direct TTS API)
      // We'll use the browser's SpeechSynthesis API as the primary method
      // and enhance it with Gemini's text processing capabilities
      
      // Use Gemini to optimize text for speech synthesis
      const optimizedText = await this.optimizeTextForSpeech(cleanText);
      
      // Use browser SpeechSynthesis API with optimized text
      await this.synthesizeWithBrowser(optimizedText, options, callbacks);

    } catch (error) {
      this.isPlaying = false;
      console.error('Gemini TTS error:', error);
      
      // Fallback to basic browser TTS
      this.fallbackToWebSpeech(text, options, callbacks);
    }
  }

  /**
   * Use Gemini to optimize text for better speech synthesis
   */
  private async optimizeTextForSpeech(text: string): Promise<string> {
    try {
      const model = this.genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
      });

      const prompt = `Optimize this text for text-to-speech synthesis for senior users. Make it more natural to speak aloud by:
1. Adding appropriate pauses with commas and periods
2. Spelling out abbreviations and acronyms
3. Converting numbers to words where appropriate
4. Adding pronunciation hints for technical terms
5. Breaking up long sentences
6. Keeping the meaning exactly the same

Text to optimize: "${text}"

Return only the optimized text, nothing else.`;

      const result = await model.generateContent(prompt);
      const optimizedText = result.response.text().trim();
      
      return optimizedText || text; // Fallback to original if optimization fails
    } catch (error) {
      console.warn('Text optimization failed, using original text:', error);
      return text;
    }
  }

  /**
   * Synthesize speech using browser's SpeechSynthesis API with enhanced controls
   */
  private async synthesizeWithBrowser(
    text: string,
    options: TTSOptions,
    callbacks: AudioPlaybackCallbacks
  ): Promise<void> {
    if (!window.speechSynthesis) {
      throw new Error('Speech synthesis not supported');
    }

    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Configure for seniors - slower, clearer speech
      utterance.rate = options.speed || 0.8; // Slower speech for seniors
      utterance.pitch = options.pitch || 1.0; // Normal pitch
      utterance.volume = options.volume || 1.0; // Full volume
      
      this.currentSpeed = utterance.rate;
      this.currentVolume = utterance.volume;
      
      // Try to find the best voice for seniors
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = this.selectBestVoice(voices, options.language || 'en-US');
      
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.onstart = () => {
        this.isPlaying = true;
        callbacks.onStart?.();
        this.startProgressTracking(callbacks);
      };

      utterance.onend = () => {
        this.isPlaying = false;
        this.stopProgressTracking();
        callbacks.onEnd?.();
        resolve();
      };

      utterance.onerror = (event) => {
        this.isPlaying = false;
        this.stopProgressTracking();
        const errorMessage = `Speech synthesis failed: ${event.error}`;
        callbacks.onError?.(errorMessage);
        reject(new Error(errorMessage));
      };

      // Store reference for control
      this.currentAudio = null; // SpeechSynthesis doesn't use HTMLAudioElement
      
      window.speechSynthesis.speak(utterance);
    });
  }

  /**
   * Select the best voice for senior users
   */
  private selectBestVoice(voices: SpeechSynthesisVoice[], language: string): SpeechSynthesisVoice | null {
    // Prioritize voices that are clear and natural for seniors
    const voicePreferences = [
      // Google voices (usually high quality)
      (voice: SpeechSynthesisVoice) => voice.name.includes('Google') && voice.lang.startsWith(language.split('-')[0]),
      // Microsoft voices (also good quality)
      (voice: SpeechSynthesisVoice) => voice.name.includes('Microsoft') && voice.lang.startsWith(language.split('-')[0]),
      // Local voices for the specific language
      (voice: SpeechSynthesisVoice) => voice.lang === language && voice.localService,
      // Any voice for the language family
      (voice: SpeechSynthesisVoice) => voice.lang.startsWith(language.split('-')[0]),
      // Default English voice as fallback
      (voice: SpeechSynthesisVoice) => voice.lang.startsWith('en')
    ];

    for (const preference of voicePreferences) {
      const voice = voices.find(preference);
      if (voice) return voice;
    }

    return voices[0] || null;
  }

  /**
   * Start tracking progress for visual feedback
   */
  private startProgressTracking(callbacks: AudioPlaybackCallbacks): void {
    // For SpeechSynthesis, we can't get exact progress, so we'll estimate
    let estimatedProgress = 0;
    const estimatedDuration = 5000; // Rough estimate, will be improved
    const interval = 100; // Update every 100ms
    
    this.progressInterval = setInterval(() => {
      if (this.isPlaying) {
        estimatedProgress += interval;
        callbacks.onProgress?.(estimatedProgress, estimatedDuration);
      }
    }, interval);
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
   * Pause/resume audio playback
   */
  pause(): void {
    if (window.speechSynthesis && this.isPlaying) {
      window.speechSynthesis.pause();
    }
  }

  resume(): void {
    if (window.speechSynthesis && window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
  }

  /**
   * Stop audio playback completely
   */
  stop(): void {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    
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
    this.callbacks.onSpeedChange?.(this.currentSpeed);
    
    // For SpeechSynthesis, we need to restart with new speed
    // This is a limitation of the browser API
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
      currentTime: 0, // Not available with SpeechSynthesis
      duration: 0, // Not available with SpeechSynthesis
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
      .replace(/\b(URL|API|UI|UX|HTML|CSS|JS|TTS)\b/g, (match) => {
        // Spell out common tech acronyms
        const spellings: Record<string, string> = {
          'URL': 'U R L',
          'API': 'A P I',
          'UI': 'U I',
          'UX': 'U X',
          'HTML': 'H T M L',
          'CSS': 'C S S',
          'JS': 'JavaScript',
          'TTS': 'text to speech'
        };
        return spellings[match] || match;
      })
      .replace(/\b(\d+)%\b/g, '$1 percent') // Convert percentages
      .replace(/\b(\d+)\s*x\s*(\d+)\b/g, '$1 by $2') // Convert dimensions
      .trim();

    return text;
  }

  /**
   * Fallback to basic browser TTS without Gemini optimization
   */
  private fallbackToWebSpeech(
    text: string,
    options: TTSOptions,
    callbacks: AudioPlaybackCallbacks
  ): void {
    if (!window.speechSynthesis) {
      callbacks.onError?.('Text-to-speech is not supported in your browser');
      return;
    }

    try {
      const utterance = new SpeechSynthesisUtterance(this.cleanTextForSpeech(text));
      
      // Configure for seniors
      utterance.rate = options.speed || 0.8; // Slower speech
      utterance.pitch = options.pitch || 1.0; // Normal pitch
      utterance.volume = options.volume || 1.0; // Full volume
      
      // Try to find a good voice
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = this.selectBestVoice(voices, options.language || 'en-US');
      
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.onstart = () => {
        this.isPlaying = true;
        callbacks.onStart?.();
      };

      utterance.onend = () => {
        this.isPlaying = false;
        callbacks.onEnd?.();
      };

      utterance.onerror = (event) => {
        this.isPlaying = false;
        callbacks.onError?.(`Speech synthesis failed: ${event.error}`);
      };

      window.speechSynthesis.speak(utterance);

    } catch (error) {
      callbacks.onError?.('Failed to use browser text-to-speech');
    }
  }

  /**
   * Get available voices for voice selection
   */
  async getAvailableVoices(): Promise<SpeechSynthesisVoice[]> {
    return new Promise((resolve) => {
      const voices = window.speechSynthesis.getVoices();
      
      if (voices.length > 0) {
        resolve(voices);
      } else {
        // Wait for voices to load
        window.speechSynthesis.onvoiceschanged = () => {
          resolve(window.speechSynthesis.getVoices());
        };
      }
    });
  }

  /**
   * Test audio capabilities
   */
  async testAudioCapabilities(): Promise<{
    speechSynthesis: boolean;
    voicesAvailable: number;
    recommendedVoice?: string;
  }> {
    const speechSynthesis = 'speechSynthesis' in window;
    const voices = await this.getAvailableVoices();
    const recommendedVoice = this.selectBestVoice(voices, 'en-US');

    return {
      speechSynthesis,
      voicesAvailable: voices.length,
      recommendedVoice: recommendedVoice?.name
    };
  }
}

// Global Gemini TTS service instance
export const geminiTTSService = new GeminiTTSService();