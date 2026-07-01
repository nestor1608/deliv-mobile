import React, { useState, useEffect, useContext } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    FlatList,
    Image,
    TouchableOpacity,
    Alert,
    SafeAreaView,
    StatusBar,
    ActivityIndicator,
    RefreshControl,
    Linking,
    Modal,
    TextInput,
    Dimensions
} from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const StoreProductsScreen = ({ route, navigation }) => {
    const insets = useSafeAreaInsets();
    const { storeId, storeName } = route.params;
    const { userToken, userData } = useContext(AuthContext);
    
    const [store, setStore] = useState(null);
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [searchText, setSearchText] = useState('');
    const [showStoreInfo, setShowStoreInfo] = useState(false);
    const [cartItemCount, setCartItemCount] = useState(0);
    const [quantity, setQuantity] = useState({}); // {productId: quantity}

    useEffect(() => {
        loadStoreData();
        loadCartCount();
    }, [storeId]);

    useEffect(() => {
        filterProducts();
    }, [selectedCategory, searchText, products]);

    const loadStoreData = async () => {
        try {
            setLoading(true);
            await Promise.all([
                loadStoreInfo(),
                loadStoreProducts(),
                loadStoreCategories()
            ]);
        } catch (error) {
            console.error('Error loading store data:', error);
            Alert.alert('Error', 'No se pudo cargar la información del comercio');
        } finally {
            setLoading(false);
        }
    };

    const loadStoreInfo = async () => {
        // Datos simulados - reemplaza con tu API
        const mockStore = {
            id: storeId,
            name: storeName || 'Burger Palace',
            description: 'Las mejores hamburguesas artesanales de la ciudad. Ingredientes frescos y de calidad premium.',
            image: 'https://via.placeholder.com/400x200/FF6B6B/FFFFFF?text=Burger+Palace',
            logo: 'https://via.placeholder.com/80x80/FF6B6B/FFFFFF?text=BP',
            rating: 4.8,
            reviewCount: 1247,
            deliveryTime: '15-25 min',
            deliveryFee: 1.50,
            minOrder: 10.00,
            isOpen: true,
            openingHours: {
                monday: '10:00 - 22:00',
                tuesday: '10:00 - 22:00',
                wednesday: '10:00 - 22:00',
                thursday: '10:00 - 22:00',
                friday: '10:00 - 23:00',
                saturday: '10:00 - 23:00',
                sunday: '11:00 - 21:00'
            },
            address: 'Av. Principal 123, Centro',
            phone: '+1234567890',
            categories: ['Hamburguesas', 'Pizzas', 'Bebidas', 'Postres'],
            paymentMethods: ['Efectivo', 'Tarjeta', 'Transferencia'],
            features: ['Wifi', 'Estacionamiento', 'Delivery', 'Takeout']
        };
        setStore(mockStore);
    };

    const loadStoreProducts = async () => {
        // Datos simulados - reemplaza con tu API
        const mockProducts = [
            {
                id: 1,
                name: 'Hamburguesa Clásica',
                description: 'Carne, lechuga, tomate, cebolla, queso',
                price: 12.99,
                originalPrice: 15.99,
                image: 'https://via.placeholder.com/150x120/F39C12/FFFFFF?text=Hamburguesa+Clasica',
                category: 'Hamburguesas',
                rating: 4.7,
                preparationTime: '10-15 min',
                isPopular: true,
                inStock: true,
                discount: 19
            },
            {
                id: 2,
                name: 'Pizza Margherita',
                description: 'Tomate, mozzarella, albahaca fresca',
                price: 16.99,
                image: 'https://via.placeholder.com/150x120/E74C3C/FFFFFF?text=Pizza+Margherita',
                category: 'Pizzas',
                rating: 4.6,
                preparationTime: '15-20 min',
                isPopular: false,
                inStock: true
            },
            {
                id: 3,
                name: 'Coca Cola 500ml',
                description: 'Bebida refrescante',
                price: 2.50,
                image: 'https://via.placeholder.com/150x120/3498DB/FFFFFF?text=Coca+Cola',
                category: 'Bebidas',
                rating: 4.5,
                preparationTime: '1 min',
                isPopular: true,
                inStock: true
            },
            {
                id: 4,
                name: 'Brownie con Helado',
                description: 'Brownie casero con helado de vainilla',
                price: 6.99,
                image: 'https://via.placeholder.com/150x120/8E44AD/FFFFFF?text=Brownie',
                category: 'Postres',
                rating: 4.8,
                preparationTime: '5 min',
                isPopular: false,
                inStock: false
            },
            {
                id: 5,
                name: 'Hamburguesa BBQ',
                description: 'Carne, salsa BBQ, cebolla caramelizada',
                price: 14.99,
                image: 'https://via.placeholder.com/150x120/D35400/FFFFFF?text=BBQ+Burger',
                category: 'Hamburguesas',
                rating: 4.9,
                preparationTime: '12-18 min',
                isPopular: true,
                inStock: true
            }
        ];
        setProducts(mockProducts);
        setFilteredProducts(mockProducts);
    };

    const loadStoreCategories = async () => {
        const mockCategories = [
            { id: 'all', name: 'Todos', count: 5 },
            { id: 'hamburguesas', name: 'Hamburguesas', count: 2 },
            { id: 'pizzas', name: 'Pizzas', count: 1 },
            { id: 'bebidas', name: 'Bebidas', count: 1 },
            { id: 'postres', name: 'Postres', count: 1 }
        ];
        setCategories(mockCategories);
    };

    const loadCartCount = async () => {
        // Simulado - reemplaza con tu lógica de carrito
        setCartItemCount(2);
    };

    const filterProducts = () => {
        let filtered = [...products];
        
        // Filtrar por categoría
        if (selectedCategory !== 'all') {
            filtered = filtered.filter(product => 
                product.category.toLowerCase() === selectedCategory.toLowerCase()
            );
        }
        
        // Filtrar por búsqueda
        if (searchText) {
            filtered = filtered.filter(product =>
                product.name.toLowerCase().includes(searchText.toLowerCase()) ||
                product.description.toLowerCase().includes(searchText.toLowerCase())
            );
        }
        
        setFilteredProducts(filtered);
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadStoreData().finally(() => setRefreshing(false));
    };

    const handleAddToCart = (product) => {
        const currentQty = quantity[product.id] || 0;
        const newQty = currentQty + 1;
        
        setQuantity(prev => ({
            ...prev,
            [product.id]: newQty
        }));
        
        setCartItemCount(prev => prev + 1);
        
        Alert.alert(
            'Producto agregado',
            `${product.name} se agregó al carrito (${newQty})`,
            [
                { text: 'Continuar comprando', style: 'cancel' },
                { text: 'Ver carrito', onPress: () => navigation.navigate('Cart') }
            ]
        );
    };

    const handleRemoveFromCart = (product) => {
        const currentQty = quantity[product.id] || 0;
        if (currentQty > 0) {
            const newQty = currentQty - 1;
            
            setQuantity(prev => ({
                ...prev,
                [product.id]: newQty
            }));
            
            setCartItemCount(prev => prev - 1);
        }
    };

    const handleCallStore = () => {
        if (store?.phone) {
            Linking.openURL(`tel:${store.phone}`);
        }
    };

    const handleViewOnMap = () => {
        // Aquí implementarías la navegación al mapa con la ubicación del comercio
        Alert.alert('Mapa', 'Mostrar ubicación del comercio en el mapa');
    };

    const renderProduct = ({ item }) => (
        <View style={styles.productCard}>
            <Image source={{ uri: item.image }} style={styles.productImage} />
            <View style={styles.productInfo}>
                <Text style={styles.productName}>{item.name}</Text>
                <Text style={styles.productDescription} numberOfLines={2}>
                    {item.description}
                </Text>
                
                <View style={styles.productDetails}>
                    <View style={styles.ratingContainer}>
                        <Icon name="star" size={16} color="#FFD700" />
                        <Text style={styles.rating}>{item.rating}</Text>
                    </View>
                    <Text style={styles.preparationTime}>
                        {item.preparationTime}
                    </Text>
                </View>
                
                <View style={styles.priceContainer}>
                    <Text style={styles.productPrice}>${item.price.toFixed(2)}</Text>
                    {item.originalPrice && (
                        <Text style={styles.originalPrice}>
                            ${item.originalPrice.toFixed(2)}
                        </Text>
                    )}
                    {item.discount && (
                        <Text style={styles.discountTag}>{item.discount}% OFF</Text>
                    )}
                </View>
                
                {!item.inStock ? (
                    <Text style={styles.outOfStock}>AGOTADO</Text>
                ) : (
                    <View style={styles.quantityControls}>
                        <TouchableOpacity 
                            style={styles.quantityButton}
                            onPress={() => handleRemoveFromCart(item)}
                            disabled={!quantity[item.id]}
                        >
                            <Icon name="remove" size={20} color="#FFF" />
                        </TouchableOpacity>
                        
                        <Text style={styles.quantityText}>
                            {quantity[item.id] || 0}
                        </Text>
                        
                        <TouchableOpacity 
                            style={styles.quantityButton}
                            onPress={() => handleAddToCart(item)}
                        >
                            <Icon name="add" size={20} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </View>
    );

    const renderCategory = ({ item }) => (
        <TouchableOpacity
            style={[
                styles.categoryItem,
                selectedCategory === item.id && styles.selectedCategoryItem
            ]}
            onPress={() => setSelectedCategory(item.id)}
        >
            <Text style={[
                styles.categoryText,
                selectedCategory === item.id && styles.selectedCategoryText
            ]}>
                {item.name}
            </Text>
            <Text style={styles.categoryCount}>{item.count}</Text>
        </TouchableOpacity>
    );

    if (loading && !refreshing) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007BFF" />
                <Text style={styles.loadingText}>Cargando productos...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
            
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <View style={styles.headerTop}>
                    <TouchableOpacity 
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Icon name="arrow-back" size={24} color="#666" />
                    </TouchableOpacity>
                    
                    <Text style={styles.storeTitle} numberOfLines={1}>
                        {store?.name || 'Comercio'}
                    </Text>
                    
                    <View style={styles.headerIcons}>
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
                        placeholder="Buscar productos..."
                        value={searchText}
                        onChangeText={setSearchText}
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

            {/* Store Info Banner */}
            <TouchableOpacity 
                style={styles.storeBanner}
                onPress={() => setShowStoreInfo(true)}
            >
                <Image 
                    source={{ uri: store?.image }} 
                    style={styles.storeBannerImage} 
                />
                <View style={styles.storeBannerOverlay}>
                    <View style={styles.storeBasicInfo}>
                        <Image 
                            source={{ uri: store?.logo }} 
                            style={styles.storeLogo} 
                        />
                        <View style={styles.storeTextInfo}>
                            <Text style={styles.storeBannerName}>{store?.name}</Text>
                            <View style={styles.storeBannerDetails}>
                                <Icon name="star" size={16} color="#FFD700" />
                                <Text style={styles.storeBannerRating}>
                                    {store?.rating?.toFixed(1)} ({store?.reviewCount})
                                </Text>
                                <Text style={styles.storeBannerDelivery}>
                                    {store?.deliveryTime} • ${store?.deliveryFee?.toFixed(2)} envío
                                </Text>
                            </View>
                        </View>
                    </View>
                    <Icon name="info" size={24} color="#FFF" style={styles.infoIcon} />
                </View>
            </TouchableOpacity>

            {/* Categories */}
            <View style={styles.categoriesContainer}>
                <FlatList
                    data={categories}
                    renderItem={renderCategory}
                    keyExtractor={(item) => item.id}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.categoriesList}
                />
            </View>

            {/* Products */}
            <FlatList
                data={filteredProducts}
                renderItem={renderProduct}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.productsList}
                refreshControl={
                    <RefreshControl 
                        refreshing={refreshing} 
                        onRefresh={onRefresh} 
                    />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Icon name="search-off" size={50} color="#CCC" />
                        <Text style={styles.emptyText}>No se encontraron productos</Text>
                    </View>
                }
            />

            {/* Store Info Modal */}
            <Modal
                visible={showStoreInfo}
                animationType="slide"
                transparent={false}
                onRequestClose={() => setShowStoreInfo(false)}
            >
                <SafeAreaView style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity 
                            style={styles.modalCloseButton}
                            onPress={() => setShowStoreInfo(false)}
                        >
                            <Icon name="close" size={24} color="#666" />
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>Información del Comercio</Text>
                    </View>
                    
                    <ScrollView style={styles.modalContent}>
                        <Image 
                            source={{ uri: store?.image }} 
                            style={styles.modalStoreImage} 
                        />
                        
                        <View style={styles.modalStoreInfo}>
                            <Image 
                                source={{ uri: store?.logo }} 
                                style={styles.modalStoreLogo} 
                            />
                            <Text style={styles.modalStoreName}>{store?.name}</Text>
                            <View style={styles.modalRatingContainer}>
                                <Icon name="star" size={20} color="#FFD700" />
                                <Text style={styles.modalRating}>
                                    {store?.rating?.toFixed(1)} ({store?.reviewCount} reseñas)
                                </Text>
                            </View>
                            
                            <Text style={styles.modalStoreDescription}>
                                {store?.description}
                            </Text>
                            
                            <View style={styles.modalSection}>
                                <Text style={styles.modalSectionTitle}>Horario</Text>
                                {store?.openingHours && Object.entries(store.openingHours).map(([day, hours]) => (
                                    <View key={day} style={styles.scheduleItem}>
                                        <Text style={styles.scheduleDay}>{day.charAt(0).toUpperCase() + day.slice(1)}</Text>
                                        <Text style={styles.scheduleHours}>{hours}</Text>
                                    </View>
                                ))}
                            </View>
                            
                            <View style={styles.modalSection}>
                                <Text style={styles.modalSectionTitle}>Información de contacto</Text>
                                <TouchableOpacity 
                                    style={styles.contactItem}
                                    onPress={handleCallStore}
                                >
                                    <Icon name="phone" size={20} color="#007BFF" />
                                    <Text style={styles.contactText}>{store?.phone}</Text>
                                </TouchableOpacity>
                                
                                <TouchableOpacity 
                                    style={styles.contactItem}
                                    onPress={handleViewOnMap}
                                >
                                    <Icon name="location-on" size={20} color="#007BFF" />
                                    <Text style={styles.contactText}>{store?.address}</Text>
                                </TouchableOpacity>
                            </View>
                            
                            <View style={styles.modalSection}>
                                <Text style={styles.modalSectionTitle}>Métodos de pago</Text>
                                <View style={styles.paymentMethods}>
                                    {store?.paymentMethods?.map((method, index) => (
                                        <View key={index} style={styles.paymentMethod}>
                                            <Text style={styles.paymentMethodText}>{method}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                            
                            <View style={styles.modalSection}>
                                <Text style={styles.modalSectionTitle}>Servicios</Text>
                                <View style={styles.featuresContainer}>
                                    {store?.features?.map((feature, index) => (
                                        <View key={index} style={styles.featureItem}>
                                            <Icon name="check-circle" size={16} color="#28A745" />
                                            <Text style={styles.featureText}>{feature}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        </View>
                    </ScrollView>
                </SafeAreaView>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
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
        backgroundColor: '#FFF',
        paddingHorizontal: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5',
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    backButton: {
        padding: 4,
    },
    storeTitle: {
        flex: 1,
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginHorizontal: 12,
        textAlign: 'center',
    },
    headerIcons: {
        flexDirection: 'row',
    },
    iconButton: {
        marginLeft: 12,
        position: 'relative',
    },
    badge: {
        position: 'absolute',
        top: -6,
        right: -6,
        backgroundColor: '#FF6B6B',
        borderRadius: 10,
        minWidth: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    badgeText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: 'bold',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        borderRadius: 25,
        paddingHorizontal: 16,
        height: 40,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        color: '#333',
    },
    clearButton: {
        padding: 4,
    },
    storeBanner: {
        height: 120,
        position: 'relative',
    },
    storeBannerImage: {
        width: '100%',
        height: '100%',
    },
    storeBannerOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.4)',
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    storeBasicInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    storeLogo: {
        width: 50,
        height: 50,
        borderRadius: 25,
        borderWidth: 2,
        borderColor: '#FFF',
    },
    storeTextInfo: {
        marginLeft: 12,
    },
    storeBannerName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFF',
    },
    storeBannerDetails: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    storeBannerRating: {
        fontSize: 12,
        color: '#FFF',
        marginLeft: 4,
        marginRight: 12,
    },
    storeBannerDelivery: {
        fontSize: 12,
        color: '#FFF',
    },
    infoIcon: {
        marginBottom: 8,
    },
    categoriesContainer: {
        backgroundColor: '#FFF',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5',
    },
    categoriesList: {
        paddingHorizontal: 16,
    },
    categoryItem: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginRight: 8,
        borderRadius: 20,
        backgroundColor: '#F5F5F5',
        alignItems: 'center',
    },
    selectedCategoryItem: {
        backgroundColor: '#007BFF',
    },
    categoryText: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    selectedCategoryText: {
        color: '#FFF',
    },
    categoryCount: {
        fontSize: 10,
        color: '#999',
        marginTop: 2,
    },
    productsList: {
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    productCard: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        marginBottom: 16,
        flexDirection: 'row',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    productImage: {
        width: 120,
        height: 120,
        borderTopLeftRadius: 12,
        borderBottomLeftRadius: 12,
    },
    productInfo: {
        flex: 1,
        padding: 12,
        justifyContent: 'space-between',
    },
    productName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    productDescription: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
    },
    productDetails: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 12,
    },
    rating: {
        fontSize: 12,
        color: '#666',
        marginLeft: 4,
    },
    preparationTime: {
        fontSize: 12,
        color: '#666',
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
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
    discountTag: {
        fontSize: 12,
        color: '#FFF',
        backgroundColor: '#FF6B6B',
        borderRadius: 4,
        paddingHorizontal: 4,
        marginLeft: 8,
    },
    outOfStock: {
        fontSize: 12,
        color: '#FF6B6B',
        fontWeight: 'bold',
        marginTop: 8,
    },
    quantityControls: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        marginTop: 8,
    },
    quantityButton: {
        backgroundColor: '#007BFF',
        borderRadius: 20,
        width: 30,
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    quantityText: {
        marginHorizontal: 12,
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 50,
    },
    emptyText: {
        fontSize: 16,
        color: '#666',
        marginTop: 16,
    },
    modalContainer: {
        flex: 1,
        backgroundColor: '#FFF',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5',
    },
    modalCloseButton: {
        padding: 4,
    },
    modalTitle: {
        flex: 1,
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginLeft: 16,
    },
    modalContent: {
        flex: 1,
    },
    modalStoreImage: {
        width: '100%',
        height: 200,
    },
    modalStoreInfo: {
        padding: 16,
    },
    modalStoreLogo: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 2,
        borderColor: '#FFF',
        marginTop: -40,
        alignSelf: 'center',
    },
    modalStoreName: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
        marginTop: 8,
    },
    modalRatingContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 8,
    },
    modalRating: {
        fontSize: 16,
        color: '#666',
        marginLeft: 4,
    },
    modalStoreDescription: {
        fontSize: 14,
        color: '#666',
        marginTop: 16,
        lineHeight: 20,
        textAlign: 'center',
    },
    modalSection: {
        marginTop: 24,
    },
    modalSectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 12,
    },
    scheduleItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#F5F5F5',
    },
    scheduleDay: {
        fontSize: 14,
        color: '#333',
    },
    scheduleHours: {
        fontSize: 14,
        color: '#666',
    },
    contactItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F5F5F5',
    },
    contactText: {
        fontSize: 14,
        color: '#333',
        marginLeft: 12,
    },
    paymentMethods: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    paymentMethod: {
        backgroundColor: '#F5F5F5',
        borderRadius: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        marginRight: 8,
        marginBottom: 8,
    },
    paymentMethodText: {
        fontSize: 12,
        color: '#333',
    },
    featuresContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 16,
        marginBottom: 8,
    },
    featureText: {
        fontSize: 14,
        color: '#333',
        marginLeft: 4,
    },
});

export default StoreProductsScreen;