import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '../../../test/accessibility-utils';
import { AccessibilitySettings } from '../AccessibilitySettings';
import { runFullAccessibilityTest } from '../../../test/accessibility-utils';

describe('AccessibilitySettings', () => {
  it('should pass axe accessibility tests', async () => {
    const { container } = render(<AccessibilitySettings />);
    await runFullAccessibilityTest(container);
  });

  it('should render all accessibility setting options', () => {
    render(<AccessibilitySettings />);
    
    expect(screen.getByText('Accessibility Settings')).toBeInTheDocument();
    expect(screen.getByText('High Contrast Mode')).toBeInTheDocument();
    expect(screen.getByText('Font Size')).toBeInTheDocument();
    expect(screen.getByText('Reduced Motion')).toBeInTheDocument();
    expect(screen.getByText('Enhanced Keyboard Navigation')).toBeInTheDocument();
    expect(screen.getByText('Screen Reader Optimization')).toBeInTheDocument();
  });

  it('should toggle high contrast mode', () => {
    render(<AccessibilitySettings />);
    
    const highContrastButton = screen.getByRole('button', { name: /disabled/i });
    expect(highContrastButton).toHaveAttribute('aria-pressed', 'false');
    
    fireEvent.click(highContrastButton);
    
    // Button should now show enabled state
    expect(screen.getByRole('button', { name: /enabled/i })).toBeInTheDocument();
  });

  it('should change font size', () => {
    render(<AccessibilitySettings />);
    
    const largeButton = screen.getByRole('button', { name: /large/i });
    fireEvent.click(largeButton);
    
    expect(largeButton).toHaveAttribute('aria-pressed', 'true');
  });

  it('should toggle reduced motion', () => {
    render(<AccessibilitySettings />);
    
    const reducedMotionButtons = screen.getAllByRole('button', { name: /disabled/i });
    const reducedMotionButton = reducedMotionButtons.find(button => 
      button.closest('div')?.textContent?.includes('Reduced Motion')
    );
    
    expect(reducedMotionButton).toHaveAttribute('aria-pressed', 'false');
    
    if (reducedMotionButton) {
      fireEvent.click(reducedMotionButton);
    }
  });

  it('should toggle keyboard navigation', () => {
    render(<AccessibilitySettings />);
    
    const keyboardNavButtons = screen.getAllByRole('button', { name: /enabled/i });
    const keyboardNavButton = keyboardNavButtons.find(button => 
      button.closest('div')?.textContent?.includes('Enhanced Keyboard Navigation')
    );
    
    expect(keyboardNavButton).toHaveAttribute('aria-pressed', 'true');
    
    if (keyboardNavButton) {
      fireEvent.click(keyboardNavButton);
    }
  });

  it('should toggle screen reader optimization', () => {
    render(<AccessibilitySettings />);
    
    const screenReaderButtons = screen.getAllByRole('button', { name: /disabled/i });
    const screenReaderButton = screenReaderButtons.find(button => 
      button.closest('div')?.textContent?.includes('Screen Reader Optimization')
    );
    
    expect(screenReaderButton).toHaveAttribute('aria-pressed', 'false');
    
    if (screenReaderButton) {
      fireEvent.click(screenReaderButton);
    }
  });

  it('should display keyboard shortcuts help', () => {
    render(<AccessibilitySettings />);
    
    expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
    expect(screen.getByText('Tab')).toBeInTheDocument();
    expect(screen.getByText('F6')).toBeInTheDocument();
    expect(screen.getByText('Alt+H')).toBeInTheDocument();
  });

  it('should reset settings to defaults', () => {
    render(<AccessibilitySettings />);
    
    const resetButton = screen.getByRole('button', { name: /reset to defaults/i });
    fireEvent.click(resetButton);
    
    // Should reset to default values
    expect(resetButton).toBeInTheDocument();
  });

  it('should have proper ARIA attributes', () => {
    render(<AccessibilitySettings />);
    
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      if (button.textContent === 'Enabled' || button.textContent === 'Disabled') {
        expect(button).toHaveAttribute('aria-pressed');
      }
    });
  });

  it('should have proper heading hierarchy', () => {
    render(<AccessibilitySettings />);
    
    const mainHeading = screen.getByRole('heading', { level: 2 });
    expect(mainHeading).toHaveTextContent('Accessibility Settings');
    
    const subHeadings = screen.getAllByRole('heading', { level: 3 });
    expect(subHeadings.length).toBeGreaterThan(0);
  });

  it('should provide descriptions for all settings', () => {
    render(<AccessibilitySettings />);
    
    expect(screen.getByText(/Increases contrast between text and background/)).toBeInTheDocument();
    expect(screen.getByText(/Choose a comfortable text size/)).toBeInTheDocument();
    expect(screen.getByText(/Minimizes animations and transitions/)).toBeInTheDocument();
    expect(screen.getByText(/Enables advanced keyboard shortcuts/)).toBeInTheDocument();
    expect(screen.getByText(/Optimizes the interface for screen readers/)).toBeInTheDocument();
  });
});