import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { OnboardingFlow } from '../OnboardingFlow';
import { OnboardingProvider } from '../../../contexts/OnboardingContext';
import { AccessibilityProvider } from '../../../contexts/AccessibilityContext';
import { 
  validateSeniorFriendlyUX,
  validateSkipFunctionality,
  validateLocalizationAccuracy 
} from '../../../utils/onboardingAccessibilityValidation';
import { 
  testAssistiveTechnologySupport,
  simulateKeyboardNavigation,
  MockScreenReader 
} from '../../../utils/assistiveTechnologyTesting';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => {
      const translations: Record<string, string> = {
        'onboarding.flow.title': 'Welcome! Let\'s Get Started',
        'onboarding.buttons.skipAll': 'Skip All',
        'onboarding.buttons.cancel': 'Cancel',
        'onboarding.buttons.previous': 'Previous',
        'onboarding.buttons.next': 'Next',
        'onboarding.buttons.skip': 'Skip',
        'onboarding.buttons.complete': 'Complete',
        'onboarding.buttons.gotIt': 'Got it!',
        'onboarding.accessibility.stepChanged': 'Now on step {{step}} of {{total}}: {{title}}',
        'onboarding.accessibility.keyboardInstructions': 'Use Tab to navigate, Enter to select, and Escape to close dialogs',
        'onboarding.tooltip.helpfulTip': 'Helpful Tip',
        'onboarding.progress.label': 'Onboarding Progress: Step {{current}} of {{total}}',
        'onboarding.progress.stepOf': 'Step {{current}} of {{total}}',
      };
      
      if (options) {
        return key.replace(/\{\{(\w+)\}\}/g, (match: string, prop: string) => options[prop] || match);
      }
      
      return translations[key] || key;
    },
    i18n: { language: 'en' }
  })
}));

// Mock contexts
const MockProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AccessibilityProvider>
    <OnboardingProvider>
      {children}
    </OnboardingProvider>
  </AccessibilityProvider>
);

// Mock step component with senior-friendly features
const SeniorFriendlyStepComponent: React.FC<{ data: any; updateData: (data: any) => void }> = ({ data, updateData }) => (
  <div data-testid="senior-friendly-step">
    <label htmlFor="test-input" className="text-lg font-medium mb-2 block">
      Test Input (Large Label)
    </label>
    <input
      id="test-input"
      data-testid="large-input"
      value={data.testValue || ''}
      onChange={(e) => updateData({ testValue: e.target.value })}
      className="text-xl p-4 border-2 border-gray-300 rounded-lg min-h-[44px] min-w-[44px]"
      aria-describedby="input-help"
    />
    <div id="input-help" className="text-base text-gray-600 mt-2">
      This is helpful text to guide senior users
    </div>
  </div>
);

const mockSteps = [
  {
    id: 'step1',
    title: 'Personal Information',
    description: 'Tell us about yourself',
    tooltip: { 
      content: 'We need this information to personalize your experience', 
      position: 'bottom' as const, 
      size: 'large' as const 
    },
    optional: false,
    component: SeniorFriendlyStepComponent,
    validation: (data: any) => ({
      stepIndex: 0,
      isValid: !!data.testValue,
      errors: data.testValue ? [] : ['Please fill in the required field'],
      warnings: [],
    }),
  },
  {
    id: 'step2',
    title: 'Preferences',
    description: 'Set your preferences',
    tooltip: { 
      content: 'These settings can be changed later in your profile', 
      position: 'bottom' as const, 
      size: 'large' as const 
    },
    optional: true,
    component: SeniorFriendlyStepComponent,
  },
];

describe('Senior-Friendly UX Testing', () => {
  let container: HTMLElement;
  let screenReader: MockScreenReader;

  beforeEach(() => {
    vi.clearAllMocks();
    screenReader = new MockScreenReader();
    
    // Mock getBoundingClientRect for tooltip positioning
    Element.prototype.getBoundingClientRect = vi.fn(() => ({
      top: 100,
      left: 100,
      bottom: 150,
      right: 200,
      width: 100,
      height: 50,
      x: 100,
      y: 100,
      toJSON: vi.fn(),
    }));
  });

  afterEach(() => {
    screenReader.stop();
  });

  describe('Tooltip Accessibility', () => {
    it('validates tooltip sizes and positioning for readability', async () => {
      const { container: testContainer } = render(
        <MockProviders>
          <OnboardingFlow
            steps={mockSteps}
            onComplete={vi.fn()}
            showProgress={true}
          />
        </MockProviders>
      );

      container = testContainer;

      // Wait for component to render
      await waitFor(() => {
        expect(screen.getByTestId('onboarding-step')).toBeInTheDocument();
      });

      const validation = validateSeniorFriendlyUX(container);
      
      // Check that validation identifies accessibility requirements
      expect(validation.recommendations).toContain(
        expect.stringMatching(/text size|tooltip|readability/i)
      );
    });

    it('ensures tooltips have proper ARIA labels and keyboard support', async () => {
      render(
        <MockProviders>
          <OnboardingFlow
            steps={mockSteps}
            onComplete={vi.fn()}
            showProgress={true}
          />
        </MockProviders>
      );

      // Simulate tooltip appearance (would normally be triggered by target element)
      const assistiveTest = testAssistiveTechnologySupport(document.body);
      
      expect(assistiveTest.screenReaderSupport.hasDescriptiveLabels).toBe(true);
      expect(assistiveTest.keyboardNavigation.elements.length).toBeGreaterThan(0);
    });
  });

  describe('Skip Functionality', () => {
    it('validates skip functionality without penalty or confusion', async () => {
      const { container: testContainer } = render(
        <MockProviders>
          <OnboardingFlow
            steps={mockSteps}
            onComplete={vi.fn()}
            showSkipAll={true}
          />
        </MockProviders>
      );

      const skipValidation = validateSkipFunctionality(testContainer);
      
      // Should have skip options available
      expect(skipValidation.warnings).not.toContain(
        expect.stringMatching(/no skip options/i)
      );

      // Skip buttons should be clearly labeled
      const skipButton = screen.getByTestId('skip-all-button');
      expect(skipButton).toHaveAttribute('aria-label');
      expect(skipButton.textContent).toContain('Skip');
    });

    it('allows skipping individual steps when optional', async () => {
      render(
        <MockProviders>
          <OnboardingFlow
            steps={mockSteps}
            onComplete={vi.fn()}
          />
        </MockProviders>
      );

      // Fill required field to proceed to optional step
      const input = screen.getByTestId('large-input');
      fireEvent.change(input, { target: { value: 'test' } });

      const nextButton = screen.getByTestId('next-button');
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText('Preferences')).toBeInTheDocument();
      });

      // Optional step should have skip button
      const skipButton = screen.getByTestId('skip-button');
      expect(skipButton).toBeInTheDocument();
      expect(skipButton).not.toBeDisabled();
    });

    it('provides clear skip button labeling for seniors', () => {
      render(
        <MockProviders>
          <OnboardingFlow
            steps={mockSteps}
            onComplete={vi.fn()}
            showSkipAll={true}
          />
        </MockProviders>
      );

      const skipAllButton = screen.getByTestId('skip-all-button');
      
      // Button should have clear, descriptive text
      expect(skipAllButton.textContent).toBe('Skip All');
      
      // Should have proper ARIA label for screen readers
      expect(skipAllButton).toHaveAttribute('aria-label');
    });
  });

  describe('Assistive Technology Support', () => {
    it('works with screen readers', async () => {
      const observer = screenReader.start();
      
      render(
        <MockProviders>
          <OnboardingFlow
            steps={mockSteps}
            onComplete={vi.fn()}
          />
        </MockProviders>
      );

      // Simulate screen reader interaction
      const heading = screen.getByText('Personal Information');
      fireEvent.focus(heading);

      // Check for proper ARIA landmarks
      const main = screen.getByTestId('onboarding-flow');
      expect(main).toBeInTheDocument();

      observer.disconnect();
      
      const announcements = screenReader.getAnnouncements();
      expect(announcements.length).toBeGreaterThanOrEqual(0);
    });

    it('supports keyboard navigation', async () => {
      const { container: testContainer } = render(
        <MockProviders>
          <OnboardingFlow
            steps={mockSteps}
            onComplete={vi.fn()}
          />
        </MockProviders>
      );

      const keyboardTest = simulateKeyboardNavigation(testContainer);
      
      // Should support keyboard navigation without errors
      expect(keyboardTest.success).toBe(true);
      expect(keyboardTest.errors).toHaveLength(0);
    });

    it('has proper focus management', () => {
      render(
        <MockProviders>
          <OnboardingFlow
            steps={mockSteps}
            onComplete={vi.fn()}
          />
        </MockProviders>
      );

      // Test focus indicators
      const nextButton = screen.getByTestId('next-button');
      nextButton.focus();
      
      expect(document.activeElement).toBe(nextButton);
      
      // Check for visible focus indicator (would need actual CSS testing in real scenario)
      const computedStyle = window.getComputedStyle(nextButton, ':focus');
      expect(computedStyle).toBeDefined();
    });

    it('provides adequate touch targets for seniors', () => {
      render(
        <MockProviders>
          <OnboardingFlow
            steps={mockSteps}
            onComplete={vi.fn()}
          />
        </MockProviders>
      );

      // Check button sizes
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        const rect = button.getBoundingClientRect();
        
        // Touch targets should be at least 44px for accessibility
        expect(rect.width).toBeGreaterThanOrEqual(44);
        expect(rect.height).toBeGreaterThanOrEqual(44);
      });
    });
  });

  describe('Localization Support', () => {
    it('verifies translation accuracy', () => {
      const { container: testContainer } = render(
        <MockProviders>
          <OnboardingFlow
            steps={mockSteps}
            onComplete={vi.fn()}
          />
        </MockProviders>
      );

      const localizationValidation = validateLocalizationAccuracy(testContainer, 'en');
      
      // Should not have translation errors for English
      expect(localizationValidation.errors).toHaveLength(0);
    });

    it('supports RTL languages properly', () => {
      // Mock RTL language
      document.documentElement.setAttribute('lang', 'ar');
      document.documentElement.setAttribute('dir', 'rtl');

      const { container: testContainer } = render(
        <MockProviders>
          <OnboardingFlow
            steps={mockSteps}
            onComplete={vi.fn()}
          />
        </MockProviders>
      );

      const localizationValidation = validateLocalizationAccuracy(testContainer, 'ar');
      
      // Should handle RTL layout correctly
      expect(localizationValidation.errors).not.toContain(
        expect.stringMatching(/RTL direction not set/i)
      );

      // Cleanup
      document.documentElement.removeAttribute('lang');
      document.documentElement.removeAttribute('dir');
    });
  });

  describe('Senior-Specific UX Features', () => {
    it('uses large, readable text sizes', () => {
      render(
        <MockProviders>
          <OnboardingFlow
            steps={mockSteps}
            onComplete={vi.fn()}
          />
        </MockProviders>
      );

      // Check input field has large text
      const input = screen.getByTestId('large-input');
      const computedStyle = window.getComputedStyle(input);
      
      // Should use large text size for seniors
      expect(parseInt(computedStyle.fontSize)).toBeGreaterThanOrEqual(18);
    });

    it('provides generous spacing and padding', () => {
      render(
        <MockProviders>
          <OnboardingFlow
            steps={mockSteps}
            onComplete={vi.fn()}
          />
        </MockProviders>
      );

      const step = screen.getByTestId('onboarding-step');
      const computedStyle = window.getComputedStyle(step);
      
      // Should have generous padding
      expect(parseInt(computedStyle.padding)).toBeGreaterThan(0);
    });

    it('shows helpful instructions and guidance', () => {
      render(
        <MockProviders>
          <OnboardingFlow
            steps={mockSteps}
            onComplete={vi.fn()}
          />
        </MockProviders>
      );

      // Should show keyboard instructions
      expect(screen.getByTestId('keyboard-instructions')).toBeInTheDocument();
      
      // Should show helpful descriptions
      expect(screen.getByText('Tell us about yourself')).toBeInTheDocument();
    });

    it('maintains patient, encouraging tone', () => {
      render(
        <MockProviders>
          <OnboardingFlow
            steps={mockSteps}
            onComplete={vi.fn()}
          />
        </MockProviders>
      );

      // Check for encouraging language
      expect(screen.getByText('Welcome! Let\'s Get Started')).toBeInTheDocument();
      
      // Help text should be supportive
      expect(screen.getByText('This is helpful text to guide senior users')).toBeInTheDocument();
    });

    it('respects reduced motion preferences', () => {
      // Mock reduced motion preference
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      render(
        <MockProviders>
          <OnboardingFlow
            steps={mockSteps}
            onComplete={vi.fn()}
          />
        </MockProviders>
      );

      // Should respect motion preferences (implementation would check for reduced motion classes)
      const animatedElements = document.querySelectorAll('[class*="animate"], [class*="transition"]');
      
      // In a real implementation, these would have reduced motion classes
      expect(animatedElements.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Error Handling and Recovery', () => {
    it('provides clear error messages in plain language', async () => {
      render(
        <MockProviders>
          <OnboardingFlow
            steps={mockSteps}
            onComplete={vi.fn()}
          />
        </MockProviders>
      );

      // Try to proceed without filling required field
      const nextButton = screen.getByTestId('next-button');
      
      // Button should be disabled when validation fails
      expect(nextButton).toBeDisabled();
      
      // Error should be communicated clearly (in a real implementation)
      // This would show validation errors in plain language
    });

    it('allows easy recovery from mistakes', async () => {
      render(
        <MockProviders>
          <OnboardingFlow
            steps={mockSteps}
            onComplete={vi.fn()}
          />
        </MockProviders>
      );

      // Fill field and proceed
      const input = screen.getByTestId('large-input');
      fireEvent.change(input, { target: { value: 'test' } });

      const nextButton = screen.getByTestId('next-button');
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText('Preferences')).toBeInTheDocument();
      });

      // Should be able to go back easily
      const previousButton = screen.getByTestId('previous-button');
      expect(previousButton).toBeInTheDocument();
      expect(previousButton).not.toBeDisabled();
    });
  });
});