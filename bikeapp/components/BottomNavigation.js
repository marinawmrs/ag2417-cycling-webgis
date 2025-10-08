import React, { useState } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { ToggleButton } from 'react-native-paper';

export default function BottomNavigation({ value, onChange, nightMode, onOpenFilters }) {
    const activeColor = nightMode ? 'rgba(200,200,200,0.4)' :'rgba(100,100,100,0.4)';
    const activeColor_filter = nightMode ? 'rgba(200,200,200,0.8)' :'rgba(100,100,100,0.8)';

    return (
        <View style={styles.container}>
            <ToggleButton
                icon={() => (
                    <Image
                      source={require('../assets/pump-icon.png')}
                      style={{ width: 24, height: 24 }}
                      resizeMode="contain"
                    />
                )}
                value="pumps"
                status={value.pumps ? 'checked' : 'unchecked'}
                onPress={() => onChange('pumps')}
                style={{backgroundColor: value.pumps ? activeColor  : 'transparent'}}
            />
            <ToggleButton
                icon={() => (
                    <Image
                      source={require('../assets/park-icon.png')}
                      style={{ width: 24, height: 24 }}
                      resizeMode="contain"
                    />
                )}
                value="parking"
                status={value.parking ? 'checked' : 'unchecked'}
                onPress={() => onChange('parking')}
                style={{backgroundColor: value.parking ? activeColor  : 'transparent'}}
            />
            <ToggleButton
                icon="filter"
                value="paths"
                status={value.paths ? 'unchecked' : 'unchecked'}
                onPress={() => {
                    onChange('paths');
                    onOpenFilters();
                }}
                iconColor={activeColor_filter}
            />

        </View>


    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        position: 'absolute',
        bottom: 50,
        left: 0,
        right: 0,
    },
});