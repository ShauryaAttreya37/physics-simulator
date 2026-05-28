import { drawArrow } from '../../utils/canvas';

/**
 * Rotational & Linear Kinematics Lab
 *
 * Interactive laboratory demonstrating relationships between
 * angular parameters (theta, omega, alpha) and linear/tangential parameters (v, at, ac, anet)
 * at different radial distances.
 */

const DEFAULTS = {
  alpha: 0.8, // rad/s²
  targetOmega: 3.0, // rad/s (motor target speed)
  radiusA: 1.2, // m
  radiusB: 2.4, // m
  slowMotion: false, // Slo-mo mode toggle
  showVelocityVec: true,
  showCentripetalVec: true,
  showTangentialVec: true,
  showNetVec: true,
};

export const defaultParams = { ...DEFAULTS };

export const controls = [
  { key: 'targetOmega', label: 'Target Speed ω [rad/s]', min: -8, max: 8, step: 0.2 },
  { key: 'alpha', label: 'Angular Accel α [rad/s²]', min: 0, max: 3, step: 0.1 },
  { key: 'radiusA', label: 'Sensor A Radius r_A [m]', min: 0.2, max: 3.4, step: 0.05 },
  { key: 'radiusB', label: 'Sensor B Radius r_B [m]', min: 0.2, max: 3.4, step: 0.05 },
  { key: 'slowMotion', label: 'Slow Motion (0.25x)', type: 'toggle' },
  { key: 'showVelocityVec', label: 'Show Velocity (v)', type: 'toggle' },
  { key: 'showCentripetalVec', label: 'Show Centripetal Accel (a_c)', type: 'toggle' },
  { key: 'showTangentialVec', label: 'Show Tangential Accel (a_t)', type: 'toggle' },
  { key: 'showNetVec', label: 'Show Net Accel (a_net)', type: 'toggle' },
];

export const graphParams = [
  { key: 'omega', label: 'Angular Vel ω [rad/s]' },
  { key: 'vA', label: 'Speed A v_A [m/s]' },
  { key: 'vB', label: 'Speed B v_B [m/s]' },
  { key: 'acA', label: 'Centripetal A [m/s²]' },
  { key: 'acB', label: 'Centripetal B [m/s²]' },
];

export const equationSections = [
  {
    title: 'Rotational vs Linear Kinematics',
    content:
      'Every point on a rigid rotating body shares the same angular displacement (θ), angular velocity (ω), and angular acceleration (α). However, their actual linear (tangential) speed and linear acceleration scale directly with their distance (radius r) from the center of rotation.',
  },
  {
    title: 'Rotational-Linear Bridges',
    equations: [
      {
        latex: String.raw`v = \omega \cdot r`,
        description:
          'Linear (tangential) velocity is directly proportional to radius and angular velocity.',
      },
      {
        latex: String.raw`a_t = \alpha \cdot r`,
        description:
          'Tangential acceleration is directly proportional to radius and angular acceleration. It represents the rate of change of linear speed.',
      },
      {
        latex: String.raw`a_c = \omega^2 \cdot r = \frac{v^2}{r}`,
        description:
          'Centripetal (radial) acceleration points directly toward the center of rotation. It represents the change in direction of the velocity vector.',
      },
      {
        latex: String.raw`a_{net} = \sqrt{a_t^2 + a_c^2}`,
        description:
          'Net linear acceleration is the vector sum of tangential and centripetal accelerations (which are always perpendicular).',
      },
    ],
    variables: [
      { symbol: 'v', description: 'Tangential speed (m/s)' },
      { symbol: 'r', description: 'Radial distance from center (m)' },
      { symbol: 'ω', description: 'Angular velocity (rad/s)' },
      { symbol: 'α', description: 'Angular acceleration (rad/s²)' },
      { symbol: 'a_t', description: 'Tangential acceleration (m/s²)' },
      { symbol: 'a_c', description: 'Centripetal acceleration (m/s²)' },
      { symbol: 'a_net', description: 'Net linear acceleration magnitude (m/s²)' },
    ],
  },
];

export const equations = [
  String.raw`v = \omega r`,
  String.raw`a_t = \alpha r`,
  String.raw`a_c = \omega^2 r`,
];

export const scenarios = [
  {
    name: 'Uniform Spin',
    description:
      'Constant angular velocity showing steady tangential velocities and centripetal accelerations, but zero tangential acceleration.',
    params: { alpha: 0, targetOmega: 3.0, radiusA: 1.2, radiusB: 2.4, showTangentialVec: false },
  },
  {
    name: 'Continuous Acceleration',
    description:
      'Platter continues to accelerate at a steady rate. Excellent for studying how centripetal acceleration grows while tangential acceleration remains constant.',
    params: { alpha: 0.4, targetOmega: 8.0, radiusA: 1.2, radiusB: 2.4 },
  },
  {
    name: 'High-Speed Spin Up',
    description:
      'A moderate acceleration to a high speed. Watch centripetal vectors grow exponentially as speed increases!',
    params: { alpha: 1.2, targetOmega: 6.0, radiusA: 1.0, radiusB: 2.2 },
  },
  {
    name: 'Decelerating & Reversing',
    description:
      'Watch the tangential acceleration vectors flip direction as the platter slows down, stops, and spins backwards!',
    params: { alpha: 1.5, targetOmega: -4.0, radiusA: 1.5, radiusB: 2.8 },
  },
];

export const guidedExperiments = [
  {
    title: 'Linear Speed & Radius',
    steps: [
      {
        instruction:
          'Set Angular Acceleration to 0, Target Speed to +2.0 rad/s, Sensor A Radius to 1.0 m, and Sensor B Radius to 2.0 m. Press Play and wait for it to spin stably.',
        params: { alpha: 0, targetOmega: 2.0, radiusA: 1.0, radiusB: 2.0 },
        question:
          'Compare the linear speeds (v_A vs v_B) of the two sensors. What is the relationship?',
        choices: [
          'They have the same speed (v_A = v_B = 2.0 m/s)',
          'Sensor B is twice as fast (v_A = 2.0 m/s, v_B = 4.0 m/s)',
          'Sensor A is twice as fast (v_A = 4.0 m/s, v_B = 2.0 m/s)',
        ],
        correctIndex: 1,
        explanation:
          'Linear speed is given by v = ω * r. Since both sensors share the same angular speed ω = 2.0 rad/s, Sensor B (at r = 2.0 m) has v = 2 * 2 = 4.0 m/s, which is exactly double Sensor A (at r = 1.0 m) with v = 2 * 1 = 2.0 m/s.',
      },
      {
        instruction:
          'Now set Sensor A to 3.0 m and Sensor B to 1.5 m. Platter is still spinning at ω = 2.0 rad/s.',
        params: { alpha: 0, targetOmega: 2.0, radiusA: 3.0, radiusB: 1.5 },
        question: 'What are the linear speeds now?',
        choices: [
          'v_A = 6.0 m/s, v_B = 3.0 m/s',
          'v_A = 3.0 m/s, v_B = 6.0 m/s',
          'v_A = 2.0 m/s, v_B = 2.0 m/s',
        ],
        correctIndex: 0,
        explanation:
          'Using v = ω * r: For Sensor A, v_A = 2.0 * 3.0 = 6.0 m/s. For Sensor B, v_B = 2.0 * 1.5 = 3.0 m/s.',
      },
    ],
  },
  {
    title: 'Tangential vs Centripetal Acceleration',
    steps: [
      {
        instruction:
          'Set Sensor A Radius to 2.0 m, Sensor B to 2.0 m. Set Target Speed to +5.0 rad/s, and Angular Acceleration to +1.0 rad/s². Start from rest (Press Reset then Play). Watch the vector arrows immediately after start.',
        params: { alpha: 1.0, targetOmega: 5.0, radiusA: 2.0, radiusB: 2.0 },
        question:
          'Immediately after starting from rest (when ω ≈ 0), which linear acceleration vector is non-zero?',
        choices: [
          'Only centripetal acceleration (a_c)',
          'Only tangential acceleration (a_t)',
          'Both are equal',
        ],
        correctIndex: 1,
        explanation:
          'At the moment of starting from rest, angular velocity ω = 0, so centripetal acceleration a_c = ω²*r = 0. However, angular acceleration α = 1.0 rad/s², so tangential acceleration a_t = α*r = 2.0 m/s². Thus, the initial acceleration is purely tangential (pointing along the path of motion).',
      },
      {
        instruction:
          'Let the simulation run until it reaches the target angular velocity of 5.0 rad/s (speed is now constant). Look at the acceleration vectors again.',
        params: { alpha: 1.0, targetOmega: 5.0, radiusA: 2.0, radiusB: 2.0 },
        question:
          'Once the disk has reached constant speed, what is the state of the acceleration vectors?',
        choices: [
          'a_t is zero, and a_c is very large pointing inward (a_c = 50.0 m/s²)',
          'a_t is very large, and a_c is zero',
          'Both are zero since speed is constant',
        ],
        correctIndex: 0,
        explanation:
          'Once target speed is reached, speed is constant, so angular acceleration α = 0. This means tangential acceleration a_t = 0. However, the disk is spinning fast (ω = 5.0 rad/s), so there is a massive centripetal acceleration holding the sensor in its circular path: a_c = ω²*r = 5² * 2 = 50.0 m/s², pointing directly inward.',
      },
    ],
  },
];

export function create(canvas, initParams = {}) {
  const ctx = canvas.getContext('2d');
  let p = { ...DEFAULTS, ...initParams };

  let theta = 0;
  let omega = initParams.omega0 || 0;
  let currentAlpha = 0;
  let simTime = 0;

  // Interaction State
  let draggingProbe = null; // 'A' or 'B'
  let hoverA = false;
  let hoverB = false;

  // Trails for Sensor A & B to visually trace their circular paths in space
  let trailA = [];
  let trailB = [];
  const maxTrailLen = 140;

  // Keep track of radii to clear trails when they are changed
  let lastRadiusA = p.radiusA;
  let lastRadiusB = p.radiusB;

  function initState() {
    theta = 0;
    omega = 0;
    currentAlpha = 0;
    simTime = 0;
    trailA = [];
    trailB = [];
  }

  function tick(dt) {
    const timeScale = p.slowMotion ? 0.25 : 1.0;
    const scaledDt = dt * timeScale;
    const steps = 10;
    const h = scaledDt / steps;

    for (let i = 0; i < steps; i++) {
      if (p.alpha === 0) {
        omega = p.targetOmega;
        currentAlpha = 0;
      } else {
        // Motor control: accelerate/decelerate towards targetOmega at rate alpha
        const diff = p.targetOmega - omega;
        if (Math.abs(diff) < 1e-4) {
          omega = p.targetOmega;
          currentAlpha = 0;
        } else {
          currentAlpha = diff > 0 ? p.alpha : -p.alpha;
          omega += currentAlpha * h;

          // Clamp to prevent overshoot
          if ((diff > 0 && omega > p.targetOmega) || (diff < 0 && omega < p.targetOmega)) {
            omega = p.targetOmega;
            currentAlpha = 0;
          }
        }
      }

      theta += omega * h;
      // Normalize theta in [-PI, PI]
      while (theta > Math.PI) theta -= Math.PI * 2;
      while (theta < -Math.PI) theta += Math.PI * 2;

      simTime += h;
    }
  }

  function getLayout() {
    const W = canvas.width;
    const H = canvas.height;
    // Keep disk center pushed to the left to leave room for HUD on the right
    const cx = W * 0.4;
    const cy = H * 0.52;
    // Scale disk so 1 meter is about 60 pixels
    const pxPerMeter = Math.min(W, H) * 0.115 * (p.viewScale || 1.0);
    return { W, H, cx, cy, pxPerMeter };
  }

  function render() {
    const L = getLayout();
    const { W, H, cx, cy, pxPerMeter } = L;

    // Dark high-tech theme background
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, W, H);

    // Subtle radial concentric layout grid lines
    ctx.strokeStyle = 'rgba(226, 232, 240, 0.03)';
    ctx.lineWidth = 1;
    for (let r = 0.5; r <= 4.0; r += 0.5) {
      ctx.beginPath();
      ctx.arc(cx, cy, r * pxPerMeter, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Centered axis crosshair
    ctx.strokeStyle = 'rgba(226, 232, 240, 0.05)';
    ctx.beginPath();
    ctx.moveTo(cx - 20, cy);
    ctx.lineTo(cx + 20, cy);
    ctx.moveTo(cx, cy - 20);
    ctx.lineTo(cx, cy + 20);
    ctx.stroke();

    // ── THE ROTATING PLATTER ───────────────────────────────────
    const platterRadius = 3.5 * pxPerMeter;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(theta);

    // Platter Shadow & Base
    ctx.beginPath();
    ctx.arc(0, 0, platterRadius, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.4)';
    ctx.fill();
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Concentric metallic/glowing tracks at 1m, 2m, 3m
    for (let r = 1; r <= 3; r++) {
      ctx.beginPath();
      ctx.arc(0, 0, r * pxPerMeter, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.15)'; // light cyan glowing tracks
      ctx.lineWidth = r === 3 ? 3 : 1.5;
      ctx.stroke();

      // Tick marks on tracks
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
      ctx.lineWidth = 1;
      for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 6) {
        ctx.beginPath();
        ctx.moveTo(
          (r - 0.08) * pxPerMeter * Math.cos(angle),
          (r - 0.08) * pxPerMeter * Math.sin(angle),
        );
        ctx.lineTo(
          (r + 0.08) * pxPerMeter * Math.cos(angle),
          (r + 0.08) * pxPerMeter * Math.sin(angle),
        );
        ctx.stroke();
      }
    }

    // Platters Spokes / Visual Wedges
    const numSpokes = 8;
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.07)';
    ctx.lineWidth = 2;
    for (let i = 0; i < numSpokes; i++) {
      const angle = (i * Math.PI * 2) / numSpokes;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(platterRadius * Math.cos(angle), platterRadius * Math.sin(angle));
      ctx.stroke();
    }

    // Outer rim highlighting
    ctx.beginPath();
    ctx.arc(0, 0, platterRadius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Center Core Hub (Motor Cap)
    ctx.beginPath();
    ctx.arc(0, 0, 0.3 * pxPerMeter, 0, Math.PI * 2);
    ctx.fillStyle = '#1e293b';
    ctx.fill();
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#0ea5e9';
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // ── PROBES (SENSORS A & B) ─────────────────────────────────
    const angleA = theta;
    const angleB = theta + Math.PI;

    const ax = cx + p.radiusA * pxPerMeter * Math.cos(angleA);
    const ay = cy + p.radiusA * pxPerMeter * Math.sin(angleA);

    const bx = cx + p.radiusB * pxPerMeter * Math.cos(angleB);
    const by = cy + p.radiusB * pxPerMeter * Math.sin(angleB);

    // Update trails when simulation runs
    if (running) {
      trailA.push([ax, ay]);
      trailB.push([bx, by]);
      if (trailA.length > maxTrailLen) trailA.shift();
      if (trailB.length > maxTrailLen) trailB.shift();
    }

    // Clear trails if radii are modified to avoid spiral jumps
    if (
      draggingProbe ||
      Math.abs(lastRadiusA - p.radiusA) > 0.01 ||
      Math.abs(lastRadiusB - p.radiusB) > 0.01
    ) {
      trailA = [];
      trailB = [];
      lastRadiusA = p.radiusA;
      lastRadiusB = p.radiusB;
    }

    // Render Trails
    const drawSensorTrail = (trail, baseColor) => {
      if (trail.length < 2) return;
      ctx.save();
      ctx.lineWidth = 3.0;
      ctx.lineCap = 'round';
      for (let i = 1; i < trail.length; i++) {
        const alpha = (i / trail.length) * 0.35;
        ctx.strokeStyle = baseColor.replace('1)', `${alpha})`);
        ctx.beginPath();
        ctx.moveTo(trail[i - 1][0], trail[i - 1][1]);
        ctx.lineTo(trail[i][0], trail[i][1]);
        ctx.stroke();
      }
      ctx.restore();
    };

    drawSensorTrail(trailA, 'rgba(16, 185, 129, 1)'); // Emerald Green trail
    drawSensorTrail(trailB, 'rgba(168, 85, 247, 1)'); // Purple trail

    // Dynamic scale for arrows, scaling with the user's viewScale setting
    const currentScale = p.viewScale || 1.0;
    const vArrowScale = 8 * currentScale;
    const atArrowScale = 12 * currentScale;
    const acArrowScale = 0.8 * currentScale;

    // Draw Vector Legend / Helpers
    const drawProbeVectors = (px, py, r, angle, colorHex, labelChar) => {
      ctx.save();
      const vVal = omega * r;
      const atVal = currentAlpha * r;
      const acVal = omega * omega * r;

      // Directions:
      const vDir = angle + (omega >= 0 ? Math.PI / 2 : -Math.PI / 2);
      const atDir = angle + (currentAlpha >= 0 ? Math.PI / 2 : -Math.PI / 2);
      const acDir = angle + Math.PI;

      const vLen = Math.abs(vVal) * vArrowScale;
      const atLen = Math.abs(atVal) * atArrowScale;
      const acLen = acVal * acArrowScale;

      const vx2 = px + vLen * Math.cos(vDir);
      const vy2 = py + vLen * Math.sin(vDir);

      const atx2 = px + atLen * Math.cos(atDir);
      const aty2 = py + atLen * Math.sin(atDir);

      const acx2 = px + acLen * Math.cos(acDir);
      const acy2 = py + acLen * Math.sin(acDir);

      // We calculate Net Acceleration vector:
      const atVecX = atLen * Math.cos(atDir);
      const atVecY = atLen * Math.sin(atDir);
      const acVecX = acLen * Math.cos(acDir);
      const acVecY = acLen * Math.sin(acDir);

      // Net Vector components:
      const netX = px + atVecX + acVecX;
      const netY = py + atVecY + acVecY;

      // Draw Parallelogram of Vector Addition (Dashed helper lines)
      if (p.showNetVec && p.showTangentialVec && p.showCentripetalVec && (atLen > 3 || acLen > 3)) {
        ctx.strokeStyle = 'rgba(168, 85, 247, 0.25)'; // Purple dashed line
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);

        ctx.beginPath();
        ctx.moveTo(atx2, aty2);
        ctx.lineTo(netX, netY);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(acx2, acy2);
        ctx.lineTo(netX, netY);
        ctx.stroke();

        ctx.setLineDash([]);
      }

      // Draw vector arrows based on toggles
      if (p.showVelocityVec && vLen > 2) {
        drawArrow(ctx, px, py, vx2, vy2, {
          color: '#0ea5e9',
          lineWidth: 2.5,
          headLength: 8,
          headWidth: 5,
        });
      }
      if (p.showTangentialVec && atLen > 2) {
        drawArrow(ctx, px, py, atx2, aty2, {
          color: '#f59e0b',
          lineWidth: 2.5,
          headLength: 8,
          headWidth: 5,
        });
      }
      if (p.showCentripetalVec && acLen > 2) {
        drawArrow(ctx, px, py, acx2, acy2, {
          color: '#ef4444',
          lineWidth: 2.5,
          headLength: 8,
          headWidth: 5,
        });
      }
      if (p.showNetVec && (atLen > 2 || acLen > 2)) {
        drawArrow(ctx, px, py, netX, netY, {
          color: '#a855f7',
          lineWidth: 3,
          headLength: 10,
          headWidth: 5,
        });
      }

      // Sensor Core Head Drawing (The Probe Ball)
      ctx.beginPath();
      ctx.arc(px, py, 14, 0, Math.PI * 2);
      ctx.fillStyle = '#1e293b';
      ctx.fill();
      ctx.strokeStyle = colorHex;
      ctx.lineWidth = 3;
      ctx.stroke();

      // Glowing inner indicator
      ctx.beginPath();
      ctx.arc(px, py, 6, 0, Math.PI * 2);
      ctx.fillStyle = colorHex;
      ctx.fill();

      // Label character inside probe (A or B)
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px "Inter", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(labelChar, px, py + 0.5);
      ctx.restore();
    };

    // Draw Probe B first, so Probe A overlays cleanly if they coincide
    drawProbeVectors(bx, by, p.radiusB, angleB, '#a855f7', 'B'); // Amethyst/Purple for B
    drawProbeVectors(ax, ay, p.radiusA, angleA, '#10b981', 'A'); // Emerald Green for A

    // ── HIGH-TECH SIDE-BY-SIDE HUD PANEL ──────────────────────
    const hudW = 340; // Enlarged width to accommodate larger, more readable fonts without overlaps
    const hudH = 320; // Enlarged height to accommodate taller rows
    const hudX = W - hudW - 20;
    const hudY = 20;

    // Glassmorphic panel background
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.shadowBlur = 15;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.roundRect(hudX, hudY, hudW, hudH, 12);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.stroke();

    // HUD Header Title (Enlarged)
    ctx.font = 'bold 13px "Inter", sans-serif';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('ROTATIONAL VS LINEAR BENCH', hudX + 15, hudY + 25);

    // Shared Angular Parameters (Enlarged and aligned)
    ctx.font = '11px "JetBrains Mono", monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(`Target Speed ω  = ${p.targetOmega.toFixed(2)} rad/s`, hudX + 15, hudY + 46);
    ctx.fillText(`Platter Speed ω = ${omega.toFixed(2)} rad/s`, hudX + 15, hudY + 64);
    ctx.fillText(`Applied Accel α = ${p.alpha.toFixed(2)} rad/s²`, hudX + 15, hudY + 82);
    const isTargetReached = Math.abs(omega - p.targetOmega) < 1e-3 && p.alpha > 0;
    const alphaStr = isTargetReached
      ? '0.00 (Target reached)'
      : `${currentAlpha.toFixed(2)} rad/s²`;
    ctx.fillText(`Platter Accel α = ${alphaStr}`, hudX + 15, hudY + 100);

    // Comparison Table Grid
    const startY = hudY + 116;
    const rowH = 22; // Enlarged row height

    // Table Header (Enlarged Monospace)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fillRect(hudX + 10, startY, hudW - 20, 20);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px "JetBrains Mono", monospace';
    ctx.fillText('LINEAR METRIC', hudX + 15, startY + 14);
    ctx.fillStyle = '#10b981'; // Green A
    ctx.textAlign = 'right';
    ctx.fillText('SENSOR A', hudX + 225, startY + 14);
    ctx.fillStyle = '#a855f7'; // Purple B
    ctx.fillText('SENSOR B', hudX + 325, startY + 14);
    ctx.textAlign = 'left';

    // Physics Metric Values
    const speedA = Math.abs(omega * p.radiusA);
    const speedB = Math.abs(omega * p.radiusB);
    const atA = currentAlpha * p.radiusA;
    const atB = currentAlpha * p.radiusB;
    const acA = omega * omega * p.radiusA;
    const acB = omega * omega * p.radiusB;
    const anetA = Math.sqrt(atA * atA + acA * acA);
    const anetB = Math.sqrt(atB * atB + acB * acB);

    const rows = [
      {
        label: 'Radius (r)',
        valA: `${p.radiusA.toFixed(2)} m`,
        valB: `${p.radiusB.toFixed(2)} m`,
        color: '#94a3b8',
      },
      {
        label: 'Speed (v = ω·r)',
        valA: `${speedA.toFixed(2)} m/s`,
        valB: `${speedB.toFixed(2)} m/s`,
        color: '#0ea5e9',
      },
      {
        label: 'Tangential Accel',
        valA: `${atA.toFixed(2)} m/s²`,
        valB: `${atB.toFixed(2)} m/s²`,
        color: '#f59e0b',
      },
      {
        label: 'Centripetal Accel',
        valA: `${acA.toFixed(1)} m/s²`,
        valB: `${acB.toFixed(1)} m/s²`,
        color: '#ef4444',
      },
      {
        label: 'Net Accel (anet)',
        valA: `${anetA.toFixed(1)} m/s²`,
        valB: `${anetB.toFixed(1)} m/s²`,
        color: '#a855f7',
      },
    ];

    rows.forEach((row, i) => {
      const y = startY + 25 + i * rowH;
      // Zebra stripe rows
      if (i % 2 === 0) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
        ctx.fillRect(hudX + 10, y - 4, hudW - 20, rowH);
      }

      ctx.fillStyle = '#cbd5e1';
      ctx.font = '11px "JetBrains Mono", monospace'; // Crisp unified monospace font
      ctx.fillText(row.label, hudX + 15, y + 11);

      ctx.fillStyle = row.color;
      ctx.font = 'bold 11px "JetBrains Mono", monospace'; // Enlarged values font
      ctx.textAlign = 'right';
      ctx.fillText(row.valA, hudX + 225, y + 11);
      ctx.fillText(row.valB, hudX + 325, y + 11);
      ctx.textAlign = 'left';
    });

    // Formula helper foot banner (Enlarged)
    ctx.fillStyle = 'rgba(56, 189, 248, 0.05)';
    ctx.beginPath();
    ctx.roundRect(hudX + 10, hudY + hudH - 40, hudW - 20, 28, 4);
    ctx.fill();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.15)';
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'italic 11px "Inter", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(
      'v = ω × r   |   a_t = α × r   |   a_c = ω² × r',
      hudX + hudW / 2,
      hudY + hudH - 22,
    );

    ctx.restore();

    // ── DRAGGABLE PROBE HELPER INSTRUCTION ──────────────────────
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '11px "Inter", sans-serif';
    ctx.fillText('Drag Probes A and B directly on the platter to change radius!', 20, H - 20);

    // Vector key colors on screen (Enlarged and Crisp)
    const drawVectorTag = (label, color, lx, ly) => {
      ctx.save();
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(lx, ly, 6, 0, Math.PI * 2); // Enlarged dots (from 4.5 to 6)
      ctx.fill();
      ctx.fillStyle = '#cbd5e1';
      ctx.font = 'bold 12px "Inter", sans-serif'; // Enlarged bold, crisp typography (from 10px)
      ctx.fillText(label, lx + 14, ly);
      ctx.restore();
    };

    drawVectorTag('v (Velocity)', '#0ea5e9', 25, 30);
    drawVectorTag('at (Tangential Accel)', '#f59e0b', 145, 30);
    drawVectorTag('ac (Centripetal Accel)', '#ef4444', 335, 30);
    drawVectorTag('anet (Net Accel)', '#a855f7', 535, 30);

    // SLOW MOTION ACTIVE WATERMARK
    if (p.slowMotion) {
      ctx.save();
      ctx.fillStyle = 'rgba(245, 158, 11, 0.08)';
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(20, 50, 160, 24, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      // pulsating glowing dot based on simTime
      const pulseAlpha = 0.4 + 0.6 * Math.abs(Math.sin(simTime * 4));
      ctx.globalAlpha = pulseAlpha;
      ctx.arc(32, 62, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1.0;

      ctx.font = 'bold 10px "Inter", sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText('SLOW MOTION (0.25X)', 44, 62);
      ctx.restore();
    }
  }

  // Pointer drag interactions
  const onPointerDown = (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const L = getLayout();
    const { cx, cy, pxPerMeter } = L;

    // Calculate current positions of A and B in absolute canvas coords
    const angleA = theta;
    const angleB = theta + Math.PI;

    const ax = cx + p.radiusA * pxPerMeter * Math.cos(angleA);
    const ay = cy + p.radiusA * pxPerMeter * Math.sin(angleA);

    const bx = cx + p.radiusB * pxPerMeter * Math.cos(angleB);
    const by = cy + p.radiusB * pxPerMeter * Math.sin(angleB);

    // Detect clicks
    if (Math.hypot(x - ax, y - ay) < 22) {
      draggingProbe = 'A';
    } else if (Math.hypot(x - bx, y - by) < 22) {
      draggingProbe = 'B';
    }
  };

  const onPointerMove = (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const L = getLayout();
    const { cx, cy, pxPerMeter } = L;

    if (draggingProbe) {
      // Direct drag radius adjustment based on distance to platter center
      const distPx = Math.hypot(x - cx, y - cy);
      let distM = distPx / pxPerMeter;

      // Clamp between minimum and outer edge
      distM = Math.max(0.2, Math.min(3.4, distM));

      if (draggingProbe === 'A') {
        p.radiusA = Number(distM.toFixed(2));
        if (window.onParamChange) window.onParamChange({ radiusA: p.radiusA });
      } else {
        p.radiusB = Number(distM.toFixed(2));
        if (window.onParamChange) window.onParamChange({ radiusB: p.radiusB });
      }
    } else {
      // Dynamic Cursor styling
      const angleA = theta;
      const angleB = theta + Math.PI;

      const ax = cx + p.radiusA * pxPerMeter * Math.cos(angleA);
      const ay = cy + p.radiusA * pxPerMeter * Math.sin(angleA);

      const bx = cx + p.radiusB * pxPerMeter * Math.cos(angleB);
      const by = cy + p.radiusB * pxPerMeter * Math.sin(angleB);

      hoverA = Math.hypot(x - ax, y - ay) < 22;
      hoverB = Math.hypot(x - bx, y - by) < 22;

      canvas.style.cursor = hoverA || hoverB ? 'grab' : 'default';
    }

    if (!running) render();
  };

  const onPointerUp = () => {
    if (draggingProbe) {
      draggingProbe = null;
      canvas.style.cursor = hoverA || hoverB ? 'grab' : 'default';
    }
  };

  canvas.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);

  let rafId;
  let running = false;
  let lastTs;
  let speedScale = 1;

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
    setParams(nextParams) {
      p = { ...p, ...nextParams };
      if (p.alpha === 0) {
        omega = p.targetOmega;
        currentAlpha = 0;
      }
      render();
    },
    setSpeed(s) {
      speedScale = Number.isFinite(s) ? s : 1;
    },
    destroy() {
      this.stop();
      canvas.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    },
    getData() {
      const speedA = Math.abs(omega * p.radiusA);
      const speedB = Math.abs(omega * p.radiusB);
      const acA = omega * omega * p.radiusA;
      const acB = omega * omega * p.radiusB;

      return {
        time: simTime,
        omega,
        vA: speedA,
        vB: speedB,
        acA,
        acB,
      };
    },
  };
}
