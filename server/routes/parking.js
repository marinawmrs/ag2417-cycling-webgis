const express = require('express');
const router = express.Router();

module.exports = (pool) => {
  // fetch all parking spots as GeoJSON
  router.get('/get_parking_geojson', (req, res) => {
    const query_geojson = `
      SELECT row_to_json(fc) FROM (
        SELECT 'FeatureCollection' AS type,
               array_to_json(array_agg(f)) AS features
        FROM (
          SELECT 'Feature' AS type,
                 ST_AsGeoJSON(ST_Transform(c.geometry, 4326))::json AS geometry,
                 row_to_json((SELECT l FROM (SELECT c.fid, c."Bildfiler" AS photofile, c."Antal_platser" AS spots, c."Typ" AS type) AS l)) AS properties
          FROM cykelparkering AS c
        ) AS f
      ) AS fc;
    `;

    pool.query(query_geojson, (err, dbResponse) => {
      if (err) return res.status(500).send({ error: err.message });
      res.json(dbResponse.rows[0].row_to_json);
    });
  });

  // fetch closest 20 parkings spots
  router.get('/get_parking_geojson_closest', (req, res) => {
    const { lon, lat } = req.query;
    const query_geojson = `
      SELECT row_to_json(fc) FROM (
        SELECT 'FeatureCollection' AS type,
               array_to_json(array_agg(f)) AS features
        FROM (
          SELECT 'Feature' AS type,
                 ST_AsGeoJSON(ST_Transform(c.geometry, 4326))::json AS geometry,
                 row_to_json((
                   SELECT l FROM (
                     SELECT c.fid, c."Antal_platser" AS num_spots, c."Typ" AS type,
                            ST_DistanceSphere(
                              ST_Transform(c.geometry, 4326),
                              ST_SetSRID(ST_MakePoint($1, $2), 4326)
                            ) AS distance
                   ) AS l
                 )) AS properties
          FROM cykelparkering AS c
          ORDER BY ST_Transform(c.geometry, 4326) <-> ST_SetSRID(ST_MakePoint($1, $2), 4326)
          LIMIT 20
        ) AS f
      ) AS fc;
    `;

    pool.query(query_geojson, [lon, lat], (err, dbResponse) => {
      if (err) return res.status(500).send({ error: err.message });
      res.json(dbResponse.rows[0].row_to_json);
    });
  });

  return router;
};
