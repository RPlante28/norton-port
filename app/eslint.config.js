import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default [
  {
    ignores: ['dist', 'node_modules', 'public/content.js', 'public/animations.js', 'public/cpu6502.js'],
  },
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.browser },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    settings: { react: { version: '18.3' } },
    plugins: { react, 'react-hooks': reactHooks, 'react-refresh': reactRefresh },
    rules: {
      ...react.configs.flat.recommended.rules,
      ...react.configs.flat['jsx-runtime'].rules,
      'react/prop-types': 'off',
      // apostrophes/quotes in JSX text render fine and read better unescaped
      'react/no-unescaped-entities': 'off',
      // false-positive on the literal "// press RUN…" text in ContactView
      'react/jsx-no-comment-textnodes': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      'no-unused-vars': ['warn', { varsIgnorePattern: '^[A-Z_]' }],
      'no-empty': ['warn', { allowEmptyCatch: true }],
    },
  },
  {
    // Engine.js is a faithful, verbatim port of the original single-file logic
    // class; keep it as-is rather than reshaping it to satisfy stylistic lints.
    files: ['src/engine/Engine.js'],
    rules: {
      'no-unused-vars': 'off',
      'no-empty': 'off',
      'no-cond-assign': 'off',
      'no-fallthrough': 'off',
      'no-control-regex': 'off',
      'no-prototype-builtins': 'off',
    },
  },
];
