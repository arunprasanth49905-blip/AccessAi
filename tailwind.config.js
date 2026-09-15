/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#0f172a',
        },
        contrast: {
          bg: 'var(--contrast-bg)',
          card: 'var(--contrast-card)',
          text: 'var(--contrast-text)',
          accent: 'var(--contrast-accent)',
          border: 'var(--contrast-border)',
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      animation: {
        'pulse-subtle': 'pulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'radar-sweep': 'radarSweep 2.2s linear infinite',
        'ping-slow': 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
        'wave-bar': 'waveBar 1.2s ease-in-out infinite alternate',
      },
      keyframes: {
        radarSweep: {
          '0%': { transform: 'translateY(0%)', opacity: '0.8' },
          '50%': { opacity: '1' },
          '100%': { transform: 'translateY(100%)', opacity: '0.2' },
        },
        waveBar: {
          '0%': { transform: 'scaleY(0.2)' },
          '100%': { transform: 'scaleY(1.0)' },
        }
      },
      boxShadow: {
        'focus-ring': '0 0 0 4px rgba(37, 99, 235, 0.5)',
        'focus-ring-contrast': '0 0 0 4px #FFE600',
        'card-elevated': '0 8px 30px rgba(0, 0, 0, 0.08)',
      }
    },
  },
  plugins: [],
}
