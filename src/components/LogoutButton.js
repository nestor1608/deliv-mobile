import React, { useContext } from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

const LogoutButton = () => {
    const { logout } = useContext(AuthContext);

    return (
        <TouchableOpacity 
            style={styles.container} 
            onPress={logout}
        >
            <Ionicons name="log-out-outline" size={24} color="#FF4444" />
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        marginRight: 15,
    }
});

export default LogoutButton;
