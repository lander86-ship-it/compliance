import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef4ff",
          100: "#dae6ff",
          200: "#bcd2ff",
          300: "#8fb4ff",
          400: "#5a8bff",
          500: "#3563e9",
          600: "#2447c4",
          700: "#1d3a9e",
          800: "#1c3480",
          900: "#1b2f68",
        },
        ink: "#0f172a",
      },
    },
  },
  plugins: [],
};

export default config;
