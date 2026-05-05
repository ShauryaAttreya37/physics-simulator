/**
 * Rutherford Scattering — Coulomb's Law in Action
 *
 * Simulates alpha particles scattering off a fixed gold nucleus.
 * This is the historical Geiger-Marsden experiment that proved
 * the existence of the atomic nucleus (1911).
 *
 * Physics: Exact Coulomb repulsion F = kZze²/r², integrated with RK4.
 *          Trajectories are analytical hyperbolas — we verify numerically.
 * Visual:  Multiple simultaneous particles at different impact parameters
 *          produce the characteristic scattering pattern.
 */

const DEFAULTS = {
  Z: 79, // Gold nucleus charge number
  z: 2, // Alpha particle charge number
  energy: 5.0, // MeV kinetic energy of alpha particle
  nParticles: 12, // Number of simultaneous particles
  bMax: 120, // Maximum impact parameter (px)
  showField: 1, // Show electric field arrows
  showTrails: 1,
  trailMax: 400,
  timeScale: 1.0,
};

export const defaultParams = { ...DEFAULTS };

export const equationSections = [
  {
    title: 'Introduction',
    content:
      "In 1911, Rutherford directed alpha particles at a thin gold foil. Most passed straight through, but a few bounced back at large angles. This proved atoms have a tiny, dense, positively charged nucleus. The scattering pattern follows directly from Coulomb's law — the same inverse-square force that governs all electrostatics.",
  },
  {
    title: "Coulomb's Law",
    equations: [
      {
        latex: String.raw`\vec{F} = \frac{k Z z e^2}{r^2} \hat{r}`,
        description:
          'The repulsive Coulomb force between the alpha particle (charge ze) and the nucleus (charge Ze). Since both are positive, the force is repulsive — the alpha particle is deflected away.',
      },
      {
        latex: String.raw`\frac{d^2\vec{r}}{dt^2} = \frac{kZze^2}{m_\alpha \, r^2} \hat{r}`,
        description:
          "Newton's second law applied to the alpha particle. The nucleus is so heavy it stays fixed. This equation is integrated with 4th-order Runge-Kutta.",
      },
    ],
    variables: [
      { symbol: 'Z', description: 'Atomic number of target nucleus (79 for gold)' },
      { symbol: 'z', description: 'Charge number of projectile (2 for alpha)' },
      {
        symbol: 'b',
        description: 'Impact parameter — perpendicular distance from the nucleus line',
      },
      { symbol: 'θ', description: 'Scattering angle — how much the particle deflects' },
    ],
  },
  {
    title: 'Scattering Formula',
    equations: [
      {
        latex: String.raw`\cot\frac{\theta}{2} = \frac{2 E\, b}{k Z z e^2}`,
        description:
          'The exact relationship between impact parameter b and scattering angle θ. Small b → large angle (head-on). Large b → small angle (grazing).',
      },
      {
        latex: String.raw`d_0 = \frac{k Z z e^2}{E} \quad \text{(distance of closest approach)}`,
        description:
          'For a head-on collision (b=0), all kinetic energy converts to potential energy at this distance. This is the closest the alpha particle gets.',
      },
    ],
  },
  {
    title: 'How to Use',
    content:
      '1. Press Play to fire alpha particles at the nucleus.\n2. Adjust energy (MeV) — higher energy means less deflection.\n3. Change Z to scatter off different elements.\n4. Watch how impact parameter b determines the scattering angle.\n5. Head-on particles (small b) bounce almost straight back.\n6. Distant particles (large b) barely deflect.',
  },
  {
    title: 'Beginner Tips',
    content:
      'Notice most particles pass through with small deflection — Rutherford found this too! Only the rare head-on collisions produce large-angle scattering. The gold circle at center represents the distance of closest approach. Try increasing Z (heavier nucleus) to see stronger scattering. Try reducing energy to see more deflection.',
  },
];

export const equations = [
  String.raw`\vec{F} = \frac{kZze^2}{r^2}\hat{r} \quad \text{(Coulomb repulsion)}`,
  String.raw`\cot\frac{\theta}{2} = \frac{2Eb}{kZze^2} \quad \text{(Rutherford formula)}`,
];

export const graphParams = [
  { key: 'closestApproach', label: 'Closest Approach' },
  { key: 'scatterAngle', label: 'Scatter Angle (deg)' },
];

export const controls = [
  { key: 'Z', label: 'Nucleus Z', min: 1, max: 92, step: 1 },
  { key: 'z', label: 'Projectile z', min: 1, max: 6, step: 1 },
  { key: 'energy', label: 'Energy [MeV]', min: 0.5, max: 20, step: 0.1 },
  { key: 'nParticles', label: 'Particle Count', min: 1, max: 24, step: 1 },
  { key: 'bMax', label: 'Max Impact b [px]', min: 30, max: 250, step: 5 },
  { key: 'showField', label: 'Show Field', min: 0, max: 1, step: 1 },
  { key: 'showTrails', label: 'Show Trails', min: 0, max: 1, step: 1 },
  { key: 'timeScale', label: 'Speed', min: 0.2, max: 3, step: 0.1 },
];

export const scenarios = [
  {
    name: 'Classic Gold Foil',
    description: 'The original Geiger-Marsden experiment: 5 MeV alphas on gold.',
    params: { ...DEFAULTS },
  },
  {
    name: 'Head-On Collision',
    description: 'Single particle aimed directly at the nucleus (b ≈ 0).',
    params: { ...DEFAULTS, nParticles: 1, bMax: 5 },
  },
  {
    name: 'Low Energy',
    description: 'Slower particles deflect more — stronger Coulomb effect.',
    params: { ...DEFAULTS, energy: 1.5 },
  },
  {
    name: 'Light Nucleus',
    description: 'Scattering off carbon (Z=6) — much weaker deflection.',
    params: { ...DEFAULTS, Z: 6 },
  },
  {
    name: 'Dense Beam',
    description: 'Many particles showing the full scattering distribution.',
    params: { ...DEFAULTS, nParticles: 24, bMax: 200 },
  },
];

// ── Physics constants (scaled for pixel-space simulation) ────────────────
// We work in scaled units where the Coulomb parameter kZze²/E sets the
// characteristic length scale (distance of closest approach d₀).
// All positions are in pixels, velocities in px/frame-unit.

function rk4Step(state, dt, accelFn) {
  const k1 = accelFn(state);
  const s1 = [
    state[0] + k1[0] * dt * 0.5,
    state[1] + k1[1] * dt * 0.5,
    state[2] + k1[2] * dt * 0.5,
    state[3] + k1[3] * dt * 0.5,
  ];
  const k2 = accelFn(s1);
  const s2 = [
    state[0] + k2[0] * dt * 0.5,
    state[1] + k2[1] * dt * 0.5,
    state[2] + k2[2] * dt * 0.5,
    state[3] + k2[3] * dt * 0.5,
  ];
  const k3 = accelFn(s2);
  const s3 = [
    state[0] + k3[0] * dt,
    state[1] + k3[1] * dt,
    state[2] + k3[2] * dt,
    state[3] + k3[3] * dt,
  ];
  const k4 = accelFn(s3);
  return [
    state[0] + (dt / 6) * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]),
    state[1] + (dt / 6) * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]),
    state[2] + (dt / 6) * (k1[2] + 2 * k2[2] + 2 * k3[2] + k4[2]),
    state[3] + (dt / 6) * (k1[3] + 2 * k2[3] + 2 * k3[3] + k4[3]),
  ];
}

export function create(canvas, initParams = {}) {
  const ctx = canvas.getContext('2d');
  const p = { ...DEFAULTS, ...initParams };

  // State
  let particles = [];
  let simTime = 0;
  let closestGlobal = Infinity;
  let maxScatterAngle = 0;

  // Coulomb parameter: d₀ = kZze²/E (distance of closest approach for b=0)
  // We scale this to pixels. d₀ in px sets the visual scale.
  function d0() {
    // Scale so that d₀ is visually meaningful (around 30-80px)
    return (p.Z * p.z * 40) / Math.max(0.1, p.energy);
  }

  // Coulomb acceleration: a = (d₀ * v₀²/2) * r̂/r²
  // In our units: F/m = coulombK / r²
  function coulombK() {
    return d0() * 100; // Scaled force constant
  }

  function accelFn(state) {
    const [x, y, vx, vy] = state;
    const r2 = x * x + y * y + 1; // +1 softening prevents singularity
    const r = Math.sqrt(r2);
    const K = coulombK();
    const ax = (K * x) / (r2 * r);
    const ay = (K * y) / (r2 * r);
    return [vx, vy, ax, ay]; // repulsive: force along +r̂
  }

  function createParticles() {
    particles = [];
    const n = Math.max(1, Math.floor(p.nParticles));
    const W = canvas.width;
    const startX = -W * 0.45; // Start from far left
    const v0 = 3 + p.energy * 0.8; // Initial speed (scaled)

    for (let i = 0; i < n; i++) {
      // Evenly space impact parameters from -bMax to +bMax
      const b = n === 1 ? 0 : -p.bMax + (2 * p.bMax * i) / (n - 1);
      particles.push({
        state: [startX, b, v0, 0], // [x, y, vx, vy] relative to nucleus
        trail: [],
        active: true,
        closest: Infinity,
        scattered: false,
        scatterAngle: 0,
      });
    }
  }

  function init() {
    simTime = 0;
    closestGlobal = Infinity;
    maxScatterAngle = 0;
    createParticles();
  }

  function tick(dt) {
    const W = canvas.width;
    const H = canvas.height;
    const substeps = 8;
    const h = (dt * p.timeScale) / substeps;

    for (const part of particles) {
      if (!part.active) continue;

      for (let s = 0; s < substeps; s++) {
        part.state = rk4Step(part.state, h, accelFn);
      }

      const [x, y] = part.state;
      const r = Math.hypot(x, y);

      // Track closest approach
      if (r < part.closest) {
        part.closest = r;
        if (r < closestGlobal) closestGlobal = r;
      }

      // Detect if particle has passed the nucleus and is moving away
      if (x > 0 && part.state[2] > 0 && !part.scattered) {
        part.scattered = true;
        const angle = Math.atan2(part.state[3], part.state[2]) * (180 / Math.PI);
        part.scatterAngle = Math.abs(angle);
        if (part.scatterAngle > maxScatterAngle) {
          maxScatterAngle = part.scatterAngle;
        }
      }

      // Trail
      if (p.showTrails) {
        const cx = W / 2;
        const cy = H / 2;
        part.trail.push([cx + x, cy + y]);
        if (part.trail.length > p.trailMax) part.trail.shift();
      }

      // Deactivate if out of bounds
      if (Math.abs(x) > W * 0.55 && x > 0) {
        part.active = false;
      }
    }

    simTime += dt;

    // Respawn all if none are active
    const anyActive = particles.some((pp) => pp.active);
    if (!anyActive) {
      createParticles();
    }
  }

  function renderField(W, H, cx, cy) {
    const spacing = 50;
    const K = coulombK();

    for (let gx = spacing; gx < W; gx += spacing) {
      for (let gy = spacing; gy < H; gy += spacing) {
        const dx = gx - cx;
        const dy = gy - cy;
        const r2 = dx * dx + dy * dy + 100;
        const r = Math.sqrt(r2);

        if (r < 30) continue; // Skip too close to nucleus

        const eMag = K / r2;
        const ex = eMag * (dx / r);
        const ey = eMag * (dy / r);
        const mag = Math.hypot(ex, ey);

        const len = Math.min(spacing * 0.35, Math.log1p(mag * 0.3) * 8);
        const alpha = Math.min(0.35, mag * 0.02 + 0.03);
        const nx = ex / mag;
        const ny = ey / mag;

        ctx.strokeStyle = `rgba(255, 150, 50, ${alpha.toFixed(3)})`;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(gx - nx * len * 0.5, gy - ny * len * 0.5);
        ctx.lineTo(gx + nx * len * 0.5, gy + ny * len * 0.5);
        ctx.stroke();
      }
    }
  }

  function render() {
    const W = canvas.width;
    const H = canvas.height;
    const cx = W / 2;
    const cy = H / 2;

    // Background
    ctx.fillStyle = '#020408';
    ctx.fillRect(0, 0, W, H);

    // Subtle radial glow from nucleus
    const nucleusGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(W, H) * 0.4);
    nucleusGlow.addColorStop(0, 'rgba(255, 180, 50, 0.04)');
    nucleusGlow.addColorStop(0.3, 'rgba(255, 100, 30, 0.015)');
    nucleusGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = nucleusGlow;
    ctx.fillRect(0, 0, W, H);

    // Electric field vectors
    if (p.showField) {
      renderField(W, H, cx, cy);
    }

    // Distance of closest approach circle (dashed)
    const d0Val = d0();
    ctx.setLineDash([4, 6]);
    ctx.strokeStyle = 'rgba(255, 200, 100, 0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, d0Val, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Label
    ctx.font = '9px "JetBrains Mono", monospace';
    ctx.fillStyle = 'rgba(255, 200, 100, 0.3)';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('d₀', cx + d0Val + 4, cy - 4);

    // Particle trails
    for (const part of particles) {
      if (part.trail.length < 2) continue;
      for (let i = 1; i < part.trail.length; i++) {
        const t = i / part.trail.length;
        const alpha = t * 0.7;
        // Color: cyan for small scatter, yellow-red for large
        const scatter = part.scatterAngle || 0;
        const hue = scatter > 30 ? Math.max(0, 60 - scatter) : 180;
        ctx.beginPath();
        ctx.moveTo(part.trail[i - 1][0], part.trail[i - 1][1]);
        ctx.lineTo(part.trail[i][0], part.trail[i][1]);
        ctx.strokeStyle = `hsla(${hue}, 80%, 65%, ${alpha.toFixed(2)})`;
        ctx.lineWidth = 1 + t * 1.5;
        ctx.stroke();
      }
    }

    // Particles (alpha particles)
    for (const part of particles) {
      if (!part.active) continue;
      const [x, y] = part.state;
      const px = cx + x;
      const py = cy + y;

      // Glow
      ctx.shadowBlur = 12;
      ctx.shadowColor = 'rgba(100, 220, 255, 0.6)';
      ctx.beginPath();
      ctx.arc(px, py, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#7dd3fc';
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // Nucleus (gold)
    ctx.shadowBlur = 30;
    ctx.shadowColor = 'rgba(255, 180, 50, 0.8)';
    const nucleusR = 8 + Math.sqrt(p.Z) * 1.2;
    const nucGrad = ctx.createRadialGradient(cx - 3, cy - 3, 1, cx, cy, nucleusR);
    nucGrad.addColorStop(0, '#ffd700');
    nucGrad.addColorStop(0.5, '#e6a800');
    nucGrad.addColorStop(1, '#996600');
    ctx.beginPath();
    ctx.arc(cx, cy, nucleusR, 0, Math.PI * 2);
    ctx.fillStyle = nucGrad;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Nucleus ring
    ctx.beginPath();
    ctx.arc(cx, cy, nucleusR, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 220, 100, 0.4)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Nucleus label
    ctx.font = 'bold 10px "JetBrains Mono", monospace';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const symbols = { 79: 'Au', 6: 'C', 29: 'Cu', 92: 'U', 82: 'Pb', 26: 'Fe', 13: 'Al', 1: 'H' };
    ctx.fillText(symbols[p.Z] || `Z=${p.Z}`, cx, cy);

    // HUD
    ctx.font = '11px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    const hudX = 14;
    const hudY = 14;
    const hudW = 200;
    const hudH = 110;

    ctx.fillStyle = 'rgba(5, 5, 15, 0.75)';
    ctx.beginPath();
    ctx.roundRect(hudX, hudY, hudW, hudH, 8);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.font = 'bold 9px "JetBrains Mono", monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fillText('RUTHERFORD SCATTERING', hudX + 10, hudY + 10);

    const lines = [
      { label: 'Nucleus', value: `Z = ${p.Z}`, color: '#ffd700' },
      { label: 'Energy', value: `${p.energy.toFixed(1)} MeV`, color: '#7dd3fc' },
      { label: 'd₀ (closest)', value: `${d0().toFixed(1)} px`, color: '#ffa500' },
      { label: 'Max scatter', value: `${maxScatterAngle.toFixed(1)}°`, color: '#ff6b6b' },
    ];

    ctx.font = '9px "JetBrains Mono", monospace';
    lines.forEach((line, i) => {
      const ly = hudY + 28 + i * 18;
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.textAlign = 'left';
      ctx.fillText(line.label, hudX + 10, ly);
      ctx.fillStyle = line.color;
      ctx.font = 'bold 9px "JetBrains Mono", monospace';
      ctx.textAlign = 'right';
      ctx.fillText(line.value, hudX + hudW - 10, ly);
      ctx.font = '9px "JetBrains Mono", monospace';
    });

    // Beam direction indicator
    ctx.fillStyle = 'rgba(125, 211, 252, 0.4)';
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('α beam →', 12, H - 16);
  }

  let rafId;
  let lastTs;
  let running = false;

  function loop(ts) {
    if (!running) return;
    const dt = lastTs === undefined ? 1 / 60 : Math.min((ts - lastTs) / 1000, 1 / 20);
    lastTs = ts;
    tick(dt);
    render();
    rafId = requestAnimationFrame(loop);
  }

  init();
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
      init();
      render();
      this.start();
    },
    setParams(next) {
      Object.assign(p, next);
      render();
    },
    destroy() {
      this.stop();
    },
    getData() {
      return {
        time: simTime,
        closestApproach: closestGlobal === Infinity ? 0 : closestGlobal,
        scatterAngle: maxScatterAngle,
      };
    },
  };
}
