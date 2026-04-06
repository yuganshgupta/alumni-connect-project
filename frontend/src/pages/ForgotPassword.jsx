import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axiosConfig';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const res = await api.post('/auth/forgot-password', { email });
            setMessage(res.data);
        } catch (error) {
            setMessage("An error occurred. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const css = {
        container: { display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', background: '#f4f7f6' },
        card: { background: 'white', padding: '40px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px', textAlign: 'center' },
        input: { width: '100%', padding: '12px', boxSizing: 'border-box', border: '1px solid #ccc', borderRadius: '4px', marginBottom: '15px' },
        button: { width: '100%', padding: '12px', background: '#3498db', color: 'white', border: 'none', borderRadius: '4px', fontSize: '16px', cursor: 'pointer', fontWeight: 'bold' }
    };

    return (
        <div style={css.container}>
            <div style={css.card}>
                <h2 style={{ marginTop: 0 }}>Reset Password</h2>
                <p style={{ color: '#666', fontSize: '14px', marginBottom: '20px' }}>Enter your email address and we'll send you a link to reset your password.</p>
                
                {message && <div style={{ padding: '10px', background: '#d4edda', color: '#155724', borderRadius: '4px', marginBottom: '15px' }}>{message}</div>}
                
                <form onSubmit={handleSubmit}>
                    <input type="email" style={css.input} value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="Enter your email" />
                    <button type="submit" style={css.button} disabled={isLoading}>{isLoading ? 'Sending...' : 'Send Reset Link'}</button>
                </form>
                <div style={{ marginTop: '20px', fontSize: '14px' }}>
                    Remember your password? <Link to="/" style={{ color: '#3498db', textDecoration: 'none' }}>Back to Login</Link>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;