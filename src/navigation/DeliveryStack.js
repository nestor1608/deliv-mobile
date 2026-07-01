import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import DeliveryDashboardScreen from '../screens/delivery/DeliveryDashboardScreen';
import DeliveryProfileScreen from '../screens/delivery/DeliveryProfileScreen';
import DeliveryCostScreen from '../screens/delivery/DeliveryCostScreen';
import DeliveryMapScreen from '../screens/delivery/DeliveryMapScreen';
import DeliveryOrderDetailScreen from '../screens/delivery/DeliveryOrderDetailScreen';
import DeliveryHistoryScreen from '../screens/delivery/DeliveryHistoryScreen';
import LogoutButton from '../components/LogoutButton';

const Stack = createStackNavigator();

const screenOptions = {
    headerRight: () => <LogoutButton />,
    headerStyle: {
        backgroundColor: '#fff',
    },
    headerTintColor: '#000',
};

export default function DeliveryStack() {
    return (
        <Stack.Navigator screenOptions={screenOptions}>
            <Stack.Screen 
                name="DeliveryDashboard" 
                component={DeliveryDashboardScreen} 
                options={{ title: 'Panel del Repartidor' }} 
            />
            <Stack.Screen 
                name="DeliveryProfile" 
                component={DeliveryProfileScreen} 
                options={{ title: 'Mi Perfil' }} 
            />
            <Stack.Screen 
                name="DeliveryCost" 
                component={DeliveryCostScreen} 
                options={{ title: 'Costos de Envío' }} 
            />
            <Stack.Screen 
                name="DeliveryMap" 
                component={DeliveryMapScreen} 
                options={{ title: 'Seguimiento de Pedido' }} 
            />
            <Stack.Screen 
                name="DeliveryOrderDetail" 
                component={DeliveryOrderDetailScreen} 
                options={{ title: 'Detalles del Pedido' }} 
            />
            <Stack.Screen 
                name="DeliveryHistory" 
                component={DeliveryHistoryScreen} 
                options={{ title: 'Historial de Pedidos' }} 
            />
        </Stack.Navigator>
    );
}