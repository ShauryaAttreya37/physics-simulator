import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import './Home.css';

export default function Home({ onNavigate, isAuthenticated, onLogout }) {
  const containerRef = useRef(null);
  const [isExiting, setIsExiting] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleNavigate = (page) => {
    setIsExiting(true);
    setTimeout(() => {
      onNavigate(page);
    }, 400); // matches the 0.4s animation duration in App.css
  };

  useEffect(() => {
    if (isAuthenticated && supabase) {
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) setUserEmail(user.email);
      });
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!containerRef.current) return;
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      
      containerRef.current.style.setProperty('--mouse-x', x);
      containerRef.current.style.setProperty('--mouse-y', y);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    if (!showUserMenu) return;
    const handleClick = () => setShowUserMenu(false);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [showUserMenu]);

  return (
    <div className={`home-wrapper ${isExiting ? 'page-fade-out' : 'page-fade-in'}`} ref={containerRef}>
      <div className="home-container">
        {/* Dynamic Abstract Lighting */}
        <div className="bg-mesh">
          <div className="orb orb-1"></div>
          <div className="orb orb-2"></div>
        </div>

        {/* Floating Glass Navbar */}
        <nav className="glass-nav">
          <div className="nav-brand">
            <img src="/favicon.svg" alt="Physics Simulator" className="logo-mark-img" />
            <span className="logo-text">physics simulator</span>
          </div>
          <div className="nav-links">
            <button className="nav-link-btn" onClick={() => handleNavigate('topics')}>Laboratory</button>
            <button className="nav-link-btn" onClick={() => handleNavigate('integrators')}>Integrators</button>
            <button className="nav-link-btn" onClick={() => handleNavigate('docs')}>Docs</button>
            {!isAuthenticated && <button className="nav-link-btn" onClick={() => handleNavigate('login')}>Sign In</button>}
          </div>
          {isAuthenticated ? (
            <div className="user-menu-wrapper" onClick={(e) => e.stopPropagation()}>
              <button className="user-avatar-btn" onClick={() => setShowUserMenu(!showUserMenu)} title={userEmail}>
                <span className="avatar-initial">{userEmail ? userEmail.charAt(0).toUpperCase() : '?'}</span>
              </button>
              {showUserMenu && (
                <div className="user-dropdown">
                  <div className="dropdown-header">
                    <span className="dropdown-email">{userEmail}</span>
                    <span className="dropdown-role">Researcher</span>
                  </div>
                  <div className="dropdown-divider"></div>
                  <button className="dropdown-item" onClick={() => handleNavigate('profile')}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    Profile
                  </button>
                  <button className="dropdown-item danger" onClick={onLogout}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
                    Log Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button className="nav-btn" onClick={() => handleNavigate('topics')}>Launch Lab</button>
          )}
        </nav>

        {/* Thin Grid Overlay */}
        <div className="grid-overlay parallax-back"></div>
        <div className="horizontal-axis parallax-back"></div>
        <div className="vertical-axis parallax-back"></div>

        {/* Hero Content */}
        <main className="hero-content parallax-front">
          <h1 className="hero-title parallax-title">
            Transform your understanding.<br />
            Elevate your research.
          </h1>
          
          <p className="hero-sub parallax-sub">
            Physics Simulator adapts to dynamic physical systems<br/>
            in real time — revealing chaos, conserving energy,<br/>
            and helping you visualize the mechanics of the universe.
          </p>

          <button className="primary-btn parallax-btn" onClick={() => handleNavigate('topics')}>
            Enter Laboratory
          </button>

          <div className="discord-banner parallax-btn">
            <div className="discord-content">
              <svg className="discord-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 127.14 96.36">
                <path fill="currentColor" d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a67.55,67.55,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.31,60,73.31,53s5-12.74,11.43-12.74S96.2,46,96.09,53,91.04,65.69,84.69,65.69Z"/>
              </svg>
              <div className="discord-text">
                <h3>Join Our Academic Community</h3>
                <p>Discuss physics, share research, and collaborate with peers.</p>
              </div>
              <a href="https://discord.gg/pbDm2rRECb" target="_blank" rel="noopener noreferrer" className="discord-btn">
                Connect
              </a>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
