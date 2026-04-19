import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        juris: {
          navy: "#0A2240",
          red: "#BC2F2C",
          paper: "#FBFAF7",
          "paper-2": "#F5F3EE",
          ink: "#0A2240",
          "ink-2": "#2A3B54",
          "ink-3": "#5A6B82",
          "ink-4": "#8895AB",
          line: "#E5E9F0",
          "line-2": "#EEF1F6",
          "navy-50": "#F4F7FB",
          "navy-100": "#E8EEF5",
          "navy-200": "#D1DCE9",
          success: "#1F7A4E",
          warn: "#B4701C",
          info: "#1F5AA8",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
        serif: ["var(--font-playfair)", "'Playfair Display'", "Georgia", "serif"],
        mono: ["var(--font-jetbrains)", "'JetBrains Mono'", "ui-monospace", "monospace"],
      },
      borderRadius: {
        xs: "4px",
        sm: "6px",
        md: "10px",
        lg: "14px",
        xl: "20px",
      },
      boxShadow: {
        "juris-sm": "0 1px 2px rgba(10,34,64,0.05), 0 1px 1px rgba(10,34,64,0.03)",
        "juris-md": "0 4px 12px rgba(10,34,64,0.06), 0 1px 3px rgba(10,34,64,0.04)",
        "juris-lg": "0 12px 32px rgba(10,34,64,0.10), 0 2px 6px rgba(10,34,64,0.05)",
        "juris-pop": "0 16px 48px rgba(10,34,64,0.18)",
      },
      keyframes: {
        fade: { from: { opacity: "0" }, to: { opacity: "1" } },
        slideIn: {
          from: { transform: "translateX(40px)", opacity: "0" },
          to: { transform: "translateX(0)", opacity: "1" },
        },
        modalIn: {
          from: { opacity: "0", transform: "translateY(10px) scale(0.98)" },
          to: { opacity: "1", transform: "translateY(0) scale(1)" },
        },
      },
      animation: {
        fade: "fade 200ms ease-out",
        slideIn: "slideIn 240ms ease-out",
        modalIn: "modalIn 200ms ease-out",
      },
    },
  },
  plugins: [],
} satisfies Config;
