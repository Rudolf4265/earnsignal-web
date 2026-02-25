import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          950: "#0B1220",
          900: "#111827",
        },
        brand: {
          primary: "#1F3C88",
          blue: "#2F80ED",
          teal: "#2FD9C5",
        },
      },
      boxShadow: {
        brandGlow: "0 0 40px rgba(47,128,237,0.15)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
};

export default config;
