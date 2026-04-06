import React, { createContext, useState, useEffect } from 'react';
import api from '../api/axiosConfig';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
    });
    
    const [terminationNotice, setTerminationNotice] = useState(false);

    const login = async (email, password) => {
        const response = await api.post('/auth/login', { email, password });
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('userRole', response.data.user.role); 
        localStorage.setItem('user', JSON.stringify(response.data.user)); 
        setUser(response.data.user);
    };

    const logout = () => {
        localStorage.clear();
        setUser(null);
    };

    // BULLETPROOF REAL-TIME HEARTBEAT
    useEffect(() => {
        if (!user) return;
        const interval = setInterval(async () => {
            try {
                const res = await api.get(`/users/${user.id}/profile`);
                
                // If the database says they are blocked, kill the session
                if (res.data && (res.data.blocked === true || res.data.isBlocked === true)) {
                    setTerminationNotice(true);
                    setTimeout(() => { logout(); setTerminationNotice(false); window.location.href = '/'; }, 4000);
                } 
                // If the database says they are verified, update silently
                else if (res.data && res.data.verified !== user.verified) {
                    const updatedUser = { ...user, verified: res.data.verified };
                    setUser(updatedUser);
                    localStorage.setItem('user', JSON.stringify(updatedUser));
                }
            } catch (error) {}
        }, 3000); // Check every 3 seconds for near-instant admin blocks
        
        return () => clearInterval(interval);
    }, [user]);

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
            
            {terminationNotice && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.95)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white', flexDirection: 'column', textAlign: 'center', padding: '20px' }}>
                    <div style={{ fontSize: '60px', marginBottom: '20px' }}>🛑</div>
                    <h1 style={{ color: '#e74c3c', margin: '0 0 10px 0' }}>Session Terminated</h1>
                    <p style={{ fontSize: '18px', maxWidth: '500px', lineHeight: '1.5' }}>Your access to Alumni Connect has been suspended by the System Administrator.</p>
                    <p style={{ marginTop: '30px', color: '#7f8c8d' }}>Logging you out securely...</p>
                </div>
            )}
        </AuthContext.Provider>
    );
};