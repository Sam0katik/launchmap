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
          DEFAULT: "#e5e5e5",
          hover: "#fafafa",
          focus: "#d4d4d4",
          deep: "#3f3f46",
        },
        ink: {
          DEFAULT: "#fafafa",
          muted: "#a1a1aa",
          subtle: "#71717a",
          tertiary: "#52525b",
        },
        canvas: "#09090b",
        surface: {
          1: "#18181b",
          2: "#1f1f23",
          3: "#27272a",
          4: "#2e2e33",
        },
        hairline: {
          DEFAULT: "#27272a",
          strong: "#3f3f46",
          tertiary: "#52525b",
        },
        success: "#34d399",
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
