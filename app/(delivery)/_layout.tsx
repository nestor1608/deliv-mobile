import { Tabs } from 'expo-router';
import { MaterialIcons as Icon } from '@expo/vector-icons';

export default function DeliveryLayout() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: '#FF9800' }}>
      <Tabs.Screen name="index" options={{ title: 'Panel', tabBarIcon: ({ color }) => <Icon name="dashboard" size={24} color={color} /> }} />
      <Tabs.Screen name="orders" options={{ title: 'Pedidos', tabBarIcon: ({ color }) => <Icon name="list" size={24} color={color} /> }} />
      <Tabs.Screen name="history" options={{ title: 'Historial', tabBarIcon: ({ color }) => <Icon name="history" size={24} color={color} /> }} />
      <Tabs.Screen name="earnings" options={{ title: 'Ganancias', tabBarIcon: ({ color }) => <Icon name="account-balance-wallet" size={24} color={color} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Perfil', tabBarIcon: ({ color }) => <Icon name="person" size={24} color={color} /> }} />
    </Tabs>
  );
}
