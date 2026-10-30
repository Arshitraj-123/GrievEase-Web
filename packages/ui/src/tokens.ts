export const colors = {
  primary: {
    50: '#f0fdfa',
    100: '#ccfbf1',
    200: '#99f6e4',
    300: '#5eead4',
    400: '#2dd4bf',
    500: '#14b8a6',
    600: '#0d9488', // Brand Teal
    700: '#0f766e',
    800: '#115e59',
    900: '#134e4a',
  },
  navy: {
    800: '#1e293b',
    900: '#0f172a', // Dark Navy
    950: '#020617',
  },
  neutral: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  },
  success: {
    50: '#f0fdf4',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
  },
  warning: {
    50: '#fffbeb',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
  },
  danger: {
    50: '#fef2f2',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
  },
} as const;

export const typography = {
  fontSans: 'var(--font-inter), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  fontDisplay: 'var(--font-outfit), sans-serif',
} as const;

// ─── Fluid Typography Design Tokens (PART 1 Requirement) ────────────────────
export const fluidTypography = {
  h1: 'clamp(2.75rem, 1.2rem + 4.6vw, 5.5rem)',
  h2: 'clamp(2rem, 1.2rem + 2.4vw, 3.5rem)',
  h3: 'clamp(1.5rem, 1.1rem + 1.2vw, 2.25rem)',
  lead: 'clamp(1.25rem, 1.15rem + 0.5vw, 1.375rem)', // 20-22px
  body: 'clamp(1.0625rem, 1rem + 0.3125vw, 1.125rem)', // 17px mobile -> 18px base desktop
  cardTitle: 'clamp(1.25rem, 1.15rem + 0.35vw, 1.375rem)', // 20-22px
  cardText: 'clamp(1rem, 0.95rem + 0.25vw, 1.0625rem)', // 16-17px
  navLink: 'clamp(1rem, 0.95rem + 0.25vw, 1.0625rem)', // 16-17px
  buttonText: '1.125rem', // 18px
  smallCaps: '0.875rem', // 14px
} as const;

export const lineHeights = {
  latin: {
    body: 1.5,
    heading: 1.15,
  },
  devanagari: {
    body: 1.7, // 1.65 - 1.75
    heading: 1.35, // 1.3 - 1.4
  },
} as const;

export const layout = {
  containerMaxWidth: '1440px',
  containerMaxWidth2xl: '1600px',
  containerPadding: 'clamp(1.5rem, 3vw, 3rem)', // 24-48px
  sectionPaddingY: 'clamp(3.5rem, 6vw, 6rem)', // 56-96px
  buttonHeight: '56px',
} as const;
