import { drawArrow } from '../../utils/canvas';

const DEFAULTS = {
  force: 35,
  radius: 1.1,
  inertia: 3.2,
  damping: 0.18,
  angle0: 0,
  omega0: 0,
};

export const defaultParams = { ...DEFAULTS };

export const controls = [
  { key: 'force', label: 'Tangential Force F [N]', min: -80, max: 80, step: 1 },
  { key: 'radius', label: 'Lever Arm r [m]', min: 0.2, max: 2, step: 0.01 },
  { key: 'inertia', label: 'Moment of Inertia I [kg m^2]', min: 0.2, max: 10, step: 0.01 },
  { key: 'damping', label: 'Bearing Drag c [N m s]', min: 0, max: 1.2, step: 0.01 },
];

export const graphParams = [
  { key: 'torque', label: 'Torque tau [N m]' },
  { key: 'alpha', label: 'Angular Accel alpha [rad/s^2]' },
  { key: 'omega', label: 'Angular Velocity omega [rad/s]' },
  { key: 'theta', label: 'Angle theta [rad]' },
  { key: 'rotKE', label: 'Rotational KE [J]' },
];

export const equationSections = [
  {
    title: 'Introduction',
    content:
      "Torque and rotation are the angular equivalents of force and linear motion. This simulation shows a rotor that you can apply torques to, demonstrating how rotational inertia affects angular acceleration. It's like Newton's second law but for spinning objects.",
  },
  {
    title: 'Rotational Dynamics',
    equations: [
      {
        latex: String.raw`\tau = rF_t`,
        description:
          'Torque is force times the perpendicular distance from the axis (lever arm). It causes rotation.',
      },
      {
        latex: String.raw`\sum \tau = I\alpha`,
        description:
          "Net torque equals moment of inertia times angular acceleration. This is Newton's second law for rotation.",
      },
    ],
    variables: [
      { symbol: 'τ', description: 'Torque (N·m) - rotational force' },
      { symbol: 'r', description: 'Lever arm - distance from axis to force' },
      { symbol: 'F_t', description: 'Tangential force component' },
      { symbol: 'I', description: 'Moment of inertia - rotational mass (kg·m²)' },
      { symbol: 'α', description: 'Angular acceleration (rad/s²)' },
    ],
  },
  {
    title: 'Energy',
    equations: [
      {
        latex: String.raw`K_{rot} = \frac{1}{2}I\omega^2`,
        description:
          'Rotational kinetic energy. Like linear KE but with moment of inertia and angular velocity.',
      },
    ],
  },
  {
    title: 'Moment of Inertia',
    equations: [
      {
        latex: String.raw`I = \sum m_i r_i^2`,
        description:
          'Moment of inertia depends on mass distribution. Mass farther from axis has more effect.',
      },
    ],
  },
  {
    title: 'How to Use',
    content:
      '1. Apply tangential forces by clicking and dragging on the rotor.\n2. Adjust the moment of inertia - higher I means harder to spin.\n3. Add damping to see realistic slowing down.\n4. Watch angular velocity and acceleration graphs.\n5. See how torque relates to angular acceleration.\n6. Compare rotational KE to the work done.',
  },
  {
    title: 'Beginner Tips',
    content:
      'Torque is like force for rotation. The farther from the center you apply force, the more torque. Heavy objects or mass far from axis have high moment of inertia. Try spinning it fast then letting it slow - see conservation of energy. Compare to linear motion analogies.',
  },
];

export const equations = [
  String.raw`\tau = rF_t`,
  String.raw`\alpha = \frac{\tau}{I}`,
  String.raw`K_{rot} = \frac{1}{2}I\omega^2`,
];

export function create(canvas, initParams = {}) {
  const ctx = canvas.getContext('2d');
  let p = { ...DEFAULTS, ...initParams };

  let theta = 0;
  let omega = 0;
  let alpha = 0;
  let simTime = 0;

  function normalizeAngle(angle) {
    let a = angle;
    while (a > Math.PI) a -= Math.PI * 2;
    while (a < -Math.PI) a += Math.PI * 2;
    return a;
  }

  function initState() {
    theta = p.angle0;
    omega = p.omega0;
    alpha = 0;
    simTime = 0;
  }

  function tick(dt) {
    const steps = 6;
    const h = dt / steps;
    for (let i = 0; i < steps; i++) {
      const driveTorque = p.force * p.radius;
      const dragTorque = p.damping * omega;
      const netTorque = driveTorque - dragTorque;
      alpha = netTorque / Math.max(0.05, p.inertia);
      omega += alpha * h;
      theta += omega * h;
      theta = normalizeAngle(theta);
      simTime += h;
    }
  }

  function render() {
    const W = canvas.width;
    const H = canvas.height;

    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#050b19');
    bg.addColorStop(1, '#08132b');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    const cx = W * 0.52;
    const cy = H * 0.55;
    const pxPerMeter = Math.min(W, H) * 0.16;
    const diskR = Math.max(40, p.radius * pxPerMeter);

    const ring = ctx.createRadialGradient(cx - diskR * 0.35, cy - diskR * 0.35, 6, cx, cy, diskR);
    ring.addColorStop(0, '#dbeafe');
    ring.addColorStop(0.4, '#60a5fa');
    ring.addColorStop(1, '#1e3a8a');
    ctx.fillStyle = ring;
    ctx.beginPath();
    ctx.arc(cx, cy, diskR, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, diskR, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(theta) * diskR * 0.88, cy + Math.sin(theta) * diskR * 0.88);
    ctx.stroke();

    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(cx, cy, 9, 0, Math.PI * 2);
    ctx.fill();

    const handleX = cx + Math.cos(theta) * diskR;
    const handleY = cy + Math.sin(theta) * diskR;
    const tangentX = -Math.sin(theta);
    const tangentY = Math.cos(theta);
    const forceScale = Math.min(90, Math.abs(p.force) * 1.5);
    const sign = p.force >= 0 ? 1 : -1;
    drawArrow(
      ctx,
      handleX,
      handleY,
      handleX + tangentX * sign * forceScale,
      handleY + tangentY * sign * forceScale,
      { color: '#f59e0b', lineWidth: 3 },
    );

    const omegaScale = Math.min(52, Math.abs(omega) * 4);
    drawArrow(ctx, cx - diskR - 20, cy, cx - diskR - 20, cy - (omega >= 0 ? 1 : -1) * omegaScale, {
      color: '#22d3ee',
      lineWidth: 3,
    });

    ctx.fillStyle = 'rgba(10,15,30,0.8)';
    ctx.fillRect(20, 20, 300, 160);
    ctx.strokeStyle = 'rgba(148,163,184,0.35)';
    ctx.strokeRect(20, 20, 300, 160);

    ctx.font = '700 14px "JetBrains Mono", monospace';
    ctx.fillStyle = '#93c5fd';
    ctx.fillText('Torque vs Angular Acceleration', 34, 44);

    ctx.font = '12px "JetBrains Mono", monospace';
    ctx.fillStyle = '#e5e7eb';
    ctx.fillText(`tau = ${(p.force * p.radius).toFixed(2)} N m`, 34, 72);
    ctx.fillText(`I = ${p.inertia.toFixed(2)} kg m^2`, 34, 94);
    ctx.fillText(`alpha = ${alpha.toFixed(3)} rad/s^2`, 34, 116);
    ctx.fillText(`omega = ${omega.toFixed(3)} rad/s`, 34, 138);
    ctx.fillText(`theta = ${theta.toFixed(3)} rad`, 34, 160);

    // Legend
    ctx.fillStyle = 'rgba(10,15,30,0.8)';
    ctx.fillRect(20, 195, 230, 65);
    ctx.strokeStyle = 'rgba(148,163,184,0.35)';
    ctx.strokeRect(20, 195, 230, 65);

    ctx.font = '700 12px "JetBrains Mono", monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('LEGEND', 34, 215);

    ctx.font = '12px "JetBrains Mono", monospace';

    // Orange - Force
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(34, 226, 12, 3);
    ctx.fillStyle = '#e5e7eb';
    ctx.fillText('Tangential Force (F)', 54, 230);

    // Cyan - Omega
    ctx.fillStyle = '#22d3ee';
    ctx.fillRect(34, 244, 12, 3);
    ctx.fillStyle = '#e5e7eb';
    ctx.fillText('Angular Velocity (ω)', 54, 248);
  }

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
    },
    getData() {
      const driveTorque = p.force * p.radius;
      const netTorque = driveTorque - p.damping * omega;
      return {
        time: simTime,
        torque: netTorque,
        alpha,
        omega,
        theta,
        rotKE: 0.5 * p.inertia * omega * omega,
        totalEnergy: 0.5 * p.inertia * omega * omega,
      };
    },
  };
}
