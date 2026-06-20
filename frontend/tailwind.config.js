/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
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
            transform: 'translateY(80px)',
          },
          '100%': {
            opacity: '1',
            transform: 'none',
          },
        },
        'fade-down': {
          '0%': {
            opacity: '0',
            transform: 'translateY(-80px)',
          },
          '100%': {
            opacity: '1',
            transform: 'none',
          },
        },
        'fade-left': {
          '0%': {
            opacity: '0',
            transform: 'translateX(100px)',
          },
          '100%': {
            opacity: '1',
            transform: 'none',
          },
        },
        'fade-right': {
          '0%': {
            opacity: '0',
            transform: 'translateX(-100px)',
          },
          '100%': {
            opacity: '1',
            transform: 'none',
          },
        },
        'puzzle-slide-in': {
          '0%': {
            opacity: '0',
            transform: 'translate(var(--slide-x, 0), var(--slide-y, 0)) scale(0.8) rotate(var(--rotate, 0deg))',
          },
          '100%': {
            opacity: '1',
            // Resolve to `none` (identity) so the element drops its GPU layer
            // after the animation instead of holding a transform forever.
            transform: 'none',
          },
        },
        'scale-in': {
          '0%': {
            opacity: '0',
            transform: 'scale(0.9)',
          },
          '100%': {
            opacity: '1',
            transform: 'none',
          },
        },
      },
      animation: {
        'fade-up': 'fade-up 1.2s ease-in-out forwards',
        'fade-down': 'fade-down 1.2s ease-in-out forwards',
        'fade-left': 'fade-left 1.2s ease-in-out forwards',
        'fade-right': 'fade-right 1.2s ease-in-out forwards',
        'puzzle-slide-in': 'puzzle-slide-in 1s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'scale-in': 'scale-in 1s ease-in-out forwards',

        // Delayed versions for stagger effects
        'fade-up-delay-100': 'fade-up 1.2s ease-in-out 0.1s forwards',
        'fade-up-delay-200': 'fade-up 1.2s ease-in-out 0.2s forwards',
        'fade-up-delay-300': 'fade-up 1.2s ease-in-out 0.3s forwards',
        'fade-up-delay-400': 'fade-up 1.2s ease-in-out 0.4s forwards',
      },
    },
  },
  plugins: [],
}
