import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { OnboardingTooltip } from '../OnboardingTooltip';
import { AccessibilityProvider } from '../../../contexts/AccessibilityContext';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'onboarding.tooltip.helpfulTip': 'Helpful Tip',
        'onboarding.accessibility.closeTooltip': 'Close tooltip',
        'onboarding.accessibility.skipTooltip': 'Skip this tip',
        'onboarding.accessibility.continueFromTooltip': 'Continue from tooltip',
        'onboarding.buttons.skip': 'Skip',
        'onboarding.buttons.gotIt': 'Got it!',
      };
      return translations[key] || key;
    }
  })
}));

const MockProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AccessibilityProvider>
    {children}
  </AccessibilityProvider>
);

describe('OnboardingTooltip', () => {
  const mockOnClose = vi.fn();
  const mockOnNext = vi.fn();
  const mockOnSkip = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock getBoundingClientRect for target element positioning
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

  it('renders tooltip when visible', () => {
    render(
      <MockProvider>
        <OnboardingTooltip
          content="This is a helpful tip"
          position="bottom"
          visible={true}
          onClose={mockOnClose}
          onNext={mockOnNext}
        />
      </MockProvider>
    );

    expect(screen.getByTestId('onboarding-tooltip')).toBeInTheDocument();
    expect(screen.getByText('This is a helpful tip')).toBeInTheDocument();
    expect(screen.getByText('Helpful Tip')).toBeInTheDocument();
  });

  it('does not render when not visible', () => {
    render(
      <MockProvider>
        <OnboardingTooltip
          content="This is a helpful tip"
          position="bottom"
          visible={false}
          onClose={mockOnClose}
          onNext={mockOnNext}
        />
      </MockProvider>
    );

    expect(screen.queryByTestId('onboarding-tooltip')).not.toBeInTheDocument();
  });

  it('shows close button when onClose is provided', () => {
    render(
      <MockProvider>
        <OnboardingTooltip
          content="This is a helpful tip"
          position="bottom"
          visible={true}
          onClose={mockOnClose}
          onNext={mockOnNext}
        />
      </MockProvider>
    );

    expect(screen.getByTestId('close-tooltip')).toBeInTheDocument();
  });

  it('shows skip button when showSkip is true and onSkip is provided', () => {
    render(
      <MockProvider>
        <OnboardingTooltip
          content="This is a helpful tip"
          position="bottom"
          visible={true}
          onClose={mockOnClose}
          onNext={mockOnNext}
          onSkip={mockOnSkip}
          showSkip={true}
        />
      </MockProvider>
    );

    expect(screen.getByTestId('skip-tooltip')).toBeInTheDocument();
  });

  it('shows next button when onNext is provided', () => {
    render(
      <MockProvider>
        <OnboardingTooltip
          content="This is a helpful tip"
          position="bottom"
          visible={true}
          onClose={mockOnClose}
          onNext={mockOnNext}
        />
      </MockProvider>
    );

    expect(screen.getByTestId('next-from-tooltip')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    render(
      <MockProvider>
        <OnboardingTooltip
          content="This is a helpful tip"
          position="bottom"
          visible={true}
          onClose={mockOnClose}
          onNext={mockOnNext}
        />
      </MockProvider>
    );

    fireEvent.click(screen.getByTestId('close-tooltip'));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('calls onNext when next button is clicked', () => {
    render(
      <MockProvider>
        <OnboardingTooltip
          content="This is a helpful tip"
          position="bottom"
          visible={true}
          onClose={mockOnClose}
          onNext={mockOnNext}
        />
      </MockProvider>
    );

    fireEvent.click(screen.getByTestId('next-from-tooltip'));
    expect(mockOnNext).toHaveBeenCalled();
  });

  it('calls onSkip when skip button is clicked', () => {
    render(
      <MockProvider>
        <OnboardingTooltip
          content="This is a helpful tip"
          position="bottom"
          visible={true}
          onClose={mockOnClose}
          onNext={mockOnNext}
          onSkip={mockOnSkip}
          showSkip={true}
        />
      </MockProvider>
    );

    fireEvent.click(screen.getByTestId('skip-tooltip'));
    expect(mockOnSkip).toHaveBeenCalled();
  });

  it('calls onClose when backdrop is clicked', () => {
    render(
      <MockProvider>
        <OnboardingTooltip
          content="This is a helpful tip"
          position="bottom"
          visible={true}
          onClose={mockOnClose}
          onNext={mockOnNext}
        />
      </MockProvider>
    );

    const backdrop = document.querySelector('.fixed.inset-0.bg-black.bg-opacity-50');
    expect(backdrop).toBeInTheDocument();
    
    fireEvent.click(backdrop!);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('handles escape key to close tooltip', () => {
    render(
      <MockProvider>
        <OnboardingTooltip
          content="This is a helpful tip"
          position="bottom"
          visible={true}
          onClose={mockOnClose}
          onNext={mockOnNext}
        />
      </MockProvider>
    );

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('positions tooltip correctly based on target element', () => {
    // Create a mock target element
    const targetElement = document.createElement('div');
    targetElement.id = 'test-target';
    document.body.appendChild(targetElement);

    render(
      <MockProvider>
        <OnboardingTooltip
          content="This is a helpful tip"
          position="bottom"
          targetElement="#test-target"
          visible={true}
          onClose={mockOnClose}
          onNext={mockOnNext}
        />
      </MockProvider>
    );

    const tooltip = screen.getByTestId('onboarding-tooltip');
    expect(tooltip).toBeInTheDocument();
    
    // Cleanup
    document.body.removeChild(targetElement);
  });

  it('supports all position options', () => {
    const positions: Array<'top' | 'bottom' | 'left' | 'right'> = ['top', 'bottom', 'left', 'right'];
    
    positions.forEach(position => {
      const { unmount } = render(
        <MockProvider>
          <OnboardingTooltip
            content="This is a helpful tip"
            position={position}
            visible={true}
            onClose={mockOnClose}
            onNext={mockOnNext}
          />
        </MockProvider>
      );

      expect(screen.getByTestId('onboarding-tooltip')).toBeInTheDocument();
      unmount();
    });
  });
});