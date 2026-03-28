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
        /** Beige + black theme */
        cream: "#FBF9F5",
        sand: "#F0E8DC",
        wheat: "#D4C4B0",
        ink: "#0A0A0A",
        charcoal: "#1C1B19",
      },
    },
  },
  plugins: [],
};
export default config;
