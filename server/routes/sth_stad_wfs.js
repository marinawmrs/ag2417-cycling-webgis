
const express = require('express');
const fetch = require('node-fetch');
const router = express.Router();
const fs = require('fs');
const config = JSON.parse(fs.readFileSync('../../config.json', 'utf8'));

const wfs_bike_paths = `https://openstreetgs.stockholm.se/geoservice/api/${config.api_keys.sth_stad}/wfs?typename=od_gis:Cykelstrak_Linje`;

router.get('/get_wfs_data', async (req, res) => {
  try {
    const response = await fetch(WFS_URL);
    if (!response.ok) throw new Error(`${response.status}`);
    const data = await response.json();

    // filter

    res.json(data);
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

module.exports = router;
