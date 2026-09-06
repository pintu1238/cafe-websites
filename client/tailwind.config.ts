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
        basil: '#0b6b43',
        ember: '#a64b0b',
        ink: '#1f2933',
        muted: '#526159',
      },
      fontFamily: {
        display: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        xs: ['0.8125rem', { lineHeight: '1.5' }],
        sm: ['0.8125rem', { lineHeight: '1.5' }],
        base: ['0.8125rem', { lineHeight: '1.6' }],
        lg: ['1rem', { lineHeight: '1.4' }],
      },
      boxShadow: {
        soft: '0 18px 50px rgba(20, 39, 31, 0.09)',
        card: '0 10px 30px rgba(20, 39, 31, 0.08)',
      },
    },
  },
  plugins: [],
} satisfies Config;
