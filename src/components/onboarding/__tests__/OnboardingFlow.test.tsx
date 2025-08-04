import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { OnboardingFlow } from '../OnboardingFlow';
import { OnboardingProvider } from '../../../contexts/OnboardingContext';
import { AccessibilityProvider } from '../../../contexts/AccessibilityContext';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => {
      const translations: Record<string, string> = {
        'onboarding.flow.title': 'Welcome! Let\'s Get Started',
        'onboarding.buttons.skipAll': 'Skip All',
        'onboarding.buttons.cancel': 'Cancel',
        'onboarding.accessibility.stepChanged': 'Now on step {{step}} of {{total}}: {{title}}',
        'onboarding.accessibility.skippingOnboarding': 'Skipping entire onboarding process',
        'onboarding.accessibility.cancellingOnboarding': 'Cancelling onboarding process',
      };
      return options ? key.replace(/\{\{(\w+)\}\}/g, (match: string, prop: string) => options[prop] || match) : translations[key] || key;
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

// Mock step component
const MockStepComponent: React.FC<{ data: any; updateData: (data: any) => void }> = ({ data, updateData }) => (
  <div data-testid="mock-step">
    <input
      data-testid="mock-input"
      value={data.testValue || ''}
      onChange={(e) => updateData({ testValue: e.target.value })}
    />
  </div>
);

const mockSteps = [
  {
    id: 'step1',
    title: 'Step 1',
    description: 'First step',
    tooltip: { content: 'Help for step 1', position: 'bottom' as const, size: 'large' as const },
    optional: false,
    component: MockStepComponent,
    validation: (data: any) => ({
      stepIndex: 0,
      isValid: !!data.testValue,
      errors: data.testValue ? [] : ['Test value required'],
      warnings: [],
    }),
  },
  {
    id: 'step2',
    title: 'Step 2',
    description: 'Second step',
    tooltip: { content: 'Help for step 2', position: 'bottom' as const, size: 'large' as const },
    optional: true,
    component: MockStepComponent,
  },
];

describe('OnboardingFlow', () => {
  const mockOnComplete = vi.fn();
  const mockOnSkip = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders onboarding flow with progress indicator', () => {
    render(
      <MockProviders>
        <OnboardingFlow
          steps={mockSteps}
          onComplete={mockOnComplete}
          onSkip={mockOnSkip}
          onCancel={mockOnCancel}
        />
      </MockProviders>
    );

    expect(screen.getByText('Welcome! Let\'s Get Started')).toBeInTheDocument();
    expect(screen.getByTestId('onboarding-progress')).toBeInTheDocument();
    expect(screen.getByTestId('onboarding-step')).toBeInTheDocument();
  });

  it('shows skip all button when enabled', () => {
    render(
      <MockProviders>
        <OnboardingFlow
          steps={mockSteps}
          onComplete={mockOnComplete}
          onSkip={mockOnSkip}
          showSkipAll={true}
        />
      </MockProviders>
    );

    expect(screen.getByTestId('skip-all-button')).toBeInTheDocument();
  });

  it('shows cancel button when onCancel is provided', () => {
    render(
      <MockProviders>
        <OnboardingFlow
          steps={mockSteps}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      </MockProviders>
    );

    expect(screen.getByTestId('cancel-button')).toBeInTheDocument();
  });

  it('navigates between steps correctly', async () => {
    render(
      <MockProviders>
        <OnboardingFlow
          steps={mockSteps}
          onComplete={mockOnComplete}
        />
      </MockProviders>
    );

    // Fill in required field for step 1
    const input = screen.getByTestId('mock-input');
    fireEvent.change(input, { target: { value: 'test value' } });

    // Click next to go to step 2
    const nextButton = screen.getByTestId('next-button');
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText('Step 2')).toBeInTheDocument();
    });

    // Go back to step 1
    const previousButton = screen.getByTestId('previous-button');
    fireEvent.click(previousButton);

    await waitFor(() => {
      expect(screen.getByText('Step 1')).toBeInTheDocument();
    });
  });

  it('validates steps before allowing progression', () => {
    render(
      <MockProviders>
        <OnboardingFlow
          steps={mockSteps}
          onComplete={mockOnComplete}
        />
      </MockProviders>
    );

    const nextButton = screen.getByTestId('next-button');
    
    // Next button should be disabled when validation fails
    expect(nextButton).toBeDisabled();

    // Fill in required field
    const input = screen.getByTestId('mock-input');
    fireEvent.change(input, { target: { value: 'test value' } });

    // Next button should now be enabled
    expect(nextButton).not.toBeDisabled();
  });

  it('allows skipping optional steps', async () => {
    render(
      <MockProviders>
        <OnboardingFlow
          steps={mockSteps}
          onComplete={mockOnComplete}
        />
      </MockProviders>
    );

    // Fill in required field and go to step 2
    const input = screen.getByTestId('mock-input');
    fireEvent.change(input, { target: { value: 'test value' } });
    
    const nextButton = screen.getByTestId('next-button');
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText('Step 2')).toBeInTheDocument();
    });

    // Step 2 is optional, so skip button should be available
    const skipButton = screen.getByTestId('skip-button');
    expect(skipButton).toBeInTheDocument();
    
    fireEvent.click(skipButton);

    await waitFor(() => {
      expect(mockOnComplete).toHaveBeenCalled();
    });
  });

  it('calls onComplete when reaching the end', async () => {
    render(
      <MockProviders>
        <OnboardingFlow
          steps={mockSteps}
          onComplete={mockOnComplete}
        />
      </MockProviders>
    );

    // Complete step 1
    const input = screen.getByTestId('mock-input');
    fireEvent.change(input, { target: { value: 'test value' } });
    
    let nextButton = screen.getByTestId('next-button');
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText('Step 2')).toBeInTheDocument();
    });

    // Complete step 2 (final step)
    nextButton = screen.getByTestId('next-button');
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(mockOnComplete).toHaveBeenCalled();
    });
  });

  it('provides keyboard navigation instructions', () => {
    render(
      <MockProviders>
        <OnboardingFlow
          steps={mockSteps}
          onComplete={mockOnComplete}
        />
      </MockProviders>
    );

    expect(screen.getByTestId('keyboard-instructions')).toBeInTheDocument();
  });
});