/**
 * Lorentz Force & Mass Spectrometer
 *
 * Physics:
 *   F = q(v × B)  — Lorentz force
 *   Circular motion with radius r = mv/(qB)
 *
 * Interactive: Drag the Ion Gun (left) and the Detector (bottom).
 */

const DEFAULTS = {
  mass: 4,
  charge: 1,
  velocity: 8,
  bField: 1.5,
  particleRate: 3,
  showRadius: 1,
  showForceVectors: 1,
  detectorX: 0.5,
  viewScale: 1.0,
};

const STATE = {
  gunY: -100, // relative to cy
};

export const defaultParams = { ...DEFAULTS };

export const equationSections = [
  {
    title: 'Introduction',
    content:
      'A mass spectrometer separates particles by their mass-to-charge ratio. Charged particles enter a region of uniform magnetic field, which bends their path into a circular arc. Heavier particles curve less (larger radius), lighter ones curve more.',
  },
  {
    title: 'Lorentz Force',
    equations: [
      {
        latex: String.raw`\vec{F} = q\vec{v} \times \vec{B}`,
        description: 'The magnetic force on a moving charge.',
      },
      {
        latex: String.raw`r = \frac{mv}{qB}`,
        description: 'Radius of the circular path.',
      },
    ],
  },
  {
    title: 'How to Use',
    content:
      '1. **Drag the Ion Gun** (left) to change where particles enter.\n2. **Drag the Detector** (bottom) to catch particles.\n3. Observe how mass and B-field affect the radius.',
  },
];

export const equations = [
  String.raw`\vec{F} = q\vec{v} \times \vec{B}`,
  String.raw`r = \frac{mv}{qB}`,
];

export const graphParams = [
  { key: 'radius', label: 'Radius r' },
  { key: 'impactX', label: 'Impact X' },
];

export const controls = [
  { key: 'mass', label: 'Mass [amu]', min: 1, max: 20, step: 0.5 },
  { key: 'charge', label: 'Charge [e]', min: 1, max: 5, step: 1 },
  { key: 'velocity', label: 'Velocity v', min: 1, max: 20, step: 0.5 },
  { key: 'bField', label: 'B-field [T]', min: 0.2, max: 5, step: 0.1 },
  { key: 'showRadius', label: 'Show Radius', type: 'toggle' },
  { key: 'showForceVectors', label: 'Show Force', type: 'toggle' },
];

export const scenarios = [
  {
    name: 'Helium-4 (α)',
    description: 'Classic alpha particle scattering.',
    params: { mass: 4, charge: 2, velocity: 8, bField: 1.5 },
  },
  {
    name: 'Heavy Ion',
    description: 'High mass leads to a large radius.',
    params: { mass: 15, charge: 1, velocity: 10, bField: 1.0 },
  },
];

export function create(canvas, initParams = {}) {
  const ctx = canvas.getContext('2d');
  const p = { ...DEFAULTS, ...initParams };
  let simTime = 0;

  let particles = [];
  let lastSpawn = 0;
  let lastImpactX = 0;

  // Interaction
  const gunState = { y: STATE.gunY };
  let dragTarget = null; // 'gun' or 'detector'

  function getRadius() {
    return (p.mass * p.velocity) / (Math.max(0.01, p.charge) * Math.max(0.01, p.bField));
  }

  function spawnParticle(W, H, scale) {
    const entryX = W * 0.08;
    const cy = H * 0.4;
    const entryY = cy + gunState.y * scale;
    const speed = p.velocity * 10 * scale;

    particles.push({
      x: entryX,
      y: entryY,
      vx: speed,
      vy: 0,
      trail: [{ x: entryX, y: entryY }],
      age: 0,
      landed: false,
    });
  }

  function tick(dt) {
    const W = canvas.width,
      H = canvas.height;
    const scale = p.viewScale ?? 1.0;
    const fieldRegionLeft = W * 0.15;

    simTime += dt;
    if (simTime - lastSpawn > 1 / p.particleRate) {
      spawnParticle(W, H, scale);
      lastSpawn = simTime;
    }

    for (const part of particles) {
      if (part.landed) continue;
      part.age += dt;

      const substeps = 10;
      const h = dt / substeps;

      for (let i = 0; i < substeps; i++) {
        if (part.x > fieldRegionLeft) {
          const qB = p.charge * p.bField * 20 * scale;
          const ax = (qB * part.vy) / p.mass;
          const ay = (-qB * part.vx) / p.mass;
          part.vx += ax * h;
          part.vy += ay * h;
        }

        part.x += part.vx * h;
        part.y += part.vy * h;

        if (part.y >= H * 0.85) {
          part.y = H * 0.85;
          part.landed = true;
          lastImpactX = part.x;
          break;
        }
        if (part.x < -50 || part.x > W + 50 || part.y < -50) {
          part.landed = true;
          break;
        }
      }

      if (!part.landed) {
        part.trail.push({ x: part.x, y: part.y });
        if (part.trail.length > 300) part.trail.shift();
      }
    }
    particles = particles.filter((pp) => pp.age < 12);
  }

  function render() {
    const W = canvas.width,
      H = canvas.height;
    const scale = p.viewScale ?? 1.0;
    const fieldLeft = W * 0.15;
    const cy = H * 0.4;

    ctx.fillStyle = '#050810';
    ctx.fillRect(0, 0, W, H);

    // Field Region
    ctx.fillStyle = 'rgba(100, 160, 255, 0.03)';
    ctx.fillRect(fieldLeft, 0, W - fieldLeft, H * 0.85);

    ctx.fillStyle = 'rgba(100, 160, 255, 0.1)';
    ctx.font = '12px monospace';
    for (let gx = fieldLeft + 30; gx < W - 20; gx += 50) {
      for (let gy = 30; gy < H * 0.82; gy += 50) ctx.fillText('×', gx, gy);
    }

    // Gun
    const gunY = cy + gunState.y * scale;
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(fieldLeft - 10, gunY - 15, 20, 30);
    ctx.strokeStyle = dragTarget === 'gun' ? '#fef08a' : 'rgba(255,255,255,0.2)';
    ctx.strokeRect(fieldLeft - 10, gunY - 15, 20, 30);

    // Particles & Trails
    for (const part of particles) {
      if (part.trail.length > 1) {
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(74, 222, 128, 0.4)';
        ctx.moveTo(part.trail[0].x, part.trail[0].y);
        for (let i = 1; i < part.trail.length; i++) ctx.lineTo(part.trail[i].x, part.trail[i].y);
        ctx.stroke();
      }
      if (!part.landed) {
        ctx.fillStyle = '#4ade80';
        ctx.beginPath();
        ctx.arc(part.x, part.y, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Detector
    const detW = 60;
    const detX = fieldLeft + p.detectorX * (W - fieldLeft - detW);
    const detY = H * 0.85;

    let hit = particles.some((pp) => pp.landed && Math.abs(pp.x - (detX + detW / 2)) < detW / 2);
    ctx.fillStyle = hit ? '#22c55e' : '#334155';
    ctx.beginPath();
    ctx.roundRect(detX, detY - 6, detW, 12, 4);
    ctx.fill();
    ctx.strokeStyle = dragTarget === 'detector' ? '#fef08a' : 'rgba(255,255,255,0.2)';
    ctx.stroke();

    // Glass HUD
    const hudX = 20,
      hudY = H - 140,
      hudW = 180,
      hudH = 120;
    ctx.fillStyle = 'rgba(20, 25, 40, 0.8)';
    ctx.beginPath();
    ctx.roundRect(hudX, hudY, hudW, hudH, 12);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.stroke();

    ctx.font = 'bold 9px monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fillText('MASS SPECTROMETER', hudX + 12, hudY + 18);

    const r = getRadius();
    const lines = [
      { label: 'Mass', value: p.mass.toFixed(1) + ' amu', color: '#e4e4e7' },
      { label: 'Charge', value: p.charge + ' e', color: '#60a5fa' },
      { label: 'Radius', value: r.toFixed(2), color: '#fbbf24' },
    ];
    lines.forEach((line, i) => {
      ctx.font = '9px monospace';
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.fillText(line.label, hudX + 12, hudY + 40 + i * 20);
      ctx.textAlign = 'right';
      ctx.fillStyle = line.color;
      ctx.fillText(line.value, hudX + hudW - 12, hudY + 40 + i * 20);
      ctx.textAlign = 'left';
    });
  }

  function handlePointerDown(e) {
    const rect = canvas.getBoundingClientRect();
    const hitX = e.clientX - rect.left,
      hitY = e.clientY - rect.top;
    const scale = p.viewScale ?? 1.0;
    const fieldLeft = canvas.width * 0.15;
    const gunY = canvas.height * 0.4 + gunState.y * scale;

    if (Math.abs(hitX - fieldLeft) < 20 && Math.abs(hitY - gunY) < 20) dragTarget = 'gun';
    else {
      const detW = 60,
        detX = fieldLeft + p.detectorX * (canvas.width - fieldLeft - detW),
        detY = canvas.height * 0.85;
      if (Math.abs(hitX - (detX + detW / 2)) < detW / 2 + 10 && Math.abs(hitY - detY) < 20)
        dragTarget = 'detector';
    }
  }

  function handlePointerMove(e) {
    if (!dragTarget) return;
    const rect = canvas.getBoundingClientRect();
    const hitX = e.clientX - rect.left,
      hitY = e.clientY - rect.top;
    const scale = p.viewScale ?? 1.0;
    const fieldLeft = canvas.width * 0.15;

    if (dragTarget === 'gun') gunState.y = (hitY - canvas.height * 0.4) / scale;
    else {
      const detW = 60;
      p.detectorX = Math.max(
        0,
        Math.min(1, (hitX - fieldLeft - detW / 2) / (canvas.width - fieldLeft - detW)),
      );
    }
    render();
  }

  function handlePointerUp() {
    dragTarget = null;
    render();
  }

  canvas.addEventListener('pointerdown', handlePointerDown);
  window.addEventListener('pointermove', handlePointerMove);
  window.addEventListener('pointerup', handlePointerUp);

  let running = false,
    rafId,
    lastTs;
  function loop(ts) {
    if (!running) return;
    const dt = lastTs === undefined ? 1 / 60 : Math.min((ts - lastTs) / 1000, 1 / 20);
    lastTs = ts;
    tick(dt);
    render();
    rafId = requestAnimationFrame(loop);
  }

  render();

  return {
    start() {
      if (!running) {
        running = true;
        lastTs = undefined;
        rafId = requestAnimationFrame(loop);
      }
    },
    stop() {
      running = false;
      cancelAnimationFrame(rafId);
    },
    reset() {
      gunState.y = STATE.gunY;
      particles = [];
      render();
    },
    setParams(next) {
      Object.assign(p, next);
      render();
    },
    destroy() {
      this.stop();
      canvas.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    },
    getData() {
      return { time: simTime, radius: getRadius(), impactX: lastImpactX };
    },
  };
}
