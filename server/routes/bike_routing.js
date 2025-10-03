// server/routes/bike_routing.js
const express = require('express');

module.exports = (pool) => {
  const router = express.Router();

  // Network SRID for your edges table (adjust if needed)
  const NETWORK_SRID = 3011;

  // Default bike speed: 15 km/h = 4.1666667 m/s
  const BIKE_SPEED_MPS = 4.1666667;

  const SQL = `
WITH params AS (
  SELECT
    ST_Transform(ST_SetSRID(ST_Point($1, $2), 4326), ${NETWORK_SRID}) AS p1, -- start lon/lat
    ST_Transform(ST_SetSRID(ST_Point($3, $4), 4326), ${NETWORK_SRID}) AS p2  -- end lon/lat
),
v AS (
  SELECT
    (SELECT id FROM ag2417_25_g1.street_network_noded_vertices_pgr
       ORDER BY the_geom <-> (SELECT p1 FROM params) LIMIT 1) AS v_start,
    (SELECT id FROM ag2417_25_g1.street_network_noded_vertices_pgr
       ORDER BY the_geom <-> (SELECT p2 FROM params) LIMIT 1) AS v_end
),
route AS (
  SELECT * FROM pgr_dijkstra(
    'SELECT id, source, target, cost, reverse_cost FROM ag2417_25_g1.street_network_noded',
    (SELECT v_start FROM v),
    (SELECT v_end   FROM v),
    directed := true
  )
)
SELECT
  ST_AsGeoJSON(
    ST_Transform(
      ST_LineMerge(
        ST_UnaryUnion(
          ST_Collect(e.geom)
        )
      ),
      4326
    )
  ) AS geojson,
  SUM(e.cost)                              AS total_cost,
  SUM(ST_Length(e.geom))                   AS length_m,
  (SUM(ST_Length(e.geom)) / ${BIKE_SPEED_MPS} / 60.0) AS travel_time_min,
  COUNT(*) FILTER (WHERE r.edge <> -1)     AS edges_in_path
FROM route r
JOIN ag2417_25_g1.street_network_noded e ON e.id = r.edge
WHERE r.edge <> -1;
  `;

  router.get('/route', async (req, res) => {
    try {
      const [startLon, startLat] = (req.query.start || '').split(',').map(Number);
      const [endLon, endLat]     = (req.query.end   || '').split(',').map(Number);

      if ([startLon, startLat, endLon, endLat].some(v => Number.isNaN(v))) {
        return res.status(400).json({ error: 'Pass start=lon,lat & end=lon,lat' });
      }

      const { rows } = await pool.query(SQL, [startLon, startLat, endLon, endLat]);

      if (!rows.length || !rows[0].geojson) {
        return res.status(404).json({ error: 'No path found' });
      }

      res.json({
        type: 'Feature',
        geometry: JSON.parse(rows[0].geojson),
        properties: {
          length_m: Number(rows[0].length_m),
          travel_time_min: Number(rows[0].travel_time_min),
          total_cost: Number(rows[0].total_cost),
          edges_in_path: Number(rows[0].edges_in_path || 0)
        }
      });
    } catch (err) {
      console.error('[ROUTING ERROR]', err);
      res.status(500).json({ error: 'Routing failed', detail: err.message });
    }
  });

  // Debug: confirm DB, user, counts, SRID
  router.get('/route-debug', async (_req, res) => {
    const sql = `
      SELECT
        inet_server_addr()::text                    AS host,
        inet_server_port()                          AS port,
        current_database()                          AS db,
        current_user                                AS usr,
        (SELECT COUNT(*) FROM ag2417_25_g1.street_network_noded)               AS edges,
        (SELECT COUNT(*) FROM ag2417_25_g1.street_network_noded_vertices_pgr)  AS vertices,
        Find_SRID('ag2417_25_g1','street_network_noded','geom')                AS edges_srid
    `;
    try {
      const { rows } = await pool.query(sql);
      res.json(rows[0]);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  return router;
};
