import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#F5F7FA",
        surface: "#FFFFFF",
        divider: "#E5E7EB",
        ink: {
          DEFAULT: "#111827",
          muted: "#6B7280",
        },
        brand: {
          DEFAULT: "#10B981",
          dark: "#047857",
          light: "#D1FAE5",
          muted: "#ECFDF5",
        },
        highlight: "#2563EB",
      },
      boxShadow: {
        elevated: "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)",
        "elevated-lg":
          "0 4px 12px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.06)",
        header: "0 1px 0 rgba(0,0,0,0.05)",
      },
      backgroundImage: {
        "login-pattern":
          "radial-gradient(circle at 20% 20%, rgba(16,185,129,0.08), transparent 40%), radial-gradient(circle at 80% 0%, rgba(37,99,235,0.06), transparent 35%)",
        "hero-accent":
          "linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(255,255,255,0) 60%)",
      },
    },
  },
  plugins: [],
};

export default config;
