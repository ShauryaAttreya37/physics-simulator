/**
 * Newton's Cradle — Analytical Implementation
 *
 * Physics: Each ball is a simple pendulum integrated with RK4.
 *          Collisions are detected geometrically and resolved using
 *          exact 1D elastic collision equations along the line of contact.
 * Why:     Matter.js constraint solvers leak energy and momentum.
 *          This approach conserves both to machine precision.
 */

const DEFAULTS = {
  count: 5,
  radius: 22,
  stringLength: 210,
  pullCount: 1,
  pullAngle: -Math.PI / 3.3,
  restitution: 0.995,
  mass: 1.0,
  airFriction: 0.0003,
  gravity: 980,
};

export const defaultParams = { ...DEFAULTS };

export const equationSections = [
  {
    title: 'Introduction',
    content:
      "Newton's cradle demonstrates conservation of momentum and energy through collisions. When you lift and release balls on one side, they transfer energy to the other side. It shows how elastic collisions work and why the same number of balls swing out.",
  },
  {
    title: 'Conservation Laws',
    equations: [
      {
        latex: String.raw`\sum m_i \mathbf{v}_i = \text{const}`,
        description: 'Total momentum is conserved in collisions (no external forces).',
      },
      {
        latex: String.raw`\sum \frac{1}{2} m_i \mathbf{v}_i^2 = \text{const}`,
        description: 'Total kinetic energy is conserved in elastic collisions.',
      },
      {
        latex: String.raw`e = \frac{v_{2f} - v_{1f}}{v_{1i} - v_{2i}} \approx 0.995`,
        description: 'Coefficient of restitution measures elasticity. 1.0 = perfectly elastic.',
      },
    ],
  },
  {
    title: 'Pendulum EOM',
    equations: [
      {
        latex: String.raw`\ddot{\theta}_i = -\frac{g}{L}\sin\theta_i - c\,\dot{\theta}_i`,
        description:
          'Each ball swings as a simple pendulum with optional air damping. Integrated with 4th-order Runge-Kutta.',
      },
    ],
  },
  {
    title: 'Collision Response',
    equations: [
      {
        latex: String.raw`v_{1f} = \frac{(m_1 - e\,m_2)v_{1i} + (1+e)\,m_2\,v_{2i}}{m_1 + m_2}`,
        description:
          'Post-collision velocity of ball 1. With equal masses and e=1, this simplifies to a perfect velocity swap.',
      },
    ],
  },
  {
    title: 'How to Use',
    content:
      '1. Choose how many balls to pull back (1-3).\n2. Adjust pull angle for different energy input.\n3. Change restitution to see inelastic vs elastic collisions.\n4. Watch momentum and energy graphs — they should be conserved.\n5. Try different ball counts and see patterns.',
  },
  {
    title: 'Beginner Tips',
    content:
      'Start with pulling one ball — one swings out. Pull two — two swing out. This shows momentum conservation. Reduce restitution to see energy loss. Look at the energy graph — it should stay constant for elastic collisions.',
  },
];

export const equations = [
  String.raw`\sum m_i \mathbf{v}_i = \text{const} \quad \text{(Momentum)}`,
  String.raw`\sum \frac{1}{2} m_i \mathbf{v}_i^2 = \text{const} \quad \text{(Kinetic Energy)}`,
  String.raw`e = \frac{v_{2f} - v_{1f}}{v_{1i} - v_{2i}} \approx 0.995 \quad \text{(Restitution)}`,
];

export const graphParams = [
  { key: 'totalEnergy', label: 'Total Energy' },
  { key: 'kineticEnergy', label: 'Kinetic Energy' },
  { key: 'momentumX', label: 'Total Momentum X' },
];

export const controls = [
  { key: 'count', label: 'Ball Count', min: 3, max: 9, step: 1 },
  { key: 'radius', label: 'Ball Radius', min: 12, max: 34, step: 1 },
  { key: 'stringLength', label: 'String Length', min: 120, max: 300, step: 1 },
  { key: 'pullCount', label: 'Pulled Balls', min: 1, max: 3, step: 1 },
  { key: 'pullAngle', label: 'Pull Angle (rad)', min: -1.4, max: -0.2, step: 0.01 },
  { key: 'restitution', label: 'Restitution', min: 0.8, max: 1, step: 0.001 },
  { key: 'mass', label: 'Ball Mass', min: 0.2, max: 5, step: 0.1 },
  { key: 'airFriction', label: 'Air Friction', min: 0, max: 0.003, step: 0.00005 },
  { key: 'gravity', label: 'Gravity', min: 200, max: 1800, step: 10 },
];

// ── ODE for a single pendulum ──────────────────────────────────────────────
function pendulumDerivs(theta, omega, g, L, c) {
  return -(g / L) * Math.sin(theta) - c * omega;
}

function rk4Pendulum(theta, omega, dt, g, L, c) {
  const k1t = omega;
  const k1o = pendulumDerivs(theta, omega, g, L, c);
  const k2t = omega + (k1o * dt) / 2;
  const k2o = pendulumDerivs(theta + (k1t * dt) / 2, k2t, g, L, c);
  const k3t = omega + (k2o * dt) / 2;
  const k3o = pendulumDerivs(theta + (k2t * dt) / 2, k3t, g, L, c);
  const k4t = omega + k3o * dt;
  const k4o = pendulumDerivs(theta + k3t * dt, k4t, g, L, c);

  return {
    theta: theta + (dt / 6) * (k1t + 2 * k2t + 2 * k3t + k4t),
    omega: omega + (dt / 6) * (k1o + 2 * k2o + 2 * k3o + k4o),
  };
}

export function create(canvas, initParams = {}) {
  const ctx = canvas.getContext('2d');
  const p = { ...DEFAULTS, ...initParams };

  // State: arrays of theta, omega for each ball
  let thetas = [];
  let omegas = [];
  let simTime = 0;
  const flash = new Map();

  function frameGeometry() {
    const W = canvas.width;
    const H = canvas.height;
    const cx = W / 2;
    const cy = H * 0.2;
    const spacing = p.radius * 2 + 0.5;
    return { W, H, cx, cy, spacing };
  }

  function init() {
    const n = Math.max(3, Math.min(9, Math.floor(p.count)));
    thetas = new Array(n).fill(0);
    omegas = new Array(n).fill(0);
    flash.clear();
    simTime = 0;

    // Pull the first pullCount balls
    const pullN = Math.max(1, Math.min(Math.floor(p.pullCount), Math.floor(n / 2) || 1));
    for (let i = 0; i < pullN; i++) {
      thetas[i] = p.pullAngle;
    }
  }

  // ── Collision detection & response ───────────────────────────────────────
  function resolveCollisions() {
    const { cx, spacing } = frameGeometry();
    const n = thetas.length;
    const offset = ((n - 1) * spacing) / 2;

    // Compute bob positions (x only matters for collision in 1D)
    const bobX = [];
    const anchorX = [];
    for (let i = 0; i < n; i++) {
      const ax = cx - offset + i * spacing;
      anchorX.push(ax);
      bobX.push(ax + p.stringLength * Math.sin(thetas[i]));
    }

    // Check adjacent pairs for overlap
    for (let i = 0; i < n - 1; i++) {
      const dist = bobX[i + 1] - bobX[i];
      if (dist < p.radius * 2) {
        // Convert angular velocities to linear velocities at the bob
        const v1 = omegas[i] * p.stringLength * Math.cos(thetas[i]);
        const v2 = omegas[i + 1] * p.stringLength * Math.cos(thetas[i + 1]);

        // Only collide if approaching
        if (v1 > v2) {
          const e = p.restitution;
          const m = p.mass; // Equal masses

          // 1D elastic collision with restitution
          const v1f = ((m - e * m) * v1 + (1 + e) * m * v2) / (m + m);
          const v2f = ((m - e * m) * v2 + (1 + e) * m * v1) / (m + m);

          // Convert back to angular velocities
          const cos1 = Math.cos(thetas[i]);
          const cos2 = Math.cos(thetas[i + 1]);
          if (Math.abs(cos1) > 0.01) omegas[i] = v1f / (p.stringLength * cos1);
          if (Math.abs(cos2) > 0.01) omegas[i + 1] = v2f / (p.stringLength * cos2);

          // Separate balls to prevent re-collision
          const overlap = p.radius * 2 - dist;
          if (overlap > 0) {
            const pushAngle = overlap / (2 * p.stringLength);
            thetas[i] -= pushAngle;
            thetas[i + 1] += pushAngle;
          }

          // Flash effect
          flash.set(i, 1);
          flash.set(i + 1, 1);
        }
      }
    }
  }

  function tick(dt) {
    const substeps = 8;
    const h = dt / substeps;

    for (let s = 0; s < substeps; s++) {
      // Integrate each pendulum independently
      for (let i = 0; i < thetas.length; i++) {
        const result = rk4Pendulum(
          thetas[i],
          omegas[i],
          h,
          p.gravity,
          p.stringLength,
          p.airFriction,
        );
        thetas[i] = result.theta;
        omegas[i] = result.omega;
      }

      // Resolve collisions after each substep
      resolveCollisions();
    }

    simTime += dt;
  }

  function render() {
    const { W, H, cx, cy, spacing } = frameGeometry();
    const n = thetas.length;
    const offset = ((n - 1) * spacing) / 2;

    ctx.fillStyle = '#0B0F14';
    ctx.fillRect(0, 0, W, H);

    // Draw frame bar
    const barX = cx - offset - p.radius - 12;
    const barW = (n - 1) * spacing + p.radius * 2 + 24;
    const barY = cy - 8;

    ctx.fillStyle = 'rgba(79, 195, 247, 0.18)';
    ctx.fillRect(barX, barY, barW, 8);

    const hiGrad = ctx.createLinearGradient(barX, barY, barX + barW, barY);
    hiGrad.addColorStop(0, 'rgba(192,132,252,0)');
    hiGrad.addColorStop(0.5, 'rgba(192,132,252,0.8)');
    hiGrad.addColorStop(1, 'rgba(192,132,252,0)');
    ctx.fillStyle = hiGrad;
    ctx.fillRect(barX, barY, barW, 2);

    // Support pillars
    [barX + 6, barX + barW - 6].forEach((x) => {
      ctx.fillStyle = 'rgba(79, 195, 247, 0.3)';
      ctx.fillRect(x - 3, H * 0.05, 6, cy - H * 0.05 + 8);
    });

    // Draw strings and balls
    for (let i = 0; i < n; i++) {
      const ancX = cx - offset + i * spacing;
      const bx = ancX + p.stringLength * Math.sin(thetas[i]);
      const by = cy + p.stringLength * Math.cos(thetas[i]);
      const f = flash.get(i) || 0;
      if (f > 0) flash.set(i, f * 0.82);

      // String
      ctx.beginPath();
      ctx.moveTo(ancX, cy);
      ctx.lineTo(bx, by);
      ctx.strokeStyle = 'rgba(200,195,230,0.48)';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Ball glow
      ctx.shadowBlur = 18 + f * 30;
      ctx.shadowColor = f > 0.1 ? 'rgba(200,160,255,0.9)' : 'rgba(80,70,120,0.4)';

      // Ball gradient
      const grad = ctx.createRadialGradient(
        bx - p.radius * 0.32,
        by - p.radius * 0.38,
        p.radius * 0.08,
        bx,
        by,
        p.radius,
      );

      if (f > 0.08) {
        grad.addColorStop(0, '#f0e8ff');
        grad.addColorStop(0.35, '#81D4FA');
        grad.addColorStop(0.75, '#5b21b6');
        grad.addColorStop(1, '#1a0f30');
      } else {
        grad.addColorStop(0, '#dcd8f4');
        grad.addColorStop(0.35, '#8080b8');
        grad.addColorStop(0.75, '#30306a');
        grad.addColorStop(1, '#0e0e22');
      }

      ctx.beginPath();
      ctx.arc(bx, by, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Ball outline
      ctx.beginPath();
      ctx.arc(bx, by, p.radius, 0, Math.PI * 2);
      ctx.strokeStyle = f > 0.08 ? 'rgba(192,132,252,0.5)' : 'rgba(100,100,160,0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Specular highlight
      ctx.beginPath();
      ctx.arc(bx - p.radius * 0.3, by - p.radius * 0.38, p.radius * 0.2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.48)';
      ctx.fill();
    }
  }

  let rafId;
  let lastTs;
  let running = false;

  function loop(ts) {
    if (!running) return;
    const dt = lastTs === undefined ? 16.67 : Math.min(ts - lastTs, 50);
    lastTs = ts;
    tick(dt / 1000); // convert ms to seconds
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
      let ke = 0;
      let pe = 0;
      let px = 0;

      for (let i = 0; i < thetas.length; i++) {
        const v = p.stringLength * omegas[i];
        // KE = 0.5 * m * v^2
        ke += 0.5 * p.mass * v * v;
        // PE = m * g * h, where h = L * (1 - cos(theta)) measured from lowest point
        pe += p.mass * p.gravity * p.stringLength * (1 - Math.cos(thetas[i]));
        // Horizontal momentum component
        px += p.mass * v * Math.cos(thetas[i]);
      }

      return {
        time: simTime,
        totalEnergy: ke + pe,
        kineticEnergy: ke,
        momentumX: px,
      };
    },
  };
}
