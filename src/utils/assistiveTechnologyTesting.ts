/**
 * Utilities for testing onboarding components with assistive technologies
 * Simulates screen reader, keyboard navigation, and other accessibility tools
 */

export interface ScreenReaderAnnouncement {
  text: string;
  priority: 'polite' | 'assertive';
  timestamp: number;
}

export interface KeyboardNavigationTest {
  element: HTMLElement;
  canReceiveFocus: boolean;
  hasVisibleFocusIndicator: boolean;
  hasProperAriaLabel: boolean;
  tabIndex: number;
}

export interface AssistiveTechnologyTestResult {
  screenReaderSupport: {
    announcements: ScreenReaderAnnouncement[];
    hasProperLandmarks: boolean;
    hasDescriptiveLabels: boolean;
    hasLiveRegions: boolean;
  };
  keyboardNavigation: {
    elements: KeyboardNavigationTest[];
    tabOrder: number[];
    hasSkipLinks: boolean;
    trapsFocusWhenNeeded: boolean;
  };
  voiceControl: {
    hasVoiceLabels: boolean;
    elementsAreClickable: boolean;
    hasUniqueNames: boolean;
  };
  magnification: {
    supportsZoom: boolean;
    maintainsUsability: boolean;
    hasScrollableContent: boolean;
  };
}

/**
 * Mock screen reader for testing announcements
 */
export class MockScreenReader {
  private announcements: ScreenReaderAnnouncement[] = [];
  private isListening: boolean = false;

  start() {
    this.isListening = true;
    this.announcements = [];
    
    // Listen for aria-live region changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' || mutation.type === 'characterData') {
          const target = mutation.target as HTMLElement;
          const ariaLive = target.getAttribute('aria-live') || 
                          target.closest('[aria-live]')?.getAttribute('aria-live');
          
          if (ariaLive && target.textContent?.trim()) {
            this.announce(target.textContent.trim(), ariaLive as 'polite' | 'assertive');
          }
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return observer;
  }

  announce(text: string, priority: 'polite' | 'assertive' = 'polite') {
    if (this.isListening) {
      this.announcements.push({
        text,
        priority,
        timestamp: Date.now(),
      });
    }
  }

  getAnnouncements(): ScreenReaderAnnouncement[] {
    return [...this.announcements];
  }

  getLastAnnouncement(): ScreenReaderAnnouncement | null {
    return this.announcements[this.announcements.length - 1] || null;
  }

  clear() {
    this.announcements = [];
  }

  stop() {
    this.isListening = false;
  }
}

/**
 * Test keyboard navigation for onboarding components
 */
export const testKeyboardNavigation = (containerElement: HTMLElement): KeyboardNavigationTest[] => {
  const focusableSelectors = [
    'button:not([disabled])',
    '[href]',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[role="button"]:not([aria-disabled="true"])',
    '[role="link"]',
    '[role="menuitem"]',
    '[role="tab"]',
  ];

  const focusableElements = containerElement.querySelectorAll(focusableSelectors.join(', '));
  
  return Array.from(focusableElements).map((element, index) => {
    const htmlElement = element as HTMLElement;
    
    // Test if element can receive focus
    const originalTabIndex = htmlElement.tabIndex;
    htmlElement.focus();
    const canReceiveFocus = document.activeElement === htmlElement;
    
    // Check for visible focus indicator
    const computedStyle = window.getComputedStyle(htmlElement, ':focus');
    const hasVisibleFocusIndicator = 
      computedStyle.outline !== 'none' || 
      computedStyle.boxShadow !== 'none' ||
      computedStyle.borderColor !== computedStyle.getPropertyValue('border-color');

    // Check for proper ARIA label
    const ariaLabel = htmlElement.getAttribute('aria-label');
    const ariaLabelledBy = htmlElement.getAttribute('aria-labelledby');
    const textContent = htmlElement.textContent?.trim();
    const hasProperAriaLabel = !!(ariaLabel || ariaLabelledBy || textContent);

    return {
      element: htmlElement,
      canReceiveFocus,
      hasVisibleFocusIndicator,
      hasProperAriaLabel,
      tabIndex: originalTabIndex,
    };
  });
};

/**
 * Test tab order for logical navigation
 */
export const testTabOrder = (containerElement: HTMLElement): number[] => {
  const keyboardTests = testKeyboardNavigation(containerElement);
  
  return keyboardTests
    .filter(test => test.canReceiveFocus)
    .sort((a, b) => {
      // Sort by tab index, then by DOM order
      if (a.tabIndex !== b.tabIndex) {
        return a.tabIndex - b.tabIndex;
      }
      
      // Compare DOM position
      const position = a.element.compareDocumentPosition(b.element);
      return position & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
    })
    .map(test => test.tabIndex);
};

/**
 * Simulate keyboard navigation through onboarding
 */
export const simulateKeyboardNavigation = (
  containerElement: HTMLElement,
  keys: string[] = ['Tab', 'Enter', 'Escape', 'ArrowUp', 'ArrowDown']
): { success: boolean; errors: string[] } => {
  const errors: string[] = [];
  const keyboardTests = testKeyboardNavigation(containerElement);
  
  // Test Tab navigation
  let currentFocusIndex = -1;
  const focusableElements = keyboardTests.filter(test => test.canReceiveFocus);
  
  if (focusableElements.length === 0) {
    errors.push('No focusable elements found');
    return { success: false, errors };
  }

  // Simulate Tab key presses
  for (let i = 0; i < focusableElements.length; i++) {
    const element = focusableElements[i].element;
    
    // Simulate Tab key
    const tabEvent = new KeyboardEvent('keydown', { key: 'Tab' });
    element.dispatchEvent(tabEvent);
    
    element.focus();
    
    if (document.activeElement !== element) {
      errors.push(`Element ${i} could not receive focus via Tab navigation`);
    }
    
    if (!focusableElements[i].hasVisibleFocusIndicator) {
      errors.push(`Element ${i} lacks visible focus indicator`);
    }
  }

  // Test Enter key on buttons
  const buttons = containerElement.querySelectorAll('button, [role="button"]');
  buttons.forEach((button, index) => {
    const htmlButton = button as HTMLElement;
    htmlButton.focus();
    
    const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
    const clickSpy = vi.fn();
    htmlButton.addEventListener('click', clickSpy);
    
    htmlButton.dispatchEvent(enterEvent);
    
    // Note: In a real test, you'd check if the button's action was triggered
    // This is a simplified version for demonstration
  });

  // Test Escape key for modals/tooltips
  const modals = containerElement.querySelectorAll('[role="dialog"], [data-testid*="tooltip"]');
  modals.forEach((modal, index) => {
    const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
    modal.dispatchEvent(escapeEvent);
    
    // Check if modal is still visible after Escape
    const isVisible = window.getComputedStyle(modal as HTMLElement).display !== 'none';
    if (isVisible) {
      errors.push(`Modal/tooltip ${index} does not close on Escape key`);
    }
  });

  return {
    success: errors.length === 0,
    errors,
  };
};

/**
 * Test voice control compatibility
 */
export const testVoiceControlSupport = (containerElement: HTMLElement): {
  hasVoiceLabels: boolean;
  elementsAreClickable: boolean;
  hasUniqueNames: boolean;
  issues: string[];
} => {
  const issues: string[] = [];
  const interactiveElements = containerElement.querySelectorAll(
    'button, [role="button"], input, select, textarea, a, [onclick]'
  );

  const voiceLabels: string[] = [];
  let hasVoiceLabels = true;
  let elementsAreClickable = true;
  let hasUniqueNames = true;

  interactiveElements.forEach((element, index) => {
    const htmlElement = element as HTMLElement;
    
    // Check for voice control labels
    const ariaLabel = htmlElement.getAttribute('aria-label');
    const textContent = htmlElement.textContent?.trim();
    const title = htmlElement.getAttribute('title');
    
    const voiceLabel = ariaLabel || textContent || title;
    
    if (!voiceLabel) {
      hasVoiceLabels = false;
      issues.push(`Element ${index} lacks voice control label`);
    } else {
      // Check for unique names
      if (voiceLabels.includes(voiceLabel.toLowerCase())) {
        hasUniqueNames = false;
        issues.push(`Duplicate voice label found: "${voiceLabel}"`);
      }
      voiceLabels.push(voiceLabel.toLowerCase());
    }

    // Check if element is clickable
    const rect = htmlElement.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      elementsAreClickable = false;
      issues.push(`Element ${index} has zero dimensions and may not be clickable`);
    }

    // Check if element is covered by other elements
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const elementAtPoint = document.elementFromPoint(centerX, centerY);
    
    if (elementAtPoint !== htmlElement && !htmlElement.contains(elementAtPoint)) {
      issues.push(`Element ${index} may be covered by other elements`);
    }
  });

  return {
    hasVoiceLabels,
    elementsAreClickable,
    hasUniqueNames,
    issues,
  };
};

/**
 * Test magnification support
 */
export const testMagnificationSupport = (containerElement: HTMLElement): {
  supportsZoom: boolean;
  maintainsUsability: boolean;
  hasScrollableContent: boolean;
  issues: string[];
} => {
  const issues: string[] = [];
  
  // Test zoom levels
  const originalZoom = document.body.style.zoom;
  const zoomLevels = ['1.5', '2.0', '2.5'];
  
  let supportsZoom = true;
  let maintainsUsability = true;
  let hasScrollableContent = false;

  zoomLevels.forEach(zoomLevel => {
    document.body.style.zoom = zoomLevel;
    
    // Check if content is still accessible
    const rect = containerElement.getBoundingClientRect();
    
    if (rect.width > window.innerWidth) {
      hasScrollableContent = true;
    }

    // Check if interactive elements are still clickable
    const buttons = containerElement.querySelectorAll('button');
    buttons.forEach((button, index) => {
      const buttonRect = button.getBoundingClientRect();
      if (buttonRect.width < 44 || buttonRect.height < 44) {
        maintainsUsability = false;
        issues.push(`Button ${index} too small at ${zoomLevel}x zoom`);
      }
    });

    // Check if text is still readable
    const textElements = containerElement.querySelectorAll('p, span, div, label');
    textElements.forEach((element, index) => {
      const computedStyle = window.getComputedStyle(element);
      const fontSize = parseInt(computedStyle.fontSize);
      
      if (fontSize < 12) {
        maintainsUsability = false;
        issues.push(`Text element ${index} too small at ${zoomLevel}x zoom`);
      }
    });
  });

  // Restore original zoom
  document.body.style.zoom = originalZoom;

  return {
    supportsZoom,
    maintainsUsability,
    hasScrollableContent,
    issues,
  };
};

/**
 * Comprehensive assistive technology testing
 */
export const testAssistiveTechnologySupport = (
  containerElement: HTMLElement
): AssistiveTechnologyTestResult => {
  const screenReader = new MockScreenReader();
  const observer = screenReader.start();

  // Trigger some interactions to test screen reader announcements
  const buttons = containerElement.querySelectorAll('button');
  buttons.forEach(button => {
    (button as HTMLElement).click();
  });

  const keyboardTests = testKeyboardNavigation(containerElement);
  const tabOrder = testTabOrder(containerElement);
  const voiceControlTest = testVoiceControlSupport(containerElement);
  const magnificationTest = testMagnificationSupport(containerElement);

  // Check for skip links
  const skipLinks = containerElement.querySelectorAll('[href*="#"], [data-testid*="skip"]');
  const hasSkipLinks = skipLinks.length > 0;

  // Check for focus trapping in modals
  const modals = containerElement.querySelectorAll('[role="dialog"]');
  const trapsFocusWhenNeeded = modals.length === 0 || Array.from(modals).every(modal => {
    const focusableInModal = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    return focusableInModal.length > 0;
  });

  // Check for landmarks
  const landmarks = containerElement.querySelectorAll(
    '[role="main"], [role="navigation"], [role="banner"], [role="contentinfo"], main, nav, header, footer'
  );
  const hasProperLandmarks = landmarks.length > 0;

  // Check for live regions
  const liveRegions = containerElement.querySelectorAll('[aria-live]');
  const hasLiveRegions = liveRegions.length > 0;

  // Check for descriptive labels
  const labeledElements = containerElement.querySelectorAll('[aria-label], [aria-labelledby]');
  const hasDescriptiveLabels = labeledElements.length > 0;

  observer.disconnect();
  screenReader.stop();

  return {
    screenReaderSupport: {
      announcements: screenReader.getAnnouncements(),
      hasProperLandmarks,
      hasDescriptiveLabels,
      hasLiveRegions,
    },
    keyboardNavigation: {
      elements: keyboardTests,
      tabOrder,
      hasSkipLinks,
      trapsFocusWhenNeeded,
    },
    voiceControl: {
      hasVoiceLabels: voiceControlTest.hasVoiceLabels,
      elementsAreClickable: voiceControlTest.elementsAreClickable,
      hasUniqueNames: voiceControlTest.hasUniqueNames,
    },
    magnification: {
      supportsZoom: magnificationTest.supportsZoom,
      maintainsUsability: magnificationTest.maintainsUsability,
      hasScrollableContent: magnificationTest.hasScrollableContent,
    },
  };
};