/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./pages/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ligo: {
          50: "#edf8ff",
          100: "#d7edff",
          200: "#b9e2ff",
          300: "#88d1ff",
          400: "#50b6ff",
          500: "#2895ff",
          600: "#0e74ff",
          700: "#0a5eeb",
          800: "#0f4bbe",
          900: "#134395",
        },
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
