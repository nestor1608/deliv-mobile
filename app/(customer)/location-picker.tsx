import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    TextInput,
    ScrollView,
    ActivityIndicator,
    SafeAreaView,
    StatusBar
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const LocationPickerScreen = () => {
    const router = useRouter();
    const { onLocationSelected: onLocationSelectedParam } = useLocalSearchParams();
    const insets = useSafeAreaInsets();

    const [location, setLocation] = useState(null);
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [address, setAddress] = useState('');
    const [referenceAddress, setReferenceAddress] = useState('');
    const [loading, setLoading] = useState(true);
    const [addressLoading, setAddressLoading] = useState(false);
    const [estimatedTime, setEstimatedTime] = useState(null);

    const businessLocation = {
        latitude: -29.3833,
        longitude: -56.85,
    };

    useEffect(() => {
        requestLocationPermission();
    }, []);

    const requestLocationPermission = async () => {
        try {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert(
                    'Permiso requerido',
                    'Necesitamos acceso a tu ubicación para brindarte un mejor servicio',
                    [
                        { text: 'Cancelar', style: 'cancel' },
                        { text: 'Configurar', onPress: () => Location.requestForegroundPermissionsAsync() }
                    ]
                );
                setLoading(false);
                return;
            }
            await getCurrentLocation();
        } catch (error) {
            console.error('Error requesting permission:', error);
            setLoading(false);
        }
    };

    const getCurrentLocation = async () => {
        try {
            const currentLocation = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High
            });
            setLocation({
                latitude: currentLocation.coords.latitude,
                longitude: currentLocation.coords.longitude
            });
            setSelectedLocation({
                latitude: currentLocation.coords.latitude,
                longitude: currentLocation.coords.longitude
            });
        } catch (error) {
            console.error('Error getting location:', error);
        }
        setLoading(false);
    };

    const handleMapPress = async (event) => {
        const coords = event.nativeEvent.coordinate;
        setSelectedLocation(coords);

        setAddressLoading(true);
        try {
            const [result] = await Location.reverseGeocodeAsync(coords);
            if (result) {
                const formattedAddress = [
                    result.street,
                    result.streetNumber,
                    result.district,
                    result.city
                ].filter(Boolean).join(', ');
                setAddress(formattedAddress || 'Dirección desconocida');
            }
        } catch (error) {
            console.error('Error getting address:', error);
            setAddress('Dirección desconocida');
        }
        setAddressLoading(false);
    };

    const handleConfirmLocation = () => {
        if (!selectedLocation) {
            Alert.alert('Error', 'Por favor selecciona una ubicación en el mapa');
            return;
        }

        const locationData = {
            coordinates: selectedLocation,
            address: address,
            reference: referenceAddress
        };

        // Volver a la pantalla anterior con los datos
        router.back();
    };

    const handleUseCurrentLocation = async () => {
        try {
            setLoading(true);
            const currentLocation = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High
            });
            const coords = {
                latitude: currentLocation.coords.latitude,
                longitude: currentLocation.coords.longitude
            };
            setSelectedLocation(coords);

            setAddressLoading(true);
            const [result] = await Location.reverseGeocodeAsync(coords);
            if (result) {
                const formattedAddress = [
                    result.street,
                    result.streetNumber,
                    result.district,
                    result.city
                ].filter(Boolean).join(', ');
                setAddress(formattedAddress || 'Dirección desconocida');
            }
            setAddressLoading(false);
        } catch (error) {
            console.error('Error getting location:', error);
            Alert.alert('Error', 'No se pudo obtener la ubicación actual');
        }
        setLoading(false);
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007BFF" />
                <Text style={styles.loadingText}>Obteniendo ubicación...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <Icon name="close" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Seleccionar Ubicación</Text>
                <TouchableOpacity
                    style={styles.confirmButton}
                    onPress={handleConfirmLocation}
                >
                    <Text style={styles.confirmText}>Confirmar</Text>
                </TouchableOpacity>
            </View>

            {/* Map */}
            <View style={styles.mapContainer}>
                <MapView
                    style={styles.map}
                    initialRegion={{
                        latitude: selectedLocation?.latitude || businessLocation.latitude,
                        longitude: selectedLocation?.longitude || businessLocation.longitude,
                        latitudeDelta: 0.01,
                        longitudeDelta: 0.01
                    }}
                    onPress={handleMapPress}
                    showsUserLocation
                    showsMyLocationButton
                >
                    {selectedLocation && (
                        <Marker
                            coordinate={selectedLocation}
                            draggable
                            onDragEnd={handleMapPress}
                        >
                            <View style={styles.markerContainer}>
                                <Icon name="location-on" size={40} color="#FF6B6B" />
                            </View>
                        </Marker>
                    )}
                </MapView>

                {/* Botón de ubicación actual */}
                <TouchableOpacity
                    style={styles.locationButton}
                    onPress={handleUseCurrentLocation}
                >
                    <Icon name="my-location" size={24} color="#007BFF" />
                </TouchableOpacity>
            </View>

            {/* Address Form */}
            <View style={styles.formContainer}>
                <View style={styles.addressCard}>
                    <View style={styles.addressHeader}>
                        <Icon name="location-on" size={24} color="#FF6B6B" />
                        <Text style={styles.addressLabel}>Ubicación seleccionada</Text>
                    </View>

                    {addressLoading ? (
                        <View style={styles.addressLoading}>
                            <ActivityIndicator size="small" color="#007BFF" />
                            <Text style={styles.addressLoadingText}>Obteniendo dirección...</Text>
                        </View>
                    ) : (
                        <Text style={styles.addressText}>
                            {address || 'Toca el mapa para seleccionar una ubicación'}
                        </Text>
                    )}
                </View>

                <TextInput
                    style={styles.referenceInput}
                    placeholder="Agregar referencia (ej: Portón azul, piso 3)"
                    value={referenceAddress}
                    onChangeText={setReferenceAddress}
                    multiline
                />

                <TouchableOpacity
                    style={styles.confirmFullButton}
                    onPress={handleConfirmLocation}
                >
                    <Icon name="check" size={20} color="#FFF" />
                    <Text style={styles.confirmFullText}>Confirmar ubicación</Text>
                </TouchableOpacity>
            </View>
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5',
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    confirmButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    confirmText: {
        fontSize: 16,
        color: '#007BFF',
        fontWeight: '600',
    },
    mapContainer: {
        flex: 1,
        position: 'relative',
    },
    map: {
        flex: 1,
    },
    markerContainer: {
        alignItems: 'center',
    },
    locationButton: {
        position: 'absolute',
        bottom: 20,
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
    formContainer: {
        backgroundColor: '#FFF',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#E5E5E5',
    },
    addressCard: {
        backgroundColor: '#F8F9FA',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
    },
    addressHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    addressLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginLeft: 8,
    },
    addressText: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    addressLoading: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    addressLoadingText: {
        fontSize: 14,
        color: '#666',
        marginLeft: 8,
    },
    referenceInput: {
        borderWidth: 1,
        borderColor: '#E5E5E5',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 12,
        fontSize: 14,
        minHeight: 60,
        textAlignVertical: 'top',
        marginBottom: 12,
    },
    confirmFullButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#4CAF50',
        paddingVertical: 14,
        borderRadius: 8,
    },
    confirmFullText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
});

export default LocationPickerScreen;
