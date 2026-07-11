import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LanguageProvider } from '../src/context/LanguageContext';
import { AuthProvider } from '../src/context/AuthContext';
import { NotificationProvider } from '../src/context/NotificationContext';
import { ActivityIndicator, View, Text } from 'react-native';
import { useContext } from 'react';
import { AuthContext } from '../src/context/AuthContext';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 2, staleTime: 5 * 60 * 1000, gcTime: 10 * 60 * 1000, refetchOnWindowFocus: false },
  },
});

function RootLayoutNav() {
  const { isLoading, userToken, userData } = useContext(AuthContext);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF' }}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={{ marginTop: 16, fontSize: 16, color: '#666' }}>Cargando...</Text>
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {userToken ? (
        userData?.role === 'customer' ? (
          <Stack.Screen name="(customer)" />
        ) : userData?.role === 'vendor' ? (
          <Stack.Screen name="(vendor)" />
        ) : userData?.role === 'delivery' ? (
          <Stack.Screen name="(delivery)" />
        ) : userData?.role === 'driver' ? (
          <Stack.Screen name="(mobility)" />
        ) : userData?.role === 'admin' ? (
          <Stack.Screen name="(admin)" />
        ) : (
          <Stack.Screen name="(auth)" />
        )
      ) : (
        <Stack.Screen name="(auth)" />
      )}
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <AuthProvider>
            <NotificationProvider>
              <RootLayoutNav />
            </NotificationProvider>
          </AuthProvider>
        </LanguageProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
