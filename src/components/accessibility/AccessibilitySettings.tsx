import React from 'react';
import { useAccessibility } from '../../contexts/AccessibilityContext';
import { Button } from '../design-system/Button';
import { Card } from '../design-system/Card';
import { Typography } from '../design-system/Typography';
import { Section, Heading } from './SemanticMarkup';

interface AccessibilitySettingsProps {
  className?: string;
}

export const AccessibilitySettings: React.FC<AccessibilitySettingsProps> = ({ 
  className = '' 
}) => {
  const { settings, updateSettings, announceToScreenReader } = useAccessibility();

  const handleHighContrastToggle = () => {
    const newValue = !settings.highContrast;
    updateSettings({ highContrast: newValue });
    announceToScreenReader(
      newValue ? 'High contrast mode enabled' : 'High contrast mode disabled'
    );
  };

  const handleReducedMotionToggle = () => {
    const newValue = !settings.reducedMotion;
    updateSettings({ reducedMotion: newValue });
    announceToScreenReader(
      newValue ? 'Reduced motion enabled' : 'Reduced motion disabled'
    );
  };

  const handleFontSizeChange = (fontSize: typeof settings.fontSize) => {
    updateSettings({ fontSize });
    announceToScreenReader(`Font size changed to ${fontSize}`);
  };

  const handleKeyboardNavigationToggle = () => {
    const newValue = !settings.keyboardNavigation;
    updateSettings({ keyboardNavigation: newValue });
    announceToScreenReader(
      newValue ? 'Enhanced keyboard navigation enabled' : 'Enhanced keyboard navigation disabled'
    );
  };

  const handleScreenReaderOptimizationToggle = () => {
    const newValue = !settings.screenReaderOptimized;
    updateSettings({ screenReaderOptimized: newValue });
    announceToScreenReader(
      newValue ? 'Screen reader optimizations enabled' : 'Screen reader optimizations disabled'
    );
  };

  return (
    <Section className={className} heading="Accessibility Settings">
      <div className="space-y-6">
        <Heading level={2} className="text-2xl font-semibold text-neutral-900 mb-4">
          Accessibility Settings
        </Heading>
        
        <Typography variant="body" className="text-neutral-600 mb-6">
          Customize your experience to meet your accessibility needs. These settings will be saved and applied across all pages.
        </Typography>

        {/* Visual Settings */}
        <Card className="p-6">
          <Heading level={3} className="text-lg font-semibold text-neutral-900 mb-4">
            Visual Settings
          </Heading>
          
          <div className="space-y-4">
            {/* High Contrast Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Typography variant="body" className="font-medium text-neutral-900">
                  High Contrast Mode
                </Typography>
                <Typography variant="body-sm" className="text-neutral-600 mt-1">
                  Increases contrast between text and background for better visibility
                </Typography>
              </div>
              <Button
                variant={settings.highContrast ? 'primary' : 'outline'}
                size="md"
                onClick={handleHighContrastToggle}
                aria-pressed={settings.highContrast}
                aria-describedby="high-contrast-description"
              >
                {settings.highContrast ? 'Enabled' : 'Disabled'}
              </Button>
            </div>

            {/* Font Size Selection */}
            <div>
              <Typography variant="body" className="font-medium text-neutral-900 mb-2">
                Font Size
              </Typography>
              <Typography variant="body-sm" className="text-neutral-600 mb-3">
                Choose a comfortable text size for reading
              </Typography>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {(['small', 'medium', 'large', 'extra-large'] as const).map((size) => (
                  <Button
                    key={size}
                    variant={settings.fontSize === size ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => handleFontSizeChange(size)}
                    aria-pressed={settings.fontSize === size}
                    className="capitalize"
                  >
                    {size === 'extra-large' ? 'Extra Large' : size}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Motion Settings */}
        <Card className="p-6">
          <Heading level={3} className="text-lg font-semibold text-neutral-900 mb-4">
            Motion Settings
          </Heading>
          
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Typography variant="body" className="font-medium text-neutral-900">
                Reduced Motion
              </Typography>
              <Typography variant="body-sm" className="text-neutral-600 mt-1">
                Minimizes animations and transitions that may cause discomfort
              </Typography>
            </div>
            <Button
              variant={settings.reducedMotion ? 'primary' : 'outline'}
              size="md"
              onClick={handleReducedMotionToggle}
              aria-pressed={settings.reducedMotion}
              aria-describedby="reduced-motion-description"
            >
              {settings.reducedMotion ? 'Enabled' : 'Disabled'}
            </Button>
          </div>
        </Card>

        {/* Navigation Settings */}
        <Card className="p-6">
          <Heading level={3} className="text-lg font-semibold text-neutral-900 mb-4">
            Navigation Settings
          </Heading>
          
          <div className="space-y-4">
            {/* Keyboard Navigation */}
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Typography variant="body" className="font-medium text-neutral-900">
                  Enhanced Keyboard Navigation
                </Typography>
                <Typography variant="body-sm" className="text-neutral-600 mt-1">
                  Enables advanced keyboard shortcuts and navigation features
                </Typography>
              </div>
              <Button
                variant={settings.keyboardNavigation ? 'primary' : 'outline'}
                size="md"
                onClick={handleKeyboardNavigationToggle}
                aria-pressed={settings.keyboardNavigation}
                aria-describedby="keyboard-navigation-description"
              >
                {settings.keyboardNavigation ? 'Enabled' : 'Disabled'}
              </Button>
            </div>

            {/* Screen Reader Optimization */}
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Typography variant="body" className="font-medium text-neutral-900">
                  Screen Reader Optimization
                </Typography>
                <Typography variant="body-sm" className="text-neutral-600 mt-1">
                  Optimizes the interface for screen readers and assistive technologies
                </Typography>
              </div>
              <Button
                variant={settings.screenReaderOptimized ? 'primary' : 'outline'}
                size="md"
                onClick={handleScreenReaderOptimizationToggle}
                aria-pressed={settings.screenReaderOptimized}
                aria-describedby="screen-reader-description"
              >
                {settings.screenReaderOptimized ? 'Enabled' : 'Disabled'}
              </Button>
            </div>
          </div>
        </Card>

        {/* Keyboard Shortcuts Help */}
        <Card className="p-6 bg-neutral-50">
          <Heading level={3} className="text-lg font-semibold text-neutral-900 mb-4">
            Keyboard Shortcuts
          </Heading>
          
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <Typography variant="body-sm" className="font-medium text-neutral-900 mb-2">
                Navigation
              </Typography>
              <ul className="space-y-1 text-neutral-600">
                <li><kbd className="px-2 py-1 bg-white border rounded">Tab</kbd> - Next element</li>
                <li><kbd className="px-2 py-1 bg-white border rounded">Shift+Tab</kbd> - Previous element</li>
                <li><kbd className="px-2 py-1 bg-white border rounded">F6</kbd> - Skip to main content</li>
                <li><kbd className="px-2 py-1 bg-white border rounded">Escape</kbd> - Close modal</li>
              </ul>
            </div>
            
            <div>
              <Typography variant="body-sm" className="font-medium text-neutral-900 mb-2">
                Quick Navigation
              </Typography>
              <ul className="space-y-1 text-neutral-600">
                <li><kbd className="px-2 py-1 bg-white border rounded">Alt+H</kbd> - Navigate headings</li>
                <li><kbd className="px-2 py-1 bg-white border rounded">Alt+L</kbd> - Navigate links</li>
                <li><kbd className="px-2 py-1 bg-white border rounded">Alt+B</kbd> - Navigate buttons</li>
                <li><kbd className="px-2 py-1 bg-white border rounded">Ctrl+↑/↓</kbd> - Navigate elements</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Reset Settings */}
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            size="md"
            onClick={() => {
              updateSettings({
                highContrast: false,
                reducedMotion: false,
                fontSize: 'medium',
                keyboardNavigation: true,
                screenReaderOptimized: false,
              });
              announceToScreenReader('Accessibility settings reset to defaults');
            }}
          >
            Reset to Defaults
          </Button>
        </div>
      </div>
    </Section>
  );
};