import type { Config } from "tailwindcss";

// Tokens derived from Linear's DESIGN.md (awesome-design-md collection).
// Near-black canvas #010102, four-step surface ladder, single lavender accent.
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#5e6ad2",
          hover: "#828fff",
          focus: "#5e69d1",
        },
        ink: {
          DEFAULT: "#f7f8f8",
          muted: "#d0d6e0",
          subtle: "#8a8f98",
          tertiary: "#62666d",
        },
        canvas: "#010102",
        surface: {
          1: "#0f1011",
          2: "#141516",
          3: "#18191a",
          4: "#191a1b",
        },
        hairline: {
          DEFAULT: "#23252a",
          strong: "#34343a",
          tertiary: "#3e3e44",
        },
        success: "#27a644",
      },
      borderRadius: {
        xs: "4px",
        sm: "6px",
        md: "8px",
        lg: "12px",
        xl: "16px",
        xxl: "24px",
      },
      fontFamily: {
        // Inter is the documented free substitute for Linear's custom sans.
        sans: ["var(--font-inter)", "SF Pro Display", "-apple-system", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "SF Mono", "Menlo", "monospace"],
      },
      maxWidth: {
        content: "1280px",
      },
    },
  },
  plugins: [],
};

export default config;
