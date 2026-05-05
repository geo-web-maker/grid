/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#042C53',
          800: '#0C447C',
          700: '#185FA5',
          100: '#B5D4F4',
          50:  '#E6F1FB',
        },
        teal: {
          700: '#0F6E56',
          500: '#1D9E75',
          200: '#9FE1CB',
          50:  '#E1F5EE',
        },
      },
      fontFamily: {
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}
