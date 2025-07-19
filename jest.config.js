const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

// add all custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    // Handle module aliases
    '^@/(.*)$': '<rootDir>/app/$1',
  },
};
// createJestConfig is exported this way to ensure that jest can load next.js config which is async
module.exports = createJestConfig(customJestConfig);
