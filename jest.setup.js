/* global jest */

// Lokalna baza: oficjalny mock AsyncStorage (in-memory).
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// Haptyka: spy'e, które testy sprawdzają.
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  notificationAsync: jest.fn(() => Promise.resolve()),
  selectionAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy', Soft: 'soft', Rigid: 'rigid' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
}));

// SVG i ikony nie są przedmiotem testów: renderujemy je jako zwykłe View.
jest.mock('react-native-svg', () => {
  const React = require('react');
  const { View } = require('react-native');
  const Stub = ({ children }) => React.createElement(View, null, children);
  return new Proxy({ __esModule: true, default: Stub }, { get: (t, k) => (k in t ? t[k] : Stub) });
});

jest.mock('lucide-react-native', () => {
  const Stub = () => null;
  return new Proxy({ __esModule: true }, { get: (t, k) => (k in t ? t[k] : Stub) });
});
