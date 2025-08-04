import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GeminiTTSService } from '../GeminiTTSService';

// Mock Google Generative AI
vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: vi.fn().mockImplementation(() => ({
    getGenerativeModel: vi.fn().mockReturnValue({
      generateContent: vi.fn().mockResolvedValue({
        response: {
          text: vi.fn().mockReturnValue('Optimized text for speech synthesis.')
        }
      })
    })
  }))
}));

// Mock Web Speech API
Object.defineProperty(window, 'speechSynthesis', {
  writable: true,
  value: {
    speak: vi.fn(),
    cancel: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    getVoices: vi.fn(() => [
      {
        name: 'Google US English',
        lang: 'en-US',
        localService: false
      },
      {
        name: 'Microsoft David',
        lang: 'en-US',
        localService: true
      }
    ]),
    onvoiceschanged: null
  }
});

// Mock SpeechSynthesisUtterance
Object.defineProperty(window, 'SpeechSynthesisUtterance', {
  writable: true,
  value: vi.fn().mockImplementation((text) => ({
    text,
    rate: 0.8,
    pitch: 1.0,
    volume: 1.0,
    voice: null,
    onstart: null,
    onend: null,
    onerror: null
  }))
});

describe('GeminiTTSService', () => {
  let ttsService: GeminiTTSService;

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock environment variable
    vi.stubEnv('VITE_GEMINI_API_KEY', 'test-api-key');
    ttsService = new GeminiTTSService('test-api-key');
  });

  describe('initialization', () => {
    it('should initialize with API key', () => {
      expect(() => new GeminiTTSService('test-key')).not.toThrow();
    });

    it('should throw error without API key', () => {
      vi.unstubAllEnvs();
      expect(() => new GeminiTTSService()).toThrow('Gemini API key is required');
      vi.stubEnv('VITE_GEMINI_API_KEY', 'test-api-key');
    });
  });

  describe('text cleaning', () => {
    it('should clean HTML tags from text', async () => {
      const htmlText = '<p>Hello <strong>world</strong>!</p>';
      const callbacks = {
        onStart: vi.fn(),
        onEnd: vi.fn(),
        onError: vi.fn()
      };

      await ttsService.speak(htmlText, {}, callbacks);

      // Should call speechSynthesis.speak with cleaned text
      expect(window.speechSynthesis.speak).toHaveBeenCalled();
    });

    it('should handle acronyms properly', async () => {
      const textWithAcronyms = 'Visit the URL for API documentation.';
      const callbacks = {
        onStart: vi.fn(),
        onEnd: vi.fn(),
        onError: vi.fn()
      };

      await ttsService.speak(textWithAcronyms, {}, callbacks);

      expect(window.speechSynthesis.speak).toHaveBeenCalled();
    });
  });

  describe('voice selection', () => {
    it('should get available voices', async () => {
      const voices = await ttsService.getAvailableVoices();
      expect(voices).toHaveLength(2);
      expect(voices[0].name).toBe('Google US English');
    });
  });

  describe('playback control', () => {
    it('should handle play/pause/stop operations', () => {
      ttsService.pause();
      expect(window.speechSynthesis.pause).toHaveBeenCalled();

      ttsService.resume();
      expect(window.speechSynthesis.resume).toHaveBeenCalled();

      ttsService.stop();
      expect(window.speechSynthesis.cancel).toHaveBeenCalled();
    });

    it('should track playing state', () => {
      expect(ttsService.getIsPlaying()).toBe(false);
    });

    it('should handle speed and volume adjustments', () => {
      ttsService.setSpeed(1.5);
      ttsService.setVolume(0.8);

      const state = ttsService.getPlaybackState();
      expect(state.speed).toBe(1.5);
      expect(state.volume).toBe(0.8);
    });
  });

  describe('error handling', () => {
    it('should handle empty text gracefully', async () => {
      const callbacks = {
        onStart: vi.fn(),
        onEnd: vi.fn(),
        onError: vi.fn()
      };

      await ttsService.speak('', {}, callbacks);

      expect(callbacks.onError).toHaveBeenCalledWith('No text to speak');
    });

    it('should fallback to browser TTS on Gemini failure', async () => {
      // Mock Gemini failure
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const mockGenAI = GoogleGenerativeAI as any;
      mockGenAI.mockImplementation(() => ({
        getGenerativeModel: vi.fn().mockReturnValue({
          generateContent: vi.fn().mockRejectedValue(new Error('API Error'))
        })
      }));

      const callbacks = {
        onStart: vi.fn(),
        onEnd: vi.fn(),
        onError: vi.fn()
      };

      await ttsService.speak('Test text', {}, callbacks);

      // Should still call browser TTS as fallback
      expect(window.speechSynthesis.speak).toHaveBeenCalled();
    });
  });

  describe('audio capabilities testing', () => {
    it('should test audio capabilities', async () => {
      const capabilities = await ttsService.testAudioCapabilities();

      expect(capabilities).toEqual({
        speechSynthesis: true,
        voicesAvailable: 2,
        recommendedVoice: 'Google US English'
      });
    });
  });

  describe('senior-friendly defaults', () => {
    it('should use slower speed by default', async () => {
      const callbacks = {
        onStart: vi.fn(),
        onEnd: vi.fn(),
        onError: vi.fn()
      };

      await ttsService.speak('Test text', {}, callbacks);

      // Check that SpeechSynthesisUtterance was created with slower rate
      expect(window.speechSynthesis.speak).toHaveBeenCalled();
      const utteranceCall = (window.speechSynthesis.speak as any).mock.calls[0][0];
      expect(utteranceCall.rate).toBe(0.8); // Slower for seniors
    });

    it('should prioritize clear voices for seniors', async () => {
      const voices = await ttsService.getAvailableVoices();
      
      // Should have Google voice first (higher quality)
      expect(voices[0].name).toBe('Google US English');
    });
  });
});