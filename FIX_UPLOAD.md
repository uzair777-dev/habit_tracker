# FILE UPLOAD FIX - Apply these changes

## Problem

When uploading files from the forum, multer's `destination` callback runs BEFORE `req.body` is parsed,
so `req.body.userId` is undefined, causing "Missing userId" error.

## Solution

Send userId as both query parameter AND body field.

---

## FIX 1: backend/src/routes/upload.js (Line 19)

CHANGE LINE 19 FROM:

```javascript
        const userId = req.body.userId;
```

TO:

```javascript
        const userId = req.query.userId || req.body.userId;
```

This allows multer to get userId from query params during the destination callback.

---

## FIX 2: frontend/src/pages/Forum.jsx (Line 74)

CHANGE LINE 74 FROM:

```javascript
            const res = await axios.post(`${API_BASE}/api/upload/upload`, formData, {
```

TO:

```javascript
            const userId = user?.id || 'anonymous';
            const res = await axios.post(`${API_BASE}/api/upload/upload?userId=${userId}`, formData, {
```

AND UPDATE LINE 71 (add userId variable first):

```javascript
        const userId = user?.id || 'anonymous';
        const formData = new FormData();
        formData.append('file', file);
        formData.append('userId', userId);
```

This sends userId in both places so multer can access it.

---

## QUICK AUTOMATED FIX

Run these sed commands:

```bash
# Fix backend
sed -i '19s/const userId = req.body.userId;/const userId = req.query.userId || req.body.userId;/' /home/uzair/.gemini/antigravity/scratch/habit_tracker/backend/src/routes/upload.js

# Fix frontend - add userId variable
sed -i '68a\        const userId = user?.id || '\''anonymous'\'';' /home/uzair/.gemini/antigravity/scratch/habit_tracker/frontend/src/pages/Forum.jsx

# Fix frontend - update formData line
sed -i '72s/formData.append('\''userId'\'', user?.id || '\''anonymous'\'');/formData.append('\''userId'\'', userId);/' /home/uzair/.gemini/antigravity/scratch/habit_tracker/frontend/src/pages/Forum.jsx

# Fix frontend - update axios URL
sed -i '75s|`${API_BASE}/api/upload/upload`|`${API_BASE}/api/upload/upload?userId=${userId}`|' /home/uzair/.gemini/antigravity/scratch/habit_tracker/frontend/src/pages/Forum.jsx

# Fix frontend - update return URL
sed -i '80s|`${API_BASE}/api/upload/files/${user?.id || '\''anonymous'\''}/${res.data.filename}`|`${API_BASE}/api/upload/files/${userId}/${res.data.filename}`|' /home/uzair/.gemini/antigravity/scratch/habit_tracker/frontend/src/pages/Forum.jsx
```

After applying, restart backend and frontend!
