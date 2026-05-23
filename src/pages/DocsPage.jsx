import { LineChart, Play, Sliders, Video } from 'lucide-react';
import { BlockMath, InlineMath } from '../components/KaTeX';
import Seo from '../components/Seo';

export default function DocsPage() {
  return (
    <div className="page-content">
      <Seo
        title="Physics Engine Documentation"
        description="Learn how the Physiverse physics simulator models mechanics, quantum systems, fluids, and electromagnetism with educational physics tools, live graphing, equations, and exports."
        path="/docs"
        keywords={[
          'physics-simulator',
          'physics simulator documentation',
          'educational physics tools',
          'physics engine documentation',
          'interactive physics documentation',
          'physics equations',
          'simulation documentation',
        ]}
      />
      <main className="content-page">
        <h1>Physics Engine Documentation</h1>

        <p>
          Physiverse is an interactive physics lab that runs in your browser. Whether you are
          curious about why pendulums swing the way they do, how planets stay in orbit, or what
          electric fields look like, you can explore it hands-on here — no prior knowledge needed
          beyond curiosity.
        </p>
        <p>
          Every simulation is driven by real physics equations — the same ones written on
          whiteboards, brought to life so you can change a value and watch the system respond.
        </p>

        <h2>How Simulations Work</h2>
        <p>
          A simulation is essentially a very fast calculator for nature. Every fraction of a second,
          the program asks: given where everything is <em>right now</em>, where will it be a tiny
          moment later? It repeats this thousands of times a second to produce smooth, realistic
          motion.
        </p>
        <p>
          The core ingredient is Newton's second law — it tells us how forces cause objects to
          accelerate:
        </p>
        <div className="math-panel">
          <BlockMath math="F = ma" />
        </div>
        <p>
          <InlineMath math="F" /> is the net force, <InlineMath math="m" /> is mass, and{' '}
          <InlineMath math="a" /> is acceleration. From acceleration we get velocity, from velocity
          we get position — and that is one frame of the animation done.
        </p>

        <h2>Classical Mechanics</h2>
        <p>
          Mechanics is the study of motion. One of its most powerful ideas is{' '}
          <strong>conservation of energy</strong>: energy is never created or destroyed, only
          converted between forms. A swinging pendulum trades potential energy at the top of its arc
          for kinetic energy at the bottom — and the total stays constant:
        </p>
        <div className="math-panel">
          <BlockMath
            math={String.raw`E_\text{total} = \underbrace{\tfrac{1}{2}mv^2}_{\text{kinetic}} + \underbrace{mgh}_{\text{potential}} = \text{constant}`}
          />
        </div>
        <p>
          The time it takes a pendulum to complete one full swing depends only on its length, not
          its mass:
        </p>
        <div className="math-panel">
          <BlockMath math={String.raw`T = 2\pi\sqrt{\frac{L}{g}}`} />
        </div>
        <p>
          Try changing the length in the pendulum simulation and see if the period matches.{' '}
          <InlineMath math="g \approx 9.8\,\text{m/s}^2" /> is gravitational acceleration at Earth's
          surface.
        </p>

        <h2>Electromagnetism</h2>
        <p>
          Charged particles push and pull on each other through electric forces. Coulomb's law
          describes the strength of that force — it looks a lot like gravity:
        </p>
        <div className="math-panel">
          <BlockMath math={String.raw`F = k \frac{q_1 \, q_2}{r^2}`} />
        </div>
        <p>
          <InlineMath math="q_1" /> and <InlineMath math="q_2" /> are the charges,{' '}
          <InlineMath math="r" /> is the distance between them, and{' '}
          <InlineMath math={String.raw`k \approx 8.99 \times 10^9\,\text{N·m}^2/\text{C}^2`} />.
          Double the distance and the force drops to one quarter — that <InlineMath math="r^2" /> in
          the denominator is why fields weaken so quickly with distance.
        </p>

        <h2>Fluid Dynamics</h2>
        <p>
          Why do ships float? Any object submerged in a fluid feels an upward buoyant force equal to
          the weight of fluid it displaces — Archimedes' principle:
        </p>
        <div className="math-panel">
          <BlockMath math={String.raw`F_b = \rho \, V \, g`} />
        </div>
        <p>
          <InlineMath math="\rho" /> is the fluid density, <InlineMath math="V" /> is the volume
          displaced, and <InlineMath math="g" /> is gravity. If the buoyant force exceeds the
          object's weight, it floats. Try changing densities in the buoyancy simulation to see this
          directly.
        </p>

        <h2>Quantum Physics</h2>
        <p>
          At the scale of atoms, particles do not have a single definite position — instead they
          exist as a <strong>wave of probability</strong>. The square of the wave function{' '}
          <InlineMath math="\Psi" /> tells you how likely you are to find the particle at a given
          location:
        </p>
        <div className="math-panel">
          <BlockMath math={String.raw`\rho = |\Psi|^2`} />
        </div>
        <p>
          Bright regions in the quantum simulations are where the particle is most likely to be
          found. The double-slit simulation shows one of the most famous quantum results: a single
          particle interfering with itself to produce a striped pattern on a screen.
        </p>

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
            <p>Plot variables like position or energy while the simulation runs.</p>
          </div>
          <div className="feature-card">
            <h3>
              <Play size={18} /> Playback control
            </h3>
            <p>Pause, reset, and adjust speed to inspect any moment.</p>
          </div>
          <div className="feature-card">
            <h3>
              <Sliders size={18} /> Parameters
            </h3>
            <p>Tweak mass, length, charge, or gravity and see the effect instantly.</p>
          </div>
        </div>

        <h2>Further Learning</h2>
        <p>These free resources pair well with the simulations if you want to go deeper:</p>
        <ul>
          <li>
            <a href="https://www.khanacademy.org/science/physics" target="_blank" rel="noreferrer">
              Khan Academy — Physics
            </a>{' '}
            — video lessons covering all the topics here, great for building intuition first.
          </li>
          <li>
            <a href="http://hyperphysics.phy-astr.gsu.edu" target="_blank" rel="noreferrer">
              HyperPhysics
            </a>{' '}
            — a well-organised reference with concept maps; useful for quick formula lookups.
          </li>
          <li>
            <a href="https://phet.colorado.edu" target="_blank" rel="noreferrer">
              PhET Simulations
            </a>{' '}
            — interactive simulations from the University of Colorado, a good companion to this app.
          </li>
          <li>
            <a href="https://www.feynmanlectures.caltech.edu" target="_blank" rel="noreferrer">
              The Feynman Lectures
            </a>{' '}
            — Richard Feynman's legendary physics lectures, freely available and written with
            remarkable clarity.
          </li>
        </ul>

        <h2>Under the Hood</h2>
        <p>
          For the curious — here is the more advanced mathematics powering the simulations behind
          the scenes.
        </p>
        <p>
          <strong>Classical Dynamics.</strong> For systems with many interacting bodies, the
          simulations track the Hamiltonian (total energy in terms of positions and momenta) to
          monitor whether the solver is drifting over long runs:
        </p>
        <div className="math-panel">
          <BlockMath
            math={String.raw`\mathcal{H}(\mathbf{q}, \mathbf{p}) = \sum_{i=1}^{N} \frac{\left| \mathbf{p}_i \right|^2}{2m_i} + \sum_{i<j}^{N} V(|\mathbf{q}_i - \mathbf{q}_j|)`}
          />
        </div>
        <p>
          <strong>Quantum Models.</strong> Full time evolution is governed by the Schrödinger
          equation, where <InlineMath math="\hbar" /> is the reduced Planck constant and{' '}
          <InlineMath math="V" /> is the potential energy field:
        </p>
        <div className="math-panel">
          <BlockMath
            math={String.raw`i\hbar \frac{\partial}{\partial t}\Psi(\mathbf{r},t) = \left[ -\frac{\hbar^2}{2m} \nabla^2 + V(\mathbf{r}, t) \right] \Psi(\mathbf{r},t)`}
          />
        </div>
        <p>
          <strong>Fluid Dynamics.</strong> The fluid simulations use Smoothed Particle Hydrodynamics
          (SPH), which estimates density at any point by summing contributions from nearby particles
          weighted by a kernel function <InlineMath math="W" />:
        </p>
        <div className="math-panel">
          <BlockMath math={String.raw`\rho_i = \sum_{j} m_j W(\mathbf{r}_i - \mathbf{r}_j, h)`} />
        </div>
        <p>
          <strong>Electromagnetism.</strong> The full electric field at any point in space is
          computed by summing contributions from every charge in the scene:
        </p>
        <div className="math-panel">
          <BlockMath
            math={String.raw`\mathbf{E}(\mathbf{r}) = \frac{1}{4\pi\varepsilon_0} \sum_i q_i \frac{\mathbf{r} - \mathbf{r}_i}{|\mathbf{r} - \mathbf{r}_i|^3}`}
          />
        </div>
      </main>
    </div>
  );
}
