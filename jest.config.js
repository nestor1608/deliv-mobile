module.exports = {
  transform: {
    '^.+\\.js$': 'babel-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|expo|@expo|expo-secure-store|@react-native-async-storage)/)',
  ],
  setupFiles: ['./jest.polyfill.js'],
  setupFilesAfterEnv: ['./jest.setup.js'],
  moduleNameMapper: {
    '^expo-secure-store$': '<rootDir>/__mocks__/expo-secure-store.js',
    '^@react-native-async-storage/async-storage$':
      '<rootDir>/__mocks__/@react-native-async-storage/async-storage.js',
  },
  testMatch: ['**/__tests__/**/*.test.js'],
};
