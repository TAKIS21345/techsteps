/**
 * Speaking Animation Component
 * Implements dynamic speaking pattern for the avatar speaking state
 */

import React, { useEffect, useRef, useCallback } from 'react';
import { GridSquare, COLOR_SCHEMES } from '../types';

export interface SpeakingAnimationProps {
  onSquaresUpdate: (squares: GridSquare[]) => void;
  onAnimationComplete?: () => void;
  reducedMotion?: boolean;
  colorScheme?: typeof COLOR_SCHEMES.default;
  intensity?: 'low' | 'medium' | 'high'; // Speaking intensity
}

export const SpeakingAnimation: React.FC<SpeakingAnimationProps> = ({
  onSquaresUpdate,
  onAnimationComplete,
  reducedMotion = false,
  colorScheme = COLOR_SCHEMES.default,
  intensity = 'medium'
}) => {
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const mountedRef = useRef<boolean>(true);

  // Animation configuration based on intensity
  const getAnimationConfig = useCallback(() => {
    switch (intensity) {
      case 'low':
        return {
          duration: 1200,
          scaleMin: 0.95,
          scaleMax: 1.1,
          opacityMin: 0.8,
          opacityMax: 1.0,
          frequency: 2
        };
      case 'high':
        return {
          duration: 600,
          scaleMin: 0.9,
          scaleMax: 1.2,
          opacityMin: 0.7,
          opacityMax: 1.0,
          frequency: 4
        };
      default: // medium
        return {
          duration: 800,
          scaleMin: 0.92,
          scaleMax: 1.15,
          opacityMin: 0.75,
          opacityMax: 1.0,
          frequency: 3
        };
    }
  }, [intensity]);

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

  // Calculate speaking pattern - center-focused with radiating energy
  const calculateSpeakingPattern = useCallback((progress: number, squareIndex: number) => {
    const config = getAnimationConfig();
    
    // Define distance from center for each square (center is index 4)
    const distances = [
      1.41, 1.0, 1.41,  // Top row: diagonal, straight, diagonal
      1.0,  0.0, 1.0,   // Middle row: straight, center, straight  
      1.41, 1.0, 1.41   // Bottom row: diagonal, straight, diagonal
    ];
    
    const distanceFromCenter = distances[squareIndex];
    
    // Create multiple wave frequencies for dynamic speaking effect
    const wave1 = Math.sin(progress * Math.PI * config.frequency);
    const wave2 = Math.sin(progress * Math.PI * config.frequency * 1.5 + Math.PI / 3);
    const wave3 = Math.sin(progress * Math.PI * config.frequency * 0.7 + Math.PI / 6);
    
    // Combine waves with different weights
    const combinedWave = (wave1 * 0.5 + wave2 * 0.3 + wave3 * 0.2);
    
    // Apply distance-based attenuation (center squares are more active)
    const attenuationFactor = Math.max(0.3, 1.0 - (distanceFromCenter * 0.3));
    const finalWave = combinedWave * attenuationFactor;
    
    // Convert to scale and opacity
    const scale = config.scaleMin + (Math.max(0, finalWave) * (config.scaleMax - config.scaleMin));
    const opacity = config.opacityMin + (Math.abs(finalWave) * (config.opacityMax - config.opacityMin));
    
    return {
      scale: Math.max(config.scaleMin, Math.min(config.scaleMax, scale)),
      opacity: Math.max(config.opacityMin, Math.min(config.opacityMax, opacity))
    };
  }, [getAnimationConfig]);

  // Add random variations to simulate natural speech patterns
  const addSpeechVariations = useCallback((progress: number, squareIndex: number) => {
    // Use square index as seed for consistent but varied patterns
    const seed = squareIndex * 0.1;
    
    // Create pseudo-random variations that repeat over time
    const variation1 = Math.sin((progress * Math.PI * 7) + seed) * 0.1;
    const variation2 = Math.sin((progress * Math.PI * 11) + seed * 2) * 0.05;
    
    return variation1 + variation2;
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

    // Create squares with speaking animation
    const baseSquares = createBaseSquares();
    const animatedSquares = baseSquares.map((square, index) => {
      const pattern = calculateSpeakingPattern(progress, index);
      const variation = addSpeechVariations(progress, index);
      
      return {
        ...square,
        scale: Math.max(0.8, pattern.scale + variation),
        opacity: Math.max(0.6, pattern.opacity + Math.abs(variation))
      };
    });

    onSquaresUpdate(animatedSquares);

    // Continue animation
    animationFrameRef.current = requestAnimationFrame(animate);
  }, [createBaseSquares, calculateSpeakingPattern, addSpeechVariations, getAnimationConfig, onSquaresUpdate]);

  // Start animation
  const startAnimation = useCallback(() => {
    if (reducedMotion) {
      // In reduced motion mode, show subtle center-focused pattern
      const staticSquares = createBaseSquares().map((square, index) => {
        const distances = [1.41, 1.0, 1.41, 1.0, 0.0, 1.0, 1.41, 1.0, 1.41];
        const distanceFromCenter = distances[index];
        const intensity = Math.max(0.7, 1.0 - (distanceFromCenter * 0.2));
        
        return {
          ...square,
          scale: 0.95 + (intensity * 0.1),
          opacity: 0.8 + (intensity * 0.2)
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

export default SpeakingAnimation;