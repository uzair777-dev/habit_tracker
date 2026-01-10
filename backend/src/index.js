// backend/src/index.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

// Load configuration
const configPath = path.resolve(__dirname, '../../config/config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
const authRoutes = require('./routes/auth');
const habitRoutes = require('./routes/habits');
const forumRoutes = require('./routes/forum');
const { router: uploadRouter, cleanupOrphanedFiles } = require('./routes/upload');

app.use('/api', authRoutes);
app.use('/api', habitRoutes);
app.use('/api', forumRoutes);
app.use('/api', uploadRouter);

// Serve static frontend (if needed)
app.use(express.static(path.resolve(__dirname, '../../frontend/dist')));

const PORT = config.backendPort || 4000;
app.listen(PORT, async () => {
    await cleanupOrphanedFiles();
    // Run cleanup every hour
    setInterval(cleanupOrphanedFiles, 60 * 60 * 1000); 
    console.log(`Backend server listening on port ${PORT}`);
});
