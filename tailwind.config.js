/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
        display: ['Anton', 'Inter', 'sans-serif'],
      },
      colors: {
        black: {
          950: '#000000',
          900: '#050505',
          850: '#0a0a0b',
          800: '#101012',
          700: '#161618',
          600: '#1d1d20',
          500: '#26262a',
          400: '#3a3a40',
          300: '#5a5a62',
          200: '#7e7e88',
        },
        red: {
          50: '#fff1f1',
          100: '#ffe0e0',
          200: '#ffc6c6',
          300: '#ff9b9b',
          400: '#ff5a5a',
          500: '#ff2d2d',
          600: '#ed0c0c',
          700: '#c50808',
          800: '#9f0a0a',
          900: '#830f0f',
        },
        success: {
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
        },
        warn: {
          400: '#fbbf24',
          500: '#f59e0b',
        },
      },
      boxShadow: {
        'glow-red': '0 0 30px -8px rgba(255, 45, 45, 0.55)',
        'glow-red-sm': '0 0 12px -4px rgba(255, 45, 45, 0.5)',
        card: '0 1px 0 0 rgba(255,255,255,0.02) inset, 0 10px 40px -16px rgba(0,0,0,0.8)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'pulse-red': {
          '0%, 100%': { opacity: '1', boxShadow: '0 0 0 0 rgba(255,45,45,0.5)' },
          '50%': { opacity: '0.6', boxShadow: '0 0 0 6px rgba(255,45,45,0)' },
        },
        'scan': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        'blink': {
          '0%, 49%': { opacity: '1' },
          '50%, 100%': { opacity: '0' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.35s ease-out both',
        'fade-in': 'fade-in 0.3s ease-out both',
        'pulse-red': 'pulse-red 1.8s ease-in-out infinite',
        'blink': 'blink 1s step-end infinite',
      },
    },
  },
  plugins: [],
};
