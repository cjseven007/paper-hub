module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:import/errors',
    'plugin:import/warnings',
    'plugin:import/typescript',
    'google',
    'plugin:@typescript-eslint/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: ['tsconfig.json', 'tsconfig.dev.json'],
    sourceType: 'module',
  },
  ignorePatterns: [
    '/lib/**/*', // Ignore built files.
    '/generated/**/*', // Ignore generated files.
  ],
  plugins: ['@typescript-eslint', 'import'],
  rules: {
    indent: 'off', // Stop checking for 2 vs 4 spaces
    'no-trailing-spaces': 'off', // Allow spaces at the end of lines
    'padded-blocks': 'off', // Allow blank lines inside functions
    'eol-last': 'off', // Don't require a newline at the end
    'object-curly-spacing': 'off', // Fixes the {space} errors from earlier
    quotes: 'off', // Stop fighting between ' and "
  },
};
