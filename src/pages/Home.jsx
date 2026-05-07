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
        <nav className="glass-nav">
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
            Launch Lab
          </button>
        </nav>

        <main className="hero-content">
          <h1 className="hero-title">Physics simulations for focused classroom work.</h1>

          <p className="hero-sub">
            Run experiments, adjust parameters, inspect graphs, and export data from a clean lab
            interface built around the simulation instead of decoration.
          </p>

          <button className="primary-btn" onClick={() => handleNavigate('topics')}>
            Enter Laboratory
          </button>

          <div className="home-workflow">
            <div>
              <span>01</span>
              <strong>Pick a model</strong>
              <p>Mechanics, fluids, fields, optics, and quantum demos live in one catalog.</p>
            </div>
            <div>
              <span>02</span>
              <strong>Adjust inputs</strong>
              <p>Use stable controls for speed, mass, forces, solver settings, and environment.</p>
            </div>
            <div>
              <span>03</span>
              <strong>Inspect results</strong>
              <p>Watch the canvas, read live values, graph variables, and export data.</p>
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
