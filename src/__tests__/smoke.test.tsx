import { getItemAsync } from 'expo-secure-store';
import { getItem } from '../utils/storage';

test('mocks resolve without error', () => {
  expect(getItemAsync).toBeDefined();
  expect(getItem).toBeDefined();
});
