import React from 'react';
import { View, FlatList, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

const SearchResultsScreen = () => {
    const router = useRouter();
    const { query: searchQuery, category } = useLocalSearchParams();

    // Datos de ejemplo basados en la búsqueda
    const results = {
        products: [
            {
                id: '1',
                name: 'Empanada de Carne',
                price: 50,
                store: 'La Esquina de las Empanadas',
                image: 'https://via.placeholder.com/150?text=Empanada+Carne',
            },
            {
                id: '2',
                name: 'Empanada Árabe',
                price: 60,
                store: 'Sabores del Medio Oriente',
                image: 'https://via.placeholder.com/150?text=Empanada+Arabe',
            },
        ],
        stores: [
            {
                id: '1',
                name: 'La Esquina de las Empanadas',
                category: 'Comida Rápida',
                rating: 4.7,
                image: 'https://via.placeholder.com/150?text=Empanaderia',
            },
        ],
    };

    const displayQuery = searchQuery || category || '';

    const renderProduct = ({ item }) => (
        <TouchableOpacity
            style={styles.productCard}
            onPress={() => router.push({ pathname: '/product-detail', params: { productId: item.id } })}
        >
            <Image source={{ uri: item.image }} style={styles.productImage} />
            <View style={styles.productInfo}>
                <Text style={styles.productName}>{item.name}</Text>
                <Text style={styles.productStore}>{item.store}</Text>
                <Text style={styles.productPrice}>${item.price}</Text>
            </View>
        </TouchableOpacity>
    );

    const renderStore = ({ item }) => (
        <TouchableOpacity
            style={styles.storeCard}
            onPress={() => router.push({ pathname: '/store-products', params: { storeId: item.id, storeName: item.name } })}
        >
            <Image source={{ uri: item.image }} style={styles.storeImage} />
            <View style={styles.storeInfo}>
                <Text style={styles.storeName}>{item.name}</Text>
                <Text style={styles.storeCategory}>{item.category}</Text>
                <Text style={styles.storeRating}>⭐ {item.rating}</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <Text style={styles.searchTitle}>Resultados para "{displayQuery}"</Text>

            {results.products.length > 0 && (
                <>
                    <Text style={styles.sectionTitle}>Productos</Text>
                    <FlatList
                        data={results.products}
                        renderItem={renderProduct}
                        keyExtractor={item => `product-${item.id}-${item.store}`}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.listContent}
                    />
                </>
            )}

            {results.stores.length > 0 && (
                <>
                    <Text style={styles.sectionTitle}>Comercios</Text>
                    <FlatList
                        data={results.stores}
                        renderItem={renderStore}
                        keyExtractor={item => `store-${item.id}`}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.listContent}
                    />
                </>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 15,
        backgroundColor: '#f5f5f5',
    },
    searchTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    listContent: {
        paddingBottom: 15,
    },
    productCard: {
        width: 200,
        backgroundColor: '#fff',
        borderRadius: 10,
        marginRight: 15,
        overflow: 'hidden',
    },
    productImage: {
        width: '100%',
        height: 120,
    },
    productInfo: {
        padding: 10,
    },
    productName: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    productStore: {
        fontSize: 14,
        color: '#666',
        marginVertical: 5,
    },
    productPrice: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FF6B00',
    },
    storeCard: {
        width: 250,
        backgroundColor: '#fff',
        borderRadius: 10,
        marginRight: 15,
        padding: 15,
        flexDirection: 'row',
        alignItems: 'center',
    },
    storeImage: {
        width: 60,
        height: 60,
        borderRadius: 10,
    },
    storeInfo: {
        marginLeft: 15,
        flex: 1,
    },
    storeName: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    storeCategory: {
        fontSize: 14,
        color: '#666',
        marginVertical: 3,
    },
    storeRating: {
        fontSize: 14,
        color: '#FF6B00',
    },
});

export default SearchResultsScreen;
