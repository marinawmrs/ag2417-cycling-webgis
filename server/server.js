const express = require('express');
const { Pool } = require('pg');
const app = express();
const port = 3000;

const pool = new Pool({
  user: 'gis',
  host: 'localhost',
  database: 'lab4',
  password: 'gis',
  port: 5435
});

app.get('/api/get_markers_geojson', (req, res) => {
    pool.query("SELECT row_to_json(fc)FROM (SELECT 'FeatureCollection' As type, array_to_json(array_agg(f))As features FROM(SELECT 'Feature' As type, ST_AsGeoJSON(lg.geom)::json As geometry, row_to_json((SELECT l FROM (SELECT id,name) As l)) As properties FROM tbl_markers As lg) As f) As fc;", (err, dbResponse) => {
        if (err) console.log(err);
        //console.log(dbResponse.rows); // here dbResponse is available, your data processing logic goes here
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.send(dbResponse.rows);
    });
}
);


app.listen(port, () => console.log(`Server running on http://localhost:${port}`));
