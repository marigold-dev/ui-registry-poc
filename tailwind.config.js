/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./pages/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "ligo-light": "#4091ff",
        ligo: "#0e74ff",
        "ligo-dark": "#0e63d8",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
