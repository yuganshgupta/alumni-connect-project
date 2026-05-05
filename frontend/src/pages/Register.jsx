import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axiosConfig';

const Register = () => {
    const navigate = useNavigate();
    
    // UI State
    const [step, setStep] = useState(1);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'STUDENT', company: '', otp: '' });

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    // STEP 1: Request OTP
    const handleSendOtp = async (e) => {
        e.preventDefault();
        setError(''); setMessage(''); setIsLoading(true);
        try {
            await api.post('/auth/send-otp', { email: formData.email, role: formData.role });
            setMessage('Verification code sent to your email!');
            setStep(2); 
        } catch (err) { setError(err.response?.data || 'Failed to send verification code.'); } 
        finally { setIsLoading(false); }
    };

    // STEP 2: Final Registration
    const handleRegister = async (e) => {
        e.preventDefault();
        setError(''); setMessage(''); setIsLoading(true);
        try {
            await api.post('/auth/register', formData);
            setMessage('Registration successful! Redirecting to login...');
            setTimeout(() => navigate('/'), 2000);
        } catch (err) { setError(err.response?.data || 'Registration failed. Invalid code.'); } 
        finally { setIsLoading(false); }
    };

    const styles = {
        container: { display: 'flex', minHeight: '100vh', justifyContent: 'center', alignItems: 'center', padding: '20px', background: '#f4f7f6' },
        card: { background: 'white', padding: '40px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', width: '100%', maxWidth: '450px' },
        title: { textAlign: 'center', marginBottom: '24px', color: '#2c3e50' },
        formGroup: { marginBottom: '16px' },
        label: { display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '14px' },
        input: { width: '100%', padding: '10px', boxSizing: 'border-box', border: '1px solid #ccc', borderRadius: '4px', background: '#fff' },
        select: { width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', background: 'white' },
        button: { width: '100%', padding: '12px', background: '#27ae60', color: 'white', border: 'none', borderRadius: '4px', fontSize: '16px', cursor: 'pointer', marginTop: '10px', fontWeight: 'bold' },
        secondaryButton: { width: '100%', padding: '10px', background: '#ecf0f1', color: '#2c3e50', border: 'none', borderRadius: '4px', cursor: 'pointer', marginTop: '10px', fontSize: '14px' },
        errorMsg: { color: '#e74c3c', fontSize: '14px', marginBottom: '16px', textAlign: 'center', fontWeight: 'bold', padding: '10px', background: '#fdf2f2', borderRadius: '4px' },
        successMsg: { color: '#27ae60', fontSize: '14px', marginBottom: '16px', textAlign: 'center', fontWeight: 'bold', padding: '10px', background: '#eafaf1', borderRadius: '4px' },
        linkText: { textAlign: 'center', marginTop: '20px', fontSize: '14px' }
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h2 style={styles.title}>Create an Account</h2>
                
                {error && <div style={styles.errorMsg}>{error}</div>}
                {message && <div style={styles.successMsg}>{message}</div>}
                
                {step === 1 ? (
                    <form onSubmit={handleSendOtp}>
                        <div style={styles.formGroup}><label style={styles.label}>Full Name</label><input type="text" name="name" style={styles.input} value={formData.name} onChange={handleChange} required placeholder="Jane Doe" disabled={isLoading} /></div>
                        <div style={styles.formGroup}><label style={styles.label}>I am a...</label><select name="role" style={styles.select} value={formData.role} onChange={handleChange} disabled={isLoading}><option value="STUDENT">Current Student</option><option value="ALUMNI">Alumni Mentor</option></select></div>
                        {formData.role === 'ALUMNI' && (<div style={styles.formGroup}><label style={styles.label}>Current Company / Title</label><input type="text" name="company" style={styles.input} value={formData.company} onChange={handleChange} required placeholder="Software Engineer at Google" disabled={isLoading} /></div>)}
                        <div style={styles.formGroup}><label style={styles.label}>Email Address</label><input type="email" name="email" style={styles.input} value={formData.email} onChange={handleChange} required placeholder={formData.role === 'ALUMNI' ? "must use @bvicam.in" : "email@university.edu"} disabled={isLoading} /></div>
                        <div style={styles.formGroup}><label style={styles.label}>Create Password</label><input type="password" name="password" style={styles.input} value={formData.password} onChange={handleChange} required minLength="6" disabled={isLoading} /></div>
                        <button type="submit" style={styles.button} disabled={isLoading}>{isLoading ? 'Sending Code...' : 'Send Verification Code'}</button>
                    </form>
                ) : (
                    <form onSubmit={handleRegister}>
                        <p style={{ textAlign: 'center', fontSize: '14px', color: '#666', marginBottom: '20px' }}>We sent a 6-digit code to <strong>{formData.email}</strong>. It will expire in 5 minutes.</p>
                        <div style={styles.formGroup}><label style={styles.label}>6-Digit Code</label><input type="text" name="otp" style={{...styles.input, textAlign: 'center', letterSpacing: '4px', fontSize: '20px', fontWeight: 'bold'}} value={formData.otp} onChange={handleChange} required maxLength="6" placeholder="------" disabled={isLoading} autoComplete="off" /></div>
                        <button type="submit" style={styles.button} disabled={isLoading}>{isLoading ? 'Verifying...' : 'Verify & Create Account'}</button>
                        <button type="button" style={styles.secondaryButton} onClick={() => { setStep(1); setError(''); setMessage(''); formData.otp=''; }} disabled={isLoading}>Back to Edit Details</button>
                    </form>
                )}
                <div style={styles.linkText}>Already have an account? <Link to="/" style={{ color: '#3498db', textDecoration: 'none', fontWeight: 'bold' }}>Sign In here</Link></div>
            </div>
        </div>
    );
};
export default Register;