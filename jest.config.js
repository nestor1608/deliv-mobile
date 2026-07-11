module.exports = {
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|expo|@expo|expo-secure-store|@tanstack)/)',
  ],
  setupFiles: ['./jest.polyfill.js'],
  setupFilesAfterEnv: ['./jest.setup.js'],
  moduleNameMapper: {
    '^expo-secure-store$': '<rootDir>/__mocks__/expo-secure-store.js',
    '^expo-sqlite$': '<rootDir>/__mocks__/expo-sqlite.js',
    '^test-renderer$': 'react-test-renderer',
  },
  testMatch: ['**/__tests__/**/*.test.{js,ts,tsx}'],
  // Skip tests that rely on @testing-library/react-native which is incompatible
  // with react-test-renderer@19.x (createRoot API removed in React 19).
  // These tests require @testing-library/react-native >= 15.x which is not yet released.
  testPathIgnorePatterns: [
    '/node_modules/',
    '/e2e/',
    'src/__tests__/reactQuery.test.tsx',
    'src/__tests__/AuthContext.test.tsx',
  ],
};
