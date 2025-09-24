/**
 * ------------------------------------------------------------------------
 * File:        app.js.
 * Description:
 * Author:      marinawiemers
 * Created:     2025-09-22
 * Notes:       -
 * ------------------------------------------------------------------------
 */

const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const fs = require('fs');

app.use(bodyParser.json());
app.use(express.static("public"));
app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

const config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
const { Pool } = require('pg');
const pool = new Pool({
    user: config.database.user,
    host: config.database.host,
    database: 'ag2417_25',
    password: config.database.password,
    port: config.database.port
});


// fetch pumps as geojson
app.get('/api/get_pumps_geojson', (req, res) => {
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
        if (err) console.log(err)
        if (!dbResponse || !dbResponse.rows || !dbResponse.rows[0]) {
            res.status(404).send({ error: 'No pumps found' });
            return;
        }
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.send(dbResponse.rows[0].row_to_json);
    });
});


app.get('/testmap', (req, res) => res.sendFile(__dirname + '/public/testmap.html'));

app.listen(config.app.port, () => console.log('app listening!'));
