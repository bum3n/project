import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        sidebar: {
          bg: '#17212b',
          hover: '#2b5278',
          active: '#2b5278',
          text: '#aaaaaa',
          heading: '#ffffff',
        },
        chat: {
          bg: '#0e1621',
          message: {
            out: '#2b5278',
            in: '#182533',
          },
        },
        accent: {
          DEFAULT: '#5288c1',
          hover: '#4a7ab5',
        },
      },
    },
  },
  plugins: [],
} satisfies Config
