import React from 'react';
import { LoadingSpinnerProps } from './types';

const spinnerSizes = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
};

const spinnerColors = {
  primary: 'border-primary-600',
  secondary: 'border-neutral-600',
  neutral: 'border-white',
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'primary',
  className = '',
  'data-testid': testId,
}) => {
  const baseClasses = [
    'animate-spin rounded-full border-2 border-transparent',
    'motion-reduce:animate-none',
  ].join(' ');

  const sizeClasses = spinnerSizes[size];
  const colorClasses = `${spinnerColors[color]} border-t-current`;

  return (
    <div
      className={`${baseClasses} ${sizeClasses} ${colorClasses} ${className}`}
      role="status"
      aria-label="Loading"
      data-testid={testId}
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};