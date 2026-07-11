// src/screens/store/StoreDashboardScreen.js
import React, { useContext, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    ScrollView,
    RefreshControl,
    Switch,
    Platform,
    Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { VendorContext } from '../../src/context/VendorContext';
import { NotificationContext } from '../../src/context/NotificationContext';

export default function StoreDashboardScreen() {
    const router = useRouter();
    const {
        vendorProfile,
        salesStats,
        orders,
        isStoreOpen,
        toggleStoreStatus,
        refreshData,
        isLoading,
    } = useContext(VendorContext);

    const { unreadCount } = useContext(NotificationContext);
    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = async () => {
        setRefreshing(true);
        await refreshData();
        setRefreshing(false);
    };

    const handleStoreToggle = () => {
        Alert.alert(
            isStoreOpen ? 'Cerrar comercio' : 'Abrir comercio',
            `¿Estás seguro que quieres ${isStoreOpen ? 'cerrar' : 'abrir'} tu comercio?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Confirmar', onPress: toggleStoreStatus },
            ]
        );
    };

    const pendingOrders = orders.filter(order => order.status === 'pending').length;
    const preparingOrders = orders.filter(order => order.status === 'preparing').length;

    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.content}>
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                >
                    {/* Header con estado del comercio */}
                    <View style={styles.header}>
                        <View style={styles.storeStatusContainer}>
                            <Text style={styles.storeStatusLabel}>
                                Estado del comercio
                            </Text>
                            <View style={styles.storeStatusRow}>
                                <View style={styles.statusIndicator}>
                                    <View
                                        style={[
                                            styles.statusDot,
                                            { backgroundColor: isStoreOpen ? '#4CAF50' : '#F44336' }
                                        ]}
                                    />
                                    <Text
                                        style={[
                                            styles.statusText,
                                            { color: isStoreOpen ? '#4CAF50' : '#F44336' }
                                        ]}
                                    >
                                        {isStoreOpen ? 'Abierto' : 'Cerrado'}
                                    </Text>
                                </View>
                                <Switch
                                    value={isStoreOpen}
                                    onValueChange={handleStoreToggle}
                                    trackColor={{ false: '#767577', true: '#4CAF50' }}
                                    thumbColor={isStoreOpen ? '#ffffff' : '#f4f3f4'}
                                />
                            </View>
                        </View>
                    </View>

                    {/* Tarjetas de estadísticas */}
                    <View style={styles.statsContainer}>
                        <View style={styles.statsRow}>
                            <TouchableOpacity
                                style={[styles.statCard, styles.primaryCard]}
                                onPress={() => router.push('/orders')}
                            >
                                <View style={styles.statCardHeader}>
                                    <Ionicons name="time-outline" size={24} color="#FFF" />
                                    <Text style={styles.statValue}>{pendingOrders}</Text>
                                </View>
                                <Text style={styles.statLabel}>Pedidos Pendientes</Text>
                                {pendingOrders > 0 && (
                                    <View style={styles.urgentBadge}>
                                        <Text style={styles.urgentText}>¡Urgente!</Text>
                                    </View>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.statCard, styles.secondaryCard]}
                                onPress={() => router.push({ pathname: '/orders', params: { filter: 'preparing' } })}
                            >
                                <View style={styles.statCardHeader}>
                                    <Ionicons name="restaurant-outline" size={24} color="#FF9800" />
                                    <Text style={[styles.statValue, { color: '#FF9800' }]}>
                                        {preparingOrders}
                                    </Text>
                                </View>
                                <Text style={[styles.statLabel, { color: '#666' }]}>
                                    Preparando
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.statsRow}>
                            <View style={[styles.statCard, styles.secondaryCard]}>
                                <View style={styles.statCardHeader}>
                                    <Ionicons name="cash-outline" size={24} color="#4CAF50" />
                                    <Text style={[styles.statValue, { color: '#4CAF50' }]}>
                                        ${salesStats.todayRevenue?.toFixed(0) || '0'}
                                    </Text>
                                </View>
                                <Text style={[styles.statLabel, { color: '#666' }]}>
                                    Ventas Hoy
                                </Text>
                            </View>

                            <View style={[styles.statCard, styles.secondaryCard]}>
                                <View style={styles.statCardHeader}>
                                    <Ionicons name="star-outline" size={24} color="#FFD700" />
                                    <Text style={[styles.statValue, { color: '#FFD700' }]}>
                                        {salesStats.averageRating?.toFixed(1) || '0.0'}
                                    </Text>
                                </View>
                                <Text style={[styles.statLabel, { color: '#666' }]}>
                                    Calificación
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Acceso rápido */}
                    <View style={styles.quickAccessContainer}>
                        <Text style={styles.sectionTitle}>Acceso Rápido</Text>

                        <TouchableOpacity
                            style={styles.menuCard}
                            onPress={() => router.push('/orders')}
                        >
                            <View style={styles.menuCardContent}>
                                <View style={styles.menuCardLeft}>
                                    <View style={[styles.menuIcon, { backgroundColor: '#FF6B6B' }]}>
                                        <Ionicons name="receipt-outline" size={24} color="#FFF" />
                                    </View>
                                    <View style={styles.menuCardText}>
                                        <Text style={styles.menuTitle}>Gestionar Pedidos</Text>
                                        <Text style={styles.menuSubtitle}>
                                            Ver y procesar pedidos entrantes
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.menuCardRight}>
                                    {pendingOrders > 0 && (
                                        <View style={styles.badge}>
                                            <Text style={styles.badgeText}>{pendingOrders}</Text>
                                        </View>
                                    )}
                                    <Ionicons name="chevron-forward" size={20} color="#666" />
                                </View>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.menuCard}
                            onPress={() => router.push('/product-list')}
                        >
                            <View style={styles.menuCardContent}>
                                <View style={styles.menuCardLeft}>
                                    <View style={[styles.menuIcon, { backgroundColor: '#4ECDC4' }]}>
                                        <Ionicons name="fast-food-outline" size={24} color="#FFF" />
                                    </View>
                                    <View style={styles.menuCardText}>
                                        <Text style={styles.menuTitle}>Mis Productos</Text>
                                        <Text style={styles.menuSubtitle}>
                                            Administrar catálogo de productos
                                        </Text>
                                    </View>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color="#666" />
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.menuCard}
                            onPress={() => router.push('/sales-report')}
                        >
                            <View style={styles.menuCardContent}>
                                <View style={styles.menuCardLeft}>
                                    <View style={[styles.menuIcon, { backgroundColor: '#45B7D1' }]}>
                                        <Ionicons name="bar-chart-outline" size={24} color="#FFF" />
                                    </View>
                                    <View style={styles.menuCardText}>
                                        <Text style={styles.menuTitle}>Reportes de Ventas</Text>
                                        <Text style={styles.menuSubtitle}>
                                            Estadísticas y análisis detallados
                                        </Text>
                                    </View>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color="#666" />
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.menuCard}
                            onPress={() => router.push('/store-profile')}
                        >
                            <View style={styles.menuCardContent}>
                                <View style={styles.menuCardLeft}>
                                    <View style={[styles.menuIcon, { backgroundColor: '#9B59B6' }]}>
                                        <Ionicons name="storefront-outline" size={24} color="#FFF" />
                                    </View>
                                    <View style={styles.menuCardText}>
                                        <Text style={styles.menuTitle}>Perfil del Comercio</Text>
                                        <Text style={styles.menuSubtitle}>
                                            Configuración y datos del negocio
                                        </Text>
                                    </View>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color="#666" />
                            </View>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    content: {
        flex: 1,
    },
    header: {
        backgroundColor: '#fff',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    storeStatusContainer: {
        alignItems: 'center',
    },
    storeStatusLabel: {
        fontSize: 16,
        color: '#666',
        marginBottom: 8,
    },
    storeStatusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        maxWidth: 200,
    },
    statusIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 8,
    },
    statusText: {
        fontSize: 16,
        fontWeight: '600',
    },
    statsContainer: {
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    statCard: {
        flex: 1,
        padding: 16,
        borderRadius: 12,
        marginHorizontal: 4,
        position: 'relative',
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
    primaryCard: {
        backgroundColor: '#FF6B6B',
    },
    secondaryCard: {
        backgroundColor: '#fff',
    },
    statCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFF',
    },
    statLabel: {
        fontSize: 14,
        color: '#FFF',
        opacity: 0.9,
    },
    urgentBadge: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: '#FFD700',
        borderRadius: 8,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    urgentText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#333',
    },
    quickAccessContainer: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 16,
    },
    menuCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
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
    menuCardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
    },
    menuCardLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    menuIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    menuCardText: {
        flex: 1,
    },
    menuTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    menuSubtitle: {
        fontSize: 14,
        color: '#666',
    },
    menuCardRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    badge: {
        backgroundColor: '#FF6B6B',
        borderRadius: 12,
        minWidth: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#FFF',
    },
});
