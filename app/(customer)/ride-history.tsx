import React, { useState, useContext } from 'react';
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
import { useRouter } from 'expo-router';
import { AuthContext } from '../../src/context/AuthContext';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../src/services/apiClient';

export default function RideHistoryScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState('all');

    // Query for rides - real API call
    const { data: apiRides = [], isLoading, refetch } = useQuery({
        queryKey: ['rides'],
        queryFn: () =>
            apiClient.get('mobility/trips/').then(data => {
                return Array.isArray(data) ? data : (data.results || []);
            }),
        staleTime: 30000,
    });

    const loading = isLoading;

    // Filter rides based on the filter state
    const getFilteredRides = (allRides) => {
        if (filter === 'all') return allRides;
        return allRides.filter(ride => {
            if (filter === 'completed') return ride.status === 'completed';
            if (filter === 'cancelled') return ride.status.startsWith('cancelled');
            return true;
        });
    };

    const filteredRides = getFilteredRides(apiRides);

    const onRefresh = () => {
        setRefreshing(true);
        refetch().finally(() => setRefreshing(false));
    };

    const getStatusColor = (status) => {
        if (status === 'completed') return '#4CAF50';
        if (status.startsWith('cancelled')) return '#F44336';
        if (['requested', 'accepted', 'driver_arrived', 'in_progress'].includes(status)) return '#2196F3';
        return '#666';
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'requested': return 'Solicitado';
            case 'accepted': return 'Conductor asignado';
            case 'driver_arrived': return 'Conductor en el lugar';
            case 'in_progress': return 'Viajando';
            case 'completed': return 'Completado';
            case 'cancelled_customer': return 'Cancelado (tú)';
            case 'cancelled_driver': return 'Cancelado (conductor)';
            default: return status || 'Desconocido';
        }
    };

    const getVehicleTypeText = (type) => {
        switch (type) {
            case 'economy': return 'Económico';
            case 'comfort': return 'Confort';
            case 'premium': return 'Premium';
            default: return 'Estándar';
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

    const formatDuration = (minutes) => {
        if (minutes < 60) return `${minutes} min`;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}m`;
    };

    const handleRebookRide = (ride) => {
        router.push({
            pathname: '/ride-request',
            params: {
                prefilledData: JSON.stringify({
                    pickup_address: ride.pickup_address,
                    destination_address: ride.destination_address,
                    vehicle_type: ride.vehicle_type
                })
            }
        });
    };

    const handleRateRide = (ride) => {
        router.push({
            pathname: '/ride-rating',
            params: { rideId: ride.id, rideData: JSON.stringify(ride) }
        });
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

    const renderRide = ({ item }) => (
        <View style={styles.rideCard}>
            <View style={styles.rideHeader}>
                <View style={styles.rideInfo}>
                    <View style={styles.statusContainer}>
                        <View style={[
                            styles.statusBadge,
                            { backgroundColor: getStatusColor(item.status) }
                        ]}>
                            <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
                        </View>
                        <Text style={styles.vehicleType}>{getVehicleTypeText(item.vehicle_type)}</Text>
                    </View>
                    <Text style={styles.rideId}>Viaje #{item.id}</Text>
                    <Text style={styles.rideDate}>{formatDate(item.created_at)}</Text>
                </View>
            </View>
            <View style={styles.routeContainer}>
                <View style={styles.routePoint}>
                    <Icon name="radio-button-checked" size={16} color="#4CAF50" />
                    <Text style={styles.routeText} numberOfLines={1}>
                        {item.pickup_address}
                    </Text>
                </View>
                <View style={styles.routeLine} />
                <View style={styles.routePoint}>
                    <Icon name="location-on" size={16} color="#F44336" />
                    <Text style={styles.routeText} numberOfLines={1}>
                        {item.destination_address}
                    </Text>
                </View>
            </View>
            {item.driver_info && (
                <View style={styles.driverInfo}>
                    <View style={[styles.driverPhoto, { backgroundColor: '#E0E0E0', justifyContent: 'center', alignItems: 'center' }]}>
                        <Text style={{ fontSize: 18, color: '#333' }}>{item.driver_info.name.charAt(0)}</Text>
                    </View>
                    <View style={styles.driverDetails}>
                        <Text style={styles.driverName}>{item.driver_info.name}</Text>
                        <View style={styles.driverMeta}>
                            <Icon name="star" size={14} color="#FFD700" />
                            <Text style={styles.driverRating}>{item.driver_info.rating}</Text>
                            <Text style={styles.vehicleInfo}>
                                 - {item.driver_info.vehicle} ({item.driver_info.plate})
                            </Text>
                        </View>
                    </View>
                </View>
            )}
            <View style={styles.rideDetails}>
                <View style={styles.rideStats}>
                    <View style={styles.statItem}>
                        <Icon name="straighten" size={16} color="#666" />
                        <Text style={styles.statText}>{item.actual_distance || item.estimated_distance || 0} km</Text>
                    </View>
                    {item.estimated_duration && (
                        <View style={styles.statItem}>
                            <Icon name="schedule" size={16} color="#666" />
                            <Text style={styles.statText}>{formatDuration(item.actual_duration || item.estimated_duration)}</Text>
                        </View>
                    )}
                    <View style={styles.statItem}>
                        <Icon name="attach-money" size={16} color="#666" />
                        <Text style={styles.statText}>
                            ${item.total_fare || item.estimated_fare || 0}
                        </Text>
                    </View>
                </View>
            </View>
            <View style={styles.rideActions}>
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleRebookRide(item)}
                >
                    <Icon name="refresh" size={16} color="#2196F3" />
                    <Text style={styles.actionButtonText}>Repetir viaje</Text>
                </TouchableOpacity>

                {item.status === 'completed' && !item.rating_given && (
                    <TouchableOpacity
                        style={[styles.actionButton, styles.rateButton]}
                        onPress={() => handleRateRide(item)}
                    >
                        <Icon name="star-rate" size={16} color="#FFD700" />
                        <Text style={[styles.actionButtonText, { color: '#FFD700' }]}>
                            Calificar
                        </Text>
                    </TouchableOpacity>
                )}

                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => {
                        if (['requested', 'accepted', 'driver_arrived', 'in_progress'].includes(item.status)) {
                            router.push({ pathname: '/ride-tracking', params: { rideId: item.id } });
                        } else {
                            console.log('Detalles: ', item.id);
                        }
                    }}
                >
                    <Icon name={['requested', 'accepted', 'driver_arrived', 'in_progress'].includes(item.status) ? "directions-car" : "receipt"} size={16} color="#666" />
                    <Text style={styles.actionButtonText}>
                        {['requested', 'accepted', 'driver_arrived', 'in_progress'].includes(item.status) ? "Ver mapa" : "Detalles"}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderEmptyState = () => (
        <View style={styles.emptyContainer}>
            <Icon name="directions-car" size={80} color="#DDD" />
            <Text style={styles.emptyTitle}>
                {filter === 'all' ? 'No tienes viajes' : `No tienes viajes ${filter === 'completed' ? 'completados' : 'cancelados'}`}
            </Text>
            <Text style={styles.emptySubtitle}>
                Cuando solicites viajes, aparecerán aquí
            </Text>
            <TouchableOpacity
                style={styles.requestRideButton}
                onPress={() => router.push('/ride-request')}
            >
                <Text style={styles.requestRideText}>Solicitar viaje</Text>
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
                    onPress={() => router.back()}
                >
                    <Icon name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Mis Viajes</Text>
                <View style={styles.headerSpacer} />
            </View>

            {/* Filter Tabs */}
            {renderFilterTabs()}

            {/* Rides List */}
            <FlatList
                data={filteredRides}
                renderItem={renderRide}
                keyExtractor={(item) => item.id}
                style={styles.list}
                contentContainerStyle={filteredRides.length === 0 ? styles.emptyList : styles.listContent}
                ListEmptyComponent={loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#2196F3" />
                        <Text style={styles.loadingText}>Cargando viajes...</Text>
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
}

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
    rideCard: {
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
    rideHeader: {
        marginBottom: 12,
    },
    rideInfo: {
        alignItems: 'flex-start',
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        marginRight: 8,
    },
    statusText: {
        fontSize: 12,
        color: '#FFF',
        fontWeight: 'bold',
    },
    vehicleType: {
        fontSize: 12,
        color: '#666',
        backgroundColor: '#F0F0F0',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    rideId: {
        fontSize: 12,
        color: '#666',
        marginBottom: 2,
    },
    rideDate: {
        fontSize: 12,
        color: '#999',
    },
    routeContainer: {
        marginBottom: 12,
    },
    routePoint: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    routeText: {
        marginLeft: 12,
        fontSize: 14,
        color: '#333',
        flex: 1,
    },
    routeLine: {
        width: 2,
        height: 16,
        backgroundColor: '#DDD',
        marginLeft: 7,
        marginBottom: 8,
    },
    driverInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
    },
    driverPhoto: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
    },
    driverDetails: {
        flex: 1,
    },
    driverName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    driverMeta: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    driverRating: {
        fontSize: 12,
        color: '#333',
        marginLeft: 4,
    },
    vehicleInfo: {
        fontSize: 12,
        color: '#666',
    },
    rideDetails: {
        marginBottom: 12,
    },
    rideStats: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        backgroundColor: '#F8F9FA',
        borderRadius: 8,
        paddingVertical: 12,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statText: {
        fontSize: 12,
        color: '#666',
        marginLeft: 4,
    },
    rideActions: {
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
    rateButton: {
        backgroundColor: '#FFF8E1',
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
    requestRideButton: {
        backgroundColor: '#2196F3',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    requestRideText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    },
});
