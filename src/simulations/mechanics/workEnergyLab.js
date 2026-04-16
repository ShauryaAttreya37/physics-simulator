/**
 * Work & Energy Lab: Mass on an Incline
 * 
 * Demonstrates the Work-Energy Theorem and Conservation of Energy.
 * Tracks Kinetic, Potential, and Thermal energy in real-time.
 */

const DEFAULTS = {
  mass: 2.0,
  gravity: 9.81,
  angle: 0.4, // ~23 degrees
  frictionMu: 0.15,
  appliedForce: 0,
  x0: 0,
  v0: 0,
};

export const defaultParams = { ...DEFAULTS };

export const equationSections = [
  {
    title: 'The Force \& The Work-Energy Theorem',
    equations: [
      {
        latex: String.raw`W_{net} = \Delta K = K_f - K_i`,
        description: 'Imagine a Jedi using the Force to push a block of kyber crystal up a ramp. The precise amount of Net Force they channel over that distance (Work) translates exactly to the crystal\'s change in Kinetic Energy. The Force is what gives it motion!',
      },
      {
        latex: String.raw`W = \int \vec{F} \cdot d\vec{r}`,
        description: 'Every midichlorian contributes. Here, we sum up the continuous Force over every inch of the displacement, even if the dark side (friction) tries to oppose the struggle.',
      },
    ],
  },
  {
    title: 'Energy Conservation in the Galaxy',
    equations: [
      {
        latex: String.raw`E_{total} = K + U + Q = \text{const}`,
        description: 'Energy, like the Force, binds the galaxy together—it cannot be created or destroyed. Kinetic (motion), Potential (height), and Thermal (heat from friction on sandy Tatooine slopes) always sum to the same constant.',
      },
      {
        latex: String.raw`K = \frac{1}{2}mv^2, \quad U = mgh, \quad Q = \int |f_k| dx`,
        description: 'Kinetic (K) measures the speed of your pod-racer, Potential (U) is its height over the Sarlacc pit, and Q is the thermal energy lost scraping the hull against the canyon walls.',
      },
    ],
  },
  {
    title: 'Unlimited Power!',
    equations: [
      {
        latex: String.raw`P = \frac{dW}{dt} = \vec{F} \cdot \vec{v}`,
        description: '"Unlimited Power!" — the Sith Lord was actually referring to the RATE at which work is performed. It\'s your instantaneous physical Force multiplied by your current velocity.',
      },
    ],
  },
];

export const equations = [
  String.raw`W = \Delta K`,
  String.raw`P = F \cdot v`,
  String.raw`E = K + U + Q`,
];

export const graphParams = [
  { key: 'ke', label: 'Kinetic K [J]' },
  { key: 'pe', label: 'Potential U [J]' },
  { key: 'thermal', label: 'Thermal Q [J]' },
  { key: 'power', label: 'Power P [W]' },
];

export const controls = [
  { key: 'mass', label: 'Mass m [kg]', min: 0.5, max: 10, step: 0.5 },
  { key: 'angle', label: 'Incline Angle [rad]', min: 0, max: 1.2, step: 0.01 },
  { key: 'frictionMu', label: 'Friction μ', min: 0, max: 0.8, step: 0.01 },
  { key: 'appliedForce', label: 'Applied Force [N]', min: -50, max: 100, step: 1 },
];

export function create(canvas, initParams = {}) {
  const ctx = canvas.getContext('2d');
  const p = { ...DEFAULTS, ...initParams };

  let x, v, simTime;
  let thermalEnergy;

  function initState() {
    x = -4; // Start near bottom-left of ramp
    v = 0;
    simTime = 0;
    thermalEnergy = 0;
  }

  function tick(dt) {
    const steps = 30;
    const h = dt / steps;

    for (let i = 0; i < steps; i++) {
      const g_parallel = p.gravity * Math.sin(p.angle);
      const g_normal = p.gravity * Math.cos(p.angle);
      const f_max_static = p.frictionMu * p.mass * g_normal;
      
      let f_kinetic = 0;
      if (Math.abs(v) > 0.01) {
        f_kinetic = -Math.sign(v) * p.frictionMu * p.mass * g_normal;
      }

      let f_net = p.appliedForce - p.mass * g_parallel + f_kinetic;

      // Static friction logic
      if (Math.abs(v) < 0.01) {
        const f_applied_net = p.appliedForce - p.mass * g_parallel;
        if (Math.abs(f_applied_net) < f_max_static) {
          f_net = 0;
          v = 0;
        } else {
          f_net = f_applied_net - Math.sign(f_applied_net) * f_max_static;
        }
      }

      const a = f_net / p.mass;
      v += a * h;
      const dx = v * h;
      x += dx;

      if (Math.abs(v) > 0) {
        thermalEnergy += Math.abs(f_kinetic * dx);
      }
      
      simTime += h;
    }

    // Hard stops at ends of track
    if (x < -8) { x = -8; v = 0; }
    if (x > 8) { x = 8; v = 0; }
  }

  function render() {
    const W = canvas.width, H = canvas.height;
    
    // 1. Sky / Space Gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
    skyGrad.addColorStop(0, '#050510');
    skyGrad.addColorStop(0.5, '#1e1b4b');
    skyGrad.addColorStop(1, '#78350f'); // Desert sunset horizon
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, W, H);

    // 2. Stars
    ctx.fillStyle = '#ffffff';
    for(let i=0; i<150; i++) {
        const sx = Math.abs((Math.sin(i * 12.9898) * 43758.5453) % 1);
        const sy = Math.abs((Math.sin(i * 78.233) * 43758.5453) % 1);
        if (sy > 0.6) continue; // Stars only in space
        ctx.globalAlpha = 0.2 + (Math.abs((Math.sin(i * 12.3 + simTime*2) * 43758.5453) % 1) * 0.8);
        ctx.beginPath();
        ctx.arc(sx * W, sy * H, i % 3 === 0 ? 1.5 : 1.0, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1.0;

    const centerX = W / 2;
    const centerY = H * 0.55;
    const scale = Math.min(W, H) * 0.05; // ~40-50 pixels per meter

    // 3. Twin Suns (Symmetrical composition)
    ctx.save();
    // Sun 1 (larger, red)
    ctx.beginPath();
    ctx.arc(centerX - 150, centerY - 80, 80, 0, Math.PI * 2);
    ctx.fillStyle = '#ef4444';
    ctx.shadowBlur = 60;
    ctx.shadowColor = '#dc2626';
    ctx.fill();
    
    // Sun 2 (smaller, warm yellow/white)
    ctx.beginPath();
    ctx.arc(centerX + 150, centerY - 120, 50, 0, Math.PI * 2);
    ctx.fillStyle = '#fef08a';
    ctx.shadowBlur = 40;
    ctx.shadowColor = '#fde047';
    ctx.fill();
    ctx.restore();

    // 4. Ground (Symmetrical Desert Dunes)
    // Symmetrical dune at the center
    ctx.fillStyle = '#b45309'; 
    ctx.beginPath();
    ctx.moveTo(0, H);
    ctx.quadraticCurveTo(centerX, H - 250, W, H);
    ctx.fill();
    
    // Left dune
    ctx.fillStyle = '#92400e';
    ctx.beginPath();
    ctx.moveTo(0, H);
    ctx.quadraticCurveTo(centerX - 300, H - 150, centerX, H);
    ctx.lineTo(0, H);
    ctx.fill();

    // Right dune
    ctx.fillStyle = '#78350f';
    ctx.beginPath();
    ctx.moveTo(W, H);
    ctx.quadraticCurveTo(centerX + 300, H - 150, centerX, H);
    ctx.lineTo(W, H);
    ctx.fill();

    // 5. The Track System
    ctx.save();
    ctx.translate(centerX, centerY);

    // Mechanical Pillar supporting the track
    const pillarW = 60;
    ctx.fillStyle = '#0f172a'; // dark metal
    ctx.fillRect(-pillarW/2, 0, pillarW, H - centerY);
    // Pillar details
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-pillarW/2 + 10, 0, 10, H - centerY);
    ctx.fillRect(pillarW/2 - 20, 0, 10, H - centerY);

    // Pivot joint
    ctx.beginPath();
    ctx.arc(0, 0, 40, 0, Math.PI * 2);
    ctx.fillStyle = '#334155';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#0f172a';
    ctx.stroke();

    // Rotate the track frame
    ctx.rotate(-p.angle);
    
    // The Track itself (Sleek sci-fi platform)
    const trackLen = 18 * scale;
    const trackH = 15;
    
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.roundRect(-trackLen/2, -trackH/2, trackLen, trackH, 5);
    ctx.fill();

    // Glowing energy rails
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#06b6d4';
    ctx.fillStyle = '#22d3ee';
    ctx.fillRect(-trackLen/2, -trackH/2 - 2, trackLen, 2);
    ctx.fillRect(-trackLen/2, trackH/2, trackLen, 2);
    ctx.shadowBlur = 0;

    // Track tick marks (distance)
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    for (let i = -8; i <= 8; i++) {
        ctx.fillRect(i * scale, -trackH/2, 2, trackH);
        if (i !== 0 && i % 2 === 0) {
           ctx.font = '10px monospace';
           ctx.fillText(i.toString(), i * scale - 4, trackH/2 + 14);
        }
    }

    // The Block (Kyber Crystal)
    const blockW = 1.2 * scale, blockH = 0.8 * scale;
    const bx = x * scale;
    // block sits ON TOP of the augmented track
    const by = -trackH/2 - blockH/2 - 2; 
    
    // Force field/aura around block if moving
    if (Math.abs(v) > 0.1) {
        ctx.shadowBlur = 30;
        ctx.shadowColor = '#22d3ee';
        ctx.fillStyle = 'rgba(34, 211, 238, 0.15)';
        ctx.beginPath();
        ctx.arc(bx, by, blockW, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }

    ctx.shadowBlur = 20;
    ctx.shadowColor = '#00ffff';
    ctx.fillStyle = '#e0ffff';
    ctx.fillRect(bx - blockW/2, by - blockH/2, blockW, blockH);
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(bx - blockW/2, by - blockH/2, blockW, blockH);

    // Applied Force Vector (The Force)
    if (Math.abs(p.appliedForce) > 0.1) {
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#3b82f6';
      drawArrow(ctx, bx, by, bx + p.appliedForce * (scale * 0.1), by, '#60a5fa', 'The Force');
      ctx.shadowBlur = 0;
    }
    
    ctx.restore();

    // ── HUD Dashboard ────────────────────────────────────────
    const ke = 0.5 * p.mass * v * v;
    const pe = p.mass * p.gravity * (x + 8) * Math.sin(p.angle);
    const power = p.appliedForce * v;

    // HUD Backgrounds (Moved to Top to avoid overlaps and balance symmetry)
    ctx.shadowBlur = 10;
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
    ctx.strokeStyle = '#1e3a8a';
    ctx.lineWidth = 2;
    
    // Top Left (JEDI TELEMETRY)
    ctx.beginPath();
    ctx.roundRect(20, 20, 240, 160, 8);
    ctx.fill();
    ctx.stroke();

    // Top Right (FORCE GAUGE)
    ctx.beginPath();
    ctx.roundRect(W - 220, 20, 200, 180, 8);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Telemetry Labels
    ctx.fillStyle = '#60a5fa';
    ctx.font = 'bold 12px "JetBrains Mono"';
    ctx.fillText('⚡ JEDI TELEMETRY [J]', 35, 45);
    ctx.fillText('☄️ FORCE GAUGE', W - 200, 45);

    drawEnergyBar(ctx, 35, 75, ke, '#00ffff', 'Kyber Kinetic');
    drawEnergyBar(ctx, 35, 115, pe, '#8b5cf6', 'Gravity Potential');
    drawEnergyBar(ctx, 35, 155, thermalEnergy, '#ef4444', 'Sith Thermal');

    drawGauge(ctx, W - 120, 100, power, 'Power [W]');
    
    // Readouts
    ctx.fillStyle = '#fff';
    ctx.font = '11px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`Velocity: ${v.toFixed(2)} m/s`, W - 200, 165);
    ctx.fillText(`Position: ${x.toFixed(2)} m`, W - 200, 180);
  }

  function drawArrow(ctx, x1, y1, x2, y2, color, label) {
    const headlen = 10;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const angle = Math.atan2(dy, dx);
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - headlen * Math.cos(angle - Math.PI / 6), y2 - headlen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(x2 - headlen * Math.cos(angle + Math.PI / 6), y2 - headlen * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 10px sans-serif';
    ctx.fillText(label, x2 + (dx > 0 ? 10 : -40), y2 - 5);
  }

  function drawEnergyBar(ctx, x, y, val, color, label) {
    const maxW = 200;
    const barW = Math.min(maxW, val * 3); // Scale factor for visibility
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    ctx.fillRect(x, y, maxW, 14);
    ctx.fillStyle = color;
    ctx.fillRect(x, y, barW, 14);
    ctx.fillStyle = '#fff';
    ctx.font = '10px "JetBrains Mono"';
    ctx.textAlign = 'left';
    ctx.fillText(`${label}: ${val.toFixed(1)}`, x, y - 6);
  }

  function drawGauge(ctx, x, y, val, label) {
    const radius = 45;
    ctx.beginPath();
    ctx.arc(x, y, radius, Math.PI * 0.8, Math.PI * 2.2);
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 10;
    ctx.stroke();

    const normalized = (Math.min(150, Math.max(-150, val)) + 150) / 300;
    const angle = Math.PI * 0.8 + (Math.PI * 1.4 * normalized);
    
    ctx.beginPath();
    ctx.arc(x, y, radius, Math.PI * 0.8, angle);
    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.stroke();

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(val.toFixed(1), x, y + 5);
    ctx.font = '9px "JetBrains Mono"';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillText(label, x, y + 25);
  }

  let rafId, lastTs, running = false;

  function loop(ts) {
    if (!running) return;
    const dt = lastTs === undefined ? 1/60 : Math.min((ts - lastTs) / 1000, 1/20);
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
    setParams(next) { Object.assign(p, next); render(); },
    destroy() { this.stop(); },
    getData() {
      const ke = 0.5 * p.mass * v * v;
      const pe = p.mass * p.gravity * (x + 8) * Math.sin(p.angle);
      return {
        time: simTime,
        ke, pe,
        thermal: thermalEnergy,
        power: p.appliedForce * v,
        totalEnergy: ke + pe + thermalEnergy,
      };
    },
  };
}
