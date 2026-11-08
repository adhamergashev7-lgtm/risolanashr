import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

/** Qiymat agency brendbuki (2026) asosidagi palitra */
const config: Config = {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    container: { center: true, padding: "1rem", screens: { "2xl": "1400px" } },
    extend: {
      fontFamily: {
        sans: ["Inter Variable", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "system-ui", "sans-serif"],
        display: ["Outfit Variable", "Century Gothic", "Avenir Next", "system-ui", "sans-serif"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
        secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        accent: { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
        popover: { DEFAULT: "hsl(var(--popover))", foreground: "hsl(var(--popover-foreground))" },
        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
        qiymat: {
          DEFAULT: "#0E5A4D",
          80: "#3E7B71",
          60: "#6E9C94",
          40: "#9FBDB8",
        },
        graphite: { DEFAULT: "#222D2F", 80: "#4E5759", 60: "#7A8182", 40: "#A7ABAC" },
        sage: { DEFAULT: "#92B79C", 80: "#A8C5B0", 60: "#BED4C4", 40: "#D3E2D7" },
        deep: { DEFAULT: "#23463F", 80: "#4F6B65" },
        danger: "#B91C1C",
        warning: "#C2410C",
      },
      borderRadius: {
        sm: "6px",
        md: "12px",
        lg: "var(--radius)",
        xl: "16px",
        "2xl": "20px",
        "3xl": "24px",
      },
      keyframes: {
        "fade-up": { from: { opacity: "0", transform: "translateY(8px)" }, to: { opacity: "1", transform: "translateY(0)" } },
      },
      animation: { "fade-up": "fade-up 0.35s ease-out both" },
    },
  },
  plugins: [animate],
};

export default config;
