import React, { useState, useContext } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, Alert, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { AuthContext } from '../context/AuthContext';

export default function KYCScreen({ route, navigation }) {
  const { userType } = route.params; // 'delivery' or 'driver'
  const { userToken, API_BASE_URL } = useContext(AuthContext);
  
  const [frontDoc, setFrontDoc] = useState(null);
  const [backDoc, setBackDoc] = useState(null);
  const [selfie, setSelfie] = useState(null);
  const [uploading, setUploading] = useState(false);
  
  const pickImage = async (setter) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      setter(result.assets[0]);
    }
  };
  
  const takeSelfie = async () => {
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      setSelfie(result.assets[0]);
    }
  };
  
  const handleSubmit = async () => {
    if (!frontDoc || !backDoc || !selfie) {
      Alert.alert('Error', 'Debes subir todos los documentos');
      return;
    }
    
    setUploading(true);
    const formData = new FormData();
    formData.append('id_document_front', { uri: frontDoc.uri, type: 'image/jpeg', name: 'front.jpg' });
    formData.append('id_document_back', { uri: backDoc.uri, type: 'image/jpeg', name: 'back.jpg' });
    formData.append('selfie', { uri: selfie.uri, type: 'image/jpeg', name: 'selfie.jpg' });
    
    try {
      const endpoint = userType === 'delivery' 
        ? `${API_BASE_URL}/delivery/profile/upload_kyc/`
        : `${API_BASE_URL}/mobility/drivers/profile/upload_kyc/`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { Authorization: `Bearer ${userToken}` },
        body: formData,
      });
      
      const data = await response.json();
      if (response.ok) {
        Alert.alert('Éxito', 'Documentos enviados para verificación');
        navigation.goBack();
      } else {
        Alert.alert('Error', data.error || 'Error al subir documentos');
      }
    } catch (error) {
      Alert.alert('Error', 'Error de conexión');
    } finally {
      setUploading(false);
    }
  };
  
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Verificación de Identidad (KYC)</Text>
      <Text style={styles.subtitle}>Subí tu documento de identidad (frente y dorso) y una selfie</Text>
      
      <Text style={styles.label}>Documento Frente</Text>
      <TouchableOpacity style={styles.uploadBox} onPress={() => pickImage(setFrontDoc)}>
        {frontDoc ? <Image source={{ uri: frontDoc.uri }} style={styles.preview} /> : <Text>Seleccionar imagen</Text>}
      </TouchableOpacity>
      
      <Text style={styles.label}>Documento Dorso</Text>
      <TouchableOpacity style={styles.uploadBox} onPress={() => pickImage(setBackDoc)}>
        {backDoc ? <Image source={{ uri: backDoc.uri }} style={styles.preview} /> : <Text>Seleccionar imagen</Text>}
      </TouchableOpacity>
      
      <Text style={styles.label}>Selfie</Text>
      <TouchableOpacity style={styles.uploadBox} onPress={takeSelfie}>
        {selfie ? <Image source={{ uri: selfie.uri }} style={styles.preview} /> : <Text>Tomar selfie</Text>}
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={uploading}>
        <Text style={styles.submitText}>{uploading ? 'Subiendo...' : 'Enviar para verificación'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 20 },
  label: { fontSize: 16, fontWeight: '600', marginTop: 16, marginBottom: 8 },
  uploadBox: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 40, alignItems: 'center', backgroundColor: '#f9f9f9' },
  preview: { width: 200, height: 150, resizeMode: 'contain' },
  submitButton: { backgroundColor: '#2196F3', padding: 16, borderRadius: 8, marginTop: 30, alignItems: 'center' },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
