import { ArrowLeft } from 'lucide-react';
import { BlockMath, InlineMath } from '../components/KaTeX';

export default function IntegratorsPage({ onBack }) {
  return (
    <div className="home-wrapper" style={{ overflowY: 'auto' }}>
      <div className="home-container" style={{ padding: '2.5rem 4rem', height: 'auto', minHeight: 'calc(100vh - 5rem)', alignItems: 'flex-start', justifyContent: 'flex-start', overflowY: 'auto' }}>
        <button className="nav-btn" onClick={onBack} style={{ marginBottom: '2rem' }}>
          <ArrowLeft size={16} /> Back
        </button>
        
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '3.5rem', marginBottom: '1rem', color: '#fff', letterSpacing: '-0.02em' }}>
          Integrators & Numeric Methods
        </h1>
        <p style={{ fontSize: '1.15rem', color: 'rgba(255,255,255,0.7)', maxWidth: '800px', lineHeight: '1.6' }}>
          Physics Simulator utilizes high-fidelity numeric integrators to solve ordinary differential equations (ODEs), prioritizing exact energy conservation and phase space accuracy for complex multi-body limits.
        </p>
        
        <div style={{ marginTop: '3.5rem', width: '100%', maxWidth: '850px' }}>
          <h2 style={{ fontFamily: 'Montserrat, sans-serif', color: '#fff', marginBottom: '1.5rem', fontSize: '1.75rem', fontWeight: 600 }}>
            1. Yoshida 4th-Order Symplectic
          </h2>
          <p style={{ color: '#a1a1aa', lineHeight: '1.7', fontSize: '1.05rem' }}>
            Symplectic integrators are essential for Hamiltonian systems governing orbital and classical mechanics. Unlike standard Runge-Kutta methods, they perfectly preserve the symplectic form of phase space, preventing long-term physical energy drift.
          </p>
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '2rem', borderRadius: '16px', margin: '2rem 0', border: '1px solid rgba(255,255,255,0.05)', boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.2)' }}>
            <BlockMath math={String.raw`\begin{aligned} x_{i} &= x_{i-1} + c_i v_{i-1} \Delta t \\ v_i &= v_{i-1} + d_i a(x_i) \Delta t \end{aligned}`} />
          </div>
          <p style={{ color: '#a1a1aa', lineHeight: '1.7', fontSize: '1.05rem' }}>
            Where coefficients <InlineMath math="c_i" /> and <InlineMath math="d_i" /> are exact algorithmic weights optimizing geometric precision, for example:
            <br/><br/>
            <InlineMath math={String.raw`w_1 = \frac{1}{2 - 2^{1/3}} \quad\text{and}\quad w_0 = 1 - 2w_1`} />
          </p>
        </div>

        <div style={{ marginTop: '4rem', width: '100%', maxWidth: '850px', paddingBottom: '4rem' }}>
          <h2 style={{ fontFamily: 'Montserrat, sans-serif', color: '#fff', marginBottom: '1.5rem', fontSize: '1.75rem', fontWeight: 600 }}>
            2. Adaptive Runge-Kutta (RK45)
          </h2>
          <p style={{ color: '#a1a1aa', lineHeight: '1.7', fontSize: '1.05rem' }}>
            For highly chaotic systems such as the Lorenz Attractor or Double Pendulum, the Dormand-Prince (RK45) technique adapts its integration time-step <InlineMath math={String.raw`\Delta t`} /> continuously based on internal truncation error estimates.
          </p>
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '2rem', borderRadius: '16px', margin: '2rem 0', border: '1px solid rgba(255,255,255,0.05)', boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.2)' }}>
            <BlockMath math={String.raw`y_{n+1} = y_n + \Delta t \sum_{i=1}^{s} b_i k_i`} />
            <br/>
            <BlockMath math={String.raw`k_i = f\left(t_n + c_i \Delta t, y_n + \Delta t \sum_{j=1}^{i-1} a_{ij} k_j\right)`} />
          </div>
        </div>
      </div>
    </div>
  );
}
