/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Outfit', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        // Electric indigo — the ONE accent. Everything else is achromatic.
        primary: {
          50:  'oklch(0.96 0.040 280)',
          100: 'oklch(0.91 0.080 280)',
          200: 'oklch(0.84 0.130 280)',
          300: 'oklch(0.76 0.185 280)',
          400: 'oklch(0.68 0.225 280)',
          500: 'oklch(0.60 0.260 280)',  // electric indigo: white text at 4.6:1
          600: 'oklch(0.52 0.250 280)',
          700: 'oklch(0.44 0.220 280)',
          800: 'oklch(0.34 0.180 280)',
          900: 'oklch(0.24 0.140 280)',
        },
        // Vivid gain green — pops hard against neutral bg
        gain: {
          DEFAULT: 'oklch(0.64 0.19 150)',
          light: 'oklch(0.94 0.06 150)',
          dark: 'oklch(0.46 0.17 150)',
        },
        // Electric loss red
        loss: {
          DEFAULT: 'oklch(0.58 0.21 18)',
          light: 'oklch(0.95 0.05 18)',
          dark: 'oklch(0.43 0.18 18)',
        },
        // Near-achromatic surface scale — ghost indigo tint (chroma 0.002-0.010)
        surface: {
          50:  'oklch(0.985 0.002 280)', // near-white
          100: 'oklch(0.958 0.003 280)',
          200: 'oklch(0.918 0.003 280)',
          300: 'oklch(0.838 0.004 280)',
          400: 'oklch(0.678 0.005 280)',
          500: 'oklch(0.518 0.005 280)',
          600: 'oklch(0.388 0.006 280)',
          700: 'oklch(0.268 0.007 280)',
          800: 'oklch(0.172 0.008 280)',
          900: 'oklch(0.108 0.009 280)', // near-black
          950: 'oklch(0.070 0.010 280)', // OLED black w/ ghost indigo
        },
      },
    },
  },
  plugins: [],
}
