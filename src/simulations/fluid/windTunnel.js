/**
 * Wind Tunnel Simulation
 * Ported from FluidSandboxPage.jsx
 */

const SHAPES = [
  { id: 'circle', name: 'Cylinder', cd: 1.2, cl: 0, st: 0.2 },
  { id: 'box', name: 'Flat Plate', cd: 1.98, cl: 0, st: 0.15 },
  { id: 'sphere3d', name: 'Sphere 3D', cd: 0.47, cl: 0, st: 0.19 },
  { id: 'airfoil', name: 'Airfoil', cd: 0.008, cl: 0.3, st: 0.0 },
  { id: 'diamond', name: 'Diamond', cd: 1.5, cl: 0, st: 0.18 },
];

function cdForRe(shape, Re) {
  const base = shape.cd;
  if (shape.id === 'sphere3d') {
    if (Re < 1e3) return 24 / Re + 6 / (1 + Math.sqrt(Re)) + 0.4;
    if (Re < 2e5) return 0.47;
    if (Re < 4e5) return 0.47 - 0.27 * ((Re - 2e5) / 2e5);
    return 0.2;
  }
  if (shape.id === 'circle') {
    if (Re < 1e3) return 10 / Math.pow(Re, 0.5);
    if (Re < 3e5) return 1.2;
    if (Re < 6e5) return 1.2 - 0.9 * ((Re - 3e5) / 3e5);
    return 0.3;
  }
  if (shape.id === 'airfoil') {
    if (Re < 1e4) return 0.05;
    if (Re < 1e5) return 0.015;
    return 0.008;
  }
  return base;
}

function velColor(v, vmax) {
  const t = Math.min(1, Math.max(0, v / vmax));
  if (t < 0.25) {
    const s = t / 0.25;
    return [0, Math.round(s * 255), 255];
  }
  if (t < 0.5) {
    const s = (t - 0.25) / 0.25;
    return [0, 255, Math.round((1 - s) * 255)];
  }
  if (t < 0.75) {
    const s = (t - 0.5) / 0.25;
    return [Math.round(s * 255), 255, 0];
  }
  const s = (t - 0.75) / 0.25;
  return [255, Math.round((1 - s) * 255), 0];
}

function velField(px, py, cx, cy, R, U, shapeId = 'circle', simTime = 0) {
  let dx = px - cx,
    dy = py - cy;
  if (shapeId === 'airfoil') dy *= 2.5;

  const r2 = dx * dx + dy * dy;
  const R2 = R * R;

  if (shapeId === 'diamond') {
    if (Math.abs(dx) + Math.abs(dy) < R * 0.95) return { vx: 0, vy: 0 };
  } else if (shapeId === 'box') {
    if (Math.abs(dx) < 25 && Math.abs(dy) < 45) return { vx: 0, vy: 0 };
  } else if (r2 < R2 * 1.02 && dx > -R) {
    return { vx: 0, vy: 0 };
  }

  const r4 = Math.max(1, r2 * r2);
  let vx = U * (1.0 - (R2 * (dx * dx - dy * dy)) / r4);
  let vy = U * ((-R2 * 2 * dx * dy) / r4);

  if (shapeId === 'airfoil' && r2 > R2 * 1.1) {
    const Cl = 0.3;
    const Gamma = Math.PI * R * 2 * U * Cl * 0.15;
    const r2safe = Math.max(r2, R2);
    vx += (Gamma * dy) / (2 * Math.PI * r2safe);
    vy -= (Gamma * dx) / (2 * Math.PI * r2safe);
  }

  if (dx > 0) {
    const shapeData = SHAPES.find((s) => s.id === shapeId) || SHAPES[0];
    const St = shapeData.st;
    const shedFreq = (St * U) / R;

    const wakeWidth =
      R *
      (shapeId === 'box' ? 3.5 : shapeId === 'airfoil' ? 0.6 : shapeId === 'diamond' ? 3.0 : 2.5);
    const wakePersist =
      R * (shapeId === 'box' ? 10 : shapeId === 'airfoil' ? 3 : shapeId === 'diamond' ? 7 : 6);
    const wDecay = Math.exp(-(dy * dy) / (wakeWidth * wakeWidth)) * Math.exp(-dx / wakePersist);
    const osc = Math.sin(dx * 0.08 - simTime * shedFreq);

    if (shapeId === 'box') {
      vy += wDecay * U * 0.85 * osc + wDecay * U * 0.35 * (Math.random() - 0.5);
      vx *= 1 - wDecay * 0.75;
    } else if (shapeId === 'airfoil') {
      vy += wDecay * U * 0.03 * osc;
      vx *= 1 - wDecay * 0.03;
    } else if (shapeId === 'diamond') {
      vy += wDecay * U * 0.7 * osc + wDecay * U * 0.25 * (Math.random() - 0.5);
      vx *= 1 - wDecay * 0.6;
    } else {
      vy += wDecay * U * 0.5 * osc + wDecay * U * 0.15 * (Math.random() - 0.5);
      vx *= 1 - wDecay * 0.5;
    }
  }
  return { vx, vy };
}

function getShapeR(shape) {
  if (shape.id === 'airfoil') return 20;
  if (shape.id === 'box') return 48;
  return 42;
}

const PX_M = 0.003;
const N_PARTICLES = 300;

export const defaultParams = {
  windSpeed: 180,
  shapeIdx: 0,
  showPressure: 1,
  showStreamlines: 1,
};

export const controls = [
  { key: 'windSpeed', label: 'Wind Speed (px/s)', min: 20, max: 500, step: 10 },
  {
    key: 'shapeIdx',
    label: 'Object Profile',
    type: 'tiles',
    tiles: SHAPES.map((s, i) => ({ value: i, label: s.name, sub: `Cd ${s.cd}` })),
  },
  {
    key: 'showPressure',
    label: 'Velocity Heatmap',
    type: 'tiles',
    tiles: [
      { value: 0, label: 'Off' },
      { value: 1, label: 'On' },
    ],
  },
  {
    key: 'showStreamlines',
    label: 'Streamlines',
    type: 'tiles',
    tiles: [
      { value: 0, label: 'Off' },
      { value: 1, label: 'On' },
    ],
  },
];

export const equations = [];

export const equationSections = [
  {
    title: 'Introduction',
    content:
      'A wind tunnel simulates airflow around objects to study aerodynamics. This helps engineers design airplanes, cars, and buildings. The simulation shows how air particles flow around different shapes, creating drag (resistance) and lift (upward force). You can see pressure differences and vortex shedding.',
  },
  {
    title: 'Aerodynamic Equations',
    equations: [
      {
        latex: String.raw`F_D = \frac{1}{2} \rho v^2 C_D A`,
        description:
          'Drag force - the resistance force opposing motion. Depends on air density ρ, speed v, drag coefficient C_D, and frontal area A.',
      },
      {
        latex: String.raw`F_L = \frac{1}{2} \rho v^2 C_L A`,
        description:
          'Lift force - the upward force perpendicular to flow. C_L is lift coefficient, higher for streamlined shapes.',
      },
      {
        latex: String.raw`Re = \frac{\rho v D}{\mu}`,
        description:
          'Reynolds number - dimensionless number comparing inertial to viscous forces. High Re means turbulent flow.',
      },
      {
        latex: String.raw`St = \frac{f D}{U}`,
        description:
          'Strouhal number - characterizes vortex shedding frequency. f is shedding frequency, D is diameter, U is flow speed.',
      },
    ],
    variables: [
      { symbol: 'ρ', description: 'Air density (mass per volume)' },
      { symbol: 'v', description: 'Flow velocity (wind speed)' },
      { symbol: 'C_D, C_L', description: 'Drag and lift coefficients (depend on shape)' },
      { symbol: 'A', description: 'Reference area (usually frontal area)' },
      { symbol: 'μ', description: 'Dynamic viscosity of air' },
    ],
  },
  {
    title: 'Flow Regimes',
    equations: [
      {
        latex: String.raw`Re < 10^3`,
        description: 'Laminar flow - smooth, predictable streamlines.',
      },
      {
        latex: String.raw`Re > 10^5`,
        description: 'Turbulent flow - chaotic, with eddies and mixing.',
      },
    ],
  },
  {
    title: 'How to Use',
    content:
      '1. Select different object shapes (circle, square, airfoil) to see how shape affects drag and lift.\n2. Adjust wind speed - higher speeds increase forces quadratically.\n3. Change object size - larger objects experience more force.\n4. Watch the particle trails to visualize airflow patterns.\n5. Look for vortex shedding behind bluff bodies (alternating vortices).\n6. Check the graphs for force variations and Reynolds number.',
  },
  {
    title: 'Beginner Tips',
    content:
      'Streamlined shapes (airfoils) have low drag and high lift. Blunt shapes create more drag and wake turbulence. At low speeds, flow is smooth; at high speeds, it becomes turbulent. The pressure is higher where flow slows down. Try the mouse probe to see local flow conditions.',
  },
];

export const graphParams = [
  { key: 'forceD', label: 'Drag Force', color: '#f97316' },
  { key: 'forceL', label: 'Lift Force', color: '#22d3ee' },
  { key: 'pressure', label: 'Dynamic Pressure', color: '#a78bfa' },
  { key: 'stepR', label: 'Reynolds Number', color: '#4ade80' },
];

export function create(canvas, initParams = {}) {
  const ctx = canvas.getContext('2d');
  let p = { ...defaultParams, ...initParams };

  let TN_TOP = 45,
    TN_BOT = 405,
    TN_LEFT = 20,
    TN_RIGHT = canvas.width - 20;
  let OBJ_CX = canvas.width * 0.4,
    OBJ_CY = canvas.height * 0.5;

  let particles = [];
  let bgCache = null;
  let bgDirty = true;
  let simTime = 0;
  let mouseProbe = null;

  function initParticle() {
    return {
      x: TN_LEFT - Math.random() * 30,
      y: TN_TOP + Math.random() * (TN_BOT - TN_TOP),
      trail: [],
    };
  }

  function resize() {
    TN_RIGHT = canvas.width - 20;
    OBJ_CX = Math.min(280, canvas.width * 0.4);
    OBJ_CY = canvas.height * 0.5;
    TN_TOP = canvas.height * 0.1;
    TN_BOT = canvas.height * 0.9;
    bgDirty = true;
  }

  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    mouseProbe = {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
      active: true,
    };
  });
  canvas.addEventListener('mouseleave', () => (mouseProbe = null));

  function buildBgImageData(U, shape) {
    const iw = Math.floor((TN_RIGHT - TN_LEFT) / 4);
    const ih = Math.floor((TN_BOT - TN_TOP) / 4);
    if (iw <= 0 || ih <= 0) return null;
    const R = getShapeR(shape);
    const data = new Uint8ClampedArray(iw * ih * 4);

    for (let j = 0; j < ih; j++) {
      for (let i = 0; i < iw; i++) {
        const px = i * 4,
          py = j * 4;
        const { vx, vy } = velField(TN_LEFT + px, TN_TOP + py, OBJ_CX, OBJ_CY, R, U, shape.id, 0);
        const speed = Math.sqrt(vx * vx + vy * vy);
        const [r, g, b] = velColor(speed, U * 2.2);
        const idx = (j * iw + i) * 4;
        data[idx] = r;
        data[idx + 1] = g;
        data[idx + 2] = b;
        data[idx + 3] = 60;
      }
    }
    return { iw, ih, data };
  }

  function drawTunnelShape(ctx, shape, cx, cy) {
    ctx.save();
    ctx.translate(cx, cy);
    if (shape.id === 'circle' || shape.id === 'sphere3d') {
      const R = 42;
      if (shape.id === 'sphere3d') {
        const g = ctx.createRadialGradient(-R * 0.3, -R * 0.3, R * 0.05, 0, 0, R);
        g.addColorStop(0, '#d0d8e8');
        g.addColorStop(0.4, '#7090b0');
        g.addColorStop(1, '#1a2a3a');
        ctx.beginPath();
        ctx.arc(0, 0, R, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();
        ctx.strokeStyle = '#3a5070';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        const hg = ctx.createRadialGradient(-R * 0.3, -R * 0.3, 0, -R * 0.28, -R * 0.28, R * 0.45);
        hg.addColorStop(0, 'rgba(255,255,255,0.55)');
        hg.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.beginPath();
        ctx.arc(0, 0, R, 0, Math.PI * 2);
        ctx.fillStyle = hg;
        ctx.fill();
      } else {
        const g = ctx.createLinearGradient(-R, -R, R, R);
        g.addColorStop(0, '#5090c0');
        g.addColorStop(1, '#1a3a5a');
        ctx.beginPath();
        ctx.arc(0, 0, R, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();
        ctx.strokeStyle = '#4a80aa';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    } else if (shape.id === 'box') {
      const w = 50,
        h = 90;
      const g = ctx.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2);
      g.addColorStop(0, '#8080a0');
      g.addColorStop(1, '#282838');
      ctx.fillStyle = g;
      ctx.fillRect(-w / 2, -h / 2, w, h);
      ctx.strokeStyle = '#6060a0';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-w / 2, -h / 2, w, h);
    } else if (shape.id === 'airfoil') {
      const W = 110,
        H = 28;
      ctx.beginPath();
      ctx.moveTo(-W / 2, 0);
      ctx.bezierCurveTo(-W / 2 + W * 0.3, -H * 0.6, W / 2 - W * 0.2, -H * 0.5, W / 2, 0);
      ctx.bezierCurveTo(W / 2 - W * 0.15, H * 0.3, -W / 2 + W * 0.25, H * 0.2, -W / 2, 0);
      ctx.closePath();
      const g = ctx.createLinearGradient(-W / 2, -H, W / 2, H);
      g.addColorStop(0, '#a0c8f0');
      g.addColorStop(1, '#2060a0');
      ctx.fillStyle = g;
      ctx.fill();
      ctx.strokeStyle = '#5090d0';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    } else if (shape.id === 'diamond') {
      const R = 42;
      ctx.beginPath();
      ctx.moveTo(0, -R);
      ctx.lineTo(R, 0);
      ctx.lineTo(0, R);
      ctx.lineTo(-R, 0);
      ctx.closePath();
      const g = ctx.createLinearGradient(-R, -R, R, R);
      g.addColorStop(0, '#c060a0');
      g.addColorStop(1, '#401028');
      ctx.fillStyle = g;
      ctx.fill();
      ctx.strokeStyle = '#a04080';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    ctx.restore();
  }

  function tick(dt) {
    if (particles.length < N_PARTICLES) {
      particles = Array.from({ length: N_PARTICLES }, initParticle);
    }
    simTime += dt * 3;
    const shape = SHAPES[p.shapeIdx];
    const U = p.windSpeed;
    const R = getShapeR(shape);

    if (bgDirty && p.showPressure) {
      bgCache = buildBgImageData(U, shape);
      bgDirty = false;
    }

    for (const pt of particles) {
      pt.trail.push({ x: pt.x, y: pt.y });
      if (pt.trail.length > 9) pt.trail.shift();

      const { vx, vy } = velField(pt.x, pt.y, OBJ_CX, OBJ_CY, R, U, shape.id, simTime);
      pt.x += vx * dt;
      pt.y += vy * dt;

      const dx = pt.x - OBJ_CX,
        dy = pt.y - OBJ_CY;
      const reset =
        pt.x > TN_RIGHT + 20 ||
        pt.x < TN_LEFT - 40 ||
        pt.y < TN_TOP - 5 ||
        pt.y > TN_BOT + 5 ||
        dx * dx + dy * dy < R * R * 0.98;
      if (reset) {
        pt.x = TN_LEFT - Math.random() * 25;
        pt.y = TN_TOP + Math.random() * (TN_BOT - TN_TOP);
        pt.trail = [];
      }
    }
  }

  function render() {
    const W = canvas.width,
      H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#06080f';
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = 'rgba(255,255,255,0.025)';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 28) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    for (let y = 0; y < H; y += 28) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }

    const shape = SHAPES[p.shapeIdx];
    const U = p.windSpeed;

    if (p.showPressure && bgCache && typeof OffscreenCanvas !== 'undefined') {
      const { iw, ih, data } = bgCache;
      const offCanvas = new OffscreenCanvas(iw, ih);
      const offCtx = offCanvas.getContext('2d');
      const imgData = offCtx.createImageData(iw, ih);
      imgData.data.set(data);
      offCtx.putImageData(imgData, 0, 0);
      ctx.drawImage(offCanvas, TN_LEFT, TN_TOP, TN_RIGHT - TN_LEFT, TN_BOT - TN_TOP);
    }

    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    ctx.fillRect(TN_LEFT, 0, TN_RIGHT - TN_LEFT, TN_TOP);
    ctx.fillRect(TN_LEFT, TN_BOT, TN_RIGHT - TN_LEFT, H - TN_BOT);
    ctx.strokeStyle = '#3a4a60';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(TN_LEFT, TN_TOP);
    ctx.lineTo(TN_RIGHT, TN_TOP);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(TN_LEFT, TN_BOT);
    ctx.lineTo(TN_RIGHT, TN_BOT);
    ctx.stroke();

    for (let y = TN_TOP + 20; y < TN_BOT; y += 38) {
      const lenY = OBJ_CY - y;
      const dist = Math.sqrt((TN_LEFT - OBJ_CX) ** 2 + lenY ** 2);
      const speed = Math.min(1, U / (U + 20));
      const arrowLen = 18 + speed * 10;
      ctx.beginPath();
      ctx.moveTo(TN_LEFT + 5, y);
      ctx.lineTo(TN_LEFT + 5 + arrowLen, y);
      ctx.strokeStyle = `rgba(96,165,250,${0.3 + speed * 0.3})`;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(TN_LEFT + 5 + arrowLen, y);
      ctx.lineTo(TN_LEFT + 5 + arrowLen - 5, y - 3);
      ctx.lineTo(TN_LEFT + 5 + arrowLen - 5, y + 3);
      ctx.closePath();
      ctx.fillStyle = `rgba(96,165,250,${0.3 + speed * 0.3})`;
      ctx.fill();
    }

    const R = getShapeR(shape);

    if (p.showStreamlines) {
      const nLines = 12;
      for (let si = 0; si < nLines; si++) {
        const startY = TN_TOP + 15 + (si / (nLines - 1)) * (TN_BOT - TN_TOP - 30);
        ctx.beginPath();
        let px = TN_LEFT + 5,
          py = startY;
        ctx.moveTo(px, py);
        for (let step = 0; step < 200; step++) {
          const { vx, vy } = velField(px, py, OBJ_CX, OBJ_CY, R, U, shape.id, simTime);
          const speedSp = Math.sqrt(vx * vx + vy * vy);
          if (speedSp < 0.1) break;
          const dt = 3 / speedSp;
          px += vx * dt;
          py += vy * dt;
          if (px > TN_RIGHT + 10 || py < TN_TOP - 5 || py > TN_BOT + 5) break;
          const dx = px - OBJ_CX,
            dy = py - OBJ_CY;
          if (dx * dx + dy * dy < R * R) break;
          ctx.lineTo(px, py);
        }
        const norm = si / (nLines - 1);
        ctx.strokeStyle = `rgba(${Math.round(60 + norm * 100)},${Math.round(150 - norm * 80)},${Math.round(255 - norm * 100)},0.35)`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    for (const pt of particles) {
      const { vx, vy } = velField(pt.x, pt.y, OBJ_CX, OBJ_CY, R, U, shape.id, simTime);
      const speedSp = Math.sqrt(vx * vx + vy * vy);
      const [r, g, b] = velColor(speedSp, U * 2.2);

      if (pt.trail.length > 1) {
        ctx.beginPath();
        ctx.moveTo(pt.trail[0].x, pt.trail[0].y);
        for (let ti = 1; ti < pt.trail.length; ti++) ctx.lineTo(pt.trail[ti].x, pt.trail[ti].y);
        const grad = ctx.createLinearGradient(pt.trail[0].x, pt.trail[0].y, pt.x, pt.y);
        grad.addColorStop(0, `rgba(${r},${g},${b},0.0)`);
        grad.addColorStop(1, `rgba(${r},${g},${b},0.6)`);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 1.8, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,0.9)`;
      ctx.shadowBlur = 8;
      ctx.shadowColor = `rgba(${r},${g},${b},1)`;
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    if (mouseProbe && mouseProbe.active) {
      const { vx: probeVx, vy: probeVy } = velField(
        mouseProbe.x,
        mouseProbe.y,
        OBJ_CX,
        OBJ_CY,
        R,
        U,
        shape.id,
        simTime,
      );
      const probeSpd = Math.sqrt(probeVx * probeVx + probeVy * probeVy);
      ctx.beginPath();
      ctx.arc(mouseProbe.x, mouseProbe.y, 4, 0, Math.PI * 2);
      ctx.strokeStyle = '#4FC3F7';
      ctx.lineWidth = 2;
      ctx.stroke();
      const arrowLen = Math.min(60, probeSpd * 0.2);
      if (arrowLen > 2) {
        const normX = probeVx / probeSpd,
          normY = probeVy / probeSpd;
        ctx.beginPath();
        ctx.moveTo(mouseProbe.x, mouseProbe.y);
        ctx.lineTo(mouseProbe.x + normX * arrowLen, mouseProbe.y + normY * arrowLen);
        ctx.strokeStyle = '#FFD166';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      ctx.fillStyle = '#E6EDF3';
      ctx.font = 'bold 12px "JetBrains Mono", monospace';
      ctx.fillText(`${(probeSpd * 0.1).toFixed(1)} m/s`, mouseProbe.x + 10, mouseProbe.y - 10);
    }

    drawTunnelShape(ctx, shape, OBJ_CX, OBJ_CY);
  }

  let rafId,
    running = false,
    lastTs;
  function loop(ts) {
    if (!running) return;
    const dt = Math.min((ts - (lastTs || ts)) / 1000, 0.05);
    lastTs = ts;
    tick(dt);
    render();
    rafId = requestAnimationFrame(loop);
  }

  resize();
  render();

  return {
    start() {
      running = true;
      lastTs = performance.now();
      loop(lastTs);
    },
    stop() {
      running = false;
      cancelAnimationFrame(rafId);
    },
    reset() {
      this.stop();
      particles = [];
      simTime = 0;
      render();
      this.start();
    },
    destroy() {
      this.stop();
    },
    setParams(newP) {
      if (newP.shapeIdx !== p.shapeIdx || newP.windSpeed !== p.windSpeed) bgDirty = true;
      p = { ...p, ...newP };
    },
    getData() {
      const sh = SHAPES[p.shapeIdx];
      const v = p.windSpeed * 0.1;
      const D = 2 * getShapeR(sh) * PX_M;
      const Afront = sh.id === 'box' ? 50 * PX_M : sh.id === 'airfoil' ? 28 * PX_M : D;
      const Re = (1.225 * v * D) / 1.81e-5;
      const Cd = cdForRe(sh, Re);
      const q = 0.5 * 1.225 * v * v;
      const Fd = q * Cd * Afront;
      const Fl = q * (sh.cl || 0) * Afront;
      return {
        stepR: Re,
        forceD: Fd,
        forceL: Fl,
        pressure: q,
        velocity: v,
        cd: Cd,
      };
    },
  };
}
