import { LineChart, Play, Sliders, Video } from 'lucide-react';
import { BlockMath, InlineMath } from '../components/KaTeX';

export default function DocsPage() {
  return (
    <div className="page-content">
      <main className="content-page">
        <h1>Physics Engine Documentation</h1>

        <p>
          The app combines canvas-based visualizations with numerical solvers for common classroom
          physics systems. The goal is practical exploration: adjust a parameter, observe the
          system, then compare the resulting data.
        </p>

        <h2>Classical Dynamics</h2>
        <p>
          Mechanics simulations track state variables such as position, velocity, energy, and
          angular momentum. For conservative systems, the Hamiltonian is the reference quantity used
          to monitor drift.
        </p>
        <div className="math-panel">
          <BlockMath
            math={String.raw`\mathcal{H}(\mathbf{q}, \mathbf{p}) = \sum_{i=1}^{N} \frac{\left| \mathbf{p}_i \right|^2}{2m_i} + \sum_{i<j}^{N} V(|\mathbf{q}_i - \mathbf{q}_j|)`}
          />
        </div>

        <h2>Quantum Models</h2>
        <p>
          Quantum simulations render probability density from wave functions. The displayed quantity
          is typically <InlineMath math={String.raw`\rho = |\Psi(\mathbf{r}, t)|^2`} />.
        </p>
        <div className="math-panel">
          <BlockMath
            math={String.raw`i\hbar \frac{\partial}{\partial t}\Psi(\mathbf{r},t) = \left[ -\frac{\hbar^2}{2m} \nabla^2 + V(\mathbf{r}, t) \right] \Psi(\mathbf{r},t)`}
          />
        </div>

        <h2>Fluid Dynamics</h2>
        <p>
          SPH simulations approximate fluid behavior using particles and a smoothing kernel
          <InlineMath math="W" />. Density is estimated from nearby particles inside the kernel
          radius.
        </p>
        <div className="math-panel">
          <BlockMath math={String.raw`\rho_i = \sum_{j} m_j W(\mathbf{r}_i - \mathbf{r}_j, h)`} />
        </div>

        <h2>Electromagnetism</h2>
        <p>
          Field simulations calculate vector fields from charge positions and strengths. The visual
          layer samples those fields across the canvas.
        </p>
        <div className="math-panel">
          <BlockMath
            math={String.raw`\mathbf{E}(\mathbf{r}) = \frac{1}{4\pi\varepsilon_0} \sum_i q_i \frac{\mathbf{r} - \mathbf{r}_i}{|\mathbf{r} - \mathbf{r}_i|^3}`}
          />
        </div>

        <h2>Core Features</h2>
        <div className="feature-grid">
          <div className="feature-card">
            <h3>
              <Video size={18} /> Video export
            </h3>
            <p>Record a simulation run as a WebM video.</p>
          </div>
          <div className="feature-card">
            <h3>
              <LineChart size={18} /> Live graphing
            </h3>
            <p>Plot selected variables while the simulation runs.</p>
          </div>
          <div className="feature-card">
            <h3>
              <Play size={18} /> Playback control
            </h3>
            <p>Pause, reset, and adjust speed during an experiment.</p>
          </div>
          <div className="feature-card">
            <h3>
              <Sliders size={18} /> Parameters
            </h3>
            <p>Change model inputs and compare outcomes.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
