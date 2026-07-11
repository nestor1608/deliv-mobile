// src/components/StoreHeader.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface StoreHeaderProps {
  navigation: {
    navigate: (route: string) => void;
  };
  title?: string;
  showNotifications?: boolean;
}

const StoreHeader: React.FC<StoreHeaderProps> = ({
  navigation,
  title = '',
  showNotifications = true,
}) => {
  const [notificationCount] = useState<number>(3);

  const handleNotifications = () => {
    Alert.alert(
      'Nuevos Pedidos',
      `Tienes ${notificationCount} pedidos pendientes`,
      [
        { text: 'Ver Pedidos', onPress: () => navigation.navigate('Orders') },
        { text: 'Cerrar', style: 'cancel' },
      ]
    );
  };

  return (
    <View style={styles.header}>
      <TouchableOpacity
        onPress={() => navigation.navigate('StoreProfile')}
        style={styles.profileButton}
      >
        <Image
          source={{ uri: 'https://placeholder.com/avatar' }}
          style={styles.profileImage}
        />
      </TouchableOpacity>

      <Text style={styles.title}>{title}</Text>

      {showNotifications && (
        <TouchableOpacity
          onPress={handleNotifications}
          style={styles.notificationButton}
        >
          <Ionicons name="notifications" size={24} color="#8B0000" />
          {notificationCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{notificationCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    elevation: 2,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#8B0000',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 10,
  },
  notificationButton: {
    position: 'relative',
    padding: 5,
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default StoreHeader;
