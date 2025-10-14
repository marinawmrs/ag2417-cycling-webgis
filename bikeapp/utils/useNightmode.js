import { useState,useEffect,useCallback } from 'react';
import * as Location from 'expo-location';
import { fetchTwilightTimes,fetchLights } from './fetchMapData';

export default function useNightMode(initialNightMode) {
    const [nightMode, setNightMode] = useState(initialNightMode ?? false);
    const [lights, setLights] = useState([]);

    useEffect(() => {
        if (initialNightMode !== undefined) return;
        (async () => {
            let locationPermission = await Location.requestForegroundPermissionsAsync();
            if (locationPermission.status !== 'granted') {
                console.error('Location permission denied.');
                return;
            }
            let location = await Location.getCurrentPositionAsync({});
            const { latitude, longitude } = location.coords;

            // check whether after dark
            try {
                const { sunRise, sunSet } = await fetchTwilightTimes(latitude, longitude);
                const now = new Date();
                const isDay = now >= sunRise && now <= sunSet;
                setNightMode(!isDay);
                console.log('Twilight start & end today:', sunRise, sunSet)
            } catch (e) {
                console.error(e);
            }
        })();
    }, []);

    // check whether night mode & zoomed in, for lights to fetch
    const handleRegionChangeComplete = useCallback(async (region) => {
            const zoom = Math.log2(360 / region.longitudeDelta);
            console.log(zoom)
            if (nightMode && zoom > 17) {
                console.log("zoomed in & night")
                try {
                    const { latitude, longitude, latitudeDelta, longitudeDelta } = region;
                    const minLat = latitude - latitudeDelta / 2;
                    const maxLat = latitude + latitudeDelta / 2;
                    const minLon = longitude - longitudeDelta / 2;
                    const maxLon = longitude + longitudeDelta / 2;
                    const bbox = [minLon, minLat, maxLon, maxLat];
                    console.log("lights recevied")
                    const lightsData = await fetchLights(null, bbox);
                    setLights(lightsData);
                } catch (e) {
                    console.error('Error fetching lights:', e);
                }
            } else {
                setLights([]);
            }
    },[nightMode]);

    return { nightMode, setNightMode, lights, handleRegionChangeComplete };
}
