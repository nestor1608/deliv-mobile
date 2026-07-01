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
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const LocationPickerScreen = ({ navigation, route }) => {
    const insets = useSafeAreaInsets();
    const { onLocationSelected } = route.params || {};
    
    const [location, setLocation] = useState(null);
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [address, setAddress] = useState('');
    const [referenceAddress, setReferenceAddress] = useState('');
    const [loading, setLoading] = useState(true);
    const [addressLoading, setAddressLoading] = useState(false);
    const [estimatedTime, setEstimatedTime] = useState(null);

    // Ubicación base del negocio (puedes cambiar estas coordenadas)
    const businessLocation = {
        latitude: -29.3833,
        longitude: -56.85,
        // Coordenadas de ejemplo para Santo Tomé, Corrientes
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
            console.error('Error requesting location permission:', error);
            setLoading(false);
        }
    };

    const getCurrentLocation = async () => {
        try {
            setLoading(true);
            let currentLocation = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
            });
            
            const coords = {
                latitude: currentLocation.coords.latitude,
                longitude: currentLocation.coords.longitude,
            };
            
            setLocation(currentLocation);
            setSelectedLocation(coords);
            await getAddressFromCoordinates(coords);
            calculateEstimatedTime(coords);
        } catch (error) {
            console.error('Error getting current location:', error);
            Alert.alert('Error', 'No se pudo obtener tu ubicación actual');
        } finally {
            setLoading(false);
        }
    };

    const getAddressFromCoordinates = async (coords) => {
        try {
            setAddressLoading(true);
            const [addressResult] = await Location.reverseGeocodeAsync(coords);
            
            if (addressResult) {
                const fullAddress = [
                    addressResult.street,
                    addressResult.streetNumber,
                    addressResult.district,
                    addressResult.city,
                    addressResult.region
                ].filter(Boolean).join(' ');
                
                setAddress(fullAddress || 'Dirección no disponible');
            }
        } catch (error) {
            console.error('Error getting address:', error);
            setAddress('No se pudo obtener la dirección');
        } finally {
            setAddressLoading(false);
        }
    };

    const calculateEstimatedTime = (coords) => {
        // Calcular distancia aproximada usando fórmula de Haversine
        const R = 6371; // Radio de la Tierra en km
        const dLat = (coords.latitude - businessLocation.latitude) * Math.PI / 180;
        const dLon = (coords.longitude - businessLocation.longitude) * Math.PI / 180;
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(businessLocation.latitude * Math.PI / 180) * Math.cos(coords.latitude * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c; // Distancia en km

        // Calcular tiempo estimado (velocidad promedio de delivery: 25 km/h)
        const deliverySpeed = 25; // km/h
        const timeInHours = distance / deliverySpeed;
        const timeInMinutes = Math.ceil(timeInHours * 60);
        
        // Agregar tiempo base de preparación (15 minutos)
        const totalTime = timeInMinutes + 15;
        
        setEstimatedTime({
            distance: distance.toFixed(1),
            time: totalTime
        });
    };

    const handleMapPress = async (event) => {
        const coords = event.nativeEvent.coordinate;
        setSelectedLocation(coords);
        await getAddressFromCoordinates(coords);
        calculateEstimatedTime(coords);
    };

    const handleUseCurrentLocation = async () => {
        await getCurrentLocation();
    };

    const handleConfirmLocation = () => {
        if (!selectedLocation) {
            Alert.alert('Error', 'Por favor selecciona una ubicación válida');
            return;
        }

        if (!address.trim()) {
            Alert.alert('Error', 'No se pudo obtener la dirección de la ubicación seleccionada');
            return;
        }

        const locationData = {
            coordinates: selectedLocation,
            address: address.trim(),
            reference: referenceAddress.trim(),
            estimatedTime: estimatedTime?.time || 30,
            distance: estimatedTime?.distance || '0.0'
        };

        if (onLocationSelected) {
            onLocationSelected(locationData, `${address}${referenceAddress ? ` - ${referenceAddress}` : ''}`);
        }

        navigation.goBack();
    };

    const renderEstimatedTime = () => {
        if (!estimatedTime) return null;

        return (
            <View style={styles.estimatedTimeContainer}>
                <Icon name="schedule" size={20} color="#28A745" />
                <Text style={styles.estimatedTimeText}>
                    Tiempo estimado: {estimatedTime.time} min ({estimatedTime.distance} km)
                </Text>
            </View>
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#28A745" />
                <Text style={styles.loadingText}>Obteniendo tu ubicación...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
            
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <Text style={styles.title}>Selecciona tu ubicación de entrega</Text>
                    <Text style={styles.subtitle}>
                        Toca en el mapa para seleccionar la ubicación exacta
                    </Text>
                </View>

                {location && (
                    <View style={styles.mapContainer}>
                        <MapView
                            style={styles.map}
                            initialRegion={{
                                latitude: location.coords.latitude,
                                longitude: location.coords.longitude,
                                latitudeDelta: 0.01,
                                longitudeDelta: 0.01,
                            }}
                            onPress={handleMapPress}
                        >
                            {selectedLocation && (
                                <Marker
                                    coordinate={selectedLocation}
                                    title="Tu ubicación de entrega"
                                    description={address}
                                    draggable
                                    onDragEnd={(e) => {
                                        const coords = e.nativeEvent.coordinate;
                                        setSelectedLocation(coords);
                                        getAddressFromCoordinates(coords);
                                        calculateEstimatedTime(coords);
                                    }}
                                />
                            )}
                            
                            {/* Marcador del negocio */}
                            <Marker
                                coordinate={businessLocation}
                                title="Nuestro local"
                                pinColor="#28A745"
                            />
                        </MapView>
                    </View>
                )}

                <View style={styles.controls}>
                    <TouchableOpacity
                        style={styles.locationButton}
                        onPress={handleUseCurrentLocation}
                    >
                        <Icon name="my-location" size={20} color="#FFF" />
                        <Text style={styles.buttonText}>Usar mi ubicación actual</Text>
                    </TouchableOpacity>

                    <View style={styles.addressSection}>
                        <Text style={styles.sectionTitle}>Dirección detectada:</Text>
                        {addressLoading ? (
                            <View style={styles.addressLoading}>
                                <ActivityIndicator size="small" color="#28A745" />
                                <Text style={styles.addressLoadingText}>Obteniendo dirección...</Text>
                            </View>
                        ) : (
                            <Text style={styles.addressText}>{address || 'Selecciona una ubicación'}</Text>
                        )}
                    </View>

                    <View style={styles.referenceSection}>
                        <Text style={styles.sectionTitle}>Referencia (opcional):</Text>
                        <TextInput
                            style={styles.referenceInput}
                            placeholder="Ej: Casa blanca, portón verde, frente a la farmacia..."
                            value={referenceAddress}
                            onChangeText={setReferenceAddress}
                            multiline
                            numberOfLines={2}
                        />
                        <Text style={styles.referenceHint}>
                            Agrega una referencia para ayudar al repartidor a encontrar tu ubicación
                        </Text>
                    </View>

                    {renderEstimatedTime()}
                </View>
            </ScrollView>

            <View style={[styles.bottomContainer, { paddingBottom: insets.bottom + 16 }]}>
                <TouchableOpacity
                    style={[
                        styles.confirmButton,
                        !selectedLocation && styles.confirmButtonDisabled
                    ]}
                    onPress={handleConfirmLocation}
                    disabled={!selectedLocation}
                >
                    <Icon name="check" size={20} color="#FFF" />
                    <Text style={styles.confirmButtonText}>Confirmar Ubicación</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    content: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#666',
    },
    header: {
        backgroundColor: '#FFF',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
    },
    mapContainer: {
        height: 300,
        margin: 16,
        borderRadius: 8,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#E5E5E5',
    },
    map: {
        flex: 1,
    },
    controls: {
        backgroundColor: '#FFF',
        margin: 16,
        padding: 16,
        borderRadius: 8,
    },
    locationButton: {
        backgroundColor: '#28A745',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
    },
    buttonText: {
        color: '#FFF',
        fontWeight: 'bold',
        marginLeft: 8,
    },
    addressSection: {
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    addressLoading: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#F8F9FA',
        borderRadius: 8,
    },
    addressLoadingText: {
        marginLeft: 8,
        color: '#666',
    },
    addressText: {
        fontSize: 16,
        color: '#333',
        padding: 12,
        backgroundColor: '#F8F9FA',
        borderRadius: 8,
        minHeight: 48,
    },
    referenceSection: {
        marginBottom: 16,
    },
    referenceInput: {
        borderWidth: 1,
        borderColor: '#DDD',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        textAlignVertical: 'top',
        minHeight: 60,
    },
    referenceHint: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
    },
    estimatedTimeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E8F5E8',
        padding: 12,
        borderRadius: 8,
        marginTop: 8,
    },
    estimatedTimeText: {
        marginLeft: 8,
        fontSize: 14,
        color: '#28A745',
        fontWeight: '500',
    },
    bottomContainer: {
        backgroundColor: '#FFF',
        paddingHorizontal: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#E5E5E5',
    },
    confirmButton: {
        backgroundColor: '#28A745',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 8,
    },
    confirmButtonDisabled: {
        backgroundColor: '#CCC',
    },
    confirmButtonText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 8,
    },
});

export default LocationPickerScreen;