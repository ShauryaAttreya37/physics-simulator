import { BlockMath, InlineMath } from '../components/KaTeX';

export default function IntegratorsPage() {
  return (
    <div className="page-content">
      <main className="content-page">
        <h1>Integrators and Numeric Methods</h1>

        <p>
          The simulations use different integration methods depending on the system. The choice
          affects stability, speed, and long-term energy behavior.
        </p>

        <h2>Yoshida 4th-Order Symplectic</h2>
        <p>
          Symplectic methods are well suited to Hamiltonian systems such as orbital and pendulum
          models because they preserve phase-space structure over long runs.
        </p>
        <div className="math-panel">
          <BlockMath
            math={String.raw`\begin{aligned} x_i &= x_{i-1} + c_i v_{i-1} \Delta t \\ v_i &= v_{i-1} + d_i a(x_i) \Delta t \end{aligned}`}
          />
        </div>
        <p>
          The coefficients <InlineMath math="c_i" /> and <InlineMath math="d_i" /> set the staged
          updates. A common Yoshida construction uses{' '}
          <InlineMath math={String.raw`w_1 = \frac{1}{2 - 2^{1/3}},\quad w_0 = 1 - 2w_1`} />.
        </p>

        <h2>Adaptive Runge-Kutta RK45</h2>
        <p>
          RK45 estimates local truncation error and adjusts the time step. It is useful for chaotic
          systems where a fixed step can be either too slow or too unstable.
        </p>
        <div className="math-panel">
          <BlockMath math={String.raw`y_{n+1} = y_n + \Delta t \sum_{i=1}^{s} b_i k_i`} />
          <BlockMath
            math={String.raw`k_i = f\left(t_n + c_i \Delta t, y_n + \Delta t \sum_{j=1}^{i-1} a_{ij} k_j\right)`}
          />
        </div>
      </main>
    </div>
  );
}
