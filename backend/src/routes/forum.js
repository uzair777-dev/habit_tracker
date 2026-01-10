// backend/src/routes/forum.js
const express = require('express');
const router = express.Router();
const pool = require('../db');
const crypto = require('crypto');

// Helper to get or set anonymous user id in cookie (client will handle cookie, server just uses provided id)
function getAnonId(req) {
    // Expect client to send anonId header or cookie; for simplicity, generate if missing
    let anonId = req.headers['x-anon-id'];
    if (!anonId) {
        anonId = crypto.randomBytes(8).toString('hex');
    }
    return anonId;
}

// Get all threads (public)
router.get('/threads', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT id, title, content, created_at FROM forum_threads ORDER BY created_at DESC');
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'DB error' });
    }
});

// Create a new thread (anonymous or logged in)
router.post('/threads', async (req, res) => {
    const { title, content } = req.body;
    const userId = req.body.userId || null; // logged‑in user optional
    const anonId = getAnonId(req);
    if (!title || !content) return res.status(400).json({ error: 'Missing fields' });
    try {
        await pool.execute('INSERT INTO forum_threads (user_id, title, content) VALUES (?, ?, ?)', [userId, title, content]);
        // Return anonId so client can store it if needed
        res.json({ success: true, anonId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'DB error' });
    }
});

// Get posts for a thread
router.get('/threads/:threadId/posts', async (req, res) => {
    const threadId = req.params.threadId;
    try {
        const [rows] = await pool.execute('SELECT id, user_id, content, created_at FROM forum_posts WHERE thread_id = ? ORDER BY created_at ASC', [threadId]);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'DB error' });
    }
});

// Add a post (anonymous or logged in)
router.post('/threads/:threadId/posts', async (req, res) => {
    const threadId = req.params.threadId;
    const { content, userId } = req.body;
    const anonId = getAnonId(req);
    if (!content) return res.status(400).json({ error: 'Missing content' });
    try {
        await pool.execute('INSERT INTO forum_posts (thread_id, user_id, content) VALUES (?, ?, ?)', [threadId, userId || null, content]);
        res.json({ success: true, anonId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'DB error' });
    }
});

module.exports = router;
