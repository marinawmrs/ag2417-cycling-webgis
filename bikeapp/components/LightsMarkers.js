// components/LightsMarkers.js
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Marker } from 'react-native-maps';
import * as turf from '@turf/turf';

// note: multiple views for mroe visible shadow
export default function LightsMarkers({ lights }) {
  return (
    <>
      {lights.map((feature, index) => {
        const centroid = turf.center(feature).geometry.coordinates;
        const [lon, lat] = centroid;
        const lightCount = feature.properties.lightCount;
        const opacity = 1; //Math.min(0.01 + lightCount * 0.05, 0.5);
        const size = 7; // Math.min(50 + lightCount * 2, 100);

        return (
          <Marker
            key={`light-${index}`}
            coordinate={{ latitude: lat, longitude: lon }}
            tracksViewChanges={false}
          >
          <View style={{
            shadowColor: 'yellow',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 1,
            shadowRadius:  6,
          }}>
          <View style={{
            shadowColor: 'yellow',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 1,
            shadowRadius:  5,
          }}>
          <View style={{
            shadowColor: 'yellow',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 1,
            shadowRadius:  4,
          }}>
            <View style={{
                width: size,
                height: size,
                borderRadius: size / 2,
                backgroundColor: `rgba(255, 255, 0, ${opacity})`,
                borderWidth: 0,
                shadowColor: 'yellow',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 1,
                shadowRadius:  5,
                elevation: 5,
              }} />
          </View>
          </View>
          </View>
          </Marker>
        );
      })}
    </>
  );
}
