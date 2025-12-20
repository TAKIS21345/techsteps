/**
 * Error Animation Component
 * Implements error indication pattern for the avatar error state
 */

import React, { useEffect, useRef, useCallback } from 'react';
import { GridSquare, COLOR_SCHEMES } from '../types';

export interface ErrorAnimationProps {
  onSquaresUpdate: (squares: GridSquare[]) => void;
  onAnimationComplete?: () => void;
  reducedMotion?: boolean;
  colorScheme?: typeof COLOR_SCHEMES.error;
  severity?: 'warning' | 'error' | 'critical';
}

export const ErrorAnimation: React.FC<ErrorAnimationProps> = ({
  onSquaresUpdate,
  onAnimationComplete,
  reducedMotion = false,
  colorScheme = COLOR_SCHEMES.error,
  severity = 'error'
}) => {
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const mountedRef = useRef<boolean>(true);
  const shakeCountRef = useRef<number>(0);

  // Animation configuration based on severity
  const getAnimationConfig = useCallback(() => {
    switch (severity) {
      case 'warning':
        return {
          shakeDuration: 400,
          shakeCount: 2,
          shakeIntensity: 0.05,
          pulseFrequency: 2,
          scaleMin: 0.95,
          scaleMax: 1.05,
          opacityMin: 0.8,
          opacityMax: 1.0
        };
      case 'critical':
        return {
          shakeDuration: 300,
          shakeCount: 4,
          shakeIntensity: 0.15,
          pulseFrequency: 4,
          scaleMin: 0.85,
          scaleMax: 1.15,
          opacityMin: 0.7,
          opacityMax: 1.0
        };
      default: // error
        return {
          shakeDuration: 350,
          shakeCount: 3,
          shakeIntensity: 0.1,
          pulseFrequency: 3,
          scaleMin: 0.9,
          scaleMax: 1.1,
          opacityMin: 0.75,
          opacityMax: 1.0
        };
    }
  }, [severity]);

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

  // Calculate shake pattern - alternating distortion to indicate error
  const calculateShakePattern = useCallback((progress: number, squareIndex: number) => {
    const config = getAnimationConfig();
    
    // Create shake pattern that alternates between squares
    const shakePhase = progress * Math.PI * 8; // Multiple shake cycles
    const shakeOffset = (squareIndex % 2) * Math.PI; // Alternate squares
    
    // Calculate shake intensity that decreases over time
    const shakeDecay = Math.max(0, 1 - (progress * 0.7));
    const shakeValue = Math.sin(shakePhase + shakeOffset) * config.shakeIntensity * shakeDecay;
    
    // Apply shake to scale (alternating expansion/contraction)
    const baseScale = 1.0;
    const scale = baseScale + shakeValue;
    
    // Add error pulse for visibility
    const pulseValue = Math.sin(progress * Math.PI * config.pulseFrequency) * 0.05;
    const finalScale = scale + Math.abs(pulseValue);
    
    // Calculate opacity with error indication
    const errorPulse = Math.sin(progress * Math.PI * config.pulseFrequency * 0.7);
    const opacity = config.opacityMin + (Math.abs(errorPulse) * (config.opacityMax - config.opacityMin));
    
    return {
      scale: Math.max(config.scaleMin, Math.min(config.scaleMax, finalScale)),
      opacity: Math.max(config.opacityMin, Math.min(config.opacityMax, opacity))
    };
  }, [getAnimationConfig]);

  // Calculate error flash pattern - brief intense flashes to draw attention
  const calculateFlashPattern = useCallback((progress: number, squareIndex: number) => {
    const config = getAnimationConfig();
    
    // Create flash pattern with decreasing frequency
    const flashFrequency = config.pulseFrequency * (1 - progress * 0.5);
    const flashPhase = progress * Math.PI * flashFrequency;
    
    // Create staggered flashes across the grid
    const staggerOffset = (squareIndex * Math.PI) / 4;
    const flashValue = Math.sin(flashPhase + staggerOffset);
    
    // Only show positive flash values (brief bright moments)
    const flashIntensity = Math.max(0, flashValue) * (1 - progress * 0.8);
    
    return flashIntensity;
  }, [getAnimationConfig]);

  // Calculate distortion pattern - irregular scaling to show system distress
  const calculateDistortionPattern = useCallback((progress: number, squareIndex: number) => {
    const config = getAnimationConfig();
    
    // Create irregular distortion based on square position
    const row = Math.floor(squareIndex / 3);
    const col = squareIndex % 3;
    
    // Use position-based pseudo-random distortion
    const distortionSeed = (row * 3 + col) * 0.7;
    const distortion1 = Math.sin(progress * Math.PI * 5 + distortionSeed);
    const distortion2 = Math.sin(progress * Math.PI * 7 + distortionSeed * 1.3);
    
    // Combine distortions with decreasing intensity
    const combinedDistortion = (distortion1 + distortion2 * 0.5) / 1.5;
    const distortionIntensity = combinedDistortion * config.shakeIntensity * (1 - progress * 0.6);
    
    return distortionIntensity;
  }, [getAnimationConfig]);

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
    const cycleDuration = config.shakeDuration;
    const totalDuration = cycleDuration * config.shakeCount;

    if (elapsed >= totalDuration) {
      // Animation complete
      const finalSquares = createBaseSquares();
      onSquaresUpdate(finalSquares);
      onAnimationComplete?.();
      return;
    }

    // Calculate progress within current shake cycle
    const cycleProgress = (elapsed % cycleDuration) / cycleDuration;
    const overallProgress = elapsed / totalDuration;

    // Create squares with error animation
    const baseSquares = createBaseSquares();
    const animatedSquares = baseSquares.map((square, index) => {
      const shakePattern = calculateShakePattern(cycleProgress, index);
      const flashIntensity = calculateFlashPattern(overallProgress, index);
      const distortion = calculateDistortionPattern(overallProgress, index);
      
      // Combine all error effects
      const finalScale = shakePattern.scale + distortion;
      const finalOpacity = Math.min(1.0, shakePattern.opacity + flashIntensity);
      
      return {
        ...square,
        scale: Math.max(0.8, Math.min(1.2, finalScale)),
        opacity: Math.max(0.6, finalOpacity)
      };
    });

    onSquaresUpdate(animatedSquares);

    // Continue animation
    animationFrameRef.current = requestAnimationFrame(animate);
  }, [createBaseSquares, calculateShakePattern, calculateFlashPattern, calculateDistortionPattern, getAnimationConfig, onSquaresUpdate, onAnimationComplete]);

  // Start animation
  const startAnimation = useCallback(() => {
    if (reducedMotion) {
      // In reduced motion mode, show static error state
      const staticSquares = createBaseSquares().map((square, index) => {
        // Subtle error indication without animation
        const errorIntensity = severity === 'critical' ? 0.15 : severity === 'warning' ? 0.05 : 0.1;
        const alternatePattern = (index % 2) * errorIntensity;
        
        return {
          ...square,
          scale: 1.0 + alternatePattern,
          opacity: 0.85 + alternatePattern
        };
      });
      onSquaresUpdate(staticSquares);
      
      // Complete after showing error state briefly
      setTimeout(() => {
        onAnimationComplete?.();
      }, 800);
      return;
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    startTimeRef.current = null;
    shakeCountRef.current = 0;
    animationFrameRef.current = requestAnimationFrame(animate);
  }, [reducedMotion, createBaseSquares, onSquaresUpdate, onAnimationComplete, animate, severity]);

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

export default ErrorAnimation;