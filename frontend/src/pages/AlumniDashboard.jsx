import React, { useState, useEffect, useContext } from 'react';
import api from '../api/axiosConfig';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';

const AlumniDashboard = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    
    const { tab } = useParams();
    const activeTab = tab || 'manage'; 

    const [slots, setSlots] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [duration, setDuration] = useState(45);
    
    // BEAUTIFUL UNIFIED MODAL
    const [modal, setModal] = useState({ isOpen: false, type: '', bookingId: null, input: '', error: '' });
    const [profileData, setProfileData] = useState({ linkedinUrl: '', experience: '', company: '', profileImageUrl: '' });

    const [activeChat, setActiveChat] = useState(null);
    const [chatMessages, setChatMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');

    const fetchData = async () => {
        if (!user) return;
        try {
            const slotRes = await api.get(`/slots/mentor/${user.id}`);
            setSlots(slotRes.data);
            const bookRes = await api.get(`/bookings/mentor/${user.id}`);
            setBookings(bookRes.data);
        } catch (error) {}
    };

    const fetchMessages = async () => {
        if (!activeChat) return;
        try {
            const res = await api.get(`/messages/${user.id}/${activeChat}`);
            setChatMessages(res.data);
        } catch (error) {}
    };

    useEffect(() => {
        if (!user || user.role !== 'ALUMNI') { navigate('/'); return; }
        setProfileData({ linkedinUrl: user.linkedinUrl || '', experience: user.experience || '', company: user.company || '', profileImageUrl: user.profileImageUrl || '' });
        fetchData();
        const interval = setInterval(fetchData, 5000);
        return () => clearInterval(interval);
    }, [user, navigate]);

    useEffect(() => {
        fetchMessages();
        const chatInterval = setInterval(fetchMessages, 3000);
        return () => clearInterval(chatInterval);
    }, [activeChat]);

    // NEW: Mark messages as read when you open a chat
    useEffect(() => {
        if (activeChat && activeTab === 'chat') {
            api.put(`/messages/read/${activeChat}/${user.id}`).catch(() => {});
        }
    }, [activeChat, chatMessages, activeTab, user.id]);

    if (!user) return null;

    const sendMessage = async () => {
        if (!newMessage.trim() || !activeChat) return;
        try { await api.post('/messages/send', { senderId: user.id, receiverId: activeChat, content: newMessage }); setNewMessage(''); fetchMessages(); } catch (error) {}
    };

    const handleCreateSlot = async (e) => {
        e.preventDefault();
        const startDateTime = new Date(`${date}T${time}`);
        const endDateTime = new Date(startDateTime.getTime() + Number(duration) * 60000);
        try {
            await api.post('/slots/create', { mentorId: user.id, startTimeUtc: startDateTime.toISOString(), endTimeUtc: endDateTime.toISOString() });
            fetchData(); setDate(''); setTime('');
            setModal({ isOpen: true, type: 'success', input: 'Slot published successfully!' });
        } catch (error) { 
            // Catches PAST SLOTS beautifully
            setModal({ isOpen: true, type: 'error', input: error.response?.data || "Error creating slot." });
        }
    };

    const handleDeleteSlot = async (slotId) => {
        try { await api.delete(`/slots/${slotId}`); fetchData(); } catch (error) { setModal({ isOpen: true, type: 'error', input: "Cannot delete a slot that has a booking." }); }
    };

    const handleBookingAction = async (bookingId, action) => {
        try { await api.put(`/bookings/${bookingId}/${action}`); fetchData(); } catch (error) {}
    };

    const openModal = (type, bookingId) => setModal({ isOpen: true, type, bookingId, input: '', error: '' });
    const closeModal = () => setModal({ isOpen: false, type: '', bookingId: null, input: '', error: '' });

    const submitModal = async () => {
        setModal({ ...modal, error: '' });
        if (modal.type === 'cancel' || modal.type === 'reject') {
            if(!modal.input) return setModal({ ...modal, error: "A reason is required to update student."});
            await api.put(`/bookings/${modal.bookingId}/${modal.type}`, { reason: modal.input });
        } else if (modal.type === 'complete' || modal.type === 'noshow') {
            const status = modal.type === 'complete' ? 'COMPLETED' : 'NO_SHOW';
            await api.put(`/bookings/${modal.bookingId}/status?status=${status}`);
        }
        fetchData(); closeModal();
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        try {
            const res = await api.put(`/users/${user.id}/profile`, profileData);
            localStorage.setItem('user', JSON.stringify(res.data));
            setModal({ isOpen: true, type: 'success', input: 'Profile updated successfully!' });
        } catch (error) { setModal({ isOpen: true, type: 'error', input: 'Failed to update profile.' }); }
    };

    const activeBookings = bookings.filter(b => ['PENDING', 'APPROVED'].includes(b.status));
    const historicalBookings = bookings.filter(b => ['COMPLETED', 'CANCELLED', 'REJECTED', 'NO_SHOW'].includes(b.status));
    const contacts = Array.from(new Set(bookings.filter(b => ['APPROVED', 'COMPLETED'].includes(b.status)).map(b => JSON.stringify(b.student)))).map(s => JSON.parse(s));
    const defaultAvatar = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';

    const css = `
        .dash-container { padding: 20px; font-family: Arial; max-width: 1200px; margin: 0 auto; }
        .flex-row { display: flex; gap: 20px; flex-wrap: wrap; }
        .flex-col { flex: 1; min-width: 100%; }
        @media(min-width: 768px) { .flex-col { min-width: 300px; } }
        .table-responsive { overflow-x: auto; -webkit-overflow-scrolling: touch; background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .chat-box { border: 1px solid #ccc; border-radius: 8px; display: flex; height: 70vh; overflow: hidden; background: white; }
        .chat-contacts { width: 250px; background: #f9f9f9; border-right: 1px solid #ccc; overflow-y: auto; }
        .chat-area { flex: 1; display: flex; flex-direction: column; background: #fff; }
        @media (max-width: 768px) {
            .dash-container { padding: 10px; }
            .chat-box { flex-direction: column; height: 80vh; }
            .chat-contacts { width: 100%; height: 120px; border-right: none; border-bottom: 1px solid #ccc; display: flex; overflow-x: auto; }
        }
    `;

    return (
        <div className="dash-container">
            <style>{css}</style>
            
            {/* TABS HANDLED BY NAVBAR */}

            {activeTab === 'manage' && (
                <div className="flex-row">
                    <div className="flex-col">
                        <h3>Upcoming Sessions</h3>
                        {activeBookings.length === 0 ? <p style={{ color: '#7f8c8d' }}>Your queue is empty.</p> : (
                            <div style={{ display: 'grid', gap: '15px' }}>
                                {activeBookings.slice().reverse().map(b => (
                                    <div key={b.id} style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '8px', background: 'white' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <img src={b.student.profileImageUrl || defaultAvatar} style={{ width: '30px', height: '30px', borderRadius: '50%', objectFit: 'cover' }} />
                                                <h4 style={{ margin: 0 }}>{b.student.name || b.student.email}</h4>
                                            </div>
                                            <span style={{ fontWeight: 'bold', color: b.status === 'APPROVED' ? '#27ae60' : '#f39c12' }}>{b.status}</span>
                                        </div>
                                        <p style={{ margin: '0 0 5px 0', fontSize: '14px' }}><strong>Time:</strong> {new Date(b.slot.startTimeUtc).toLocaleString()}</p>
                                        <div style={{ background: '#f8f9fa', padding: '10px', borderRadius: '4px', marginBottom: '15px', borderLeft: '3px solid #3498db', fontSize: '14px' }}>
                                            <strong>Agenda:</strong><br/>{b.studentAgenda}
                                        </div>
                                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                            {b.status === 'PENDING' && (
                                                <>
                                                    <button onClick={() => handleBookingAction(b.id, 'approve')} style={{ padding: '8px 16px', background: '#27ae60', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Approve</button>
                                                    <button onClick={() => openModal('reject', b.id)} style={{ padding: '8px 16px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Decline</button>
                                                </>
                                            )}
                                            {b.status === 'APPROVED' && (
                                                <>
                                                    <button onClick={() => openModal('cancel', b.id)} style={{ padding: '6px 12px', background: '#e67e22', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>Cancel Appt</button>
                                                    <button onClick={() => openModal('complete', b.id)} style={{ padding: '6px 12px', background: '#2980b9', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>Mark Complete</button>
                                                    <button onClick={() => openModal('noshow', b.id)} style={{ padding: '6px 12px', background: '#7f8c8d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>No-Show</button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex-col">
                        {user.verified ? (
                            <div style={{ background: '#f9f9f9', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
                                <h3 style={{ marginTop: 0 }}>Post Availability</h3>
                                <form onSubmit={handleCreateSlot} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required style={{ padding: '8px' }}/>
                                    <input type="time" value={time} onChange={(e) => setTime(e.target.value)} required style={{ padding: '8px' }}/>
                                    <input type="number" placeholder="Duration (Mins)" value={duration} onChange={(e) => setDuration(e.target.value)} required min="15" style={{ padding: '8px' }}/>
                                    <button type="submit" style={{ padding: '10px', background: '#2c3e50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Publish Slot</button>
                                </form>
                            </div>
                        ) : (
                            <div style={{ background: '#fef9e7', padding: '20px', borderRadius: '8px', marginBottom: '20px', borderLeft: '5px solid #f39c12' }}>
                                <h3 style={{ marginTop: 0, color: '#d35400' }}>Account Pending Verification</h3>
                                <p style={{ fontSize: '14px' }}>Your alumni account is being reviewed by the System Administrator. You can post slots once verified.</p>
                            </div>
                        )}
                        
                        <h3>Unbooked Slots</h3>
                        {slots.filter(s => !s.booked).map(slot => (
                            <div key={slot.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', borderBottom: '1px solid #eee' }}>
                                <span>{new Date(slot.startTimeUtc).toLocaleString([], {dateStyle: 'short', timeStyle: 'short'})}</span>
                                <button onClick={() => handleDeleteSlot(slot.id)} style={{ padding: '4px 8px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>Delete</button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'chat' && (
                <div className="chat-box">
                    <div className="chat-contacts">
                        <div style={{ padding: '15px', fontWeight: 'bold', borderBottom: '1px solid #ccc', background: '#eee' }}>My Students</div>
                        {contacts.length === 0 && <p style={{ padding: '15px', color: '#888', fontSize: '14px' }}>Approve a session to unlock chat.</p>}
                        {contacts.map(c => (
                            <div key={c.id} style={{ padding: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', background: activeChat === c.id ? '#e0f7fa' : 'transparent', borderBottom: '1px solid #eee' }} onClick={() => setActiveChat(c.id)}>
                                <img src={c.profileImageUrl || defaultAvatar} style={{ width: '35px', height: '35px', borderRadius: '50%', objectFit: 'cover' }} />
                                <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{c.name || c.email}</div>
                            </div>
                        ))}
                    </div>
                    <div className="chat-area">
                        {activeChat ? (
                            <>
                                <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {chatMessages.map(m => (
                                        <div key={m.id} style={{ alignSelf: m.sender.id === user.id ? 'flex-end' : 'flex-start' }}>
                                            <div style={{ padding: '10px 15px', borderRadius: '20px', background: m.sender.id === user.id ? '#3498db' : '#ecf0f1', color: m.sender.id === user.id ? 'white' : 'black', maxWidth: '250px', wordWrap: 'break-word' }}>{m.content}</div>
                                            <div style={{ fontSize: '10px', color: '#999', marginTop: '4px', textAlign: m.sender.id === user.id ? 'right' : 'left' }}>{new Date(m.timestamp).toLocaleTimeString([], {timeStyle: 'short'})}</div>
                                        </div>
                                    ))}
                                </div>
                                <div style={{ padding: '15px', background: '#eee', display: 'flex', gap: '10px' }}>
                                    <input value={newMessage} onChange={e => setNewMessage(e.target.value)} onKeyPress={e => e.key === 'Enter' && sendMessage()} style={{ flex: 1, padding: '12px', borderRadius: '20px', border: '1px solid #ccc' }} placeholder="Type a message..." />
                                    <button onClick={sendMessage} style={{ padding: '0 20px', background: '#2c3e50', color: 'white', border: 'none', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold' }}>Send</button>
                                </div>
                            </>
                        ) : <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>Select a student to chat</div>}
                    </div>
                </div>
            )}

            {activeTab === 'history' && (
                <div className="table-responsive">
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#eee', textAlign: 'left' }}>
                                <th style={{ padding: '12px' }}>Date</th>
                                <th style={{ padding: '12px' }}>Student</th>
                                <th style={{ padding: '12px' }}>Status</th>
                                <th style={{ padding: '12px' }}>Reason</th>
                            </tr>
                        </thead>
                        <tbody>
                            {historicalBookings.slice().reverse().map(b => (
                                <tr key={b.id} style={{ borderBottom: '1px solid #ddd' }}>
                                    <td style={{ padding: '12px' }}>{new Date(b.slot.startTimeUtc).toLocaleDateString()}</td>
                                    <td style={{ padding: '12px' }}>{b.student.name || b.student.email}</td>
                                    <td style={{ padding: '12px', fontWeight: 'bold', color: b.status==='COMPLETED'?'#2980b9':'#e74c3c' }}>{b.status}</td>
                                    <td style={{ padding: '12px', fontSize: '14px', color: '#666' }}>{b.cancellationReason || '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {activeTab === 'profile' && (
                <div style={{ background: '#f9f9f9', padding: '30px', borderRadius: '8px', maxWidth: '500px' }}>
                    <form onSubmit={handleProfileUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <div><label style={{ fontWeight: 'bold', fontSize: '14px' }}>Profile Image URL</label><input type="url" value={profileData.profileImageUrl} onChange={e => setProfileData({...profileData, profileImageUrl: e.target.value})} style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }} /></div>
                        <div><label style={{ fontWeight: 'bold', fontSize: '14px' }}>Current Company / Title</label><input type="text" value={profileData.company} onChange={e => setProfileData({...profileData, company: e.target.value})} style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }} /></div>
                        <div><label style={{ fontWeight: 'bold', fontSize: '14px' }}>LinkedIn URL</label><input type="url" value={profileData.linkedinUrl} onChange={e => setProfileData({...profileData, linkedinUrl: e.target.value})} style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }} /></div>
                        <div><label style={{ fontWeight: 'bold', fontSize: '14px' }}>Brief Bio / Expertise</label><textarea value={profileData.experience} onChange={e => setProfileData({...profileData, experience: e.target.value})} style={{ width: '100%', height: '100px', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', resize: 'none' }} /></div>
                        <button type="submit" style={{ padding: '12px', background: '#34495e', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Save Profile</button>
                    </form>
                </div>
            )}

            {/* UNIFIED BEAUTIFUL MODAL (No window.alert/prompt) */}
            {modal.isOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}>
                    <div style={{ background: 'white', padding: '30px', borderRadius: '8px', width: '100%', maxWidth: '400px' }}>
                        
                        {/* Errors & Success Messages */}
                        {modal.type === 'error' || modal.type === 'success' ? (
                            <>
                                <h3 style={{ marginTop: 0, color: modal.type === 'error' ? '#e74c3c' : '#27ae60' }}>
                                    {modal.type === 'error' ? 'Action Failed' : 'Success'}
                                </h3>
                                <p style={{ marginBottom: '20px' }}>{modal.input}</p>
                                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                    <button onClick={closeModal} style={{ padding: '8px 16px', background: '#ecf0f1', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Close</button>
                                </div>
                            </>
                        ) : (
                            /* Reason Inputs (Reject/Cancel) */
                            <>
                                <h3 style={{ marginTop: 0 }}>{modal.type === 'cancel' || modal.type === 'reject' ? 'Cancel / Reject Session' : 'Confirm Update'}</h3>
                                {modal.error && <p style={{ color: '#e74c3c', fontSize: '14px', fontWeight: 'bold', marginBottom: '10px' }}>{modal.error}</p>}
                                
                                {modal.type === 'cancel' || modal.type === 'reject' ? (
                                    <textarea style={{ width: '100%', height: '80px', padding: '10px', boxSizing: 'border-box', marginBottom: '15px', resize: 'none' }} placeholder="Reason for rejecting/cancelling..." value={modal.input} onChange={e => setModal({...modal, input: e.target.value})} />
                                ) : ( <p style={{ marginBottom: '20px' }}>Are you sure you want to change the status of this session?</p> )}
                                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                    <button onClick={closeModal} style={{ padding: '8px 16px', background: '#ecf0f1', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Back</button>
                                    <button onClick={submitModal} style={{ padding: '8px 16px', background: modal.type === 'cancel' || modal.type === 'reject' ? '#e74c3c' : '#27ae60', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Confirm</button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AlumniDashboard;