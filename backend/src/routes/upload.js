// backend/src/routes/upload.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const pool = require('../db');

// Ensure uploads base directory exists
const uploadsBase = path.resolve(__dirname, '../../../uploads');
if (!fs.existsSync(uploadsBase)) {
    fs.mkdirSync(uploadsBase, { recursive: true });
}

// Multer storage configuration – store in user‑specific folder
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const userId = req.body.userId;
        if (!userId) return cb(new Error('Missing userId'), null);
        const userDir = path.join(uploadsBase, userId.toString());
        if (!fs.existsSync(userDir)) {
            fs.mkdirSync(userDir, { recursive: true });
        }
        cb(null, userDir);
    },
    filename: (req, file, cb) => {
        // Keep original name
        cb(null, file.originalname);
    }
});

const upload = multer({ storage });

// Helper to compute SHA‑256 hash of a file
function computeHash(filePath) {
    return new Promise((resolve, reject) => {
        const hash = crypto.createHash('sha256');
        const stream = fs.createReadStream(filePath);
        stream.on('error', reject);
        stream.on('data', chunk => hash.update(chunk));
        stream.on('end', () => resolve(hash.digest('hex')));
    });
}

// Upload endpoint
router.post('/upload', upload.single('file'), async (req, res) => {
    const userId = req.body.userId;
    if (!userId) return res.status(400).json({ error: 'Missing userId' });
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file uploaded' });
    try {
        const filePath = file.path;
        const fileHash = await computeHash(filePath);
        // Store metadata in DB
        await pool.execute(
            'INSERT INTO uploads (user_id, filename, filehash) VALUES (?, ?, ?)',
            [userId, file.originalname, fileHash]
        );
        res.json({ success: true, fileHash });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'DB error' });
    }
});

// Cleanup routine – remove files without DB entry OR expired files (run on server start)
async function cleanupOrphanedFiles() {
    try {
        const expirationMs = 30 * 24 * 60 * 60 * 1000; // 30 days
        const now = Date.now();

        // 1. Get all valid files from DB
        const [rows] = await pool.execute('SELECT user_id, filename, uploaded_at FROM uploads');
        const validFiles = new Map(); // path -> uploaded_at timestamp

        for (const r of rows) {
            const fullPath = path.join(uploadsBase, r.user_id.toString(), r.filename);
            validFiles.set(fullPath, new Date(r.uploaded_at).getTime());
        }

        // 2. Walk through uploads directory
        if (!fs.existsSync(uploadsBase)) return;
        const userDirs = fs.readdirSync(uploadsBase);
        for (const dir of userDirs) {
            const dirPath = path.join(uploadsBase, dir);
            if (!fs.statSync(dirPath).isDirectory()) continue;

            const files = fs.readdirSync(dirPath);
            for (const f of files) {
                const fullPath = path.join(dirPath, f);

                // Check if orphaned
                if (!validFiles.has(fullPath)) {
                    fs.unlinkSync(fullPath);
                    console.log('Removed orphaned file', fullPath);
                    continue;
                }

                // Check if expired
                const uploadTime = validFiles.get(fullPath);
                if (now - uploadTime > expirationMs) {
                    fs.unlinkSync(fullPath);
                    // Also remove from DB
                    await pool.execute('DELETE FROM uploads WHERE user_id = ? AND filename = ?', [dir, f]);
                    console.log('Removed expired file', fullPath);
                }
            }
        }
    } catch (e) {
        console.error('Cleanup error', e);
    }
}

// Export router and cleanup function
module.exports = { router, cleanupOrphanedFiles };
