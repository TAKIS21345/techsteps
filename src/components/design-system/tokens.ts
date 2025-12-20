import type { DesignTokens } from './types';

// Senior-friendly design tokens with high contrast and accessibility focus
export const designTokens: DesignTokens = {
  colors: {
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#1d4ed8', // Darker for better contrast - WCAG AA compliant
      600: '#1e40af',
      700: '#1e3a8a',
      800: '#1e3a8a',
      900: '#172554',
    },
    secondary: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
    },
    success: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#15803d', // Darker green for better contrast
      600: '#166534',
      700: '#14532d',
      800: '#14532d',
      900: '#052e16',
    },
    warning: {
      50: '#fffbeb',
      100: '#fef3c7',
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24',
      500: '#b45309', // Even darker amber for better contrast
      600: '#b45309',
      700: '#92400e',
      800: '#78350f',
      900: '#451a03',
    },
    error: {
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      300: '#fca5a5',
      400: '#f87171',
      500: '#dc2626', // Darker red for better contrast
      600: '#b91c1c',
      700: '#991b1b',
      800: '#7f1d1d',
      900: '#450a0a',
    },
    neutral: {
      50: '#fafafa',
      100: '#f5f5f5',
      200: '#e5e5e5',
      300: '#d4d4d4',
      400: '#737373', // Darker for better contrast with white
      500: '#525252',
      600: '#404040',
      700: '#262626',
      800: '#171717',
      900: '#0a0a0a',
    },
  },
  typography: {
    fontSizes: {
      'xs': ['14px', { lineHeight: '1.5' }],
      'sm': ['16px', { lineHeight: '1.5' }],
      'base': ['18px', { lineHeight: '1.6' }], // Minimum body text
      'lg': ['20px', { lineHeight: '1.6' }],
      'xl': ['22px', { lineHeight: '1.6' }],
      '2xl': ['24px', { lineHeight: '1.5' }], // Minimum heading
      '3xl': ['28px', { lineHeight: '1.4' }],
      '4xl': ['32px', { lineHeight: '1.3' }],
      '5xl': ['36px', { lineHeight: '1.2' }],
      '6xl': ['42px', { lineHeight: '1.1' }],
    },
    fontWeights: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    fontFamily: {
      sans: [
        'Inter',
        '-apple-system',
        'BlinkMacSystemFont',
        'Segoe UI',
        'Roboto',
        'sans-serif'
      ],
      mono: [
        'Menlo',
        'Monaco',
        'Consolas',
        'Liberation Mono',
        'Courier New',
        'monospace'
      ],
    },
  },
  spacing: {
    '0': '0px',
    '1': '4px',
    '2': '8px',
    '3': '12px',
    '4': '16px',
    '5': '20px',
    '6': '24px',
    '8': '32px',
    '10': '40px',
    '12': '48px',
    '16': '64px',
    '20': '80px',
    '24': '96px',
    '32': '128px',
    // Senior-friendly generous spacing
    '18': '72px',
    '22': '88px',
    '26': '104px',
    '30': '120px',
  },
  borderRadius: {
    'none': '0px',
    'sm': '4px',
    'md': '8px',
    'lg': '12px',
    'xl': '16px',
    '2xl': '20px',
    'full': '9999px',
    // Senior-friendly radius
    'senior': '12px',
    'senior-lg': '16px',
    'senior-xl': '20px',
  },
  shadows: {
    'none': 'none',
    'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    // Senior-friendly shadows for better depth perception
    'senior': '0 2px 8px -2px rgba(0, 0, 0, 0.1), 0 4px 12px -4px rgba(0, 0, 0, 0.1)',
    'senior-md': '0 4px 12px -2px rgba(0, 0, 0, 0.12), 0 8px 16px -4px rgba(0, 0, 0, 0.08)',
    'senior-lg': '0 8px 24px -4px rgba(0, 0, 0, 0.15), 0 12px 20px -8px rgba(0, 0, 0, 0.1)',
    'senior-xl': '0 12px 32px -8px rgba(0, 0, 0, 0.18), 0 16px 24px -12px rgba(0, 0, 0, 0.12)',
  },
  transitions: {
    duration: {
      'fast': '150ms',
      'normal': '250ms',
      'slow': '400ms',
      'slower': '600ms',
    },
    easing: {
      'ease-in': 'cubic-bezier(0.4, 0, 1, 1)',
      'ease-out': 'cubic-bezier(0, 0, 0.2, 1)',
      'ease-in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },
};

// High contrast theme overrides
export const highContrastTokens = {
  colors: {
    primary: {
      500: '#FFD600', // High contrast yellow
      600: '#FFAB00',
      700: '#FF8F00',
    },
    background: '#000000',
    surface: '#000000',
    text: {
      primary: '#FFFF00',
      secondary: '#FFFFFF',
      inverse: '#000000',
    },
    border: '#FFD600',
  },
};