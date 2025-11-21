import domClobberPlugin from "./eslint-rules/dom-clobbering/index.mjs";
import tsParser from "@typescript-eslint/parser";
import tsEslintPlugin from "@typescript-eslint/eslint-plugin";
import reactHooksPlugin from "eslint-plugin-react-hooks";

export default [
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "dist/**",
      "coverage/**",
      "prisma/generated/**",
      "*.tsbuildinfo",
    ],
  },
  {
    // Only run the DOM clobbering rules across JS/TS files
    files: ["**/*.{ts,tsx,js,jsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: "module",
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      "dom-clobbering": domClobberPlugin,
      "@typescript-eslint": tsEslintPlugin,
      "react-hooks": reactHooksPlugin,
    },
    rules: {
      "dom-clobbering/no-var-replace": "error",
      "dom-clobbering/no-implicit-global-assign": "error",
      "dom-clobbering/no-window-document-global-assign": "error",
      "dom-clobbering/no-restricted-dom-names": "error",
    },
  },
];
