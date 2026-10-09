import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#5AA8D6',
          hover: '#3A4163',
          light: '#EDF3FB',
          subtle: '#CBE3EF',
          50: '#F0F7FC',
          100: '#E0EFF8',
          200: '#CBE3EF',
          300: '#A8D4EC',
          400: '#7CC4E2',
          500: '#5AA8D6',
          600: '#3A8BBF',
          700: '#2E6E9A',
          800: '#23547A',
          900: '#1A3D5C',
        },
        secondary: '#3A4163',
        background: '#FFFFFF',
        surface: '#FFFFFF',
        'surface-secondary': '#EDF3FB',
        'surface-tertiary': '#CBE3EF',
        muted: '#64748B',
        'text-primary': '#0F0E0F',
        'text-secondary': '#3A4163',
        'text-muted': '#848EAB',
        border: '#CBE3EF',
        success: '#22C55E',
        warning: '#F59E0B',
        danger: '#EF4444',
        info: '#0EA5E9',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config