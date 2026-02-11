# Forum Architecture Diagram

## Data Structure

```text
forum_messages Table
┌──────────────────────────────────────────────────────────────┐
│ id | thread_id  | time | user_id | message | is_root | ... │
├────┼────────────┼──────┼─────────┼─────────┼─────────┼─────┤
│  1 │ 18d4f2a1b  │ 1000 │ user123 │ "Hello" │   1     │ ... │  ROOT
│  2 │ 18d4f2a1b  │ 1100 │ user456 │ "Hi!"   │   0     │ ... │  Reply
│  3 │ 18d4f2a1b  │ 1200 │ user789 │ "Hey"   │   0     │ ... │  Reply
│  4 │ 18e5a3c2d  │ 2000 │ user123 │ "New"   │   1     │ ... │  ROOT (different thread)
└────┴────────────┴──────┴─────────┴─────────┴─────────┴─────┘
           │                                      │
           └─────────── Common Thread ID ─────────┘
```

## Thread ID Generation

```text
Current Time (ms)  1704123456700
                     toString(16)
Thread ID        "18d4f2a1b3c"
```

## Message Hierarchy

```text
Thread: 18d4f2a1b3c
┌─────────────────────────────────────────────┐
│ ROOT MESSAGE (is_root = 1)              │
│ ├─ thread_id: "18d4f2a1b3c"                │
│ ├─ time: 1704123456700                     │
│ ├─ root_title: "My First Thread"           │
│ └─ message: "This is the first post..."    │
│                                             │
│    Replies (share same thread_id)         │
│                                             │
│ REPLY 1 (is_root = 0)                   │
│ ├─ thread_id: "18d4f2a1b3c"                │
│ ├─ time: 1704123500000                     │
│ ├─ root_title: NULL                        │
│ └─ message: "Great post!"                  │
│                                             │
│ REPLY 2 (is_root = 0)                   │
│ ├─ thread_id: "18d4f2a1b3c"                │
│ ├─ time: 1704123600000                     │
│ ├─ root_title: NULL                        │
│ └─ message: "Thanks for sharing!"          │
└─────────────────────────────────────────────┘
```

## Auto-Title Generation Logic

```text
Input Message:
"This is my first forum post about habit tracking! Want to share my experience."

 Take first 5 words OR 50 chars (whichever shorter)

"This is my first forum..."

 If original message is longer, add ellipsis

Generated Title: "This is my first forum..."
```

## Attachment Flow

``text

1. Upload File
   POST /api/upload/upload
   { file: [binary], userId: "user123" }

   Response: { filename: "doc.pdf", fileHash: "abc..." }

   File stored: uploads/user123/doc.pdf

2. Create Thread with Attachment
   POST /api/forum/threads
   {
     message: "Check this out!",
     attachment: "<http://localhost:4000/api/upload/files/user123/doc.pdf>"
   }

   Message created with attachment URL

3. Users Access File
   GET <http://localhost:4000/api/upload/files/user123/doc.pdf>

   File served from uploads/user123/doc.pdf

```text

## Database Constraint (Unique Root)

```sql
-- Generated column trick to enforce one root per thread
root_thread_id = IF(is_root = 1, thread_id, NULL)

Thread: 18d4f2a1b3c
┌────────┬───────────┬──────────────────┐
│ is_root│ thread_id │ root_thread_id   │  Unique constraint
├────────┼───────────┼──────────────────┤
│   1    │18d4f2a1b3c│ "18d4f2a1b3c"   │ ✓ Only one non-NULL
│   0    │18d4f2a1b3c│  NULL           │
│   0    │18d4f2a1b3c│  NULL           │   NULLs don't violate
│   0    │18d4f2a1b3c│  NULL           │   unique constraint
└────────┴───────────┴──────────────────┘

Trying to insert another root with same thread_id:
│   1    │18d4f2a1b3c│ "18d4f2a1b3c"   │ ❌ DUPLICATE!  Error
```

## API Request Flow

### Creating a Thread

```text
Client Request:
POST /api/forum/threads
{
  "message": "Hello world!",
  "title": "My Thread",
  "userId": "user123"
}

Server Processing:
1. Generate thread_id = Date.now().toString(16)
2. Set time = Date.now()
3. Set is_root = 1
4. Use provided title or generate from message
5. INSERT INTO forum_messages (...)

Server Response:
{
  "success": true,
  "threadId": "18d4f2a1b3c",
  "time": 1704123456700,
  "rootTitle": "My Thread"
}
```

### Adding a Reply

```text
Client Request:
POST /api/forum/threads/18d4f2a1b3c/messages
{
  "message": "Great post!",
  "userId": "user456"
}

Server Processing:
1. Verify thread exists (SELECT WHERE thread_id = ...)
2. Generate time = Date.now()
3. Set is_root = 0
4. Set root_title = NULL
5. INSERT INTO forum_messages (...)

Server Response:
{
  "success": true,
  "threadId": "18d4f2a1b3c",
  "time": 1704123500000
}
```

### Fetching Thread Messages

```text
Client Request:
GET /api/forum/threads/18d4f2a1b3c

Server Processing:
SELECT * FROM forum_messages
WHERE thread_id = '18d4f2a1b3c'
ORDER BY time ASC

Server Response:
{
  "messages": [
    { id: 1, is_root: 1, root_title: "My Thread", ... },
    { id: 2, is_root: 0, root_title: null, ... },
    { id: 3, is_root: 0, root_title: null, ... }
  ]
}
```

## Key Design Decisions

1. **Why Hex Thread IDs?**
   - Compact representation (12 chars vs 13 digits)
   - URL-friendly
   - No need for separate auto-increment ID lookup
   - Still sortable chronologically

2. **Why Single Table?**
   - Simpler schema
   - Easier to query all messages in thread
   - No JOIN needed for most queries
   - Is_root flag differentiates message types

3. **Why Generated Column for Constraint?**
   - MySQL doesn't support partial indexes (WHERE clause in index)
   - Generated column + unique index achieves same effect
   - Only root messages have non-NULL value
   - Enforces one root per thread at DB level

4. **Why Separate time and created_at?**
   - `time`: Application-level timestamp (milliseconds, used for thread_id)
   - `created_at`: MySQL timestamp (for audit/debugging)
   - Gives flexibility for chronological ordering
