import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#2563EB',
        secondary: '#0F172A',
        background: '#F8FAFC',
        surface: '#FFFFFF',
        muted: '#64748B',
        success: '#16A34A',
        warning: '#F59E0B',
        danger: '#DC2626',
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