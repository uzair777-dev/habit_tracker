# Forum Implementation - Migration Guide

This document explains the changes made to implement the forum functionality and how to apply them.

## Changes Made

### 1. Database Schema (`db/schema.sql`)

**Changed:**

- Replaced `forum_threads` and `forum_posts` tables with a single `forum_messages` table
- Implemented thread-based messaging with hexadecimal thread IDs
- Added support for root/reply message hierarchy
- Added attachment support

**New Schema:**

```sql
CREATE TABLE IF NOT EXISTS forum_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    thread_id VARCHAR(32) NOT NULL,             -- Hex timestamp
    time BIGINT NOT NULL,                        -- Numerical timestamp (ms)
    user_id VARCHAR(255),                        -- Nullable for anonymous
    message TEXT NOT NULL,                       -- Message content
    is_root TINYINT(1) NOT NULL DEFAULT 0,      -- 1 = root, 0 = reply
    root_title VARCHAR(255) DEFAULT NULL,        -- Title for root messages
    attachment VARCHAR(512) DEFAULT NULL,        -- URL to uploaded file
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    root_thread_id VARCHAR(32) GENERATED ALWAYS AS (IF(is_root = 1, thread_id, NULL)) STORED,
    INDEX idx_thread_id (thread_id),
    INDEX idx_time (time),
    INDEX idx_is_root (is_root),
    UNIQUE KEY unique_root_per_thread (root_thread_id)
);
```

### 2. Forum Routes (`backend/src/routes/forum.js`)

**Completely rewritten** to implement:

- Thread creation with hex thread IDs
- Reply posting to existing threads
- Auto-title generation from message content
- Attachment support (integrated with upload system)
- Search functionality
- Message deletion (with cascade for root deletion)

### 3. Backend Router (`backend/src/index.js`)

**Changed:**

- Updated route mounting to use specific prefixes:
  - `/api/auth` for authentication
  - `/api/habits` for habit tracking
  - `/api/forum` for forum
  - `/api/upload` for file uploads

### 4. Documentation (`README.md`)

**Added:**

- Complete forum architecture documentation
- API endpoint reference with examples
- Message structure table
- Data flow examples
- Implementation details

## Migration Steps

### Option 1: Fresh Database (Recommended for Development)

1. **Stop the database server** (kill the `setup_db.py` process)

2. **Remove old database files:**

   ```bash
   rm -rf data_p/
   ```

3. **Restart the database:**

   ```bash
   python3 setup_db.py
   ```

   This will create a fresh database with the new schema.

### Option 2: Manual Migration (If You Have Existing Data)

If you have existing forum data you want to preserve, you'll need to manually migrate:

1. **Export existing data** (if any):

   ```bash
   mysql -h 127.0.0.1 -P 3307 -u root -e "SELECT * FROM forum_db.forum_threads" > threads_backup.csv
   mysql -h 127.0.0.1 -P 3307 -u root -e "SELECT * FROM forum_db.forum_posts" > posts_backup.csv
   ```

2. **Drop old tables:**

   ```bash
   mysql -h 127.0.0.1 -P 3307 -u root forum_db -e "DROP TABLE IF EXISTS forum_posts;"
   mysql -h 127.0.0.1 -P 3307 -u root forum_db -e "DROP TABLE IF EXISTS forum_threads;"
   ```

3. **Create new schema:**

   ```bash
   mysql -h 127.0.0.1 -P 3307 -u root forum_db < db/schema.sql
   ```

4. **Migrate data** using a custom script (you'll need to write this based on your data)

## Testing the Forum

### Option 1: Using the Test Script

```bash
cd backend
node test_forum.js
```

This will:

- Create 3 threads
- Add 2 replies
- Test all API endpoints
- Display results in the console

### Option 2: Manual Testing with curl

**Create a thread:**

```bash
curl -X POST http://localhost:4000/api/forum/threads \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello, this is my first post!",
    "title": "First Thread",
    "userId": "test123"
  }'
```

**Get all threads:**

```bash
curl http://localhost:4000/api/forum/threads
```

**Add a reply** (replace THREAD_ID with the ID from previous response):

```bash
curl -X POST http://localhost:4000/api/forum/threads/THREAD_ID/messages \
  -H "Content-Type: application/json" \
  -d '{
    "message": "This is a reply!",
    "userId": "test456"
  }'
```

**Get thread messages:**

```bash
curl http://localhost:4000/api/forum/threads/THREAD_ID
```

## Key Features

 **Thread ID Generation**: Automatic hex timestamp IDs  
 **Auto-Title Generation**: From first 5 words of message  
 **Root/Reply Hierarchy**: Enforced by database constraint  
 **Attachment Support**: Integrated with upload system  
 **Anonymous Posting**: userId is optional  
 **Search**: Full-text search in threads and messages  
 **Cascade Deletion**: Deleting root deletes entire thread  

## API Changes

### Before (Old API)

```
GET  /api/threads               Get threads
POST /api/threads               Create thread
GET  /api/threads/:id/posts     Get posts
POST /api/threads/:id/posts     Create post
```

### After (New API)

```
GET    /api/forum/threads                   Get all threads (root messages)
POST   /api/forum/threads                   Create new thread
GET    /api/forum/threads/:threadId         Get all messages in thread
POST   /api/forum/threads/:threadId/messages  Add reply to thread
GET    /api/forum/search?q=term&type=...    Search forum
DELETE /api/forum/messages/:messageId       Delete message
```

## Notes

- **Thread ID uniqueness**: Collisions are virtually impossible (millisecond precision + hex encoding)
- **Performance**: Indexed on `thread_id`, `time`, and `is_root`
- **Constraints**: Database enforces one root per thread via generated column
- **Frontend**: Will need to be updated to use new API endpoints
- **Backward compatibility**: Old API is completely replaced

## Troubleshooting

### Error: "Duplicate entry"

This means you're trying to create a second root message in the same thread. Each thread can only have one root message (enforced by DB).

### Error: "Thread not found"

Make sure you're using the correct thread_id (hexadecimal value, not the auto-increment id).

### Empty results when fetching threads

Check that you're using the new API endpoints (`/api/forum/threads` not `/api/threads`).

## Next Steps

To complete the forum implementation:

1. Database schema updated
2. Backend API implemented
3. Documentation written
4. Frontend needs to be updated to use new API
5. UI components for forum (thread list, thread view, reply form)

---

For questions or issues, refer to the main README.md or check the API documentation section.
