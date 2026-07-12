import { Stack, useRouter } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LanguageProvider } from '../src/context/LanguageContext';
import { AuthProvider } from '../src/context/AuthContext';
import { NotificationProvider } from '../src/context/NotificationContext';
import { ActivityIndicator, View, Text } from 'react-native';
import { useContext, useEffect } from 'react';
import { AuthContext } from '../src/context/AuthContext';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 2, staleTime: 5 * 60 * 1000, gcTime: 10 * 60 * 1000, refetchOnWindowFocus: false },
  },
});

function RootLayoutNav() {
  const { isLoading, userToken, userData } = useContext(AuthContext);
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!userToken) {
      router.replace('/(auth)/welcome');
    } else {
      const role = userData?.role;
      if (role === 'customer') router.replace('/(customer)');
      else if (role === 'vendor') router.replace('/(vendor)');
      else if (role === 'delivery') router.replace('/(delivery)');
      else if (role === 'driver') router.replace('/(mobility)');
      else if (role === 'admin') router.replace('/(admin)');
      else router.replace('/(auth)/welcome');
    }
  }, [isLoading, userToken, userData]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF' }}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={{ marginTop: 16, fontSize: 16, color: '#666' }}>Cargando...</Text>
      </View>
    );
  }

  // Render ALL screen groups always (no conditionals)
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(customer)" />
      <Stack.Screen name="(vendor)" />
      <Stack.Screen name="(delivery)" />
      <Stack.Screen name="(mobility)" />
      <Stack.Screen name="(admin)" />
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