/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      colors: {
        // Weave.bio inspired color palette
        weave: {
          // Light theme colors
          light: {
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
          },
          // Dark theme colors
          dark: {
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
          },
        },
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s infinite',
        'fade-in': 'fade-in 0.5s ease-out',
        'slide-up': 'slide-up 0.3s ease-out',
        'scale-in': 'scale-in 0.2s ease-out',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': {
            boxShadow: '0 0 0 0 rgba(249, 104, 111, 0.7)',
          },
          '50%': {
            boxShadow: '0 0 0 10px rgba(249, 104, 111, 0)',
          },
        },
        'fade-in': {
          '0%': {
            opacity: '0',
          },
          '100%': {
            opacity: '1',
          },
        },
        'slide-up': {
          '0%': {
            transform: 'translateY(10px)',
            opacity: '0',
          },
          '100%': {
            transform: 'translateY(0)',
            opacity: '1',
          },
        },
        'scale-in': {
          '0%': {
            transform: 'scale(0.95)',
            opacity: '0',
          },
          '100%': {
            transform: 'scale(1)',
            opacity: '1',
          },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
} 