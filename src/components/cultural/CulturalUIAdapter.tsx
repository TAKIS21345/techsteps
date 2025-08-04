import React, { useEffect, useState } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import { useCulturalContent } from '../../hooks/useCulturalContent';
import { culturalContentService } from '../../services/culturalContentService';

interface CulturalUIAdapterProps {
  children: React.ReactNode;
}

interface CulturalUIStyles {
  direction: 'ltr' | 'rtl';
  fontFamily: string;
  spacing: string;
  colorScheme: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
}

export const CulturalUIAdapter: React.FC<CulturalUIAdapterProps> = ({ children }) => {
  const { currentLanguage } = useTranslation();
  const { preferences } = useCulturalContent();
  const [culturalStyles, setCulturalStyles] = useState<CulturalUIStyles | null>(null);

  useEffect(() => {
    const applyculturalStyles = () => {
      if (!preferences || !preferences.culturalAdaptation) {
        // Reset to default styles
        setCulturalStyles(null);
        return;
      }

      // Get layout preferences
      const layoutPrefs = culturalContentService.getLayoutPreferences(currentLanguage);
      
      // Get color scheme
      const colorScheme = culturalContentService.getCulturalColorScheme(currentLanguage);

      const styles: CulturalUIStyles = {
        direction: layoutPrefs.direction,
        fontFamily: layoutPrefs.fontFamily[0] || 'Arial',
        spacing: layoutPrefs.spacing === 'generous' ? '1.5rem' : 
                layoutPrefs.spacing === 'compact' ? '0.75rem' : '1rem',
        colorScheme
      };

      setCulturalStyles(styles);
    };

    applyculturalStyles();
  }, [currentLanguage, preferences]);

  useEffect(() => {
    if (!culturalStyles) {
      // Remove cultural styles
      document.documentElement.removeAttribute('dir');
      document.documentElement.style.removeProperty('--cultural-font-family');
      document.documentElement.style.removeProperty('--cultural-spacing');
      document.documentElement.style.removeProperty('--cultural-primary');
      document.documentElement.style.removeProperty('--cultural-secondary');
      document.documentElement.style.removeProperty('--cultural-accent');
      return;
    }

    // Apply cultural styles to document root
    document.documentElement.setAttribute('dir', culturalStyles.direction);
    document.documentElement.style.setProperty('--cultural-font-family', culturalStyles.fontFamily);
    document.documentElement.style.setProperty('--cultural-spacing', culturalStyles.spacing);
    document.documentElement.style.setProperty('--cultural-primary', culturalStyles.colorScheme.primary);
    document.documentElement.style.setProperty('--cultural-secondary', culturalStyles.colorScheme.secondary);
    document.documentElement.style.setProperty('--cultural-accent', culturalStyles.colorScheme.accent);

    // Apply RTL-specific styles
    if (culturalStyles.direction === 'rtl') {
      document.body.classList.add('rtl-layout');
    } else {
      document.body.classList.remove('rtl-layout');
    }

    return () => {
      // Cleanup on unmount
      document.documentElement.removeAttribute('dir');
      document.body.classList.remove('rtl-layout');
    };
  }, [culturalStyles]);

  return (
    <div 
      className={`cultural-ui-adapter ${culturalStyles?.direction === 'rtl' ? 'rtl' : 'ltr'}`}
      style={{
        fontFamily: culturalStyles?.fontFamily,
        '--spacing-unit': culturalStyles?.spacing
      } as React.CSSProperties}
    >
      {children}
    </div>
  );
};

export default CulturalUIAdapter;