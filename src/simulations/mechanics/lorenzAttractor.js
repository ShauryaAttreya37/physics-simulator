/**
 * Lorenz Attractor — Makie-Quality Smooth Rendering
 * 
 * The classic Lorenz system: three coupled ODEs that produce the
 * iconic "butterfly" attractor.
 *
 * Integrator: RK4 with sub-stepping
 * Rendering:  3D → 2D perspective projection with dual-axis rotation,
 *             smooth Bézier curve trail, Viridis colormap, depth-aware
 *             line thickness, ambient glow, mouse drag rotation, scroll zoom.
 */

import { sampleColormap } from '../../utils/colormaps';
import { rk4 } from '../../physics/solvers';

const DEFAULTS = {
  sigma: 10,
  rho: 28,
  beta: 8 / 3,
  trailMax: 3000,
  substeps: 12,
  dt: 0.005,
  rotSpeed: 0.08,
  projScale: 8,
};

export const defaultParams = { ...DEFAULTS };

export const equationSections = [
  {
    title: 'Lorenz System',
    equations: [
      {
        latex: String.raw`\dot{x} = \sigma(y - x)`,
        description: 'Rate of convective overturning.',
      },
      {
        latex: String.raw`\dot{y} = x(\rho - z) - y`,
        description: 'Horizontal temperature variation.',
      },
      {
        latex: String.raw`\dot{z} = xy - \beta z`,
        description: 'Vertical temperature variation.',
      },
    ],
    variables: [
      { symbol: 'σ', description: 'Prandtl number (ratio of viscosity to thermal diffusivity)' },
      { symbol: 'ρ', description: 'Rayleigh number (drives convection; chaos onset at ρ ≈ 24.74)' },
      { symbol: 'β', description: 'Geometric factor of the convection cell' },
    ],
  },
  {
    title: 'Properties',
    equations: [
      {
        latex: String.raw`\text{Divergence: } \nabla \cdot \mathbf{F} = -(\sigma + 1 + \beta) < 0`,
        description: 'The system is dissipative — phase space volumes contract exponentially.',
      },
      {
        latex: String.raw`\text{Lyapunov exponents: } \lambda_1 \approx 0.906, \; \lambda_2 = 0, \; \lambda_3 \approx -14.57`,
        description: 'For standard parameters (σ=10, ρ=28, β=8/3). One positive exponent ⟹ chaos.',
      },
    ],
  },
];

export const equations = [
  String.raw`\dot{x} = \sigma(y - x)`,
  String.raw`\dot{y} = x(\rho - z) - y`,
  String.raw`\dot{z} = xy - \beta z`,
];

export const graphParams = [
  { key: 'x', label: 'x(t)' },
  { key: 'y', label: 'y(t)' },
  { key: 'z', label: 'z(t)' },
  { key: 'speed', label: '|v|' },
];

export const controls = [
  { key: 'sigma', label: 'σ (Prandtl)', min: 1, max: 30, step: 0.1 },
  { key: 'rho', label: 'ρ (Rayleigh)', min: 0.1, max: 50, step: 0.1 },
  { key: 'beta', label: 'β (Geometry)', min: 0.1, max: 8, step: 0.05 },
  { key: 'trailMax', label: 'Trail Length', min: 400, max: 6000, step: 50 },
  { key: 'substeps', label: 'Substeps', min: 2, max: 30, step: 1 },
  { key: 'rotSpeed', label: 'Auto-Rotate', min: 0, max: 0.5, step: 0.01 },
  { key: 'projScale', label: 'Scale', min: 3, max: 20, step: 0.5 },
];

export const method = 'rk4';

// ── Lorenz derivatives ─────────────────────────────────────────────────────
function lorenzDerivs(state, p) {
  const [x, y, z] = state;
  return [
    p.sigma * (y - x),
    x * (p.rho - z) - y,
    x * y - p.beta * z,
  ];
}

// ── 3D Projection with dual-axis rotation ──────────────────────────────────
function project3D(x, y, z, yaw, pitch, cx, cy, scale) {
  // Rotate around Z axis (yaw)
  const cosY = Math.cos(yaw), sinY = Math.sin(yaw);
  let rx = x * cosY - y * sinY;
  let ry = x * sinY + y * cosY;
  let rz = z;

  // Rotate around X axis (pitch/tilt)
  const cosP = Math.cos(pitch), sinP = Math.sin(pitch);
  const ry2 = ry * cosP - rz * sinP;
  const rz2 = ry * sinP + rz * cosP;
  ry = ry2;
  rz = rz2;

  // Perspective projection
  const fov = 220;
  const depth = ry + 60;
  const factor = fov / (fov + depth);

  return {
    sx: cx + rx * scale * factor,
    sy: cy - (rz - 22) * scale * factor,
    depth,
    factor,
  };
}

export function create(canvas, initParams = {}) {
  const ctx = canvas.getContext('2d');
  const p = { ...DEFAULTS, ...initParams };

  let x, y, z;
  let trail;       // Float64Array ring buffer for performance
  let trailLen, trailHead, trailCap;
  let simTime, stepCount;
  let yaw, pitch;  // view angles
  let speedScale = 1.0;

  // Mouse interaction state
  let isDragging = false;
  let lastMouseX = 0, lastMouseY = 0;
  let userZoom = 1.0;

  function initState() {
    x = 1; y = 1; z = 1;
    trailCap = Math.max(200, Math.floor(p.trailMax));
    trail = new Float64Array(trailCap * 3);
    trailLen = 0;
    trailHead = 0;
    simTime = 0;
    stepCount = 0;
    yaw = 0;
    pitch = -0.35; // slight downward tilt like Makie default
  }

  function pushTrailPoint(px, py, pz) {
    trail[trailHead * 3] = px;
    trail[trailHead * 3 + 1] = py;
    trail[trailHead * 3 + 2] = pz;
    trailHead = (trailHead + 1) % trailCap;
    if (trailLen < trailCap) trailLen++;
  }

  function getTrailPoint(i) {
    // i=0 is oldest, i=trailLen-1 is newest
    const idx = (trailHead - trailLen + i + trailCap) % trailCap;
    return [trail[idx * 3], trail[idx * 3 + 1], trail[idx * 3 + 2]];
  }

  function tick(dt) {
    const steps = Math.max(1, Math.floor(p.substeps));
    const h = p.dt;

    for (let i = 0; i < steps; i++) {
      [x, y, z] = rk4([x, y, z], h, lorenzDerivs, p);
      simTime += h;
      stepCount++;
    }

    pushTrailPoint(x, y, z);
    yaw += p.rotSpeed * dt;
  }

  function render() {
    const W = canvas.width, H = canvas.height;

    // Background with subtle gradient
    const bgGrad = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W * 0.7);
    bgGrad.addColorStop(0, '#08081a');
    bgGrad.addColorStop(1, '#020210');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    const cx = W / 2;
    const cy = H / 2;
    const scale = p.projScale * userZoom;

    if (trailLen < 2) return;

    // Pre-project all visible trail points
    const projected = [];
    for (let i = 0; i < trailLen; i++) {
      const [tx, ty, tz] = getTrailPoint(i);
      projected.push(project3D(tx, ty, tz, yaw, pitch, cx, cy, scale));
    }

    // --- Draw smooth trail with quadratic Bézier curves ---
    // We batch segments into groups of ~4 for smoother, fewer draw calls
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const batchSize = 3; // draw curves in batches for smoothness
    for (let i = 1; i < trailLen; i++) {
      const frac = i / trailLen;
      const [r, g, b] = sampleColormap('viridis', frac);
      const alpha = 0.08 + frac * 0.88;
      const lineW = (0.4 + frac * 2.4) * projected[i].factor;

      ctx.beginPath();

      if (i >= 2 && i < trailLen - 1) {
        // Use quadratic Bézier for smoothness
        // Control point is the current point, endpoints are midpoints
        const prev = projected[i - 1];
        const curr = projected[i];
        const midX = (prev.sx + curr.sx) / 2;
        const midY = (prev.sy + curr.sy) / 2;

        if (i === 2) {
          ctx.moveTo(projected[0].sx, projected[0].sy);
          ctx.lineTo(projected[1].sx, projected[1].sy);
        }

        const prevMidX = (projected[i - 2].sx + prev.sx) / 2;
        const prevMidY = (projected[i - 2].sy + prev.sy) / 2;

        ctx.moveTo(prevMidX, prevMidY);
        ctx.quadraticCurveTo(prev.sx, prev.sy, midX, midY);
      } else {
        // Fallback to straight line for first/last segments
        ctx.moveTo(projected[i - 1].sx, projected[i - 1].sy);
        ctx.lineTo(projected[i].sx, projected[i].sy);
      }

      ctx.strokeStyle = `rgba(${r},${g},${b},${alpha})`;
      ctx.lineWidth = lineW;
      ctx.stroke();
    }

    // --- Glow layer: draw the last ~15% of trail again with blur for "hot" effect ---
    const glowStart = Math.floor(trailLen * 0.85);
    if (glowStart > 0 && trailLen > 10) {
      ctx.save();
      ctx.shadowBlur = 8;
      for (let i = glowStart + 1; i < trailLen; i++) {
        const frac = i / trailLen;
        const [r, g, b] = sampleColormap('viridis', frac);
        ctx.beginPath();
        ctx.moveTo(projected[i - 1].sx, projected[i - 1].sy);
        ctx.lineTo(projected[i].sx, projected[i].sy);
        ctx.strokeStyle = `rgba(${r},${g},${b},${frac * 0.5})`;
        ctx.shadowColor = `rgba(${r},${g},${b},0.6)`;
        ctx.lineWidth = (1 + frac * 3) * projected[i].factor;
        ctx.stroke();
      }
      ctx.restore();
    }

    // --- Current point with bright glow ---
    const curr = projected[trailLen - 1];
    ctx.shadowBlur = 25;
    ctx.shadowColor = '#fde725';
    ctx.beginPath();
    ctx.arc(curr.sx, curr.sy, 4.5 * curr.factor, 0, Math.PI * 2);
    ctx.fillStyle = '#fde725';
    ctx.fill();
    // Inner bright dot
    ctx.beginPath();
    ctx.arc(curr.sx, curr.sy, 2 * curr.factor, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffee';
    ctx.fill();
    ctx.shadowBlur = 0;

    // --- Fixed point markers ---
    const sqrt_br1 = Math.sqrt(p.beta * (p.rho - 1));
    if (p.rho > 1 && Number.isFinite(sqrt_br1)) {
      const fps = [
        { x: sqrt_br1, y: sqrt_br1, z: p.rho - 1 },
        { x: -sqrt_br1, y: -sqrt_br1, z: p.rho - 1 },
      ];
      for (const fp of fps) {
        const pp = project3D(fp.x, fp.y, fp.z, yaw, pitch, cx, cy, scale);
        ctx.beginPath();
        ctx.arc(pp.sx, pp.sy, 3 * pp.factor, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,255,255,0.25)';
        ctx.lineWidth = 1;
        ctx.stroke();
        // Cross marker
        ctx.beginPath();
        ctx.moveTo(pp.sx - 3, pp.sy);
        ctx.lineTo(pp.sx + 3, pp.sy);
        ctx.moveTo(pp.sx, pp.sy - 3);
        ctx.lineTo(pp.sx, pp.sy + 3);
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.stroke();
      }
    }

    // --- 3D Axis gizmo (bottom-left) ---
    const axGx = 55, axGy = H - 55;
    const axScale = 14;
    const axOrigin = project3D(0, 0, 0, yaw, pitch, axGx, axGy, axScale);
    const axisData = [
      { dx: 3, dy: 0, dz: 0, label: 'X', color: '#f97316' },
      { dx: 0, dy: 3, dz: 0, label: 'Y', color: '#60a5fa' },
      { dx: 0, dy: 0, dz: 3, label: 'Z', color: '#4ade80' },
    ];
    for (const { dx, dy, dz, label, color } of axisData) {
      const aEnd = project3D(dx, dy, dz, yaw, pitch, axGx, axGy, axScale);
      ctx.beginPath();
      ctx.moveTo(axOrigin.sx, axOrigin.sy);
      ctx.lineTo(aEnd.sx, aEnd.sy);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();
      // Arrowhead
      ctx.beginPath();
      ctx.arc(aEnd.sx, aEnd.sy, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.fillStyle = color;
      ctx.font = 'bold 10px "Montserrat", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, aEnd.sx + 10, aEnd.sy - 2);
    }

    // --- Info overlay ---
    ctx.fillStyle = 'rgba(10,10,20,0.55)';
    ctx.beginPath();
    ctx.roundRect(W - 145, 12, 132, 52, 6);
    ctx.fill();
    ctx.font = 'bold 9px "Montserrat", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillText(`t = ${simTime.toFixed(1)}s`, W - 135, 20);
    ctx.fillStyle = 'rgba(253,231,37,0.7)';
    ctx.fillText(`x=${x.toFixed(1)} y=${y.toFixed(1)} z=${z.toFixed(1)}`, W - 135, 36);

    // --- Drag hint ---
    if (simTime < 0.5) {
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.font = '10px "Montserrat", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Drag to rotate · Scroll to zoom', W / 2, H - 16);
    }
  }

  // ── Mouse interaction ────────────────────────────────────────────────────
  function onMouseDown(e) {
    isDragging = true;
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
    canvas.style.cursor = 'grabbing';
  }

  function onMouseMove(e) {
    if (!isDragging) return;
    const dx = e.clientX - lastMouseX;
    const dy = e.clientY - lastMouseY;
    yaw += dx * 0.008;
    pitch += dy * 0.008;
    // Clamp pitch to avoid flipping
    pitch = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, pitch));
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
  }

  function onMouseUp() {
    isDragging = false;
    canvas.style.cursor = 'grab';
  }

  function onWheel(e) {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.92 : 1.08;
    userZoom = Math.max(0.3, Math.min(4, userZoom * delta));
  }

  // Touch support
  function onTouchStart(e) {
    if (e.touches.length === 1) {
      isDragging = true;
      lastMouseX = e.touches[0].clientX;
      lastMouseY = e.touches[0].clientY;
    }
  }
  function onTouchMove(e) {
    if (!isDragging || e.touches.length !== 1) return;
    e.preventDefault();
    const dx = e.touches[0].clientX - lastMouseX;
    const dy = e.touches[0].clientY - lastMouseY;
    yaw += dx * 0.008;
    pitch += dy * 0.008;
    pitch = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, pitch));
    lastMouseX = e.touches[0].clientX;
    lastMouseY = e.touches[0].clientY;
  }
  function onTouchEnd() {
    isDragging = false;
  }

  function attachListeners() {
    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('mouseleave', onMouseUp);
    canvas.addEventListener('wheel', onWheel, { passive: false });
    canvas.addEventListener('touchstart', onTouchStart, { passive: true });
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    canvas.addEventListener('touchend', onTouchEnd);
    canvas.style.cursor = 'grab';
  }

  function detachListeners() {
    canvas.removeEventListener('mousedown', onMouseDown);
    canvas.removeEventListener('mousemove', onMouseMove);
    canvas.removeEventListener('mouseup', onMouseUp);
    canvas.removeEventListener('mouseleave', onMouseUp);
    canvas.removeEventListener('wheel', onWheel);
    canvas.removeEventListener('touchstart', onTouchStart);
    canvas.removeEventListener('touchmove', onTouchMove);
    canvas.removeEventListener('touchend', onTouchEnd);
  }

  let rafId, lastTs, running = false;

  function loop(ts) {
    if (!running) return;
    const rawDt = lastTs === undefined ? 1 / 60 : Math.min((ts - lastTs) / 1000, 1 / 20);
    lastTs = ts;
    tick(rawDt * speedScale);
    render();
    rafId = requestAnimationFrame(loop);
  }

  initState();
  attachListeners();
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
    destroy() { this.stop(); detachListeners(); },
    setSpeed(s) { speedScale = s; },
    getData() {
      const [dx, dy, dz] = lorenzDerivs(x, y, z, p);
      const speed = Math.sqrt(dx * dx + dy * dy + dz * dz);
      return {
        time: simTime,
        x, y, z,
        speed,
        steps: stepCount,
      };
    },
  };
}
