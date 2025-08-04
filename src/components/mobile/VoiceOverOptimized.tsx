import React, { useEffect, useRef } from 'react';
import { cn } from '../../utils/cn';

interface VoiceOverOptimizedProps {
  children: React.ReactNode;
  label?: string;
  description?: string;
  role?: string;
  className?: string;
  announceOnMount?: boolean;
  skipLinks?: boolean;
}

export function VoiceOverOptimized({
  children,
  label,
  description,
  role,
  className,
  announceOnMount = false,
  skipLinks = false,
}: VoiceOverOptimizedProps) {
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (announceOnMount && label) {
      // Announce content when component mounts
      const announcement = document.createElement('div');
      announcement.setAttribute('aria-live', 'polite');
      announcement.setAttribute('aria-atomic', 'true');
      announcement.className = 'sr-only';
      announcement.textContent = label;
      
      document.body.appendChild(announcement);
      
      // Clean up after announcement
      setTimeout(() => {
        document.body.removeChild(announcement);
      }, 1000);
    }
  }, [announceOnMount, label]);

  return (
    <div
      ref={elementRef}
      className={cn(
        // VoiceOver optimization classes
        'focus-within:ring-4 focus-within:ring-blue-500/20',
        className
      )}
      role={role}
      aria-label={label}
      aria-describedby={description ? `${elementRef.current?.id}-desc` : undefined}
    >
      {/* Skip links for keyboard navigation */}
      {skipLinks && (
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded-lg z-50"
        >
          Skip to main content
        </a>
      )}
      
      {children}
      
      {/* Hidden description for screen readers */}
      {description && (
        <div
          id={`${elementRef.current?.id}-desc`}
          className="sr-only"
        >
          {description}
        </div>
      )}
    </div>
  );
}

// Screen reader announcement utility
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite') {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  // Clean up after announcement
  setTimeout(() => {
    if (document.body.contains(announcement)) {
      document.body.removeChild(announcement);
    }
  }, 1000);
}

// Focus management for screen readers
export function focusElement(selector: string, delay: number = 100) {
  setTimeout(() => {
    const element = document.querySelector(selector) as HTMLElement;
    if (element) {
      element.focus();
      
      // Announce focus change to screen readers
      if (element.getAttribute('aria-label') || element.textContent) {
        const label = element.getAttribute('aria-label') || element.textContent || '';
        announceToScreenReader(`Focused on ${label}`);
      }
    }
  }, delay);
}