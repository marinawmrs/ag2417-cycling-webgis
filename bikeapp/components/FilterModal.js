import React, { useState } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Modal, Portal, Button, Chip } from 'react-native-paper';
import Slider from '@react-native-community/slider';

export default function FilterModal({ visible, onDismiss, visibleLayers, setVisibleLayers, onApply }) {
    const toggleType = (type) => {
        setVisibleLayers((prev) => ({ ...prev, [type]: !prev[type] }));
    };

    return (
        <Portal>
            <Modal visible={visible} transparent onDismiss={onDismiss} animationType="slide">
                <View style={styles.modalBackground}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>
                            Filter pumps and parking spots:
                        </Text>

                        <View style={styles.row}>
                            <Chip
                                icon={() => (
                                    <Image source={require('../assets/pump-icon.png')} style={styles.icon}/>
                                )}
                                mode="flat"
                                selected={ visibleLayers.pumps}
                                onPress={() => toggleType('pumps')}
                                style={! visibleLayers.pumps && { backgroundColor: '#f5f5f5' }}
                            >Pumps</Chip>
                            <Chip
                                icon={() => (
                                    <Image source={require('../assets/park-icon.png')} style={styles.icon}/>
                                )}
                                mode="flat"
                                selected={ visibleLayers.parking}
                                onPress={() => toggleType('parking')}
                                style={! visibleLayers.parking && { backgroundColor: '#f5f5f5' }}
                            >Parkings</Chip>
                        </View>

                        <View style={styles.section}>
                            <Text>Filter by pump distance (km): { visibleLayers.distance_pump.toFixed(2)}</Text>
                            <Slider
                                style={{ width: '100%' }}
                                minimumValue={0.05}
                                maximumValue={5}
                                step={0.5}
                                value={ visibleLayers.distance_pump}
                                onValueChange={(val) => setVisibleLayers((prev) => ({ ...prev, distance_pump: val }))}
                            />
                        </View>

                        {visibleLayers.parking &&
                            (<View style={styles.section}>
                                <Text>Filter by park distance (km): { visibleLayers.distance_park.toFixed(2)}</Text>
                                <Slider
                                    style={{ width: '100%' }}
                                    minimumValue={0.05}
                                    maximumValue={2}
                                    step={0.2}
                                    value={ visibleLayers.distance_park}
                                    onValueChange={(val) => setVisibleLayers((prev) => ({ ...prev, distance_park: val }))}
                                />
                            </View>)
                        }

                        <View style={styles.section}>
                            <Text>Filter by average rating: { visibleLayers.rating.toFixed(2)}</Text>
                            <Slider
                                style={{ width: '100%' }}
                                minimumValue={0}
                                maximumValue={5}
                                step={1}
                                value={ visibleLayers.rating}
                                onValueChange={(val) => setVisibleLayers((prev) => ({ ...prev, rating: val }))}
                            />
                        </View>

                        {visibleLayers.parking &&
                            (<View>
                                <View style={styles.section}>
                                    <Text>Filter by average parking safety: { visibleLayers.safety.toFixed(2)}</Text>
                                    <Slider
                                        style={{ width: '100%' }}
                                        minimumValue={0}
                                        maximumValue={5}
                                        step={1}
                                        value={ visibleLayers.safety}
                                        onValueChange={(val) => setVisibleLayers((prev) => ({ ...prev, safety: val }))}
                                    />
                                </View>
                                <View style={styles.section}>
                                    <Text>Filter by average parking availability: { visibleLayers.availability.toFixed(2)}</Text>
                                    <Slider
                                        style={{ width: '100%' }}
                                        minimumValue={0}
                                        maximumValue={5}
                                        step={1}
                                        value={ visibleLayers.availability}
                                        onValueChange={(val) => setVisibleLayers((prev) => ({ ...prev, availability: val }))}
                                    />
                                </View>
                            </View>
                            )
                        }

                        <View style={styles.row}>
                            <Button onPress={onDismiss}>Cancel</Button>
                            <Button
                                mode="contained"
                                onPress={onApply}
                            >Apply</Button>
                        </View>
                    </View>
                </View>
            </Modal>
        </Portal>
    );
}

const styles = StyleSheet.create({
    modalBackground: {
        justifyContent: 'center',
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
        justifyContent: 'space-around',
        marginVertical: 5,
    },
    icon: {
        width: 20,
        height: 20,
    },
});
