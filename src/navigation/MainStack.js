

// src/navigation/MainStack.js
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HomeScreen from '../screens/customer/HomeScreen';
import CartScreen from '../screens/customer/CartScreen';
import ProfileScreen from '../screens/customer/ProfileScreen';
import ProductDetailScreen from '../screens/customer/ProductDetailScreen';
import StoreProductsScreen from '../screens/customer/StoreProductsScreen';
import SearchResultsScreen from '../screens/customer/SearchResultsScreen';
import CheckoutScreen from '../screens/customer/CheckoutScreen';
import LocationPickerScreen from '../screens/customer/LocationPickerScreen';
import OrderTrackingScreen from '../screens/customer/OrderTrackingScreen';
import NotificationsScreen from '../screens/customer/NotificationsScreen';
import RideRequestScreen from '../screens/customer/RideRequestScreen';
import RideTrackingScreen from '../screens/customer/RideTrackingScreen';
import RideRatingScreen from '../screens/customer/RideRatingScreen';
import OrderHistoryScreen from '../screens/customer/OrderHistoryScreen';
import RideHistoryScreen from '../screens/customer/RideHistoryScreen';
import AddressBookScreen from '../screens/customer/AddressBookScreen';
import PaymentMethodsScreen from '../screens/customer/PaymentMethodsScreen';
import LogoutButton from '../components/LogoutButton';
import { screenOptionsWithLogout } from './config';

const Stack = createStackNavigator();

const screenOptions = {
    headerRight: () => <LogoutButton />,
    headerStyle: {
        backgroundColor: '#fff',
    },
    headerTintColor: '#000',
};

export default function MainStack() {
    const insets = useSafeAreaInsets();

    return (
        <Stack.Navigator>
            {/* Pantalla principal sin header */}
            <Stack.Screen
                name="Home"
                component={HomeScreen}
                options={{ headerShown: false }}
            />
            
            {/* Pantallas de delivery/productos */}
            <Stack.Screen
                name="Cart"
                component={CartScreen}
                options={{
                    headerShown: true,
                    headerStyle: {
                        backgroundColor: '#FFF',
                    },
                    headerTitle: 'Mi Carrito',
                    headerShadowVisible: true,
                }}
            />
            <Stack.Screen
                name="ProductDetail"
                component={ProductDetailScreen}
                options={{ 
                    headerShown: false,
                    presentation: 'modal'
                }}
            />
            <Stack.Screen
                name="StoreProducts"
                component={StoreProductsScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="SearchResults"
                component={SearchResultsScreen}
                options={{ 
                    title: 'Resultados de búsqueda',
                    ...screenOptions
                }}
            />
            <Stack.Screen
                name="Checkout"
                component={CheckoutScreen}
                options={{ 
                    title: 'Finalizar Compra',
                    headerBackTitle: 'Volver',
                    ...screenOptions
                }}
            />
            <Stack.Screen
                name="LocationPicker"
                component={LocationPickerScreen}
                options={{ 
                    title: 'Seleccionar Ubicación',
                    headerBackTitle: 'Volver',
                    presentation: 'modal'
                }}
            />
            <Stack.Screen
                name="OrderTracking"
                component={OrderTrackingScreen}
                options={{ 
                    title: 'Seguimiento de Pedido',
                    headerBackTitle: 'Inicio',
                    headerLeft: null, // Evitar que vuelvan atrás después de confirmar
                }}
            />

            {/* Pantallas de viajes/remis */}
            <Stack.Screen
                name="RideRequest"
                component={RideRequestScreen}
                options={{ 
                    headerShown: false,
                }}
            />
            <Stack.Screen
                name="RideTracking"
                component={RideTrackingScreen}
                options={{ 
                    headerShown: false,
                    gestureEnabled: false, // Evitar swipe back durante el viaje
                }}
            />
            <Stack.Screen
                name="RideRating"
                component={RideRatingScreen}
                options={{ 
                    headerShown: false,
                    gestureEnabled: false,
                }}
            />

            {/* Pantallas de perfil y configuración */}
            <Stack.Screen
                name="Profile"
                component={ProfileScreen}
                options={{ 
                    headerShown: false
                }}
            />
            <Stack.Screen
                name="Notifications"
                component={NotificationsScreen}
                options={{ 
                    headerShown: false
                }}
            />

            {/* Pantallas adicionales implementadas */}
            <Stack.Screen
                name="OrderHistory"
                component={OrderHistoryScreen}
                options={{ 
                    headerShown: false
                }}
            />
            <Stack.Screen
                name="RideHistory"
                component={RideHistoryScreen}
                options={{ 
                    headerShown: false
                }}
            />
            <Stack.Screen
                name="AddressBook"
                component={AddressBookScreen}
                options={{ 
                    headerShown: false
                }}
            />
            <Stack.Screen
                name="PaymentMethods"
                component={PaymentMethodsScreen}
                options={{ 
                    headerShown: false
                }}
            />
            
            {/* Pantallas adicionales que necesitarás crear */}
            <Stack.Screen
                name="Favorites"
                component={() => <div>Favorites - To implement</div>}
                options={{ 
                    title: 'Favoritos',
                    ...screenOptions
                }}
            />
            <Stack.Screen
                name="About"
                component={() => <div>About - To implement</div>}
                options={{ 
                    title: 'Acerca de',
                    ...screenOptions
                }}
            />
        </Stack.Navigator>
    );
}