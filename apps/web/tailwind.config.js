/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
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
        sans: ['Inter', 'sans-serif'],
        caveat: ['Caveat', 'cursive'],
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
