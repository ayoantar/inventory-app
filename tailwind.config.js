/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        // LSVR Brand Colors - Eye-friendly version
        brand: {
          orange: '#F54F29',
          'orange-soft': '#FF6B4A', // Softer orange for less harsh contrast
          'dark-blue': '#1A2332', // Lighter than original #0C1119 for less harshness
          'dark-blue-deep': '#0F1621', // Slightly lighter alternative
          black: '#0A0C0F', // Softer than pure black #020305
          'primary-text': '#F8F9FA', // Softer white
          'secondary-text': '#C5CAD6', // Brighter than #B8BEC9 for better legibility
          'secondary-text-alt': '#E2E4E7', // Softer than #D6D5D5
        },
        // Override default colors with brand colors
        primary: {
          50: '#FEF2F0',
          100: '#FDE4E0',
          200: '#FBCDC7',
          300: '#F7A8A0',
          400: '#F27B70',
          500: '#F54F29', // Brand orange
          600: '#E63E1F',
          700: '#C2321A',
          800: '#A02C19',
          900: '#85291B',
        },
        gray: {
          50: '#F8F9FA',
          100: '#F1F3F4',
          200: '#E8EAED',
          300: '#DADCE0',
          400: '#E2E4E7', // Softer secondary text
          500: '#C5CAD6', // Brighter secondary text for better legibility
          600: '#8A919B', // Less harsh than original
          700: '#6B7280', // Softer medium gray
          800: '#4B5563', // Less harsh dark gray
          850: '#2D3748', // New intermediate shade
          900: '#1A2332', // Softer dark blue background
          925: '#0F1621', // Alternative dark background
          950: '#0A0C0F', // Softer black background
        },
      },
    },
  },
  plugins: [],
}