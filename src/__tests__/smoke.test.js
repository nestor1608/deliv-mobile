import { getItemAsync } from 'expo-secure-store';
import { getItem } from '@react-native-async-storage/async-storage';

test('mocks resolve without error', () => {
  expect(getItemAsync).toBeDefined();
  expect(getItem).toBeDefined();
});
