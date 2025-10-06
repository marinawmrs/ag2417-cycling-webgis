import React from 'react';
import { Modal, View, Text, TouchableOpacity, Button, StyleSheet } from 'react-native';

export default function ParkDetailsModal({
    visible,
    feature,
    averageBikepark,
    bikeparkRatings,
    setBikeparkRatings,
    onSubmit,
    onClose
}) {
    if (!feature) return null;

    return (
        <Modal visible={visible} transparent animationType="slide">
            <View style={styles.modalBackground}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>
                        {feature.properties?.name}
                    </Text>

                    {averageBikepark ? ( //result.rows[0].avg_vibe
                        <View style={{ marginTop: 10 }}>
                            <Text style={{ fontWeight: 'bold' }}>
                                Ratings (last 10 weeks):
                            </Text>
                            <Text>Safety: {averageBikepark.avg_safety}</Text>
                            <Text>Availability: {averageBikepark.avg_availability}</Text>
                            <Text>Vibe: {averageBikepark.avg_vibe}</Text>

                            <Text style={{ marginTop: 10, fontWeight: 'bold' }}>
                                Your Rating:
                            </Text>
                            <Text> 🔒 Safety</Text>
                            <View style={styles.row}>
                                {[1, 2, 3, 4, 5].map((value) => {
                                    const isSelected = bikeparkRatings.safety_rating === value;
                                    return (
                                        <TouchableOpacity
                                            key={value}
                                            onPress={() =>
                                                setBikeparkRatings((prev) => ({
                                                    ...prev,
                                                    safety_rating: value
                                                }))
                                            }
                                            style={[
                                                styles.optionButton,
                                                { backgroundColor: isSelected ? '#4CAF50' : '#eee' }
                                            ]}
                                        >
                                            <Text style={{ color: isSelected ? 'white' : 'black' }}>
                                                {value}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>

                            <Text>📊Availabilty</Text>
                            <View style={styles.row}>
                                {[1, 2, 3, 4, 5].map((value) => {
                                    const isSelected = bikeparkRatings.availability_rating === value;
                                    return (
                                        <TouchableOpacity
                                            key={value}
                                            onPress={() =>
                                                setBikeparkRatings((prev) => ({
                                                    ...prev,
                                                    availability_rating: value
                                                }))
                                            }
                                            style={[
                                                styles.optionButton,
                                                { backgroundColor: isSelected ? '#4CAF50' : '#eee' }
                                            ]}
                                        >
                                            <Text style={{ color: isSelected ? 'white' : 'black' }}>
                                                {value}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>

                            <Text>🎵 Vibe</Text>
                            <View style={styles.row}>
                                {[1, 2, 3, 4, 5].map((value) => {
                                    const isSelected = bikeparkRatings.vibe_rating === value;
                                    return (
                                        <TouchableOpacity
                                            key={value}
                                            onPress={() =>
                                                setBikeparkRatings((prev) => ({
                                                    ...prev,
                                                    vibe_rating: value
                                                }))
                                            }
                                            style={[
                                                styles.optionButton,
                                                { backgroundColor: isSelected ? '#4CAF50' : '#eee' }
                                            ]}
                                        >
                                            <Text style={{ color: isSelected ? 'white' : 'black' }}>
                                                {value}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>
                    ) : (
                        <Text style={{ marginTop: 10 }}>Loading average ratings…</Text>
                    )}
                    <Button title="Submit Rating" onPress={onSubmit} />
                    <Button title="Close" onPress={onClose} />
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalBackground: {
        flex: 1,
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)'
    },
    modalContent: {
        margin: 20,
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 20
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold'
    },
    row: {
        flexDirection: 'row',
        marginVertical: 5
    },
    optionButton: {
        padding: 10,
        marginRight: 10,
        borderRadius: 5
    }
});
