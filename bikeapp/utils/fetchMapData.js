import * as turf from '@turf/turf';
import config from '../conn.json';


export async function fetchTwilightTimes(lat, lon) {
    const res = await fetch(`https://api.sunrise-sunset.org/json?lat=${lat}&lng=${lon}&date=today&formatted=0`);
    const data = await res.json();
    if (data.status !== 'OK') throw new Error('Error fetching daylight API');
    return {
        sunRise: new Date(data.results.civil_twilight_begin),
        sunSet: new Date(data.results.civil_twilight_end),
    };
}

export async function fetchPumps(lat, lon) {
    const res = await fetch(`http://${config.app.api_base_IP}:${config.app.port}/api/get_pumps_geojson_closest?lon=${lon}&lat=${lat}`);
    const data = await res.json();
    if (!data?.features) throw new Error('Unexpected pumps GeoJSON');
    return data.features;
}

export async function fetchParkings(lat, lon) {
    const res = await fetch(`http://${config.app.api_base_IP}:${config.app.port}/api/get_parking_geojson_closest?lon=${lon}&lat=${lat}`);
    const data = await res.json();
    if (!data?.features) throw new Error('Unexpected parking GeoJSON');
    return data.features;
}

export async function fetchLights(featureColl, bbox) {
    const res = await fetch(`http://${config.app.api_base_IP}:${config.app.port}/api/get_wfs_data_light?bbox=${bbox}&centroids=${encodeURIComponent(JSON.stringify(featureColl))}`);
    const data = await res.json();
    return data?.features || [];
}

export async function fetchParkings_all() {
    const res = await fetch(`http://${config.app.api_base_IP}:${config.app.port}/api/get_parking_geojson`);
    const data = await res.json();
    if (!data?.features) throw new Error('Unexpected parking GeoJSON');
    return data.features;
}