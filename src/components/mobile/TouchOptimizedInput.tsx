import React, { forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '../../utils/cn';

interface TouchOptimizedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  showPasswordToggle?: boolean;
  fullWidth?: boolean;
}

export const TouchOptimizedInput = forwardRef<HTMLInputElement, TouchOptimizedInputProps>(
  ({ 
    className,
    label,
    error,
    helperText,
    leftIcon,
    rightIcon,
    showPasswordToggle = false,
    fullWidth = true,
    type = 'text',
    id,
    ...props 
  }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    const inputType = showPasswordToggle ? (showPassword ? 'text' : 'password') : type;

    const baseInputClasses = [
      // Base styles
      'block w-full rounded-lg border-2 transition-all duration-200',
      'text-base', // Minimum 16px to prevent zoom on iOS
      'bg-white dark:bg-gray-800',
      
      // Touch optimization - larger padding for easier interaction
      'px-4 py-4', // Increased from standard padding
      'min-h-[48px]', // Minimum touch target height
      
      // Focus and interaction states
      'focus:outline-none focus:ring-4 focus:ring-offset-1',
      'placeholder:text-gray-400 dark:placeholder:text-gray-500',
      
      // Icon spacing
      leftIcon ? 'pl-12' : '',
      (rightIcon || showPasswordToggle) ? 'pr-12' : '',
    ];

    const stateClasses = error 
      ? [
          'border-red-300 dark:border-red-600',
          'focus:border-red-500 focus:ring-red-500/20',
          'text-red-900 dark:text-red-100',
        ]
      : [
          'border-gray-300 dark:border-gray-600',
          'focus:border-blue-500 focus:ring-blue-500/20',
          'text-gray-900 dark:text-gray-100',
        ];

    const widthClasses = fullWidth ? 'w-full' : '';

    return (
      <div className={cn('space-y-2', widthClasses)}>
        {label && (
          <label 
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {label}
          </label>
        )}
        
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500">
              {leftIcon}
            </div>
          )}
          
          <input
            ref={ref}
            id={inputId}
            type={inputType}
            className={cn(
              baseInputClasses,
              stateClasses,
              className
            )}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            {...props}
          />
          
          {(rightIcon || showPasswordToggle) && (
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
              {showPasswordToggle ? (
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded p-1 min-w-[44px] min-h-[44px] flex items-center justify-center"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              ) : rightIcon ? (
                <div className="text-gray-400 dark:text-gray-500">
                  {rightIcon}
                </div>
              ) : null}
            </div>
          )}
        </div>
        
        {(error || helperText) && (
          <div className={cn(
            'text-sm',
            error 
              ? 'text-red-600 dark:text-red-400' 
              : 'text-gray-500 dark:text-gray-400'
          )}>
            {error || helperText}
          </div>
        )}
      </div>
    );
  }
);

TouchOptimizedInput.displayName = 'TouchOptimizedInput';