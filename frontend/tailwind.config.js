/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#14203a",
        paper: "#f7f7f5",
        route: {
          DEFAULT: "#2f6f5e",
          light: "#e7f1ee",
          dark: "#1f4a3e",
        },
        signal: "#c1652f",
      },
      fontFamily: {
        display: ["'Fraunces'", "serif"],
        body: ["'Inter'", "sans-serif"],
      },
    },
  },
  plugins: [],
};
