import React, { useState, useEffect, useContext } from 'react';
import api from '../api/axiosConfig';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    
    const [activeTab, setActiveTab] = useState('users');
    const [allUsers, setAllUsers] = useState([]);
    const [systemLogs, setSystemLogs] = useState([]);
    
    // NEW: Centralized Admin Action Modal
    const [modal, setModal] = useState({ isOpen: false, type: '', userId: null, data: '' });

    const fetchData = async () => {
        try {
            const usersRes = await api.get('/admin/users');
            setAllUsers(usersRes.data);
            const logsRes = await api.get('/admin/system-logs');
            setSystemLogs(logsRes.data);
        } catch (error) { console.error(error); }
    };

    useEffect(() => {
        if (!user || user.role !== 'ADMIN') { navigate('/'); return; }
        fetchData();
    }, [user, navigate]);

    if (!user) return null;

    const executeAdminAction = async () => {
        try {
            if (modal.type === 'verify') {
                await api.put(`/admin/verify/${modal.userId}`);
            } else if (modal.type === 'block') {
                await api.put(`/admin/users/${modal.userId}/toggle-block`);
            } else if (modal.type === 'password') {
                if (!modal.data) return alert("Password cannot be empty.");
                await api.put(`/admin/users/${modal.userId}/reset-password`, { newPassword: modal.data });
            }
            fetchData();
            setModal({ isOpen: false });
        } catch (error) {
            alert("Action failed.");
        }
    };

    const css = `
        .admin-container { padding: 20px; font-family: Arial; max-width: 1200px; margin: 0 auto; }
        .table-wrapper { overflow-x: auto; background: white; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border-radius: 8px; -webkit-overflow-scrolling: touch; }
        .tabs { display: flex; border-bottom: 1px solid #ccc; margin-bottom: 20px; overflow-x: auto; white-space: nowrap; }
        .tab-btn { padding: 12px 20px; cursor: pointer; background: none; border: none; font-size: 16px; font-weight: bold; }
        @media (max-width: 768px) { .admin-container { padding: 10px; } }
    `;

    return (
        <div className="admin-container">
            <style>{css}</style>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '20px' }}>
                <h2 style={{ margin: 0 }}>System Administrator</h2>
                <button onClick={logout} style={{ padding: '8px 16px', background: '#333', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Logout</button>
            </div>

            <div className="tabs">
                <button onClick={() => setActiveTab('users')} className="tab-btn" style={{ borderBottom: activeTab === 'users' ? '3px solid #8e44ad' : '3px solid transparent' }}>User Directory</button>
                <button onClick={() => setActiveTab('logs')} className="tab-btn" style={{ borderBottom: activeTab === 'logs' ? '3px solid #8e44ad' : '3px solid transparent' }}>Audit Logs</button>
            </div>

            {activeTab === 'users' && (
                <div className="table-wrapper">
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
                        <thead>
                            <tr style={{ background: '#2c3e50', color: 'white', textAlign: 'left' }}>
                                <th style={{ padding: '12px' }}>Role</th>
                                <th style={{ padding: '12px' }}>Email</th>
                                <th style={{ padding: '12px' }}>Status</th>
                                <th style={{ padding: '12px' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {allUsers.map(u => {
                                // Fallback for Jackson serialization (verified vs isVerified)
                                const isVerified = u.verified || u.isVerified; 
                                return (
                                    <tr key={u.id} style={{ borderBottom: '1px solid #eee', background: u.blocked ? '#fdf2f2' : 'white' }}>
                                        <td style={{ padding: '12px', fontWeight: 'bold' }}>{u.role}</td>
                                        <td style={{ padding: '12px' }}>{u.email}<br/><span style={{fontSize:'12px', color:'#777'}}>{u.name}</span></td>
                                        <td style={{ padding: '12px' }}>
                                            {u.blocked ? <span style={{color:'red', fontWeight:'bold'}}>BLOCKED</span> : <span style={{color:'green'}}>ACTIVE</span>}
                                            {u.role === 'ALUMNI' && !isVerified && <div style={{color:'orange', fontSize:'12px', marginTop:'4px'}}>Pending Review</div>}
                                        </td>
                                        <td style={{ padding: '12px', display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                                            {u.role === 'ALUMNI' && !isVerified && (
                                                <button onClick={() => setModal({ isOpen: true, type: 'verify', userId: u.id })} style={{ padding: '6px 12px', background: '#27ae60', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize:'12px' }}>Approve</button>
                                            )}
                                            {u.role !== 'ADMIN' && (
                                                <>
                                                    <button onClick={() => setModal({ isOpen: true, type: 'block', userId: u.id })} style={{ padding: '6px 12px', background: u.blocked ? '#2980b9' : '#e74c3c', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize:'12px' }}>
                                                        {u.blocked ? 'Unblock User' : 'Block User'}
                                                    </button>
                                                    <button onClick={() => setModal({ isOpen: true, type: 'password', userId: u.id, data: '' })} style={{ padding: '6px 12px', background: '#f39c12', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize:'12px' }}>Reset Pass</button>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {activeTab === 'logs' && (
                 <div className="table-wrapper">
                     <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                     <thead>
                         <tr style={{ background: '#34495e', color: 'white', textAlign: 'left' }}>
                             <th style={{ padding: '12px' }}>Student</th>
                             <th style={{ padding: '12px' }}>Mentor</th>
                             <th style={{ padding: '12px' }}>Time (UTC)</th>
                             <th style={{ padding: '12px' }}>Event Status</th>
                         </tr>
                     </thead>
                     <tbody>
                         {systemLogs.slice().reverse().map(log => (
                             <tr key={log.id} style={{ borderBottom: '1px solid #eee' }}>
                                 <td style={{ padding: '12px' }}>{log.student.email}</td>
                                 <td style={{ padding: '12px' }}>{log.slot.mentor.email}</td>
                                 <td style={{ padding: '12px' }}>{new Date(log.slot.startTimeUtc).toLocaleString()}</td>
                                 <td style={{ padding: '12px', fontWeight: 'bold' }}>{log.status}</td>
                             </tr>
                         ))}
                     </tbody>
                 </table>
             </div>
            )}

            {/* UNIFIED ADMIN MODAL */}
            {modal.isOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}>
                    <div style={{ background: 'white', padding: '30px', borderRadius: '8px', width: '100%', maxWidth: '400px' }}>
                        <h3 style={{ marginTop: 0 }}>
                            {modal.type === 'verify' ? 'Approve Alumni Account' : modal.type === 'block' ? 'Modify User Access' : 'Force Password Reset'}
                        </h3>
                        
                        <p style={{ color: '#666', marginBottom: '20px' }}>
                            {modal.type === 'verify' && 'This will allow the alumni to post public availability slots on the platform.'}
                            {modal.type === 'block' && 'This will instantly lock or unlock the user from accessing their dashboard.'}
                            {modal.type === 'password' && 'Enter the new administrative override password below.'}
                        </p>

                        {modal.type === 'password' && (
                            <input type="text" placeholder="New Password" value={modal.data} onChange={e => setModal({...modal, data: e.target.value})} style={{ width: '100%', padding: '10px', boxSizing: 'border-box', marginBottom: '15px' }} />
                        )}

                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button onClick={() => setModal({isOpen: false})} style={{ padding: '8px 16px', background: '#ecf0f1', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                            <button onClick={executeAdminAction} style={{ padding: '8px 16px', background: modal.type === 'block' ? '#e74c3c' : '#27ae60', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Confirm Action</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;