// package imports
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { StyleSheet, View, ActivityIndicator, Text, Modal, Button, TouchableOpacity } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import { Switch } from 'react-native-switch';
import { Snackbar } from 'react-native-paper';
import * as turf from '@turf/turf';

import config from '../conn.json';

// components
import PumpDetailsModal from '../components/PumpDetailsModal';
import ParkDetailsModal from '../components/ParkDetailsModal';
import PumpMarkers from '../components/PumpMarkers';
import ParkingMarkers from '../components/ParkingMarkers';
import LightsMarkers from '../components/LightsMarkers';
import BottomNavigation from '../components/BottomNavigation';
import FilterModal from '../components/FilterModal';

// helper/fetching functions
import { fetchTwilightTimes, fetchPumps, fetchParkings, fetchLights, postBikeparkRating, postBikepumpRating, fetchPumpAverage, fetchParkingAverage, fetchParkingAverage_hour, fetchFilteredPumps, fetchFilteredParkings } from '../utils/fetchMapData';
import { darkMapStyle, lightMapStyle } from '../utils/mapStyles';
import useSnackbar from '../utils/useSnackbar';
import useNightMode from '../utils/useNightmode';


export default function MapScreen({ navigation }) {
    const mapRef = useRef(null);

    // state variables
    const { nightMode, setNightMode, lights, handleRegionChangeComplete } = useNightMode();
    const [pumps, setPumps] = useState([]);
    const [parkings, setParkings] = useState([]);
    const [darkNotifVisible, setDarkNotifVisible] = useState(true);
    const [visibleLayers, setVisibleLayers] = useState({ pumps: true, parking: true, paths: false, distance_pump: 5, distance_park: 1, rating: 0, safety: 0, availability: 0});
    const [selectedFeature, setSelectedFeature] = useState(null);
    const [bikepumpRatings, setBikepumpRatings] = useState({ working_status: null, vibe_rating: null });
    const [bikeparkRatings, setBikeparkRatings] = useState({ safety_rating: null, availability_rating: null, vibe_rating: null })
    const [averageBikepump, setAverageBikepump] = useState(null);
    const [averageBikepark, setAverageBikepark] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedFeatureType, setSelectedFeatureType] = useState(null);
    const now = new Date();
    const currentHour = now.getHours(); 
    const startHour = Math.floor(currentHour / 3) * 3; 
    const endHour = startHour + 3;                    

    // snackbar initialisation
    const {
        visible: snackbarVisible,
        message: snackbarMessage,
        type: snackbarType,
        showSnackbar,
        dismissSnackbar
    } = useSnackbar();

    useEffect(() => {
        console.log('Snackbar visible changed:', snackbarVisible);
      }, [snackbarVisible]);

    useEffect(() => {
        if (nightMode && darkNotifVisible) {
            showSnackbar('💡🔦 Remember to turn your bike lights on!', 'night');
            setDarkNotifVisible(false);
        }
    }, [nightMode]);


    // visibility toggles for "layers"
    function toggleLayer(layer) {
        setVisibleLayers(function (prev) {
            const updated = {
                pumps: prev.pumps,
                parking: prev.parking,
                paths: prev.paths,
                distance_pump: prev.distance_pump,
                distance_park: prev.distance_park,
                rating: prev.rating,
                safety: prev.safety,
                availability: prev.availability
            };
            updated[layer] = !prev[layer];
            return updated;
        });
    }

    // dismissing dark mode lights notification
    //const onDismissDarkNotif = () => setDarkNotifVisible(false);

    // submit & update pump rating
    async function submitBikepumpRating() {
        try {
            console.log(selectedFeature.properties)
            await postBikepumpRating(selectedFeature.properties.fid, bikepumpRatings);
            setSelectedFeature(null); 
            //alert('Rating submitted!');
            showSnackbar('✅ Rating submitted!', 'success');
            setBikepumpRatings({ working_status: null, vibe_rating: null });
        } catch (err) {
            console.error(err);
            alert('Error submitting rating ');
        }
    }

    // submit & update park rating
    async function submitBikeparkRating() {
        try {
            console.log(selectedFeature.properties)
            await postBikeparkRating(selectedFeature.properties.fid, bikeparkRatings);
            setSelectedFeature(null); 
            //alert('Rating submitted!');
            showSnackbar('✅ Rating submitted!', 'success');
            setBikeparkRatings({ safety_rating: null, availability_rating: null, vibe_rating: null });
        } catch (err) {
            console.error(err);
            alert('Error submitting rating ');
        }
    }
    // fetch new pumps & parkings based on filters
    async function applyFilters() {
        try {
            let location = await Location.getCurrentPositionAsync({});
            const { latitude, longitude } = location.coords;
            if (visibleLayers.pumps) {
                const filteredPumps = await fetchFilteredPumps(longitude, latitude, visibleLayers.distance_pump, visibleLayers.rating);
                setPumps(filteredPumps);
            } else {
                setPumps([]);
            }

            if (visibleLayers.parking) {
                const filteredParkings = await fetchFilteredParkings(longitude, latitude, visibleLayers.distance_park, visibleLayers.rating, visibleLayers.safety, visibleLayers.availability);
                setParkings(filteredParkings || []);
            } else {
                setParkings([]);
            }

        } catch (err) {
            console.error('Error fetching filtered data:', err);
        }
    }


    useEffect(() => {
        (async () => {
            // get user location
            let locationPermission = await Location.requestForegroundPermissionsAsync();
            if (locationPermission.status !== 'granted') {
                console.error('Location permission denied.');
                return;
            }
            let location = await Location.getCurrentPositionAsync({});
            const { latitude, longitude } = location.coords;

            // get pumps and parking data
            try {
                const pumpsData = await fetchPumps(latitude, longitude);
                setPumps(pumpsData);
                const parkingsData = await fetchParkings(latitude, longitude);
                setParkings(parkingsData);
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
                userInterfaceStyle={nightMode ? 'dark' : 'light'} // works for ios
                customMapStyle={nightMode ? darkMapStyle : lightMapStyle}
                onRegionChangeComplete={handleRegionChangeComplete}
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
                            setSelectedFeatureType('pump');
                            fetchPumpAverage(feature.properties.fid)
                                .then((avg) => {
                                    console.log('averageBikepump-lala', avg);
                                    setAverageBikepump(avg);
                                });

                        }}
                    />
                )}

                {/* Layer with parkings*/}
                {visibleLayers.parking && (
                    <ParkingMarkers
                        parkings={parkings}
                        onSelect={(feature) => {
                            setSelectedFeature(feature);
                            setSelectedFeatureType('parking');
                            fetchParkingAverage_hour(feature.properties.fid, startHour, endHour)
                                .then((avg) => {
                                    console.log('averageBikepark:', avg); // ← Debug-Ausgabe
                                    setAverageBikepark(avg);
                                });
                        }}
                    />
                )}

            </MapView>

            {/* Modal for pumps */}
            {selectedFeatureType === 'pump' && selectedFeature && (
                <PumpDetailsModal
                    visible={true}
                    feature={selectedFeature}
                    averageBikepump={averageBikepump}
                    bikepumpRatings={bikepumpRatings}
                    setBikepumpRatings={setBikepumpRatings}
                    onSubmit={submitBikepumpRating}
                    onClose={() => {
                        setSelectedFeature(null);
                        setSelectedFeatureType(null);
                        setAverageBikepump(null);
                        setBikepumpRatings({ working_status: null, vibe_rating: null });
                    }}
                />
            )}

            {/* Modal for parkings */}
            {selectedFeatureType === 'parking' && selectedFeature && (
                <ParkDetailsModal
                    visible={true}
                    feature={selectedFeature}
                    averageBikepark={averageBikepark}
                    bikeparkRatings={bikeparkRatings}
                    setBikeparkRatings={setBikeparkRatings}
                    startHour={startHour}
                    endHour={endHour}
                    onSubmit={submitBikeparkRating}
                    onClose={() => {
                        setSelectedFeature(null);
                        setSelectedFeatureType(null);
                        setAverageBikepark(null);
                        setBikeparkRatings({ safety_rating: null, availability_rating: null, vibe_rating: null });
                    }}
                />
            )}

            {/* Modal for filter selection*/}
            <FilterModal
                visible={modalVisible}
                onDismiss={() => setModalVisible(false)}
                visibleLayers={visibleLayers}
                setVisibleLayers={setVisibleLayers}
                onApply={() => {
                    applyFilters();
                    setModalVisible(false);
                }}
            />

            {/* Nightmode toggle & lights notification*/}
            <View style={{ flexDirection: 'row', justifyContent: 'flex-start', position: 'absolute', top: 50, left: 50, }}
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
                //position: 'absolute',
                bottom: '40%',
                left: '10%',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <Snackbar
                    visible={snackbarVisible}
                    onDismiss={dismissSnackbar}
                    duration={3000}
                    style={{
                        width: '80%',
                        backgroundColor:
                            snackbarType === 'success' ? '#4CAF50' :
                                snackbarType === 'error' ? '#F44336' :
                                snackbarType === 'night' ?  '#323232':

                                    '#2196F3'
                    }}
                >
                    {snackbarMessage}
                </Snackbar>
            </View>


            {/* Layer control*/}
            <BottomNavigation
                value={visibleLayers}
                onChange={toggleLayer}
                nightMode={nightMode}
                onOpenFilters={() => setModalVisible(true)}
            />

            <TouchableOpacity style={styles.routeButton} onPress={() => navigation.navigate('Route', {nightMode})}>
                <Text style={styles.routeButtonText}>Plan Route</Text>
            </TouchableOpacity>

        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    map: { flex: 1 },
    routeButton: {
        position: 'absolute',
        left: 20,
        right: 20,
        bottom: 100,
        backgroundColor: "#1E90FF",
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: "center",
    },
    routeButtonText: {
        color: "white",
        fontWeight: "700",
        fontSize: 16,
    },
});
