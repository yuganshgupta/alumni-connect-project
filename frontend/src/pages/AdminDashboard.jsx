import React, { useState, useEffect, useContext } from 'react';
import api from '../api/axiosConfig';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';

const AdminDashboard = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    
    const { tab } = useParams();
    const activeTab = tab || 'users';

    const [allUsers, setAllUsers] = useState([]);
    const [systemLogs, setSystemLogs] = useState([]);
    
    const [modal, setModal] = useState({ isOpen: false, type: '', userId: null, input: '', error: '' });

    const fetchData = async () => {
        try {
            const usersRes = await api.get('/admin/users');
            setAllUsers(usersRes.data);
            const logsRes = await api.get('/admin/system-logs');
            setSystemLogs(logsRes.data);
        } catch (error) {}
    };

    useEffect(() => {
        if (!user || user.role !== 'ADMIN') { navigate('/'); return; }
        fetchData();
        const interval = setInterval(fetchData, 5000); 
        return () => clearInterval(interval);
    }, [user, navigate]);

    if (!user) return null;

    const executeAdminAction = async () => {
        setModal({ ...modal, error: '' });
        try {
            if (modal.type === 'verify') {
                await api.put(`/admin/verify/${modal.userId}`);
            } else if (modal.type === 'block') {
                // FIXED: Demands reason via modal, NOT alert
                if (!modal.input) return setModal({ ...modal, error: "A reason is required for the audit logs." });
                await api.put(`/admin/users/${modal.userId}/toggle-block`, { reason: modal.input });
            } else if (modal.type === 'password') {
                if (!modal.input) return setModal({ ...modal, error: "Password cannot be empty." });
                await api.put(`/admin/users/${modal.userId}/reset-password`, { newPassword: modal.input });
            }
            fetchData();
            setModal({ isOpen: false, error: '' });
        } catch (error) { setModal({ ...modal, error: "Action failed." }); }
    };

    const css = `
        .admin-container { padding: 20px; font-family: Arial; max-width: 1200px; margin: 0 auto; }
        .table-responsive { overflow-x: auto; background: white; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border-radius: 8px; -webkit-overflow-scrolling: touch; }
        @media (max-width: 768px) { .admin-container { padding: 10px; } }
    `;

    return (
        <div className="admin-container">
            <style>{css}</style>
            
            {activeTab === 'users' && (
                <div className="table-responsive">
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
                            {allUsers.map(u => (
                                <tr key={u.id} style={{ borderBottom: '1px solid #eee', background: u.blocked ? '#fdf2f2' : 'white' }}>
                                    <td style={{ padding: '12px', fontWeight: 'bold' }}>{u.role}</td>
                                    <td style={{ padding: '12px' }}>
                                        <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                                            {u.profileImageUrl && <img src={u.profileImageUrl} style={{ width:'30px', height:'30px', borderRadius:'50%', objectFit:'cover' }} />}
                                            <div>{u.email}<br/><span style={{fontSize:'12px', color:'#777'}}>{u.name}</span></div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '12px' }}>
                                        {u.blocked ? <span style={{color:'red', fontWeight:'bold'}}>BLOCKED</span> : <span style={{color:'green'}}>ACTIVE</span>}
                                        {u.role === 'ALUMNI' && !u.verified && <div style={{color:'orange', fontSize:'12px', marginTop:'4px'}}>Pending Review</div>}
                                    </td>
                                    <td style={{ padding: '12px', display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                                        {u.role === 'ALUMNI' && !u.verified && (
                                            <button onClick={() => setModal({ isOpen: true, type: 'verify', userId: u.id, input: '' })} style={{ padding: '6px 12px', background: '#27ae60', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Approve</button>
                                        )}
                                        {u.role !== 'ADMIN' && (
                                            <>
                                                <button onClick={() => setModal({ isOpen: true, type: 'block', userId: u.id, input: '' })} style={{ padding: '6px 12px', background: u.blocked ? '#2980b9' : '#e74c3c', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                                                    {u.blocked ? 'Unblock User' : 'Block User'}
                                                </button>
                                                <button onClick={() => setModal({ isOpen: true, type: 'password', userId: u.id, input: '' })} style={{ padding: '6px 12px', background: '#f39c12', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Reset Pass</button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {activeTab === 'logs' && (
                 <div className="table-responsive">
                     <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                     <thead>
                         <tr style={{ background: '#34495e', color: 'white', textAlign: 'left' }}>
                             <th style={{ padding: '12px' }}>Timestamp</th>
                             <th style={{ padding: '12px' }}>Action Type</th>
                             <th style={{ padding: '12px' }}>Activity Details</th>
                         </tr>
                     </thead>
                     <tbody>
                         {systemLogs.slice().reverse().map(log => (
                             <tr key={log.id} style={{ borderBottom: '1px solid #eee' }}>
                                 <td style={{ padding: '12px', fontSize: '14px', color: '#666' }}>{new Date(log.timestamp).toLocaleString()}</td>
                                 <td style={{ padding: '12px', fontWeight: 'bold' }}>{log.action}</td>
                                 <td style={{ padding: '12px' }}>{log.details}</td>
                             </tr>
                         ))}
                     </tbody>
                 </table>
             </div>
            )}

            {/* CUSTOM ADMIN UI MODAL */}
            {modal.isOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}>
                    <div style={{ background: 'white', padding: '30px', borderRadius: '8px', width: '100%', maxWidth: '400px' }}>
                        <h3 style={{ marginTop: 0 }}>
                            {modal.type === 'verify' ? 'Approve Alumni Account' : modal.type === 'block' ? 'Modify User Access' : 'Force Password Reset'}
                        </h3>
                        
                        {modal.error && <p style={{ color: '#e74c3c', fontWeight: 'bold', fontSize: '14px', marginBottom: '10px' }}>{modal.error}</p>}
                        
                        <p style={{ color: '#666', marginBottom: '20px' }}>
                            {modal.type === 'verify' && 'This will allow the alumni to post public availability slots on the platform.'}
                            {modal.type === 'block' && 'Enter a reason for the audit logs.'}
                            {modal.type === 'password' && 'Enter the new administrative override password below.'}
                        </p>

                        {(modal.type === 'password' || modal.type === 'block') && (
                            <input type="text" placeholder={modal.type === 'block' ? "Reason for ban/unban" : "New Password"} value={modal.input} onChange={e => setModal({...modal, input: e.target.value})} style={{ width: '100%', padding: '10px', boxSizing: 'border-box', marginBottom: '15px' }} />
                        )}

                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button onClick={() => setModal({isOpen: false, error: ''})} style={{ padding: '8px 16px', background: '#ecf0f1', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                            <button onClick={executeAdminAction} style={{ padding: '8px 16px', background: modal.type === 'block' ? '#e74c3c' : '#27ae60', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Confirm Action</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;