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
        ...globals.browser,
        ...globals.jest,
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
};
// eslint rules that should be different from the source rules
const nonSrcRules = {
  'obsidianmd/no-nodejs-modules': 'off', // fs and other node libraries are pefectly fine in non-plugin code
  'obsidianmd/rule-custom-message': 'off', // this should not be enabled for tests as console logs are valid for my uses
  'obsidianmd/ui/sentence-case': 'off', // this shouldn't affect the integration tests
  'obsidianmd/commands/no-plugin-name-in-command-name': 'off', // this shouldn't affect the integration tests
  "import/no-extraneous-dependencies": ["warn", { "devDependencies": true }], // check for dev dependencies for tests
  '@typescript-eslint/no-restricted-imports': 'off', // moment is to be used in the UTs and integration tests and should not be listed as an issue
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
          ...nonSrcRules,
        },
    },
]);
