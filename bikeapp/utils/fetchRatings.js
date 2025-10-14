import config from '../conn.json';

export async function postBikepumpRating(pumpId, bikepumpRatings) {
    await fetch(`http://${config.app.api_base_IP}:${config.app.port}/api/rate_pump`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            pump_id: pumpId,
            working_status: bikepumpRatings.working_status,
            vibe_rating: bikepumpRatings.vibe_rating,
        }),
    });
}

export async function postBikeparkRating(parkingId, bikeparkRatings) {
    await fetch(`http://${config.app.api_base_IP}:${config.app.port}/api/rate_parkering`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ //parking_id, safety_rating, vibe_rating, availability_rating
            parking_id: parkingId,
            safety_rating: bikeparkRatings.safety_rating,
            vibe_rating: bikeparkRatings.vibe_rating,
            availability_rating: bikeparkRatings.availability_rating,
        }),
    });
}

export async function fetchPumpAverage(fid) {
    const res = await fetch(`http://${config.app.api_base_IP}:${config.app.port}/api/pump_average/${fid}`);
    return res.json();
}

export async function fetchParkingAverage(fid) {
    const res = await fetch(`http://${config.app.api_base_IP}:${config.app.port}/api/parkering_average/${fid}`);
    return res.json();
}

export async function fetchParkingAverage_hour(fid, startHour, endHour) {
    const res = await fetch(`http://${config.app.api_base_IP}:${config.app.port}/api/parkering_average/?parking_id=${fid}&startHour=${startHour}&endHour=${endHour}`);
    return res.json();
}

export async function fetchFilteredPumps(longitude, latitude, distance, rating) {
    const res = await fetch(`http://${config.app.api_base_IP}:${config.app.port}/api/get_pumps_geojson_filtered?lon=${longitude}&lat=${latitude}&distance=${distance}&rating=${rating}`);
    const data = await res.json();
    if (!res.ok) throw new Error('Error fetching filtered pumps');
    return data.features || [];
}

export async function fetchFilteredParkings(longitude, latitude, distance, rating, safety, availability) {
    const res = await fetch(`http://${config.app.api_base_IP}:${config.app.port}/api/get_parkings_geojson_filtered?lon=${longitude}&lat=${latitude}&distance=${distance}&rating=${rating}&safety=${safety}&availability=${availability}`);
    const data = await res.json();
    if (!res.ok) throw new Error('Error fetching filtered parking');
    return data.features || [];
}