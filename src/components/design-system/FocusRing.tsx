import React from 'react';
import { FocusRingProps } from './types';

export const FocusRing: React.FC<FocusRingProps> = ({
  visible = true,
  offset = true,
  className = '',
  children,
  'data-testid': testId,
}) => {
  if (!visible) {
    return <>{children}</>;
  }

  const focusClasses = [
    'focus-within:outline-none',
    'focus-within:ring-3',
    'focus-within:ring-primary-500',
    offset ? 'focus-within:ring-offset-3' : '',
    'focus-within:ring-offset-white',
  ].filter(Boolean).join(' ');

  return (
    <div
      className={`${focusClasses} ${className}`}
      data-testid={testId}
    >
      {children}
    </div>
  );
};