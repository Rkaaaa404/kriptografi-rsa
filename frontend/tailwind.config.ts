import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: {
          DEFAULT: "#f8fafc",
          subtle: "#f1f5f9",
          card: "#ffffff",
        },
        brand: {
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#1e293b",
          900: "#0f172a",
          950: "#09090b",
        },
        navy: {
          950: "#051118",
          900: "#081c26",
          850: "#0b222f",
          800: "#0f2b3b",
          700: "#183b4e",
        },
        finpay: {
          navy: "#081c26",
          dark: "#0b222f",
          cardDark: "#102c3d",
          teal: "#008579",
          mint: "#279b8c",
          lightTeal: "#e6f6f4",
        },
      },
      boxShadow: {
        subtle: "0 1px 2px 0 rgba(0, 0, 0, 0.04), 0 1px 3px 0 rgba(0, 0, 0, 0.02)",
        card: "0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 10px 15px -3px rgba(0, 0, 0, 0.02)",
        elevation: "0 4px 20px -2px rgba(0, 0, 0, 0.06), 0 2px 6px -1px rgba(0, 0, 0, 0.03)",
        finpay: "0 20px 40px -15px rgba(8, 28, 38, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.04)",
        cardFloat: "0 25px 50px -12px rgba(0, 133, 121, 0.25), 0 10px 20px -5px rgba(8, 28, 38, 0.15)",
      },
      keyframes: {
        fadeInUp: {
          "0%": { opacity: "0", transform: "translate3d(0, 24px, 0)" },
          "100%": { opacity: "1", transform: "translate3d(0, 0, 0)" },
        },
        fadeInDown: {
          "0%": { opacity: "0", transform: "translate3d(0, -16px, 0)" },
          "100%": { opacity: "1", transform: "translate3d(0, 0, 0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        floatGentle: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
      },
      animation: {
        "fade-in-up": "fadeInUp 0.65s cubic-bezier(0.16, 1, 0.3, 1) both",
        "fade-in-down": "fadeInDown 0.5s cubic-bezier(0.16, 1, 0.3, 1) both",
        "fade-in": "fadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) both",
        "scale-in": "scaleIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) both",
        "float-gentle": "floatGentle 4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
