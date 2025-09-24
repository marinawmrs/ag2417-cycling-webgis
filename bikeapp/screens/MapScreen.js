import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, ActivityIndicator, Text, Modal, Button } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import config from '../conn.json';

export default function MapScreen() {
  const mapRef = useRef(null);
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFeature, setSelectedFeature] = useState(null);

  // fetch geojson
  useEffect(() => {
      fetch(`http://${config.app.api_base_IP}:${config.app.port}/api/get_pumps_geojson`)
      .then(res => res.json())
      .then(data => {
        if (data?.features) {
          setFeatures(data.features);
        } else if (data[0]?.row_to_json?.features) {
          setFeatures(data[0].row_to_json.features);
        } else {
          console.error('Unexpected GeoJSON structure:', data);
        }
      })
      .catch(err => console.error('Error fetching GeoJSON:', err))
      .finally(() => setLoading(false));
  }, []);

  // fit bounds to markers
  useEffect(() => {
    if (features.length > 0 && mapRef.current) {
      const coords = features.map(f => ({
        latitude: f.geometry.coordinates[1],
        longitude: f.geometry.coordinates[0],
      }));
      mapRef.current.fitToCoordinates(coords, {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated: true,
      });
    }
  }, [features]);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: 59.324608,
          longitude: 18.06736,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        }}
      >
        {features.map((feature, index) => {
          const [lon, lat] = feature.geometry.coordinates;
          return (
            <Marker
              key={index}
              coordinate={{ latitude: lat, longitude: lon }}
              title={feature.properties?.name || 'Cykelpump'}
              description={feature.properties?.address || ''}
              onPress={() => setSelectedFeature(feature)}
            />
          );
        })}
      </MapView>

      {loading && (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#0000ff" />
        </View>
      )}

      {selectedFeature && (
        <Modal visible={true} transparent={true} animationType="slide">
          <View style={styles.modalBackground}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{selectedFeature.properties?.name}</Text>
              <Text>{selectedFeature.properties?.address}</Text>
              <Text>Type: {selectedFeature.properties?.type}</Text>
              <Button title="Close" onPress={() => setSelectedFeature(null)} />
            </View>
          </View>
        </Modal>
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
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 8,
    width: '80%',
  },
  modalTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 10,
  },
});
