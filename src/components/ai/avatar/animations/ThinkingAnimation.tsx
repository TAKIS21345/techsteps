/**
 * Thinking Animation Component
 * Implements wave pattern for the avatar thinking state
 */

import React, { useEffect, useRef, useCallback } from 'react';
import { GridSquare, COLOR_SCHEMES } from '../types';

export interface ThinkingAnimationProps {
  onSquaresUpdate: (squares: GridSquare[]) => void;
  onAnimationComplete?: () => void;
  reducedMotion?: boolean;
  colorScheme?: typeof COLOR_SCHEMES.default;
}

export const ThinkingAnimation: React.FC<ThinkingAnimationProps> = ({
  onSquaresUpdate,
  onAnimationComplete,
  reducedMotion = false,
  colorScheme = COLOR_SCHEMES.default
}) => {
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const mountedRef = useRef<boolean>(true);

  // Animation configuration
  const ANIMATION_DURATION = 1500; // 1.5 seconds
  const SCALE_MIN = 1.0;
  const SCALE_MAX = 1.15;
  const WAVE_PHASES = 3; // Number of wave phases

  // Create base squares
  const createBaseSquares = useCallback((): GridSquare[] => {
    const squares: GridSquare[] = [];
    
    for (let i = 0; i < 9; i++) {
      squares.push({
        id: i,
        opacity: 1.0,
        scale: SCALE_MIN,
        color: colorScheme.primary[i],
        delay: 0
      });
    }
    
    return squares;
  }, [colorScheme]);

  // Calculate wave pattern for thinking animation
  const calculateWaveScale = useCallback((progress: number, squareIndex: number): number => {
    // Create wave pattern that moves across the grid
    // Grid positions: 0,1,2 (top row), 3,4,5 (middle row), 6,7,8 (bottom row)
    
    // Map square index to wave position (0-8 becomes 0-1 for wave calculation)
    const wavePosition = squareIndex / 8;
    
    // Create multiple wave phases for more complex thinking pattern
    let totalScale = SCALE_MIN;
    
    for (let phase = 0; phase < WAVE_PHASES; phase++) {
      const phaseOffset = (phase / WAVE_PHASES) * Math.PI * 2;
      const waveProgress = (progress * Math.PI * 4) + phaseOffset + (wavePosition * Math.PI);
      const waveValue = Math.sin(waveProgress);
      
      // Convert wave value to scale (positive values create scaling)
      if (waveValue > 0) {
        const scaleAmount = waveValue * (SCALE_MAX - SCALE_MIN) * (1 / WAVE_PHASES);
        totalScale += scaleAmount;
      }
    }
    
    return Math.max(SCALE_MIN, Math.min(SCALE_MAX, totalScale));
  }, []);

  // Calculate diagonal wave pattern for more interesting thinking effect
  const calculateDiagonalWave = useCallback((progress: number, squareIndex: number): number => {
    // Convert square index to row/col coordinates
    const row = Math.floor(squareIndex / 3);
    const col = squareIndex % 3;
    
    // Create diagonal wave that moves from top-left to bottom-right
    const diagonalPosition = (row + col) / 4; // Normalize to 0-1
    
    // Create wave with multiple frequencies for complex thinking pattern
    const wave1 = Math.sin((progress * Math.PI * 3) + (diagonalPosition * Math.PI * 2));
    const wave2 = Math.sin((progress * Math.PI * 5) + (diagonalPosition * Math.PI * 1.5)) * 0.5;
    
    const combinedWave = (wave1 + wave2) / 1.5;
    
    // Convert to scale value
    if (combinedWave > 0) {
      return SCALE_MIN + (combinedWave * (SCALE_MAX - SCALE_MIN));
    }
    
    return SCALE_MIN;
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

    // Create squares with animated scale using diagonal wave pattern
    const baseSquares = createBaseSquares();
    const animatedSquares = baseSquares.map((square, index) => ({
      ...square,
      scale: calculateDiagonalWave(progress, index),
      // Add slight opacity variation for depth
      opacity: 0.8 + (calculateDiagonalWave(progress, index) - SCALE_MIN) * 0.4
    }));

    onSquaresUpdate(animatedSquares);

    // Continue animation
    animationFrameRef.current = requestAnimationFrame(animate);
  }, [createBaseSquares, calculateDiagonalWave, onSquaresUpdate]);

  // Start animation
  const startAnimation = useCallback(() => {
    if (reducedMotion) {
      // In reduced motion mode, show subtle static variation
      const staticSquares = createBaseSquares().map((square, index) => ({
        ...square,
        scale: SCALE_MIN + (index % 2) * 0.05, // Subtle alternating pattern
        opacity: 0.9 + (index % 2) * 0.1
      }));
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

export default ThinkingAnimation;