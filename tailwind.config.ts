import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: { 50: "#eff4ff", 100: "#dbe6fe", 500: "#3b63d9", 600: "#2549b8", 700: "#1b3a94", 800: "#162e75", 900: "#0f1f52" },
        accent: { 50: "#f5f3ff", 100: "#ede9fe", 500: "#8b5cf6", 600: "#7c3aed", 700: "#6d28d9" },
      },
    },
  },
  plugins: [],
};
export default config;
