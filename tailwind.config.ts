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
          DEFAULT: "#ff5310",
          hover: "#ff6a30",
          focus: "#e0440a",
          deep: "#c43e08",
        },
        ink: {
          DEFAULT: "#17150f",
          muted: "#5c564a",
          subtle: "#8a8170",
          tertiary: "#b3a98f",
        },
        canvas: "#f0ebdd",
        surface: {
          1: "#e9e2cf",
          2: "#e0d8c1",
          3: "#d6ccb0",
          4: "#cabd9c",
        },
        hairline: {
          DEFAULT: "#cbc1a8",
          strong: "#1c1a13",
          tertiary: "#a89f86",
        },
        success: "#1a7f4b",
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
