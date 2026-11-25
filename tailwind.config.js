/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: '#FAF7F2',
        stone: '#F2EDE4',
        ink: '#18181B',
        pine: {
          50: '#ECFDF5',
          100: '#D1FAE5',
          200: '#A7F3D0',
          600: '#15803D',
          700: '#0F5132',
          800: '#0B3D26',
          900: '#072A1A',
        },
        vermilion: {
          50: '#FFF7ED',
          100: '#FFEDD5',
          400: '#FB923C',
          600: '#EA580C',
          700: '#C2410C',
          800: '#9A3412',
        },
      },
      fontFamily: {
        display: ['Bricolage Grotesque', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
