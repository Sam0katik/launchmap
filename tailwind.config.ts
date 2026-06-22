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
          hover: "#ff7a3c",
          focus: "#ff6a30",
          deep: "#c43e08",
        },
        ink: {
          DEFAULT: "#f1e9d6",
          muted: "#b9ae93",
          subtle: "#8b8167",
          tertiary: "#645b46",
        },
        canvas: "#19150f",
        surface: {
          1: "#2a2417",
          2: "#332d1e",
          3: "#3d3624",
          4: "#47402b",
        },
        hairline: {
          DEFAULT: "#3a3325",
          strong: "#5b5238",
          tertiary: "#2a2418",
        },
        success: "#5fcf8f",
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
