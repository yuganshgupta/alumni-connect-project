import React, { useState, useEffect, useContext } from 'react';
import api from '../api/axiosConfig';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, useParams, Link } from 'react-router-dom';

const StudentDashboard = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    
    // We read the active tab directly from the URL!
    const { tab } = useParams();
    const activeTab = tab || 'browse'; 

    const [slots, setSlots] = useState([]);
    const [myBookings, setMyBookings] = useState([]);
    
    const [modal, setModal] = useState({ isOpen: false, slotId: null, agenda: '' });
    const [bookingState, setBookingState] = useState('idle'); 
    const [agendaError, setAgendaError] = useState(''); 
    
    const [profileData, setProfileData] = useState({ linkedinUrl: '', experience: '', resumeUrl: '', profileImageUrl: '' });

    // Notification State
    const [notifyPrefs, setNotifyPrefs] = useState({ bookingUpdates: true, sessionReminders: true, chatAlerts: true });
    const [isSavingPrefs, setIsSavingPrefs] = useState(false);

    const [activeChat, setActiveChat] = useState(null);
    const [chatMessages, setChatMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');

    const fetchData = async () => {
        if (!user) return;
        try {
            const slotsRes = await api.get('/bookings/slots');
            setSlots(slotsRes.data);
            const bookingsRes = await api.get(`/bookings/student/${user.id}`);
            setMyBookings(bookingsRes.data);
            
            // Fetch preferences
            const prefsRes = await api.get(`/users/${user.id}/preferences`);
            if (prefsRes.data) setNotifyPrefs(prefsRes.data);
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
        if (!user || user.role !== 'STUDENT') { navigate('/'); return; }
        setProfileData({ linkedinUrl: user.linkedinUrl || '', experience: user.experience || '', resumeUrl: user.resumeUrl || '', profileImageUrl: user.profileImageUrl || '' });
        fetchData();
        const interval = setInterval(fetchData, 5000);
        return () => clearInterval(interval);
    }, [user, navigate]);

    useEffect(() => {
        fetchMessages();
        const chatInterval = setInterval(fetchMessages, 3000);
        return () => clearInterval(chatInterval);
    }, [activeChat]);

    // Mark messages as read when you open a chat
    useEffect(() => {
        if (activeChat && activeTab === 'chat') {
            api.put(`/messages/read/${activeChat}/${user.id}`).catch(() => {});
        }
    }, [activeChat, chatMessages, activeTab, user.id]);

    if (!user) return null;

    const handlePrefsUpdate = async (settingKey) => {
        setIsSavingPrefs(true);
        const originalPrefs = { ...notifyPrefs };
        const updatedPrefs = { ...notifyPrefs, [settingKey]: !notifyPrefs[settingKey] };
        setNotifyPrefs(updatedPrefs); // Optimistic UI update
        
        try {
            await api.put(`/users/${user.id}/preferences`, updatedPrefs);
        } catch (e) {
            alert("Failed to save preference.");
            setNotifyPrefs(originalPrefs); // Revert on failure
        } finally {
            setIsSavingPrefs(false);
        }
    };

    const sendMessage = async () => {
        if (!newMessage.trim() || !activeChat) return;
        try { await api.post('/messages/send', { senderId: user.id, receiverId: activeChat, content: newMessage }); setNewMessage(''); fetchMessages(); } catch (e) {}
    };

    const closeModal = () => {
        setModal({ isOpen: false, slotId: null, agenda: '' });
        setAgendaError('');
        setTimeout(() => setBookingState('idle'), 300);
    };

    const confirmBooking = async () => {
        if(!modal.agenda.trim()) {
            setAgendaError("Please briefly describe what you want to discuss.");
            return;
        }
        setAgendaError('');
        setBookingState('loading');
        try {
            await api.post(`/bookings/book/${modal.slotId}/${user.id}`, { agenda: modal.agenda });
            setBookingState('success');
            setTimeout(() => { fetchData(); closeModal(); navigate('/student-dashboard/upcoming'); }, 2000);
        } catch (error) {
            setBookingState('error');
            setTimeout(() => setBookingState('idle'), 3000);
        }
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        try {
            const res = await api.put(`/users/${user.id}/profile`, profileData);
            localStorage.setItem('user', JSON.stringify(res.data));
            window.location.reload(); 
        } catch (e) {}
    };

    const upcomingBookings = myBookings.filter(b => ['PENDING', 'APPROVED'].includes(b.status));
    const historicalBookings = myBookings.filter(b => ['COMPLETED', 'CANCELLED', 'REJECTED', 'NO_SHOW'].includes(b.status));
    
    // GHOST SLOT FIX (Frontend side): Remove slots the student has already interacted with from the Browse feed
    const historicalSlotIds = myBookings.map(b => b.slot.id);
    const visibleSlots = slots.filter(slot => !historicalSlotIds.includes(slot.id));

    const contacts = Array.from(new Set(myBookings.filter(b => ['APPROVED', 'COMPLETED'].includes(b.status)).map(b => JSON.stringify(b.slot.mentor)))).map(s => JSON.parse(s));
    const defaultAvatar = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';

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
        .messages-container { flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 10px; }
        .chat-input-bar { padding: 15px; background: #eee; display: flex; gap: 10px; flex-shrink: 0; border-top: 1px solid #ccc; }
        
        /* FIXED: Desktop Contact Item Alignment */
        .contact-item { padding: 15px; display: flex; align-items: center; gap: 12px; border-bottom: 1px solid #eee; transition: background 0.2s; }
        .contact-item:hover { background: #ecf0f1; }
        .contact-name { font-weight: bold; font-size: 14px; color: #2c3e50; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        /* MOBILE CHAT OVERHAUL */
        @media (max-width: 768px) {
            .dash-container { padding: 10px; }
            .chat-box { flex-direction: column; height: calc(100vh - 120px); border-radius: 0; border: none; }
            .chat-contacts { width: 100%; height: 90px; min-height: 90px; border-right: none; border-bottom: 1px solid #ccc; display: flex; overflow-x: auto; white-space: nowrap; -webkit-overflow-scrolling: touch; }
            
            /* Mobile Contact Item Override */
            .contact-item { display: inline-flex; flex-direction: column; justify-content: center; align-items: center; min-width: 80px; padding: 10px; border-bottom: none; border-right: 1px solid #eee; gap: 5px; }
            .contact-name { font-size: 12px; font-weight: normal; max-width: 70px; }
            
            .chat-area { flex: 1; display: flex; flex-direction: column; }
        }
    `;

    return (
        <div className="dash-container">
            <style>{css}</style>

            {activeTab === 'browse' && (
                <div className="flex-row">
                    {visibleSlots.length === 0 ? <p style={{ color: '#666' }}>No new slots currently available. Check back later!</p> : visibleSlots.map(slot => (
                        <div key={slot.id} className="flex-col" style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '8px', background: 'white' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                                <img src={slot.mentor.profileImageUrl || defaultAvatar} style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover' }} />
                                <div>
                                    <h4 style={{ margin: '0 0 5px 0' }}>{slot.mentor.name || slot.mentor.email}</h4>
                                    <p style={{ margin: '0', fontSize: '14px', color: '#7f8c8d' }}>{slot.mentor.company}</p>
                                </div>
                            </div>
                            <p style={{ fontWeight: 'bold' }}>{new Date(slot.startTimeUtc + 'Z').toLocaleString([], {dateStyle: 'medium', timeStyle: 'short'})}</p>
                            <button onClick={() => { setModal({ isOpen: true, slotId: slot.id, agenda: '' }); setBookingState('idle'); }} style={{ width: '100%', padding: '12px', background: '#3498db', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Request Session</button>
                        </div>
                    ))}
                </div>
            )}

            {activeTab === 'upcoming' && (
                <div className="flex-row">
                    {upcomingBookings.length === 0 ? <p>No upcoming sessions.</p> : upcomingBookings.slice().reverse().map(b => (
                        <div key={b.id} className="flex-col" style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '8px', background: 'white', borderLeft: b.status === 'APPROVED' ? '5px solid #27ae60' : '5px solid #f39c12' }}>
                            <h4>Mentor: {b.slot.mentor.name}</h4>
                            <p><strong>Time:</strong> {new Date(b.slot.startTimeUtc + 'Z').toLocaleString()}</p>
                            <p><strong>My Agenda:</strong> {b.studentAgenda}</p>
                            <p style={{ color: b.status === 'APPROVED' ? '#27ae60' : '#f39c12', fontWeight: 'bold' }}>Status: {b.status}</p>
                            
                            {/* NEW: JOIN GOOGLE MEET / ZOOM LINK FOR STUDENT */}
                            {b.status === 'APPROVED' && b.slot.mentor.meetingLink ? (
                                <a href={b.slot.mentor.meetingLink} target="_blank" rel="noopener noreferrer" style={{ display: 'block', textAlign: 'center', padding: '10px', background: '#9b59b6', color: 'white', textDecoration: 'none', borderRadius: '4px', fontWeight: 'bold', marginTop: '10px' }}>
                                    🎥 Join Video Call
                                </a>
                            ) : b.status === 'APPROVED' && !b.slot.mentor.meetingLink ? (
                                <div style={{ fontSize: '12px', color: '#e67e22', padding: '10px', background: '#fdf2e9', borderRadius: '4px', textAlign: 'center', marginTop: '10px' }}>
                                    Mentor has not linked a meeting room yet. Message them in Chat!
                                </div>
                            ) : null}
                        </div>
                    ))}
                </div>
            )}

            {activeTab === 'chat' && (
                <div className="chat-box">
                    <div className="chat-contacts">
                        {/* Mobile-friendly horizontal scroll list */}
                        {contacts.length === 0 && <p style={{ padding: '15px', color: '#888', fontSize: '14px' }}>No active chats.</p>}
                        {contacts.map(c => (
                            <div key={c.id} className="contact-item" style={{ cursor: 'pointer', background: activeChat === c.id ? '#e0f7fa' : 'transparent' }} onClick={() => setActiveChat(c.id)}>
                                {/* Flex-shrink 0 ensures the image never squishes! */}
                                <img src={c.profileImageUrl || defaultAvatar} style={{ width: '35px', height: '35px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                                {/* New contact-name class handles the alignment and truncates long names */}
                                <div className="contact-name">{c.name || c.email}</div>
                            </div>
                        ))}
                    </div>
                    <div className="chat-area">
                        {activeChat ? (
                            <>
                                <div className="messages-container">
                                    {chatMessages.map(m => (
                                        <div key={m.id} style={{ alignSelf: m.sender.id === user.id ? 'flex-end' : 'flex-start', marginBottom: '10px' }}>
                                            <div style={{ padding: '10px 15px', borderRadius: '20px', background: m.sender.id === user.id ? '#3498db' : '#ecf0f1', color: m.sender.id === user.id ? 'white' : 'black', maxWidth: '250px', wordWrap: 'break-word' }}>{m.content}</div>
                                            <div style={{ fontSize: '10px', color: '#999', marginTop: '4px', textAlign: m.sender.id === user.id ? 'right' : 'left' }}>{new Date(m.timestamp + 'Z').toLocaleTimeString([], {timeStyle: 'short'})}</div>
                                        </div>
                                    ))}
                                </div>
                                <div className="chat-input-bar">
                                    <input value={newMessage} onChange={e => setNewMessage(e.target.value)} onKeyPress={e => e.key === 'Enter' && sendMessage()} style={{ flex: 1, padding: '12px', borderRadius: '20px', border: '1px solid #ccc' }} placeholder="Type a message..." />
                                    <button onClick={sendMessage} style={{ padding: '0 20px', background: '#27ae60', color: 'white', border: 'none', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold' }}>Send</button>
                                </div>
                            </>
                        ) : <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>Select a connection to chat</div>}
                    </div>
                </div>
            )}

            {activeTab === 'history' && (
                <div className="table-responsive">
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#eee', textAlign: 'left' }}>
                                <th style={{ padding: '12px' }}>Date</th>
                                <th style={{ padding: '12px' }}>Mentor</th>
                                <th style={{ padding: '12px' }}>Status</th>
                                <th style={{ padding: '12px' }}>Feedback/Reason</th>
                            </tr>
                        </thead>
                        <tbody>
                            {historicalBookings.slice().reverse().map(b => (
                                <tr key={b.id} style={{ borderBottom: '1px solid #ddd' }}>
                                    <td style={{ padding: '12px' }}>{new Date(b.slot.startTimeUtc + 'Z').toLocaleDateString()}</td>
                                    <td style={{ padding: '12px' }}>{b.slot.mentor.name}</td>
                                    <td style={{ padding: '12px', fontWeight: 'bold', color: b.status==='COMPLETED'?'#2980b9':'#e74c3c' }}>{b.status}</td>
                                    <td style={{ padding: '12px', fontSize: '14px', color: '#666' }}>{b.cancellationReason || '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {activeTab === 'profile' && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '30px' }}>
                    {/* EXISTING PROFILE FORM */}
                    <div style={{ background: '#f9f9f9', padding: '30px', borderRadius: '8px', flex: '1', minWidth: '300px', maxWidth: '500px' }}>
                        <h3 style={{ marginTop: 0 }}>My Profile</h3>
                        <form onSubmit={handleProfileUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <div><label style={{ fontWeight: 'bold', fontSize: '14px' }}>Profile Image URL</label><input type="url" value={profileData.profileImageUrl} onChange={e => setProfileData({...profileData, profileImageUrl: e.target.value})} style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }} /></div>
                            <div><label style={{ fontWeight: 'bold', fontSize: '14px' }}>Current Company / Title</label><input type="text" value={profileData.company} onChange={e => setProfileData({...profileData, company: e.target.value})} style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }} /></div>
                            <div><label style={{ fontWeight: 'bold', fontSize: '14px' }}>LinkedIn URL</label><input type="url" value={profileData.linkedinUrl} onChange={e => setProfileData({...profileData, linkedinUrl: e.target.value})} style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }} /></div>
                            <div><label style={{ fontWeight: 'bold', fontSize: '14px' }}>Brief Bio / Expertise</label><textarea value={profileData.experience} onChange={e => setProfileData({...profileData, experience: e.target.value})} style={{ width: '100%', height: '100px', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', resize: 'none' }} /></div>
                            <button type="submit" style={{ padding: '12px', background: '#34495e', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Save Profile</button>
                        </form>
                    </div>

                    {/* FIXED: NOTIFICATION SETTINGS (Mobile Optimized) */}
                    <div style={{ background: '#f9f9f9', padding: '20px', borderRadius: '8px', flex: '1', minWidth: '280px', maxWidth: '500px', boxSizing: 'border-box' }}>
                        <h3 style={{ marginTop: 0 }}>Notification Settings</h3>
                        <p style={{ fontSize: '14px', color: '#666', marginBottom: '20px' }}>Control what emails you receive from Alumni Connect. Security and account alerts cannot be disabled.</p>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '15px', borderBottom: '1px solid #eee', gap: '15px' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 'bold', color: '#2c3e50' }}>Booking Updates</div>
                                    <div style={{ fontSize: '12px', color: '#7f8c8d', lineHeight: '1.4', marginTop: '4px' }}>Emails when sessions are approved, rejected, or cancelled.</div>
                                </div>
                                <label style={{ position: 'relative', display: 'inline-block', width: '50px', height: '24px', flexShrink: 0 }}>
                                    <input type="checkbox" checked={notifyPrefs.bookingUpdates} onChange={() => handlePrefsUpdate('bookingUpdates')} disabled={isSavingPrefs} style={{ opacity: 0, width: 0, height: 0 }} />
                                    <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: notifyPrefs.bookingUpdates ? '#27ae60' : '#ccc', transition: '.4s', borderRadius: '34px' }}>
                                        <span style={{ position: 'absolute', content: '""', height: '16px', width: '16px', left: notifyPrefs.bookingUpdates ? '30px' : '4px', bottom: '4px', backgroundColor: 'white', transition: '.4s', borderRadius: '50%' }}></span>
                                    </span>
                                </label>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '15px', borderBottom: '1px solid #eee', gap: '15px' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 'bold', color: '#2c3e50' }}>Session Reminders</div>
                                    <div style={{ fontSize: '12px', color: '#7f8c8d', lineHeight: '1.4', marginTop: '4px' }}>Automated 24-hour and 1-hour upcoming session alerts.</div>
                                </div>
                                <label style={{ position: 'relative', display: 'inline-block', width: '50px', height: '24px', flexShrink: 0 }}>
                                    <input type="checkbox" checked={notifyPrefs.sessionReminders} onChange={() => handlePrefsUpdate('sessionReminders')} disabled={isSavingPrefs} style={{ opacity: 0, width: 0, height: 0 }} />
                                    <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: notifyPrefs.sessionReminders ? '#27ae60' : '#ccc', transition: '.4s', borderRadius: '34px' }}>
                                        <span style={{ position: 'absolute', content: '""', height: '16px', width: '16px', left: notifyPrefs.sessionReminders ? '30px' : '4px', bottom: '4px', backgroundColor: 'white', transition: '.4s', borderRadius: '50%' }}></span>
                                    </span>
                                </label>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '15px' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 'bold', color: '#2c3e50' }}>Security & Account</div>
                                    <div style={{ fontSize: '12px', color: '#7f8c8d', lineHeight: '1.4', marginTop: '4px' }}>Password resets and admin notices.</div>
                                </div>
                                {/* Locked Toggle */}
                                <label style={{ position: 'relative', display: 'inline-block', width: '50px', height: '24px', opacity: 0.5, flexShrink: 0 }}>
                                    <input type="checkbox" checked={true} disabled style={{ opacity: 0, width: 0, height: 0 }} />
                                    <span style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#3498db', borderRadius: '34px' }}>
                                        <span style={{ position: 'absolute', height: '16px', width: '16px', left: '30px', bottom: '4px', backgroundColor: 'white', borderRadius: '50%' }}></span>
                                    </span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* CUSTOM BOOKING MODAL (No native alerts) */}
            {modal.isOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}>
                    <div style={{ background: 'white', padding: '30px', borderRadius: '8px', width: '100%', maxWidth: '400px', textAlign: 'center' }}>
                        {bookingState === 'idle' && (
                            <>
                                <h3 style={{ marginTop: 0 }}>Session Agenda</h3>
                                {agendaError && <p style={{ color: '#e74c3c', fontSize: '14px', marginBottom: '10px', fontWeight: 'bold' }}>{agendaError}</p>}
                                <textarea style={{ width: '100%', height: '100px', padding: '10px', boxSizing: 'border-box', border: '1px solid #ccc', borderRadius: '4px', marginBottom: '15px', resize: 'none' }} placeholder="What do you want to achieve?" value={modal.agenda} onChange={(e) => setModal({ ...modal, agenda: e.target.value })} />
                                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                    <button onClick={closeModal} style={{ padding: '8px 16px', background: '#ecf0f1', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                                    <button onClick={confirmBooking} style={{ padding: '8px 16px', background: '#3498db', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Confirm Booking</button>
                                </div>
                            </>
                        )}
                        {bookingState === 'loading' && <h3>Processing Request...</h3>}
                        {bookingState === 'success' && <h3 style={{ color: '#27ae60' }}>✓ Success!</h3>}
                        {bookingState === 'error' && <h3 style={{ color: '#e74c3c' }}>✗ Booking Failed</h3>}
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentDashboard;