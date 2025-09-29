/**
 * ------------------------------------------------------------------------
 * File:        app.js.
 * Description: server side js to fetch and send data to client side
 * Author:      marinawiemers, johanna schaefer
 * Created:     2025-09-22
 * Notes:       -
 * ------------------------------------------------------------------------
 */

const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const fs = require('fs');
const { Pool } = require('pg');
const pumpsRoutes = require('./routes/pumps');
const parkingratingsRoutes = require('./routes/parking_rating');
const pumpratingsRoutes = require('./routes/pump_rating');
const wfsRoutes = require('./routes/sth_stad_wfs');



app.use(bodyParser.json());
app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    next();
});


const config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
const pool = new Pool({
    user: config.database.user,
    host: config.database.host,
    database: 'ag2417_25',
    password: config.database.password,
    port: config.database.port
});

app.use('/api', pumpsRoutes(pool));
app.use('/api', parkingratingsRoutes(pool));
app.use('/api', pumpratingsRoutes(pool));

app.use('/api', wfsRoutes);


app.listen(config.app.port, () => console.log(`app listening`));
