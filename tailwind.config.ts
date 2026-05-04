import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        fp: {
          ink: "var(--fp-ink)",
          "muted-ink": "var(--fp-muted-ink)",
          paper: "var(--fp-paper)",
          surface: "var(--fp-surface)",
          line: "var(--fp-line)",
          alex: "var(--fp-alex)",
          max: "var(--fp-max)",
          shared: "var(--fp-shared)",
          helper: "var(--fp-helper)",
          radar: "var(--fp-radar)",
          success: "var(--fp-success)",
          caution: "var(--fp-caution)",
          danger: "var(--fp-danger)"
        }
      },
      fontFamily: {
        sans: [
          "var(--font-geist-sans)",
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "sans-serif"
        ]
      },
      boxShadow: {
        soft: "0 12px 32px rgba(32, 33, 42, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
