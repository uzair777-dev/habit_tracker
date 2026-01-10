// backend/src/routes/habits.js
const express = require('express');
const router = express.Router();
const pool = require('../db');

// Get habits for a user
router.get('/habits', async (req, res) => {
    const userId = req.query.userId;
    if (!userId) return res.json([]);
    try {
        const [rows] = await pool.execute('SELECT id, name, streak FROM habits WHERE user_id = ?', [userId]);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'DB error' });
    }
});

// Add a new habit
router.post('/habits', async (req, res) => {
    const { userId, name } = req.body;
    if (!userId || !name) return res.status(400).json({ error: 'Missing fields' });
    try {
        await pool.execute('INSERT INTO habits (user_id, name, streak) VALUES (?, ?, 0)', [userId, name]);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'DB error' });
    }
});

module.exports = router;
