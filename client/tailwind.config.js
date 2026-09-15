/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#EEF1F7',
          100: '#D6DCEA',
          200: '#AEB9D5',
          300: '#8695BE',
          400: '#5E71A6',
          500: '#3D4F87',
          600: '#2C3C6B',
          700: '#212E52',
          800: '#1A2440',
          900: '#131A30',
          950: '#0D1220',
        },
        brass: {
          50: '#FBF6E9',
          100: '#F3E6BD',
          200: '#EAD592',
          300: '#E0C267',
          400: '#D2AC42',
          500: '#B98F2A',
          600: '#96721F',
          700: '#725519',
        },
        surface: '#F5F6F8',
        ink: '#1A1D23',
        success: { DEFAULT: '#2F9E63', light: '#E4F5EC' },
        warning: { DEFAULT: '#D98C1F', light: '#FBF0DE' },
        danger: { DEFAULT: '#D14343', light: '#FCE9E9' },
        info: { DEFAULT: '#3B6FD1', light: '#E9EFFB' },
        plum: { DEFAULT: '#6B4E8E', light: '#EFE8F5' },
      },
      fontFamily: {
        display: ['"Sora"', 'sans-serif'],
        sans: ['"Inter"', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px 0 rgba(19, 26, 48, 0.06)',
        popover: '0 8px 24px -4px rgba(19, 26, 48, 0.16)',
      },
      borderRadius: {
        md: '0.5rem',
        lg: '0.75rem',
      },
    },
  },
  plugins: [],
};
