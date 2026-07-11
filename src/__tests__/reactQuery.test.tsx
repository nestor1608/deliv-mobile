import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { Text } from 'react-native';

// Test component using useQuery
function TestComponent() {
  const { data, isLoading } = useQuery({
    queryKey: ['test'],
    queryFn: () => Promise.resolve({ message: 'hello' }),
  });
  if (isLoading) return <Text>Loading...</Text>;
  return <Text>{data?.message}</Text>;
}

describe('React Query integration', () => {
  test('QueryClientProvider renders and useQuery works', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    const { getByText } = render(
      <QueryClientProvider client={queryClient}>
        <TestComponent />
      </QueryClientProvider>
    );

    expect(getByText('Loading...')).toBeTruthy();
    await waitFor(() => {
      expect(getByText('hello')).toBeTruthy();
    });
  });

  test('query cache persists across rerenders', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    const { getByText, rerender } = render(
      <QueryClientProvider client={queryClient}>
        <TestComponent />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(getByText('hello')).toBeTruthy();
    });

    // Rerender with same queryClient — should use cache, not refetch
    rerender(
      <QueryClientProvider client={queryClient}>
        <TestComponent />
      </QueryClientProvider>
    );

    expect(getByText('hello')).toBeTruthy();
  });
});
