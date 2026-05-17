import PropTypes from 'prop-types';
import {
  ArrowRight,
  BookOpen,
  FlaskConical,
  LineChart,
  MessageCircle,
  PlayCircle,
  Search,
  SlidersHorizontal,
} from 'lucide-react';
import './Home.css';

const DiscordIcon = ({ size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.79 0 0 0 5.993 3.03.078.077 0 0 0 .084-.028c.462-.63.862-1.297 1.197-1.99a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.863-.88.077.077 0 0 1-.008-.128c.125-.094.252-.192.372-.291a.074.073 0 0 1 .077-.01c3.927 1.793 8.18 1.793 12.062 0a.074.073 0 0 1 .078.01c.12.098.246.196.373.291a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.864.88.077.077 0 0 0-.041.106c.344.693.744 1.36 1.206 1.99a.078.077 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.182 0-2.156-1.085-2.156-2.419 0-1.333.955-2.419 2.156-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.419-2.157 2.419zm7.974 0c-1.182 0-2.156-1.085-2.156-2.419 0-1.333.955-2.419 2.156-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.419-2.157 2.419z" />
  </svg>
);

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
  const handleNavigate = (page) => {
    onNavigate(page);
  };

  return (
    <div className="home-wrapper">
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
          <div className="nav-actions">
            <a
              href="https://discord.gg/5Tt7uUbDBz"
              target="_blank"
              rel="noopener noreferrer"
              className="nav-btn discord-nav-btn"
            >
              <DiscordIcon size={16} />
              <span className="nav-btn-text">Join Our Discord!</span>
            </a>
            <button className="nav-btn" onClick={() => handleNavigate('topics')}>
              <FlaskConical size={16} />
              <span className="nav-btn-text">Open Lab</span>
            </button>
          </div>
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
