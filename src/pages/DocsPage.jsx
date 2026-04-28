import { ArrowLeft } from 'lucide-react';
import { BlockMath, InlineMath } from 'react-katex';

export default function DocsPage({ onBack }) {
  return (
    <div className="home-wrapper" style={{ overflowY: 'auto' }}>
      <div className="home-container" style={{ padding: '2.5rem 4rem', height: 'auto', minHeight: 'calc(100vh - 5rem)', alignItems: 'flex-start', justifyContent: 'flex-start', overflowY: 'auto' }}>
        <button className="nav-btn" onClick={onBack} style={{ marginBottom: '2rem' }}>
          <ArrowLeft size={16} /> Back
        </button>
        
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '3.5rem', marginBottom: '1rem', color: '#fff', letterSpacing: '-0.02em' }}>
          Physics Engine Documentation
        </h1>
        <p style={{ fontSize: '1.25rem', color: 'rgba(255,255,255,0.7)', maxWidth: '900px', lineHeight: '1.7' }}>
          The computational core leverages deeply intertwined algebraic integrators to project WebGL limits and abstract math models accurately in real-time. This documentation breaks down our fundamental constraints.
        </p>

        {/* Section 1: Hamiltonian */}
        <div style={{ marginTop: '4rem', width: '100%', maxWidth: '900px' }}>
          <h2 style={{ fontFamily: 'Montserrat, sans-serif', color: '#fff', marginBottom: '1.5rem', fontSize: '2rem', fontWeight: 600 }}>
            Classical Dynamics: Hamiltonian Mechanics
          </h2>
          <p style={{ color: '#a1a1aa', lineHeight: '1.7', fontSize: '1.1rem' }}>
            Within the rigid body simulators (cradle, pendulum loops) and multi-body gravitation networks, exact energy preservation is achieved by tracking the continuous Hamiltonian invariant system states computed at every simulation tick:
          </p>
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '2.5rem', borderRadius: '16px', margin: '2rem 0', border: '1px solid rgba(255,255,255,0.05)', boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.2)' }}>
            <BlockMath math="\mathcal{H}(\mathbf{q}, \mathbf{p}) = \sum_{i=1}^{N} \frac{\left| \mathbf{p}_i \right|^2}{2m_i} + \sum_{i<j}^{N} \mathcal{V}(|\mathbf{q}_i - \mathbf{q}_j|)" />
          </div>
          <p style={{ color: '#a1a1aa', lineHeight: '1.7', fontSize: '1.1rem' }}>
            Where <InlineMath math="\mathcal{H}" /> maps to the absolute conserved magnitude. If the variance <InlineMath math="\frac{\partial \mathcal{H}}{\partial t}" /> steps away from <InlineMath math="0" /> by floating-point error, the Yoshida symplectic back-corrects to true geometric orbit constraints.
          </p>
        </div>
        
        {/* Section 2: Quantum States */}
        <div style={{ marginTop: '5rem', width: '100%', maxWidth: '900px' }}>
          <h2 style={{ fontFamily: 'Montserrat, sans-serif', color: '#fff', marginBottom: '1.5rem', fontSize: '2rem', fontWeight: 600 }}>
            Quantum Simulators: Wave Mechanics & Probabilities
          </h2>
          <p style={{ color: '#a1a1aa', lineHeight: '1.7', fontSize: '1.1rem' }}>
            Our quantum modules—such as the Particle in a Box, Double Slit diffraction setup, and Harmonic Oscillators—utilize explicit Finite Difference Time Domain methods (FDTD) mapping deterministic continuous functions into array space.
          </p>
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '2.5rem', borderRadius: '16px', margin: '2rem 0', border: '1px solid rgba(255,255,255,0.05)', boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.2)' }}>
            <BlockMath math="i\hbar \frac{\partial}{\partial t}\Psi(\mathbf{r},t) = \left[ -\frac{\hbar^2}{2m} \nabla^2 + V(\mathbf{r}, t) \right] \Psi(\mathbf{r},t)" />
          </div>
          <p style={{ color: '#a1a1aa', lineHeight: '1.7', fontSize: '1.1rem' }}>
            This temporal derivation allows canvas pixels to accurately depict probability densities mapped mathematically through <InlineMath math="\rho = |\Psi(\mathbf{r}, t)|^2" />, which dynamically glow dependent on amplitude phase bounds.
          </p>
        </div>

        {/* Section 3: Navier-Stokes */}
        <div style={{ marginTop: '5rem', width: '100%', maxWidth: '900px' }}>
          <h2 style={{ fontFamily: 'Montserrat, sans-serif', color: '#fff', marginBottom: '1.5rem', fontSize: '2rem', fontWeight: 600 }}>
            Fluid Dynamics: Smoothed Particle Hydrodynamics
          </h2>
          <p style={{ color: '#a1a1aa', lineHeight: '1.7', fontSize: '1.1rem' }}>
            The SPH fluid lab and buoyancy simulator implement particle approximations of the incompressible Navier-Stokes distributions. Continuous spatial functions are sampled at discrete particle coordinates leveraging a smoothing kernel <InlineMath math="W" />.
          </p>
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '2.5rem', borderRadius: '16px', margin: '2rem 0', border: '1px solid rgba(255,255,255,0.05)', boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.2)' }}>
            <BlockMath math="\rho_i = \sum_{j} m_j W(\mathbf{r}_i - \mathbf{r}_j, h)" />
            <br/>
            <BlockMath math="\frac{d\mathbf{v}_i}{dt} = -\sum_{j} m_j \left( \frac{P_i}{\rho_i^2} + \frac{P_j}{\rho_j^2} \right) \nabla W_{ij} + \nu \nabla^2 \mathbf{v} + \mathbf{g}" />
          </div>
          <p style={{ color: '#a1a1aa', lineHeight: '1.7', fontSize: '1.1rem' }}>
            With the kernel radius <InlineMath math="h" /> defined tightly around neighboring thresholds, creating viscosity gradients handling both surface waves and turbulent currents simultaneously.
          </p>
        </div>

        {/* Section 4: Maxwell Electromagnetics */}
        <div style={{ marginTop: '5rem', width: '100%', maxWidth: '900px', paddingBottom: '6rem' }}>
          <h2 style={{ fontFamily: 'Montserrat, sans-serif', color: '#fff', marginBottom: '1.5rem', fontSize: '2rem', fontWeight: 600 }}>
            Electromagnetism: Field Integrals
          </h2>
          <p style={{ color: '#a1a1aa', lineHeight: '1.7', fontSize: '1.1rem' }}>
            The electrostatic and electrodynamic sandboxes rely heavily on calculating aggregate vector potentials across multiple interacting point charges in real-time. Net field strengths calculate exactly via Coulomb tensors mapping the canvas context space.
          </p>
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '2.5rem', borderRadius: '16px', margin: '2rem 0', border: '1px solid rgba(255,255,255,0.05)', boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.2)' }}>
            <BlockMath math="\mathbf{E}(\mathbf{r}) = \frac{1}{4\pi\varepsilon_0} \sum_{i} q_i \frac{\mathbf{r} - \mathbf{r}_i}{|\mathbf{r} - \mathbf{r}_i|^3}" />
          </div>
        </div>

      </div>
    </div>
  );
}
