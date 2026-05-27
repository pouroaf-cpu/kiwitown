import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: "#00AEEF",
        bg: "#0B0D12",
        surface: "#13161E",
        border: "#1E2230",
        muted: "#6B7280",
        text: {
          primary: "#F9FAFB",
          secondary: "#9CA3AF",
        },
      },
      fontFamily: {
        sans: ["DM Sans", "sans-serif"],
        display: ["Barlow Condensed", "sans-serif"],
      },
      boxShadow: {
        brand: "0 0 18px rgba(0, 174, 239, 0.65)",
      },
    },
  },
  plugins: [],
};

export default config;
