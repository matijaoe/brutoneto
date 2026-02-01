import antfu from '@antfu/eslint-config'

export default antfu({
  typescript: true,
  rules: {
    'antfu/no-top-level-await': 'off',
    'no-restricted-imports': [
      'error',
      {
        paths: [
          {
            name: 'decimal.js',
            message: 'Import Decimal from src/lib/decimal instead so global config is applied.',
          },
        ],
      },
    ],
  },
})
