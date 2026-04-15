/**
 * Spring Pendulum (Elastic Pendulum)
 * 
 * A pendulum where the rod is replaced by a spring.
 * Exhibits interesting energy exchange between radial and angular modes.
 */

const DEFAULTS = {
  mass: 1.0,
  gravity: 9.81,
  springK: 50,
  restLength: 1.5,
  damping: 0.1,
  r0: 1.5,
  theta0: 0.8,
  dr0: 0,
  dtheta0: 0,
  trailMax: 600,
};

export const defaultParams = { ...DEFAULTS };

export const equationSections = [
  {
    title: 'Equations of Motion',
    equations: [
      {
        latex: String.raw`\ddot{r} = r\dot{\theta}^2 - \frac{k}{m}(r - L_0) + g\cos\theta - c\dot{r}`,
        description: 'Radial acceleration: centripetal force + spring force + gravity component + damping.',
      },
      {
        latex: String.raw`\ddot{\theta} = -\frac{g}{r}\sin\theta - \frac{2\dot{r}\dot{\theta}}{r} - c\dot{\theta}`,
        description: 'Angular acceleration: gravity component + Coriolis force + damping.',
      },
    ],
    variables: [
      { symbol: 'r', description: 'Radial distance from pivot' },
      { symbol: 'θ', description: 'Angle from vertical' },
      { symbol: 'L₀', description: 'Spring rest length' },
      { symbol: 'k', description: 'Spring constant' },
      { symbol: 'c', description: 'Damping coefficient' },
    ],
  },
  {
    title: 'Energy',
    equations: [
      {
        latex: String.raw`E = \frac{1}{2}m(\dot{r}^2 + r^2\dot{\theta}^2) + \frac{1}{2}k(r-L_0)^2 - mgr\cos\theta`,
        description: 'Total energy: Kinetic + Elastic Potential + Gravitational Potential.',
      },
    ],
  },
];

export const equations = [
  String.raw`\ddot{r} = r\dot{\theta}^2 - \frac{k}{m}(r - L_0) + g\cos\theta`,
  String.raw`\ddot{\theta} = -\frac{g}{r}\sin\theta - \frac{2\dot{r}\dot{\theta}}{r}`,
];

export const graphParams = [
  { key: 'r', label: 'r [m]' },
  { key: 'theta', label: 'θ [rad]' },
  { key: 'energy', label: 'E [J]' },
];

export const controls = [
  { key: 'mass', label: 'Mass m [kg]', min: 0.1, max: 5, step: 0.1 },
  { key: 'springK', label: 'Spring k [N/m]', min: 5, max: 200, step: 1 },
  { key: 'restLength', label: 'Rest Length L₀ [m]', min: 0.5, max: 3, step: 0.1 },
  { key: 'gravity', label: 'Gravity g [m/s²]', min: 0, max: 20, step: 0.1 },
  { key: 'damping', label: 'Damping c', min: 0, max: 2, step: 0.01 },
  { key: 'r0', label: 'Initial r [m]', min: 0.5, max: 4, step: 0.1 },
  { key: 'theta0', label: 'Initial θ [rad]', min: -3.14, max: 3.14, step: 0.01 },
];

export const method = 'rk4';

export const scenarios = [
  {
    name: 'Standard Oscillation',
    description: 'Moderate spring stiffness and initial angle.',
    params: { ...DEFAULTS },
  },
  {
    name: 'Energy Exchange',
    description: 'At specific parameters, energy swaps completely between swinging and bouncing.',
    params: { mass: 1.0, springK: 40, restLength: 1.5, r0: 1.7, theta0: 0.2, gravity: 9.81, damping: 0.02 },
  },
  {
    name: 'Stiff Spring',
    description: 'High k makes it behave more like a simple pendulum.',
    params: { ...DEFAULTS, springK: 200 },
  },
  {
    name: 'Chaos',
    description: 'Large amplitudes lead to chaotic motion.',
    params: { ...DEFAULTS, theta0: 2.5, springK: 30, damping: 0 },
  },
];

export function create(canvas, initParams = {}) {
  const ctx = canvas.getContext('2d');
  const p = { ...DEFAULTS, ...initParams };

  let r, theta, dr, dtheta, simTime;
  let trail = [];

  function initState() {
    r = p.r0;
    theta = p.theta0;
    dr = p.dr0;
    dtheta = p.dtheta0;
    simTime = 0;
    trail = [];
  }

  function derivs(state) {
    const [r, theta, dr, dtheta] = state;
    const ddr = r * dtheta * dtheta - (p.springK / p.mass) * (r - p.restLength) + p.gravity * Math.cos(theta) - p.damping * dr;
    const ddtheta = -(p.gravity / r) * Math.sin(theta) - (2 * dr * dtheta) / r - p.damping * dtheta;
    return [dr, dtheta, ddr, ddtheta];
  }

  function rk4Step(state, h) {
    const k1 = derivs(state);
    const k2 = derivs(state.map((v, i) => v + k1[i] * h / 2));
    const k3 = derivs(state.map((v, i) => v + k2[i] * h / 2));
    const k4 = derivs(state.map((v, i) => v + k3[i] * h));
    return state.map((v, i) => v + (h / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
  }

  function tick(dt) {
    const steps = 15;
    const h = dt / steps;
    let state = [r, theta, dr, dtheta];
    for (let i = 0; i < steps; i++) {
      state = rk4Step(state, h);
    }
    [r, theta, dr, dtheta] = state;
    simTime += dt;

    const x = r * Math.sin(theta);
    const y = r * Math.cos(theta);
    trail.push({ x, y });
    if (trail.length > p.trailMax) trail.shift();
  }

  function render() {
    const W = canvas.width, H = canvas.height;
    ctx.fillStyle = '#0B0F14';
    ctx.fillRect(0, 0, W, H);

    const centerX = W / 2;
    const centerY = H * 0.2;
    const scale = Math.min(W, H) * 0.15;

    // Draw Trail
    if (trail.length > 2) {
      ctx.beginPath();
      for (let i = 0; i < trail.length; i++) {
        const tx = centerX + trail[i].x * scale;
        const ty = centerY + trail[i].y * scale;
        if (i === 0) ctx.moveTo(tx, ty);
        else ctx.lineTo(tx, ty);
      }
      ctx.strokeStyle = 'rgba(96, 165, 250, 0.3)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    const x = r * Math.sin(theta);
    const y = r * Math.cos(theta);
    const px = centerX + x * scale;
    const py = centerY + y * scale;

    // Draw Spring
    const coils = 15;
    const springWidth = 10;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    for (let i = 0; i <= coils * 2; i++) {
      const t = i / (coils * 2);
      const curX = centerX + x * scale * t;
      const curY = centerY + y * scale * t;
      const perpX = -Math.cos(theta);
      const perpY = Math.sin(theta);
      const offset = (i % 2 === 0 ? 1 : -1) * springWidth;
      if (i > 0 && i < coils * 2) {
        ctx.lineTo(curX + perpX * offset, curY + perpY * offset);
      } else {
        ctx.lineTo(curX, curY);
      }
    }
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw Pivot
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 5, 0, Math.PI * 2);
    ctx.fill();

    // Draw Mass
    ctx.shadowBlur = 15;
    ctx.shadowColor = 'rgba(96, 165, 250, 0.6)';
    ctx.fillStyle = '#60a5fa';
    ctx.beginPath();
    ctx.arc(px, py, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
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
      const kinetic = 0.5 * p.mass * (dr * dr + r * r * dtheta * dtheta);
      const elastic = 0.5 * p.springK * (r - p.restLength) ** 2;
      const potential = -p.mass * p.gravity * r * Math.cos(theta);
      return {
        time: simTime,
        r, theta,
        energy: kinetic + elastic + potential,
      };
    },
  };
}
