/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17202a",
        cloud: "#f6f8fb",
        line: "#dce3ea",
        brand: "#0f766e",
        accent: "#2563eb",
        warning: "#b45309",
      },
      boxShadow: {
        soft: "0 18px 50px rgba(23, 32, 42, 0.08)",
      },
    },
  },
  plugins: [],
};
