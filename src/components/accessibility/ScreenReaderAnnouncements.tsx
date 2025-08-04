import React, { useEffect, useRef } from 'react';

interface ScreenReaderAnnouncementsProps {
  message?: string;
  priority?: 'polite' | 'assertive';
  clearOnUnmount?: boolean;
}

export const ScreenReaderAnnouncements: React.FC<ScreenReaderAnnouncementsProps> = ({
  message,
  priority = 'polite',
  clearOnUnmount = true,
}) => {
  const announcementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (message && announcementRef.current) {
      // Clear previous message
      announcementRef.current.textContent = '';
      
      // Set new message after a brief delay to ensure screen readers pick it up
      setTimeout(() => {
        if (announcementRef.current) {
          announcementRef.current.textContent = message;
        }
      }, 100);
    }
  }, [message]);

  useEffect(() => {
    return () => {
      if (clearOnUnmount && announcementRef.current) {
        announcementRef.current.textContent = '';
      }
    };
  }, [clearOnUnmount]);

  return (
    <div
      ref={announcementRef}
      aria-live={priority}
      aria-atomic="true"
      className="sr-only announcement-region"
      role="status"
    />
  );
};

// Hook for managing screen reader announcements
export const useScreenReaderAnnouncement = () => {
  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.setAttribute('role', 'status');
    announcement.className = 'sr-only announcement-region';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    // Remove after announcement
    setTimeout(() => {
      if (document.body.contains(announcement)) {
        document.body.removeChild(announcement);
      }
    }, 1000);
  };

  return { announce };
};