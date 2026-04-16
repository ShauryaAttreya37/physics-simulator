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

export const equations = [
  String.raw`mL^2 \ddot{\theta}_1 + c \dot{\theta}_1 + mgL\sin\theta_1 = -k(x_2-x_1)L\cos\theta_1`,
  String.raw`mL^2 \ddot{\theta}_2 + c \dot{\theta}_2 + mgL\sin\theta_2 = k(x_2-x_1)L\cos\theta_2`
];

export const graphParams = [
  { key: 'theta1', label: 'Theta 1' },
  { key: 'theta2', label: 'Theta 2' },
  { key: 'omega1', label: 'Omega 1' },
  { key: 'omega2', label: 'Omega 2' }
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

function deriv(state, p, anchorSep) {
  const [t1, t2, w1, w2] = state;

  const half = anchorSep * 0.5;
  const L = p.length;

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
  const tangential2 = (-fx) * t2x + (-fy) * t2y;

  const a1 = -(p.gravity / L) * Math.sin(t1) + tangential1 / (p.mass * L) - p.damping * w1;
  const a2 = -(p.gravity / L) * Math.sin(t2) + tangential2 / (p.mass * L) - p.damping * w2;

  return [w1, w2, a1, a2];
}

function rk4(state, h, p, anchorSep) {
  const k1 = deriv(state, p, anchorSep);
  const s2 = state.map((v, i) => v + 0.5 * h * k1[i]);
  const k2 = deriv(s2, p, anchorSep);
  const s3 = state.map((v, i) => v + 0.5 * h * k2[i]);
  const k3 = deriv(s3, p, anchorSep);
  const s4 = state.map((v, i) => v + h * k3[i]);
  const k4 = deriv(s4, p, anchorSep);
  return state.map((v, i) => v + (h / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
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
    const y = canvas.height * 0.23;
    const sep = getAnchorSep(canvas.width);
    return {
      ax1: canvas.width * 0.5 - sep * 0.5,
      ay1: y,
      ax2: canvas.width * 0.5 + sep * 0.5,
      ay2: y,
      sep,
    };
  }

  function positions() {
    const { ax1, ay1, ax2, ay2, sep } = anchors();
    const x1 = ax1 + p.length * Math.sin(state[0]);
    const y1 = ay1 + p.length * Math.cos(state[0]);
    const x2 = ax2 + p.length * Math.sin(state[1]);
    const y2 = ay2 + p.length * Math.cos(state[1]);
    return { ax1, ay1, ax2, ay2, x1, y1, x2, y2, sep };
  }

  function tick(dt) {
    const sub = 12;
    const h = dt / sub;
    const anchorSep = getAnchorSep(canvas.width);
    for (let i = 0; i < sub; i++) state = rk4(state, h, p, anchorSep);

    const { x1, y1, x2, y2 } = positions();
    trail1.push([x1, y1]);
    trail2.push([x2, y2]);
    const cap = Math.max(20, Math.floor(p.trail));
    if (trail1.length > cap) trail1.shift();
    if (trail2.length > cap) trail2.shift();
  }

  function drawTrail(points, colorPrefix) {
    if (points.length < 2) return;
    for (let i = 1; i < points.length; i++) {
      const alpha = i / points.length;
      ctx.beginPath();
      ctx.moveTo(points[i - 1][0], points[i - 1][1]);
      ctx.lineTo(points[i][0], points[i][1]);
      ctx.strokeStyle = `${colorPrefix}${Math.max(0.04, alpha * 0.8)})`;
      ctx.lineWidth = 1 + alpha * 1.5;
      ctx.stroke();
    }
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
    ctx.strokeStyle = 'rgba(167,139,250,0.85)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  function render() {
    ctx.fillStyle = '#090a12';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const { ax1, ay1, ax2, ay2, x1, y1, x2, y2 } = positions();

    drawTrail(trail1, 'rgba(96,165,250,');
    drawTrail(trail2, 'rgba(74,222,128,');

    drawSpring(x1, y1, x2, y2);

    ctx.beginPath();
    ctx.moveTo(ax1, ay1);
    ctx.lineTo(x1, y1);
    ctx.moveTo(ax2, ay2);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = 'rgba(203,213,225,0.8)';
    ctx.lineWidth = 2;
    ctx.stroke();

    [[ax1, ay1], [ax2, ay2]].forEach(([x, y]) => {
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#e2e8f0';
      ctx.fill();
    });

    ctx.shadowBlur = 20;
    ctx.shadowColor = '#60a5fa';
    ctx.beginPath();
    ctx.arc(x1, y1, p.bobRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#60a5fa';
    ctx.fill();

    ctx.shadowColor = '#4ade80';
    ctx.beginPath();
    ctx.arc(x2, y2, p.bobRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#4ade80';
    ctx.fill();
    ctx.shadowBlur = 0;
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
    setParams(next) { Object.assign(p, next); render(); },
    destroy() {
      this.stop();
    },
    getData() {
      return {
        time: lastTs ? lastTs / 1000 : 0,
        theta1: state[0],
        theta2: state[1],
        omega1: state[2],
        omega2: state[3]
      };
    }
  };
}
