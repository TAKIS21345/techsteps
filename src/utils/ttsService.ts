export interface TTSOptions {
  voice?: string;
  speed?: number;
  language?: string;
}

export class CambAITTSService {
  private apiKey: string;
  private baseUrl = 'https://api.camb.ai/tts/v1';
  private currentAudio: HTMLAudioElement | null = null;
  private isPlaying = false;

  constructor() {
    this.apiKey = '48b51bac-5f68-4e27-b660-b8b26f9c54a6';
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

      onStart?.();
      this.isPlaying = true;

      // Configure voice settings optimized for seniors
      const requestBody = {
        text: cleanText,
        voice: options.voice || 'en-US-AriaNeural', // Clear, friendly voice
        speed: options.speed || 0.85, // Slightly slower for seniors
        language: options.language || 'en-US',
        format: 'mp3',
        sample_rate: 22050,
        // Additional settings for clarity
        pitch: 0, // Neutral pitch
        volume: 1.0, // Full volume
        emphasis: 'moderate' // Clear pronunciation
      };

      const response = await fetch(`${this.baseUrl}/synthesize`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`TTS API error: ${response.status} ${response.statusText}`);
      }

      // Get audio blob from response
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      // Create and play audio
      this.currentAudio = new Audio(audioUrl);
      
      this.currentAudio.onended = () => {
        this.isPlaying = false;
        URL.revokeObjectURL(audioUrl);
        onEnd?.();
      };

      this.currentAudio.onerror = () => {
        this.isPlaying = false;
        URL.revokeObjectURL(audioUrl);
        onError?.('Failed to play audio');
      };

      await this.currentAudio.play();

    } catch (error) {
      this.isPlaying = false;
      console.error('Camb.ai TTS error:', error);
      
      // Fallback to browser TTS if Camb.ai fails
      this.fallbackToWebSpeech(text, options, onStart, onEnd, onError);
    }
  }

  stop(): void {
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
    return this.isPlaying;
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

  private fallbackToWebSpeech(
    text: string,
    options: TTSOptions,
    onStart?: () => void,
    onEnd?: () => void,
    onError?: (error: string) => void
  ): void {
    if (!window.speechSynthesis) {
      onError?.('Text-to-speech is not supported in your browser');
      return;
    }

    try {
      const utterance = new SpeechSynthesisUtterance(this.cleanTextForSpeech(text));
      
      // Configure for seniors
      utterance.rate = options.speed || 0.8; // Slower speech
      utterance.pitch = 1.0; // Normal pitch
      utterance.volume = 1.0; // Full volume
      
      // Try to find a good voice
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(voice => 
        voice.name.includes('Google') && voice.lang.startsWith('en')
      ) || voices.find(voice => 
        voice.name.includes('Microsoft') && voice.lang.startsWith('en')
      ) || voices.find(voice => 
        voice.lang === 'en-US' && voice.localService
      ) || voices.find(voice => voice.lang.startsWith('en'));
      
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.onstart = () => {
        this.isPlaying = true;
        onStart?.();
      };

      utterance.onend = () => {
        this.isPlaying = false;
        onEnd?.();
      };

      utterance.onerror = (event) => {
        this.isPlaying = false;
        onError?.(`Speech synthesis failed: ${event.error}`);
      };

      window.speechSynthesis.speak(utterance);

    } catch (error) {
      onError?.('Failed to use browser text-to-speech');
    }
  }

  // Get available voices (for future voice selection feature)
  async getAvailableVoices(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/voices`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        }
      });

      if (response.ok) {
        const data = await response.json();
        return data.voices || [];
      }
    } catch (error) {
      console.error('Failed to fetch voices:', error);
    }

    // Fallback to common voice names
    return [
      'en-US-AriaNeural',
      'en-US-JennyNeural', 
      'en-US-GuyNeural',
      'en-GB-SoniaNeural',
      'en-AU-NatashaNeural'
    ];
  }
}

// Global TTS service instance
export const ttsService = new CambAITTSService();