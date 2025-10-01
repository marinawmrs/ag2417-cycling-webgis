
const express = require('express');
const fetch = require('node-fetch');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const configPath = path.resolve(__dirname, '../../config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const wfs_base_url = `https://openstreetgs.stockholm.se/geoservice/api/${config.api_keys.sth_stad}/wfs?service=WFS&version=1.1.0&request=GetFeature&typeName=od_gis:`
const wfs_bike_paths = `${wfs_base_url}Cykelstrak_Linje&outputFormat=application/json`;
const wfs_light_paths = `${wfs_base_url}Belysningsmontage_Punkt&srsName=EPSG:4326&outputFormat=application/json&maxFeatures=2`;

router.get('/get_wfs_data_bike', async (req, res) => {
  try {
    const response = await fetch(wfs_bike_paths);
    if (!response.ok) throw new Error(`${response.status}`);
    const data = await response.json();
    console.log('WFS data received')

    // TODO: filter!!

    res.json(data);
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

router.get('/get_wfs_data_light', async (req, res) => {
  try {
    const response = await fetch(wfs_light_paths);
    if (!response.ok) throw new Error(`${response.status}`);
    const data = await response.json();
    console.log('WFS data received')
    res.json(data);
  } catch (err) {
    console.error(err)
    res.status(500).send({ error: err.message });
  }
});


module.exports = router;
