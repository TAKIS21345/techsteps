/**
 * Listening Animation Component
 * Implements attentive pattern for the avatar listening state
 */

import React, { useEffect, useRef, useCallback } from 'react';
import { GridSquare, COLOR_SCHEMES } from '../types';

export interface ListeningAnimationProps {
  onSquaresUpdate: (squares: GridSquare[]) => void;
  onAnimationComplete?: () => void;
  reducedMotion?: boolean;
  colorScheme?: typeof COLOR_SCHEMES.default;
  attentiveness?: 'low' | 'medium' | 'high'; // Listening attentiveness level
}

export const ListeningAnimation: React.FC<ListeningAnimationProps> = ({
  onSquaresUpdate,
  onAnimationComplete,
  reducedMotion = false,
  colorScheme = COLOR_SCHEMES.default,
  attentiveness = 'medium'
}) => {
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const mountedRef = useRef<boolean>(true);

  // Animation configuration based on attentiveness
  const getAnimationConfig = useCallback(() => {
    switch (attentiveness) {
      case 'low':
        return {
          duration: 3000,
          opacityMin: 0.85,
          opacityMax: 0.95,
          scaleMin: 0.98,
          scaleMax: 1.02,
          pulseFrequency: 1
        };
      case 'high':
        return {
          duration: 1500,
          opacityMin: 0.8,
          opacityMax: 1.0,
          scaleMin: 0.95,
          scaleMax: 1.05,
          pulseFrequency: 2
        };
      default: // medium
        return {
          duration: 2000,
          opacityMin: 0.8,
          opacityMax: 1.0,
          scaleMin: 0.96,
          scaleMax: 1.04,
          pulseFrequency: 1.5
        };
    }
  }, [attentiveness]);

  // Create base squares
  const createBaseSquares = useCallback((): GridSquare[] => {
    const squares: GridSquare[] = [];
    
    for (let i = 0; i < 9; i++) {
      squares.push({
        id: i,
        opacity: 1.0,
        scale: 1.0,
        color: colorScheme.primary[i],
        delay: 0
      });
    }
    
    return squares;
  }, [colorScheme]);

  // Calculate listening pattern - focused attention with subtle movement
  const calculateListeningPattern = useCallback((progress: number, squareIndex: number) => {
    const config = getAnimationConfig();
    
    // Create attention zones - outer squares show less activity (peripheral vision)
    // Center and edge squares show more activity (focused attention)
    const attentionZones = [
      0.7, 0.9, 0.7,  // Top row: peripheral, focused, peripheral
      0.9, 1.0, 0.9,  // Middle row: focused, center, focused
      0.7, 0.9, 0.7   // Bottom row: peripheral, focused, peripheral
    ];
    
    const attentionLevel = attentionZones[squareIndex];
    
    // Create gentle, steady pulse for attentive listening
    const primaryPulse = Math.sin(progress * Math.PI * config.pulseFrequency);
    
    // Add subtle secondary pulse for depth
    const secondaryPulse = Math.sin(progress * Math.PI * config.pulseFrequency * 0.7 + Math.PI / 4) * 0.3;
    
    // Combine pulses with attention level weighting
    const combinedPulse = (primaryPulse + secondaryPulse) * attentionLevel;
    
    // Convert to opacity and scale with subtle variations
    const opacity = config.opacityMin + (Math.abs(combinedPulse) * (config.opacityMax - config.opacityMin));
    const scale = config.scaleMin + (Math.max(0, combinedPulse) * (config.scaleMax - config.scaleMin));
    
    return {
      opacity: Math.max(config.opacityMin, Math.min(config.opacityMax, opacity)),
      scale: Math.max(config.scaleMin, Math.min(config.scaleMax, scale))
    };
  }, [getAnimationConfig]);

  // Add subtle directional awareness (as if listening to different directions)
  const addDirectionalAwareness = useCallback((progress: number, squareIndex: number) => {
    // Create slow, sweeping attention that moves across the grid
    const sweepProgress = (progress * 0.3) % 1; // Slow sweep cycle
    
    // Convert square index to position
    const row = Math.floor(squareIndex / 3);
    const col = squareIndex % 3;
    
    // Create horizontal sweep for directional listening
    const horizontalPosition = col / 2; // 0 to 1 from left to right
    const sweepCenter = 0.5 + Math.sin(sweepProgress * Math.PI * 2) * 0.3; // Moving center
    
    // Calculate distance from sweep center
    const distanceFromSweep = Math.abs(horizontalPosition - sweepCenter);
    const sweepIntensity = Math.max(0, 1 - (distanceFromSweep * 2));
    
    return sweepIntensity * 0.1; // Subtle effect
  }, []);

  // Animation loop
  const animate = useCallback((timestamp: number) => {
    if (!mountedRef.current) {
      return;
    }

    if (startTimeRef.current === null) {
      startTimeRef.current = timestamp;
    }

    const config = getAnimationConfig();
    const elapsed = timestamp - startTimeRef.current;
    const progress = (elapsed % config.duration) / config.duration;

    // Create squares with listening animation
    const baseSquares = createBaseSquares();
    const animatedSquares = baseSquares.map((square, index) => {
      const pattern = calculateListeningPattern(progress, index);
      const directionalBoost = addDirectionalAwareness(progress, index);
      
      return {
        ...square,
        opacity: Math.min(1.0, pattern.opacity + directionalBoost),
        scale: Math.min(1.1, pattern.scale + directionalBoost * 0.5)
      };
    });

    onSquaresUpdate(animatedSquares);

    // Continue animation
    animationFrameRef.current = requestAnimationFrame(animate);
  }, [createBaseSquares, calculateListeningPattern, addDirectionalAwareness, getAnimationConfig, onSquaresUpdate]);

  // Start animation
  const startAnimation = useCallback(() => {
    if (reducedMotion) {
      // In reduced motion mode, show static attentive state
      const staticSquares = createBaseSquares().map((square, index) => {
        const attentionZones = [0.7, 0.9, 0.7, 0.9, 1.0, 0.9, 0.7, 0.9, 0.7];
        const attentionLevel = attentionZones[index];
        
        return {
          ...square,
          opacity: 0.85 + (attentionLevel * 0.15),
          scale: 0.98 + (attentionLevel * 0.02)
        };
      });
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

export default ListeningAnimation;