// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src/'],  // Specifies that Jest should look for tests in the src directory
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',  // Looks for any files within __tests__ folders with .js, .jsx, .ts, or .tsx extensions
    '**/?(*.)+(spec|test).[tj]s?(x)'  // Additionally, any files at any depth that have .spec or .test in their filename
  ],
  transform: {},
  extensionsToTreatAsEsm: ['.ts'],
  globals: {
    'ts-jest': {
      useESM: true
    }
  },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  }
};
