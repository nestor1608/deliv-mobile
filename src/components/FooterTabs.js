// src/components/FooterTabs.js
import React, { useContext } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NotificationContext } from '../context/NotificationContext';
import { VendorContext } from '../context/VendorContext';

export default function FooterTabs({ navigation, activeTab }) {
    const { unreadCount } = useContext(NotificationContext);
    const { orders } = useContext(VendorContext);

    // Contar pedidos pendientes para el badge
    const pendingOrders = orders.filter(order => order.status === 'pending').length;

    const tabs = [
        {
            key: 'Home',
            label: 'Inicio',
            icon: 'home-outline',
            activeIcon: 'home',
            route: 'StoreDashboard',
        },
        {
            key: 'Orders',
            label: 'Pedidos',
            icon: 'receipt-outline',
            activeIcon: 'receipt',
            route: 'Orders',
            badge: pendingOrders,
        },
        {
            key: 'Products',
            label: 'Productos',
            icon: 'fast-food-outline',
            activeIcon: 'fast-food',
            route: 'ProductList',
        },
        {
            key: 'Reports',
            label: 'Reportes',
            icon: 'bar-chart-outline',
            activeIcon: 'bar-chart',
            route: 'SalesReport',
        },
        {
            key: 'Notifications',
            label: 'Notificaciones',
            icon: 'notifications-outline',
            activeIcon: 'notifications',
            route: 'VendorNotifications',
            badge: unreadCount,
        },
    ];

    const handleTabPress = (tab) => {
        if (activeTab !== tab.key) {
            navigation.navigate(tab.route);
        }
    };

    const renderTab = (tab) => {
        const isActive = activeTab === tab.key;
        const iconName = isActive ? tab.activeIcon : tab.icon;

        return (
            <TouchableOpacity
                key={tab.key}
                style={[styles.tab, isActive && styles.activeTab]}
                onPress={() => handleTabPress(tab)}
                activeOpacity={0.7}
            >
                <View style={styles.tabContent}>
                    <View style={styles.iconContainer}>
                        <Ionicons
                            name={iconName}
                            size={24}
                            color={isActive ? '#FF6B6B' : '#666'}
                        />
                        {tab.badge > 0 && (
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>
                                    {tab.badge > 99 ? '99+' : tab.badge}
                                </Text>
                            </View>
                        )}
                    </View>
                    <Text style={[
                        styles.tabLabel,
                        isActive && styles.activeTabLabel
                    ]}>
                        {tab.label}
                    </Text>
                </View>
                {isActive && <View style={styles.activeIndicator} />}
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.tabsContainer}>
                {tabs.map(renderTab)}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
        paddingBottom: Platform.OS === 'ios' ? 34 : 10, // Safe area for iPhone
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
            },
            android: {
                elevation: 8,
            },
        }),
    },
    tabsContainer: {
        flexDirection: 'row',
        paddingTop: 8,
    },
    tab: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 4,
        position: 'relative',
    },
    activeTab: {
        // Styles handled by activeIndicator
    },
    tabContent: {
        alignItems: 'center',
    },
    iconContainer: {
        position: 'relative',
        marginBottom: 4,
    },
    badge: {
        position: 'absolute',
        top: -6,
        right: -6,
        backgroundColor: '#FF6B6B',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#fff',
    },
    badgeText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
    },
    tabLabel: {
        fontSize: 12,
        color: '#666',
        fontWeight: '500',
        textAlign: 'center',
    },
    activeTabLabel: {
        color: '#FF6B6B',
        fontWeight: '600',
    },
    activeIndicator: {
        position: 'absolute',
        top: 0,
        left: '25%',
        right: '25%',
        height: 3,
        backgroundColor: '#FF6B6B',
        borderRadius: 2,
    },
});