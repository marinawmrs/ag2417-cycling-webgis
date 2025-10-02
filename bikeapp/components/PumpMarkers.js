import React from 'react';
import { Marker } from 'react-native-maps';
import { Image } from 'react-native';
import config from '../conn.json';

export default function PumpMarkers({ pumps, onSelect }) {
  return (
    <>
      {pumps.map((feature, index) => {
        const [lon, lat] = feature.geometry.coordinates;
        return (
          <Marker
            key={`pump-${index}`}
            coordinate={{ latitude: lat, longitude: lon }}
            title={'Bike Pump Station'}
            description={feature.properties?.name || ''}
            onPress={() => {
              onSelect(feature);
            }}
          >
              <Image
                  source={require('../assets/pump-icon.png')}
                  style={{ width: 30, height: 30 }}
                  resizeMode="contain"
                />
          </Marker>
        );
      })}
    </>
  );
}