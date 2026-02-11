// COMPLETE UPDATED Dashboard.jsx with Scheduling Support

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Upload, CheckCircle, Circle, FileText, Trash2, Plus, Calendar, X } from 'lucide-react';

import HabitCalendar from '../components/HabitCalendar';

export default function Dashboard({ user }) {
    const [habits, setHabits] = useState([]);
    const [uploads, setUploads] = useState([]);
    const [newHabit, setNewHabit] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    
    // New habit modal state
    const [showHabitModal, setShowHabitModal] = useState(false);
    const [habitName, setHabitName] = useState('');
    const [habitDescription, setHabitDescription] = useState('');
    const [habitEndDate, setHabitEndDate] = useState('');
    const [scheduleType, setScheduleType] = useState('daily');
    const [customDays, setCustomDays] = useState([]);

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
        }
    };

    const fetchUploads = async () => {
        try {
            const res = await axios.get(`/api/upload/uploads?userId=${user.id}`);
            setUploads(res.data.uploads || []);
        } catch (e) {
            console.error(e);
        }
    };

    const addHabit = async (e) => {
        e.preventDefault();
        if (!habitName.trim()) return;
        
        const scheduleDays = scheduleType === 'custom' ? customDays.join(',') : null;
        
        try {
            await axios.post('/api/habits', { 
                userId: user.id, 
                name: habitName,
                description: habitDescription,
                endDate: habitEndDate,
                scheduleType,
                scheduleDays
            });
            setHabitName('');
            setHabitDescription('');
            setHabitEndDate('');
            setScheduleType('daily');
            setCustomDays([]);
            setShowHabitModal(false);
            fetchHabits();
        } catch (e) {
            alert('Failed to add habit');
        }
    };

    const toggleComplete = async (habitId, isCompleted) => {
        try {
            if (isCompleted) {
                await axios.delete(`/api/habits/${habitId}/complete`);
            } else {
                await axios.post(`/api/habits/${habitId}/complete`, { userId: user.id });
            }
            fetchHabits();
        } catch (e) {
            alert('Failed to update habit');
        }
    };

    const toggleCustomDay = (day) => {
        setCustomDays(prev => 
            prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
        );
    };

    const getScheduleBadge = (habit) => {
        const badges = {
            daily: { text: 'Every Day', color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
            weekdays: { text: 'Weekdays', color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
            weekends: { text: 'Weekends', color: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' },
            custom: { text: 'Custom', color: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)' }
        };
        
        const badge = badges[habit.scheduleType] || badges.daily;
        
        return (
            <span style={{
                background: badge.color,
                color: 'white',
                padding: '4px 12px',
                borderRadius: '12px',
                fontSize: '0.75rem',
                fontWeight: '600',
                marginLeft: '8px'
            }}>
                {badge.text}
            </span>
        );
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setIsUploading(true);

        const formData = new FormData();
        formData.append('userId', user.id);
        formData.append('file', file);

        try {
            await axios.post('/api/upload/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            fetchUploads();
        } catch (err) {
            alert('Upload failed');
        } finally {
            setIsUploading(false);
        }
    };

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <div className="animate-fade-in">
            {/* Header */}
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
                        <button onClick={() => setShowHabitModal(true)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Plus size={18} /> New Habit
                        </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {habits.map(habit => (
                            <div key={habit.id} className="glass-panel" style={{ padding: '16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                                        <span style={{ fontWeight: '500', fontSize: '1.1rem' }}>{habit.name}</span>
                                        {getScheduleBadge(habit)}
                                    </div>
                                    <span style={{ color: 'var(--accent)', fontWeight: 'bold', fontSize: '1.1rem' }}>🔥 {habit.streak}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <button 
                                        onClick={() => toggleComplete(habit.id, habit.completedToday)} 
                                        className="btn-secondary" 
                                        disabled={!habit.scheduledToday}
                                        style={{ 
                                            padding: '8px 16px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            flex: 1,
                                            justifyContent: 'center',
                                            color: habit.completedToday ? 'var(--background)' : 'var(--success)', 
                                            backgroundColor: habit.completedToday ? 'var(--success)' : 'transparent',
                                            borderColor: habit.scheduledToday ? 'var(--success)' : 'var(--glass-border)',
                                            opacity: habit.scheduledToday ? 1 : 0.5,
                                            cursor: habit.scheduledToday ? 'pointer' : 'not-allowed'
                                        }}
                                        title={!habit.scheduledToday ? 'Not scheduled for today' : (habit.completedToday ? 'Mark incomplete' : 'Mark complete')}
                                    >
                                        {habit.completedToday ? <CheckCircle size={18} /> : <Circle size={18} />}
                                        {habit.scheduledToday ? (habit.completedToday ? 'Completed Today' : 'Mark Complete') : 'Not Scheduled Today'}
                                    </button>
                                </div>
                            </div>
                        ))}
                        {habits.length === 0 && <p style={{ color: 'var(--text-secondary)' }}>No habits tracked yet. Create one to get started!</p>}
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
                                    <a href={`http://localhost:4000/api/upload/files/${user.id}/${file.filename}`} target="_blank" rel="noreferrer" style={{color: 'inherit', textDecoration: 'none'}}>
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

            {/* New Habit Modal */}
            {showHabitModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    padding: '24px'
                }} onClick={() => setShowHabitModal(false)}>
                    <div
                        className="glass-panel"
                        style={{ padding: '32px', width: '500px', maxWidth: '100%' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h2 style={{ margin: 0 }}>Create New Habit</h2>
                            <button onClick={() => setShowHabitModal(false)} className="btn-icon" style={{ padding: '8px' }}>
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={addHabit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                    Habit Name *
                                </label>
                                <input
                                    className="glass-input"
                                    placeholder="e.g., Morning Exercise"
                                    value={habitName}
                                    onChange={e => setHabitName(e.target.value)}
                                    required
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                    Description (Optional)
                                </label>
                                <textarea
                                    className="glass-input"
                                    placeholder="Add details about your habit..."
                                    value={habitDescription}
                                    onChange={e => setHabitDescription(e.target.value)}
                                    style={{ minHeight: '80px', resize: 'vertical' }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                    End Date (Optional)
                                </label>
                                <input
                                    type="date"
                                    className="glass-input"
                                    value={habitEndDate}
                                    onChange={e => setHabitEndDate(e.target.value)}
                                    min={new Date().toISOString().split('T')[0]}
                                />
                                <small style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>
                                    Leave blank for indefinite habit
                                </small>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                    Schedule
                                </label>
                                <select
                                    className="glass-input"
                                    value={scheduleType}
                                    onChange={e => setScheduleType(e.target.value)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <option value="daily">Every Day</option>
                                    <option value="weekdays">Weekdays Only (Mon-Fri)</option>
                                    <option value="weekends">Weekends Only (Sat-Sun)</option>
                                    <option value="custom">Custom Days</option>
                                </select>
                            </div>

                            {scheduleType === 'custom' && (
                                <div>
                                    <label style={{ display: 'block', marginBottom: '12px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                        Select Days
                                    </label>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
                                        {dayNames.map((day, index) => (
                                            <button
                                                key={index}
                                                type="button"
                                                onClick={() => toggleCustomDay(index)}
                                                className={customDays.includes(index) ? 'btn-primary' : 'btn-secondary'}
                                                style={{
                                                    padding: '12px 4px',
                                                    fontSize: '0.85rem',
                                                    fontWeight: '600'
                                                }}
                                            >
                                                {day}
                                            </button>
                                        ))}
                                    </div>
                                    {customDays.length === 0 && (
                                        <p style={{ color: 'var(--error)', fontSize: '0.85rem', marginTop: '8px' }}>
                                            Please select at least one day
                                        </p>
                                    )}
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
                                <button
                                    type="button"
                                    onClick={() => setShowHabitModal(false)}
                                    className="btn-secondary"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn-primary"
                                    disabled={scheduleType === 'custom' && customDays.length === 0}
                                >
                                    Create Habit
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
