/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        slate: {
          750: '#1e2d45',
        },
      },
      fontFamily: {
        display: ['Barlow', 'sans-serif'],
        mono:    ['Share Tech Mono', 'monospace'],
      },
      boxShadow: {
        'glow-red':    '0 0 20px rgba(248,113,113,0.25)',
        'glow-green':  '0 0 20px rgba(74,222,128,0.25)',
        'glow-cyan':   '0 0 20px rgba(34,211,238,0.25)',
        'glow-yellow': '0 0 20px rgba(250,204,21,0.25)',
      },
    },
  },
  plugins: [],
}