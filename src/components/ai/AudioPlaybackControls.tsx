import React, { useState, useEffect, useCallback } from 'react';
import { Play, Pause, Square, Volume2, VolumeX, RotateCcw } from 'lucide-react';
import { geminiTTSService, AudioPlaybackState, AudioPlaybackCallbacks } from '../../services/ai/GeminiTTSService';

interface AudioPlaybackControlsProps {
  text: string;
  isVisible?: boolean;
  className?: string;
  onPlayStart?: () => void;
  onPlayEnd?: () => void;
  onError?: (error: string) => void;
  autoHighlight?: boolean;
  highlightClassName?: string;
}

export const AudioPlaybackControls: React.FC<AudioPlaybackControlsProps> = ({
  text,
  isVisible = true,
  className = '',
  onPlayStart,
  onPlayEnd,
  onError,
  autoHighlight = true,
  highlightClassName = 'bg-yellow-200 dark:bg-yellow-800'
}) => {
  const [playbackState, setPlaybackState] = useState<AudioPlaybackState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    speed: 0.8, // Default slower speed for seniors
    volume: 1.0
  });
  
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const [words, setWords] = useState<string[]>([]);

  // Initialize words array when text changes
  useEffect(() => {
    if (text) {
      const wordArray = text.split(/\s+/).filter(word => word.length > 0);
      setWords(wordArray);
      setCurrentWordIndex(-1);
    }
  }, [text]);

  // Audio playback callbacks
  const audioCallbacks: AudioPlaybackCallbacks = {
    onStart: () => {
      setIsLoading(false);
      setError(null);
      setCurrentWordIndex(0);
      onPlayStart?.();
    },
    onEnd: () => {
      setPlaybackState(prev => ({ ...prev, isPlaying: false }));
      setCurrentWordIndex(-1);
      onPlayEnd?.();
    },
    onError: (errorMessage: string) => {
      setError(errorMessage);
      setIsLoading(false);
      setPlaybackState(prev => ({ ...prev, isPlaying: false }));
      setCurrentWordIndex(-1);
      onError?.(errorMessage);
    },
    onProgress: (currentTime: number, duration: number) => {
      setPlaybackState(prev => ({ 
        ...prev, 
        currentTime, 
        duration 
      }));
      
      // Estimate current word based on progress (rough approximation)
      if (autoHighlight && words.length > 0 && duration > 0) {
        const progress = currentTime / duration;
        const estimatedWordIndex = Math.floor(progress * words.length);
        setCurrentWordIndex(Math.min(estimatedWordIndex, words.length - 1));
      }
    },
    onSpeedChange: (speed: number) => {
      setPlaybackState(prev => ({ ...prev, speed }));
    }
  };

  // Play/pause toggle
  const handlePlayPause = useCallback(async () => {
    if (!text.trim()) {
      setError('No text to read aloud');
      return;
    }

    try {
      if (playbackState.isPlaying) {
        geminiTTSService.pause();
        setPlaybackState(prev => ({ ...prev, isPlaying: false }));
      } else {
        setIsLoading(true);
        setError(null);
        
        await geminiTTSService.speak(text, {
          speed: playbackState.speed,
          volume: isMuted ? 0 : playbackState.volume,
          language: 'en-US'
        }, audioCallbacks);
        
        setPlaybackState(prev => ({ ...prev, isPlaying: true }));
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to play audio';
      setError(errorMessage);
      setIsLoading(false);
      onError?.(errorMessage);
    }
  }, [text, playbackState.isPlaying, playbackState.speed, playbackState.volume, isMuted, audioCallbacks, onError]);

  // Stop playback
  const handleStop = useCallback(() => {
    geminiTTSService.stop();
    setPlaybackState(prev => ({ ...prev, isPlaying: false, currentTime: 0 }));
    setCurrentWordIndex(-1);
    setIsLoading(false);
  }, []);

  // Restart playback
  const handleRestart = useCallback(async () => {
    handleStop();
    setTimeout(() => {
      handlePlayPause();
    }, 100);
  }, [handleStop, handlePlayPause]);

  // Speed adjustment
  const handleSpeedChange = useCallback((newSpeed: number) => {
    const clampedSpeed = Math.max(0.5, Math.min(2.0, newSpeed));
    setPlaybackState(prev => ({ ...prev, speed: clampedSpeed }));
    geminiTTSService.setSpeed(clampedSpeed);
  }, []);

  // Volume adjustment
  const handleVolumeChange = useCallback((newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    setPlaybackState(prev => ({ ...prev, volume: clampedVolume }));
    geminiTTSService.setVolume(clampedVolume);
    setIsMuted(clampedVolume === 0);
  }, []);

  // Mute toggle
  const handleMuteToggle = useCallback(() => {
    if (isMuted) {
      handleVolumeChange(1.0);
      setIsMuted(false);
    } else {
      handleVolumeChange(0);
      setIsMuted(true);
    }
  }, [isMuted, handleVolumeChange]);

  // Render highlighted text
  const renderHighlightedText = () => {
    if (!autoHighlight || words.length === 0) {
      return <span>{text}</span>;
    }

    return (
      <span>
        {words.map((word, index) => (
          <span
            key={index}
            className={index === currentWordIndex ? highlightClassName : ''}
          >
            {word}
            {index < words.length - 1 ? ' ' : ''}
          </span>
        ))}
      </span>
    );
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className={`audio-playback-controls ${className}`}>
      {/* Text display with highlighting */}
      {autoHighlight && (
        <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-lg leading-relaxed">
          {renderHighlightedText()}
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 rounded-lg">
          <p className="text-red-700 dark:text-red-300 text-sm font-medium">
            Audio Error: {error}
          </p>
        </div>
      )}

      {/* Main controls */}
      <div className="flex items-center justify-center space-x-4 mb-4">
        {/* Play/Pause button */}
        <button
          onClick={handlePlayPause}
          disabled={isLoading || !text.trim()}
          className="flex items-center justify-center w-16 h-16 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-full transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-blue-300"
          aria-label={playbackState.isPlaying ? 'Pause audio' : 'Play audio'}
        >
          {isLoading ? (
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : playbackState.isPlaying ? (
            <Pause size={24} />
          ) : (
            <Play size={24} className="ml-1" />
          )}
        </button>

        {/* Stop button */}
        <button
          onClick={handleStop}
          disabled={!playbackState.isPlaying && !isLoading}
          className="flex items-center justify-center w-12 h-12 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white rounded-full transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-gray-300"
          aria-label="Stop audio"
        >
          <Square size={20} />
        </button>

        {/* Restart button */}
        <button
          onClick={handleRestart}
          disabled={isLoading || !text.trim()}
          className="flex items-center justify-center w-12 h-12 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-full transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-green-300"
          aria-label="Restart audio"
        >
          <RotateCcw size={20} />
        </button>

        {/* Mute/Unmute button */}
        <button
          onClick={handleMuteToggle}
          className="flex items-center justify-center w-12 h-12 bg-purple-600 hover:bg-purple-700 text-white rounded-full transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-purple-300"
          aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
        >
          {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>
      </div>

      {/* Speed and volume controls */}
      <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-8">
        {/* Speed control */}
        <div className="flex items-center space-x-3">
          <label htmlFor="speed-control" className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-0">
            Speed:
          </label>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleSpeedChange(playbackState.speed - 0.1)}
              disabled={playbackState.speed <= 0.5}
              className="w-8 h-8 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 text-gray-700 rounded-full flex items-center justify-center text-lg font-bold focus:outline-none focus:ring-2 focus:ring-gray-400"
              aria-label="Decrease speed"
            >
              −
            </button>
            <input
              id="speed-control"
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={playbackState.speed}
              onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
              className="w-20 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Adjust playback speed"
            />
            <button
              onClick={() => handleSpeedChange(playbackState.speed + 0.1)}
              disabled={playbackState.speed >= 2.0}
              className="w-8 h-8 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 text-gray-700 rounded-full flex items-center justify-center text-lg font-bold focus:outline-none focus:ring-2 focus:ring-gray-400"
              aria-label="Increase speed"
            >
              +
            </button>
          </div>
          <span className="text-sm text-gray-600 dark:text-gray-400 min-w-0">
            {playbackState.speed.toFixed(1)}x
          </span>
        </div>

        {/* Volume control */}
        <div className="flex items-center space-x-3">
          <label htmlFor="volume-control" className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-0">
            Volume:
          </label>
          <input
            id="volume-control"
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={playbackState.volume}
            onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
            className="w-20 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500"
            aria-label="Adjust volume"
          />
          <span className="text-sm text-gray-600 dark:text-gray-400 min-w-0">
            {Math.round(playbackState.volume * 100)}%
          </span>
        </div>
      </div>

      {/* Progress indicator (visual feedback) */}
      {playbackState.isPlaying && (
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
            <span>Playing...</span>
            <span className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Live</span>
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ 
                width: playbackState.duration > 0 
                  ? `${(playbackState.currentTime / playbackState.duration) * 100}%` 
                  : '0%' 
              }}
            ></div>
          </div>
        </div>
      )}

      {/* Accessibility instructions */}
      <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center">
        <p>Use spacebar to play/pause, or tab through controls with keyboard navigation.</p>
      </div>
    </div>
  );
};

export default AudioPlaybackControls;