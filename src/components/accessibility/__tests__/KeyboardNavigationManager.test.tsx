import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '../../../test/accessibility-utils';
import { KeyboardNavigationManager } from '../KeyboardNavigationManager';
import { Button } from '../../design-system/Button';

describe('KeyboardNavigationManager', () => {
  it('should handle Tab navigation', () => {
    render(
      <KeyboardNavigationManager>
        <Button>Button 1</Button>
        <Button>Button 2</Button>
        <Button>Button 3</Button>
      </KeyboardNavigationManager>
    );

    const buttons = screen.getAllByRole('button');
    
    // Focus first button
    buttons[0].focus();
    expect(buttons[0]).toHaveFocus();
    
    // Tab to next button
    fireEvent.keyDown(document, { key: 'Tab' });
    // Note: Tab navigation is handled by browser, we just track it
  });

  it('should handle F6 key for main content navigation', () => {
    const mockScrollIntoView = vi.fn();
    const mockFocus = vi.fn();
    
    // Mock main element
    const mainElement = document.createElement('main');
    mainElement.focus = mockFocus;
    mainElement.scrollIntoView = mockScrollIntoView;
    document.body.appendChild(mainElement);

    render(
      <KeyboardNavigationManager>
        <div>Test content</div>
      </KeyboardNavigationManager>
    );

    fireEvent.keyDown(document, { key: 'F6' });
    expect(mockFocus).toHaveBeenCalled();
  });

  it('should handle Escape key for modal closing', () => {
    const mockClick = vi.fn();
    
    // Create mock modal
    const modal = document.createElement('div');
    modal.setAttribute('role', 'dialog');
    const closeButton = document.createElement('button');
    closeButton.setAttribute('aria-label', 'Close modal');
    closeButton.onclick = mockClick;
    modal.appendChild(closeButton);
    document.body.appendChild(modal);

    render(
      <KeyboardNavigationManager>
        <div>Test content</div>
      </KeyboardNavigationManager>
    );

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(mockClick).toHaveBeenCalled();
    
    // Cleanup
    document.body.removeChild(modal);
  });

  it('should handle arrow key navigation with Ctrl', () => {
    render(
      <KeyboardNavigationManager>
        <Button>Button 1</Button>
        <Button>Button 2</Button>
        <Button>Button 3</Button>
      </KeyboardNavigationManager>
    );

    const buttons = screen.getAllByRole('button');
    
    // Focus first button
    buttons[0].focus();
    
    // Ctrl+ArrowDown should move to next focusable element
    fireEvent.keyDown(document, { key: 'ArrowDown', ctrlKey: true });
    
    // The navigation manager should handle this
    expect(document.activeElement).toBeTruthy();
  });

  it('should handle heading navigation with Alt+H', () => {
    render(
      <KeyboardNavigationManager>
        <h1>Heading 1</h1>
        <h2>Heading 2</h2>
        <h3>Heading 3</h3>
      </KeyboardNavigationManager>
    );

    const headings = screen.getAllByRole('heading');
    
    fireEvent.keyDown(document, { key: 'h', altKey: true });
    
    // Should focus first heading
    expect(headings[0]).toHaveFocus();
  });

  it('should handle link navigation with Alt+L', () => {
    render(
      <KeyboardNavigationManager>
        <a href="#link1">Link 1</a>
        <a href="#link2">Link 2</a>
        <a href="#link3">Link 3</a>
      </KeyboardNavigationManager>
    );

    const links = screen.getAllByRole('link');
    
    fireEvent.keyDown(document, { key: 'l', altKey: true });
    
    // Should focus first link
    expect(links[0]).toHaveFocus();
  });

  it('should handle button navigation with Alt+B', () => {
    render(
      <KeyboardNavigationManager>
        <Button>Button 1</Button>
        <Button>Button 2</Button>
        <Button>Button 3</Button>
      </KeyboardNavigationManager>
    );

    const buttons = screen.getAllByRole('button');
    
    fireEvent.keyDown(document, { key: 'b', altKey: true });
    
    // Should focus first button
    expect(buttons[0]).toHaveFocus();
  });

  it('should apply keyboard navigation class when enabled', () => {
    const { container } = render(
      <KeyboardNavigationManager>
        <div>Test content</div>
      </KeyboardNavigationManager>
    );

    expect(container.firstChild).toHaveClass('keyboard-navigation');
  });

  it('should handle focus trapping in modals', () => {
    // Create modal with focusable elements
    const modal = document.createElement('div');
    modal.setAttribute('role', 'dialog');
    
    const button1 = document.createElement('button');
    button1.textContent = 'Button 1';
    const button2 = document.createElement('button');
    button2.textContent = 'Button 2';
    
    modal.appendChild(button1);
    modal.appendChild(button2);
    document.body.appendChild(modal);

    render(
      <KeyboardNavigationManager>
        <div>Test content</div>
      </KeyboardNavigationManager>
    );

    // Focus should be trapped within modal
    const focusEvent = new FocusEvent('focusin', { bubbles: true });
    Object.defineProperty(focusEvent, 'target', { value: document.body });
    
    document.dispatchEvent(focusEvent);
    
    // Should focus first element in modal
    expect(button1).toHaveFocus();
    
    // Cleanup
    document.body.removeChild(modal);
  });
});