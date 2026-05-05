import PropTypes from 'prop-types';
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

  return (
    <div
      className={`home-wrapper ${isExiting ? 'page-fade-out' : 'page-fade-in'}`}
      ref={containerRef}
    >
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
            <button className="nav-link-btn" onClick={() => handleNavigate('topics')}>
              Laboratory
            </button>
            <button className="nav-link-btn" onClick={() => handleNavigate('integrators')}>
              Integrators
            </button>
            <button className="nav-link-btn" onClick={() => handleNavigate('docs')}>
              Docs
            </button>
          </div>
          <button className="nav-btn" onClick={() => handleNavigate('topics')}>
            Launch Lab
          </button>
        </nav>

        {/* Thin Grid Overlay */}
        <div className="grid-overlay"></div>
        <div className="horizontal-axis"></div>
        <div className="vertical-axis"></div>

        {/* Hero Content */}
        <main className="hero-content">
          <h1 className="hero-title">
            Visualize the physics
            <br />
            you learn in class.
          </h1>

          <p className="hero-sub">
            An interactive sandbox built for students. Tweak parameters in <br />
            real-time, plot data, and get an intuitive feel for complex <br />
            systems—from mechanics to quantum.
          </p>

          <button className="primary-btn" onClick={() => handleNavigate('topics')}>
            Enter Laboratory
          </button>

          <div className="discord-banner">
            <div className="discord-content">
              <svg
                className="discord-icon"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 127.14 96.36"
              >
                <path
                  fill="currentColor"
                  d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a67.55,67.55,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.31,60,73.31,53s5-12.74,11.43-12.74S96.2,46,96.09,53,91.04,65.69,84.69,65.69Z"
                />
              </svg>
              <div className="discord-text">
                <h3>Join Our Academic Community</h3>
                <p>Discuss physics, share research, and collaborate with peers.</p>
              </div>
              <a
                href="https://discord.gg/pbDm2rRECb"
                target="_blank"
                rel="noopener noreferrer"
                className="discord-btn"
              >
                Connect
              </a>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

Home.propTypes = {
  onNavigate: PropTypes.func.isRequired,
};
