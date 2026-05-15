import { rk4 } from '../../physics/solvers';
import { drawArrow } from '../../utils/canvas';

/**
 * Projectile Motion with Air Drag — Research-Grade Implementation
 *
 * Integrator:  RK4 with adaptive substeps
 * Physics:     Quadratic air drag (b/m)‖v‖v + gravity
 * Visuals:     Terrain, sky gradient, trail, force vectors,
 *              impact effects, analytical comparison, live HUD
 */

const DEFAULTS = {
  mass: 1.0,
  gravity: 9.81,
  launchSpeed: 40,
  launchAngle: 45,
  dragCoeff: 0.01,
};

export const defaultParams = { ...DEFAULTS };

export const equationSections = [
  {
    title: 'Introduction',
    content:
      'Projectile motion is what happens when you throw or launch an object and it moves through the air under gravity. Think of throwing a ball or shooting a cannon. In a vacuum, the path is a perfect parabola, but air resistance makes it more realistic. This simulation lets you launch projectiles with different speeds, angles, and see how drag affects the flight. You can compare to ideal cases and learn about range, height, and energy.',
  },
  {
    title: 'Equations of Motion',
    equations: [
      {
        latex: String.raw`\vec{a} = \vec{g} - \frac{b}{m} \|\vec{v}\| \vec{v}`,
        description:
          'The acceleration has two parts: gravity pulling down, and drag opposing the motion. Drag depends on speed squared, so faster objects feel more drag. This is a vector equation, meaning it works in x and y directions.',
      },
      {
        latex: String.raw`a_x = -\frac{b}{m} v_x \sqrt{v_x^2 + v_y^2}`,
        description:
          'Horizontal acceleration is only from drag - it slows down the forward speed. No gravity in horizontal direction.',
      },
      {
        latex: String.raw`a_y = -g - \frac{b}{m} v_y \sqrt{v_y^2 + v_y^2}`,
        description:
          'Vertical acceleration combines gravity (always down) and drag. When going up, drag helps slow the ascent; when falling, it speeds up the descent.',
      },
    ],
    variables: [
      {
        symbol: 'b/m',
        description: 'Drag coefficient divided by mass - higher means more air resistance',
      },
      { symbol: 'g', description: 'Gravity acceleration (9.81 m/s² on Earth)' },
    ],
  },
  {
    title: 'Ideal Vacuum Path',
    equations: [
      {
        latex: String.raw`y(x) = x \tan \theta - \frac{g x^2}{2 v_0^2 \cos^2 \theta}`,
        description:
          'In vacuum (no air), the height y at horizontal distance x follows this parabolic equation. The launch angle θ and initial speed v₀ determine the shape. This is exact - no approximations.',
      },
    ],
  },
  {
    title: 'Range & Max Height (Vacuum)',
    equations: [
      {
        latex: String.raw`R = \frac{v_0^2 \sin 2\theta}{g}, \quad H = \frac{v_0^2 \sin^2\theta}{2g}`,
        description:
          'Maximum range R occurs at 45° launch angle. Maximum height H is reached at the peak. These formulas assume no air resistance.',
      },
    ],
  },
  {
    title: 'How to Use',
    content:
      '1. Set launch speed and angle - try 45° for maximum range in vacuum.\n2. Adjust drag coefficient - 0 for vacuum, higher values for realistic air.\n3. Change mass - heavier objects are less affected by drag.\n4. Watch the trajectory - compare parabolic (vacuum) vs curved (with drag).\n5. Check graphs for velocity components and energy over time.',
  },
  {
    title: 'Beginner Tips',
    content:
      'Start with no drag to see the perfect parabola. Notice range is maximum at 45°. Add drag and see how the path flattens. Try different angles - low angles go far but low, high angles go high but short distance. Experiment with different gravities, like on Moon (1.62 m/s²). Look at energy - it decreases with drag due to air resistance doing work.',
  },
];

export const equations = [
  String.raw`\vec{a} = \vec{g} - \frac{b}{m} \|\vec{v}\| \vec{v}`,
  String.raw`y_{vac}(x) = x \tan\theta - \frac{g x^2}{2 v_0^2 \cos^2\theta}`,
];

export const graphParams = [
  { key: 'vy', label: 'v_y(t) [m/s]' },
  { key: 'vx', label: 'v_x(t) [m/s]' },
  { key: 'energy', label: 'Mech E [J]' },
];

export const controls = [
  { key: 'launchSpeed', label: 'v₀ [m/s]', min: 5, max: 100, step: 1 },
  { key: 'launchAngle', label: 'Angle [°]', min: 5, max: 85, step: 1 },
  { key: 'mass', label: 'Mass [kg]', min: 0.1, max: 10, step: 0.1 },
  { key: 'gravity', label: 'Gravity [m/s²]', min: 1, max: 20, step: 0.1 },
  { key: 'dragCoeff', label: 'Drag b/m', min: 0, max: 0.1, step: 0.001 },
];

export const method = 'rk4';

export const scenarios = [
  {
    name: 'Vacuum (No Drag)',
    description:
      'Classic 45° parabola. The RK4 trajectory perfectly overlaps the analytical solution.',
    params: { launchSpeed: 40, launchAngle: 45, dragCoeff: 0, gravity: 9.81 },
  },
  {
    name: 'Baseball Throw',
    description:
      'Realistic drag for a thrown baseball — the trajectory deviates significantly from the ideal parabola.',
    params: { launchSpeed: 35, launchAngle: 40, dragCoeff: 0.007, mass: 0.145, gravity: 9.81 },
  },
  {
    name: 'High Drag',
    description:
      'Very strong drag — the projectile barely reaches terminal velocity before landing.',
    params: { launchSpeed: 60, launchAngle: 60, dragCoeff: 0.05, gravity: 9.81 },
  },
  {
    name: 'Lunar Launch',
    description: 'Moon gravity (1.62 m/s²) and no atmosphere — six times the range of Earth.',
    params: { launchSpeed: 40, launchAngle: 45, dragCoeff: 0, gravity: 1.62 },
  },
  {
    name: 'Optimal Angle with Drag',
    description:
      'Launch at 35° with drag — the optimal angle shifts below 45° in the presence of air resistance.',
    params: { launchSpeed: 40, launchAngle: 35, dragCoeff: 0.01, gravity: 9.81 },
  },
];

export const guidedExperiments = [
  {
    title: 'Does Drag Change the Optimal Angle?',
    steps: [
      {
        instruction: 'First, the classic scenario: drag is zero, launch at 45°. Press Play.',
        params: { launchSpeed: 40, launchAngle: 45, dragCoeff: 0, gravity: 9.81 },
        question: 'In a vacuum, what launch angle maximizes range?',
        choices: ['30°', '45°', '60°', 'Depends on speed'],
        correctIndex: 1,
        explanation:
          'In a vacuum, the range formula R = v₀²sin(2θ)/g is maximized when sin(2θ) = 1, i.e. θ = 45°. This is exact — it does not depend on launch speed or gravity.',
      },
      {
        instruction: 'Now turn on drag: set b/m = 0.01. Keep 45°. Fire again.',
        params: { launchSpeed: 40, launchAngle: 45, dragCoeff: 0.01, gravity: 9.81 },
        question: 'With air resistance, does 45° still give maximum range?',
        choices: [
          'Yes, 45° is always optimal',
          'No — the optimal angle shifts lower (~35-40°)',
          'No — it shifts higher (~50-55°)',
        ],
        correctIndex: 1,
        commonMisconception:
          'The 45 degree launch angle is only optimal in a vacuum. Drag breaks the symmetry of the parabola and often favors lower angles.',
        explanation:
          'Air drag decelerates the projectile proportional to v². At high angles, the projectile spends more time at high altitude moving slowly — drag has more time to act. A lower angle keeps the projectile fast and reduces total flight time, yielding better range.',
        tryThis: 'Try 35° and 40° with the same drag — which gives the longest range?',
      },
      {
        instruction: 'Fire at 35° with drag b/m = 0.01.',
        params: { launchSpeed: 40, launchAngle: 35, dragCoeff: 0.01, gravity: 9.81 },
        question: 'Compare this range to the 45° case with drag. Which went further?',
        choices: ['45° still won', '35° went about the same', '35° went further'],
        correctIndex: 2,
        explanation:
          'The optimal angle with quadratic drag is approximately 35–40° depending on the drag coefficient. Real artillery and sports science use this: a cricket ball optimal angle is ~39°, not 45°.',
      },
    ],
  },
];

export function create(canvas, initParams = {}) {
  const ctx = canvas.getContext('2d');
  const p = { ...DEFAULTS, ...initParams };

  let x, y, vx, vy, simTime, stepCount;
  let trail; // [{x, y, vx, vy, t}]
  let E0;
  let landed; // boolean — projectile hit ground
  let landX; // landing position
  let maxHeight;
  let impactFrame; // frames since impact for animation

  // Interaction State
  let currentLaunchX = 0;
  let currentLaunchY = 0;
  let currentTipX = 0;
  let currentTipY = 0;
  let isDraggingVector = false;

  function energy() {
    return 0.5 * p.mass * (vx * vx + vy * vy) + p.mass * p.gravity * y;
  }

  function initState() {
    x = 0;
    y = 0;
    const rad = (p.launchAngle * Math.PI) / 180;
    vx = p.launchSpeed * Math.cos(rad);
    vy = p.launchSpeed * Math.sin(rad);
    simTime = 0;
    stepCount = 0;
    trail = [];
    E0 = energy();
    landed = false;
    landX = 0;
    maxHeight = 0;
    impactFrame = 0;
    trail.push({ x, y, vx, vy, t: 0 });
  }

  // State derivatives: [dx, dy, dvx, dvy]
  function derivs(state, p) {
    const [, , cvx, cvy] = state;
    const speed = Math.sqrt(cvx * cvx + cvy * cvy);
    const ax = -p.dragCoeff * speed * cvx;
    const ay = -p.gravity - p.dragCoeff * speed * cvy;
    return [cvx, cvy, ax, ay];
  }

  function tick(dt) {
    if (landed) {
      impactFrame++;
      return;
    }

    const steps = 16;
    const h = dt / steps;

    for (let i = 0; i < steps; i++) {
      if (landed) break;

      const s0 = [x, y, vx, vy];
      const nextState = rk4(s0, h, derivs, p);
      const [newX, newY, newVx, newVy] = nextState;

      // Check ground intersection (linear interpolation for exact landing)
      if (newY < 0 && simTime > 0.01) {
        const frac = y / (y - newY);
        x = x + (newX - x) * frac;
        y = 0;
        vx = newVx;
        vy = newVy;
        simTime += h * frac;
        landed = true;
        landX = x;
        trail.push({ x, y: 0, vx, vy, t: simTime });
        break;
      }

      x = newX;
      y = newY;
      vx = newVx;
      vy = newVy;
      simTime += h;
      stepCount++;

      if (y > maxHeight) maxHeight = y;
    }

    if (!landed) {
      trail.push({ x, y, vx, vy, t: simTime });
    }
  }

  // Analytical parabola (vacuum)
  function getIdealTrajectory(xMax) {
    const rad = (p.launchAngle * Math.PI) / 180;
    const v0cos = p.launchSpeed * Math.cos(rad);
    if (Math.abs(v0cos) < 0.001) return [];
    const pts = [];
    const steps = 120;
    for (let i = 0; i <= steps; i++) {
      const cx = (xMax * i) / steps;
      const ty = cx * Math.tan(rad) - (p.gravity * cx * cx) / (2 * v0cos * v0cos);
      if (ty < 0 && cx > 0) {
        pts.push({ x: cx, y: 0 });
        break;
      }
      pts.push({ x: cx, y: ty });
    }
    return pts;
  }

  function render() {
    const W = canvas.width,
      H = canvas.height;

    // Professional clean background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);

    // Coordinate mapping (8% margin)
    const ox = W * 0.08;
    const oy = H * 0.82;

    const rad = (p.launchAngle * Math.PI) / 180;
    const rangeIdeal = ((p.launchSpeed * p.launchSpeed) / p.gravity) * Math.sin(2 * rad);
    const hMaxIdeal =
      (p.launchSpeed * p.launchSpeed * Math.sin(rad) * Math.sin(rad)) / (2 * p.gravity);

    const targetW = Math.max(rangeIdeal * 1.25, 20);
    const targetH = Math.max(hMaxIdeal * 1.3, 10);

    const scaleX = (W * 0.82) / targetW;
    const scaleY = (H * 0.65) / targetH;
    const scale = Math.min(scaleX, scaleY) * (p.viewScale ?? 1.0);

    const sx = (wx) => ox + wx * scale;
    const sy = (wy) => oy - wy * scale;

    // --- Ground ---
    ctx.beginPath();
    ctx.moveTo(0, oy);
    ctx.lineTo(W, oy);
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.stroke();

    // --- Grid lines ---
    ctx.font = '10px "Inter", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    // Horizontal axis (Range)
    const xGridStep = niceStep(targetW, 6);
    for (let gv = 0; gv < targetW * 1.2; gv += xGridStep) {
      const gx = sx(gv);
      if (gx > W - 10) break;
      ctx.beginPath();
      ctx.moveTo(gx, oy);
      ctx.lineTo(gx, oy + 5);
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = '#475569';
      ctx.fillText(`${gv.toFixed(0)}`, gx, oy + 8);
    }

    // Vertical axis (Height)
    const yGridStep = niceStep(targetH, 5);
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let gh = 0; gh < targetH * 1.2; gh += yGridStep) {
      const gy = sy(gh);
      if (gy < 10) break;
      ctx.beginPath();
      ctx.moveTo(ox - 5, gy);
      ctx.lineTo(ox, gy);
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = '#475569';
      ctx.fillText(`${gh.toFixed(0)}`, ox - 8, gy);
    }

    // --- Ideal Trajectory (Reference) ---
    const idealPts = getIdealTrajectory(rangeIdeal * 1.15 + 10);
    if (idealPts.length > 1) {
      ctx.beginPath();
      ctx.moveTo(sx(idealPts[0].x), sy(idealPts[0].y));
      for (const pt of idealPts) ctx.lineTo(sx(pt.x), sy(pt.y));
      ctx.strokeStyle = 'rgba(71, 85, 105, 0.2)';
      ctx.setLineDash([5, 5]);
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // --- Actual Trajectory ---
    if (trail.length > 1) {
      ctx.beginPath();
      ctx.moveTo(sx(trail[0].x), sy(trail[0].y));
      for (let i = 1; i < trail.length; i++) {
        ctx.lineTo(sx(trail[i].x), sy(trail[i].y));
      }
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }

    // --- Interaction Handles ---
    const launchX = sx(0);
    const launchY = sy(0);
    currentLaunchX = launchX;
    currentLaunchY = launchY;

    const dirLen = Math.max(20, p.launchSpeed * 1.5);
    const tipX = launchX + dirLen * Math.cos(rad);
    const tipY = launchY - dirLen * Math.sin(rad);
    currentTipX = tipX;
    currentTipY = tipY;

    // Vector direction
    ctx.beginPath();
    ctx.moveTo(launchX, launchY);
    ctx.lineTo(tipX, tipY);
    ctx.strokeStyle = isDraggingVector ? '#3b82f6' : '#94a3b8';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Handle
    ctx.beginPath();
    ctx.arc(tipX, tipY, 6, 0, Math.PI * 2);
    ctx.fillStyle = isDraggingVector ? '#3b82f6' : '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.stroke();

    // --- Projectile ---
    if (!landed) {
      const px = sx(x);
      const py = sy(y);
      ctx.beginPath();
      ctx.arc(px, py, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#1e293b';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // --- Landing Mark ---
    if (landed) {
      const landPx = sx(landX);
      ctx.beginPath();
      ctx.arc(landPx, oy, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#ef4444';
      ctx.fill();
    }

    // --- HUD ---
    const hudX = W - 180;
    const hudY = 20;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillRect(hudX, hudY, 160, 100);
    ctx.strokeStyle = '#e2e8f0';
    ctx.strokeRect(hudX, hudY, 160, 100);

    ctx.fillStyle = '#475569';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('FLIGHT DATA', hudX + 10, hudY + 20);

    ctx.font = '11px sans-serif';
    ctx.fillText(`Time: ${simTime.toFixed(2)}s`, hudX + 10, hudY + 40);
    ctx.fillText(`Range: ${x.toFixed(1)}m`, hudX + 10, hudY + 55);
    ctx.fillText(`Height: ${y.toFixed(1)}m`, hudX + 10, hudY + 70);
    ctx.fillText(`Speed: ${Math.hypot(vx, vy).toFixed(1)}m/s`, hudX + 10, hudY + 85);
  }

  // --- Utility: draw arrow with arrowhead ---

  // --- Utility: compute nice grid step ---
  function niceStep(range, targetSteps) {
    const rough = range / targetSteps;
    const mag = Math.pow(10, Math.floor(Math.log10(rough)));
    const residual = rough / mag;
    if (residual <= 1.5) return mag;
    if (residual <= 3.5) return 2 * mag;
    if (residual <= 7.5) return 5 * mag;
    return 10 * mag;
  }

  let rafId,
    lastTs,
    running = false;
  let speedScale = 1.0;

  function handlePointerDown(e) {
    const rect = canvas.getBoundingClientRect();
    const hitX = e.clientX - rect.left;
    const hitY = e.clientY - rect.top;

    if (Math.hypot(hitX - currentTipX, hitY - currentTipY) <= 25) {
      isDraggingVector = true;
    }
  }

  function handlePointerMove(e) {
    if (!isDraggingVector) return;
    const rect = canvas.getBoundingClientRect();
    const hitX = e.clientX - rect.left;
    const hitY = e.clientY - rect.top;

    const dx = hitX - currentLaunchX;
    const dy = currentLaunchY - hitY;

    // Update angle
    let angle = Math.atan2(dy, dx) * (180 / Math.PI);
    if (angle < 0) angle = 0;
    if (angle > 90) angle = 90;
    p.launchAngle = Math.round(angle);

    // Update speed
    const dist = Math.hypot(dx, dy);
    let speed = dist / 1.5;
    if (speed < 5) speed = 5;
    if (speed > 100) speed = 100;
    p.launchSpeed = Math.round(speed);

    initState(); // Reset trajectory while dragging
    render();
  }

  function handlePointerUp() {
    isDraggingVector = false;
  }

  canvas.addEventListener('pointerdown', handlePointerDown);
  window.addEventListener('pointermove', handlePointerMove);
  window.addEventListener('pointerup', handlePointerUp);

  function loop(ts) {
    if (!running) return;
    const rawDt = lastTs === undefined ? 1 / 60 : Math.min((ts - lastTs) / 1000, 1 / 20);
    lastTs = ts;
    if (!isDraggingVector) {
      tick(rawDt * speedScale);
    }
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
    setParams(next) {
      Object.assign(p, next);
      if (!isDraggingVector) {
        render();
      }
    },
    destroy() {
      this.stop();
      canvas.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    },
    setSpeed(s) {
      speedScale = s;
    },
    getData() {
      return {
        time: simTime,
        vx,
        vy,
        x,
        y,
        energy: energy(),
        totalEnergy: energy(),
        energyError: E0 !== 0 ? (energy() - E0) / Math.abs(E0) : 0,
        steps: stepCount,
      };
    },
  };
}
