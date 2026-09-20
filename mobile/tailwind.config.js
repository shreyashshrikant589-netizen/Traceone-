/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        background: '#F8FAFC',
        surface: '#FFFFFF',
        navy: '#0F172A',
        'navy-soft': '#172554',
        blue: '#2563EB',
        'blue-soft': '#EFF6FF',
        teal: '#0D9488',
        'teal-soft': '#F0FDFA',
        success: '#16A34A',
        warning: '#D97706',
        danger: '#DC2626',
        muted: '#64748B',
        border: '#E2E8F0',
      },
    },
  },
  plugins: [],
};