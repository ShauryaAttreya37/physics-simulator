/**
 * Coulomb's Law — Static Force Demonstration
 *
 * Two point charges at user-controlled positions.
 * Displays force vectors, field lines, and the exact F = kq₁q₂/r² relationship.
 * No dynamics — purely a visualization of the force law.
 */

const DEFAULTS = {
  q1: 3,
  q2: -2,
  separation: 250, // px between charges
  k: 500, // Coulomb constant (visual scale)
  showFieldLines: 1,
  showForceDecomp: 1,
};

export const defaultParams = { ...DEFAULTS };

export const equationSections = [
  {
    title: 'Introduction',
    content:
      "Coulomb's Law describes the electrostatic force between two point charges. Like charges repel, opposite charges attract. The force is proportional to the product of the charges and inversely proportional to the square of the distance between them. This simulation lets you directly see how changing charge magnitudes and separation affects the force.",
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
      '1. Adjust q₁ and q₂ to change charge magnitudes and signs.\n2. Move the separation slider to change the distance.\n3. Watch force arrows grow/shrink — they obey F ∝ 1/r².\n4. Same-sign charges → arrows point outward (repulsion).\n5. Opposite-sign charges → arrows point inward (attraction).\n6. The force magnitude is displayed numerically in the HUD.',
  },
];

export const equations = [
  String.raw`\vec{F} = k_e \frac{q_1 q_2}{r^2} \hat{r}`,
  String.raw`|\vec{F}| \propto \frac{1}{r^2}`,
];

export const graphParams = [
  { key: 'force', label: 'Force |F|' },
  { key: 'separation', label: 'Separation r' },
];

export const controls = [
  { key: 'q1', label: 'Charge Q₁', min: -5, max: 5, step: 0.1 },
  { key: 'q2', label: 'Charge Q₂', min: -5, max: 5, step: 0.1 },
  { key: 'separation', label: 'Separation r [px]', min: 60, max: 500, step: 1 },
  { key: 'k', label: 'Force Scale k', min: 100, max: 2000, step: 10 },
  { key: 'showFieldLines', label: 'Field Lines', min: 0, max: 1, step: 1 },
  { key: 'showForceDecomp', label: 'Show Annotations', min: 0, max: 1, step: 1 },
];

export const scenarios = [
  {
    name: 'Opposite Charges (Attraction)',
    description: 'A positive and negative charge attract each other.',
    params: { q1: 3, q2: -3, separation: 250 },
  },
  {
    name: 'Like Charges (Repulsion)',
    description: 'Two positive charges repel each other.',
    params: { q1: 3, q2: 3, separation: 250 },
  },
  {
    name: 'Inverse-Square Demo',
    description: 'Move the separation slider to see force scale as 1/r².',
    params: { q1: 4, q2: -4, separation: 150 },
  },
  {
    name: 'Weak Interaction',
    description: 'Small charges far apart — barely any force.',
    params: { q1: 0.5, q2: -0.5, separation: 400 },
  },
  {
    name: 'Strong Repulsion',
    description: 'Large same-sign charges close together.',
    params: { q1: 5, q2: 5, separation: 80 },
  },
];

export function create(canvas, initParams = {}) {
  const ctx = canvas.getContext('2d');
  const p = { ...DEFAULTS, ...initParams };
  let simTime = 0;

  function computeForce() {
    const r = Math.max(1, p.separation);
    const F = (p.k * p.q1 * p.q2) / (r * r);
    return F; // positive = repulsive, negative = attractive
  }

  function drawFieldLines(cx, cy, r) {
    const c1x = cx - r / 2;
    const c2x = cx + r / 2;
    const nLines = 10;

    ctx.lineWidth = 0.8;

    for (let i = 0; i < nLines; i++) {
      const angle = (i / nLines) * Math.PI * 2;

      // Draw from q1
      if (p.q1 !== 0) {
        ctx.beginPath();
        const startX = c1x + 20 * Math.cos(angle);
        const startY = cy + 20 * Math.sin(angle);

        ctx.moveTo(startX, startY);

        let fx = startX;
        let fy = startY;
        const lineLen = 60;
        const step = 4;

        for (let s = 0; s < lineLen; s++) {
          // Field direction at current point
          let ex = 0;
          let ey = 0;

          // From q1
          const d1x = fx - c1x;
          const d1y = fy - cy;
          const r1sq = d1x * d1x + d1y * d1y + 25;
          const r1 = Math.sqrt(r1sq);
          ex += (p.q1 * d1x) / (r1sq * r1);
          ey += (p.q1 * d1y) / (r1sq * r1);

          // From q2
          const d2x = fx - c2x;
          const d2y = fy - cy;
          const r2sq = d2x * d2x + d2y * d2y + 25;
          const r2 = Math.sqrt(r2sq);
          ex += (p.q2 * d2x) / (r2sq * r2);
          ey += (p.q2 * d2y) / (r2sq * r2);

          const emag = Math.sqrt(ex * ex + ey * ey);
          if (emag < 1e-8) break;

          fx += (step * ex) / emag;
          fy += (step * ey) / emag;

          ctx.lineTo(fx, fy);

          // Stop if too far from canvas
          if (fx < 0 || fx > canvas.width || fy < 0 || fy > canvas.height) break;
          // Stop if too close to q2
          if (Math.hypot(fx - c2x, fy - cy) < 18) break;
        }

        ctx.strokeStyle = 'rgba(100, 160, 255, 0.12)';
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

    const r = Math.max(1, p.separation);
    const c1x = cx - r / 2;
    const c2x = cx + r / 2;

    // Field lines
    if (p.showFieldLines) {
      drawFieldLines(cx, cy, r);
    }

    // Distance line (dashed)
    ctx.setLineDash([6, 6]);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(c1x, cy + 50);
    ctx.lineTo(c2x, cy + 50);
    ctx.stroke();
    ctx.setLineDash([]);

    // Distance ticks
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(c1x, cy + 44);
    ctx.lineTo(c1x, cy + 56);
    ctx.moveTo(c2x, cy + 44);
    ctx.lineTo(c2x, cy + 56);
    ctx.stroke();

    // Distance label
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(`r = ${r.toFixed(0)} px`, cx, cy + 60);

    // Force computation
    const F = computeForce();
    const absF = Math.abs(F);
    const isRepulsive = F > 0;

    // Force vector scale (cap for display)
    const maxArrowLen = Math.min(W * 0.25, 180);
    const arrowLen = Math.min(maxArrowLen, Math.sqrt(absF) * 3);

    // Force arrows on Q1
    if (absF > 0.01) {
      const dir1 = isRepulsive ? -1 : 1; // Q1: left if repulsive, right if attractive
      const dir2 = isRepulsive ? 1 : -1; // Q2: opposite

      // Arrow on Q1
      const f1color = isRepulsive ? '#ff6b6b' : '#4ade80';
      drawArrow(c1x, cy, c1x + dir1 * arrowLen, cy, f1color, 3, 12);

      // Arrow on Q2
      const f2color = isRepulsive ? '#ff6b6b' : '#4ade80';
      drawArrow(c2x, cy, c2x + dir2 * arrowLen, cy, f2color, 3, 12);

      // Force labels on arrows
      ctx.font = 'bold 10px "JetBrains Mono", monospace';
      ctx.textBaseline = 'middle';

      ctx.fillStyle = f1color;
      ctx.textAlign = dir1 < 0 ? 'right' : 'left';
      ctx.fillText('F₁₂', c1x + dir1 * (arrowLen + 8), cy - 14);

      ctx.fillStyle = f2color;
      ctx.textAlign = dir2 > 0 ? 'left' : 'right';
      ctx.fillText('F₂₁', c2x + dir2 * (arrowLen + 8), cy - 14);
    }

    // Draw charges
    const drawCharge = (x, q, label) => {
      const isPos = q > 0;
      const isZero = q === 0;
      const absQ = Math.abs(q);
      const baseR = 18;
      const chargeR = baseR + absQ * 4;

      // Glow
      const glowColor = isZero
        ? 'rgba(148, 163, 184, 0.2)'
        : isPos
          ? 'rgba(239, 68, 68, 0.25)'
          : 'rgba(59, 130, 246, 0.25)';
      const glowGrad = ctx.createRadialGradient(x, cy, chargeR * 0.5, x, cy, chargeR * 2.5);
      glowGrad.addColorStop(0, glowColor);
      glowGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = glowGrad;
      ctx.fillRect(x - chargeR * 3, cy - chargeR * 3, chargeR * 6, chargeR * 6);

      // Body
      const bodyColor = isZero ? '#64748b' : isPos ? '#ef4444' : '#3b82f6';
      const bodyGrad = ctx.createRadialGradient(x - 3, cy - 3, 1, x, cy, chargeR);
      bodyGrad.addColorStop(0, isPos ? '#fca5a5' : '#93c5fd');
      bodyGrad.addColorStop(0.5, bodyColor);
      bodyGrad.addColorStop(1, isPos ? '#991b1b' : '#1e3a8a');
      ctx.shadowBlur = 20;
      ctx.shadowColor = bodyColor;
      ctx.beginPath();
      ctx.arc(x, cy, chargeR, 0, Math.PI * 2);
      ctx.fillStyle = bodyGrad;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Ring
      ctx.beginPath();
      ctx.arc(x, cy, chargeR, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Symbol
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${Math.max(14, chargeR * 0.7)}px "JetBrains Mono", monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(isZero ? '0' : isPos ? '+' : '−', x, cy);

      // Label below
      ctx.font = '11px "JetBrains Mono", monospace';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.textBaseline = 'top';
      ctx.fillText(`${label} = ${q > 0 ? '+' : ''}${q.toFixed(1)}`, x, cy + chargeR + 8);
    };

    drawCharge(c1x, p.q1, 'q₁');
    drawCharge(c2x, p.q2, 'q₂');

    // HUD Panel
    const hudX = 14;
    const hudY = 14;
    const hudW = 220;
    const hudH = p.showForceDecomp ? 180 : 110;

    ctx.fillStyle = 'rgba(5, 8, 16, 0.8)';
    ctx.beginPath();
    ctx.roundRect(hudX, hudY, hudW, hudH, 8);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.font = 'bold 9px "JetBrains Mono", monospace';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText("COULOMB'S LAW", hudX + 12, hudY + 10);

    const typeColor = isRepulsive ? '#ff6b6b' : '#4ade80';
    const typeLabel = F === 0 ? 'No force' : isRepulsive ? 'REPULSIVE' : 'ATTRACTIVE';

    const lines = [
      {
        label: 'q₁',
        value: `${p.q1 > 0 ? '+' : ''}${p.q1.toFixed(1)}`,
        color: p.q1 > 0 ? '#ef4444' : '#3b82f6',
      },
      {
        label: 'q₂',
        value: `${p.q2 > 0 ? '+' : ''}${p.q2.toFixed(1)}`,
        color: p.q2 > 0 ? '#ef4444' : '#3b82f6',
      },
      { label: 'r', value: `${r.toFixed(0)} px`, color: '#e4e4e7' },
      { label: '|F|', value: `${absF.toFixed(2)}`, color: '#fde047' },
      { label: 'Type', value: typeLabel, color: typeColor },
    ];

    ctx.font = '9px "JetBrains Mono", monospace';
    lines.forEach((line, i) => {
      const ly = hudY + 28 + i * 17;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.textAlign = 'left';
      ctx.fillText(line.label, hudX + 12, ly);
      ctx.fillStyle = line.color;
      ctx.font = 'bold 9px "JetBrains Mono", monospace';
      ctx.textAlign = 'right';
      ctx.fillText(line.value, hudX + hudW - 12, ly);
      ctx.font = '9px "JetBrains Mono", monospace';
    });

    // Annotations
    if (p.showForceDecomp) {
      const annotY = hudY + 28 + lines.length * 17 + 6;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.font = '8px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';

      const q1q2 = p.q1 * p.q2;
      ctx.fillText(
        `q₁·q₂ = ${q1q2.toFixed(1)} → ${q1q2 > 0 ? 'same sign → repel' : q1q2 < 0 ? 'opp sign → attract' : 'zero → no force'}`,
        hudX + 12,
        annotY,
      );
      ctx.fillText(
        `F ∝ 1/r² → ${r < 100 ? 'close → strong' : r < 250 ? 'moderate' : 'far → weak'}`,
        hudX + 12,
        annotY + 14,
      );
    }

    // Bottom: Equation rendered as text
    ctx.font = '13px "JetBrains Mono", monospace';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('F = k · q₁q₂ / r²', W / 2, H - 16);
  }

  let rafId;
  let running = false;

  // This is a static simulation — no dynamics, just render on param change
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
      simTime = 0;
      render();
    },
    setParams(next) {
      Object.assign(p, next);
      render();
    },
    destroy() {
      this.stop();
    },
    getData() {
      const r = Math.max(1, p.separation);
      const F = (p.k * p.q1 * p.q2) / (r * r);
      return {
        time: simTime,
        force: Math.abs(F),
        separation: r,
      };
    },
  };
}
