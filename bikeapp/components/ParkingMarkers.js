import React from 'react';
import { Marker } from 'react-native-maps';
import { Image } from 'react-native';

export default function ParkingMarkers({ parkings }) {
  return (
    <>
      {parkings.map((feature, index) => {
        const [lon, lat] = feature.geometry.coordinates;
        return (
          <Marker
            key={`parking-${index}`}
            coordinate={{ latitude: lat, longitude: lon }}
            title={feature.properties?.name || 'Bicycle Parking'}
            description={"Number of spots: " + (feature.properties?.num_spots || 'N/A')}
            pinColor="blue"
          >
              <Image
                  source={require('../assets/park-icon.png')}
                  style={{ width: 20, height: 20 }}
                  resizeMode="contain"
              />
          </Marker>
        );
      })}
    </>
  );
}