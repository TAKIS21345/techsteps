import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '../../../test/accessibility-utils';
import { Button } from '../Button';
import { runFullAccessibilityTest } from '../../../test/accessibility-utils';

describe('Button Accessibility', () => {
  it('should pass axe accessibility tests', async () => {
    const { container } = render(<Button>Test Button</Button>);
    await runFullAccessibilityTest(container);
  });

  it('should have proper ARIA attributes', () => {
    render(
      <Button aria-label="Custom button label" aria-describedby="button-description">
        Click me
      </Button>
    );
    
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Custom button label');
    expect(button).toHaveAttribute('aria-describedby', 'button-description');
  });

  it('should be keyboard accessible', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Keyboard Test</Button>);
    
    const button = screen.getByRole('button');
    
    // Test Enter key
    fireEvent.keyDown(button, { key: 'Enter' });
    expect(handleClick).toHaveBeenCalledTimes(1);
    
    // Test Space key
    fireEvent.keyDown(button, { key: ' ' });
    expect(handleClick).toHaveBeenCalledTimes(2);
  });

  it('should have minimum touch target size', () => {
    const { container } = render(<Button size="sm">Small Button</Button>);
    const button = container.querySelector('button');
    
    expect(button).toHaveClass('min-h-touch');
    expect(button).toHaveClass('touch-target');
  });

  it('should have proper focus indicators', () => {
    render(<Button>Focus Test</Button>);
    const button = screen.getByRole('button');
    
    expect(button).toHaveClass('focus-senior');
    
    // Focus the button
    button.focus();
    expect(button).toHaveFocus();
  });

  it('should handle disabled state properly', () => {
    render(<Button disabled>Disabled Button</Button>);
    const button = screen.getByRole('button');
    
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-disabled', 'true');
  });

  it('should handle loading state with proper ARIA', () => {
    render(<Button loading>Loading Button</Button>);
    const button = screen.getByRole('button');
    
    expect(button).toBeDisabled();
    expect(screen.getByRole('status')).toBeInTheDocument(); // Loading spinner
  });

  it('should work with different variants', async () => {
    const variants = ['primary', 'secondary', 'outline', 'ghost', 'danger'] as const;
    
    for (const variant of variants) {
      const { container } = render(<Button variant={variant}>{variant} Button</Button>);
      await runFullAccessibilityTest(container);
    }
  });

  it('should work with different sizes', async () => {
    const sizes = ['sm', 'md', 'lg', 'xl'] as const;
    
    for (const size of sizes) {
      const { container } = render(<Button size={size}>{size} Button</Button>);
      await runFullAccessibilityTest(container);
    }
  });

  it('should have proper color contrast', () => {
    const { container } = render(<Button variant="primary">Primary Button</Button>);
    const button = container.querySelector('button');
    
    // Test that button has proper styling classes for contrast
    expect(button).toHaveClass('bg-primary-500');
    expect(button).toHaveClass('text-white');
  });

  it('should respect reduced motion preferences', () => {
    // Mock reduced motion preference
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: (query: string) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => {},
      }),
    });

    const { container } = render(<Button>Motion Test</Button>);
    const button = container.querySelector('button');
    
    expect(button).toHaveClass('motion-reduce:transition-none');
  });
});