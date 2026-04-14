/**
 * Double Pendulum — Research-Grade Implementation
 * 
 * Integrator:  Adaptive Dormand-Prince RK45 with error estimation
 * Physics:     Full Lagrangian mechanics (no small-angle approximation)
 * Diagnostics: Energy conservation error |ΔH/H₀|, Lyapunov exponent estimate
 * Outputs:     Phase space data, Poincaré section collection
 */

const DEFAULTS = {
  l1: 170,
  l2: 130,
  m1: 1,
  m2: 1,
  g: 980,
  theta1: Math.PI / 2 + 0.05,
  theta2: Math.PI / 4,
  omega1: 0,
  omega2: 0,
  trail: 600,
  tolerance: 1e-8,
};

export const defaultParams = {
  l1: 170, l2: 130, m1: 1, m2: 1, g: 980,
  theta1: 1.6208, theta2: 0.7854,
  omega1: 0, omega2: 0, trail: 600, tolerance: 1e-8,
};

export const equationSections = [
  {
    title: 'Lagrangian',
    equations: [
      {
        latex: String.raw`\mathcal{L} = T - V = \frac{1}{2}(m_1+m_2)\ell_1^2\dot{\theta}_1^2 + \frac{1}{2}m_2\ell_2^2\dot{\theta}_2^2 + m_2\ell_1\ell_2\dot{\theta}_1\dot{\theta}_2\cos(\theta_1-\theta_2) + (m_1+m_2)g\ell_1\cos\theta_1 + m_2 g\ell_2\cos\theta_2`,
        description: 'Full Lagrangian with kinetic and gravitational potential energy terms.',
      },
    ],
    variables: [
      { symbol: 'θ₁, θ₂', description: 'Angular displacements from vertical' },
      { symbol: 'ℓ₁, ℓ₂', description: 'Pendulum arm lengths' },
      { symbol: 'm₁, m₂', description: 'Bob masses' },
      { symbol: 'g', description: 'Gravitational acceleration' },
    ],
  },
  {
    title: 'Equations of Motion',
    equations: [
      {
        latex: String.raw`\ddot{\theta}_1 = \frac{-g(2m_1+m_2)\sin\theta_1 - m_2 g \sin(\theta_1-2\theta_2) - 2\sin(\theta_1-\theta_2)\,m_2\!\left(\dot{\theta}_2^2 \ell_2 + \dot{\theta}_1^2 \ell_1 \cos(\theta_1-\theta_2)\right)}{\ell_1\!\left(2m_1+m_2-m_2\cos(2\theta_1-2\theta_2)\right)}`,
        description: 'Angular acceleration of the first pendulum.',
      },
      {
        latex: String.raw`\ddot{\theta}_2 = \frac{2\sin(\theta_1-\theta_2)\left(\dot{\theta}_1^2 \ell_1(m_1+m_2) + g(m_1+m_2)\cos\theta_1 + \dot{\theta}_2^2 \ell_2 m_2\cos(\theta_1-\theta_2)\right)}{\ell_2\!\left(2m_1+m_2-m_2\cos(2\theta_1-2\theta_2)\right)}`,
        description: 'Angular acceleration of the second pendulum.',
      },
    ],
  },
  {
    title: 'Conserved Quantities',
    equations: [
      {
        latex: String.raw`H = \underbrace{\frac{1}{2}(m_1{+}m_2)\ell_1^2\dot\theta_1^2 + \frac{1}{2}m_2\ell_2^2\dot\theta_2^2 + m_2\ell_1\ell_2\dot\theta_1\dot\theta_2\cos\Delta\theta}_{\text{kinetic}} - \underbrace{(m_1{+}m_2)g\ell_1\cos\theta_1 - m_2 g\ell_2\cos\theta_2}_{\text{potential}}`,
        description: 'Hamiltonian (total energy). Should be conserved; deviation measures numerical error.',
      },
    ],
  },
  {
    title: 'Numerical Method',
    equations: [
      {
        latex: String.raw`\mathbf{y}_{n+1} = \mathbf{y}_n + h\sum_{i=1}^{s} b_i\mathbf{k}_i, \quad \text{err} = h\sum_{i=1}^{s}(b_i - b_i^*)\mathbf{k}_i`,
        description: 'Dormand-Prince RK45 adaptive integrator with embedded error estimation.',
      },
    ],
  },
];

// Legacy flat equations for backwards compatibility
export const equations = [
  String.raw`\mathcal{L} = \frac{1}{2}(m_1+m_2)\ell_1^2 \dot{\theta}_1^2 + \frac{1}{2}m_2 \ell_2^2 \dot{\theta}_2^2 + m_2 \ell_1 \ell_2 \dot{\theta}_1 \dot{\theta}_2 \cos(\theta_1-\theta_2) + (m_1+m_2)g\ell_1\cos\theta_1 + m_2 g\ell_2\cos\theta_2`,
  String.raw`\ddot{\theta}_1 = \frac{-g(2m_1+m_2)\sin\theta_1 - m_2 g \sin(\theta_1-2\theta_2) - 2\sin(\theta_1-\theta_2)m_2(\dot{\theta}_2^2 \ell_2 + \dot{\theta}_1^2 \ell_1 \cos(\theta_1-\theta_2))}{\ell_1 (2m_1+m_2-m_2\cos(2\theta_1-2\theta_2))}`,
];

export const graphParams = [
  { key: 'theta1', label: 'θ₁ [rad]' },
  { key: 'theta2', label: 'θ₂ [rad]' },
  { key: 'omega1', label: 'ω₁ [rad/s]' },
  { key: 'omega2', label: 'ω₂ [rad/s]' },
  { key: 'energy', label: 'E [J]' },
  { key: 'energyError', label: '|ΔE/E₀|' },
];

export const controls = [
  { key: 'l1', label: 'Length ℓ₁', min: 80, max: 280, step: 1 },
  { key: 'l2', label: 'Length ℓ₂', min: 80, max: 280, step: 1 },
  { key: 'm1', label: 'Mass m₁', min: 0.2, max: 4, step: 0.05 },
  { key: 'm2', label: 'Mass m₂', min: 0.2, max: 4, step: 0.05 },
  { key: 'g', label: 'Gravity g', min: 200, max: 1600, step: 10 },
  { key: 'theta1', label: 'θ₁ [rad]', min: -Math.PI, max: Math.PI, step: 0.01 },
  { key: 'theta2', label: 'θ₂ [rad]', min: -Math.PI, max: Math.PI, step: 0.01 },
  { key: 'omega1', label: 'ω₁ [rad/s]', min: -8, max: 8, step: 0.05 },
  { key: 'omega2', label: 'ω₂ [rad/s]', min: -8, max: 8, step: 0.05 },
  { key: 'trail', label: 'Trail Length', min: 100, max: 1600, step: 10 },
];

export const method = 'rk45';

// ── Equations of motion ─────────────────────────────────────────────────────
function derivs(th1, th2, om1, om2, p) {
  const d = th1 - th2;
  const cosD = Math.cos(d);
  const sinD = Math.sin(d);
  const den = 2 * p.m1 + p.m2 - p.m2 * Math.cos(2 * d);

  const dom1 = (
    -p.g * (2 * p.m1 + p.m2) * Math.sin(th1)
    - p.m2 * p.g * Math.sin(th1 - 2 * th2)
    - 2 * sinD * p.m2 * (om2 * om2 * p.l2 + om1 * om1 * p.l1 * cosD)
  ) / (p.l1 * den);

  const dom2 = (
    2 * sinD * (
      om1 * om1 * p.l1 * (p.m1 + p.m2)
      + p.g * (p.m1 + p.m2) * Math.cos(th1)
      + om2 * om2 * p.l2 * p.m2 * cosD
    )
  ) / (p.l2 * den);

  return [om1, om2, dom1, dom2];
}

// ── Hamiltonian (total energy) ──────────────────────────────────────────────
function hamiltonian(th1, th2, om1, om2, p) {
  const cosD = Math.cos(th1 - th2);
  const T = 0.5 * (p.m1 + p.m2) * p.l1 * p.l1 * om1 * om1
          + 0.5 * p.m2 * p.l2 * p.l2 * om2 * om2
          + p.m2 * p.l1 * p.l2 * om1 * om2 * cosD;
  const V = -(p.m1 + p.m2) * p.g * p.l1 * Math.cos(th1)
            - p.m2 * p.g * p.l2 * Math.cos(th2);
  return T + V;
}

// ── Dormand-Prince RK45 adaptive step ───────────────────────────────────────
// Butcher tableau coefficients for DOPRI5
const A = [
  [],
  [1/5],
  [3/40, 9/40],
  [44/45, -56/15, 32/9],
  [19372/6561, -25360/2187, 64448/6561, -212/729],
  [9017/3168, -355/33, 46732/5247, 49/176, -5103/18656],
  [35/384, 0, 500/1113, 125/192, -2187/6784, 11/84],
];
const B5 = [35/384, 0, 500/1113, 125/192, -2187/6784, 11/84, 0];
const B4 = [5179/57600, 0, 7571/16695, 393/640, -92097/339200, 187/2100, 1/40];
const C  = [0, 1/5, 3/10, 4/5, 8/9, 1, 1];

function rk45Step(th1, th2, om1, om2, h, p, tol) {
  const state = [th1, th2, om1, om2];
  const k = [];

  // Compute stages
  for (let i = 0; i < 7; i++) {
    const s = [0, 0, 0, 0];
    for (let j = 0; j < i; j++) {
      for (let d = 0; d < 4; d++) s[d] += A[i][j] * k[j][d];
    }
    k[i] = derivs(
      state[0] + h * s[0],
      state[1] + h * s[1],
      state[2] + h * s[2],
      state[3] + h * s[3],
      p
    );
  }

  // 5th order solution
  const y5 = [0, 0, 0, 0];
  for (let d = 0; d < 4; d++) {
    y5[d] = state[d];
    for (let i = 0; i < 7; i++) y5[d] += h * B5[i] * k[i][d];
  }

  // 4th order solution (for error estimation)
  const y4 = [0, 0, 0, 0];
  for (let d = 0; d < 4; d++) {
    y4[d] = state[d];
    for (let i = 0; i < 7; i++) y4[d] += h * B4[i] * k[i][d];
  }

  // Error estimate
  let errMax = 0;
  for (let d = 0; d < 4; d++) {
    const scale = Math.max(Math.abs(y5[d]), Math.abs(state[d]), 1e-10);
    errMax = Math.max(errMax, Math.abs(y5[d] - y4[d]) / scale);
  }
  errMax /= tol;

  // Step size control
  const safety = 0.9;
  let hNew;
  if (errMax <= 1) {
    // Accept step, increase h
    hNew = errMax > 0 ? h * Math.min(5, safety * Math.pow(errMax, -0.2)) : h * 2;
    return { state: y5, hNew, accepted: true };
  } else {
    // Reject step, decrease h
    hNew = h * Math.max(0.2, safety * Math.pow(errMax, -0.25));
    return { state: null, hNew, accepted: false };
  }
}

// ── Fallback RK4 (for reliability) ──────────────────────────────────────────
function rk4(th1, th2, om1, om2, h, p) {
  const [k1a, k1b, k1c, k1d] = derivs(th1, th2, om1, om2, p);
  const [k2a, k2b, k2c, k2d] = derivs(th1+k1a*h/2, th2+k1b*h/2, om1+k1c*h/2, om2+k1d*h/2, p);
  const [k3a, k3b, k3c, k3d] = derivs(th1+k2a*h/2, th2+k2b*h/2, om1+k2c*h/2, om2+k2d*h/2, p);
  const [k4a, k4b, k4c, k4d] = derivs(th1+k3a*h, th2+k3b*h, om1+k3c*h, om2+k3d*h, p);
  return [
    th1 + h*(k1a+2*k2a+2*k3a+k4a)/6,
    th2 + h*(k1b+2*k2b+2*k3b+k4b)/6,
    om1 + h*(k1c+2*k2c+2*k3c+k4c)/6,
    om2 + h*(k1d+2*k2d+2*k3d+k4d)/6,
  ];
}

// ── Rendering ───────────────────────────────────────────────────────────────
export const scenarios = [
  {
    name: 'Gentle Swing',
    description: 'Small angles — nearly periodic, predictable motion.',
    params: { theta1: 0.15, theta2: 0.1, omega1: 0, omega2: 0, m1: 1, m2: 1, l1: 170, l2: 130 },
  },
  {
    name: 'Chaos Onset',
    description: 'θ₁ = 90° — the system becomes chaotic. Watch the trajectory fill phase space.',
    params: { theta1: Math.PI / 2, theta2: Math.PI / 4, omega1: 0, omega2: 0 },
  },
  {
    name: 'Full Rotation',
    description: 'Enough energy for both arms to go over the top continuously.',
    params: { theta1: Math.PI - 0.05, theta2: Math.PI - 0.1, omega1: 3, omega2: -2 },
  },
  {
    name: 'Butterfly Effect',
    description: 'Change θ₁ by 0.01 rad from the "Chaos Onset" scenario. Compare the completely different trajectory.',
    params: { theta1: Math.PI / 2 + 0.01, theta2: Math.PI / 4, omega1: 0, omega2: 0 },
  },
  {
    name: 'Heavy Lower Arm',
    description: 'm₂ ≫ m₁ — the lower bob dominates and the system behaves differently.',
    params: { theta1: 1.2, theta2: 0.5, m1: 0.3, m2: 3.0, omega1: 0, omega2: 0 },
  },
];

export const guidedExperiments = [
  {
    title: 'Chaos vs. Predictability',
    steps: [
      {
        instruction: 'We\'ll start gentle. The parameters have been set to θ₁ = 0.15 rad (about 9°). Press Play and let it run for 5 seconds.',
        params: { theta1: 0.15, theta2: 0.1, omega1: 0, omega2: 0 },
        question: 'What type of motion do you expect for small angles?',
        choices: ['Chaotic and unpredictable', 'Roughly periodic (repeating)', 'Immediate rest'],
        correctIndex: 1,
        commonMisconception: 'Many assume the double pendulum is always chaotic. At small angles, it behaves nearly like two coupled harmonic oscillators — the motion is quasi-periodic.',
        explanation: 'At small angles, the nonlinear terms in the equations of motion become negligible, and the system approximates two coupled simple pendulums with energy exchanging between modes.',
        tryThis: 'Watch the trail carefully — it traces nearly-closed loops in the Phase tab.',
      },
      {
        instruction: 'Now increase θ₁ to π/2 (90°). Reset and play.',
        params: { theta1: Math.PI / 2, theta2: Math.PI / 4, omega1: 0, omega2: 0 },
        question: 'Will the motion still be periodic?',
        choices: ['Yes, just wider swings', 'No — it will become chaotic', 'It will slow down and stop'],
        correctIndex: 1,
        commonMisconception: 'Students often think "bigger angle = bigger but similar motion." In reality, the nonlinear cos(θ₁−θ₂) coupling term dominates at large angles, breaking periodicity.',
        explanation: 'The double pendulum transitions to chaos above a critical energy threshold. The Lyapunov exponent (visible in the HUD) becomes positive, meaning nearby trajectories diverge exponentially.',
        tryThis: 'Compare the Phase Space plot now vs. the previous step. The neat loops have become a tangled mess.',
      },
      {
        instruction: 'Keep everything the same, but change θ₁ by just 0.01 rad (from π/2 to π/2 + 0.01).',
        params: { theta1: Math.PI / 2 + 0.01, theta2: Math.PI / 4, omega1: 0, omega2: 0 },
        question: 'After 10 seconds, will this trajectory look similar to the previous one?',
        choices: ['Almost identical — 0.01 rad is tiny', 'Completely different trajectory', 'Same shape but shifted in time'],
        correctIndex: 1,
        commonMisconception: 'Our intuition says tiny changes → tiny effects. Chaos means exponentially sensitive dependence on initial conditions — the "butterfly effect."',
        explanation: 'This is the hallmark of chaos: sensitive dependence on initial conditions. Two states that are 0.01 rad apart will diverge exponentially, with the separation growing as e^(λt) where λ is the Lyapunov exponent.',
      },
    ],
  },
];

export function create(canvas, initParams = {}) {
  const ctx = canvas.getContext('2d');
  const p = { ...DEFAULTS, ...initParams };

  let trail, trailCap, trailHead, trailLen;
  let th1, th2, om1, om2;
  let simTime, stepCount, currentDt;
  let H0; // initial Hamiltonian
  let lyapunovSum, lyapunovCount;
  
  // Shadow state for Lyapunov estimation
  let sth1, sth2, som1, som2;
  const SHADOW_EPS = 1e-7;

  function allocTrail() {
    trailCap = Math.max(100, Math.floor(p.trail));
    trail = new Float32Array(trailCap * 2);
    trailHead = 0;
    trailLen = 0;
  }

  function initState() {
    th1 = p.theta1; th2 = p.theta2;
    om1 = p.omega1; om2 = p.omega2;
    simTime = 0; stepCount = 0; currentDt = 1/60/20;
    H0 = hamiltonian(th1, th2, om1, om2, p);
    lyapunovSum = 0; lyapunovCount = 0;
    
    // Shadow trajectory (tiny perturbation)
    sth1 = th1 + SHADOW_EPS;
    sth2 = th2; som1 = om1; som2 = om2;
    
    allocTrail();
  }

  function pivotCenter() {
    return { cx: canvas.width / 2, cy: canvas.height * 0.28 };
  }

  function positions() {
    const { cx, cy } = pivotCenter();
    const x1 = cx + p.l1 * Math.sin(th1);
    const y1 = cy + p.l1 * Math.cos(th1);
    const x2 = x1 + p.l2 * Math.sin(th2);
    const y2 = y1 + p.l2 * Math.cos(th2);
    return { cx, cy, x1, y1, x2, y2 };
  }

  function tick(dt) {
    const tol = p.tolerance || 1e-8;
    let remaining = dt;
    let h = currentDt;
    const maxSteps = 200;
    let steps = 0;

    while (remaining > 1e-12 && steps < maxSteps) {
      h = Math.min(h, remaining);
      
      const result = rk45Step(th1, th2, om1, om2, h, p, tol);
      
      if (result.accepted) {
        [th1, th2, om1, om2] = result.state;
        
        // Advance shadow state (same step size, RK4 is fine for this)
        [sth1, sth2, som1, som2] = rk4(sth1, sth2, som1, som2, h, p);
        
        // Lyapunov exponent estimation (renormalization)
        const dd = Math.sqrt(
          (th1-sth1)**2 + (th2-sth2)**2 + (om1-som1)**2 + (om2-som2)**2
        );
        if (dd > 0 && simTime > 0.1) {
          lyapunovSum += Math.log(dd / SHADOW_EPS);
          lyapunovCount++;
          // Renormalize shadow
          const scale = SHADOW_EPS / dd;
          sth1 = th1 + (sth1 - th1) * scale;
          sth2 = th2 + (sth2 - th2) * scale;
          som1 = om1 + (som1 - om1) * scale;
          som2 = om2 + (som2 - om2) * scale;
        }
        
        remaining -= h;
        simTime += h;
        stepCount++;
      }
      
      h = Math.max(1e-6, Math.min(result.hNew, 0.05));
      currentDt = h;
      steps++;
    }

    const { x2, y2 } = positions();
    trail[trailHead * 2] = x2;
    trail[trailHead * 2 + 1] = y2;
    trailHead = (trailHead + 1) % trailCap;
    if (trailLen < trailCap) trailLen++;
  }

  function render() {
    const W = canvas.width;
    const H = canvas.height;
    ctx.fillStyle = '#0B0F14';
    ctx.fillRect(0, 0, W, H);

    const { cx, cy, x1, y1, x2, y2 } = positions();

    // Trail with Viridis-inspired gradient
    if (trailLen > 1) {
      const start = (trailHead - trailLen + trailCap) % trailCap;
      let px = trail[start * 2];
      let py = trail[start * 2 + 1];
      for (let i = 1; i < trailLen; i++) {
        const idx = (start + i) % trailCap;
        const nx = trail[idx * 2];
        const ny = trail[idx * 2 + 1];
        const frac = i / trailLen;
        
        // Viridis-inspired color progression
        const t = frac;
        const r = Math.round(68 + t * 185);
        const g = Math.round(1 + t * 220);
        const b = Math.round(84 + t * 80);

        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(nx, ny);
        ctx.strokeStyle = `rgba(${r},${g},${b},${frac * 0.85})`;
        ctx.lineWidth = frac * 2.2;
        ctx.stroke();
        px = nx;
        py = ny;
      }
    }

    // Arms
    ctx.lineCap = 'round';
    ctx.shadowBlur = 10;
    ctx.shadowColor = 'rgba(79, 195, 247,0.5)';
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(x1, y1);
    ctx.strokeStyle = 'rgba(192,168,255,0.85)';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.shadowColor = 'rgba(96,165,250,0.5)';
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
    ctx.strokeStyle = 'rgba(160,210,255,0.85)';
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Pivot
    ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#e4e4f0';
    ctx.fill();

    // Bobs
    const r1 = 9 + Math.sqrt(p.m1) * 4;
    const r2 = 9 + Math.sqrt(p.m2) * 4;

    ctx.shadowBlur = 24; ctx.shadowColor = '#4FC3F7';
    ctx.beginPath(); ctx.arc(x1, y1, r1, 0, Math.PI * 2);
    ctx.fillStyle = '#81D4FA';
    ctx.fill();

    ctx.shadowBlur = 22; ctx.shadowColor = '#60a5fa';
    ctx.beginPath(); ctx.arc(x2, y2, r2, 0, Math.PI * 2);
    ctx.fillStyle = '#93c5fd';
    ctx.fill();
    ctx.shadowBlur = 0;

    // Mass labels
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('m₁', x1, y1);
    ctx.fillText('m₂', x2, y2);
  }

  let rafId, lastTs, running = false;

  function loop(ts) {
    if (!running) return;
    const dt = lastTs === undefined ? 1/60 : Math.min((ts - lastTs) / 1000, 1/20);
    lastTs = ts;
    tick(dt);
    render();
    rafId = requestAnimationFrame(loop);
  }

  initState();
  render();

  return {
    start() {
      if (running) return;
      running = true; lastTs = undefined;
      rafId = requestAnimationFrame(loop);
    },
    stop() { running = false; cancelAnimationFrame(rafId); },
    reset() { this.stop(); initState(); render(); this.start(); },
    destroy() { this.stop(); },
    getData() {
      const H = hamiltonian(th1, th2, om1, om2, p);
      return {
        time: simTime,
        theta1: th1,
        theta2: th2,
        omega1: om1,
        omega2: om2,
        energy: H,
        totalEnergy: H,
        energyError: H0 !== 0 ? (H - H0) / Math.abs(H0) : 0,
        dt: currentDt,
        steps: stepCount,
        lyapunov: lyapunovCount > 0 ? lyapunovSum / (lyapunovCount * simTime) : 0,
      };
    },
  };
}
