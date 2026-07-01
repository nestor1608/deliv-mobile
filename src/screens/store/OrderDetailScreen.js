// src/screens/store/OrderDetailScreen.js
import React, { useContext, useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
    Linking,
    Platform,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker } from 'react-native-maps';
import { VendorContext } from '../../context/VendorContext';

const { width } = Dimensions.get('window');

const ORDER_STATUS = {
    pending: { label: 'Pendiente', color: '#FF9800', icon: 'time-outline' },
    accepted: { label: 'Aceptado', color: '#2196F3', icon: 'checkmark-circle-outline' },
    preparing: { label: 'Preparando', color: '#9C27B0', icon: 'restaurant-outline' },
    ready: { label: 'Listo', color: '#4CAF50', icon: 'checkmark-done-outline' },
    delivered: { label: 'Entregado', color: '#607D8B', icon: 'car-outline' },
    cancelled: { label: 'Cancelado', color: '#F44336', icon: 'close-circle-outline' },
};

export default function OrderDetailScreen({ route, navigation }) {
    const { orderId } = route.params;
    const { orders, updateOrderStatus } = useContext(VendorContext);
    const [order, setOrder] = useState(null);

    useEffect(() => {
        const foundOrder = orders.find(o => o.id === orderId);
        if (foundOrder) {
            setOrder(foundOrder);
        } else {
            // Si no está en la lista local, hacer fetch del backend
            fetchOrderDetail();
        }
    }, [orderId, orders]);

    const fetchOrderDetail = async () => {
        // Implementar fetch del detalle del pedido desde el backend
        // Por ahora usamos datos mock
        const mockOrder = {
            id: orderId,
            customer: {
                name: 'Juan Pérez',
                phone: '+54 9 11 1234-5678',
                email: 'juan@example.com',
            },
            delivery_address: {
                street_address: 'Av. Corrientes 1234, CABA',
                latitude: -34.6037,
                longitude: -58.3816,
                notes: 'Apartamento 5B, timbre 15',
            },
            items: [
                {
                    id: 1,
                    product: { name: 'Hamburguesa Clásica', image: null },
                    quantity: 2,
                    unit_price: 800,
                    subtotal: 1600,
                    notes: 'Sin cebolla',
                },
                {
                    id: 2,
                    product: { name: 'Papas Fritas', image: null },
                    quantity: 1,
                    unit_price: 400,
                    subtotal: 400,
                    notes: '',
                },
            ],
            subtotal: 2000,
            delivery_fee: 200,
            total: 2200,
            payment_method: 'cash',
            status: 'pending',
            created_at: new Date().toISOString(),
            estimated_delivery: new Date(Date.now() + 30 * 60000).toISOString(),
            notes: 'Por favor tocar el timbre dos veces',
        };
        setOrder(mockOrder);
    };

    const handleStatusUpdate = async (newStatus) => {
        Alert.alert(
            'Confirmar cambio',
            `¿Estás seguro que quieres cambiar el estado a "${ORDER_STATUS[newStatus].label}"?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Confirmar',
                    onPress: async () => {
                        try {
                            await updateOrderStatus(orderId, newStatus);
                            setOrder(prev => ({ ...prev, status: newStatus }));
                            Alert.alert('Éxito', 'Estado actualizado correctamente');
                        } catch (error) {
                            Alert.alert('Error', 'No se pudo actualizar el estado');
                        }
                    },
                },
            ]
        );
    };

    const handleCallCustomer = () => {
        const phoneNumber = order.customer.phone.replace(/\s/g, '');
        const url = `tel:${phoneNumber}`;
        Linking.openURL(url);
    };

    const handleOpenMaps = () => {
        const { latitude, longitude } = order.delivery_address;
        const url = Platform.select({
            ios: `maps:${latitude},${longitude}`,
            android: `geo:${latitude},${longitude}`,
        });
        Linking.openURL(url);
    };

    const getStatusActions = (currentStatus) => {
        const actions = [];
        
        switch (currentStatus) {
            case 'pending':
                actions.push(
                    { status: 'accepted', label: 'Aceptar Pedido', color: '#4CAF50' },
                    { status: 'cancelled', label: 'Rechazar', color: '#F44336' }
                );
                break;
            case 'accepted':
                actions.push(
                    { status: 'preparing', label: 'Comenzar Preparación', color: '#9C27B0' }
                );
                break;
            case 'preparing':
                actions.push(
                    { status: 'ready', label: 'Marcar como Listo', color: '#4CAF50' }
                );
                break;
            case 'ready':
                actions.push(
                    { status: 'delivered', label: 'Marcar como Entregado', color: '#607D8B' }
                );
                break;
        }
        
        return actions;
    };

    if (!order) {
        return (
            <View style={styles.loadingContainer}>
                <Text>Cargando pedido...</Text>
            </View>
        );
    }

    const statusInfo = ORDER_STATUS[order.status];
    const statusActions = getStatusActions(order.status);

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {/* Header con estado */}
            <View style={styles.header}>
                <View style={styles.orderIdSection}>
                    <Text style={styles.orderIdText}>Pedido #{order.id}</Text>
                    <Text style={styles.orderTime}>
                        {new Date(order.created_at).toLocaleDateString('es-AR')} a las{' '}
                        {new Date(order.created_at).toLocaleTimeString('es-AR', {
                            hour: '2-digit',
                            minute: '2-digit',
                        })}
                    </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: statusInfo.color }]}>
                    <Ionicons name={statusInfo.icon} size={16} color="#FFF" />
                    <Text style={styles.statusText}>{statusInfo.label}</Text>
                </View>
            </View>

            {/* Información del cliente */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Información del Cliente</Text>
                <View style={styles.customerCard}>
                    <View style={styles.customerInfo}>
                        <Text style={styles.customerName}>{order.customer.name}</Text>
                        <Text style={styles.customerDetail}>{order.customer.phone}</Text>
                        {order.customer.email && (
                            <Text style={styles.customerDetail}>{order.customer.email}</Text>
                        )}
                    </View>
                    <TouchableOpacity
                        style={styles.callButton}
                        onPress={handleCallCustomer}
                    >
                        <Ionicons name="call" size={20} color="#FFF" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Dirección de entrega */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Dirección de Entrega</Text>
                <View style={styles.addressCard}>
                    <View style={styles.addressInfo}>
                        <Text style={styles.addressText}>
                            {order.delivery_address.street_address}
                        </Text>
                        {order.delivery_address.notes && (
                            <Text style={styles.addressNotes}>
                                Notas: {order.delivery_address.notes}
                            </Text>
                        )}
                    </View>
                    <TouchableOpacity
                        style={styles.mapButton}
                        onPress={handleOpenMaps}
                    >
                        <Ionicons name="map" size={20} color="#FFF" />
                    </TouchableOpacity>
                </View>
                
                {/* Mini mapa */}
                <View style={styles.mapContainer}>
                    <MapView
                        style={styles.map}
                        initialRegion={{
                            latitude: order.delivery_address.latitude,
                            longitude: order.delivery_address.longitude,
                            latitudeDelta: 0.01,
                            longitudeDelta: 0.01,
                        }}
                        scrollEnabled={false}
                        zoomEnabled={false}
                    >
                        <Marker
                            coordinate={{
                                latitude: order.delivery_address.latitude,
                                longitude: order.delivery_address.longitude,
                            }}
                            title="Dirección de entrega"
                        />
                    </MapView>
                </View>
            </View>

            {/* Items del pedido */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Productos del Pedido</Text>
                <View style={styles.itemsCard}>
                    {order.items.map((item, index) => (
                        <View key={item.id} style={styles.itemRow}>
                            <View style={styles.itemInfo}>
                                <Text style={styles.itemName}>
                                    {item.quantity}x {item.product.name}
                                </Text>
                                {item.notes && (
                                    <Text style={styles.itemNotes}>
                                        Nota: {item.notes}
                                    </Text>
                                )}
                            </View>
                            <Text style={styles.itemPrice}>${item.subtotal}</Text>
                        </View>
                    ))}
                    
                    <View style={styles.totalsSection}>
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Subtotal:</Text>
                            <Text style={styles.totalValue}>${order.subtotal}</Text>
                        </View>
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Envío:</Text>
                            <Text style={styles.totalValue}>${order.delivery_fee}</Text>
                        </View>
                        <View style={[styles.totalRow, styles.finalTotal]}>
                            <Text style={styles.finalTotalLabel}>Total:</Text>
                            <Text style={styles.finalTotalValue}>${order.total}</Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* Información de pago */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Método de Pago</Text>
                <View style={styles.paymentCard}>
                    <Ionicons
                        name={order.payment_method === 'cash' ? 'cash-outline' : 'card-outline'}
                        size={24}
                        color="#4CAF50"
                    />
                    <Text style={styles.paymentText}>
                        {order.payment_method === 'cash' ? 'Efectivo' : 'Tarjeta'}
                    </Text>
                    {order.payment_method === 'cash' && (
                        <View style={styles.cashBadge}>
                            <Text style={styles.cashBadgeText}>Cobrar al entregar</Text>
                        </View>
                    )}
                </View>
            </View>

            {/* Notas especiales */}
            {order.notes && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Notas Especiales</Text>
                    <View style={styles.notesCard}>
                        <Text style={styles.notesText}>{order.notes}</Text>
                    </View>
                </View>
            )}

            {/* Acciones */}
            <View style={styles.actionsSection}>
                {statusActions.map((action, index) => (
                    <TouchableOpacity
                        key={index}
                        style={[styles.actionButton, { backgroundColor: action.color }]}
                        onPress={() => handleStatusUpdate(action.status)}
                    >
                        <Text style={styles.actionButtonText}>{action.label}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <View style={styles.bottomSpacer} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        backgroundColor: '#fff',
        padding: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    orderIdSection: {
        flex: 1,
    },
    orderIdText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    orderTime: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#FFF',
        marginLeft: 4,
    },
    section: {
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 12,
        paddingHorizontal: 20,
    },
    customerCard: {
        backgroundColor: '#fff',
        marginHorizontal: 20,
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 2,
            },
            android: {
                elevation: 2,
            },
        }),
    },
    customerInfo: {
        flex: 1,
    },
    customerName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    customerDetail: {
        fontSize: 14,
        color: '#666',
        marginBottom: 2,
    },
    callButton: {
        backgroundColor: '#4CAF50',
        borderRadius: 24,
        width: 48,
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
    },
    addressCard: {
        backgroundColor: '#fff',
        marginHorizontal: 20,
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 2,
            },
            android: {
                elevation: 2,
            },
        }),
    },
    addressInfo: {
        flex: 1,
    },
    addressText: {
        fontSize: 16,
        color: '#333',
        marginBottom: 4,
    },
    addressNotes: {
        fontSize: 14,
        color: '#666',
        fontStyle: 'italic',
    },
    mapButton: {
        backgroundColor: '#2196F3',
        borderRadius: 24,
        width: 48,
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
    },
    mapContainer: {
        marginHorizontal: 20,
        borderRadius: 12,
        overflow: 'hidden',
        height: 150,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 2,
            },
            android: {
                elevation: 2,
            },
        }),
    },
    map: {
        flex: 1,
    },
    itemsCard: {
        backgroundColor: '#fff',
        marginHorizontal: 20,
        borderRadius: 12,
        padding: 16,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 2,
            },
            android: {
                elevation: 2,
            },
        }),
    },
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    itemInfo: {
        flex: 1,
    },
    itemName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 2,
    },
    itemNotes: {
        fontSize: 14,
        color: '#666',
        fontStyle: 'italic',
    },
    itemPrice: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#4CAF50',
    },
    totalsSection: {
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    totalLabel: {
        fontSize: 14,
        color: '#666',
    },
    totalValue: {
        fontSize: 14,
        color: '#333',
    },
    finalTotal: {
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
        paddingTop: 8,
        marginTop: 8,
    },
    finalTotalLabel: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    finalTotalValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#4CAF50',
    },
    paymentCard: {
        backgroundColor: '#fff',
        marginHorizontal: 20,
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 2,
            },
            android: {
                elevation: 2,
            },
        }),
    },
    paymentText: {
        fontSize: 16,
        color: '#333',
        marginLeft: 12,
        flex: 1,
    },
    cashBadge: {
        backgroundColor: '#FFF3CD',
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    cashBadgeText: {
        fontSize: 12,
        color: '#856404',
        fontWeight: '600',
    },
    notesCard: {
        backgroundColor: '#fff',
        marginHorizontal: 20,
        borderRadius: 12,
        padding: 16,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 2,
            },
            android: {
                elevation: 2,
            },
        }),
    },
    notesText: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
    },
    actionsSection: {
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    actionButton: {
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        marginBottom: 12,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
            },
            android: {
                elevation: 3,
            },
        }),
    },
    actionButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFF',
    },
    bottomSpacer: {
        height: 40,
    },
});