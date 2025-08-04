import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AudioPlaybackControls from '../AudioPlaybackControls';

// Mock the Gemini TTS service
vi.mock('../../services/ai/GeminiTTSService', () => ({
  geminiTTSService: {
    speak: vi.fn(),
    pause: vi.fn(),
    stop: vi.fn(),
    setSpeed: vi.fn(),
    setVolume: vi.fn(),
    getIsPlaying: vi.fn(() => false),
    testAudioCapabilities: vi.fn(() => Promise.resolve({
      speechSynthesis: true,
      voicesAvailable: 5,
      recommendedVoice: 'Google US English'
    }))
  }
}));

// Mock Web Speech API
Object.defineProperty(window, 'speechSynthesis', {
  writable: true,
  value: {
    speak: vi.fn(),
    cancel: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    getVoices: vi.fn(() => []),
    onvoiceschanged: null
  }
});

describe('AudioPlaybackControls', () => {
  const defaultProps = {
    text: 'This is a test text for audio playback.',
    onPlayStart: vi.fn(),
    onPlayEnd: vi.fn(),
    onError: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders audio controls correctly', () => {
    render(<AudioPlaybackControls {...defaultProps} />);
    
    // Check for main play button
    expect(screen.getByLabelText('Play audio')).toBeInTheDocument();
    
    // Check for control buttons
    expect(screen.getByLabelText('Stop audio')).toBeInTheDocument();
    expect(screen.getByLabelText('Restart audio')).toBeInTheDocument();
    expect(screen.getByLabelText('Mute audio')).toBeInTheDocument();
    
    // Check for speed and volume controls
    expect(screen.getByLabelText('Adjust playback speed')).toBeInTheDocument();
    expect(screen.getByLabelText('Adjust volume')).toBeInTheDocument();
  });

  it('displays text when autoHighlight is enabled', () => {
    render(<AudioPlaybackControls {...defaultProps} autoHighlight={true} />);
    
    expect(screen.getByText(defaultProps.text)).toBeInTheDocument();
  });

  it('handles play button click', async () => {
    const { geminiTTSService } = await import('../../services/ai/GeminiTTSService');
    
    render(<AudioPlaybackControls {...defaultProps} />);
    
    const playButton = screen.getByLabelText('Play audio');
    fireEvent.click(playButton);
    
    await waitFor(() => {
      expect(geminiTTSService.speak).toHaveBeenCalledWith(
        defaultProps.text,
        expect.objectContaining({
          speed: 0.8,
          volume: 1,
          language: 'en-US'
        }),
        expect.any(Object)
      );
    });
  });

  it('handles speed adjustment', () => {
    render(<AudioPlaybackControls {...defaultProps} />);
    
    const speedSlider = screen.getByLabelText('Adjust playback speed');
    fireEvent.change(speedSlider, { target: { value: '1.2' } });
    
    expect(speedSlider).toHaveValue('1.2');
  });

  it('handles volume adjustment', () => {
    render(<AudioPlaybackControls {...defaultProps} />);
    
    const volumeSlider = screen.getByLabelText('Adjust volume');
    fireEvent.change(volumeSlider, { target: { value: '0.7' } });
    
    expect(volumeSlider).toHaveValue('0.7');
  });

  it('handles mute toggle', () => {
    render(<AudioPlaybackControls {...defaultProps} />);
    
    const muteButton = screen.getByLabelText('Mute audio');
    fireEvent.click(muteButton);
    
    // After muting, button should show unmute
    expect(screen.getByLabelText('Unmute audio')).toBeInTheDocument();
  });

  it('shows error message when provided', () => {
    render(<AudioPlaybackControls {...defaultProps} />);
    
    // Simulate an error by clicking play with empty text
    render(<AudioPlaybackControls {...defaultProps} text="" />);
    
    const playButton = screen.getByLabelText('Play audio');
    fireEvent.click(playButton);
    
    // The button should be disabled for empty text
    expect(playButton).toBeDisabled();
  });

  it('handles keyboard accessibility', () => {
    render(<AudioPlaybackControls {...defaultProps} />);
    
    const playButton = screen.getByLabelText('Play audio');
    
    // Test focus
    playButton.focus();
    expect(playButton).toHaveFocus();
    
    // Test keyboard activation
    fireEvent.keyDown(playButton, { key: 'Enter' });
    // Should trigger the same behavior as click
  });

  it('displays accessibility instructions', () => {
    render(<AudioPlaybackControls {...defaultProps} />);
    
    expect(screen.getByText(/Use spacebar to play\/pause/)).toBeInTheDocument();
  });

  it('handles visibility prop', () => {
    const { rerender } = render(<AudioPlaybackControls {...defaultProps} isVisible={false} />);
    
    // Should not render when not visible
    expect(screen.queryByLabelText('Play audio')).not.toBeInTheDocument();
    
    // Should render when visible
    rerender(<AudioPlaybackControls {...defaultProps} isVisible={true} />);
    expect(screen.getByLabelText('Play audio')).toBeInTheDocument();
  });
});