/**
 * Avatar Grid Component
 * Renders the 3x3 grid of squares for the lightweight avatar
 */

import React, { useMemo } from 'react';
import { AvatarGridProps, AVATAR_SIZES } from './types';

const AvatarGrid: React.FC<AvatarGridProps> = ({
  squares,
  size,
  colorScheme,
  className = '',
  reducedMotion = false,
  'data-testid': dataTestId
}) => {
  const sizeConfig = AVATAR_SIZES[size];

  // Memoize grid squares to prevent unnecessary re-renders
  const gridSquares = useMemo(() => {
    return squares.map((square) => (
      <div
        key={square.id}
        className={`
          ${sizeConfig.square} 
          rounded-sm transition-all duration-300 ease-in-out
          ${reducedMotion ? '' : 'hover:scale-105'}
          flex-shrink-0
        `}
        style={{
          backgroundColor: square.color,
          opacity: square.opacity,
          transform: `scale(${square.scale})`,
          transitionDelay: `${square.delay}ms`,
          willChange: reducedMotion ? 'auto' : 'transform, opacity',
          boxShadow: `0 0 ${square.opacity * 8}px ${square.color}40, 0 0 ${square.opacity * 16}px ${square.color}20`
        }}
        aria-hidden="true"
        data-square-id={square.id}
      />
    ));
  }, [squares, sizeConfig.square, reducedMotion]);

  return (
    <div
      className={`
        grid grid-cols-3 grid-rows-3 ${sizeConfig.gap} 
        w-full h-full place-items-center
        ${className}
      `}
      data-testid={dataTestId}
      role="presentation"
      aria-hidden="true"
      style={{
        aspectRatio: '1 / 1'
      }}
    >
      {gridSquares}
    </div>
  );
};

export default AvatarGrid;