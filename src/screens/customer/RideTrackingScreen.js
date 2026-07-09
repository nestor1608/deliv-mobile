// src/screens/customer/RideTrackingScreen.js
import React, { useState, useEffect, useContext, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    StatusBar,
    TouchableOpacity,
    Alert,
    Linking,
    Dimensions,
    Modal,
    Image,
    ActivityIndicator,
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { AuthContext } from '../../context/AuthContext';
import wsService from '../../services/ws';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

const RideTrackingScreen = ({ route, navigation }) => {
    const insets = useSafeAreaInsets();
    const { rideId, rideData } = route.params;
    const { authenticatedFetch, API_BASE_URL, userToken } = useContext(AuthContext);
    const mapRef = useRef(null);
    const wsConnectedRef = useRef(false);
    
    const [ride, setRide] = useState(rideData || null);
    const [driver, setDriver] = useState(null);
    const [driverLocation, setDriverLocation] = useState(null);
    const [loading, setLoading] = useState(!rideData);
    const [showDriverModal, setShowDriverModal] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [estimatedArrival, setEstimatedArrival] = useState(null);

    // Estados del viaje
    const rideStates = {
        'requested': {
            title: 'Buscando conductor',
            subtitle: 'Estamos buscando un conductor cercano',
            icon: 'search',
            color: '#FF9800',
        },
        'accepted': {
            title: 'Conductor asignado',
            subtitle: 'El conductor está en camino',
            icon: 'person',
            color: '#2196F3',
        },
        'arriving': {
            title: 'Conductor llegando',
            subtitle: 'El conductor está cerca de tu ubicación',
            icon: 'directions-car',
            color: '#4CAF50',
        },
        'in_progress': {
            title: 'En viaje',
            subtitle: 'Camino al destino',
            icon: 'navigation',
            color: '#4CAF50',
        },
        'completed': {
            title: 'Viaje completado',
            subtitle: 'Has llegado a tu destino',
            icon: 'check-circle',
            color: '#4CAF50',
        },
        'cancelled': {
            title: 'Viaje cancelado',
            subtitle: 'El viaje ha sido cancelado',
            icon: 'cancel',
            color: '#F44336',
        },
    };

    useEffect(() => {
        const idToLoad = rideId || rideData?.id;
        if (!idToLoad) return;

        if (!rideData) loadRideDetails();
        startLocationTracking();

        const wsProtocol = API_BASE_URL.startsWith('https') ? 'wss' : 'ws';
        const host = API_BASE_URL.replace('https://', '').replace('http://', '').replace('/api', '');
        const wsUrl = `${wsProtocol}://${host.replace(':8000', ':8001')}/ws/trips/${idToLoad}/`;

        wsService.setCallbacks({
            onMessage: (data) => {
                try {
                    const msg = JSON.parse(data);
                    if (msg.type === 'driver_location') {
                        setDriverLocation({
                            latitude: parseFloat(msg.latitude),
                            longitude: parseFloat(msg.longitude),
                        });
                    } else if (msg.type === 'status_update') {
                        setRide(prev => ({ ...prev, status: msg.status }));
                        if (msg.status === 'completed') {
                            setTimeout(() => {
                                navigation.replace('RideRating', { rideId: idToLoad, rideData: ride });
                            }, 2000);
                        }
                    }
                } catch (e) {
                    console.error('WS message error:', e);
                }
            },
            onOpen: () => { wsConnectedRef.current = true; },
            onError: (err) => console.error('WS error:', err),
        });

        wsService.connect(wsUrl, userToken);

        const interval = setInterval(() => {
            if (!wsConnectedRef.current) {
                if (rideId || rideData?.id) updateRideStatus();
                updateDriverLocation();
            }
        }, 10000);

        return () => {
            clearInterval(interval);
            wsService.disconnect();
        };
    }, [rideId, rideData]);

    useEffect(() => {
        if (ride && driverLocation) {
            calculateEstimatedArrival();
        }
    }, [ride, driverLocation]);

    const loadRideDetails = async () => {
        try {
            setLoading(true);
            const idToLoad = rideId || rideData?.id;
            const response = await authenticatedFetch(`${API_BASE_URL}/mobility/trips/${idToLoad}/`);
            
            if (response.ok) {
                const data = await response.json();
                setRide(data);
                setDriver(data.driver_info);
                if (data.driver_info && data.driver_info.current_latitude) {
                    setDriverLocation({
                        latitude: parseFloat(data.driver_info.current_latitude),
                        longitude: parseFloat(data.driver_info.current_longitude)
                    });
                }
            } else {
                throw new Error('Error al cargar detalles del viaje');
            }
        } catch (error) {
            console.error('Error loading ride details:', error);
            Alert.alert('Error', 'No se pudieron cargar los detalles del viaje');
        } finally {
            setLoading(false);
        }
    };

    const startLocationTracking = () => {
        // En una implementación real, usarías WebSocket o Server-Sent Events
        console.log('Starting location tracking...');
    };

    const updateRideStatus = async () => {
        try {
            const idToLoad = rideId || rideData?.id;
            const response = await authenticatedFetch(`${API_BASE_URL}/mobility/trips/${idToLoad}/`);
            
            if (response.ok) {
                const data = await response.json();
                setRide(prev => ({ ...prev, status: data.status }));
                
                if (data.status === 'completed') {
                    // Navegar a la pantalla de calificación
                    setTimeout(() => {
                        navigation.replace('RideRating', { rideId: idToLoad, rideData: data });
                    }, 2000);
                }
            }
        } catch (error) {
            console.error('Error updating ride status:', error);
        }
    };

    const updateDriverLocation = () => {
        // Simular movimiento del conductor
        if (driverLocation && ride?.status === 'accepted') {
            const newLocation = {
                latitude: driverLocation.latitude + (Math.random() - 0.5) * 0.001,
                longitude: driverLocation.longitude + (Math.random() - 0.5) * 0.001,
            };
            setDriverLocation(newLocation);
        }
    };

    const calculateEstimatedArrival = () => {
        if (!driverLocation || !ride?.pickup_latitude) return;

        // Calcular distancia entre conductor y punto de recogida
        const pickupLati = parseFloat(ride.pickup_latitude);
        const pickupLong = parseFloat(ride.pickup_longitude);
        
        const R = 6371;
        const dLat = (pickupLati - driverLocation.latitude) * Math.PI / 180;
        const dLon = (pickupLong - driverLocation.longitude) * Math.PI / 180;
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(driverLocation.latitude * Math.PI / 180) * Math.cos(pickupLati * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c;

        // Estimar tiempo (velocidad promedio 30 km/h)
        const estimatedMinutes = Math.round((distance / 30) * 60);
        setEstimatedArrival(estimatedMinutes);
    };

    const handleCallDriver = () => {
        if (driver?.phone) {
            Linking.openURL(`tel:${driver.phone}`);
        } else {
            Alert.alert('Error', 'Número de teléfono no disponible');
        }
    };

    const handleMessageDriver = () => {
        // Implementar chat con el conductor
        Alert.alert('Próximamente', 'Función de mensajería en desarrollo');
    };

    const handleCancelRide = () => {
        setShowCancelModal(true);
    };

    const confirmCancelRide = async () => {
        try {
            const idToLoad = rideId || rideData?.id;
            const response = await authenticatedFetch(`${API_BASE_URL}/mobility/trips/${idToLoad}/cancel_trip/`, {
                method: 'PATCH',
                body: JSON.stringify({ reason: "Cancelado por el usuario" })
            });

            if (response.ok) {
                setShowCancelModal(false);
                Alert.alert(
                    'Viaje cancelado',
                    'Tu viaje ha sido cancelado exitosamente',
                    [{ text: 'OK', onPress: () => navigation.goBack() }]
                );
            } else {
                throw new Error('Error al cancelar el viaje');
            }
        } catch (error) {
            console.error('Error cancelling ride:', error);
            Alert.alert('Error', 'No se pudo cancelar el viaje');
        }
    };

    const renderDriverModal = () => (
        <Modal
            visible={showDriverModal}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setShowDriverModal(false)}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.driverModal}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Información del Conductor</Text>
                        <TouchableOpacity onPress={() => setShowDriverModal(false)}>
                            <Icon name="close" size={24} color="#666" />
                        </TouchableOpacity>
                    </View>

                    {driver && (
                        <View style={styles.driverDetails}>
                            <Image 
                                source={{ uri: driver.avatar || 'https://via.placeholder.com/80x80/DDD/FFF?text=Driver' }} 
                                style={styles.driverAvatar} 
                            />
                            <Text style={styles.driverName}>{driver.name}</Text>
                            <View style={styles.driverRating}>
                                <Icon name="star" size={16} color="#FFD700" />
                                <Text style={styles.ratingText}>{driver.rating ? parseFloat(driver.rating).toFixed(1) : '5.0'}</Text>
                                <Text style={styles.tripsText}>({driver.total_trips || 0} viajes)</Text>
                            </View>
                            
                            <View style={styles.vehicleInfo}>
                                <Text style={styles.vehicleModel}>{driver.vehicle || 'Vehículo'}</Text>
                                <Text style={styles.vehiclePlate}>{driver.plate || 'ABC123'}</Text>
                            </View>

                            <View style={styles.driverActions}>
                                <TouchableOpacity 
                                    style={styles.actionButton}
                                    onPress={handleCallDriver}
                                >
                                    <Icon name="phone" size={24} color="#FFF" />
                                    <Text style={styles.actionButtonText}>Llamar</Text>
                                </TouchableOpacity>
                                
                                <TouchableOpacity 
                                    style={[styles.actionButton, styles.messageButton]}
                                    onPress={handleMessageDriver}
                                >
                                    <Icon name="message" size={24} color="#FFF" />
                                    <Text style={styles.actionButtonText}>Mensaje</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                </View>
            </View>
        </Modal>
    );

    const renderCancelModal = () => (
        <Modal
            visible={showCancelModal}
            animationType="fade"
            transparent={true}
            onRequestClose={() => setShowCancelModal(false)}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.cancelModal}>
                    <Icon name="warning" size={48} color="#FF9800" />
                    <Text style={styles.cancelTitle}>¿Cancelar viaje?</Text>
                    <Text style={styles.cancelMessage}>
                        Si cancelas ahora, podrías ser cobrado una tarifa de cancelación.
                    </Text>
                    
                    <View style={styles.cancelActions}>
                        <TouchableOpacity 
                            style={styles.keepRideButton}
                            onPress={() => setShowCancelModal(false)}
                        >
                            <Text style={styles.keepRideText}>Mantener viaje</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                            style={styles.cancelConfirmButton}
                            onPress={confirmCancelRide}
                        >
                            <Text style={styles.cancelConfirmText}>Cancelar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2196F3" />
                <Text style={styles.loadingText}>Cargando detalles del viaje...</Text>
            </View>
        );
    }

    if (!ride) {
        return (
            <View style={styles.errorContainer}>
                <Icon name="error" size={64} color="#F44336" />
                <Text style={styles.errorText}>No se pudo cargar el viaje</Text>
                <TouchableOpacity 
                    style={styles.retryButton}
                    onPress={loadRideDetails}
                >
                    <Text style={styles.retryButtonText}>Reintentar</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const currentState = rideStates[ride.status] || rideStates.requested;

    const pickupCoord = { latitude: parseFloat(ride.pickup_latitude), longitude: parseFloat(ride.pickup_longitude) };
    const destCoord = { latitude: parseFloat(ride.destination_latitude), longitude: parseFloat(ride.destination_longitude) };

    return (
        <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
            
            {/* Map */}
            <View style={styles.mapContainer}>
                <MapView
                    ref={mapRef}
                    style={styles.map}
                    initialRegion={{
                        latitude: pickupCoord.latitude,
                        longitude: pickupCoord.longitude,
                        latitudeDelta: 0.01,
                        longitudeDelta: 0.01,
                    }}
                    showsUserLocation
                    followsUserLocation
                >
                    {/* Marcador de origen */}
                    <Marker
                        coordinate={pickupCoord}
                        title="Origen"
                        description={ride.pickup_address}
                        pinColor="#4CAF50"
                    />
                    
                    {/* Marcador de destino */}
                    <Marker
                        coordinate={destCoord}
                        title="Destino"
                        description={ride.destination_address}
                        pinColor="#F44336"
                    />
                    
                    {/* Marcador del conductor */}
                    {driverLocation && (
                        <Marker
                            coordinate={driverLocation}
                            title="Conductor"
                            description={driver?.name}
                        >
                            <View style={styles.driverMarker}>
                                <Icon name="directions-car" size={24} color="#FFF" />
                            </View>
                        </Marker>
                    )}
                    
                    {/* Ruta */}
                    {ride.route_coordinates && (
                        <Polyline
                            coordinates={ride.route_coordinates}
                            strokeColor="#2196F3"
                            strokeWidth={4}
                        />
                    )}
                </MapView>
                
                {/* Botón para centrar mapa */}
                <TouchableOpacity 
                    style={styles.centerButton}
                    onPress={() => {
                        if (mapRef.current) {
                            const coordinates = [
                                pickupCoord,
                                destCoord
                            ];
                            if (driverLocation) coordinates.push(driverLocation);
                            mapRef.current.fitToCoordinates(coordinates, {
                                edgePadding: { top: 100, right: 50, bottom: 300, left: 50 },
                                animated: true,
                            });
                        }
                    }}
                >
                    <Icon name="my-location" size={24} color="#666" />
                </TouchableOpacity>
            </View>

            {/* Status Panel */}
            <View style={styles.statusPanel}>
                <View style={styles.statusHeader}>
                    <View style={styles.statusIcon}>
                        <Icon name={currentState.icon} size={24} color={currentState.color} />
                    </View>
                    <View style={styles.statusText}>
                        <Text style={styles.statusTitle}>{currentState.title}</Text>
                        <Text style={styles.statusSubtitle}>{currentState.subtitle}</Text>
                        {estimatedArrival && ride.status === 'accepted' && (
                            <Text style={styles.estimatedTime}>
                                Llegada estimada: {estimatedArrival} min
                            </Text>
                        )}
                    </View>
                </View>

                {/* Driver Info (when assigned) */}
                {driver && ride.status !== 'requested' && (
                    <TouchableOpacity 
                        style={styles.driverInfo}
                        onPress={() => setShowDriverModal(true)}
                    >
                        <Image 
                            source={{ uri: driver.avatar || 'https://via.placeholder.com/50x50/DDD/FFF?text=D' }} 
                            style={styles.driverImage} 
                        />
                        <View style={styles.driverText}>
                            <Text style={styles.driverName}>{driver.name}</Text>
                            <View style={styles.driverRating}>
                                <Icon name="star" size={14} color="#FFD700" />
                                <Text style={styles.ratingText}>{driver.rating?.toFixed(1) || '5.0'}</Text>
                            </View>
                            {driver.vehicle && (
                                <Text style={styles.vehicleInfo}>
                                    {driver.vehicle.color} {driver.vehicle.model} • {driver.vehicle.plate}
                                </Text>
                            )}
                        </View>
                        <Icon name="chevron-right" size={24} color="#CCC" />
                    </TouchableOpacity>
                )}

                {/* Trip Details */}
                <View style={styles.tripDetails}>
                    <View style={styles.tripRoute}>
                        <View style={styles.routePoint}>
                            <Icon name="radio-button-checked" size={12} color="#4CAF50" />
                            <Text style={styles.routeText} numberOfLines={1}>
                                {ride.pickup_address}
                            </Text>
                        </View>
                        <View style={styles.routeLine} />
                        <View style={styles.routePoint}>
                            <Icon name="location-on" size={12} color="#F44336" />
                            <Text style={styles.routeText} numberOfLines={1}>
                                {ride.destination_address}
                            </Text>
                        </View>
                    </View>
                    
                    <View style={styles.tripMeta}>
                        <Text style={styles.tripDistance}>
                            {ride.estimated_distance ? parseFloat(ride.estimated_distance).toFixed(1) : '0'} km
                        </Text>
                        <Text style={styles.tripFare}>
                            ${ride.total_fare || ride.estimated_fare || 0}
                        </Text>
                    </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                    {driver && ride.status !== 'completed' && ride.status !== 'cancelled' && (
                        <>
                            <TouchableOpacity 
                                style={styles.callButton}
                                onPress={handleCallDriver}
                            >
                                <Icon name="phone" size={20} color="#FFF" />
                                <Text style={styles.callButtonText}>Llamar</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity 
                                style={styles.messageButton}
                                onPress={handleMessageDriver}
                            >
                                <Icon name="message" size={20} color="#FFF" />
                                <Text style={styles.messageButtonText}>Mensaje</Text>
                            </TouchableOpacity>
                        </>
                    )}
                    
                    {ride.status !== 'completed' && ride.status !== 'cancelled' && ride.status !== 'in_progress' && (
                        <TouchableOpacity 
                            style={styles.cancelButton}
                            onPress={handleCancelRide}
                        >
                            <Text style={styles.cancelButtonText}>Cancelar viaje</Text>
                        </TouchableOpacity>
                    )}
                    
                    {(ride.status === 'completed' || ride.status === 'cancelled') && (
                        <TouchableOpacity 
                            style={styles.doneButton}
                            onPress={() => navigation.goBack()}
                        >
                            <Text style={styles.doneButtonText}>Finalizar</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {renderDriverModal()}
            {renderCancelModal()}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFF',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#666',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFF',
        padding: 32,
    },
    errorText: {
        fontSize: 18,
        color: '#666',
        marginVertical: 16,
        textAlign: 'center',
    },
    retryButton: {
        backgroundColor: '#2196F3',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    retryButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    },
    mapContainer: {
        flex: 1,
        position: 'relative',
    },
    map: {
        flex: 1,
    },
    driverMarker: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#2196F3',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFF',
    },
    centerButton: {
        position: 'absolute',
        top: 16,
        right: 16,
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    statusPanel: {
        backgroundColor: '#FFF',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 32,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 5,
    },
    statusHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    statusIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    statusText: {
        flex: 1,
    },
    statusTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    statusSubtitle: {
        fontSize: 14,
        color: '#666',
        marginTop: 2,
    },
    estimatedTime: {
        fontSize: 14,
        color: '#2196F3',
        fontWeight: '600',
        marginTop: 4,
    },
    driverInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
    },
    driverImage: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 12,
    },
    driverText: {
        flex: 1,
    },
    driverName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    driverRating: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
    },
    ratingText: {
        fontSize: 12,
        color: '#666',
        marginLeft: 4,
    },
    vehicleInfo: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    tripDetails: {
        backgroundColor: '#F8F9FA',
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
    },
    tripRoute: {
        marginBottom: 12,
    },
    routePoint: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    routeText: {
        marginLeft: 12,
        fontSize: 14,
        color: '#333',
        flex: 1,
    },
    routeLine: {
        width: 2,
        height: 20,
        backgroundColor: '#DDD',
        marginLeft: 5,
        marginBottom: 4,
    },
    tripMeta: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#E5E5E5',
    },
    tripDistance: {
        fontSize: 14,
        color: '#666',
    },
    tripFare: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    callButton: {
        flex: 1,
        backgroundColor: '#4CAF50',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 8,
    },
    callButtonText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 8,
    },
    messageButton: {
        flex: 1,
        backgroundColor: '#2196F3',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 8,
    },
    messageButtonText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 8,
    },
    cancelButton: {
        flex: 1,
        backgroundColor: '#F44336',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 8,
    },
    cancelButtonText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '600',
    },
    doneButton: {
        flex: 1,
        backgroundColor: '#2196F3',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 8,
    },
    doneButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    driverModal: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        width: width * 0.9,
        maxHeight: height * 0.8,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    driverDetails: {
        padding: 24,
        alignItems: 'center',
    },
    driverAvatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        marginBottom: 16,
    },
    tripsText: {
        fontSize: 12,
        color: '#666',
        marginLeft: 4,
    },
    driverActions: {
        flexDirection: 'row',
        marginTop: 24,
        gap: 12,
    },
    actionButton: {
        backgroundColor: '#4CAF50',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
    },
    actionButtonText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 8,
    },
    cancelModal: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        width: width * 0.85,
    },
    cancelTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 16,
        marginBottom: 8,
    },
    cancelMessage: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
    cancelActions: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    keepRideButton: {
        flex: 1,
        backgroundColor: '#F5F5F5',
        alignItems: 'center',
        paddingVertical: 12,
        borderRadius: 8,
    },
    keepRideText: {
        color: '#333',
        fontSize: 16,
        fontWeight: '600',
    },
    cancelConfirmButton: {
        flex: 1,
        backgroundColor: '#F44336',
        alignItems: 'center',
        paddingVertical: 12,
        borderRadius: 8,
    },
    cancelConfirmText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default RideTrackingScreen;