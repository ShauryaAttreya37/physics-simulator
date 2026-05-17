/**
 * Newton's Cradle — Analytical Implementation
 *
 * Physics: Each ball is a simple pendulum integrated with RK4.
 *          Collisions are resolved using exact 1D elastic equations.
 * Includes a laboratory-style view with manual ball dragging.
 */

const DEFAULTS = {
  count: 5,
  radius: 22,
  stringLength: 210,
  pullCount: 1,
  pullAngle: -Math.PI / 3.3,
  restitution: 0.998,
  mass: 1.0,
  airFriction: 0.0002,
  gravity: 980,
};

const LIMITS = {
  count: [3, 8],
  radius: [15, 30],
  stringLength: [120, 360],
  pullCount: [1, 4],
  pullAngle: [-1.2, 1.2],
  restitution: [0.9, 1],
  mass: [0.1, 10],
  airFriction: [0, 0.002],
  gravity: [100, 2000],
};

export const defaultParams = { ...DEFAULTS };

export const equationSections = [
  {
    title: 'Conservation Laws',
    content: "Newton's cradle demonstrates the conservation of momentum and energy.",
    equations: [
      {
        latex: String.raw`m_1 v_{1i} + m_2 v_{2i} = m_1 v_{1f} + m_2 v_{2f}`,
        description: 'Momentum Conservation',
      },
      { latex: String.raw`e = v_{rel, f} / v_{rel, i}`, description: 'Restitution' },
    ],
  },
];

export const equations = equationSections;

export const controls = [
  { key: 'count', label: 'Ball Count', type: 'counter', min: 3, max: 8, step: 1 },
  { key: 'radius', label: 'Ball Radius', min: 15, max: 30, step: 1 },
  { key: 'restitution', label: 'Restitution', min: 0.9, max: 1, step: 0.001 },
  { key: 'airFriction', label: 'Air Friction', min: 0, max: 0.002, step: 0.0001 },
];

export const graphParams = [
  { key: 'totalEnergy', label: 'Total Energy [J]' },
  { key: 'momentumX', label: 'Total P_x' },
];

function pendulumDerivs(theta, omega, g, L, c) {
  return -(g / L) * Math.sin(theta) - c * omega;
}

function rk4Pendulum(theta, omega, dt, g, L, c) {
  const k1t = omega;
  const k1o = pendulumDerivs(theta, omega, g, L, c);
  const k2t = omega + (k1o * dt) / 2;
  const k2o = pendulumDerivs(theta + (k1t * dt) / 2, k2t, g, L, c);
  const k3t = omega + (k2o * dt) / 2;
  const k3o = pendulumDerivs(theta + (k2t * dt) / 2, k3t, g, L, c);
  const k4t = omega + k3o * dt;
  const k4o = pendulumDerivs(theta + k3t * dt, k4t, g, L, c);

  return {
    theta: theta + (dt / 6) * (k1t + 2 * k2t + 2 * k3t + k4t),
    omega: omega + (dt / 6) * (k1o + 2 * k2o + 2 * k3o + k4o),
  };
}

function clamp(value, min, max) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function sanitizeParams(nextParams) {
  const next = { ...DEFAULTS, ...nextParams };
  next.count = Math.round(clamp(next.count, ...LIMITS.count));
  next.radius = clamp(next.radius, ...LIMITS.radius);
  next.stringLength = clamp(next.stringLength, ...LIMITS.stringLength);
  next.pullCount = Math.round(
    clamp(next.pullCount, LIMITS.pullCount[0], Math.min(next.count, LIMITS.pullCount[1])),
  );
  next.pullAngle = clamp(next.pullAngle, ...LIMITS.pullAngle);
  next.restitution = clamp(next.restitution, ...LIMITS.restitution);
  next.mass = clamp(next.mass, ...LIMITS.mass);
  next.airFriction = clamp(next.airFriction, ...LIMITS.airFriction);
  next.gravity = clamp(next.gravity, ...LIMITS.gravity);
  return next;
}

export function create(canvas, initParams = {}) {
  const ctx = canvas.getContext('2d');
  let p = sanitizeParams(initParams);

  let thetas = [];
  let omegas = [];
  let simTime = 0;
  let draggingIdx = -1;

  function init() {
    const n = Math.floor(p.count);
    thetas = new Array(n).fill(0);
    omegas = new Array(n).fill(0);
    simTime = 0;
    draggingIdx = -1;

    const pullN = Math.min(Math.floor(p.pullCount), Math.floor(n / 2) || 1);
    for (let i = 0; i < pullN; i++) thetas[i] = p.pullAngle;
  }

  function resolveCollisions() {
    const n = thetas.length;
    const spacing = p.radius * 2 + 0.5;
    const offset = ((n - 1) * spacing) / 2;
    const cx = canvas.width / 2;

    const bobX = thetas.map((th, i) => {
      const ax = cx - offset + i * spacing;
      return ax + p.stringLength * Math.sin(th);
    });

    for (let i = 0; i < n - 1; i++) {
      const dist = bobX[i + 1] - bobX[i];
      if (dist < p.radius * 2) {
        const v1 = omegas[i] * p.stringLength * Math.cos(thetas[i]);
        const v2 = omegas[i + 1] * p.stringLength * Math.cos(thetas[i + 1]);

        if (v1 > v2) {
          const e = p.restitution;
          const m = p.mass;
          const v1f = ((m - e * m) * v1 + (1 + e) * m * v2) / (2 * m);
          const v2f = ((m - e * m) * v2 + (1 + e) * m * v1) / (2 * m);

          const cos1 = Math.cos(thetas[i]),
            cos2 = Math.cos(thetas[i + 1]);
          if (Math.abs(cos1) > 0.1) omegas[i] = v1f / (p.stringLength * cos1);
          if (Math.abs(cos2) > 0.1) omegas[i + 1] = v2f / (p.stringLength * cos2);

          const overlap = p.radius * 2 - dist;
          const pushAngle = overlap / (2 * p.stringLength);
          thetas[i] -= pushAngle;
          thetas[i + 1] += pushAngle;
        }
      }
    }
  }

  function render() {
    const W = canvas.width,
      H = canvas.height;
    const n = thetas.length;
    const spacing = p.radius * 2 + 0.5;
    const cx = W / 2,
      cy = H * 0.22;
    const offset = ((n - 1) * spacing) / 2;

    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, W, H);

    // --- Laboratory Frame ---
    ctx.fillStyle = '#334155';
    const frameW = (n - 1) * spacing + p.radius * 2 + 60;
    ctx.fillRect(cx - frameW / 2, cy - 15, frameW, 12);

    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(cx - frameW / 2 + 5, cy - 15, 6, H * 0.6);
    ctx.fillRect(cx + frameW / 2 - 11, cy - 15, 6, H * 0.6);

    for (let i = 0; i < n; i++) {
      const ancX = cx - offset + i * spacing;
      const bx = ancX + p.stringLength * Math.sin(thetas[i]);
      const by = cy + p.stringLength * Math.cos(thetas[i]);

      ctx.beginPath();
      ctx.moveTo(ancX, cy);
      ctx.lineTo(bx, by);
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(bx, by, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = draggingIdx === i ? '#3b82f6' : '#475569';
      ctx.fill();

      // Specular
      ctx.beginPath();
      ctx.arc(bx - p.radius * 0.3, by - p.radius * 0.3, p.radius * 0.15, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fill();

      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    renderHUD();
  }

  function renderHUD() {
    const x = 20,
      y = 20,
      w = 180,
      h = 80;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);

    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 10px "JetBrains Mono"';
    ctx.fillText('CRADLE TELEMETRY', x + 10, y + 20);

    let ke = 0,
      pe = 0;
    for (let i = 0; i < thetas.length; i++) {
      const v = p.stringLength * omegas[i];
      ke += 0.5 * p.mass * v * v;
      pe += p.mass * p.gravity * p.stringLength * (1 - Math.cos(thetas[i]));
    }
    ctx.font = '11px "JetBrains Mono"';
    ctx.fillText(`Energy: ${(ke + pe).toFixed(1)} J`, x + 10, y + 45);
    ctx.fillText(
      `Max Vel: ${Math.max(...omegas.map((o) => Math.abs(o))).toFixed(2)}`,
      x + 10,
      y + 65,
    );
  }

  function handlePointerDown(e) {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const n = thetas.length;
    const spacing = p.radius * 2 + 0.5;
    const offset = ((n - 1) * spacing) / 2;
    const cx = canvas.width / 2,
      cy = canvas.height * 0.22;

    for (let i = 0; i < n; i++) {
      const ancX = cx - offset + i * spacing;
      const bx = ancX + p.stringLength * Math.sin(thetas[i]);
      const by = cy + p.stringLength * Math.cos(thetas[i]);
      if (Math.hypot(mx - bx, my - by) < p.radius + 10) {
        draggingIdx = i;
        omegas[i] = 0;
        break;
      }
    }
  }

  function handlePointerMove(e) {
    if (draggingIdx === -1) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const n = thetas.length;
    const spacing = p.radius * 2 + 0.5;
    const offset = ((n - 1) * spacing) / 2;
    const cx = canvas.width / 2,
      cy = canvas.height * 0.22;
    const ancX = cx - offset + draggingIdx * spacing;

    thetas[draggingIdx] = clamp(Math.atan2(mx - ancX, my - cy), ...LIMITS.pullAngle);
    omegas[draggingIdx] = 0;
    if (!running) render();
  }

  function handlePointerUp() {
    draggingIdx = -1;
    render();
  }

  canvas.addEventListener('pointerdown', handlePointerDown);
  window.addEventListener('pointermove', handlePointerMove);
  window.addEventListener('pointerup', handlePointerUp);

  let rafId,
    lastTs,
    running = false;
  function loop(ts) {
    if (!running) return;
    const dt = lastTs === undefined ? 0.016 : Math.min((ts - lastTs) / 1000, 0.05);
    lastTs = ts;

    const substeps = 12;
    const h = dt / substeps;
    for (let s = 0; s < substeps; s++) {
      for (let i = 0; i < thetas.length; i++) {
        if (i === draggingIdx) continue;
        const next = rk4Pendulum(thetas[i], omegas[i], h, p.gravity, p.stringLength, p.airFriction);
        thetas[i] = next.theta;
        omegas[i] = next.omega;
      }
      resolveCollisions();
    }
    simTime += dt;
    render();
    rafId = requestAnimationFrame(loop);
  }

  init();
  render();

  return {
    start: () => {
      running = true;
      lastTs = undefined;
      loop();
    },
    stop: () => {
      running = false;
      cancelAnimationFrame(rafId);
    },
    reset: () => {
      init();
      render();
    },
    setParams: (next) => {
      const previousCount = p.count;
      p = sanitizeParams({ ...p, ...next });
      if (p.count !== previousCount || thetas.length !== p.count) {
        init();
        render();
        return;
      }
      render();
    },
    destroy: () => {
      running = false;
      cancelAnimationFrame(rafId);
      canvas.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    },
    getData: () => {
      let ke = 0,
        pe = 0,
        px = 0;
      for (let i = 0; i < thetas.length; i++) {
        const v = p.stringLength * omegas[i];
        ke += 0.5 * p.mass * v * v;
        pe += p.mass * p.gravity * p.stringLength * (1 - Math.cos(thetas[i]));
        px += p.mass * v * Math.cos(thetas[i]);
      }
      return { time: simTime, totalEnergy: ke + pe, kineticEnergy: ke, momentumX: px };
    },
  };
}
