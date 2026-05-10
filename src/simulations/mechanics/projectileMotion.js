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
          '"45° is the magic angle" is only true in a vacuum. Students often learn this rule and apply it universally — but drag breaks the symmetry of the parabola, favoring lower angles.',
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

    // Clean background
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, W, H);

    // Coordinate mapping
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
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(0, oy, W, H - oy);

    // Ground line
    ctx.beginPath();
    ctx.moveTo(0, oy);
    ctx.lineTo(W, oy);
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Grass tufts
    ctx.strokeStyle = 'rgba(50, 120, 50, 0.3)';
    ctx.lineWidth = 1;
    for (let gx = 10; gx < W; gx += 18) {
      const gh = 3 + Math.random() * 5;
      ctx.beginPath();
      ctx.moveTo(gx, oy);
      ctx.lineTo(gx - 2, oy - gh);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(gx, oy);
      ctx.lineTo(gx + 2, oy - gh * 0.7);
      ctx.stroke();
    }

    // --- Grid lines with labels ---
    ctx.font = '9px "Montserrat", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    // Vertical grid (range)
    const xGridStep = niceStep(targetW, 6);
    for (let gv = xGridStep; gv < targetW * 1.2; gv += xGridStep) {
      const gx = sx(gv);
      if (gx > W - 10) break;
      ctx.beginPath();
      ctx.moveTo(gx, oy);
      ctx.lineTo(gx, oy - targetH * scale * 1.1);
      ctx.strokeStyle = 'rgba(0,0,0,0.05)';
      ctx.lineWidth = 0.5;
      ctx.stroke();
      // Tick
      ctx.beginPath();
      ctx.moveTo(gx, oy);
      ctx.lineTo(gx, oy + 5);
      ctx.strokeStyle = 'rgba(0,0,0,0.2)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = '#64748b';
      ctx.fillText(`${gv.toFixed(0)}`, gx, oy + 7);
    }

    // Horizontal grid (height)
    const yGridStep = niceStep(targetH, 5);
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let gh = yGridStep; gh < targetH * 1.2; gh += yGridStep) {
      const gy = sy(gh);
      if (gy < 10) break;
      ctx.beginPath();
      ctx.moveTo(ox, gy);
      ctx.lineTo(ox + targetW * scale * 1.1, gy);
      ctx.strokeStyle = 'rgba(0,0,0,0.05)';
      ctx.lineWidth = 0.5;
      ctx.stroke();
      // Tick
      ctx.beginPath();
      ctx.moveTo(ox - 5, gy);
      ctx.lineTo(ox, gy);
      ctx.strokeStyle = 'rgba(0,0,0,0.2)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = '#64748b';
      ctx.fillText(`${gh.toFixed(0)}`, ox - 8, gy);
    }

    // Axis labels
    ctx.font = 'bold 10px "Montserrat", sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('Range [m]', ox + W * 0.4, oy + 22);
    ctx.save();
    ctx.translate(ox - 28, oy - H * 0.25);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Height [m]', 0, 0);
    ctx.restore();

    // --- Launch origin marker ---
    const launchX = sx(0);
    const launchY = sy(0);
    currentLaunchX = launchX;
    currentLaunchY = launchY;

    // Origin dot
    ctx.beginPath();
    ctx.arc(launchX, launchY, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#fb7185';
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#fb7185';
    ctx.fill();
    ctx.shadowBlur = 0;
    // Angle arc indicator
    const arcR = 25;
    ctx.beginPath();
    ctx.arc(launchX, launchY, arcR, 0, -rad, true);
    ctx.strokeStyle = 'rgba(0,0,0,0.1)';
    ctx.lineWidth = 1;
    ctx.stroke();
    // Angle label
    const labelAngleRad = rad / 2;
    ctx.fillStyle = '#64748b';
    ctx.font = '9px "Montserrat", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      `${p.launchAngle}°`,
      launchX + (arcR + 6) * Math.cos(-labelAngleRad),
      launchY + (arcR + 6) * Math.sin(-labelAngleRad),
    );

    // Launch direction vector (Draggable)
    const dirLen = Math.max(20, p.launchSpeed * 1.5);
    const tipX = launchX + dirLen * Math.cos(rad);
    const tipY = launchY - dirLen * Math.sin(rad);
    currentTipX = tipX;
    currentTipY = tipY;

    // Vector line
    ctx.beginPath();
    ctx.moveTo(launchX, launchY);
    ctx.lineTo(tipX, tipY);
    ctx.strokeStyle = isDraggingVector ? '#fbbf24' : 'rgba(251, 113, 133, 0.8)';
    ctx.lineWidth = isDraggingVector ? 4 : 2;
    ctx.setLineDash(isDraggingVector ? [] : [4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draggable handle at the tip
    ctx.beginPath();
    ctx.arc(tipX, tipY, isDraggingVector ? 10 : 6, 0, Math.PI * 2);
    ctx.fillStyle = isDraggingVector ? '#fbbf24' : '#e11d48';
    ctx.fill();
    ctx.strokeStyle = isDraggingVector ? '#fff' : '#be123c';
    ctx.lineWidth = 2;
    ctx.stroke();

    // --- Ideal Parabola (dashed) ---
    const idealPts = getIdealTrajectory(rangeIdeal * 1.15 + 10);
    if (idealPts.length > 1) {
      ctx.beginPath();
      ctx.moveTo(sx(idealPts[0].x), sy(idealPts[0].y));
      for (const pt of idealPts) {
        ctx.lineTo(sx(pt.x), sy(pt.y));
      }
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
      ctx.setLineDash([6, 6]);
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.setLineDash([]);

      // Label
      const topIdx = Math.floor(idealPts.length * 0.4);
      const topPt = idealPts[topIdx];
      if (topPt) {
        ctx.fillStyle = '#94a3b8';
        ctx.font = 'italic 9px "Montserrat", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Vacuum (analytical)', sx(topPt.x), sy(topPt.y) - 12);
      }
    }

    // --- Numerical Trail (gradient) ---
    if (trail.length > 1) {
      for (let i = 1; i < trail.length; i++) {
        const frac = i / trail.length;
        const pt0 = trail[i - 1];
        const pt1 = trail[i];

        // Speed-based color (slow=cyan, fast=rose)
        const speed = Math.sqrt(pt1.vx * pt1.vx + pt1.vy * pt1.vy);
        const speedFrac = Math.min(speed / (p.launchSpeed * 1.1), 1);
        const r = Math.round(60 + speedFrac * 191);
        const g = Math.round(165 - speedFrac * 100);
        const b = Math.round(250 - speedFrac * 115);

        ctx.beginPath();
        ctx.moveTo(sx(pt0.x), sy(pt0.y));
        ctx.lineTo(sx(pt1.x), sy(pt1.y));
        ctx.strokeStyle = `rgba(${r},${g},${b},${0.4 + frac * 0.6})`;
        ctx.lineWidth = 1.5 + frac * 1.5;
        ctx.stroke();
      }

      // Trail label
      const labelIdx = Math.floor(trail.length * 0.6);
      if (trail[labelIdx]) {
        ctx.fillStyle = '#e11d48';
        ctx.font = 'bold 9px "Montserrat", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Actual Path (with drag)', sx(trail[labelIdx].x), sy(trail[labelIdx].y) + 15);
      }
    }

    // --- Force Vectors ---
    const px = sx(x);
    const py = sy(Math.max(0, y));

    if (!landed && simTime > 0.01 && y > 0.1) {
      const speed = Math.sqrt(vx * vx + vy * vy);
      const vecScale = Math.min(scale * 0.35, 40);

      // Velocity vector (blue)
      drawArrow(ctx, px, py, px + vx * vecScale * 0.06, py - vy * vecScale * 0.06, {
        color: '#60a5fa',
        lineWidth: 2,
        headLength: 8,
      });

      // Gravity vector (purple, always down)
      const gVecLen = Math.min(p.gravity * vecScale * 0.15, 50);
      drawArrow(ctx, px, py, px, py + gVecLen, { color: '#a78bfa', lineWidth: 2, headLength: 7 });

      // Drag vector (yellow, opposes velocity)
      if (p.dragCoeff > 0 && speed > 0.1) {
        const dragAx = -p.dragCoeff * speed * vx;
        const dragAy = -p.dragCoeff * speed * vy;
        const dragScale = vecScale * 0.8;
        const dragEndX = px + dragAx * dragScale * 0.06;
        const dragEndY = py - dragAy * dragScale * 0.06;
        drawArrow(ctx, px, py, dragEndX, dragEndY, {
          color: '#fde047',
          lineWidth: 2,
          headLength: 7,
        });
      }
    }

    // --- Projectile ---
    if (!landed) {
      const projR = 6 + Math.sqrt(p.mass) * 2;
      ctx.beginPath();
      ctx.arc(px, py, projR, 0, Math.PI * 2);

      const projGrad = ctx.createRadialGradient(px - 2, py - 2, 1, px, py, projR);
      projGrad.addColorStop(0, '#fecdd3');
      projGrad.addColorStop(0.6, '#fb7185');
      projGrad.addColorStop(1, '#e11d48');
      ctx.fillStyle = projGrad;
      ctx.fill();
    }

    // --- Impact effect ---
    if (landed && impactFrame < 60) {
      const landPx = sx(landX);
      const landPy = sy(0);
      const f = impactFrame / 60;

      // Expanding rings
      for (let ring = 0; ring < 3; ring++) {
        const delay = ring * 0.15;
        const rf = Math.max(0, Math.min(1, (f - delay) / (1 - delay)));
        if (rf <= 0) continue;
        const radius = 8 + rf * 40 * (1 + ring * 0.5);
        ctx.beginPath();
        ctx.arc(landPx, landPy, radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(251, 113, 133, ${(1 - rf) * 0.4})`;
        ctx.lineWidth = 2 - rf * 1.5;
        ctx.stroke();
      }

      // Impact dust particles
      for (let pi = 0; pi < 8; pi++) {
        const angle = (pi / 8) * Math.PI + (Math.random() - 0.5) * 0.2;
        const dist = f * 30 * (1 + Math.random());
        const dx = Math.cos(angle) * dist;
        const dy = -Math.abs(Math.sin(angle)) * dist * 0.7;
        ctx.beginPath();
        ctx.arc(landPx + dx, landPy + dy, 2 * (1 - f), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(180, 160, 130, ${(1 - f) * 0.6})`;
        ctx.fill();
      }

      // Landing mark
      ctx.beginPath();
      ctx.arc(landPx, landPy, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#fb7185';
      ctx.fill();

      // Landing line indicator
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(landPx, landPy);
      ctx.lineTo(landPx, landPy - 30);
      ctx.strokeStyle = 'rgba(251, 113, 133, 0.4)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // --- Max height indicator ---
    if (maxHeight > 0 && trail.length > 5) {
      const mhY = sy(maxHeight);
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.moveTo(ox, mhY);
      ctx.lineTo(ox + 20, mhY);
      ctx.strokeStyle = 'rgba(96, 165, 250, 0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(96, 165, 250, 0.35)';
      ctx.font = 'bold 9px "Montserrat", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`H=${maxHeight.toFixed(1)}m`, ox + 2, mhY - 8);
    }

    // --- HUD Panel ---
    const speed = Math.sqrt(vx * vx + vy * vy);
    const hudX = W - 200;
    const hudY = 16;
    const hudW = 185;
    const hudH = 155;

    // HUD background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.beginPath();
    ctx.roundRect(hudX, hudY, hudW, hudH, 8);
    ctx.fill();
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.font = 'bold 11px "Montserrat", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    const hudLines = [
      { label: 'Time', value: `${simTime.toFixed(2)} s`, color: '#e4e4e7' },
      { label: 'Speed', value: `${speed.toFixed(1)} m/s`, color: '#60a5fa' },
      { label: 'Height', value: `${Math.max(0, y).toFixed(1)} m`, color: '#a78bfa' },
      { label: 'Range', value: `${x.toFixed(1)} m`, color: '#fb7185' },
      { label: 'Max H', value: `${maxHeight.toFixed(1)} m`, color: '#34d399' },
      { label: 'Energy', value: `${energy().toFixed(1)} J`, color: '#FFD166' },
    ];

    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 10px "Montserrat", sans-serif';
    ctx.fillText('FLIGHT DATA', hudX + 10, hudY + 8);

    hudLines.forEach((line, i) => {
      const ly = hudY + 24 + i * 20;
      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px "Montserrat", sans-serif';
      ctx.fillText(line.label, hudX + 10, ly);
      ctx.fillStyle = line.color;
      ctx.font = 'bold 11px "Montserrat", sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(line.value, hudX + hudW - 10, ly);
      ctx.textAlign = 'left';
    });

    // --- Status indicator ---
    if (landed) {
      ctx.fillStyle = 'rgba(251, 113, 133, 0.8)';
      ctx.font = 'bold 10px "Montserrat", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('▎LANDED', hudX + hudW / 2, hudY + hudH + 8);
    } else if (simTime > 0) {
      ctx.fillStyle = 'rgba(52, 211, 153, 0.6)';
      ctx.font = 'bold 10px "Montserrat", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('● IN FLIGHT', hudX + hudW / 2, hudY + hudH + 8);
    }

    // --- Vector legend ---
    const legX = 16;
    const legY = 16;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.beginPath();
    ctx.roundRect(legX, legY, 110, 70, 6);
    ctx.fill();
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.font = 'bold 9px "Montserrat", sans-serif';
    ctx.textAlign = 'left';
    const legends = [
      { color: '#60a5fa', label: '→ Velocity' },
      { color: '#fde047', label: '→ Air Drag' },
      { color: '#a78bfa', label: '↓ Gravity' },
    ];
    legends.forEach((leg, i) => {
      const ly = legY + 12 + i * 20;
      ctx.fillStyle = leg.color;
      ctx.fillText(leg.label, legX + 10, ly);
    });
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
