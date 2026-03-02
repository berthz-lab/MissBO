/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          black:    '#0A0A0A',
          charcoal: '#1C1C1C',
          onyx:     '#2D2D2D',
          smoke:    '#4A4A4A',
          silver:   '#8A8A8A',
          mist:     '#D4D4D4',
          pearl:    '#F5F3F0',
          cream:    '#FDFCFB',
          gold:     '#C9A96E',
          'gold-l': '#E0C99A',
          'gold-d': '#9A7A45',
        },
        // Keep semantic badge colors
        rose:  { 50:'#fff1f2',100:'#ffe4e6',200:'#fecdd3',500:'#f43f5e',600:'#e11d48',700:'#be123c',800:'#9f1239' },
        emerald: { 50:'#ecfdf5',100:'#d1fae5',600:'#059669',700:'#047857' },
        amber:   { 50:'#fffbeb',100:'#fef3c7',600:'#d97706',700:'#b45309' },
        blue:    { 50:'#eff6ff',100:'#dbeafe',600:'#2563eb',700:'#1d4ed8' },
        purple:  { 50:'#faf5ff',100:'#ede9fe',600:'#9333ea',700:'#7e22ce' },
      },
      fontFamily: {
        serif: ["'Playfair Display'", 'Georgia', 'serif'],
        sans:  ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card:      '0 0 0 1px rgba(0,0,0,0.04), 0 2px 8px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)',
        'card-md': '0 0 0 1px rgba(0,0,0,0.06), 0 6px 16px rgba(0,0,0,0.08), 0 20px 40px rgba(0,0,0,0.06)',
        sidebar:   '8px 0 32px rgba(0,0,0,0.5)',
      },
    },
  },
  plugins: [],
}
