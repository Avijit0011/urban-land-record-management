/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f7ff',
          100: '#e0effe',
          500: '#0284c7',
          600: '#0369a1',
          700: '#075985',
          800: '#0c4a6e',
          900: '#0f172a',
        },
        gis: {
          parcel: '#0284c7',
          building: '#f59e0b',
          conflict: '#ef4444',
          verified: '#10b981',
          road: '#64748b'
        }
      }
    },
  },
  plugins: [],
}
