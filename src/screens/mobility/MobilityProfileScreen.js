// src/screens/mobility/MobilityProfileScreen.js
import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  Image,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { AuthContext } from '../../context/AuthContext';
import * as ImagePicker from 'expo-image-picker';

export default function MobilityProfileScreen() {
  const navigation = useNavigation();
  const { authenticatedFetch, userData, updateProfile } = useContext(AuthContext);
  
  const [driverProfile, setDriverProfile] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDriverProfile();
  }, []);

  const loadDriverProfile = async () => {
    setLoading(true);
    try {
      const response = await authenticatedFetch('/api/mobility/drivers/me/');
      if (response.ok) {
        const data = await response.json();
        setDriverProfile(data);
      } else {
        // Datos de ejemplo para desarrollo
        setDriverProfile({
          id: 1,
          user_info: {
            id: userData?.id,
            username: userData?.username,
            email: userData?.email,
            first_name: userData?.first_name || 'Juan',
            last_name: userData?.last_name || 'Pérez',
            phone_number: userData?.phone_number || '+54911234567',
            profile_picture: null,
          },
          license_number: 'B1234567',
          vehicle_type: 'car',
          vehicle_brand: 'Toyota',
          vehicle_model: 'Corolla',
          vehicle_year: 2020,
          vehicle_plate: 'ABC123',
          vehicle_color: 'Blanco',
          status: 'approved',
          availability: 'available',
          rating: 4.8,
          total_trips: 342,
          total_earnings: 15680.50,
          created_at: '2023-06-15T10:00:00Z',
          last_location_update: '2024-01-15T14:30:00Z',
        });
      }
    } catch (error) {
      console.error('Error loading driver profile:', error);
      Alert.alert('Error', 'No se pudo cargar el perfil');
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permisos', 'Se necesitan permisos para acceder a las fotos');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        await uploadProfilePicture(result.assets[0]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    }
  };

  const uploadProfilePicture = async (asset) => {
    try {
      const formData = new FormData();
      formData.append('profile_picture', {
        uri: asset.uri,
        type: 'image/jpeg',
        name: 'profile.jpg',
      });

      const response = await authenticatedFetch('/api/auth/profile/picture/', {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.ok) {
        Alert.alert('Éxito', 'Foto de perfil actualizada');
        loadDriverProfile();
      } else {
        Alert.alert('Error', 'No se pudo actualizar la foto');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', 'Error al subir la imagen');
    }
  };

  const getVehicleTypeText = (type) => {
    switch (type) {
      case 'car':
        return 'Automóvil';
      case 'motorcycle':
        return 'Motocicleta';
      case 'van':
        return 'Camioneta';
      default:
        return type;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return '#4CAF50';
      case 'pending':
        return '#FF9800';
      case 'rejected':
        return '#f44336';
      default:
        return '#666';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'approved':
        return 'Aprobado';
      case 'pending':
        return 'Pendiente';
      case 'rejected':
        return 'Rechazado';
      default:
        return status;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const renderProfileItem = (label, value, icon, onPress = null) => (
    <TouchableOpacity 
      style={styles.profileItem} 
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.profileItemLeft}>
        <Icon name={icon} size={20} color="#2196F3" />
        <View style={styles.profileItemText}>
          <Text style={styles.profileItemLabel}>{label}</Text>
          <Text style={styles.profileItemValue}>{value}</Text>
        </View>
      </View>
      {onPress && <Icon name="chevron-right" size={20} color="#ccc" />}
    </TouchableOpacity>
  );

  const renderStatsCard = (title, value, icon, color) => (
    <View style={[styles.statsCard, { borderLeftColor: color }]}>
      <View style={styles.statsContent}>
        <View style={styles.statsText}>
          <Text style={styles.statsValue}>{value}</Text>
          <Text style={styles.statsTitle}>{title}</Text>
        </View>
        <View style={[styles.statsIcon, { backgroundColor: color }]}>
          <Icon name={icon} size={20} color="#fff" />
        </View>
      </View>
    </View>
  );

  if (loading || !driverProfile) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Cargando perfil...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header del perfil */}
        <View style={styles.profileHeader}>
          <TouchableOpacity style={styles.profileImageContainer} onPress={pickImage}>
            {driverProfile.user_info.profile_picture ? (
              <Image 
                source={{ uri: driverProfile.user_info.profile_picture }} 
                style={styles.profileImage}
              />
            ) : (
              <View style={styles.profileImagePlaceholder}>
                <Icon name="person" size={40} color="#999" />
              </View>
            )}
            <View style={styles.cameraOverlay}>
              <Icon name="camera-alt" size={16} color="#fff" />
            </View>
          </TouchableOpacity>
          
          <Text style={styles.profileName}>
            {driverProfile.user_info.first_name} {driverProfile.user_info.last_name}
          </Text>
          
          <View style={styles.statusContainer}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(driverProfile.status) }]}>
              <Text style={styles.statusText}>{getStatusText(driverProfile.status)}</Text>
            </View>
          </View>

          <View style={styles.ratingContainer}>
            <Icon name="star" size={20} color="#FFC107" />
            <Text style={styles.ratingText}>{driverProfile.rating}</Text>
            <Text style={styles.ratingSubtext}>({driverProfile.total_trips} viajes)</Text>
          </View>
        </View>

        {/* Estadísticas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Estadísticas</Text>
          <View style={styles.statsGrid}>
            {renderStatsCard(
              'Viajes totales',
              driverProfile.total_trips,
              'directions-car',
              '#2196F3'
            )}
            {renderStatsCard(
              'Ganancias totales',
              `$${driverProfile.total_earnings}`,
              'monetization-on',
              '#4CAF50'
            )}
            {renderStatsCard(
              'Calificación',
              `${driverProfile.rating} ★`,
              'star',
              '#FFC107'
            )}
            {renderStatsCard(
              'Miembro desde',
              formatDate(driverProfile.created_at),
              'event',
              '#9C27B0'
            )}
          </View>
        </View>

        {/* Información personal */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información personal</Text>
          <View style={styles.profileSection}>
            {renderProfileItem(
              'Nombre completo',
              `${driverProfile.user_info.first_name} ${driverProfile.user_info.last_name}`,
              'person',
              () => navigation.navigate('EditProfile')
            )}
            {renderProfileItem(
              'Email',
              driverProfile.user_info.email,
              'email',
              () => navigation.navigate('EditProfile')
            )}
            {renderProfileItem(
              'Teléfono',
              driverProfile.user_info.phone_number,
              'phone',
              () => navigation.navigate('EditProfile')
            )}
            {renderProfileItem(
              'Licencia de conducir',
              driverProfile.license_number,
              'assignment',
              () => Alert.alert('Información', 'Contacta soporte para cambiar la licencia')
            )}
          </View>
        </View>

        {/* Información del vehículo */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información del vehículo</Text>
          <View style={styles.profileSection}>
            {renderProfileItem(
              'Tipo de vehículo',
              getVehicleTypeText(driverProfile.vehicle_type),
              'directions-car'
            )}
            {renderProfileItem(
              'Marca y modelo',
              `${driverProfile.vehicle_brand} ${driverProfile.vehicle_model}`,
              'car-repair'
            )}
            {renderProfileItem(
              'Año',
              driverProfile.vehicle_year.toString(),
              'event'
            )}
            {renderProfileItem(
              'Patente',
              driverProfile.vehicle_plate,
              'confirmation-number'
            )}
            {renderProfileItem(
              'Color',
              driverProfile.vehicle_color,
              'palette'
            )}
          </View>
        </View>

        {/* Acciones */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Acciones</Text>
          <View style={styles.actionsContainer}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('MobilityEarnings')}
            >
              <Icon name="account-balance-wallet" size={24} color="#4CAF50" />
              <Text style={styles.actionButtonText}>Ver ganancias</Text>
              <Icon name="chevron-right" size={20} color="#ccc" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('MobilityHistory')}
            >
              <Icon name="history" size={24} color="#2196F3" />
              <Text style={styles.actionButtonText}>Historial de viajes</Text>
              <Icon name="chevron-right" size={20} color="#ccc" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('MobilitySettings')}
            >
              <Icon name="settings" size={24} color="#FF9800" />
              <Text style={styles.actionButtonText}>Configuración</Text>
              <Icon name="chevron-right" size={20} color="#ccc" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => {
                Alert.alert('Ayuda', 'Contacta con soporte: soporte@dely.com');
              }}
            >
              <Icon name="help" size={24} color="#9C27B0" />
              <Text style={styles.actionButtonText}>Ayuda y soporte</Text>
              <Icon name="chevron-right" size={20} color="#ccc" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Espaciado inferior */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  profileHeader: {
    backgroundColor: '#2196F3',
    alignItems: 'center',
    paddingVertical: 30,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: '#fff',
  },
  profileImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#fff',
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: '#FF9800',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  statusContainer: {
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 4,
  },
  ratingSubtext: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginLeft: 8,
  },
  section: {
    marginHorizontal: 20,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    width: '48%',
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statsContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statsText: {
    flex: 1,
  },
  statsValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  statsTitle: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
  },
  statsIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  profileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  profileItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileItemText: {
    marginLeft: 12,
    flex: 1,
  },
  profileItemLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  profileItemValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  actionsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  actionButtonText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    flex: 1,
    marginLeft: 12,
  },
  bottomSpacer: {
    height: 40,
  },
});