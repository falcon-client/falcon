const path = require('path');

module.exports = {
  extends: ['airbnb', 'prettier', 'prettier/react', 'prettier/flowtype'],
  parser: 'babel-eslint',
  parserOptions: {
    sourceType: 'module',
    allowImportExportEverywhere: true
  },
  env: {
    browser: true,
    node: true
  },
  rules: {
    'arrow-parens': ['off'],
    'class-methods-use-this': 'off',
    'compat/compat': 'error',
    'consistent-return': 'off',
    'comma-dangle': 'off',
    'generator-star-spacing': 'off',
    'import/no-unresolved': 'error',
    'import/no-extraneous-dependencies': 'off',
    'jsx-a11y/anchor-is-valid': 'off',
    'no-console': 'off',
    'no-use-before-define': 'off',
    'no-multi-assign': 'off',
    'no-mixed-operators': ['error', { allowSamePrecedence: true }],
    'no-restricted-syntax': 'off',
    'promise/param-names': 'error',
    'promise/always-return': 'error',
    'promise/catch-or-return': 'error',
    'promise/no-native': 'off',
    'react/sort-comp': [
      'error',
      {
        order: [
          'type-annotations',
          'defaultProps',
          'state',
          'constructor',
          'everything-else',
          'static-methods',
          'lifecycle',
          'render'
        ]
      }
    ],
    'react/destructuring-assignment': 'off',
    'jsx-a11y/no-static-element-interactions': 'off',
    'jsx-a11y/click-events-have-key-events': 'off',
    'react/jsx-no-bind': 'off',
    'react/jsx-filename-extension': ['error', { extensions: ['.js', '.jsx'] }],
    'react/prefer-stateless-function': 'off'
  },
  plugins: ['flowtype', 'import', 'promise', 'compat', 'react'],
  settings: {
    'import/resolver': {
      webpack: {
        config: path.join(__dirname, 'webpack.config.eslint.js')
      }
    }
  }
};
