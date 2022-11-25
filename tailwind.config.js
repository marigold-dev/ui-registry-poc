/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./pages/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ligo: "#0e74ff",
        "ligo-dark": "#0e63d8",
      },
    },
  },
  plugins: [],
};
