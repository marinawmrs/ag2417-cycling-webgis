
const express = require('express');
const fetch = require('node-fetch');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const configPath = path.resolve(__dirname, '../../config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const wfs_bike_paths = `https://openstreetgs.stockholm.se/geoservice/api/${config.api_keys.sth_stad}/wfs?service=WFS&version=1.1.0&request=GetFeature&typeName=od_gis:Cykelstrak_Linje&outputFormat=application/json`;

router.get('/get_wfs_data', async (req, res) => {
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


module.exports = router;
