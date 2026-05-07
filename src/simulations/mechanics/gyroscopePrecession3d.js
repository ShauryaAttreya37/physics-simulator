/**
 * Gyroscope & Precession (3D) — Research-Grade Implementation
 *
 * Integrator:  Adaptive Dormand-Prince RK45 with error estimation
 * Physics:     Full Lagrangian mechanics of a symmetric heavy top
 * Diagnostics: Energy conservation error |ΔH/H₀|
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
  startOmegaTheta: 0,
  damping: 0.015,
  spinDecay: 0.002,
  trail: 200,
  tolerance: 1e-7,
};

export const defaultParams = { ...DEFAULTS };

export const equationSections = [
  {
    title: 'Introduction',
    content:
      'A gyroscope is a spinning wheel that resists changes to its orientation. When tilted, instead of falling, it precesses (moves in a circle around the vertical). This counterintuitive behavior comes from angular momentum conservation. Gyroscopes are used in navigation, stabilization, and toys.',
  },
  {
    title: 'Lagrangian',
    equations: [
      {
        latex: String.raw`\mathcal{L} = \frac{1}{2}I_1(\dot{\theta}^2 + \dot{\phi}^2\sin^2\theta) + \frac{1}{2}I_3(\dot{\psi} + \dot{\phi}\cos\theta)^2 - mgl\cos\theta`,
        description:
          "The Lagrangian combines kinetic energy (rotational) and potential energy (gravity). The kinetic energy depends on the three angles θ, ϕ, ψ that describe the gyroscope's orientation.",
      },
    ],
    variables: [
      { symbol: 'θ', description: 'Tilt angle from vertical (nutation)' },
      { symbol: 'ϕ', description: 'Horizontal rotation angle (precession)' },
      { symbol: 'ψ', description: 'Spin angle around its axis' },
      { symbol: 'ℓ', description: 'Distance from pivot to center of mass' },
      { symbol: 'I₁, I₃', description: 'Moments of inertia perpendicular and along spin axis' },
    ],
  },
  {
    title: 'Equations of Motion',
    equations: [
      {
        latex: String.raw`\ddot{\theta} = \dot{\phi}^2\sin\theta\cos\theta - \frac{I_3}{I_1}\omega_3\dot{\phi}\sin\theta + \frac{mgl}{I_1}\sin\theta - \gamma_\theta\dot{\theta}`,
        description:
          'How the tilt angle changes. Gravity tries to make it fall, but spin creates gyroscopic forces that cause precession instead.',
      },
      {
        latex: String.raw`\ddot{\phi} = \frac{I_3\omega_3\dot{\theta}\sin\theta + I_3 k_s\omega_3\cos\theta - 2I_1\dot{\phi}\dot{\theta}\sin\theta\cos\theta - \gamma_\phi\dot{\phi}}{I_1\sin^2\theta}`,
        description:
          'Precession rate. Fast spin makes it precess quickly. This is the key to gyroscope behavior.',
      },
      {
        latex: String.raw`\dot{\omega}_3 = -k_s\omega_3`,
        description:
          'Spin slows down over time due to friction. Gyroscopes eventually stop precessing.',
      },
    ],
  },
  {
    title: 'Conserved Quantity',
    equations: [
      {
        latex: String.raw`H = \frac{1}{2}I_1(\dot{\theta}^2 + \dot{\phi}^2\sin^2\theta) + \frac{1}{2}I_3\omega_3^2 + mgl\cos\theta`,
        description:
          'Total energy. Should stay constant, but numerical errors cause small changes. This helps check simulation accuracy.',
      },
    ],
  },
  {
    title: 'How to Use',
    content:
      '1. Set initial spin rate - higher spin gives stronger gyroscopic effects.\n2. Adjust tilt angle θ - see how it affects precession speed.\n3. Change moments of inertia - affects stability.\n4. Add damping to see realistic behavior.\n5. Watch the 3D visualization and angle graphs.',
  },
  {
    title: 'Beginner Tips',
    content:
      "Start with high spin and small tilt. Notice it doesn't fall but circles around. Try tilting more - precession gets faster. Compare with no spin - it just falls. Look at energy conservation. Experiment with different shapes (change I₁/I₃ ratio).",
  },
];

export const equations = [
  String.raw`\ddot{\theta} = \dot{\phi}^2\sin\theta\cos\theta - \frac{I_3}{I_1}\omega_3\dot{\phi}\sin\theta + \frac{mgl}{I_1}\sin\theta`,
  String.raw`\ddot{\phi} = \frac{I_3\omega_3\dot{\theta}\sin\theta - 2I_1\dot{\phi}\dot{\theta}\sin\theta\cos\theta}{I_1\sin^2\theta}`,
  String.raw`\omega_3 = \dot{\psi} + \dot{\phi}\cos\theta`,
];

export const graphParams = [
  { key: 'theta', label: 'Tilt θ [rad]' },
  { key: 'phi_vel', label: 'Precession ω_p [rad/s]' },
  { key: 'omega3', label: 'Spin ω_s [rad/s]' },
  { key: 'energy', label: 'Energy E [J]' },
  { key: 'energyError', label: '|ΔE/E₀|' },
];

export const controls = [
  { key: 'mass', label: 'Mass m [kg]', min: 0.1, max: 4, step: 0.1 },
  { key: 'gravity', label: 'Gravity g [m/s²]', min: 0, max: 20, step: 0.1 },
  { key: 'cmOffset', label: 'Pivot to COM ℓ [m]', min: 0.05, max: 0.8, step: 0.01 },
  { key: 'inertiaSpin', label: 'Spin Inertia I₃ [kg m²]', min: 0.005, max: 0.2, step: 0.001 },
  { key: 'startOmegaPsi', label: 'Initial Spin ω_s [rad/s]', min: 0, max: 320, step: 1 },
  { key: 'tiltAngle', label: 'Initial Tilt θ [rad]', min: 0.05, max: 1.5, step: 0.01 },
  { key: 'startOmegaPhi', label: 'Initial Precession [rad/s]', min: -10, max: 10, step: 0.1 },
  { key: 'damping', label: 'Pivot Damping', min: 0, max: 0.2, step: 0.001 },
  { key: 'spinDecay', label: 'Bearing Loss [1/s]', min: 0, max: 0.08, step: 0.001 },
  { key: 'trail', label: 'Trail Length', min: 0, max: 800, step: 10 },
];

export const method = 'rk45';

// ── Equations of motion ─────────────────────────────────────────────────────
function derivs(th, ph, ps, th_v, ph_v, ps_v, p) {
  const I3 = p.inertiaSpin;
  const I1 = I3 / 2 + p.mass * p.cmOffset * p.cmOffset;

  const sin_th = Math.sin(th);
  const cos_th = Math.cos(th);

  // Safe clamping to avoid singularity at perfectly upright/downward states
  const s_th_clamped = Math.abs(sin_th) < 1e-6 ? Math.sign(sin_th) * 1e-6 || 1e-6 : sin_th;

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

// ── Hamiltonian (total energy) ──────────────────────────────────────────────
function hamiltonian(th, ph, ps, th_v, ph_v, ps_v, p) {
  const I3 = p.inertiaSpin;
  const I1 = I3 / 2 + p.mass * p.cmOffset * p.cmOffset;
  const sin_th = Math.sin(th);
  const cos_th = Math.cos(th);
  const omega3 = ps_v + ph_v * cos_th;

  const T = 0.5 * I1 * (th_v * th_v + ph_v * ph_v * sin_th * sin_th) + 0.5 * I3 * omega3 * omega3;
  const V = p.mass * p.gravity * p.cmOffset * cos_th;
  return T + V;
}

// ── Dormand-Prince RK45 adaptive step ───────────────────────────────────────
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

function rk45Step(th, ph, ps, th_v, ph_v, ps_v, h, p, tol) {
  const state = [th, ph, ps, th_v, ph_v, ps_v];
  const k = [];

  for (let i = 0; i < 7; i++) {
    const s = [0, 0, 0, 0, 0, 0];
    for (let j = 0; j < i; j++) {
      for (let d = 0; d < 6; d++) s[d] += A[i][j] * k[j][d];
    }
    k[i] = derivs(
      state[0] + h * s[0],
      state[1] + h * s[1],
      state[2] + h * s[2],
      state[3] + h * s[3],
      state[4] + h * s[4],
      state[5] + h * s[5],
      p,
    );
  }

  const y5 = [0, 0, 0, 0, 0, 0];
  for (let d = 0; d < 6; d++) {
    y5[d] = state[d];
    for (let i = 0; i < 7; i++) y5[d] += h * B5[i] * k[i][d];
  }

  const y4 = [0, 0, 0, 0, 0, 0];
  for (let d = 0; d < 6; d++) {
    y4[d] = state[d];
    for (let i = 0; i < 7; i++) y4[d] += h * B4[i] * k[i][d];
  }

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

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function rotateY(v, angle) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return { x: v.x * c - v.z * s, y: v.y, z: v.z * c + v.x * s };
}

function rotateX(v, angle) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return { x: v.x, y: v.y * c - v.z * s, z: v.z * c + v.y * s };
}

function project(world, camera, centerX, centerY, focal) {
  const v1 = rotateY(world, camera.yaw);
  const v2 = rotateX(v1, camera.pitch);
  const zCam = v2.z + camera.distance;
  const scale = focal / Math.max(1, zCam);
  return {
    x: centerX + v2.x * scale,
    y: centerY - v2.y * scale,
    z: zCam,
    scale,
  };
}

export const scenarios = [
  {
    name: 'Fast Spin (Steady Precession)',
    description:
      'High initial spin avoids nutation wobble, causing a smooth slow precession, identical to the classic bicycle wheel demo.',
    params: { startOmegaPsi: 150, startOmegaPhi: 0, tiltAngle: 1.2 },
  },
  {
    name: 'Slow Spin (Nutation Petals)',
    description:
      'When released from rest with low spin, the top falls due to gravity, creating a visible bobbing motion called nutation.',
    params: { startOmegaPsi: 20, startOmegaPhi: 0, tiltAngle: 1.0, damping: 0.002, spinDecay: 0 },
  },
  {
    name: 'Sleeping Top',
    description:
      'Spinning perfectly upright. Stability is maintained as long as the spin rate is high enough. Small perturbations recover.',
    params: { startOmegaPsi: 200, startOmegaPhi: 0, tiltAngle: 0.01 },
  },
  {
    name: 'Precession from Push',
    description:
      'Give the gyroscope an initial push in the precession direction to eliminate initial dropping and attain steady precession immediately.',
    params: { startOmegaPsi: 120, startOmegaPhi: 3.5, tiltAngle: 1.0 },
  },
];

export const guidedExperiments = [
  {
    title: 'The Walter Lewin Bicycle Wheel',
    steps: [
      {
        instruction:
          'The wheel starts spinning at 150 rad/s. A strong gravity torque is pulling it down. What does the wheel do?',
        params: { startOmegaPsi: 150, startOmegaPhi: 0, tiltAngle: 1.1, damping: 0 },
        question: 'Instead of falling downwards entirely, which way does the wheel move?',
        choices: [
          'It falls straight down',
          'It orbits horizontally (Precesses)',
          'It spins backwards',
        ],
        correctIndex: 1,
        commonMisconception:
          'Many expect the wheel to just fall. However, the cross product of the gravitational torque with the angular momentum causes a perpendicular precession.',
        explanation:
          'The wheel precesses horizontally! To conserve angular momentum in the face of downward torque, the resulting motion is 90 degrees to the applied force.',
      },
      {
        instruction: 'Now lets try a very low spin rate. We reduce spin from 150 to 20 rad/s.',
        params: {
          startOmegaPsi: 20,
          startOmegaPhi: 0,
          tiltAngle: 1.1,
          damping: 0,
          spinDecay: 0,
          trail: 600,
        },
        question: 'How does the motion change?',
        choices: [
          'It falls instantly',
          'It precesses faster with a deep wobble',
          'It precesses slower',
        ],
        correctIndex: 1,
        commonMisconception:
          "Most people don't notice nutation because fast tops do it imperceptibly small. A slow gyroscope exhibits huge, petal-like bobs called nutation as it struggles to precess.",
        explanation:
          'At slow speeds, the wheel drops significantly before building up enough precession speed to "catch" itself, resulting in a cycloid or petal-like bouncing trace (Nutation).',
      },
    ],
  },
];

export function create(canvas, initParams = {}) {
  const ctx = canvas.getContext('2d', { alpha: false });
  let p = { ...DEFAULTS, ...initParams };

  let simTime = 0;
  let th, ph, ps, th_v, ph_v, ps_v;
  let currentDt = 1 / 60 / 10;
  let H0;

  let trailCap, trail, trailHead, trailLen;

  const camera = {
    yaw: -0.7,
    pitch: -0.35,
    distance: 3.2,
  };

  let isDragging = false,
    lastX = 0,
    lastY = 0;

  function onDown(e) {
    const x = e.clientX ?? e.touches?.[0]?.clientX;
    const y = e.clientY ?? e.touches?.[0]?.clientY;
    if (x === undefined) return;
    isDragging = true;
    lastX = x;
    lastY = y;
  }
  function onMove(e) {
    if (!isDragging) return;
    const x = e.clientX ?? e.touches?.[0]?.clientX;
    const y = e.clientY ?? e.touches?.[0]?.clientY;
    if (x === undefined) return;
    camera.yaw += (x - lastX) * 0.008;
    camera.pitch = clamp(camera.pitch + (y - lastY) * 0.006, -1.3, 0.4);
    lastX = x;
    lastY = y;
  }
  function onUp() {
    isDragging = false;
  }

  function onWheel(e) {
    e.preventDefault();
    camera.distance = clamp(camera.distance + e.deltaY * 0.005, 1.0, 15.0);
  }

  canvas.addEventListener('mousedown', onDown);
  canvas.addEventListener('touchstart', onDown, { passive: true });
  window.addEventListener('mousemove', onMove);
  window.addEventListener('touchmove', onMove, { passive: true });
  window.addEventListener('mouseup', onUp);
  window.addEventListener('touchend', onUp);
  canvas.addEventListener('wheel', onWheel, { passive: false });

  function allocTrail() {
    trailCap = Math.max(10, Math.floor(p.trail));
    trail = new Float32Array(trailCap * 3);
    trailHead = 0;
    trailLen = 0;
  }

  function initState() {
    simTime = 0;
    th = p.tiltAngle;
    ph = 0;
    ps = 0;
    th_v = p.startOmegaTheta;
    ph_v = p.startOmegaPhi;
    ps_v = p.startOmegaPsi;

    // Convert target spin rate to initial ps_v (which is omega3 at t=0 assuming ph_v is small initially, or exactly ps_v + ph_v*cos = startOmegaPsi)
    // Actually startOmegaPsi represents omega_s (spin rate omega_3)
    // omega_3 = ps_v + ph_v*cos(th). So ps_v = omega_3 - ph_v*cos(th)
    ps_v = p.startOmegaPsi - ph_v * Math.cos(th);

    currentDt = 1 / 60 / 20;
    H0 = hamiltonian(th, ph, ps, th_v, ph_v, ps_v, p);
    allocTrail();
  }

  function getAxisAndCenter() {
    const sTh = Math.sin(th);
    const cTh = Math.cos(th);
    const sPh = Math.sin(ph);
    const cPh = Math.cos(ph);

    // Tip of axle vector (assuming Z is UP in spherical polar coordinates)
    const axis = {
      x: sTh * cPh,
      y: sTh * sPh,
      z: cTh,
    };

    // Center of mass
    const center = {
      x: axis.x * p.cmOffset,
      y: axis.y * p.cmOffset,
      z: axis.z * p.cmOffset,
    };

    return { axis, center };
  }

  function tick(dt) {
    const tol = p.tolerance || 1e-6;
    let remaining = dt;
    let h = currentDt;
    const maxSteps = 200;
    let steps = 0;

    while (remaining > 1e-12 && steps < maxSteps) {
      h = Math.min(h, remaining);
      const result = rk45Step(th, ph, ps, th_v, ph_v, ps_v, h, p, tol);

      if (result.accepted) {
        [th, ph, ps, th_v, ph_v, ps_v] = result.state;
        remaining -= h;
        simTime += h;
      }
      h = Math.max(1e-6, Math.min(result.hNew, 0.05));
      currentDt = h;
      steps++;
    }

    // Add to trail
    const { center } = getAxisAndCenter();
    trail[trailHead * 3] = center.x;
    trail[trailHead * 3 + 1] = center.y;
    trail[trailHead * 3 + 2] = center.z;
    trailHead = (trailHead + 1) % trailCap;
    if (trailLen < trailCap) trailLen++;
  }

  function drawLine3(a, b, color, width, centerX, centerY, focal) {
    const pa = project(a, camera, centerX, centerY, focal);
    const pb = project(b, camera, centerX, centerY, focal);
    if (pa.z < 0.1 || pb.z < 0.1) return; // Behind camera
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(pa.x, pa.y);
    ctx.lineTo(pb.x, pb.y);
    ctx.stroke();
  }

  function drawVector(start, end, color, width, label, centerX, centerY, focal) {
    const pa = project(start, camera, centerX, centerY, focal);
    const pb = project(end, camera, centerX, centerY, focal);
    if (pa.z < 0.1 || pb.z < 0.1) return;
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(pa.x, pa.y);
    ctx.lineTo(pb.x, pb.y);

    const dx = pb.x - pa.x;
    const dy = pb.y - pa.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = dx / len;
    const ny = dy / len;

    ctx.lineTo(pb.x - nx * 8 + ny * 4, pb.y - ny * 8 - nx * 4);
    ctx.moveTo(pb.x, pb.y);
    ctx.lineTo(pb.x - nx * 8 - ny * 4, pb.y - ny * 8 + nx * 4);
    ctx.stroke();

    if (label) {
      ctx.font = '700 13px "JetBrains Mono", monospace';
      ctx.fillStyle = color;
      ctx.fillText(label, pb.x + nx * 12 - 6, pb.y + ny * 12 + 4);
    }
  }

  function render() {
    const W = canvas.width;
    const H = canvas.height;
    const cx = W * 0.52;
    const cy = H * 0.58;
    const focal = Math.min(W, H) * 1.0;

    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#020617');
    bg.addColorStop(1, '#0f172a');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    const { axis, center } = getAxisAndCenter();

    // Environment grids
    drawLine3(
      { x: -2.0, y: 0, z: 0 },
      { x: 2.0, y: 0, z: 0 },
      'rgba(96,165,250,0.3)',
      1,
      cx,
      cy,
      focal,
    );
    drawLine3(
      { x: 0, y: -2.0, z: 0 },
      { x: 0, y: 2.0, z: 0 },
      'rgba(16,185,129,0.3)',
      1,
      cx,
      cy,
      focal,
    );
    drawLine3(
      { x: 0, y: 0, z: 0 },
      { x: 0, y: 0, z: 2.0 },
      'rgba(248,113,113,0.3)',
      1,
      cx,
      cy,
      focal,
    );

    // Trail
    if (trailLen > 1) {
      const start = (trailHead - trailLen + trailCap) % trailCap;
      let first = true;
      ctx.beginPath();
      for (let i = 0; i < trailLen; i++) {
        const idx = (start + i) % trailCap;
        const pt = { x: trail[idx * 3], y: trail[idx * 3 + 1], z: trail[idx * 3 + 2] };
        const pr = project(pt, camera, cx, cy, focal);
        if (pr.z < 0.1) continue;
        if (first) {
          ctx.moveTo(pr.x, pr.y);
          first = false;
        } else ctx.lineTo(pr.x, pr.y);
      }
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Pivot
    const pivot2d = project({ x: 0, y: 0, z: 0 }, camera, cx, cy, focal);
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.arc(pivot2d.x, pivot2d.y, 4, 0, Math.PI * 2);
    ctx.fill();

    // Sub-axle (Pivot to Center)
    drawLine3({ x: 0, y: 0, z: 0 }, center, '#9ca3af', 5, cx, cy, focal);

    // Extend axle past center
    const tip = {
      x: center.x + axis.x * 0.25,
      y: center.y + axis.y * 0.25,
      z: center.z + axis.z * 0.25,
    };
    drawLine3(center, tip, '#9ca3af', 5, cx, cy, focal);

    // Draw wheel (Rim and Spokes)
    // Get two orthogonal vectors in the plane of the wheel
    let ref = { x: 0, y: 0, z: 1 };
    if (Math.abs(axis.z) > 0.95) ref = { x: 0, y: 1, z: 0 };

    let ux = axis.y * ref.z - axis.z * ref.y;
    let uy = axis.z * ref.x - axis.x * ref.z;
    let uz = axis.x * ref.y - axis.y * ref.x;
    const uLen = Math.hypot(ux, uy, uz) || 1;
    ux /= uLen;
    uy /= uLen;
    uz /= uLen;

    const vx = axis.y * uz - axis.z * uy;
    const vy = axis.z * ux - axis.x * uz;
    const vz = axis.x * uy - axis.y * ux;

    // Incorporate the actual spin psi to rotate the spokes
    const spinCos = Math.cos(ps);
    const spinSin = Math.sin(ps);

    const uSpin = {
      x: ux * spinCos + vx * spinSin,
      y: uy * spinCos + vy * spinSin,
      z: uz * spinCos + vz * spinSin,
    };
    const vSpin = {
      x: -ux * spinSin + vx * spinCos,
      y: -uy * spinSin + vy * spinCos,
      z: -uz * spinSin + vz * spinCos,
    };

    const r = p.rotorRadius;

    // Render wheel using line segments to easily handle z-projection without complex polys sorting
    // Render spokes
    const spokeCount = 12;
    for (let i = 0; i < spokeCount; i++) {
      const a = (i / spokeCount) * Math.PI * 2;
      const cA = Math.cos(a),
        sA = Math.sin(a);
      const rx = uSpin.x * cA + vSpin.x * sA;
      const ry = uSpin.y * cA + vSpin.y * sA;
      const rz = uSpin.z * cA + vSpin.z * sA;

      const spokeEnd = {
        x: center.x + rx * r * 0.95,
        y: center.y + ry * r * 0.95,
        z: center.z + rz * r * 0.95,
      };
      drawLine3(center, spokeEnd, i % 3 === 0 ? '#fbbf24' : '#94a3b8', 2.5, cx, cy, focal);
    }

    // Render thick rim
    const rimSegments = 64;
    for (let j = -1; j <= 1; j += 2) {
      const zOffset = j * 0.02; // Thickness
      ctx.beginPath();
      for (let i = 0; i <= rimSegments; i++) {
        const a = (i / rimSegments) * Math.PI * 2;
        const cA = Math.cos(a),
          sA = Math.sin(a);
        // The rim itself is continuous, no need to use psi (uSpin), just ux, vx
        const rx = ux * cA + vx * sA;
        const ry = uy * cA + vy * sA;
        const rz = uz * cA + vz * sA;

        const pt = {
          x: center.x + rx * r + axis.x * zOffset,
          y: center.y + ry * r + axis.y * zOffset,
          z: center.z + rz * r + axis.z * zOffset,
        };
        const pr = project(pt, camera, cx, cy, focal);
        if (pr.z < 0.1) continue;
        if (i === 0) {
          ctx.moveTo(pr.x, pr.y);
        } else ctx.lineTo(pr.x, pr.y);
      }
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 4.5;
      ctx.stroke();
    }

    // Draw physics vectors with labels
    // 1. Gravity (from COM)
    const forceTip = { x: center.x, y: center.y, z: center.z - 0.25 };
    drawVector(center, forceTip, '#fb923c', 2.5, 'F_g', cx, cy, focal);

    // 2. Normal Force (from Pivot)
    const fnTip = { x: 0, y: 0, z: 0.25 };
    drawVector({ x: 0, y: 0, z: 0 }, fnTip, '#4ade80', 2.5, 'F_N', cx, cy, focal);

    // 3. Spin Angular Momentum (extending out of axle past the wheel)
    const angMomTip = {
      x: center.x + axis.x * 0.35,
      y: center.y + axis.y * 0.35,
      z: center.z + axis.z * 0.35,
    };
    drawVector(center, angMomTip, '#38bdf8', 2.5, 'L_s', cx, cy, focal);

    // 4. Gravity Torque (horizontal from pivot)
    const tauDir = { x: -center.y, y: center.x, z: 0 };
    const tauLen = Math.hypot(tauDir.x, tauDir.y, tauDir.z);
    if (tauLen > 1e-4) {
      const tauTip = { x: (tauDir.x / tauLen) * 0.3, y: (tauDir.y / tauLen) * 0.3, z: 0 };
      drawVector({ x: 0, y: 0, z: 0 }, tauTip, '#fde047', 2.5, 'τ', cx, cy, focal);
    }

    // Data HUD
    ctx.fillStyle = 'rgba(8,14,30,0.82)';
    ctx.fillRect(20, 20, 200, 110);
    ctx.strokeStyle = 'rgba(148,163,184,0.35)';
    ctx.strokeRect(20, 20, 200, 110);

    ctx.font = '700 13px "JetBrains Mono", monospace';
    ctx.fillStyle = '#93c5fd';
    ctx.fillText('Bicycle Wheel Demo', 34, 44);

    ctx.font = '11px "JetBrains Mono", monospace';
    ctx.fillStyle = '#e5e7eb';
    ctx.fillText(`θ = ${th.toFixed(3)} rad`, 34, 70);
    ctx.fillText(`ω_p = ${ph_v.toFixed(3)} rad/s`, 34, 88);
    const omega_s = ps_v + ph_v * Math.cos(th);
    ctx.fillText(`ω_s = ${omega_s.toFixed(2)} rad/s`, 34, 106);

    ctx.font = '11px "JetBrains Mono", monospace';
    ctx.fillStyle = 'rgba(203,213,225,0.65)';
    ctx.fillText('Scroll to zoom, Drag to orbit', W - 200, H - 24);
  }

  let rafId,
    running = false,
    lastTs,
    speedScale = 1;

  function loop(ts) {
    if (!running) return;
    const dt = lastTs === undefined ? 1 / 60 : Math.min((ts - lastTs) / 1000, 1 / 20);
    lastTs = ts;
    tick(dt * speedScale);
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
      if (next.trail !== undefined && next.trail !== trailCap) {
        p.trail = next.trail;
        allocTrail();
      }
      const prevTilt = p.tiltAngle;
      const prevStartPsi = p.startOmegaPsi;
      p = { ...p, ...next };

      // Live reload of initial values if changed
      if (
        Math.abs(p.tiltAngle - prevTilt) > 1e-6 ||
        Math.abs(p.startOmegaPsi - prevStartPsi) > 1e-6
      ) {
        th = p.tiltAngle;
        const omega3 = p.startOmegaPsi;
        ps_v = omega3 - ph_v * Math.cos(th);
        th_v = 0; // Reset momentum
      }
      render();
    },
    setSpeed(s) {
      speedScale = Number.isFinite(s) ? s : 1;
    },
    destroy() {
      this.stop();
      canvas.removeEventListener('mousedown', onDown);
      canvas.removeEventListener('touchstart', onDown);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchend', onUp);
      canvas.removeEventListener('wheel', onWheel);
    },
    getData() {
      const H = hamiltonian(th, ph, ps, th_v, ph_v, ps_v, p);
      const omega_s = ps_v + ph_v * Math.cos(th);
      return {
        time: simTime,
        theta: th,
        phi_vel: ph_v,
        omega3: omega_s,
        angularMomentum: p.inertiaSpin * omega_s,
        energy: H,
        totalEnergy: H,
        energyError: H0 && Math.abs(H0) > 1e-6 ? (H - H0) / Math.abs(H0) : 0,
      };
    },
  };
}
