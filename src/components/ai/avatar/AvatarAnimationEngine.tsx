/**
 * Avatar Animation Engine
 * Core animation logic for the lightweight avatar system
 */

import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import {
  AvatarState,
  GridSquare,
  AnimationPattern,
  GridKeyframe,
  ANIMATION_PATTERNS,
  COLOR_SCHEMES
} from './types';

export interface AvatarAnimationEngineProps {
  state: AvatarState;
  onSquaresUpdate: (squares: GridSquare[]) => void;
  onAnimationComplete?: (state: AvatarState) => void;
  reducedMotion?: boolean;
  className?: string;
}

interface AnimationFrame {
  timestamp: number;
  progress: number;
  squares: GridSquare[];
}

export const AvatarAnimationEngine: React.FC<AvatarAnimationEngineProps> = ({
  state,
  onSquaresUpdate,
  onAnimationComplete,
  reducedMotion = false,
  className = ''
}) => {
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const currentStateRef = useRef<AvatarState>(state);
  const isAnimatingRef = useRef<boolean>(false);
  const mountedRef = useRef<boolean>(true);

  // Get the animation pattern for the current state
  const animationPattern = useMemo(() => {
    return ANIMATION_PATTERNS[state];
  }, [state]);

  // Get the color scheme for the current state
  const colorScheme = useMemo(() => {
    switch (state) {
      case 'celebrating':
        return COLOR_SCHEMES.celebrating;
      case 'error':
        return COLOR_SCHEMES.error;
      default:
        return COLOR_SCHEMES.default;
    }
  }, [state]);

  // Create base grid squares
  const createBaseSquares = useCallback((): GridSquare[] => {
    const squares: GridSquare[] = [];
    for (let i = 0; i < 9; i++) {
      squares.push({
        id: i,
        opacity: 1.0,
        scale: 1.0,
        color: colorScheme.primary[i],
        delay: 0,
        borderRadius: '10%'
      });
    }
    return squares;
  }, [colorScheme]);

  // Interpolate between two keyframes
  const interpolateKeyframes = useCallback((
    keyframe1: GridKeyframe,
    keyframe2: GridKeyframe,
    progress: number
  ): GridSquare[] => {
    const baseSquares = createBaseSquares();

    baseSquares.forEach((square, index) => {
      const square1 = keyframe1.squares[index] || {};
      const square2 = keyframe2.squares[index] || {};

      // Interpolate opacity
      if (square1.opacity !== undefined && square2.opacity !== undefined) {
        square.opacity = square1.opacity + (square2.opacity - square1.opacity) * progress;
      } else if (square1.opacity !== undefined) {
        square.opacity = square1.opacity;
      } else if (square2.opacity !== undefined) {
        square.opacity = square2.opacity;
      }

      // Interpolate scale
      if (square1.scale !== undefined && square2.scale !== undefined) {
        square.scale = square1.scale + (square2.scale - square1.scale) * progress;
      } else if (square1.scale !== undefined) {
        square.scale = square1.scale;
      } else if (square2.scale !== undefined) {
        square.scale = square2.scale;
      }

      // Interpolate border radius
      if (square1.borderRadius !== undefined && square2.borderRadius !== undefined) {
        // Assume percentage values for now (e.g. "10%", "50%")
        const val1 = parseFloat(square1.borderRadius);
        const val2 = parseFloat(square2.borderRadius);
        const interpolated = val1 + (val2 - val1) * progress;
        square.borderRadius = `${interpolated}%`;
      } else if (square1.borderRadius !== undefined) {
        square.borderRadius = square1.borderRadius;
      } else if (square2.borderRadius !== undefined) {
        square.borderRadius = square2.borderRadius;
      }

      // Set delay based on square position for wave effects
      square.delay = index * 50; // Stagger animation by 50ms per square
    });

    return baseSquares;
  }, [createBaseSquares]);

  // Get squares for a specific animation progress
  const getSquaresForProgress = useCallback((progress: number): GridSquare[] => {
    const { keyframes } = animationPattern;

    if (keyframes.length === 0) {
      return createBaseSquares();
    }

    if (keyframes.length === 1) {
      const baseSquares = createBaseSquares();
      keyframes[0].squares.forEach((squareUpdate, index) => {
        if (baseSquares[index]) {
          Object.assign(baseSquares[index], squareUpdate);
        }
      });
      return baseSquares;
    }

    // Find the two keyframes to interpolate between
    let keyframe1 = keyframes[0];
    let keyframe2 = keyframes[keyframes.length - 1];

    for (let i = 0; i < keyframes.length - 1; i++) {
      if (progress >= keyframes[i].time && progress <= keyframes[i + 1].time) {
        keyframe1 = keyframes[i];
        keyframe2 = keyframes[i + 1];
        break;
      }
    }

    // Calculate local progress between the two keyframes
    const timeRange = keyframe2.time - keyframe1.time;
    const localProgress = timeRange > 0 ? (progress - keyframe1.time) / timeRange : 0;

    // Apply easing function
    const easedProgress = applyEasing(localProgress, animationPattern.easing);

    return interpolateKeyframes(keyframe1, keyframe2, easedProgress);
  }, [animationPattern, createBaseSquares, interpolateKeyframes]);

  // Apply easing function to progress
  const applyEasing = useCallback((progress: number, easing: string): number => {
    switch (easing) {
      case 'ease-in':
        return progress * progress;
      case 'ease-out':
        return 1 - Math.pow(1 - progress, 2);
      case 'ease-in-out':
        return progress < 0.5
          ? 2 * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      case 'linear':
        return progress;
      default:
        return progress < 0.5
          ? 2 * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 2) / 2;
    }
  }, []);

  // Animation loop
  const animate = useCallback((timestamp: number) => {
    if (!mountedRef.current || !isAnimatingRef.current) {
      return;
    }

    if (startTimeRef.current === null) {
      startTimeRef.current = timestamp;
    }

    const elapsed = timestamp - startTimeRef.current;
    const progress = Math.min(elapsed / animationPattern.duration, 1);

    // Get squares for current progress
    const squares = getSquaresForProgress(progress);
    onSquaresUpdate(squares);

    // Check if animation is complete
    if (progress >= 1) {
      if (animationPattern.loop) {
        // Restart the animation
        startTimeRef.current = timestamp;
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        // Animation complete
        isAnimatingRef.current = false;
        onAnimationComplete?.(currentStateRef.current);
      }
    } else {
      // Continue animation
      animationFrameRef.current = requestAnimationFrame(animate);
    }
  }, [animationPattern, getSquaresForProgress, onSquaresUpdate, onAnimationComplete]);

  // Start animation
  const startAnimation = useCallback(() => {
    if (reducedMotion) {
      // In reduced motion mode, just show the final state
      const finalSquares = getSquaresForProgress(1);
      onSquaresUpdate(finalSquares);
      onAnimationComplete?.(state);
      return;
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    startTimeRef.current = null;
    isAnimatingRef.current = true;
    currentStateRef.current = state;

    animationFrameRef.current = requestAnimationFrame(animate);
  }, [reducedMotion, getSquaresForProgress, onSquaresUpdate, onAnimationComplete, state, animate]);

  // Stop animation
  const stopAnimation = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    isAnimatingRef.current = false;
    startTimeRef.current = null;
  }, []);

  // Effect to handle state changes
  useEffect(() => {
    startAnimation();

    return () => {
      stopAnimation();
    };
  }, [state, animationPattern, startAnimation, stopAnimation]);

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

export default AvatarAnimationEngine;