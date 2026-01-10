
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Mail, Phone, Globe, Facebook, Lock, User } from 'lucide-react';

export default function Login({ onLogin }) {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [remember, setRemember] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const endpoint = isLogin ? '/api/login' : '/api/signup';
        try {
            const res = await axios.post(endpoint, { email, password, remember });
            if (res.data.success) {
                onLogin({ id: res.data.userId, email }); // In real app, maybe token
                navigate('/dashboard');
            } else {
                setError(res.data.message || 'Authentication failed');
            }
        } catch (err) {
            setError('Server error. Please try again.');
        }
    };

    const showStub = (provider) => {
        alert(`Login with ${provider} is Work in Progress!`);
    };

    return (
        <div className="animate-fade-in" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
            <div className="glass-panel" style={{ padding: '40px', width: '400px', maxWidth: '100%' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '8px' }}>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
                <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '32px' }}>
                    {isLogin ? 'Enter your credentials to access your account' : 'Sign up to start tracking your habits'}
                </p>

                {error && <div style={{ background: 'rgba(255, 71, 87, 0.1)', color: 'var(--error)', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.9rem', textAlign: 'center' }}>{error}</div>}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ position: 'relative' }}>
                        <Mail size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                        <input
                            type="email"
                            className="glass-input"
                            style={{ paddingLeft: '44px' }}
                            placeholder="Email Address"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div style={{ position: 'relative' }}>
                        <Lock size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                        <input
                            type="password"
                            className="glass-input"
                            style={{ paddingLeft: '44px' }}
                            placeholder="Password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    {isLogin && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                            <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} />
                            <label>Remember me</label>
                        </div>
                    )}

                    <button type="submit" className="btn-primary" style={{ width: '100%' }}>
                        {isLogin ? 'Sign In' : 'Sign Up'}
                    </button>
                </form>

                <div style={{ marginTop: '32px', textAlign: 'center' }}>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '16px' }}>Or continue with</p>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
                        <button onClick={() => showStub('Phone')} className="btn-secondary" style={{ padding: '12px' }}><Phone size={20} /></button>
                        <button onClick={() => showStub('Google')} className="btn-secondary" style={{ padding: '12px' }}><Globe size={20} /></button>
                        <button onClick={() => showStub('Facebook')} className="btn-secondary" style={{ padding: '12px' }}><Facebook size={20} /></button>
                    </div>
                </div>

                <div style={{ marginTop: '32px', textAlign: 'center', borderTop: '1px solid var(--glass-border)', paddingTop: '24px' }}>
                    <button
                        onClick={() => { setIsLogin(!isLogin); setError(''); }}
                        style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '0.9rem' }}
                    >
                        {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                    </button>
                </div>
            </div>
        </div>
    );
}
