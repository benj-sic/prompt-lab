import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-3 bg-weave-light-surface dark:bg-weave-dark-surface border border-weave-light-border dark:border-weave-dark-border rounded-xl shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 backdrop-blur-sm"
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark' ? (
        <Sun className="h-5 w-5 text-weave-light-accent dark:text-weave-dark-accent" />
      ) : (
        <Moon className="h-5 w-5 text-weave-light-secondary dark:text-weave-dark-secondary" />
      )}
    </button>
  );
}; 