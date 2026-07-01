// src/screens/mobility/MobilitySettingsScreen.js
import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  SafeAreaView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { AuthContext } from '../../context/AuthContext';

export default function MobilitySettingsScreen() {
  const navigation = useNavigation();
  const { authenticatedFetch, logout } = useContext(AuthContext);
  
  const [settings, setSettings] = useState({
    notifications: {
      newTripRequests: true,
      tripUpdates: true,
      promotions: false,
      earnings: true,
      sound: true,
      vibration: true,
    },
    privacy: {
      shareLocationWithPassengers: true,
      showProfileToPassengers: true,
      allowRatingComments: true,
    },
    preferences: {
      autoAcceptTrips: false,
      workingRadius: 15, // km
      minimumTripDistance: 1, // km
      maximumTripDistance: 50, // km
      preferredVehicleTypes: ['car'],
      avoidTolls: false,
      acceptCashPayments: true,
      acceptCardPayments: true,
    },
    driving: {
      navigationApp: 'google_maps', // 'google_maps', 'waze', 'apple_maps'
      voiceNavigation: true,
      nightMode: 'auto', // 'auto', 'on', 'off'
      speedWarnings: true,
    },
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await authenticatedFetch('/api/mobility/drivers/settings/');
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const updateSetting = async (category, key, value) => {
    const newSettings = {
      ...settings,
      [category]: {
        ...settings[category],
        [key]: value,
      },
    };
    
    setSettings(newSettings);
    
    try {
      await authenticatedFetch('/api/mobility/drivers/settings/', {
        method: 'PATCH',
        body: JSON.stringify(newSettings),
      });
    } catch (error) {
      console.error('Error updating settings:', error);
      // Revertir el cambio si hay error
      setSettings(settings);
      Alert.alert('Error', 'No se pudo actualizar la configuración');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro que deseas cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar sesión',
          style: 'destructive',
          onPress: logout,
        },
      ]
    );
  };

  const clearCache = () => {
    Alert.alert(
      'Limpiar caché',
      'Esto eliminará los datos temporales de la aplicación',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpiar',
          onPress: () => {
            // Implementar limpieza de caché
            Alert.alert('Éxito', 'Caché limpiado correctamente');
          },
        },
      ]
    );
  };

  const renderSettingItem = (title, description, value, onValueChange, type = 'switch') => (
    <View style={styles.settingItem}>
      <View style={styles.settingInfo}>
        <Text style={styles.settingTitle}>{title}</Text>
        {description && <Text style={styles.settingDescription}>{description}</Text>}
      </View>
      {type === 'switch' && (
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: '#767577', true: '#81b0ff' }}
          thumbColor={value ? '#2196F3' : '#f4f3f4'}
          ios_backgroundColor="#3e3e3e"
        />
      )}
    </View>
  );

  const renderNavigationItem = (title, icon, onPress, rightText = null, color = '#333') => (
    <TouchableOpacity style={styles.navigationItem} onPress={onPress}>
      <View style={styles.navigationLeft}>
        <Icon name={icon} size={24} color={color} />
        <Text style={[styles.navigationTitle, { color }]}>{title}</Text>
      </View>
      <View style={styles.navigationRight}>
        {rightText && <Text style={styles.navigationRightText}>{rightText}</Text>}
        <Icon name="chevron-right" size={24} color="#ccc" />
      </View>
    </TouchableOpacity>
  );

  const renderSliderSetting = (title, description, value, onValueChange, min = 1, max = 50, unit = 'km') => (
    <View style={styles.sliderSetting}>
      <View style={styles.settingInfo}>
        <Text style={styles.settingTitle}>{title}</Text>
        {description && <Text style={styles.settingDescription}>{description}</Text>}
      </View>
      <View style={styles.sliderContainer}>
        <Text style={styles.sliderValue}>{value} {unit}</Text>
        {/* Aquí podrías agregar un Slider component si lo instalas */}
        <View style={styles.sliderButtonsContainer}>
          <TouchableOpacity 
            style={styles.sliderButton}
            onPress={() => value > min && onValueChange(value - 1)}
          >
            <Icon name="remove" size={20} color="#2196F3" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.sliderButton}
            onPress={() => value < max && onValueChange(value + 1)}
          >
            <Icon name="add" size={20} color="#2196F3" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Notificaciones */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notificaciones</Text>
          
          {renderSettingItem(
            'Nuevas solicitudes de viaje',
            'Recibir notificación cuando hay una nueva solicitud',
            settings.notifications.newTripRequests,
            (value) => updateSetting('notifications', 'newTripRequests', value)
          )}
          
          {renderSettingItem(
            'Actualizaciones de viajes',
            'Notificaciones sobre cambios en el estado de los viajes',
            settings.notifications.tripUpdates,
            (value) => updateSetting('notifications', 'tripUpdates', value)
          )}
          
          {renderSettingItem(
            'Ganancias y pagos',
            'Notificaciones sobre pagos y ganancias',
            settings.notifications.earnings,
            (value) => updateSetting('notifications', 'earnings', value)
          )}
          
          {renderSettingItem(
            'Promociones',
            'Recibir ofertas y promociones especiales',
            settings.notifications.promotions,
            (value) => updateSetting('notifications', 'promotions', value)
          )}
          
          {renderSettingItem(
            'Sonido',
            'Reproducir sonido con las notificaciones',
            settings.notifications.sound,
            (value) => updateSetting('notifications', 'sound', value)
          )}
          
          {renderSettingItem(
            'Vibración',
            'Vibrar el dispositivo con las notificaciones',
            settings.notifications.vibration,
            (value) => updateSetting('notifications', 'vibration', value)
          )}
        </View>

        {/* Privacidad */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacidad</Text>
          
          {renderSettingItem(
            'Compartir ubicación con pasajeros',
            'Los pasajeros pueden ver tu ubicación durante el viaje',
            settings.privacy.shareLocationWithPassengers,
            (value) => updateSetting('privacy', 'shareLocationWithPassengers', value)
          )}
          
          {renderSettingItem(
            'Mostrar perfil a pasajeros',
            'Los pasajeros pueden ver tu foto, nombre y calificación',
            settings.privacy.showProfileToPassengers,
            (value) => updateSetting('privacy', 'showProfileToPassengers', value)
          )}
          
          {renderSettingItem(
            'Permitir comentarios en calificaciones',
            'Los pasajeros pueden dejar comentarios junto con las calificaciones',
            settings.privacy.allowRatingComments,
            (value) => updateSetting('privacy', 'allowRatingComments', value)
          )}
        </View>

        {/* Preferencias de trabajo */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferencias de trabajo</Text>
          
          {renderSettingItem(
            'Auto-aceptar viajes',
            'Aceptar automáticamente viajes que cumplan tus criterios',
            settings.preferences.autoAcceptTrips,
            (value) => updateSetting('preferences', 'autoAcceptTrips', value)
          )}
          
          {renderSliderSetting(
            'Radio de trabajo',
            'Distancia máxima para recibir solicitudes',
            settings.preferences.workingRadius,
            (value) => updateSetting('preferences', 'workingRadius', value),
            5,
            50
          )}
          
          {renderSliderSetting(
            'Distancia mínima de viaje',
            'Rechazar viajes más cortos que esta distancia',
            settings.preferences.minimumTripDistance,
            (value) => updateSetting('preferences', 'minimumTripDistance', value),
            0,
            10
          )}
          
          {renderSliderSetting(
            'Distancia máxima de viaje',
            'Rechazar viajes más largos que esta distancia',
            settings.preferences.maximumTripDistance,
            (value) => updateSetting('preferences', 'maximumTripDistance', value),
            10,
            100
          )}
          
          {renderSettingItem(
            'Aceptar pagos en efectivo',
            'Permitir que los pasajeros paguen en efectivo',
            settings.preferences.acceptCashPayments,
            (value) => updateSetting('preferences', 'acceptCashPayments', value)
          )}
          
          {renderSettingItem(
            'Aceptar pagos con tarjeta',
            'Permitir que los pasajeros paguen con tarjeta',
            settings.preferences.acceptCardPayments,
            (value) => updateSetting('preferences', 'acceptCardPayments', value)
          )}
        </View>

        {/* Configuración de navegación */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Navegación y conducción</Text>
          
          {renderNavigationItem(
            'App de navegación preferida',
            'navigation',
            () => {
              Alert.alert(
                'App de navegación',
                'Selecciona tu app preferida',
                [
                  { text: 'Google Maps', onPress: () => updateSetting('driving', 'navigationApp', 'google_maps') },
                  { text: 'Waze', onPress: () => updateSetting('driving', 'navigationApp', 'waze') },
                  { text: 'Apple Maps', onPress: () => updateSetting('driving', 'navigationApp', 'apple_maps') },
                  { text: 'Cancelar', style: 'cancel' },
                ]
              );
            },
            settings.driving.navigationApp === 'google_maps' ? 'Google Maps' : 
            settings.driving.navigationApp === 'waze' ? 'Waze' : 'Apple Maps'
          )}
          
          {renderSettingItem(
            'Navegación por voz',
            'Usar indicaciones de voz durante la navegación',
            settings.driving.voiceNavigation,
            (value) => updateSetting('driving', 'voiceNavigation', value)
          )}
          
          {renderSettingItem(
            'Avisos de velocidad',
            'Recibir alertas cuando excedas el límite de velocidad',
            settings.driving.speedWarnings,
            (value) => updateSetting('driving', 'speedWarnings', value)
          )}
        </View>

        {/* Configuración de cuenta */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cuenta</Text>
          
          {renderNavigationItem(
            'Editar perfil',
            'edit',
            () => navigation.navigate('MobilityProfile')
          )}
          
          {renderNavigationItem(
            'Información del vehículo',
            'directions-car',
            () => {
              Alert.alert('Información', 'Contacta soporte para actualizar información del vehículo');
            }
          )}
          
          {renderNavigationItem(
            'Métodos de pago',
            'payment',
            () => {
              Alert.alert('Próximamente', 'Esta función estará disponible pronto');
            }
          )}
          
          {renderNavigationItem(
            'Documentos y verificación',
            'verified-user',
            () => {
              Alert.alert('Documentos', 'Contacta soporte para gestionar documentos');
            }
          )}
        </View>

        {/* Soporte */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Soporte</Text>
          
          {renderNavigationItem(
            'Centro de ayuda',
            'help',
            () => {
              Alert.alert('Ayuda', 'Contacta con soporte: soporte@dely.com');
            }
          )}
          
          {renderNavigationItem(
            'Reportar problema',
            'report-problem',
            () => {
              Alert.alert('Reportar', 'Envía tu reporte a: reportes@dely.com');
            }
          )}
          
          {renderNavigationItem(
            'Seguridad',
            'security',
            () => {
              Alert.alert('Seguridad', 'En caso de emergencia, contacta al 911');
            }
          )}
          
          {renderNavigationItem(
            'Términos y condiciones',
            'gavel',
            () => {
              Alert.alert('Términos', 'Los términos están disponibles en nuestra web');
            }
          )}
          
          {renderNavigationItem(
            'Política de privacidad',
            'privacy-tip',
            () => {
              Alert.alert('Privacidad', 'La política está disponible en nuestra web');
            }
          )}
        </View>

        {/* Aplicación */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Aplicación</Text>
          
          {renderNavigationItem(
            'Versión',
            'info',
            () => {},
            '1.0.0'
          )}
          
          {renderNavigationItem(
            'Limpiar caché',
            'delete-sweep',
            clearCache
          )}
          
          {renderNavigationItem(
            'Acerca de Dely',
            'info-outline',
            () => {
              Alert.alert(
                'Dely',
                'Plataforma de delivery y movilidad\nVersión 1.0.0\n\n© 2024 Dely. Todos los derechos reservados.'
              );
            }
          )}
        </View>

        {/* Cerrar sesión */}
        <View style={styles.section}>
          {renderNavigationItem(
            'Cerrar sesión',
            'exit-to-app',
            handleLogout,
            null,
            '#f44336'
          )}
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
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 20,
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  sliderSetting: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  sliderValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  sliderButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sliderButton: {
    backgroundColor: '#f0f8ff',
    borderWidth: 1,
    borderColor: '#2196F3',
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  navigationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  navigationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  navigationTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 12,
  },
  navigationRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navigationRightText: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  bottomSpacer: {
    height: 40,
  },
});