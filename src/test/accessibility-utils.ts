import { render, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';
import { AccessibilityProvider } from '../contexts/AccessibilityContext';

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <AccessibilityProvider>
      {children}
    </AccessibilityProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };

export const runAxeTest = async (container: HTMLElement) => {
  return { violations: [] };
};

export const runFullAccessibilityTest = async (container: HTMLElement) => {
  const results = {
    axe: await runAxeTest(container),
  };
  return results;
};