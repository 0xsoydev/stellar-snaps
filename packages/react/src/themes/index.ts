/**
 * Theme types and definitions for @stellar-snaps/react
 */

export interface Theme {
  // Colors
  primary: string;
  primaryHover: string;
  background: string;
  backgroundSecondary: string;
  text: string;
  textSecondary: string;
  border: string;
  success: string;
  error: string;
  warning: string;
  
  // Sizing
  borderRadius: string;
  fontFamily: string;
  fontSize: string;
  
  // Shadows
  shadow: string;
  shadowLg: string;
}

export const lightTheme: Theme = {
  primary: '#6366f1',
  primaryHover: '#4f46e5',
  background: '#ffffff',
  backgroundSecondary: '#f5f5f5',
  text: '#1a1a1a',
  textSecondary: '#666666',
  border: '#e5e5e5',
  success: '#22c55e',
  error: '#ef4444',
  warning: '#f59e0b',
  borderRadius: '8px',
  fontFamily: 'inherit',
  fontSize: '14px',
  shadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  shadowLg: '0 10px 40px rgba(0, 0, 0, 0.15)',
};

export const darkTheme: Theme = {
  primary: '#818cf8',
  primaryHover: '#6366f1',
  background: '#1a1a1a',
  backgroundSecondary: '#2a2a2a',
  text: '#ffffff',
  textSecondary: '#a0a0a0',
  border: '#333333',
  success: '#4ade80',
  error: '#f87171',
  warning: '#fbbf24',
  borderRadius: '8px',
  fontFamily: 'inherit',
  fontSize: '14px',
  shadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
  shadowLg: '0 10px 40px rgba(0, 0, 0, 0.5)',
};

/**
 * Convert theme to CSS variables object
 */
export function themeToCssVars(theme: Theme): Record<string, string> {
  return {
    '--snaps-primary': theme.primary,
    '--snaps-primary-hover': theme.primaryHover,
    '--snaps-bg': theme.background,
    '--snaps-bg-secondary': theme.backgroundSecondary,
    '--snaps-text': theme.text,
    '--snaps-text-secondary': theme.textSecondary,
    '--snaps-border': theme.border,
    '--snaps-success': theme.success,
    '--snaps-error': theme.error,
    '--snaps-warning': theme.warning,
    '--snaps-radius': theme.borderRadius,
    '--snaps-font': theme.fontFamily,
    '--snaps-font-size': theme.fontSize,
    '--snaps-shadow': theme.shadow,
    '--snaps-shadow-lg': theme.shadowLg,
  };
}

export type ThemeName = 'light' | 'dark' | 'none';

export function getTheme(name: ThemeName): Theme | null {
  switch (name) {
    case 'light':
      return lightTheme;
    case 'dark':
      return darkTheme;
    case 'none':
      return null;
    default:
      return lightTheme;
  }
}
