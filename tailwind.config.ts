import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        luxury: {
          gold: '#C5A880',
          goldHover: '#B3966E',
          charcoal: '#111111',
          cream: '#FAF7F1',
          ivory: '#F8F2E8',
          pearl: '#E6E0D6',
          slate: '#262B34',
        },
      },
      boxShadow: {
        soft: '0 30px 80px rgba(17, 17, 17, 0.18)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
