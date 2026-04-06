import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/axiosConfig';

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token"); // Grabs ?token=xyz from URL
    const navigate = useNavigate();

    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [message, setMessage] = useState({ type: '', text: '' });
    const [isLoading, setIsLoading] = useState(false);

    if (!token) {
        return <div style={{ padding: '40px', textAlign: 'center' }}><h2>Invalid Request</h2><p>No reset token found in the URL.</p></div>;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirm) {
            return setMessage({ type: 'error', text: "Passwords do not match." });
        }

        setIsLoading(true);
        try {
            const res = await api.post('/auth/reset-password', { token, newPassword: password });
            setMessage({ type: 'success', text: res.data });
            setTimeout(() => navigate('/'), 3000); // Send back to login after 3 sec
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data || "An error occurred." });
        } finally {
            setIsLoading(false);
        }
    };

    const css = {
        container: { display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', background: '#f4f7f6' },
        card: { background: 'white', padding: '40px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px' },
        input: { width: '100%', padding: '12px', boxSizing: 'border-box', border: '1px solid #ccc', borderRadius: '4px', marginBottom: '15px' },
        button: { width: '100%', padding: '12px', background: '#27ae60', color: 'white', border: 'none', borderRadius: '4px', fontSize: '16px', cursor: 'pointer', fontWeight: 'bold' }
    };

    return (
        <div style={css.container}>
            <div style={css.card}>
                <h2 style={{ marginTop: 0, textAlign: 'center' }}>Create New Password</h2>
                
                {message.text && (
                    <div style={{ padding: '10px', background: message.type === 'success' ? '#d4edda' : '#f8d7da', color: message.type === 'success' ? '#155724' : '#721c24', borderRadius: '4px', marginBottom: '15px', textAlign: 'center' }}>
                        {message.text}
                    </div>
                )}
                
                {message.type !== 'success' && (
                    <form onSubmit={handleSubmit}>
                        <input type="password" style={css.input} value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="New Password" minLength="6" />
                        <input type="password" style={css.input} value={confirm} onChange={(e) => setConfirm(e.target.value)} required placeholder="Confirm New Password" minLength="6" />
                        <button type="submit" style={css.button} disabled={isLoading}>{isLoading ? 'Saving...' : 'Reset Password'}</button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ResetPassword;