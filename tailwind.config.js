/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class", // Enable class-based dark mode
  theme: {
    extend: {
      colors: {
        // Custom dark mode colors
        dark: {
          bg: "#0f172a",
          surface: "#1e293b",
          card: "#334155",
          text: "#f8fafc",
          muted: "#94a3b8",
        },
      },
    },
  },
  plugins: [],
};
