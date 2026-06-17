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
          DEFAULT: "#22d3ee",
          hover: "#67e8f9",
          focus: "#06b6d4",
          deep: "#0e7490",
        },
        ink: {
          DEFAULT: "#f4f4f5",
          muted: "#c4c4c8",
          subtle: "#8b8b92",
          tertiary: "#5f5f66",
        },
        canvas: "#0a0a0b",
        surface: {
          1: "#141416",
          2: "#18181b",
          3: "#1c1c1f",
          4: "#202024",
        },
        hairline: {
          DEFAULT: "#2a2a2e",
          strong: "#3a3a3e",
          tertiary: "#46464c",
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
        // Inter = body (readable). Pixel = display detail only.
        sans: ["var(--font-inter)", "SF Pro Display", "-apple-system", "system-ui", "sans-serif"],
        pixel: ["var(--font-pixel)", "ui-monospace", "monospace"],
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
