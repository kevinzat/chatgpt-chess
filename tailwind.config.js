/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'chess-dark': '#2c3e50',
        'chess-light': '#ecf0f1',
        'chess-accent': '#3498db',
        'chess-success': '#27ae60',
        'chess-warning': '#f39c12',
        'chess-error': '#e74c3c'
      }
    },
  },
  plugins: [],
} 