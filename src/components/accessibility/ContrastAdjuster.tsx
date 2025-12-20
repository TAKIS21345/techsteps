import React, { useState, useEffect } from 'react';
import { useAccessibility } from '../../contexts/AccessibilityContext';
import { Button } from '../design-system/Button';
import { Typography } from '../design-system/Typography';

interface ContrastAdjusterProps {
  className?: string;
}

export const ContrastAdjuster: React.FC<ContrastAdjusterProps> = ({ 
  className = '' 
}) => {
  const { settings, updateSettings, announceToScreenReader } = useAccessibility();
  const [contrastLevel, setContrastLevel] = useState<number>(1);

  useEffect(() => {
    // Set initial contrast level based on current settings
    setContrastLevel(settings.highContrast ? 2 : 1);
  }, [settings.highContrast]);

  const adjustContrast = (level: number) => {
    setContrastLevel(level);
    
    const root = document.documentElement;
    
    // Remove existing contrast classes
    root.classList.remove('contrast-normal', 'contrast-high', 'contrast-maximum');
    
    switch (level) {
      case 1:
        root.classList.add('contrast-normal');
        updateSettings({ highContrast: false });
        announceToScreenReader('Contrast set to normal');
        break;
      case 2:
        root.classList.add('contrast-high');
        updateSettings({ highContrast: true });
        announceToScreenReader('Contrast set to high');
        break;
      case 3:
        root.classList.add('contrast-maximum');
        updateSettings({ highContrast: true });
        announceToScreenReader('Contrast set to maximum');
        break;
    }
  };

  return (
    <div className={`contrast-adjuster ${className}`}>
      <Typography variant="body" className="font-medium text-neutral-900 mb-3">
        Contrast Level
      </Typography>
      
      <div className="flex items-center space-x-2">
        <Button
          variant={contrastLevel === 1 ? 'primary' : 'outline'}
          size="sm"
          onClick={() => adjustContrast(1)}
          aria-pressed={contrastLevel === 1}
          aria-label="Set normal contrast"
        >
          Normal
        </Button>
        
        <Button
          variant={contrastLevel === 2 ? 'primary' : 'outline'}
          size="sm"
          onClick={() => adjustContrast(2)}
          aria-pressed={contrastLevel === 2}
          aria-label="Set high contrast"
        >
          High
        </Button>
        
        <Button
          variant={contrastLevel === 3 ? 'primary' : 'outline'}
          size="sm"
          onClick={() => adjustContrast(3)}
          aria-pressed={contrastLevel === 3}
          aria-label="Set maximum contrast"
        >
          Maximum
        </Button>
      </div>
      
      <Typography variant="body-sm" className="text-neutral-600 mt-2">
        Adjust contrast to improve text readability
      </Typography>
    </div>
  );
};