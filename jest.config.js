module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/test-support/setup.ts'],
  testMatch: ['**/__tests__/**/*.test.ts?(x)'],
  transform: {
    '^.+\.tsx?$': ['ts-jest', { tsconfig: { module: 'commonjs', jsx: 'react-jsx', esModuleInterop: true, resolveJsonModule: true } }],
  },
}
