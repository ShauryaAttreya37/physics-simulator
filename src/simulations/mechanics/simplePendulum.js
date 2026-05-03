import { rk4 } from '../../physics/solvers';
import { drawArrow } from '../../utils/canvas';

/**
 * Simple Pendulum (Nonlinear) — Enhanced Research-Grade
 * 
 * Features:
 *  - Full nonlinear EOM (no small-angle approximation)
 *  - Force vector visualisation (gravity, tension, tangential, centripetal)
 *  - Angle arc with deg/rad readout
 *  - Real-time energy bars (KE, PE, Total)
 *  - Phase-space trail
 *  - Live HUD with period measurement
 *  - Toggles for forces, trail, energy display
 */

const DEFAULTS = {
  length: 2.0,
  mass: 1.0,
  gravity: 9.81,
  damping: 0.1,
  theta0: 0.785, // 45 degrees
  theta0Deg: 45,
  omega0: 0,
  trailMax: 500,
  showForces: 1,
  showTrail: 1,
  showEnergy: 1,
  showAngleArc: 1,
};

export const defaultParams = { ...DEFAULTS };

export const equationSections = [
  {
    title: 'Introduction',
    content: 'A simple pendulum consists of a weight (bob) attached to a string or rod that swings back and forth under gravity. It\'s a great example of oscillatory motion, where the pendulum repeats its motion over time. This simulation shows how the pendulum behaves with different lengths, masses, and starting angles. You can observe how gravity pulls the bob down, and how friction (damping) slows it down over time. The motion is described by angles and speeds, and we can see patterns in the energy.',
  },
  {
    title: 'Equation of Motion',
    equations: [
      {
        latex: String.raw`\ddot{\theta} + \frac{g}{L}\sin\theta + \frac{c}{mL^2}\dot{\theta} = 0`,
        description: 'This equation describes how the angle of the pendulum changes over time. The first term shows gravity pulling it back (stronger for larger angles), the second term is damping that slows it down. θ (theta) is the angle from vertical, with dots meaning derivatives (speed and acceleration).',
      },
      {
        latex: String.raw`T \approx 2\pi\sqrt{\frac{L}{g}} \left(1 + \frac{1}{16}\theta_0^2 + \dots\right)`,
        description: 'This gives the time for one full swing (period). For small angles, it\'s about 2π times square root of length over gravity. For larger angles, the period gets longer because the motion isn\'t simple harmonic anymore.',
      },
    ],
    variables: [
      { symbol: 'L', description: 'Length of the pendulum rod (longer means slower swings)' },
      { symbol: 'm', description: 'Mass of the bob (doesn\'t affect period in vacuum)' },
      { symbol: 'g', description: 'Gravity strength (9.81 m/s² on Earth)' },
      { symbol: 'c', description: 'Damping coefficient (higher means more friction)' },
    ],
  },
  {
    title: 'Energy Conservation',
    equations: [
      {
        latex: String.raw`E = K + U = \frac{1}{2}mL^2\dot{\theta}^2 + mgL(1 - \cos\theta)`,
        description: 'Total energy is kinetic (from motion) plus potential (from height). In an ideal pendulum without damping, energy is conserved. With damping, energy decreases over time as heat. Watch the energy graph to see this.',
      },
    ],
  },
  {
    title: 'Forces on the Bob',
    equations: [
      {
        latex: String.raw`T = mg\cos\theta + \frac{mv^2}{L}`,
        description: 'Tension in the rod equals the radial component of gravity plus the centripetal acceleration term. Tension is always along the rod, pointing toward the pivot.',
      },
      {
        latex: String.raw`F_{\text{tan}} = -mg\sin\theta`,
        description: 'The tangential force is the component of gravity perpendicular to the rod. This is the restoring force that drives the oscillation.',
      },
    ],
  },
  {
    title: 'How to Use',
    content: '1. Adjust the length (L) to see how longer pendulums swing slower.\n2. Change the initial angle using either the degree or radian slider — they stay synced.\n3. Toggle "Show Forces" to see gravity (purple), tension (cyan), and tangential/centripetal components.\n4. Toggle "Show Energy" for real-time KE/PE/Total energy bars.\n5. Increase damping (c) to see how friction affects the motion.\n6. Watch the HUD for live period measurement and state data.',
  },
  {
    title: 'Beginner Tips',
    content: 'Start with small angles to see simple harmonic motion. Notice the period stays constant. Then try large angles - the period changes! Experiment with damping: it makes the pendulum stop eventually. Look for energy conservation in scenarios with low damping. Try the "Over-the-Top" scenario to see the pendulum go upside down.',
  },
];

export const equations = [
  String.raw`\ddot{\theta} = -\frac{g}{L}\sin\theta - \frac{c}{mL^2}\dot{\theta}`,
  String.raw`E = \frac{1}{2}mv^2 + mgh`,
];

export const graphParams = [
  { key: 'theta', label: 'Angle θ [rad]' },
  { key: 'omega', label: 'Velocity ω [rad/s]' },
  { key: 'energy', label: 'Total Energy E [J]' },
];

export const controls = [
  { key: 'length', label: 'Length L [m]', min: 0.5, max: 4, step: 0.1 },
  { key: 'mass', label: 'Mass m [kg]', min: 0.1, max: 5, step: 0.1 },
  { key: 'gravity', label: 'Gravity g [m/s²]', min: 0, max: 25, step: 0.1 },
  { key: 'damping', label: 'Damping c', min: 0, max: 2, step: 0.01 },
  { key: 'theta0', label: 'Initial θ [rad]', min: -3.14, max: 3.14, step: 0.01 },
  { key: 'theta0Deg', label: 'Initial θ [deg]', min: -180, max: 180, step: 1 },
  { key: 'showForces', label: 'Show Forces', min: 0, max: 1, step: 1 },
  { key: 'showTrail', label: 'Show Trail', min: 0, max: 1, step: 1 },
  { key: 'showEnergy', label: 'Show Energy', min: 0, max: 1, step: 1 },
  { key: 'showAngleArc', label: 'Show Angle Arc', min: 0, max: 1, step: 1 },
];

export const method = 'rk4';

export const scenarios = [
  {
    name: 'Small Angle (SHM)',
    description: 'Theta < 0.2 rad. Behaves nearly like a simple harmonic oscillator.',
    params: { ...DEFAULTS, theta0: 0.1, theta0Deg: 5.7 },
  },
  {
    name: 'Large Angle',
    description: 'Notice the period lengthening as the angle increases.',
    params: { ...DEFAULTS, theta0: 2.8, theta0Deg: 160.4 },
  },
  {
    name: 'Lunar Gravity',
    description: 'A much slower swing on the Moon (g = 1.62 m/s²).',
    params: { ...DEFAULTS, gravity: 1.62 },
  },
  {
    name: 'Over-the-Top',
    description: 'Give it high initial velocity to loop around.',
    params: { ...DEFAULTS, theta0: 0, theta0Deg: 0, omega0: 8, damping: 0.02 },
  },
  {
    name: 'No Damping',
    description: 'Perfect energy conservation — watch the energy bar stay constant.',
    params: { ...DEFAULTS, damping: 0, theta0: 1.0, theta0Deg: 57.3 },
  },
];

export function create(canvas, initParams = {}) {
  const ctx = canvas.getContext('2d');
  const p = { ...DEFAULTS, ...initParams };

  let theta, omega, simTime;
  let trail = [];
  // Period measurement
  let lastCrossTime = null;
  let measuredPeriod = null;
  let prevTheta = 0;

  function initState() {
    theta = p.theta0;
    omega = p.omega0 || 0;
    simTime = 0;
    trail = [];
    lastCrossTime = null;
    measuredPeriod = null;
    prevTheta = theta;
  }

  function derivs(state, params) {
    const [th, om] = state;
    const dom = -(params.gravity / params.length) * Math.sin(th) - (params.damping / (params.mass * params.length * params.length)) * om;
    return [om, dom];
  }

  function tick(dt) {
    const steps = 10;
    const h = dt / steps;
    let state = [theta, omega];
    for (let i = 0; i < steps; i++) {
      prevTheta = state[0];
      state = rk4(state, h, derivs, p);
      // Detect zero-crossing (positive direction) for period measurement
      if (prevTheta < 0 && state[0] >= 0 && simTime > 0.1) {
        const crossTime = simTime + h * (i / steps);
        if (lastCrossTime !== null) {
          measuredPeriod = crossTime - lastCrossTime;
        }
        lastCrossTime = crossTime;
      }
    }
    [theta, omega] = state;
    simTime += dt;

    const x = p.length * Math.sin(theta);
    const y = p.length * Math.cos(theta);
    trail.push({ x, y });
    if (trail.length > p.trailMax) trail.shift();
  }

  function render() {
    const W = canvas.width, H = canvas.height;

    // Sky gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
    skyGrad.addColorStop(0, '#06080f');
    skyGrad.addColorStop(0.4, '#0a0f1e');
    skyGrad.addColorStop(1, '#0d1225');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, W, H);

    // Subtle grid
    ctx.strokeStyle = 'rgba(255,255,255,0.025)';
    ctx.lineWidth = 0.5;
    for (let gx = 0; gx < W; gx += 60) {
      ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke();
    }
    for (let gy = 0; gy < H; gy += 60) {
      ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke();
    }

    const centerX = W / 2 + (p.panX || 0);
    const centerY = H * 0.22 + (p.panY || 0);
    const scale = Math.min(W, H) * 0.16;

    // Vertical reference line (equilibrium)
    ctx.setLineDash([4, 6]);
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(centerX, centerY + p.length * scale + 30);
    ctx.stroke();
    ctx.setLineDash([]);

    // Trail
    if (p.showTrail && trail.length > 2) {
      for (let i = 1; i < trail.length; i++) {
        const alpha = (i / trail.length);
        const tx0 = centerX + trail[i - 1].x * scale;
        const ty0 = centerY + trail[i - 1].y * scale;
        const tx1 = centerX + trail[i].x * scale;
        const ty1 = centerY + trail[i].y * scale;
        ctx.beginPath();
        ctx.moveTo(tx0, ty0);
        ctx.lineTo(tx1, ty1);
        ctx.strokeStyle = `rgba(251, 113, 133, ${alpha * 0.35})`;
        ctx.lineWidth = 1 + alpha * 1.5;
        ctx.stroke();
      }
    }

    const bobX = p.length * Math.sin(theta);
    const bobY = p.length * Math.cos(theta);
    const px = centerX + bobX * scale;
    const py = centerY + bobY * scale;

    // Angle arc
    if (p.showAngleArc && Math.abs(theta) > 0.02) {
      const arcR = Math.min(50, p.length * scale * 0.3);
      const startAngle = Math.PI / 2; // straight down
      const endAngle = Math.PI / 2 - theta;
      ctx.beginPath();
      if (theta > 0) {
        ctx.arc(centerX, centerY, arcR, endAngle, startAngle, false);
      } else {
        ctx.arc(centerX, centerY, arcR, startAngle, endAngle, false);
      }
      ctx.strokeStyle = 'rgba(253, 224, 71, 0.5)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Angle label
      const labelAngle = Math.PI / 2 - theta / 2;
      const labelR = arcR + 14;
      const lx = centerX + labelR * Math.cos(labelAngle);
      const ly = centerY + labelR * Math.sin(labelAngle);
      ctx.font = 'bold 11px "JetBrains Mono", monospace';
      ctx.fillStyle = 'rgba(253, 224, 71, 0.8)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const degVal = (theta * 180 / Math.PI).toFixed(1);
      const radVal = theta.toFixed(3);
      ctx.fillText(`${degVal}°`, lx, ly);
      ctx.font = '9px "JetBrains Mono", monospace';
      ctx.fillStyle = 'rgba(253, 224, 71, 0.45)';
      ctx.fillText(`${radVal} rad`, lx, ly + 13);
    }

    // Rod with gradient
    const rodGrad = ctx.createLinearGradient(centerX, centerY, px, py);
    rodGrad.addColorStop(0, '#94a3b8');
    rodGrad.addColorStop(1, '#64748b');
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(px, py);
    ctx.strokeStyle = rodGrad;
    ctx.lineWidth = 3;
    ctx.stroke();

    // Force vectors
    if (p.showForces && simTime > 0) {
      const v = p.length * omega;
      const gForce = p.mass * p.gravity;
      const tension = gForce * Math.cos(theta) + p.mass * v * v / p.length;
      const tangentialF = -gForce * Math.sin(theta);
      const vecScale = scale * 0.012;

      // Gravity (always straight down) — purple
      const gLen = gForce * vecScale;
      drawArrow(ctx, px, py, px, py + gLen,
        { color: '#a78bfa', lineWidth: 2.5, headLength: 8, label: 'mg' });

      // Tension (along rod toward pivot) — cyan
      const rodAngle = Math.atan2(centerY - py, centerX - px);
      const tLen = tension * vecScale;
      drawArrow(ctx, px, py, px + tLen * Math.cos(rodAngle), py + tLen * Math.sin(rodAngle),
        { color: '#22d3ee', lineWidth: 2.5, headLength: 8, label: 'T' });

      // Tangential component (perpendicular to rod) — green
      const tanAngle = rodAngle + Math.PI / 2;
      const tanLen = tangentialF * vecScale;
      if (Math.abs(tanLen) > 2) {
        drawArrow(ctx, px, py, px + tanLen * Math.cos(tanAngle), py + tanLen * Math.sin(tanAngle),
          { color: '#4ade80', lineWidth: 2, headLength: 7, label: 'Ftan' });
      }
    }

    // Pivot mount (bracket)
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.fillRect(centerX - 30, centerY - 8, 60, 8);
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1;
    ctx.strokeRect(centerX - 30, centerY - 8, 60, 8);

    // Pivot dot
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Bob with radial gradient and glow
    const bobR = 14 + Math.sqrt(p.mass) * 4;
    ctx.shadowBlur = 25;
    ctx.shadowColor = 'rgba(251, 113, 133, 0.6)';
    const bobGrad = ctx.createRadialGradient(px - 3, py - 3, 2, px, py, bobR);
    bobGrad.addColorStop(0, '#fecdd3');
    bobGrad.addColorStop(0.5, '#fb7185');
    bobGrad.addColorStop(1, '#e11d48');
    ctx.fillStyle = bobGrad;
    ctx.beginPath();
    ctx.arc(px, py, bobR, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Mass label on bob
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 10px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${p.mass.toFixed(1)}`, px, py);

    // Energy bars
    if (p.showEnergy) {
      const v = p.length * omega;
      const h = p.length * (1 - Math.cos(theta));
      const ke = 0.5 * p.mass * v * v;
      const pe = p.mass * p.gravity * h;
      const total = ke + pe;
      const maxE = Math.max(total, p.mass * p.gravity * p.length * 2, 0.1);

      const barX = W - 55;
      const barBottom = H - 40;
      const barHeight = H * 0.45;
      const barW = 18;

      // Background
      ctx.fillStyle = 'rgba(10, 10, 20, 0.7)';
      ctx.beginPath();
      ctx.roundRect(barX - 14, barBottom - barHeight - 35, barW + 28, barHeight + 55, 8);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Title
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.font = 'bold 8px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('ENERGY', barX + barW / 2, barBottom - barHeight - 20);

      // KE bar (bottom, blue)
      const keH = (ke / maxE) * barHeight;
      const peH = (pe / maxE) * barHeight;

      // PE (top, green)
      const peGrad = ctx.createLinearGradient(0, barBottom - keH - peH, 0, barBottom - keH);
      peGrad.addColorStop(0, '#4ade80');
      peGrad.addColorStop(1, '#16a34a');
      ctx.fillStyle = peGrad;
      ctx.fillRect(barX, barBottom - keH - peH, barW, peH);

      // KE (bottom, blue)
      const keGrad = ctx.createLinearGradient(0, barBottom - keH, 0, barBottom);
      keGrad.addColorStop(0, '#60a5fa');
      keGrad.addColorStop(1, '#2563eb');
      ctx.fillStyle = keGrad;
      ctx.fillRect(barX, barBottom - keH, barW, keH);

      // Border
      ctx.strokeStyle = 'rgba(255,255,255,0.1)';
      ctx.lineWidth = 1;
      ctx.strokeRect(barX, barBottom - barHeight, barW, barHeight);

      // Total line
      const totalH = (total / maxE) * barHeight;
      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = 'rgba(253, 224, 71, 0.5)';
      ctx.beginPath();
      ctx.moveTo(barX - 6, barBottom - totalH);
      ctx.lineTo(barX + barW + 6, barBottom - totalH);
      ctx.stroke();
      ctx.setLineDash([]);

      // Labels
      ctx.font = '8px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      if (keH > 12) {
        ctx.fillStyle = '#93c5fd';
        ctx.fillText('KE', barX + barW / 2, barBottom - keH / 2 + 3);
      }
      if (peH > 12) {
        ctx.fillStyle = '#86efac';
        ctx.fillText('PE', barX + barW / 2, barBottom - keH - peH / 2 + 3);
      }

      // Values
      ctx.textAlign = 'left';
      ctx.font = '8px "JetBrains Mono", monospace';
      ctx.fillStyle = '#93c5fd';
      ctx.fillText(`${ke.toFixed(2)}J`, barX - 12, barBottom + 14);
      ctx.fillStyle = '#86efac';
      ctx.fillText(`${pe.toFixed(2)}J`, barX - 12, barBottom + 24);
    }

    // HUD Panel
    const v = p.length * omega;
    const hBob = p.length * (1 - Math.cos(theta));
    const ke = 0.5 * p.mass * v * v;
    const pe = p.mass * p.gravity * hBob;
    const tPeriod = measuredPeriod !== null ? measuredPeriod.toFixed(3) : '—';
    const tTheory = 2 * Math.PI * Math.sqrt(p.length / p.gravity);

    const hudX = 14;
    const hudY = 14;
    const hudW = 185;
    const hudH = 175;

    ctx.fillStyle = 'rgba(10, 10, 20, 0.75)';
    ctx.beginPath();
    ctx.roundRect(hudX, hudY, hudW, hudH, 8);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.font = 'bold 10px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillText('PENDULUM DATA', hudX + 10, hudY + 8);

    const hudLines = [
      { label: 'Time', value: `${simTime.toFixed(2)} s`, color: '#e4e4e7' },
      { label: 'Angle', value: `${(theta * 180 / Math.PI).toFixed(1)}° (${theta.toFixed(3)} rad)`, color: '#fde047' },
      { label: 'Velocity', value: `${omega.toFixed(3)} rad/s`, color: '#60a5fa' },
      { label: 'Speed', value: `${Math.abs(v).toFixed(2)} m/s`, color: '#22d3ee' },
      { label: 'KE', value: `${ke.toFixed(3)} J`, color: '#93c5fd' },
      { label: 'PE', value: `${pe.toFixed(3)} J`, color: '#86efac' },
      { label: 'T (meas)', value: `${tPeriod} s`, color: '#fb7185' },
      { label: 'T (theory)', value: `${tTheory.toFixed(3)} s`, color: 'rgba(251,113,133,0.5)' },
    ];

    hudLines.forEach((line, i) => {
      const ly = hudY + 24 + i * 18;
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.font = '9px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(line.label, hudX + 10, ly);
      ctx.fillStyle = line.color;
      ctx.font = 'bold 9px "JetBrains Mono", monospace';
      ctx.textAlign = 'right';
      ctx.fillText(line.value, hudX + hudW - 10, ly);
    });

    // Force legend (bottom-left)
    if (p.showForces) {
      const legX = 14;
      const legY = H - 90;
      ctx.fillStyle = 'rgba(10, 10, 20, 0.7)';
      ctx.beginPath();
      ctx.roundRect(legX, legY, 120, 76, 6);
      ctx.fill();

      ctx.font = 'bold 9px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      const legends = [
        { color: '#a78bfa', label: '↓ Gravity (mg)' },
        { color: '#22d3ee', label: '↑ Tension (T)' },
        { color: '#4ade80', label: '→ Tangential' },
      ];
      legends.forEach((leg, i) => {
        ctx.fillStyle = leg.color;
        ctx.fillText(leg.label, legX + 10, legY + 16 + i * 20);
      });
    }
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

  initState();
  render();

  return {
    start() {
      if (running) return;
      running = true; lastTs = undefined;
      rafId = requestAnimationFrame(loop);
    },
    stop() { running = false; cancelAnimationFrame(rafId); },
    reset() { this.stop(); initState(); render(); this.start(); },
    setParams(next) {
      // Sync degree ↔ radian
      if ('theta0Deg' in next && !('theta0' in next)) {
        next.theta0 = next.theta0Deg * Math.PI / 180;
      } else if ('theta0' in next && !('theta0Deg' in next)) {
        next.theta0Deg = next.theta0 * 180 / Math.PI;
      }
      Object.assign(p, next);
      render();
    },
    destroy() { this.stop(); },
    getData() {
      const v = p.length * omega;
      const h = p.length * (1 - Math.cos(theta));
      const kinetic = 0.5 * p.mass * v * v;
      const potential = p.mass * p.gravity * h;
      return {
        time: simTime,
        theta, omega,
        energy: kinetic + potential,
      };
    },
  };
}
