import { Tabs } from 'expo-router';
import { MaterialIcons as Icon } from '@expo/vector-icons';

export default function MobilityLayout() {
    return (
        <Tabs screenOptions={{ tabBarActiveTintColor: '#2196F3' }}>
            <Tabs.Screen name="index" options={{ title: 'Panel', tabBarIcon: ({ color }) => <Icon name="dashboard" size={24} color={color} /> }} />
            <Tabs.Screen name="trips" options={{ title: 'Viajes', tabBarIcon: ({ color }) => <Icon name="list" size={24} color={color} /> }} />
            <Tabs.Screen name="history" options={{ title: 'Historial', tabBarIcon: ({ color }) => <Icon name="history" size={24} color={color} /> }} />
            <Tabs.Screen name="earnings" options={{ title: 'Ganancias', tabBarIcon: ({ color }) => <Icon name="account-balance-wallet" size={24} color={color} /> }} />
            <Tabs.Screen name="profile" options={{ title: 'Perfil', tabBarIcon: ({ color }) => <Icon name="person" size={24} color={color} /> }} />
        </Tabs>
    );
}
