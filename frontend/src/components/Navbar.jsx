import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Navbar = () => {
    const { user, logout } = useContext(AuthContext);
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();

    // If the user isn't logged in, we don't show the dashboard navbar
    if (!user) return null;

    const handleLogout = () => {
        logout();
        setIsOpen(false);
        navigate('/');
    };

    const toggleMenu = () => setIsOpen(!isOpen);

    const css = `
        .navbar { background-color: #2c3e50; color: white; padding: 15px 20px; display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; z-index: 500; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .nav-brand { font-size: 20px; font-weight: bold; text-decoration: none; color: white; display: flex; align-items: center; gap: 10px; }
        .nav-links { display: flex; gap: 20px; align-items: center; }
        .nav-link { color: white; text-decoration: none; cursor: pointer; font-size: 16px; transition: color 0.2s; }
        .hamburger { display: none; background: none; border: none; color: white; font-size: 28px; cursor: pointer; }
        
        /* Mobile / Tablet Drawer Styles */
        @media (max-width: 768px) {
            .nav-links { 
                position: fixed; top: 0; right: ${isOpen ? '0' : '-100%'}; 
                height: 100vh; width: 250px; background-color: #34495e; 
                flex-direction: column; align-items: flex-start; padding: 60px 20px; 
                transition: right 0.3s ease-in-out; box-shadow: -2px 0 5px rgba(0,0,0,0.5);
            }
            .hamburger { display: block; z-index: 600; }
            .close-btn { position: absolute; top: 15px; right: 20px; background: none; border: none; color: white; font-size: 32px; cursor: pointer; }
        }
        @media (min-width: 769px) { .close-btn { display: none; } }
    `;

    return (
        <nav className="navbar">
            <style>{css}</style>
            
            <Link to="/" className="nav-brand">
                🎓 Alumni Connect
            </Link>
            
            <button className="hamburger" onClick={toggleMenu}>☰</button>
            
            <div className="nav-links">
                <button className="close-btn" onClick={toggleMenu}>&times;</button>
                <span className="nav-link" style={{ color: '#bdc3c7', cursor: 'default' }}>
                    Welcome, {user.name || user.email}
                </span>
                <button onClick={handleLogout} style={{ padding: '8px 16px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                    Logout
                </button>
            </div>
            
            {/* Mobile Drawer Overlay */}
            {isOpen && <div onClick={toggleMenu} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 400 }} />}
        </nav>
    );
};

export default Navbar;