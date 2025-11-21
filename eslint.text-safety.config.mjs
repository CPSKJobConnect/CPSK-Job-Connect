import tsParser from '@typescript-eslint/parser';

export default [
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
    },
    rules: {
      // Disallow eval
      'no-eval': 'error',
      // Disallow Function constructor
      'no-new-func': 'error',
      // Keep the rule set minimal here; use the dedicated scanner script for innerHTML/dangerouslySetInnerHTML detection
    },
  },
];
