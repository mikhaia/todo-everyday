module.exports = {
  content: [
    './app.vue',
    './pages/**/*.{vue,ts}',
    './components/**/*.{vue,ts}'
  ],
  theme: {
    extend: {
      colors: {
        brand: 'var(--brand)',
        primary: 'var(--primary)',
        secondary: 'var(--secondary)',
      }
    }
  }
}