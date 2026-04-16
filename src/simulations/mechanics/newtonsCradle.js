import Matter from 'matter-js';

const DEFAULTS = {
  count: 5,
  radius: 22,
  stringLength: 210,
  pullCount: 1,
  pullAngle: -Math.PI / 3.3,
  restitution: 0.995,
  density: 0.006,
  airFriction: 0.00015,
  stringStiffness: 0.995,
  gravityScale: 0.0012,
};

export const defaultParams = {
  count: 5,
  radius: 22,
  stringLength: 210,
  pullCount: 1,
  pullAngle: -0.952,
  restitution: 0.995,
  density: 0.006,
  airFriction: 0.00015,
  stringStiffness: 0.995,
  gravityScale: 0.0012,
};

export const equations = [
  String.raw`\sum m_i \mathbf{v}_i = \text{const} \quad \text{(Momentum)}`,
  String.raw`\sum \frac{1}{2} m_i \mathbf{v}_i^2 = \text{const} \quad \text{(Kinetic Energy)}`,
  String.raw`e = \frac{v_{2f} - v_{1f}}{v_{1i} - v_{2i}} \approx 0.995 \quad \text{(Restitution)}`
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
  { key: 'restitution', label: 'Restitution', min: 0.9, max: 1, step: 0.001 },
  { key: 'density', label: 'Density', min: 0.002, max: 0.02, step: 0.0005 },
  { key: 'airFriction', label: 'Air Friction', min: 0, max: 0.003, step: 0.00005 },
  { key: 'stringStiffness', label: 'String Stiffness', min: 0.9, max: 1, step: 0.001 },
  { key: 'gravityScale', label: 'Gravity Scale', min: 0.0006, max: 0.0022, step: 0.00005 },
];

export function create(canvas, initParams = {}) {
  const ctx = canvas.getContext('2d');
  const p = { ...DEFAULTS, ...initParams };

  const engine = Matter.Engine.create({
    gravity: { x: 0, y: 1, scale: p.gravityScale },
    constraintIterations: 22,
    positionIterations: 16,
    velocityIterations: 14,
  });

  let balls = [];
  let constraints = [];
  const flash = new Map();

  function frameGeometry() {
    const W = canvas.width;
    const H = canvas.height;
    const cx = W / 2;
    const cy = H * 0.2;
    const spacing = p.radius * 2 + 0.5;
    return { W, H, cx, cy, spacing };
  }

  function configureBall(ball, idx) {
    ball.label = `ball_${idx}`;
    ball.restitution = p.restitution;
    ball.friction = 0;
    ball.frictionStatic = 0;
    ball.frictionAir = p.airFriction;
    ball.slop = 0;
    Matter.Body.setDensity(ball, p.density);
  }

  function init() {
    Matter.Composite.clear(engine.world, false);
    balls = [];
    constraints = [];
    flash.clear();

    engine.gravity.scale = p.gravityScale;

    const { cx, cy, spacing } = frameGeometry();
    const offset = ((p.count - 1) * spacing) / 2;

    for (let i = 0; i < p.count; i++) {
      const restX = cx - offset + i * spacing;
      const restY = cy + p.stringLength;

      const ball = Matter.Bodies.circle(restX, restY, p.radius, {});
      configureBall(ball, i);
      balls.push(ball);

      const c = Matter.Constraint.create({
        pointA: { x: restX, y: cy },
        bodyB: ball,
        stiffness: p.stringStiffness,
        damping: 0,
        length: p.stringLength,
      });
      constraints.push(c);
    }

    const pullN = Math.max(1, Math.min(Math.floor(p.pullCount), Math.floor(p.count / 2) || 1));
    for (let i = 0; i < pullN; i++) {
      const b = balls[i];
      const anchorX = constraints[i].pointA.x;
      Matter.Body.setPosition(b, {
        x: anchorX + p.stringLength * Math.sin(p.pullAngle),
        y: cy + p.stringLength * Math.cos(p.pullAngle),
      });
      Matter.Body.setVelocity(b, { x: 0, y: 0 });
      Matter.Body.setAngularVelocity(b, 0);
    }

    Matter.Composite.add(engine.world, [...balls, ...constraints]);
  }

  Matter.Events.on(engine, 'collisionStart', (evt) => {
    for (const pair of evt.pairs) {
      flash.set(pair.bodyA.id, 1);
      flash.set(pair.bodyB.id, 1);
    }
  });

  function render() {
    const { W, H, cx, cy, spacing } = frameGeometry();

    ctx.fillStyle = '#0B0F14';
    ctx.fillRect(0, 0, W, H);

    const barX = cx - ((p.count - 1) / 2) * spacing - p.radius - 12;
    const barW = (p.count - 1) * spacing + p.radius * 2 + 24;
    const barY = cy - 8;

    ctx.fillStyle = 'rgba(79, 195, 247,0.18)';
    ctx.fillRect(barX, barY, barW, 8);

    const hiGrad = ctx.createLinearGradient(barX, barY, barX + barW, barY);
    hiGrad.addColorStop(0, 'rgba(192,132,252,0)');
    hiGrad.addColorStop(0.5, 'rgba(192,132,252,0.8)');
    hiGrad.addColorStop(1, 'rgba(192,132,252,0)');
    ctx.fillStyle = hiGrad;
    ctx.fillRect(barX, barY, barW, 2);

    [barX + 6, barX + barW - 6].forEach((x) => {
      ctx.fillStyle = 'rgba(79, 195, 247,0.3)';
      ctx.fillRect(x - 3, H * 0.05, 6, cy - H * 0.05 + 8);
    });

    for (const c of constraints) {
      const pA = c.pointA;
      const pB = Matter.Vector.add(c.bodyB.position, c.pointB);
      ctx.beginPath();
      ctx.moveTo(pA.x, pA.y);
      ctx.lineTo(pB.x, pB.y);
      ctx.strokeStyle = 'rgba(200,195,230,0.48)';
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }

    for (const ball of balls) {
      const { x, y } = ball.position;
      const f = flash.get(ball.id) || 0;
      if (f > 0) flash.set(ball.id, f * 0.82);

      ctx.shadowBlur = 18 + f * 30;
      ctx.shadowColor = f > 0.1 ? 'rgba(200,160,255,0.9)' : 'rgba(80,70,120,0.4)';

      const grad = ctx.createRadialGradient(
        x - p.radius * 0.32,
        y - p.radius * 0.38,
        p.radius * 0.08,
        x,
        y,
        p.radius
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
      ctx.arc(x, y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.beginPath();
      ctx.arc(x, y, p.radius, 0, Math.PI * 2);
      ctx.strokeStyle = f > 0.08 ? 'rgba(192,132,252,0.5)' : 'rgba(100,100,160,0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(x - p.radius * 0.3, y - p.radius * 0.38, p.radius * 0.2, 0, Math.PI * 2);
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
    const steps = 6;
    for (let i = 0; i < steps; i++) {
      Matter.Engine.update(engine, dt / steps);
    }
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
    setParams(next) { Object.assign(p, next); render(); },
    destroy() {
      this.stop();
      Matter.Composite.clear(engine.world, false);
      Matter.Engine.clear(engine);
    },
    getData() {
      let ke = 0;
      let pe = 0;
      let px = 0;
      for (const b of balls) {
        ke += 0.5 * b.mass * (b.velocity.x**2 + b.velocity.y**2);
        pe += b.mass * engine.gravity.scale * (engine.gravity.y * (1000 - b.position.y));
        px += b.mass * b.velocity.x;
      }
      return {
        time: engine.timing.timestamp / 1000,
        totalEnergy: ke + pe,
        kineticEnergy: ke,
        momentumX: px
      };
    }
  };
}
