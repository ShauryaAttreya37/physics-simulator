/**
 * Biot-Savart Law — Current-Carrying Wire & Compass Field
 *
 * Physics:
 *   B = μ₀I/(2πr) — magnetic field around an infinite straight wire
 *   Direction: Right-Hand Rule (thumb = current, fingers = B-field circles)
 *
 * Interactive: Drag the wire and the test compass anywhere in 2D.
 */

const DEFAULTS = {
  current: 5.0,
  showMagnitude: 1,
  showFieldCircles: 1,
  compassDensity: 6,
  viewScale: 1.0,
};

const STATE = {
  wire: { x: -60, y: 0 },
  compass: { x: 120, y: 0 },
};

export const defaultParams = { ...DEFAULTS };

export const equationSections = [
  {
    title: 'Introduction',
    content:
      'A current-carrying wire creates a magnetic field that forms concentric circles around it. This was discovered by Ørsted in 1820. The Biot-Savart Law gives the exact field. The Right-Hand Rule tells you the direction: wrap your right thumb along the current, and your fingers curl in the direction of B.',
  },
  {
    title: 'Biot-Savart (Infinite Wire)',
    equations: [
      {
        latex: String.raw`B = \frac{\mu_0 I}{2\pi r}`,
        description: 'The magnetic field magnitude at distance r from a long straight wire.',
      },
    ],
  },
  {
    title: 'How to Use',
    content:
      '1. **Drag the wire** (purple circle) to move the field source.\n2. **Drag the test compass** (yellow ring) to explore the field.\n3. Observe how current magnitude and direction affect the compass needles.',
  },
];

export const equations = [
  String.raw`B = \frac{\mu_0 I}{2\pi r}`,
  String.raw`\text{Right-Hand Rule: Thumb} = I, \text{Curl} = \vec{B}`,
];

export const graphParams = [
  { key: 'fieldAtTest', label: 'B at test compass' },
  { key: 'distFromWire', label: 'Distance r' },
];

export const controls = [
  { key: 'current', label: 'Current I [A]', min: -10, max: 10, step: 0.1 },
  { key: 'compassDensity', label: 'Compass Grid', min: 3, max: 10, step: 1 },
  { key: 'showMagnitude', label: 'Show |B| Color', type: 'toggle' },
  { key: 'showFieldCircles', label: 'Field Circles', type: 'toggle' },
];

export const scenarios = [
  {
    name: 'Strong CCW Field',
    description: 'High positive current creates a strong counter-clockwise field.',
    params: { current: 10, compassDensity: 7 },
  },
  {
    name: 'Reversed CW Field',
    description: 'Negative current reverses the field direction.',
    params: { current: -10, compassDensity: 7 },
  },
];

export function create(canvas, initParams = {}) {
  const ctx = canvas.getContext('2d');
  const p = { ...DEFAULTS, ...initParams };
  let simTime = 0;

  // Interaction
  const wirePos = { ...STATE.wire };
  const compassPos = { ...STATE.compass };
  let dragTarget = null;
  let dragOffset = { x: 0, y: 0 };

  function fieldAt(x, y) {
    const dx = x - wirePos.x;
    const dy = y - wirePos.y;
    const r = Math.max(15, Math.hypot(dx, dy));
    const B = (p.current / (2 * Math.PI * r)) * 1200;
    const angle = Math.atan2(dy, dx);
    const dir = p.current >= 0 ? 1 : -1;
    const bx = -dir * Math.sin(angle) * Math.abs(B);
    const by = dir * Math.cos(angle) * Math.abs(B);
    return { bx, by, mag: Math.abs(B), r };
  }

  function drawCompassNeedle(cx, cy, angle, size, mag, isTest) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);

    const len = size * 0.45;
    const w = size * 0.12;

    // North
    ctx.beginPath();
    ctx.moveTo(0, -len);
    ctx.lineTo(-w, 0);
    ctx.lineTo(w, 0);
    ctx.closePath();
    ctx.fillStyle = '#ef4444';
    ctx.fill();

    // South
    ctx.beginPath();
    ctx.moveTo(0, len);
    ctx.lineTo(-w, 0);
    ctx.lineTo(w, 0);
    ctx.closePath();
    ctx.fillStyle = '#e2e8f0';
    ctx.fill();

    ctx.restore();

    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.5, 0, Math.PI * 2);
    ctx.strokeStyle = isTest
      ? dragTarget === 'compass'
        ? '#fef08a'
        : '#fde047'
      : 'rgba(255,255,255,0.08)';
    ctx.lineWidth = isTest ? 2.5 : 0.8;
    ctx.stroke();

    if (p.showMagnitude && !isTest) {
      const alpha = Math.min(0.25, mag * 0.005);
      ctx.beginPath();
      ctx.arc(cx, cy, size * 0.45, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(96, 165, 250, ${alpha})`;
      ctx.fill();
    }
  }

  function render() {
    const W = canvas.width,
      H = canvas.height;
    const cx = W / 2,
      cy = H / 2;
    const scale = p.viewScale ?? 1.0;

    ctx.fillStyle = '#050810';
    ctx.fillRect(0, 0, W, H);

    const wX = cx + wirePos.x * scale;
    const wY = cy + wirePos.y * scale;
    const cX = cx + compassPos.x * scale;
    const cY = cy + compassPos.y * scale;

    // Field circles
    if (p.showFieldCircles) {
      ctx.setLineDash([4, 6]);
      ctx.strokeStyle = 'rgba(96, 165, 250, 0.08)';
      for (const r of [50, 100, 150, 220, 300]) {
        ctx.beginPath();
        ctx.arc(wX, wY, r * scale, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.setLineDash([]);
    }

    // Grid of compasses
    const step = Math.max(35, 100 - p.compassDensity * 7);
    for (let gx = step / 2; gx < W; gx += step) {
      for (let gy = step / 2; gy < H; gy += step) {
        const dx = (gx - cx) / scale,
          dy = (gy - cy) / scale;
        if (Math.hypot(gx - wX, gy - wY) < 30) continue;
        const { bx, by, mag } = fieldAt(dx, dy);
        drawCompassNeedle(gx, gy, Math.atan2(bx, -by), 24, mag, false);
      }
    }

    // Wire
    ctx.beginPath();
    ctx.arc(wX, wY, 14, 0, Math.PI * 2);
    const grad = ctx.createRadialGradient(wX - 4, wY - 4, 2, wX, wY, 14);
    grad.addColorStop(0, '#c084fc');
    grad.addColorStop(1, '#581c87');
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = dragTarget === 'wire' ? '#fef08a' : 'rgba(255,255,255,0.2)';
    ctx.lineWidth = dragTarget === 'wire' ? 2.5 : 1;
    ctx.stroke();

    ctx.font = 'bold 12px monospace';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (p.current > 0) (ctx.beginPath(), ctx.arc(wX, wY, 3, 0, Math.PI * 2), ctx.fill());
    else if (p.current < 0) ctx.fillText('×', wX, wY);

    // Test Compass
    const { bx, by, mag, r } = fieldAt(compassPos.x, compassPos.y);
    drawCompassNeedle(cX, cY, Math.atan2(bx, -by), 50, mag, true);

    // Distance line
    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = 'rgba(250, 204, 21, 0.2)';
    ctx.beginPath();
    ctx.moveTo(wX, wY);
    ctx.lineTo(cX, cY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.font = '10px monospace';
    ctx.fillStyle = 'rgba(250, 204, 21, 0.5)';
    ctx.fillText(`r = ${r.toFixed(0)}`, (wX + cX) / 2, (wY + cY) / 2 - 10);

    // Glass HUD
    const hudX = 20,
      hudY = 20,
      hudW = 180,
      hudH = 120;
    ctx.fillStyle = 'rgba(20, 25, 40, 0.8)';
    ctx.beginPath();
    ctx.roundRect(hudX, hudY, hudW, hudH, 12);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.stroke();

    ctx.font = 'bold 10px monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillText('BIOT-SAVART FIELD', hudX + 12, hudY + 20);

    const lines = [
      { label: 'Current I', value: p.current.toFixed(1) + ' A', color: '#c084fc' },
      { label: 'Distance r', value: r.toFixed(0) + ' px', color: '#fbbf24' },
      { label: 'B Field', value: mag.toFixed(2), color: '#60a5fa' },
    ];
    lines.forEach((line, i) => {
      ctx.font = '9px monospace';
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.fillText(line.label, hudX + 12, hudY + 45 + i * 20);
      ctx.textAlign = 'right';
      ctx.fillStyle = line.color;
      ctx.fillText(line.value, hudX + hudW - 12, hudY + 45 + i * 20);
      ctx.textAlign = 'left';
    });
  }

  function handlePointerDown(e) {
    const rect = canvas.getBoundingClientRect();
    const hX = (e.clientX - rect.left - canvas.width / 2) / (p.viewScale ?? 1);
    const hY = (e.clientY - rect.top - canvas.height / 2) / (p.viewScale ?? 1);
    if (Math.hypot(hX - wirePos.x, hY - wirePos.y) < 20) dragTarget = 'wire';
    else if (Math.hypot(hX - compassPos.x, hY - compassPos.y) < 30) dragTarget = 'compass';
    if (dragTarget)
      dragOffset = {
        x: hX - (dragTarget === 'wire' ? wirePos.x : compassPos.x),
        y: hY - (dragTarget === 'wire' ? wirePos.y : compassPos.y),
      };
  }

  function handlePointerMove(e) {
    if (!dragTarget) return;
    const rect = canvas.getBoundingClientRect();
    const hX = (e.clientX - rect.left - canvas.width / 2) / (p.viewScale ?? 1);
    const hY = (e.clientY - rect.top - canvas.height / 2) / (p.viewScale ?? 1);
    const t = dragTarget === 'wire' ? wirePos : compassPos;
    t.x = hX - dragOffset.x;
    t.y = hY - dragOffset.y;
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
    rafId;
  function loop() {
    if (!running) return;
    render();
    simTime += 1 / 60;
    rafId = requestAnimationFrame(loop);
  }

  render();

  return {
    start() {
      if (!running) {
        running = true;
        rafId = requestAnimationFrame(loop);
      }
    },
    stop() {
      running = false;
      cancelAnimationFrame(rafId);
    },
    reset() {
      wirePos.x = STATE.wire.x;
      wirePos.y = STATE.wire.y;
      compassPos.x = STATE.compass.x;
      compassPos.y = STATE.compass.y;
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
      const { mag, r } = fieldAt(compassPos.x, compassPos.y);
      return { time: simTime, fieldAtTest: mag, distFromWire: r };
    },
  };
}
