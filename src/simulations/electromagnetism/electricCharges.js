/**
 * Interacting Charges & Electric Field
 *
 * Simulates point charges using Coulomb's Law, integrated with RK4.
 * Renders real-time electric vector field, equipotential contours,
 * force vectors, trajectory trails, and energy tracking.
 */

const DEFAULTS = {
  k: 1000,
  q1: 1,
  q2: -1,
  m1: 1,
  m2: 0.1,
  vinit: 40,
  b: 40,
  lock1: true,
};

export const defaultParams = { ...DEFAULTS };

export const equationSections = [
  {
    title: "Coulomb's Law & Electric Field",
    equations: [
      {
        latex: String.raw`\vec{F}_{12} = k_e \frac{q_1 q_2}{|\mathbf{r}_{12}|^2} \hat{r}_{12}`,
        description: 'The force between two point charges. Positive product → repulsion; negative → attraction.',
      },
      {
        latex: String.raw`\vec{E}(\mathbf{r}) = \sum_i k_e \frac{q_i}{|\mathbf{r} - \mathbf{r}_i|^2} \hat{r}_i`,
        description: 'The electric field at any point is the vector superposition over all source charges.',
      },
      {
        latex: String.raw`V(\mathbf{r}) = k_e \sum_i \frac{q_i}{|\mathbf{r} - \mathbf{r}_i|}`,
        description: 'The scalar electric potential. Equipotential contours are drawn where V = const.',
      },
    ],
    variables: [
      { symbol: 'k_e', description: 'Coulomb constant (8.99 × 10⁹ N·m²/C²)' },
      { symbol: 'q', description: 'Electric charge (Coulombs)' },
      { symbol: 'r', description: 'Separation distance' },
    ],
  },
  {
    title: 'Energy Conservation',
    equations: [
      {
        latex: String.raw`U = k_e \frac{q_1 q_2}{r}, \quad K = \tfrac{1}{2}m v^2, \quad E = K + U`,
        description: 'Total mechanical energy is conserved in the Coulomb potential. Kinetic and potential energy exchange as the charges interact.',
      },
    ],
  },
];

export const equations = [
  String.raw`\vec{F} = k \frac{q_1 q_2}{r^2} \hat{r}`,
  String.raw`E = K + U = \tfrac{1}{2}mv^2 + k\frac{q_1 q_2}{r}`,
];

export const graphParams = [
  { key: 'energy', label: 'Total Energy' },
  { key: 'dist', label: 'Distance' },
];

export const controls = [
  { key: 'q1', label: 'Charge Q₁', min: -5, max: 5, step: 0.1 },
  { key: 'q2', label: 'Charge Q₂', min: -5, max: 5, step: 0.1 },
  { key: 'vinit', label: 'Initial Velocity (Q₂)', min: 10, max: 150, step: 1 },
  { key: 'b', label: 'Impact Parameter b', min: 0, max: 200, step: 1 },
];

export const method = 'rk4';

export function create(canvas, initParams = {}) {
  const ctx = canvas.getContext('2d');
  const p = { ...DEFAULTS, ...initParams };

  let p1, p2;
  let simTime, stepCount, trail;

  function initState() {
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    p1 = { x: cx, y: cy, vx: 0, vy: 0, m: p.m1, q: p.q1, locked: p.lock1 };
    p2 = { x: cx - 300, y: cy + p.b, vx: p.vinit, vy: 0, m: p.m2, q: p.q2, locked: false };
    simTime = 0;
    stepCount = 0;
    trail = [];
  }

  function derivs(state) {
    const [x1, y1, vx1, vy1, x2, y2, vx2, vy2] = state;
    const dx = x1 - x2;
    const dy = y1 - y2;
    const rSq = dx * dx + dy * dy + 4;
    const r = Math.sqrt(rSq);
    const fMag = p.k * p.q1 * p.q2 / rSq;
    const fx = fMag * (dx / r);
    const fy = fMag * (dy / r);

    return [
      p1.locked ? 0 : vx1, p1.locked ? 0 : vy1,
      p1.locked ? 0 : fx / p.m1, p1.locked ? 0 : fy / p.m1,
      p2.locked ? 0 : vx2, p2.locked ? 0 : vy2,
      p2.locked ? 0 : -fx / p.m2, p2.locked ? 0 : -fy / p.m2,
    ];
  }

  function tick(dt) {
    p1.q = p.q1;
    p2.q = p.q2;

    const steps = 20;
    const h = dt / steps;

    for (let i = 0; i < steps; i++) {
      const s0 = [p1.x, p1.y, p1.vx, p1.vy, p2.x, p2.y, p2.vx, p2.vy];
      const k1 = derivs(s0);
      const s1 = s0.map((v, j) => v + k1[j] * h / 2);
      const k2 = derivs(s1);
      const s2 = s0.map((v, j) => v + k2[j] * h / 2);
      const k3 = derivs(s2);
      const s3 = s0.map((v, j) => v + k3[j] * h);
      const k4 = derivs(s3);

      for (let j = 0; j < 8; j++) {
        const val = h * (k1[j] + 2 * k2[j] + 2 * k3[j] + k4[j]) / 6;
        if (j < 4) {
          if (j === 0) p1.x += val;
          if (j === 1) p1.y += val;
          if (j === 2) p1.vx += val;
          if (j === 3) p1.vy += val;
        } else {
          if (j === 4) p2.x += val;
          if (j === 5) p2.y += val;
          if (j === 6) p2.vx += val;
          if (j === 7) p2.vy += val;
        }
      }
      simTime += h;
      stepCount++;
    }
    trail.push({ x: p2.x, y: p2.y });
    if (trail.length > 600) trail.shift();
  }

  // ── Equipotential heatmap (precomputed to offscreen canvas) ──
  let eqCanvas = null;
  let eqNeedsRedraw = true;

  function drawEquipotentialMap(W, H) {
    if (!eqCanvas) {
      eqCanvas = document.createElement('canvas');
    }
    // Use a lower-res offscreen buffer for performance
    const scale = 4;
    const ew = Math.ceil(W / scale);
    const eh = Math.ceil(H / scale);
    eqCanvas.width = ew;
    eqCanvas.height = eh;
    const ectx = eqCanvas.getContext('2d');
    const imgData = ectx.createImageData(ew, eh);
    const data = imgData.data;

    for (let py = 0; py < eh; py++) {
      for (let px = 0; px < ew; px++) {
        const wx = px * scale;
        const wy = py * scale;
        let V = 0;
        const pts = [p1, p2];
        for (const pt of pts) {
          if (pt.q === 0) continue;
          const dx = wx - pt.x;
          const dy = wy - pt.y;
          const r = Math.sqrt(dx * dx + dy * dy + 25);
          V += p.k * pt.q / r;
        }
        // Map potential to color
        const idx = (py * ew + px) * 4;
        const absV = Math.abs(V);
        const intensity = Math.min(1, Math.log1p(absV * 0.02) * 0.6);
        if (V > 0) {
          // Positive → warm red/orange
          data[idx] = Math.floor(intensity * 180);
          data[idx + 1] = Math.floor(intensity * 40);
          data[idx + 2] = Math.floor(intensity * 20);
        } else {
          // Negative → cool blue/cyan
          data[idx] = Math.floor(intensity * 20);
          data[idx + 1] = Math.floor(intensity * 60);
          data[idx + 2] = Math.floor(intensity * 200);
        }
        data[idx + 3] = Math.floor(intensity * 100);
      }
    }
    ectx.putImageData(imgData, 0, 0);

    // Draw scaled up onto main canvas
    ctx.save();
    ctx.globalAlpha = 0.6;
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(eqCanvas, 0, 0, W, H);
    ctx.restore();
  }

  function renderField(W, H) {
    const spacing = 35;
    ctx.lineWidth = 1;

    for (let x = spacing / 2; x < W; x += spacing) {
      for (let y = spacing / 2; y < H; y += spacing) {
        let Ex = 0, Ey = 0;
        const pts = [p1, p2];
        for (const pt of pts) {
          if (pt.q === 0) continue;
          const dx = x - pt.x;
          const dy = y - pt.y;
          const rSq = dx * dx + dy * dy + 100;
          const r = Math.sqrt(rSq);
          const eMag = p.k * pt.q / rSq;
          Ex += eMag * (dx / r);
          Ey += eMag * (dy / r);
        }

        const mag = Math.sqrt(Ex * Ex + Ey * Ey);
        if (mag < 0.05) continue;

        const len = Math.min(spacing * 0.4, Math.log1p(mag * 0.5) * 5);
        const alpha = Math.min(0.7, mag * 0.06 + 0.05);
        ctx.strokeStyle = `rgba(200,220,255,${alpha.toFixed(3)})`;

        const nx = Ex / mag;
        const ny = Ey / mag;
        ctx.beginPath();
        ctx.moveTo(x - nx * len / 2, y - ny * len / 2);
        ctx.lineTo(x + nx * len / 2, y + ny * len / 2);
        ctx.stroke();

        // Arrowhead
        const aSize = Math.min(3, len * 0.35);
        ctx.beginPath();
        ctx.moveTo(x + nx * len / 2, y + ny * len / 2);
        ctx.lineTo(x + nx * len / 2 - nx * aSize - ny * aSize,
                   y + ny * len / 2 - ny * aSize + nx * aSize);
        ctx.moveTo(x + nx * len / 2, y + ny * len / 2);
        ctx.lineTo(x + nx * len / 2 - nx * aSize + ny * aSize,
                   y + ny * len / 2 - ny * aSize - nx * aSize);
        ctx.stroke();
      }
    }
  }

  function render() {
    const W = canvas.width, H = canvas.height;

    // Deep dark gradient background
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#030810');
    bg.addColorStop(1, '#050a18');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    if (!p1) return;

    // Equipotential heatmap
    drawEquipotentialMap(W, H);

    // Vector field overlay
    renderField(W, H);

    // Trail with gradient color
    if (trail.length > 2) {
      for (let i = 1; i < trail.length; i++) {
        const t = i / trail.length;
        const alpha = t * 0.8;
        // Color shifts from cyan → white along trail
        const r = Math.floor(100 + t * 155);
        const g = Math.floor(200 + t * 55);
        const b = Math.floor(255);
        ctx.beginPath();
        ctx.moveTo(trail[i - 1].x, trail[i - 1].y);
        ctx.lineTo(trail[i].x, trail[i].y);
        ctx.strokeStyle = `rgba(${r},${g},${b},${alpha.toFixed(2)})`;
        ctx.lineWidth = 1.5 + t;
        ctx.stroke();
      }
    }

    // Force vector on Q2
    if (p1 && p2) {
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const rSq = dx * dx + dy * dy + 4;
      const r = Math.sqrt(rSq);
      const fMag = p.k * p.q1 * p.q2 / rSq;
      const fx = fMag * (dx / r);
      const fy = fMag * (dy / r);
      const fScale = 0.3;
      ctx.beginPath();
      ctx.moveTo(p2.x, p2.y);
      ctx.lineTo(p2.x + fx * fScale, p2.y + fy * fScale);
      ctx.strokeStyle = '#FFD166';
      ctx.lineWidth = 2.5;
      ctx.stroke();
      // Arrow head
      const ang = Math.atan2(fy, fx);
      ctx.save();
      ctx.translate(p2.x + fx * fScale, p2.y + fy * fScale);
      ctx.rotate(ang);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-8, -4);
      ctx.lineTo(-8, 4);
      ctx.closePath();
      ctx.fillStyle = '#FFD166';
      ctx.fill();
      ctx.restore();
    }

    // Draw charges with glow
    const drawCharge = (pt, label) => {
      const isPos = pt.q > 0;
      const isZero = pt.q === 0;
      const color = isZero ? '#94a3b8' : (isPos ? '#FF6B6B' : '#3b82f6');
      const glowColor = isZero ? '#94a3b8' : (isPos ? 'rgba(255, 107, 107,0.3)' : 'rgba(59,130,246,0.3)');

      // Glow ring
      const grad = ctx.createRadialGradient(pt.x, pt.y, 2, pt.x, pt.y, 30);
      grad.addColorStop(0, glowColor);
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.fillRect(pt.x - 30, pt.y - 30, 60, 60);

      // Body
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 12, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Symbol
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 14px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(isZero ? '0' : (isPos ? '+' : '−'), pt.x, pt.y);

      // Label
      ctx.font = '11px "JetBrains Mono", monospace';
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fillText(label, pt.x, pt.y - 22);
    };

    drawCharge(p1, `Q₁ = ${p.q1.toFixed(1)}`);
    drawCharge(p2, `Q₂ = ${p.q2.toFixed(1)}`);

    // HUD
    const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
    const KE = 0.5 * p.m2 * (p2.vx * p2.vx + p2.vy * p2.vy);
    const PE = p.k * p.q1 * p.q2 / Math.max(dist, 1);
    const E = KE + PE;

    ctx.font = '12px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillText(`r = ${dist.toFixed(1)} px`, 16, 16);
    ctx.fillStyle = '#4ade80';
    ctx.fillText(`KE = ${KE.toFixed(1)}`, 16, 32);
    ctx.fillStyle = '#FF6B6B';
    ctx.fillText(`PE = ${PE.toFixed(1)}`, 16, 48);
    ctx.fillStyle = '#FFD166';
    ctx.fillText(`E  = ${E.toFixed(1)}`, 16, 64);
  }

  let rafId, lastTs, running = false;

  function loop(ts) {
    if (!running) return;
    const dt = lastTs === undefined ? 1 / 60 : Math.min((ts - lastTs) / 1000, 1 / 20);
    lastTs = ts;
    tick(dt);
    render();
    rafId = requestAnimationFrame(loop);
  }

  setTimeout(() => {
    initState();
    render();
  }, 0);

  return {
    start() {
      if (running) return;
      running = true;
      lastTs = undefined;
      rafId = requestAnimationFrame(loop);
    },
    stop() { running = false; cancelAnimationFrame(rafId); },
    reset() { this.stop(); initState(); render(); this.start(); },
    setParams(next) { Object.assign(p, next); render(); },
    destroy() { this.stop(); },
    getData() {
      if (!p1 || !p2) return { energy: 0, dist: 0 };
      const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
      const KE = 0.5 * p.m2 * (p2.vx * p2.vx + p2.vy * p2.vy);
      const PE = p.k * p.q1 * p.q2 / Math.max(dist, 1);
      return { energy: KE + PE, dist };
    },
  };
}
