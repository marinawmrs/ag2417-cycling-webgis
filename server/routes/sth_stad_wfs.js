const express = require('express');
const fetch = require('node-fetch');
const turf = require('@turf/turf');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const configPath = path.resolve(__dirname, '../../config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const wfs_base_url = `https://openstreetgs.stockholm.se/geoservice/api/${config.api_keys.sth_stad}/wfs?service=WFS&version=1.1.0&request=GetFeature&typeName=od_gis:`

router.get('/get_wfs_data_light', async (req, res) => {
    const { bbox, centroids } = req.query;
    const [minX, minY, maxX, maxY] = bbox.split(',').map(Number);
    const cqlFilter = `BBOX(GEOMETRY, ${minX}, ${minY}, ${maxX}, ${maxY}, 'EPSG:4326')`;

    const centroidsGeo = JSON.parse(decodeURIComponent(centroids));

    const wfs_light_paths = `${wfs_base_url}Belysningsmontage_Punkt&srsName=EPSG:4326&outputFormat=application/json&CQL_FILTER=${encodeURIComponent(cqlFilter)}&maxFeatures=200`;
    console.log(wfs_light_paths)

    try {
        const response = await fetch(wfs_light_paths);
        if (!response.ok) throw new Error(`${response.status}`);
        const data = await response.json();
        console.log('WFS data received')

        const bufferedZones = centroidsGeo.features.map(center => {
            const buffer = turf.buffer(center, 0.1, { units: 'kilometers' });
            const pointsInside = turf.pointsWithinPolygon(data, buffer);
            buffer.properties = {
                ...center.properties,
                lightCount: pointsInside.features.length
            };
            return buffer;
        });
        const bufferedFeatureCollection = turf.featureCollection(bufferedZones);
        res.json(bufferedFeatureCollection);
    } catch (err) {
        console.error(err)
        res.status(500).send({ error: err.message });
    }
});


module.exports = router;
