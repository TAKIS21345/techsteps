/**
 * Idle Animation Component
 * Implements gentle pulsing pattern for the avatar idle state
 */

import React, { useEffect, useRef, useCallback } from 'react';
import { GridSquare, COLOR_SCHEMES } from '../types';

export interface IdleAnimationProps {
  onSquaresUpdate: (squares: GridSquare[]) => void;
  onAnimationComplete?: () => void;
  reducedMotion?: boolean;
  colorScheme?: typeof COLOR_SCHEMES.default;
}

export const IdleAnimation: React.FC<IdleAnimationProps> = ({
  onSquaresUpdate,
  onAnimationComplete,
  reducedMotion = false,
  colorScheme = COLOR_SCHEMES.default
}) => {
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const mountedRef = useRef<boolean>(true);

  // Animation configuration
  const ANIMATION_DURATION = 3000; // 3 seconds
  const OPACITY_MIN = 0.7;
  const OPACITY_MAX = 1.0;
  const OPACITY_CENTER = 0.9;

  // Create base squares with gentle pulsing pattern
  const createBaseSquares = useCallback((): GridSquare[] => {
    const squares: GridSquare[] = [];
    
    // Define opacity pattern for 3x3 grid (gentle breathing effect)
    const opacityPattern = [
      OPACITY_MIN,    OPACITY_MIN + 0.1, OPACITY_MIN,
      OPACITY_MIN + 0.1, OPACITY_CENTER, OPACITY_MIN + 0.1,
      OPACITY_MIN,    OPACITY_MIN + 0.1, OPACITY_MIN
    ];

    for (let i = 0; i < 9; i++) {
      squares.push({
        id: i,
        opacity: opacityPattern[i],
        scale: 1.0,
        color: colorScheme.primary[i],
        delay: i * 100 // Stagger animation by 100ms per square
      });
    }
    
    return squares;
  }, [colorScheme]);

  // Calculate opacity for a given progress and square position
  const calculateOpacity = useCallback((progress: number, baseOpacity: number): number => {
    // Create a gentle sine wave for breathing effect
    const sineWave = Math.sin(progress * Math.PI * 2);
    const amplitude = (OPACITY_MAX - OPACITY_MIN) * 0.3; // Gentle amplitude
    
    return Math.max(
      OPACITY_MIN,
      Math.min(OPACITY_MAX, baseOpacity + sineWave * amplitude)
    );
  }, []);

  // Animation loop
  const animate = useCallback((timestamp: number) => {
    if (!mountedRef.current) {
      return;
    }

    if (startTimeRef.current === null) {
      startTimeRef.current = timestamp;
    }

    const elapsed = timestamp - startTimeRef.current;
    const progress = (elapsed % ANIMATION_DURATION) / ANIMATION_DURATION;

    // Create squares with animated opacity
    const baseSquares = createBaseSquares();
    const animatedSquares = baseSquares.map((square) => ({
      ...square,
      opacity: calculateOpacity(progress, square.opacity)
    }));

    onSquaresUpdate(animatedSquares);

    // Continue animation
    animationFrameRef.current = requestAnimationFrame(animate);
  }, [createBaseSquares, calculateOpacity, onSquaresUpdate]);

  // Start animation
  const startAnimation = useCallback(() => {
    if (reducedMotion) {
      // In reduced motion mode, show static state
      const staticSquares = createBaseSquares();
      onSquaresUpdate(staticSquares);
      onAnimationComplete?.();
      return;
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    startTimeRef.current = null;
    animationFrameRef.current = requestAnimationFrame(animate);
  }, [reducedMotion, createBaseSquares, onSquaresUpdate, onAnimationComplete, animate]);

  // Stop animation
  const stopAnimation = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    startTimeRef.current = null;
  }, []);

  // Start animation on mount
  useEffect(() => {
    startAnimation();
    
    return () => {
      stopAnimation();
    };
  }, [startAnimation, stopAnimation]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      stopAnimation();
    };
  }, [stopAnimation]);

  // This component doesn't render anything visible
  return null;
};

export default IdleAnimation;