import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
    "./src/app/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-poppins)", "sans-serif"], // set Poppins as default sans
        poppins: ["var(--font-poppins)", "sans-serif"], // or use `font-poppins`
      },
    },
  },
  plugins: [],
};
export default config;
