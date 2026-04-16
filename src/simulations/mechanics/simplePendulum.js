/**
 * Simple Pendulum (Nonlinear)
 * 
 * Demonstrates the dynamics of a single mass on a rigid rod.
 * Features large-angle accuracy (no small-angle approximation) and phase space.
 */

const DEFAULTS = {
  length: 2.0,
  mass: 1.0,
  gravity: 9.81,
  damping: 0.1,
  theta0: 0.785, // 45 degrees
  omega0: 0,
  trailMax: 500,
};

export const defaultParams = { ...DEFAULTS };

export const equationSections = [
  {
    title: 'Equation of Motion',
    equations: [
      {
        latex: String.raw`\ddot{\theta} + \frac{g}{L}\sin\theta + \frac{c}{mL^2}\dot{\theta} = 0`,
        description: 'Second-order nonlinear ODE for a damped pendulum.',
      },
      {
        latex: String.raw`T \approx 2\pi\sqrt{\frac{L}{g}} \left(1 + \frac{1}{16}\theta_0^2 + \dots\right)`,
        description: 'Period for large angles (approaches 2π√(L/g) for small angles).',
      },
    ],
    variables: [
      { symbol: 'L', description: 'Rod length' },
      { symbol: 'm', description: 'Bob mass' },
      { symbol: 'g', description: 'Gravitational acceleration' },
      { symbol: 'c', description: 'Damping (friction) coefficient' },
    ],
  },
  {
    title: 'Energy Conservation',
    equations: [
      {
        latex: String.raw`E = K + U = \frac{1}{2}mL^2\dot{\theta}^2 + mgL(1 - \cos\theta)`,
        description: 'Total mechanical energy (Kinetic + Gravitational Potential).',
      },
    ],
  },
];

export const equations = [
  String.raw`\ddot{\theta} = -\frac{g}{L}\sin\theta - \frac{c}{mL^2}\dot{\theta}`,
  String.raw`E = \frac{1}{2}mv^2 + mgh`,
];

export const graphParams = [
  { key: 'theta', label: 'Angle θ [rad]' },
  { key: 'omega', label: 'Velocity ω [rad/s]' },
  { key: 'energy', label: 'Total Energy E [J]' },
];

export const controls = [
  { key: 'length', label: 'Length L [m]', min: 0.5, max: 4, step: 0.1 },
  { key: 'mass', label: 'Mass m [kg]', min: 0.1, max: 5, step: 0.1 },
  { key: 'gravity', label: 'Gravity g [m/s²]', min: 0, max: 25, step: 0.1 },
  { key: 'damping', label: 'Damping c', min: 0, max: 2, step: 0.01 },
  { key: 'theta0', label: 'Initial θ [rad]', min: -3.14, max: 3.14, step: 0.01 },
];

export const method = 'rk4';

export const scenarios = [
  {
    name: 'Small Angle (SHM)',
    description: 'Theta < 0.2 rad. Behaves nearly like a simple harmonic oscillator.',
    params: { ...DEFAULTS, theta0: 0.1 },
  },
  {
    name: 'Large Angle',
    description: 'Notice the period lengthening as the angle increases.',
    params: { ...DEFAULTS, theta0: 2.8 },
  },
  {
    name: 'Lunar Gravity',
    description: 'A much slower swing on the Moon (g = 1.62 m/s²).',
    params: { ...DEFAULTS, gravity: 1.62 },
  },
  {
    name: 'Over-the-Top',
    description: 'Give it high initial velocity to loop around.',
    params: { ...DEFAULTS, theta0: 0, omega0: 8, damping: 0.02 },
  },
];

export function create(canvas, initParams = {}) {
  const ctx = canvas.getContext('2d');
  const p = { ...DEFAULTS, ...initParams };

  let theta, omega, simTime;
  let trail = [];

  function initState() {
    theta = p.theta0;
    omega = p.omega0 || 0;
    simTime = 0;
    trail = [];
  }

  function derivs(state) {
    const [th, om] = state;
    const dom = -(p.gravity / p.length) * Math.sin(th) - (p.damping / (p.mass * p.length * p.length)) * om;
    return [om, dom];
  }

  function rk4Step(state, h) {
    const k1 = derivs(state);
    const k2 = derivs(state.map((v, i) => v + k1[i] * h / 2));
    const k3 = derivs(state.map((v, i) => v + k2[i] * h / 2));
    const k4 = derivs(state.map((v, i) => v + k3[i] * h));
    return state.map((v, i) => v + (h / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
  }

  function tick(dt) {
    const steps = 10;
    const h = dt / steps;
    let state = [theta, omega];
    for (let i = 0; i < steps; i++) {
      state = rk4Step(state, h);
    }
    [theta, omega] = state;
    simTime += dt;

    const x = p.length * Math.sin(theta);
    const y = p.length * Math.cos(theta);
    trail.push({ x, y });
    if (trail.length > p.trailMax) trail.shift();
  }

  function render() {
    const W = canvas.width, H = canvas.height;
    ctx.fillStyle = '#0B0F14';
    ctx.fillRect(0, 0, W, H);

    const centerX = W / 2;
    const centerY = H * 0.25;
    const scale = Math.min(W, H) * 0.15;

    // Draw Trail
    if (trail.length > 2) {
      ctx.beginPath();
      for (let i = 0; i < trail.length; i++) {
        const tx = centerX + trail[i].x * scale;
        const ty = centerY + trail[i].y * scale;
        const alpha = i / trail.length;
        if (i === 0) ctx.moveTo(tx, ty);
        else ctx.lineTo(tx, ty);
      }
      ctx.strokeStyle = `rgba(251, 113, 133, 0.3)`;
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    const x = p.length * Math.sin(theta);
    const y = p.length * Math.cos(theta);
    const px = centerX + x * scale;
    const py = centerY + y * scale;

    // Draw Rod
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(px, py);
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Draw Pivot
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 6, 0, Math.PI * 2);
    ctx.fill();

    // Draw Bob
    ctx.shadowBlur = 20;
    ctx.shadowColor = 'rgba(251, 113, 133, 0.6)';
    ctx.fillStyle = '#fb7185';
    ctx.beginPath();
    ctx.arc(px, py, 18, 0, Math.PI * 2);
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
    setParams(next) { Object.assign(p, next); render(); },
    destroy() { this.stop(); },
    getData() {
      const v = p.length * omega;
      const h = p.length * (1 - Math.cos(theta));
      const kinetic = 0.5 * p.mass * v * v;
      const potential = p.mass * p.gravity * h;
      return {
        time: simTime,
        theta, omega,
        energy: kinetic + potential,
      };
    },
  };
}
