/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        'mc-dark': '#1a1a2e',
        'mc-darker': '#0f0f1a',
        'mc-accent': '#e94560',
        'mc-accent2': '#533483',
        'mc-surface': '#16213e',
        'mc-surface2': '#1f2b47',
        'mc-green': '#4ade80',
        'mc-yellow': '#fbbf24',
        'mc-red': '#ef4444',
      },
    },
  },
  plugins: [],
};
