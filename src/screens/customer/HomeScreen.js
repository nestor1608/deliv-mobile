import React, { useState, useEffect, useContext } from 'react';
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
import { AuthContext } from '../../context/AuthContext';
import { API_BASE_URL } from '../../services/authApi';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const { userData, userToken } = useContext(AuthContext);
    const [searchText, setSearchText] = useState('');
    const [refreshing, setRefreshing] = useState(false);
    const [cartItemCount, setCartItemCount] = useState(0);
    const [notifications, setNotifications] = useState(3);

    // Estados para los datos
    const [categories, setCategories] = useState([]);
    const [featuredStores, setFeaturedStores] = useState([]);
    const [offers, setOffers] = useState([]);
    const [popularProducts, setPopularProducts] = useState([]);
    const [activeTrip, setActiveTrip] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        try {
            setLoading(true);
            // Aquí harías las llamadas a tu API de Django
            await Promise.all([
                loadActiveTrip(),
                loadCategories(),
                loadFeaturedStores(),
                loadOffers(),
                loadPopularProducts(),
                loadCartCount()
            ]);
        } catch (error) {
            console.error('Error loading initial data:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadActiveTrip = async () => {
        try {
            if (!userToken) return;
            const response = await fetch(`${API_BASE_URL}/mobility/trips/`, {
                headers: {
                    'Authorization': `Bearer ${userToken}`
                }
            });
            const data = await response.json();
            if (response.ok) {
                const tripsArray = Array.isArray(data) ? data : (data.results || []);
                const current = tripsArray.find(t => ['requested', 'accepted', 'driver_arrived', 'in_progress'].includes(t.status));
                setActiveTrip(current || null);
            }
        } catch (error) {
            console.error('Error loading active trip:', error);
        }
    };

    const loadCategories = async () => {
        // Datos simulados - reemplaza con tu API
        const mockCategories = [
            { id: 1, name: 'Restaurantes', icon: 'restaurant', color: '#FF6B6B' },
            { id: 2, name: 'Supermercados', icon: 'local-grocery-store', color: '#4ECDC4' },
            { id: 3, name: 'Farmacias', icon: 'local-pharmacy', color: '#45B7D1' },
            { id: 4, name: 'Licores', icon: 'local-bar', color: '#96CEB4' },
            { id: 5, name: 'Mascotas', icon: 'pets', color: '#FFEAA7' },
            { id: 6, name: 'Tecnología', icon: 'phone-android', color: '#DDA0DD' },
            { id: 7, name: 'Transporte', icon: 'local-taxi', color: '#FFA500' },
        ];
        setCategories(mockCategories);
    };

    const loadFeaturedStores = async () => {
        // Datos simulados - reemplaza con tu API
        const mockStores = [
            {
                id: 1,
                name: 'Supermercado Central',
                image: 'https://via.placeholder.com/150x100/4ECDC4/FFFFFF?text=Super+Central',
                rating: 4.5,
                deliveryTime: '20-30 min',
                deliveryFee: 2.50,
                category: 'Supermercados'
            },
            {
                id: 2,
                name: 'Burger Palace',
                image: 'https://via.placeholder.com/150x100/FF6B6B/FFFFFF?text=Burger+Palace',
                rating: 4.8,
                deliveryTime: '15-25 min',
                deliveryFee: 1.50,
                category: 'Restaurantes'
            },
            {
                id: 3,
                name: 'Farmacia Salud',
                image: 'https://via.placeholder.com/150x100/45B7D1/FFFFFF?text=Farmacia+Salud',
                rating: 4.3,
                deliveryTime: '10-20 min',
                deliveryFee: 1.00,
                category: 'Farmacias'
            }
        ];
        setFeaturedStores(mockStores);
    };

    const loadOffers = async () => {
        // Datos simulados - reemplaza con tu API
        const mockOffers = [
            {
                id: 1,
                title: '50% OFF en tu primera compra',
                description: 'Válido hasta fin de mes',
                image: 'https://via.placeholder.com/300x150/FF6B6B/FFFFFF?text=50%25+OFF',
                discount: 50,
                code: 'PRIMERA50'
            },
            {
                id: 2,
                title: 'Envío gratis en pedidos +$25',
                description: 'Solo por hoy',
                image: 'https://via.placeholder.com/300x150/4ECDC4/FFFFFF?text=Envio+Gratis',
                discount: 0,
                code: 'ENVIOGRATIS'
            }
        ];
        setOffers(mockOffers);
    };

    const loadPopularProducts = async () => {
        // Datos simulados - reemplaza con tu API
        const mockProducts = [
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
        ];
        setPopularProducts(mockProducts);
    };

    const loadCartCount = async () => {
        // Simulado - reemplaza con tu lógica de carrito
        setCartItemCount(2);
    };

    const handleSearch = () => {
        if (searchText.trim()) {
            navigation.navigate('SearchResults', { query: searchText });
        }
    };

    const handleCategoryPress = (category) => {
        navigation.navigate('SearchResults', { category: category.name });
    };

    const handleStorePress = (store) => {
        navigation.navigate('StoreProducts', { storeId: store.id, storeName: store.name });
    };

    const handleProductPress = (product) => {
        navigation.navigate('ProductDetail', { productId: product.id });
    };

    const handleAddToCart = (product) => {
        // Lógica para agregar al carrito
        Alert.alert(
            'Producto agregado',
            `${product.name} se agregó al carrito`,
            [
                { text: 'Continuar comprando', style: 'cancel' },
                { text: 'Ver carrito', onPress: () => navigation.navigate('Cart') }
            ]
        );
        setCartItemCount(prev => prev + 1);
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadInitialData().finally(() => setRefreshing(false));
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
                            Entregar en: {userData?.address || 'Seleccionar ubicación'}
                        </Text>
                    </View>
                    <View style={styles.headerIcons}>
                        <TouchableOpacity
                            style={styles.iconButton}
                            onPress={() => navigation.navigate('Profile')}
                        >
                            <Icon name="person" size={24} color="#666" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.iconButton}
                            onPress={() => navigation.navigate('Notifications')}
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
                            onPress={() => navigation.navigate('Cart')}
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
                        <TouchableOpacity onPress={() => navigation.navigate('RideHistory')}>
                            <Text style={styles.viewHistoryButton}>Mis Viajes</Text>
                        </TouchableOpacity>
                    </View>
                    
                    {activeTrip ? (
                        <TouchableOpacity
                            style={[styles.transportCard, { backgroundColor: '#E3F2FD', borderColor: '#2196F3', borderWidth: 1 }]}
                            onPress={() => navigation.navigate('RideTracking', { rideId: activeTrip.id })}
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
                            onPress={() => navigation.navigate('RideRequest')}
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
};

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
    // Estilos para categorías
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
    // Estilos para tiendas
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
    // Estilos para ofertas
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
    // Estilos para productos
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
    // Estilos para transporte
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

export default HomeScreen;