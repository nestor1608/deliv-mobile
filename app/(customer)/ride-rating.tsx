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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { AuthContext } from '../../src/context/AuthContext';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { paramToString } from '../../src/utils/params';

export default function RideRatingScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const rideId = paramToString(params.rideId);
    const rideDataParam = paramToString(params.rideData);
    const rideData = rideDataParam ? JSON.parse(rideDataParam) : null;
    const { authenticatedFetch, API_BASE_URL } = useContext(AuthContext);
    const insets = useSafeAreaInsets();

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
            const response = await authenticatedFetch(`${API_BASE_URL}/mobility/trips/${rideId}/rate/`, {
                method: 'POST',
                body: JSON.stringify({
                    rating,
                    comment,
                    issues: selectedIssues
                }),
            });

            if (response.ok) {
                Alert.alert(
                    '¡Gracias!',
                    'Tu calificación ha sido enviada',
                    [{ text: 'OK', onPress: () => router.replace('/') }]
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

    return (
        <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <Icon name="close" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Calificar Viaje</Text>
                <View style={styles.headerSpacer} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Driver Info */}
                {rideData?.driver_info && (
                    <View style={styles.driverCard}>
                        <Image
                            source={{ uri: rideData.driver_info.avatar || 'https://via.placeholder.com/80x80/DDD/FFF?text=D' }}
                            style={styles.driverAvatar}
                        />
                        <Text style={styles.driverName}>{rideData.driver_info.name}</Text>
                        <Text style={styles.tripInfo}>
                            Viaje #{rideId} • {rideData.pickup_address?.split(',')[0]} → {rideData.destination_address?.split(',')[0]}
                        </Text>
                    </View>
                )}

                {/* Rating Stars */}
                <View style={styles.ratingSection}>
                    <Text style={styles.ratingTitle}>¿Cómo fue tu viaje?</Text>
                    <View style={styles.starsContainer}>
                        {[1, 2, 3, 4, 5].map((star) => (
                            <TouchableOpacity
                                key={star}
                                onPress={() => setRating(star)}
                            >
                                <Icon
                                    name={star <= rating ? 'star' : 'star-border'}
                                    size={48}
                                    color={star <= rating ? '#FFD700' : '#CCC'}
                                />
                            </TouchableOpacity>
                        ))}
                    </View>
                    <Text style={styles.ratingText}>{ratingTexts[rating]}</Text>
                </View>

                {/* Issues */}
                <View style={styles.issuesSection}>
                    <Text style={styles.issuesTitle}>¿Tuviste algún problema?</Text>
                    <View style={styles.issuesContainer}>
                        {issueOptions.map((issue) => (
                            <TouchableOpacity
                                key={issue.id}
                                style={[
                                    styles.issueItem,
                                    selectedIssues.includes(issue.id) && styles.issueItemSelected
                                ]}
                                onPress={() => handleIssueToggle(issue.id)}
                            >
                                <Icon
                                    name={issue.icon}
                                    size={20}
                                    color={selectedIssues.includes(issue.id) ? '#FFF' : '#666'}
                                />
                                <Text style={[
                                    styles.issueText,
                                    selectedIssues.includes(issue.id) && styles.issueTextSelected
                                ]}>
                                    {issue.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Comment */}
                <View style={styles.commentSection}>
                    <Text style={styles.commentTitle}>Comentarios adicionales</Text>
                    <TextInput
                        style={styles.commentInput}
                        placeholder="Cuéntanos más sobre tu experiencia (opcional)"
                        value={comment}
                        onChangeText={setComment}
                        multiline
                        numberOfLines={4}
                    />
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                    style={[styles.submitButton, loading && styles.disabledButton]}
                    onPress={handleSubmitRating}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <Text style={styles.submitButtonText}>Enviar Calificación</Text>
                    )}
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5',
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        flex: 1,
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
    },
    headerSpacer: {
        width: 40,
    },
    content: {
        flex: 1,
    },
    driverCard: {
        backgroundColor: '#FFF',
        alignItems: 'center',
        paddingVertical: 24,
        marginBottom: 12,
    },
    driverAvatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        marginBottom: 12,
    },
    driverName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    tripInfo: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
    },
    ratingSection: {
        backgroundColor: '#FFF',
        alignItems: 'center',
        paddingVertical: 24,
        marginBottom: 12,
    },
    ratingTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 16,
    },
    starsContainer: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    ratingText: {
        fontSize: 16,
        color: '#666',
        fontWeight: '600',
    },
    issuesSection: {
        backgroundColor: '#FFF',
        padding: 16,
        marginBottom: 12,
    },
    issuesTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 12,
    },
    issuesContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    issueItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginRight: 8,
        marginBottom: 8,
    },
    issueItemSelected: {
        backgroundColor: '#F44336',
    },
    issueText: {
        fontSize: 12,
        color: '#666',
        marginLeft: 4,
    },
    issueTextSelected: {
        color: '#FFF',
    },
    commentSection: {
        backgroundColor: '#FFF',
        padding: 16,
        marginBottom: 12,
    },
    commentTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 12,
    },
    commentInput: {
        borderWidth: 1,
        borderColor: '#E5E5E5',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 12,
        fontSize: 14,
        minHeight: 100,
        textAlignVertical: 'top',
    },
    submitButton: {
        backgroundColor: '#4CAF50',
        marginHorizontal: 16,
        borderRadius: 8,
        paddingVertical: 16,
        alignItems: 'center',
    },
    disabledButton: {
        backgroundColor: '#CCC',
    },
    submitButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
