import React, { useEffect, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, Button, StyleSheet } from 'react-native';
import { fetchParkingAverage_hour } from '../utils/fetchMapData';

const timeWindows = [
    { label: '00-03', start: 0, end: 3 },
    { label: '03-06', start: 3, end: 6 },
    { label: '06-09', start: 6, end: 9 },
    { label: '09-12', start: 9, end: 12 },
    { label: '12–15', start: 12, end: 15 },
    { label: '15-18', start: 15, end: 18 },
    { label: '18-21', start: 18, end: 21 },
    { label: '21-24', start: 21, end: 24 }
];




export default function ParkDetailsModal({
    visible,
    feature,
    averageBikepark,
    bikeparkRatings,
    setBikeparkRatings,
    startHour,
    endHour,
    onSubmit,
    onClose
}) {
    if (!feature) return null;
    const [selectedWindow, setSelectedWindow] = useState({ start: startHour, end: endHour });
    const currentLabel = timeWindows.find(w => w.start === startHour && w.end === endHour)?.label;
    const [expanded, setExpanded] = useState(false);
    const [availabilityByWindow, setAvailabilityByWindow] = useState({});


    useEffect(() => {
        async function loadAllAvailability() {
            const results = {};

            for (const window of timeWindows) {
                try {
                    const res = await fetchParkingAverage_hour(
                        feature.properties.fid,
                        window.start,
                        window.end
                    );
                    results[window.label] = res.avg_availability ?? null;
                } catch (err) {
                    console.error(`Fehler bei ${window.label}:`, err);
                    results[window.label] = null;
                }
            }

            setAvailabilityByWindow(results);
        }

        if (feature?.properties?.fid) {
            loadAllAvailability();
        }
    }, [feature]);

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
                            <View style={styles.row}>
                                <Text>
                                    Availability ({currentLabel}): {averageBikepark.avg_availability ?? '–'}
                                </Text>
                                <TouchableOpacity onPress={() => setExpanded(!expanded)}>
                                    <Text style={{ marginLeft: 8 }}>{expanded ? '▲' : '▼'}</Text>
                                </TouchableOpacity>
                            </View>

                            {expanded && (
                                <View style={{ marginLeft: 75 }}>
                                    {timeWindows.map((tw, i) => {
                                        const value = availabilityByWindow[tw.label];
                                        const isCurrent = tw.start === startHour && tw.end === endHour;

                                        return (
                                            <View key={i} style={{ paddingVertical: 4 }}>
                                                <Text style={{
                                                    fontWeight: isCurrent ? 'bold' : 'normal',
                                                    color: isCurrent ? '#007AFF' : 'black'
                                                }}>
                                                    {tw.label}: {value ?? '–'}
                                                </Text>
                                            </View>
                                        );
                                    })}
                                </View>
                            )}


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
