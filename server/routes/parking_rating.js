const express = require('express');
const router = express.Router();

module.exports = (pool) => {
  router.post('/rate_parkering', async (req, res) => {
    const { parking_id, safety_rating, vibe_rating, availability_rating } = req.body;
    try {
      await pool.query(`
        INSERT INTO cykelparkering_ratings (parking_id, safety_rating, vibe_rating, availability_rating)
        VALUES ($1, $2, $3, $4)
      `, [parking_id, safety_rating, vibe_rating, availability_rating]);
      res.json({ success: true });
    } catch (err) {
      console.error('Error inserting rating:', err);
      res.status(500).json({ error: 'Database error' });
    }
  });

  router.get('/parkering_average/:parking_id', async (req, res) => {
    const { parking_id } = req.params;
    try {
      const result = await pool.query(`
        SELECT
          AVG(safety_rating)::numeric(3,1) AS avg_safety,
          AVG(vibe_rating)::numeric(3,1) AS avg_vibe,
          AVG(availability_rating)::numeric(3,1) AS avg_availability
        FROM cykelparkering_ratings
        WHERE parking_id = $1 AND created_at > NOW() - INTERVAL '10 weeks'
      `, [parking_id]);
      //res.json(result.rows[0]);
      res.json({
        avg_vibe: result.rows[0].avg_vibe,
        avg_safety:result.rows[0].avg_safety,
        avg_availability: result.rows[0].avg_availability
      });
    } catch (err) {
      console.error('Error fetching averages:', err);
      res.status(500).json({ error: 'Database error' });
    }
  });

  router.get('/parkering_average', async (req, res) => {
    const { parking_id, startHour, endHour } = req.query;
    const start_int = parseInt(startHour);
    const end_int = parseInt(endHour);
    try {
      const general = await pool.query(`
        SELECT
          AVG(safety_rating)::numeric(3,1) AS avg_safety,
          AVG(vibe_rating)::numeric(3,1) AS avg_vibe
        FROM cykelparkering_ratings
        WHERE parking_id = $1
          AND created_at > NOW() - INTERVAL '10 weeks'
      `, [parking_id]);
      
      // Availability → timespecific
      const timeSpecific = await pool.query(`
        SELECT
          AVG(availability_rating)::numeric(3,1) AS avg_availability
        FROM cykelparkering_ratings
        WHERE parking_id = $1
          AND created_at > NOW() - INTERVAL '10 weeks'
          AND EXTRACT(HOUR FROM created_at) BETWEEN $2 AND $3
      `, [parking_id, start_int, end_int]);
      //res.json(result.rows[0]);
      res.json({
        avg_vibe: general.rows[0].avg_vibe,
        avg_safety:general.rows[0].avg_safety,
        avg_availability: timeSpecific.rows[0].avg_availability
      });
    } catch (err) {
      console.error('Error fetching averages:', err);
      res.status(500).json({ error: 'Database error' });
    }
  });

  return router;
};
