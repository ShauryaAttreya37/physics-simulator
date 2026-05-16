/**
 * Collisions Lab (1D) - Air Track Edition
 *
 * Simulates a high-precision linear air track environment.
 * Features mass-weighted overlap resolution and real-time conservation tracking.
 */

const DEFAULTS = {
  m1: 2.0,
  m2: 2.0,
  v1: 6,
  v2: -6,
  restitution: 1.0,
  showVectors: true,
  trackMode: 'infinite', // 'infinite' or 'single-shot'
};

export const defaultParams = { ...DEFAULTS };

export const equationSections = [
  {
    title: 'Elastic Collisions',
    content:
      'In a perfectly elastic collision (e=1), both momentum and kinetic energy are conserved.',
    equations: [
      {
        latex: String.raw`m_1 u_1 + m_2 u_2 = m_1 v_1 + m_2 v_2`,
        description: 'Momentum Conservation',
      },
      {
        latex: String.raw`\frac{1}{2}m_1 u_1^2 + \frac{1}{2}m_2 u_2^2 = \frac{1}{2}m_1 v_1^2 + \frac{1}{2}m_2 v_2^2`,
        description: 'Energy Conservation',
      },
    ],
  },
  {
    title: 'Inelastic Collisions',
    content:
      'In inelastic collisions (e < 1), some kinetic energy is converted into internal energy (heat/deformation).',
    equations: [
      {
        latex: String.raw`v_f = \frac{m_1 u_1 + m_2 u_2}{m_1 + m_2}`,
        description: 'Final velocity for e=0 (perfectly inelastic)',
      },
    ],
  },
];

export const equations = equationSections.flatMap((section) => section.equations || []);

export const controls = [
  { key: 'm1', label: 'Glider 1 Mass [kg]', min: 0.1, max: 20, step: 0.1 },
  { key: 'v1', label: 'Launch v1 [m/s]', min: -30, max: 30, step: 1 },
  { key: 'm2', label: 'Glider 2 Mass [kg]', min: 0.1, max: 20, step: 0.1 },
  { key: 'v2', label: 'Launch v2 [m/s]', min: -30, max: 30, step: 1 },
  { key: 'restitution', label: 'Restitution (e)', min: 0, max: 1, step: 0.01 },
  {
    key: 'trackMode',
    label: 'Track Mode',
    type: 'select',
    options: [
      { label: 'Infinite (Bounce)', value: 'infinite' },
      { label: 'Single Shot', value: 'single-shot' },
    ],
  },
];

export const graphParams = [
  { key: 'p_total', label: 'Total Momentum' },
  { key: 'ke_total', label: 'Kinetic Energy' },
];

export const scenarios = [
  {
    name: 'Velocity Swap',
    description: 'Equal masses, elastic collision.',
    params: { m1: 2, m2: 2, v1: 10, v2: 0, restitution: 1 },
  },
  {
    name: 'Momentum Transfer',
    description: 'Heavy object striking stationary light object.',
    params: { m1: 10, m2: 2, v1: 8, v2: 0, restitution: 1 },
  },
  {
    name: 'Maximum Inelastic',
    description: 'Objects stick together.',
    params: { m1: 2, m2: 2, v1: 10, v2: -10, restitution: 0 },
  },
];

export function create(canvas, initialParams) {
  const ctx = canvas.getContext('2d');
  let p = { ...DEFAULTS, ...initialParams };
  let simTime = 0;
  let running = false;
  let raf;

  let blocks = [
    { x: 0, v: 0, m: 2, w: 70, h: 36, color: '#3b82f6', label: '1' },
    { x: 0, v: 0, m: 2, w: 70, h: 36, color: '#ef4444', label: '2' },
  ];

  let draggingIdx = -1;
  let collisionEvent = 0; // Flash timer

  function resetState() {
    const W = canvas.width;
    blocks[0].x = W * 0.25;
    blocks[0].v = p.v1;
    blocks[0].m = p.m1;
    blocks[1].x = W * 0.75;
    blocks[1].v = p.v2;
    blocks[1].m = p.m2;
    simTime = 0;
    collisionEvent = 0;
  }

  function resolveCollision() {
    const b1 = blocks[0],
      b2 = blocks[1];
    const u1 = b1.v,
      u2 = b2.v;
    const m1 = b1.m,
      m2 = b2.m;
    const e = p.restitution;

    const v1 = (m1 * u1 + m2 * u2 + m2 * e * (u2 - u1)) / (m1 + m2);
    const v2 = (m1 * u1 + m2 * u2 + m1 * e * (u1 - u2)) / (m1 + m2);

    b1.v = v1;
    b2.v = v2;
    collisionEvent = 1.0;
  }

  function update(dt) {
    if (!running) return;
    simTime += dt;
    if (collisionEvent > 0) collisionEvent -= dt * 2;

    blocks.forEach((b) => (b.x += b.v * dt * 20));

    // Collision Detection
    const b1 = blocks[0],
      b2 = blocks[1];
    const minDist = (b1.w + b2.w) / 2;
    const dist = Math.abs(b1.x - b2.x);

    if (dist < minDist) {
      const overlap = minDist - dist;
      const totalM = b1.m + b2.m;
      if (b1.x < b2.x) {
        b1.x -= overlap * (b2.m / totalM);
        b2.x += overlap * (b1.m / totalM);
      } else {
        b1.x += overlap * (b2.m / totalM);
        b2.x -= overlap * (b1.m / totalM);
      }

      const relV = b1.v - b2.v;
      if (b1.x < b2.x ? relV > 0 : relV < 0) {
        resolveCollision();
      }
    }

    // Boundary logic
    if (p.trackMode === 'infinite') {
      blocks.forEach((b) => {
        if (b.x < b.w / 2) {
          b.x = b.w / 2;
          b.v *= -1;
        }
        if (b.x > canvas.width - b.w / 2) {
          b.x = canvas.width - b.w / 2;
          b.v *= -1;
        }
      });
    } else {
      // Single shot: just stop them or let them slide off
      blocks.forEach((b) => {
        if (b.x < -b.w || b.x > canvas.width + b.w) b.v = 0;
      });
    }
  }

  function render() {
    const W = canvas.width,
      H = canvas.height;
    const midY = H / 2;

    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(0, 0, W, H);

    // Track Rails (The "Air Track")
    ctx.fillStyle = '#334155';
    ctx.fillRect(0, midY + 18, W, 8); // Base
    ctx.fillStyle = '#475569';
    ctx.fillRect(0, midY + 18, W, 2); // Top edge

    // Measurement Rulers
    ctx.fillStyle = '#64748b';
    ctx.font = '10px "JetBrains Mono"';
    for (let x = 0; x <= W; x += 20) {
      const h = x % 100 === 0 ? 10 : x % 50 === 0 ? 7 : 4;
      ctx.fillRect(x, midY + 26, 1, h);
      if (x % 100 === 0) ctx.fillText(`${(x / 10).toFixed(0)}cm`, x + 4, midY + 40);
    }

    // Gliders
    blocks.forEach((b, i) => {
      ctx.save();
      ctx.translate(b.x, midY);

      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.1)';
      ctx.fillRect(-b.w / 2 + 2, 4, b.w, b.h);

      // Glider Body (Metallic)
      const grad = ctx.createLinearGradient(0, -b.h / 2, 0, b.h / 2);
      grad.addColorStop(0, b.color);
      grad.addColorStop(1, '#1e293b');
      ctx.fillStyle = grad;
      ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h);

      // Highlight
      ctx.fillStyle = 'rgba(255,255,255,0.1)';
      ctx.fillRect(-b.w / 2, -b.h / 2, b.w, 4);

      // Mass Info
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px Inter';
      ctx.textAlign = 'center';
      ctx.fillText(`${b.m}kg`, 0, 4);

      // Selection indicator
      if (draggingIdx === i) {
        ctx.strokeStyle = '#2563eb';
        ctx.lineWidth = 2;
        ctx.strokeRect(-b.w / 2 - 2, -b.h / 2 - 2, b.w + 4, b.h + 4);
      }

      // Velocity Arrow
      if (p.showVectors && Math.abs(b.v) > 0.1) {
        const arrowLen = b.v * 5;
        ctx.beginPath();
        ctx.moveTo(0, -b.h / 2 - 12);
        ctx.lineTo(arrowLen, -b.h / 2 - 12);
        ctx.strokeStyle = b.color;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Head
        ctx.fillStyle = b.color;
        const head = 6 * Math.sign(b.v);
        ctx.beginPath();
        ctx.moveTo(arrowLen, -b.h / 2 - 12);
        ctx.lineTo(arrowLen - head, -b.h / 2 - 16);
        ctx.lineTo(arrowLen - head, -b.h / 2 - 8);
        ctx.fill();
      }

      ctx.restore();
    });

    renderHUD();
  }

  function renderHUD() {
    const p1 = blocks[0].m * blocks[0].v,
      p2 = blocks[1].m * blocks[1].v;
    const ke1 = 0.5 * blocks[0].m * blocks[0].v ** 2,
      ke2 = 0.5 * blocks[1].m * blocks[1].v ** 2;

    const x = 20,
      y = 20,
      w = 180,
      h = 100;
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);

    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 10px "JetBrains Mono"';
    ctx.fillText('GLIDER TELEMETRY', x + 10, y + 20);

    ctx.font = '11px "JetBrains Mono"';
    ctx.fillText(`P_tot: ${(p1 + p2).toFixed(2)}`, x + 10, y + 42);
    ctx.fillText(`KE_tot: ${(ke1 + ke2).toFixed(2)}`, x + 10, y + 60);
    ctx.fillText(`e: ${p.restitution.toFixed(2)}`, x + 10, y + 78);

    if (collisionEvent > 0) {
      ctx.fillStyle = `rgba(239, 68, 68, ${collisionEvent})`;
      ctx.fillText('● COLLISION EVENT', x + 10, y + 94);
    }
  }

  function handlePointerDown(e) {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    blocks.forEach((b, i) => {
      if (Math.abs(mx - b.x) < b.w / 2 && Math.abs(my - canvas.height / 2) < b.h / 2 + 10) {
        draggingIdx = i;
      }
    });
  }

  function handlePointerMove(e) {
    if (draggingIdx === -1) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    blocks[draggingIdx].x = Math.max(0, Math.min(canvas.width, mx));
    if (!running) render();
  }

  function handlePointerUp() {
    draggingIdx = -1;
    render();
  }

  canvas.addEventListener('pointerdown', handlePointerDown);
  window.addEventListener('pointermove', handlePointerMove);
  window.addEventListener('pointerup', handlePointerUp);

  function loop() {
    if (!running) return;
    update(0.016);
    render();
    raf = requestAnimationFrame(loop);
  }

  resetState();
  render();

  return {
    start: () => {
      running = true;
      loop();
    },
    stop: () => {
      running = false;
      cancelAnimationFrame(raf);
    },
    reset: () => {
      resetState();
      render();
    },
    setParams: (next) => {
      p = { ...p, ...next };
      blocks[0].m = p.m1;
      blocks[1].m = p.m2;
      if (!running) {
        blocks[0].v = p.v1;
        blocks[1].v = p.v2;
      }
      render();
    },
    getData: () => {
      const p1 = blocks[0].m * blocks[0].v,
        p2 = blocks[1].m * blocks[1].v;
      return {
        time: simTime,
        p_total: p1 + p2,
        ke_total: 0.5 * blocks[0].m * blocks[0].v ** 2 + 0.5 * blocks[1].m * blocks[1].v ** 2,
      };
    },
    destroy: () => {
      running = false;
      cancelAnimationFrame(raf);
      canvas.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    },
  };
}
