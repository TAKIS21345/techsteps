import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y } from '@axe-core/playwright';

test.describe('Keyboard Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await injectAxe(page);
  });

  test('should navigate through focusable elements with Tab', async ({ page }) => {
    // Get all focusable elements
    const focusableElements = await page.locator('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])').all();
    
    expect(focusableElements.length).toBeGreaterThan(0);
    
    // Start from the first focusable element
    await page.keyboard.press('Tab');
    
    // Navigate through all focusable elements
    for (let i = 0; i < Math.min(focusableElements.length, 10); i++) {
      const focusedElement = await page.locator(':focus').first();
      expect(focusedElement).toBeTruthy();
      
      // Check that focus indicator is visible
      const focusStyles = await focusedElement.evaluate((el) => {
        const styles = window.getComputedStyle(el, ':focus');
        return {
          outline: styles.outline,
          boxShadow: styles.boxShadow,
          borderColor: styles.borderColor,
        };
      });
      
      // Should have some form of focus indicator
      const hasFocusIndicator = 
        focusStyles.outline !== 'none' ||
        focusStyles.boxShadow !== 'none' ||
        focusStyles.borderColor !== 'initial';
      
      expect(hasFocusIndicator).toBeTruthy();
      
      await page.keyboard.press('Tab');
    }
  });

  test('should navigate with Shift+Tab in reverse order', async ({ page }) => {
    // Navigate to the end first
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
    }
    
    const forwardElement = await page.locator(':focus').first();
    const forwardText = await forwardElement.textContent();
    
    // Navigate backward
    await page.keyboard.press('Shift+Tab');
    const backwardElement = await page.locator(':focus').first();
    const backwardText = await backwardElement.textContent();
    
    // Should be different elements
    expect(forwardText).not.toBe(backwardText);
  });

  test('should activate buttons with Enter and Space', async ({ page }) => {
    // Find a button to test
    const button = page.locator('button').first();
    await button.focus();
    
    // Test Enter key
    await page.keyboard.press('Enter');
    
    // Test Space key
    await page.keyboard.press('Space');
    
    // Button should remain focused after activation
    expect(await button.evaluate(el => el === document.activeElement)).toBeTruthy();
  });

  test('should handle F6 key for main content navigation', async ({ page }) => {
    // Add main content element if it doesn't exist
    await page.evaluate(() => {
      if (!document.querySelector('main')) {
        const main = document.createElement('main');
        main.id = 'main-content';
        main.textContent = 'Main content';
        main.tabIndex = -1;
        document.body.appendChild(main);
      }
    });
    
    await page.keyboard.press('F6');
    
    const focusedElement = await page.locator(':focus').first();
    const tagName = await focusedElement.evaluate(el => el.tagName.toLowerCase());
    
    expect(tagName).toBe('main');
  });

  test('should handle Escape key for modal closing', async ({ page }) => {
    // Create a mock modal
    await page.evaluate(() => {
      const modal = document.createElement('div');
      modal.setAttribute('role', 'dialog');
      modal.innerHTML = `
        <h2>Modal Title</h2>
        <button aria-label="Close modal">Close</button>
        <button>Action</button>
      `;
      document.body.appendChild(modal);
      
      // Add close functionality
      const closeButton = modal.querySelector('[aria-label="Close modal"]') as HTMLButtonElement;
      closeButton.onclick = () => modal.remove();
    });
    
    // Focus should be trapped in modal
    await page.keyboard.press('Tab');
    
    // Escape should close modal
    await page.keyboard.press('Escape');
    
    const modal = await page.locator('[role="dialog"]').count();
    expect(modal).toBe(0);
  });

  test('should navigate by headings with Alt+H', async ({ page }) => {
    // Ensure there are headings on the page
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    
    if (headings.length > 0) {
      await page.keyboard.press('Alt+h');
      
      const focusedElement = await page.locator(':focus').first();
      const tagName = await focusedElement.evaluate(el => el.tagName.toLowerCase());
      
      expect(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']).toContain(tagName);
    }
  });

  test('should navigate by links with Alt+L', async ({ page }) => {
    const links = await page.locator('a[href]').all();
    
    if (links.length > 0) {
      await page.keyboard.press('Alt+l');
      
      const focusedElement = await page.locator(':focus').first();
      const tagName = await focusedElement.evaluate(el => el.tagName.toLowerCase());
      
      expect(tagName).toBe('a');
    }
  });

  test('should navigate by buttons with Alt+B', async ({ page }) => {
    const buttons = await page.locator('button, [role="button"]').all();
    
    if (buttons.length > 0) {
      await page.keyboard.press('Alt+b');
      
      const focusedElement = await page.locator(':focus').first();
      const tagName = await focusedElement.evaluate(el => el.tagName.toLowerCase());
      const role = await focusedElement.getAttribute('role');
      
      expect(tagName === 'button' || role === 'button').toBeTruthy();
    }
  });

  test('should handle arrow key navigation with Ctrl', async ({ page }) => {
    // Focus first element
    await page.keyboard.press('Tab');
    const firstElement = await page.locator(':focus').first();
    const firstText = await firstElement.textContent();
    
    // Navigate with Ctrl+ArrowDown
    await page.keyboard.press('Control+ArrowDown');
    const secondElement = await page.locator(':focus').first();
    const secondText = await secondElement.textContent();
    
    // Should be different elements (if there are multiple focusable elements)
    const focusableCount = await page.locator('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])').count();
    
    if (focusableCount > 1) {
      expect(firstText).not.toBe(secondText);
    }
  });

  test('should maintain focus visibility throughout navigation', async ({ page }) => {
    const focusableElements = await page.locator('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])').all();
    
    for (let i = 0; i < Math.min(focusableElements.length, 5); i++) {
      await page.keyboard.press('Tab');
      
      const focusedElement = await page.locator(':focus').first();
      
      // Check that element is visible
      expect(await focusedElement.isVisible()).toBeTruthy();
      
      // Check that element is in viewport
      const boundingBox = await focusedElement.boundingBox();
      expect(boundingBox).toBeTruthy();
      
      if (boundingBox) {
        const viewport = page.viewportSize();
        expect(boundingBox.x).toBeGreaterThanOrEqual(0);
        expect(boundingBox.y).toBeGreaterThanOrEqual(0);
        expect(boundingBox.x + boundingBox.width).toBeLessThanOrEqual(viewport!.width);
        expect(boundingBox.y + boundingBox.height).toBeLessThanOrEqual(viewport!.height);
      }
    }
  });

  test('should pass axe accessibility tests during keyboard navigation', async ({ page }) => {
    // Navigate through several elements
    for (let i = 0; i < 3; i++) {
      await page.keyboard.press('Tab');
      
      // Run accessibility check at each step
      await checkA11y(page, null, {
        detailedReport: true,
        detailedReportOptions: { html: true },
      });
    }
  });

  test('should handle focus trapping in modals', async ({ page }) => {
    // Create a modal with multiple focusable elements
    await page.evaluate(() => {
      const modal = document.createElement('div');
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');
      modal.innerHTML = `
        <h2>Modal Title</h2>
        <input type="text" placeholder="First input">
        <input type="text" placeholder="Second input">
        <button>Action</button>
        <button aria-label="Close modal">Close</button>
      `;
      document.body.appendChild(modal);
      
      // Focus first element in modal
      const firstInput = modal.querySelector('input') as HTMLInputElement;
      firstInput.focus();
    });
    
    const modalElements = await page.locator('[role="dialog"] input, [role="dialog"] button').all();
    
    // Navigate through modal elements
    for (let i = 0; i < modalElements.length; i++) {
      const focusedElement = await page.locator(':focus').first();
      const isInModal = await focusedElement.evaluate(el => {
        const modal = document.querySelector('[role="dialog"]');
        return modal?.contains(el) || false;
      });
      
      expect(isInModal).toBeTruthy();
      
      await page.keyboard.press('Tab');
    }
    
    // After cycling through all elements, should return to first
    const finalFocusedElement = await page.locator(':focus').first();
    const tagName = await finalFocusedElement.evaluate(el => el.tagName.toLowerCase());
    expect(tagName).toBe('input');
  });
});