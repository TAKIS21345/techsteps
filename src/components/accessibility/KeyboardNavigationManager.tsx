import React, { useEffect, useRef, useCallback } from 'react';
import { useAccessibility } from '../../contexts/AccessibilityContext';

interface KeyboardNavigationManagerProps {
  children: React.ReactNode;
}

export const KeyboardNavigationManager: React.FC<KeyboardNavigationManagerProps> = ({ children }) => {
  const { settings, announceToScreenReader } = useAccessibility();
  const containerRef = useRef<HTMLDivElement>(null);
  const focusableElementsRef = useRef<HTMLElement[]>([]);
  const currentFocusIndexRef = useRef<number>(-1);

  // Get all focusable elements
  const getFocusableElements = useCallback((): HTMLElement[] => {
    if (!containerRef.current) return [];
    
    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]',
    ].join(', ');
    
    const elements = Array.from(
      containerRef.current.querySelectorAll(focusableSelectors)
    ) as HTMLElement[];
    
    // Filter out hidden elements
    return elements.filter(element => {
      const style = window.getComputedStyle(element);
      return (
        style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        element.offsetWidth > 0 &&
        element.offsetHeight > 0
      );
    });
  }, []);

  // Update focusable elements list
  const updateFocusableElements = useCallback(() => {
    focusableElementsRef.current = getFocusableElements();
  }, [getFocusableElements]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!settings.keyboardNavigation) return;

    const { key, ctrlKey, altKey, shiftKey } = event;
    
    // Update focusable elements on each navigation attempt
    updateFocusableElements();
    const focusableElements = focusableElementsRef.current;
    
    if (focusableElements.length === 0) return;

    switch (key) {
      case 'Tab':
        // Let browser handle tab navigation but track focus
        setTimeout(() => {
          const activeElement = document.activeElement as HTMLElement;
          const index = focusableElements.indexOf(activeElement);
          if (index !== -1) {
            currentFocusIndexRef.current = index;
          }
        }, 0);
        break;

      case 'F6': {
        // Skip to main content
        event.preventDefault();
        const mainContent = document.querySelector('main, [role="main"]') as HTMLElement;
        if (mainContent) {
          mainContent.focus();
          announceToScreenReader('Navigated to main content');
        }
        break;
      }

      case 'Escape': {
        // Close modals or return to previous focus
        const modal = document.querySelector('[role="dialog"], [role="alertdialog"]');
        if (modal) {
          const closeButton = modal.querySelector('[aria-label*="close"], [aria-label*="Close"]') as HTMLElement;
          if (closeButton) {
            closeButton.click();
            announceToScreenReader('Modal closed');
          }
        }
        break;
      }

      case 'ArrowDown':
      case 'ArrowUp':
        // Navigate through focusable elements with arrow keys
        if (ctrlKey) {
          event.preventDefault();
          const currentIndex = currentFocusIndexRef.current;
          let nextIndex;
          
          if (key === 'ArrowDown') {
            nextIndex = currentIndex < focusableElements.length - 1 ? currentIndex + 1 : 0;
          } else {
            nextIndex = currentIndex > 0 ? currentIndex - 1 : focusableElements.length - 1;
          }
          
          focusableElements[nextIndex]?.focus();
          currentFocusIndexRef.current = nextIndex;
          
          // Announce the focused element
          const focusedElement = focusableElements[nextIndex];
          if (focusedElement) {
            const label = focusedElement.getAttribute('aria-label') || 
                         focusedElement.textContent?.trim() || 
                         focusedElement.tagName.toLowerCase();
            announceToScreenReader(`Focused on ${label}`);
          }
        }
        break;

      case 'Enter':
      case ' ': {
        // Activate focused element
        const activeElement = document.activeElement as HTMLElement;
        if (activeElement && (activeElement.tagName === 'BUTTON' || activeElement.getAttribute('role') === 'button')) {
          if (key === ' ') {
            event.preventDefault();
            activeElement.click();
          }
        }
        break;
      }

      case 'h':
      case 'H':
        // Navigate by headings
        if (altKey) {
          event.preventDefault();
          const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6')) as HTMLElement[];
          if (headings.length > 0) {
            const currentHeading = headings.find(h => h === document.activeElement);
            const currentIndex = currentHeading ? headings.indexOf(currentHeading) : -1;
            const nextIndex = shiftKey 
              ? (currentIndex > 0 ? currentIndex - 1 : headings.length - 1)
              : (currentIndex < headings.length - 1 ? currentIndex + 1 : 0);
            
            headings[nextIndex].focus();
            headings[nextIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
            announceToScreenReader(`Heading: ${headings[nextIndex].textContent}`);
          }
        }
        break;

      case 'l':
      case 'L':
        // Navigate by links
        if (altKey) {
          event.preventDefault();
          const links = Array.from(document.querySelectorAll('a[href]')) as HTMLElement[];
          if (links.length > 0) {
            const currentLink = links.find(l => l === document.activeElement);
            const currentIndex = currentLink ? links.indexOf(currentLink) : -1;
            const nextIndex = shiftKey 
              ? (currentIndex > 0 ? currentIndex - 1 : links.length - 1)
              : (currentIndex < links.length - 1 ? currentIndex + 1 : 0);
            
            links[nextIndex].focus();
            links[nextIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
            announceToScreenReader(`Link: ${links[nextIndex].textContent}`);
          }
        }
        break;

      case 'b':
      case 'B':
        // Navigate by buttons
        if (altKey) {
          event.preventDefault();
          const buttons = Array.from(document.querySelectorAll('button, [role="button"]')) as HTMLElement[];
          if (buttons.length > 0) {
            const currentButton = buttons.find(b => b === document.activeElement);
            const currentIndex = currentButton ? buttons.indexOf(currentButton) : -1;
            const nextIndex = shiftKey 
              ? (currentIndex > 0 ? currentIndex - 1 : buttons.length - 1)
              : (currentIndex < buttons.length - 1 ? currentIndex + 1 : 0);
            
            buttons[nextIndex].focus();
            buttons[nextIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
            announceToScreenReader(`Button: ${buttons[nextIndex].textContent || buttons[nextIndex].getAttribute('aria-label')}`);
          }
        }
        break;
    }
  }, [settings.keyboardNavigation, updateFocusableElements, announceToScreenReader]);

  // Set up keyboard event listeners
  useEffect(() => {
    if (settings.keyboardNavigation) {
      document.addEventListener('keydown', handleKeyDown);
      
      // Update focusable elements when DOM changes
      const observer = new MutationObserver(updateFocusableElements);
      if (containerRef.current) {
        observer.observe(containerRef.current, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ['disabled', 'tabindex', 'hidden']
        });
      }
      
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        observer.disconnect();
      };
    }
  }, [settings.keyboardNavigation, handleKeyDown, updateFocusableElements]);

  // Add focus trap for modals
  const handleFocusTrap = useCallback((event: FocusEvent) => {
    const modal = document.querySelector('[role="dialog"], [role="alertdialog"]');
    if (!modal) return;

    const focusableElements = modal.querySelectorAll(
      'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];

    if (!modal.contains(event.target as Node)) {
      firstElement.focus();
      event.preventDefault();
    }
  }, []);

  useEffect(() => {
    document.addEventListener('focusin', handleFocusTrap);
    return () => document.removeEventListener('focusin', handleFocusTrap);
  }, [handleFocusTrap]);

  return (
    <div ref={containerRef} className={settings.keyboardNavigation ? 'keyboard-navigation' : ''}>
      {children}
    </div>
  );
};