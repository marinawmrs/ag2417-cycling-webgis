import config from '../conn.json';

export async function submitBikepumpRating() {
    await fetch(`http://${config.app.api_base_IP}:${config.app.port}/api/rate_pump`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            pump_id: selectedFeature.properties.fid,
            working_status: bikepumpRatings.working_status,
            vibe_rating: bikepumpRatings.vibe_rating,
        }),
    });
}

export async function fetchPumpAverage(fid) {
    const res = await fetch(`http://${config.app.api_base_IP}:${config.app.port}/api/pump_average/${fid}`);
    return res.json();
}

export async function fetchParkingAverage(fid) {
    const res = await fetch(`http://${config.app.api_base_IP}:${config.app.port}/api/parking_average/${fid}`);
    return res.json();
}