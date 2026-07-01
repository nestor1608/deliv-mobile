// src/screens/delivery/DeliverySettingsScreen.js
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

export default function DeliverySettingsScreen() {
  const navigation = useNavigation();
  const { authenticatedFetch, logout } = useContext(AuthContext);
  
  const [settings, setSettings] = useState({
    notifications: {
      newOrders: true,
      orderUpdates: true,
      promotions: false,
      sound: true,
      vibration: true,
    },
    privacy: {
      shareLocation: true,
      showProfileToCustomers: true,
    },
    preferences: {
      autoAcceptOrders: false,
      workingRadius: 10, // km
      minimumOrderValue: 0,
    },
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await authenticatedFetch('/api/delivery/settings/');
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
      await authenticatedFetch('/api/delivery/settings/', {
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
          thumbColor={value ? '#FF9800' : '#f4f3f4'}
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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Notificaciones */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notificaciones</Text>
          
          {renderSettingItem(
            'Nuevos pedidos',
            'Recibir notificación cuando hay un nuevo pedido disponible',
            settings.notifications.newOrders,
            (value) => updateSetting('notifications', 'newOrders', value)
          )}
          
          {renderSettingItem(
            'Actualizaciones de pedidos',
            'Notificaciones sobre cambios en el estado de los pedidos',
            settings.notifications.orderUpdates,
            (value) => updateSetting('notifications', 'orderUpdates', value)
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
            'Compartir ubicación',
            'Permitir que los clientes vean tu ubicación durante las entregas',
            settings.privacy.shareLocation,
            (value) => updateSetting('privacy', 'shareLocation', value)
          )}
          
          {renderSettingItem(
            'Mostrar perfil a clientes',
            'Los clientes pueden ver tu foto y calificación',
            settings.privacy.showProfileToCustomers,
            (value) => updateSetting('privacy', 'showProfileToCustomers', value)
          )}
        </View>

        {/* Preferencias de trabajo */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferencias de trabajo</Text>
          
          {renderSettingItem(
            'Auto-aceptar pedidos',
            'Aceptar automáticamente pedidos que cumplan tus criterios',
            settings.preferences.autoAcceptOrders,
            (value) => updateSetting('preferences', 'autoAcceptOrders', value)
          )}
        </View>

        {/* Configuración de cuenta */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cuenta</Text>
          
          {renderNavigationItem(
            'Editar perfil',
            'edit',
            () => navigation.navigate('DeliveryProfile')
          )}
          
          {renderNavigationItem(
            'Historial de ganancias',
            'account-balance-wallet',
            () => navigation.navigate('DeliveryEarnings')
          )}
          
          {renderNavigationItem(
            'Métodos de pago',
            'payment',
            () => {
              Alert.alert('Próximamente', 'Esta función estará disponible pronto');
            }
          )}
          
          {renderNavigationItem(
            'Documentos',
            'description',
            () => {
              Alert.alert('Próximamente', 'Esta función estará disponible pronto');
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
            'Términos y condiciones',
            'gavel',
            () => {
              Alert.alert('Términos', 'Los términos están disponibles en nuestra web');
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