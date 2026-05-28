import { useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import PropTypes from 'prop-types';
import { SIM_BY_ID, TOPICS } from '../simulations/index';
import SimulationRunner from '../components/SimulationRunner';
import { useDiscordActivity } from '../hooks/useDiscordActivity';
import './ActivityPage.css';

// ---------------------------------------------------------------------------
// Loading / error screens
// ---------------------------------------------------------------------------

function ActivityLoading() {
  return (
    <div className="activity-overlay">
      <div className="activity-spinner" />
      <p className="activity-overlay-text">Connecting to Discord...</p>
    </div>
  );
}

function ActivityError({ error }) {
  return (
    <div className="activity-overlay">
      <div className="activity-error-icon">!</div>
      <h2 className="activity-overlay-heading">Failed to connect</h2>
      <p className="activity-overlay-text">{error}</p>
    </div>
  );
}

ActivityError.propTypes = { error: PropTypes.string.isRequired };

// ---------------------------------------------------------------------------
// Simulation selector
// ---------------------------------------------------------------------------

function ActivitySelector({ onSelect }) {
  const [query, setQuery] = useState('');
  const [activeTopic, setActiveTopic] = useState('all');

  const allSims = useMemo(() => Object.values(TOPICS).flatMap((topic) => topic.sims), []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return Object.entries(TOPICS)
      .filter(([key]) => activeTopic === 'all' || activeTopic === key)
      .flatMap(([, topic]) =>
        topic.sims
          .filter((sim) => {
            if (!q) return true;
            return [sim.title, sim.description, topic.label, ...sim.tags]
              .join(' ')
              .toLowerCase()
              .includes(q);
          })
          .map((sim) => ({ ...sim, topicLabel: topic.label })),
      );
  }, [query, activeTopic]);

  return (
    <div className="activity-page">
      {/* Header */}
      <header className="activity-header">
        <img src="/logo-mark.svg" alt="Physiverse" className="activity-logo" />
        <span className="activity-site-name">Physiverse</span>
        <span className="activity-sim-count">{allSims.length} simulations</span>
      </header>

      {/* Search + topic filters */}
      <div className="activity-toolbar">
        <label className="activity-search">
          <Search size={13} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title, tag, or method..."
          />
        </label>

        <div className="activity-filters" role="toolbar" aria-label="Filter by topic">
          <button
            className={`activity-filter-btn${activeTopic === 'all' ? ' active' : ''}`}
            onClick={() => setActiveTopic('all')}
          >
            All <span className="activity-filter-count">{allSims.length}</span>
          </button>
          {Object.entries(TOPICS).map(([key, topic]) => (
            <button
              key={key}
              className={`activity-filter-btn${activeTopic === key ? ' active' : ''}`}
              onClick={() => setActiveTopic(key)}
            >
              {topic.label} <span className="activity-filter-count">{topic.sims.length}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Simulation grid */}
      <div className="activity-grid custom-scroll">
        {filtered.length === 0 && (
          <p className="activity-empty">No simulations match &ldquo;{query}&rdquo;</p>
        )}
        {filtered.map((sim) => (
          <button key={sim.id} className="activity-card" onClick={() => onSelect(sim.id)}>
            <div className="activity-card-topic">{sim.topicLabel}</div>
            <div className="activity-card-title">{sim.title}</div>
            <p className="activity-card-desc">{sim.description}</p>
            <div className="activity-card-footer">
              <div className="activity-card-tags">
                {sim.tags.slice(0, 2).map((t) => (
                  <span key={t} className="sim-tag">
                    {t}
                  </span>
                ))}
              </div>
              <span className="sim-method">{sim.method}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

ActivitySelector.propTypes = { onSelect: PropTypes.func.isRequired };

// ---------------------------------------------------------------------------
// Route entry point
// ---------------------------------------------------------------------------

export default function ActivityPage() {
  const { simId } = useParams();
  const navigate = useNavigate();
  const { status, error } = useDiscordActivity();

  if (status === 'loading') return <ActivityLoading />;
  if (status === 'error') return <ActivityError error={error} />;

  // Sim selected — hand off to the existing SimulationRunner unchanged.
  if (simId) {
    const sim = SIM_BY_ID[simId];
    if (!sim) return <Navigate to="/activity" replace />;
    return (
      <div className="activity-runner-wrap">
        <SimulationRunner key={sim.id} sim={sim} onBack={() => navigate('/activity')} />
      </div>
    );
  }

  return <ActivitySelector onSelect={(id) => navigate(`/activity/${id}`)} />;
}
