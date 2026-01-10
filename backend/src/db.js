// backend/src/db.js
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Load DB config from central config file
const configPath = path.resolve(__dirname, '../../config/config.json');
let config = {};
try {
    const fullConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    config = fullConfig.db || {};
} catch (e) {
    console.error("Could not load config.json", e);
}

const pool = mysql.createPool({
    host: config.host || '127.0.0.1',
    port: config.port || 3307,
    user: config.user || 'root',
    password: config.password || '',
    database: config.database || 'habit_tracker_db', 
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    multipleStatements: true
});

module.exports = pool;

module.exports = pool;
