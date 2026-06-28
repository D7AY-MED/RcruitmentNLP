import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./index.html",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        display: ["Space Grotesk", "Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      colors: {
        /* ── Brand roles (legacy names preserved) ── */
        brand: {
          DEFAULT: "var(--brand)",
          hover: "var(--brand-hover)",
          light: "var(--brand-light)",
          contrast: "var(--brand-contrast)",
          50: "hsl(var(--indigo-50))",
          100: "hsl(var(--indigo-100))",
          200: "hsl(var(--indigo-200))",
          300: "hsl(var(--indigo-300))",
          400: "hsl(var(--indigo-400))",
          500: "hsl(var(--indigo-500))",
          600: "hsl(var(--indigo-600))",
          700: "hsl(var(--indigo-700))",
          800: "hsl(var(--indigo-800))",
          900: "hsl(var(--indigo-900))",
        },
        "brand-accent": {
          DEFAULT: "var(--accent)",
          hover: "var(--accent-hover)",
          50: "hsl(var(--blue-50))",
          100: "hsl(var(--blue-100))",
          500: "hsl(var(--blue-500))",
          600: "hsl(var(--blue-600))",
          700: "hsl(var(--blue-700))",
        },

        /* ── Cyan accent (AI / live / insights — use sparingly) ── */
        cyan: {
          DEFAULT: "var(--cyan)",
          hover: "var(--cyan-hover)",
          soft: "var(--cyan-soft)",
          50: "hsl(var(--cyan-50))",
          100: "hsl(var(--cyan-100))",
          300: "hsl(var(--cyan-300))",
          400: "hsl(var(--cyan-400))",
          500: "hsl(var(--cyan-500))",
          600: "hsl(var(--cyan-600))",
          700: "hsl(var(--cyan-700))",
        },

        /* ── Semantic surface roles ── */
        bg: "var(--bg)",
        "bg-subtle": "var(--bg-subtle)",
        surface: "var(--surface)",
        "surface-2": "var(--surface-2)",
        ink: "var(--ink)",
        "text-muted": "var(--text-muted)",
        "border-brand": "var(--border-color)",
        "border-strong": "var(--border-strong)",

        /* ── Status ── */
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
          soft: "hsl(var(--success-soft))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
          soft: "hsl(var(--warning-soft))",
        },
        danger: {
          DEFAULT: "hsl(var(--danger))",
          foreground: "hsl(var(--danger-foreground))",
          soft: "hsl(var(--danger-soft))",
        },
        info: {
          DEFAULT: "hsl(var(--info))",
          soft: "hsl(var(--info-soft))",
        },

        muted: {
          DEFAULT: "var(--muted)",
          foreground: "hsl(var(--muted-foreground))",
        },

        /* ── Shadcn compat (existing dashboard/components use these) ── */
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
        "2xl": "calc(var(--radius) + 6px)",
        xl: "calc(var(--radius) + 2px)",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 4px)",
        sm: "calc(var(--radius) - 6px)",
      },
      boxShadow: {
        xs: "var(--shadow-xs)",
        sm: "var(--shadow-sm)",
        DEFAULT: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        xl: "var(--shadow-xl)",
        glow: "var(--shadow-glow)",
      },
      backgroundImage: {
        "grad-brand": "var(--grad-brand)",
        "grad-brand-soft": "var(--grad-brand-soft)",
        "grad-ai": "var(--grad-ai)",
        "grad-mesh": "var(--grad-mesh)",
      },
      transitionTimingFunction: {
        smooth: "cubic-bezier(0.16, 1, 0.3, 1)",
        spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
      keyframes: {
        fadeUp: {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          from: { opacity: "0", transform: "scale(0.96)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },
      },
      animation: {
        "fade-up": "fadeUp 600ms cubic-bezier(0.16,1,0.3,1) both",
        "scale-in": "scaleIn 200ms cubic-bezier(0.16,1,0.3,1) both",
        shimmer: "shimmer 1.4s ease infinite",
      },
    },
  },
  plugins: [],
};
export default config;
