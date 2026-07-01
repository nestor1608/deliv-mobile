import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';

const DeliveryDetailsScreen = ({ route, navigation }) => {
  const [reference, setReference] = useState('');
  const [contactName, setContactName] = useState('Juan Pérez'); // Nombre por defecto del usuario
  const [phone, setPhone] = useState('');

  const handlePlaceOrder = () => {
    // Aquí iría la lógica para procesar el pedido
    Alert.alert('Pedido confirmado', 'Tu pedido ha sido recibido y está siendo procesado');
    navigation.popToTop(); // Vuelve a la pantalla inicial
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Detalles de entrega</Text>
      
      <View style={styles.form}>
        <Text style={styles.label}>Dirección exacta</Text>
        <TextInput
          style={styles.input}
          placeholder="Calle y número, departamento, piso, etc."
          value={reference}
          onChangeText={setReference}
        />
        
        <Text style={styles.label}>Preguntar por:</Text>
        <TextInput
          style={styles.input}
          placeholder="Nombre de quien recibirá"
          value={contactName}
          onChangeText={setContactName}
        />
        
        <Text style={styles.label}>Teléfono de contacto</Text>
        <TextInput
          style={styles.input}
          placeholder="Número de teléfono"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />
        
        <Text style={styles.note}>
          Importante: Este teléfono será usado por el repartidor para coordinar la entrega
        </Text>
      </View>
      
      <TouchableOpacity 
        style={styles.orderButton}
        onPress={handlePlaceOrder}
        disabled={!reference || !contactName || !phone}
      >
        <Text style={styles.orderButtonText}>Confirmar Pedido</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 15,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 10,
  },
  note: {
    fontSize: 14,
    color: '#666',
    marginTop: 15,
    fontStyle: 'italic',
  },
  orderButton: {
    backgroundColor: '#FF6B00',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
  },
  orderButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default DeliveryDetailsScreen;