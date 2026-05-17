/**
 * Parallel Plate Capacitor & Dielectrics
 *
 * Physics:
 *   C = ε₀εᵣA/d — capacitance
 *   E = V/d (uniform field between plates)
 *   Q = CV, U = ½CV²
 *   With battery: V constant → Q changes with C
 *   Without battery: Q constant → V changes with C
 *
 * Direct Manipulation:
 *   - Drag plates apart/together to change d
 *   - Drag a dielectric slab between the plates
 */

const DEFAULTS = {
  voltage: 12, // Volts
  plateSep: 150, // px separation
  dielectricK: 1.0, // relative permittivity (1 = vacuum)
  dielectricInserted: 0, // 0..1 fraction inserted
  batteryConnected: 1, // 1 = connected, 0 = disconnected
  showFieldLines: 1,
  showCharges: 1,
};

export const defaultParams = { ...DEFAULTS };

export const equationSections = [
  {
    title: 'Introduction',
    content:
      'A capacitor stores energy in an electric field between two parallel metal plates. The capacitance depends on plate area, separation, and the material between them. Inserting a dielectric (insulating material) increases capacitance. Whether the battery is connected or not changes what happens when you modify the capacitor — this is one of the most common exam traps in physics!',
  },
  {
    title: 'Capacitance',
    equations: [
      {
        latex: String.raw`C = \frac{\varepsilon_0 \varepsilon_r A}{d}`,
        description:
          'Capacitance increases with plate area A and dielectric constant εᵣ, and decreases with separation d. This is the defining equation.',
      },
      {
        latex: String.raw`Q = CV, \quad U = \frac{1}{2}CV^2 = \frac{Q^2}{2C}`,
        description:
          'Charge Q and stored energy U. Note: U = ½CV² when voltage is known, but U = Q²/(2C) when charge is known. These give different results when C changes!',
      },
    ],
    variables: [
      { symbol: 'C', description: 'Capacitance (Farads)' },
      { symbol: 'ε₀', description: 'Permittivity of free space = 8.85 × 10⁻¹² F/m' },
      { symbol: 'εᵣ', description: 'Relative permittivity (dielectric constant)' },
      { symbol: 'd', description: 'Plate separation' },
      { symbol: 'V', description: 'Voltage across plates' },
    ],
  },
  {
    title: 'Electric Field',
    equations: [
      {
        latex: String.raw`E = \frac{V}{d} = \frac{\sigma}{\varepsilon_0 \varepsilon_r}`,
        description:
          'The electric field between infinite parallel plates is uniform. It equals the voltage divided by separation. A dielectric reduces the field by factor εᵣ.',
      },
    ],
  },
  {
    title: 'How to Use',
    content:
      '1. Drag the right plate left/right to change separation d.\n2. Drag the dielectric slab (orange block) between the plates.\n3. Toggle battery connected/disconnected to see the difference.\n4. With battery: V stays constant, Q changes.\n5. Without battery: Q stays constant, V changes.\n6. Watch the charge density and field lines update in real time.',
  },
  {
    title: 'Beginner Tips',
    content:
      'The #1 exam trap: inserting a dielectric with battery connected vs disconnected gives OPPOSITE energy changes! With battery: C increases → Q increases → U increases. Without battery: C increases → V decreases → U decreases. Try both and compare the energy readout!',
  },
];

export const equations = [
  String.raw`C = \varepsilon_0 \varepsilon_r \frac{A}{d}`,
  String.raw`U = \frac{1}{2}CV^2 = \frac{Q^2}{2C}`,
];

export const graphParams = [
  { key: 'capacitance', label: 'C [scaled]' },
  { key: 'charge', label: 'Q [scaled]' },
  { key: 'energy', label: 'U [scaled]' },
];

export const controls = [
  { key: 'voltage', label: 'Battery V [V]', min: 1, max: 50, step: 1 },
  { key: 'plateSep', label: 'Separation d [px]', min: 40, max: 350, step: 1 },
  { key: 'dielectricK', label: 'Dielectric κ', min: 1, max: 10, step: 0.1 },
  { key: 'dielectricInserted', label: 'Dielectric Insertion', min: 0, max: 1, step: 0.01 },
  { key: 'batteryConnected', label: 'Battery Connected', type: 'toggle' },
  { key: 'showFieldLines', label: 'Field Lines', type: 'toggle' },
  { key: 'showCharges', label: 'Show Charges', type: 'toggle' },
];

export const scenarios = [
  {
    name: 'Vacuum Capacitor',
    description: 'No dielectric. Pure vacuum between plates.',
    params: { ...DEFAULTS, dielectricK: 1, dielectricInserted: 0 },
  },
  {
    name: 'Glass Dielectric',
    description: 'Glass (κ ≈ 5) fully inserted. Notice capacitance increases 5×.',
    params: { ...DEFAULTS, dielectricK: 5, dielectricInserted: 1 },
  },
  {
    name: 'Battery Disconnected',
    description: 'Charge is fixed. Changing d changes V instead.',
    params: { ...DEFAULTS, batteryConnected: 0, plateSep: 150 },
  },
];

export const guidedExperiments = [
  {
    title: 'Battery Connected vs Disconnected',
    steps: [
      {
        instruction: 'Battery is connected. Drag the plates apart (increase d).',
        params: { ...DEFAULTS, batteryConnected: 1 },
        question: 'With battery connected, when you increase d, what happens to V?',
        choices: ['V increases', 'V decreases', 'V stays the same'],
        correctIndex: 2,
        explanation:
          'The battery maintains constant voltage! As d increases, C = εA/d decreases, so Q = CV also decreases. The battery actively removes charge from the plates.',
      },
      {
        instruction: 'Now disconnect the battery (toggle to 0). Then drag the plates apart.',
        params: { ...DEFAULTS, batteryConnected: 0 },
        question: 'With battery disconnected, when you increase d, what happens to V?',
        choices: ['V increases', 'V decreases', 'V stays the same'],
        correctIndex: 0,
        commonMisconception:
          'Students often forget that without a battery, charge is trapped on the plates. Q is constant! Since V = Q/C and C decreases, V must increase.',
        explanation:
          'Q is constant (no battery to add/remove charge). C = εA/d decreases with larger d. V = Q/C increases. Energy U = Q²/(2C) also increases — work was done by you pulling the plates apart!',
        tryThis:
          'Watch the energy readout. You did mechanical work to pull the plates apart, which converted to electrical energy!',
      },
    ],
  },
];

export function create(canvas, initParams = {}) {
  const ctx = canvas.getContext('2d');
  const p = { ...DEFAULTS, ...initParams };
  let simTime = 0;

  // Fixed charge when battery disconnected
  let fixedQ = null;

  // Interaction state
  let dragTarget = null; // 'plate' or 'dielectric'
  let leftPlateX = 0;
  let rightPlateX = 0;
  let dielectricPxX = 0;
  let dielectricPxY = 0;
  let dielectricPxW = 0;
  let dielectricPxH = 0;

  function getCapacitance() {
    const area = 200; // constant plate area (scaled)
    const effectiveK = 1 + (p.dielectricK - 1) * p.dielectricInserted;
    return (effectiveK * area) / Math.max(10, p.plateSep);
  }

  function getState() {
    const C = getCapacitance();
    let V, Q, U;

    if (p.batteryConnected) {
      V = p.voltage;
      Q = C * V;
      U = 0.5 * C * V * V;
      fixedQ = Q; // update stored Q for when battery is disconnected
    } else {
      if (fixedQ === null) fixedQ = C * p.voltage;
      Q = fixedQ;
      V = Q / C;
      U = (Q * Q) / (2 * C);
    }

    return { C, V, Q, U };
  }

  function render() {
    const W = canvas.width;
    const H = canvas.height;
    const scale = p.viewScale ?? 1.0;

    ctx.fillStyle = '#0a0e1a';
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

    const cx = W / 2;
    const cy = H * 0.45;
    const plateH = 180 * scale;
    const plateW = 8;
    const sep = p.plateSep * scale;

    leftPlateX = cx - sep / 2;
    rightPlateX = cx + sep / 2;

    const { C, V, Q, U } = getState();
    const chargeDensity = Math.min(1, Math.abs(Q) / 5000);

    // Field lines between plates
    if (p.showFieldLines) {
      const nLines = 10;
      for (let i = 0; i < nLines; i++) {
        const lineY = cy - plateH / 2 + ((i + 0.5) * plateH) / nLines;
        ctx.beginPath();
        ctx.moveTo(leftPlateX + plateW, lineY);
        ctx.lineTo(rightPlateX, lineY);

        const alpha = 0.05 + chargeDensity * 0.15;
        ctx.strokeStyle = `rgba(96, 165, 250, ${alpha})`;
        ctx.lineWidth = 1;
        ctx.stroke();

        // Arrow
        if (chargeDensity > 0.02) {
          const arrowX = (leftPlateX + plateW + rightPlateX) / 2;
          ctx.beginPath();
          ctx.moveTo(arrowX + 4, lineY);
          ctx.lineTo(arrowX - 2, lineY - 3);
          ctx.lineTo(arrowX - 2, lineY + 3);
          ctx.closePath();
          ctx.fillStyle = `rgba(96, 165, 250, ${alpha * 2})`;
          ctx.fill();
        }
      }
    }

    // Dielectric slab
    if (p.dielectricInserted > 0.01) {
      const dW = sep - plateW * 2 - 4;
      const dH = plateH * p.dielectricInserted;
      const dX = leftPlateX + plateW + 2;
      const dY = cy + plateH / 2 - dH;

      dielectricPxX = dX;
      dielectricPxY = dY;
      dielectricPxW = dW;
      dielectricPxH = dH;

      const dGrad = ctx.createLinearGradient(dX, dY, dX + dW, dY + dH);
      dGrad.addColorStop(0, 'rgba(251, 146, 60, 0.3)');
      dGrad.addColorStop(0.5, 'rgba(249, 115, 22, 0.4)');
      dGrad.addColorStop(1, 'rgba(234, 88, 12, 0.3)');
      ctx.fillStyle = dGrad;
      ctx.fillRect(dX, dY, dW, dH);
      ctx.strokeStyle = dragTarget === 'dielectric' ? '#fef08a' : 'rgba(251, 146, 60, 0.5)';
      ctx.lineWidth = dragTarget === 'dielectric' ? 2 : 1;
      ctx.strokeRect(dX, dY, dW, dH);

      // Dielectric label
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.fillStyle = '#fb923c';
      ctx.textAlign = 'center';
      ctx.fillText(`κ = ${p.dielectricK.toFixed(1)}`, dX + dW / 2, dY + dH / 2);
    }

    // Left plate (positive)
    const leftGrad = ctx.createLinearGradient(
      leftPlateX,
      cy - plateH / 2,
      leftPlateX + plateW,
      cy - plateH / 2,
    );
    leftGrad.addColorStop(0, '#64748b');
    leftGrad.addColorStop(0.5, '#94a3b8');
    leftGrad.addColorStop(1, '#64748b');
    ctx.fillStyle = leftGrad;
    ctx.fillRect(leftPlateX, cy - plateH / 2, plateW, plateH);

    // Right plate (negative)
    const rightGrad = ctx.createLinearGradient(
      rightPlateX,
      cy - plateH / 2,
      rightPlateX + plateW,
      cy - plateH / 2,
    );
    rightGrad.addColorStop(0, '#64748b');
    rightGrad.addColorStop(0.5, '#94a3b8');
    rightGrad.addColorStop(1, '#64748b');
    ctx.fillStyle = rightGrad;
    ctx.fillRect(rightPlateX, cy - plateH / 2, plateW, plateH);
    ctx.strokeStyle = dragTarget === 'plate' ? '#fef08a' : '#475569';
    ctx.lineWidth = dragTarget === 'plate' ? 3 : 1;
    ctx.strokeRect(rightPlateX, cy - plateH / 2, plateW, plateH);

    // Charges on plates
    if (p.showCharges) {
      const nCharges = Math.floor(chargeDensity * 12) + 1;
      ctx.font = 'bold 12px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      for (let i = 0; i < nCharges; i++) {
        const chargeY = cy - plateH / 2 + ((i + 0.5) * plateH) / nCharges;
        // + on left plate
        ctx.fillStyle = '#ef4444';
        ctx.fillText('+', leftPlateX + plateW / 2, chargeY);
        // - on right plate
        ctx.fillStyle = '#3b82f6';
        ctx.fillText('−', rightPlateX + plateW / 2, chargeY);
      }
    }

    // Battery
    const batX = leftPlateX - 60;
    const batY = cy + plateH / 2 + 40;

    // Connection wires
    ctx.strokeStyle = p.batteryConnected ? '#b45309' : 'rgba(180, 83, 9, 0.3)';
    ctx.lineWidth = 2;
    ctx.setLineDash(p.batteryConnected ? [] : [4, 4]);

    ctx.beginPath();
    ctx.moveTo(leftPlateX + plateW / 2, cy + plateH / 2);
    ctx.lineTo(leftPlateX + plateW / 2, batY);
    ctx.lineTo(batX + 20, batY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(rightPlateX + plateW / 2, cy + plateH / 2);
    ctx.lineTo(rightPlateX + plateW / 2, batY);
    ctx.lineTo(batX + 40, batY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Battery symbol
    if (p.batteryConnected) {
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(batX, batY - 15, 60, 30);
      ctx.strokeStyle = 'rgba(255,255,255,0.1)';
      ctx.lineWidth = 1;
      ctx.strokeRect(batX, batY - 15, 60, 30);

      // Battery plates
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(batX + 15, batY - 10, 3, 20);
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(batX + 25, batY - 6, 2, 12);

      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.fillText(`${p.voltage}V`, batX + 45, batY + 3);
    } else {
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.textAlign = 'center';
      ctx.fillText('Battery OFF', batX + 30, batY + 3);

      // X mark on wire
      ctx.font = 'bold 16px sans-serif';
      ctx.fillStyle = '#ef4444';
      ctx.fillText('✕', (leftPlateX + batX + 20) / 2, batY);
    }

    // Separation dimension
    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(leftPlateX + plateW, cy - plateH / 2 - 15);
    ctx.lineTo(rightPlateX, cy - plateH / 2 - 15);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.font = '9px "JetBrains Mono", monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.textAlign = 'center';
    ctx.fillText(`d = ${p.plateSep.toFixed(0)}`, cx, cy - plateH / 2 - 22);

    // HUD
    const hudX = W - 190;
    const hudY = 10;
    const hudW = 180;
    const hudH = 135;

    ctx.fillStyle = 'rgba(5, 8, 16, 0.85)';
    ctx.beginPath();
    ctx.roundRect(hudX, hudY, hudW, hudH, 8);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.font = 'bold 9px "JetBrains Mono", monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('CAPACITOR DATA', hudX + 10, hudY + 8);

    const lines = [
      { label: 'C', value: C.toFixed(2), color: '#22d3ee' },
      { label: 'V', value: V.toFixed(1) + ' V', color: '#fbbf24' },
      { label: 'Q', value: Q.toFixed(1), color: '#f87171' },
      { label: 'U', value: U.toFixed(1) + ' J', color: '#4ade80' },
      {
        label: 'E field',
        value: (V / Math.max(1, p.plateSep)).toFixed(3) + ' V/px',
        color: '#60a5fa',
      },
      {
        label: 'Mode',
        value: p.batteryConnected ? 'V = const' : 'Q = const',
        color: p.batteryConnected ? '#fbbf24' : '#f87171',
      },
    ];

    ctx.font = '9px "JetBrains Mono", monospace';
    lines.forEach((line, i) => {
      const ly = hudY + 24 + i * 17;
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.textAlign = 'left';
      ctx.fillText(line.label, hudX + 10, ly);
      ctx.fillStyle = line.color;
      ctx.font = 'bold 9px "JetBrains Mono", monospace';
      ctx.textAlign = 'right';
      ctx.fillText(line.value, hudX + hudW - 10, ly);
      ctx.font = '9px "JetBrains Mono", monospace';
    });
  }

  function handlePointerDown(e) {
    const rect = canvas.getBoundingClientRect();
    const hitX = e.clientX - rect.left;
    const hitY = e.clientY - rect.top;
    const scale = p.viewScale ?? 1.0;
    const plateH = 180 * scale;
    const cy = canvas.height * 0.45;

    // Check right plate
    if (
      hitX >= rightPlateX - 15 &&
      hitX <= rightPlateX + 20 &&
      hitY >= cy - plateH / 2 - 10 &&
      hitY <= cy + plateH / 2 + 10
    ) {
      dragTarget = 'plate';
      // When disconnecting from battery mid-drag, fix Q
      if (!p.batteryConnected && fixedQ === null) {
        fixedQ = getCapacitance() * p.voltage;
      }
      return;
    }

    // Check dielectric
    if (
      p.dielectricInserted > 0.01 &&
      hitX >= dielectricPxX - 10 &&
      hitX <= dielectricPxX + dielectricPxW + 10 &&
      hitY >= dielectricPxY - 10 &&
      hitY <= dielectricPxY + dielectricPxH + 10
    ) {
      dragTarget = 'dielectric';
    }
  }

  function handlePointerMove(e) {
    if (!dragTarget) return;
    const rect = canvas.getBoundingClientRect();
    const hitX = e.clientX - rect.left;
    const hitY = e.clientY - rect.top;
    const scale = p.viewScale ?? 1.0;

    if (dragTarget === 'plate') {
      const newSep = (hitX - leftPlateX) / scale;
      p.plateSep = Math.max(40, Math.min(350, newSep));
    } else if (dragTarget === 'dielectric') {
      const plateH = 180 * scale;
      const cy = canvas.height * 0.45;
      const bottomY = cy + plateH / 2;
      const topY = cy - plateH / 2;
      const insertion = 1 - (hitY - topY) / (bottomY - topY);
      p.dielectricInserted = Math.max(0, Math.min(1, insertion));
    }

    render();
  }

  function handlePointerUp() {
    dragTarget = null;
    render();
  }

  canvas.addEventListener('pointerdown', handlePointerDown);
  window.addEventListener('pointermove', handlePointerMove);
  window.addEventListener('pointerup', handlePointerUp);

  let rafId,
    lastTs,
    running = false;

  function loop(ts) {
    if (!running) return;
    const dt = lastTs === undefined ? 1 / 60 : Math.min((ts - lastTs) / 1000, 1 / 20);
    lastTs = ts;
    simTime += dt;
    render();
    rafId = requestAnimationFrame(loop);
  }

  // Initialize fixedQ
  fixedQ = getCapacitance() * p.voltage;
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
      simTime = 0;
      fixedQ = getCapacitance() * p.voltage;
      render();
    },
    setParams(next) {
      if ('batteryConnected' in next) {
        if (next.batteryConnected && !p.batteryConnected) {
          // Reconnecting battery
          fixedQ = null;
        } else if (!next.batteryConnected && p.batteryConnected) {
          // Disconnecting battery — freeze Q
          fixedQ = getCapacitance() * p.voltage;
        }
      }
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
      const { C, V, Q, U } = getState();
      return {
        time: simTime,
        capacitance: C,
        charge: Q,
        energy: U,
      };
    },
  };
}
