import PropTypes from 'prop-types';
import { useRef, useState } from 'react';
import './Home.css';

export default function Home({ onNavigate }) {
  const containerRef = useRef(null);
  const [isExiting, setIsExiting] = useState(false);

  const handleNavigate = (page) => {
    setIsExiting(true);
    setTimeout(() => onNavigate(page), 180);
  };

  return (
    <div
      className={`home-wrapper ${isExiting ? 'page-fade-out' : 'page-fade-in'}`}
      ref={containerRef}
    >
      <div className="home-container">
        <nav className="home-nav">
          <div className="nav-brand">
            <img src="/favicon.svg" alt="Physics Simulator" className="logo-mark-img" />
            <span className="logo-text">Physics Simulator</span>
          </div>
          <div className="nav-links">
            <button className="nav-link-btn" onClick={() => handleNavigate('integrators')}>
              Integrators
            </button>
            <button className="nav-link-btn" onClick={() => handleNavigate('docs')}>
              Docs
            </button>
          </div>
          <button className="nav-btn" onClick={() => handleNavigate('topics')}>
            Lab
          </button>
        </nav>

        <main className="hero-content">
          <h1 className="hero-title">Interactive physics engine.</h1>

          <p className="hero-sub">
            Choose a model, change the inputs, watch the motion, and compare the data in a simple
            workspace.
          </p>

          <button className="primary-btn" onClick={() => handleNavigate('topics')}>
            Open Lab
          </button>

          <div className="home-workflow">
            <div>
              <span>01</span>
              <strong>Choose a system</strong>
              <p>Open a mechanics, fluid, field, optics, or quantum simulation.</p>
            </div>
            <div>
              <span>02</span>
              <strong>Adjust inputs</strong>
              <p>Change mass, force, damping, gravity, and other model values.</p>
            </div>
            <div>
              <span>03</span>
              <strong>Inspect results</strong>
              <p>Use the canvas, live readout, graph panel, and CSV export.</p>
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
