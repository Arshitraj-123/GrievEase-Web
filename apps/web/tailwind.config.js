/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        teal: {
          DEFAULT: '#00B894',
          50: '#F0FAF7',
          100: '#D7F5ED',
          200: '#B0EBDC',
          300: '#7FE0C7',
          400: '#00D4AA',
          500: '#00B894',
          600: '#00A383',
          700: '#00846A',
          800: '#006653',
          900: '#004D3F',
        },
        navy: {
          900: '#1A1A2E',
          800: '#22223B',
        },
        gray: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#718096',
          600: '#4A5568',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans Devanagari', 'sans-serif'],
        devanagari: ['Noto Sans Devanagari', 'sans-serif'],
        caveat: ['Caveat', 'cursive'],
      },
      fontSize: {
        'fluid-h1': ['clamp(2.75rem, 1.2rem + 4.6vw, 5.5rem)', { lineHeight: '1.08', letterSpacing: '-0.02em' }],
        'fluid-h2': ['clamp(2rem, 1.2rem + 2.4vw, 3.5rem)', { lineHeight: '1.18', letterSpacing: '-0.015em' }],
        'fluid-lead': ['clamp(1.25rem, 1.15rem + 0.5vw, 1.375rem)', { lineHeight: '1.65' }],
        'fluid-body': ['clamp(1.0625rem, 1rem + 0.3125vw, 1.125rem)', { lineHeight: '1.6' }],
        'fluid-card-title': ['clamp(1.25rem, 1.15rem + 0.35vw, 1.375rem)', { lineHeight: '1.3' }],
        'fluid-card-text': ['clamp(1rem, 0.95rem + 0.25vw, 1.0625rem)', { lineHeight: '1.55' }],
        'fluid-nav': ['clamp(1rem, 0.95rem + 0.25vw, 1.0625rem)', { lineHeight: '1.4' }],
        'fluid-btn': ['1.125rem', { lineHeight: '1.2' }],
        'fluid-label': ['0.875rem', { lineHeight: '1.3' }],
      },
      lineHeight: {
        'devanagari-body': '1.7',
        'devanagari-heading': '1.35',
      },
      maxWidth: {
        'fluid-container': '1440px',
        'fluid-container-2xl': '1600px',
      },
      boxShadow: {
        'card': '0 4px 20px rgba(0,0,0,0.08)',
        'teal-glow': '0 8px 30px rgba(0,184,148,0.25)',
        'teal-sm': '0 4px 15px rgba(0,184,148,0.35)',
      }
    },
  },
  plugins: [],
};
