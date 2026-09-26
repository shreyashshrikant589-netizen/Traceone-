/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        background: '#FFFFFF',
        'background-muted': '#F8FAFC',
        surface: '#FFFFFF',
        navy: '#0F172A',
        'navy-soft': '#172554',
        blue: '#2563EB',
        'blue-light': '#3B82F6',
        teal: '#0D9488',
        'teal-light': '#14B8A6',
        success: '#16A34A',
        warning: '#D97706',
        danger: '#DC2626',
        muted: '#64748B',
        border: '#E2E8F0',
      },
      borderRadius: {
        sm: '8px',
        md: '12px',
        lg: '16px',
      },
    },
  },
  plugins: [],
};
