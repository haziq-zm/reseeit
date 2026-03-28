import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        cream: "#FBF9F5",
        sand: "#F0E8DC",
        wheat: "#D4C4B0",
        ink: "#0A0A0A",
        charcoal: "#1C1B19",
        /** Primary accent — warm umber, pairs with beige */
        accent: {
          DEFAULT: "#6B5344",
          hover: "#564333",
          soft: "#EDE6E0",
          muted: "#9A8476",
          foreground: "#FBF9F5",
        },
        /** Semantic budget tones (muted, not neon) */
        sage: "#5C6D5E",
        honey: "#C4A055",
        clay: "#B45A4E",
      },
      boxShadow: {
        soft:
          "0 2px 8px -2px rgba(27, 22, 18, 0.07), 0 8px 24px -6px rgba(27, 22, 18, 0.08)",
        "soft-dark": "0 2px 12px -2px rgba(0, 0, 0, 0.35)",
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.25rem",
      },
    },
  },
  plugins: [],
};
export default config;
