import Matter from 'matter-js';

const { Engine, Bodies, Body, Composite, Constraint } = Matter;

let engine = null;
let animFrame = null;

export function createEngine() {
  if (!engine) {
    engine = Engine.create({
      gravity: { x: 0, y: 1 },
      positionIterations: 20,
      velocityIterations: 16,
      constraintIterations: 30,
    });
  }
  return engine;
}

export function getEngine() {
  return engine;
}

export function setGravity(x, y) {
  if (engine) {
    engine.gravity.x = x;
    engine.gravity.y = y;
  }
}

export function startEngine(onTick, getIsRunning) {
  if (!engine) return;
  const tick = () => {
    if (getIsRunning && getIsRunning()) {
      // Step oscillators
      engine.world.constraints.forEach((c) => {
        if (c.label === 'oscillator' && c.plugin) {
          c.plugin.time += 1;
          c.length =
            c.plugin.baseLength + Math.sin(c.plugin.time * c.plugin.speed) * c.plugin.amplitude;
        }
      });

      // Substepping: 6 steps for stability with springs+strings
      const dt = 1000 / 60;
      const substeps = 6;
      for (let i = 0; i < substeps; i++) {
        Engine.update(engine, dt / substeps);
      }
    }
    if (onTick) onTick();
    animFrame = requestAnimationFrame(tick);
  };
  animFrame = requestAnimationFrame(tick);
}

export function stopEngine() {
  if (animFrame) {
    cancelAnimationFrame(animFrame);
    animFrame = null;
  }
}

export function resetEngine() {
  if (engine) {
    Matter.World.clear(engine.world, false);
    Engine.clear(engine);
  }
  return engine || createEngine();
}

export function createCircle(x, y, radius, opts = {}) {
  return Bodies.circle(x, y, radius, {
    restitution: opts.restitution ?? 0.6,
    friction: opts.friction ?? 0.1,
    frictionAir: opts.frictionAir ?? 0.01,
    density: opts.density ?? 0.001,
    isStatic: opts.isStatic ?? false,
    label: 'circle',
  });
}

export function createBox(x, y, w, h, opts = {}) {
  return Bodies.rectangle(x, y, w, h, {
    restitution: opts.restitution ?? 0.3,
    friction: opts.friction ?? 0.3,
    frictionAir: opts.frictionAir ?? 0.01,
    density: opts.density ?? 0.001,
    isStatic: opts.isStatic ?? false,
    angle: opts.angle ?? 0,
    label: 'box',
  });
}

export function createWall(x, y, w, h, angle = 0) {
  return Bodies.rectangle(x, y, w, h, {
    isStatic: true,
    friction: 0.5,
    restitution: 0.3,
    angle,
    label: 'wall',
  });
}

export function createWedge(x, y, w, h, opts = {}) {
  const verts = [
    { x: 0, y: 0 },
    { x: w, y: h },
    { x: 0, y: h },
  ];
  return Bodies.fromVertices(
    x,
    y,
    [verts],
    {
      restitution: opts.restitution ?? 0.3,
      friction: opts.friction ?? 0.3,
      frictionAir: opts.frictionAir ?? 0.01,
      density: opts.density ?? 0.001,
      isStatic: opts.isStatic ?? false,
      angle: opts.angle ?? 0,
      label: 'wedge',
    },
    true,
  );
}

export function createPulley(x, y, radius, opts = {}) {
  return Bodies.circle(x, y, radius, {
    restitution: opts.restitution ?? 0.1,
    friction: opts.friction ?? 0.05,
    isStatic: true,
    label: 'pulley',
  });
}

/**
 * Create a spring constraint between two bodies (or body + world point).
 * Properly computes rest length from current positions.
 */
export function createSpring(bodyA, bodyB, opts = {}) {
  const pA = opts.pointA ?? { x: 0, y: 0 };
  const pB = opts.pointB ?? { x: 0, y: 0 };

  // Compute the actual world positions of attachment points
  let worldA, worldB;
  if (bodyA) {
    worldA = { x: bodyA.position.x + pA.x, y: bodyA.position.y + pA.y };
  } else {
    worldA = pA;
  }
  if (bodyB) {
    worldB = { x: bodyB.position.x + pB.x, y: bodyB.position.y + pB.y };
  } else {
    worldB = pB;
  }

  const dx = worldB.x - worldA.x;
  const dy = worldB.y - worldA.y;
  const naturalLength = opts.length ?? Math.sqrt(dx * dx + dy * dy);

  const config = {
    stiffness: opts.stiffness ?? 0.05,
    damping: opts.damping ?? 0.01,
    length: naturalLength,
    label: 'spring',
  };

  if (bodyA) {
    config.bodyA = bodyA;
    config.pointA = pA;
  } else {
    config.pointA = pA;
  }

  if (bodyB) {
    config.bodyB = bodyB;
    config.pointB = pB;
  } else {
    config.pointB = pB;
  }

  return Constraint.create(config);
}

/**
 * Create a string (rope) constraint — high stiffness, acts like an inextensible rope.
 * Properly computes rest length from current positions.
 */
export function createString(bodyA, bodyB, opts = {}) {
  const pA = opts.pointA ?? { x: 0, y: 0 };
  const pB = opts.pointB ?? { x: 0, y: 0 };

  let worldA, worldB;
  if (bodyA) {
    worldA = { x: bodyA.position.x + pA.x, y: bodyA.position.y + pA.y };
  } else {
    worldA = pA;
  }
  if (bodyB) {
    worldB = { x: bodyB.position.x + pB.x, y: bodyB.position.y + pB.y };
  } else {
    worldB = pB;
  }

  const dx = worldB.x - worldA.x;
  const dy = worldB.y - worldA.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const naturalLength = opts.length ?? dist;

  const config = {
    stiffness: 1, // Perfectly stiff rod for taut behavior
    damping: opts.damping ?? 0,
    length: naturalLength,
    label: 'string',
  };

  if (bodyA) {
    config.bodyA = bodyA;
    config.pointA = pA;
  } else {
    config.pointA = pA;
  }

  if (bodyB) {
    config.bodyB = bodyB;
    config.pointB = pB;
  } else {
    config.pointB = pB;
  }

  return Constraint.create(config);
}

export function createBeam(x, y, w, h, opts = {}) {
  return Bodies.rectangle(x, y, w, h, {
    restitution: opts.restitution ?? 0.1,
    friction: opts.friction ?? 0.6,
    frictionAir: opts.frictionAir ?? 0.015,
    density: opts.density ?? 0.008, // 8x denser than normal box
    isStatic: opts.isStatic ?? false,
    angle: opts.angle ?? 0,
    label: 'beam',
  });
}

export function createWoodBlock(x, y, w, h, opts = {}) {
  return Bodies.rectangle(x, y, w, h, {
    restitution: opts.restitution ?? 0.4,
    friction: opts.friction ?? 0.4,
    frictionAir: opts.frictionAir ?? 0.01,
    density: opts.density ?? 0.0006, // Lighter wood
    isStatic: opts.isStatic ?? false,
    angle: opts.angle ?? 0,
    label: 'wood',
  });
}

export function createPivot(bodyA, bodyB, opts = {}) {
  const pA = opts.pointA ?? { x: 0, y: 0 };
  const pB = opts.pointB ?? { x: 0, y: 0 };

  return Constraint.create({
    bodyA: bodyA || null,
    pointA: pA,
    bodyB: bodyB || null,
    pointB: pB,
    length: 0,
    stiffness: 1,
    damping: 0, // Pivot handles rotate, no stretch.
    label: 'pivot',
  });
}

export function addToWorld(...items) {
  if (!engine) return;
  Composite.add(engine.world, items);
}

export function removeFromWorld(...items) {
  if (!engine) return;
  Composite.remove(engine.world, items);
}

export function applyBodyProps(body, props) {
  if (!body) return;
  if (props.isStatic !== undefined) Body.setStatic(body, props.isStatic);
  if (props.restitution !== undefined) body.restitution = props.restitution;
  if (props.friction !== undefined) body.friction = props.friction;
  if (props.frictionStatic !== undefined) body.frictionStatic = props.frictionStatic;
  if (props.frictionAir !== undefined) body.frictionAir = props.frictionAir;
  if (props.density !== undefined) Body.setDensity(body, Math.max(0.00001, props.density));
  if (props.angle !== undefined) Body.setAngle(body, (props.angle * Math.PI) / 180);
  if (props.velocityX !== undefined || props.velocityY !== undefined) {
    Body.setVelocity(body, {
      x: props.velocityX ?? body.velocity.x,
      y: props.velocityY ?? body.velocity.y,
    });
  }
  if (props.angularVelocity !== undefined) {
    Body.setAngularVelocity(body, props.angularVelocity);
  }
}

export function applyConstraintProps(constraint, props) {
  if (!constraint) return;
  if (props.stiffness !== undefined) constraint.stiffness = props.stiffness;
  if (props.damping !== undefined) constraint.damping = props.damping;
  if (props.length !== undefined) constraint.length = Math.max(1, props.length);
}

export function createOscillator(bodyA, bodyB, opts = {}) {
  const pA = opts.pointA ?? { x: 0, y: 0 };
  const pB = opts.pointB ?? { x: 0, y: 0 };

  let worldA, worldB;
  if (bodyA) worldA = { x: bodyA.position.x + pA.x, y: bodyA.position.y + pA.y };
  else worldA = pA;
  if (bodyB) worldB = { x: bodyB.position.x + pB.x, y: bodyB.position.y + pB.y };
  else worldB = pB;

  const dx = worldB.x - worldA.x;
  const dy = worldB.y - worldA.y;
  const dist = opts.length ?? Math.sqrt(dx * dx + dy * dy);

  return Constraint.create({
    bodyA: bodyA || null,
    pointA: pA,
    bodyB: bodyB || null,
    pointB: pB,
    length: dist,
    stiffness: 1, // stiff to push/pull
    damping: 0.1,
    label: 'oscillator',
    plugin: {
      baseLength: dist,
      amplitude: 50,
      speed: 0.05,
      time: 0,
    },
  });
}

// ------ Prebuilt Complex Systems ------

export function spawnCar(x, y) {
  const group = Body.nextGroup(true);

  const chassis = Bodies.rectangle(x, y - 20, 160, 40, {
    collisionFilter: { group },
    density: 0.005,
    friction: 0.2,
    restitution: 0.1,
    label: 'beam',
  });

  const wheelA = Bodies.circle(x - 60, y + 20, 25, {
    collisionFilter: { group },
    density: 0.008,
    friction: 0.9,
    restitution: 0.1,
    label: 'circle',
  });
  const wheelB = Bodies.circle(x + 60, y + 20, 25, {
    collisionFilter: { group },
    density: 0.008,
    friction: 0.9,
    restitution: 0.1,
    label: 'circle',
  });

  const ax1 = Constraint.create({
    bodyA: chassis,
    pointA: { x: -60, y: 10 },
    bodyB: wheelA,
    pointB: { x: 0, y: 0 },
    stiffness: 0.2,
    damping: 0.1,
    label: 'spring',
  });
  const ax2 = Constraint.create({
    bodyA: chassis,
    pointA: { x: -40, y: -10 },
    bodyB: wheelA,
    pointB: { x: 0, y: 0 },
    stiffness: 0.2,
    damping: 0.1,
    label: 'spring',
  });

  const bx1 = Constraint.create({
    bodyA: chassis,
    pointA: { x: 60, y: 10 },
    bodyB: wheelB,
    pointB: { x: 0, y: 0 },
    stiffness: 0.2,
    damping: 0.1,
    label: 'spring',
  });
  const bx2 = Constraint.create({
    bodyA: chassis,
    pointA: { x: 40, y: -10 },
    bodyB: wheelB,
    pointB: { x: 0, y: 0 },
    stiffness: 0.2,
    damping: 0.1,
    label: 'spring',
  });

  return { bodies: [chassis, wheelA, wheelB], constraints: [ax1, ax2, bx1, bx2] };
}

export function spawnBridge(x, y) {
  const group = Body.nextGroup(true);
  const bodies = [];
  const constraints = [];

  const plankCount = 10;
  const plankW = 50;
  const plankH = 15;
  const gap = 5;
  const totalW = (plankW + gap) * plankCount;
  const startX = x - totalW / 2;

  const anchorA = Bodies.rectangle(startX - 30, y + 40, 40, 150, { isStatic: true, label: 'beam' });
  const anchorB = Bodies.rectangle(startX + totalW + 30, y + 40, 40, 150, {
    isStatic: true,
    label: 'beam',
  });
  bodies.push(anchorA, anchorB);

  for (let i = 0; i < plankCount; i++) {
    const px = startX + i * (plankW + gap) + plankW / 2;
    // We add some y jitter to ensure it naturally hangs and doesn't get locked horizontally
    const plank = Bodies.rectangle(px, y + i * 0.1, plankW, plankH, {
      collisionFilter: { group },
      density: 0.001,
      label: 'wood',
    });
    bodies.push(plank);
  }

  for (let i = 3; i < plankCount + 2; i++) {
    const prev = bodies[i - 1];
    const curr = bodies[i];
    constraints.push(
      Constraint.create({
        bodyA: prev,
        pointA: { x: plankW / 2, y: 0 },
        bodyB: curr,
        pointB: { x: -plankW / 2, y: 0 },
        length: gap,
        stiffness: 1,
        label: 'pivot',
      }),
    );
  }

  constraints.push(
    Constraint.create({
      bodyA: anchorA,
      pointA: { x: 20, y: -50 },
      bodyB: bodies[2],
      pointB: { x: -plankW / 2, y: 0 },
      length: gap,
      stiffness: 1,
      label: 'pivot',
    }),
  );
  constraints.push(
    Constraint.create({
      bodyA: anchorB,
      pointA: { x: -20, y: -50 },
      bodyB: bodies[bodies.length - 1],
      pointB: { x: plankW / 2, y: 0 },
      length: gap,
      stiffness: 1,
      label: 'pivot',
    }),
  );

  return { bodies, constraints };
}

export function spawnNewtonCradle(x, y) {
  const group = Body.nextGroup(true);
  const bodies = [];
  const constraints = [];

  const ballCount = 5;
  const radius = 25;
  const length = 200;

  const beam = Bodies.rectangle(x, y - length, ballCount * (radius * 2) + 40, 20, {
    isStatic: true,
    label: 'beam',
  });
  bodies.push(beam);

  for (let i = 0; i < ballCount; i++) {
    const bx = x - ballCount * radius + i * radius * 2 + radius;
    const by = y;
    const ball = Bodies.circle(bx, by, radius, {
      collisionFilter: { group },
      restitution: 0.99, // Highly elastic!
      friction: 0,
      frictionAir: 0.00005,
      density: 0.1, // very heavy!
      label: 'circle',
    });
    bodies.push(ball);

    // Lateral stability V constraint
    constraints.push(
      Constraint.create({
        bodyA: beam,
        pointA: { x: bx - x - 5, y: 10 },
        bodyB: ball,
        pointB: { x: 0, y: 0 },
        length: length,
        stiffness: 1,
        label: 'string',
      }),
    );
    constraints.push(
      Constraint.create({
        bodyA: beam,
        pointA: { x: bx - x + 5, y: 10 },
        bodyB: ball,
        pointB: { x: 0, y: 0 },
        length: length,
        stiffness: 1,
        label: 'string',
      }),
    );
  }

  // Nudge first ball out to kickstart it smoothly
  const b1 = bodies[1];
  Body.setPosition(b1, { x: b1.position.x - 120, y: b1.position.y - 120 });

  return { bodies, constraints };
}
