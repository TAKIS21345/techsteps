import React from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '../../utils/cn';

interface MobileCardProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  badge?: string;
  onClick?: () => void;
  href?: string;
  children?: React.ReactNode;
  className?: string;
  interactive?: boolean;
  disabled?: boolean;
}

export function MobileCard({
  title,
  description,
  icon,
  badge,
  onClick,
  href,
  children,
  className,
  interactive = true,
  disabled = false,
}: MobileCardProps) {
  const Component = href ? 'a' : 'div';
  const isClickable = (onClick || href) && !disabled;

  const cardClasses = cn(
    'block w-full rounded-lg border border-gray-200 dark:border-gray-700',
    'bg-white dark:bg-gray-800 shadow-sm',
    'transition-all duration-200 ease-in-out',
    
    // Touch optimization
    isClickable && [
      'min-h-[60px]', // Minimum touch target
      'active:scale-[0.98]', // Gentle press feedback
      'focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:ring-offset-2',
      'hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600',
      'cursor-pointer',
    ],
    
    disabled && [
      'opacity-50 cursor-not-allowed',
    ],
    
    className
  );

  const content = (
    <div className="p-4">
      <div className="flex items-center gap-3">
        {icon && (
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
            {icon}
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium text-gray-900 dark:text-white text-base truncate">
              {title}
            </h3>
            {badge && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                {badge}
              </span>
            )}
          </div>
          
          {description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
              {description}
            </p>
          )}
        </div>
        
        {isClickable && interactive && (
          <div className="flex-shrink-0 text-gray-400 dark:text-gray-500">
            <ChevronRight size={20} />
          </div>
        )}
      </div>
      
      {children && (
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
          {children}
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Component
        href={href}
        className={cardClasses}
        onClick={disabled ? undefined : onClick}
      >
        {content}
      </Component>
    );
  }

  return (
    <Component
      className={cardClasses}
      onClick={disabled ? undefined : onClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={isClickable ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      } : undefined}
    >
      {content}
    </Component>
  );
}