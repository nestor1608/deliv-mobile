// src/context/VendorContext.tsx
import React, { createContext, useContext, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AuthContext } from './AuthContext';
import { Alert } from 'react-native';
import apiClient from '../services/apiClient';
import type { VendorProfile, StoreProduct, Order, SalesStats, ProductFormData, OrderStatusUpdate } from '../types';

interface VendorContextType {
  vendorProfile: VendorProfile | undefined;
  products: StoreProduct[];
  orders: Order[];
  isStoreOpen: boolean;
  isLoading: boolean;
  salesStats: SalesStats;
  updateVendorProfile: (profileData: Partial<VendorProfile>) => Promise<VendorProfile>;
  toggleStoreStatus: () => void;
  createProduct: (productData: ProductFormData) => Promise<any>;
  updateProduct: (productId: number, productData: Partial<ProductFormData>) => Promise<any>;
  deleteProduct: (productId: number) => Promise<any>;
  updateOrderStatus: (orderId: number, status: string, notes?: string) => Promise<any>;
  loadProducts: () => Promise<void>;
  loadOrders: (status?: string | null) => Promise<any>;
  loadSalesStats: (period?: string) => Promise<SalesStats>;
  refreshData: () => Promise<void>;
}

export const VendorContext = createContext<VendorContextType | undefined>(undefined);

export const VendorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { userData } = useContext(AuthContext);
  const queryClient = useQueryClient();

  const isVendor = userData?.role === 'vendor';

  // Vendor profile query
  const profileQuery = useQuery({
    queryKey: ['vendor', 'profile'],
    queryFn: () => apiClient.get<VendorProfile>('vendors/profile/'),
    enabled: isVendor,
    staleTime: 5 * 60 * 1000,
  });

  // Products query
  const productsQuery = useQuery({
    queryKey: ['vendor', 'products'],
    queryFn: () => apiClient.get<{ results?: StoreProduct[]; } | StoreProduct[]>('vendors/products/'),
    enabled: isVendor,
    staleTime: 2 * 60 * 1000,
  });

  // Orders query
  const ordersQuery = useQuery({
    queryKey: ['vendor', 'orders'],
    queryFn: () => apiClient.get<{ results?: Order[]; } | Order[]>('vendors/orders/'),
    enabled: isVendor,
    staleTime: 1 * 60 * 1000,
  });

  // Sales stats query
  const statsQuery = useQuery({
    queryKey: ['vendor', 'stats'],
    queryFn: () => apiClient.get<SalesStats>('vendors/stats/?period=today'),
    enabled: isVendor,
    staleTime: 5 * 60 * 1000,
  });

  // Mutations
  const updateProfileMutation = useMutation({
    mutationFn: (profileData: Partial<VendorProfile>) => apiClient.patch<VendorProfile>('vendors/profile/', profileData),
    onSuccess: (data) => {
      queryClient.setQueryData(['vendor', 'profile'], data);
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: () => apiClient.post('vendors/toggle-status/', {
      is_open: !profileQuery.data?.is_open,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor', 'profile'] });
      const newStatus = !profileQuery.data?.is_open;
      Alert.alert(
        'Estado actualizado',
        `Tu comercio está ahora ${newStatus ? 'abierto' : 'cerrado'}`
      );
    },
    onError: () => {
      Alert.alert('Error', 'No se pudo cambiar el estado del comercio');
    },
  });

  const createProductMutation = useMutation({
    mutationFn: (productData: ProductFormData) => {
      const formData = new FormData();
      Object.keys(productData).forEach(key => {
        if (key === 'image' && productData[key as keyof ProductFormData]) {
          const image = productData[key as keyof ProductFormData] as { uri: string; type: string; name: string };
          formData.append('image', {
            uri: image.uri,
            type: image.type || 'image/jpeg',
            name: image.name || 'product_image.jpg',
          });
        } else {
          formData.append(key, String(productData[key as keyof ProductFormData]));
        }
      });
      return apiClient.upload('POST', 'vendors/products/', formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor', 'products'] });
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: ({ productId, productData }: { productId: number; productData: Partial<ProductFormData> }) => {
      const formData = new FormData();
      Object.keys(productData).forEach(key => {
        if (key === 'image' && productData[key as keyof Partial<ProductFormData>]?.uri) {
          const image = productData[key as keyof Partial<ProductFormData>] as { uri: string; type: string; name: string };
          formData.append('image', {
            uri: image.uri,
            type: image.type || 'image/jpeg',
            name: image.name || 'product_image.jpg',
          });
        } else if (key !== 'image') {
          formData.append(key, String(productData[key as keyof Partial<ProductFormData>]));
        }
      });
      return apiClient.upload('PATCH', `vendors/products/${productId}/`, formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor', 'products'] });
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: (productId: number) => apiClient.delete(`vendors/products/${productId}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor', 'products'] });
    },
  });

  const updateOrderStatusMutation = useMutation({
    mutationFn: ({ orderId, status, notes = '' }: OrderStatusUpdate) =>
      apiClient.post(`vendors/orders/${orderId}/update-status/`, { status, notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor', 'orders'] });
    },
  });

  const loadOrders = useCallback((status: string | null = null) => {
    let url = 'vendors/orders/';
    if (status) url += `?status=${status}`;
    return queryClient.fetchQuery({
      queryKey: ['vendor', 'orders', status],
      queryFn: () => apiClient.get(url),
    });
  }, [queryClient]);

  const products = useMemo(() => {
    const data = productsQuery.data;
    if (!data) return [];
    if (Array.isArray(data)) return data;
    return data.results || [];
  }, [productsQuery.data]);

  const orders = useMemo(() => {
    const data = ordersQuery.data;
    if (!data) return [];
    if (Array.isArray(data)) return data;
    return data.results || [];
  }, [ordersQuery.data]);

  const contextValue: VendorContextType = {
    vendorProfile: profileQuery.data,
    products,
    orders,
    isStoreOpen: profileQuery.data?.is_open ?? true,
    isLoading: profileQuery.isLoading || productsQuery.isLoading,
    salesStats: statsQuery.data || {
      todayOrders: 0,
      todayRevenue: 0,
      monthlyRevenue: 0,
      averageRating: 0,
    },
    updateVendorProfile: updateProfileMutation.mutateAsync,
    toggleStoreStatus: toggleStatusMutation.mutate,
    createProduct: createProductMutation.mutateAsync,
    updateProduct: (productId: number, productData: Partial<ProductFormData>) =>
      updateProductMutation.mutateAsync({ productId, productData }),
    deleteProduct: deleteProductMutation.mutateAsync,
    updateOrderStatus: (orderId: number, status: string, notes?: string) =>
      updateOrderStatusMutation.mutateAsync({ orderId, status, notes }),
    loadProducts: () => queryClient.invalidateQueries({ queryKey: ['vendor', 'products'] }),
    loadOrders,
    loadSalesStats: (period = 'today') =>
      queryClient.fetchQuery({
        queryKey: ['vendor', 'stats', period],
        queryFn: () => apiClient.get<SalesStats>(`vendors/stats/?period=${period}`),
      }),
    refreshData: () => queryClient.invalidateQueries({ queryKey: ['vendor'] }),
  };

  return (
    <VendorContext.Provider value={contextValue}>
      {children}
    </VendorContext.Provider>
  );
};
