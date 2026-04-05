import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await login(email, password);
            
            // Give the AuthContext a tiny fraction of a second to update the localStorage
            setTimeout(() => {
                const role = localStorage.getItem('userRole'); 
                
                // Route the user to their specific dashboard based on their role
                if (role === 'ADMIN') {
                    navigate('/admin-dashboard');
                } else if (role === 'ALUMNI') {
                    navigate('/alumni-dashboard');
                } else {
                    navigate('/student-dashboard'); 
                }
            }, 100);
            
        } catch (err) {
            setError(err.response?.data || 'Failed to login. Please check your credentials.');
        } finally {
            setIsLoading(false);
        }
    };

    const styles = {
        container: { display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center' },
        card: { background: 'white', padding: '40px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px' },
        title: { textAlign: 'center', marginBottom: '24px', color: '#2c3e50' },
        formGroup: { marginBottom: '16px' },
        label: { display: 'block', marginBottom: '8px', fontWeight: 'bold' },
        input: { width: '100%', padding: '10px', boxSizing: 'border-box', border: '1px solid #ccc', borderRadius: '4px' },
        button: { width: '100%', padding: '12px', background: '#3498db', color: 'white', border: 'none', borderRadius: '4px', fontSize: '16px', cursor: 'pointer', marginTop: '10px' },
        errorMsg: { color: '#e74c3c', fontSize: '14px', marginBottom: '16px', textAlign: 'center' },
        linkText: { textAlign: 'center', marginTop: '20px', fontSize: '14px' }
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h2 style={styles.title}>Alumni Connect</h2>
                
                {error && <div style={styles.errorMsg}>{error}</div>}
                
                <form onSubmit={handleSubmit}>
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Email Address</label>
                        <input type="email" style={styles.input} value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="student@university.edu" />
                    </div>
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Password</label>
                        <input type="password" style={styles.input} value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" />
                    </div>
                    <button type="submit" style={styles.button} disabled={isLoading}>
                        {isLoading ? 'Signing In...' : 'Sign In'}
                    </button>
                </form>

                <div style={styles.linkText}>
                    Don't have an account? <Link to="/register" style={{ color: '#3498db', textDecoration: 'none' }}>Register here</Link>
                </div>
            </div>
        </div>
    );
};

export default Login