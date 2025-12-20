/**
 * Celebration Animation Component
 * Implements celebratory pattern for the avatar celebrating state
 */

import React, { useEffect, useRef, useCallback } from 'react';
import { GridSquare, COLOR_SCHEMES } from '../types';

export interface CelebrationAnimationProps {
  onSquaresUpdate: (squares: GridSquare[]) => void;
  onAnimationComplete?: () => void;
  reducedMotion?: boolean;
  colorScheme?: typeof COLOR_SCHEMES.celebrating;
  intensity?: 'subtle' | 'moderate' | 'enthusiastic';
}

export const CelebrationAnimation: React.FC<CelebrationAnimationProps> = ({
  onSquaresUpdate,
  onAnimationComplete,
  reducedMotion = false,
  colorScheme = COLOR_SCHEMES.celebrating,
  intensity = 'moderate'
}) => {
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const mountedRef = useRef<boolean>(true);
  const phaseRef = useRef<'burst' | 'sparkle' | 'settle'>('burst');

  // Animation configuration based on intensity
  const getAnimationConfig = useCallback(() => {
    switch (intensity) {
      case 'subtle':
        return {
          burstDuration: 800,
          sparkleDuration: 1200,
          settleDuration: 600,
          scaleMin: 0.9,
          scaleMax: 1.2,
          opacityMin: 0.7,
          opacityMax: 1.0,
          sparkleCount: 2
        };
      case 'enthusiastic':
        return {
          burstDuration: 600,
          sparkleDuration: 2000,
          settleDuration: 400,
          scaleMin: 0.8,
          scaleMax: 1.4,
          opacityMin: 0.6,
          opacityMax: 1.0,
          sparkleCount: 4
        };
      default: // moderate
        return {
          burstDuration: 700,
          sparkleDuration: 1500,
          settleDuration: 500,
          scaleMin: 0.85,
          scaleMax: 1.3,
          opacityMin: 0.65,
          opacityMax: 1.0,
          sparkleCount: 3
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

  // Calculate burst phase - explosive outward movement
  const calculateBurstPattern = useCallback((progress: number, squareIndex: number) => {
    const config = getAnimationConfig();
    
    // Define burst pattern from center outward
    const burstOrder = [4, 1, 3, 5, 7, 0, 2, 6, 8]; // Center first, then edges
    const burstIndex = burstOrder.indexOf(squareIndex);
    const burstDelay = burstIndex / 8; // Stagger the burst
    
    // Adjust progress for this square's burst timing
    const adjustedProgress = Math.max(0, Math.min(1, (progress - burstDelay) * 2));
    
    // Create explosive scaling with easing
    let scale, opacity;
    
    if (adjustedProgress < 0.3) {
      // Initial burst - rapid expansion
      const burstProgress = adjustedProgress / 0.3;
      scale = 1.0 + (burstProgress * (config.scaleMax - 1.0));
      opacity = 1.0;
    } else if (adjustedProgress < 0.7) {
      // Peak burst - maximum scale with slight opacity variation
      scale = config.scaleMax;
      opacity = config.opacityMax - (Math.sin((adjustedProgress - 0.3) * Math.PI * 5) * 0.2);
    } else {
      // Burst settle - return towards normal
      const settleProgress = (adjustedProgress - 0.7) / 0.3;
      scale = config.scaleMax - (settleProgress * (config.scaleMax - 1.1));
      opacity = config.opacityMin + ((1 - settleProgress) * (config.opacityMax - config.opacityMin));
    }
    
    return {
      scale: Math.max(config.scaleMin, Math.min(config.scaleMax, scale)),
      opacity: Math.max(config.opacityMin, Math.min(config.opacityMax, opacity))
    };
  }, [getAnimationConfig]);

  // Calculate sparkle phase - twinkling celebration
  const calculateSparklePattern = useCallback((progress: number, squareIndex: number) => {
    const config = getAnimationConfig();
    
    // Create multiple sparkle frequencies for each square
    const sparkles = [];
    for (let i = 0; i < config.sparkleCount; i++) {
      const frequency = 3 + (i * 1.5) + (squareIndex * 0.3);
      const phase = (squareIndex * 0.7) + (i * Math.PI / 3);
      const sparkle = Math.sin(progress * Math.PI * frequency + phase);
      sparkles.push(sparkle);
    }
    
    // Combine sparkles with different weights
    const combinedSparkle = sparkles.reduce((sum, sparkle, index) => {
      const weight = 1 / (index + 1); // Decreasing weight for higher frequencies
      return sum + (sparkle * weight);
    }, 0) / sparkles.length;
    
    // Convert to scale and opacity
    const scale = 1.0 + (Math.max(0, combinedSparkle) * 0.15);
    const opacity = 0.8 + (Math.abs(combinedSparkle) * 0.2);
    
    return {
      scale: Math.max(0.95, Math.min(1.15, scale)),
      opacity: Math.max(0.7, Math.min(1.0, opacity))
    };
  }, [getAnimationConfig]);

  // Calculate settle phase - gentle return to normal
  const calculateSettlePattern = useCallback((progress: number, squareIndex: number) => {
    // Gentle easing back to normal state
    const easeOut = 1 - Math.pow(1 - progress, 3);
    
    const targetScale = 1.0;
    const targetOpacity = 1.0;
    const currentScale = 1.1 - (easeOut * 0.1);
    const currentOpacity = 0.9 + (easeOut * 0.1);
    
    return {
      scale: Math.max(0.95, Math.min(1.05, currentScale)),
      opacity: Math.max(0.8, Math.min(1.0, currentOpacity))
    };
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
    
    // Determine current phase and progress
    let phase = phaseRef.current;
    let progress = 0;
    let shouldComplete = false;
    
    if (elapsed < config.burstDuration) {
      phase = 'burst';
      progress = elapsed / config.burstDuration;
    } else if (elapsed < config.burstDuration + config.sparkleDuration) {
      phase = 'sparkle';
      progress = (elapsed - config.burstDuration) / config.sparkleDuration;
    } else if (elapsed < config.burstDuration + config.sparkleDuration + config.settleDuration) {
      phase = 'settle';
      progress = (elapsed - config.burstDuration - config.sparkleDuration) / config.settleDuration;
    } else {
      shouldComplete = true;
    }
    
    phaseRef.current = phase;

    if (shouldComplete) {
      // Animation complete - show final state
      const finalSquares = createBaseSquares();
      onSquaresUpdate(finalSquares);
      onAnimationComplete?.();
      return;
    }

    // Create squares based on current phase
    const baseSquares = createBaseSquares();
    let animatedSquares;
    
    switch (phase) {
      case 'burst':
        animatedSquares = baseSquares.map((square, index) => {
          const pattern = calculateBurstPattern(progress, index);
          return { ...square, ...pattern };
        });
        break;
      case 'sparkle':
        animatedSquares = baseSquares.map((square, index) => {
          const pattern = calculateSparklePattern(progress, index);
          return { ...square, ...pattern };
        });
        break;
      case 'settle':
        animatedSquares = baseSquares.map((square, index) => {
          const pattern = calculateSettlePattern(progress, index);
          return { ...square, ...pattern };
        });
        break;
      default:
        animatedSquares = baseSquares;
    }

    onSquaresUpdate(animatedSquares);

    // Continue animation
    animationFrameRef.current = requestAnimationFrame(animate);
  }, [createBaseSquares, calculateBurstPattern, calculateSparklePattern, calculateSettlePattern, getAnimationConfig, onSquaresUpdate, onAnimationComplete]);

  // Start animation
  const startAnimation = useCallback(() => {
    if (reducedMotion) {
      // In reduced motion mode, show subtle celebration state
      const staticSquares = createBaseSquares().map((square, index) => {
        // Subtle scale variation to indicate celebration
        const celebrationBoost = index === 4 ? 0.1 : 0.05; // Center square more prominent
        return {
          ...square,
          scale: 1.0 + celebrationBoost,
          opacity: 0.9 + celebrationBoost
        };
      });
      onSquaresUpdate(staticSquares);
      
      // Complete after a short delay to simulate celebration
      setTimeout(() => {
        onAnimationComplete?.();
      }, 1000);
      return;
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    startTimeRef.current = null;
    phaseRef.current = 'burst';
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

export default CelebrationAnimation;