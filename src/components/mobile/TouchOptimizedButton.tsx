import React, { forwardRef } from 'react';
import { cn } from '../../utils/cn';

interface TouchOptimizedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fullWidth?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

export const TouchOptimizedButton = forwardRef<HTMLButtonElement, TouchOptimizedButtonProps>(
  ({ 
    className, 
    variant = 'primary', 
    size = 'md', 
    fullWidth = false,
    loading = false,
    icon,
    iconPosition = 'left',
    children, 
    disabled,
    ...props 
  }, ref) => {
    const baseClasses = [
      // Base styles
      'inline-flex items-center justify-center font-medium rounded-lg',
      'transition-all duration-200 ease-in-out',
      'focus:outline-none focus:ring-4 focus:ring-offset-2',
      'active:scale-95', // Gentle press feedback
      'select-none', // Prevent text selection on touch
      
      // Touch optimization - minimum 44px touch target
      'min-h-[44px] min-w-[44px]',
      
      // Disabled state
      'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
    ];

    const variantClasses = {
      primary: [
        'bg-blue-600 text-white shadow-md',
        'hover:bg-blue-700 hover:shadow-lg',
        'focus:ring-blue-500',
        'active:bg-blue-800',
      ],
      secondary: [
        'bg-gray-600 text-white shadow-md',
        'hover:bg-gray-700 hover:shadow-lg',
        'focus:ring-gray-500',
        'active:bg-gray-800',
      ],
      outline: [
        'border-2 border-blue-600 text-blue-600 bg-transparent',
        'hover:bg-blue-50 hover:border-blue-700',
        'focus:ring-blue-500',
        'active:bg-blue-100',
        'dark:hover:bg-blue-900/20 dark:active:bg-blue-900/30',
      ],
      ghost: [
        'text-gray-700 bg-transparent',
        'hover:bg-gray-100',
        'focus:ring-gray-500',
        'active:bg-gray-200',
        'dark:text-gray-300 dark:hover:bg-gray-800 dark:active:bg-gray-700',
      ],
      danger: [
        'bg-red-600 text-white shadow-md',
        'hover:bg-red-700 hover:shadow-lg',
        'focus:ring-red-500',
        'active:bg-red-800',
      ],
    };

    const sizeClasses = {
      sm: 'px-3 py-2 text-sm gap-2',
      md: 'px-4 py-3 text-base gap-2', // Increased padding for better touch
      lg: 'px-6 py-4 text-lg gap-3', // Senior-friendly larger size
      xl: 'px-8 py-5 text-xl gap-4', // Extra large for accessibility
    };

    const widthClasses = fullWidth ? 'w-full' : '';

    return (
      <button
        ref={ref}
        className={cn(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          widthClasses,
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        )}
        
        {!loading && icon && iconPosition === 'left' && (
          <span className="flex-shrink-0">{icon}</span>
        )}
        
        {children && (
          <span className={cn(
            'flex-1',
            fullWidth ? 'text-center' : '',
            icon ? 'truncate' : ''
          )}>
            {children}
          </span>
        )}
        
        {!loading && icon && iconPosition === 'right' && (
          <span className="flex-shrink-0">{icon}</span>
        )}
      </button>
    );
  }
);

TouchOptimizedButton.displayName = 'TouchOptimizedButton';