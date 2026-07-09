// src/screens/customer/OrderHistoryScreen.js
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
    Image,
    ActivityIndicator,
} from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const OrderHistoryScreen = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const { authenticatedFetch, API_BASE_URL } = useContext(AuthContext);
    
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState('all'); // all, completed, cancelled

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
                    status: 'delivered',
                    store_name: 'Burger Palace',
                    store_image: 'https://via.placeholder.com/60x60/FF6B6B/FFFFFF?text=BP',
                    items_count: 3,
                    total: 28.50,
                    currency: 'ARS',
                    created_at: '2025-01-15T19:30:00Z',
                    delivered_at: '2025-01-15T20:15:00Z',
                    items: [
                        { name: 'Hamburguesa Clásica', quantity: 2 },
                        { name: 'Papas Fritas', quantity: 1 }
                    ]
                },
                {
                    id: 'ORD-002',
                    status: 'cancelled',
                    store_name: 'Supermercado Central',
                    store_image: 'https://via.placeholder.com/60x60/4ECDC4/FFFFFF?text=SC',
                    items_count: 5,
                    total: 45.20,
                    currency: 'ARS',
                    created_at: '2025-01-14T16:20:00Z',
                    cancelled_at: '2025-01-14T16:35:00Z',
                    items: [
                        { name: 'Leche 1L', quantity: 2 },
                        { name: 'Pan Integral', quantity: 1 },
                        { name: 'Yogur Natural', quantity: 2 }
                    ]
                },
                {
                    id: 'ORD-003',
                    status: 'delivered',
                    store_name: 'Farmacia Salud',
                    store_image: 'https://via.placeholder.com/60x60/45B7D1/FFFFFF?text=FS',
                    items_count: 2,
                    total: 15.80,
                    currency: 'ARS',
                    created_at: '2025-01-12T10:45:00Z',
                    delivered_at: '2025-01-12T11:20:00Z',
                    items: [
                        { name: 'Paracetamol 500mg', quantity: 1 },
                        { name: 'Ibuprofeno 600mg', quantity: 1 }
                    ]
                }
            ];
            
            let filteredOrders = mockOrders;
            if (filter !== 'all') {
                filteredOrders = mockOrders.filter(order => {
                    if (filter === 'completed') return order.status === 'delivered';
                    if (filter === 'cancelled') return order.status === 'cancelled';
                    return true;
                });
            }
            
            setOrders(filteredOrders);
        } catch (error) {
            console.error('Error loading orders:', error);
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
            case 'delivered': return '#4CAF50';
            case 'cancelled': return '#F44336';
            case 'in_progress': return '#FF9800';
            case 'scheduled': return '#9C27B0';
            default: return '#666';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'delivered': return 'Entregado';
            case 'cancelled': return 'Cancelado';
            case 'in_progress': return 'En progreso';
            case 'preparing': return 'Preparando';
            case 'scheduled': return 'Programado';
            default: return 'Desconocido';
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleReorder = (order) => {
        // Implementar reordenar
        navigation.navigate('StoreProducts', {
            storeId: order.store_id,
            storeName: order.store_name,
            reorderItems: order.items
        });
    };

    const handleTrackOrder = (order) => {
        if (order.status === 'in_progress' || order.status === 'preparing') {
            navigation.navigate('OrderTracking', { orderId: order.id });
        }
    };

    const renderFilterTabs = () => (
        <View style={styles.filterContainer}>
            {[
                { key: 'all', label: 'Todos' },
                { key: 'completed', label: 'Completados' },
                { key: 'cancelled', label: 'Cancelados' }
            ].map((tab) => (
                <TouchableOpacity
                    key={tab.key}
                    style={[
                        styles.filterTab,
                        filter === tab.key && styles.activeFilterTab
                    ]}
                    onPress={() => setFilter(tab.key)}
                >
                    <Text style={[
                        styles.filterTabText,
                        filter === tab.key && styles.activeFilterTabText
                    ]}>
                        {tab.label}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    );

    const renderOrder = ({ item }) => (
        <View style={styles.orderCard}>
            <View style={styles.orderHeader}>
                <View style={styles.orderInfo}>
                    <Image source={{ uri: item.store_image }} style={styles.storeImage} />
                    <View style={styles.orderBasicInfo}>
                        <Text style={styles.storeName}>{item.store_name}</Text>
                        <Text style={styles.orderId}>Pedido #{item.id}</Text>
                        <Text style={styles.orderDate}>{formatDate(item.created_at)}</Text>
                    </View>
                </View>
                <View style={styles.orderStatus}>
                    <View style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusColor(item.status) }
                    ]}>
                        <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
                    </View>
                    {item.status === 'scheduled' && item.scheduled_time && (
                        <View style={styles.scheduledBadge}>
                            <Text style={styles.scheduledBadgeText}>
                                {new Date(item.scheduled_time).toLocaleString('es-AR')}
                            </Text>
                        </View>
                    )}
                </View>
            </View>

            <View style={styles.orderDetails}>
                <Text style={styles.itemsPreview}>
                    {item.items.map(item => `${item.quantity}x ${item.name}`).join(', ')}
                </Text>
                <View style={styles.orderMeta}>
                    <Text style={styles.itemsCount}>{item.items_count} productos</Text>
                    <Text style={styles.orderTotal}>${item.total.toFixed(2)}</Text>
                </View>
            </View>

            <View style={styles.orderActions}>
                <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => handleReorder(item)}
                >
                    <Icon name="refresh" size={16} color="#2196F3" />
                    <Text style={styles.actionButtonText}>Reordenar</Text>
                </TouchableOpacity>
                
                {(item.status === 'in_progress' || item.status === 'preparing') && (
                    <TouchableOpacity 
                        style={[styles.actionButton, styles.trackButton]}
                        onPress={() => handleTrackOrder(item)}
                    >
                        <Icon name="location-on" size={16} color="#4CAF50" />
                        <Text style={[styles.actionButtonText, { color: '#4CAF50' }]}>
                            Rastrear
                        </Text>
                    </TouchableOpacity>
                )}
                
                <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => {
                        // Ver detalles completos del pedido
                        navigation.navigate('OrderDetail', { orderId: item.id });
                    }}
                >
                    <Icon name="receipt" size={16} color="#666" />
                    <Text style={styles.actionButtonText}>Detalles</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderEmptyState = () => (
        <View style={styles.emptyContainer}>
            <Icon name="receipt-long" size={80} color="#DDD" />
            <Text style={styles.emptyTitle}>
                {filter === 'all' ? 'No tienes pedidos' : `No tienes pedidos ${filter === 'completed' ? 'completados' : 'cancelados'}`}
            </Text>
            <Text style={styles.emptySubtitle}>
                Cuando hagas pedidos, aparecerán aquí
            </Text>
            <TouchableOpacity 
                style={styles.startShoppingButton}
                onPress={() => navigation.navigate('Home')}
            >
                <Text style={styles.startShoppingText}>Comenzar a comprar</Text>
            </TouchableOpacity>
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
                <Text style={styles.headerTitle}>Mis Pedidos</Text>
                <View style={styles.headerSpacer} />
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
    headerSpacer: {
        width: 40,
    },
    filterContainer: {
        flexDirection: 'row',
        backgroundColor: '#FFF',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5',
    },
    filterTab: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 8,
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
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    orderInfo: {
        flexDirection: 'row',
        flex: 1,
    },
    storeImage: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 12,
    },
    orderBasicInfo: {
        flex: 1,
    },
    storeName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 2,
    },
    orderId: {
        fontSize: 12,
        color: '#666',
        marginBottom: 2,
    },
    orderDate: {
        fontSize: 12,
        color: '#999',
    },
    orderStatus: {
        alignItems: 'flex-end',
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 12,
        color: '#FFF',
        fontWeight: 'bold',
    },
    scheduledBadge: {
        backgroundColor: '#F3E5F5',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        marginTop: 4,
    },
    scheduledBadgeText: {
        fontSize: 11,
        color: '#9C27B0',
        fontWeight: '500',
    },
    orderDetails: {
        marginBottom: 12,
    },
    itemsPreview: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
    },
    orderMeta: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    itemsCount: {
        fontSize: 14,
        color: '#666',
    },
    orderTotal: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
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
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
        marginLeft: 8,
    },
    actionButtonText: {
        fontSize: 14,
        color: '#2196F3',
        marginLeft: 4,
        fontWeight: '500',
    },
    trackButton: {
        backgroundColor: '#E8F5E8',
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
        marginBottom: 32,
    },
    startShoppingButton: {
        backgroundColor: '#2196F3',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    startShoppingText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default OrderHistoryScreen;