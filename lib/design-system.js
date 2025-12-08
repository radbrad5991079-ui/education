/**
 * BrainFuel Design System
 * A comprehensive design configuration for modern, premium UI
 */

export const designSystem = {
  // Color Palette - Professional gradient-ready colors
  colors: {
    // Primary brand colors
    primary: {
      50: '#f0f9ff',
      100: '#e0f2fe',
      200: '#bae6fd',
      300: '#7dd3fc',
      400: '#38bdf8',
      500: '#0ea5e9',
      600: '#0284c7',
      700: '#0369a1',
      800: '#075985',
      900: '#0c4a6e',
    },
    // Accent colors
    accent: {
      purple: {
        500: '#a855f7',
        600: '#9333ea',
        700: '#7e22ce',
      },
      pink: {
        500: '#ec4899',
        600: '#db2777',
      },
      cyan: {
        400: '#22d3ee',
        500: '#06b6d4',
      },
      emerald: {
        400: '#34d399',
        500: '#10b981',
      }
    },
    // Neutral colors
    dark: {
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
      950: '#020617',
    },
    // Semantic colors
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  },

  // Gradients - Modern, vibrant gradient combinations
  gradients: {
    primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    sunset: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    ocean: 'linear-gradient(135deg, #2193b0 0%, #6dd5ed 100%)',
    purple: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
    dark: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
    darkBlue: 'linear-gradient(135deg, #0f172a 0%, #1e40af 100%)',
    cosmic: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
    fire: 'linear-gradient(135deg, #ff6b6b 0%, #feca57 100%)',
    ice: 'linear-gradient(135deg, #00d2ff 0%, #3a7bd5 100%)',
  },

  // Spacing system (8px base)
  spacing: {
    xs: '0.25rem',    // 4px
    sm: '0.5rem',     // 8px
    md: '1rem',       // 16px
    lg: '1.5rem',     // 24px
    xl: '2rem',       // 32px
    '2xl': '3rem',    // 48px
    '3xl': '4rem',    // 64px
    '4xl': '6rem',    // 96px
  },

  // Typography system
  typography: {
    fontFamily: {
      sans: 'var(--font-geist-sans, ui-sans-serif, system-ui, -apple-system, sans-serif)',
      mono: 'var(--font-geist-mono, ui-monospace, monospace)',
    },
    fontSize: {
      xs: ['0.75rem', { lineHeight: '1rem' }],
      sm: ['0.875rem', { lineHeight: '1.25rem' }],
      base: ['1rem', { lineHeight: '1.5rem' }],
      lg: ['1.125rem', { lineHeight: '1.75rem' }],
      xl: ['1.25rem', { lineHeight: '1.75rem' }],
      '2xl': ['1.5rem', { lineHeight: '2rem' }],
      '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
      '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
      '5xl': ['3rem', { lineHeight: '1' }],
      '6xl': ['3.75rem', { lineHeight: '1' }],
    },
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
    }
  },

  // Shadows - Professional depth system
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    glow: '0 0 20px rgba(167, 139, 250, 0.3)',
    glowPurple: '0 0 30px rgba(168, 85, 247, 0.4)',
    glowCyan: '0 0 30px rgba(34, 211, 238, 0.4)',
    glowPink: '0 0 30px rgba(236, 72, 153, 0.4)',
  },

  // Border radius
  borderRadius: {
    none: '0',
    sm: '0.25rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    '2xl': '1.5rem',
    '3xl': '2rem',
    full: '9999px',
  },

  // Animation durations
  animation: {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
    slower: '1000ms',
  },

  // Easing functions
  easing: {
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    smooth: 'cubic-bezier(0.33, 1, 0.68, 1)',
  },

  // Breakpoints
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },

  // Z-index scale
  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modalBackdrop: 1040,
    modal: 1050,
    popover: 1060,
    tooltip: 1070,
  },
};

// Utility function to get gradient text classes
export const getGradientTextClass = (gradient = 'primary') => {
  return `bg-gradient-to-r ${gradient} bg-clip-text text-transparent`;
};

// Pre-built component variants
export const componentVariants = {
  button: {
    primary: 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105',
    secondary: 'bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-gray-600 text-white transition-all duration-300',
    ghost: 'bg-transparent hover:bg-white/10 border border-white/20 hover:border-white/40 text-white transition-all duration-300',
    danger: 'bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white shadow-lg transition-all duration-300',
    success: 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white shadow-lg transition-all duration-300',
  },
  card: {
    default: 'bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl shadow-xl hover:border-gray-700 transition-all duration-300',
    hover: 'bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl shadow-xl hover:border-purple-500/50 hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 hover:-translate-y-1',
    glow: 'bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl border border-purple-500/30 shadow-xl shadow-purple-500/20 hover:shadow-2xl hover:shadow-purple-500/40 transition-all duration-500',
  },
  input: {
    default: 'bg-gray-900/80 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30 transition-all duration-300',
    glow: 'bg-gray-900/80 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 focus:shadow-lg focus:shadow-purple-500/20 transition-all duration-300',
  }
};

export default designSystem;
