import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        espresso: '#0d4c31',
        mocha: '#8a421f',
        cream: '#fcfbf7',
        oat: '#f1f0ea',
        basil: '#188451',
        ember: '#ee8314',
        ink: '#14271f',
        muted: '#6d766f',
      },
      fontFamily: {
        display: ['Georgia', 'serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 18px 50px rgba(20, 39, 31, 0.09)',
        card: '0 10px 30px rgba(20, 39, 31, 0.08)',
      },
    },
  },
  plugins: [],
} satisfies Config;
