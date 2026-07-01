// src/api/deliveryApi.js
import axios from 'axios';

const API_BASE_URL = 'http://tu-backend-django.com/api/delivery/'; // Cambiar por tu URL real

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

// Interceptor para añadir el token de autenticación
api.interceptors.request.use(config => {
    const token = localStorage.getItem('token'); // O AsyncStorage si usas React Native
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default {
    // Obtener pedidos disponibles
    getAvailableOrders() {
        return api.get('orders/available/');
    },

    // Aceptar un pedido
    acceptOrder(orderId) {
        return api.post(`orders/${orderId}/accept/`);
    },

    // Rechazar un pedido
    rejectOrder(orderId) {
        return api.post(`orders/${orderId}/reject/`);
    },

    // Obtener historial de pedidos
    getOrderHistory() {
        return api.get('orders/history/');
    },

    // Obtener detalles de un pedido específico
    getOrderDetails(orderId) {
        return api.get(`orders/${orderId}/`);
    },

    // Actualizar perfil del repartidor
    updateProfile(profileData) {
        return api.put('profile/', profileData);
    },

    // Obtener configuración de costos
    getDeliveryCosts() {
        return api.get('costs/');
    },

    // Actualizar configuración de costos
    updateDeliveryCosts(costData) {
        return api.put('costs/', costData);
    },

    // Actualizar ubicación en tiempo real
    updateLocation(locationData) {
        return api.post('location/', locationData);
    },
};