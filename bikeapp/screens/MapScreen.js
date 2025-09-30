import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, ActivityIndicator, Text, Modal, Button } from 'react-native';
import { TouchableOpacity } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';

import config from '../conn.json';

// components
import PumpDetailsModal from '../components/PumpDetailsModal';
import PumpMarkers from '../components/PumpMarkers';
import ParkingMarkers from '../components/ParkingMarkers';
import BottomNavigation from '../components/BottomNavigation';

export default function MapScreen({ navigation }) {
  const mapRef = useRef(null);
  const [pumps, setPumps] = useState([]);
  const [parkings, setParkings] = useState([]);
  const [bikePaths, setBikePaths] = useState([]);
  const [loadingPumps, setLoadingPumps] = useState(true);
  const [loadingParkings, setLoadingParkings] = useState(true);

  const [visibleLayers, setVisibleLayers] = useState({ pumps: true, parking: false, paths: false });

  function toggleLayer(layer) {
    setVisibleLayers(function(prev) {
    const updated = {
        pumps: prev.pumps,
        parking: prev.parking,
        paths: prev.paths,
    };
    updated[layer] = !prev[layer];
    return updated;
    });
 }

  const [selectedFeature, setSelectedFeature] = useState(null);
  const [bikepumpRatings, setBikepumpRatings] = useState({ working_status: null, vibe_rating: null });
  const [averageBikepump, setAverageBikepump] = useState(null);
  const [bikeparkRatings, setBikeparkRatings] = useState({ working_status: null, vibe_rating: null });
  const [averageBikepark, setAverageBikepark] = useState(null);

//  // fetch wfs geojson
//  useEffect(() => {
//    fetch(`http://${config.app.api_base_IP}:${config.app.port}/api/get_wfs_data`)
//      .then(res => res.json())
//      .then(data => {
//        if (data?.features) {
//          setBikePaths(data.features);
//        } else {
//          console.error('Unexpected WFS:', data);
//        }
//      })
//      .catch(err => console.error('Error fetching WFS :', err))
//  }, []);

//  // fetch geojson for all bike pumps
//  useEffect(() => {
//    fetch(`http://${config.app.api_base_IP}:${config.app.port}/api/get_pumps_geojson`)
//      .then(res => res.json())
//      .then(data => {
//        if (data?.features) {
//          setPumps(data.features);
//        } else if (data[0]?.row_to_json?.features) {
//          setPumps(data[0].row_to_json.features);
//        } else {
//          console.error('Unexpected GeoJSON structure:', data);
//        }
//      })
//      .catch(err => console.error('Error fetching pumps:', err))
//      .finally(() => setLoadingPumps(false));
//  }, []);

  // fetch geojson for bike parking spots (x closest)
    useEffect(() => {
        (async () => {
            // get location
            let locationPermission = await Location.requestForegroundPermissionsAsync();
            if (locationPermission.status !=='granted'){
                console.error('Location permission denied.');
                return;
            }
            let location = await Location.getCurrentPositionAsync({});

            // get x closest pumps
            const pumpsRes = await fetch(`http://${config.app.api_base_IP}:${config.app.port}/api/get_pumps_geojson_closest?lon=${location.coords.longitude}&lat=${location.coords.latitude}`);
            const pumpsData = await pumpsRes.json();
            if (pumpsData?.features) {
                setPumps(pumpsData.features);
            } else if (pumpsData[0]?.row_to_json?.features) {
                setPumps(parkingData[0].row_to_json.features);
            } else {
                console.error('Unexpected pumps GeoJSON:', pumpsData);
            }
            setLoadingPumps(false);

            // get x closest parking
            const parkingRes = await fetch(`http://${config.app.api_base_IP}:${config.app.port}/api/get_parking_geojson_closest?lon=${location.coords.longitude}&lat=${location.coords.latitude}`);
            const parkingData = await parkingRes.json();
            if (parkingData?.features) {
                setParkings(parkingData.features);
            } else if (parkingData[0]?.row_to_json?.features) {
                setParkings(parkingData[0].row_to_json.features);
            } else {
                console.error('Unexpected parking GeoJSON:', parkingData);
            }
            setLoadingParkings(false);

        })();
    }, []);

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
      console.error('Error submitting bike-pump rating:', err);
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
        showsUserLocation
        showsMyLocationButton
      >
        {visibleLayers.pumps && (
            <PumpMarkers
              pumps={pumps}
              onSelect={(feature) => {
                setSelectedFeature(feature);
                fetch(`http://${config.app.api_base_IP}:${config.app.port}/api/pump_average/${feature.properties.fid}`)
                  .then((res) => res.json())
                  .then(setAverageBikepump)
                  .catch((err) => console.error('Error fetching bikepump average:', err));
              }}
            />
        )}

        {visibleLayers.parking && (
            <ParkingMarkers
              parkings={parkings}
              onSelect={(feature) => {
                setSelectedFeature(feature);
                fetch(`http://${config.app.api_base_IP}:${config.app.port}/api/parking_average/${feature.properties.fid}`)
                  .then((res) => res.json())
                  .then(setAverageBikepark)
                  .catch((err) => console.error('Error fetching parking spot average:', err));
              }}
            />
        )}

      </MapView>

      <PumpDetailsModal
        visible={!!selectedFeature}
        feature={selectedFeature}
        averageBikepump={averageBikepump}
        bikepumpRatings={bikepumpRatings}
        setBikepumpRatings={setBikepumpRatings}
        onSubmit={submitBikepumpRating}
        onClose={() => {
          setSelectedFeature(null);
          setAverageBikepump(null);
          setBikepumpRatings({ working_status: null, vibe_rating: null });
        }}
      />

      <BottomNavigation value={visibleLayers} onChange={toggleLayer} />

        {/* Route button */}
        <View style={styles.routeButton}>
        <Button title="Plan Route" onPress={() => navigation.navigate('Route')} />
      </View>
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
