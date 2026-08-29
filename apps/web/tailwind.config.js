/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: '#030712',
          card: 'rgba(10, 15, 30, 0.7)',
          border: 'rgba(0, 210, 255, 0.15)',
          grid: 'rgba(0, 210, 255, 0.03)',
        },
        jarvis: {
          DEFAULT: '#00d2ff',
          glow: 'rgba(0, 210, 255, 0.4)',
        },
        ultron: {
          DEFAULT: '#ff003c',
          glow: 'rgba(255, 0, 60, 0.4)',
        },
        friday: {
          DEFAULT: '#ff7b00',
          glow: 'rgba(255, 123, 0, 0.4)',
        },
        karen: {
          DEFAULT: '#00ffd2',
          glow: 'rgba(0, 255, 210, 0.4)',
        },
        edith: {
          DEFAULT: '#9d4edd',
          glow: 'rgba(157, 78, 237, 0.4)',
        }
      },
      boxShadow: {
        'hud-jarvis': '0 0 20px rgba(0, 210, 255, 0.25)',
        'hud-ultron': '0 0 20px rgba(255, 0, 60, 0.25)',
        'hud-friday': '0 0 20px rgba(255, 123, 0, 0.25)',
        'hud-karen': '0 0 20px rgba(0, 255, 210, 0.25)',
        'hud-edith': '0 0 20px rgba(157, 78, 237, 0.25)',
      },
      animation: {
        'spin-slow': 'spin 12s linear infinite',
        'spin-reverse': 'spin-reverse 15s linear infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'matrix-scan': 'scan 6s linear infinite'
      },
      keyframes: {
        'spin-reverse': {
          '0%': { transform: 'rotate(360deg)' },
          '100%': { transform: 'rotate(0deg)' }
        },
        'scan': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' }
        }
      }
    },
  },
  plugins: [],
}
