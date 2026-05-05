/**
 * Atwood's Machine — Proper Physics Simulation
 *
 * Physics:     Constant acceleration a = g(m₂−m₁)/(m₁+m₂),
 *              exact kinematic equations (constant-a Verlet),
 *              proper tension T = 2m₁m₂g/(m₁+m₂),
 *              energy conservation tracking.
 * Units:       Real-world SI → mapped to canvas via pixel scale.
 * Rendering:   Realistic pulley with rope, 3D-styled masses,
 *              force/acceleration vectors, displacement + velocity graphs,
 *              energy bar, data readout with Montserrat font.
 */

import { drawArrow } from '../../utils/canvas';

const DEFAULTS = {
  m1: 2.0, // kg (lighter mass, left side)
  m2: 5.0, // kg (heavier mass, right side)
  gravity: 9.81, // m/s²
  pulleyRadius: 30, // px (visual only)
  friction: 0, // coefficient of kinetic friction at pulley
};

export const defaultParams = { ...DEFAULTS };

export const equationSections = [
  {
    title: 'Introduction',
    content:
      "Atwood's machine is a pulley system with two masses connected by a string over a pulley. It demonstrates Newton's laws and energy conservation. When masses are different, the heavier one pulls the lighter one up. This is a classic physics experiment that shows how gravity creates acceleration and tension.",
  },
  {
    title: 'Equations of Motion',
    equations: [
      {
        latex: String.raw`a = g \frac{m_2 - m_1}{m_1 + m_2}`,
        description:
          "The acceleration of the system depends on the mass difference. If m₂ > m₁, acceleration is positive (m₂ goes down). If equal masses, no motion. This comes from Newton's second law applied to the system.",
      },
      {
        latex: String.raw`T = \frac{2 m_1 m_2 g}{m_1 + m_2}`,
        description:
          "Tension in the string. It's the same throughout the string. Notice it's always between the weights of the two masses - makes sense for equilibrium.",
      },
    ],
    variables: [
      { symbol: 'm₁, m₂', description: 'Masses hanging on each side (kg)' },
      { symbol: 'g', description: 'Gravity acceleration (9.81 m/s² on Earth)' },
    ],
  },
  {
    title: 'Energy Conservation',
    equations: [
      {
        latex: String.raw`E = \frac{1}{2}(m_1+m_2)v^2 + (m_1 - m_2) g \, s`,
        description:
          'Total energy = kinetic + potential. s is how far the system has moved. Potential energy depends on height difference. Energy should be conserved (constant) over time.',
      },
    ],
  },
  {
    title: 'Constraint',
    equations: [
      {
        latex: String.raw`\Delta y_1 = -\Delta y_2, \quad v_1 = -v_2, \quad a_1 = -a_2`,
        description:
          'The string connects the masses, so they move together. If one goes up, the other goes down by the same amount. This is the key constraint that makes the system work.',
      },
    ],
  },
  {
    title: 'How to Use',
    content:
      '1. Set different masses m₁ and m₂ - heavier on one side causes motion.\n2. Try equal masses - system should not move.\n3. Adjust gravity - see how it affects acceleration.\n4. Watch the tension graph - it stays constant.\n5. Check energy conservation over time.',
  },
  {
    title: 'Beginner Tips',
    content:
      "Start with m₂ much larger than m₁ to see clear motion. Calculate expected acceleration using the formula. Notice tension is less than the heavier mass's weight. Try very small mass differences - motion is slow. Look at the pulley - it changes direction of force.",
  },
];

export const equations = [
  String.raw`a = g \frac{m_2 - m_1}{m_1 + m_2}`,
  String.raw`T = g \frac{2 m_1 m_2}{m_1 + m_2}`,
];

export const graphParams = [
  { key: 'y2', label: 'y₂(t) [m]' },
  { key: 'v2', label: 'v₂(t) [m/s]' },
  { key: 'tension', label: 'Tension [N]' },
];

export const controls = [
  { key: 'm1', label: 'Mass m₁ [kg]', min: 0.1, max: 10, step: 0.1 },
  { key: 'm2', label: 'Mass m₂ [kg]', min: 0.1, max: 10, step: 0.1 },
  { key: 'gravity', label: 'Gravity g [m/s²]', min: 0.5, max: 20, step: 0.1 },
  { key: 'friction', label: 'Friction μ', min: 0, max: 0.5, step: 0.01 },
];

export const method = 'analytical';

// ── Simulation ─────────────────────────────────────────────────────────────
export function create(canvas, initParams = {}) {
  const ctx = canvas.getContext('2d');
  const p = { ...DEFAULTS, ...initParams };

  /*
   * s = displacement of m₂ downward from initial position [meters].
   * v = velocity of the system [m/s]. Positive = m₂ going down.
   *
   * On canvas: we convert meters → pixels via PX_PER_METER.
   * Physical travel is bounded: max string travel ≈ 2.5m.
   */
  const MAX_TRAVEL_M = 3.0; // meters of travel before hitting stops
  const PX_PER_METER = 60; // pixel per meter for display

  let s, v, simTime, stepCount;
  let trail; // [{s, v, t}]
  let E0;
  let stopped;

  function accel() {
    const totalM = p.m1 + p.m2;
    const netForce = (p.m2 - p.m1) * p.gravity;
    const frictionForce =
      p.friction * totalM * p.gravity * (Math.abs(v) > 0.001 ? Math.sign(v) : 0);
    return (netForce - frictionForce) / totalM;
  }

  function tensionValue() {
    // T = m₁(g + a) — net upward force on m₁
    return p.m1 * (p.gravity + accel());
  }

  function energy() {
    // KE + change in PE
    // PE relative to start: m₁ rises by s, m₂ falls by s
    // ΔPE = m₁·g·s - m₂·g·s = (m₁ - m₂)·g·s
    return 0.5 * (p.m1 + p.m2) * v * v + (p.m1 - p.m2) * p.gravity * s;
  }

  function initState() {
    s = 0;
    v = 0;
    simTime = 0;
    stepCount = 0;
    trail = [];
    stopped = false;
    E0 = energy();
  }

  function tick(dt) {
    if (stopped) return;

    const a = accel();

    // Velocity Verlet (exact for constant acceleration)
    s += v * dt + 0.5 * a * dt * dt;
    v += a * dt;
    simTime += dt;
    stepCount++;

    // Compute effective max travel from both physical and visual limits
    // Mirror the layout logic from render() to get visual bounds
    const H = canvas.height;
    const pulleyY = H * 0.13;
    const R = p.pulleyRadius;
    const ropeTopY = pulleyY + R + 10;
    const floorY = H * 0.88;
    const equilibriumY = ropeTopY + (floorY - ropeTopY) * 0.35;
    const maxUpPx = equilibriumY - ropeTopY - 5;
    const maxDownPx = floorY - equilibriumY - 60;
    const maxDispPx = Math.min(maxUpPx, maxDownPx);
    const visualMaxM = maxDispPx / PX_PER_METER;
    const effectiveMax = Math.min(MAX_TRAVEL_M, visualMaxM);

    // Bound checking — stop when mass reaches pulley or floor
    if (s >= effectiveMax) {
      s = effectiveMax;
      v = 0;
      stopped = true;
    } else if (s <= -effectiveMax) {
      s = -effectiveMax;
      v = 0;
      stopped = true;
    }

    trail.push({ s, v, t: simTime });
    if (trail.length > 500) trail.shift();
  }

  // ── Rendering ─────────────────────────────────────────────────────────
  function render() {
    const W = canvas.width,
      H = canvas.height;

    // Background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#0d0d14');
    bgGrad.addColorStop(0.5, '#10101c');
    bgGrad.addColorStop(1, '#14141f');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Layout: left half = physical simulation, right half = graphs + data
    const simAreaW = W * 0.48;
    const pulleyX = simAreaW * 0.5;
    const pulleyY = H * 0.13;
    const R = p.pulleyRadius;

    // --- Support structure ---
    // Ceiling
    ctx.fillStyle = '#1a1a28';
    ctx.fillRect(0, 0, simAreaW, 12);
    ctx.strokeStyle = '#2d2d44';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 12);
    ctx.lineTo(simAreaW, 12);
    ctx.stroke();

    // Vertical support bar
    const barGrad = ctx.createLinearGradient(pulleyX - 3, 0, pulleyX + 3, 0);
    barGrad.addColorStop(0, '#28283c');
    barGrad.addColorStop(0.5, '#3a3a52');
    barGrad.addColorStop(1, '#28283c');
    ctx.fillStyle = barGrad;
    ctx.fillRect(pulleyX - 3, 12, 6, pulleyY - 12 - R);

    // --- Mass positions (canvas coordinates) ---
    // Masses hang directly below the pulley rope contact points
    // so the strings are perfectly vertical (straight and taut)
    const m1X = pulleyX - R; // directly under left rope contact
    const m2X = pulleyX + R; // directly under right rope contact

    // Equilibrium: both masses start at this Y, midway in the available rope space
    const ropeTopY = pulleyY + R + 10; // just below pulley bottom
    const floorY = H * 0.88;
    const equilibriumY = ropeTopY + (floorY - ropeTopY) * 0.35; // start in upper third

    // Displacement in pixels
    const dispPx = s * PX_PER_METER;

    // Compute visual bounds: mass can't go above ropeTopY or below floorY
    // When s > 0: m₁ goes UP (equilibriumY - dispPx >= ropeTopY)
    //             m₂ goes DOWN (equilibriumY + dispPx <= floorY - blockHeight)
    const maxUpPx = equilibriumY - ropeTopY - 5; // margin so mass doesn't overlap pulley
    const maxDownPx = floorY - equilibriumY - 60; // margin for mass block height
    const maxDispPx = Math.min(maxUpPx, maxDownPx);
    const clampedDispPx = Math.max(-maxDispPx, Math.min(maxDispPx, dispPx));

    const m1Y = equilibriumY - clampedDispPx; // m₁ goes up when s > 0
    const m2Y = equilibriumY + clampedDispPx; // m₂ goes down when s > 0

    // Floor line
    ctx.fillStyle = '#161624';
    ctx.fillRect(0, floorY, simAreaW, H - floorY);
    ctx.strokeStyle = '#2d2d44';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, floorY);
    ctx.lineTo(simAreaW, floorY);
    ctx.stroke();

    // --- Ropes (perfectly vertical, straight and taut) ---
    ctx.strokeStyle = '#9494a8';
    ctx.lineWidth = 2;
    // Left rope: straight down from pulley to top of m₁ block
    ctx.beginPath();
    ctx.moveTo(m1X, pulleyY); // rope starts at pulley edge
    ctx.lineTo(m1X, m1Y); // rope ends at top of mass
    ctx.stroke();
    // Right rope: straight down from pulley to top of m₂ block
    ctx.beginPath();
    ctx.moveTo(m2X, pulleyY); // rope starts at pulley edge
    ctx.lineTo(m2X, m2Y); // rope ends at top of mass
    ctx.stroke();
    // Rope arc over pulley (connects the two vertical segments)
    ctx.beginPath();
    ctx.arc(pulleyX, pulleyY, R, Math.PI, 0);
    ctx.stroke();

    // --- Pulley ---
    const pulleyAngle = (s * PX_PER_METER) / R;
    ctx.save();
    ctx.translate(pulleyX, pulleyY);
    ctx.rotate(pulleyAngle);

    // Wheel body
    const wheelGrad = ctx.createRadialGradient(0, 0, R * 0.5, 0, 0, R);
    wheelGrad.addColorStop(0, '#222236');
    wheelGrad.addColorStop(0.85, '#1c1c2e');
    wheelGrad.addColorStop(1, '#3a3a55');
    ctx.beginPath();
    ctx.arc(0, 0, R, 0, Math.PI * 2);
    ctx.fillStyle = wheelGrad;
    ctx.fill();
    ctx.strokeStyle = '#4a4a65';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Groove
    ctx.beginPath();
    ctx.arc(0, 0, R - 2, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(120,120,170,0.2)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Spokes
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(R * 0.8 * Math.cos(angle), R * 0.8 * Math.sin(angle));
      ctx.strokeStyle = '#3a3a55';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Axle
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    const axleGrad = ctx.createRadialGradient(-1, -1, 0, 0, 0, 4);
    axleGrad.addColorStop(0, '#aaaabc');
    axleGrad.addColorStop(1, '#555566');
    ctx.fillStyle = axleGrad;
    ctx.fill();
    ctx.restore();

    // --- Draw Masses ---
    const massBlockH1 = drawMassBlock(m1X, m1Y, p.m1, '#60a5fa', '#3b82f6', 'm₁');
    const massBlockH2 = drawMassBlock(m2X, m2Y, p.m2, '#fb7185', '#e11d48', 'm₂');

    // --- Force Vectors ---
    const a = accel();
    const T = tensionValue();
    const showVectors = Math.abs(a) > 0.05 || Math.abs(v) > 0.01;

    if (showVectors && !stopped) {
      const vecPixScale = 3.0;

      // Tension (upward on both masses)
      const tLen = Math.min(Math.abs(T) * vecPixScale, 80);
      drawArrow(ctx, m1X, m1Y - 2, m1X, m1Y - 2 - tLen, {
        color: '#fde047',
        lineWidth: 2,
        headLength: 7,
      });
      drawArrow(ctx, m2X, m2Y - 2, m2X, m2Y - 2 - tLen, {
        color: '#fde047',
        lineWidth: 2,
        headLength: 7,
      });

      // Weight (downward)
      const w1Len = Math.min(p.m1 * p.gravity * vecPixScale, 80);
      const w2Len = Math.min(p.m2 * p.gravity * vecPixScale, 80);
      drawArrow(ctx, m2X, m2Y + massBlockH2 + 3, m2X, m2Y + massBlockH2 + 3 + w2Len, {
        color: '#a78bfa',
        lineWidth: 2,
        headLength: 7,
      });

      // Net acceleration arrows
      if (Math.abs(a) > 0.1) {
        const aLen = Math.min(Math.abs(a) * 10, 45);
        // m₁ goes up when a > 0
        const m1Dir = a > 0 ? -1 : 1;
        const m2Dir = a > 0 ? 1 : -1;
        drawArrow(
          ctx,
          m1X - 28,
          m1Y + massBlockH1 / 2,
          m1X - 28,
          m1Y + massBlockH1 / 2 + m1Dir * aLen,
          { color: '#34d399', lineWidth: 2.5, headLength: 8 },
        );
        drawArrow(
          ctx,
          m2X + 28,
          m2Y + massBlockH2 / 2,
          m2X + 28,
          m2Y + massBlockH2 / 2 + m2Dir * aLen,
          { color: '#34d399', lineWidth: 2.5, headLength: 8 },
        );
        // Labels
        ctx.fillStyle = '#34d399';
        ctx.font = 'bold 8px "Montserrat", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('a', m1X - 28, m1Y + massBlockH1 / 2 + m1Dir * (aLen + 10));
        ctx.fillText('a', m2X + 28, m2Y + massBlockH2 / 2 + m2Dir * (aLen + 10));
      }

      // Tension labels
      ctx.fillStyle = '#fde047';
      ctx.font = 'bold 9px "Montserrat", sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(`T=${T.toFixed(1)}N`, m1X + 20, m1Y - tLen / 2);
      ctx.fillText(`T=${T.toFixed(1)}N`, m2X + 20, m2Y - tLen / 2);
    }

    // --- Equilibrium marker ---
    ctx.setLineDash([3, 5]);
    ctx.strokeStyle = '#2A3441';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(10, equilibriumY);
    ctx.lineTo(simAreaW - 10, equilibriumY);
    ctx.stroke();
    ctx.setLineDash([]);

    // --- Vector legend ---
    const legX = 8;
    const legY = H * 0.72;
    ctx.fillStyle = 'rgba(10, 10, 20, 0.65)';
    ctx.beginPath();
    ctx.roundRect(legX, legY, 105, 68, 5);
    ctx.fill();
    ctx.font = 'bold 8px "Montserrat", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    [
      { color: '#fde047', label: '→ Tension' },
      { color: '#a78bfa', label: '→ Weight' },
      { color: '#34d399', label: '→ Net Accel' },
    ].forEach((l, i) => {
      ctx.fillStyle = l.color;
      ctx.fillText(l.label, legX + 8, legY + 8 + i * 19);
    });

    // --- Right Panel ---
    renderRightPanel(simAreaW, W, H, a, T);

    // --- Bottom HUD ---
    renderBottomHUD(simAreaW, W, H, a, T);
  }

  function drawMassBlock(cx, cy, mass, color, darkColor, label) {
    const blockW = 28 + Math.sqrt(mass) * 10;
    const blockH = 30 + Math.sqrt(mass) * 10;
    const rx = cx - blockW / 2;
    const ry = cy;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.roundRect(rx + 3, ry + 3, blockW, blockH, 5);
    ctx.fill();

    // Body
    const grad = ctx.createLinearGradient(rx, ry, rx + blockW, ry + blockH);
    grad.addColorStop(0, color);
    grad.addColorStop(0.5, darkColor);
    grad.addColorStop(1, color);
    ctx.beginPath();
    ctx.roundRect(rx, ry, blockW, blockH, 5);
    ctx.fillStyle = grad;
    ctx.shadowBlur = 14;
    ctx.shadowColor = color;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Border highlight
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Hook ring
    ctx.beginPath();
    ctx.arc(cx, ry, 3, 0, Math.PI, true);
    ctx.strokeStyle = '#8b8b9e';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Label
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px "Montserrat", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, cx, ry + blockH / 2 - 5);

    // Mass value
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.font = '9px "Montserrat", sans-serif';
    ctx.fillText(`${mass.toFixed(1)} kg`, cx, ry + blockH / 2 + 9);

    return blockH;
  }

  function renderRightPanel(startX, W, H, a, T) {
    const px = startX + 12;
    const pw = W - startX - 24;

    // Panel bg
    ctx.fillStyle = 'rgba(10, 10, 18, 0.55)';
    ctx.beginPath();
    ctx.roundRect(px, 8, pw, H - 16, 10);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    ctx.stroke();

    const gx = px + 14;
    const gw = pw - 28;

    // --- Displacement-Time Graph ---
    const g1Y = 28;
    const g1H = H * 0.24;
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.font = 'bold 9px "Montserrat", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('Displacement (m₂) vs Time', gx, g1Y);

    if (trail.length >= 2) {
      renderGraph(
        gx,
        g1Y + 14,
        gw,
        g1H,
        trail,
        't',
        's',
        'rgba(251,113,133,0.85)',
        't [s]',
        'Δs [m]',
      );
    }

    // --- Velocity-Time Graph ---
    const g2Y = g1Y + g1H + 48;
    const g2H = H * 0.2;
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.font = 'bold 9px "Montserrat", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Velocity vs Time', gx, g2Y);

    if (trail.length >= 2) {
      renderGraph(
        gx,
        g2Y + 14,
        gw,
        g2H,
        trail,
        't',
        'v',
        'rgba(96,165,250,0.85)',
        't [s]',
        'v [m/s]',
      );
    }

    // --- Energy Conservation Bar ---
    const eY = g2Y + g2H + 35;
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.font = 'bold 9px "Montserrat", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Energy Conservation', gx, eY);

    const E = energy();
    const errPct = E0 !== 0 ? Math.abs((E - E0) / Math.abs(E0)) * 100 : 0;
    const barY = eY + 14;
    const barH = 14;

    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    ctx.beginPath();
    ctx.roundRect(gx, barY, gw, barH, 3);
    ctx.fill();

    const ratio = E0 !== 0 ? Math.min(1, Math.abs(E / E0)) : 1;
    const barColor = errPct < 0.01 ? '#34d399' : errPct < 1 ? '#FFD166' : '#FF6B6B';
    ctx.fillStyle = barColor;
    ctx.beginPath();
    ctx.roundRect(gx, barY, ratio * gw, barH, 3);
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 8px "Montserrat", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`ΔE/E₀ = ${errPct.toFixed(4)}%`, gx + gw / 2, barY + barH / 2);

    // --- Live Data Readout ---
    const dY = barY + barH + 18;
    const dataItems = [
      { label: 'Acceleration', value: `${a.toFixed(3)} m/s²`, color: '#34d399' },
      { label: 'Velocity', value: `${v.toFixed(3)} m/s`, color: '#60a5fa' },
      { label: 'Displacement', value: `${s.toFixed(3)} m`, color: '#fb7185' },
      { label: 'Tension', value: `${T.toFixed(2)} N`, color: '#fde047' },
      { label: 'Time', value: `${simTime.toFixed(2)} s`, color: '#e4e4e7' },
      { label: 'Mass ratio', value: `m₂/m₁ = ${(p.m2 / p.m1).toFixed(2)}`, color: '#a78bfa' },
    ];

    dataItems.forEach((item, i) => {
      const iy = dY + i * 19;
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.font = '9px "Montserrat", sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(item.label, gx, iy);
      ctx.fillStyle = item.color;
      ctx.font = 'bold 10px "Montserrat", sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(item.value, gx + gw, iy);
    });
  }

  function renderGraph(gx, gy, gw, gh, data, xKey, yKey, color, xLabel, yLabel) {
    // Axes
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(gx, gy);
    ctx.lineTo(gx, gy + gh);
    ctx.lineTo(gx + gw, gy + gh);
    ctx.stroke();

    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 0.5;
    for (let i = 1; i <= 4; i++) {
      const gridY = gy + (gh * i) / 5;
      ctx.beginPath();
      ctx.moveTo(gx, gridY);
      ctx.lineTo(gx + gw, gridY);
      ctx.stroke();
    }

    if (data.length < 2) return;
    const xMin = data[0][xKey];
    const xMax = data[data.length - 1][xKey];
    if (xMax - xMin < 1e-8) return;

    let yMin = Infinity,
      yMax = -Infinity;
    for (const pt of data) {
      yMin = Math.min(yMin, pt[yKey]);
      yMax = Math.max(yMax, pt[yKey]);
    }
    const yRange = Math.max(yMax - yMin, 0.001);
    yMin -= yRange * 0.1;
    yMax += yRange * 0.1;

    // Zero line
    if (yMin < 0 && yMax > 0) {
      const zy = gy + gh * (1 - (0 - yMin) / (yMax - yMin));
      ctx.setLineDash([3, 5]);
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(gx, zy);
      ctx.lineTo(gx + gw, zy);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Line
    ctx.beginPath();
    let started = false;
    for (let i = 0; i < data.length; i++) {
      const plotX = gx + ((data[i][xKey] - xMin) / (xMax - xMin)) * gw;
      const plotY = gy + gh * (1 - (data[i][yKey] - yMin) / (yMax - yMin));
      if (!started) {
        ctx.moveTo(plotX, plotY);
        started = true;
      } else ctx.lineTo(plotX, plotY);
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Fill area
    const last = data[data.length - 1];
    const lastPx = gx + ((last[xKey] - xMin) / (xMax - xMin)) * gw;
    ctx.lineTo(lastPx, gy + gh);
    ctx.lineTo(gx, gy + gh);
    ctx.closePath();
    ctx.fillStyle = color.replace(/[\d.]+\)$/, '0.05)');
    ctx.fill();

    // Cursor dot
    const cpx = lastPx;
    const cpy = gy + gh * (1 - (last[yKey] - yMin) / (yMax - yMin));
    ctx.beginPath();
    ctx.arc(cpx, cpy, 3, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.shadowBlur = 6;
    ctx.shadowColor = color;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Axis labels
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = '8px "Montserrat", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(xLabel, gx + gw / 2, gy + gh + 4);
    ctx.save();
    ctx.translate(gx - 10, gy + gh / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(yLabel, 0, 0);
    ctx.restore();
  }

  function renderBottomHUD(simAreaW, W, H, a, T) {
    const hudH = 32;
    const hudY = H - hudH;

    ctx.fillStyle = 'rgba(10, 10, 18, 0.85)';
    ctx.fillRect(0, hudY, simAreaW, hudH);
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, hudY);
    ctx.lineTo(simAreaW, hudY);
    ctx.stroke();

    const midH = hudY + hudH / 2;

    ctx.font = 'bold 11px "Montserrat", sans-serif';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';

    // Acceleration
    ctx.fillStyle = '#34d399';
    ctx.fillText(`a = ${a.toFixed(3)} m/s²`, 10, midH);

    // Tension
    ctx.fillStyle = '#fde047';
    const tX = simAreaW * 0.45;
    ctx.fillText(`T = ${T.toFixed(2)} N`, tX, midH);

    // Status
    const sX = simAreaW * 0.8;
    if (stopped) {
      ctx.fillStyle = '#FF6B6B';
      ctx.fillText('■ STOPPED', sX, midH);
    } else if (Math.abs(v) > 0.001) {
      ctx.fillStyle = '#34d399';
      ctx.fillText('● MOVING', sX, midH);
    } else {
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.fillText('○ AT REST', sX, midH);
    }
  }

  let rafId,
    lastTs,
    running = false;
  let speedScale = 1.0;

  function loop(ts) {
    if (!running) return;
    const rawDt = lastTs === undefined ? 1 / 60 : Math.min((ts - lastTs) / 1000, 1 / 20);
    lastTs = ts;
    tick(rawDt * speedScale);
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
      render();
    },
    destroy() {
      this.stop();
    },
    setSpeed(s) {
      speedScale = s;
    },
    getData() {
      return {
        time: simTime,
        y2: s,
        v2: v,
        tension: tensionValue(),
        energy: energy(),
        totalEnergy: energy(),
        energyError: E0 !== 0 ? (energy() - E0) / Math.abs(E0) : 0,
        steps: stepCount,
      };
    },
  };
}
