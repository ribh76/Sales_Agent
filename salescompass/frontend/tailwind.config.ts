import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#18211f",
        field: "#f6f8f5",
        line: "#dfe7df",
        signal: "#0f766e",
        caution: "#a16207",
        coral: "#b45309"
      },
      boxShadow: {
        panel: "0 1px 2px rgba(24, 33, 31, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;

