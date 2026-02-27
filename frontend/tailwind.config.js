/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Claude-inspired warm accent
        terracotta: {
          50: '#faf6f3',
          100: '#f3ebe4',
          200: '#e8d5c7',
          300: '#d9b9a4',
          400: '#c9977d',
          500: '#c4704a',
          600: '#b06040',
          700: '#935037',
          800: '#7a4330',
          900: '#65382a',
        },
        // Warm muted neutral (replaces green)
        sage: {
          50: '#f7f6f4',
          100: '#eeedea',
          200: '#dddbd6',
          300: '#c5c2bb',
          400: '#a9a59d',
          500: '#908b82',
          600: '#7a756c',
          700: '#64605a',
          800: '#53504b',
          900: '#46443f',
        },
        // Subtle danger / error
        coral: {
          50: '#fef5f4',
          100: '#fde8e6',
          200: '#fbd0cc',
          300: '#f7aca5',
          400: '#ef7e74',
          500: '#dc5449',
          600: '#c43d33',
          700: '#a53028',
          800: '#892b25',
          900: '#712924',
        },
        // Warm neutral accent
        cream: {
          50: '#faf9f6',
          100: '#f4f1ec',
          200: '#eae6de',
          300: '#ddd7cc',
          400: '#ccc4b5',
          500: '#b5ab99',
          600: '#9f9484',
          700: '#867b6d',
          800: '#6e655a',
          900: '#5c544b',
        },
        // Warm neutral backbone
        sand: {
          50: '#f5f3ef',
          100: '#eeebe5',
          200: '#e0dbd3',
          300: '#cfc8bd',
          400: '#b5ada1',
          500: '#9b9286',
          600: '#837a6f',
          700: '#6b635a',
          800: '#524c45',
          900: '#1d1b19',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Helvetica', 'Arial', 'sans-serif'],
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        'soft': '0 1px 3px 0 rgba(0, 0, 0, 0.06), 0 1px 2px -1px rgba(0, 0, 0, 0.06)',
        'soft-lg': '0 4px 12px -2px rgba(0, 0, 0, 0.08), 0 2px 6px -2px rgba(0, 0, 0, 0.04)',
      },
    },
  },
  plugins: [],
}
