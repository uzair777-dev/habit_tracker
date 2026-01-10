
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MessageSquare, Plus } from 'lucide-react';

export default function Forum({ user }) {
    const [threads, setThreads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newThreadTitle, setNewThreadTitle] = useState('');
    const [newThreadContent, setNewThreadContent] = useState('');
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        fetchThreads();
    }, []);

    const fetchThreads = async () => {
        try {
            // Assuming GET /api/threads endpoint
            const res = await axios.get('/api/threads');
            setThreads(res.data.threads || []);
        } catch (err) {
            console.error("Failed to fetch threads", err);
            // Stub data for demo if backend fails or is empty
            setThreads([
                { id: 1, title: 'Welcome to the Habit Tracker Forum!', content: 'Share your progress here.', user_id: 'Admin', created_at: new Date().toISOString() }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const createThread = async (e) => {
        e.preventDefault();
        if (!newThreadTitle || !newThreadContent) return;

        try {
            await axios.post('/api/threads', { title: newThreadTitle, content: newThreadContent, userId: user?.id });
            fetchThreads();
            setShowModal(false);
            setNewThreadTitle('');
            setNewThreadContent('');
        } catch (err) {
            alert('Failed to create thread');
        }
    };

    return (
        <div className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                <h1>Community Forum</h1>
                {user && (
                    <button onClick={() => setShowModal(true)} className="btn-primary">
                        <Plus size={18} style={{ marginRight: '8px' }} /> New Thread
                    </button>
                )}
            </div>

            {showModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div className="glass-panel" style={{ padding: '32px', width: '500px', maxWidth: '90%' }}>
                        <h2>Create New Thread</h2>
                        <form onSubmit={createThread} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
                            <input
                                className="glass-input"
                                placeholder="Thread Title"
                                value={newThreadTitle}
                                onChange={e => setNewThreadTitle(e.target.value)}
                            />
                            <textarea
                                className="glass-input"
                                placeholder="What's on your mind?"
                                rows={5}
                                value={newThreadContent}
                                onChange={e => setNewThreadContent(e.target.value)}
                            />
                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                                <button type="submit" className="btn-primary">Post</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="grid-layout">
                {loading ? <p>Loading discussions...</p> : threads.map(thread => (
                    <div key={thread.id} className="glass-panel" style={{ padding: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(45deg, #ff9966, #ff5e62)' }}></div>
                            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                {thread.user_id ? `User ${thread.user_id.substring(0, 6)}...` : 'Anonymous'}
                            </span>
                        </div>
                        <h3 style={{ marginBottom: '8px' }}>{thread.title}</h3>
                        <p style={{ color: 'var(--text-secondary)', lineHeight: '1.5' }}>{thread.content}</p>
                        <div style={{ marginTop: '16px', display: 'flex', gap: '16px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <MessageSquare size={14} /> Comments
                            </span>
                            <span>{new Date(thread.created_at).toLocaleDateString()}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
