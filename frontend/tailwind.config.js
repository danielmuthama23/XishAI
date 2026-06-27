/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        critical: '#E24B4A',
        serious:  '#EF9F27',
        moderate: '#DDB929',
        minor:    '#378ADD',
        info:     '#888780',
      },
    },
  },
  plugins: [],
}
