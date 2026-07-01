// src/screens/delivery/DeliveryEarningsScreen.js
import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  Dimensions,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { AuthContext } from '../../context/AuthContext';

const { width } = Dimensions.get('window');

export default function DeliveryEarningsScreen() {
  const navigation = useNavigation();
  const { authenticatedFetch } = useContext(AuthContext);
  
  const [selectedPeriod, setSelectedPeriod] = useState('today'); // 'today', 'week', 'month'
  const [earnings, setEarnings] = useState({
    total: 0,
    deliveries: 0,
    averagePerDelivery: 0,
    distance: 0,
    hours: 0,
    tips: 0,
  });
  const [dailyEarnings, setDailyEarnings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadEarnings();
  }, [selectedPeriod]);

  const loadEarnings = async () => {
    setLoading(true);
    try {
      const response = await authenticatedFetch(`/api/delivery/earnings/?period=${selectedPeriod}`);
      if (response.ok) {
        const data = await response.json();
        setEarnings(data.summary);
        setDailyEarnings(data.daily || []);
      } else {
        // Datos de ejemplo para desarrollo
        const mockData = {
          today: {
            summary: {
              total: 85.50,
              deliveries: 6,
              averagePerDelivery: 14.25,
              distance: 45.2,
              hours: 4.5,
              tips: 12.50,
            },
            daily: [
              { date: '2024-01-15', total: 85.50, deliveries: 6 },
            ]
          },
          week: {
            summary: {
              total: 425.75,
              deliveries: 28,
              averagePerDelivery: 15.20,
              distance: 234.8,
              hours: 22.5,
              tips: 68.25,
            },
            daily: [
              { date: '2024-01-15', total: 85.50, deliveries: 6 },
              { date: '2024-01-14', total: 92.25, deliveries: 5 },
              { date: '2024-01-13', total: 76.00, deliveries: 4 },
              { date: '2024-01-12', total: 103.50, deliveries: 7 },
              { date: '2024-01-11', total: 68.50, deliveries: 6 },
            ]
          },
          month: {
            summary: {
              total: 1850.25,
              deliveries: 125,
              averagePerDelivery: 14.80,
              distance: 980.5,
              hours: 85.0,
              tips: 285.50,
            },
            daily: []
          }
        };
        
        const data = mockData[selectedPeriod];
        setEarnings(data.summary);
        setDailyEarnings(data.daily);
      }
    } catch (error) {
      console.error('Error loading earnings:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadEarnings();
    setRefreshing(false);
  };

  const getPeriodText = () => {
    switch (selectedPeriod) {
      case 'today':
        return 'Hoy';
      case 'week':
        return 'Esta semana';
      case 'month':
        return 'Este mes';
      default:
        return '';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
    });
  };

  const renderPeriodButton = (period, label) => (
    <TouchableOpacity
      style={[
        styles.periodButton,
        selectedPeriod === period && styles.activePeriodButton
      ]}
      onPress={() => setSelectedPeriod(period)}
    >
      <Text style={[
        styles.periodButtonText,
        selectedPeriod === period && styles.activePeriodButtonText
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderStatsCard = (title, value, icon, color, subtitle = null) => (
    <View style={[styles.statsCard, { borderLeftColor: color }]}>
      <View style={styles.statsContent}>
        <View style={styles.statsText}>
          <Text style={styles.statsValue}>{value}</Text>
          <Text style={styles.statsTitle}>{title}</Text>
          {subtitle && <Text style={styles.statsSubtitle}>{subtitle}</Text>}
        </View>
        <View style={[styles.statsIcon, { backgroundColor: color }]}>
          <Icon name={icon} size={24} color="#fff" />
        </View>
      </View>
    </View>
  );

  const renderDailyEarning = (day, index) => (
    <View key={index} style={styles.dailyItem}>
      <View style={styles.dailyDate}>
        <Text style={styles.dailyDateText}>{formatDate(day.date)}</Text>
      </View>
      <View style={styles.dailyStats}>
        <Text style={styles.dailyDeliveries}>{day.deliveries} entregas</Text>
        <Text style={styles.dailyTotal}>${day.total}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header con selector de período */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Mis Ganancias</Text>
          <Text style={styles.headerSubtitle}>{getPeriodText()}</Text>
          
          <View style={styles.periodSelector}>
            {renderPeriodButton('today', 'Hoy')}
            {renderPeriodButton('week', 'Semana')}
            {renderPeriodButton('month', 'Mes')}
          </View>
        </View>

        {/* Resumen principal */}
        <View style={styles.mainSummary}>
          <View style={styles.mainEarnings}>
            <Text style={styles.mainEarningsLabel}>Total ganado</Text>
            <Text style={styles.mainEarningsValue}>${earnings.total}</Text>
          </View>
          
          <View style={styles.mainStats}>
            <View style={styles.mainStat}>
              <Text style={styles.mainStatValue}>{earnings.deliveries}</Text>
              <Text style={styles.mainStatLabel}>Entregas</Text>
            </View>
            <View style={styles.mainStat}>
              <Text style={styles.mainStatValue}>${earnings.averagePerDelivery}</Text>
              <Text style={styles.mainStatLabel}>Promedio</Text>
            </View>
            <View style={styles.mainStat}>
              <Text style={styles.mainStatValue}>{earnings.hours}h</Text>
              <Text style={styles.mainStatLabel}>Horas</Text>
            </View>
          </View>
        </View>

        {/* Estadísticas detalladas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Estadísticas detalladas</Text>
          
          <View style={styles.statsGrid}>
            {renderStatsCard(
              'Distancia total',
              `${earnings.distance} km`,
              'directions',
              '#2196F3'
            )}
            
            {renderStatsCard(
              'Propinas',
              `$${earnings.tips}`,
              'star',
              '#FFC107'
            )}
            
            {renderStatsCard(
              'Por hora',
              `$${(earnings.total / earnings.hours || 0).toFixed(2)}`,
              'schedule',
              '#4CAF50',
              'Ganancia promedio'
            )}
            
            {renderStatsCard(
              'Por kilómetro',
              `$${(earnings.total / earnings.distance || 0).toFixed(2)}`,
              'local-gas-station',
              '#FF9800',
              'Eficiencia'
            )}
          </View>
        </View>

        {/* Ganancias diarias */}
        {dailyEarnings.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Desglose diario</Text>
            
            <View style={styles.dailyContainer}>
              {dailyEarnings.map(renderDailyEarning)}
            </View>
          </View>
        )}

        {/* Consejos para mejorar ganancias */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Consejos para mejorar</Text>
          
          <View style={styles.tipsContainer}>
            <View style={styles.tipItem}>
              <Icon name="access-time" size={20} color="#FF9800" />
              <Text style={styles.tipText}>
                Trabaja en horarios pico (12-14h y 19-22h) para más pedidos
              </Text>
            </View>
            
            <View style={styles.tipItem}>
              <Icon name="location-on" size={20} color="#4CAF50" />
              <Text style={styles.tipText}>
                Mantente cerca de zonas comerciales para reducir tiempos de espera
              </Text>
            </View>
            
            <View style={styles.tipItem}>
              <Icon name="star" size={20} color="#FFC107" />
              <Text style={styles.tipText}>
                Mantén una calificación alta para recibir más pedidos
              </Text>
            </View>
          </View>
        </View>

        {/* Botón de historial completo */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.historyButton}
            onPress={() => navigation.navigate('DeliveryHistory')}
          >
            <Icon name="history" size={24} color="#2196F3" />
            <Text style={styles.historyButtonText}>Ver historial completo</Text>
            <Icon name="chevron-right" size={24} color="#2196F3" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 20,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 25,
    padding: 4,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignItems: 'center',
  },
  activePeriodButton: {
    backgroundColor: '#fff',
  },
  periodButtonText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
  },
  activePeriodButtonText: {
    color: '#FF9800',
    fontWeight: 'bold',
  },
  mainSummary: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: -10,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  mainEarnings: {
    alignItems: 'center',
    marginBottom: 20,
  },
  mainEarningsLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  mainEarningsValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  mainStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 20,
  },
  mainStat: {
    alignItems: 'center',
  },
  mainStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  mainStatLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  section: {
    marginHorizontal: 20,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    width: (width - 50) / 2,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statsContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statsText: {
    flex: 1,
  },
  statsValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statsTitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  statsSubtitle: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
  statsIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dailyContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  dailyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dailyDate: {
    width: 60,
  },
  dailyDateText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  dailyStats: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginLeft: 16,
  },
  dailyDeliveries: {
    fontSize: 14,
    color: '#666',
  },
  dailyTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  tipText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  historyButtonText: {
    fontSize: 16,
    color: '#2196F3',
    fontWeight: '600',
    flex: 1,
    marginLeft: 12,
  },
});