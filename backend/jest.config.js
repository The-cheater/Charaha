module.exports = {
    testEnvironment: 'node',
    setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
    globalTeardown: '<rootDir>/tests/teardown.js',
    testMatch: [
      '**/tests/**/*.test.js'
    ],
    coverageDirectory: 'coverage',
    collectCoverageFrom: [
      'src/**/*.js',
      '!src/server.js',
      '!src/scripts/**',
    ],
    coverageReporters: ['text', 'lcov', 'html'],
    coverageThreshold: {
      global: {
        branches: 70,
        functions: 70,
        lines: 70,
        statements: 70,
      },
    },
    verbose: true,
    forceExit: true,
    clearMocks: true,
    restoreMocks: true,
  };
  