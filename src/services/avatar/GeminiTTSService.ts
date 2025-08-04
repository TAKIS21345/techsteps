export interface TTSOptions {
  voice?: string;
  speed?: number;
  pitch?: number;
  volume?: number;
  language?: string;
}

export interface TTSResult {
  audioBlob: Blob;
  duration: number;
  sampleRate: number;
}

export class GeminiTTSService {
  private audioContext: AudioContext | null = null;
  private isInitialized = false;

  constructor() {
    this.initialize();
  }

  /**
   * Initialize the TTS service
   */
  private async initialize(): Promise<void> {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize GeminiTTSService:', error);
    }
  }

  /**
   * Convert text to speech using browser TTS (optimized for Gemini integration)
   * This integrates with the main TTS service for consistency
   */
  async synthesizeSpeech(text: string, options: TTSOptions = {}): Promise<TTSResult> {
    try {
      // Use the browser's built-in SpeechSynthesis API
      // This provides the most reliable TTS experience
      return await this.synthesizeWithBrowserAPI(text, options);
    } catch (error) {
      console.error('Failed to synthesize speech:', error);
      throw error;
    }
  }

  /**
   * Synthesize speech using browser's SpeechSynthesis API
   * This serves as a fallback and development implementation
   */
  private async synthesizeWithBrowserAPI(text: string, options: TTSOptions = {}): Promise<TTSResult> {
    return new Promise((resolve, reject) => {
      if (!('speechSynthesis' in window)) {
        reject(new Error('Speech synthesis not supported'));
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      
      // Configure voice options
      utterance.rate = options.speed || 0.9; // Slightly slower for seniors
      utterance.pitch = options.pitch || 1.0;
      utterance.volume = options.volume || 0.8;
      utterance.lang = options.language || 'en-US';

      // Find a suitable voice
      const voices = speechSynthesis.getVoices();
      if (voices.length > 0) {
        // Prefer female voices as they tend to be clearer for seniors
        const preferredVoice = voices.find(voice => 
          voice.lang.startsWith(utterance.lang.split('-')[0]) && 
          voice.name.toLowerCase().includes('female')
        ) || voices.find(voice => 
          voice.lang.startsWith(utterance.lang.split('-')[0])
        ) || voices[0];
        
        utterance.voice = preferredVoice;
      }

      // Create audio recording for lip sync
      const mediaRecorder = this.createAudioRecorder();
      let audioChunks: Blob[] = [];

      if (mediaRecorder) {
        mediaRecorder.ondataavailable = (event) => {
          audioChunks.push(event.data);
        };

        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
          resolve({
            audioBlob,
            duration: utterance.text.length * 100, // Rough estimate
            sampleRate: 16000
          });
        };

        mediaRecorder.start();
      }

      utterance.onend = () => {
        if (mediaRecorder && mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
        } else {
          // Fallback if recording failed
          resolve({
            audioBlob: new Blob(), // Empty blob
            duration: utterance.text.length * 100,
            sampleRate: 16000
          });
        }
      };

      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        reject(new Error('Speech synthesis failed'));
      };

      speechSynthesis.speak(utterance);
    });
  }

  /**
   * Create an audio recorder to capture TTS output for lip sync
   */
  private createAudioRecorder(): MediaRecorder | null {
    try {
      // This is a simplified approach - in production, you'd want to capture
      // the actual audio output from the TTS service
      const stream = new MediaStream();
      return new MediaRecorder(stream);
    } catch (error) {
      console.warn('Could not create audio recorder:', error);
      return null;
    }
  }

  /**
   * Extract phonemes from audio for lip sync
   * This is a simplified implementation - in production, you'd use
   * more sophisticated phoneme detection
   */
  async extractPhonemes(audioBlob: Blob): Promise<Array<{ phoneme: string; timestamp: number; confidence: number }>> {
    try {
      if (!this.audioContext) {
        throw new Error('Audio context not initialized');
      }

      const arrayBuffer = await audioBlob.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      
      // Simplified phoneme extraction based on audio analysis
      const phonemes = this.analyzeAudioForPhonemes(audioBuffer);
      
      return phonemes;
    } catch (error) {
      console.error('Failed to extract phonemes:', error);
      return [];
    }
  }

  /**
   * Analyze audio buffer to extract phoneme-like features
   * This is a simplified implementation for demonstration
   */
  private analyzeAudioForPhonemes(audioBuffer: AudioBuffer): Array<{ phoneme: string; timestamp: number; confidence: number }> {
    const phonemes: Array<{ phoneme: string; timestamp: number; confidence: number }> = [];
    const channelData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;
    
    // Analyze audio in small windows
    const windowSize = Math.floor(sampleRate * 0.05); // 50ms windows
    const hopSize = Math.floor(windowSize / 2);
    
    for (let i = 0; i < channelData.length - windowSize; i += hopSize) {
      const window = channelData.slice(i, i + windowSize);
      const timestamp = (i / sampleRate) * 1000; // Convert to milliseconds
      
      // Calculate basic audio features
      const energy = this.calculateEnergy(window);
      const spectralCentroid = this.calculateSpectralCentroid(window);
      const zeroCrossingRate = this.calculateZeroCrossingRate(window);
      
      // Map features to phonemes (simplified)
      const phoneme = this.mapFeaturesToPhoneme(energy, spectralCentroid, zeroCrossingRate);
      
      if (phoneme && energy > 0.01) { // Only add if there's significant energy
        phonemes.push({
          phoneme,
          timestamp,
          confidence: Math.min(1.0, energy * 2)
        });
      }
    }
    
    return phonemes;
  }

  /**
   * Calculate energy of audio window
   */
  private calculateEnergy(window: Float32Array): number {
    let energy = 0;
    for (let i = 0; i < window.length; i++) {
      energy += window[i] * window[i];
    }
    return Math.sqrt(energy / window.length);
  }

  /**
   * Calculate spectral centroid (simplified)
   */
  private calculateSpectralCentroid(window: Float32Array): number {
    let weightedSum = 0;
    let magnitudeSum = 0;
    
    for (let i = 0; i < window.length / 2; i++) {
      const magnitude = Math.abs(window[i]);
      weightedSum += i * magnitude;
      magnitudeSum += magnitude;
    }
    
    return magnitudeSum > 0 ? weightedSum / magnitudeSum : 0;
  }

  /**
   * Calculate zero crossing rate
   */
  private calculateZeroCrossingRate(window: Float32Array): number {
    let crossings = 0;
    for (let i = 1; i < window.length; i++) {
      if ((window[i] >= 0) !== (window[i - 1] >= 0)) {
        crossings++;
      }
    }
    return crossings / window.length;
  }

  /**
   * Map audio features to phonemes (simplified)
   */
  private mapFeaturesToPhoneme(energy: number, spectralCentroid: number, zeroCrossingRate: number): string | null {
    if (energy < 0.01) return 'SIL'; // Silence
    
    // Simplified phoneme mapping based on audio characteristics
    if (spectralCentroid > 0.7) {
      if (zeroCrossingRate > 0.1) return 'S'; // Sibilant
      return 'F'; // Fricative
    } else if (spectralCentroid > 0.4) {
      if (energy > 0.1) return 'IY'; // High vowel
      return 'EH'; // Mid vowel
    } else {
      if (energy > 0.15) return 'AA'; // Low vowel
      if (zeroCrossingRate < 0.05) return 'M'; // Nasal
      return 'B'; // Stop consonant
    }
  }

  /**
   * Get available voices for TTS
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
   * Stop any ongoing speech synthesis
   */
  stop(): void {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
    }
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    this.stop();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.isInitialized = false;
  }
}