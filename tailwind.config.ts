import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
        display: ["var(--font-lexend)", "var(--font-inter)", "Inter", "system-ui", "sans-serif"],
      },
      colors: {
        brand: {
          50: "#eef1ff",
          100: "#e0e4ff",
          200: "#c6ccff",
          300: "#a3a9fd",
          400: "#8180f8",
          500: "#6c5cec",
          600: "#5b3fdb",
          700: "#4c31bc",
          800: "#3f2a97",
          900: "#362778",
          950: "#211549",
        },
      },
      boxShadow: {
        soft: "0 1px 2px 0 rgb(24 24 27 / 0.04), 0 1px 3px 0 rgb(24 24 27 / 0.06)",
        card: "0 2px 8px -2px rgb(24 24 27 / 0.06), 0 8px 24px -8px rgb(24 24 27 / 0.10)",
        "card-hover": "0 4px 14px -2px rgb(24 24 27 / 0.10), 0 16px 36px -12px rgb(24 24 27 / 0.16)",
        glow: "0 0 0 1px rgb(91 63 219 / 0.06), 0 12px 28px -10px rgb(91 63 219 / 0.45)",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "pulse-ring": {
          "0%": { transform: "scale(0.9)", opacity: "0.6" },
          "80%, 100%": { transform: "scale(1.6)", opacity: "0" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) both",
        "fade-in": "fade-in 0.4s ease-out both",
        "pulse-ring": "pulse-ring 1.8s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      backgroundImage: {
        "grid-fade":
          "radial-gradient(circle at 1px 1px, rgb(24 24 27 / 0.06) 1px, transparent 0)",
      },
    },
  },
  plugins: [],
};

export default config;
