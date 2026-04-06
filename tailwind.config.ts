import type { Config } from "tailwindcss";

// Golden ratio: 1.618
// Spacing scale: 5, 8, 13, 21, 34, 55, 89 (Fibonacci = closest integer φ progression)
const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background:  "var(--background)",
        foreground:  "var(--foreground)",
        border:      "var(--border)",

        // 4-point color blend palette
        accent: {
          DEFAULT:   "#00ff88",
          dim:       "#00cc6e",
          glow:      "rgba(0,255,136,0.08)",
        },
        teal: {
          DEFAULT:   "#00ddcc",
          glow:      "rgba(0,221,204,0.07)",
        },
        blue: {
          DEFAULT:   "#4488ff",
          dim:       "#2266dd",
          glow:      "rgba(68,136,255,0.08)",
        },
        violet: {
          DEFAULT:   "#aa66ff",
          dim:       "#8844dd",
          glow:      "rgba(170,102,255,0.08)",
        },
        danger:  "#ff4444",
        warning: "#ffaa44",

        // Surface scale
        surface: {
          0: "#0a0a0a",
          1: "#0e0e0e",
          2: "#111111",
          3: "#1a1a1a",
          4: "#222222",
        },
      },

      fontFamily: {
        mono: ["IBM Plex Mono", "monospace"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },

      // Golden ratio border radius: 4 · 6 · 10 · 16 · 24 · 32
      borderRadius: {
        none:  "0",
        xs:    "4px",
        sm:    "6px",
        md:    "10px",
        lg:    "16px",  // default
        xl:    "24px",
        "2xl": "32px",
        "3xl": "40px",
        full:  "9999px",
      },

      // Golden ratio spacing extensions
      spacing: {
        "phi-1": "5px",
        "phi-2": "8px",
        "phi-3": "13px",
        "phi-4": "21px",
        "phi-5": "34px",
        "phi-6": "55px",
        "phi-7": "89px",
      },

      // Typography scale (golden ratio from 12px base)
      fontSize: {
        "2xs":  ["10px",  { lineHeight: "14px" }],
        xs:     ["12px",  { lineHeight: "16px" }],
        sm:     ["13px",  { lineHeight: "20px" }],
        base:   ["15px",  { lineHeight: "24px" }],
        lg:     ["17px",  { lineHeight: "26px" }],
        xl:     ["21px",  { lineHeight: "30px" }],
        "2xl":  ["26px",  { lineHeight: "34px" }],
        "3xl":  ["32px",  { lineHeight: "40px" }],
        "4xl":  ["40px",  { lineHeight: "48px" }],
        "5xl":  ["52px",  { lineHeight: "58px" }],
        "6xl":  ["64px",  { lineHeight: "70px" }],
      },

      keyframes: {
        "fade-in": {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "fade-up": {
          "0%":   { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          "0%":   { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "slide-in-right": {
          "0%":   { opacity: "0", transform: "translateX(16px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "pulse-green": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(0,255,136,0.3)" },
          "50%":      { boxShadow: "0 0 0 8px rgba(0,255,136,0)" },
        },
        "shimmer": {
          "0%":   { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
      },

      animation: {
        "fade-in":        "fade-in 0.3s ease-out both",
        "fade-up":        "fade-up 0.4s cubic-bezier(0.16,1,0.3,1) both",
        "scale-in":       "scale-in 0.2s cubic-bezier(0.16,1,0.3,1) both",
        "slide-in-right": "slide-in-right 0.3s cubic-bezier(0.16,1,0.3,1) both",
        "pulse-green":    "pulse-green 2s infinite",
        "shimmer":        "shimmer 1.6s ease infinite",
      },

      // Box shadows with color blend
      boxShadow: {
        "glow-green":  "0 0 28px rgba(0,255,136,0.08), 0 0 60px rgba(0,255,136,0.03)",
        "glow-blue":   "0 0 28px rgba(68,136,255,0.08), 0 0 60px rgba(68,136,255,0.03)",
        "glow-violet": "0 0 28px rgba(170,102,255,0.08), 0 0 60px rgba(170,102,255,0.03)",
        "card":        "0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.6)",
        "card-hover":  "0 4px 16px rgba(0,0,0,0.5), 0 1px 3px rgba(0,0,0,0.6)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
