import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MessageSquare, Plus, Search, ArrowLeft, Upload, X, Paperclip, Send, Clock, User } from 'lucide-react';

const API_BASE = 'http://localhost:4000';

export default function Forum({ user }) {
    const [view, setView] = useState('list'); // 'list' or 'thread'
    const [threads, setThreads] = useState([]);
    const [currentThread, setCurrentThread] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    
    // New thread form
    const [showNewThreadModal, setShowNewThreadModal] = useState(false);
    const [newThreadTitle, setNewThreadTitle] = useState('');
    const [newThreadMessage, setNewThreadMessage] = useState('');
    const [newThreadFile, setNewThreadFile] = useState(null);
    
    // Reply form
    const [replyMessage, setReplyMessage] = useState('');
    const [replyFile, setReplyFile] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchThreads();
    }, []);

    const fetchThreads = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_BASE}/api/forum/threads`);
            setThreads(res.data.threads || []);
        } catch (err) {
            console.error('Failed to fetch threads:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchThreadMessages = async (threadId) => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_BASE}/api/forum/threads/${threadId}`);
            setMessages(res.data.messages || []);
            
            // Set current thread info from root message
            const rootMessage = res.data.messages.find(m => m.is_root === 1);
            if (rootMessage) {
                setCurrentThread({
                    thread_id: rootMessage.thread_id,
                    root_title: rootMessage.root_title,
                    time: rootMessage.time
                });
            }
            setView('thread');
        } catch (err) {
            console.error('Failed to fetch thread messages:', err);
            alert('Failed to load thread');
        } finally {
            setLoading(false);
        }
    };

    const uploadFile = async (file) => {
        if (!file) return null;
        
        const userId = user?.id || 'anonymous';
        const formData = new FormData();
        formData.append('file', file);
        formData.append('userId', userId);
        
        try {
            // Send userId as query param for multer destination callback
            const userId = user?.id || 'anonymous';
            const res = await axios.post(`${API_BASE}/api/upload/upload?userId=${userId}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            // Return the full URL to the file
            return `${API_BASE}/api/upload/files/${userId}/${res.data.filename}`;
        } catch (err) {
            console.error('File upload failed:', err);
            throw new Error('File upload failed');
        }
    };

    const createThread = async (e) => {
        e.preventDefault();
        if (!newThreadMessage.trim()) {
            alert('Message is required');
            return;
        }

        setSubmitting(true);
        try {
            // Upload file if present
            let attachmentUrl = null;
            if (newThreadFile) {
                attachmentUrl = await uploadFile(newThreadFile);
            }

            // Create thread
            await axios.post(`${API_BASE}/api/forum/threads`, {
                message: newThreadMessage,
                title: newThreadTitle.trim() || undefined, // Let backend auto-generate if empty
                userId: user?.id || null,
                attachment: attachmentUrl
            });

            // Reset form and refresh
            setShowNewThreadModal(false);
            setNewThreadTitle('');
            setNewThreadMessage('');
            setNewThreadFile(null);
            fetchThreads();
        } catch (err) {
            console.error('Failed to create thread:', err);
            alert('Failed to create thread');
        } finally {
            setSubmitting(false);
        }
    };

    const addReply = async (e) => {
        e.preventDefault();
        if (!replyMessage.trim()) {
            alert('Message is required');
            return;
        }

        setSubmitting(true);
        try {
            // Upload file if present
            let attachmentUrl = null;
            if (replyFile) {
                attachmentUrl = await uploadFile(replyFile);
            }

            // Post reply
            await axios.post(`${API_BASE}/api/forum/threads/${currentThread.thread_id}/messages`, {
                message: replyMessage,
                userId: user?.id || null,
                attachment: attachmentUrl
            });

            // Reset form and refresh thread
            setReplyMessage('');
            setReplyFile(null);
            fetchThreadMessages(currentThread.thread_id);
        } catch (err) {
            console.error('Failed to add reply:', err);
            alert('Failed to add reply');
        } finally {
            setSubmitting(false);
        }
    };

    const searchThreads = async () => {
        if (!searchQuery.trim()) {
            fetchThreads();
            return;
        }

        try {
            const res = await axios.get(`${API_BASE}/api/forum/search`, {
                params: { q: searchQuery, type: 'threads' }
            });
            setThreads(res.data.threads || []);
        } catch (err) {
            console.error('Search failed:', err);
        }
    };

    const formatDate = (timestamp) => {
        const date = new Date(parseInt(timestamp));
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getUserDisplay = (userId) => {
        if (!userId) return 'Anonymous';
        if (user && userId === user.id) return 'You';
        return `User ${userId.substring(0, 8)}`;
    };

    // Render thread list view
    if (view === 'list') {
        return (
            <div className="animate-fade-in">
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                    <h1>Community Forum</h1>
                    <button onClick={() => setShowNewThreadModal(true)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Plus size={18} /> New Thread
                    </button>
                </div>

                {/* Search */}
                <div className="glass-panel" style={{ padding: '16px', marginBottom: '24px' }}>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <input
                            type="text"
                            className="glass-input"
                            placeholder="Search threads..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && searchThreads()}
                            style={{ flex: 1 }}
                        />
                        <button onClick={searchThreads} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Search size={18} /> Search
                        </button>
                    </div>
                </div>

                {/* Thread List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {loading ? (
                        <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Loading threads...</p>
                    ) : threads.length === 0 ? (
                        <div className="glass-panel" style={{ padding: '48px', textAlign: 'center' }}>
                            <MessageSquare size={48} style={{ color: 'var(--text-secondary)', margin: '0 auto 16px' }} />
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>No threads yet. Be the first to start a discussion!</p>
                            <button onClick={() => setShowNewThreadModal(true)} className="btn-primary">
                                Create Thread
                            </button>
                        </div>
                    ) : (
                        threads.map(thread => (
                            <div
                                key={thread.id}
                                className="glass-panel"
                                style={{ padding: '24px', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}
                                onClick={() => fetchThreadMessages(thread.thread_id)}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                            >
                                <div style={{ display: 'flex', alignItems: 'start', gap: '16px' }}>
                                    {/* Avatar */}
                                    <div style={{
                                        minWidth: '40px',
                                        height: '40px',
                                        borderRadius: '50%',
                                        background: 'linear-gradient(135deg, #6d5dfc, #2b95ce)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '1.2rem'
                                    }}>
                                        <User size={20} />
                                    </div>

                                    {/* Content */}
                                    <div style={{ flex: 1 }}>
                                        <h3 style={{ marginBottom: '8px', fontSize: '1.2rem' }}>{thread.root_title}</h3>
                                        <p style={{
                                            color: 'var(--text-secondary)',
                                            lineHeight: '1.6',
                                            marginBottom: '12px',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            display: '-webkit-box',
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: 'vertical'
                                        }}>
                                            {thread.message}
                                        </p>

                                        <div style={{ display: 'flex', gap: '16px', fontSize: '0.875rem', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <User size={14} />
                                                {getUserDisplay(thread.user_id)}
                                            </span>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <MessageSquare size={14} />
                                                {thread.message_count || 1} {thread.message_count === 1 ? 'message' : 'messages'}
                                            </span>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <Clock size={14} />
                                                {formatDate(thread.time)}
                                            </span>
                                            {thread.attachment && (
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <Paperclip size={14} />
                                                    Attachment
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* New Thread Modal */}
                {showNewThreadModal && (
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
                    }} onClick={() => !submitting && setShowNewThreadModal(false)}>
                        <div
                            className="glass-panel"
                            style={{ padding: '32px', width: '600px', maxWidth: '100%', maxHeight: '90vh', overflow: 'auto' }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                <h2 style={{ margin: 0 }}>Create New Thread</h2>
                                <button
                                    onClick={() => setShowNewThreadModal(false)}
                                    className="btn-icon"
                                    disabled={submitting}
                                    style={{ padding: '8px' }}
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={createThread} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                        Title (optional - will auto-generate if empty)
                                    </label>
                                    <input
                                        className="glass-input"
                                        placeholder="Enter a title..."
                                        value={newThreadTitle}
                                        onChange={(e) => setNewThreadTitle(e.target.value)}
                                        disabled={submitting}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                        Message *
                                    </label>
                                    <textarea
                                        className="glass-input"
                                        placeholder="What would you like to discuss?"
                                        rows={6}
                                        value={newThreadMessage}
                                        onChange={(e) => setNewThreadMessage(e.target.value)}
                                        required
                                        disabled={submitting}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                        Attachment (optional)
                                    </label>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        <input
                                            type="file"
                                            id="thread-file"
                                            style={{ display: 'none' }}
                                            onChange={(e) => setNewThreadFile(e.target.files[0])}
                                            disabled={submitting}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => document.getElementById('thread-file').click()}
                                            className="btn-secondary"
                                            disabled={submitting}
                                            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                                        >
                                            <Upload size={16} /> Choose File
                                        </button>
                                        {newThreadFile && (
                                            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                                {newThreadFile.name}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
                                    <button
                                        type="button"
                                        onClick={() => setShowNewThreadModal(false)}
                                        className="btn-secondary"
                                        disabled={submitting}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn-primary"
                                        disabled={submitting}
                                    >
                                        {submitting ? 'Creating...' : 'Create Thread'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // Render individual thread view
    return (
        <div className="animate-fade-in">
            {/* Back button */}
            <button
                onClick={() => {
                    setView('list');
                    setCurrentThread(null);
                    setMessages([]);
                    fetchThreads();
                }}
                className="btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}
            >
                <ArrowLeft size={18} /> Back to Threads
            </button>

            {/* Thread header */}
            {currentThread && (
                <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
                    <h1 style={{ fontSize: '1.8rem', marginBottom: '8px' }}>{currentThread.root_title}</h1>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                        <Clock size={14} style={{ display: 'inline', marginRight: '4px' }} />
                        Started {formatDate(currentThread.time)}
                    </div>
                </div>
            )}

            {/* Messages */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                {loading ? (
                    <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Loading messages...</p>
                ) : (
                    messages.map((msg, idx) => (
                        <div
                            key={msg.id}
                            className="glass-panel"
                            style={{
                                padding: '24px',
                                borderLeft: msg.is_root ? '4px solid var(--accent)' : 'none'
                            }}
                        >
                            {/* Message header */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                                <div style={{
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '50%',
                                    background: msg.is_root
                                        ? 'linear-gradient(135deg, #6d5dfc, #2b95ce)'
                                        : 'linear-gradient(135deg, #ff9966, #ff5e62)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <User size={18} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 600 }}>
                                        {getUserDisplay(msg.user_id)}
                                        {msg.is_root && (
                                            <span style={{
                                                marginLeft: '8px',
                                                fontSize: '0.75rem',
                                                padding: '2px 8px',
                                                background: 'var(--accent)',
                                                borderRadius: '4px',
                                                fontWeight: 500
                                            }}>
                                                OP
                                            </span>
                                        )}
                                    </div>
                                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                        {formatDate(msg.time)}
                                    </div>
                                </div>
                            </div>

                            {/* Message content */}
                            <div style={{ lineHeight: '1.6', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                {msg.message}
                            </div>

                            {/* Attachment */}
                            {msg.attachment && (
                                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--glass-border)' }}>
                                    <a
                                        href={msg.attachment}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn-secondary"
                                        style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                                    >
                                        <Paperclip size={16} />
                                        View Attachment
                                    </a>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Reply form */}
            <div className="glass-panel" style={{ padding: '24px' }}>
                <h3 style={{ marginBottom: '16px' }}>Post a Reply</h3>
                <form onSubmit={addReply} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <textarea
                        className="glass-input"
                        placeholder="Write your reply..."
                        rows={4}
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        required
                        disabled={submitting}
                    />

                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <input
                            type="file"
                            id="reply-file"
                            style={{ display: 'none' }}
                            onChange={(e) => setReplyFile(e.target.files[0])}
                            disabled={submitting}
                        />
                        <button
                            type="button"
                            onClick={() => document.getElementById('reply-file').click()}
                            className="btn-secondary"
                            disabled={submitting}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                            <Upload size={16} /> Attach File
                        </button>
                        {replyFile && (
                            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                {replyFile.name}
                            </span>
                        )}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                            type="submit"
                            className="btn-primary"
                            disabled={submitting}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                            <Send size={16} />
                            {submitting ? 'Posting...' : 'Post Reply'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
