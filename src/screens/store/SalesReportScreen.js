// src/screens/store/SalesReportScreen.js
import React, { useContext, useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Dimensions,
    Platform,
    RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { VendorContext } from '../../context/VendorContext';

const { width } = Dimensions.get('window');

const PERIODS = [
    { key: 'today', label: 'Hoy' },
    { key: 'week', label: 'Esta semana' },
    { key: 'month', label: 'Este mes' },
    { key: 'year', label: 'Este año' },
];

export default function SalesReportScreen({ navigation }) {
    const { loadSalesStats, salesStats } = useContext(VendorContext);
    const [selectedPeriod, setSelectedPeriod] = useState('today');
    const [refreshing, setRefreshing] = useState(false);
    const [detailedStats, setDetailedStats] = useState({
        revenue: [],
        orders: [],
        topProducts: [],
        categoryStats: [],
    });

    useEffect(() => {
        loadData();
    }, [selectedPeriod]);

    const loadData = async () => {
        try {
            await loadSalesStats(selectedPeriod);
            // Simular datos para las gráficas - en producción vendrían del backend
            loadDetailedStats();
        } catch (error) {
            console.error('Error loading sales data:', error);
        }
    };

    const loadDetailedStats = () => {
        // Datos simulados para las gráficas
        const mockData = {
            revenue: {
                labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
                datasets: [{
                    data: [2000, 3200, 2800, 4100, 3900, 5200, 4800],
                }],
            },
            orders: {
                labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
                datasets: [{
                    data: [12, 19, 15, 24, 22, 28, 26],
                }],
            },
            topProducts: [
                { name: 'Hamburguesa Clásica', quantity: 45, color: '#FF6B6B' },
                { name: 'Pizza Napolitana', quantity: 32, color: '#4ECDC4' },
                { name: 'Papas Fritas', quantity: 28, color: '#45B7D1' },
                { name: 'Milanesa', quantity: 22, color: '#96CEB4' },
                { name: 'Empanadas', quantity: 18, color: '#FFEAA7' },
            ],
            categoryStats: [
                { name: 'Platos principales', population: 45, color: '#FF6B6B', legendFontColor: '#333' },
                { name: 'Bebidas', population: 25, color: '#4ECDC4', legendFontColor: '#333' },
                { name: 'Postres', population: 15, color: '#45B7D1', legendFontColor: '#333' },
                { name: 'Entradas', population: 10, color: '#96CEB4', legendFontColor: '#333' },
                { name: 'Otros', population: 5, color: '#FFEAA7', legendFontColor: '#333' },
            ],
        };

        setDetailedStats(mockData);
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    const chartConfig = {
        backgroundColor: '#ffffff',
        backgroundGradientFrom: '#ffffff',
        backgroundGradientTo: '#ffffff',
        color: (opacity = 1) => `rgba(255, 107, 107, ${opacity})`,
        strokeWidth: 2,
        barPercentage: 0.7,
        useShadowColorFromDataset: false,
        decimalPlaces: 0,
        propsForLabels: {
            fontSize: 12,
        },
        propsForVerticalLabels: {
            fontSize: 10,
        },
    };

    const renderPeriodSelector = () => (
        <View style={styles.periodSelector}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {PERIODS.map((period) => (
                    <TouchableOpacity
                        key={period.key}
                        style={[
                            styles.periodButton,
                            selectedPeriod === period.key && styles.selectedPeriodButton
                        ]}
                        onPress={() => setSelectedPeriod(period.key)}
                    >
                        <Text style={[
                            styles.periodButtonText,
                            selectedPeriod === period.key && styles.selectedPeriodButtonText
                        ]}>
                            {period.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );

    const renderStatsCards = () => (
        <View style={styles.statsContainer}>
            <View style={styles.statsRow}>
                <View style={[styles.statCard, styles.revenueCard]}>
                    <View style={styles.statIcon}>
                        <Ionicons name="cash-outline" size={24} color="#FFF" />
                    </View>
                    <View style={styles.statInfo}>
                        <Text style={styles.statValue}>
                            ${salesStats.todayRevenue?.toFixed(0) || '0'}
                        </Text>
                        <Text style={styles.statLabel}>Ingresos</Text>
                    </View>
                </View>

                <View style={[styles.statCard, styles.ordersCard]}>
                    <View style={styles.statIcon}>
                        <Ionicons name="receipt-outline" size={24} color="#FFF" />
                    </View>
                    <View style={styles.statInfo}>
                        <Text style={styles.statValue}>
                            {salesStats.todayOrders || '0'}
                        </Text>
                        <Text style={styles.statLabel}>Pedidos</Text>
                    </View>
                </View>
            </View>

            <View style={styles.statsRow}>
                <View style={[styles.statCard, styles.avgCard]}>
                    <View style={styles.statIcon}>
                        <Ionicons name="calculator-outline" size={24} color="#FFF" />
                    </View>
                    <View style={styles.statInfo}>
                        <Text style={styles.statValue}>
                            ${salesStats.todayOrders > 0 
                                ? (salesStats.todayRevenue / salesStats.todayOrders).toFixed(0)
                                : '0'
                            }
                        </Text>
                        <Text style={styles.statLabel}>Ticket promedio</Text>
                    </View>
                </View>

                <View style={[styles.statCard, styles.ratingCard]}>
                    <View style={styles.statIcon}>
                        <Ionicons name="star-outline" size={24} color="#FFF" />
                    </View>
                    <View style={styles.statInfo}>
                        <Text style={styles.statValue}>
                            {salesStats.averageRating?.toFixed(1) || '0.0'}
                        </Text>
                        <Text style={styles.statLabel}>Calificación</Text>
                    </View>
                </View>
            </View>
        </View>
    );

    const renderRevenueChart = () => (
        <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>Ingresos por día</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <LineChart
                    data={detailedStats.revenue}
                    width={width - 20}
                    height={220}
                    chartConfig={chartConfig}
                    bezier
                    style={styles.chart}
                    decorator={() => null}
                />
            </ScrollView>
        </View>
    );

    const renderOrdersChart = () => (
        <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>Pedidos por día</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <BarChart
                    data={detailedStats.orders}
                    width={width - 20}
                    height={220}
                    chartConfig={{
                        ...chartConfig,
                        color: (opacity = 1) => `rgba(78, 205, 196, ${opacity})`,
                    }}
                    style={styles.chart}
                />
            </ScrollView>
        </View>
    );

    const renderTopProducts = () => (
        <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>Productos más vendidos</Text>
            <View style={styles.topProductsList}>
                {detailedStats.topProducts.map((product, index) => (
                    <View key={index} style={styles.topProductItem}>
                        <View style={styles.productRank}>
                            <Text style={styles.rankNumber}>{index + 1}</Text>
                        </View>
                        <View style={styles.productInfo}>
                            <Text style={styles.productName}>{product.name}</Text>
                            <Text style={styles.productQuantity}>
                                {product.quantity} vendidos
                            </Text>
                        </View>
                        <View 
                            style={[
                                styles.productBar,
                                { 
                                    width: `${(product.quantity / detailedStats.topProducts[0].quantity) * 100}%`,
                                    backgroundColor: product.color 
                                }
                            ]} 
                        />
                    </View>
                ))}
            </View>
        </View>
    );

    const renderCategoryChart = () => (
        <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>Ventas por categoría</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <PieChart
                    data={detailedStats.categoryStats}
                    width={width - 20}
                    height={220}
                    chartConfig={chartConfig}
                    accessor="population"
                    backgroundColor="transparent"
                    paddingLeft="15"
                    style={styles.chart}
                />
            </ScrollView>
        </View>
    );

    return (
        <ScrollView 
            style={styles.container}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            showsVerticalScrollIndicator={false}
        >
            {renderPeriodSelector()}
            {renderStatsCards()}
            {renderRevenueChart()}
            {renderOrdersChart()}
            {renderTopProducts()}
            {renderCategoryChart()}
            
            <View style={styles.bottomSpacer} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    periodSelector: {
        backgroundColor: '#fff',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    periodButton: {
        backgroundColor: '#f5f5f5',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginRight: 12,
    },
    selectedPeriodButton: {
        backgroundColor: '#FF6B6B',
    },
    periodButtonText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#666',
    },
    selectedPeriodButtonText: {
        color: '#FFF',
    },
    statsContainer: {
        padding: 20,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    statCard: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        marginHorizontal: 4,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
            },
            android: {
                elevation: 3,
            },
        }),
    },
    revenueCard: {
        backgroundColor: '#4CAF50',
    },
    ordersCard: {
        backgroundColor: '#2196F3',
    },
    avgCard: {
        backgroundColor: '#FF9800',
    },
    ratingCard: {
        backgroundColor: '#9C27B0',
    },
    statIcon: {
        marginRight: 12,
    },
    statInfo: {
        flex: 1,
    },
    statValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFF',
        marginBottom: 2,
    },
    statLabel: {
        fontSize: 12,
        color: '#FFF',
        opacity: 0.9,
    },
    chartContainer: {
        backgroundColor: '#fff',
        marginHorizontal: 20,
        marginBottom: 20,
        borderRadius: 12,
        padding: 16,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
            },
            android: {
                elevation: 3,
            },
        }),
    },
    chartTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 16,
        textAlign: 'center',
    },
    chart: {
        borderRadius: 8,
    },
    topProductsList: {
        marginTop: 8,
    },
    topProductItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        position: 'relative',
    },
    productRank: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#FF6B6B',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    rankNumber: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#FFF',
    },
    productInfo: {
        flex: 1,
        zIndex: 1,
    },
    productName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 2,
    },
    productQuantity: {
        fontSize: 14,
        color: '#666',
    },
    productBar: {
        position: 'absolute',
        left: 40,
        right: 0,
        height: '100%',
        borderRadius: 8,
        opacity: 0.1,
    },
    bottomSpacer: {
        height: 20,
    },
});