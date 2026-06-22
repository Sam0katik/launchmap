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
          DEFAULT: "#ff6a14",
          hover: "#ff8438",
          focus: "#ff5c00",
          deep: "#c44400",
        },
        ink: {
          DEFAULT: "#1b1a16",
          muted: "#56524a",
          subtle: "#847f72",
          tertiary: "#a39d8c",
        },
        canvas: "#e6e2d6",
        surface: {
          1: "#efece2",
          2: "#e3dfd2",
          3: "#d8d3c4",
          4: "#ccc6b4",
        },
        hairline: {
          DEFAULT: "#cfc9b8",
          strong: "#1b1a16",
          tertiary: "#a39d8c",
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
