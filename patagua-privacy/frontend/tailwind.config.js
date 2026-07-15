/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "\"Segoe UI\"",
          "\"Helvetica Neue\"",
          "Arial",
          "sans-serif",
        ],
      },
      colors: {
        brand: "#0f766e",
        ink: "#17202a",
        canvas: "#f7f7f4",
        panel: "#ffffff",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(15, 23, 42, 0.04), 0 10px 30px rgba(15, 23, 42, 0.035)",
      },
    },
  },
  plugins: [],
};
