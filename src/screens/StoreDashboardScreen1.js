// src/screens/store/StoreDashboardScreen.js
import React, { useState, useEffect, useContext } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
    RefreshControl,
    Dimensions,
    Alert,
} from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { NotificationContext } from '../../context/NotificationContext';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LineChart, BarChart } from 'react-native-chart-kit';

const { width } = Dimensions.get('window');

const StoreDashboardScreen = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const { userData, authenticatedFetch, API_BASE_URL } = useContext(AuthContext);
    const { unreadCount } = useContext(NotificationContext);
    
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [timeFilter, setTimeFilter] = useState('today'); // today, week, month

    useEffect(() => {
        loadDashboardData();
    }, [timeFilter]);

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            
            // Datos simulados - reemplaza con tu API
            const mockData = {
                store_info: {
                    name: userData?.business_name || 'Mi Comercio',
                    is_open: true,
                    rating: 4.6,
                    total_reviews: 234,
                    total_products: 45,
                    followers: 1205,
                },
                today_stats: {
                    orders: 23,
                    revenue: 2850.50,
                    avg_order_value: 123.91,
                    pending_orders: 3,
                    completed_orders: 20,
                    cancelled_orders: 0,
                },
                week_stats: {
                    orders: 156,
                    revenue: 18456.80,
                    avg_order_value: 118.31,
                    growth_percentage: 12.5,
                },
                recent_orders: [
                    {
                        id: 'ORD-001',
                        customer_name: 'Juan Pérez',
                        items_count: 3,
                        total: 145.50,
                        status: 'pending',
                        created_at: '2025-01-15T14:30:00Z',
                    },
                    {
                        id: 'ORD-002',
                        customer_name: 'María González',
                        items_count: 2,
                        total: 89.20,
                        status: 'preparing',
                        created_at: '2025-01-15T14:25:00Z',
                    },
                    {
                        id: 'ORD-003',
                        customer_name: 'Carlos López',
                        items_count: 5,
                        total: 234.80,
                        status: 'ready',
                        created_at: '2025-01-15T14:15:00Z',
                    },
                ],
                sales_chart: {
                    labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
                    datasets: [{
                        data: [1200, 1800, 1500, 2200, 1900, 2800, 2400]
                    }]
                },
                top_products: [
                    { name: 'Hamburguesa Clásica', sold: 45, revenue: 675.00 },
                    { name: 'Pizza Margherita', sold: 32, revenue: 544.00 },
                    { name: 'Coca Cola 500ml', sold: 28, revenue: 140.00 },
                ],
            };
            
            setDashboardData(mockData);
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            Alert.alert('Error', 'No se pudieron cargar los datos del dashboard');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadDashboardData();
    };

    const toggleStoreStatus = async () => {
        try {
            const newStatus = !dashboardData.store_info.is_open;
            
            // Aquí harías la llamada a tu API
            setDashboardData(prev => ({
                ...prev,
                store_info: {
                    ...prev.store_info,
                    is_open: newStatus
                }
            }));
            
            Alert.alert(
                'Estado actualizado',
                `Tu comercio está ahora ${newStatus ? 'abierto' : 'cerrado'}`
            );
        } catch (error) {
            Alert.alert('Error', 'No se pudo actualizar el estado del comercio');
        }
    };

    const getOrderStatusColor = (status) => {
        switch (status) {
            case 'pending': return '#FF9800';
            case 'preparing': return '#2196F3';
            case 'ready': return '#4CAF50';
            case 'completed': return '#4CAF50';
            case 'cancelled': return '#F44336';
            default: return '#666';
        }
    };

    const getOrderStatusText = (status) => {
        switch (status) {
            case 'pending': return 'Pendiente';
            case 'preparing': return 'Preparando';
            case 'ready': return 'Listo';
            case 'completed': return 'Completado';
            case 'cancelled': return 'Cancelado';
            default: return 'Desconocido';
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS'
        }).format(amount);
    };

    const quickActions = [
        {
            id: 'orders',
            title: 'Pedidos',
            subtitle: `${dashboardData?.today_stats.pending_orders || 0} pendientes`,
            icon: 'receipt-long',
            color: '#FF9800',
            onPress: () => navigation.navigate('Orders'),
        },
        {
            id: 'products',
            title: 'Productos',
            subtitle: `${dashboardData?.store_info.total_products || 0} activos`,
            icon: 'inventory',
            color: '#2196F3',
            onPress: () => navigation.navigate('ProductList'),
        },
        {
            id: 'analytics',
            title: 'Estadísticas',
            subtitle: 'Ver reportes',
            icon: 'analytics',
            color: '#4CAF50',
            onPress: () => navigation.navigate('Analytics'),
        },
        {
            id: 'promotions',
            title: 'Promociones',
            subtitle: 'Gestionar ofertas',
            icon: 'local-offer',
            color: '#9C27B0',
            onPress: () => navigation.navigate('Promotions'),
        },
    ];

    if (loading && !refreshing) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <Text>Cargando dashboard...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
            
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Text style={styles.welcomeText}>¡Hola!</Text>
                    <Text style={styles.storeName}>{dashboardData?.store_info.name}</Text>
                </View>
                <View style={styles.headerActions}>
                    <TouchableOpacity 
                        style={styles.headerButton}
                        onPress={() => navigation.navigate('Notifications')}
                    >
                        <Icon name="notifications" size={24} color="#666" />
                        {unreadCount > 0 && (
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>{unreadCount}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={styles.headerButton}
                        onPress={() => navigation.navigate('StoreProfile')}
                    >
                        <Icon name="settings" size={24} color="#666" />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView 
                style={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                showsVerticalScrollIndicator={false}
            >
                {/* Store Status */}
                <View style={styles.section}>
                    <View style={styles.storeStatus}>
                        <View style={styles.statusInfo}>
                            <Text style={styles.statusLabel}>Estado del comercio</Text>
                            <Text style={[
                                styles.statusText,
                                { color: dashboardData?.store_info.is_open ? '#4CAF50' : '#F44336' }
                            ]}>
                                {dashboardData?.store_info.is_open ? 'Abierto' : 'Cerrado'}
                            </Text>
                        </View>
                        <TouchableOpacity
                            style={[
                                styles.statusToggle,
                                { backgroundColor: dashboardData?.store_info.is_open ? '#4CAF50' : '#F44336' }
                            ]}
                            onPress={toggleStoreStatus}
                        >
                            <Text style={styles.statusToggleText}>
                                {dashboardData?.store_info.is_open ? 'Cerrar' : 'Abrir'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Stats Cards */}
                <View style={styles.section}>
                    <View style={styles.statsContainer}>
                        <View style={styles.statCard}>
                            <Icon name="shopping-bag" size={24} color="#FF9800" />
                            <Text style={styles.statNumber}>{dashboardData?.today_stats.orders}</Text>
                            <Text style={styles.statLabel}>Pedidos hoy</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Icon name="attach-money" size={24} color="#4CAF50" />
                            <Text style={styles.statNumber}>
                                {formatCurrency(dashboardData?.today_stats.revenue || 0)}
                            </Text>
                            <Text style={styles.statLabel}>Ventas hoy</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Icon name="trending-up" size={24} color="#2196F3" />
                            <Text style={styles.statNumber}>
                                {formatCurrency(dashboardData?.today_stats.avg_order_value || 0)}
                            </Text>
                            <Text style={styles.statLabel}>Ticket promedio</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Icon name="star" size={24} color="#FFD700" />
                            <Text style={styles.statNumber}>{dashboardData?.store_info.rating}</Text>
                            <Text style={styles.statLabel}>Calificación</Text>
                        </View>
                    </View>
                </View>

                {/* Quick Actions */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Acciones rápidas</Text>
                    <View style={styles.quickActionsGrid}>
                        {quickActions.map((action) => (
                            <TouchableOpacity
                                key={action.id}
                                style={styles.quickActionCard}
                                onPress={action.onPress}
                            >
                                <View style={[styles.quickActionIcon, { backgroundColor: action.color }]}>
                                    <Icon name={action.icon} size={24} color="#FFF" />
                                </View>
                                <Text style={styles.quickActionTitle}>{action.title}</Text>
                                <Text style={styles.quickActionSubtitle}>{action.subtitle}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Sales Chart */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Ventas de la semana</Text>
                    <View style={styles.chartContainer}>
                        {dashboardData?.sales_chart && (
                            <LineChart
                                data={dashboardData.sales_chart}
                                width={width - 32}
                                height={200}
                                chartConfig={{
                                    backgroundColor: '#FFF',
                                    backgroundGradientFrom: '#FFF',
                                    backgroundGradientTo: '#FFF',
                                    decimalPlaces: 0,
                                    color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
                                    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                                    style: {
                                        borderRadius: 16
                                    },
                                    propsForDots: {
                                        r: "4",
                                        strokeWidth: "2",
                                        stroke: "#2196F3"
                                    }
                                }}
                                bezier
                                style={styles.chart}
                            />
                        )}
                    </View>
                </View>

                {/* Recent Orders */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Pedidos recientes</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Orders')}>
                            <Text style={styles.seeAllText}>Ver todos</Text>
                        </TouchableOpacity>
                    </View>
                    
                    {dashboardData?.recent_orders.map((order) => (
                        <TouchableOpacity
                            key={order.id}
                            style={styles.orderCard}
                            onPress={() => navigation.navigate('OrderDetail', { orderId: order.id })}
                        >
                            <View style={styles.orderInfo}>
                                <Text style={styles.orderNumber}>#{order.id}</Text>
                                <Text style={styles.customerName}>{order.customer_name}</Text>
                                <Text style={styles.orderDetails}>
                                    {order.items_count} productos • {formatCurrency(order.total)}
                                </Text>
                            </View>
                            <View style={styles.orderStatus}>
                                <View style={[
                                    styles.statusBadge,
                                    { backgroundColor: getOrderStatusColor(order.status) }
                                ]}>
                                    <Text style={styles.statusBadgeText}>
                                        {getOrderStatusText(order.status)}
                                    </Text>
                                </View>
                                <Icon name="chevron-right" size={20} color="#CCC" />
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Top Products */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Productos más vendidos</Text>
                    {dashboardData?.top_products.map((product, index) => (
                        <View key={index} style={styles.productRow}>
                            <View style={styles.productRank}>
                                <Text style={styles.rankNumber}>{index + 1}</Text>
                            </View>
                            <View style={styles.productInfo}>
                                <Text style={styles.productName}>{product.name}</Text>
                                <Text style={styles.productStats}>
                                    {product.sold} vendidos • {formatCurrency(product.revenue)}
                                </Text>
                            </View>
                        </View>
                    ))}
                </View>

                {/* Bottom Spacing */}
                <View style={{ height: 20 }} />
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5',
    },
    headerLeft: {
        flex: 1,
    },
    welcomeText: {
        fontSize: 14,
        color: '#666',
    },
    storeName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    headerActions: {
        flexDirection: 'row',
    },
    headerButton: {
        marginLeft: 16,
        position: 'relative',
    },
    badge: {
        position: 'absolute',
        top: -8,
        right: -8,
        backgroundColor: '#FF6B6B',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    badgeText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: 'bold',
    },
    content: {
        flex: 1,
    },
    section: {
        backgroundColor: '#FFF',
        marginHorizontal: 16,
        marginTop: 16,
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    storeStatus: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    statusInfo: {
        flex: 1,
    },
    statusLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    statusText: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    statusToggle: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    statusToggleText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: 'bold',
    },
    statsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    statCard: {
        width: '48%',
        backgroundColor: '#F8F9FA',
        borderRadius: 8,
        padding: 16,
        alignItems: 'center',
        marginBottom: 12,
    },
    statNumber: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginVertical: 8,
    },
    statLabel: {
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    seeAllText: {
        fontSize: 14,
        color: '#2196F3',
        fontWeight: '600',
    },
    quickActionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    quickActionCard: {
        width: '48%',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
    },
    quickActionIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    quickActionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    quickActionSubtitle: {
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
    },
    chartContainer: {
        alignItems: 'center',
    },
    chart: {
        marginVertical: 8,
        borderRadius: 16,
    },
    orderCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
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
    customerName: {
        fontSize: 14,
        color: '#666',
        marginBottom: 2,
    },
    orderDetails: {
        fontSize: 12,
        color: '#999',
    },
    orderStatus: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        marginRight: 8,
    },
    statusBadgeText: {
        fontSize: 10,
        color: '#FFF',
        fontWeight: 'bold',
    },
    productRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    productRank: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#2196F3',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    rankNumber: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: 'bold',
    },
    productInfo: {
        flex: 1,
    },
    productName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 2,
    },
    productStats: {
        fontSize: 12,
        color: '#666',
    },
});

export default StoreDashboardScreen;