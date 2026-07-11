// app/(mobility)/map.tsx
import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform, SafeAreaView, Linking } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { AuthContext } from '../../src/context/AuthContext';
import { useWebSocket } from '../../src/hooks/useWebSocket';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../src/services/apiClient';

export default function MobilityMapScreen() {
    const { tripId } = useLocalSearchParams();
    const router = useRouter();
    const { API_BASE_URL, userToken } = useContext(AuthContext);
    const queryClient = useQueryClient();
    const [currentLocation, setCurrentLocation] = useState(null);
    const [tripPhase, setTripPhase] = useState('going_to_pickup');

    const { data: tripData, isLoading, refetch } = useQuery({
        queryKey: ['mobility', 'trip', tripId],
        queryFn: () => apiClient.get<any>(`api/mobility/trips/${tripId}/`),
        enabled: !!tripId,
    });

    const trip = tripData;

    const wsUrl = tripId ? `${API_BASE_URL.replace('https://', 'wss://').replace('http://', 'ws://').replace(':8000', ':8001')}/ws/trips/${tripId}/` : null;

    const onMessage = (data) => {
        try {
            const msg = JSON.parse(data);
            if (msg.type === 'driver_location') {
                setCurrentLocation({ latitude: parseFloat(msg.latitude), longitude: parseFloat(msg.longitude) });
            } else if (msg.type === 'status_update' && trip) {
                refetch();
            }
        } catch (e) {
            console.error('WS message error:', e);
        }
    };

    const { send, isConnected } = useWebSocket({ url: wsUrl, token: userToken, onMessage, autoConnect: !!tripId });

    const markArrivedMutation = useMutation({
        mutationFn: () => apiClient.patch(`/api/mobility/trips/${tripId}/mark-arrived/`),
        onSuccess: () => refetch(),
    });

    const startTripMutation = useMutation({
        mutationFn: () => apiClient.patch(`/api/mobility/trips/${tripId}/start-trip/`),
        onSuccess: () => {
            refetch();
        },
    });

    const completeTripMutation = useMutation({
        mutationFn: () => apiClient.patch(`/api/mobility/trips/${tripId}/complete-trip/`),
        onSuccess: () => {
            Alert.alert('¡Viaje completado!', 'El viaje ha sido completado exitosamente', [{ text: 'OK', onPress: () => router.back() }]);
        },
    });

    const markAsArrived = () => markArrivedMutation.mutate();

    const startTrip = () => {
        Alert.alert('Iniciar viaje', '¿El pasajero ya está en el vehículo?', [
            { text: 'No', style: 'cancel' },
            { text: 'Sí, iniciar', onPress: () => {
                startTripMutation.mutate();
            }},
        ]);
    };

    const completeTrip = () => {
        Alert.alert('Completar viaje', '¿Confirmas que has llegado al destino?', [
            { text: 'No', style: 'cancel' },
            { text: 'Completar', onPress: () => completeTripMutation.mutate()},
        ]);
    };

    const getDestination = () => {
        if (!trip) return null;
        if (tripPhase === 'going_to_pickup') {
            return { latitude: trip.pickup_latitude, longitude: trip.pickup_longitude, address: trip.pickup_address, title: 'Recoger pasajero' };
        }
        return { latitude: trip.destination_latitude, longitude: trip.destination_longitude, address: trip.destination_address, title: 'Destino' };
    };

    const openExternalNavigation = () => {
        const destination = getDestination();
        if (!destination) return;
        const url = Platform.select({
            ios: `maps:0,0?q=${destination.latitude},${destination.longitude}`,
            android: `geo:0,0?q=${destination.latitude},${destination.longitude}`,
        });
        Linking.canOpenURL(url).then((supported) => {
            if (supported) Linking.openURL(url);
            else Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${destination.latitude},${destination.longitude}`);
        });
    };

    const callPassenger = () => {
        if (trip?.customer_info?.phone) Linking.openURL(`tel:${trip.customer_info.phone}`);
    };

    if (isLoading || !trip) {
        return <View style={styles.loadingContainer}><Text>Cargando...</Text></View>;
    }

    const destination = getDestination();

    return (
        <SafeAreaView style={styles.container}>
            <MapView
                provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
                style={styles.map}
                showsUserLocation={true}
                initialRegion={{
                    latitude: currentLocation?.latitude || destination?.latitude || -34.6037,
                    longitude: currentLocation?.longitude || destination?.longitude || -58.3816,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                }}
            >
                {destination && <Marker coordinate={{ latitude: destination.latitude, longitude: destination.longitude }} title={destination.title} pinColor={tripPhase === 'going_to_pickup' ? '#4CAF50' : '#f44336'} />}
            </MapView>

            <View style={styles.topPanel}>
                <View style={styles.tripInfo}>
                    <Text style={styles.tripNumber}>#{trip.trip_number}</Text>
                    <Text style={styles.phaseIndicator}>{tripPhase === 'going_to_pickup' ? 'Ir a recoger' : 'Llevar al destino'}</Text>
                </View>
                <View style={styles.passengerInfo}>
                    <Text style={styles.passengerName}>{trip.customer_info?.name}</Text>
                    <Text style={styles.destinationAddress} numberOfLines={2}>{destination?.address}</Text>
                </View>
                <View style={styles.tripDetails}>
                    <View style={styles.tripDetail}>
                        <Icon name="directions" size={16} color="#666" />
                        <Text style={styles.tripDetailText}>{trip.estimated_distance} km</Text>
                    </View>
                    <View style={styles.tripDetail}>
                        <Icon name="monetization-on" size={16} color="#4CAF50" />
                        <Text style={styles.tripDetailText}>${trip.total_fare}</Text>
                    </View>
                </View>
            </View>

            <View style={styles.bottomPanel}>
                <View style={styles.actionButtons}>
                    <TouchableOpacity style={styles.navButton} onPress={openExternalNavigation}>
                        <Icon name="navigation" size={24} color="#fff" />
                        <Text style={styles.navButtonText}>Navegar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.callButton} onPress={callPassenger}>
                        <Icon name="phone" size={24} color="#fff" />
                        <Text style={styles.callButtonText}>Llamar</Text>
                    </TouchableOpacity>
                </View>
                {tripPhase === 'going_to_pickup' ? (
                    trip.status === 'accepted' ? (
                        <TouchableOpacity style={styles.arrivedButton} onPress={markAsArrived}>
                            <Icon name="place" size={24} color="#fff" />
                            <Text style={styles.arrivedButtonText}>He llegado</Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity style={styles.startButton} onPress={startTrip}>
                            <Icon name="play-arrow" size={24} color="#fff" />
                            <Text style={styles.startButtonText}>Iniciar viaje</Text>
                        </TouchableOpacity>
                    )
                ) : (
                    <TouchableOpacity style={styles.completeButton} onPress={completeTrip}>
                        <Icon name="done-all" size={24} color="#fff" />
                        <Text style={styles.completeButtonText}>Completar viaje</Text>
                    </TouchableOpacity>
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    map: { flex: 1 },
    topPanel: { position: 'absolute', top: Platform.OS === 'ios' ? 50 : 20, left: 20, right: 20, backgroundColor: '#fff', borderRadius: 12, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5 },
    tripInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    tripNumber: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    phaseIndicator: { fontSize: 12, color: '#666', backgroundColor: '#f0f0f0', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
    passengerInfo: { marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', paddingBottom: 12 },
    passengerName: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 4 },
    destinationAddress: { fontSize: 14, color: '#666' },
    tripDetails: { flexDirection: 'row', justifyContent: 'space-between' },
    tripDetail: { flexDirection: 'row', alignItems: 'center' },
    tripDetailText: { fontSize: 12, color: '#666', marginLeft: 4, fontWeight: '500' },
    bottomPanel: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5 },
    actionButtons: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
    navButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2196F3', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 25, flex: 0.4, justifyContent: 'center' },
    navButtonText: { color: '#fff', fontWeight: 'bold', marginLeft: 8 },
    callButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#4CAF50', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 25, flex: 0.4, justifyContent: 'center' },
    callButtonText: { color: '#fff', fontWeight: 'bold', marginLeft: 8 },
    arrivedButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FF9800', paddingVertical: 16, borderRadius: 12 },
    arrivedButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
    startButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#4CAF50', paddingVertical: 16, borderRadius: 12 },
    startButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
    completeButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#9C27B0', paddingVertical: 16, borderRadius: 12 },
    completeButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
});
