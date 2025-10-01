import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, ActivityIndicator, Text, Modal, Button } from 'react-native';
import { TouchableOpacity } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import { Switch } from 'react-native-switch';
import { Snackbar } from 'react-native-paper';


import config from '../conn.json';

// components
import PumpDetailsModal from '../components/PumpDetailsModal';
import PumpMarkers from '../components/PumpMarkers';
import ParkingMarkers from '../components/ParkingMarkers';
import BottomNavigation from '../components/BottomNavigation';

export default function MapScreen({ nightMode, setNightMode }) {
  const mapRef = useRef(null);

  const darkMapStyle = [
      { elementType: "geometry", stylers: [{ color: "#212121" }] },
      { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
      { elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
      { elementType: "labels.text.stroke", stylers: [{ color: "#212121" }] },
      { featureType: "road", elementType: "geometry", stylers: [{ color: "#383838" }] },
      { featureType: "water", elementType: "geometry", stylers: [{ color: "#000000" }] }
  ];
  const lightMapStyle = []
  const [darkNotifVisible, setDarkNotifVisible] = useState(true);


  const [pumps, setPumps] = useState([]);
  const [parkings, setParkings] = useState([]);
  const [lights, setLights] = useState([]);

  const [loadingPumps, setLoadingPumps] = useState(true);
  const [loadingParkings, setLoadingParkings] = useState(true);

  const [visibleLayers, setVisibleLayers] = useState({ pumps: true, parking: false, paths: false });

  // visibility toggles for "layers"
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

  // dismissing dark mode lights notification
  const onDismissDarkNotif = () => setDarkNotifVisible(false);

  const [selectedFeature, setSelectedFeature] = useState(null);
  const [bikepumpRatings, setBikepumpRatings] = useState({ working_status: null, vibe_rating: null });
  const [averageBikepump, setAverageBikepump] = useState(null);
  const [bikeparkRatings, setBikeparkRatings] = useState({ working_status: null, vibe_rating: null });
  const [averageBikepark, setAverageBikepark] = useState(null);

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

            const sunRes = await fetch(`https://api.sunrise-sunset.org/json?lat=${location.coords.latitude}&lng=${location.coords.longitude}&date=today&formatted=0`);
            const sunData = await sunRes.json();
            if(sunData.status === 'OK') {
                const sunRise = new Date(sunData.results.civil_twilight_begin);
                const sunSet = new Date(sunData.results.civil_twilight_end);
                const now = new Date();
                const isDay = now >= sunRise && now <= sunSet;
                setNightMode(!isDay);
                console.log('Twilight start & end today:', sunRise, sunSet)
            } else {
                console.error('Error fetching daylight API')
            }


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

            // get lights
//            console.log('fetching lights')
//            const lightsRes = await fetch(`http://${config.app.api_base_IP}:${config.app.port}/api/get_wfs_data_light`);
//            console.log(lightsRes)
//            const lightsData = await lightsRes.json();
//            if (lightsData?.features) {
//              console.log("Lights:", lightsData.features.slice(0, 1));
//              setLights(lightsData.features);
//            } else {
//              console.error("Unexpected lights data:", lightsData);
//            }

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
        userInterfaceStyle ={nightMode ? 'dark' : 'light'} // works for ios
        customMapStyle={nightMode ? darkMapStyle : lightMapStyle}
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

      <View style={{
        flexDirection: 'row',
        justifyContent: 'flex-start',
        position: 'absolute',
        top: 50,
        left: 50,
      }}>
          <Switch
            value={nightMode}
            onValueChange={() => setNightMode(prev => !prev)}
            disabled={false}
            activeText={"🌙"}
            inActiveText={"☀️"}
            backgroundActive={'#7475b6'}
            backgroundInactive={'#c9ebff'}
          />
      </View>

      <View style={{
        bottom: '50%',
        left: '10%',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
          <Snackbar
            visible={nightMode && darkNotifVisible}
            onDismiss = {onDismissDarkNotif}
            action={{
              label: 'Hide'
            }}
            style={{
                width: '80%',
            }}>
            💡🔦 Remember to turn your bike lights on!
          </Snackbar>
      </View>

      <BottomNavigation value={visibleLayers} onChange={toggleLayer} nightMode={nightMode} />

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
});
