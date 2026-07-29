import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0B0F14",
        panel: "#121821",
        panel2: "#161E29",
        hairline: "#1F2A36",
        fg: "#E6EDF3",
        muted: "#7C8B9B",
        signal: "#3DDC84",
        amber: "#FFB020",
        rose: "#FF5D5D",
        wire: "#5AA9E6",
      },
      fontFamily: {
        mono: ["JetBrains Mono", "IBM Plex Mono", "ui-monospace", "monospace"],
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        scan: "repeating-linear-gradient(0deg, rgba(61,220,132,0.04) 0px, rgba(61,220,132,0.04) 1px, transparent 1px, transparent 3px)",
      },
      keyframes: {
        sweep: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        pulse2: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.35" },
        },
      },
      animation: {
        sweep: "sweep 3.5s linear infinite",
        pulse2: "pulse2 1.6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
