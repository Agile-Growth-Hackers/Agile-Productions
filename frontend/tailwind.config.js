/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Nasi', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Arial', 'sans-serif'],
      },
      keyframes: {
        'fade-up': {
          '0%': {
            opacity: '0',
            transform: 'translateY(40px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        'fade-down': {
          '0%': {
            opacity: '0',
            transform: 'translateY(-40px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        'fade-left': {
          '0%': {
            opacity: '0',
            transform: 'translateX(60px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateX(0)',
          },
        },
        'fade-right': {
          '0%': {
            opacity: '0',
            transform: 'translateX(-60px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateX(0)',
          },
        },
        'puzzle-slide-in': {
          '0%': {
            opacity: '0',
            transform: 'translate(var(--slide-x, 0), var(--slide-y, 0)) scale(0.8) rotate(var(--rotate, 0deg))',
          },
          '100%': {
            opacity: '1',
            transform: 'translate(0, 0) scale(1) rotate(0deg)',
          },
        },
        'scale-in': {
          '0%': {
            opacity: '0',
            transform: 'scale(0.9)',
          },
          '100%': {
            opacity: '1',
            transform: 'scale(1)',
          },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.8s ease-out forwards',
        'fade-down': 'fade-down 0.8s ease-out forwards',
        'fade-left': 'fade-left 0.8s ease-out forwards',
        'fade-right': 'fade-right 0.8s ease-out forwards',
        'puzzle-slide-in': 'puzzle-slide-in 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'scale-in': 'scale-in 0.6s ease-out forwards',

        // Delayed versions for stagger effects
        'fade-up-delay-100': 'fade-up 0.8s ease-out 0.1s forwards',
        'fade-up-delay-200': 'fade-up 0.8s ease-out 0.2s forwards',
        'fade-up-delay-300': 'fade-up 0.8s ease-out 0.3s forwards',
        'fade-up-delay-400': 'fade-up 0.8s ease-out 0.4s forwards',
      },
    },
  },
  plugins: [],
}
