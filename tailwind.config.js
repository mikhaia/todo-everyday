module.exports = {
  content: ['./app.vue','./pages/**/*.{vue,ts}','./components/**/*.{vue,ts}'],
  theme: { extend: { fontFamily: { sans: ['Inter','ui-sans-serif','system-ui'] },
                     colors: { brand: 'var(--brand)' } } }
}
