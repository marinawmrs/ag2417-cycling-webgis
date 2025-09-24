import React, { useEffect, useState } from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

export default function HomeScreen() {
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://192.168.137.1:3000/api/get_markers_geojson')
      .then((res) => res.json())
      .then((data) => {
        const geojson = data[0]?.row_to_json;
        if (geojson?.type === 'FeatureCollection') {
          setFeatures(geojson.features);
        } else {
          console.error('Unexpected GeoJSON structure:', geojson);
        }
      })
      .catch((err) => console.error('GeoJSON fetch error:', err))
      .finally(() => setLoading(false));
  }, []);
  
  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: 59.324608,
          longitude: 18.06736,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        }}
      >
        {features.map((feature, index) => {
          const coords = feature.geometry.coordinates;
          const [lon, lat] = coords;

          return (
            <Marker
              key={index}
              coordinate={{ latitude: lat, longitude: lon }}
              title={feature.properties?.name || 'GeoJSON Marker'}
              description={feature.properties?.description || ''}
            />
          );
        })}
      </MapView>

      {loading && (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#0000ff" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  loader: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -25,
    marginTop: -25,
  },
});
