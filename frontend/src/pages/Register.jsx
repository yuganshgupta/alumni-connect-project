import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axiosConfig';

const Register = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'STUDENT',
        company: ''
    });
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setIsLoading(true);

        try {
            await api.post('/auth/register', formData);
            setMessage('Registration successful! Redirecting to login...');
            setTimeout(() => {
                navigate('/');
            }, 2000);
        } catch (err) {
            setError(err.response?.data || 'Registration failed. Email might be in use.');
        } finally {
            setIsLoading(false);
        }
    };

    const styles = {
        container: { display: 'flex', minHeight: '100vh', justifyContent: 'center', alignItems: 'center', padding: '20px' },
        card: { background: 'white', padding: '40px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', width: '100%', maxWidth: '450px' },
        title: { textAlign: 'center', marginBottom: '24px', color: '#2c3e50' },
        formGroup: { marginBottom: '16px' },
        label: { display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '14px' },
        input: { width: '100%', padding: '10px', boxSizing: 'border-box', border: '1px solid #ccc', borderRadius: '4px' },
        select: { width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', background: 'white' },
        button: { width: '100%', padding: '12px', background: '#27ae60', color: 'white', border: 'none', borderRadius: '4px', fontSize: '16px', cursor: 'pointer', marginTop: '10px' },
        errorMsg: { color: '#e74c3c', fontSize: '14px', marginBottom: '16px', textAlign: 'center' },
        successMsg: { color: '#27ae60', fontSize: '14px', marginBottom: '16px', textAlign: 'center' },
        linkText: { textAlign: 'center', marginTop: '20px', fontSize: '14px' }
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h2 style={styles.title}>Create an Account</h2>
                
                {error && <div style={styles.errorMsg}>{error}</div>}
                {message && <div style={styles.successMsg}>{message}</div>}
                
                <form onSubmit={handleSubmit}>
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Full Name</label>
                        <input type="text" name="name" style={styles.input} value={formData.name} onChange={handleChange} required placeholder="Jane Doe" />
                    </div>
                    
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Email Address</label>
                        <input type="email" name="email" style={styles.input} value={formData.email} onChange={handleChange} required placeholder="email@university.edu" />
                    </div>
                    
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Password</label>
                        <input type="password" name="password" style={styles.input} value={formData.password} onChange={handleChange} required placeholder="••••••••" />
                    </div>

                    <div style={styles.formGroup}>
                        <label style={styles.label}>I am a...</label>
                        <select name="role" style={styles.select} value={formData.role} onChange={handleChange}>
                            <option value="STUDENT">Current Student</option>
                            <option value="ALUMNI">Alumni Mentor</option>
                        </select>
                    </div>

                    {formData.role === 'ALUMNI' && (
                        <div style={styles.formGroup}>
                            <label style={styles.label}>Current Company / Title</label>
                            <input type="text" name="company" style={styles.input} value={formData.company} onChange={handleChange} required placeholder="Software Engineer at Google" />
                        </div>
                    )}

                    <button type="submit" style={styles.button} disabled={isLoading}>
                        {isLoading ? 'Creating Account...' : 'Register'}
                    </button>
                </form>

                <div style={styles.linkText}>
                    Already have an account? <Link to="/" style={{ color: '#3498db', textDecoration: 'none' }}>Sign In here</Link>
                </div>
            </div>
        </div>
    );
};

export default Register;