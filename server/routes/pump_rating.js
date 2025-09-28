const express = require('express');
const router = express.Router();

module.exports = (pool) => {
    router.post('/rate_pump', async (req, res) => {
        const { pump_id, working_status, vibe_rating } = req.body;
        try {
            await pool.query(`
            INSERT INTO cykelpump_ratings (pump_id, working_status, vibe_rating)
            VALUES ($1, $2, $3)
          `, [pump_id, working_status, vibe_rating]);
            res.json({ success: true });
        } catch (err) {
            console.error('Error inserting rating:', err);
            res.status(500).json({ error: 'Database error' });
        }
    });


    router.get('/pump_average/:pump_id', async (req, res) => {
        const { pump_id } = req.params;
        try {
            const result = await pool.query(`
            SELECT
                CASE
                WHEN COUNT(*) FILTER (WHERE recent.working_status = 1) < COUNT(*) FILTER (WHERE recent.working_status = 0) THEN 0
                ELSE 1
                END AS majority_working,
                (
                SELECT AVG(vibe_rating)::numeric(3,1)
                FROM cykelpump_ratings
                WHERE pump_id = $1 AND created_at > NOW() - INTERVAL '10 weeks'
                ) AS avg_vibe
            FROM (
                SELECT working_status
                FROM cykelpump_ratings
                WHERE pump_id = $1
                ORDER BY created_at DESC
                LIMIT 3
            ) AS recent;
            `, [pump_id]);
            res.json({
                majority_working: Number(result.rows[0].majority_working),
                avg_vibe: result.rows[0].avg_vibe
              });
              
        } catch (err) {
            console.error('Error fetching averages:', err);
            res.status(500).json({ error: 'Database error' });
        }
    });

    return router;
};
