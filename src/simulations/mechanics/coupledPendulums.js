import { rk4 } from '../../physics/solvers';
import { drawTrail } from '../../utils/canvas';

const DEFAULTS = {
  length: 170,
  mass: 1,
  gravity: 980,
  damping: 0.03,
  springK: 8,
  restScale: 1,
  theta1: 0.9,
  theta2: 0.1,
  omega1: 0,
  omega2: 0,
  bobRadius: 15,
  trail: 500,
};

export const defaultParams = {
  length: 170,
  mass: 1,
  gravity: 980,
  damping: 0.03,
  springK: 8,
  restScale: 1,
  theta1: 0.9,
  theta2: 0.1,
  omega1: 0,
  omega2: 0,
  bobRadius: 15,
  trail: 500,
};

export const equationSections = [
  {
    title: 'Introduction',
    content:
      'Coupled pendulums are two pendulums connected by a spring. They can transfer energy back and forth, showing wave-like behavior and normal modes. This demonstrates coupled oscillators, important in physics, engineering, and even music.',
  },
  {
    title: 'Equations of Motion',
    equations: [
      {
        latex: String.raw`mL^2 \ddot{\theta}_1 + c \dot{\theta}_1 + mgL\sin\theta_1 = -k(x_2-x_1)L\cos\theta_1`,
        description:
          'Motion of first pendulum. Includes gravity, damping, and spring coupling to the second pendulum.',
      },
      {
        latex: String.raw`mL^2 \ddot{\theta}_2 + c \dot{\theta}_2 + mgL\sin\theta_2 = k(x_2-x_1)L\cos\theta_2`,
        description:
          'Motion of second pendulum. Symmetric to the first, but with opposite spring force.',
      },
    ],
    variables: [
      { symbol: 'θ₁, θ₂', description: 'Angles of the two pendulums' },
      { symbol: 'L', description: 'Pendulum length' },
      { symbol: 'm', description: 'Bob mass' },
      { symbol: 'k', description: 'Spring constant' },
      { symbol: 'c', description: 'Damping coefficient' },
    ],
  },
  {
    title: 'How to Use',
    content:
      '1. Adjust spring strength k - stronger coupling means more interaction.\n2. Set different initial angles for θ₁ and θ₂.\n3. Change rest length scale to see different equilibrium positions.\n4. Add damping to see energy dissipation.\n5. Watch how energy transfers between pendulums.',
  },
  {
    title: 'Beginner Tips',
    content:
      'Start with one pendulum displaced, other at rest. See energy transfer. Try equal displacements - they oscillate in phase. Look for normal modes where both move together or opposite. Experiment with different masses or lengths.',
  },
];

export const equations = [
  String.raw`mL^2 \ddot{\theta}_1 + c \dot{\theta}_1 + mgL\sin\theta_1 = -k(x_2-x_1)L\cos\theta_1`,
  String.raw`mL^2 \ddot{\theta}_2 + c \dot{\theta}_2 + mgL\sin\theta_2 = k(x_2-x_1)L\cos\theta_2`,
];

export const graphParams = [
  { key: 'theta1', label: 'Theta 1' },
  { key: 'theta2', label: 'Theta 2' },
  { key: 'omega1', label: 'Omega 1' },
  { key: 'omega2', label: 'Omega 2' },
];

export const controls = [
  { key: 'length', label: 'Length', min: 100, max: 260, step: 1 },
  { key: 'mass', label: 'Bob Mass', min: 0.2, max: 4, step: 0.05 },
  { key: 'gravity', label: 'Gravity (px/s^2)', min: 200, max: 1800, step: 10 },
  { key: 'damping', label: 'Damping', min: 0, max: 0.2, step: 0.001 },
  { key: 'springK', label: 'Spring K', min: 0, max: 30, step: 0.1 },
  { key: 'restScale', label: 'Rest Length Scale', min: 0.6, max: 1.6, step: 0.01 },
  { key: 'theta1', label: 'Theta 1', min: -1.4, max: 1.4, step: 0.01 },
  { key: 'theta2', label: 'Theta 2', min: -1.4, max: 1.4, step: 0.01 },
  { key: 'omega1', label: 'Omega 1', min: -6, max: 6, step: 0.01 },
  { key: 'omega2', label: 'Omega 2', min: -6, max: 6, step: 0.01 },
  { key: 'bobRadius', label: 'Bob Radius', min: 8, max: 24, step: 1 },
  { key: 'trail', label: 'Trail Length', min: 80, max: 1200, step: 10 },
];

function getAnchorSep(canvasWidth) {
  return Math.min(300, canvasWidth * 0.36);
}

function deriv(state, params) {
  const [t1, t2, w1, w2] = state;
  const { anchorSep } = params;
  const p = params;
  const L = p.length;
  const half = anchorSep / 2;

  const x1 = -half + L * Math.sin(t1);
  const y1 = L * Math.cos(t1);
  const x2 = half + L * Math.sin(t2);
  const y2 = L * Math.cos(t2);

  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.max(1e-6, Math.hypot(dx, dy));

  const restLen = anchorSep * p.restScale;
  const extension = dist - restLen;

  const springForce = p.springK * extension;
  const fx = springForce * (dx / dist);
  const fy = springForce * (dy / dist);

  const t1x = Math.cos(t1);
  const t1y = -Math.sin(t1);
  const t2x = Math.cos(t2);
  const t2y = -Math.sin(t2);

  const tangential1 = fx * t1x + fy * t1y;
  const tangential2 = -fx * t2x + -fy * t2y;

  const a1 = -(p.gravity / L) * Math.sin(t1) + tangential1 / (p.mass * L) - p.damping * w1;
  const a2 = -(p.gravity / L) * Math.sin(t2) + tangential2 / (p.mass * L) - p.damping * w2;

  return [w1, w2, a1, a2];
}

export function create(canvas, initParams = {}) {
  const ctx = canvas.getContext('2d');
  const p = { ...DEFAULTS, ...initParams };

  let state;
  let trail1 = [];
  let trail2 = [];

  function initState() {
    state = [p.theta1, p.theta2, p.omega1, p.omega2];
    trail1 = [];
    trail2 = [];
  }

  function anchors() {
    const scale = p.viewScale ?? 1.0;
    const y = canvas.height * 0.23 + (p.panY || 0);
    const sep = getAnchorSep(canvas.width) * scale;
    const panX = p.panX || 0;
    return {
      ax1: canvas.width * 0.5 - sep * 0.5 + panX,
      ay1: y,
      ax2: canvas.width * 0.5 + sep * 0.5 + panX,
      ay2: y,
      sep,
    };
  }

  function positions() {
    const scale = p.viewScale ?? 1.0;
    const { ax1, ay1, ax2, ay2, sep } = anchors();
    const x1 = ax1 + p.length * scale * Math.sin(state[0]);
    const y1 = ay1 + p.length * scale * Math.cos(state[0]);
    const x2 = ax2 + p.length * scale * Math.sin(state[1]);
    const y2 = ay2 + p.length * scale * Math.cos(state[1]);
    return { ax1, ay1, ax2, ay2, x1, y1, x2, y2, sep };
  }

  function tick(dt) {
    const sub = 12;
    const h = dt / sub;
    const anchorSep = getAnchorSep(canvas.width);
    const solverParams = { ...p, anchorSep };
    for (let i = 0; i < sub; i++) {
      state = rk4(state, h, deriv, solverParams);
    }

    const { x1, y1, x2, y2 } = positions();
    trail1.push([x1, y1]);
    trail2.push([x2, y2]);
    const cap = Math.max(20, Math.floor(p.trail));
    if (trail1.length > cap) trail1.shift();
    if (trail2.length > cap) trail2.shift();
  }

  function drawSpring(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.hypot(dx, dy);
    if (len < 1) return;
    const nx = -dy / len;
    const ny = dx / len;
    const coils = 14;
    const amp = 7;

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    for (let i = 1; i < coils; i++) {
      const t = i / coils;
      const side = i % 2 === 0 ? amp : -amp;
      ctx.lineTo(x1 + dx * t + nx * side, y1 + dy * t + ny * side);
    }
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  function render() {
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const scale = p.viewScale ?? 1.0;
    const { ax1, ay1, ax2, ay2, x1, y1, x2, y2 } = positions();

    drawTrail(ctx, trail1, { color: 'rgba(59,130,246,0.3)', maxAlpha: 0.5 });
    drawTrail(ctx, trail2, { color: 'rgba(16,185,129,0.3)', maxAlpha: 0.5 });

    drawSpring(x1, y1, x2, y2);

    ctx.beginPath();
    ctx.moveTo(ax1, ay1);
    ctx.lineTo(x1, y1);
    ctx.moveTo(ax2, ay2);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.stroke();

    [
      [ax1, ay1],
      [ax2, ay2],
    ].forEach(([x, y]) => {
      ctx.beginPath();
      ctx.arc(x, y, 5 * scale, 0, Math.PI * 2);
      ctx.fillStyle = '#64748b';
      ctx.fill();
    });

    ctx.beginPath();
    ctx.arc(x1, y1, p.bobRadius * scale, 0, Math.PI * 2);
    ctx.fillStyle = '#3b82f6';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(x2, y2, p.bobRadius * scale, 0, Math.PI * 2);
    ctx.fillStyle = '#10b981';
    ctx.fill();
  }

  let rafId;
  let lastTs;
  let running = false;

  function loop(ts) {
    if (!running) return;
    const dt = lastTs === undefined ? 1 / 60 : Math.min((ts - lastTs) / 1000, 1 / 20);
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
      initState();
      render();
      this.start();
    },
    setParams(next) {
      Object.assign(p, next);
      render();
    },
    destroy() {
      this.stop();
    },
    getData() {
      return {
        time: lastTs ? lastTs / 1000 : 0,
        theta1: state[0],
        theta2: state[1],
        omega1: state[2],
        omega2: state[3],
      };
    },
  };
}
