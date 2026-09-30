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
        obsidian: "var(--obsidian)",
        paper: "var(--paper)",
        cloud: "var(--cloud)",
        sky: "var(--sky)",
        charcoal: "var(--charcoal)",
        slate: "var(--slate)",
        ink: "var(--ink)",
        blue: "var(--blue)",
        line: "var(--line)",
        "soft-line": "var(--soft-line)",
        error: "var(--error)",
        // Festive accents
        festive: {
          gold: "#d4a017",
          amber: "#f59e0b",
          saffron: "#ff7722",
          vermilion: "#e63946",
          sacred: "#b33939",
          cream: "#fefae0",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Google Sans", "Inter", "sans-serif"],
        ui: ["var(--font-ui)", "Inter", "sans-serif"],
        text: ["var(--font-text)", "Open Sans", "sans-serif"],
      },
      boxShadow: {
        feature: "var(--feature-shadow)",
        button: "var(--button-shadow)",
        elevated: "0 10px 30px -5px rgba(7, 7, 9, 0.08)",
        fab: "0 8px 24px -2px rgba(37, 151, 208, 0.4)",
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
      animation: {
        pulse_subtle: "pulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        wave: "wave 1.2s ease-in-out infinite",
      },
      keyframes: {
        wave: {
          "0%, 100%": { transform: "scaleY(0.4)" },
          "50%": { transform: "scaleY(1.0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
