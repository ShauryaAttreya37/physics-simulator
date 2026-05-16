/**
 * Gyroscope & Precession (3D) — PhET-Inspired Interactive Lab
 *
 * Physics:     Full Lagrangian mechanics of a symmetric heavy top
 * Integrator:  Adaptive Dormand-Prince RK45
 * Aesthetic:   PhET-style (light background, bold vectors, interactive)
 */

const DEFAULTS = {
  mass: 1.5,
  gravity: 9.81,
  cmOffset: 0.35,
  rotorRadius: 0.35,
  inertiaSpin: 0.05,
  spinRate: 150,
  tiltAngle: 1.0,
  startOmegaPsi: 150,
  startOmegaPhi: 0,
  damping: 0.015,
  spinDecay: 0.002,
  trail: 300,
  tolerance: 1e-7,
  // PhET-style toggles
  showVectors: true,
  showPath: true,
  showGrid: true,
  showLabels: true,
  slowMotion: false,
};

export const defaultParams = { ...DEFAULTS };

export const equationSections = [
  {
    title: 'Introduction',
    content:
      'A gyroscope is a spinning wheel that resists changes to its orientation. When tilted, instead of falling, it precesses (moves in a circle around the vertical). This counterintuitive behavior comes from angular momentum conservation.',
  },
  {
    title: 'Torque & Angular Momentum',
    equations: [
      {
        latex: String.raw`\vec{\tau} = \frac{d\vec{L}}{dt}`,
        description: 'Torque equals the rate of change of angular momentum.',
      },
      {
        latex: String.raw`\Omega_p \approx \frac{mgr}{I_s \omega_s}`,
        description:
          'Precession rate (approximate). Faster spin rate (ω_s) leads to slower precession (Ω_p).',
      },
    ],
  },
  {
    title: 'Equations of Motion',
    equations: [
      {
        latex: String.raw`\ddot{\theta} = \dot{\phi}^2\sin\theta\cos\theta - \frac{I_3}{I_1}\omega_3\dot{\phi}\sin\theta + \frac{mgl}{I_1}\sin\theta - \gamma_\theta\dot{\theta}`,
        description: 'Equation for nutation (bobbing).',
      },
      {
        latex: String.raw`\ddot{\phi} = \frac{I_3\omega_3\dot{\theta}\sin\theta - 2I_1\dot{\phi}\dot{\theta}\sin\theta\cos\theta}{I_1\sin^2\theta}`,
        description: 'Equation for precession (circling).',
      },
    ],
  },
];

export const controls = [
  { key: 'spinRate', label: 'Initial Spin ω_s [rad/s]', min: 0, max: 300, step: 1 },
  { key: 'tiltAngle', label: 'Initial Tilt θ [rad]', min: 0.01, max: 3.1, step: 0.01 },
  { key: 'mass', label: 'Wheel Mass [kg]', min: 0.1, max: 5, step: 0.1 },
  { key: 'cmOffset', label: 'Pivot Distance ℓ [m]', min: 0.05, max: 0.8, step: 0.01 },
  { key: 'gravity', label: 'Gravity [m/s²]', min: 0, max: 20, step: 0.1 },
  { key: 'damping', label: 'Friction', min: 0, max: 0.1, step: 0.001 },
  { type: 'toggle', key: 'showVectors', label: 'Show Force Vectors' },
  { type: 'toggle', key: 'showPath', label: 'Show Precession Path' },
  { type: 'toggle', key: 'showGrid', label: 'Show Reference Grid' },
  { type: 'toggle', key: 'slowMotion', label: 'Slow Motion' },
];

export const graphParams = [
  { key: 'theta', label: 'Tilt Angle θ' },
  { key: 'phi_vel', label: 'Precession Rate ω_p' },
  { key: 'omega3', label: 'Spin Rate ω_s' },
  { key: 'energy', label: 'Total Energy' },
];

export const method = 'rk45';

// ── Physics ─────────────────────────────────────────────────────────────────

function derivs(state, p) {
  const [th, , , th_v, ph_v, ps_v] = state;
  const I3 = p.inertiaSpin;
  const I1 = I3 / 2 + p.mass * p.cmOffset * p.cmOffset;

  const sin_th = Math.sin(th);
  const cos_th = Math.cos(th);
  const s_th_clamped = Math.abs(sin_th) < 1e-4 ? Math.sign(sin_th) * 1e-4 || 1e-4 : sin_th;

  const omega3 = ps_v + ph_v * cos_th;

  const dth_v =
    ph_v * ph_v * sin_th * cos_th -
    (I3 / I1) * omega3 * ph_v * sin_th +
    ((p.mass * p.gravity * p.cmOffset) / I1) * sin_th -
    p.damping * th_v;

  const spin_term = I3 * omega3 * th_v * sin_th + I3 * (p.spinDecay * omega3) * cos_th;
  const ph_term = 2 * I1 * ph_v * th_v * sin_th * cos_th;
  const dph_v = (spin_term - ph_term - p.damping * ph_v) / (I1 * s_th_clamped * s_th_clamped);

  const dps_v = -p.spinDecay * omega3 - dph_v * cos_th + ph_v * th_v * sin_th;

  return [th_v, ph_v, ps_v, dth_v, dph_v, dps_v];
}

function hamiltonian(state, p) {
  const [th, , , th_v, ph_v, ps_v] = state;
  const I3 = p.inertiaSpin;
  const I1 = I3 / 2 + p.mass * p.cmOffset * p.cmOffset;
  const sin_th = Math.sin(th);
  const cos_th = Math.cos(th);
  const omega3 = ps_v + ph_v * cos_th;

  const T = 0.5 * I1 * (th_v * th_v + ph_v * ph_v * sin_th * sin_th) + 0.5 * I3 * omega3 * omega3;
  const V = p.mass * p.gravity * p.cmOffset * cos_th;
  return T + V;
}

// ── RK45 Solver ─────────────────────────────────────────────────────────────

const A = [
  [],
  [1 / 5],
  [3 / 40, 9 / 40],
  [44 / 45, -56 / 15, 32 / 9],
  [19372 / 6561, -25360 / 2187, 64448 / 6561, -212 / 729],
  [9017 / 3168, -355 / 33, 46732 / 5247, 49 / 176, -5103 / 18656],
  [35 / 384, 0, 500 / 1113, 125 / 192, -2187 / 6784, 11 / 84],
];
const B5 = [35 / 384, 0, 500 / 1113, 125 / 192, -2187 / 6784, 11 / 84, 0];
const B4 = [5179 / 57600, 0, 7571 / 16695, 393 / 640, -92097 / 339200, 187 / 2100, 1 / 40];

function rk45Step(state, h, p, tol) {
  const k = [];
  for (let i = 0; i < 7; i++) {
    const s = [0, 0, 0, 0, 0, 0];
    for (let j = 0; j < i; j++) {
      for (let d = 0; d < 6; d++) s[d] += A[i][j] * k[j][d];
    }
    k[i] = derivs(
      state.map((v, d) => v + h * s[d]),
      p,
    );
  }

  const y5 = state.map((v, d) => {
    let sum = v;
    for (let i = 0; i < 7; i++) sum += h * B5[i] * k[i][d];
    return sum;
  });

  const y4 = state.map((v, d) => {
    let sum = v;
    for (let i = 0; i < 7; i++) sum += h * B4[i] * k[i][d];
    return sum;
  });

  let errMax = 0;
  for (let d = 0; d < 6; d++) {
    const scale = Math.max(Math.abs(y5[d]), Math.abs(state[d]), 1e-10);
    errMax = Math.max(errMax, Math.abs(y5[d] - y4[d]) / scale);
  }
  errMax /= tol;

  const safety = 0.9;
  let hNew;
  if (errMax <= 1) {
    hNew = errMax > 0 ? h * Math.min(5, safety * Math.pow(errMax, -0.2)) : h * 2;
    return { state: y5, hNew, accepted: true };
  } else {
    hNew = h * Math.max(0.2, safety * Math.pow(errMax, -0.25));
    return { state: null, hNew, accepted: false };
  }
}

// ── Rendering Helpers ───────────────────────────────────────────────────────

function project(world, camera, centerX, centerY, focal) {
  // Rotate Z (Yaw)
  const cy = Math.cos(camera.yaw),
    sy = Math.sin(camera.yaw);
  let x1 = world.x * cy - world.y * sy;
  let y1 = world.y * cy + world.x * sy;
  let z1 = world.z;

  // Rotate X (Pitch)
  const cp = Math.cos(camera.pitch),
    sp = Math.sin(camera.pitch);
  const z2 = z1 * cp - y1 * sp;
  const y2 = y1 * cp + z1 * sp;

  const depth = y2 + camera.distance;
  const scale = focal / Math.max(0.1, depth);
  return {
    x: centerX + x1 * scale,
    y: centerY - z2 * scale,
    z: depth,
    scale,
  };
}

// ── Factory ─────────────────────────────────────────────────────────────────

export const scenarios = [
  {
    name: 'Classic Bicycle Wheel',
    description:
      'High spin rate creates stable, steady precession. This is the classic classroom demonstration.',
    params: { spinRate: 180, tiltAngle: 1.2, showPath: true, showVectors: true },
  },
  {
    name: 'Nutation (The Wobble)',
    description:
      'Slow spin rate causes the gyroscope to bob up and down while precessing. This is called nutation.',
    params: { spinRate: 40, tiltAngle: 1.0, showPath: true, damping: 0.005 },
  },
  {
    name: 'Sleeping Top',
    description:
      'Spinning nearly upright. If spin is fast enough, it stays stable. If too slow, it starts to precess and fall.',
    params: { spinRate: 200, tiltAngle: 0.05, showGrid: true },
  },
  {
    name: 'Zero Gravity',
    description:
      'In zero-g, there is no gravitational torque, so the gyroscope stays perfectly fixed in space regardless of tilt.',
    params: { gravity: 0, spinRate: 100, tiltAngle: 1.0 },
  },
];

export const guidedExperiments = [
  {
    title: 'The Secret of Stability',
    steps: [
      {
        instruction: 'Set the Spin Rate to 0 and observe the wheel.',
        params: { spinRate: 0, tiltAngle: 1.0 },
        question: 'What happens to the wheel when it is not spinning?',
        choices: ['It stays upright', 'It falls down immediately', 'It starts precessing'],
        correctIndex: 1,
        explanation:
          'Without angular momentum, gravity simply pulls the mass down, causing it to fall.',
      },
      {
        instruction: 'Now set the Spin Rate to 200 rad/s.',
        params: { spinRate: 200, tiltAngle: 1.0 },
        question: 'What changed?',
        choices: ['It falls even faster', 'It stays fixed', 'It moves sideways (precesses)'],
        correctIndex: 2,
        explanation:
          'The spinning creates angular momentum. The torque from gravity now causes the angular momentum vector to rotate horizontally, resulting in precession!',
      },
    ],
  },
];

export function create(canvas, initParams = {}) {
  const ctx = canvas.getContext('2d', { alpha: false });
  let p = { ...DEFAULTS, ...initParams };

  let state = [p.tiltAngle, 0, 0, 0, 0, p.spinRate];
  let simTime = 0;
  let currentDt = 1 / 600;
  let H0 = 0;

  let trail = [];

  const camera = { yaw: -0.6, pitch: -0.4, distance: 3.5 };
  let isDragging = false,
    lastX,
    lastY;

  // Interaction: Dragging the camera vs dragging the top
  let interactionMode = 'camera'; // 'camera' or 'manipulate'

  function onDown(e) {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX ?? e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY ?? e.touches?.[0]?.clientY) - rect.top;
    if (x === undefined) return;

    isDragging = true;
    lastX = x;
    lastY = y;

    // Check if clicking near the top of the gyroscope
    const { axis } = getAxisAndCenter();
    const tip = { x: axis.x * 0.6, y: axis.y * 0.6, z: axis.z * 0.6 };
    const pTip = project(
      tip,
      camera,
      canvas.width * 0.5,
      canvas.height * 0.6,
      Math.min(canvas.width, canvas.height),
    );
    const dist = Math.hypot(pTip.x - x, pTip.y - y);

    if (dist < 40) {
      interactionMode = 'manipulate';
      canvas.style.cursor = 'grabbing';
    } else {
      interactionMode = 'camera';
    }
  }

  function onMove(e) {
    if (!isDragging) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX ?? e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY ?? e.touches?.[0]?.clientY) - rect.top;

    if (interactionMode === 'camera') {
      camera.yaw += (x - lastX) * 0.01;
      camera.pitch = Math.max(-1.5, Math.min(0.5, camera.pitch + (y - lastY) * 0.01));
    } else {
      // Manipulate tilt angle θ
      const dTh = (y - lastY) * 0.01;
      state[0] = Math.max(0.01, Math.min(Math.PI - 0.01, state[0] + dTh));
      state[3] = 0; // Reset velocities while dragging for "holding" feel
      state[4] = 0;
      trail = []; // Clear trail when manually moved
    }

    lastX = x;
    lastY = y;
  }

  function onUp() {
    isDragging = false;
    canvas.style.cursor = 'default';
  }

  function onWheel(e) {
    e.preventDefault();
    camera.distance = Math.max(1.5, Math.min(10, camera.distance + e.deltaY * 0.005));
  }

  canvas.addEventListener('mousedown', onDown);
  canvas.addEventListener('touchstart', onDown, { passive: true });
  window.addEventListener('mousemove', onMove);
  window.addEventListener('touchmove', onMove, { passive: true });
  window.addEventListener('mouseup', onUp);
  window.addEventListener('touchend', onUp);
  canvas.addEventListener('wheel', onWheel, { passive: false });

  function getAxisAndCenter() {
    const th = state[0],
      ph = state[1];
    const axis = {
      x: Math.sin(th) * Math.cos(ph),
      y: Math.sin(th) * Math.sin(ph),
      z: Math.cos(th),
    };
    const center = { x: axis.x * p.cmOffset, y: axis.y * p.cmOffset, z: axis.z * p.cmOffset };
    return { axis, center };
  }

  function tick(dt) {
    let remaining = dt;
    const tol = p.tolerance || 1e-7;
    let steps = 0;
    while (remaining > 1e-12 && steps < 100) {
      const h = Math.min(currentDt, remaining);
      const res = rk45Step(state, h, p, tol);
      if (res.accepted) {
        state = res.state;
        remaining -= h;
        simTime += h;
      }
      currentDt = Math.max(1e-6, Math.min(res.hNew, 0.01));
      steps++;
    }

    // Trail update
    if (p.showPath) {
      const { center } = getAxisAndCenter();
      trail.push({ ...center });
      if (trail.length > p.trail) trail.shift();
    } else {
      trail = [];
    }
  }

  function render() {
    const W = canvas.width,
      H = canvas.height;
    const cx = W * 0.5,
      cy = H * 0.6;
    const focal = Math.min(W, H) * 1.0;

    // PhET light background - slightly warmer
    ctx.fillStyle = '#fdfdfd';
    ctx.fillRect(0, 0, W, H);

    // Grid / Floor (Classroom Tiles)
    if (p.showGrid) {
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.3)';
      ctx.lineWidth = 1.5;
      const gridSize = 10,
        step = 0.5;
      for (let i = -gridSize; i <= gridSize; i++) {
        const p1 = project({ x: i * step, y: -gridSize * step, z: -1.0 }, camera, cx, cy, focal);
        const p2 = project({ x: i * step, y: gridSize * step, z: -1.0 }, camera, cx, cy, focal);
        if (p1.z > 0 && p2.z > 0) {
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }
        const p3 = project({ x: -gridSize * step, y: i * step, z: -1.0 }, camera, cx, cy, focal);
        const p4 = project({ x: gridSize * step, y: i * step, z: -1.0 }, camera, cx, cy, focal);
        if (p3.z > 0 && p4.z > 0) {
          ctx.beginPath();
          ctx.moveTo(p3.x, p3.y);
          ctx.lineTo(p4.x, p4.y);
          ctx.stroke();
        }
      }
    }

    const { axis, center } = getAxisAndCenter();

    // ── Shadow ──
    if (p.showGrid) {
      const sPos = project({ x: center.x, y: center.y, z: -1.0 }, camera, cx, cy, focal);
      if (sPos.z > 0.1) {
        const shadowR = p.rotorRadius * sPos.scale;
        const shadowGrad = ctx.createRadialGradient(sPos.x, sPos.y, 0, sPos.x, sPos.y, shadowR);
        shadowGrad.addColorStop(0, 'rgba(0,0,0,0.15)');
        shadowGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = shadowGrad;
        ctx.beginPath();
        ctx.ellipse(sPos.x, sPos.y, shadowR, shadowR * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Draw Trail
    if (p.showPath && trail.length > 1) {
      ctx.beginPath();
      ctx.strokeStyle = '#f97316';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([8, 4]);
      let first = true;
      for (const pt of trail) {
        const pr = project(pt, camera, cx, cy, focal);
        if (pr.z < 0.1) continue;
        if (first) ctx.moveTo(pr.x, pr.y);
        else ctx.lineTo(pr.x, pr.y);
        first = false;
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // ── Suspension Rope (Classroom Demo Style) ──
    const pCeiling = project({ x: 0, y: 0, z: 2.0 }, camera, cx, cy, focal);
    const pBase = project({ x: 0, y: 0, z: 0 }, camera, cx, cy, focal);

    // Draw rope from ceiling to pivot
    ctx.strokeStyle = '#fcd34d'; // hemp rope color
    ctx.lineWidth = 0.012 * pBase.scale;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(pCeiling.x, pCeiling.y);
    ctx.lineTo(pBase.x, pBase.y);
    ctx.stroke();

    // Rope twisted texture
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 0.005 * pBase.scale;
    ctx.setLineDash([0.015 * pBase.scale, 0.015 * pBase.scale]);
    ctx.beginPath();
    ctx.moveTo(pCeiling.x, pCeiling.y);
    ctx.lineTo(pBase.x, pBase.y);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw a knot at the pivot point
    const knotR = 0.02 * pBase.scale;
    ctx.fillStyle = '#fcd34d';
    ctx.beginPath();
    ctx.arc(pBase.x, pBase.y, knotR, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 1;
    ctx.stroke();

    // ── Axle (Cylindrical Lighting) ──
    const pCenter = project(center, camera, cx, cy, focal);
    const pTip = project(
      { x: axis.x * 0.6, y: axis.y * 0.6, z: axis.z * 0.6 },
      camera,
      cx,
      cy,
      focal,
    );

    // Draw Axle Shadow
    ctx.strokeStyle = 'rgba(0,0,0,0.1)';
    ctx.lineWidth = 0.03 * pCenter.scale;
    ctx.beginPath();
    ctx.moveTo(pBase.x + 2, pBase.y + 2);
    ctx.lineTo(pTip.x + 2, pTip.y + 2);
    ctx.stroke();

    const axleGrad = ctx.createLinearGradient(pBase.x, pBase.y, pTip.x, pTip.y);
    axleGrad.addColorStop(0, '#6b7280');
    axleGrad.addColorStop(0.5, '#f3f4f6');
    axleGrad.addColorStop(1, '#374151');
    ctx.strokeStyle = axleGrad;
    ctx.lineWidth = 0.025 * pCenter.scale;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(pBase.x, pBase.y);
    ctx.lineTo(pTip.x, pTip.y);
    ctx.stroke();

    // ── Wheel (Styled High-Quality) ──
    const r = p.rotorRadius;
    const wheelSegments = 64;
    const spokeCount = 24;

    let up = { x: 0, y: 0, z: 1 };
    if (Math.abs(axis.z) > 0.9) up = { x: 0, y: 1, z: 0 };
    const v1 = normalize({
      x: up.y * axis.z - up.z * axis.y,
      y: up.z * axis.x - up.x * axis.z,
      z: up.x * axis.y - up.y * axis.x,
    });
    const v2 = normalize({
      x: axis.y * v1.z - axis.z * v1.y,
      y: axis.z * v1.x - axis.x * v1.z,
      z: axis.x * v1.y - axis.y * v1.x,
    });

    // Draw Spokes
    ctx.strokeStyle = '#e5e7eb'; // silver wires
    ctx.lineWidth = 0.005 * pCenter.scale;
    for (let i = 0; i < spokeCount; i++) {
      const ang = (i / spokeCount) * Math.PI * 2 + state[2];
      const sp = {
        x: center.x + (v1.x * Math.cos(ang) + v2.x * Math.sin(ang)) * r,
        y: center.y + (v1.y * Math.cos(ang) + v2.y * Math.sin(ang)) * r,
        z: center.z + (v1.z * Math.cos(ang) + v2.z * Math.sin(ang)) * r,
      };
      const pSpoke = project(sp, camera, cx, cy, focal);
      ctx.beginPath();
      ctx.moveTo(pCenter.x, pCenter.y);
      ctx.lineTo(pSpoke.x, pSpoke.y);
      ctx.stroke();
    }

    // Draw Rim (Double loop for thickness)
    for (let j = -1; j <= 1; j += 1) {
      const offset = j * 0.015;
      ctx.beginPath();
      for (let i = 0; i <= wheelSegments; i++) {
        const ang = (i / wheelSegments) * Math.PI * 2;
        const pt = {
          x: center.x + (v1.x * Math.cos(ang) + v2.x * Math.sin(ang)) * r + axis.x * offset,
          y: center.y + (v1.y * Math.cos(ang) + v2.y * Math.sin(ang)) * r + axis.y * offset,
          z: center.z + (v1.z * Math.cos(ang) + v2.z * Math.sin(ang)) * r + axis.z * offset,
        };
        const pr = project(pt, camera, cx, cy, focal);
        if (i === 0) ctx.moveTo(pr.x, pr.y);
        else ctx.lineTo(pr.x, pr.y);
      }
      ctx.strokeStyle = j === 0 ? '#1f2937' : '#d1d5db'; // Black tire, silver rims
      ctx.lineWidth = (j === 0 ? 0.035 : 0.015) * pCenter.scale;
      ctx.stroke();
    }

    // Interactive Tip Highlight
    if (interactionMode === 'manipulate' || isHoveringTip(lastX, lastY)) {
      ctx.fillStyle = 'rgba(59, 130, 246, 0.3)';
      ctx.beginPath();
      ctx.arc(pTip.x, pTip.y, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Vectors
    if (p.showVectors) {
      drawVector(center, { x: center.x, y: center.y, z: center.z - 0.5 }, '#22c55e', 'F_g');
      drawVector(
        center,
        { x: center.x + axis.x * 0.6, y: center.y + axis.y * 0.6, z: center.z + axis.z * 0.6 },
        '#3b82f6',
        'L',
      );

      const tDir = { x: -center.y, y: center.x, z: 0 };
      const tLen = Math.hypot(tDir.x, tDir.y, tDir.z);
      if (tLen > 0.01) {
        drawVector(
          { x: 0, y: 0, z: 0 },
          { x: (tDir.x / tLen) * 0.5, y: (tDir.y / tLen) * 0.5, z: 0 },
          '#ef4444',
          'τ',
        );
      }
    }

    function drawVector(start, end, color, label) {
      const ps = project(start, camera, cx, cy, focal);
      const pe = project(end, camera, cx, cy, focal);
      if (ps.z < 0.1 || pe.z < 0.1) return;

      // Arrow Body with Shadow
      ctx.strokeStyle = 'rgba(0,0,0,0.1)';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(ps.x + 2, ps.y + 2);
      ctx.lineTo(pe.x + 2, pe.y + 2);
      ctx.stroke();

      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(ps.x, ps.y);
      ctx.lineTo(pe.x, pe.y);
      ctx.stroke();

      const angle = Math.atan2(pe.y - ps.y, pe.x - ps.x);
      ctx.beginPath();
      ctx.moveTo(pe.x, pe.y);
      ctx.lineTo(pe.x - 12 * Math.cos(angle - 0.4), pe.y - 12 * Math.sin(angle - 0.4));
      ctx.lineTo(pe.x - 12 * Math.cos(angle + 0.4), pe.y - 12 * Math.sin(angle + 0.4));
      ctx.fill();

      if (label && p.showLabels) {
        ctx.font = '800 16px "Inter", sans-serif';
        ctx.shadowBlur = 4;
        ctx.shadowColor = 'rgba(255,255,255,0.8)';
        ctx.fillText(label, pe.x + 12, pe.y + 5);
        ctx.shadowBlur = 0;
      }
    }
  }

  function normalize(v) {
    const l = Math.hypot(v.x, v.y, v.z) || 1;
    return { x: v.x / l, y: v.y / l, z: v.z / l };
  }

  function isHoveringTip(mx, my) {
    if (!mx || !my) return false;
    const { axis } = getAxisAndCenter();
    const tip = { x: axis.x * 0.6, y: axis.y * 0.6, z: axis.z * 0.6 };
    const pTip = project(
      tip,
      camera,
      canvas.width * 0.5,
      canvas.height * 0.6,
      Math.min(canvas.width, canvas.height),
    );
    return Math.hypot(pTip.x - mx, pTip.y - my) < 30;
  }

  let raf,
    lastTs,
    running = false;
  function loop(ts) {
    if (!running) return;
    const dt = lastTs ? Math.min((ts - lastTs) / 1000, 0.05) : 1 / 60;
    lastTs = ts;

    const speedScale = (p.slowMotion ? 0.2 : 1.0) * (p.speed || 1.0);
    tick(dt * speedScale);
    render();
    raf = requestAnimationFrame(loop);
  }

  // Initial State
  H0 = hamiltonian(state, p);

  return {
    start: () => {
      running = true;
      lastTs = 0;
      raf = requestAnimationFrame(loop);
    },
    stop: () => {
      running = false;
      cancelAnimationFrame(raf);
    },
    reset: () => {
      state = [p.tiltAngle, 0, 0, 0, 0, p.spinRate];
      trail = [];
      render();
    },
    setParams: (newParams) => {
      const oldTilt = p.tiltAngle;
      const oldSpin = p.spinRate;
      p = { ...p, ...newParams };
      if (Math.abs(p.tiltAngle - oldTilt) > 1e-4 || Math.abs(p.spinRate - oldSpin) > 1e-4) {
        state[0] = p.tiltAngle;
        state[5] = p.spinRate;
      }
      render();
    },
    setSpeed: (s) => {
      p.speed = s;
    },
    getData: () => ({
      time: simTime,
      theta: state[0],
      phi_vel: state[4],
      omega3: state[5] + state[4] * Math.cos(state[0]),
      energy: hamiltonian(state, p),
    }),
    destroy: () => {
      running = false;
      cancelAnimationFrame(raf);
      canvas.removeEventListener('mousedown', onDown);
      canvas.removeEventListener('touchstart', onDown);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchend', onUp);
      canvas.removeEventListener('wheel', onWheel);
    },
  };
}
