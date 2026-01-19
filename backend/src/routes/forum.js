// backend/src/routes/forum.js
/**
 * Forum API Routes
 * 
 * Implements a thread-based messaging system where:
 * - Each thread has a unique thread_id (hexadecimal timestamp)
 * - Each message has properties: thread_id, time, message, is_root, root_title, attachment
 * - Only one root message per thread (is_root=1)
 * - Thread ID is generated as hex representation of creation time in milliseconds
 * - All messages in same thread share the same thread_id
 */

const express = require('express');
const router = express.Router();
const pool = require('../db');
const crypto = require('crypto');

/**
 * Generate a thread ID as hexadecimal timestamp
 * @returns {object} { threadId: string, time: number }
 */
function generateThreadId() {
    const time = Date.now(); // milliseconds since epoch
    const threadId = time.toString(16); // convert to hexadecimal
    return { threadId, time };
}

/**
 * Auto-generate title from message content
 * Takes first 5 words or first 50 characters, whichever comes first
 * @param {string} message - The message content
 * @returns {string} Generated title
 */
function generateTitle(message) {
    if (!message) return 'Untitled';
    
    // Remove extra whitespace
    const cleaned = message.trim().replace(/\s+/g, ' ');
    
    // Get first 5 words
    const words = cleaned.split(' ').slice(0, 5).join(' ');
    
    // Truncate to 50 chars if needed
    if (words.length > 50) {
        return words.substring(0, 47) + '...';
    }
    
    // Add ellipsis if there's more content
    if (cleaned.length > words.length) {
        return words + '...';
    }
    
    return words;
}

/**
 * GET /api/forum/threads
 * Get all threads (grouped by thread_id)
 * Returns list of root messages with their thread_id
 */
router.get('/threads', async (req, res) => {
    try {
        const [rows] = await pool.execute(
            `SELECT 
                id,
                thread_id,
                time,
                user_id,
                message,
                is_root,
                root_title,
                attachment,
                created_at,
                (SELECT COUNT(*) FROM forum_db.forum_messages WHERE thread_id = m.thread_id) as message_count
            FROM forum_db.forum_messages m
            WHERE is_root = 1
            ORDER BY time DESC`
        );
        
        res.json({ threads: rows });
    } catch (err) {
        console.error('Error fetching threads:', err);
        res.status(500).json({ error: 'Database error fetching threads' });
    }
});

/**
 * GET /api/forum/threads/:threadId
 * Get all messages in a specific thread
 */
router.get('/threads/:threadId', async (req, res) => {
    const { threadId } = req.params;
    
    try {
        const [rows] = await pool.execute(
            `SELECT 
                id,
                thread_id,
                time,
                user_id,
                message,
                is_root,
                root_title,
                attachment,
                created_at
            FROM forum_db.forum_messages
            WHERE thread_id = ?
            ORDER BY time ASC`,
            [threadId]
        );
        
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Thread not found' });
        }
        
        res.json({ messages: rows });
    } catch (err) {
        console.error('Error fetching thread messages:', err);
        res.status(500).json({ error: 'Database error fetching messages' });
    }
});

/**
 * POST /api/forum/threads
 * Create a new thread (root message)
 * 
 * Body:
 * - message: string (required) - The message content
 * - title: string (optional) - The thread title (auto-generated if not provided)
 * - userId: string (optional) - User ID (for logged-in users)
 * - attachment: string (optional) - URL to uploaded file
 */
router.post('/threads', async (req, res) => {
    const { message, title, userId, attachment } = req.body;
    
    if (!message || message.trim().length === 0) {
        return res.status(400).json({ error: 'Message content is required' });
    }
    
    try {
        // Generate thread ID and timestamp
        const { threadId, time } = generateThreadId();
        
        // Use provided title or auto-generate from message
        const rootTitle = title && title.trim().length > 0 
            ? title.trim() 
            : generateTitle(message);
        
        // Insert root message
        await pool.execute(
            `INSERT INTO forum_db.forum_messages 
            (thread_id, time, user_id, message, is_root, root_title, attachment)
            VALUES (?, ?, ?, ?, 1, ?, ?)`,
            [threadId, time, userId || null, message, rootTitle, attachment || null]
        );
        
        res.json({
            success: true,
            threadId,
            time,
            rootTitle
        });
    } catch (err) {
        console.error('Error creating thread:', err);
        
        // Handle unique constraint violation (shouldn't happen with timestamp, but just in case)
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'Thread already exists with this ID' });
        }
        
        res.status(500).json({ error: 'Database error creating thread' });
    }
});

/**
 * POST /api/forum/threads/:threadId/messages
 * Add a message to an existing thread
 * 
 * Body:
 * - message: string (required) - The message content
 * - userId: string (optional) - User ID (for logged-in users)
 * - attachment: string (optional) - URL to uploaded file
 */
router.post('/threads/:threadId/messages', async (req, res) => {
    const { threadId } = req.params;
    const { message, userId, attachment } = req.body;
    
    if (!message || message.trim().length === 0) {
        return res.status(400).json({ error: 'Message content is required' });
    }
    
    try {
        // Verify thread exists
        const [threadCheck] = await pool.execute(
            'SELECT id FROM forum_db.forum_messages WHERE thread_id = ? LIMIT 1',
            [threadId]
        );
        
        if (threadCheck.length === 0) {
            return res.status(404).json({ error: 'Thread not found' });
        }
        
        // Generate timestamp for this message
        const time = Date.now();
        
        // Insert message (is_root=0, no root_title)
        await pool.execute(
            `INSERT INTO forum_db.forum_messages 
            (thread_id, time, user_id, message, is_root, root_title, attachment)
            VALUES (?, ?, ?, ?, 0, NULL, ?)`,
            [threadId, time, userId || null, message, attachment || null]
        );
        
        res.json({
            success: true,
            threadId,
            time
        });
    } catch (err) {
        console.error('Error adding message:', err);
        res.status(500).json({ error: 'Database error adding message' });
    }
});

/**
 * GET /api/forum/search
 * Search for threads/messages
 * 
 * Query params:
 * - q: search query
 * - type: 'threads' or 'messages' (default: 'threads')
 */
router.get('/search', async (req, res) => {
    const { q, type = 'threads' } = req.query;
    
    if (!q || q.trim().length === 0) {
        return res.status(400).json({ error: 'Search query is required' });
    }
    
    try {
        const searchTerm = `%${q}%`;
        
        if (type === 'threads') {
            // Search in root messages only
            const [rows] = await pool.execute(
                `SELECT 
                    id,
                    thread_id,
                    time,
                    user_id,
                    message,
                    is_root,
                    root_title,
                    attachment,
                    created_at,
                    (SELECT COUNT(*) FROM forum_db.forum_messages WHERE thread_id = m.thread_id) as message_count
                FROM forum_db.forum_messages m
                WHERE is_root = 1 AND (root_title LIKE ? OR message LIKE ?)
                ORDER BY time DESC`,
                [searchTerm, searchTerm]
            );
            
            res.json({ threads: rows });
        } else {
            // Search in all messages
            const [rows] = await pool.execute(
                `SELECT 
                    id,
                    thread_id,
                    time,
                    user_id,
                    message,
                    is_root,
                    root_title,
                    attachment,
                    created_at
                FROM forum_db.forum_messages
                WHERE message LIKE ?
                ORDER BY time DESC`,
                [searchTerm]
            );
            
            res.json({ messages: rows });
        }
    } catch (err) {
        console.error('Error searching:', err);
        res.status(500).json({ error: 'Database error during search' });
    }
});

/**
 * DELETE /api/forum/messages/:messageId
 * Delete a message (for debugging/admin purposes)
 * Note: In production, you'd want proper authentication/authorization
 */
router.delete('/messages/:messageId', async (req, res) => {
    const { messageId } = req.params;
    
    try {
        // Check if message is a root message
        const [message] = await pool.execute(
            'SELECT is_root, thread_id FROM forum_db.forum_messages WHERE id = ?',
            [messageId]
        );
        
        if (message.length === 0) {
            return res.status(404).json({ error: 'Message not found' });
        }
        
        if (message[0].is_root === 1) {
            // If deleting root message, delete entire thread
            await pool.execute(
                'DELETE FROM forum_db.forum_messages WHERE thread_id = ?',
                [message[0].thread_id]
            );
            res.json({ success: true, message: 'Thread deleted' });
        } else {
            // Delete single message
            await pool.execute(
                'DELETE FROM forum_db.forum_messages WHERE id = ?',
                [messageId]
            );
            res.json({ success: true, message: 'Message deleted' });
        }
    } catch (err) {
        console.error('Error deleting message:', err);
        res.status(500).json({ error: 'Database error deleting message' });
    }
});

module.exports = router;
