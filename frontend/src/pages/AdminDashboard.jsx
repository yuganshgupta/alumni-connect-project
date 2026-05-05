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
    
    // NEW: Added isLoading state
    const [isLoading, setIsLoading] = useState(false);
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
        setIsLoading(true); // START SPINNER
        try {
            if (modal.type === 'verify') {
                await api.put(`/admin/verify/${modal.userId}`);
            } else if (modal.type === 'block') {
                if (!modal.input) {
                    setIsLoading(false);
                    return setModal({ ...modal, error: "A reason is required for the audit logs." });
                }
                await api.put(`/admin/users/${modal.userId}/toggle-block`, { reason: modal.input });
            } else if (modal.type === 'password') {
                if (!modal.input) {
                    setIsLoading(false);
                    return setModal({ ...modal, error: "Password cannot be empty." });
                }
                await api.put(`/admin/users/${modal.userId}/reset-password`, { newPassword: modal.input });
            }
            await fetchData(); // Wait for data to refresh
            setModal({ isOpen: false, type: '', userId: null, input: '', error: '' }); // CLOSE AND CLEAR MODAL
        } catch (error) { 
            setModal({ ...modal, error: "Action failed." }); 
        } finally {
            setIsLoading(false); // STOP SPINNER
        }
    };

    const css = `
        .dash-container { padding: 20px; font-family: Arial; max-width: 1200px; margin: 0 auto; }
        .flex-row { display: flex; gap: 20px; flex-wrap: wrap; }
        .flex-col { flex: 1; min-width: 100%; }
        @media(min-width: 768px) { .flex-col { min-width: 300px; } }
        .table-responsive { overflow-x: auto; -webkit-overflow-scrolling: touch; background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        
        /* DESKTOP CHAT */
        .chat-box { border: 1px solid #ccc; border-radius: 8px; display: flex; height: 70vh; overflow: hidden; background: white; }
        .chat-contacts { width: 250px; background: #f9f9f9; border-right: 1px solid #ccc; overflow-y: auto; }
        .chat-area { flex: 1; display: flex; flex-direction: column; background: #fff; position: relative; }
        .messages-container { flex: 1; overflow-y: auto; padding: 20px; display: flex; flexDirection: column; gap: 10px; }
        
        /* MOBILE CHAT OVERHAUL */
        @media (max-width: 768px) {
            .dash-container { padding: 10px; }
            .chat-box { flex-direction: column; height: calc(100vh - 120px); border-radius: 0; border: none; }
            .chat-contacts { width: 100%; height: 90px; min-height: 90px; border-right: none; border-bottom: 1px solid #ccc; display: flex; overflow-x: auto; white-space: nowrap; -webkit-overflow-scrolling: touch; }
            .contact-item { display: inline-flex; flex-direction: column; justify-content: center; align-items: center; min-width: 80px; padding: 10px; border-bottom: none; border-right: 1px solid #eee; }
            .contact-item img { margin-bottom: 5px; }
            .contact-item div { font-size: 12px; overflow: hidden; text-overflow: ellipsis; max-width: 70px; }
            
            /* Pin the input to the bottom */
            .chat-area { flex: 1; display: flex; flex-direction: column; }
            .chat-input-bar { padding: 10px; background: #eee; display: flex; gap: 8px; flex-shrink: 0; }
        }
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
                            <button onClick={() => setModal({isOpen: false, error: ''})} disabled={isLoading} style={{ padding: '8px 16px', background: '#ecf0f1', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                            <button onClick={executeAdminAction} disabled={isLoading} style={{ padding: '8px 16px', background: modal.type === 'block' ? '#e74c3c' : '#27ae60', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                                {/* SHOW SPINNER/TEXT */}
                                {isLoading ? 'Processing...' : 'Confirm Action'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;