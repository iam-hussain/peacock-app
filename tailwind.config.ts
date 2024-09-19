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
      // "no-touch": { raw: "(hover: hover) and (pointer: fine)" },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        info: {
          DEFAULT: "hsl(var(--info))",
          foreground: "hsl(var(--info-foreground))",
        },
        bw: {
          DEFAULT: "hsl(var(--bw))",
          foreground: "hsl(var(--bw-foreground))",
        },
        paper: {
          DEFAULT: "hsl(var(--paper))",
          dark: "hsl(var(--paper-dark))",
          foreground: "hsl(var(--paper-foreground))",
        },
        inactive: {
          DEFAULT: "hsl(var(--inactive))",
          foreground: "hsl(var(--inactive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
      fontFamily: {
        sans: ["Roboto-Regular", "sans-serif"],
        brand: ["BlackEcho", "sans-serif"],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;

export default config;
