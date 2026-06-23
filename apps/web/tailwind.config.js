/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        // Arabic-script rendering (loaded in index.css). (§11)
        naskh: ['"Noto Naskh Arabic"', 'Amiri', 'serif'],
        // Elegant serif for headings — scholarly feel.
        serif: ['Fraunces', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Warm parchment + ink palette.
        ink: {
          50: '#f8f4ec',
          100: '#ece3d4',
          200: '#dccdb6',
          300: '#c3ad8d',
          700: '#6f6253',
          800: '#453d33',
          900: '#2a251f',
        },
        // Deep teal-green — Islamic-art accent.
        brand: {
          50: '#edf7f5',
          100: '#d2ece7',
          500: '#15807a',
          600: '#0f6b66',
          700: '#0d5753',
          800: '#0c4744',
        },
        gold: {
          400: '#cBa06a',
          500: '#b0814f',
          600: '#946841',
        },
      },
      boxShadow: {
        card: '0 1px 2px rgba(42,37,31,0.04), 0 8px 24px -12px rgba(42,37,31,0.12)',
      },
      borderRadius: {
        xl: '0.9rem',
      },
    },
  },
  plugins: [],
};
