# Quick Start - Forum System

Get the forum up and running in 3 terminals!

## Prerequisites

Make sure you have:

- Node.js v18+ installed
- Python 3 installed
- npm installed
- Project dependencies installed (see main README)

## Step 1: Reset Database (First Time Only)

If this is your first time or you need to update the database schema:

```bash
cd /home/uzair/.gemini/antigravity/scratch/habit_tracker

# Remove old database
rm -rf data_p/

# The database will be created when you run setup_db.py
```

## Step 2: Start Database (Terminal 1)

```bash
cd /home/uzair/.gemini/antigravity/scratch/habit_tracker
python3 setup_db.py
```

**Wait for:** "Server seems up" message  
**Important:** Keep this terminal open! Closing it stops the database.

## Step 3: Start Backend (Terminal 2)

```bash
cd /home/uzair/.gemini/antigravity/scratch/habit_tracker/backend
npm start
```

**Wait for:** "Backend server listening on port 4000"  
**Important:** Keep this terminal open!

## Step 4: Start Frontend (Terminal 3)

```bash
cd /home/uzair/.gemini/antigravity/scratch/habit_tracker/frontend
npm run dev
```

**Wait for:** URL like "<http://localhost:5173>"  
**Keep this terminal open!**

## Step 5: Open in Browser

Click the URL from Terminal 3, or manually go to:
**<http://localhost:5173>**

## You're Ready

### Quick Test Flow

1. **Create a Thread (Anonymous)**
   - Click "New Thread" button
   - Type a message (title is optional - it will auto-generate!)
   - Click "Create Thread"
   - Thread appears in the list

2. **View Thread**
   - Click on the thread card
   - See your message with "OP" badge and blue border
   - Scroll down to reply form

3. **Reply to Thread**
   - Type your reply
   - Click "Post Reply"
   - Your reply appears in the conversation

4. **Test with Login**
   - Click "Login" in navbar
   - Sign up with any email/password
   - Go back to forum
   - Create thread/reply
   - Notice it now shows "You" instead of "Anonymous"

5. **Upload Files**
   - When creating thread or reply
   - Click "Choose File" button
   - Select any file
   - Submit
   - File appears with "View Attachment" link

6. **Search**
   - Use search bar at top
   - Type any word from thread titles/messages
   - Click "Search"
   - Results filter to matching threads

## Optional: Test Backend API Directly

In a 4th terminal:

```bash
cd /home/uzair/.gemini/antigravity/scratch/habit_tracker/backend
node test_forum.js
```

This runs automated tests of all API endpoints.

## Troubleshooting

### "Failed to create thread"

- Check Terminal 2 (backend) is running
- Check Terminal 1 (database) shows "Server seems up"

### Threads don't appear

- Check browser console (F12) for errors
- Verify URL is <http://localhost:5173> (not 5174 or other)
- Check Terminal 2 for backend errors

### Port already in use

- **Port 3307:** Kill any running MariaDB: `pkill -f mariadbd`
- **Port 4000:** Kill backend: `pkill -f "node.*backend"`
- **Port 5173:** Kill frontend: `pkill -f "vite"`

### Database errors

- Stop Terminal 1 (Ctrl+C)
- Remove database: `rm -rf data_p/`
- Restart Terminal 1: `python3 setup_db.py`

## Need More Help?

See detailed guides:

- **[FORUM_TESTING.md](FORUM_TESTING.md)** - Comprehensive testing guide
- **[FORUM_ARCHITECTURE.md](FORUM_ARCHITECTURE.md)** - How it works
- **[FORUM_MIGRATION.md](FORUM_MIGRATION.md)** - Database migration details
- **[README.md](README.md)** - Full project documentation

If anything pops up, deal with it. Please don't come to me if anything breaks, I had the worst time with this project.

---

## What's Working

Thread creation with hex IDs  
Auto-title generation  
Anonymous posting  
User ID posting (when logged in)  
Reply to threads  
File attachments (upload/download)  
Search threads  
Glassmorphism UI  
Responsive design  
Real-time updates  
.. and many more that i have't implemented

**Everything is ready to go! Just start the 3 terminals and you're good!**
