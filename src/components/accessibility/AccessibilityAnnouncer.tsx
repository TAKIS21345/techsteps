import React, { useEffect, useRef, useState } from 'react';
import { useAccessibility } from '../../contexts/AccessibilityContext';

interface AnnouncementQueue {
  id: string;
  message: string;
  priority: 'polite' | 'assertive';
  timestamp: number;
}

export const AccessibilityAnnouncer: React.FC = () => {
  const { settings } = useAccessibility();
  const [announcements, setAnnouncements] = useState<AnnouncementQueue[]>([]);
  const politeRef = useRef<HTMLDivElement>(null);
  const assertiveRef = useRef<HTMLDivElement>(null);

  // Global announcement function
  useEffect(() => {
    const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
      const id = `announcement-${Date.now()}-${Math.random()}`;
      const announcement: AnnouncementQueue = {
        id,
        message,
        priority,
        timestamp: Date.now(),
      };

      setAnnouncements(prev => [...prev, announcement]);

      // Remove announcement after it's been read
      setTimeout(() => {
        setAnnouncements(prev => prev.filter(a => a.id !== id));
      }, 3000);
    };

    // Make announce function globally available
    (window as Window & { announceToScreenReader?: (message: string, priority?: 'polite' | 'assertive') => void }).announceToScreenReader = announce;

    return () => {
      delete (window as Window & { announceToScreenReader?: (message: string, priority?: 'polite' | 'assertive') => void }).announceToScreenReader;
    };
  }, []);

  // Process announcements
  useEffect(() => {
    const politeAnnouncements = announcements.filter(a => a.priority === 'polite');
    const assertiveAnnouncements = announcements.filter(a => a.priority === 'assertive');

    if (politeRef.current && politeAnnouncements.length > 0) {
      const latest = politeAnnouncements[politeAnnouncements.length - 1];
      politeRef.current.textContent = latest.message;
    }

    if (assertiveRef.current && assertiveAnnouncements.length > 0) {
      const latest = assertiveAnnouncements[assertiveAnnouncements.length - 1];
      assertiveRef.current.textContent = latest.message;
    }
  }, [announcements]);

  // Clear announcements when they're old
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setAnnouncements(prev => 
        prev.filter(a => now - a.timestamp < 5000)
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!settings.screenReaderOptimized) {
    return null;
  }

  return (
    <>
      <div
        ref={politeRef}
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        role="status"
      />
      <div
        ref={assertiveRef}
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
        role="alert"
      />
    </>
  );
};

// Hook for using the announcement system
export const useAnnouncement = () => {
  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const windowWithAnnouncer = window as Window & { announceToScreenReader?: (message: string, priority?: 'polite' | 'assertive') => void };
    if (windowWithAnnouncer.announceToScreenReader) {
      windowWithAnnouncer.announceToScreenReader(message, priority);
    }
  };

  return { announce };
};