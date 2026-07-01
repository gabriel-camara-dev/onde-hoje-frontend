import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: 'var(--app-ink)',
        paper: 'var(--app-paper)',
        surface: 'var(--app-surface)',
        'surface-muted': 'var(--app-surface-muted)',
        contrast: 'var(--app-contrast)',
        'on-contrast': 'var(--app-on-contrast)',
        line: 'var(--app-line)',
        muted: 'var(--app-muted)',
        teal: {
          DEFAULT: 'var(--app-brand)',
          dark: 'var(--app-brand-strong)',
          soft: 'var(--app-brand-soft)',
        },
        coral: 'var(--app-brand)',
        amber: 'var(--app-accent)',
      },
      boxShadow: {
        panel: 'var(--app-shadow-panel)',
      },
    },
  },
  plugins: [],
} satisfies Config
