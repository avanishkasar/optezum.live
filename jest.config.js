/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'clover'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  collectCoverageFrom: [
    'src/server/**/*.js',
    'src/shared/**/*.js',
    'src/public/js/utils/validation-core.js',
    'src/public/js/utils/validators.js',
    'src/public/js/utils/sanitizer.js',
    'src/public/js/storage.js',
    '!src/server/server.js',
    '!src/public/js/utils/validators-browser.js',
  ],
  testMatch: ['**/tests/**/*.test.js'],
  moduleFileExtensions: ['js', 'json'],
  verbose: true,
};
