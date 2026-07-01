// src/screens/customer/RideRatingScreen.js
import React, { useState, useContext } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    StatusBar,
    TouchableOpacity,
    TextInput,
    Image,
    Alert,
    ActivityIndicator,
    ScrollView,
} from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const RideRatingScreen = ({ route, navigation }) => {
    const insets = useSafeAreaInsets();
    const { rideId, rideData } = route.params;
    const { authenticatedFetch, API_BASE_URL } = useContext(AuthContext);
    
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [selectedIssues, setSelectedIssues] = useState([]);
    const [loading, setLoading] = useState(false);

    const issueOptions = [
        { id: 'late', label: 'Llegó tarde', icon: 'schedule' },
        { id: 'route', label: 'Ruta incorrecta', icon: 'wrong-location' },
        { id: 'cleanliness', label: 'Vehículo sucio', icon: 'cleaning-services' },
        { id: 'driving', label: 'Manejo brusco', icon: 'warning' },
        { id: 'communication', label: 'Falta de comunicación', icon: 'phone-disabled' },
        { id: 'safety', label: 'Problemas de seguridad', icon: 'security' },
        { id: 'other', label: 'Otro', icon: 'more-horiz' },
    ];

    const ratingTexts = {
        1: '¡Terrible!',
        2: 'Malo',
        3: 'Regular',
        4: 'Bueno',
        5: '¡Excelente!',
    };

    const handleIssueToggle = (issueId) => {
        setSelectedIssues(prev => 
            prev.includes(issueId) 
                ? prev.filter(id => id !== issueId)
                : [...prev, issueId]
        );
    };

    const handleSubmitRating = async () => {
        if (rating === 0) {
            Alert.alert('Error', 'Por favor selecciona una calificación');
            return;
        }

        setLoading(true);
        try {
            const ratingData = {
                rating,
                comment: comment.trim(),
                issues: selectedIssues,
                ride_id: rideId,
            };

            const response = await authenticatedFetch(`${API_BASE_URL}/rides/${rideId}/rate/`, {
                method: 'POST',
                body: JSON.stringify(ratingData),
            });

            if (response.ok) {
                Alert.alert(
                    '¡Gracias por tu calificación!',
                    'Tu opinión nos ayuda a mejorar el servicio',
                    [
                        {
                            text: 'OK',
                            onPress: () => navigation.navigate('Home')
                        }
                    ]
                );
            } else {
                throw new Error('Error al enviar la calificación');
            }
        } catch (error) {
            console.error('Error submitting rating:', error);
            Alert.alert('Error', 'No se pudo enviar la calificación. Intenta nuevamente.');
        } finally {
            setLoading(false);
        }
    };

    const handleSkipRating = () => {
        Alert.alert(
            'Omitir calificación',
            '¿Estás seguro de que quieres omitir la calificación?',
            [
                { text: 'Cancelar', style: 'cancel' },
                { 
                    text: 'Omitir', 
                    onPress: () => navigation.navigate('Home')
                }
            ]
        );
    };

    const renderStars = () => {
        return (
            <View style={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity
                        key={star}
                        style={styles.starButton}
                        onPress={() => setRating(star)}
                    >
                        <Icon
                            name={star <= rating ? 'star' : 'star-border'}
                            size={40}
                            color={star <= rating ? '#FFD700' : '#DDD'}
                        />
                    </TouchableOpacity>
                ))}
            </View>
        );
    };

    const renderIssues = () => {
        if (rating >= 4) return null;

        return (
            <View style={styles.issuesSection}>
                <Text style={styles.issuesTitle}>
                    ¿Qué podríamos mejorar? (Opcional)
                </Text>
                <Text style={styles.issuesSubtitle}>
                    Selecciona todos los que apliquen
                </Text>
                
                <View style={styles.issuesGrid}>
                    {issueOptions.map((issue) => (
                        <TouchableOpacity
                            key={issue.id}
                            style={[
                                styles.issueOption,
                                selectedIssues.includes(issue.id) && styles.selectedIssue
                            ]}
                            onPress={() => handleIssueToggle(issue.id)}
                        >
                            <Icon 
                                name={issue.icon} 
                                size={24} 
                                color={selectedIssues.includes(issue.id) ? '#2196F3' : '#666'} 
                            />
                            <Text style={[
                                styles.issueText,
                                selectedIssues.includes(issue.id) && styles.selectedIssueText
                            ]}>
                                {issue.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
            
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Calificar Viaje</Text>
                <TouchableOpacity 
                    style={styles.skipButton}
                    onPress={handleSkipRating}
                >
                    <Text style={styles.skipText}>Omitir</Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Trip Summary */}
                <View style={styles.tripSummary}>
                    <View style={styles.summaryHeader}>
                        <Icon name="check-circle" size={48} color="#4CAF50" />
                        <Text style={styles.completedText}>¡Viaje completado!</Text>
                    </View>
                    
                    <View style={styles.tripDetails}>
                        <View style={styles.addressRow}>
                            <Icon name="radio-button-checked" size={16} color="#4CAF50" />
                            <Text style={styles.addressText} numberOfLines={1}>
                                {rideData?.pickup_address || 'Origen'}
                            </Text>
                        </View>
                        <View style={styles.addressSeparator} />
                        <View style={styles.addressRow}>
                            <Icon name="location-on" size={16} color="#F44336" />
                            <Text style={styles.addressText} numberOfLines={1}>
                                {rideData?.destination_address || 'Destino'}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.fareDetails}>
                        <View style={styles.fareRow}>
                            <Text style={styles.fareLabel}>Total pagado</Text>
                            <Text style={styles.fareAmount}>
                                ${rideData?.final_fare || rideData?.estimated_fare || 0}
                            </Text>
                        </View>
                        <View style={styles.fareRow}>
                            <Text style={styles.fareLabel}>Método de pago</Text>
                            <Text style={styles.fareValue}>
                                {rideData?.payment_method || 'Efectivo'}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Driver Info */}
                {rideData?.driver && (
                    <View style={styles.driverSection}>
                        <Text style={styles.sectionTitle}>Tu conductor</Text>
                        <View style={styles.driverInfo}>
                            <Image 
                                source={{ 
                                    uri: rideData.driver.avatar || 'https://via.placeholder.com/60x60/DDD/FFF?text=D' 
                                }} 
                                style={styles.driverPhoto} 
                            />
                            <View style={styles.driverDetails}>
                                <Text style={styles.driverName}>{rideData.driver.name}</Text>
                                <View style={styles.driverMeta}>
                                    <Icon name="star" size={16} color="#FFD700" />
                                    <Text style={styles.driverRating}>
                                        {rideData.driver.rating?.toFixed(1) || '5.0'}
                                    </Text>
                                    <Text style={styles.vehicleInfo}>
                                        • {rideData.driver.vehicle?.model} {rideData.driver.vehicle?.plate}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>
                )}

                {/* Rating Section */}
                <View style={styles.ratingSection}>
                    <Text style={styles.sectionTitle}>¿Cómo estuvo tu viaje?</Text>
                    
                    {renderStars()}
                    
                    <Text style={styles.ratingText}>
                        {ratingTexts[rating]}
                    </Text>
                </View>

                {/* Issues Section */}
                {renderIssues()}

                {/* Comment Section */}
                <View style={styles.commentSection}>
                    <Text style={styles.sectionTitle}>
                        Comentarios adicionales (Opcional)
                    </Text>
                    <TextInput
                        style={styles.commentInput}
                        placeholder="Comparte tu experiencia..."
                        value={comment}
                        onChangeText={setComment}
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                        maxLength={500}
                    />
                    <Text style={styles.characterCount}>
                        {comment.length}/500 caracteres
                    </Text>
                </View>

                {/* Spacer */}
                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Submit Button */}
            <View style={[styles.bottomContainer, { paddingBottom: insets.bottom + 16 }]}>
                <TouchableOpacity
                    style={styles.submitButton}
                    onPress={handleSubmitRating}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <Text style={styles.submitButtonText}>
                            Enviar Calificación
                        </Text>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    skipButton: {
        padding: 8,
    },
    skipText: {
        color: '#666',
        fontSize: 16,
    },
    content: {
        flex: 1,
    },
    tripSummary: {
        backgroundColor: '#FFF',
        margin: 16,
        borderRadius: 12,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    summaryHeader: {
        alignItems: 'center',
        marginBottom: 20,
    },
    completedText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#4CAF50',
        marginTop: 12,
    },
    tripDetails: {
        marginBottom: 20,
    },
    addressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
    },
    addressText: {
        flex: 1,
        marginLeft: 12,
        fontSize: 14,
        color: '#333',
    },
    addressSeparator: {
        width: 2,
        height: 16,
        backgroundColor: '#DDD',
        marginLeft: 7,
    },
    fareDetails: {
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
        paddingTop: 16,
    },
    fareRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    fareLabel: {
        fontSize: 14,
        color: '#666',
    },
    fareAmount: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    fareValue: {
        fontSize: 14,
        color: '#333',
    },
    driverSection: {
        backgroundColor: '#FFF',
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 16,
    },
    driverInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    driverPhoto: {
        width: 60,
        height: 60,
        borderRadius: 30,
        marginRight: 12,
    },
    driverDetails: {
        flex: 1,
    },
    driverName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    driverMeta: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    driverRating: {
        fontSize: 14,
        color: '#333',
        marginLeft: 4,
    },
    vehicleInfo: {
        fontSize: 14,
        color: '#666',
    },
    ratingSection: {
        backgroundColor: '#FFF',
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 12,
        padding: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    starsContainer: {
        flexDirection: 'row',
        marginVertical: 20,
    },
    starButton: {
        paddingHorizontal: 8,
    },
    ratingText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginTop: 12,
    },
    issuesSection: {
        backgroundColor: '#FFF',
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    issuesTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    issuesSubtitle: {
        fontSize: 14,
        color: '#666',
        marginBottom: 16,
    },
    issuesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -6,
    },
    issueOption: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        margin: 6,
        borderWidth: 1,
        borderColor: '#E5E5E5',
        minWidth: '45%',
    },
    selectedIssue: {
        backgroundColor: '#E3F2FD',
        borderColor: '#2196F3',
    },
    issueText: {
        fontSize: 14,
        color: '#666',
        marginLeft: 8,
        flex: 1,
    },
    selectedIssueText: {
        color: '#2196F3',
        fontWeight: '600',
    },
    commentSection: {
        backgroundColor: '#FFF',
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    commentInput: {
        borderWidth: 1,
        borderColor: '#E5E5E5',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        minHeight: 100,
        backgroundColor: '#F8F9FA',
    },
    characterCount: {
        fontSize: 12,
        color: '#999',
        textAlign: 'right',
        marginTop: 8,
    },
    bottomContainer: {
        backgroundColor: '#FFF',
        paddingHorizontal: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#E5E5E5',
    },
    submitButton: {
        backgroundColor: '#4CAF50',
        borderRadius: 8,
        paddingVertical: 16,
        alignItems: 'center',
    },
    submitButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default RideRatingScreen;