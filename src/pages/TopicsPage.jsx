import { useState } from 'react';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { TOPICS } from '../simulations/index';
import SimulationRunner from '../components/SimulationRunner';

export default function TopicsPage({ onBack }) {
  const [selectedSim, setSelectedSim] = useState(null);

  if (selectedSim) {
    return (
      <SimulationRunner
        key={selectedSim.id}
        sim={selectedSim}
        onBack={() => setSelectedSim(null)}
      />
    );
  }

  return (
    <div className="topics-page page-fade-in">
      {/* Header */}
      <div className="topics-header">
        <button className="topics-back-btn icon-btn" onClick={onBack}>
          <ArrowLeft size={16} />
        </button>
        <div style={{ flex: 1 }} />
        <span
          className="mobile-hide"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            color: 'var(--text-muted)',
            letterSpacing: '0.1em',
          }}
        >
          RESEARCH LAB
        </span>
      </div>

      {/* Track Container */}
      <div className="topics-track-container custom-scroll">
        {Object.entries(TOPICS).map(([key, topic]) => (
          <div key={key} className="topic-track">
            <h2 className="topic-track-title" style={{ fontFamily: 'var(--font-serif)' }}>
              {topic.label}
            </h2>
            <div className="topic-track-wrapper">
              <div className="topic-track-slider custom-scroll" id={`track-${key}`}>
                {topic.sims.map((sim) => (
                  <button key={sim.id} className="sim-card" onClick={() => setSelectedSim(sim)}>
                    {/* Preview area */}
                    <div className="sim-card-preview" style={{ background: sim.gradient }}>
                      <div
                        className="sim-card-preview-glow"
                        style={{ boxShadow: `0 0 60px 20px ${sim.accentColor}40` }}
                      />
                      <div className="sim-card-preview-icon" style={{ color: sim.accentColor }}>
                        {ICONS[sim.id] || ICONS['default']}
                      </div>
                    </div>

                    {/* Body */}
                    <div className="sim-card-body">
                      <div className="sim-card-title">{sim.title}</div>
                      <p className="sim-card-desc">{sim.description}</p>
                      <div className="sim-card-footer">
                        <div className="sim-card-tags">
                          {sim.tags.slice(0, 2).map((t) => (
                            <span key={t} className="sim-tag">
                              {t}
                            </span>
                          ))}
                        </div>
                        <ChevronRight size={16} style={{ color: sim.accentColor, flexShrink: 0 }} />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              <button
                className="track-scroll-btn right"
                onClick={() => {
                  document
                    .getElementById(`track-${key}`)
                    ?.scrollBy({ left: 680, behavior: 'smooth' });
                }}
              >
                <ChevronRight size={28} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// SVG preview icons per sim
const ICONS = {
  'double-pendulum': (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      <circle cx="32" cy="8" r="4" fill="currentColor" opacity="0.5" />
      <line x1="32" y1="8" x2="48" y2="32" stroke="currentColor" strokeWidth="2" opacity="0.6" />
      <circle cx="48" cy="32" r="5" fill="currentColor" opacity="0.8" />
      <line x1="48" y1="32" x2="24" y2="54" stroke="currentColor" strokeWidth="2" opacity="0.6" />
      <circle cx="24" cy="54" r="5" fill="currentColor" />
      <path
        d="M 24 54 Q 38 44 52 38 Q 44 26 36 20"
        stroke="currentColor"
        strokeWidth="1"
        fill="none"
        opacity="0.35"
      />
    </svg>
  ),
  'lorenz-attractor': (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      <path
        d="M 20 40 Q 10 25 20 20 Q 30 15 32 25 Q 34 35 44 20 Q 54 5 44 40 Q 38 50 32 35 Q 26 20 20 40"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        opacity="0.7"
      />
      <circle cx="20" cy="40" r="3" fill="currentColor" opacity="0.5" />
      <circle cx="44" cy="40" r="3" fill="currentColor" opacity="0.5" />
      <circle cx="32" cy="30" r="4" fill="currentColor" />
    </svg>
  ),
  'damped-oscillator': (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      <line x1="8" y1="32" x2="56" y2="32" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
      <path
        d="M 8 32 Q 12 12 18 32 Q 24 48 30 32 Q 36 20 42 32 Q 48 38 54 32"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        opacity="0.8"
      />
      <path
        d="M 8 32 Q 18 16 32 32 Q 46 42 56 32"
        stroke="currentColor"
        strokeWidth="1"
        fill="none"
        opacity="0.25"
        strokeDasharray="3 3"
      />
      <rect x="4" y="28" width="4" height="8" fill="currentColor" opacity="0.4" />
    </svg>
  ),
  'newtons-cradle': (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      <line x1="12" y1="4" x2="52" y2="4" stroke="currentColor" strokeWidth="2.5" opacity="0.5" />
      {[12, 22, 32, 42, 52].map((x, i) => (
        <g key={i}>
          <line
            x1={x}
            y1="4"
            x2={i === 0 ? x - 10 : x}
            y2={i === 0 ? 40 : 48}
            stroke="currentColor"
            strokeWidth="1.2"
            opacity="0.5"
          />
          <circle
            cx={i === 0 ? x - 10 : x}
            cy={i === 0 ? 46 : 54}
            r="5"
            fill="currentColor"
            opacity={i === 0 ? 1 : 0.55}
          />
        </g>
      ))}
    </svg>
  ),
  'orbital-gravity': (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      <ellipse
        cx="32"
        cy="32"
        rx="22"
        ry="10"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.3"
        fill="none"
      />
      <path
        d="M 10 32 Q 32 10 54 32 Q 32 54 10 32"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        opacity="0.5"
      />
      <circle cx="14" cy="28" r="5" fill="currentColor" opacity="0.9" />
      <circle cx="50" cy="36" r="5" fill="#60a5fa" opacity="0.9" />
      <circle cx="32" cy="48" r="5" fill="#4ade80" opacity="0.9" />
    </svg>
  ),
  'coupled-pendulums': (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      <circle cx="18" cy="10" r="3.5" fill="currentColor" opacity="0.65" />
      <circle cx="46" cy="10" r="3.5" fill="currentColor" opacity="0.65" />
      <line x1="18" y1="10" x2="20" y2="38" stroke="currentColor" strokeWidth="2" opacity="0.7" />
      <line x1="46" y1="10" x2="44" y2="38" stroke="currentColor" strokeWidth="2" opacity="0.7" />
      <circle cx="20" cy="42" r="6" fill="currentColor" opacity="0.95" />
      <circle cx="44" cy="42" r="6" fill="#4ade80" opacity="0.95" />
      <path d="M 26 42 Q 32 34 38 42" stroke="#a78bfa" strokeWidth="2" fill="none" opacity="0.8" />
    </svg>
  ),
  'tuned-mass-damper': (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      <rect x="8" y="44" width="48" height="4" rx="1" fill="currentColor" opacity="0.35" />
      <rect x="18" y="26" width="20" height="16" rx="2" fill="currentColor" opacity="0.9" />
      <rect x="40" y="20" width="12" height="10" rx="2" fill="#4ade80" opacity="0.95" />
      <path d="M 8 34 H 18" stroke="currentColor" strokeWidth="2" opacity="0.7" />
      <path d="M 38 34 H 40" stroke="currentColor" strokeWidth="2" opacity="0.7" />
      <path d="M 50 25 Q 56 25 58 30" stroke="#4ade80" strokeWidth="2" fill="none" opacity="0.7" />
    </svg>
  ),
  'spring-pendulum': (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      <circle cx="32" cy="10" r="4" fill="currentColor" opacity="0.6" />
      <path
        d="M 32 10 L 36 18 L 28 26 L 36 34 L 28 42 L 32 50"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        opacity="0.8"
      />
      <circle cx="32" cy="54" r="6" fill="#60a5fa" />
    </svg>
  ),
  'simple-pendulum': (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      <circle cx="32" cy="10" r="4" fill="currentColor" opacity="0.6" />
      <line x1="32" y1="10" x2="48" y2="38" stroke="currentColor" strokeWidth="2.5" opacity="0.8" />
      <circle cx="48" cy="38" r="7" fill="#fb7185" />
      <path
        d="M 16 38 Q 32 46 48 38"
        stroke="currentColor"
        strokeWidth="1"
        strokeDasharray="3 3"
        opacity="0.4"
      />
    </svg>
  ),
  'work-energy-lab': (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      <path d="M 8 48 L 56 32" stroke="currentColor" strokeWidth="3" opacity="0.5" />
      <rect x="24" y="28" width="12" height="12" transform="rotate(-15 30 34)" fill="#4ade80" />
      <path
        d="M 36 32 L 50 28 L 46 24 M 50 28 L 46 32"
        stroke="#fb7185"
        strokeWidth="2"
        fill="none"
      />
      <rect x="8" y="52" width="20" height="4" fill="#60a5fa" opacity="0.8" />
      <rect x="8" y="58" width="12" height="4" fill="#f97316" opacity="0.8" />
    </svg>
  ),
  'coriolis-effect': (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      <circle
        cx="32"
        cy="32"
        r="28"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.3"
        fill="none"
      />
      <path d="M 32 32 L 32 10" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
      <path d="M 32 32 Q 45 32 50 20" stroke="#fb7185" strokeWidth="2" fill="none" />
      <circle cx="50" cy="20" r="4" fill="#fb7185" />
      <path
        d="M 40 10 Q 50 10 54 20"
        stroke="currentColor"
        strokeWidth="1"
        strokeDasharray="2 2"
        opacity="0.4"
      />
    </svg>
  ),
  'maxwell-waves': (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      <path d="M 8 32 L 56 32" stroke="currentColor" strokeWidth="1" opacity="0.3" />
      <path d="M 8 32 Q 20 12 32 32 Q 44 52 56 32" stroke="#60a5fa" strokeWidth="2" fill="none" />
      <path
        d="M 8 32 Q 20 42 32 32 Q 44 22 56 32"
        stroke="#4ade80"
        strokeWidth="1.5"
        fill="none"
        opacity="0.7"
      />
      <line x1="32" y1="20" x2="32" y2="44" stroke="currentColor" strokeWidth="1" opacity="0.2" />
    </svg>
  ),
  'atwoods-machine': (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      <line x1="32" y1="4" x2="32" y2="16" stroke="currentColor" strokeWidth="2" opacity="0.5" />
      <circle
        cx="32"
        cy="18"
        r="6"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        opacity="0.8"
      />
      <line x1="26" y1="18" x2="26" y2="36" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
      <line x1="38" y1="18" x2="38" y2="48" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
      <rect x="22" y="36" width="8" height="8" rx="1" fill="#fde047" />
      <rect x="33" y="48" width="10" height="10" rx="1" fill="#fde047" />
    </svg>
  ),
  'projectile-motion': (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      <path
        d="M 8 56 Q 32 16 56 56"
        stroke="currentColor"
        strokeWidth="2"
        strokeDasharray="4 4"
        fill="none"
        opacity="0.5"
      />
      <circle cx="32" cy="26" r="5" fill="#fb7185" />
      <path
        d="M 32 26 L 46 26 L 42 22 M 46 26 L 42 30"
        stroke="#fb7185"
        strokeWidth="2"
        fill="none"
      />
    </svg>
  ),
  'sph-fluid': (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      {[
        [14, 44],
        [22, 36],
        [30, 44],
        [38, 36],
        [46, 44],
        [18, 28],
        [34, 28],
        [26, 52],
        [42, 52],
        [10, 52],
        [54, 52],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={3.5} fill="currentColor" opacity={0.5 + i * 0.04} />
      ))}
      <path
        d="M 6 56 Q 32 48 58 56"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        opacity="0.4"
      />
    </svg>
  ),
  'wave-pool': (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      {[0, 1, 2, 3].map((i) => (
        <ellipse
          key={i}
          cx="32"
          cy="32"
          rx={6 + i * 9}
          ry={3 + i * 4}
          stroke="currentColor"
          strokeWidth="1.2"
          fill="none"
          opacity={1 - i * 0.22}
        />
      ))}
      <circle cx="32" cy="32" r="3" fill="currentColor" />
    </svg>
  ),
  'electric-charges': (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      <path
        d="M 22 32 Q 32 16 42 32"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        opacity="0.4"
      />
      <path
        d="M 22 32 Q 32 48 42 32"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        opacity="0.4"
      />
      <path
        d="M 22 32 Q 32 32 42 32"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        opacity="0.4"
      />
      <circle cx="20" cy="32" r="6" fill="#FF6B6B" />
      <circle cx="44" cy="32" r="6" fill="#3b82f6" />
      <line x1="18" y1="32" x2="22" y2="32" stroke="#fff" strokeWidth="2" />
      <line x1="20" y1="30" x2="20" y2="34" stroke="#fff" strokeWidth="2" />
      <line x1="42" y1="32" x2="46" y2="32" stroke="#fff" strokeWidth="2" />
    </svg>
  ),
  'electrostatic-fields': (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      {/* Background vector arrows */}
      {[20, 32, 44].map((y, i) =>
        [16, 32, 48].map((x, j) => (
          <path
            key={`${i}-${j}`}
            d={`M ${x - 3} ${y + 3} L ${x + 3} ${y - 3} M ${x} ${y - 4} L ${x + 4} ${y - 4} L ${x + 4} ${y}`}
            stroke="currentColor"
            strokeWidth="1"
            opacity="0.3"
            fill="none"
          />
        )),
      )}
      <circle
        cx="32"
        cy="32"
        r="16"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.8"
        fill="none"
      />
      <circle cx="32" cy="32" r="4" fill="currentColor" opacity="0.8" />
    </svg>
  ),
  'particle-in-box': (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      <rect
        x="8"
        y="10"
        width="48"
        height="44"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        opacity="0.4"
      />
      <path
        d="M 12 50 Q 20 20 32 50 Q 44 20 52 50"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        opacity="0.8"
      />
      <path
        d="M 12 50 Q 20 35 32 50 Q 44 35 52 50"
        stroke="currentColor"
        strokeWidth="1"
        fill="none"
        opacity="0.3"
        strokeDasharray="3 3"
      />
      <line x1="8" y1="50" x2="56" y2="50" stroke="currentColor" strokeWidth="1" opacity="0.3" />
    </svg>
  ),
  'quantum-harmonic-oscillator': (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      <path
        d="M 8 54 Q 16 50 24 42 Q 32 28 40 42 Q 48 50 56 54"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        opacity="0.3"
      />
      <path
        d="M 14 48 Q 22 30 32 20 Q 42 30 50 48"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        opacity="0.7"
      />
      <circle cx="32" cy="20" r="4" fill="currentColor" opacity="0.9" />
      <circle cx="22" cy="34" r="3" fill="currentColor" opacity="0.5" />
      <circle cx="42" cy="34" r="3" fill="currentColor" opacity="0.5" />
      {[20, 28, 36, 44].map((y, i) => (
        <line
          key={i}
          x1="16"
          x2="48"
          y1={y}
          y2={y}
          stroke="currentColor"
          strokeWidth="0.5"
          opacity="0.2"
        />
      ))}
    </svg>
  ),
  'double-slit': (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      <circle cx="10" cy="32" r="4" fill="currentColor" opacity="0.7" />
      <line x1="14" y1="32" x2="28" y2="26" stroke="currentColor" strokeWidth="1" opacity="0.4" />
      <line x1="14" y1="32" x2="28" y2="38" stroke="currentColor" strokeWidth="1" opacity="0.4" />
      <rect x="28" y="10" width="3" height="13" fill="currentColor" opacity="0.3" />
      <rect x="28" y="29" width="3" height="6" fill="currentColor" opacity="0.3" />
      <rect x="28" y="41" width="3" height="13" fill="currentColor" opacity="0.3" />
      {[20, 26, 32, 38, 44].map((y, i) => (
        <circle
          key={i}
          cx="52"
          cy={y}
          r={i === 2 ? 3 : i % 2 === 0 ? 2 : 1.5}
          fill="currentColor"
          opacity={i === 2 ? 0.9 : 0.4}
        />
      ))}
      <line x1="50" y1="10" x2="50" y2="54" stroke="currentColor" strokeWidth="1" opacity="0.15" />
    </svg>
  ),
  'hydrogen-orbitals': (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      <ellipse
        cx="32"
        cy="32"
        rx="20"
        ry="8"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.4"
        transform="rotate(30 32 32)"
      />
      <ellipse
        cx="32"
        cy="32"
        rx="20"
        ry="8"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.4"
        transform="rotate(-30 32 32)"
      />
      <ellipse
        cx="32"
        cy="32"
        rx="20"
        ry="8"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.4"
        transform="rotate(90 32 32)"
      />
      <circle cx="32" cy="32" r="5" fill="currentColor" opacity="0.9" />
      <circle cx="49" cy="42" r="2" fill="currentColor" opacity="0.6" />
      <circle cx="15" cy="22" r="2" fill="currentColor" opacity="0.6" />
      <circle cx="32" cy="12" r="2" fill="currentColor" opacity="0.6" />
    </svg>
  ),
  'ray-optics': (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      <line x1="6" y1="32" x2="58" y2="32" stroke="currentColor" strokeWidth="1" opacity="0.3" />
      <path
        d="M 31 8 C 40 20 40 44 31 56 C 24 44 24 20 31 8 Z"
        fill="currentColor"
        opacity="0.16"
      />
      <path
        d="M 31 8 C 40 20 40 44 31 56 C 24 44 24 20 31 8 Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path d="M 6 20 L 31 28 L 58 12" stroke="#fde047" strokeWidth="1.6" opacity="0.9" />
      <path d="M 6 32 L 31 32 L 58 32" stroke="#fde047" strokeWidth="1.6" opacity="0.75" />
      <path d="M 6 44 L 31 36 L 58 52" stroke="#fde047" strokeWidth="1.6" opacity="0.9" />
      <line x1="46" y1="18" x2="46" y2="46" stroke="#4ade80" strokeWidth="2" opacity="0.8" />
      <path d="M 46 18 L 41 27 L 51 27 Z" fill="#4ade80" opacity="0.8" />
    </svg>
  ),
  'buoyancy-lab': (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      <rect
        x="12"
        y="16"
        width="40"
        height="38"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.4"
        fill="none"
      />
      <rect x="12" y="30" width="40" height="24" rx="0" fill="currentColor" opacity="0.15" />
      <line x1="12" y1="30" x2="52" y2="30" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
      <rect x="22" y="24" width="12" height="10" rx="2" fill="currentColor" opacity="0.8" />
      <rect x="38" y="32" width="8" height="8" rx="2" fill="currentColor" opacity="0.5" />
      <path
        d="M 28 44 L 28 38 M 24 38 L 32 38"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.5"
      />
      <path d="M 28 44 L 28 50 M 24 50 L 32 50" stroke="#60a5fa" strokeWidth="1.5" opacity="0.7" />
    </svg>
  ),
  'wind-tunnel': (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      <line x1="4" y1="16" x2="60" y2="16" stroke="currentColor" strokeWidth="1.5" opacity="0.3" />
      <line x1="4" y1="48" x2="60" y2="48" stroke="currentColor" strokeWidth="1.5" opacity="0.3" />
      <circle cx="28" cy="32" r="8" fill="currentColor" opacity="0.7" />
      {[22, 27, 32, 37, 42].map((y, i) => (
        <path
          key={i}
          d={`M 8 ${y} L 18 ${y}`}
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.4"
        />
      ))}
      <path d="M 38 32 Q 44 26 52 28" stroke="currentColor" strokeWidth="1" opacity="0.5" />
      <path d="M 38 32 Q 44 38 52 36" stroke="currentColor" strokeWidth="1" opacity="0.5" />
      <path d="M 38 30 Q 48 30 56 32" stroke="currentColor" strokeWidth="1" opacity="0.3" />
      <path d="M 38 34 Q 48 34 56 32" stroke="currentColor" strokeWidth="1" opacity="0.3" />
    </svg>
  ),
  default: (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      <circle
        cx="32"
        cy="32"
        r="16"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        opacity="0.5"
      />
      <circle cx="32" cy="32" r="4" fill="currentColor" />
    </svg>
  ),
};
