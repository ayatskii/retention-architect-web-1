/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: '#ccff00',
        background: '#000000',
        surface: '#0a0a0a',
        error: '#ff0055',
        muted: '#1a1a1a',
      },
      fontSize: {
        '10xl': '10rem',
        'display': '5rem',
      },
      backdropBlur: {
        xl: '20px',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
