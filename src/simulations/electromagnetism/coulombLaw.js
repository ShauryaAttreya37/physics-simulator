/**
 * Coulomb's Law — Static Force Demonstration
 *
 * Two point charges at user-controlled positions in 2D space.
 * Displays force vectors, field lines, and the exact F = kq₁q₂/r² relationship.
 * Interactive: Drag charges anywhere on the canvas.
 */

const DEFAULTS = {
  q1: 3,
  q2: -2,
  k: 500, // Coulomb constant (visual scale)
  showFieldLines: true,
  showForceDecomp: true,
  viewScale: 1.0,
};

// Internal state for positions if not provided by params
const STATE = {
  p1: { x: -125, y: 0 },
  p2: { x: 125, y: 0 },
};

export const defaultParams = { ...DEFAULTS };

export const equationSections = [
  {
    title: 'Introduction',
    content:
      "Coulomb's Law describes the electrostatic force between two point charges. Like charges repel, opposite charges attract. The force is proportional to the product of the charges and inversely proportional to the square of the distance between them. This simulation lets you directly see how changing charge magnitudes, signs, and 2D positions affects the force.",
  },
  {
    title: "Coulomb's Law",
    equations: [
      {
        latex: String.raw`\vec{F}_{12} = k_e \frac{q_1 q_2}{r^2} \hat{r}_{12}`,
        description:
          'The force on charge 2 due to charge 1. Positive product → repulsive (force pushes apart). Negative product → attractive (force pulls together).',
      },
      {
        latex: String.raw`|\vec{F}| = k_e \frac{|q_1||q_2|}{r^2}`,
        description:
          'The magnitude of the force. Double a charge → double the force. Double the distance → quarter the force.',
      },
    ],
    variables: [
      { symbol: 'k_e', description: 'Coulomb constant = 8.99 × 10⁹ N·m²/C²' },
      { symbol: 'q₁, q₂', description: 'Electric charges (positive or negative)' },
      { symbol: 'r', description: 'Distance between the charges' },
      { symbol: 'r̂', description: 'Unit vector from one charge to the other' },
    ],
  },
  {
    title: 'Key Relationships',
    equations: [
      {
        latex: String.raw`F \propto q_1 q_2 \quad \text{(linear in each charge)}`,
        description: 'Doubling either charge doubles the force.',
      },
      {
        latex: String.raw`F \propto \frac{1}{r^2} \quad \text{(inverse-square law)}`,
        description:
          "Halving the distance quadruples the force. This is the defining feature of Coulomb's law.",
      },
    ],
  },
  {
    title: 'How to Use',
    content:
      '1. Adjust q₁ and q₂ to change charge magnitudes and signs.\n2. **Drag the charges** anywhere on the canvas to see the force vectors update in real-time.\n3. Watch force arrows grow/shrink — they obey F ∝ 1/r².\n4. Same-sign charges → arrows point outward (repulsion).\n5. Opposite-sign charges → arrows point inward (attraction).\n6. The force magnitude and distance are displayed in the HUD.',
  },
];

export const equations = [
  String.raw`\vec{F} = k_e \frac{q_1 q_2}{r^2} \hat{r}`,
  String.raw`|\vec{F}| \propto \frac{1}{r^2}`,
];

export const graphParams = [
  { key: 'force', label: 'Force |F|' },
  { key: 'distance', label: 'Distance r' },
];

export const controls = [
  { key: 'q1', label: 'Charge Q₁', min: -5, max: 5, step: 0.1 },
  { key: 'q2', label: 'Charge Q₂', min: -5, max: 5, step: 0.1 },
  { key: 'k', label: 'Force Scale k', min: 100, max: 2000, step: 10 },
  { key: 'showFieldLines', label: 'Field Lines', type: 'toggle' },
  { key: 'showForceDecomp', label: 'Show Annotations', type: 'toggle' },
];

export const scenarios = [
  {
    name: 'Opposite Charges (Attraction)',
    description: 'A positive and negative charge attract each other.',
    params: { q1: 3, q2: -3 },
  },
  {
    name: 'Like Charges (Repulsion)',
    description: 'Two positive charges repel each other.',
    params: { q1: 3, q2: 3 },
  },
  {
    name: 'Inverse-Square Demo',
    description: 'Move the charges to see force scale as 1/r².',
    params: { q1: 4, q2: -4 },
  },
  {
    name: 'Dipole Field',
    description: 'A positive and negative charge close together creating a dipole field.',
    params: { q1: 5, q2: -5 },
  },
];

export function create(canvas, initParams = {}) {
  const ctx = canvas.getContext('2d');
  const p = { ...DEFAULTS, ...initParams };
  let simTime = 0;

  // Interaction state
  const pos1 = { ...STATE.p1 };
  const pos2 = { ...STATE.p2 };
  let dragTarget = null; // 'q1' or 'q2'
  let dragOffset = { x: 0, y: 0 };

  function computeDistance() {
    return Math.hypot(pos1.x - pos2.x, pos1.y - pos2.y);
  }

  function computeForce() {
    const r = Math.max(10, computeDistance());
    const F = (p.k * p.q1 * p.q2) / (r * r);
    return F;
  }

  function pointerPosition(e) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    };
  }

  function drawFieldLines(W, H, cx, cy, scale) {
    const nLines = 16;
    ctx.lineWidth = 1;

    // We draw from both charges
    const sources = [
      { x: cx + pos1.x * scale, y: cy + pos1.y * scale, q: p.q1 },
      { x: cx + pos2.x * scale, y: cy + pos2.y * scale, q: p.q2 },
    ];

    for (const source of sources) {
      if (source.q === 0) continue;

      const absQ = Math.abs(source.q);
      const linesForThisCharge = Math.ceil(nLines * (absQ / 5));

      for (let i = 0; i < linesForThisCharge; i++) {
        const angle = (i / linesForThisCharge) * Math.PI * 2 + (source.q < 0 ? 0.1 : 0);

        ctx.beginPath();
        let fx = source.x + 10 * Math.cos(angle);
        let fy = source.y + 10 * Math.sin(angle);
        ctx.moveTo(fx, fy);

        const step = 6;
        const lineLen = 80;

        for (let s = 0; s < lineLen; s++) {
          let ex = 0,
            ey = 0;

          for (const s2 of sources) {
            const dx = fx - s2.x;
            const dy = fy - s2.y;
            const r2 = dx * dx + dy * dy + 100;
            const r = Math.sqrt(r2);
            ex += (s2.q * dx) / (r2 * r);
            ey += (s2.q * dy) / (r2 * r);
          }

          const emag = Math.sqrt(ex * ex + ey * ey);
          if (emag < 1e-10) break;

          const dir = source.q > 0 ? 1 : -1;
          fx += ((step * ex) / emag) * dir;
          fy += ((step * ey) / emag) * dir;

          ctx.lineTo(fx, fy);

          if (fx < -50 || fx > W + 50 || fy < -50 || fy > H + 50) break;

          const other = sources.find((s2) => s2 !== source);
          if (other && Math.hypot(fx - other.x, fy - other.y) < 15) break;
        }

        const gradient = ctx.createLinearGradient(source.x, source.y, fx, fy);
        const color = source.q > 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)';
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

        ctx.strokeStyle = gradient;
        ctx.stroke();
      }
    }
  }

  function drawArrow(fromX, fromY, toX, toY, color, lineWidth, headLen) {
    const dx = toX - fromX;
    const dy = toY - fromY;
    const len = Math.hypot(dx, dy);
    if (len < 2) return;

    const nx = dx / len;
    const ny = dy / len;

    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.stroke();

    // Arrowhead
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headLen * nx + headLen * 0.4 * ny, toY - headLen * ny - headLen * 0.4 * nx);
    ctx.lineTo(toX - headLen * nx - headLen * 0.4 * ny, toY - headLen * ny + headLen * 0.4 * nx);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  }

  function render() {
    const W = canvas.width;
    const H = canvas.height;
    const cx = W / 2;
    const cy = H / 2;

    // Background
    ctx.fillStyle = '#050810';
    ctx.fillRect(0, 0, W, H);

    // Subtle grid
    ctx.strokeStyle = 'rgba(255,255,255,0.02)';
    ctx.lineWidth = 0.5;
    for (let gx = 0; gx < W; gx += 40) {
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx, H);
      ctx.stroke();
    }
    for (let gy = 0; gy < H; gy += 40) {
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.lineTo(W, gy);
      ctx.stroke();
    }

    const scale = p.viewScale ?? 1.0;
    const c1x = cx + pos1.x * scale;
    const c1y = cy + pos1.y * scale;
    const c2x = cx + pos2.x * scale;
    const c2y = cy + pos2.y * scale;

    // Field lines
    if (p.showFieldLines) {
      drawFieldLines(W, H, cx, cy, scale);
    }

    // Distance line (dashed)
    ctx.setLineDash([4, 6]);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(c1x, c1y);
    ctx.lineTo(c2x, c2y);
    ctx.stroke();
    ctx.setLineDash([]);

    // Distance label
    const dist = computeDistance() * scale;
    const midX = (c1x + c2x) / 2;
    const midY = (c1y + c2y) / 2;
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.textAlign = 'center';
    ctx.fillText(`r = ${dist.toFixed(0)} px`, midX, midY - 10);

    // Force computation
    const F = computeForce();
    const absF = Math.abs(F);
    const isRepulsive = F > 0;

    // Force arrows
    const chargeSeparation = Math.hypot(c2x - c1x, c2y - c1y);
    if (absF > 0.01 && chargeSeparation >= 1) {
      const dx = c2x - c1x;
      const dy = c2y - c1y;
      const len = Math.hypot(dx, dy);
      const nx = dx / len;
      const ny = dy / len;

      const maxArrowLen = 150;
      const arrowLen = Math.min(maxArrowLen, Math.sqrt(absF) * 15);

      const fcolor = isRepulsive ? '#ff6b6b' : '#4ade80';
      const q1R = 18 + Math.abs(p.q1) * 4;
      const q2R = 18 + Math.abs(p.q2) * 4;

      // Q1 Force
      const dir1 = isRepulsive ? -1 : 1;
      const s1x = c1x + nx * dir1 * (q1R + 4);
      const s1y = c1y + ny * dir1 * (q1R + 4);
      const t1x = s1x + nx * dir1 * arrowLen;
      const t1y = s1y + ny * dir1 * arrowLen;
      drawArrow(s1x, s1y, t1x, t1y, fcolor, 3, 12);

      // Q2 Force
      const dir2 = isRepulsive ? 1 : -1;
      const s2x = c2x + nx * dir2 * (q2R + 4);
      const s2y = c2y + ny * dir2 * (q2R + 4);
      const t2x = s2x + nx * dir2 * arrowLen;
      const t2y = s2y + ny * dir2 * arrowLen;
      drawArrow(s2x, s2y, t2x, t2y, fcolor, 3, 12);

      if (p.showForceDecomp) {
        const fMagText = absF.toFixed(2);
        ctx.font = 'bold 10px "JetBrains Mono", monospace';

        const drawPill = (tx, ty, label) => {
          const tw = ctx.measureText(label).width;
          const pw = tw + 16,
            ph = 20;
          const px = tx - pw / 2,
            py = ty - ph - 10;

          ctx.fillStyle = 'rgba(5, 8, 16, 0.8)';
          ctx.beginPath();
          ctx.roundRect(px, py, pw, ph, 6);
          ctx.fill();
          ctx.strokeStyle = fcolor;
          ctx.lineWidth = 1;
          ctx.stroke();

          ctx.fillStyle = fcolor;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(label, px + pw / 2, py + ph / 2);
        };

        drawPill(t1x, t1y, `F₂₁: ${fMagText}`);
        drawPill(t2x, t2y, `F₁₂: ${fMagText}`);
      }
    }

    // Draw charges
    const drawCharge = (pos, q, label) => {
      const x = cx + pos.x * scale;
      const y = cy + pos.y * scale;
      const isPos = q > 0;
      const isZero = q === 0;
      const absQ = Math.abs(q);
      const chargeR = 18 + absQ * 4;

      const glowColor = isZero
        ? 'rgba(100, 116, 139, 0.2)'
        : isPos
          ? 'rgba(239, 68, 68, 0.25)'
          : 'rgba(59, 130, 246, 0.25)';
      const glowGrad = ctx.createRadialGradient(x, y, chargeR * 0.5, x, y, chargeR * 2.5);
      glowGrad.addColorStop(0, glowColor);
      glowGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = glowGrad;
      ctx.fillRect(x - chargeR * 3, y - chargeR * 3, chargeR * 6, chargeR * 6);

      const bodyColor = isZero ? '#64748b' : isPos ? '#ef4444' : '#3b82f6';
      const bodyGrad = ctx.createRadialGradient(x - 3, y - 3, 1, x, y, chargeR);
      bodyGrad.addColorStop(0, isPos ? '#fca5a5' : '#93c5fd');
      bodyGrad.addColorStop(0.5, bodyColor);
      bodyGrad.addColorStop(1, isPos ? '#991b1b' : '#1e3a8a');

      ctx.beginPath();
      ctx.arc(x, y, chargeR, 0, Math.PI * 2);
      ctx.fillStyle = bodyGrad;
      ctx.fill();

      const isDragged =
        (label === 'q₁' && dragTarget === 'q1') || (label === 'q₂' && dragTarget === 'q2');
      ctx.beginPath();
      ctx.arc(x, y, chargeR, 0, Math.PI * 2);
      ctx.strokeStyle = isDragged ? '#fef08a' : 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = isDragged ? 3 : 1;
      ctx.stroke();

      ctx.fillStyle = '#fff';
      ctx.font = `bold ${Math.max(12, chargeR * 0.7)}px "JetBrains Mono", monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(isZero ? '0' : isPos ? '+' : '−', x, y);

      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.textBaseline = 'top';
      ctx.fillText(`${label}`, x, y + chargeR + 8);
    };

    drawCharge(pos1, p.q1, 'q₁');
    drawCharge(pos2, p.q2, 'q₂');

    const hudX = 20;
    const hudY = 20;
    const hudW = 200;
    const hudH = 140;

    ctx.fillStyle = 'rgba(20, 25, 40, 0.75)';
    ctx.beginPath();
    ctx.roundRect(hudX, hudY, hudW, hudH, 12);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.font = 'bold 10px "JetBrains Mono", monospace';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.textAlign = 'left';
    ctx.fillText("COULOMB'S LAW", hudX + 16, hudY + 24);

    const typeLabel = F === 0 ? 'NEUTRAL' : isRepulsive ? 'REPULSIVE' : 'ATTRACTIVE';
    const typeColor = F === 0 ? '#94a3b8' : isRepulsive ? '#ff6b6b' : '#4ade80';

    const lines = [
      { label: 'q₁', value: `${p.q1.toFixed(1)}`, color: p.q1 > 0 ? '#ef4444' : '#3b82f6' },
      { label: 'q₂', value: `${p.q2.toFixed(1)}`, color: p.q2 > 0 ? '#ef4444' : '#3b82f6' },
      { label: 'r', value: `${(dist / scale).toFixed(0)} px`, color: '#e2e8f0' },
      { label: '|F|', value: `${absF.toFixed(2)}`, color: '#fde047' },
      { label: 'Type', value: typeLabel, color: typeColor },
    ];

    lines.forEach((line, i) => {
      const ly = hudY + 45 + i * 18;
      ctx.font = '9px "JetBrains Mono", monospace';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.textAlign = 'left';
      ctx.fillText(line.label, hudX + 16, ly);

      ctx.font = 'bold 9px "JetBrains Mono", monospace';
      ctx.fillStyle = line.color;
      ctx.textAlign = 'right';
      ctx.fillText(line.value, hudX + hudW - 16, ly);
    });

    ctx.font = '9px "JetBrains Mono", monospace';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.textAlign = 'center';
    ctx.fillText('Drag charges to explore the field', W / 2, H - 20);
  }

  function handlePointerDown(e) {
    const pt = pointerPosition(e);
    const hitX = (pt.x - canvas.width / 2) / (p.viewScale ?? 1);
    const hitY = (pt.y - canvas.height / 2) / (p.viewScale ?? 1);

    const d1 = Math.hypot(hitX - pos1.x, hitY - pos1.y);
    const d2 = Math.hypot(hitX - pos2.x, hitY - pos2.y);

    const r1 = 18 + Math.abs(p.q1) * 4;
    const r2 = 18 + Math.abs(p.q2) * 4;

    if (d1 <= r1 + 10) {
      dragTarget = 'q1';
      dragOffset = { x: hitX - pos1.x, y: hitY - pos1.y };
    } else if (d2 <= r2 + 10) {
      dragTarget = 'q2';
      dragOffset = { x: hitX - pos2.x, y: hitY - pos2.y };
    }

    if (dragTarget) {
      canvas.setPointerCapture?.(e.pointerId);
      render();
    }
  }

  function handlePointerMove(e) {
    if (!dragTarget) return;
    const pt = pointerPosition(e);
    const scale = p.viewScale ?? 1;
    const hitX = (pt.x - canvas.width / 2) / scale;
    const hitY = (pt.y - canvas.height / 2) / scale;
    const margin = 48 / scale;
    const maxX = canvas.width / (2 * scale) - margin;
    const maxY = canvas.height / (2 * scale) - margin;
    const nextX = Math.max(-maxX, Math.min(maxX, hitX - dragOffset.x));
    const nextY = Math.max(-maxY, Math.min(maxY, hitY - dragOffset.y));

    if (dragTarget === 'q1') {
      pos1.x = nextX;
      pos1.y = nextY;
    } else {
      pos2.x = nextX;
      pos2.y = nextY;
    }
    render();
  }

  function handlePointerUp(e) {
    if (dragTarget) canvas.releasePointerCapture?.(e.pointerId);
    dragTarget = null;
    render();
  }

  canvas.addEventListener('pointerdown', handlePointerDown);
  canvas.addEventListener('pointermove', handlePointerMove);
  canvas.addEventListener('pointerup', handlePointerUp);
  canvas.addEventListener('pointercancel', handlePointerUp);

  let running = false;
  let rafId;

  function loop() {
    if (!running) return;
    render();
    simTime += 1 / 60;
    rafId = requestAnimationFrame(loop);
  }

  render();

  return {
    start() {
      if (running) return;
      running = true;
      rafId = requestAnimationFrame(loop);
    },
    stop() {
      running = false;
      cancelAnimationFrame(rafId);
    },
    reset() {
      pos1.x = STATE.p1.x;
      pos1.y = STATE.p1.y;
      pos2.x = STATE.p2.x;
      pos2.y = STATE.p2.y;
      render();
    },
    setParams(next) {
      Object.assign(p, next);
      render();
    },
    destroy() {
      this.stop();
      canvas.removeEventListener('pointerdown', handlePointerDown);
      canvas.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('pointerup', handlePointerUp);
      canvas.removeEventListener('pointercancel', handlePointerUp);
    },
    getData() {
      const r = Math.max(1, computeDistance());
      return {
        time: simTime,
        force: Math.abs(computeForce()),
        distance: r,
      };
    },
  };
}
