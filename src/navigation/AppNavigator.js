// src/navigation/AppNavigator.js
import React, { useContext } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { ActivityIndicator, View, Text, StyleSheet } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import AuthStack from './AuthStack';
import MainStack from './MainStack';
import StoreStack from './StoreStack';
import DeliveryNavigator from './DeliveryNavigator';
import MobilityNavigator from './MobilityNavigator';

const Stack = createStackNavigator();

export default function AppNavigator() {
    const { isLoading, userToken, userData } = useContext(AuthContext);

    // Pantalla de carga mejorada
    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2196F3" />
                <Text style={styles.loadingText}>Cargando...</Text>
            </View>
        );
    }

    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            {userToken ? (
                // Usuario autenticado - mostrar navegación según rol
                userData?.role === 'customer' ? (
                    <Stack.Screen name="Main" component={MainStack} />
                ) : userData?.role === 'vendor' ? (
                    <Stack.Screen name="Store" component={StoreStack} />
                ) : userData?.role === 'delivery' ? (
                    <Stack.Screen name="Delivery" component={DeliveryNavigator} />
                ) : userData?.role === 'driver' ? (
                    <Stack.Screen name="Mobility" component={MobilityNavigator} />
                ) : (
                    // Rol desconocido - volver a auth
                    <Stack.Screen name="Auth" component={AuthStack} />
                )
            ) : (
                // Usuario no autenticado - mostrar pantallas de auth
                <Stack.Screen name="Auth" component={AuthStack} />
            )}
        </Stack.Navigator>
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFF',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#666',
        fontWeight: '500',
    },
});