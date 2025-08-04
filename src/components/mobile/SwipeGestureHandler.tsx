import React, { useRef, useCallback, useEffect } from 'react';

interface SwipeGestureHandlerProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number; // Minimum distance for swipe
  restraint?: number; // Maximum distance perpendicular to swipe direction
  allowedTime?: number; // Maximum time for swipe
  className?: string;
  disabled?: boolean;
}

interface TouchData {
  startX: number;
  startY: number;
  startTime: number;
}

export function SwipeGestureHandler({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  threshold = 100,
  restraint = 100,
  allowedTime = 300,
  className,
  disabled = false,
}: SwipeGestureHandlerProps) {
  const touchDataRef = useRef<TouchData | null>(null);
  const elementRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (disabled) return;
    
    const touch = e.touches[0];
    touchDataRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      startTime: Date.now(),
    };
  }, [disabled]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (disabled || !touchDataRef.current) return;

    const touch = e.changedTouches[0];
    const { startX, startY, startTime } = touchDataRef.current;
    
    const distX = touch.clientX - startX;
    const distY = touch.clientY - startY;
    const elapsedTime = Date.now() - startTime;

    // Check if swipe was fast enough
    if (elapsedTime > allowedTime) {
      touchDataRef.current = null;
      return;
    }

    // Determine swipe direction
    const absDistX = Math.abs(distX);
    const absDistY = Math.abs(distY);

    // Horizontal swipe
    if (absDistX >= threshold && absDistY <= restraint) {
      if (distX > 0 && onSwipeRight) {
        e.preventDefault();
        onSwipeRight();
      } else if (distX < 0 && onSwipeLeft) {
        e.preventDefault();
        onSwipeLeft();
      }
    }
    // Vertical swipe
    else if (absDistY >= threshold && absDistX <= restraint) {
      if (distY > 0 && onSwipeDown) {
        e.preventDefault();
        onSwipeDown();
      } else if (distY < 0 && onSwipeUp) {
        e.preventDefault();
        onSwipeUp();
      }
    }

    touchDataRef.current = null;
  }, [disabled, threshold, restraint, allowedTime, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Use passive listeners for better performance
    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchEnd]);

  return (
    <div
      ref={elementRef}
      className={className}
      style={{
        touchAction: disabled ? 'auto' : 'pan-y', // Allow vertical scrolling but handle horizontal swipes
      }}
    >
      {children}
    </div>
  );
}