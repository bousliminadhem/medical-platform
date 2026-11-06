import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Sophisticated Medical Emerald / Jade
        brand: {
          DEFAULT: "#00C982",
          glow: "#00C982",
          50:  "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          300: "#86efac",
          400: "#4ade80",
          500: "#00C982",
          600: "#059669",
          700: "#047857",
          800: "#065f46",
          900: "#064e3b",
        },
        // Clinical Soft Off-White Palette (Light Mode)
        clinical: {
          canvas: "#FFFFFF",
          subtle: "#F8F9FB",
          card: "#FFFFFF",
          muted: "#F1F3F6",
          border: "#E2E8F0",
          dark: "#0F172A",
        },
        // Dark Mode Obsidian Palette
        obsidian: {
          950: "#090A0E",
          900: "#13151C",
          850: "#181A23",
          800: "#1F222E",
          750: "#272A38",
          700: "#323748",
          600: "#43495D",
          500: "#5B637B",
        },
      },
      fontFamily: {
        sans: [
          "var(--font-sf-pro)",
          "-apple-system",
          "BlinkMacSystemFont",
          "'SF Pro Display'",
          "'SF Pro Text'",
          "'SF Pro'",
          "sans-serif",
        ],
        mono: [
          "var(--font-sf-pro)",
          "-apple-system",
          "BlinkMacSystemFont",
          "'SF Pro Display'",
          "'SF Pro Text'",
          "'SF Pro'",
          "sans-serif",
        ],
      },
      boxShadow: {
        soft: "0 2px 10px rgba(0, 0, 0, 0.03), 0 1px 3px rgba(0, 0, 0, 0.02)",
        subtle: "0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)",
        elevation: "0 10px 25px -5px rgba(0, 0, 0, 0.06), 0 8px 10px -6px rgba(0, 0, 0, 0.03)",
        glow: "0 0 25px -4px rgba(0, 201, 130, 0.25)",
        "glow-sm": "0 0 12px -2px rgba(0, 201, 130, 0.2)",
        glass: "0 12px 36px 0 rgba(0, 0, 0, 0.08)",
      },
      letterSpacing: {
        widest: ".1em",
        tightest: "-.02em",
      },
    },
  },
  plugins: [],
};

export default config;
