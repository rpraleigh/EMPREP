import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        severity: {
          info:     { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' },
          warning:  { bg: '#FFFBEB', text: '#B45309', border: '#FDE68A' },
          critical: { bg: '#FEF2F2', text: '#B91C1C', border: '#FECACA' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
