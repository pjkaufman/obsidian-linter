const js = require('@eslint/js');
const globals = require('globals');

const tsParser = require('@typescript-eslint/parser');
const tsPlugin = require('@typescript-eslint/eslint-plugin');
const jestPlugin = require('eslint-plugin-jest');
const unicornPlugin = require('eslint-plugin-unicorn');
const obsidianLinterPlugin = require('eslint-plugin-obsidian-linter');

module.exports = [
  js.configs.recommended,

  {
    files: ['**/*.ts'],

    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2021,
      sourceType: 'module',

      globals: {
        ...globals.browser,
        ...globals.jest,
      },

      parserOptions: {
        project: ['./tsconfig.json', './packages/*/tsconfig.json'],
      },
    },

    plugins: {
      '@typescript-eslint': tsPlugin,
      jest: jestPlugin,
      unicorn: unicornPlugin,
      'obsidian-linter': obsidianLinterPlugin,
    },

    rules: {
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
    },
  },
  {
    ignores: [
      'docs.js',
      'main.js',
      'translation-helper.js',
      'eslint.config.js',
      'babel.config.js',
      'postcss.config.js',
      'eslint-rules',
      'test-vault'
    ],
  },
];
