// src/navigation/StoreStack.js
import React, { useContext } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { View, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Importar todas las pantallas
import StoreDashboardScreen from '../screens/store/StoreDashboardScreen';
import OrdersScreen from '../screens/store/OrdersScreen';
import OrderDetailScreen from '../screens/store/OrderDetailScreen';
import ProductListScreen from '../screens/store/ProductListScreen';
import ProductFormScreen from '../screens/store/ProductFormScreen';
import SalesReportScreen from '../screens/store/SalesReportScreen';
import StoreProfileScreen from '../screens/store/StoreProfileScreen';
import VendorNotificationsScreen from '../screens/store/VendorNotificationsScreen';

// Contextos
import { AuthContext } from '../context/AuthContext';
import { NotificationContext } from '../context/NotificationContext';
import { VendorProvider } from '../context/VendorContext';
import LogoutButton from '../components/LogoutButton';

const Stack = createStackNavigator();

// Componente para el botón de notificaciones con contador
const NotificationButton = ({ navigation }) => {
    const { unreadCount } = useContext(NotificationContext);
    
    return (
        <TouchableOpacity 
            onPress={() => navigation.navigate('VendorNotifications')} 
            style={{ marginRight: 15, position: 'relative' }}
        >
            <Ionicons name="notifications-outline" size={24} color="#333" />
            {unreadCount > 0 && (
                <View style={{
                    position: 'absolute',
                    top: -5,
                    right: -5,
                    backgroundColor: '#FF6B6B',
                    borderRadius: 10,
                    minWidth: 20,
                    height: 20,
                    justifyContent: 'center',
                    alignItems: 'center'
                }}>
                    <Text style={{ 
                        color: 'white', 
                        fontSize: 12, 
                        fontWeight: 'bold' 
                    }}>
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </Text>
                </View>
            )}
        </TouchableOpacity>
    );
};

// Componente para el header derecho
const HeaderRight = ({ navigation }) => (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <NotificationButton navigation={navigation} />
        <LogoutButton />
    </View>
);

// Opciones de pantalla por defecto
const defaultScreenOptions = ({ navigation }) => ({
    headerRight: () => <HeaderRight navigation={navigation} />,
    headerStyle: {
        backgroundColor: '#fff',
        elevation: 2,
        shadowOpacity: 0.1,
    },
    headerTintColor: '#333',
    headerTitleStyle: {
        fontWeight: 'bold',
        fontSize: 18,
    },
});

export default function StoreStack() {
    return (
        <VendorProvider>
            <Stack.Navigator screenOptions={defaultScreenOptions}>
                {/* Dashboard principal */}
                <Stack.Screen
                    name="StoreDashboard"
                    component={StoreDashboardScreen}
                    options={({ navigation }) => ({
                        title: 'Mi Comercio',
                        headerLeft: () => (
                            <TouchableOpacity
                                style={{ marginLeft: 15 }}
                                onPress={() => navigation.navigate('StoreProfile')}
                            >
                                <Ionicons name="person-circle-outline" size={28} color="#333" />
                            </TouchableOpacity>
                        ),
                        headerTitleAlign: 'center',
                    })}
                />

                {/* Gestión de pedidos */}
                <Stack.Screen
                    name="Orders"
                    component={OrdersScreen}
                    options={{
                        title: 'Gestión de Pedidos',
                        headerTitleAlign: 'center',
                    }}
                />

                <Stack.Screen
                    name="OrderDetail"
                    component={OrderDetailScreen}
                    options={({ route }) => ({
                        title: `Pedido #${route.params?.orderId || ''}`,
                        headerTitleAlign: 'center',
                    })}
                />

                {/* Gestión de productos */}
                <Stack.Screen
                    name="ProductList"
                    component={ProductListScreen}
                    options={{
                        title: 'Mis Productos',
                        headerTitleAlign: 'center',
                    }}
                />

                <Stack.Screen
                    name="ProductForm"
                    component={ProductFormScreen}
                    options={({ route }) => ({
                        title: route.params?.product ? 'Editar Producto' : 'Nuevo Producto',
                        headerTitleAlign: 'center',
                    })}
                />

                {/* Reportes y estadísticas */}
                <Stack.Screen
                    name="SalesReport"
                    component={SalesReportScreen}
                    options={{
                        title: 'Reportes de Ventas',
                        headerTitleAlign: 'center',
                    }}
                />

                {/* Perfil del comercio */}
                <Stack.Screen
                    name="StoreProfile"
                    component={StoreProfileScreen}
                    options={{
                        title: 'Perfil del Comercio',
                        headerTitleAlign: 'center',
                    }}
                />

                {/* Notificaciones */}
                <Stack.Screen
                    name="VendorNotifications"
                    component={VendorNotificationsScreen}
                    options={{
                        title: 'Notificaciones',
                        headerTitleAlign: 'center',
                    }}
                />
            </Stack.Navigator>
        </VendorProvider>
    );
}