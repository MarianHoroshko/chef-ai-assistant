// eslint.config.js
const eslint = require('@eslint/js');
const tseslint = require('typescript-eslint');

module.exports = [
  eslint.configs.recommended,
  ...tseslint.configs.strict,
  {
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },
];
