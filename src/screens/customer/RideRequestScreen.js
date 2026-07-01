// src/screens/customer/RideRequestScreen.js
import React, { useState, useEffect, useContext, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
    Alert,
    Dimensions,
    ActivityIndicator,
    Modal,
    Platform,
    KeyboardAvoidingView,
    ScrollView
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import { AuthContext } from '../../context/AuthContext';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.0922;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

const RideRequestScreen = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const { userData, authenticatedFetch, API_BASE_URL } = useContext(AuthContext);
    const mapRef = useRef(null);

    const [currentLocation, setCurrentLocation] = useState(null);
    const [pickupLocation, setPickupLocation] = useState(null);
    const [destinationLocation, setDestinationLocation] = useState(null);
    const [pickupAddress, setPickupAddress] = useState('');
    const [destinationAddress, setDestinationAddress] = useState('');
    const [routeCoordinates, setRouteCoordinates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [calculating, setCalculating] = useState(false);
    const [fareEstimate, setFareEstimate] = useState(null);
    const [showFareModal, setShowFareModal] = useState(false);
    const [distance, setDistance] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isNoDestination, setIsNoDestination] = useState(false);
    const [recentLocations, setRecentLocations] = useState([]);
    const [showRecentLocations, setShowRecentLocations] = useState(false);
    const [activeInput, setActiveInput] = useState(null);

    const [currentRegion, setCurrentRegion] = useState({
    city: '',
    region: '',
    country: ''
});

    const vehicleTypes = [
        {
            id: 'economy',
            name: 'Económico',
            description: 'Autos compactos y económicos',
            icon: 'directions-car',
            priceMultiplier: 1.0,
            estimatedTime: '2-5 min',
        },
        {
            id: 'comfort',
            name: 'Confort',
            description: 'Autos más cómodos y espaciosos',
            icon: 'airport-shuttle',
            priceMultiplier: 1.3,
            estimatedTime: '3-8 min',
        },
        {
            id: 'premium',
            name: 'Premium',
            description: 'Autos de alta gama',
            icon: 'local-taxi',
            priceMultiplier: 1.8,
            estimatedTime: '5-10 min',
        },
    ];

    const [selectedVehicle, setSelectedVehicle] = useState(vehicleTypes[0]);

    useEffect(() => {
        initializeLocation();
        // Cargar ubicaciones recientes
        loadRecentLocations();
    }, []);

    useEffect(() => {
        if (pickupLocation && destinationLocation) {
            calculateRoute();
        }
    }, [pickupLocation, destinationLocation, selectedVehicle]);

    const initializeLocation = async () => {
    try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Error', 'Se necesitan permisos de ubicación para usar esta función');
            navigation.goBack();
            return;
        }

        const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
        });

        const coords = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
        };

        setCurrentLocation(coords);
        setPickupLocation(coords);
        
        // Obtener dirección detallada con componentes
        const [result] = await Location.reverseGeocodeAsync(coords);
        if (result) {
            const addressParts = [
                result.street,
                result.streetNumber,
                result.district,
                result.city,
                result.region,
                result.country
            ].filter(Boolean);
            
            setPickupAddress(addressParts.join(', '));
            
            // Guardar región actual para búsquedas contextuales
            setCurrentRegion({
                city: result.city,
                region: result.region,
                country: result.country
            });
        } else {
            setPickupAddress('Mi ubicación actual');
        }

    } catch (error) {
        console.error('Error getting location:', error);
        Alert.alert('Error', 'No se pudo obtener la ubicación actual');
    } finally {
        setLoading(false);
    }
};

    const loadRecentLocations = async () => {
        // Simulación de ubicaciones recientes
        setRecentLocations([
            { id: 1, name: 'Casa', address: 'Av. Siempreviva 742', coords: { latitude: -34.6037, longitude: -58.3816 } },
            { id: 2, name: 'Trabajo', address: 'Av. Corrientes 1234', coords: { latitude: -34.6037, longitude: -58.3816 } },
        ]);
    };

    const getAddressFromCoordinates = async (coords) => {
        try {
            const [result] = await Location.reverseGeocodeAsync(coords);
            if (result) {
                return [
                    result.street,
                    result.streetNumber,
                    result.district,
                    result.city
                ].filter(Boolean).join(' ');
            }
            return 'Ubicación desconocida';
        } catch (error) {
            console.error('Error getting address:', error);
            return 'Ubicación desconocida';
        }
    };

    const searchLocation = async (query, isDestination = false) => {
        if (!query.trim() || query.length < 3) return;

        try {
            setCalculating(true);

            // Aquí implementarías la búsqueda usando Google Places API o similar
            // Por ahora simulamos con geocoding básico
            const searchOptions = {
                latitude: currentLocation.latitude,
                longitude: currentLocation.longitude,
            };

            const results = await Location.geocodeAsync(query, searchOptions);

            if (results.length > 0) {
                const coords = {
                    latitude: results[0].latitude,
                    longitude: results[0].longitude,
                };

                if (isDestination) {
                    setDestinationLocation(coords);
                    setDestinationAddress(query);
                    setIsNoDestination(false);
                } else {
                    setPickupLocation(coords);
                    setPickupAddress(query);
                }

                if (mapRef.current) {
                    mapRef.current.animateToRegion({
                        latitude: coords.latitude,
                        longitude: coords.longitude,
                        latitudeDelta: LATITUDE_DELTA,
                        longitudeDelta: LONGITUDE_DELTA,
                    }, 500);
                }
            }
        } catch (error) {
            console.error('Error searching location:', error);
        } finally {
            setCalculating(false);
        }
    };



    const calculateRoute = async () => {
        if (!pickupLocation || !destinationLocation) return;

        setCalculating(true);
        try {
            // Calcular distancia usando fórmula de Haversine
            const R = 6371; // Radio de la Tierra en km
            const dLat = (destinationLocation.latitude - pickupLocation.latitude) * Math.PI / 180;
            const dLon = (destinationLocation.longitude - pickupLocation.longitude) * Math.PI / 180;
            const a =
                Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(pickupLocation.latitude * Math.PI / 180) * Math.cos(destinationLocation.latitude * Math.PI / 180) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            const calculatedDistance = R * c;

            setDistance(calculatedDistance);

            // Estimar duración (velocidad promedio de 30 km/h en ciudad)
            const estimatedDuration = (calculatedDistance / 30) * 60; // en minutos
            setDuration(estimatedDuration);

            // Crear ruta simple (línea recta) - en producción usarías Google Directions API
            setRouteCoordinates([pickupLocation, destinationLocation]);

            // Calcular tarifa
            calculateFare(calculatedDistance, estimatedDuration);

            // Ajustar vista del mapa
            if (mapRef.current) {
                mapRef.current.fitToCoordinates([pickupLocation, destinationLocation], {
                    edgePadding: { top: 100, right: 50, bottom: 100, left: 50 },
                    animated: true,
                });
            }

        } catch (error) {
            console.error('Error calculating route:', error);
        } finally {
            setCalculating(false);
        }
    };

    const calculateFare = (distance, duration) => {
        // Fórmula básica de tarifa
        const baseFare = 150; // Tarifa base en pesos
        const perKmRate = 80; // Tarifa por km
        const perMinuteRate = 15; // Tarifa por minuto

        const distanceFare = distance * perKmRate;
        const timeFare = duration * perMinuteRate;

        const subtotal = baseFare + distanceFare + timeFare;
        const total = subtotal * selectedVehicle.priceMultiplier;

        setFareEstimate({
            baseFare,
            distanceFare,
            timeFare,
            subtotal,
            total: Math.round(total),
            currency: 'ARS',
        });
    };

    const handleRequestRide = () => {
        if (!pickupLocation || !destinationLocation) {
            Alert.alert('Error', 'Selecciona origen y destino');
            return;
        }
        setShowFareModal(true);
    };

    const confirmRideRequest = async () => {
        try {
            setLoading(true);

            const rideData = {
                pickup_latitude: parseFloat(pickupLocation.latitude).toFixed(6),
                pickup_longitude: parseFloat(pickupLocation.longitude).toFixed(6),
                pickup_address: pickupAddress,
                destination_latitude: parseFloat(destinationLocation.latitude).toFixed(6),
                destination_longitude: parseFloat(destinationLocation.longitude).toFixed(6),
                destination_address: destinationAddress,
                customer_notes: `Vehículo preferido: ${selectedVehicle.name}`,
            };

            // Enviar solicitud al backend
            const response = await authenticatedFetch(`${API_BASE_URL}/mobility/trips/`, {
                method: 'POST',
                body: JSON.stringify(rideData),
            });

            if (response.ok) {
                const data = await response.json();
                setShowFareModal(false);

                // Navegar a la pantalla de tracking
                navigation.navigate('RideTracking', {
                    rideId: data.id,
                    rideData: data
                });
            } else {
                let errorMsg = 'Error al solicitar el viaje';
                try {
                    const errorData = await response.json();
                    errorMsg = errorData.detail || errorData.error || (typeof errorData === 'object' ? Object.values(errorData)[0]?.[0] || JSON.stringify(errorData) : errorMsg);
                } catch(e) {}
                throw new Error(errorMsg);
            }

        } catch (error) {
            console.error('Error requesting ride:', error);
            Alert.alert('Error', error.message || 'No se pudo solicitar el viaje. Intenta nuevamente.');
        } finally {
            setLoading(false);
        }
    };

    const handleLocationSelect = (location, isDestination = false) => {
        if (isDestination) {
            setDestinationLocation(location.coords);
            setDestinationAddress(location.address || location.name);
            setIsNoDestination(false);
        } else {
            setPickupLocation(location.coords);
            setPickupAddress(location.address || location.name);
        }

        setShowRecentLocations(false);
        setActiveInput(null);

        // Mover el mapa a la ubicación seleccionada
        if (mapRef.current) {
            mapRef.current.animateToRegion({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                latitudeDelta: LATITUDE_DELTA,
                longitudeDelta: LONGITUDE_DELTA,
            }, 500);
        }
    };

    const toggleNoDestination = () => {
        const newValue = !isNoDestination;
        setIsNoDestination(newValue);

        if (newValue) {
            setDestinationLocation(null);
            setDestinationAddress('');
            setRouteCoordinates([]);
            setDistance(0);
            setDuration(0);
            // Tarifa estándar para viaje sin destino
            setFareEstimate({
                baseFare: 200,
                distanceFare: 0,
                timeFare: 0,
                subtotal: 200,
                total: Math.round(200 * selectedVehicle.priceMultiplier),
                currency: 'ARS',
            });
        } else if (pickupLocation) {
            // Recalcular si hay ubicación de origen
            calculateRoute();
        }
    };

    const renderRecentLocations = () => (
        <Modal
            visible={showRecentLocations && activeInput}
            animationType="slide"
            transparent={false}
            onRequestClose={() => setShowRecentLocations(false)}
        >
            <SafeAreaView style={styles.recentLocationsContainer}>
                <View style={styles.recentLocationsHeader}>
                    <TouchableOpacity
                        onPress={() => setShowRecentLocations(false)}
                        style={styles.backButton}
                    >
                        <Icon name="arrow-back" size={24} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.recentLocationsTitle}>
                        {activeInput === 'pickup' ? 'Seleccionar origen' : 'Seleccionar destino'}
                    </Text>
                </View>

                <ScrollView style={styles.recentLocationsList}>
                    <TouchableOpacity
                        style={styles.locationItem}
                        onPress={() => {
                            if (activeInput === 'pickup') {
                                setPickupAddress('Mi ubicación actual');
                                setPickupLocation(currentLocation);
                            } else {
                                setDestinationAddress('Sin destino específico');
                                setIsNoDestination(true);
                            }
                            setShowRecentLocations(false);
                        }}
                    >
                        <Icon
                            name={activeInput === 'pickup' ? 'my-location' : 'help-outline'}
                            size={24}
                            color="#666"
                        />
                        <View style={styles.locationTextContainer}>
                            <Text style={styles.locationTitle}>
                                {activeInput === 'pickup' ? 'Mi ubicación actual' : 'Sin destino específico'}
                            </Text>
                            <Text style={styles.locationSubtitle}>
                                {activeInput === 'pickup'
                                    ? 'Usar mi ubicación actual'
                                    : 'El conductor te llevará donde indiques'}
                            </Text>
                        </View>
                    </TouchableOpacity>

                    {recentLocations.map(location => (
                        <TouchableOpacity
                            key={location.id}
                            style={styles.locationItem}
                            onPress={() => handleLocationSelect(location, activeInput === 'destination')}
                        >
                            <Icon
                                name={activeInput === 'pickup' ? 'location-history' : 'place'}
                                size={24}
                                color="#666"
                            />
                            <View style={styles.locationTextContainer}>
                                <Text style={styles.locationTitle}>{location.name}</Text>
                                <Text style={styles.locationSubtitle}>{location.address}</Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </SafeAreaView>
        </Modal>
    );

    const renderFareModal = () => (
        <Modal
            visible={showFareModal}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setShowFareModal(false)}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.fareModal}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Confirmar Viaje</Text>
                        <TouchableOpacity onPress={() => setShowFareModal(false)}>
                            <Icon name="close" size={24} color="#666" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.fareDetails}>
                        <View style={styles.routeInfo}>
                            <View style={styles.routePoint}>
                                <Icon name="radio-button-checked" size={12} color="#4CAF50" />
                                <Text style={styles.routeText} numberOfLines={1}>
                                    {pickupAddress}
                                </Text>
                            </View>
                            <View style={styles.routeLine} />
                            <View style={styles.routePoint}>
                                <Icon name="location-on" size={12} color="#F44336" />
                                <Text style={styles.routeText} numberOfLines={1}>
                                    {destinationAddress}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.vehicleSelection}>
                            {vehicleTypes.map((vehicle) => (
                                <TouchableOpacity
                                    key={vehicle.id}
                                    style={[
                                        styles.vehicleOption,
                                        selectedVehicle.id === vehicle.id && styles.selectedVehicle
                                    ]}
                                    onPress={() => setSelectedVehicle(vehicle)}
                                >
                                    <Icon name={vehicle.icon} size={24} color="#666" />
                                    <View style={styles.vehicleInfo}>
                                        <Text style={styles.vehicleName}>{vehicle.name}</Text>
                                        <Text style={styles.vehicleTime}>{vehicle.estimatedTime}</Text>
                                    </View>
                                    <Text style={styles.vehiclePrice}>
                                        ${Math.round(fareEstimate?.subtotal * vehicle.priceMultiplier || 0)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {fareEstimate && (
                            <View style={styles.fareBreakdown}>
                                <Text style={styles.fareTitle}>Desglose de tarifa</Text>
                                <View style={styles.fareRow}>
                                    <Text style={styles.fareLabel}>Tarifa base</Text>
                                    <Text style={styles.fareValue}>${fareEstimate.baseFare}</Text>
                                </View>
                                <View style={styles.fareRow}>
                                    <Text style={styles.fareLabel}>
                                        Distancia ({distance.toFixed(1)} km)
                                    </Text>
                                    <Text style={styles.fareValue}>${Math.round(fareEstimate.distanceFare)}</Text>
                                </View>
                                <View style={styles.fareRow}>
                                    <Text style={styles.fareLabel}>
                                        Tiempo ({Math.round(duration)} min)
                                    </Text>
                                    <Text style={styles.fareValue}>${Math.round(fareEstimate.timeFare)}</Text>
                                </View>
                                {selectedVehicle.priceMultiplier !== 1.0 && (
                                    <View style={styles.fareRow}>
                                        <Text style={styles.fareLabel}>Tipo de vehículo</Text>
                                        <Text style={styles.fareValue}>
                                            +{Math.round((selectedVehicle.priceMultiplier - 1) * 100)}%
                                        </Text>
                                    </View>
                                )}
                                <View style={styles.fareDivider} />
                                <View style={styles.fareRow}>
                                    <Text style={styles.totalLabel}>Total</Text>
                                    <Text style={styles.totalValue}>${fareEstimate.total}</Text>
                                </View>
                            </View>
                        )}
                    </View>

                    <TouchableOpacity
                        style={styles.confirmButton}
                        onPress={confirmRideRequest}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <Text style={styles.confirmButtonText}>
                                Confirmar Viaje • ${fareEstimate?.total || 0}
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2196F3" />
                <Text style={styles.loadingText}>Obteniendo ubicación...</Text>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 44 : 0}
        >
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
                    <Text style={styles.headerTitle}>Solicitar Viaje</Text>
                </View>

                {/* Address Inputs */}
                <View style={styles.addressContainer}>
                    {/* <TouchableOpacity
                        style={styles.inputContainer}
                        onPress={() => {
                            setActiveInput('pickup');
                            setShowRecentLocations(true);
                        }}
                    >
                        <Icon name="radio-button-checked" size={16} color="#4CAF50" />
                        <View style={styles.addressInput}>
                            <Text style={styles.addressText} numberOfLines={1}>
                                {pickupAddress || 'Seleccionar origen'}
                            </Text>
                        </View>
                    </TouchableOpacity> */}



                    {/* Input de Origen */}
                    {/* Input de Origen */}
<View style={styles.inputContainer}>
    <Icon name="radio-button-checked" size={16} color="#4CAF50" />
    <TextInput
        style={styles.addressInput}
        placeholder={`Buscar en ${currentRegion.city || currentRegion.region || 'esta zona'}`}
        value={pickupAddress}
        onChangeText={(text) => {
            setPickupAddress(text);
            if (text.length > 3) {
                searchLocation(text, false);
            }
        }}
        onFocus={() => {
            setActiveInput('pickup');
            setShowRecentLocations(true);
        }}
        onSubmitEditing={() => searchLocation(pickupAddress, false)}
    />
    {pickupAddress && (
        <TouchableOpacity onPress={() => {
            setPickupAddress('');
            // Restaurar ubicación actual al borrar
            setPickupLocation(currentLocation);
            getAddressFromCoordinates(currentLocation).then(setPickupAddress);
        }}>
            <Icon name="close" size={20} color="#666" />
        </TouchableOpacity>
    )}
</View>

                    <View style={styles.inputSeparator}>
                        <View style={styles.separatorLine} />
                        <TouchableOpacity
                            style={styles.swapButton}
                            onPress={() => {
                                // Intercambiar origen y destino
                                const tempLocation = pickupLocation;
                                const tempAddress = pickupAddress;
                                setPickupLocation(destinationLocation);
                                setPickupAddress(destinationAddress);
                                setDestinationLocation(tempLocation);
                                setDestinationAddress(tempAddress);
                            }}
                        >
                            <Icon name="swap-vert" size={20} color="#666" />
                        </TouchableOpacity>
                        <View style={styles.separatorLine} />
                    </View>

                    {/* Input de Destino */}
                    <View style={styles.inputContainer}>
                        <Icon name="location-on" size={16} color="#F44336" />
                        <TextInput
                            style={styles.addressInput}
                            placeholder={isNoDestination ? 'Sin destino específico' : 'Destino'}
                            value={isNoDestination ? '' : destinationAddress}
                            onChangeText={(text) => {
                                if (!isNoDestination) {
                                    setDestinationAddress(text);
                                    if (text.length > 3) {
                                        searchLocation(text, true);
                                    }
                                }
                            }}
                            onFocus={() => {
                                if (!isNoDestination) {
                                    setActiveInput('destination');
                                    setShowRecentLocations(true);
                                }
                            }}
                            onSubmitEditing={() => !isNoDestination && searchLocation(destinationAddress, true)}
                            editable={!isNoDestination}
                        />
                        {destinationAddress && !isNoDestination && (
                            <TouchableOpacity onPress={() => setDestinationAddress('')}>
                                <Icon name="close" size={20} color="#666" />
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Opción para viaje sin destino */}
                    {!isNoDestination && (
                        <TouchableOpacity
                            style={styles.noDestinationButton}
                            onPress={toggleNoDestination}
                        >
                            <Icon name="help-outline" size={16} color="#2196F3" />
                            <Text style={styles.noDestinationText}>No tengo un destino específico</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Map */}
                <View style={styles.mapContainer}>
                    {currentLocation && (
                        <MapView
                            ref={mapRef}
                            style={styles.map}
                            initialRegion={{
                                latitude: currentLocation.latitude,
                                longitude: currentLocation.longitude,
                                latitudeDelta: LATITUDE_DELTA,
                                longitudeDelta: LONGITUDE_DELTA,
                            }}
                            showsUserLocation
                            showsMyLocationButton={false}
                            onPress={async (event) => {
                                const coords = event.nativeEvent.coordinate;

                                if (activeInput === 'pickup') {
                                    setPickupLocation(coords);
                                    const address = await getAddressFromCoordinates(coords);
                                    setPickupAddress(address);
                                } else if (activeInput === 'destination') {
                                    setDestinationLocation(coords);
                                    const address = await getAddressFromCoordinates(coords);
                                    setDestinationAddress(address);
                                    setIsNoDestination(false);
                                } else {
                                    // Si no hay input activo, preguntar qué quiere seleccionar
                                    Alert.alert(
                                        'Seleccionar ubicación',
                                        '¿Qué deseas seleccionar?',
                                        [
                                            {
                                                text: 'Origen',
                                                onPress: async () => {
                                                    setPickupLocation(coords);
                                                    const address = await getAddressFromCoordinates(coords);
                                                    setPickupAddress(address);
                                                }
                                            },
                                            {
                                                text: 'Destino',
                                                onPress: async () => {
                                                    setDestinationLocation(coords);
                                                    const address = await getAddressFromCoordinates(coords);
                                                    setDestinationAddress(address);
                                                    setIsNoDestination(false);
                                                }
                                            },
                                            {
                                                text: 'Cancelar',
                                                style: 'cancel'
                                            }
                                        ]
                                    );
                                }
                            }}
                        >
                            {/* Marcadores y ruta... */}
                            {pickupLocation && (
                                <Marker
                                    coordinate={pickupLocation}
                                    title="Origen"
                                    description={pickupAddress}
                                    pinColor="#4CAF50"
                                />
                            )}

                            {/* Marcador de destino */}
                            {destinationLocation && (
                                <Marker
                                    coordinate={destinationLocation}
                                    title="Destino"
                                    description={destinationAddress}
                                    pinColor="#F44336"
                                />
                            )}

                            {/* Ruta */}
                            {routeCoordinates.length > 0 && (
                                <Polyline
                                    coordinates={routeCoordinates}
                                    strokeColor="#2196F3"
                                    strokeWidth={4}
                                    lineDashPattern={[5, 5]}
                                />
                            )}
                        </MapView>
                    )}
                </View>

                {/* Bottom Panel */}
                <View style={[styles.bottomPanel, { paddingBottom: insets.bottom + 16 }]}>
                    {fareEstimate && (
                        <View style={styles.farePreview}>
                            <View style={styles.fareInfo}>
                                {isNoDestination ? (
                                    <Text style={styles.fareDistance}>Tarifa estándar</Text>
                                ) : (
                                    <Text style={styles.fareDistance}>
                                        {distance > 0 ? `${distance.toFixed(1)} km • ${Math.round(duration)} min` : 'Calculando...'}
                                    </Text>
                                )}
                                <Text style={styles.farePrice}>
                                    Desde ${Math.round(fareEstimate.total)}
                                </Text>
                            </View>
                        </View>
                    )}

                    <TouchableOpacity
                        style={[
                            styles.requestButton,
                            (!pickupLocation || calculating) && styles.disabledButton
                        ]}
                        onPress={handleRequestRide}
                        disabled={!pickupLocation || calculating}
                    >
                        <Text style={styles.requestButtonText}>
                            {calculating ? 'Calculando...' : 'Solicitar Viaje'}
                        </Text>
                        {fareEstimate && (
                            <Text style={styles.requestButtonPrice}>${Math.round(fareEstimate.total)}</Text>
                        )}
                    </TouchableOpacity>
                </View>

                {renderFareModal()}
                {renderRecentLocations()}
            </SafeAreaView>
        </KeyboardAvoidingView>
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5',
    },
    backButton: {
        padding: 8,
        marginRight: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    addressContainer: {
        backgroundColor: '#FFF',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    },
    addressInput: {
        flex: 1,
        marginLeft: 12,
        fontSize: 16,
        color: '#333',
        paddingVertical: Platform.OS === 'ios' ? 8 : 4,
    },
    inputSeparator: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 8,
    },
    separatorLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#E5E5E5',
    },
    swapButton: {
        marginHorizontal: 12,
        padding: 8,
    },
    mapContainer: {
        flex: 1,
        position: 'relative',
    },
    map: {
        flex: 1,
    },
    calculatingOverlay: {
        position: 'absolute',
        top: 16,
        right: 16,
        backgroundColor: 'rgba(0,0,0,0.7)',
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 8,
        flexDirection: 'row',
        alignItems: 'center',
    },
    calculatingText: {
        color: '#FFF',
        fontSize: 12,
        marginLeft: 8,
    },
    bottomPanel: {
        backgroundColor: '#FFF',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: '#E5E5E5',
    },
    farePreview: {
        marginBottom: 12,
    },
    fareInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    fareDistance: {
        fontSize: 14,
        color: '#666',
    },
    farePrice: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    mapMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#2196F3',
    borderWidth: 2,
    borderColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
},
mapMarkerInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'white',
},
    requestButton: {
        backgroundColor: '#2196F3',
        borderRadius: 8,
        paddingVertical: 16,
        alignItems: 'center',
    },
    disabledButton: {
        backgroundColor: '#CCC',
    },
    requestButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    fareModal: {
        backgroundColor: '#FFF',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        paddingBottom: 32,
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
    fareDetails: {
        padding: 16,
    },
    routeInfo: {
        marginBottom: 20,
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
        height: 20,
        backgroundColor: '#DDD',
        marginLeft: 5,
        marginBottom: 8,
    },
    vehicleSelection: {
        marginBottom: 20,
    },
    vehicleOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E5E5',
        marginBottom: 8,
    },
    selectedVehicle: {
        borderColor: '#2196F3',
        backgroundColor: '#F3F8FF',
    },
    vehicleInfo: {
        flex: 1,
        marginLeft: 12,
    },
    vehicleName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    vehicleTime: {
        fontSize: 12,
        color: '#666',
    },
    vehiclePrice: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    fareBreakdown: {
        backgroundColor: '#F8F9FA',
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
    },
    fareTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 12,
    },
    fareRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    fareLabel: {
        fontSize: 14,
        color: '#666',
    },
    fareValue: {
        fontSize: 14,
        color: '#333',
    },
    fareDivider: {
        height: 1,
        backgroundColor: '#E5E5E5',
        marginVertical: 8,
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    totalValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    confirmButton: {
        backgroundColor: '#2196F3',
        marginHorizontal: 16,
        borderRadius: 8,
        paddingVertical: 16,
        alignItems: 'center',
    },
    confirmButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },// Nuevos estilos
    recentLocationsContainer: {
        flex: 1,
        backgroundColor: '#FFF',
    },
    recentLocationsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5',
    },
    recentLocationsTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginLeft: 16,
    },
    recentLocationsList: {
        flex: 1,
        paddingHorizontal: 16,
    },
    locationItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F5F5F5',
    },
    locationTextContainer: {
        flex: 1,
        marginLeft: 16,
    },
    locationTitle: {
        fontSize: 16,
        color: '#333',
    },
    locationSubtitle: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    addressText: {
        fontSize: 16,
        color: '#333',
        marginLeft: 12,
        flex: 1,
    },
    noDestinationButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
        padding: 8,
    },
    noDestinationText: {
        fontSize: 14,
        color: '#2196F3',
        marginLeft: 8,
    },
    requestButtonPrice: {
        color: '#FFF',
        fontSize: 14,
        marginLeft: 8,
        opacity: 0.8,
    },
    // Ajustes para safe area
    bottomPanel: {
        backgroundColor: '#FFF',
        paddingHorizontal: 16,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#E5E5E5',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 5,
    },
});

export default RideRequestScreen;
