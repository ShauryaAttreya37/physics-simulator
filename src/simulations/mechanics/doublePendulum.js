/**
 * Double Pendulum
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
  l1: 170,
  l2: 130,
  m1: 1,
  m2: 1,
  g: 980,
  theta1: 1.6208,
  theta2: 0.7854,
  omega1: 0,
  omega2: 0,
  trail: 600,
  tolerance: 1e-8,
};

export const equationSections = [
  {
    title: 'Introduction',
    content:
      'A double pendulum is two pendulums connected end to end. The second pendulum is attached to the first bob, creating complex, often chaotic motion. Even small changes in starting conditions can lead to very different behavior. The model uses Lagrangian mechanics without a small-angle approximation.',
  },
  {
    title: 'Lagrangian',
    equations: [
      {
        latex: String.raw`\mathcal{L} = T - V = \frac{1}{2}(m_1+m_2)\ell_1^2\dot{\theta}_1^2 + \frac{1}{2}m_2\ell_2^2\dot{\theta}_2^2 + m_2\ell_1\ell_2\dot{\theta}_1\dot{\theta}_2\cos(\theta_1-\theta_2) + (m_1+m_2)g\ell_1\cos\theta_1 + m_2 g\ell_2\cos\theta_2`,
        description:
          'The Lagrangian L = T - V combines kinetic energy (T) and potential energy (V). This approach gives the equations of motion through Euler-Lagrange equations. It accounts for the interaction between the two pendulums.',
      },
    ],
    variables: [
      {
        symbol: 'θ₁, θ₂',
        description: 'Angles of first and second pendulums from vertical (radians)',
      },
      { symbol: 'ℓ₁, ℓ₂', description: 'Lengths of the pendulum arms' },
      { symbol: 'm₁, m₂', description: 'Masses of the bobs' },
      { symbol: 'g', description: 'Gravitational acceleration' },
    ],
  },
  {
    title: 'Equations of Motion',
    equations: [
      {
        latex: String.raw`\ddot{\theta}_1 = \frac{-g(2m_1+m_2)\sin\theta_1 - m_2 g \sin(\theta_1-2\theta_2) - 2\sin(\theta_1-\theta_2)\,m_2\!\left(\dot{\theta}_2^2 \ell_2 + \dot{\theta}_1^2 \ell_1 \cos(\theta_1-\theta_2)\right)}{\ell_1\!\left(2m_1+m_2-m_2\cos(2\theta_1-2\theta_2)\right)}`,
        description:
          'This complex equation gives the acceleration of the first pendulum. It includes gravity, centrifugal forces, and coupling with the second pendulum. The motion is nonlinear and can be chaotic.',
      },
      {
        latex: String.raw`\ddot{\theta}_2 = \frac{2\sin(\theta_1-\theta_2)\left(\dot{\theta}_1^2 \ell_1(m_1+m_2) + g(m_1+m_2)\cos\theta_1 + \dot{\theta}_2^2 \ell_2 m_2\cos(\theta_1-\theta_2)\right)}{\ell_2\!\left(2m_1+m_2-m_2\cos(2\theta_1-2\theta_2)\right)}`,
        description:
          "Acceleration of the second pendulum. Similar complexity, but depends on the first pendulum's motion. Small angle changes can cause big differences over time.",
      },
    ],
  },
  {
    title: 'Conserved Quantities',
    equations: [
      {
        latex: String.raw`H = \underbrace{\frac{1}{2}(m_1{+}m_2)\ell_1^2\dot\theta_1^2 + \frac{1}{2}m_2\ell_2^2\dot\theta_2^2 + m_2\ell_1\ell_2\dot\theta_1\dot\theta_2\cos\Delta\theta}_{\text{kinetic}} - \underbrace{(m_1{+}m_2)g\ell_1\cos\theta_1 - m_2 g\ell_2\cos\theta_2}_{\text{potential}}`,
        description:
          "The Hamiltonian H is the total energy. In theory it's conserved, but numerical errors cause small changes. Watch this to see simulation accuracy.",
      },
    ],
  },
  {
    title: 'Numerical Method',
    equations: [
      {
        latex: String.raw`\mathbf{y}_{n+1} = \mathbf{y}_n + h\sum_{i=1}^{s} b_i\mathbf{k}_i, \quad \text{err} = h\sum_{i=1}^{s}(b_i - b_i^*)\mathbf{k}_i`,
        description:
          'Runge-Kutta 4/5 method with adaptive step size. It automatically adjusts time steps for accuracy. The error estimate ensures reliable results.',
      },
    ],
  },
  {
    title: 'How to Use',
    content:
      '1. Adjust initial angles θ₁ and θ₂ - small changes can lead to very different paths.\n2. Change lengths ℓ₁, ℓ₂ - longer arms mean slower motion.\n3. Modify masses m₁, m₂ - affects the coupling between pendulums.\n4. Watch the trail to see the path of the second bob.\n5. Check energy conservation - it should stay constant.',
  },
  {
    title: 'Beginner Tips',
    content:
      'Start with equal lengths and masses for symmetry. Try slightly different starting angles and see chaos emerge. Look for patterns in the phase space plots. Notice how the second pendulum moves faster. Experiment with one pendulum much heavier - it behaves more like a single pendulum. Watch for "looping" where the pendulum goes over the top.',
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
function derivs(state, p) {
  const [th1, th2, om1, om2] = state;
  const d = th1 - th2;
  const cosD = Math.cos(d);
  const sinD = Math.sin(d);
  const den = 2 * p.m1 + p.m2 - p.m2 * Math.cos(2 * d);

  const dom1 =
    (-p.g * (2 * p.m1 + p.m2) * Math.sin(th1) -
      p.m2 * p.g * Math.sin(th1 - 2 * th2) -
      2 * sinD * p.m2 * (om2 * om2 * p.l2 + om1 * om1 * p.l1 * cosD)) /
    (p.l1 * den);

  const dom2 =
    (2 *
      sinD *
      (om1 * om1 * p.l1 * (p.m1 + p.m2) +
        p.g * (p.m1 + p.m2) * Math.cos(th1) +
        om2 * om2 * p.l2 * p.m2 * cosD)) /
    (p.l2 * den);

  return [om1, om2, dom1, dom2];
}

// ── Hamiltonian (total energy) ──────────────────────────────────────────────
function hamiltonian(th1, th2, om1, om2, p) {
  const cosD = Math.cos(th1 - th2);
  const T =
    0.5 * (p.m1 + p.m2) * p.l1 * p.l1 * om1 * om1 +
    0.5 * p.m2 * p.l2 * p.l2 * om2 * om2 +
    p.m2 * p.l1 * p.l2 * om1 * om2 * cosD;
  const V = -(p.m1 + p.m2) * p.g * p.l1 * Math.cos(th1) - p.m2 * p.g * p.l2 * Math.cos(th2);
  return T + V;
}

import { rk4, rk45Step } from '../../physics/solvers';

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
    description:
      'Change θ₁ by 0.01 rad from the "Chaos Onset" scenario. Compare the completely different trajectory.',
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
        instruction:
          "We'll start gentle. The parameters have been set to θ₁ = 0.15 rad (about 9°). Press Play and let it run for 5 seconds.",
        params: { theta1: 0.15, theta2: 0.1, omega1: 0, omega2: 0 },
        question: 'What type of motion do you expect for small angles?',
        choices: ['Chaotic and unpredictable', 'Roughly periodic (repeating)', 'Immediate rest'],
        correctIndex: 1,
        commonMisconception:
          'Many assume the double pendulum is always chaotic. At small angles, it behaves nearly like two coupled harmonic oscillators — the motion is quasi-periodic.',
        explanation:
          'At small angles, the nonlinear terms in the equations of motion become negligible, and the system approximates two coupled simple pendulums with energy exchanging between modes.',
        tryThis: 'Watch the trail carefully — it traces nearly-closed loops in the Phase tab.',
      },
      {
        instruction: 'Now increase θ₁ to π/2 (90°). Reset and play.',
        params: { theta1: Math.PI / 2, theta2: Math.PI / 4, omega1: 0, omega2: 0 },
        question: 'Will the motion still be periodic?',
        choices: [
          'Yes, just wider swings',
          'No — it will become chaotic',
          'It will slow down and stop',
        ],
        correctIndex: 1,
        commonMisconception:
          'Students often think "bigger angle = bigger but similar motion." In reality, the nonlinear cos(θ₁−θ₂) coupling term dominates at large angles, breaking periodicity.',
        explanation:
          'The double pendulum transitions to chaos above a critical energy threshold. The Lyapunov exponent (visible in the HUD) becomes positive, meaning nearby trajectories diverge exponentially.',
        tryThis:
          'Compare the Phase Space plot now vs. the previous step. The neat loops have become a tangled mess.',
      },
      {
        instruction:
          'Keep everything the same, but change θ₁ by just 0.01 rad (from π/2 to π/2 + 0.01).',
        params: { theta1: Math.PI / 2 + 0.01, theta2: Math.PI / 4, omega1: 0, omega2: 0 },
        question: 'After 10 seconds, will this trajectory look similar to the previous one?',
        choices: [
          'Almost identical — 0.01 rad is tiny',
          'Completely different trajectory',
          'Same shape but shifted in time',
        ],
        correctIndex: 1,
        commonMisconception:
          'Our intuition says tiny changes → tiny effects. Chaos means exponentially sensitive dependence on initial conditions — the "butterfly effect."',
        explanation:
          'This is the hallmark of chaos: sensitive dependence on initial conditions. Two states that are 0.01 rad apart will diverge exponentially, with the separation growing as e^(λt) where λ is the Lyapunov exponent.',
      },
    ],
  },
];

// ── Modern Decoupled API ───────────────────────────────────────────────────

export function init(p) {
  const th1 = p.theta1;
  const th2 = p.theta2;
  const om1 = p.omega1;
  const om2 = p.omega2;
  const trailCap = Math.max(100, Math.floor(p.trail));

  return {
    th1,
    th2,
    om1,
    om2,
    sth1: th1 + 1e-7,
    sth2: th2,
    som1: om1,
    som2: om2, // shadow state for Lyapunov
    simTime: 0,
    stepCount: 0,
    currentDt: 1 / 60 / 20,
    H0: hamiltonian(th1, th2, om1, om2, p),
    lyapunovSum: 0,
    lyapunovCount: 0,
    trail: new Float32Array(trailCap * 2),
    trailHead: 0,
    trailLen: 0,
    dragTarget: null,
  };
}

export function update(state, dt, p) {
  const {
    th1,
    th2,
    om1,
    om2,
    sth1,
    sth2,
    som1,
    som2,
    simTime,
    stepCount,
    lyapunovSum,
    lyapunovCount,
    trail,
    trailHead,
    trailLen,
  } = state;
  const tol = p.tolerance || 1e-8;
  const SHADOW_EPS = 1e-7;

  let currentTh1 = th1,
    currentTh2 = th2,
    currentOm1 = om1,
    currentOm2 = om2;
  let currentSth1 = sth1,
    currentSth2 = sth2,
    currentSom1 = som1,
    currentSom2 = som2;
  let currentSimTime = simTime;
  let currentStepCount = stepCount;
  let currentLyapunovSum = lyapunovSum;
  let currentLyapunovCount = lyapunovCount;

  let remaining = dt;
  let h = state.currentDt;
  const maxSteps = 200;
  let steps = 0;

  while (remaining > 1e-12 && steps < maxSteps) {
    h = Math.min(h, remaining);
    const result = rk45Step([currentTh1, currentTh2, currentOm1, currentOm2], h, derivs, p, tol);

    if (result.accepted) {
      [currentTh1, currentTh2, currentOm1, currentOm2] = result.state;
      const shadowNext = rk4([currentSth1, currentSth2, currentSom1, currentSom2], h, derivs, p);
      [currentSth1, currentSth2, currentSom1, currentSom2] = shadowNext;

      const dd = Math.sqrt(
        (currentTh1 - currentSth1) ** 2 +
          (currentTh2 - currentSth2) ** 2 +
          (currentOm1 - currentSom1) ** 2 +
          (currentOm2 - currentSom2) ** 2,
      );
      if (dd > 0 && currentSimTime > 0.1) {
        currentLyapunovSum += Math.log(dd / SHADOW_EPS);
        currentLyapunovCount++;
        const scale = SHADOW_EPS / dd;
        currentSth1 = currentTh1 + (currentSth1 - currentTh1) * scale;
        currentSth2 = currentTh2 + (currentSth2 - currentTh2) * scale;
        currentSom1 = currentOm1 + (currentSom1 - currentOm1) * scale;
        currentSom2 = currentOm2 + (currentSom2 - currentOm2) * scale;
      }

      remaining -= h;
      currentSimTime += h;
      currentStepCount++;
    }
    h = Math.max(1e-6, Math.min(result.hNew, 0.05));
    steps++;
  }

  // Update trail
  const trailCap = trail.length / 2;
  const x1 = p.l1 * Math.sin(currentTh1);
  const y1 = p.l1 * Math.cos(currentTh1);
  const x2 = x1 + p.l2 * Math.sin(currentTh2);
  const y2 = y1 + p.l2 * Math.cos(currentTh2);

  const nextTrail = new Float32Array(trail);
  nextTrail[trailHead * 2] = x2;
  nextTrail[trailHead * 2 + 1] = y2;
  const nextTrailHead = (trailHead + 1) % trailCap;
  const nextTrailLen = Math.min(trailLen + 1, trailCap);

  return {
    ...state,
    th1: currentTh1,
    th2: currentTh2,
    om1: currentOm1,
    om2: currentOm2,
    sth1: currentSth1,
    sth2: currentSth2,
    som1: currentSom1,
    som2: currentSom2,
    simTime: currentSimTime,
    stepCount: currentStepCount,
    lyapunovSum: currentLyapunovSum,
    lyapunovCount: currentLyapunovCount,
    currentDt: h,
    trail: nextTrail,
    trailHead: nextTrailHead,
    trailLen: nextTrailLen,
  };
}

export function render(ctx, state, p, canvas) {
  const W = canvas.width,
    H = canvas.height;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);

  const cx = W / 2 + (p.panX || 0);
  const cy = H * 0.28 + (p.panY || 0);
  const scale = p.viewScale ?? 1.0;
  const { th1, th2, trail, trailHead, trailLen } = state;
  const x1 = cx + p.l1 * scale * Math.sin(th1);
  const y1 = cy + p.l1 * scale * Math.cos(th1);
  const x2 = x1 + p.l2 * scale * Math.sin(th2);
  const y2 = y1 + p.l2 * scale * Math.cos(th2);

  // Trail
  if (trailLen > 1) {
    ctx.beginPath();
    const trailCap = trail.length / 2;
    for (let i = 0; i < trailLen; i++) {
      const idx = (trailHead - trailLen + i + trailCap) % trailCap;
      const tx = trail[idx * 2] * scale + cx;
      const ty = trail[idx * 2 + 1] * scale + cy;
      if (i === 0) ctx.moveTo(tx, ty);
      else ctx.lineTo(tx, ty);
    }
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)'; // Subtle red trail
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  // Arms
  ctx.lineCap = 'round';
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#475569';

  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(x1, y1);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  // Pivot
  ctx.beginPath();
  ctx.arc(cx, cy, 4, 0, Math.PI * 2);
  ctx.fillStyle = '#1e293b';
  ctx.fill();

  // Bobs
  const r1 = 8 + Math.sqrt(p.m1) * 4;
  const r2 = 8 + Math.sqrt(p.m2) * 4;

  // Bob 1
  ctx.beginPath();
  ctx.arc(x1, y1, r1, 0, Math.PI * 2);
  ctx.fillStyle = '#3b82f6';
  ctx.fill();
  ctx.strokeStyle = state.dragTarget === 'bob1' ? '#1e293b' : '#2563eb';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Bob 2
  ctx.beginPath();
  ctx.arc(x2, y2, r2, 0, Math.PI * 2);
  ctx.fillStyle = '#10b981';
  ctx.fill();
  ctx.strokeStyle = state.dragTarget === 'bob2' ? '#1e293b' : '#059669';
  ctx.lineWidth = 2;
  ctx.stroke();
}

export function getData(state, p) {
  const H = hamiltonian(state.th1, state.th2, state.om1, state.om2, p);
  return {
    time: state.simTime,
    theta1: state.th1,
    theta2: state.th2,
    omega1: state.om1,
    omega2: state.om2,
    energy: H,
    totalEnergy: H,
    energyError: state.H0 !== 0 ? (H - state.H0) / Math.abs(state.H0) : 0,
    dt: state.currentDt,
    steps: state.stepCount,
    lyapunov:
      state.lyapunovCount > 0 ? state.lyapunovSum / (state.lyapunovCount * state.simTime) : 0,
  };
}

// ── Legacy Compatibility Layer ──────────────────────────────────────────────
export function create(canvas, initParams = {}) {
  const ctx = canvas.getContext('2d');
  let p = { ...DEFAULTS, ...initParams };
  let state = init(p);

  function tick(dt) {
    state = update(state, dt, p);
  }

  function draw() {
    render(ctx, state, p, canvas);
  }

  let rafId,
    lastTs,
    running = false;
  let speedScale = 1;

  function handlePointerDown(e) {
    const rect = canvas.getBoundingClientRect();
    const hitX = e.clientX - rect.left;
    const hitY = e.clientY - rect.top;

    const W = canvas.width;
    const H = canvas.height;
    const cx = W / 2 + (p.panX || 0);
    const cy = H * 0.28 + (p.panY || 0);
    const scale = p.viewScale ?? 1.0;

    const x1 = cx + p.l1 * scale * Math.sin(state.th1);
    const y1 = cy + p.l1 * scale * Math.cos(state.th1);
    const x2 = x1 + p.l2 * scale * Math.sin(state.th2);
    const y2 = y1 + p.l2 * scale * Math.cos(state.th2);

    const r1 = 9 + Math.sqrt(p.m1) * 4;
    const r2 = 9 + Math.sqrt(p.m2) * 4;

    if (Math.hypot(hitX - x2, hitY - y2) <= r2 + 15) {
      state.dragTarget = 'bob2';
    } else if (Math.hypot(hitX - x1, hitY - y1) <= r1 + 15) {
      state.dragTarget = 'bob1';
    }

    if (state.dragTarget) {
      state.om1 = 0;
      state.om2 = 0;
      state.trailLen = 0; // clear trail
      draw();
    }
  }

  function handlePointerMove(e) {
    if (!state.dragTarget) return;
    const rect = canvas.getBoundingClientRect();
    const hitX = e.clientX - rect.left;
    const hitY = e.clientY - rect.top;

    const W = canvas.width;
    const H = canvas.height;
    const cx = W / 2 + (p.panX || 0);
    const cy = H * 0.28 + (p.panY || 0);
    const scale = p.viewScale ?? 1.0;

    if (state.dragTarget === 'bob1') {
      const dx = hitX - cx;
      const dy = hitY - cy;
      state.th1 = Math.atan2(dx, dy);
    } else if (state.dragTarget === 'bob2') {
      const x1 = cx + p.l1 * scale * Math.sin(state.th1);
      const y1 = cy + p.l1 * scale * Math.cos(state.th1);
      const dx = hitX - x1;
      const dy = hitY - y1;
      state.th2 = Math.atan2(dx, dy);
    }

    state.om1 = 0;
    state.om2 = 0;
    state.trailLen = 0;
    draw();
  }

  function handlePointerUp() {
    if (state.dragTarget) {
      p.theta1 = state.th1;
      p.theta2 = state.th2;
      p.omega1 = 0;
      p.omega2 = 0;
      state.H0 = hamiltonian(state.th1, state.th2, 0, 0, p);
    }
    state.dragTarget = null;
    draw();
  }

  canvas.addEventListener('pointerdown', handlePointerDown);
  window.addEventListener('pointermove', handlePointerMove);
  window.addEventListener('pointerup', handlePointerUp);

  function loop(ts) {
    if (!running) return;
    const dt = lastTs === undefined ? 1 / 60 : Math.min((ts - lastTs) / 1000, 1 / 20);
    lastTs = ts;
    if (!state.dragTarget) {
      tick(dt * speedScale);
    }
    draw();
    rafId = requestAnimationFrame(loop);
  }

  draw();

  return {
    start() {
      if (running) return;
      running = true;
      lastTs = undefined;
      rafId = requestAnimationFrame(loop);
    },
    stop() {
      running = false;
      cancelAnimationFrame(rafId);
    },
    reset() {
      this.stop();
      state = init(p);
      draw();
      this.start();
    },
    setParams(next) {
      Object.assign(p, next);
      draw();
    },
    setSpeed(s) {
      speedScale = s;
    },
    destroy() {
      this.stop();
      canvas.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    },
    getData() {
      return getData(state, p);
    },
  };
}
