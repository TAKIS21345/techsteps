import React, { useEffect, useRef } from 'react';
import { cn } from '../../utils/cn';

interface TalkBackOptimizedProps {
  children: React.ReactNode;
  contentDescription?: string;
  importantForAccessibility?: 'yes' | 'no' | 'no-hide-descendants';
  accessibilityRole?: 'button' | 'link' | 'text' | 'image' | 'header' | 'list' | 'listitem';
  accessibilityState?: {
    disabled?: boolean;
    selected?: boolean;
    checked?: boolean;
    expanded?: boolean;
  };
  accessibilityHint?: string;
  className?: string;
  onAccessibilityAction?: (action: string) => void;
}

export function TalkBackOptimized({
  children,
  contentDescription,
  importantForAccessibility = 'yes',
  accessibilityRole,
  accessibilityState,
  accessibilityHint,
  className,
  onAccessibilityAction,
}: TalkBackOptimizedProps) {
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Set TalkBack-specific attributes
    if (contentDescription) {
      element.setAttribute('aria-label', contentDescription);
    }

    if (accessibilityRole) {
      element.setAttribute('role', accessibilityRole);
    }

    if (accessibilityHint) {
      element.setAttribute('aria-describedby', `${element.id}-hint`);
    }

    // Set accessibility state
    if (accessibilityState) {
      if (accessibilityState.disabled !== undefined) {
        element.setAttribute('aria-disabled', accessibilityState.disabled.toString());
      }
      if (accessibilityState.selected !== undefined) {
        element.setAttribute('aria-selected', accessibilityState.selected.toString());
      }
      if (accessibilityState.checked !== undefined) {
        element.setAttribute('aria-checked', accessibilityState.checked.toString());
      }
      if (accessibilityState.expanded !== undefined) {
        element.setAttribute('aria-expanded', accessibilityState.expanded.toString());
      }
    }

    // Handle accessibility actions
    const handleKeyDown = (event: KeyboardEvent) => {
      if (onAccessibilityAction) {
        switch (event.key) {
          case 'Enter':
          case ' ':
            event.preventDefault();
            onAccessibilityAction('activate');
            break;
          case 'Escape':
            onAccessibilityAction('escape');
            break;
        }
      }
    };

    element.addEventListener('keydown', handleKeyDown);

    return () => {
      element.removeEventListener('keydown', handleKeyDown);
    };
  }, [contentDescription, accessibilityRole, accessibilityState, accessibilityHint, onAccessibilityAction]);

  return (
    <div
      ref={elementRef}
      className={cn(
        // TalkBack optimization classes
        'focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:ring-offset-2',
        // Ensure proper touch target size for TalkBack
        'min-h-[48px] min-w-[48px]',
        // High contrast support
        'contrast-more:border-2 contrast-more:border-current',
        className
      )}
      // Android-specific accessibility attributes
      data-important-for-accessibility={importantForAccessibility}
      tabIndex={accessibilityRole === 'button' || accessibilityRole === 'link' ? 0 : undefined}
    >
      {children}
      
      {/* Hidden hint for TalkBack */}
      {accessibilityHint && (
        <div
          id={`${elementRef.current?.id}-hint`}
          className="sr-only"
        >
          {accessibilityHint}
        </div>
      )}
    </div>
  );
}

// TalkBack-specific utilities
export function announceTalkBack(message: string, priority: 'low' | 'medium' | 'high' = 'medium') {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', priority === 'high' ? 'assertive' : 'polite');
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  // Add Android-specific attributes
  announcement.setAttribute('data-important-for-accessibility', 'yes');
  
  document.body.appendChild(announcement);
  
  // Clean up after announcement
  setTimeout(() => {
    if (document.body.contains(announcement)) {
      document.body.removeChild(announcement);
    }
  }, 1000);
}

// Focus management for TalkBack
export function focusForTalkBack(element: HTMLElement, announcement?: string) {
  element.focus();
  
  // Ensure element is properly announced
  if (announcement) {
    announceTalkBack(announcement);
  }
  
  // Scroll element into view if needed
  element.scrollIntoView({
    behavior: 'smooth',
    block: 'center',
  });
}

// Gesture detection for TalkBack users
export function useTalkBackGestures(
  elementRef: React.RefObject<HTMLElement>,
  onSwipeLeft?: () => void,
  onSwipeRight?: () => void,
  onDoubleTap?: () => void
) {
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;
    let tapCount = 0;
    let tapTimer: NodeJS.Timeout;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
      touchStartTime = Date.now();
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartX;
      const deltaY = touch.clientY - touchStartY;
      const deltaTime = Date.now() - touchStartTime;

      // Detect swipe gestures
      if (Math.abs(deltaX) > 50 && Math.abs(deltaY) < 100 && deltaTime < 300) {
        if (deltaX > 0 && onSwipeRight) {
          onSwipeRight();
        } else if (deltaX < 0 && onSwipeLeft) {
          onSwipeLeft();
        }
        return;
      }

      // Detect double tap
      if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10 && deltaTime < 300) {
        tapCount++;
        
        if (tapCount === 1) {
          tapTimer = setTimeout(() => {
            tapCount = 0;
          }, 300);
        } else if (tapCount === 2 && onDoubleTap) {
          clearTimeout(tapTimer);
          tapCount = 0;
          onDoubleTap();
        }
      }
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
      if (tapTimer) clearTimeout(tapTimer);
    };
  }, [elementRef, onSwipeLeft, onSwipeRight, onDoubleTap]);
}