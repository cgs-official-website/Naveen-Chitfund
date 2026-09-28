/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Naveen Chit Fund App Theme - Signature Maroon & Plum
        maroon: {
          50: '#FAF0F4',
          100: '#F5D2DF',
          200: '#E9A5BC',
          300: '#D47091',
          400: '#B8446B', // App darkTheme.maroon.primary
          500: '#9C2A50',
          600: '#7A1F3D', // App lightTheme.maroon.primary
          700: '#4E1327', // App lightTheme.maroon.deep
          800: '#3D2837', // App darkTheme.surface.border
          850: '#2E1D2A', // App darkTheme.surface.cardSubtle
          900: '#241620', // App darkTheme.surface.card
          950: '#160C10', // App darkTheme.surface.base
          primary: '#7A1F3D',
          deep: '#4E1327',
          light: '#B8446B',
        },
        // Re-mapped navy to App's Maroon/Plum scale for full seamless theme adoption
        navy: {
          950: '#160C10', // App darkTheme.surface.base (deep plum-black)
          900: '#241620', // App darkTheme.surface.card (dark plum card)
          850: '#2E1D2A', // App darkTheme.surface.cardSubtle
          800: '#3D2837', // App darkTheme.surface.border
          700: '#4E1327', // App lightTheme.maroon.deep
          600: '#7A1F3D', // App lightTheme.maroon.primary
          500: '#9C2A50',
          400: '#B8446B', // App darkTheme.maroon.primary
        },
        // App Theme - Warm Cream & Plum-Black Typography
        slate: {
          50: '#FFFDF9',  // App lightTheme.surface.base (warm cream base)
          100: '#FBF3E7', // App lightTheme.surface.card (warm card)
          150: '#F5EBDD', // App lightTheme.surface.cardSubtle
          200: '#E8DCCE', // App lightTheme.surface.border
          300: '#D9C7B6',
          400: '#9C888F', // App lightTheme.text.muted
          500: '#8A777E', // App darkTheme.text.muted
          600: '#6B5A60', // App lightTheme.text.secondary
          700: '#524047',
          800: '#3D2837', // App darkTheme.surface.border
          900: '#241016', // App lightTheme.text.primary (deep plum-black)
          950: '#160C10', // App darkTheme.surface.base
        },
        // App Theme - Royal Gold
        gold: {
          50: '#FFFDF5',
          100: '#FDF7E2',
          200: '#FAECC0',
          300: '#F4DE98',
          400: '#E3C567', // App darkTheme.gold.accent
          500: '#C9A227', // App lightTheme.gold.accent
          600: '#AA8318',
          700: '#85640F',
          accent: '#C9A227',
          light: '#E3C567',
        },
        // App Theme - Semantic Tokens
        semantic: {
          success: '#2E7D4F',
          successBg: '#E9F5EE',
          warning: '#B8860B',
          warningBg: '#FAF3DC',
          error: '#B3261E',
          errorBg: '#FCECEB',
          info: '#1A649B',
        },
      },
      fontFamily: {
        sans: ['Poppins', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        poppins: ['Poppins', 'sans-serif'],
      },
      borderRadius: {
        card: '12px',
        input: '8px',
      },
    },
  },
  plugins: [],
}
