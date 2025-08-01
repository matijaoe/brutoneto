import antfu from '@antfu/eslint-config'

export default antfu({
  javascript: {
    overrides: {
      'default-param-last': 'error',
      'no-alert': 'warn',
      'no-await-in-loop': 'error',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-param-reassign': 'off',
      'no-unused-vars': [
        'error',
        {
          args: 'after-used',
          caughtErrors: 'none',
          ignoreRestSiblings: true,
          vars: 'all',
        },
      ],
      'no-use-before-define': [
        'error',
        {
          allowNamedExports: false,
          classes: false,
          functions: false,
          variables: true,
        },
      ],
      'unused-imports/no-unused-imports': 'warn',
      'unused-imports/no-unused-vars': [
        'error',
        {
          args: 'after-used',
          argsIgnorePattern: '^_',
          ignoreRestSiblings: true,
          vars: 'all',
          varsIgnorePattern: '^_',
        },
      ],
      'max-statements-per-line': ['error', { max: 1 }],
      'brace-style': ['error', '1tbs', { allowSingleLine: true }],
      'arrow-parens': ['error', 'always'],
    },
  },
  typescript: {
    tsconfigPath: './tsconfig.json',
    parserOptions: {
      project: ['./tsconfig.json'],
    },
    overrides: {
      'ts/ban-ts-comment': 'off',
      'ts/consistent-type-definitions': ['error', 'type',
      ],
      'ts/naming-convention': ['error', {
        format: [
          'PascalCase',
        ],
        leadingUnderscore: 'forbid',
        selector: 'interface',
      }, {
        format: [
          'PascalCase',
        ],
        leadingUnderscore: 'forbid',
        selector: 'typeLike',
      }, {
        format: [
          'PascalCase',
          'camelCase',
          'UPPER_CASE',
          'snake_case',
        ],
        leadingUnderscore: 'allow',
        selector: 'variable',
        trailingUnderscore: 'allow',
      }],
      'ts/no-explicit-any': 'warn',
      'ts/no-use-before-define': 'off',
      'ts/prefer-as-const': 'error',
      'ts/prefer-destructuring': 'error',
      'ts/prefer-for-of': 'error',
      'ts/prefer-ts-expect-error': 'off',
    },
  },
  stylistic: {
    overrides: {
      // Auto-fixes
      'style/arrow-parens': ['error', 'always'], // auto fix
      'style/brace-style': ['error', '1tbs', { allowSingleLine: true }],
      'style/max-statements-per-line': ['error', { max: 1 }],
    },
  },
  rules: {
    'antfu/top-level-function': 'off',
    'curly': ['error', 'all'],

    'unicorn/catch-error-name': ['error', { name: 'err' }],
    'unicorn/consistent-destructuring': 'error',
    'unicorn/filename-case': [
      'error',
      {
        case: 'kebabCase',
        ignore: [
          '.md$',
          '.vue$',
        ],
      },
    ],
    'unicorn/no-useless-length-check': 'error',
    'no-restricted-imports': [
      'error',
      {
        paths: [
          {
            name: 'decimal.js',
            message: 'Import Decimal from @brutoneto/core lib/decimal instead so global config is applied.',
          },
        ],
      },
    ],
  },
})
