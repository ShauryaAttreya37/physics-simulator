import { drawArrow } from '../../utils/canvas';

/**
 * Torque & Angular Acceleration Lab — Research-Grade Implementation
 *
 * Interactive rotary dynamics bench with a flywheel.
 * Demonstrates Newton's Second Law for Rotation: tau = I * alpha.
 */

const DEFAULTS = {
  force: 20,
  radius: 1.5,
  diskMass: 4.0,
  damping: 0.2,
};

export const defaultParams = { ...DEFAULTS };

export const controls = [
  { key: 'force', label: 'Applied Force F [N]', min: -80, max: 80, step: 1 },
  { key: 'radius', label: 'Wheel Radius r [m]', min: 0.5, max: 2.5, step: 0.05 },
  { key: 'diskMass', label: 'Wheel Mass M [kg]', min: 1, max: 20, step: 0.5 },
  { key: 'damping', label: 'Brake Friction [N·m·s]', min: 0, max: 2, step: 0.05 },
];

export const graphParams = [
  { key: 'torque', label: 'Net Torque τ [N·m]' },
  { key: 'alpha', label: 'Angular Accel α [rad/s²]' },
  { key: 'omega', label: 'Angular Vel ω [rad/s]' },
  { key: 'rotKE', label: 'Rotational KE [J]' },
];

export const equationSections = [
  {
    title: 'Rotational Dynamics',
    content:
      "This simulation demonstrates Newton's Second Law for Rotation. Just as a linear force causes linear acceleration (F = ma), a rotational force (torque) causes angular acceleration (τ = Iα).",
  },
  {
    title: 'Core Equations',
    equations: [
      {
        latex: String.raw`\tau = r \times F`,
        description: "Applied torque is the tangential force multiplied by the wheel's radius.",
      },
      {
        latex: String.raw`I = \frac{1}{2} M r^2`,
        description:
          'Moment of Inertia for a solid disk. Represents resistance to rotational change.',
      },
      {
        latex: String.raw`\alpha = \frac{\tau_{net}}{I}`,
        description:
          "Newton's Second Law for Rotation. Angular acceleration is net torque divided by inertia.",
      },
    ],
    variables: [
      { symbol: 'τ', description: 'Torque (N·m)' },
      { symbol: 'r', description: 'Wheel Radius (m)' },
      { symbol: 'M', description: 'Wheel Mass (kg)' },
      { symbol: 'I', description: 'Moment of Inertia (kg·m²)' },
      { symbol: 'α', description: 'Angular Acceleration (rad/s²)' },
    ],
  },
];

export const equations = [
  String.raw`\tau_{net} = rF - c\omega`,
  String.raw`I = \frac{1}{2} M r^2`,
  String.raw`\alpha = \frac{\tau_{net}}{I}`,
];

export const scenarios = [
  {
    name: 'Gentle Spin Up',
    description: 'A moderate force applied to a standard wheel.',
    params: { force: 20, radius: 1.5, diskMass: 4.0, damping: 0.2 },
  },
  {
    name: 'Heavy Flywheel',
    description:
      'A very massive, large wheel. Notice how slowly it accelerates despite a large force!',
    params: { force: 50, radius: 2.5, diskMass: 15.0, damping: 0.5 },
  },
  {
    name: 'Hard Braking',
    description: 'Zero applied force, but high brake friction dragging a spinning wheel to a halt.',
    params: { force: 0, radius: 1.5, diskMass: 5.0, damping: 1.8 },
  },
];

export const guidedExperiments = [
  {
    title: "Newton's Second Law of Rotation",
    steps: [
      {
        instruction:
          'Set Wheel Mass to 4 kg, Radius to 1.0 m, and Brake Friction to 0. Apply a Force of +10 N. Press Play.',
        params: { diskMass: 4.0, radius: 1.0, damping: 0, force: 10 },
        question: 'What is the angular acceleration (α) of the wheel?',
        choices: ['2.5 rad/s²', '5.0 rad/s²', '10.0 rad/s²'],
        correctIndex: 1,
        explanation:
          'Torque τ = r*F = 1.0 * 10 = 10 N·m. Inertia I = 0.5 * M * r² = 0.5 * 4 * 1 = 2 kg·m². Therefore, α = τ / I = 10 / 2 = 5 rad/s².',
      },
      {
        instruction:
          'Now double the Applied Force to +20 N. Keep Mass at 4 kg and Radius at 1.0 m.',
        params: { diskMass: 4.0, radius: 1.0, damping: 0, force: 20 },
        question: 'What happens to the angular acceleration?',
        choices: ['It stays the same', 'It doubles to 10.0 rad/s²', 'It quadruples to 20.0 rad/s²'],
        correctIndex: 1,
        explanation:
          'Because α = τ / I, doubling the force (and thus torque) will exactly double the angular acceleration. This is a linear relationship!',
      },
      {
        instruction: "Let's test Inertia. Keep Force at +20 N. Now double the Mass to 8 kg.",
        params: { diskMass: 8.0, radius: 1.0, damping: 0, force: 20 },
        question: 'How does doubling the mass affect the acceleration?',
        choices: ['Acceleration doubles', 'Acceleration halves', 'No change'],
        correctIndex: 1,
        explanation:
          'Doubling the mass doubles the Moment of Inertia (I). Since I is in the denominator (α = τ / I), the acceleration is cut in half back to 5.0 rad/s².',
      },
      {
        instruction:
          "Finally, let's test Radius. Set Mass back to 4 kg, Force to +10 N. Change Radius to 2.0 m.",
        params: { diskMass: 4.0, radius: 2.0, damping: 0, force: 10 },
        question: 'What is the new angular acceleration?',
        choices: ['1.25 rad/s²', '2.5 rad/s²', '5.0 rad/s²'],
        correctIndex: 0,
        explanation:
          'This is tricky! Doubling the radius doubles the Torque (τ = 10 * 2 = 20), BUT it quadruples the Inertia (I = 0.5 * 4 * 2² = 8). So α = 20 / 8 = 2.5 rad/s². The acceleration is halved! This is why large flywheels are so hard to spin up.',
      },
    ],
  },
];

export function create(canvas, initParams = {}) {
  const ctx = canvas.getContext('2d');
  let p = { ...DEFAULTS, ...initParams };

  let theta = 0;
  let omega = initParams.omega0 || 0;
  let alpha = 0;
  let simTime = 0;

  // Interaction State
  let draggingForce = false;
  let hoverForce = false;

  function normalizeAngle(angle) {
    let a = angle;
    while (a > Math.PI) a -= Math.PI * 2;
    while (a < -Math.PI) a += Math.PI * 2;
    return a;
  }

  function initState() {
    theta = 0;
    omega = 0;
    alpha = 0;
    simTime = 0;
  }

  function tick(dt) {
    const steps = 10;
    const h = dt / steps;

    // Recalculate Inertia dynamically based on mass and radius
    const I = 0.5 * p.diskMass * p.radius * p.radius;

    for (let i = 0; i < steps; i++) {
      const driveTorque = p.force * p.radius;
      const dragTorque = p.damping * omega;
      const netTorque = driveTorque - dragTorque;

      alpha = netTorque / Math.max(0.01, I);
      omega += alpha * h;
      theta += omega * h;
      theta = normalizeAngle(theta);
      simTime += h;
    }
  }

  function getLayout() {
    const W = canvas.width;
    const H = canvas.height;
    const cx = W * 0.45;
    const cy = H * 0.55;
    const pxPerMeter = Math.min(W, H) * 0.12 * (p.viewScale || 1.0);
    const diskR = p.radius * pxPerMeter;
    return { W, H, cx, cy, pxPerMeter, diskR };
  }

  function render() {
    const L = getLayout();
    const { W, H, cx, cy, diskR } = L;

    // Clean light-theme background
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, W, H);

    // Subtle Grid
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.04)';
    ctx.lineWidth = 1;
    const spacing = L.pxPerMeter * 0.5;
    if (spacing > 10) {
      for (let x = cx % spacing; x < W; x += spacing) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
      }
      for (let y = cy % spacing; y < H; y += spacing) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }
    }

    // --- Brake Caliper (drawn behind/around wheel) ---
    if (p.damping > 0) {
      ctx.save();
      ctx.translate(cx, cy);
      // Brake is positioned at the bottom
      const brakeAngle = Math.PI / 2;
      ctx.rotate(brakeAngle);

      // Calculate brake squeeze based on damping
      const squeeze = Math.min(10, p.damping * 5);

      ctx.fillStyle = '#64748b'; // Caliper color
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(diskR - 15 - squeeze, -30, 40 + squeeze, 60, 8);
      ctx.fill();
      ctx.stroke();

      // Brake Pads (Reddish if high friction/speed)
      const heat = Math.min(1, Math.abs(omega) * p.damping * 0.05);
      const padColor = heat > 0.1 ? `rgb(${100 + heat * 155}, 80, 80)` : '#475569';

      ctx.fillStyle = padColor;
      ctx.fillRect(diskR - squeeze, -20, 10, 40);

      // Heat glow
      if (heat > 0.2) {
        ctx.shadowBlur = heat * 20;
        ctx.shadowColor = 'rgba(239, 68, 68, 0.8)';
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.8)';
        ctx.strokeRect(diskR - squeeze, -20, 10, 40);
        ctx.shadowBlur = 0;
      }
      ctx.restore();
    }

    // --- The Flywheel ---
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(theta);

    // Outer rim
    const rimWidth = Math.max(10, diskR * 0.15);
    ctx.beginPath();
    ctx.arc(0, 0, diskR, 0, Math.PI * 2);
    ctx.fillStyle = '#e2e8f0'; // light silver
    ctx.fill();
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Inner hollow (making it look like a spoked wheel or rimmed disk)
    ctx.beginPath();
    ctx.arc(0, 0, diskR - rimWidth, 0, Math.PI * 2);
    ctx.fillStyle = '#f8fafc'; // matching background to look hollow
    ctx.fill();
    ctx.stroke();

    // Spokes
    const numSpokes = 6;
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = Math.max(4, diskR * 0.08);
    for (let i = 0; i < numSpokes; i++) {
      const angle = (i * Math.PI * 2) / numSpokes;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo((diskR - rimWidth) * Math.cos(angle), (diskR - rimWidth) * Math.sin(angle));
      ctx.stroke();
    }

    // Center Hub
    ctx.beginPath();
    ctx.arc(0, 0, diskR * 0.15, 0, Math.PI * 2);
    ctx.fillStyle = '#cbd5e1';
    ctx.fill();
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Hub bolt
    ctx.beginPath();
    ctx.arc(0, 0, diskR * 0.05, 0, Math.PI * 2);
    ctx.fillStyle = '#0f172a';
    ctx.fill();

    // Mass indicator dots on the rim to visualize rotation clearly
    for (let i = 0; i < numSpokes; i++) {
      const angle = (i * Math.PI * 2) / numSpokes;
      ctx.beginPath();
      ctx.arc(
        (diskR - rimWidth / 2) * Math.cos(angle),
        (diskR - rimWidth / 2) * Math.sin(angle),
        4,
        0,
        Math.PI * 2,
      );
      ctx.fillStyle = '#64748b';
      ctx.fill();
    }

    ctx.restore();

    // --- Applied Force Vector ---
    // We apply force at the top of the wheel (angle = -pi/2)
    const forceApplyX = cx;
    const forceApplyY = cy - diskR;

    // Force is tangential, so horizontal
    const forceScale = 2.0; // px per Newton
    const forceLen = p.force * forceScale;

    // Draw force arrow
    if (Math.abs(p.force) > 0 || hoverForce || draggingForce) {
      const arrowColor = draggingForce ? '#fbbf24' : hoverForce ? '#fcd34d' : '#f59e0b';

      if (Math.abs(p.force) > 0) {
        drawArrow(ctx, forceApplyX, forceApplyY, forceApplyX + forceLen, forceApplyY, {
          color: arrowColor,
          lineWidth: 4,
          headLength: 12,
          headWidth: 6,
        });
      }

      // Draggable handle at the tip of the force vector (or origin if 0)
      const tipX = forceApplyX + forceLen;
      const tipY = forceApplyY;
      ctx.beginPath();
      ctx.arc(tipX, tipY, draggingForce ? 12 : 8, 0, Math.PI * 2);
      ctx.fillStyle = arrowColor;
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // --- Angular Velocity / Accel Indicators ---
    // Draw curved arrows around the center to show omega and alpha
    if (Math.abs(omega) > 0.1) {
      const wRadius = diskR + 25;
      const wAngle = Math.min(Math.PI * 1.5, Math.abs(omega) * 0.2);
      const startAngle = -Math.PI / 2;
      const endAngle = startAngle + (omega > 0 ? wAngle : -wAngle);

      ctx.beginPath();
      ctx.arc(cx, cy, wRadius, startAngle, endAngle, omega < 0);
      ctx.strokeStyle = 'rgba(14, 165, 233, 0.6)'; // cyan
      ctx.lineWidth = 4;
      ctx.stroke();

      // Arrowhead for omega
      const tipX = cx + wRadius * Math.cos(endAngle);
      const tipY = cy + wRadius * Math.sin(endAngle);
      const tangAngle = endAngle + (omega > 0 ? Math.PI / 2 : -Math.PI / 2);

      ctx.beginPath();
      ctx.moveTo(tipX, tipY);
      ctx.lineTo(
        tipX - 10 * Math.cos(tangAngle - Math.PI / 6),
        tipY - 10 * Math.sin(tangAngle - Math.PI / 6),
      );
      ctx.lineTo(
        tipX - 10 * Math.cos(tangAngle + Math.PI / 6),
        tipY - 10 * Math.sin(tangAngle + Math.PI / 6),
      );
      ctx.fillStyle = 'rgba(14, 165, 233, 0.8)';
      ctx.fill();
    }

    // --- Modern HUD Panel ---
    const hudW = 240;
    const hudH = 170;
    const hudX = W - hudW - 20;
    const hudY = 20;

    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.shadowBlur = 10;
    ctx.shadowColor = 'rgba(15, 23, 42, 0.05)';
    ctx.beginPath();
    ctx.roundRect(hudX, hudY, hudW, hudH, 8);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.font = 'bold 12px "Inter", sans-serif';
    ctx.fillStyle = '#0f172a';
    ctx.fillText('ROTATIONAL DYNAMICS', hudX + 15, hudY + 25);

    ctx.font = '11px "JetBrains Mono", monospace';

    const I = 0.5 * p.diskMass * p.radius * p.radius;
    const driveTorque = p.force * p.radius;
    const dragTorque = p.damping * omega;
    const netTorque = driveTorque - dragTorque;

    const dataLines = [
      { label: 'Applied τ', value: `${driveTorque.toFixed(1)} N·m`, color: '#f59e0b' },
      { label: 'Brake τ', value: `${-dragTorque.toFixed(1)} N·m`, color: '#ef4444' },
      { label: 'Net τ', value: `${netTorque.toFixed(1)} N·m`, color: '#10b981' },
      { label: 'Inertia (I)', value: `${I.toFixed(2)} kg·m²`, color: '#8b5cf6' },
      { label: 'Accel (α)', value: `${alpha.toFixed(2)} rad/s²`, color: '#0f172a', bold: true },
      { label: 'Velocity (ω)', value: `${omega.toFixed(1)} rad/s`, color: '#0ea5e9' },
    ];

    dataLines.forEach((line, i) => {
      const yPos = hudY + 50 + i * 18;
      ctx.fillStyle = '#64748b';
      if (line.bold) ctx.font = 'bold 11px "JetBrains Mono", monospace';
      else ctx.font = '11px "JetBrains Mono", monospace';
      ctx.fillText(line.label, hudX + 15, yPos);

      ctx.fillStyle = line.color;
      ctx.textAlign = 'right';
      ctx.fillText(line.value, hudX + hudW - 15, yPos);
      ctx.textAlign = 'left'; // reset
    });

    // Formula at bottom
    ctx.fillStyle = '#f1f5f9';
    ctx.beginPath();
    ctx.roundRect(hudX + 10, hudY + hudH - 35, hudW - 20, 25, 4);
    ctx.fill();
    ctx.fillStyle = '#334155';
    ctx.font = 'italic 11px "Inter", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('τ = I × α', hudX + hudW / 2, hudY + hudH - 18);

    ctx.restore();
  }

  // Interaction handlers
  const onPointerDown = (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const L = getLayout();
    const forceApplyX = L.cx;
    const forceApplyY = L.cy - L.diskR;
    const forceScale = 2.0;
    const tipX = forceApplyX + p.force * forceScale;
    const tipY = forceApplyY;

    if (Math.hypot(x - tipX, y - tipY) < 20 || Math.hypot(x - forceApplyX, y - forceApplyY) < 20) {
      draggingForce = true;
    }
  };

  const onPointerMove = (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const L = getLayout();
    const forceApplyX = L.cx;
    const forceApplyY = L.cy - L.diskR;
    const forceScale = 2.0;

    if (draggingForce) {
      let newForce = (x - forceApplyX) / forceScale;
      // Clamp force
      newForce = Math.max(-100, Math.min(100, newForce));
      p.force = Math.round(newForce);
      if (window.onParamChange) window.onParamChange({ force: p.force });
    } else {
      const tipX = forceApplyX + p.force * forceScale;
      const tipY = forceApplyY;
      hoverForce =
        Math.hypot(x - tipX, y - tipY) < 20 || Math.hypot(x - forceApplyX, y - forceApplyY) < 20;
    }

    if (!running) render();
  };

  const onPointerUp = () => {
    draggingForce = false;
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
      const I = 0.5 * p.diskMass * p.radius * p.radius;
      const driveTorque = p.force * p.radius;
      const netTorque = driveTorque - p.damping * omega;
      return {
        time: simTime,
        torque: netTorque,
        alpha,
        omega,
        rotKE: 0.5 * I * omega * omega,
      };
    },
  };
}
