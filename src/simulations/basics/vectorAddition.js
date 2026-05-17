/**
 * Vector Addition Lab – crisp HiDPI canvas with proper tip-to-tail addition.
 */

const DEFAULTS = {
  showComponents: true,
  showResultant: true,
  showGrid: true,
  showAngles: true,
  showValues: true,
  snapToGrid: false,
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
  { name: '120\u00B0 Apart', description: 'Equal magnitude, 120\u00B0 apart.', params: {} },
];

export const guidedExperiments = [
  {
    title: 'Pythagorean Theorem',
    steps: [
      'Drag vector a so it is purely horizontal (e.g. ax=6, ay=0).',
      'Drag vector b so it is purely vertical (e.g. bx=0, by=8).',
      'The resultant |s| should equal \u221A(6\u00B2+8\u00B2) = 10.',
      'Toggle Components to see the right triangle.',
    ],
  },
  {
    title: 'Cancellation',
    steps: [
      'Set vector a = (5, 3).',
      'Set vector b = (\u22125, \u22123).',
      'Observe the resultant shrinks to zero.',
      'Adjust vector b slightly \u2014 how sensitive is the resultant?',
    ],
  },
];

/* ════════════════════════ Canvas simulation ════════════════════════ */

export function create(canvas, initialParams) {
  const ctx = canvas.getContext('2d');
  let dpr = window.devicePixelRatio || 1;
  let p = { ...DEFAULTS, ...initialParams };
  let simTime = 0;
  let running = false;
  let raf;

  const UNIT = 30; // CSS pixels per grid unit

  // Vectors in grid units. Tail of a is at tailA; tail of b is at tailB.
  let vecA = { dx: 8, dy: 5 };
  let vecB = { dx: 5, dy: -4 };
  let tailA = { x: -6, y: -3 };
  let tailB = { x: 1, y: 2 };

  let dragging = null; // { vec:'a'|'b', part:'tip'|'tail'|'body', ox, oy }
  let hover = null;

  /* ── coordinate helpers ── */
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
    return cssH() / 2;
  }
  function g2x(gx) {
    return ox() + gx * UNIT;
  }
  function g2y(gy) {
    return oy() - gy * UNIT;
  }
  function x2g(px) {
    return (px - ox()) / UNIT;
  }
  function y2g(py) {
    return -(py - oy()) / UNIT;
  }
  function snap(v) {
    return p.snapToGrid ? Math.round(v) : v;
  }
  function mag(dx, dy) {
    return Math.sqrt(dx * dx + dy * dy);
  }
  function degOf(dx, dy) {
    return (Math.atan2(dy, dx) * 180) / Math.PI;
  }

  function cssMouse(e) {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  /* ── HiDPI setup ── */
  function setupCanvas() {
    dpr = window.devicePixelRatio || 1;
    const wrapper = canvas.parentElement;
    if (!wrapper) return;
    const w = wrapper.offsetWidth;
    const h = wrapper.offsetHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
  }

  /* ── drawing ── */
  function render() {
    const W = cssW(),
      H = cssH();
    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Background
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, W, H);

    if (p.showGrid) drawGrid(W, H);

    // Draw vectors
    drawVec(vecA, tailA, '#1d4ed8', 'a', hover === 'a');
    drawVec(vecB, tailB, '#b91c1c', 'b', hover === 'b');

    if (p.showResultant) drawResultant();

    drawHUD();
    ctx.restore();
  }

  function drawGrid(W, H) {
    const o = { x: Math.round(ox()) + 0.5, y: Math.round(oy()) + 0.5 };

    // Minor grid
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    for (let gx = Math.floor(-o.x / UNIT); gx <= Math.ceil((W - o.x) / UNIT); gx++) {
      const x = Math.round(g2x(gx)) + 0.5;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    for (let gy = Math.floor(-(H - o.y) / UNIT); gy <= Math.ceil(o.y / UNIT); gy++) {
      const y = Math.round(g2y(gy)) + 0.5;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, o.y);
    ctx.lineTo(W, o.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(o.x, 0);
    ctx.lineTo(o.x, H);
    ctx.stroke();

    // Axis arrows
    ctx.fillStyle = '#334155';
    // x-arrow
    ctx.beginPath();
    ctx.moveTo(W - 4, o.y);
    ctx.lineTo(W - 14, o.y - 5);
    ctx.lineTo(W - 14, o.y + 5);
    ctx.fill();
    // y-arrow
    ctx.beginPath();
    ctx.moveTo(o.x, 4);
    ctx.lineTo(o.x - 5, 14);
    ctx.lineTo(o.x + 5, 14);
    ctx.fill();

    // Labels
    ctx.fillStyle = '#1e293b';
    ctx.font = 'italic 16px "Source Serif 4", serif';
    ctx.textAlign = 'left';
    ctx.fillText('x', W - 18, o.y - 12);
    ctx.fillText('y', o.x + 12, 18);

    // Tick numbers (every 5)
    ctx.font = '11px "JetBrains Mono", monospace';
    ctx.fillStyle = '#475569';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (let i = -50; i <= 50; i++) {
      if (i === 0) continue;
      if (i % 5 === 0) {
        const x = Math.round(g2x(i)) + 0.5;
        if (x > 20 && x < W - 20) {
          ctx.beginPath();
          ctx.moveTo(x, o.y - 4);
          ctx.lineTo(x, o.y + 4);
          ctx.stroke();
          ctx.fillText(String(i), x, o.y + 8);
        }
      }
    }
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let i = -50; i <= 50; i++) {
      if (i === 0) continue;
      if (i % 5 === 0) {
        const y = Math.round(g2y(i)) + 0.5;
        if (y > 20 && y < H - 10) {
          ctx.beginPath();
          ctx.moveTo(o.x - 4, y);
          ctx.lineTo(o.x + 4, y);
          ctx.stroke();
          ctx.fillText(String(i), o.x - 8, y);
        }
      }
    }
    ctx.textBaseline = 'alphabetic';
  }

  function arrow(x1, y1, x2, y2, color, lw, head) {
    const dx = x2 - x1,
      dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < 2) return;
    const ux = dx / len,
      uy = dy / len;

    ctx.strokeStyle = color;
    ctx.lineWidth = lw;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2 - ux * head * 0.6, y2 - uy * head * 0.6);
    ctx.stroke();

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - ux * head - uy * head * 0.35, y2 - uy * head + ux * head * 0.35);
    ctx.lineTo(x2 - ux * head + uy * head * 0.35, y2 - uy * head - ux * head * 0.35);
    ctx.closePath();
    ctx.fill();
  }

  function drawVec(v, tail, color, label, isHover) {
    const x1 = g2x(tail.x),
      y1 = g2y(tail.y);
    const x2 = g2x(tail.x + v.dx),
      y2 = g2y(tail.y + v.dy);

    // Component dashed lines
    if (p.showComponents && Math.abs(v.dx) > 0.01 && Math.abs(v.dy) > 0.01) {
      const cx = g2x(tail.x + v.dx),
        cy = g2y(tail.y);
      ctx.strokeStyle = color + '55';
      ctx.lineWidth = 1.2;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(cx, cy);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      // dashed from tip back
      ctx.strokeStyle = color + '30';
      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(g2x(tail.x), y2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(g2x(tail.x), y2);
      ctx.lineTo(x1, y1);
      ctx.stroke();
      ctx.setLineDash([]);

      if (p.showValues) {
        ctx.fillStyle = color + 'bb';
        ctx.font = '600 10px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        const offy = v.dy >= 0 ? 14 : -6;
        ctx.fillText(`${label}x=${v.dx.toFixed(1)}`, (x1 + cx) / 2, y1 + offy);
        const offx = v.dx >= 0 ? 24 : -24;
        ctx.textAlign = v.dx >= 0 ? 'left' : 'right';
        ctx.fillText(`${label}y=${v.dy.toFixed(1)}`, cx + offx, (cy + y2) / 2 + 4);
        ctx.textAlign = 'left';
      }
    }

    // Main arrow
    const lw = isHover ? 3.2 : 2.4;
    arrow(x1, y1, x2, y2, color, lw, 11);

    // Label alongside vector
    const mx = (x1 + x2) / 2,
      my = (y1 + y2) / 2;
    const vlen = mag(v.dx, v.dy);
    if (vlen > 0.3) {
      const nx = -v.dy / vlen,
        ny = v.dx / vlen;
      const lx = mx + nx * 16,
        ly = my - ny * 16;
      ctx.fillStyle = color;
      ctx.font = 'bold italic 16px "Source Serif 4", serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, lx, ly);
      ctx.textBaseline = 'alphabetic';
    }

    // Angle arc
    if (p.showAngles && vlen > 0.8) {
      const ang = Math.atan2(v.dy, v.dx);
      const r = 20;
      ctx.strokeStyle = color + '88';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      if (ang >= 0) ctx.arc(x1, y1, r, 0, -ang, true);
      else ctx.arc(x1, y1, r, 0, -ang, false);
      ctx.stroke();

      const mid = -ang / 2;
      ctx.fillStyle = color + 'cc';
      ctx.font = '600 10px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(
        Math.abs(degOf(v.dx, v.dy)).toFixed(1) + '\u00B0',
        x1 + Math.cos(mid) * (r + 14),
        y1 + Math.sin(mid) * (r + 14) + 3,
      );
    }

    // Handle dots
    // Tail
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x1, y1, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Tip
    ctx.fillStyle = isHover ? '#ffffff' : color;
    ctx.beginPath();
    ctx.arc(x2, y2, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  function drawResultant() {
    const sx = vecA.dx + vecB.dx;
    const sy = vecA.dy + vecB.dy;

    // Tip-to-tail ghost: draw b\u20D7 starting from tip of a\u20D7
    const aTipX = g2x(tailA.x + vecA.dx),
      aTipY = g2y(tailA.y + vecA.dy);
    const sumTipX = g2x(tailA.x + vecA.dx + vecB.dx);
    const sumTipY = g2y(tailA.y + vecA.dy + vecB.dy);

    // Ghost b
    ctx.globalAlpha = 0.28;
    arrow(aTipX, aTipY, sumTipX, sumTipY, '#b91c1c', 1.8, 9);
    ctx.globalAlpha = 1;

    // Also draw ghost a from tail of b for the parallelogram
    const bTipX = g2x(tailA.x + vecB.dx),
      bTipY = g2y(tailA.y + vecB.dy);
    ctx.globalAlpha = 0.18;
    arrow(g2x(tailA.x), g2y(tailA.y), bTipX, bTipY, '#b91c1c', 1.4, 8);
    arrow(bTipX, bTipY, sumTipX, sumTipY, '#1d4ed8', 1.4, 8);
    ctx.globalAlpha = 1;

    // Parallelogram dashed outline
    ctx.strokeStyle = '#15803d44';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(aTipX, aTipY);
    ctx.lineTo(sumTipX, sumTipY);
    ctx.lineTo(bTipX, bTipY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Resultant arrow from tailA
    const rx1 = g2x(tailA.x),
      ry1 = g2y(tailA.y);
    arrow(rx1, ry1, sumTipX, sumTipY, '#15803d', 3.5, 14);

    // Label
    const rmx = (rx1 + sumTipX) / 2,
      rmy = (ry1 + sumTipY) / 2;
    const slen = mag(sx, sy);
    if (slen > 0.3) {
      const nx = -sy / slen,
        ny = sx / slen;
      ctx.fillStyle = '#15803d';
      ctx.font = 'bold italic 16px "Source Serif 4", serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('s', rmx + nx * 20, rmy - ny * 20);
      if (p.showValues) {
        ctx.font = '600 11px "JetBrains Mono", monospace';
        ctx.fillText('|s|=' + slen.toFixed(2), rmx + nx * 20, rmy - ny * 20 + 15);
      }
      ctx.textBaseline = 'alphabetic';
    }
  }

  function drawHUD() {
    const pad = 14;
    const lineH = 18;
    const rows = [];

    [
      { v: vecA, l: 'a', c: '#1d4ed8' },
      { v: vecB, l: 'b', c: '#b91c1c' },
    ].forEach(({ v, l, c }) => {
      const m = mag(v.dx, v.dy);
      const a = degOf(v.dx, v.dy);
      rows.push({
        c,
        text: `${l} = (${v.dx.toFixed(1)}, ${v.dy.toFixed(1)})   |${l}|=${m.toFixed(2)}   \u03B8=${a.toFixed(1)}\u00B0`,
      });
    });

    if (p.showResultant) {
      const sx = vecA.dx + vecB.dx,
        sy = vecA.dy + vecB.dy;
      const sm = mag(sx, sy),
        sa = degOf(sx, sy);
      rows.push({
        c: '#15803d',
        text: `s = (${sx.toFixed(1)}, ${sy.toFixed(1)})   |s|=${sm.toFixed(2)}   \u03B8=${sa.toFixed(1)}\u00B0`,
      });
    }

    const boxW = 380,
      boxH = rows.length * lineH + 28;
    ctx.fillStyle = 'rgba(255,255,255,0.93)';
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(pad, pad, boxW, boxH, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#475569';
    ctx.font = '700 9px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText('VECTOR TELEMETRY', pad + 10, pad + 13);

    rows.forEach((r, i) => {
      const ry = pad + 26 + i * lineH;
      ctx.fillStyle = r.c;
      ctx.font = '600 11px "JetBrains Mono", monospace';
      ctx.fillText(r.text, pad + 10, ry + 4);
    });
  }

  /* ── hit testing ── */
  function hitTest(mx, my) {
    const tests = [
      { vec: vecA, tail: tailA, id: 'a' },
      { vec: vecB, tail: tailB, id: 'b' },
    ];
    // Reverse so topmost drawn wins
    for (let i = tests.length - 1; i >= 0; i--) {
      const { vec, tail, id } = tests[i];
      const x1 = g2x(tail.x),
        y1 = g2y(tail.y);
      const x2 = g2x(tail.x + vec.dx),
        y2 = g2y(tail.y + vec.dy);
      if (Math.hypot(mx - x2, my - y2) < 14) return { vec: id, part: 'tip' };
      if (Math.hypot(mx - x1, my - y1) < 14) return { vec: id, part: 'tail' };
      // Body
      const A = mx - x1,
        B = my - y1,
        C = x2 - x1,
        D = y2 - y1;
      const len2 = C * C + D * D;
      if (len2 > 1) {
        const t = Math.max(0, Math.min(1, (A * C + B * D) / len2));
        if (Math.hypot(mx - (x1 + t * C), my - (y1 + t * D)) < 10)
          return { vec: id, part: 'body', ox: mx - x1, oy: my - y1 };
      }
    }
    return null;
  }

  function getVecAndTail(id) {
    return id === 'a' ? { vec: vecA, tail: tailA } : { vec: vecB, tail: tailB };
  }

  /* ── pointer events ── */
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
      const gx = snap(x2g(m.x)),
        gy = snap(y2g(m.y));

      if (dragging.part === 'tip') {
        vec.dx = snap(gx - tail.x);
        vec.dy = snap(gy - tail.y);
      } else if (dragging.part === 'tail') {
        const tipX = tail.x + vec.dx,
          tipY = tail.y + vec.dy;
        tail.x = gx;
        tail.y = gy;
        vec.dx = snap(tipX - tail.x);
        vec.dy = snap(tipY - tail.y);
      } else {
        // body: move whole vector
        const gOx = x2g(dragging.ox),
          gOy = y2g(dragging.oy);
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

  function resetState() {
    vecA.dx = 8;
    vecA.dy = 5;
    vecB.dx = 5;
    vecB.dy = -4;
    tailA.x = -6;
    tailA.y = -3;
    tailB.x = 1;
    tailB.y = 2;
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
      // Handle resize
      setupCanvas();
      render();
    },
    getData() {
      const sx = vecA.dx + vecB.dx,
        sy = vecA.dy + vecB.dy;
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
    },
  };
}
