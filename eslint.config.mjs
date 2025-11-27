import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import domClobberPlugin from "./eslint-rules/dom-clobbering/index.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "dist/**",
      "coverage/**",
      "next-env.d.ts",
      "*.tsbuildinfo",
      ".env",
      ".env.*",
      "prisma/generated/**",
      ".turbo/**",
      ".cache/**",
    ],
  },
  {
    files: ["src/tests/**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  {
    files: ["cypress.config.ts", "cypress/**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-namespace": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  // DOM clobbering-only rules (applies to JS/TS files project-wide)
  {
    plugins: {
      "dom-clobbering": domClobberPlugin,
    },
    files: ["**/*.{ts,tsx,js,jsx}"],
    rules: {
      "dom-clobbering/no-var-replace": "error",
      "dom-clobbering/no-implicit-global-assign": "error",
      "dom-clobbering/no-window-document-global-assign": "error",
      "dom-clobbering/no-restricted-dom-names": "error",
    },
  },
];

export default eslintConfig;
