import js from '@eslint/js';
import tsparser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import jestPlugin from 'eslint-plugin-jest';
import unicornPlugin from 'eslint-plugin-unicorn';
import obsidianlinter from 'eslint-plugin-obsidian-linter';
import obsidianmd from 'eslint-plugin-obsidianmd';
import globals from 'globals';

export default [
  {
    ignores: [
      'node_modules/',
      'docs.js',
      'main.js',
      'translation-helper.js',
      'eslint.config.mjs',
      'babel.config.js',
      'postss.config.js',
      'package.json',
      'package.json.lock',
      'test-vault/'
    ],
  },
  js.configs.recommended,
  ...obsidianmd.configs.recommended,
  {
    files: ['**/*.{js,cjs,mjs,ts,tsx}'],

    languageOptions: {
      parser: tsparser,
      ecmaVersion: 2021,
      sourceType: 'module',

      parserOptions: {
        ecmaVersion: 12,
        sourceType: 'module',
        project: ['./tsconfig.json', './packages/*/tsconfig.json'],
      },

       globals: {
        ...globals.node,
        ...globals.browser,
      },
    },

    plugins: {
      '@typescript-eslint': tsPlugin,
      jest: jestPlugin,
      unicorn: unicornPlugin,
      'obsidian-linter': obsidianlinter,
    },

    rules: {
      // Google config equivalents you may still want manually
      camelcase: 'off',
      'max-len': 'off',
      'require-jsdoc': 'off',

      // Core ESLint rules
      'no-constant-binary-expression': 'error',
      'no-template-curly-in-string': 'error',
      'no-unmodified-loop-condition': 'error',
      'no-unreachable-loop': 'error',
      'no-unused-private-class-members': 'error',
      'no-unused-vars': 'off',

      // Unicorn
      'unicorn/template-indent': 'error',

      // TypeScript
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '(^_)|(options)',
        },
      ],

      // Deprecation
      '@typescript-eslint/no-deprecated': 'warn',

      // Obsidian linter
      'obsidian-linter/no-duplicate-ignore-types': 'error',
    },
  },
];
