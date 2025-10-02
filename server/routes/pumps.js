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

  // get 20 closest pumps
  router.get('/get_pumps_geojson_closest', (req, res) => {
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
                     SELECT c.fid, c."Adress" AS address, c."Namn" AS name, c."Typ" AS type,
                            ST_DistanceSphere(
                              ST_Transform(c.geometry, 4326),
                              ST_SetSRID(ST_MakePoint($1, $2), 4326)
                            ) AS distance
                   ) AS l
                 )) AS properties
          FROM cykelpump AS c
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

  // get pumps based on filters
  router.get('/get_pumps_geojson_filtered', (req, res) => {
    let { lon, lat, distance, rating } = req.query;
    distance = parseInt(distance * 1000)

    const query_geojson = `
        WITH ratings AS (
          SELECT pump_id, AVG(vibe_rating) AS avg_rating, BOOL_AND(working_status = 1) AS all_working
          FROM cykelpump_ratings GROUP BY pump_id
        )
        SELECT row_to_json(fc)
        FROM (
          SELECT 'FeatureCollection' AS type, array_to_json(array_agg(f)) AS features
          FROM (
            SELECT 'Feature' AS type,
                   ST_AsGeoJSON(ST_Transform(c.geometry, 4326))::json AS geometry,
                   row_to_json((
                     SELECT l FROM (
                       SELECT
                         c.fid, c."Adress" AS address, c."Namn" AS name, c."Typ" AS type,r.avg_rating, r.all_working,
                         ST_DistanceSphere(
                           ST_Transform(c.geometry, 4326),
                           ST_SetSRID(ST_MakePoint($1, $2), 4326)
                         ) AS distance
                     ) AS l
                   )) AS properties
            FROM cykelpump AS c
            LEFT JOIN ratings AS r ON c.fid::numeric = r.pump_id::numeric
            WHERE ST_DWithin(
                    ST_Transform(c.geometry, 4326)::geography,
                    ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
                    $3
                  ) AND (r.avg_rating IS NULL OR r.avg_rating >= $4::numeric) AND (r.all_working IS NULL OR r.all_working = true)
            ORDER BY ST_DistanceSphere(ST_Transform(c.geometry, 4326),ST_SetSRID(ST_MakePoint($1, $2), 4326))
          ) AS f
        ) AS fc;
    `;

    pool.query(query_geojson, [parseFloat(lon), parseFloat(lat), parseFloat(distance), parseFloat(rating)], (err, dbResponse) => {
        if (err) {
            console.error(err)
            return res.status(500).send({ error: err.message });
        }
        res.json(dbResponse.rows[0].row_to_json);
        });
  });

  return router;
};
