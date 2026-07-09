// @ts-check
import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import eslintConfigPrettier from 'eslint-config-prettier';
import globals from 'globals';

export default [
  js.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        sourceType: 'module',
        ecmaVersion: 2022,
      },
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      // TypeScript itself already catches genuinely undefined references;
      // no-undef doesn't know about ambient/lib types (NodeJS, HeadersInit,
      // RequestInit, etc.) and flags them as false positives.
      'no-undef': 'off',
    },
  },
  eslintConfigPrettier,
  {
    ignores: ['**/dist/**', '**/node_modules/**', '**/build/**'],
  },
];
