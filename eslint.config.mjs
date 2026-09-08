import js from '@eslint/js';
import { defineConfig } from "eslint/config";
import tsparser from '@typescript-eslint/parser';
import obsidianmd from 'eslint-plugin-obsidianmd';
import obsidianLinterPlugin from 'eslint-plugin-obsidian-linter';
import unicorn from 'eslint-plugin-unicorn';
import jestPlugin from 'eslint-plugin-jest';
import tsPlugin from '@typescript-eslint/eslint-plugin'
import globals from 'globals';

const typescriptLanguageOptions = {
    parser: tsparser,
    ecmaVersion: 2021,
    parserOptions: {
        projectService: true,
    },
    globals: {
        ...globals.es2020,
        ...globals.node,
        ...globals.browser
    },
};

const commonRules = {
  camelcase: 'off',

  'no-constant-binary-expression': 'error',
  'no-template-curly-in-string': 'error',
  'no-unmodified-loop-condition': 'error',
  'no-unreachable-loop': 'error',
  'no-unused-private-class-members': 'error',

  'require-jsdoc': 'off',

  'unicorn/template-indent': 'error',

  'no-unused-vars': 'off',

  '@typescript-eslint/no-floating-promises': 'error',

  '@typescript-eslint/no-unused-vars': [
    'error',
    {
      argsIgnorePattern: '(^_)|(options)',
      varsIgnorePattern: '^_',
    },
  ],

  '@typescript-eslint/no-deprecated': 'warn',

  'obsidian-linter/no-duplicate-ignore-types': 'error',
}

export default defineConfig([
    {
      ignores: [
        'docs.js',
        'main.js',
        'translation-helper.js',
        'eslint.config.mjs',
        'esbuild.config.mjs',
        'babel.config.js',
        'postcss.config.js',
        'eslint-rules/**',
        'test-vault'
      ],
    },
    js.configs.recommended,
    ...obsidianmd.configs.recommended,
    {
        files: ['src/**/*.ts'],
        languageOptions: typescriptLanguageOptions,
        plugins: {
            'obsidian-linter': obsidianLinterPlugin,
            unicorn,
            '@typescript-eslint': tsPlugin
        },
        rules:  {
          ...commonRules,
        },
    },
    {
        files: ['__integration__/**/*.ts', '__tests__/**/*.ts', '__mocks__/**/*.ts', 'jest.config.ts'],
        languageOptions: typescriptLanguageOptions,
        plugins: {
            'obsidian-linter': obsidianLinterPlugin,
            unicorn,
            '@typescript-eslint': tsPlugin,
            jest: jestPlugin
        },
        rules:  {
          ...commonRules,
        },
    },
]);
