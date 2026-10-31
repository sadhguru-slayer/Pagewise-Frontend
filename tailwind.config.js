/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        accent: '#4ECDC4',
        accentDark: '#3B9B95',
        surface: '#0c0d12',
        surfaceElevated: '#13151f',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
