// src/navigation/DeliveryNavigator.js
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Platform } from 'react-native';

// Importar pantallas
import DeliveryDashboardScreen from '../screens/delivery/DeliveryDashboardScreen';
import DeliveryOrdersScreen from '../screens/delivery/DeliveryOrdersScreen';
import DeliveryMapScreen from '../screens/delivery/DeliveryMapScreen';
import DeliveryOrderDetailScreen from '../screens/delivery/DeliveryOrderDetailScreen';
import DeliveryHistoryScreen from '../screens/delivery/DeliveryHistoryScreen';
import DeliveryEarningsScreen from '../screens/delivery/DeliveryEarningsScreen';
import DeliveryProfileScreen from '../screens/delivery/DeliveryProfileScreen';
import DeliverySettingsScreen from '../screens/delivery/DeliverySettingsScreen';
import DeliveryNotificationsScreen from '../screens/delivery/DeliveryNotificationsScreen';
import LogoutButton from '../components/LogoutButton';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Stack para el dashboard y órdenes
function DeliveryDashboardStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="DeliveryDashboard" 
        component={DeliveryDashboardScreen}
        options={{
          title: 'Panel del Repartidor',
          headerRight: () => <LogoutButton />,
          headerStyle: { backgroundColor: '#FF9800' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      />
      <Stack.Screen 
        name="DeliveryOrderDetail" 
        component={DeliveryOrderDetailScreen}
        options={{
          title: 'Detalle del Pedido',
          headerStyle: { backgroundColor: '#FF9800' },
          headerTintColor: '#fff',
        }}
      />
      <Stack.Screen 
        name="DeliveryMap" 
        component={DeliveryMapScreen}
        options={{
          title: 'Navegación',
          headerStyle: { backgroundColor: '#FF9800' },
          headerTintColor: '#fff',
        }}
      />
    </Stack.Navigator>
  );
}

// Stack para órdenes
function DeliveryOrdersStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="DeliveryOrders" 
        component={DeliveryOrdersScreen}
        options={{
          title: 'Pedidos Disponibles',
          headerStyle: { backgroundColor: '#FF9800' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      />
      <Stack.Screen 
        name="DeliveryOrderDetail" 
        component={DeliveryOrderDetailScreen}
        options={{
          title: 'Detalle del Pedido',
          headerStyle: { backgroundColor: '#FF9800' },
          headerTintColor: '#fff',
        }}
      />
    </Stack.Navigator>
  );
}

// Stack para historial y ganancias
function DeliveryHistoryStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="DeliveryHistory" 
        component={DeliveryHistoryScreen}
        options={{
          title: 'Historial',
          headerStyle: { backgroundColor: '#FF9800' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      />
      <Stack.Screen 
        name="DeliveryEarnings" 
        component={DeliveryEarningsScreen}
        options={{
          title: 'Ganancias',
          headerStyle: { backgroundColor: '#FF9800' },
          headerTintColor: '#fff',
        }}
      />
    </Stack.Navigator>
  );
}

// Stack para perfil y configuración
function DeliveryProfileStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="DeliveryProfile" 
        component={DeliveryProfileScreen}
        options={{
          title: 'Mi Perfil',
          headerStyle: { backgroundColor: '#FF9800' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      />
      <Stack.Screen 
        name="DeliverySettings" 
        component={DeliverySettingsScreen}
        options={{
          title: 'Configuración',
          headerStyle: { backgroundColor: '#FF9800' },
          headerTintColor: '#fff',
        }}
      />
      <Stack.Screen 
        name="DeliveryNotifications" 
        component={DeliveryNotificationsScreen}
        options={{
          title: 'Notificaciones',
          headerStyle: { backgroundColor: '#FF9800' },
          headerTintColor: '#fff',
        }}
      />
    </Stack.Navigator>
  );
}

export default function DeliveryNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'DashboardTab') {
            iconName = 'dashboard';
          } else if (route.name === 'OrdersTab') {
            iconName = 'local-shipping';
          } else if (route.name === 'HistoryTab') {
            iconName = 'history';
          } else if (route.name === 'ProfileTab') {
            iconName = 'person';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#FF9800',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0',
          paddingBottom: Platform.OS === 'ios' ? 20 : 5,
          height: Platform.OS === 'ios' ? 85 : 60,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="DashboardTab" 
        component={DeliveryDashboardStack}
        options={{
          tabBarLabel: 'Inicio',
        }}
      />
      <Tab.Screen 
        name="OrdersTab" 
        component={DeliveryOrdersStack}
        options={{
          tabBarLabel: 'Pedidos',
        }}
      />
      <Tab.Screen 
        name="HistoryTab" 
        component={DeliveryHistoryStack}
        options={{
          tabBarLabel: 'Historial',
        }}
      />
      <Tab.Screen 
        name="ProfileTab" 
        component={DeliveryProfileStack}
        options={{
          tabBarLabel: 'Perfil',
        }}
      />
    </Tab.Navigator>
  );
}