/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          black:    '#25282a',   // carvão escuro
          charcoal: '#35383a',   // carvão médio
          onyx:     '#473c32',   // marrom escuro
          smoke:    '#473c32',   // marrom p/ textos muted
          silver:   '#c7bfb8',   // taupe quente
          mist:     '#d9d3cc',   // taupe claro
          pearl:    '#f4f0e8',   // creme fundo
          cream:    '#faf8f4',   // creme mais claro
          gold:     '#b38779',   // rose/terracota — acento principal
          'gold-l': '#c9a199',   // terracota claro
          'gold-d': '#8f6b5f',   // terracota escuro
        },
        // Semantic badge colors
        rose:    { 50:'#fff1f2',100:'#ffe4e6',200:'#fecdd3',500:'#f43f5e',600:'#e11d48',700:'#be123c',800:'#9f1239',900:'#881337' },
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
        card:      '0 0 0 1px rgba(0,0,0,0.03), 0 2px 8px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.03)',
        'card-md': '0 0 0 1px rgba(0,0,0,0.06), 0 6px 16px rgba(0,0,0,0.08), 0 20px 40px rgba(0,0,0,0.06)',
        sidebar:   '8px 0 32px rgba(0,0,0,0.5)',
      },
    },
  },
  plugins: [],
}
