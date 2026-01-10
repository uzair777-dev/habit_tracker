
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Upload, CheckCircle, FileText, Trash2, Plus } from 'lucide-react';

export default function Dashboard({ user }) {
    const [habits, setHabits] = useState([]);
    const [uploads, setUploads] = useState([]);
    const [newHabit, setNewHabit] = useState('');
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        if (user) {
            fetchHabits();
            fetchUploads();
        }
    }, [user]);

    const fetchHabits = async () => {
        try {
            const res = await axios.get(`/api/habits?userId=${user.id}`);
            setHabits(res.data.habits || []);
        } catch (e) {
            console.error(e);
            // Stub
            setHabits([
                { id: 1, name: 'Drink Water', streak: 5 },
                { id: 2, name: 'Read Booking', streak: 12 }
            ]);
        }
    };

    const fetchUploads = async () => {
        try {
            const res = await axios.get(`/api/uploads?userId=${user.id}`);
            setUploads(res.data.uploads || []);
        } catch (e) {
            console.error(e);
        }
    };

    const addHabit = async (e) => {
        e.preventDefault();
        if (!newHabit) return;
        try {
            await axios.post('/api/habits', { userId: user.id, name: newHabit });
            setNewHabit('');
            fetchHabits();
        } catch (e) {
            alert('Failed to add habit');
        }
    };

    const incrementStreak = async (habitId) => {
        try {
            await axios.post(`/api/habits/${habitId}/increment`);
            fetchHabits();
        } catch (e) {
            // Optimistic update fallback or alert
            alert('Failed to update streak');
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setIsUploading(true);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('userId', user.id);

        try {
            await axios.post('/api/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            fetchUploads();
        } catch (err) {
            alert('Upload failed');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="animate-fade-in">
            <div className="glass-panel" style={{ padding: '32px', marginBottom: '32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <h1>Welcome back!</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>User ID: <span style={{ fontFamily: 'monospace', color: 'var(--accent)' }}>{user.id}</span></p>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <h2 style={{ fontSize: '3rem', margin: 0, color: 'var(--success)' }}>{habits.reduce((acc, h) => acc + h.streak, 0)}</h2>
                    <span style={{ color: 'var(--text-secondary)' }}>Total Streak Days</span>
                </div>
            </div>

            <div className="grid-layout">
                {/* Habits Section */}
                <section>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h2>My Habits</h2>
                    </div>

                    <form onSubmit={addHabit} style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
                        <input
                            className="glass-input"
                            placeholder="Add a new habit..."
                            value={newHabit}
                            onChange={e => setNewHabit(e.target.value)}
                        />
                        <button type="submit" className="btn-primary"><Plus /></button>
                    </form>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {habits.map(habit => (
                            <div key={habit.id} className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span style={{ fontWeight: '500' }}>{habit.name}</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <span style={{ color: 'var(--accent)', fontWeight: 'bold' }}>🔥 {habit.streak}</span>
                                    <button onClick={() => incrementStreak(habit.id)} className="btn-secondary" style={{ padding: '8px', color: 'var(--success)', borderColor: 'var(--success)' }}>
                                        <CheckCircle size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                        {habits.length === 0 && <p style={{ color: 'var(--text-secondary)' }}>No habits tracked yet.</p>}
                    </div>
                </section>

                {/* Uploads Section */}
                <section>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h2>My Files</h2>
                        <label className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                            <Upload size={16} />
                            {isUploading ? 'Uploading...' : 'Upload'}
                            <input type="file" style={{ display: 'none' }} onChange={handleFileUpload} />
                        </label>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {uploads.map(file => (
                            <div key={file.id} className="glass-panel" style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: '12px' }} title={file.filehash}>
                                <FileText size={20} color="var(--text-secondary)" />
                                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                                    {file.filename}
                                </div>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{new Date(file.uploaded_at).toLocaleDateString()}</span>
                            </div>
                        ))}
                        {uploads.length === 0 && <p style={{ color: 'var(--text-secondary)' }}>No files uploaded.</p>}
                    </div>
                </section>
            </div>
        </div>
    );
}
