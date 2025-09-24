const express = require('express');
const router = express.Router();

module.exports = (pool) => {
  // fetch pumps as GeoJSON
  router.get('/get_pumps_geojson', (req, res) => {
    const query_geojson = `
      SELECT row_to_json(fc) FROM (
        SELECT 'FeatureCollection' AS type,
               array_to_json(array_agg(f)) AS features
        FROM (
          SELECT 'Feature' AS type,
                 ST_AsGeoJSON(ST_Transform(c.geometry, 4326))::json AS geometry,
                 row_to_json((SELECT l FROM (SELECT c.fid, c."Adress" AS address, c."Namn" AS name, c."Typ" AS type) AS l)) AS properties
          FROM cykelpump AS c
        ) AS f
      ) AS fc;
    `;

    pool.query(query_geojson, (err, dbResponse) => {
      if (err) return res.status(500).send({ error: err.message });
      res.json(dbResponse.rows[0].row_to_json);
    });
  });

  return router;
};
