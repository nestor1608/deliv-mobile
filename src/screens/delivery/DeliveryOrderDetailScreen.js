import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

export default function DeliveryOrderDetailScreen({ navigation }) {
  const order = {
    id: '12345',
    store: 'Restaurante Mexicano',
    customer: 'Juan Pérez',
    items: [
      { name: 'Tacos al pastor', quantity: 3, price: 45 },
      { name: 'Refresco', quantity: 2, price: 20 }
    ],
    total: 65,
    deliveryAddress: 'Calle Falsa 123, Col. Centro',
    notes: 'Timbre blanco, departamento 5'
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Detalles del Pedido</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Información del Pedido</Text>
        <Text>Número: #{order.id}</Text>
        <Text>Tienda: {order.store}</Text>
        <Text>Cliente: {order.customer}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Artículos</Text>
        {order.items.map((item, index) => (
          <View key={index} style={styles.item}>
            <Text>{item.quantity}x {item.name}</Text>
            <Text>${item.price * item.quantity}</Text>
          </View>
        ))}
        <View style={styles.total}>
          <Text style={styles.totalText}>Total:</Text>
          <Text style={styles.totalText}>${order.total}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Dirección de Entrega</Text>
        <Text>{order.deliveryAddress}</Text>
        <Text style={styles.notes}>Notas: {order.notes}</Text>
      </View>

      <TouchableOpacity 
        style={styles.acceptButton}
        onPress={() => navigation.navigate('DeliveryMap')}
      >
        <Text style={styles.buttonText}>Aceptar Pedido</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.rejectButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.buttonText}>Rechazar</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  section: { 
    backgroundColor: '#fff', 
    padding: 15, 
    borderRadius: 10, 
    marginBottom: 15 
  },
  sectionTitle: { fontWeight: 'bold', marginBottom: 10, fontSize: 16 },
  item: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 5 
  },
  total: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10
  },
  totalText: { fontWeight: 'bold' },
  notes: { marginTop: 10, fontStyle: 'italic' },
  acceptButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10
  },
  rejectButton: {
    backgroundColor: '#f44336',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center'
  },
  buttonText: { color: '#fff', fontWeight: 'bold' }
});