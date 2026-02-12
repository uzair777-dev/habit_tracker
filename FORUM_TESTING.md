# Forum Frontend - Testing Guide

## What Was Built

The frontend now includes a complete forum implementation with:

 **Thread List View**

- Display all forum threads with titles, previews, and metadata
- Message count, timestamps, and user info for each thread
- Search functionality to find threads
- Empty state with call-to-action

 **Thread Detail View**

- Full conversation view with all messages
- Root message highlighted with "OP" badge
- Chronological message ordering
- File attachments displayed with download links

 **Create Thread**

- Modal form with title, message, and file upload
- Auto-title generation if title is left empty
- File attachment support (integrates with upload API)
- Form validation

 **Reply to Thread**

- Reply form at bottom of thread view
- File attachment support for replies
- Real-time updates after posting

 **UI/UX Features**

- Glassmorphism design matching app aesthetic
- Smooth animations and transitions
- Responsive layout
- Loading states
- User-friendly error handling

## How to Test

### 1. Start All Services

You need 3 terminals:

**Terminal 1 - Database:**

```bash
cd /home/uzair/.gemini/antigravity/scratch/habit_tracker
python3 setup_db.py
```

**Terminal 2 - Backend:**

```bash
cd /home/uzair/.gemini/antigravity/scratch/habit_tracker/backend
npm start
```

**Terminal 3 - Frontend:**

```bash
cd /home/uzair/.gemini/antigravity/scratch/habit_tracker/frontend
npm run dev
```

### 2. Access the Application

Open your browser to: `http://localhost:5173` (or the URL shown in Terminal 3)

### 3. Test Forum Features

#### A. View Threads

1. Navigate to the home page (Forum)
2. You should see the thread list
3. If empty, you'll see "No threads yet" message

#### B. Create a Thread

**Without Login (Anonymous):**

1. Click "New Thread" button
2. Enter a message (title is optional)
3. Click "Create Thread"
4. You'll be posted as "Anonymous"

**With Login:**

1. Click "Login" in navbar
2. Sign up or login with email
3. Go to Forum page
4. Click "New Thread"
5. Enter title and message
6. Optionally attach a file using "Choose File"
7. Click "Create Thread"
8. Thread appears with your user ID

#### C. View Thread & Replies

1. Click on any thread card in the list
2. You'll see the full conversation
3. Root message (original post) has blue left border and "OP" badge
4. All replies shown below in chronological order

#### D. Reply to Thread

1. In thread view, scroll to bottom
2. Type your reply in the text area
3. Optionally attach a file
4. Click "Post Reply"
5. Your reply appears immediately in the thread

#### E. File Attachments

1. When creating thread/reply, click "Choose File"
2. Select any file from your computer
3. File name appears next to button
4. Submit the thread/reply
5. Attachment shows as "View Attachment" button
6. Click to download/view the file

#### F. Search Threads

1. Use search bar at top of thread list
2. Enter search term
3. Click "Search" or press Enter
4. Results filter to matching threads

## What You Should See

### Thread List View

```
┌─────────────────────────────────────────────┐
│  Community Forum          [+ New Thread]    │
├─────────────────────────────────────────────┤
│  [Search bar]                      [Search] │
├─────────────────────────────────────────────┤
│  ┌───────────────────────────────────────┐ │
│  │  Title of Thread                    │ │
│  │ Preview of message text...             │ │
│  │  User123 |  5 messages |  2h ago │ │
│  └───────────────────────────────────────┘ │
│  ┌───────────────────────────────────────┐ │
│  │  Another Thread                      │ │
│  │ ...                                    │ │
│  └───────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

### Thread Detail View

```
┌─────────────────────────────────────────────┐
│  [ Back to Threads]                        │
├─────────────────────────────────────────────┤
│  Thread Title                               │
│   Started Jan 19, 2026, 10:00 PM         │
├─────────────────────────────────────────────┤
│  ┌───────────────────────────────────────┐ │ Blue border
│  │  User123 [OP]      2h ago        │ │ (root msg)
│  │ Original post message content...      │ │
│  │ [ View Attachment]                  │ │
│  └───────────────────────────────────────┘ │
│  ┌───────────────────────────────────────┐ │
│  │  User456           1h ago        │ │
│  │ Reply message content...              │ │
│  └───────────────────────────────────────┘ │
├─────────────────────────────────────────────┤
│  Post a Reply                               │
│  [Text area for reply]                      │
│  [Choose File]                              │
│                          [Post Reply ]     │
└─────────────────────────────────────────────┘
```

## Test Scenarios

### Scenario 1: Anonymous Posting

1. Don't log in
2. Create a thread
3. Verify it shows as "Anonymous"
4. Reply to the thread
5. Verify reply also shows as "Anonymous"

### Scenario 2: Logged-In User

1. Login with email
2. Create a thread
3. Verify it shows "You" for your posts
4. Reply to your own thread
5. Verify "You" appears for your user
6. Logout and view the thread
7. Verify it shows your user ID (not "You")

### Scenario 3: File Attachments

1. Create thread with image file
2. Verify upload works
3. Open the thread
4. Click "View Attachment"
5. Verify image opens/downloads
6. Reply with PDF file
7. Verify PDF attachment works

### Scenario 4: Auto-Title Generation

1. Create thread WITHOUT entering a title
2. Enter message: "This is my first post about habit tracking"
3. Submit
4. Verify title is auto-generated: "This is my first post..."

### Scenario 5: Search

1. Create multiple threads with different keywords
2. Use search to find specific thread
3. Verify results filter correctly
4. Clear search to see all threads again

## Troubleshooting

### Issue: "Failed to create thread"

**Check:**

- Backend is running on port 4000
- Browser console for errors
- Network tab shows request to `/api/forum/threads`

### Issue: "Failed to load thread"

**Check:**

- Thread ID is valid hexadecimal
- Backend database has the thread
- Check browser console for 404 errors

### Issue: File upload fails

**Check:**

- User ID is set (either logged in or anonymous)
- File size isn't too large
- `uploads/` directory exists in project root
- Backend upload route is working

### Issue: Threads don't appear

**Check:**

- Database was reinitialized with new schema
- Backend is using correct API endpoints (`/api/forum/*`)
- CORS is enabled in backend
- Browser console for API errors

### Issue: "Anonymous" instead of user name

**This is expected behavior:**

- Not logged in = Anonymous
- Logged in = Shows "You" for your posts, user ID for others

## 🎨 Customization

You can customize the forum appearance in `frontend/src/index.css`:

```css
/* Change accent color */
--accent: #6d5dfc;  /* Purple - change to any color */

/* Change glass effect */
--bg-card: rgba(30, 34, 48, 0.7);  /* Adjust transparency */

/* Change text colors */
--text-primary: #ffffff;
--text-secondary: #a0aaec;
```

## API Endpoints Used

The frontend makes these API calls:

1. **GET** `/api/forum/threads` - Fetch all threads
2. **POST** `/api/forum/threads` - Create new thread
3. **GET** `/api/forum/threads/:threadId` - Get thread messages
4. **POST** `/api/forum/threads/:threadId/messages` - Add reply
5. **GET** `/api/forum/search?q=...` - Search threads
6. **POST** `/api/upload/upload` - Upload file
7. **GET** `/api/upload/files/:userId/:filename` - Access file

## Features Checklist

Backend:

- [x] Thread creation with hex IDs
- [x] Auto-title generation
- [x] Reply posting
- [x] File attachments
- [x] Search functionality
- [x] Anonymous posting support

Frontend:

- [x] Thread list view
- [x] Thread detail view
- [x] Create thread modal
- [x] Reply form
- [x] File upload UI
- [x] Search interface
- [x] Responsive design
- [x] Loading states
- [x] Error handling
- [x] User display (You/Anonymous/UserID)
- [x] Glassmorphism styling
- [x] Smooth animations

## Success Criteria

Your forum is working correctly if:

 You can create threads without logging in (anonymous)
 You can create threads while logged in (with user ID)
 Titles auto-generate if left empty
 You can view full thread conversations
 You can reply to threads
 File attachments upload and display correctly
 Search finds matching threads
 UI looks polished with glassmorphism design
 All transitions are smooth
 No console errors

Enjoy your fully functional forum!
