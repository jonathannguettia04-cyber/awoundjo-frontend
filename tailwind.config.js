/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#EBF2FF",
          100: "#C3D9FF",
          500: "#1A56DB",
          600: "#1041A3",
          700: "#0D3380",
        },
        success: { 50: "#ECFDF5", 500: "#06C270", 700: "#047857" },
        warning: { 50: "#FFF7ED", 500: "#F59E0B" },
        danger:  { 50: "#FEF2F2", 500: "#EF4444" },
      },
      fontFamily: {
        sans: ["'Poppins'", "sans-serif"],
      },
    },
  },
  plugins: [],
};
