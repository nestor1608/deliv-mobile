import React from 'react';
import { View, Text, FlatList, StyleSheet, Image } from 'react-native';

const stores = [
  {
    id: '1',
    name: 'Supermercado Central',
    category: 'Supermercado',
    image: 'https://via.placeholder.com/150',
    rating: 4.5,
  },
  {
    id: '2',
    name: 'Farmacia Salud',
    category: 'Farmacia',
    image: 'https://via.placeholder.com/150',
    rating: 4.2,
  },
  {
    id: '3',
    name: 'Restaurante Sabores',
    category: 'Restaurante',
    image: 'https://via.placeholder.com/150',
    rating: 4.7,
  },
];

const StoresScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Comercios disponibles</Text>
      <FlatList
        data={stores}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.storeCard}>
            <Image source={{ uri: item.image }} style={styles.storeImage} />
            <View style={styles.storeInfo}>
              <Text style={styles.storeName}>{item.name}</Text>
              <Text style={styles.storeCategory}>{item.category}</Text>
              <Text style={styles.storeRating}>⭐ {item.rating}</Text>
            </View>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  storeCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  storeImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
  },
  storeInfo: {
    marginLeft: 15,
    justifyContent: 'center',
  },
  storeName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  storeCategory: {
    fontSize: 14,
    color: '#666',
    marginVertical: 5,
  },
  storeRating: {
    fontSize: 14,
    color: '#FF6B00',
  },
});

export default StoresScreen;