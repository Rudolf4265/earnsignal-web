import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          950: "var(--es-color-bg)",
          900: "var(--es-color-bg-elevated)",
          850: "var(--es-color-panel)",
        },
        brand: {
          primary: "var(--es-color-accent-blue-strong)",
          blue: "var(--es-color-accent-blue)",
          teal: "var(--es-color-accent-teal)",
          emerald: "var(--es-color-accent-emerald)",
          border: "var(--es-color-border)",
          panel: "var(--es-color-panel)",
          panelMuted: "var(--es-color-panel-muted)",
          text: "var(--es-color-text-primary)",
          textMuted: "var(--es-color-text-secondary)",
        },
      },
      boxShadow: {
        brandGlow: "var(--es-shadow-glow)",
        brandCard: "var(--es-shadow-card)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
};

export default config;
