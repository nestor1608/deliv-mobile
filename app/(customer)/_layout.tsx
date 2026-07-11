import { Stack } from 'expo-router';
import LogoutButton from '../../src/components/LogoutButton';

export default function CustomerLayout() {
    return (
        <Stack>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="cart" options={{ title: 'Mi Carrito', headerRight: () => <LogoutButton /> }} />
            <Stack.Screen name="checkout" options={{ title: 'Finalizar Compra' }} />
            <Stack.Screen name="product-detail" options={{ headerShown: false, presentation: 'modal' }} />
            <Stack.Screen name="store-products" options={{ headerShown: false }} />
            <Stack.Screen name="search-results" options={{ title: 'Resultados de búsqueda' }} />
            <Stack.Screen name="location-picker" options={{ title: 'Seleccionar Ubicación', presentation: 'modal' }} />
            <Stack.Screen name="order-tracking" options={{ title: 'Seguimiento de Pedido', headerLeft: () => null }} />
            <Stack.Screen name="notifications" options={{ headerShown: false }} />
            <Stack.Screen name="ride-request" options={{ headerShown: false }} />
            <Stack.Screen name="ride-tracking" options={{ headerShown: false, gestureEnabled: false }} />
            <Stack.Screen name="ride-rating" options={{ headerShown: false, gestureEnabled: false }} />
            <Stack.Screen name="order-history" options={{ headerShown: false }} />
            <Stack.Screen name="ride-history" options={{ headerShown: false }} />
            <Stack.Screen name="address-book" options={{ headerShown: false }} />
            <Stack.Screen name="profile" options={{ headerShown: false }} />
            <Stack.Screen name="payment-methods" options={{ headerShown: false }} />
        </Stack>
    );
}
