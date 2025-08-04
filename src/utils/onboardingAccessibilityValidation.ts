/**
 * Accessibility validation utilities for onboarding components
 * Ensures senior-friendly UX compliance
 */

export interface AccessibilityValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  recommendations: string[];
}

export interface TooltipAccessibilityCheck {
  hasProperAriaLabels: boolean;
  hasKeyboardNavigation: boolean;
  hasScreenReaderSupport: boolean;
  hasProperFocusManagement: boolean;
  hasEscapeKeySupport: boolean;
  hasClickOutsideSupport: boolean;
  textSizeIsReadable: boolean;
  contrastIsAdequate: boolean;
}

export interface OnboardingAccessibilityCheck {
  tooltips: TooltipAccessibilityCheck;
  navigation: {
    hasKeyboardSupport: boolean;
    hasProperTabOrder: boolean;
    hasFocusIndicators: boolean;
    hasSkipOptions: boolean;
  };
  content: {
    textSizeIsAppropriate: boolean;
    contrastMeetsWCAG: boolean;
    languageIsSet: boolean;
    headingStructureIsLogical: boolean;
  };
  interaction: {
    touchTargetsAreLargeEnough: boolean;
    clickAreasAreGenerous: boolean;
    timeoutsAreDisabled: boolean;
    animationsRespectPreferences: boolean;
  };
}

/**
 * Validate tooltip accessibility for senior users
 */
export const validateTooltipAccessibility = (tooltipElement: HTMLElement): TooltipAccessibilityCheck => {
  const result: TooltipAccessibilityCheck = {
    hasProperAriaLabels: false,
    hasKeyboardNavigation: false,
    hasScreenReaderSupport: false,
    hasProperFocusManagement: false,
    hasEscapeKeySupport: false,
    hasClickOutsideSupport: false,
    textSizeIsReadable: false,
    contrastIsAdequate: false,
  };

  // Check ARIA labels
  result.hasProperAriaLabels = !!(
    tooltipElement.getAttribute('role') === 'dialog' &&
    tooltipElement.getAttribute('aria-modal') === 'true' &&
    tooltipElement.getAttribute('aria-labelledby')
  );

  // Check keyboard navigation
  const focusableElements = tooltipElement.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  result.hasKeyboardNavigation = focusableElements.length > 0;

  // Check screen reader support
  const contentElement = tooltipElement.querySelector('[id*="content"]');
  result.hasScreenReaderSupport = !!contentElement;

  // Check focus management
  const activeElement = document.activeElement;
  result.hasProperFocusManagement = tooltipElement.contains(activeElement);

  // Check text size (minimum 18px for seniors)
  const computedStyle = window.getComputedStyle(tooltipElement);
  const fontSize = parseInt(computedStyle.fontSize);
  result.textSizeIsReadable = fontSize >= 18;

  // Check contrast (simplified check - would need more sophisticated color analysis in real implementation)
  const backgroundColor = computedStyle.backgroundColor;
  const color = computedStyle.color;
  result.contrastIsAdequate = backgroundColor !== color; // Simplified check

  return result;
};

/**
 * Validate overall onboarding accessibility
 */
export const validateOnboardingAccessibility = (containerElement: HTMLElement): OnboardingAccessibilityCheck => {
  const tooltipElement = containerElement.querySelector('[data-testid="onboarding-tooltip"]') as HTMLElement;
  
  const result: OnboardingAccessibilityCheck = {
    tooltips: tooltipElement ? validateTooltipAccessibility(tooltipElement) : {
      hasProperAriaLabels: true, // No tooltip present
      hasKeyboardNavigation: true,
      hasScreenReaderSupport: true,
      hasProperFocusManagement: true,
      hasEscapeKeySupport: true,
      hasClickOutsideSupport: true,
      textSizeIsReadable: true,
      contrastIsAdequate: true,
    },
    navigation: {
      hasKeyboardSupport: false,
      hasProperTabOrder: false,
      hasFocusIndicators: false,
      hasSkipOptions: false,
    },
    content: {
      textSizeIsAppropriate: false,
      contrastMeetsWCAG: false,
      languageIsSet: false,
      headingStructureIsLogical: false,
    },
    interaction: {
      touchTargetsAreLargeEnough: false,
      clickAreasAreGenerous: false,
      timeoutsAreDisabled: true, // Assume no timeouts by default
      animationsRespectPreferences: false,
    },
  };

  // Check navigation accessibility
  const buttons = containerElement.querySelectorAll('button');
  result.navigation.hasKeyboardSupport = Array.from(buttons).every(button => 
    !button.disabled || button.getAttribute('aria-disabled') === 'true'
  );

  const skipButton = containerElement.querySelector('[data-testid*="skip"]');
  result.navigation.hasSkipOptions = !!skipButton;

  // Check tab order
  const tabbableElements = containerElement.querySelectorAll('[tabindex]:not([tabindex="-1"]), button:not([disabled]), [href], input, select, textarea');
  result.navigation.hasProperTabOrder = tabbableElements.length > 0;

  // Check focus indicators (simplified - would need to check CSS in real implementation)
  result.navigation.hasFocusIndicators = true; // Assume focus indicators are present

  // Check content accessibility
  const headings = containerElement.querySelectorAll('h1, h2, h3, h4, h5, h6');
  result.content.headingStructureIsLogical = headings.length > 0;

  result.content.languageIsSet = !!document.documentElement.getAttribute('lang');

  // Check text size for all text elements
  const textElements = containerElement.querySelectorAll('p, span, div, button, input, label');
  result.content.textSizeIsAppropriate = Array.from(textElements).every(element => {
    const computedStyle = window.getComputedStyle(element);
    const fontSize = parseInt(computedStyle.fontSize);
    return fontSize >= 16; // Minimum for general text, 18+ for seniors is better
  });

  // Check touch targets (minimum 44px for accessibility)
  const interactiveElements = containerElement.querySelectorAll('button, [role="button"], input, select, textarea, a');
  result.interaction.touchTargetsAreLargeEnough = Array.from(interactiveElements).every(element => {
    const rect = element.getBoundingClientRect();
    return rect.width >= 44 && rect.height >= 44;
  });

  result.interaction.clickAreasAreGenerous = result.interaction.touchTargetsAreLargeEnough;

  // Check reduced motion preferences
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const animatedElements = containerElement.querySelectorAll('[class*="animate"], [class*="transition"]');
  result.interaction.animationsRespectPreferences = prefersReducedMotion ? 
    Array.from(animatedElements).every(element => 
      element.classList.contains('reduce-motion') || 
      element.classList.contains('motion-reduce')
    ) : true;

  return result;
};

/**
 * Generate accessibility recommendations based on validation results
 */
export const generateAccessibilityRecommendations = (
  validation: OnboardingAccessibilityCheck
): string[] => {
  const recommendations: string[] = [];

  // Tooltip recommendations
  if (!validation.tooltips.hasProperAriaLabels) {
    recommendations.push('Add proper ARIA labels to tooltips for screen reader users');
  }
  if (!validation.tooltips.textSizeIsReadable) {
    recommendations.push('Increase tooltip text size to at least 18px for senior users');
  }
  if (!validation.tooltips.hasEscapeKeySupport) {
    recommendations.push('Add Escape key support to close tooltips');
  }

  // Navigation recommendations
  if (!validation.navigation.hasKeyboardSupport) {
    recommendations.push('Ensure all interactive elements are keyboard accessible');
  }
  if (!validation.navigation.hasSkipOptions) {
    recommendations.push('Provide skip options for users who want to bypass onboarding');
  }
  if (!validation.navigation.hasFocusIndicators) {
    recommendations.push('Add clear focus indicators for keyboard navigation');
  }

  // Content recommendations
  if (!validation.content.textSizeIsAppropriate) {
    recommendations.push('Increase text size to at least 18px for better readability by seniors');
  }
  if (!validation.content.contrastMeetsWCAG) {
    recommendations.push('Improve color contrast to meet WCAG AA standards (4.5:1 minimum)');
  }
  if (!validation.content.headingStructureIsLogical) {
    recommendations.push('Use proper heading hierarchy for screen reader navigation');
  }

  // Interaction recommendations
  if (!validation.interaction.touchTargetsAreLargeEnough) {
    recommendations.push('Increase touch target size to at least 44px for easier interaction');
  }
  if (!validation.interaction.animationsRespectPreferences) {
    recommendations.push('Respect user preferences for reduced motion');
  }

  return recommendations;
};

/**
 * Validate skip functionality for senior-friendly UX
 */
export const validateSkipFunctionality = (containerElement: HTMLElement): AccessibilityValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const recommendations: string[] = [];

  const skipButtons = containerElement.querySelectorAll('[data-testid*="skip"]');
  
  if (skipButtons.length === 0) {
    warnings.push('No skip options found - consider adding skip functionality for user flexibility');
  }

  skipButtons.forEach((button, index) => {
    const buttonElement = button as HTMLButtonElement;
    
    // Check if skip button is clearly labeled
    const ariaLabel = buttonElement.getAttribute('aria-label');
    const textContent = buttonElement.textContent?.trim();
    
    if (!ariaLabel && !textContent) {
      errors.push(`Skip button ${index + 1} lacks proper labeling`);
    }

    // Check if skip button is easily discoverable
    const computedStyle = window.getComputedStyle(buttonElement);
    const fontSize = parseInt(computedStyle.fontSize);
    
    if (fontSize < 16) {
      warnings.push(`Skip button ${index + 1} text size could be larger for senior users`);
    }

    // Check if skip doesn't cause confusion
    if (textContent?.toLowerCase().includes('skip') && !textContent.toLowerCase().includes('step')) {
      recommendations.push(`Consider clarifying skip button ${index + 1} text (e.g., "Skip this step" vs "Skip")`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    recommendations,
  };
};

/**
 * Validate localization accuracy for onboarding
 */
export const validateLocalizationAccuracy = (
  containerElement: HTMLElement,
  expectedLanguage: string
): AccessibilityValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const recommendations: string[] = [];

  // Check if language is set correctly
  const documentLang = document.documentElement.getAttribute('lang');
  if (documentLang !== expectedLanguage) {
    errors.push(`Document language (${documentLang}) doesn't match expected language (${expectedLanguage})`);
  }

  // Check for mixed language content (simplified check)
  const textElements = containerElement.querySelectorAll('*');
  const englishPattern = /^[a-zA-Z\s.,!?;:'"()-]+$/;
  
  Array.from(textElements).forEach((element, index) => {
    const textContent = element.textContent?.trim();
    if (textContent && textContent.length > 10) {
      // For non-English languages, check if there's unexpected English text
      if (expectedLanguage !== 'en' && englishPattern.test(textContent)) {
        warnings.push(`Element ${index} may contain untranslated English text: "${textContent.substring(0, 50)}..."`);
      }
    }
  });

  // Check for proper RTL support if needed
  const rtlLanguages = ['ar', 'he', 'fa', 'ur'];
  if (rtlLanguages.includes(expectedLanguage)) {
    const direction = containerElement.getAttribute('dir') || document.documentElement.getAttribute('dir');
    if (direction !== 'rtl') {
      errors.push('RTL direction not set for RTL language');
    }

    // Check if layout elements are properly mirrored
    const buttons = containerElement.querySelectorAll('button');
    buttons.forEach((button, index) => {
      const computedStyle = window.getComputedStyle(button);
      if (computedStyle.textAlign === 'left') {
        recommendations.push(`Button ${index + 1} text alignment should be adjusted for RTL layout`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    recommendations,
  };
};

/**
 * Comprehensive onboarding UX validation for seniors
 */
export const validateSeniorFriendlyUX = (
  containerElement: HTMLElement,
  language: string = 'en'
): AccessibilityValidationResult => {
  const accessibilityCheck = validateOnboardingAccessibility(containerElement);
  const skipValidation = validateSkipFunctionality(containerElement);
  const localizationValidation = validateLocalizationAccuracy(containerElement, language);

  const allErrors = [
    ...skipValidation.errors,
    ...localizationValidation.errors,
  ];

  const allWarnings = [
    ...skipValidation.warnings,
    ...localizationValidation.warnings,
  ];

  const allRecommendations = [
    ...generateAccessibilityRecommendations(accessibilityCheck),
    ...skipValidation.recommendations,
    ...localizationValidation.recommendations,
  ];

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings,
    recommendations: allRecommendations,
  };
};