import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, ActivityIndicator, Text, Modal, Button } from 'react-native';
import { TouchableOpacity } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import config from '../conn.json';


export default function MapScreen() {
  const mapRef = useRef(null);
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [bikepumpRatings, setBikepumpRatings] = useState({ working_status: null, vibe_rating: null });
  const [averageBikepump, setAverageBikepump] = useState(null);

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

  async function submitBikepumpRating() {
    try {
      await fetch(`http://${config.app.api_base_IP}:${config.app.port}/api/rate_pump`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pump_id: selectedFeature.properties.fid,
          working_status: bikepumpRatings.working_status,
          vibe_rating: bikepumpRatings.vibe_rating,
        }),
      });
      alert('Rating submitted!');
      setBikepumpRatings({ working_status: null, vibe_rating: null });
    } catch (err) {
      console.error('Error submitting bikepump rating:', err);
      alert('Error submitting rating');
    }
  }



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
              onPress={() => {
                setSelectedFeature(feature);
                fetch(`http://${config.app.api_base_IP}:${config.app.port}/api/pump_average/${feature.properties.fid}`)
                  .then((res) => res.json())
                  .then(setAverageBikepump)
                  .catch((err) => console.error('Error fetching bikepump average:', err));
              }}
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

              {averageBikepump ? (
                <View style={{ marginTop: 10 }}>
                  <Text style={{ fontWeight: 'bold' }}>Ratings (last 10 weeks):</Text>
                  <Text>Status: {averageBikepump.majority_working === 1 ? ' Working' : ' Broken'}</Text>
                  <Text>Vibe: {averageBikepump.avg_vibe}</Text>
                  <Text style={{ marginTop: 10, fontWeight: 'bold' }}>Your Rating:</Text>

                  <Text>🛠 Working status</Text>
                  <View style={{ flexDirection: 'row', marginBottom: 10 }}>
                    {[1, 0].map((value) => {
                      const isSelected = bikepumpRatings.working_status === value;
                      return (
                        <TouchableOpacity
                          key={value}
                          onPress={() => setBikepumpRatings((prev) => ({ ...prev, working_status: value }))}
                          style={{
                            backgroundColor: isSelected ? '#4CAF50' : '#eee',
                            padding: 10,
                            marginRight: 10,
                            borderRadius: 5,
                          }}
                        >
                          <Text style={{ color: isSelected ? 'white' : 'black' }}>
                            {value === 1 ? ' Working' : ' Broken'}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <Text>🎵 Vibe</Text>
                  <View style={{ flexDirection: 'row', marginBottom: 10 }}>
                    {[1, 2,3,4,5].map((value) => {
                      const isSelected = bikepumpRatings.vibe_rating === value;
                      return (
                        <TouchableOpacity
                          key={value}
                          onPress={() => setBikepumpRatings((prev) => ({ ...prev, vibe_rating: value }))}
                          style={{
                            backgroundColor: isSelected ? '#4CAF50' : '#eee',
                            padding: 10,
                            marginRight: 10,
                            borderRadius: 5,
                          }}
                        >
                          <Text style={{ color: isSelected ? 'white' : 'black' }}>
                            {value.toString()}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                 

                </View>
              ) : (
                <Text style={{ marginTop: 10 }}>Loading average ratings…</Text>
              )}
              <Button title="Submit Rating" onPress={submitBikepumpRating} />
              <Button title="Close" onPress={() => {
                setSelectedFeature(null);
                setAverageBikepump(null);
                setBikepumpRatings({ working_status: null, vibe_rating: null });
              }} />
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
