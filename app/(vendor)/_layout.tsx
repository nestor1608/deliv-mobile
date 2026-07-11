import { Stack } from 'expo-router';
import { VendorProvider } from '../../src/context/VendorContext';
import LogoutButton from '../../src/components/LogoutButton';

export default function VendorLayout() {
  return (
    <VendorProvider>
      <Stack>
        <Stack.Screen name="index" options={{ title: 'Mi Comercio', headerRight: () => <LogoutButton /> }} />
        <Stack.Screen name="orders" options={{ title: 'Gestión de Pedidos' }} />
        <Stack.Screen name="order-detail" options={{ title: 'Detalle del Pedido' }} />
        <Stack.Screen name="product-list" options={{ title: 'Mis Productos' }} />
        <Stack.Screen name="product-form" options={{ title: 'Producto' }} />
        <Stack.Screen name="sales-report" options={{ title: 'Reportes de Ventas' }} />
        <Stack.Screen name="store-profile" options={{ title: 'Perfil del Comercio' }} />
        <Stack.Screen name="vendor-notifications" options={{ title: 'Notificaciones' }} />
      </Stack>
    </VendorProvider>
  );
}
