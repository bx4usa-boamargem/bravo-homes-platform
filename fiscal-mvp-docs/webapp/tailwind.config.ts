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
        primary: "var(--color-primary)",
        action: "var(--color-action)",
        surface: "var(--color-surface)",
        card: "var(--color-card)",
        "text-primary": "var(--color-text-primary)",
        "text-secondary": "var(--color-text-secondary)",
        limpo: {
          bg: "var(--color-limpo-bg)",
          text: "var(--color-limpo-text)",
          border: "var(--color-limpo-border)",
        },
        pendente: {
          bg: "var(--color-pendente-bg)",
          text: "var(--color-pendente-text)",
          border: "var(--color-pendente-border)",
        },
        falha: {
          bg: "var(--color-falha-bg)",
          text: "var(--color-falha-text)",
          border: "var(--color-falha-border)",
        },
        verificacao: {
          bg: "var(--color-verificacao-bg)",
          text: "var(--color-verificacao-text)",
          border: "var(--color-verificacao-border)",
        },
      },
    },
  },
  plugins: [],
};
export default config;
