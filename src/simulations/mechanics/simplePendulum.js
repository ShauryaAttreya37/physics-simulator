import { rk4 } from '../../physics/solvers';

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
    title: 'Introduction',
    content: 'A simple pendulum consists of a weight (bob) attached to a string or rod that swings back and forth under gravity. It\'s a great example of oscillatory motion, where the pendulum repeats its motion over time. This simulation shows how the pendulum behaves with different lengths, masses, and starting angles. You can observe how gravity pulls the bob down, and how friction (damping) slows it down over time. The motion is described by angles and speeds, and we can see patterns in the energy.',
  },
  {
    title: 'Equation of Motion',
    equations: [
      {
        latex: String.raw`\ddot{\theta} + \frac{g}{L}\sin\theta + \frac{c}{mL^2}\dot{\theta} = 0`,
        description: 'This equation describes how the angle of the pendulum changes over time. The first term shows gravity pulling it back (stronger for larger angles), the second term is damping that slows it down. θ (theta) is the angle from vertical, with dots meaning derivatives (speed and acceleration).',
      },
      {
        latex: String.raw`T \approx 2\pi\sqrt{\frac{L}{g}} \left(1 + \frac{1}{16}\theta_0^2 + \dots\right)`,
        description: 'This gives the time for one full swing (period). For small angles, it\'s about 2π times square root of length over gravity. For larger angles, the period gets longer because the motion isn\'t simple harmonic anymore.',
      },
    ],
    variables: [
      { symbol: 'L', description: 'Length of the pendulum rod (longer means slower swings)' },
      { symbol: 'm', description: 'Mass of the bob (doesn\'t affect period in vacuum)' },
      { symbol: 'g', description: 'Gravity strength (9.81 m/s² on Earth)' },
      { symbol: 'c', description: 'Damping coefficient (higher means more friction)' },
    ],
  },
  {
    title: 'Energy Conservation',
    equations: [
      {
        latex: String.raw`E = K + U = \frac{1}{2}mL^2\dot{\theta}^2 + mgL(1 - \cos\theta)`,
        description: 'Total energy is kinetic (from motion) plus potential (from height). In an ideal pendulum without damping, energy is conserved. With damping, energy decreases over time as heat. Watch the energy graph to see this.',
      },
    ],
  },
  {
    title: 'How to Use',
    content: '1. Adjust the length (L) to see how longer pendulums swing slower.\n2. Change the initial angle (θ) - small angles give regular swings, large angles show nonlinearity.\n3. Increase damping (c) to see how friction affects the motion.\n4. Try different gravities - lower gravity means slower, higher means faster swings.\n5. Watch the graphs: angle vs time, phase space (angle vs speed), and energy.',
  },
  {
    title: 'Beginner Tips',
    content: 'Start with small angles to see simple harmonic motion. Notice the period stays constant. Then try large angles - the period changes! Experiment with damping: it makes the pendulum stop eventually. Look for energy conservation in scenarios with low damping. Try the "Over-the-Top" scenario to see the pendulum go upside down.',
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

  function derivs(state, p) {
    const [th, om] = state;
    const dom = -(p.gravity / p.length) * Math.sin(th) - (p.damping / (p.mass * p.length * p.length)) * om;
    return [om, dom];
  }

  function tick(dt) {
    const steps = 10;
    const h = dt / steps;
    let state = [theta, omega];
    for (let i = 0; i < steps; i++) {
      state = rk4(state, h, derivs, p);
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

    const centerX = W / 2 + (p.panX || 0);
    const centerY = H * 0.25 + (p.panY || 0);
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
