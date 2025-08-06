// Weave.bio inspired theme constants
export interface WeaveTheme {
  background: string;
  surface: string;
  primary: string;
  secondary: string;
  accent: string;
  accentMuted: string;
  border: string;
  inputBg: string;
  inputText: string;
  highlight: string;
}

export const weaveLightTheme: WeaveTheme = {
  background: '#ffffff',
  surface: '#f5f5f5',
  primary: '#1C1C26',
  secondary: '#555555',
  accent: '#F9686F',
  accentMuted: '#FAD1D3',
  border: '#e0e0e0',
  inputBg: '#ffffff',
  inputText: '#1C1C26',
  highlight: '#f8e8ea',
};

export const weaveDarkTheme: WeaveTheme = {
  background: '#1C1C26',
  surface: '#292935',
  primary: '#ffffff',
  secondary: '#cccccc',
  accent: '#F9686F',
  accentMuted: '#5A2B30',
  border: '#3a3a4a',
  inputBg: '#1C1C26',
  inputText: '#ffffff',
  highlight: '#332c2f',
};

// CSS Custom Properties for dynamic theme switching
export const getThemeCSSVariables = (theme: 'light' | 'dark') => {
  const themeColors = theme === 'light' ? weaveLightTheme : weaveDarkTheme;
  
  return {
    '--weave-background': themeColors.background,
    '--weave-surface': themeColors.surface,
    '--weave-primary': themeColors.primary,
    '--weave-secondary': themeColors.secondary,
    '--weave-accent': themeColors.accent,
    '--weave-accent-muted': themeColors.accentMuted,
    '--weave-border': themeColors.border,
    '--weave-input-bg': themeColors.inputBg,
    '--weave-input-text': themeColors.inputText,
    '--weave-highlight': themeColors.highlight,
  };
};

// Tailwind class mappings for common use cases
export const weaveClasses = {
  // Backgrounds
  bgPrimary: 'bg-white dark:bg-weave-dark-background',
  bgSurface: 'bg-weave-light-surface dark:bg-weave-dark-surface',
  bgAccent: 'bg-weave-light-accent dark:bg-weave-dark-accent',
  bgAccentMuted: 'bg-weave-light-accentMuted dark:bg-weave-dark-accentMuted',
  bgHighlight: 'bg-weave-light-highlight dark:bg-weave-dark-highlight',
  
  // Text colors
  textPrimary: 'text-weave-light-primary dark:text-weave-dark-primary',
  textSecondary: 'text-weave-light-secondary dark:text-weave-dark-secondary',
  textAccent: 'text-weave-light-accent dark:text-weave-dark-accent',
  
  // Borders
  borderPrimary: 'border-weave-light-border dark:border-weave-dark-border',
  borderAccent: 'border-weave-light-accent dark:border-weave-dark-accent',
  
  // Input styles
  inputBase: 'bg-weave-light-inputBg dark:bg-weave-dark-inputBg text-weave-light-inputText dark:text-weave-dark-inputText border-weave-light-border dark:border-weave-dark-border',
  
  // Interactive states
  hoverSurface: 'hover:bg-weave-light-surface dark:hover:bg-weave-dark-surface',
  hoverAccent: 'hover:bg-weave-light-accent dark:hover:bg-weave-dark-accent',
  focusRing: 'focus:ring-2 focus:ring-weave-light-accent dark:focus:ring-weave-dark-accent focus:ring-opacity-50',
}; 