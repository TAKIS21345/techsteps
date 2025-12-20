/**
 * Lightweight Avatar Component
 * Main component for the 3x3 grid avatar system
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useAccessibility } from '../../../contexts/AccessibilityContext';
import { LightweightAvatarController } from '../../../services/avatar/LightweightAvatarController';
import AvatarGrid from './AvatarGrid';
import AvatarAnimationEngine from './AvatarAnimationEngine';
import { 
  LightweightAvatarProps, 
  AvatarState, 
  GridSquare,
  ColorScheme,
  AVATAR_SIZES,
  COLOR_SCHEMES
} from './types';

const LightweightAvatar: React.FC<LightweightAvatarProps> = ({
  size = 'md',
  state = 'idle',
  className = '',
  onAnimationComplete,
  reducedMotion: propReducedMotion,
  highContrast: propHighContrast,
  'data-testid': dataTestId
}) => {
  const { settings } = useAccessibility();
  const [currentSquares, setCurrentSquares] = useState<GridSquare[]>([]);
  const [currentColorScheme, setCurrentColorScheme] = useState<ColorScheme>(COLOR_SCHEMES.default);
  const controllerRef = useRef<LightweightAvatarController | null>(null);
  const mountedRef = useRef(true);

  // Determine reduced motion and high contrast settings
  const reducedMotion = propReducedMotion ?? settings?.reducedMotion ?? false;
  const highContrast = propHighContrast ?? settings?.highContrast ?? false;

  // Handle squares updates from animation engine
  const handleSquaresUpdate = useCallback((squares: GridSquare[]) => {
    if (!mountedRef.current) return;
    setCurrentSquares(squares);
  }, []);

  // Handle animation completion
  const handleAnimationComplete = useCallback((completedState: AvatarState) => {
    if (!mountedRef.current) return;
    onAnimationComplete?.(completedState);
  }, [onAnimationComplete]);

  // Initialize controller
  useEffect(() => {
    controllerRef.current = new LightweightAvatarController(state, reducedMotion);
    
    // Set up listeners
    const handleStateChange = (newState: AvatarState) => {
      if (!mountedRef.current) return;
      
      const colorScheme = controllerRef.current?.getColorScheme() || COLOR_SCHEMES.default;
      setCurrentColorScheme(colorScheme);
    };

    controllerRef.current.addStateListener(handleStateChange);
    controllerRef.current.addAnimationCompleteListener(handleAnimationComplete);
    controllerRef.current.addSquareUpdateListener(handleSquaresUpdate);

    // Initialize with current state
    handleStateChange(state);
    const initialSquares = controllerRef.current.getCurrentSquares();
    setCurrentSquares(initialSquares);

    return () => {
      if (controllerRef.current) {
        controllerRef.current.removeStateListener(handleStateChange);
        controllerRef.current.removeAnimationCompleteListener(handleAnimationComplete);
        controllerRef.current.removeSquareUpdateListener(handleSquaresUpdate);
        controllerRef.current.destroy();
      }
    };
  }, [handleSquaresUpdate, handleAnimationComplete]);

  // Update state when prop changes
  useEffect(() => {
    if (controllerRef.current && controllerRef.current.currentState !== state) {
      controllerRef.current.setState(state);
    }
  }, [state]);

  // Update reduced motion setting
  useEffect(() => {
    if (controllerRef.current) {
      controllerRef.current.setReducedMotion(reducedMotion);
    }
  }, [reducedMotion]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Get appropriate color scheme based on settings
  const getEffectiveColorScheme = useCallback((): ColorScheme => {
    if (highContrast) {
      return COLOR_SCHEMES.highContrast;
    }
    return currentColorScheme;
  }, [highContrast, currentColorScheme]);

  const effectiveColorScheme = getEffectiveColorScheme();
  const sizeConfig = AVATAR_SIZES[size];

  return (
    <div
      className={`
        relative flex items-center justify-center
        ${sizeConfig.container}
        ${className}
        ${state === 'idle' ? 'animate-sway' : ''}
      `}
      style={{
        background: 'transparent',
        transform: 'rotate(45deg)'
      }}
      data-testid={dataTestId}
      role="img"
      aria-label={`AI assistant avatar in ${state} state`}
      aria-describedby={`avatar-description-${state}`}
    >
      {/* Hidden description for screen readers */}
      <div id={`avatar-description-${state}`} className="sr-only">
        {state === 'idle' && 'AI assistant is ready to help'}
        {state === 'thinking' && 'AI assistant is thinking'}
        {state === 'speaking' && 'AI assistant is speaking'}
        {state === 'listening' && 'AI assistant is listening'}
        {state === 'celebrating' && 'AI assistant is celebrating'}
        {state === 'error' && 'AI assistant encountered an error'}
        {state === 'transitioning' && 'AI assistant is changing states'}
      </div>

      {/* Animation Engine */}
      <AvatarAnimationEngine
        state={state}
        onSquaresUpdate={handleSquaresUpdate}
        onAnimationComplete={handleAnimationComplete}
        reducedMotion={reducedMotion}
      />

      {/* 3x3 Grid Container */}
      <div className="w-4/5 h-4/5 p-1">
        <AvatarGrid
          squares={currentSquares}
          size={size}
          colorScheme={effectiveColorScheme}
          reducedMotion={reducedMotion}
          data-testid={`${dataTestId}-grid`}
        />
      </div>

      {/* Accessibility enhancement: Focus indicator */}
      <div 
        className="absolute inset-0 rounded-2xl opacity-0 focus-within:opacity-100 transition-opacity"
        style={{
          boxShadow: `0 0 0 3px ${effectiveColorScheme.accent}40`
        }}
        aria-hidden="true"
      />
    </div>
  );
};

export default LightweightAvatar;