import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { TouchOptimizedButton } from './TouchOptimizedButton';
import { useMobileDetection } from '../../hooks/useMobileDetection';
import { cn } from '../../utils/cn';

interface MobileModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'full';
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  className?: string;
}

export function MobileModal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  className,
}: MobileModalProps) {
  const { isMobile, orientation } = useMobileDetection();
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Focus management
  useEffect(() => {
    if (isOpen) {
      // Store the previously focused element
      previousFocusRef.current = document.activeElement as HTMLElement;
      
      // Focus the modal
      setTimeout(() => {
        modalRef.current?.focus();
      }, 100);
    } else {
      // Restore focus when modal closes
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll on mobile
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: isMobile ? 'max-w-sm' : 'max-w-md',
    md: isMobile ? 'max-w-md' : 'max-w-lg',
    lg: isMobile ? 'max-w-lg' : 'max-w-2xl',
    full: 'max-w-full',
  };

  const modalClasses = cn(
    'relative bg-white dark:bg-gray-800 shadow-xl',
    'transition-all duration-300 ease-in-out',
    
    // Mobile-first responsive design
    isMobile ? [
      'w-full max-h-[90vh]',
      size === 'full' ? 'h-full rounded-none' : 'rounded-t-2xl',
      size === 'full' ? 'fixed inset-0' : 'fixed bottom-0 left-0 right-0',
    ] : [
      'rounded-2xl max-h-[85vh] mx-4',
      sizeClasses[size],
    ],
    
    // Landscape adjustments for mobile
    isMobile && orientation === 'landscape' ? 'max-h-[80vh]' : '',
    
    className
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={closeOnOverlayClick ? onClose : undefined}
      />
      
      {/* Modal */}
      <div
        ref={modalRef}
        className={modalClasses}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        tabIndex={-1}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            {title && (
              <h2 
                id="modal-title"
                className="text-xl font-semibold text-gray-900 dark:text-white"
              >
                {title}
              </h2>
            )}
            
            {showCloseButton && (
              <TouchOptimizedButton
                variant="ghost"
                size="md"
                onClick={onClose}
                icon={<X size={20} />}
                aria-label="Close modal"
                className="ml-auto"
              />
            )}
          </div>
        )}
        
        {/* Content */}
        <div className={cn(
          'overflow-y-auto',
          // Adjust padding based on header presence
          (title || showCloseButton) ? 'p-6 pt-0' : 'p-6',
          // Mobile-specific scrolling
          isMobile ? 'overscroll-contain' : ''
        )}>
          {children}
        </div>
      </div>
    </div>
  );
}