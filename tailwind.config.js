/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#FF5A1F",
        accent: "#FFB703",
        background: "#FFF8F2",
        card: "#FFFFFF",
        text: "#1F2937",
        success: "#22C55E",
      },
    },
  },
  plugins: [],
};
