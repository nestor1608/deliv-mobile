// src/context/VendorContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import { AuthContext } from './AuthContext';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const VendorContext = createContext();

export const VendorProvider = ({ children }) => {
    const { authenticatedFetch, API_BASE_URL, userData } = useContext(AuthContext);
    const [vendorProfile, setVendorProfile] = useState(null);
    const [products, setProducts] = useState([]);
    const [orders, setOrders] = useState([]);
    const [isStoreOpen, setIsStoreOpen] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [salesStats, setSalesStats] = useState({
        todayOrders: 0,
        todayRevenue: 0,
        monthlyRevenue: 0,
        averageRating: 0,
    });

    useEffect(() => {
        if (userData?.role === 'vendor') {
            loadVendorData();
        }
    }, [userData]);

    const loadVendorData = async () => {
        try {
            await Promise.all([
                loadVendorProfile(),
                loadProducts(),
                loadOrders(),
                loadSalesStats(),
            ]);
        } catch (error) {
            console.error('Error loading vendor data:', error);
        }
    };

    const loadVendorProfile = async () => {
        try {
            const response = await authenticatedFetch(`${API_BASE_URL}/vendors/profile/`);
            const data = await response.json();
            
            if (response.ok) {
                setVendorProfile(data);
                setIsStoreOpen(data.is_open);
                await AsyncStorage.setItem('vendorProfile', JSON.stringify(data));
            }
        } catch (error) {
            console.error('Error loading vendor profile:', error);
        }
    };

    const updateVendorProfile = async (profileData) => {
        try {
            setIsLoading(true);
            const response = await authenticatedFetch(`${API_BASE_URL}/vendors/profile/`, {
                method: 'PATCH',
                body: JSON.stringify(profileData),
            });

            const data = await response.json();

            if (response.ok) {
                setVendorProfile(data);
                await AsyncStorage.setItem('vendorProfile', JSON.stringify(data));
                return { success: true, data };
            } else {
                throw new Error(data.detail || 'Error updating profile');
            }
        } catch (error) {
            console.error('Update profile error:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const toggleStoreStatus = async () => {
        try {
            const newStatus = !isStoreOpen;
            const response = await authenticatedFetch(`${API_BASE_URL}/vendors/toggle-status/`, {
                method: 'POST',
                body: JSON.stringify({ is_open: newStatus }),
            });

            if (response.ok) {
                setIsStoreOpen(newStatus);
                Alert.alert(
                    'Estado actualizado',
                    `Tu comercio está ahora ${newStatus ? 'abierto' : 'cerrado'}`
                );
            }
        } catch (error) {
            console.error('Error toggling store status:', error);
            Alert.alert('Error', 'No se pudo cambiar el estado del comercio');
        }
    };

    const loadProducts = async () => {
        try {
            const response = await authenticatedFetch(`${API_BASE_URL}/vendors/products/`);
            const data = await response.json();
            
            if (response.ok) {
                setProducts(data.results || data);
            }
        } catch (error) {
            console.error('Error loading products:', error);
        }
    };

    const createProduct = async (productData) => {
        try {
            setIsLoading(true);
            const formData = new FormData();
            
            Object.keys(productData).forEach(key => {
                if (key === 'image' && productData[key]) {
                    formData.append('image', {
                        uri: productData[key].uri,
                        type: productData[key].type || 'image/jpeg',
                        name: productData[key].name || 'product_image.jpg',
                    });
                } else {
                    formData.append(key, productData[key]);
                }
            });

            const response = await authenticatedFetch(`${API_BASE_URL}/vendors/products/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                body: formData,
            });

            const data = await response.json();

            if (response.ok) {
                setProducts(prev => [data, ...prev]);
                return { success: true, data };
            } else {
                throw new Error(data.detail || 'Error creating product');
            }
        } catch (error) {
            console.error('Create product error:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const updateProduct = async (productId, productData) => {
        try {
            setIsLoading(true);
            const formData = new FormData();
            
            Object.keys(productData).forEach(key => {
                if (key === 'image' && productData[key] && productData[key].uri) {
                    formData.append('image', {
                        uri: productData[key].uri,
                        type: productData[key].type || 'image/jpeg',
                        name: productData[key].name || 'product_image.jpg',
                    });
                } else if (key !== 'image') {
                    formData.append(key, productData[key]);
                }
            });

            const response = await authenticatedFetch(
                `${API_BASE_URL}/vendors/products/${productId}/`,
                {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                    body: formData,
                }
            );

            const data = await response.json();

            if (response.ok) {
                setProducts(prev => prev.map(p => p.id === productId ? data : p));
                return { success: true, data };
            } else {
                throw new Error(data.detail || 'Error updating product');
            }
        } catch (error) {
            console.error('Update product error:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const deleteProduct = async (productId) => {
        try {
            const response = await authenticatedFetch(
                `${API_BASE_URL}/vendors/products/${productId}/`,
                { method: 'DELETE' }
            );

            if (response.ok) {
                setProducts(prev => prev.filter(p => p.id !== productId));
                return { success: true };
            } else {
                throw new Error('Error deleting product');
            }
        } catch (error) {
            console.error('Delete product error:', error);
            throw error;
        }
    };

    const loadOrders = async (status = null) => {
        try {
            let url = `${API_BASE_URL}/vendors/orders/`;
            if (status) {
                url += `?status=${status}`;
            }
            
            const response = await authenticatedFetch(url);
            const data = await response.json();
            
            if (response.ok) {
                setOrders(data.results || data);
            }
        } catch (error) {
            console.error('Error loading orders:', error);
        }
    };

    const updateOrderStatus = async (orderId, status, notes = '') => {
        try {
            const response = await authenticatedFetch(
                `${API_BASE_URL}/vendors/orders/${orderId}/update-status/`,
                {
                    method: 'POST',
                    body: JSON.stringify({ status, notes }),
                }
            );

            const data = await response.json();

            if (response.ok) {
                setOrders(prev => prev.map(order => 
                    order.id === orderId ? { ...order, status, notes } : order
                ));
                return { success: true, data };
            } else {
                throw new Error(data.detail || 'Error updating order status');
            }
        } catch (error) {
            console.error('Update order status error:', error);
            throw error;
        }
    };

    const loadSalesStats = async (period = 'today') => {
        try {
            const response = await authenticatedFetch(
                `${API_BASE_URL}/vendors/stats/?period=${period}`
            );
            const data = await response.json();
            
            if (response.ok) {
                setSalesStats(data);
            }
        } catch (error) {
            console.error('Error loading sales stats:', error);
        }
    };

    const contextValue = {
        vendorProfile,
        products,
        orders,
        isStoreOpen,
        isLoading,
        salesStats,
        updateVendorProfile,
        toggleStoreStatus,
        loadProducts,
        createProduct,
        updateProduct,
        deleteProduct,
        loadOrders,
        updateOrderStatus,
        loadSalesStats,
        refreshData: loadVendorData,
    };

    return (
        <VendorContext.Provider value={contextValue}>
            {children}
        </VendorContext.Provider>
    );
};