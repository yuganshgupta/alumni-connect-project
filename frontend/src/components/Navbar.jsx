import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axiosConfig';

const Navbar = () => {
    const { user, logout } = useContext(AuthContext);
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0); // NEW: Notification Badge
    const navigate = useNavigate();
    const location = useLocation();

    // Fetch unread messages count every 5 seconds
    useEffect(() => {
        if (!user) return;
        const fetchUnread = async () => {
            try {
                const res = await api.get(`/messages/unread/${user.id}`);
                setUnreadCount(res.data);
            } catch (e) {}
        };
        fetchUnread();
        const interval = setInterval(fetchUnread, 5000);
        return () => clearInterval(interval);
    }, [user]);

    useEffect(() => {
        if (user && (location.pathname === '/' || location.pathname === '/register')) {
            if (user.role === 'ADMIN') navigate('/admin-dashboard/users');
            else if (user.role === 'ALUMNI') navigate('/alumni-dashboard/manage');
            else navigate('/student-dashboard/browse');
        }
    }, [user, location, navigate]);

    if (!user || location.pathname === '/' || location.pathname === '/register') return null;

    const handleLogout = () => {
        logout();
        setIsOpen(false);
        navigate('/');
    };

    let navLinks = [];
    if (user.role === 'STUDENT') {
        navLinks = [
            { name: 'Browse', path: '/student-dashboard/browse' },
            { name: 'Upcoming', path: '/student-dashboard/upcoming' },
            { name: 'Messages', path: '/student-dashboard/chat', badge: true }, // Has Badge
            { name: 'History', path: '/student-dashboard/history' },
            { name: 'Profile', path: '/student-dashboard/profile' }
        ];
    } else if (user.role === 'ALUMNI') {
        navLinks = [
            { name: 'Active Board', path: '/alumni-dashboard/manage' },
            { name: 'Student Chat', path: '/alumni-dashboard/chat', badge: true }, // Has Badge
            { name: 'History', path: '/alumni-dashboard/history' },
            { name: 'Profile', path: '/alumni-dashboard/profile' }
        ];
    } else if (user.role === 'ADMIN') {
        navLinks = [
            { name: 'User Directory', path: '/admin-dashboard/users' },
            { name: 'Audit Logs', path: '/admin-dashboard/logs' }
        ];
    }

    const css = `
        .navbar { background-color: #2c3e50; color: white; padding: 15px 20px; display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; z-index: 1000; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .nav-brand { font-size: 20px; font-weight: bold; text-decoration: none; color: white; display: flex; align-items: center; gap: 10px; }
        .nav-links { display: flex; gap: 20px; align-items: center; }
        .nav-item { color: #bdc3c7; text-decoration: none; font-size: 15px; font-weight: bold; padding: 5px 10px; border-radius: 4px; transition: 0.2s; position: relative; }
        .nav-item:hover, .nav-item.active { color: white; background: rgba(255,255,255,0.1); }
        .hamburger { display: none; background: none; border: none; color: white; font-size: 28px; cursor: pointer; }
        .profile-pic { width: 35px; height: 35px; border-radius: 50%; object-fit: cover; border: 2px solid white; }
        .badge { background: #e74c3c; color: white; border-radius: 50%; padding: 2px 6px; font-size: 11px; margin-left: 5px; vertical-align: top; }
        
        @media (max-width: 900px) {
            .nav-links { 
                position: fixed; top: 0; right: ${isOpen ? '0' : '-100%'}; 
                height: 100vh; width: 260px; background-color: #34495e; 
                flex-direction: column; align-items: flex-start; padding: 60px 20px; 
                transition: right 0.3s ease-in-out; box-shadow: -2px 0 5px rgba(0,0,0,0.5);
                z-index: 1001; /* FIX 1: Must be higher than overlay (900) */
            }
            .hamburger { display: ${isOpen ? 'none' : 'block'}; z-index: 1100; } /* FIX 2: Hides when open to prevent double close buttons */
            .close-btn { position: absolute; top: 15px; right: 20px; background: none; border: none; color: white; font-size: 32px; cursor: pointer; }
            .nav-item { width: 100%; padding: 15px 10px; border-bottom: 1px solid rgba(255,255,255,0.1); }
        }
        @media (min-width: 901px) { .close-btn { display: none; } }
    `;

    return (
        <nav className="navbar">
            <style>{css}</style>
            <Link to={navLinks[0]?.path} className="nav-brand">🎓 Alumni Connect</Link>
            
            <button className="hamburger" onClick={() => setIsOpen(!isOpen)}>☰</button>
            
            <div className="nav-links">
                <button className="close-btn" onClick={() => setIsOpen(false)}>&times;</button>
                
                {navLinks.map(link => (
                    <Link 
                        key={link.path} 
                        to={link.path} 
                        className={`nav-item ${location.pathname.includes(link.path.split('/')[2]) ? 'active' : ''}`}
                        onClick={() => setIsOpen(false)}
                    >
                        {link.name}
                        {/* THE NOTIFICATION BADGE */}
                        {link.badge && unreadCount > 0 && <span className="badge">{unreadCount}</span>}
                    </Link>
                ))}

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: 'auto', paddingLeft: '20px', borderLeft: '1px solid rgba(255,255,255,0.2)' }}>
                    <img src={user.profileImageUrl || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} className="profile-pic" alt="Profile" />
                    <button onClick={handleLogout} style={{ padding: '8px 16px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Logout</button>
                </div>
            </div>
            
            {isOpen && <div onClick={() => setIsOpen(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 900 }} />}
        </nav>
    );
};

export default Navbar;