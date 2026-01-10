// backend/src/routes/auth.js
const express = require('express');
const router = express.Router();
const pool = require('../db');
const crypto = require('crypto');

// Helper to generate unique 64‑bit timestamp based ID (hex string)
function generateUserId() {
    const timestamp = BigInt(Date.now()); // milliseconds since epoch
    // Ensure uniqueness by adding a random 16‑bit suffix
    const random = BigInt(Math.floor(Math.random() * 0x10000));
    const id = (timestamp << 16n) | random;
    return id.toString(16);
}

// Email signup
router.post('/signup', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.json({ success: false, message: 'Missing fields' });
    const userId = generateUserId();
    const createdAt = Date.now();
    try {
        await pool.execute('INSERT INTO users (id, email, password, created_at) VALUES (?, ?, ?, ?)', [userId, email, password, createdAt]);
        res.json({ success: true, userId });
    } catch (err) {
        console.error(err);
        res.json({ success: false, message: 'Database error' });
    }
});

// Email login
router.post('/login', async (req, res) => {
    const { email, password, remember } = req.body;
    if (!email || !password) return res.json({ success: false, message: 'Missing fields' });
    try {
        const [rows] = await pool.execute('SELECT id, password FROM users WHERE email = ?', [email]);
        if (rows.length === 0) return res.json({ success: false, message: 'User not found' });
        const user = rows[0];
        if (user.password !== password) return res.json({ success: false, message: 'Invalid password' });
        // Set cookie on client side – we just return the id
        res.json({ success: true, userId: user.id, remember });
    } catch (err) {
        console.error(err);
        res.json({ success: false, message: 'Database error' });
    }
});

// Stub routes for other auth methods
router.post('/login/phone', (req, res) => {
    res.json({ success: false, message: 'Work in progress' });
});
router.post('/login/google', (req, res) => {
    res.json({ success: false, message: 'Work in progress' });
});
router.post('/login/facebook', (req, res) => {
    res.json({ success: false, message: 'Work in progress' });
});

module.exports = router;
