// app/(mobility)/trip-detail.tsx
import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, SafeAreaView, Linking } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { AuthContext } from '../../src/context/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../src/services/apiClient';

export default function MobilityTripDetailScreen() {
    const { tripId } = useLocalSearchParams();
    const router = useRouter();
    const queryClient = useQueryClient();
    const [loadingState, setLoadingState] = useState(false);

    const { data: trip, isLoading, refetch } = useQuery({
        queryKey: ['mobility', 'trip', tripId],
        queryFn: () => apiClient.get<any>(`api/mobility/trips/${tripId}/`),
        enabled: !!tripId,
    });

    const acceptTripMutation = useMutation({
        mutationFn: () => apiClient.patch(`/api/mobility/trips/${tripId}/accept-trip/`),
        onSuccess: () => {
            Alert.alert('¡Viaje aceptado!', 'Ve a recoger al pasajero');
            refetch();
        },
    });

    const acceptTrip = () => acceptTripMutation.mutate();

    const callPassenger = () => {
        if (trip?.customer_info?.phone) {
            Linking.openURL(`tel:${trip.customer_info.phone}`);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'requested': return '#FF9800';
            case 'accepted': return '#2196F3';
            case 'in_progress': return '#9C27B0';
            case 'completed': return '#4CAF50';
            case 'cancelled': return '#f44336';
            default: return '#666';
        }
    };

    const formatDate = (dateString) => new Date(dateString).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    if (isLoading || !trip) {
        return <View style={styles.loadingContainer}><Text>Cargando...</Text></View>;
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                <View style={styles.tripHeader}>
                    <Text style={styles.tripNumber}>#{trip.trip_number}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(trip.status) }]}>
                        <Text style={styles.statusText}>{trip.status}</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Información del pasajero</Text>
                    <View style={styles.passengerInfo}>
                        <Icon name="person" size={24} color="#2196F3" />
                        <View style={styles.passengerText}>
                            <Text style={styles.passengerName}>{trip.customer_info?.name}</Text>
                            <Text style={styles.passengerPhone}>{trip.customer_info?.phone}</Text>
                        </View>
                        <TouchableOpacity style={styles.callButton} onPress={callPassenger}>
                            <Icon name="phone" size={20} color="#4CAF50" />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Ruta del viaje</Text>
                    <View style={styles.routeContainer}>
                        <View style={styles.routePoint}>
                            <Icon name="my-location" size={20} color="#4CAF50" />
                            <View style={styles.routeDetails}>
                                <Text style={styles.routeLabel}>Origen</Text>
                                <Text style={styles.routeAddress}>{trip.pickup_address}</Text>
                            </View>
                        </View>
                        <View style={styles.routePoint}>
                            <Icon name="place" size={20} color="#f44336" />
                            <View style={styles.routeDetails}>
                                <Text style={styles.routeLabel}>Destino</Text>
                                <Text style={styles.routeAddress}>{trip.destination_address}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Detalles del viaje</Text>
                    <View style={styles.detailsGrid}>
                        <View style={styles.detailItem}>
                            <Icon name="directions" size={20} color="#2196F3" />
                            <Text style={styles.detailLabel}>Distancia</Text>
                            <Text style={styles.detailValue}>{trip.estimated_distance || 0} km</Text>
                        </View>
                        <View style={styles.detailItem}>
                            <Icon name="monetization-on" size={20} color="#4CAF50" />
                            <Text style={styles.detailLabel}>Tarifa</Text>
                            <Text style={styles.detailValue}>${trip.total_fare}</Text>
                        </View>
                    </View>
                </View>
            </ScrollView>

            <View style={styles.actionContainer}>
                {trip.status === 'requested' && (
                    <View style={styles.actionButtons}>
                        <TouchableOpacity style={styles.acceptButton} onPress={acceptTrip}>
                            <Text style={styles.acceptButtonText}>Aceptar viaje</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scrollView: { flex: 1 },
    tripHeader: { backgroundColor: '#fff', padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    tripNumber: { fontSize: 24, fontWeight: 'bold', color: '#333' },
    statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
    statusText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
    section: { backgroundColor: '#fff', marginTop: 12, padding: 20 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 16 },
    passengerInfo: { flexDirection: 'row', alignItems: 'center' },
    passengerText: { marginLeft: 12, flex: 1 },
    passengerName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    passengerPhone: { fontSize: 14, color: '#666', marginTop: 2 },
    callButton: { padding: 12, backgroundColor: '#f0f8f0', borderRadius: 25, borderWidth: 1, borderColor: '#4CAF50' },
    routeContainer: { paddingHorizontal: 8 },
    routePoint: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
    routeDetails: { marginLeft: 12, flex: 1 },
    routeLabel: { fontSize: 12, color: '#666', fontWeight: '600', textTransform: 'uppercase' },
    routeAddress: { fontSize: 16, color: '#333', marginTop: 4 },
    detailsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    detailItem: { width: '48%', backgroundColor: '#f8f9fa', padding: 16, borderRadius: 12, marginBottom: 12, alignItems: 'center' },
    detailLabel: { fontSize: 12, color: '#666', marginTop: 8 },
    detailValue: { fontSize: 16, fontWeight: 'bold', color: '#333', marginTop: 4 },
    actionContainer: { backgroundColor: '#fff', padding: 20, borderTopWidth: 1, borderTopColor: '#e0e0e0' },
    actionButtons: { flexDirection: 'row', justifyContent: 'space-between' },
    acceptButton: { flex: 1, backgroundColor: '#4CAF50', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
    acceptButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
