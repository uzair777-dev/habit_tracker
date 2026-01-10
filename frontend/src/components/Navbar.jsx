
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, LayoutDashboard, LogIn, LogOut } from 'lucide-react';

export default function Navbar({ user, onLogout }) {
    const navigate = useNavigate();

    return (
        <nav className="glass-panel navbar animate-fade-in">
            <div className="logo" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2 style={{ fontSize: '1.5rem', margin: 0 }}>Habit<span style={{ color: 'var(--accent)' }}>Flow</span></h2>
            </div>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                <Link to="/" className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Home size={18} /> Forum
                </Link>
                {user ? (
                    <>
                        <Link to="/dashboard" className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <LayoutDashboard size={18} /> Dashboard
                        </Link>
                        <button onClick={onLogout} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <LogOut size={18} /> Logout
                        </button>
                    </>
                ) : (
                    <Link to="/login" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <LogIn size={18} /> Login
                    </Link>
                )}
            </div>
        </nav>
    );
}
