// package imports
import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, ActivityIndicator, Text, Modal, Button } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import { Switch } from 'react-native-switch';
import { Snackbar } from 'react-native-paper';
import * as turf from '@turf/turf';

import config from '../conn.json';

// components
import PumpDetailsModal from '../components/PumpDetailsModal';
import PumpMarkers from '../components/PumpMarkers';
import ParkingMarkers from '../components/ParkingMarkers';
import LightsMarkers from '../components/LightsMarkers';
import BottomNavigation from '../components/BottomNavigation';

// helper/fetching functions
import {fetchTwilightTimes, fetchPumps, fetchParkings, fetchLights} from '../utils/fetchMapData';
import { submitPumpRating, fetchPumpAverage, fetchParkingAverage } from '../utils/fetchRatings';
import { darkMapStyle, lightMapStyle } from '../utils/mapStyles';


export default function MapScreen({ nightMode, setNightMode }) {
    const mapRef = useRef(null);

    // state variables
    const [pumps, setPumps] = useState([]);
    const [parkings, setParkings] = useState([]);
    const [lights, setLights] = useState([]);
    const [darkNotifVisible, setDarkNotifVisible] = useState(true);
    const [visibleLayers, setVisibleLayers] = useState({ pumps: true, parking: false, paths: false });
    const [selectedFeature, setSelectedFeature] = useState(null);
    const [bikepumpRatings, setBikepumpRatings] = useState({ working_status: null, vibe_rating: null });
    const [bikeparkRatings, setBikeparkRatings] = useState({ working_status: null, vibe_rating: null });
    const [averageBikepump, setAverageBikepump] = useState(null);
    const [averageBikepark, setAverageBikepark] = useState(null);


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

    // submit & update pump rating
    async function submitBikepumpRating() {
        try {
            await submitPumpRating(selectedFeature.properties.fid, bikepumpRatings);
            alert('Rating submitted!');
            setBikepumpRatings({ working_status: null, vibe_rating: null });
        } catch (err) {
            console.error(err);
            alert('Error submitting rating');
        }
    }

    useEffect(() => {
        (async () => {
            // get user location
            let locationPermission = await Location.requestForegroundPermissionsAsync();
            if (locationPermission.status !=='granted'){
            console.error('Location permission denied.');
            return;
            }
            let location = await Location.getCurrentPositionAsync({});
            const { latitude, longitude } = location.coords;

            // check for daylight/nightmode
            try {
                const { sunRise, sunSet } = await fetchTwilightTimes(latitude, longitude);
                const now = new Date();
                const isDay = now >= sunRise && now <= sunSet;
                setNightMode(!isDay);
                console.log('Twilight start & end today:', sunRise, sunSet)
            } catch (e) {
                console.error(e);
            }

            // get pumps and parking data
            try {
                const pumpsData = await fetchPumps(latitude, longitude);
                setPumps(pumpsData);
                const parkingsData = await fetchParkings(latitude, longitude);
                setParkings(parkingsData);

                // get bounding box of pumps & parking locations
                const fetchedPointsColl = turf.featureCollection([...pumps, ...parkings])
                const fetchedPointsBbox = turf.bbox(fetchedPointsColl);
                console.log(fetchedPointsBbox, fetchedPointsColl)

                // lights
                const lightsData = await fetchLights(fetchedPointsColl, fetchedPointsBbox );
                setLights(lightsData);
            } catch (e) {
                console.error('Error fetching map (pumps, parkings, lights) data:', e);
            }

        })();
    }, []);

    return (
        <View style={styles.container}>
            {/* Map view*/}
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

                {/* Layer with lights*/}
                {nightMode && (<LightsMarkers lights={lights} />)}

                {/* Layer with pumps*/}
                {visibleLayers.pumps && (
                    <PumpMarkers
                        pumps={pumps}
                        onSelect={(feature) => {
                            setSelectedFeature(feature);
                            fetchPumpAverage(feature.properties.fid).then(setAverageBikepump);
                        }}
                    />
                )}

                {/* Layer with parkings*/}
                {visibleLayers.parking && (
                <ParkingMarkers
                    parkings={parkings}
                    onSelect={(feature) => {
                        setSelectedFeature(feature);
                        fetchParkingAverage(feature.properties.fid).then(setAverageBikepark);
                    }}
                />
                )}

            </MapView>

            {/* Modal for pumps*/}
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

            {/* Nightmode toggle & lights notification*/}
            <View style={{flexDirection: 'row', justifyContent: 'flex-start',position: 'absolute',top: 50, left: 50,}}
            >
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
                    action={{label: 'Hide'}}
                    style={{width: '80%'}}
                >
                    💡🔦 Remember to turn your bike lights on!
                </Snackbar>
            </View>

            {/* Layer control*/}
            <BottomNavigation value={visibleLayers} onChange={toggleLayer} nightMode={nightMode} />

        </View>
        );
    }

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
});
