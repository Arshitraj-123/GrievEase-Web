module.exports = {
  extends: ['eslint:recommended'],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  env: {
    node: true,
    es2022: true,
  },
  rules: {
    'no-console': ['warn', { allow: ['warn', 'error', 'info', 'log'] }],
  },
};
