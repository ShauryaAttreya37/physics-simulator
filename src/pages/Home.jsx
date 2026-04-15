import { FlaskConical, Waves } from 'lucide-react';

export default function Home({ onSimulations }) {
  return (
    <div className="home-page page-fade-in">
      {/* Hero */}
      <header className="home-hero">
        <div className="home-hero-brand" />
        <h1 className="home-hero-title" style={{ fontFamily: 'var(--font-serif)' }}>
          PHYSICS<span>SIMULATOR</span>
        </h1>
        <p className="home-hero-sub">
          Research-grade physics simulations — adaptive integrators, symplectic methods, and publication-quality visualization.
        </p>
        <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
          <span className="method-badge rk45">RK45</span>
          <span className="method-badge symplectic">Yoshida⁴</span>
          <span className="method-badge fdm">FDM</span>
        </div>
      </header>

      {/* Three main cards */}
      <main className="home-cards">


        <button className="home-card home-card--sims" onClick={onSimulations}>
          <div className="home-card-bg" />
          <div className="home-card-content">
            <div className="home-card-icon">
              <FlaskConical size={28} />
            </div>
            <h2 className="home-card-title">Simulations</h2>
            <p className="home-card-desc">
              Research-grade simulations with adaptive integrators, energy conservation tracking, and Makie-inspired visualization.
            </p>
            <ul className="home-card-features">
              <li>Lorenz Attractor &amp; Chaos Theory</li>
              <li>Symplectic N-Body Gravity</li>
              <li>Phase Space &amp; Publication Graphs</li>
            </ul>
          </div>
          <div className="home-card-arrow">Explore →</div>
        </button>
      </main>

      <footer className="home-footer" style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>
        Powered by RK45 Adaptive · Yoshida⁴ Symplectic · Custom Physics Engines
      </footer>
    </div>
  );
}
