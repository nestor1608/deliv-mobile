// src/navigation/MobilityNavigator.js
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Platform } from 'react-native';

// Importar pantallas
import MobilityDashboardScreen from '../screens/mobility/MobilityDashboardScreen';
import MobilityTripsScreen from '../screens/mobility/MobilityTripsScreen';
import MobilityMapScreen from '../screens/mobility/MobilityMapScreen';
import MobilityTripDetailScreen from '../screens/mobility/MobilityTripDetailScreen';
import MobilityHistoryScreen from '../screens/mobility/MobilityHistoryScreen';
import MobilityEarningsScreen from '../screens/mobility/MobilityEarningsScreen';
import MobilityProfileScreen from '../screens/mobility/MobilityProfileScreen';
import MobilitySettingsScreen from '../screens/mobility/MobilitySettingsScreen';
import MobilityNotificationsScreen from '../screens/mobility/MobilityNotificationsScreen';
import LogoutButton from '../components/LogoutButton';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Stack para el dashboard
function MobilityDashboardStack() {
    return (
        <Stack.Navigator>
            <Stack.Screen
                name="MobilityDashboard"
                component={MobilityDashboardScreen}
                options={{
                    title: 'Panel del Conductor',
                    headerRight: () => <LogoutButton />,
                    headerStyle: { backgroundColor: '#2196F3' },
                    headerTintColor: '#fff',
                    headerTitleStyle: { fontWeight: 'bold' },
                }}
            />
            <Stack.Screen
                name="MobilityTripDetail"
                component={MobilityTripDetailScreen}
                options={{
                    title: 'Detalle del Viaje',
                    headerStyle: { backgroundColor: '#2196F3' },
                    headerTintColor: '#fff',
                }}
            />
            <Stack.Screen
                name="MobilityMap"
                component={MobilityMapScreen}
                options={{
                    title: 'Navegación',
                    headerStyle: { backgroundColor: '#2196F3' },
                    headerTintColor: '#fff',
                }}
            />
        </Stack.Navigator>
    );
}

// Stack para viajes
function MobilityTripsStack() {
    return (
        <Stack.Navigator>
            <Stack.Screen
                name="MobilityTrips"
                component={MobilityTripsScreen}
                options={{
                    title: 'Viajes Disponibles',
                    headerStyle: { backgroundColor: '#2196F3' },
                    headerTintColor: '#fff',
                    headerTitleStyle: { fontWeight: 'bold' },
                }}
            />
            <Stack.Screen
                name="MobilityTripDetail"
                component={MobilityTripDetailScreen}
                options={{
                    title: 'Detalle del Viaje',
                    headerStyle: { backgroundColor: '#2196F3' },
                    headerTintColor: '#fff',
                }}
            />
        </Stack.Navigator>
    );
}

// Stack para historial y ganancias
function MobilityHistoryStack() {
    return (
        <Stack.Navigator>
            <Stack.Screen
                name="MobilityHistory"
                component={MobilityHistoryScreen}
                options={{
                    title: 'Historial',
                    headerStyle: { backgroundColor: '#2196F3' },
                    headerTintColor: '#fff',
                    headerTitleStyle: { fontWeight: 'bold' },
                }}
            />
            <Stack.Screen
                name="MobilityEarnings"
                component={MobilityEarningsScreen}
                options={{
                    title: 'Ganancias',
                    headerStyle: { backgroundColor: '#2196F3' },
                    headerTintColor: '#fff',
                }}
            />
        </Stack.Navigator>
    );
}

// Stack para perfil y configuración
function MobilityProfileStack() {
    return (
        <Stack.Navigator>
            <Stack.Screen
                name="MobilityProfile"
                component={MobilityProfileScreen}
                options={{
                    title: 'Mi Perfil',
                    headerStyle: { backgroundColor: '#2196F3' },
                    headerTintColor: '#fff',
                    headerTitleStyle: { fontWeight: 'bold' },
                }}
            />
            <Stack.Screen
                name="MobilitySettings"
                component={MobilitySettingsScreen}
                options={{
                    title: 'Configuración',
                    headerStyle: { backgroundColor: '#2196F3' },
                    headerTintColor: '#fff',
                }}
            />
            <Stack.Screen
                name="MobilityNotifications"
                component={MobilityNotificationsScreen}
                options={{
                    title: 'Notificaciones',
                    headerStyle: { backgroundColor: '#2196F3' },
                    headerTintColor: '#fff',
                }}
            />
        </Stack.Navigator>
    );
}

export default function MobilityNavigator() {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;

                    if (route.name === 'DashboardTab') {
                        iconName = 'dashboard';
                    } else if (route.name === 'TripsTab') {
                        iconName = 'directions-car';
                    } else if (route.name === 'HistoryTab') {
                        iconName = 'history';
                    } else if (route.name === 'ProfileTab') {
                        iconName = 'person';
                    }

                    return <Icon name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: '#2196F3',
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
                component={MobilityDashboardStack}
                options={{
                    tabBarLabel: 'Inicio',
                }}
            />
            <Tab.Screen
                name="TripsTab"
                component={MobilityTripsStack}
                options={{
                    tabBarLabel: 'Viajes',
                }}
            />
            <Tab.Screen
                name="HistoryTab"
                component={MobilityHistoryStack}
                options={{
                    tabBarLabel: 'Historial',
                }}
            />
            <Tab.Screen
                name="ProfileTab"
                component={MobilityProfileStack}
                options={{
                    tabBarLabel: 'Perfil',
                }}
            />
        </Tab.Navigator>
    );
}