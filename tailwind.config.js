module.exports = {
  content: [
    './app/**/*.{vue,ts}'
  ],
  theme: {
    extend: {
      colors: {
        brand: 'var(--brand)',
        primary: 'var(--primary)',
        secondary: 'var(--secondary)',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 15px rgba(59,130,246,0.4)' },
          '50%': { boxShadow: '0 0 30px rgba(59,130,246,0.8)' }
        }
      },
      animation: {
        'pulse-glow': 'pulse-glow 3s ease-in-out infinite'
      }
    }
  }
}
