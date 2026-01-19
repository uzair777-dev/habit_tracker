const fs = require('fs');
const path = '/home/uzair/.gemini/antigravity/scratch/habit_tracker/frontend/src/pages/Forum.jsx';

// Read the file
let content = fs.readFileSync(path, 'utf8');

// Replace the uploadFile function
const oldFunction = `    const uploadFile = async (file) => {
        if (!file) return null;
        
        const formData = new FormData();
        formData.append('file', file);
        formData.append('userId', user?.id || 'anonymous');
        
        try {
            const res = await axios.post(\`\${API_BASE}/api/upload/upload\`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            // Return the full URL to the file
            return \`\${API_BASE}/api/upload/files/\${user?.id || 'anonymous'}/\${res.data.filename}\`;
        } catch (err) {
            console.error('File upload failed:', err);
            throw new Error('File upload failed');
        }
    };`;

const newFunction = `    const uploadFile = async (file) => {
        if (!file) return null;
        
        const userId = user?.id || 'anonymous';
        const formData = new FormData();
        formData.append('file', file);
        formData.append('userId', userId);
        
        try {
            // Send userId as query param for multer destination callback
            const res = await axios.post(\`\${API_BASE}/api/upload/upload?userId=\${userId}\`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            // Return the full URL to the file
            return \`\${API_BASE}/api/upload/files/\${userId}/\${res.data.filename}\`;
        } catch (err) {
            console.error('File upload failed:', err);
            throw new Error('File upload failed');
        }
    };`;

// Replace
content = content.replace(oldFunction, newFunction);

// Write back
fs.writeFileSync(path, content, 'utf8');
console.log('Fixed Forum.jsx uploadFile function!');
