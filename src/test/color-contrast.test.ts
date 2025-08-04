import { describe, it, expect } from 'vitest';
import { designTokens } from '../components/design-system/tokens';

// Color contrast calculation utilities
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  if (!rgb1 || !rgb2) return 0;
  
  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
  
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  
  return (brightest + 0.05) / (darkest + 0.05);
}

describe('Color Contrast Validation', () => {
  const WCAG_AA_NORMAL = 4.5;
  const WCAG_AA_LARGE = 3.0;
  const WCAG_AAA_NORMAL = 7.0;
  const WCAG_AAA_LARGE = 4.5;

  describe('Primary Colors', () => {
    it('should meet WCAG AA standards for primary text on white background', () => {
      const primaryColor = designTokens.colors.primary[500];
      const whiteBackground = '#ffffff';
      
      const ratio = getContrastRatio(primaryColor, whiteBackground);
      expect(ratio).toBeGreaterThanOrEqual(WCAG_AA_NORMAL);
    });

    it('should meet WCAG AA standards for white text on primary background', () => {
      const primaryColor = designTokens.colors.primary[500];
      const whiteText = '#ffffff';
      
      const ratio = getContrastRatio(whiteText, primaryColor);
      expect(ratio).toBeGreaterThanOrEqual(WCAG_AA_NORMAL);
    });

    it('should meet WCAG AA standards for primary variants', () => {
      const variants = [600, 700, 800, 900];
      const whiteText = '#ffffff';
      
      variants.forEach(variant => {
        const color = designTokens.colors.primary[variant as keyof typeof designTokens.colors.primary];
        const ratio = getContrastRatio(whiteText, color);
        expect(ratio, `Primary ${variant} should meet WCAG AA`).toBeGreaterThanOrEqual(WCAG_AA_NORMAL);
      });
    });
  });

  describe('Semantic Colors', () => {
    it('should meet WCAG AA standards for success colors', () => {
      const successColor = designTokens.colors.success[500];
      const whiteBackground = '#ffffff';
      const whiteText = '#ffffff';
      
      // Success color on white background
      const bgRatio = getContrastRatio(successColor, whiteBackground);
      expect(bgRatio).toBeGreaterThanOrEqual(WCAG_AA_NORMAL);
      
      // White text on success background
      const textRatio = getContrastRatio(whiteText, successColor);
      expect(textRatio).toBeGreaterThanOrEqual(WCAG_AA_NORMAL);
    });

    it('should meet WCAG AA standards for error colors', () => {
      const errorColor = designTokens.colors.error[500];
      const whiteBackground = '#ffffff';
      const whiteText = '#ffffff';
      
      // Error color on white background
      const bgRatio = getContrastRatio(errorColor, whiteBackground);
      expect(bgRatio).toBeGreaterThanOrEqual(WCAG_AA_NORMAL);
      
      // White text on error background
      const textRatio = getContrastRatio(whiteText, errorColor);
      expect(textRatio).toBeGreaterThanOrEqual(WCAG_AA_NORMAL);
    });

    it('should meet WCAG AA standards for warning colors', () => {
      const warningColor = designTokens.colors.warning[500];
      const whiteBackground = '#ffffff';
      const whiteText = '#ffffff';
      
      // Warning color on white background
      const bgRatio = getContrastRatio(warningColor, whiteBackground);
      expect(bgRatio).toBeGreaterThanOrEqual(WCAG_AA_NORMAL);
      
      // White text on warning background
      const textRatio = getContrastRatio(whiteText, warningColor);
      expect(textRatio).toBeGreaterThanOrEqual(WCAG_AA_NORMAL);
    });
  });

  describe('Neutral Colors', () => {
    it('should meet WCAG AA standards for text colors', () => {
      const darkText = designTokens.colors.neutral[900];
      const lightBackground = designTokens.colors.neutral[50];
      
      const ratio = getContrastRatio(darkText, lightBackground);
      expect(ratio).toBeGreaterThanOrEqual(WCAG_AA_NORMAL);
    });

    it('should meet WCAG AA standards for secondary text', () => {
      const secondaryText = designTokens.colors.neutral[600];
      const whiteBackground = '#ffffff';
      
      const ratio = getContrastRatio(secondaryText, whiteBackground);
      expect(ratio).toBeGreaterThanOrEqual(WCAG_AA_NORMAL);
    });

    it('should provide sufficient contrast for disabled states', () => {
      const disabledText = designTokens.colors.neutral[400];
      const whiteBackground = '#ffffff';
      
      const ratio = getContrastRatio(disabledText, whiteBackground);
      // Disabled text should still meet WCAG AA Large text standards
      expect(ratio).toBeGreaterThanOrEqual(WCAG_AA_LARGE);
    });
  });

  describe('High Contrast Mode', () => {
    it('should provide maximum contrast for high contrast mode', () => {
      const highContrastText = '#FFFFFF';
      const highContrastBackground = '#000000';
      
      const ratio = getContrastRatio(highContrastText, highContrastBackground);
      expect(ratio).toBeGreaterThanOrEqual(WCAG_AAA_NORMAL);
    });

    it('should provide sufficient contrast for high contrast accent colors', () => {
      const highContrastAccent = '#FFD600'; // High contrast yellow
      const blackBackground = '#000000';
      
      const ratio = getContrastRatio(highContrastAccent, blackBackground);
      expect(ratio).toBeGreaterThanOrEqual(WCAG_AA_NORMAL);
    });
  });

  describe('Button Color Combinations', () => {
    it('should meet WCAG AA for primary button text', () => {
      const primaryBg = designTokens.colors.primary[500];
      const whiteText = '#ffffff';
      
      const ratio = getContrastRatio(whiteText, primaryBg);
      expect(ratio).toBeGreaterThanOrEqual(WCAG_AA_NORMAL);
    });

    it('should meet WCAG AA for secondary button text', () => {
      const secondaryBg = designTokens.colors.neutral[100];
      const darkText = designTokens.colors.neutral[800];
      
      const ratio = getContrastRatio(darkText, secondaryBg);
      expect(ratio).toBeGreaterThanOrEqual(WCAG_AA_NORMAL);
    });

    it('should meet WCAG AA for outline button text', () => {
      const outlineText = designTokens.colors.primary[500];
      const whiteBackground = '#ffffff';
      
      const ratio = getContrastRatio(outlineText, whiteBackground);
      expect(ratio).toBeGreaterThanOrEqual(WCAG_AA_NORMAL);
    });
  });

  describe('Focus Indicators', () => {
    it('should provide sufficient contrast for focus rings', () => {
      const focusRing = designTokens.colors.primary[500];
      const whiteBackground = '#ffffff';
      
      const ratio = getContrastRatio(focusRing, whiteBackground);
      expect(ratio).toBeGreaterThanOrEqual(WCAG_AA_LARGE); // Focus indicators can use large text standards
    });
  });

  describe('Link Colors', () => {
    it('should meet WCAG AA for link colors on white background', () => {
      const linkColor = designTokens.colors.primary[500];
      const whiteBackground = '#ffffff';
      
      const ratio = getContrastRatio(linkColor, whiteBackground);
      expect(ratio).toBeGreaterThanOrEqual(WCAG_AA_NORMAL);
    });

    it('should meet WCAG AA for visited link colors', () => {
      const visitedColor = designTokens.colors.primary[700];
      const whiteBackground = '#ffffff';
      
      const ratio = getContrastRatio(visitedColor, whiteBackground);
      expect(ratio).toBeGreaterThanOrEqual(WCAG_AA_NORMAL);
    });
  });
});