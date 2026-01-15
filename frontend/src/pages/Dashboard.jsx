import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Upload, CheckCircle, Circle, FileText, Trash2, Plus } from 'lucide-react';

import HabitCalendar from '../components/HabitCalendar';

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
            setHabits(res.data || []);
        } catch (e) {
            console.error(e);
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

    const toggleComplete = async (habitId, isCompleted) => {
        try {
            if (isCompleted) {
                // Unmark completion
                await axios.delete(`/api/habits/${habitId}/complete`);
            } else {
                // Mark as complete
                await axios.post(`/api/habits/${habitId}/complete`, { userId: user.id });
            }
            fetchHabits();
        } catch (e) {
            alert('Failed to update habit');
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setIsUploading(true);

        const formData = new FormData();
        formData.append('userId', user.id);
        formData.append('file', file);

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
                                    <button 
                                        onClick={() => toggleComplete(habit.id, habit.completedToday)} 
                                        className="btn-secondary" 
                                        style={{ 
                                            padding: '8px', 
                                            color: habit.completedToday ? 'var(--background)' : 'var(--success)', 
                                            backgroundColor: habit.completedToday ? 'var(--success)' : 'transparent',
                                            borderColor: 'var(--success)' 
                                        }}
                                        title={habit.completedToday ? 'Mark incomplete' : 'Mark complete'}
                                    >
                                        {habit.completedToday ? <CheckCircle size={18} /> : <Circle size={18} />}
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
                                    <a href={`http://localhost:4000/api/files/${user.id}/${file.filename}`} target="_blank" rel="noreferrer" style={{color: 'inherit', textDecoration: 'none'}}>
                                        {file.filename}
                                    </a>
                                </div>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{new Date(file.uploaded_at).toLocaleDateString()}</span>
                            </div>
                        ))}
                        {uploads.length === 0 && <p style={{ color: 'var(--text-secondary)' }}>No files uploaded.</p>}
                    </div>
                </section>
            </div>

            {/* Calendar Section */}
            <div className="glass-panel" style={{ padding: '32px', marginTop: '32px' }}>
                <h2 style={{ marginBottom: '24px' }}>Habit Calendar</h2>
                <HabitCalendar user={user} habits={habits} />
            </div>
        </div>
    );
}
