import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        sea: {
          50: "#f0f7f8",
          100: "#d9ecef",
          200: "#b3d9e0",
          300: "#7fbcc7",
          400: "#4d9daa",
          500: "#2f8290",
          600: "#256877",
          700: "#1f5361",
          800: "#1c434f",
          900: "#193944",
        },
        earth: {
          50: "#faf7f2",
          100: "#f3ebdd",
          200: "#e6d3b5",
          300: "#d4b585",
          400: "#c19558",
          500: "#a97a41",
          600: "#8f6236",
          700: "#734d2e",
          800: "#5f3f2a",
          900: "#503526",
        },
      },
      fontFamily: {
        sans: ['"Pretendard"', '"Noto Sans KR"', "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
