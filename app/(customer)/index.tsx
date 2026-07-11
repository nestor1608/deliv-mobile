import React, { useState, useContext } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    TouchableOpacity,
    FlatList,
    Image,
    Alert,
    RefreshControl,
    SafeAreaView,
    StatusBar,
    Dimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import { AuthContext } from '../../src/context/AuthContext';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../src/services/apiClient';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { userData, userToken } = useContext(AuthContext);
    const [searchText, setSearchText] = useState('');
    const [refreshing, setRefreshing] = useState(false);
    const [notifications] = useState(3);

    // Query for active trip
    const { data: activeTrip = null } = useQuery<any[]>({
        queryKey: ['activeTrip'],
        queryFn: () =>
            apiClient.get<any[]>('mobility/trips/').then(data => {
                const tripsArray = Array.isArray(data) ? data : ((data as any)?.results || []);
                return tripsArray.find((t: any) => ['requested', 'accepted', 'driver_arrived', 'in_progress'].includes(t.status)) || null;
            }),
        enabled: !!userToken,
    });

    // Query for categories (real API)
    const { data: categories = [] } = useQuery({
        queryKey: ['categories'],
        queryFn: () => apiClient.get('categories/'),
    });

    // Query for featured stores (real API)
    const { data: featuredStores = [] } = useQuery({
        queryKey: ['stores', 'featured'],
        queryFn: () => apiClient.get('vendors/vendors/'),
    });

    // Query for offers (real API)
    const { data: offers = [] } = useQuery({
        queryKey: ['offers'],
        queryFn: () => apiClient.get('promotions/active/'),
    });

    // Query for popular products (mock data)
    const { data: popularProducts = [] } = useQuery({
        queryKey: ['popularProducts'],
        queryFn: () => {
            return Promise.resolve([
                {
                    id: 1,
                    name: 'Coca Cola 2L',
                    price: 3.50,
                    image: 'https://via.placeholder.com/120x120/E74C3C/FFFFFF?text=Coca+Cola',
                    store: 'Supermercado Central',
                    rating: 4.5,
                    originalPrice: 4.00
                },
                {
                    id: 2,
                    name: 'Hamburguesa Clásica',
                    price: 12.99,
                    image: 'https://via.placeholder.com/120x120/F39C12/FFFFFF?text=Hamburguesa',
                    store: 'Burger Palace',
                    rating: 4.8,
                    originalPrice: null
                },
                {
                    id: 3,
                    name: 'Paracetamol 500mg',
                    price: 5.50,
                    image: 'https://via.placeholder.com/120x120/3498DB/FFFFFF?text=Paracetamol',
                    store: 'Farmacia Salud',
                    rating: 4.2,
                    originalPrice: 6.00
                }
            ]);
        },
        staleTime: Infinity,
    });

    // Query for cart count (mock data)
    const { data: cartItemCount = 0 } = useQuery({
        queryKey: ['cartCount'],
        queryFn: () => Promise.resolve(2),
        staleTime: Infinity,
    });

    const loading = false;

    const handleSearch = () => {
        if (searchText.trim()) {
            router.push({ pathname: '/search-results', params: { query: searchText } });
        }
    };

    const handleCategoryPress = (category) => {
        router.push({ pathname: '/search-results', params: { category: category.name } });
    };

    const handleStorePress = (store) => {
        router.push({ pathname: '/store-products', params: { storeId: store.id, storeName: store.name } });
    };

    const handleProductPress = (product) => {
        router.push({ pathname: '/product-detail', params: { productId: product.id } });
    };

    const handleAddToCart = (product) => {
        Alert.alert(
            'Producto agregado',
            `${product.name} se agregó al carrito`,
            [
                { text: 'Continuar comprando', style: 'cancel' },
                { text: 'Ver carrito', onPress: () => router.push('/cart') }
            ]
        );
    };

    const onRefresh = () => {
        setRefreshing(true);
        setRefreshing(false);
    };

    const renderCategory = ({ item }) => (
        <TouchableOpacity
            style={styles.categoryItem}
            onPress={() => handleCategoryPress(item)}
        >
            <View style={[styles.categoryIcon, { backgroundColor: item.color }]}>
                <Icon name={item.icon} size={24} color="#FFF" />
            </View>
            <Text style={styles.categoryText}>{item.name}</Text>
        </TouchableOpacity>
    );

    const renderStore = ({ item }) => (
        <TouchableOpacity
            style={styles.storeCard}
            onPress={() => handleStorePress(item)}
        >
            <Image source={{ uri: item.image }} style={styles.storeImage} />
            <View style={styles.storeInfo}>
                <Text style={styles.storeName}>{item.name}</Text>
                <View style={styles.storeDetails}>
                    <View style={styles.ratingContainer}>
                        <Icon name="star" size={16} color="#FFD700" />
                        <Text style={styles.rating}>{item.rating}</Text>
                    </View>
                    <Text style={styles.deliveryTime}>{item.deliveryTime}</Text>
                </View>
                <Text style={styles.deliveryFee}>
                    Envío: ${item.deliveryFee.toFixed(2)}
                </Text>
            </View>
        </TouchableOpacity>
    );

    const renderOffer = ({ item }) => (
        <TouchableOpacity style={styles.offerCard}>
            <Image source={{ uri: item.image }} style={styles.offerImage} />
            <View style={styles.offerOverlay}>
                <Text style={styles.offerTitle}>{item.title}</Text>
                <Text style={styles.offerDescription}>{item.description}</Text>
                {item.code && (
                    <Text style={styles.offerCode}>Código: {item.code}</Text>
                )}
            </View>
        </TouchableOpacity>
    );

    const renderProduct = ({ item }) => (
        <TouchableOpacity
            style={styles.productCard}
            onPress={() => handleProductPress(item)}
        >
            <Image source={{ uri: item.image }} style={styles.productImage} />
            <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
                <Text style={styles.productStore}>{item.store}</Text>
                <View style={styles.productPricing}>
                    <Text style={styles.productPrice}>${item.price.toFixed(2)}</Text>
                    {item.originalPrice && (
                        <Text style={styles.originalPrice}>
                            ${item.originalPrice.toFixed(2)}
                        </Text>
                    )}
                </View>
                <TouchableOpacity
                    style={styles.addToCartButton}
                    onPress={() => handleAddToCart(item)}
                >
                    <Icon name="add-shopping-cart" size={20} color="#FFF" />
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <View style={styles.headerTop}>
                    <View style={styles.userInfo}>
                        <Icon name="location-on" size={20} color="#666" />
                        <Text style={styles.locationText}>
                            Entregar en: {(userData as any)?.address || 'Seleccionar ubicación'}
                        </Text>
                    </View>
                    <View style={styles.headerIcons}>
                        <TouchableOpacity
                            style={styles.iconButton}
                            onPress={() => router.push('/profile')}
                        >
                            <Icon name="person" size={24} color="#666" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.iconButton}
                            onPress={() => router.push('/notifications')}
                        >
                            <Icon name="notifications" size={24} color="#666" />
                            {notifications > 0 && (
                                <View style={styles.badge}>
                                    <Text style={styles.badgeText}>{notifications}</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.iconButton}
                            onPress={() => router.push('/cart')}
                        >
                            <Icon name="shopping-cart" size={24} color="#666" />
                            {cartItemCount > 0 && (
                                <View style={styles.badge}>
                                    <Text style={styles.badgeText}>{cartItemCount}</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
                {/* Search Bar */}
                <View style={styles.searchContainer}>
                    <Icon name="search" size={20} color="#666" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Buscar productos o tiendas..."
                        value={searchText}
                        onChangeText={setSearchText}
                        onSubmitEditing={handleSearch}
                        returnKeyType="search"
                    />
                    {searchText.length > 0 && (
                        <TouchableOpacity
                            onPress={() => setSearchText('')}
                            style={styles.clearButton}
                        >
                            <Icon name="close" size={20} color="#666" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>
            {/* Content */}
            <ScrollView
                style={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                showsVerticalScrollIndicator={false}
            >
                {/* Ofertas */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Ofertas especiales</Text>
                    <FlatList
                        data={offers}
                        renderItem={renderOffer}
                        keyExtractor={(item) => item.id.toString()}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.horizontalList}
                    />
                </View>
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Transporte rápido</Text>
                        <TouchableOpacity onPress={() => router.push('/ride-history')}>
                            <Text style={styles.viewHistoryButton}>Mis Viajes</Text>
                        </TouchableOpacity>
                    </View>

                    {activeTrip ? (
                        <TouchableOpacity
                            style={[styles.transportCard, { backgroundColor: '#E3F2FD', borderColor: '#2196F3', borderWidth: 1 }]}
                            onPress={() => router.push({ pathname: '/ride-tracking', params: { rideId: activeTrip.id } })}
                        >
                            <View style={styles.transportContent}>
                                <Icon name="directions-car" size={30} color="#2196F3" />
                                <View style={styles.transportTextContainer}>
                                    <Text style={[styles.transportTitle, { color: '#1976D2' }]}>Tienes un viaje activo</Text>
                                    <Text style={styles.transportSubtitle}>Estado: {activeTrip.status_display || activeTrip.status}</Text>
                                </View>
                                <Icon name="chevron-right" size={24} color="#2196F3" />
                            </View>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            style={styles.transportCard}
                            onPress={() => router.push('/ride-request')}
                        >
                            <View style={styles.transportContent}>
                                <Icon name="local-taxi" size={30} color="#FFA500" />
                                <View style={styles.transportTextContainer}>
                                    <Text style={styles.transportTitle}>Pedir un remis ahora</Text>
                                    <Text style={styles.transportSubtitle}>Llegada en ~5 min</Text>
                                </View>
                                <Icon name="chevron-right" size={24} color="#666" />
                            </View>
                        </TouchableOpacity>
                    )}
                </View>
                {/* Categorías */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Categorías</Text>
                    <FlatList
                        data={categories}
                        renderItem={renderCategory}
                        keyExtractor={(item) => item.id.toString()}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.horizontalList}
                    />
                </View>
                {/* Tiendas destacadas */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Tiendas destacadas</Text>
                    <FlatList
                        data={featuredStores}
                        renderItem={renderStore}
                        keyExtractor={(item) => item.id.toString()}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.horizontalList}
                    />
                </View>
                {/* Productos populares */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Productos populares</Text>
                    <FlatList
                        data={popularProducts}
                        renderItem={renderProduct}
                        keyExtractor={(item) => item.id.toString()}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.horizontalList}
                    />
                </View>
                {/* Espaciado inferior */}
                <View style={{ height: 20 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    header: {
        backgroundColor: '#FFF',
        paddingHorizontal: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5',
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    locationText: {
        marginLeft: 8,
        fontSize: 14,
        color: '#666',
        flex: 1,
    },
    headerIcons: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconButton: {
        marginLeft: 16,
        position: 'relative',
    },
    badge: {
        position: 'absolute',
        top: -8,
        right: -8,
        backgroundColor: '#FF6B6B',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    badgeText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: 'bold',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        borderRadius: 25,
        paddingHorizontal: 16,
        height: 50,
    },
    searchIcon: {
        marginRight: 12,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#333',
    },
    clearButton: {
        padding: 4,
    },
    content: {
        flex: 1,
    },
    section: {
        marginTop: 20,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginHorizontal: 16,
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    viewHistoryButton: {
        color: '#007BFF',
        fontSize: 14,
        fontWeight: '600',
    },
    horizontalList: {
        paddingHorizontal: 16,
    },
    categoryItem: {
        alignItems: 'center',
        marginRight: 20,
        width: 80,
    },
    categoryIcon: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    categoryText: {
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
    },
    storeCard: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        marginRight: 16,
        width: 200,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    storeImage: {
        width: '100%',
        height: 120,
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
    },
    storeInfo: {
        padding: 12,
    },
    storeName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    storeDetails: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 12,
    },
    rating: {
        marginLeft: 4,
        fontSize: 14,
        color: '#666',
    },
    deliveryTime: {
        fontSize: 14,
        color: '#666',
    },
    deliveryFee: {
        fontSize: 14,
        color: '#28A745',
        fontWeight: '500',
    },
    offerCard: {
        marginRight: 16,
        borderRadius: 12,
        overflow: 'hidden',
        width: 300,
        height: 150,
        position: 'relative',
    },
    offerImage: {
        width: '100%',
        height: '100%',
    },
    offerOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        padding: 12,
    },
    offerTitle: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    offerDescription: {
        color: '#FFF',
        fontSize: 12,
        marginBottom: 4,
    },
    offerCode: {
        color: '#FFD700',
        fontSize: 12,
        fontWeight: '500',
    },
    productCard: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        marginRight: 16,
        width: 160,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    productImage: {
        width: '100%',
        height: 120,
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
    },
    productInfo: {
        padding: 12,
        position: 'relative',
    },
    productName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    productStore: {
        fontSize: 12,
        color: '#666',
        marginBottom: 8,
    },
    productPricing: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    productPrice: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#28A745',
    },
    originalPrice: {
        fontSize: 12,
        color: '#999',
        textDecorationLine: 'line-through',
        marginLeft: 8,
    },
    addToCartButton: {
        position: 'absolute',
        bottom: 8,
        right: 8,
        backgroundColor: '#007BFF',
        borderRadius: 20,
        width: 36,
        height: 36,
        justifyContent: 'center',
        alignItems: 'center',
    },
    transportCard: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        marginHorizontal: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    transportContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    transportTextContainer: {
        flex: 1,
        marginLeft: 16,
    },
    transportTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    transportSubtitle: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
});
