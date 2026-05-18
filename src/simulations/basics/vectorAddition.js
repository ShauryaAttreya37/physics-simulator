/**
 * Vector Addition Lab - crisp HiDPI canvas with proper tip-to-tail addition.
 */

const DEFAULTS = {
  showComponents: true,
  showResultant: true,
  showGrid: true,
  showAngles: true,
  showValues: true,
  showSimpleSteps: true,
  snapToGrid: false,
  viewScale: 1,
};

export const defaultParams = { ...DEFAULTS };

export const equationSections = [
  {
    title: 'Vector Addition',
    content:
      'Two vectors are added by placing them tip-to-tail. The resultant goes from the tail of the first to the tip of the last.',
    equations: [
      { latex: String.raw`\vec{s} = \vec{a} + \vec{b}`, description: 'Resultant vector' },
      {
        latex: String.raw`s_x = a_x + b_x,\; s_y = a_y + b_y`,
        description: 'Component-wise addition',
      },
    ],
  },
  {
    title: 'Magnitude & Direction',
    content: 'The magnitude and direction of any vector follow from its components.',
    equations: [
      { latex: String.raw`|\vec{v}| = \sqrt{v_x^2 + v_y^2}`, description: 'Magnitude' },
      { latex: String.raw`\theta = \arctan(v_y / v_x)`, description: 'Direction angle' },
    ],
  },
];

export const equations = equationSections.flatMap((s) => s.equations || []);

export const controls = [
  { key: 'showComponents', label: 'Show Components', type: 'toggle' },
  { key: 'showResultant', label: 'Show Resultant', type: 'toggle' },
  { key: 'showGrid', label: 'Show Grid', type: 'toggle' },
  { key: 'showAngles', label: 'Show Angles', type: 'toggle' },
  { key: 'showValues', label: 'Show Labels', type: 'toggle' },
  { key: 'showSimpleSteps', label: 'Show Simple Steps', type: 'toggle' },
  { key: 'snapToGrid', label: 'Snap to Grid', type: 'toggle' },
];

export const graphParams = [
  { key: 'mag_a', label: '|a|' },
  { key: 'mag_b', label: '|b|' },
  { key: 'mag_s', label: '|s| (Resultant)' },
];

export const scenarios = [
  { name: 'Right Angle', description: 'Two perpendicular vectors.', params: {} },
  { name: 'Opposite', description: 'Vectors in opposite directions.', params: {} },
  { name: 'Same Direction', description: 'Vectors pointing the same way.', params: {} },
  { name: '120 deg Apart', description: 'Equal magnitude, 120 degrees apart.', params: {} },
];

export const guidedExperiments = [
  {
    title: 'Pythagorean Theorem',
    steps: [
      'Drag vector a so it is purely horizontal (e.g. ax=6, ay=0).',
      'Drag vector b so it is purely vertical (e.g. bx=0, by=8).',
      'The resultant |s| should equal sqrt(6^2+8^2) = 10.',
      'Toggle Components to see the right triangle.',
    ],
  },
  {
    title: 'Cancellation',
    steps: [
      'Set vector a = (5, 3).',
      'Set vector b = (-5, -3).',
      'Observe the resultant shrinks to zero.',
      'Adjust vector b slightly - how sensitive is the resultant?',
    ],
  },
];

export const classroomGuide = {
  objective:
    'Students will explain vector addition as component addition and predict the direction of a resultant from two input vectors.',
  starter: [
    'Ask: if one student walks 6 steps east and 3 steps north, then another move adds 4 steps east and 2 steps south, where do they end up?',
    'Have students make a quick sketch before the simulation is shown.',
  ],
  teacherMoves: [
    'Start with the default vectors and point to the bottom equation strip before touching the controls.',
    'Drag only vector b first. Emphasize that the red ghost copy is the same vector moved tip-to-tail.',
    'Toggle components off, ask for a prediction, then toggle them back on to verify with x and y parts.',
    'Use Snap to Grid when students begin calculating values at their desks.',
  ],
  studentChecks: [
    'What happens to sx if only bx changes?',
    'Can a long vector and a short vector produce a small resultant? Show an example.',
    'Which is easier to add: magnitudes and angles, or x and y components?',
  ],
  exitTicket:
    'In one sentence: why does the resultant start at the first tail and end at the final tip?',
};

export function create(canvas, initialParams) {
  const ctx = canvas.getContext('2d');
  let dpr = window.devicePixelRatio || 1;
  let p = { ...DEFAULTS, ...initialParams };
  let simTime = 0;
  let running = false;
  let raf;

  const BASE_UNIT = 30;
  const COLORS = {
    ink: '#172033',
    paper: '#f4f9ff',
    gridMinor: '#d6e4f0',
    gridMajor: '#b5c9dc',
    axis: '#27384d',
    blue: '#075fca',
    blueDark: '#023d87',
    red: '#c22621',
    redDark: '#861411',
    green: '#138145',
    greenDark: '#0b5630',
    amber: '#f59e0b',
  };

  let vecA = { dx: 6, dy: 3 };
  let vecB = { dx: 4, dy: -2 };
  let tailA = { x: -5, y: -1 };
  let tailB = { x: -1, y: -4 };

  let dragging = null;
  let hover = null;

  function unit() {
    const scale = Number.isFinite(p.viewScale) ? p.viewScale : 1;
    const requested = BASE_UNIT * Math.max(0.55, Math.min(1.7, scale));
    const verticalFit = Math.max(14, (cssH() - 126) / 9);
    const horizontalFit = Math.max(14, (cssW() - 120) / 18);
    return Math.min(requested, verticalFit, horizontalFit);
  }
  function cssW() {
    return canvas.width / dpr;
  }
  function cssH() {
    return canvas.height / dpr;
  }
  function ox() {
    return cssW() / 2;
  }
  function oy() {
    if (cssH() < 280) return cssH() / 2 + 10;
    return cssH() / 2 + 24;
  }
  function g2x(gx) {
    return ox() + gx * unit();
  }
  function g2y(gy) {
    return oy() - gy * unit();
  }
  function x2g(px) {
    return (px - ox()) / unit();
  }
  function y2g(py) {
    return -(py - oy()) / unit();
  }
  function snap(v) {
    return p.snapToGrid ? Math.round(v) : v;
  }
  function mag(dx, dy) {
    return Math.hypot(dx, dy);
  }
  function degOf(dx, dy) {
    return (Math.atan2(dy, dx) * 180) / Math.PI;
  }
  function cssMouse(e) {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  function setupCanvas() {
    dpr = window.devicePixelRatio || 1;
    const wrapper = canvas.parentElement;
    if (!wrapper) return;
    const w = wrapper.offsetWidth;
    const h = wrapper.offsetHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
  }

  function render() {
    const W = cssW();
    const H = cssH();
    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;

    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#ffffff');
    bg.addColorStop(0.44, COLORS.paper);
    bg.addColorStop(1, '#e8f1f9');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    if (p.showGrid) drawGrid(W, H);
    drawTitlePlate(W);
    drawTipToTailConstruction();
    drawVec(vecA, tailA, COLORS.blue, COLORS.blueDark, 'a', hover === 'a');
    drawVec(vecB, tailB, COLORS.red, COLORS.redDark, 'b', hover === 'b');
    if (p.showResultant) drawResultant();
    drawHUD();
    drawStepStrip(W, H);
    ctx.restore();
  }

  function drawGrid(W, H) {
    const o = { x: Math.round(ox()) + 0.5, y: Math.round(oy()) + 0.5 };
    const spacing = unit();

    ctx.lineWidth = 1;
    ctx.strokeStyle = COLORS.gridMinor;
    for (let gx = Math.floor(-o.x / spacing); gx <= Math.ceil((W - o.x) / spacing); gx++) {
      const x = Math.round(g2x(gx)) + 0.5;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    for (let gy = Math.floor(-(H - o.y) / spacing); gy <= Math.ceil(o.y / spacing); gy++) {
      const y = Math.round(g2y(gy)) + 0.5;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }

    ctx.strokeStyle = COLORS.gridMajor;
    for (let gx = Math.floor(-o.x / spacing); gx <= Math.ceil((W - o.x) / spacing); gx++) {
      if (gx % 5 !== 0) continue;
      const x = Math.round(g2x(gx)) + 0.5;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    for (let gy = Math.floor(-(H - o.y) / spacing); gy <= Math.ceil(o.y / spacing); gy++) {
      if (gy % 5 !== 0) continue;
      const y = Math.round(g2y(gy)) + 0.5;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }

    ctx.strokeStyle = COLORS.axis;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, o.y);
    ctx.lineTo(W, o.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(o.x, 0);
    ctx.lineTo(o.x, H);
    ctx.stroke();

    ctx.fillStyle = COLORS.axis;
    ctx.beginPath();
    ctx.moveTo(W - 4, o.y);
    ctx.lineTo(W - 16, o.y - 6);
    ctx.lineTo(W - 16, o.y + 6);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(o.x, 4);
    ctx.lineTo(o.x - 6, 16);
    ctx.lineTo(o.x + 6, 16);
    ctx.fill();

    ctx.fillStyle = COLORS.ink;
    ctx.font = '800 16px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText('x', W - 21, o.y - 13);
    ctx.fillText('y', o.x + 12, 20);

    ctx.font = '700 11px "JetBrains Mono", monospace';
    ctx.fillStyle = '#39546c';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (let i = -50; i <= 50; i++) {
      if (i === 0 || i % 5 !== 0) continue;
      const x = Math.round(g2x(i)) + 0.5;
      if (x > 20 && x < W - 20) {
        ctx.beginPath();
        ctx.moveTo(x, o.y - 4);
        ctx.lineTo(x, o.y + 4);
        ctx.stroke();
        ctx.fillText(String(i), x, o.y + 8);
      }
    }
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let i = -50; i <= 50; i++) {
      if (i === 0 || i % 5 !== 0) continue;
      const y = Math.round(g2y(i)) + 0.5;
      if (y > 20 && y < H - 10) {
        ctx.beginPath();
        ctx.moveTo(o.x - 4, y);
        ctx.lineTo(o.x + 4, y);
        ctx.stroke();
        ctx.fillText(String(i), o.x - 8, y);
      }
    }
    ctx.textBaseline = 'alphabetic';
  }

  function drawTitlePlate(W) {
    if (W < 520 || cssH() < 260) return;
    ctx.save();
    const x = Math.max(16, W / 2 - 168);
    const y = 12;
    const w = 336;
    const h = 34;
    const grd = ctx.createLinearGradient(0, y, 0, y + h);
    grd.addColorStop(0, '#fefefe');
    grd.addColorStop(1, '#d9e8f4');
    ctx.fillStyle = grd;
    ctx.strokeStyle = '#8ca9bf';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 4);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = COLORS.ink;
    ctx.font = '900 13px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('DRAG TIPS OR TAILS - SUM STAYS SIMPLE', x + w / 2, y + 22);
    ctx.restore();
  }

  function drawStepStrip(W, H) {
    if (!p.showSimpleSteps || W < 520 || H < 330) return;
    const sx = vecA.dx + vecB.dx;
    const sy = vecA.dy + vecB.dy;
    const w = Math.min(760, W - 28);
    const x = (W - w) / 2;
    const y = H - 64;
    const h = 44;
    ctx.save();
    const grd = ctx.createLinearGradient(0, y, 0, y + h);
    grd.addColorStop(0, '#ffffff');
    grd.addColorStop(1, '#edf5fc');
    ctx.fillStyle = grd;
    ctx.strokeStyle = '#91adc4';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 5);
    ctx.fill();
    ctx.stroke();

    ctx.font = '900 13px "JetBrains Mono", monospace';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillStyle = COLORS.blueDark;
    ctx.fillText(`a (${vecA.dx.toFixed(1)}, ${vecA.dy.toFixed(1)})`, x + w * 0.18, y + 23);
    ctx.fillStyle = COLORS.ink;
    ctx.fillText('+', x + w * 0.34, y + 23);
    ctx.fillStyle = COLORS.redDark;
    ctx.fillText(`b (${vecB.dx.toFixed(1)}, ${vecB.dy.toFixed(1)})`, x + w * 0.5, y + 23);
    ctx.fillStyle = COLORS.ink;
    ctx.fillText('=', x + w * 0.66, y + 23);
    ctx.fillStyle = COLORS.greenDark;
    ctx.fillText(`s (${sx.toFixed(1)}, ${sy.toFixed(1)})`, x + w * 0.82, y + 23);
    ctx.restore();
  }

  function arrowBadge(text, x, y, color) {
    ctx.font = '800 10px "JetBrains Mono", monospace';
    const w = Math.ceil(ctx.measureText(text).width) + 16;
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(x, y, w, 22, 4);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x + 8, y + 11);
    ctx.textBaseline = 'alphabetic';
  }

  function arrow(x1, y1, x2, y2, color, darkColor, lw, head, options = {}) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.hypot(dx, dy);
    if (len < 2) return;
    const ux = dx / len;
    const uy = dy / len;

    if (!options.ghost) {
      ctx.strokeStyle = 'rgba(255,255,255,0.92)';
      ctx.lineWidth = lw + 4;
      ctx.lineCap = 'square';
      ctx.lineJoin = 'miter';
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2 - ux * head * 0.58, y2 - uy * head * 0.58);
      ctx.stroke();
    }

    ctx.strokeStyle = darkColor;
    ctx.lineWidth = lw + 1.6;
    ctx.lineCap = 'square';
    ctx.lineJoin = 'miter';
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2 - ux * head * 0.6, y2 - uy * head * 0.6);
    ctx.stroke();

    ctx.strokeStyle = color;
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2 - ux * head * 0.6, y2 - uy * head * 0.6);
    ctx.stroke();

    ctx.fillStyle = darkColor;
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - ux * head - uy * head * 0.38, y2 - uy * head + ux * head * 0.38);
    ctx.lineTo(x2 - ux * head + uy * head * 0.38, y2 - uy * head - ux * head * 0.38);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x2 - ux * 2, y2 - uy * 2);
    ctx.lineTo(x2 - ux * (head - 2) - uy * head * 0.25, y2 - uy * (head - 2) + ux * head * 0.25);
    ctx.lineTo(x2 - ux * (head - 2) + uy * head * 0.25, y2 - uy * (head - 2) - ux * head * 0.25);
    ctx.closePath();
    ctx.fill();
  }

  function drawVec(v, tail, color, darkColor, label, isHover) {
    const x1 = g2x(tail.x);
    const y1 = g2y(tail.y);
    const x2 = g2x(tail.x + v.dx);
    const y2 = g2y(tail.y + v.dy);

    if (p.showComponents && Math.abs(v.dx) > 0.01 && Math.abs(v.dy) > 0.01) {
      const cx = g2x(tail.x + v.dx);
      const cy = g2y(tail.y);
      ctx.strokeStyle = `${color}66`;
      ctx.lineWidth = 2;
      ctx.setLineDash([7, 4]);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(cx, cy);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.strokeStyle = `${color}30`;
      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(g2x(tail.x), y2);
      ctx.lineTo(x1, y1);
      ctx.stroke();
      ctx.setLineDash([]);

      if (p.showValues) {
        arrowBadge(
          `${label}x = ${v.dx.toFixed(1)}`,
          Math.min(x1, cx) + Math.abs(x1 - cx) / 2 - 38,
          y1 + (v.dy >= 0 ? 11 : -30),
          darkColor,
        );
        arrowBadge(
          `${label}y = ${v.dy.toFixed(1)}`,
          cx + (v.dx >= 0 ? 10 : -86),
          Math.min(cy, y2) + Math.abs(cy - y2) / 2 - 11,
          darkColor,
        );
      }
    }

    const lw = isHover ? 5.2 : 4.2;
    arrow(x1, y1, x2, y2, color, darkColor, lw, 16);

    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;
    const vlen = mag(v.dx, v.dy);
    if (vlen > 0.3) {
      const nx = -v.dy / vlen;
      const ny = v.dx / vlen;
      const lx = mx + nx * 18;
      const ly = my - ny * 18;
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = darkColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(lx, ly, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = darkColor;
      ctx.font = '900 16px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, lx, ly + 0.5);
      ctx.textBaseline = 'alphabetic';
    }

    if (p.showAngles && vlen > 0.8) {
      const ang = Math.atan2(v.dy, v.dx);
      const r = 25;
      ctx.strokeStyle = `${color}aa`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      if (ang >= 0) ctx.arc(x1, y1, r, 0, -ang, true);
      else ctx.arc(x1, y1, r, 0, -ang, false);
      ctx.stroke();

      const mid = -ang / 2;
      ctx.fillStyle = darkColor;
      ctx.font = '800 10px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(
        `${Math.abs(degOf(v.dx, v.dy)).toFixed(1)} deg`,
        x1 + Math.cos(mid) * (r + 20),
        y1 + Math.sin(mid) * (r + 20) + 3,
      );
    }

    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = darkColor;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(x1, y1, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = isHover ? COLORS.amber : color;
    ctx.beginPath();
    ctx.arc(x2, y2, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  function drawTipToTailConstruction() {
    if (!p.showSimpleSteps || !p.showResultant) return;
    const aTipX = g2x(tailA.x + vecA.dx);
    const aTipY = g2y(tailA.y + vecA.dy);
    const bGhostTipX = g2x(tailA.x + vecA.dx + vecB.dx);
    const bGhostTipY = g2y(tailA.y + vecA.dy + vecB.dy);
    const tailX = g2x(tailA.x);
    const tailY = g2y(tailA.y);

    ctx.setLineDash([9, 5]);
    ctx.strokeStyle = '#596b7d';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(aTipX, aTipY);
    ctx.lineTo(aTipX + 34, aTipY - 34);
    ctx.stroke();
    ctx.setLineDash([]);
    if (cssW() > 780 && cssH() > 420) {
      arrowBadge('put b tail here', aTipX + 38, aTipY - 48, COLORS.redDark);
    }

    ctx.globalAlpha = 0.52;
    arrow(aTipX, aTipY, bGhostTipX, bGhostTipY, COLORS.red, COLORS.redDark, 3, 13, {
      ghost: true,
    });
    ctx.globalAlpha = 1;

    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 1.2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(tailX, tailY);
    ctx.lineTo(bGhostTipX, bGhostTipY);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  function drawResultant() {
    const sx = vecA.dx + vecB.dx;
    const sy = vecA.dy + vecB.dy;
    const aTipX = g2x(tailA.x + vecA.dx);
    const aTipY = g2y(tailA.y + vecA.dy);
    const sumTipX = g2x(tailA.x + vecA.dx + vecB.dx);
    const sumTipY = g2y(tailA.y + vecA.dy + vecB.dy);
    const bTipX = g2x(tailA.x + vecB.dx);
    const bTipY = g2y(tailA.y + vecB.dy);

    ctx.globalAlpha = 0.18;
    arrow(g2x(tailA.x), g2y(tailA.y), bTipX, bTipY, COLORS.red, COLORS.redDark, 2, 10, {
      ghost: true,
    });
    arrow(bTipX, bTipY, sumTipX, sumTipY, COLORS.blue, COLORS.blueDark, 2, 10, {
      ghost: true,
    });
    ctx.globalAlpha = 1;

    ctx.strokeStyle = '#13814588';
    ctx.lineWidth = 2;
    ctx.setLineDash([7, 5]);
    ctx.beginPath();
    ctx.moveTo(aTipX, aTipY);
    ctx.lineTo(sumTipX, sumTipY);
    ctx.lineTo(bTipX, bTipY);
    ctx.stroke();
    ctx.setLineDash([]);

    const rx1 = g2x(tailA.x);
    const ry1 = g2y(tailA.y);
    arrow(rx1, ry1, sumTipX, sumTipY, COLORS.green, COLORS.greenDark, 5.2, 18);

    const rmx = (rx1 + sumTipX) / 2;
    const rmy = (ry1 + sumTipY) / 2;
    const slen = mag(sx, sy);
    if (slen > 0.3) {
      const nx = -sy / slen;
      const ny = sx / slen;
      ctx.fillStyle = COLORS.greenDark;
      ctx.font = '900 17px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('s', rmx + nx * 20, rmy - ny * 20);
      if (p.showValues) {
        ctx.font = '800 11px "JetBrains Mono", monospace';
        ctx.fillText('|s|=' + slen.toFixed(2), rmx + nx * 20, rmy - ny * 20 + 16);
      }
      ctx.textBaseline = 'alphabetic';
    }
  }

  function drawHUD() {
    if (cssH() < 220 || cssW() < 440) return;
    const pad = 14;
    const lineH = 18;
    const rows = [];
    [
      { v: vecA, l: 'a', c: COLORS.blueDark },
      { v: vecB, l: 'b', c: COLORS.redDark },
    ].forEach(({ v, l, c }) => {
      const m = mag(v.dx, v.dy);
      const a = degOf(v.dx, v.dy);
      rows.push({
        c,
        text: `${l} = (${v.dx.toFixed(1)}, ${v.dy.toFixed(1)})   |${l}|=${m.toFixed(2)}   theta=${a.toFixed(1)} deg`,
      });
    });

    if (p.showResultant) {
      const sx = vecA.dx + vecB.dx;
      const sy = vecA.dy + vecB.dy;
      const sm = mag(sx, sy);
      const sa = degOf(sx, sy);
      rows.push({
        c: COLORS.greenDark,
        text: `s = (${sx.toFixed(1)}, ${sy.toFixed(1)})   |s|=${sm.toFixed(2)}   theta=${sa.toFixed(1)} deg`,
      });
    }

    const boxW = Math.min(392, cssW() - 28);
    const boxH = rows.length * lineH + 28;
    const grd = ctx.createLinearGradient(0, pad, 0, pad + boxH);
    grd.addColorStop(0, 'rgba(255,255,255,0.98)');
    grd.addColorStop(1, 'rgba(235,244,252,0.98)');
    ctx.fillStyle = grd;
    ctx.strokeStyle = '#91adc4';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(pad, pad, boxW, boxH, 5);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#d7e7f4';
    ctx.fillRect(pad + 1, pad + 1, boxW - 2, 21);
    ctx.fillStyle = COLORS.ink;
    ctx.font = '900 9px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText('VECTOR TELEMETRY', pad + 10, pad + 14);

    rows.forEach((r, i) => {
      const ry = pad + 28 + i * lineH;
      ctx.fillStyle = r.c;
      ctx.font = '800 10px "JetBrains Mono", monospace';
      ctx.fillText(r.text, pad + 10, ry + 4);
    });
  }

  function hitTest(mx, my) {
    const tests = [
      { vec: vecA, tail: tailA, id: 'a' },
      { vec: vecB, tail: tailB, id: 'b' },
    ];
    for (let i = tests.length - 1; i >= 0; i--) {
      const { vec, tail, id } = tests[i];
      const x1 = g2x(tail.x);
      const y1 = g2y(tail.y);
      const x2 = g2x(tail.x + vec.dx);
      const y2 = g2y(tail.y + vec.dy);
      if (Math.hypot(mx - x2, my - y2) < 14) return { vec: id, part: 'tip' };
      if (Math.hypot(mx - x1, my - y1) < 14) return { vec: id, part: 'tail' };

      const A = mx - x1;
      const B = my - y1;
      const C = x2 - x1;
      const D = y2 - y1;
      const len2 = C * C + D * D;
      if (len2 > 1) {
        const t = Math.max(0, Math.min(1, (A * C + B * D) / len2));
        if (Math.hypot(mx - (x1 + t * C), my - (y1 + t * D)) < 12) {
          return { vec: id, part: 'body', ox: mx - x1, oy: my - y1 };
        }
      }
    }
    return null;
  }

  function getVecAndTail(id) {
    return id === 'a' ? { vec: vecA, tail: tailA } : { vec: vecB, tail: tailB };
  }

  function onDown(e) {
    const m = cssMouse(e);
    const hit = hitTest(m.x, m.y);
    if (hit) {
      dragging = hit;
      canvas.setPointerCapture(e.pointerId);
      canvas.style.cursor = hit.part === 'body' ? 'grabbing' : 'crosshair';
    }
  }

  function onMove(e) {
    const m = cssMouse(e);
    if (dragging) {
      const { vec, tail } = getVecAndTail(dragging.vec);
      const gx = snap(x2g(m.x));
      const gy = snap(y2g(m.y));

      if (dragging.part === 'tip') {
        vec.dx = snap(gx - tail.x);
        vec.dy = snap(gy - tail.y);
      } else if (dragging.part === 'tail') {
        const tipX = tail.x + vec.dx;
        const tipY = tail.y + vec.dy;
        tail.x = gx;
        tail.y = gy;
        vec.dx = snap(tipX - tail.x);
        vec.dy = snap(tipY - tail.y);
      } else {
        tail.x = snap(x2g(m.x - dragging.ox));
        tail.y = snap(y2g(m.y - dragging.oy));
      }
      render();
    } else {
      const hit = hitTest(m.x, m.y);
      const newH = hit ? hit.vec : null;
      if (newH !== hover) {
        hover = newH;
        render();
      }
      canvas.style.cursor = hit ? (hit.part === 'body' ? 'grab' : 'crosshair') : 'default';
    }
  }

  function onUp(e) {
    if (dragging) {
      canvas.releasePointerCapture(e.pointerId);
      dragging = null;
      canvas.style.cursor = 'default';
    }
  }

  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointercancel', onUp);

  function resetState() {
    vecA.dx = 6;
    vecA.dy = 3;
    vecB.dx = 4;
    vecB.dy = -2;
    tailA.x = -5;
    tailA.y = -1;
    tailB.x = -1;
    tailB.y = -4;
    simTime = 0;
  }

  function loop() {
    if (!running) return;
    simTime += 0.016;
    render();
    raf = requestAnimationFrame(loop);
  }

  setupCanvas();
  resetState();
  render();

  return {
    start() {
      running = true;
      loop();
    },
    stop() {
      running = false;
      cancelAnimationFrame(raf);
    },
    reset() {
      resetState();
      render();
    },
    setParams(next) {
      p = { ...p, ...next };
      setupCanvas();
      render();
    },
    getData() {
      const sx = vecA.dx + vecB.dx;
      const sy = vecA.dy + vecB.dy;
      return {
        time: simTime,
        mag_a: mag(vecA.dx, vecA.dy),
        mag_b: mag(vecB.dx, vecB.dy),
        mag_s: mag(sx, sy),
        ax: vecA.dx,
        ay: vecA.dy,
        bx: vecB.dx,
        by: vecB.dy,
        sx,
        sy,
        theta_a: degOf(vecA.dx, vecA.dy),
        theta_b: degOf(vecB.dx, vecB.dy),
        theta_s: degOf(sx, sy),
      };
    },
    destroy() {
      running = false;
      cancelAnimationFrame(raf);
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onUp);
    },
  };
}
