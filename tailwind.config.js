/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          cyan: '#00BCD4',
          'cyan-dark': '#00ACC1',
        },
        secondary: {
          purple: '#9C27B0',
          'purple-dark': '#8E24AA',
        },
        accent: {
          gold: '#FFD700',
          'gold-light': '#FFC107',
        },
      },
    },
  },
  plugins: [],
}
