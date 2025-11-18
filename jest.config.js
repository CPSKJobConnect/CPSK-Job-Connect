module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jest-environment-node',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  transform: {
    '^.+\\.(t|j)sx?$': ['ts-jest'],
  },
  transformIgnorePatterns: [
    '/node_modules/(?!jose|openid-client|next-auth|@panva/hkdf|uuid|preact|preact-render-to-string)',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)'
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/.next/'
  ],
  collectCoverageFrom: [
    'src/app/api/**/*.{ts,tsx}',
    'src/lib/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/*.spec.{ts,tsx}',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 75,
      statements: 75,
    },
  },
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],
  projects: [
    {
      displayName: 'components',
      testEnvironment: 'jest-environment-jsdom',
      testMatch: ['<rootDir>/src/components/**/*.test.{ts,tsx}'],
      setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
      transform: {
        '^.+\\.(t|j)sx?$': ['ts-jest'],
      },
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
      },
    },
    {
      displayName: 'api',
      testEnvironment: 'jest-environment-node',
      testMatch: ['<rootDir>/src/tests/**/*.test.{ts,tsx}', '<rootDir>/src/app/api/**/*.test.{ts,tsx}'],
      setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
      transform: {
        '^.+\\.(t|j)sx?$': ['ts-jest'],
      },
      transformIgnorePatterns: [
        '/node_modules/(?!jose|openid-client|next-auth|@panva/hkdf|uuid|preact|preact-render-to-string)',
      ],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
      },
    },
  ],
};
