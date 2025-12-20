import * as React from 'react';
import { AccessibilitySettings } from '../components/design-system/types';

interface AccessibilityContextType {
  settings: AccessibilitySettings;
  updateSettings: (settings: Partial<AccessibilitySettings>) => void;
  announceToScreenReader: (message: string) => void;
  isHighContrast: boolean;
  isReducedMotion: boolean;
  fontSize: AccessibilitySettings['fontSize'];
}

const AccessibilityContext = React.createContext<AccessibilityContextType | undefined>(undefined);

const DEFAULT_SETTINGS: AccessibilitySettings = {
  highContrast: false,
  reducedMotion: false,
  fontSize: 'medium',
  keyboardNavigation: true,
  screenReaderOptimized: false,
};

interface AccessibilityProviderProps {
  children: React.ReactNode;
}

export const AccessibilityProvider: React.FC<AccessibilityProviderProps> = ({ children }) => {
  const [settings, setSettings] = React.useState<AccessibilitySettings>(DEFAULT_SETTINGS);

  const updateSettings = React.useCallback((newSettings: Partial<AccessibilitySettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  const announceToScreenReader = React.useCallback((message: string) => {
    console.log('Screen reader announcement:', message);
  }, []);

  const contextValue: AccessibilityContextType = {
    settings,
    updateSettings,
    announceToScreenReader,
    isHighContrast: settings.highContrast,
    isReducedMotion: settings.reducedMotion,
    fontSize: settings.fontSize,
  };

  return (
    <AccessibilityContext.Provider value={contextValue}>
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = (): AccessibilityContextType => {
  const context = React.useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};