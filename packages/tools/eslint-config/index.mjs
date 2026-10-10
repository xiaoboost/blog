import stylistic from '@stylistic/eslint-plugin';
import { defineConfig } from 'eslint/config';
import { importX } from 'eslint-plugin-import-x';
import tseslint from 'typescript-eslint';
import namedSpecifierNewline from './rules/named-specifier-newline.mjs';
import objectPropertyNewline from './rules/object-property-newline.mjs';

export default defineConfig(
  tseslint.configs.recommended,
  stylistic.configs.recommended,
  importX.flatConfigs.recommended,
  {
    files: ['*/{src,tests}/**/*.{js,ts,jsx,tsx}'],
  },
  {
    ignores: [
      '**/dist/',
      '**/tmp/',
      '**/draft/',
      '**/node_modules/',
      '**/ava.config.js',
      '**/.mocharc.js',
    ],
  },
  {
    plugins: {
      blog: {
        rules: {
          'object-property-newline': objectPropertyNewline,
          'named-specifier-newline': namedSpecifierNewline,
        },
      },
    },
    rules: {
      // ========== 基础样式规则 ==========
      '@stylistic/array-bracket-newline': [
        'error',
        {
          multiline: true,
          minItems: 4,
        },
      ],
      '@stylistic/array-element-newline': [
        'error',
        {
          multiline: true,
          minItems: 4,
          consistent: true,
        },
      ],
      '@stylistic/object-curly-newline': [
        'error',
        {
          ObjectExpression: { minProperties: 4, multiline: true, consistent: true },
          ObjectPattern: { minProperties: 4, multiline: true, consistent: true },
          ImportDeclaration: { minProperties: 4, multiline: true, consistent: true },
          ExportDeclaration: { minProperties: 4, multiline: true, consistent: true },
        },
      ],
      'blog/object-property-newline': ['error', { minProperties: 4 }],
      'blog/named-specifier-newline': ['error', { minSpecifiers: 4 }],
      '@stylistic/jsx-max-props-per-line': [
        'error',
        {
          maximum: { single: 3, multi: 1 },
        },
      ],
      '@stylistic/jsx-first-prop-new-line': ['error', 'multiline'],
      '@stylistic/quote-props': 'off',
      '@stylistic/semi': ['error', 'always'],
      '@stylistic/quotes': ['warn', 'single', { avoidEscape: true }],
      '@stylistic/brace-style': ['error', 'stroustrup', { 'allowSingleLine': false }],
      'curly': ['error', 'all'],
      '@stylistic/keyword-spacing': ['error', { before: true, after: true }],
      '@stylistic/padding-line-between-statements': [
        'error',
        { blankLine: 'always', prev: '*', next: 'if' },
        { blankLine: 'always', prev: 'if', next: '*' },
      ],
      '@stylistic/comma-dangle': ['error', 'always-multiline'],
      '@stylistic/indent': ['error', 2],
      '@stylistic/max-len': [
        'warn',
        {
          code: 100,
          ignoreStrings: true,
          ignoreTemplateLiterals: true,
        },
      ],
      '@stylistic/arrow-parens': ['error', 'always'],
      '@stylistic/operator-linebreak': [
        'error',
        'before',
        {
          overrides: {
            '=': 'after',
            '++': 'after',
            '--': 'after',
          },
        },
      ],
      '@stylistic/member-delimiter-style': [
        'error',
        {
          'multiline': {
            'delimiter': 'semi',
            'requireLast': true,
          },
          'singleline': {
            'delimiter': 'semi',
            'requireLast': false,
          },
          'multilineDetection': 'brackets',
        },
      ],

      // ========== 类型规则 ==========
      '@typescript-eslint/no-this-alias': 'off',
      '@typescript-eslint/no-explicit-any': ['error', { ignoreRestArgs: true }],
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'separate-type-imports' }],
      '@typescript-eslint/no-unused-expressions': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          'argsIgnorePattern': '^_',
          'ignoreRestSiblings': true,
        },
      ],

      // ========== 导入规则 ==========
      'import-x/no-duplicates': ['error', { 'prefer-inline': true }],
      'import-x/no-named-as-default': 'off',
      'import-x/no-unresolved': 'off',
      'import-x/named': 'off',
      'import-x/order': [
        'error',
        {
          'groups': [
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index',
            'object',
          ],
          'alphabetize': {
            'order': 'asc',
            'caseInsensitive': true,
          },
        },
      ],
      'import-x/no-cycle': [
        'error',
        {
          maxDepth: Infinity,
          ignoreExternal: true,
        },
      ],
      'import-x/newline-after-import': ['warn', { count: 1 }],
      'import-x/no-useless-path-segments': [
        'warn',
        {
          noUselessIndex: true,
        },
      ],
      'import-x/no-self-import': 'error',
      'import-x/no-deprecated': 'warn',
      'no-unused-vars': 'off',
    },
  },
  {
    files: ['**/*.mjs'],
    rules: {
      // Node ESM 不支持目录导入，必须保留 index.mjs 的完整文件名。
      'import-x/no-useless-path-segments': ['warn', { noUselessIndex: false }],
    },
  },
);
