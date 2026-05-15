import PropTypes from 'prop-types';
import { useRef, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  FlaskConical,
  LineChart,
  PlayCircle,
  Search,
  SlidersHorizontal,
} from 'lucide-react';
import './Home.css';

const HOME_TOPICS = [
  { key: 'mechanics', label: 'Mechanics', count: 16 },
  { key: 'fluid', label: 'Fluid Dynamics', count: 3 },
  { key: 'electromagnetism', label: 'Electromagnetism', count: 5 },
  { key: 'optics', label: 'Optics', count: 2 },
  { key: 'quantum', label: 'Quantum Mechanics', count: 3 },
  { key: 'thermodynamics', label: 'Thermodynamics', count: 1 },
];

const simulationCount = HOME_TOPICS.reduce((sum, topic) => sum + topic.count, 0);
const topicCount = HOME_TOPICS.length;

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
      <nav className="home-nav" aria-label="Primary navigation">
        <div className="home-nav-inner">
          <button className="nav-brand" onClick={() => handleNavigate('home')}>
            <img src="/favicon.svg" alt="Physics Lab" className="logo-mark-img" />
            <span className="logo-text">Physics Lab</span>
          </button>
          <div className="nav-links">
            <button className="nav-link-btn" onClick={() => handleNavigate('integrators')}>
              Integrators
            </button>
            <button className="nav-link-btn" onClick={() => handleNavigate('docs')}>
              Docs
            </button>
          </div>
          <button className="nav-btn" onClick={() => handleNavigate('topics')}>
            <FlaskConical size={16} />
            Open Lab
          </button>
        </div>
      </nav>

      <main>
        <section className="hero-section">
          <div className="hero-content">
            <h1 className="hero-title">Physics Lab</h1>

            <p className="hero-sub">
              Explore mechanics, fields, fluids, optics, thermodynamics, and quantum systems with
              interactive simulations, live graphs, guided experiments, and exportable data.
            </p>

            <div className="hero-actions">
              <button className="primary-btn" onClick={() => handleNavigate('topics')}>
                Browse simulations
                <ArrowRight size={17} />
              </button>
              <button className="secondary-btn" onClick={() => handleNavigate('docs')}>
                <BookOpen size={17} />
                View concepts
              </button>
            </div>

            <button className="hero-search" onClick={() => handleNavigate('topics')}>
              <Search size={18} />
              <span>Search simulations by topic, model, or method</span>
              <kbd>{simulationCount} sims</kbd>
            </button>
          </div>
        </section>

        <section className="home-library" aria-label="Simulation library summary">
          <div className="library-stat">
            <strong>{simulationCount}</strong>
            <span>interactive simulations</span>
          </div>
          <div className="library-stat accent-orange">
            <strong>{topicCount}</strong>
            <span>physics domains</span>
          </div>
          <div className="library-stat accent-green">
            <strong>Live</strong>
            <span>controls, graphs, equations, exports</span>
          </div>
        </section>

        <section className="home-workflow" aria-label="How the lab works">
          <div className="workflow-step">
            <span className="workflow-icon">
              <FlaskConical size={22} />
            </span>
            <strong>Choose a system</strong>
            <p>
              Open a curated simulation from mechanics, fluids, fields, optics, or quantum topics.
            </p>
          </div>
          <div className="workflow-step">
            <span className="workflow-icon orange">
              <SlidersHorizontal size={22} />
            </span>
            <strong>Adjust inputs</strong>
            <p>
              Change gravity, mass, damping, charge, wavelength, pressure, or solver-specific
              values.
            </p>
          </div>
          <div className="workflow-step">
            <span className="workflow-icon green">
              <LineChart size={22} />
            </span>
            <strong>Compare results</strong>
            <p>
              Read the canvas, graph panel, equations, guided experiments, CSV data, and recordings.
            </p>
          </div>
        </section>

        <section className="subject-band" aria-label="Physics domains">
          {HOME_TOPICS.map((topic) => (
            <button
              key={topic.key}
              className="subject-pill"
              onClick={() => handleNavigate('topics')}
            >
              <PlayCircle size={16} />
              <span>{topic.label}</span>
              <strong>{topic.count}</strong>
            </button>
          ))}
        </section>
      </main>
    </div>
  );
}

Home.propTypes = {
  onNavigate: PropTypes.func.isRequired,
};
