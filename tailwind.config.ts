import type { Config } from "tailwindcss";

const config = {
  darkMode: ["class"],
  content: ["./src/components/**/*.{ts,tsx}", "./src/app/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    screens: {
      sm: "640px",
      // => @media (min-width: 640px) { ... }
      // Small devices (phones, 640px and up)

      md: "768px",
      // => @media (min-width: 768px) { ... }
      // Medium devices (tablets, 768px and up)

      lg: "1024px",
      // => @media (min-width: 1024px) { ... }
      // Large devices (laptops/desktops, 1024px and up)

      xl: "1280px",
      // => @media (min-width: 1280px) { ... }
      // Extra large devices (large desktops, 1280px and up)

      "2xl": "1536px",
      // => @media (min-width: 1536px) { ... }
      // 2X large devices (larger desktops, 1536px and up)

      "3xl": "1920px",
      // => @media (min-width: 1920px) { ... }
      // 3X large devices (ultra wide desktops, 1920px and up)

      "4xl": "2560px",
      // => @media (min-width: 2560px) { ... }
      // 4X large devices (4K resolution, 2560px and up)

      "5xl": "3200px",
      // => @media (min-width: 3200px) { ... }
      // 5X large devices (5K resolution, 3200px and up)
      "no-touch": { raw: "(hover: hover) and (pointer: fine)" },
    },

    extend: {
      colors: {
        border: "#d1d6e0",
        input: "#c3d1e2",
        ring: "#c3d1e2",
        background: "#ffffff",
        foreground: "#392f49",
        primary: {
          DEFAULT: "#079e48",
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT: "#34aacd",
          foreground: "#ffffff",
        },
        destructive: {
          DEFAULT: "#f03b3b",
          foreground: "#f5f8fb",
        },
        info: {
          DEFAULT: "#2563eb",
          foreground: "#f5f8fb",
        },
        bw: {
          DEFAULT: "#ffffff",
          foreground: "#000000",
        },
        paper: {
          DEFAULT: "#e8edf5",
          dark: "#c9d1e0",
          foreground: "#ffffff",
        },
        inactive: {
          DEFAULT: "#737373",
          foreground: "#737373",
        },
        muted: {
          DEFAULT: "#e3e8f2",
          foreground: "#757b8e",
        },
        accent: {
          DEFAULT: "#c7d1e6",
          foreground: "#392f49",
        },
        popover: {
          DEFAULT: "#ffffff",
          foreground: "#392f49",
        },
        card: {
          DEFAULT: "#ffffff",
          foreground: "#392f49",
        },
      },
      borderRadius: {
        lg: "0.3rem",
        md: "calc(0.3rem - 2px)",
        sm: "calc(0.3rem - 4px)",
      },
      fontFamily: {
        sans: ["Roboto-Regular", "sans-serif"],
        serif: ["Poppins-Regular", "sans-serif"],
        // mono: ["BlackEcho", "sans-serif"],
        brand: ["BlackEcho", "sans-serif"],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;

export default config;
