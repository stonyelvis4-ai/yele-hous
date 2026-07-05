/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        obsidian: '#120f14',
        midnight: '#1b1520',
        berry: '#a54c82',
        orchid: '#7754b5',
        gold: '#c7a46a',
        sand: '#efe3d1'
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        mono: ['"Space Grotesk"', 'ui-sans-serif', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        halo: '0 0 0 1px rgba(255,255,255,0.08), 0 24px 90px rgba(0,0,0,0.38)',
        glow: '0 12px 60px rgba(165,76,130,0.28)'
      }
    }
  },
  plugins: []
}
