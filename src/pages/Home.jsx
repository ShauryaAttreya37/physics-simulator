import { useEffect, useRef, useState } from 'react';
import './Home.css';

export default function Home({ onNavigate }) {
  const containerRef = useRef(null);
  const [isExiting, setIsExiting] = useState(false);

  const handleNavigate = (page) => {
    setIsExiting(true);
    setTimeout(() => {
      onNavigate(page);
    }, 400); // matches the 0.4s animation duration in App.css
  };

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
          </div>
          <button className="nav-btn" onClick={() => handleNavigate('topics')}>Launch Lab</button>
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
        </main>
      </div>
    </div>
  );
}
