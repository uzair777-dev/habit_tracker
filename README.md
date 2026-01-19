# Nexus - Habit Tracker & Forum

Nexus is a state-of-the-art<sub>(lol)</sub> Habit Tracker and Community Forum built with a React (Vite) frontend and Node.js/Express backend, backed by a managed local MySQL/MariaDB instance.

------------------------

## Notice

This project is just our yearly project for college stuff, we might not update it further.
But, bare in mind that when I will leave this project be it will be in a great shape <sup>(Hopefully)</sup>.
~~And probably will be documented properly.~~ [^1]

------------------------

## Features

-   **Public Forum**: Thread-based messaging with hex thread IDs, root/reply hierarchy, auto-title generation, and attachment support.
-   **Habit Tracker**: Track your daily habits and streaks personalized to your user ID. [^2]
-   **User System**: Unique 64-bit Hex ID generation based on creation timestamp.
-   **File Storage**: Secure file upload with deduplication (hashing) and expiration logic.
-   **Rich UI**: Glassmorphism design with responsive dark mode.
-   **Local Database Management**: Automated local database instance setup script to avoid system-wide configuration conflicts.

## Architecture

-   **Frontend**: React + Vite + Tailwind CSS (located in `frontend/`)
-   **Backend**: Node.js + Express (located in `backend/`)
-   **Database**: MariaDB/MySQL running locally on port 3307 (managed by `setup_db.py`)
-   **Configuration**: `config/config.json`

## Prerequisites

-   **Node.js** (v18 or higher)
-   **npm** (comes with Node.js)
-   **Python 3** (for the database setup script)
-   **MySQL/MariaDB Client** (installed via brew/apt, needed for the `mysql` command)

## Installation & Setup

> Something is better than nothing - Albert Einstein (probably)

Follow these steps to get the application running completely locally.

### 1. Install Dependencies

You need to install dependencies for both the backend and frontend. Both of them have a different node env, so yeah...

```bash
# Install Backend Dependencies
cd backend
npm install

# Install Frontend Dependencies
cd ../frontend
npm install

# Return to root
cd ..
```

### 2. Initialize and Run Database

It uses a custom Python script to spin up a local, isolated MariaDB instance on port `3307`. Why you ask? Why not? 😆. Also this prevents conflicts with any existing MySQL installations on your system.

**Open a new terminal** in the project root and run:

```bash
python3 setup_db.py
```

**IMPORTANT:**
-   This script initializes the database in the `data_p/` directory.
-   It starts the MariaDB server.
-   It imports the schema from `db/schema.sql`.
-   **You must keep this terminal window OPEN.** If you close it, the database server will stop <sub>*duh*</sub>. Also applies to other terminal windows.

### 3. Start the Backend Server

**Open a second terminal** in the project root and run:

```bash
cd backend
npm start
```

The server will start on **port 4000** (default) or the port specified in `config/config.json`.
You should see: `Backend server listening on port 4000`.

### 4. Start the Frontend Application

**Open a third terminal** in the project root and run:

```bash
cd frontend
npm run dev
```

The frontend development server will start (usually on **port 5173**).
Click the link shown in the terminal (e.g., `http://localhost:5173`) to open the application in your browser.

## Usage Guide

1.  **Access the App**: Navigate to the frontend URL (http://localhost:5173, or any url that will be given while starting the frontend server).
2.  **Identity**: Your User ID is automatically generated and stored in a cookie. You can see it in the Navbar.
3.  **Forum**: Post anonymous messages. Your User ID is attached to your posts(yet to implement, will probably implement).
4.  **Habits**: Add habits to track. These are saved to your ID(yet to implement \*again*).
5.  **Files**: Upload files. The system calculates a hash to prevent duplicates and stores metadata in the DB.

## Troubleshooting

> These are some measure that i hurdled while developing. Honestly, i don't even know if they'll help or not but here it is

-   **Database Connection Error**:
    -   Ensure `python3 setup_db.py` is running in a separate terminal.
    -   Verify it says "Server seems up".
    -   Check if port 3307 is available.

-   **Frontend issues**:
    -   If the frontend cannot connect to the backend, ensure the backend is running on port 4000.
    -   Check the browser console for CORS errors (the backend is configured to allow CORS).

-   **Port Conflicts**:
    -   If `setup_db.py` fails, ensure no other process is using port 3307. The script attempts to kill processes on this port, but might need manual intervention.

## Project Structure

```
├── backend/            # Express server source
│   ├── src/
│   │   ├── index.js        # Main server entry point
│   │   ├── db.js           # Database connection pool
│   │   └── routes/
│   │       ├── auth.js     # Authentication routes
│   │       ├── forum.js    # Forum API routes
│   │       ├── habits.js   # Habit tracker routes
│   │       └── upload.js   # File upload routes
│   └── package.json
├── frontend/           # React + Vite source
├── config/             # Configuration files
├── db/                 # Database schema scripts
│   └── schema.sql      # Database initialization script
├── data_p/             # Local database storage (auto-generated)
├── uploads/            # API File uploads storage (organized by user_id)
├── setup_db.py         # DB orchestration script
└── README.md           # This file
```

## Architecture and Implementation

### Database Schema

The application uses three separate MariaDB databases:

1. **`user_auth`** - User authentication and identity
2. **`habit_tracker_db`** - Habits, completions, and file uploads
3. **`forum_db`** - Forum messages and threads

### Forum Architecture

The forum implements a **thread-based messaging system** with the following design:

#### Thread ID Generation
- **Thread ID**: Hexadecimal representation of creation timestamp (milliseconds since epoch)
  - Example: `18d4f2a1b3c` represents timestamp `1704123456700`
  - Generated using: `Date.now().toString(16)`
- **Time**: Normal numerical timestamp in milliseconds
  - Stored separately for easier querying and sorting

#### Message Structure

Every message in the forum has the following properties:

| Property | Type | Description |
|----------|------|-------------|
| `id` | INT | Auto-incremented primary key |
| `thread_id` | VARCHAR(32) | Hexadecimal thread identifier (shared by all messages in thread) |
| `time` | BIGINT | Numerical timestamp in milliseconds |
| `user_id` | VARCHAR(255) | User ID (nullable for anonymous posts) |
| `message` | TEXT | The actual message content |
| `is_root` | TINYINT(1) | Binary flag: `1` for root message, `0` for replies |
| `root_title` | VARCHAR(255) | Thread title (only for root messages) |
| `attachment` | VARCHAR(512) | Public shareable URL to uploaded file |
| `created_at` | TIMESTAMP | MySQL auto-generated timestamp |

#### Root Messages vs. Replies

- **Root Message** (`is_root = 1`):
  - Only ONE root message per thread (enforced by unique constraint)
  - Has a `root_title` field
  - Created when a new thread is started
  - Thread ID is generated at root message creation
  
- **Reply Messages** (`is_root = 0`):
  - Multiple replies can exist in a thread
  - Share the same `thread_id` as the root message
  - `root_title` is always `NULL` for replies
  - Each reply has its own unique timestamp

#### Title Generation

When creating a root message:
1. If user provides a title → use it directly
2. If no title provided → auto-generate from message content:
   - Takes first 5 words OR first 50 characters (whichever is shorter)
   - Adds "..." if message is longer
   - Falls back to "Untitled" if message is empty

#### File Attachments

Attachments are integrated with the upload system:
- Files uploaded via `/api/upload/upload` endpoint
- Stored in `uploads/[user_id]/[filename]`
- Hash and metadata saved in `habit_tracker_db.uploads` table
- Accessible via public URL: `/api/upload/files/[user_id]/[filename]`
- When creating a message, pass the full URL as `attachment` field

### Forum API Endpoints

#### Get All Threads
```http
GET /api/forum/threads
```
Returns all root messages (threads) with message count.

**Response:**
```json
{
  "threads": [
    {
      "id": 1,
      "thread_id": "18d4f2a1b3c",
      "time": 1704123456700,
      "user_id": "abc123",
      "message": "This is the first post...",
      "is_root": 1,
      "root_title": "My First Thread",
      "attachment": "http://localhost:4000/api/upload/files/abc123/image.png",
      "created_at": "2024-01-01T12:00:00.000Z",
      "message_count": 5
    }
  ]
}
```

#### Get Thread Messages
```http
GET /api/forum/threads/:threadId
```
Returns all messages in a specific thread, ordered chronologically.

**Response:**
```json
{
  "messages": [
    {
      "id": 1,
      "thread_id": "18d4f2a1b3c",
      "time": 1704123456700,
      "user_id": "abc123",
      "message": "Root message content",
      "is_root": 1,
      "root_title": "Thread Title",
      "attachment": null
    },
    {
      "id": 2,
      "thread_id": "18d4f2a1b3c",
      "time": 1704123500000,
      "user_id": "def456",
      "message": "Reply message",
      "is_root": 0,
      "root_title": null,
      "attachment": null
    }
  ]
}
```

#### Create New Thread
```http
POST /api/forum/threads
Content-Type: application/json

{
  "message": "Thread content here",
  "title": "Optional thread title",
  "userId": "optional_user_id",
  "attachment": "http://localhost:4000/api/upload/files/user123/file.pdf"
}
```

**Response:**
```json
{
  "success": true,
  "threadId": "18d4f2a1b3c",
  "time": 1704123456700,
  "rootTitle": "Optional thread title"
}
```

#### Add Reply to Thread
```http
POST /api/forum/threads/:threadId/messages
Content-Type: application/json

{
  "message": "Reply content here",
  "userId": "optional_user_id",
  "attachment": "optional_attachment_url"
}
```

**Response:**
```json
{
  "success": true,
  "threadId": "18d4f2a1b3c",
  "time": 1704123500000
}
```

#### Search Forum
```http
GET /api/forum/search?q=search_term&type=threads
```
Search in threads (root messages only) or all messages.

**Query Parameters:**
- `q`: Search query (required)
- `type`: `threads` or `messages` (default: `threads`)

#### Delete Message
```http
DELETE /api/forum/messages/:messageId
```
Deletes a message. If root message is deleted, entire thread is removed.

### Data Flow Example

**Creating a thread with attachment:**

1. User uploads file:
   ```bash
   POST /api/upload/upload
   FormData: { file: [binary], userId: "user123" }
   ```
   Response: `{ fileHash: "abc...", filename: "document.pdf" }`

2. User creates thread with attachment:
   ```bash
   POST /api/forum/threads
   {
     "message": "Check out this document!",
     "title": "Important Document",
     "userId": "user123",
     "attachment": "http://localhost:4000/api/upload/files/user123/document.pdf"
   }
   ```
   Response: `{ threadId: "18d4f2a1b3c", ... }`

3. Other users reply:
   ```bash
   POST /api/forum/threads/18d4f2a1b3c/messages
   {
     "message": "Thanks for sharing!",
     "userId": "user456"
   }
   ```

4. Fetch entire thread:
   ```bash
   GET /api/forum/threads/18d4f2a1b3c
   ```
   Returns all messages in chronological order.

### Implementation Details

- **Thread ID Uniqueness**: Since thread IDs are based on millisecond timestamps converted to hex, collisions are extremely rare (would require two threads created in same millisecond)
- **Root Message Constraint**: Database enforces unique constraint on `(thread_id, is_root)` pair to ensure only one root per thread
- **Anonymous Posting**: `user_id` is nullable, allowing anonymous forum participation
- **File Cleanup**: Uploaded files follow expiration logic (10 days) implemented in `upload.js`
- **Performance**: Indexes on `thread_id`, `time`, and `is_root` for fast queries


 -------

## Additional Documentation

- **[FORUM_ARCHITECTURE.md](FORUM_ARCHITECTURE.md)** - Detailed visual diagrams and architecture explanation
- **[FORUM_MIGRATION.md](FORUM_MIGRATION.md)** - Migration guide for updating to the new forum schema
- **Testing**: Run `node backend/test_forum.js` to test the forum API

## Footnotes

[^1]: *Foreshadowing*
[^2]: Yet to be implemented
 