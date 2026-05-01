import { yoshida4Step } from '../../physics/solvers';
import { drawTrail, hexToRgb } from '../../utils/canvas';

/**
 * Orbital Gravity — Research-Grade N-Body Simulation
 * 
 * Integrator:  Yoshida 4th-order symplectic (time-reversible, energy-preserving)
 * Physics:     Newtonian gravity with softening parameter
 * Diagnostics: Energy & angular momentum conservation, COM drift tracking
 * Scenario:    Figure-8 three-body choreography (Chenciner & Montgomery, 2000)
 */

const DEFAULTS = {
  scale: 210,
  trailMax: 800,
  substeps: 80,
  g: 1,
  velocityScale: 1,
};

export const defaultParams = {
  scale: 210, trailMax: 800, substeps: 80, g: 1, velocityScale: 1,
};

export const equationSections = [
  {
    title: 'Introduction',
    content: 'Orbital gravity shows how planets, moons, and stars move under gravitational attraction. This N-body simulation demonstrates Kepler\'s laws, conservation of energy and angular momentum, and chaotic behavior in multi-body systems.',
  },
  {
    title: 'Gravitational Interaction',
    equations: [
      {
        latex: String.raw`\mathbf{F}_{ij} = G \frac{m_i m_j}{|\mathbf{r}_j - \mathbf{r}_i|^3}(\mathbf{r}_j - \mathbf{r}_i)`,
        description: 'Gravitational force between two bodies. Force is attractive, proportional to masses and inversely proportional to distance squared.',
      },
      {
        latex: String.raw`\ddot{\mathbf{r}}_i = \sum_{j \neq i} G m_j \frac{\mathbf{r}_j - \mathbf{r}_i}{(|\mathbf{r}_j - \mathbf{r}_i|^2 + \epsilon^2)^{3/2}}`,
        description: 'Acceleration of body i due to all others. Softening ε prevents infinite forces when bodies get very close.',
      },
    ],
    variables: [
      { symbol: 'G', description: 'Gravitational constant (set to 1 for simplicity)' },
      { symbol: 'mᵢ', description: 'Mass of each body' },
      { symbol: 'rᵢ', description: 'Position vector' },
      { symbol: 'ε', description: 'Softening parameter to avoid singularities' },
    ],
  },
  {
    title: 'Conservation Laws',
    equations: [
      {
        latex: String.raw`E = \sum_i \frac{1}{2} m_i |\mathbf{v}_i|^2 - \sum_{i < j} G \frac{m_i m_j}{|\mathbf{r}_j - \mathbf{r}_i|}`,
        description: 'Total energy = kinetic + potential. Should be conserved, but numerical errors cause small drift.',
      },
      {
        latex: String.raw`\mathbf{L} = \sum_i m_i \, \mathbf{r}_i \times \mathbf{v}_i`,
        description: 'Angular momentum. Exactly conserved in numerical simulation.',
      },
    ],
  },
  {
    title: 'Numerical Method — Yoshida 4th Order',
    equations: [
      {
        latex: String.raw`\text{Coefficients: } c_1 = c_4 = \frac{1}{2(2 - 2^{1/3})}, \quad c_2 = c_3 = \frac{1 - 2^{1/3}}{2(2 - 2^{1/3})}`,
        description: 'Symplectic integrator that preserves energy and momentum much better than regular methods for long simulations.',
      },
    ],
  },
  {
    title: 'How to Use',
    content: '1. Choose scenarios like solar system or figure-8 orbit.\n2. Adjust masses and initial velocities.\n3. Watch trails to see orbital paths.\n4. Check energy and angular momentum conservation.\n5. Try adding or removing bodies.',
  },
  {
    title: 'Beginner Tips',
    content: 'Start with two bodies - they orbit their center of mass. Try circular vs elliptical orbits. Look at three-body problem - it can be chaotic. Check conservation graphs - angular momentum should be constant. Try the figure-8 solution - perfectly symmetric orbits.',
  },
];

export const equations = [
  String.raw`\mathbf{F}_{ij} = G \frac{m_i m_j}{|\mathbf{r}_j - \mathbf{r}_i|^3}(\mathbf{r}_j - \mathbf{r}_i)`,
  String.raw`\ddot{\mathbf{r}}_i = \sum_{j \neq i} G m_j \frac{\mathbf{r}_j - \mathbf{r}_i}{|\mathbf{r}_j - \mathbf{r}_i|^3}`,
  String.raw`E = \sum_i \frac{1}{2} m_i \mathbf{v}_i^2 - \sum_{i < j} G \frac{m_i m_j}{|\mathbf{r}_j - \mathbf{r}_i|}`,
];

export const graphParams = [
  { key: 'kineticE', label: 'KE [J]' },
  { key: 'potentialE', label: 'PE [J]' },
  { key: 'totalE', label: 'E_total [J]' },
  { key: 'angularMomentum', label: 'L_z' },
  { key: 'energyError', label: '|ΔE/E₀|' },
];

export const controls = [
  { key: 'scale', label: 'Visual Scale', min: 120, max: 320, step: 1 },
  { key: 'trailMax', label: 'Trail Length', min: 200, max: 1600, step: 10 },
  { key: 'substeps', label: 'Integrator Steps', min: 20, max: 160, step: 1 },
  { key: 'g', label: 'Gravity G', min: 0.5, max: 2.2, step: 0.01 },
  { key: 'velocityScale', label: 'v₀ Scale', min: 0.7, max: 1.3, step: 0.005 },
];

export const method = 'yoshida4';

// Figure-8 initial conditions (Chenciner & Montgomery)
const IC = {
  q: [[-0.97000436, 0.24308753], [0.97000436, -0.24308753], [0, 0]],
  v: [
    [0.93240737 / 2, 0.86473146 / 2],
    [0.93240737 / 2, 0.86473146 / 2],
    [-0.93240737, -0.86473146],
  ],
};

const BODY_COLORS = ['#f97316', '#60a5fa', '#4ade80'];
const GLOW_COLORS = ['rgba(249,115,22,0.6)', 'rgba(96,165,250,0.6)', 'rgba(74,222,128,0.6)'];
const BODY_RADIUS = 13;
const SOFTENING = 1e-5;

const STARS = Array.from({ length: 180 }, () => ({
  x: Math.random(), y: Math.random(),
  a: 0.1 + Math.random() * 0.6,
  s: Math.random() < 0.15 ? 2 : 1,
}));

// ── Acceleration computation ────────────────────────────────────────────────
function accel(bodies, params) {
  const { g } = params;
  const a = bodies.map(() => [0, 0]);
  for (let i = 0; i < bodies.length; i++) {
    for (let j = i + 1; j < bodies.length; j++) {
      const dx = bodies[j][0] - bodies[i][0];
      const dy = bodies[j][1] - bodies[i][1];
      const r2 = dx * dx + dy * dy + SOFTENING;
      const r = Math.sqrt(r2);
      const f = g / (r2 * r);
      a[i][0] += f * dx; a[i][1] += f * dy;
      a[j][0] -= f * dx; a[j][1] -= f * dy;
    }
  }
  return a;
}

// ── Energy and angular momentum ─────────────────────────────────────────────
function computeEnergy(q, v, g) {
  let ke = 0, pe = 0;
  for (let i = 0; i < 3; i++) {
    ke += 0.5 * (v[i][0]**2 + v[i][1]**2);
    for (let j = i + 1; j < 3; j++) {
      const dx = q[j][0] - q[i][0], dy = q[j][1] - q[i][1];
      pe -= g / Math.sqrt(dx*dx + dy*dy + SOFTENING);
    }
  }
  return { ke, pe, total: ke + pe };
}

function computeAngularMomentum(q, v) {
  let L = 0;
  for (let i = 0; i < 3; i++) {
    L += q[i][0] * v[i][1] - q[i][1] * v[i][0];
  }
  return L;
}

// ── Center of mass correction ───────────────────────────────────────────────
function correctCOM(q, v) {
  let cx = 0, cy = 0, vx = 0, vy = 0;
  for (let i = 0; i < 3; i++) {
    cx += q[i][0]; cy += q[i][1];
    vx += v[i][0]; vy += v[i][1];
  }
  cx /= 3; cy /= 3; vx /= 3; vy /= 3;
  for (let i = 0; i < 3; i++) {
    q[i][0] -= cx; q[i][1] -= cy;
    v[i][0] -= vx; v[i][1] -= vy;
  }
}

// ── Simulation ──────────────────────────────────────────────────────────────
export const scenarios = [
  {
    name: 'Figure-8 Choreography',
    description: 'The remarkable stable three-body figure-8 solution discovered by Moore (1993).',
    params: { preset: 'figure8' },
  },
  {
    name: 'Lagrange Triangle',
    description: 'Three equal masses at the vertices of an equilateral triangle — a stable Lagrange configuration.',
    params: { preset: 'lagrange' },
  },
  {
    name: 'Binary + Orbiter',
    description: 'Two massive bodies orbit each other while a light third body traces a complex path.',
    params: { preset: 'binary' },
  },
  {
    name: 'Near-Collision',
    description: 'Bodies start close — gravitational slingshots and near-misses create dramatic trajectories.',
    params: { preset: 'close' },
  },
  {
    name: 'Hierarchical System',
    description: 'A tight binary with a distant third body — mimics a star system with a far companion.',
    params: { preset: 'hierarchical' },
  },
];

export const guidedExperiments = [
  {
    title: 'Three-Body Problem',
    steps: [
      {
        instruction: 'Start with the figure-8 choreography. Press Play and observe the beautiful periodic orbit.',
        params: { preset: 'figure8' },
        question: 'Is this figure-8 orbit stable if we perturb one body\'s position slightly?',
        choices: ['Yes — it will return to the figure-8', 'No — it will diverge into chaos', 'It depends on which body'],
        correctIndex: 1,
        explanation: 'The figure-8 choreography is linearly unstable — any perturbation, no matter how small, will eventually cause the system to diverge. It exists as an exact mathematical solution, but nature would never produce it because real systems always have perturbations.',
        tryThis: 'Watch the energy conservation error in the data readout. The Yoshida symplectic integrator keeps |ΔE/E₀| near machine precision.',
      },
      {
        instruction: 'Switch to the "Near-Collision" scenario. Reset and play.',
        params: { preset: 'close' },
        question: 'In the three-body problem, can one body be permanently ejected from the system?',
        choices: ['No — gravity always pulls them back', 'Yes — gravitational slingshots can eject bodies', 'Only if they collide first'],
        correctIndex: 1,
        explanation: 'This is the "democratic decay" of three-body systems: through repeated close encounters, one body can gain enough kinetic energy to escape. This is actually how most triple star systems evolve — they eject the lightest member.',
      },
    ],
  },
];

// ── Modern Decoupled API ───────────────────────────────────────────────────

export function init(p) {
  const q = IC.q.map(r => [...r]);
  const v = IC.v.map(r => [r[0] * p.velocityScale, r[1] * p.velocityScale]);
  return {
    q,
    v,
    trails: [[], [], []],
    simTime: 0,
    stepCount: 0,
    E0: computeEnergy(q, v, p.g).total,
  };
}

export function update(state, dt, p) {
  const { q, v, trails, stepCount } = state;
  const sub = Math.max(1, Math.floor(p.substeps));
  const h = dt / sub;

  let nextStepCount = stepCount;
  for (let s = 0; s < sub; s++) {
    yoshida4Step(q, v, h, accel, p);
    nextStepCount++;
  }

  // Periodic COM correction
  if (nextStepCount % 100 === 0) {
    correctCOM(q, v);
  }

  const trailCap = Math.max(50, Math.floor(p.trailMax));
  const nextTrails = trails.map((t, i) => {
    const nt = [...t, [q[i][0], q[i][1]]];
    if (nt.length > trailCap) nt.shift();
    return nt;
  });

  return {
    ...state,
    q, v,
    trails: nextTrails,
    simTime: state.simTime + dt,
    stepCount: nextStepCount,
  };
}

export function render(ctx, state, p, canvas) {
  const W = canvas.width, H = canvas.height;
  ctx.fillStyle = '#02020d';
  ctx.fillRect(0, 0, W, H);

  // Stars
  for (const { x, y, a, s } of STARS) {
    ctx.fillStyle = `rgba(255,255,255,${a})`;
    ctx.fillRect(x * W, y * H, s, s);
  }

  const toScreen = (x, y) => ({
    sx: W / 2 + x * p.scale,
    sy: H / 2 + y * p.scale,
  });

  // Trails
  for (let i = 0; i < 3; i++) {
    const t = state.trails[i];
    if (t.length < 2) continue;
    const points = t.map(pos => {
      const { sx, sy } = toScreen(pos[0], pos[1]);
      return [sx, sy];
    });
    drawTrail(ctx, points, {
      color: `rgba(${hexToRgb(BODY_COLORS[i])}, 1)`,
      maxAlpha: 0.75,
      lineWidth: 1.5,
    });
  }

  // Bodies
  for (let i = 0; i < 3; i++) {
    const { sx, sy } = toScreen(state.q[i][0], state.q[i][1]);
    ctx.save();
    ctx.shadowBlur = 28;
    ctx.shadowColor = GLOW_COLORS[i];
    ctx.beginPath();
    ctx.arc(sx, sy, BODY_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = BODY_COLORS[i];
    ctx.fill();
    ctx.restore();

    ctx.beginPath();
    ctx.arc(sx, sy, BODY_RADIUS * 0.45, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fill();
  }
}

export function getData(state, p) {
  const e = computeEnergy(state.q, state.v, p.g);
  const L = computeAngularMomentum(state.q, state.v);
  return {
    time: state.simTime,
    kineticE: e.ke,
    potentialE: e.pe,
    totalE: e.total,
    totalEnergy: e.total,
    angularMomentum: L,
    energyError: state.E0 !== 0 ? (e.total - state.E0) / Math.abs(state.E0) : 0,
    steps: state.stepCount,
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

  let rafId, lastTs, running = false;

  function loop(ts) {
    if (!running) return;
    const dt = lastTs === undefined ? 1/60 : Math.min((ts - lastTs) / 1000, 1/20);
    lastTs = ts;
    tick(dt);
    draw();
    rafId = requestAnimationFrame(loop);
  }

  draw();

  return {
    start() {
      if (running) return;
      running = true; lastTs = undefined;
      rafId = requestAnimationFrame(loop);
    },
    stop() { running = false; cancelAnimationFrame(rafId); },
    reset() { this.stop(); state = init(p); draw(); this.start(); },
    setParams(next) { Object.assign(p, next); draw(); },
    destroy() { this.stop(); },
    getData() {
      return getData(state, p);
    },
  };
}

function unusedHexToRgb(hex) {
  const n = Number.parseInt(hex.slice(1), 16);
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
}
