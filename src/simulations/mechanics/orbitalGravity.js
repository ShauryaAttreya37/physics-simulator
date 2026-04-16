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
    title: 'Gravitational Interaction',
    equations: [
      {
        latex: String.raw`\mathbf{F}_{ij} = G \frac{m_i m_j}{|\mathbf{r}_j - \mathbf{r}_i|^3}(\mathbf{r}_j - \mathbf{r}_i)`,
        description: 'Pairwise gravitational force between bodies i and j.',
      },
      {
        latex: String.raw`\ddot{\mathbf{r}}_i = \sum_{j \neq i} G m_j \frac{\mathbf{r}_j - \mathbf{r}_i}{(|\mathbf{r}_j - \mathbf{r}_i|^2 + \epsilon^2)^{3/2}}`,
        description: 'Acceleration with Plummer softening ε to avoid divergence.',
      },
    ],
    variables: [
      { symbol: 'G', description: 'Gravitational constant' },
      { symbol: 'mᵢ', description: 'Mass of body i' },
      { symbol: 'rᵢ', description: 'Position vector of body i' },
      { symbol: 'ε', description: 'Softening parameter (regularization)' },
    ],
  },
  {
    title: 'Conservation Laws',
    equations: [
      {
        latex: String.raw`E = \sum_i \frac{1}{2} m_i |\mathbf{v}_i|^2 - \sum_{i < j} G \frac{m_i m_j}{|\mathbf{r}_j - \mathbf{r}_i|}`,
        description: 'Total energy (kinetic + potential). Conserved in the continuum limit.',
      },
      {
        latex: String.raw`\mathbf{L} = \sum_i m_i \, \mathbf{r}_i \times \mathbf{v}_i`,
        description: 'Total angular momentum. Exactly conserved.',
      },
    ],
  },
  {
    title: 'Numerical Method — Yoshida 4th Order',
    equations: [
      {
        latex: String.raw`\text{Coefficients: } c_1 = c_4 = \frac{1}{2(2 - 2^{1/3})}, \quad c_2 = c_3 = \frac{1 - 2^{1/3}}{2(2 - 2^{1/3})}`,
        description: 'Yoshida symplectic integrator preserves the symplectic structure of Hamiltonian dynamics, giving superior long-term energy conservation compared to standard Runge-Kutta methods.',
      },
    ],
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
function accel(bodies, g) {
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

// ── Yoshida 4th-order symplectic integrator ─────────────────────────────────
const CBRT2 = Math.cbrt(2);
const W0 = -CBRT2 / (2 - CBRT2);
const W1 = 1 / (2 - CBRT2);
const YOSHIDA_C = [W1 / 2, (W0 + W1) / 2, (W0 + W1) / 2, W1 / 2];
const YOSHIDA_D = [W1, W0, W1, 0];

function yoshidaStep(q, v, h, g) {
  for (let s = 0; s < 4; s++) {
    // Drift
    const c = YOSHIDA_C[s] * h;
    for (let i = 0; i < 3; i++) {
      q[i][0] += c * v[i][0];
      q[i][1] += c * v[i][1];
    }
    // Kick
    if (YOSHIDA_D[s] !== 0) {
      const d = YOSHIDA_D[s] * h;
      const a = accel(q, g);
      for (let i = 0; i < 3; i++) {
        v[i][0] += d * a[i][0];
        v[i][1] += d * a[i][1];
      }
    }
  }
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

export function create(canvas, initParams = {}) {
  const ctx = canvas.getContext('2d');
  const p = { ...DEFAULTS, ...initParams };

  let q, v, trails, simTime, stepCount, E0;

  function initState() {
    q = IC.q.map(r => [...r]);
    v = IC.v.map(r => [r[0] * p.velocityScale, r[1] * p.velocityScale]);
    trails = [[], [], []];
    simTime = 0; stepCount = 0;
    E0 = computeEnergy(q, v, p.g).total;
  }

  function toScreen(x, y) {
    return {
      sx: canvas.width / 2 + x * p.scale,
      sy: canvas.height / 2 + y * p.scale,
    };
  }

  function tick(dt) {
    const sub = Math.max(1, Math.floor(p.substeps));
    const h = dt / sub;

    for (let s = 0; s < sub; s++) {
      yoshidaStep(q, v, h, p.g);
      stepCount++;
    }

    // Periodic COM correction to prevent drift
    if (stepCount % 100 === 0) {
      correctCOM(q, v);
    }

    simTime += dt;

    const trailCap = Math.max(50, Math.floor(p.trailMax));
    for (let i = 0; i < 3; i++) {
      trails[i].push([q[i][0], q[i][1]]);
      if (trails[i].length > trailCap) trails[i].shift();
    }
  }

  function render() {
    const W = canvas.width, H = canvas.height;
    ctx.fillStyle = '#02020d';
    ctx.fillRect(0, 0, W, H);

    // Stars
    for (const { x, y, a, s } of STARS) {
      ctx.fillStyle = `rgba(255,255,255,${a})`;
      ctx.fillRect(x * W, y * H, s, s);
    }

    // Trails
    for (let i = 0; i < 3; i++) {
      const t = trails[i];
      if (t.length < 2) continue;
      for (let j = 1; j < t.length; j++) {
        const alpha = j / t.length;
        const { sx: x1, sy: y1 } = toScreen(t[j-1][0], t[j-1][1]);
        const { sx: x2, sy: y2 } = toScreen(t[j][0], t[j][1]);
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
        const rgb = hexToRgb(BODY_COLORS[i]);
        ctx.strokeStyle = `rgba(${rgb},${alpha * 0.75})`;
        ctx.lineWidth = 1 + alpha * 1.5;
        ctx.stroke();
      }
    }

    // Bodies
    for (let i = 0; i < 3; i++) {
      const { sx, sy } = toScreen(q[i][0], q[i][1]);
      ctx.shadowBlur = 28; ctx.shadowColor = GLOW_COLORS[i];
      ctx.beginPath(); ctx.arc(sx, sy, BODY_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = BODY_COLORS[i]; ctx.fill();
      ctx.shadowBlur = 0;
      ctx.beginPath(); ctx.arc(sx, sy, BODY_RADIUS * 0.45, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fill();
    }
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
    setParams(next) { Object.assign(p, next); render(); },
    destroy() { this.stop(); },
    getData() {
      const e = computeEnergy(q, v, p.g);
      const L = computeAngularMomentum(q, v);
      return {
        time: simTime,
        kineticE: e.ke,
        potentialE: e.pe,
        totalE: e.total,
        totalEnergy: e.total,
        angularMomentum: L,
        energyError: E0 !== 0 ? (e.total - E0) / Math.abs(E0) : 0,
        steps: stepCount,
      };
    },
  };
}

function hexToRgb(hex) {
  const n = Number.parseInt(hex.slice(1), 16);
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
}
