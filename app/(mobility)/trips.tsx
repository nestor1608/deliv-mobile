// app/(mobility)/trips.tsx
import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert, SafeAreaView } from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { AuthContext } from '../../src/context/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../src/services/apiClient';

export default function MobilityTripsScreen() {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState('available');
    const [refreshing, setRefreshing] = useState(false);

    const { data: availableData, isLoading: availableLoading } = useQuery({
        queryKey: ['mobility', 'availableTrips'],
        queryFn: () => apiClient.get<{ results?: any[] }>('api/mobility/trips/?status=requested'),
    });

    const { data: myTripsData, isLoading: myTripsLoading } = useQuery({
        queryKey: ['mobility', 'myTrips'],
        queryFn: () => apiClient.get<{ results?: any[] }>('api/mobility/trips/?status=active'),
    });

    const availableTrips = availableData?.results || [];
    const myTrips = myTripsData?.results || [];

    const acceptTripMutation = useMutation({
        mutationFn: (tripId: number) => apiClient.patch(`/api/mobility/trips/${tripId}/accept-trip/`),
        onSuccess: () => {
            Alert.alert('¡Viaje aceptado!', 'Ve a recoger al pasajero');
            queryClient.invalidateQueries({ queryKey: ['mobility', 'availableTrips'] });
            queryClient.invalidateQueries({ queryKey: ['mobility', 'myTrips'] });
        },
    });

    const acceptTrip = (tripId: number) => acceptTripMutation.mutate(tripId);

    const onRefresh = async () => { setRefreshing(true); await queryClient.invalidateQueries({ queryKey: ['mobility', 'availableTrips'] }); await queryClient.invalidateQueries({ queryKey: ['mobility', 'myTrips'] }); setRefreshing(false); };

    const renderTripCard = ({ item: trip }) => (
        <View style={styles.tripCard}>
            <View style={styles.tripHeader}>
                <View>
                    <Text style={styles.tripNumber}>#{trip.trip_number}</Text>
                    <Text style={styles.customerName}>{trip.customer_info?.name}</Text>
                </View>
                <View style={styles.tripValue}>
                    <Text style={styles.tripFare}>${trip.total_fare}</Text>
                    <Text style={styles.tripFareLabel}>Ganancia</Text>
                </View>
            </View>
            <View style={styles.tripRoute}>
                <View style={styles.routePoint}>
                    <Icon name="my-location" size={16} color="#4CAF50" />
                    <Text style={styles.routeText} numberOfLines={1}>{trip.pickup_address}</Text>
                </View>
                <View style={styles.routePoint}>
                    <Icon name="place" size={16} color="#f44336" />
                    <Text style={styles.routeText} numberOfLines={1}>{trip.destination_address}</Text>
                </View>
            </View>
            {activeTab === 'available' ? (
                <TouchableOpacity style={styles.acceptButton} onPress={() => acceptTrip(trip.id)}>
                    <Icon name="directions-car" size={20} color="#fff" />
                    <Text style={styles.acceptButtonText}>Aceptar Viaje</Text>
                </TouchableOpacity>
            ) : (
                <View style={styles.statusContainer}>
                    <View style={[styles.statusBadge, { backgroundColor: '#2196F3' }]}>
                        <Text style={styles.statusText}>En progreso</Text>
                    </View>
                </View>
            )}
        </View>
    );

    const currentData = activeTab === 'available' ? availableTrips : myTrips;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.tabContainer}>
                <TouchableOpacity style={[styles.tab, activeTab === 'available' && styles.activeTab]} onPress={() => setActiveTab('available')}>
                    <Icon name="directions-car" size={20} color={activeTab === 'available' ? '#2196F3' : '#666'} />
                    <Text style={[styles.tabText, activeTab === 'available' && styles.activeTabText]}>Disponibles ({availableTrips.length})</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.tab, activeTab === 'active' && styles.activeTab]} onPress={() => setActiveTab('active')}>
                    <Icon name="event" size={20} color={activeTab === 'active' ? '#2196F3' : '#666'} />
                    <Text style={[styles.tabText, activeTab === 'active' && styles.activeTabText]}>Mis Viajes ({myTrips.length})</Text>
                </TouchableOpacity>
            </View>
            <FlatList data={currentData} renderItem={renderTripCard} keyExtractor={(item) => item.id.toString()} contentContainerStyle={styles.listContainer} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2196F3']} />} ListEmptyComponent={<View style={styles.emptyState}><Icon name="directions-car" size={64} color="#ccc" /><Text style={styles.emptyTitle}>No hay viajes disponibles</Text></View>} />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    tabContainer: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
    tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16 },
    activeTab: { borderBottomWidth: 3, borderBottomColor: '#2196F3' },
    tabText: { fontSize: 14, color: '#666', marginLeft: 8 },
    activeTabText: { color: '#2196F3', fontWeight: 'bold' },
    listContainer: { padding: 16, flexGrow: 1 },
    tripCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3.84, elevation: 5 },
    tripHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
    tripNumber: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    customerName: { fontSize: 14, color: '#666', marginTop: 2 },
    tripValue: { alignItems: 'flex-end' },
    tripFare: { fontSize: 18, fontWeight: 'bold', color: '#4CAF50' },
    tripFareLabel: { fontSize: 12, color: '#666' },
    tripRoute: { marginBottom: 16 },
    routePoint: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    routeText: { fontSize: 14, color: '#333', marginLeft: 8, flex: 1 },
    acceptButton: { backgroundColor: '#4CAF50', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 8 },
    acceptButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
    statusContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
    statusText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
    emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
    emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#999', marginTop: 16 },
});
