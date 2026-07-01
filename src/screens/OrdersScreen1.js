// src/screens/store/OrdersScreen.js
import React, { useState, useEffect, useContext } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
    RefreshControl,
    Alert,
    Modal,
    ActivityIndicator,
    TextInput,
} from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const OrdersScreen = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const { authenticatedFetch, API_BASE_URL } = useContext(AuthContext);
    
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState('all'); // all, pending, preparing, ready, completed
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [rejectReason, setRejectReason] = useState('');

    const orderFilters = [
        { key: 'all', label: 'Todos', count: 0 },
        { key: 'pending', label: 'Pendientes', count: 0 },
        { key: 'preparing', label: 'Preparando', count: 0 },
        { key: 'ready', label: 'Listos', count: 0 },
        { key: 'completed', label: 'Completados', count: 0 },
    ];

    const rejectReasons = [
        'Producto agotado',
        'No podemos completar el pedido',
        'Dirección fuera de cobertura',
        'Problemas técnicos',
        'Otro motivo',
    ];

    useEffect(() => {
        loadOrders();
    }, [filter]);

    const loadOrders = async () => {
        try {
            setLoading(true);
            
            // Datos simulados - reemplaza con tu API
            const mockOrders = [
                {
                    id: 'ORD-001',
                    status: 'pending',
                    customer: {
                        name: 'Juan Pérez',
                        phone: '+54 9 11 1234-5678',
                        address: 'Av. Corrientes 1234, CABA'
                    },
                    items: [
                        { name: 'Hamburguesa Clásica', quantity: 2, price: 12.99 },
                        { name: 'Papas Fritas', quantity: 1, price: 5.50 },
                        { name: 'Coca Cola 500ml', quantity: 2, price: 2.50 }
                    ],
                    total: 36.48,
                    payment_method: 'cash',
                    delivery_notes: 'Sin cebolla en las hamburguesas',
                    created_at: '2025-01-15T14:30:00Z',
                    estimated_time: 25,
                },
                {
                    id: 'ORD-002',
                    status: 'preparing',
                    customer: {
                        name: 'María González',
                        phone: '+54 9 11 9876-5432',
                        address: 'Palermo Soho, Buenos Aires'
                    },
                    items: [
                        { name: 'Pizza Margherita', quantity: 1, price: 16.99 },
                        { name: 'Fanta 500ml', quantity: 1, price: 2.50 }
                    ],
                    total: 19.49,
                    payment_method: 'card',
                    delivery_notes: '',
                    created_at: '2025-01-15T14:25:00Z',
                    estimated_time: 20,
                    accepted_at: '2025-01-15T14:26:00Z',
                },
                {
                    id: 'ORD-003',
                    status: 'ready',
                    customer: {
                        name: 'Carlos López',
                        phone: '+54 9 11 5555-4444',
                        address: 'Recoleta, Buenos Aires'
                    },
                    items: [
                        { name: 'Ensalada César', quantity: 1, price: 14.50 },
                        { name: 'Agua Mineral', quantity: 1, price: 1.50 }
                    ],
                    total: 16.00,
                    payment_method: 'transfer',
                    delivery_notes: 'Dejar en portería',
                    created_at: '2025-01-15T14:15:00Z',
                    estimated_time: 15,
                    accepted_at: '2025-01-15T14:16:00Z',
                    prepared_at: '2025-01-15T14:35:00Z',
                },
                {
                    id: 'ORD-004',
                    status: 'completed',
                    customer: {
                        name: 'Ana Martínez',
                        phone: '+54 9 11 3333-2222',
                        address: 'Puerto Madero, Buenos Aires'
                    },
                    items: [
                        { name: 'Sándwich Club', quantity: 1, price: 11.50 },
                        { name: 'Café Americano', quantity: 1, price: 3.00 }
                    ],
                    total: 14.50,
                    payment_method: 'mercadopago',
                    delivery_notes: '',
                    created_at: '2025-01-15T13:45:00Z',
                    estimated_time: 18,
                    accepted_at: '2025-01-15T13:46:00Z',
                    prepared_at: '2025-01-15T14:05:00Z',
                    completed_at: '2025-01-15T14:20:00Z',
                }
            ];
            
            // Filtrar según el filtro seleccionado
            let filteredOrders = mockOrders;
            if (filter !== 'all') {
                filteredOrders = mockOrders.filter(order => order.status === filter);
            }
            
            setOrders(filteredOrders);
            
            // Actualizar contadores
            orderFilters.forEach(filterItem => {
                if (filterItem.key === 'all') {
                    filterItem.count = mockOrders.length;
                } else {
                    filterItem.count = mockOrders.filter(order => order.status === filterItem.key).length;
                }
            });
            
        } catch (error) {
            console.error('Error loading orders:', error);
            Alert.alert('Error', 'No se pudieron cargar los pedidos');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadOrders();
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return '#FF9800';
            case 'preparing': return '#2196F3';
            case 'ready': return '#4CAF50';
            case 'completed': return '#4CAF50';
            case 'cancelled': return '#F44336';
            default: return '#666';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'pending': return 'Pendiente';
            case 'preparing': return 'Preparando';
            case 'ready': return 'Listo';
            case 'completed': return 'Completado';
            case 'cancelled': return 'Cancelado';
            default: return 'Desconocido';
        }
    };

    const getPaymentMethodText = (method) => {
        switch (method) {
            case 'cash': return 'Efectivo';
            case 'card': return 'Tarjeta';
            case 'transfer': return 'Transferencia';
            case 'mercadopago': return 'Mercado Pago';
            default: return method;
        }
    };

    const formatTime = (dateString) => {
        return new Date(dateString).toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS'
        }).format(amount);
    };

    const handleAcceptOrder = async (order) => {
        try {
            // Aquí harías la llamada a tu API
            Alert.alert(
                'Pedido aceptado',
                `El pedido #${order.id} ha sido aceptado. Tiempo estimado: ${order.estimated_time} minutos.`,
                [
                    {
                        text: 'OK',
                        onPress: () => {
                            setOrders(prev => 
                                prev.map(o => 
                                    o.id === order.id 
                                        ? { ...o, status: 'preparing', accepted_at: new Date().toISOString() }
                                        : o
                                )
                            );
                        }
                    }
                ]
            );
        } catch (error) {
            Alert.alert('Error', 'No se pudo aceptar el pedido');
        }
    };

    const handleRejectOrder = (order) => {
        setSelectedOrder(order);
        setRejectReason('');
        setShowRejectModal(true);
    };

    const confirmRejectOrder = async () => {
        if (!rejectReason.trim()) {
            Alert.alert('Error', 'Por favor selecciona o ingresa un motivo');
            return;
        }

        try {
            // Aquí harías la llamada a tu API
            Alert.alert(
                'Pedido rechazado',
                `El pedido #${selectedOrder.id} ha sido rechazado.`,
                [
                    {
                        text: 'OK',
                        onPress: () => {
                            setOrders(prev => prev.filter(o => o.id !== selectedOrder.id));
                            setShowRejectModal(false);
                        }
                    }
                ]
            );
        } catch (error) {
            Alert.alert('Error', 'No se pudo rechazar el pedido');
        }
    };

    const handleMarkReady = async (order) => {
        try {
            // Aquí harías la llamada a tu API
            Alert.alert(
                'Pedido listo',
                `El pedido #${order.id} está listo para entregar.`,
                [
                    {
                        text: 'OK',
                        onPress: () => {
                            setOrders(prev => 
                                prev.map(o => 
                                    o.id === order.id 
                                        ? { ...o, status: 'ready', prepared_at: new Date().toISOString() }
                                        : o
                                )
                            );
                        }
                    }
                ]
            );
        } catch (error) {
            Alert.alert('Error', 'No se pudo marcar como listo');
        }
    };

    const renderFilterTabs = () => (
        <View style={styles.filterContainer}>
            <FlatList
                data={orderFilters}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={[
                            styles.filterTab,
                            filter === item.key && styles.activeFilterTab
                        ]}
                        onPress={() => setFilter(item.key)}
                    >
                        <Text style={[
                            styles.filterTabText,
                            filter === item.key && styles.activeFilterTabText
                        ]}>
                            {item.label}
                        </Text>
                        {item.count > 0 && (
                            <View style={styles.filterBadge}>
                                <Text style={styles.filterBadgeText}>{item.count}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                )}
                keyExtractor={(item) => item.key}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterList}
            />
        </View>
    );

    const renderRejectModal = () => (
        <Modal
            visible={showRejectModal}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setShowRejectModal(false)}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.rejectModal}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Rechazar Pedido</Text>
                        <TouchableOpacity onPress={() => setShowRejectModal(false)}>
                            <Icon name="close" size={24} color="#666" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.modalContent}>
                        <Text style={styles.rejectQuestion}>
                            ¿Por qué rechazas el pedido #{selectedOrder?.id}?
                        </Text>
                        
                        {rejectReasons.map((reason) => (
                            <TouchableOpacity
                                key={reason}
                                style={[
                                    styles.reasonOption,
                                    rejectReason === reason && styles.selectedReason
                                ]}
                                onPress={() => setRejectReason(reason)}
                            >
                                <Text style={[
                                    styles.reasonText,
                                    rejectReason === reason && styles.selectedReasonText
                                ]}>
                                    {reason}
                                </Text>
                            </TouchableOpacity>
                        ))}
                        
                        <TextInput
                            style={styles.customReasonInput}
                            placeholder="Otro motivo..."
                            value={rejectReason.includes('Otro motivo') ? '' : rejectReason}
                            onChangeText={setRejectReason}
                            multiline
                        />
                    </View>

                    <View style={styles.modalActions}>
                        <TouchableOpacity 
                            style={styles.cancelButton}
                            onPress={() => setShowRejectModal(false)}
                        >
                            <Text style={styles.cancelButtonText}>Cancelar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={styles.confirmRejectButton}
                            onPress={confirmRejectOrder}
                        >
                            <Text style={styles.confirmRejectText}>Rechazar Pedido</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );

    const renderOrderActions = (order) => {
        switch (order.status) {
            case 'pending':
                return (
                    <View style={styles.orderActions}>
                        <TouchableOpacity 
                            style={[styles.actionButton, styles.rejectButton]}
                            onPress={() => handleRejectOrder(order)}
                        >
                            <Icon name="close" size={16} color="#F44336" />
                            <Text style={[styles.actionButtonText, { color: '#F44336' }]}>
                                Rechazar
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={[styles.actionButton, styles.acceptButton]}
                            onPress={() => handleAcceptOrder(order)}
                        >
                            <Icon name="check" size={16} color="#FFF" />
                            <Text style={[styles.actionButtonText, { color: '#FFF' }]}>
                                Aceptar
                            </Text>
                        </TouchableOpacity>
                    </View>
                );
            case 'preparing':
                return (
                    <View style={styles.orderActions}>
                        <TouchableOpacity 
                            style={[styles.actionButton, styles.readyButton]}
                            onPress={() => handleMarkReady(order)}
                        >
                            <Icon name="done" size={16} color="#FFF" />
                            <Text style={[styles.actionButtonText, { color: '#FFF' }]}>
                                Marcar Listo
                            </Text>
                        </TouchableOpacity>
                    </View>
                );
            default:
                return null;
        }
    };

    const renderOrder = ({ item }) => (
        <TouchableOpacity 
            style={styles.orderCard}
            onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}
        >
            <View style={styles.orderHeader}>
                <View style={styles.orderInfo}>
                    <Text style={styles.orderNumber}>#{item.id}</Text>
                    <Text style={styles.orderTime}>{formatTime(item.created_at)}</Text>
                </View>
                <View style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(item.status) }
                ]}>
                    <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
                </View>
            </View>

            <View style={styles.customerInfo}>
                <View style={styles.customerDetails}>
                    <Text style={styles.customerName}>{item.customer.name}</Text>
                    <Text style={styles.customerAddress} numberOfLines={1}>
                        {item.customer.address}
                    </Text>
                </View>
                <TouchableOpacity 
                    style={styles.phoneButton}
                    onPress={() => {
                        // Llamar al cliente
                        Alert.alert(
                            'Llamar al cliente',
                            `¿Deseas llamar a ${item.customer.name}?`,
                            [
                                { text: 'Cancelar', style: 'cancel' },
                                { text: 'Llamar', onPress: () => {} }
                            ]
                        );
                    }}
                >
                    <Icon name="phone" size={20} color="#2196F3" />
                </TouchableOpacity>
            </View>

            <View style={styles.orderDetails}>
                <Text style={styles.itemsCount}>
                    {item.items.length} producto{item.items.length > 1 ? 's' : ''}
                </Text>
                <Text style={styles.orderTotal}>{formatCurrency(item.total)}</Text>
                <Text style={styles.paymentMethod}>
                    {getPaymentMethodText(item.payment_method)}
                </Text>
            </View>

            {item.delivery_notes && (
                <View style={styles.notesContainer}>
                    <Icon name="note" size={16} color="#666" />
                    <Text style={styles.notesText}>{item.delivery_notes}</Text>
                </View>
            )}

            <View style={styles.itemsList}>
                {item.items.map((orderItem, index) => (
                    <Text key={index} style={styles.itemText}>
                        {orderItem.quantity}x {orderItem.name}
                    </Text>
                ))}
            </View>

            {renderOrderActions(item)}
        </TouchableOpacity>
    );

    const renderEmptyState = () => (
        <View style={styles.emptyContainer}>
            <Icon name="receipt-long" size={80} color="#DDD" />
            <Text style={styles.emptyTitle}>
                {filter === 'all' ? 'No hay pedidos' : `No hay pedidos ${getStatusText(filter).toLowerCase()}s`}
            </Text>
            <Text style={styles.emptySubtitle}>
                Los nuevos pedidos aparecerán aquí
            </Text>
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
            
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity 
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Icon name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Pedidos</Text>
                <TouchableOpacity 
                    style={styles.refreshButton}
                    onPress={onRefresh}
                >
                    <Icon name="refresh" size={24} color="#2196F3" />
                </TouchableOpacity>
            </View>

            {/* Filter Tabs */}
            {renderFilterTabs()}

            {/* Orders List */}
            <FlatList
                data={orders}
                renderItem={renderOrder}
                keyExtractor={(item) => item.id}
                style={styles.list}
                contentContainerStyle={orders.length === 0 ? styles.emptyList : styles.listContent}
                ListEmptyComponent={loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#2196F3" />
                        <Text style={styles.loadingText}>Cargando pedidos...</Text>
                    </View>
                ) : renderEmptyState()}
                refreshControl={
                    <RefreshControl 
                        refreshing={refreshing} 
                        onRefresh={onRefresh}
                        colors={['#2196F3']}
                    />
                }
            />

            {renderRejectModal()}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5',
    },
    backButton: {
        padding: 8,
        marginRight: 8,
    },
    headerTitle: {
        flex: 1,
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
    },
    refreshButton: {
        padding: 8,
    },
    filterContainer: {
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5',
    },
    filterList: {
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    filterTab: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 8,
        backgroundColor: '#F5F5F5',
    },
    activeFilterTab: {
        backgroundColor: '#2196F3',
    },
    filterTabText: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    activeFilterTabText: {
        color: '#FFF',
        fontWeight: '600',
    },
    filterBadge: {
        backgroundColor: '#FF6B6B',
        borderRadius: 10,
        paddingHorizontal: 6,
        paddingVertical: 2,
        marginLeft: 6,
        minWidth: 20,
        alignItems: 'center',
    },
    filterBadgeText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: 'bold',
    },
    list: {
        flex: 1,
    },
    listContent: {
        paddingVertical: 8,
    },
    emptyList: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#666',
    },
    orderCard: {
        backgroundColor: '#FFF',
        marginHorizontal: 16,
        marginVertical: 6,
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    orderInfo: {
        flex: 1,
    },
    orderNumber: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 2,
    },
    orderTime: {
        fontSize: 12,
        color: '#666',
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    statusText: {
        fontSize: 12,
        color: '#FFF',
        fontWeight: 'bold',
    },
    customerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    customerDetails: {
        flex: 1,
    },
    customerName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    customerAddress: {
        fontSize: 14,
        color: '#666',
    },
    phoneButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: '#E3F2FD',
    },
    orderDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    itemsCount: {
        fontSize: 14,
        color: '#666',
    },
    orderTotal: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    paymentMethod: {
        fontSize: 12,
        color: '#666',
        backgroundColor: '#F0F0F0',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    notesContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF9C4',
        padding: 8,
        borderRadius: 8,
        marginBottom: 12,
    },
    notesText: {
        marginLeft: 8,
        fontSize: 14,
        color: '#F57F17',
        flex: 1,
    },
    itemsList: {
        marginBottom: 12,
    },
    itemText: {
        fontSize: 14,
        color: '#333',
        marginBottom: 4,
    },
    orderActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
        paddingTop: 12,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 6,
        marginLeft: 8,
    },
    actionButtonText: {
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 4,
    },
    rejectButton: {
        backgroundColor: '#FFEBEE',
        borderWidth: 1,
        borderColor: '#F44336',
    },
    acceptButton: {
        backgroundColor: '#4CAF50',
    },
    readyButton: {
        backgroundColor: '#FF9800',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 16,
        marginBottom: 8,
        textAlign: 'center',
    },
    emptySubtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    rejectModal: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        margin: 20,
        maxHeight: '80%',
        width: '90%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    modalContent: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        maxHeight: 400,
    },
    rejectQuestion: {
        fontSize: 16,
        color: '#333',
        marginBottom: 16,
    },
    reasonOption: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E5E5',
        marginBottom: 8,
    },
    selectedReason: {
        borderColor: '#F44336',
        backgroundColor: '#FFEBEE',
    },
    reasonText: {
        fontSize: 14,
        color: '#333',
    },
    selectedReasonText: {
        color: '#F44336',
        fontWeight: '600',
    },
    customReasonInput: {
        borderWidth: 1,
        borderColor: '#E5E5E5',
        borderRadius: 8,
        padding: 12,
        fontSize: 14,
        minHeight: 80,
        textAlignVertical: 'top',
        marginTop: 8,
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderTopWidth: 1,
        borderTopColor: '#E5E5E5',
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 8,
        backgroundColor: '#F5F5F5',
        marginRight: 8,
    },
    cancelButtonText: {
        fontSize: 16,
        color: '#666',
        fontWeight: '600',
    },
    confirmRejectButton: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 8,
        backgroundColor: '#F44336',
        marginLeft: 8,
    },
    confirmRejectText: {
        fontSize: 16,
        color: '#FFF',
        fontWeight: '600',
    },
});

export default OrdersScreen;