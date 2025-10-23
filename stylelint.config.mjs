export default {
  extends: [
    "stylelint-config-standard",
    "stylelint-config-tailwindcss",
  ],
  rules: {
    "at-rule-no-unknown": [
      true,
      { ignoreAtRules: ["tailwind", "apply", "layer", "variants", "responsive", "screen"] },
    ],
    "no-descending-specificity": null,
    "color-function-notation": "modern",
  },
  ignoreFiles: [
    "**/*.js",
    "**/*.ts",
    "**/*.tsx",
    "**/*.json",
    "node_modules/**",
    ".next/**",
  ],
};
