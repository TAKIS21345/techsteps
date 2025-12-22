import { useState, useCallback, useEffect, useRef } from 'react';
import { ttsService, TTSOptions } from '../services/TextToSpeechService';

export interface UseAudioPlaybackOptions {
  autoPlay?: boolean;
  defaultSpeed?: number;
  defaultVolume?: number;
  onPlayStart?: () => void;
  onPlayEnd?: () => void;
  onError?: (error: string) => void;
}

export interface AudioPlaybackHook {
  isPlaying: boolean;
  isLoading: boolean;
  error: string | null;
  speed: number;
  volume: number;
  isMuted: boolean;
  currentTime: number;
  duration: number;
  play: (text: string, options?: TTSOptions) => Promise<void>;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  restart: () => Promise<void>;
  setSpeed: (speed: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  clearError: () => void;
}

export const useAudioPlayback = (options: UseAudioPlaybackOptions = {}): AudioPlaybackHook => {
  const {
    autoPlay = false,
    defaultSpeed = 0.9, // Natural pace for seniors
    defaultVolume = 1.0,
    onPlayStart,
    onPlayEnd,
    onError
  } = options;

  // State management
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [speed, setSpeedState] = useState(defaultSpeed);
  const [volume, setVolumeState] = useState(defaultVolume);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Refs to store current values for callbacks
  const currentTextRef = useRef<string>('');
  const currentOptionsRef = useRef<TTSOptions>({});

  // Set up TTS callbacks on mount
  useEffect(() => {
    ttsService.setCallbacks({
      onSpeakStart: () => {
        setIsLoading(false);
        setIsPlaying(true);
        setError(null);
        onPlayStart?.();
      },
      onSpeakEnd: () => {
        setIsPlaying(false);
        setCurrentTime(0);
        setDuration(0);
        onPlayEnd?.();
      },
      onAudioLevel: () => {
        // Audio level for visualization (optional)
      }
    });
  }, [onPlayStart, onPlayEnd]);

  // Play function
  const play = useCallback(async (text: string, playOptions: TTSOptions = {}) => {
    if (!text.trim()) {
      setError('No text to play');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Store current text and options for restart functionality
      currentTextRef.current = text;
      currentOptionsRef.current = {
        rate: speed,
        volume: isMuted ? 0 : volume,
        lang: 'en-US',
        ...playOptions
      };

      await ttsService.speak(text, currentOptionsRef.current);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to play audio';
      setError(errorMessage);
      setIsLoading(false);
      setIsPlaying(false);
      onError?.(errorMessage);
    }
  }, [speed, volume, isMuted, onError]);

  // Pause function - stops for now (TTS doesn't have true pause)
  const pause = useCallback(() => {
    ttsService.stop();
    setIsPlaying(false);
  }, []);

  // Resume function - restarts from beginning
  const resume = useCallback(() => {
    if (currentTextRef.current) {
      play(currentTextRef.current, currentOptionsRef.current);
    }
  }, [play]);

  // Stop function
  const stop = useCallback(() => {
    ttsService.stop();
    setIsPlaying(false);
    setIsLoading(false);
    setCurrentTime(0);
    setDuration(0);
  }, []);

  // Restart function
  const restart = useCallback(async () => {
    stop();
    if (currentTextRef.current) {
      // Small delay to ensure stop is processed
      setTimeout(() => {
        play(currentTextRef.current, currentOptionsRef.current);
      }, 100);
    }
  }, [stop, play]);

  // Speed control
  const setSpeed = useCallback((newSpeed: number) => {
    const clampedSpeed = Math.max(0.5, Math.min(2.0, newSpeed));
    setSpeedState(clampedSpeed);
  }, []);

  // Volume control
  const setVolume = useCallback((newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    setVolumeState(clampedVolume);
    setIsMuted(clampedVolume === 0);
  }, []);

  // Mute toggle
  const toggleMute = useCallback(() => {
    if (isMuted) {
      setVolumeState(1.0);
      setIsMuted(false);
    } else {
      setVolumeState(0);
      setIsMuted(true);
    }
  }, [isMuted]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Auto-play functionality
  useEffect(() => {
    if (autoPlay && currentTextRef.current && !isPlaying && !isLoading) {
      play(currentTextRef.current);
    }
  }, [autoPlay, isPlaying, isLoading, play]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      ttsService.stop();
    };
  }, []);

  return {
    isPlaying,
    isLoading,
    error,
    speed,
    volume,
    isMuted,
    currentTime,
    duration,
    play,
    pause,
    resume,
    stop,
    restart,
    setSpeed,
    setVolume,
    toggleMute,
    clearError
  };
};

export default useAudioPlayback;