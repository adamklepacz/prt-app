/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  setupFiles: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(wav|mp3|caf|m4a|aiff)$': '<rootDir>/__mocks__/fileMock.js',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@react-native-async-storage/.*)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|expo-router|react-navigation|@react-navigation/.*|react-native-svg|lucide-react-native|zustand)',
  ],
  testPathIgnorePatterns: ['/node_modules/', '/ios/', '/android/', '/targets/', '/scripts/'],
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/content/**', '!src/**/__tests__/**'],
};
