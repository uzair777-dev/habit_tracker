// backend/src/db.js
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Load DB config from central config file
const configPath = path.resolve(__dirname, '../../config/config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8')).db;

const pool = mysql.createPool({
    host: config.host,
    port: config.port || 3306,
    user: config.user,
    password: config.password,
    database: config.database,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = pool;
