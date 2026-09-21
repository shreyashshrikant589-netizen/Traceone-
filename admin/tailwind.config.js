/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: '#0F172A',
        blue: '#2563EB',
        teal: '#0D9488',
        slate: '#64748B',
        danger: '#DC2626',
        panel: '#F8FAFC',
        line: '#E2E8F0',
        surface: '#FFFFFF',
      },
      boxShadow: {
        soft: '0 12px 30px rgba(15, 23, 42, 0.07)',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
