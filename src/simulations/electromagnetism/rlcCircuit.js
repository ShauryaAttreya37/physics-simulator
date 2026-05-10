/**
 * RLC Circuit Oscillator — Electromagnetic Resonance
 *
 * Physics:
 *   L(dI/dt) + IR + Q/C = 0
 *   d²Q/dt² + (R/L)dQ/dt + Q/(LC) = 0
 *   This is mathematically identical to the damped harmonic oscillator:
 *     Q ↔ x,  I ↔ v,  L ↔ m,  R ↔ damping,  1/C ↔ spring constant
 *   ω₀ = 1/√(LC),  ζ = R/(2√(L/C))
 *
 * Direct Manipulation: Drag the switch to "charge" the capacitor, then
 * release to watch oscillations. Energy sloshes between electric (capacitor)
 * and magnetic (inductor) fields.
 */

const DEFAULTS = {
  capacitance: 100, // μF
  inductance: 10, // mH
  resistance: 5, // Ohms
  initialVoltage: 12, // V (initial charge on capacitor)
};

export const defaultParams = { ...DEFAULTS };

export const equationSections = [
  {
    title: 'Introduction',
    content:
      'An RLC circuit is the electrical analog of a mass-spring-damper system. The capacitor stores energy in an electric field (like a compressed spring), the inductor stores energy in a magnetic field (like a moving mass), and the resistor dissipates energy as heat (like friction). When you charge the capacitor and flip the switch, current oscillates back and forth — just like a pendulum. The frequency depends on L and C, and the damping depends on R.',
  },
  {
    title: 'Circuit Equation',
    equations: [
      {
        latex: String.raw`L\frac{d^2Q}{dt^2} + R\frac{dQ}{dt} + \frac{Q}{C} = 0`,
        description:
          'The governing ODE for the RLC circuit. Identical in form to mẍ + cẋ + kx = 0 (damped harmonic oscillator). L plays the role of mass (inertia), R is damping, 1/C is stiffness.',
      },
    ],
    variables: [
      { symbol: 'L', description: 'Inductance (Henrys) — electromagnetic inertia' },
      { symbol: 'R', description: 'Resistance (Ohms) — energy dissipation' },
      { symbol: 'C', description: 'Capacitance (Farads) — energy storage (electric)' },
      { symbol: 'Q', description: 'Charge on the capacitor' },
      { symbol: 'I = dQ/dt', description: 'Current flowing in the circuit' },
    ],
  },
  {
    title: 'Natural Frequency & Damping',
    equations: [
      {
        latex: String.raw`\omega_0 = \frac{1}{\sqrt{LC}}, \quad \zeta = \frac{R}{2}\sqrt{\frac{C}{L}}`,
        description:
          'Natural frequency ω₀ depends on L and C. Damping ratio ζ depends on R. ζ < 1: underdamped (oscillates). ζ = 1: critically damped. ζ > 1: overdamped.',
      },
    ],
  },
  {
    title: 'Energy',
    equations: [
      {
        latex: String.raw`U_E = \frac{Q^2}{2C}, \quad U_B = \frac{1}{2}LI^2, \quad U_{\text{total}} = U_E + U_B`,
        description:
          'Energy oscillates between the capacitor (electric field) and inductor (magnetic field). The resistor converts electrical energy to heat. Without resistance, energy oscillates forever.',
      },
    ],
  },
  {
    title: 'How to Use',
    content:
      '1. Press Play to release the charged capacitor into the circuit.\n2. Watch energy slosh between capacitor (blue bar) and inductor (purple bar).\n3. Increase R to see faster damping.\n4. Set R = 0 for perpetual oscillation.\n5. Change L and C to modify the oscillation frequency.',
  },
  {
    title: 'Beginner Tips',
    content:
      "This circuit behaves exactly like the Damped Harmonic Oscillator simulation! Try setting R = 0 — the oscillation never stops (like a frictionless spring). Now add resistance — it's like adding friction. The analogy is perfect: Q ↔ position, I ↔ velocity, L ↔ mass, 1/C ↔ spring constant, R ↔ damping.",
  },
];

export const equations = [
  String.raw`L\frac{d^2Q}{dt^2} + R\frac{dQ}{dt} + \frac{Q}{C} = 0`,
  String.raw`\omega_0 = \frac{1}{\sqrt{LC}}, \quad \zeta = \frac{R}{2}\sqrt{\frac{C}{L}}`,
];

export const graphParams = [
  { key: 'voltage', label: 'V_C(t) [V]' },
  { key: 'current', label: 'I(t) [A]' },
  { key: 'energy', label: 'U_total [J]' },
];

export const controls = [
  { key: 'capacitance', label: 'C [μF]', min: 10, max: 1000, step: 10 },
  { key: 'inductance', label: 'L [mH]', min: 1, max: 100, step: 1 },
  { key: 'resistance', label: 'R [Ω]', min: 0, max: 50, step: 0.5 },
  { key: 'initialVoltage', label: 'V₀ [V]', min: 1, max: 50, step: 1 },
];

export const scenarios = [
  {
    name: 'Underdamped (Oscillating)',
    description: 'Low resistance — clear oscillations visible.',
    params: { capacitance: 100, inductance: 10, resistance: 2, initialVoltage: 12 },
  },
  {
    name: 'Critically Damped',
    description: 'Fastest decay without oscillation.',
    params: { capacitance: 100, inductance: 10, resistance: 20, initialVoltage: 12 },
  },
  {
    name: 'Lossless (R = 0)',
    description: 'Perfect oscillation — energy bounces forever between C and L.',
    params: { capacitance: 100, inductance: 10, resistance: 0, initialVoltage: 12 },
  },
  {
    name: 'High Frequency',
    description: 'Small L and C → fast oscillation.',
    params: { capacitance: 10, inductance: 1, resistance: 2, initialVoltage: 12 },
  },
];

export const guidedExperiments = [
  {
    title: 'The Mechanical Analogy',
    steps: [
      {
        instruction: 'Set R = 0. Press Play and watch the energy bars.',
        params: { capacitance: 100, inductance: 10, resistance: 0, initialVoltage: 12 },
        question: 'With R = 0, what happens to the total energy?',
        choices: [
          'It decreases over time',
          'It stays perfectly constant',
          'It increases over time',
        ],
        correctIndex: 1,
        explanation:
          'With R = 0, there is no energy dissipation. U_total = U_E + U_B = constant. Energy sloshes between the capacitor and inductor forever — exactly like a frictionless pendulum!',
        tryThis:
          'Watch the blue (U_E) and purple (U_B) bars. When one is max, the other is zero. They are perfectly out of phase.',
      },
      {
        instruction: 'Now set R = 5 Ω. Reset and play.',
        params: { capacitance: 100, inductance: 10, resistance: 5, initialVoltage: 12 },
        question: 'What role does the resistor play?',
        choices: [
          'It stores energy like the capacitor',
          'It converts electrical energy to heat (dissipation)',
          'It increases the oscillation frequency',
        ],
        correctIndex: 1,
        commonMisconception:
          'Students often think the resistor "blocks" current. It actually converts electrical energy to thermal energy at rate P = I²R. Energy is not destroyed, just converted to heat.',
        explanation:
          'The resistor is the analog of friction. Power dissipated = I²R. Total energy decreases exponentially with time constant 2L/R. This is exactly the damped harmonic oscillator with c = R, m = L, k = 1/C.',
      },
    ],
  },
];

export function create(canvas, initParams = {}) {
  const ctx = canvas.getContext('2d');
  const p = { ...DEFAULTS, ...initParams };

  // Convert to SI for physics
  const getL = () => p.inductance * 1e-3; // mH to H
  const getC = () => p.capacitance * 1e-6; // μF to F
  const getR = () => p.resistance;
  const getW0 = () => 1 / Math.sqrt(getL() * getC());
  const getZeta = () => (getR() / 2) * Math.sqrt(getC() / getL());

  let Q, I, simTime;
  let trail = []; // { t, Q, I }

  function initState() {
    Q = getC() * p.initialVoltage; // initial charge
    I = 0;
    simTime = 0;
    trail = [];
  }

  function derivs(state) {
    const [q, i] = state;
    const L = getL();
    const C = getC();
    const R = getR();
    // dQ/dt = I
    // dI/dt = -(R/L)I - Q/(LC)
    return [i, -(R / L) * i - q / (L * C)];
  }

  function tick(dt) {
    const steps = 20;
    const h = dt / steps;
    for (let s = 0; s < steps; s++) {
      const state = [Q, I];
      const k1 = derivs(state);
      const s1 = [state[0] + (k1[0] * h) / 2, state[1] + (k1[1] * h) / 2];
      const k2 = derivs(s1);
      const s2 = [state[0] + (k2[0] * h) / 2, state[1] + (k2[1] * h) / 2];
      const k3 = derivs(s2);
      const s3 = [state[0] + k3[0] * h, state[1] + k3[1] * h];
      const k4 = derivs(s3);

      Q = state[0] + (h / 6) * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]);
      I = state[1] + (h / 6) * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]);
      simTime += h;
    }

    trail.push({ t: simTime, Q, I });
    if (trail.length > 400) trail.shift();
  }

  function render() {
    const W = canvas.width;
    const H = canvas.height;

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

    const C = getC();
    const L = getL();
    const R = getR();
    const Vc = Q / C; // capacitor voltage
    const UE = (Q * Q) / (2 * C); // electric energy
    const UB = 0.5 * L * I * I; // magnetic energy
    const UTotal = UE + UB;
    const U0 = 0.5 * C * p.initialVoltage * p.initialVoltage;
    const maxU = Math.max(U0, 0.001);

    // ── Circuit Schematic (top half) ──
    const schX = W * 0.15;
    const schY = H * 0.12;
    const schW = W * 0.7;
    const schH = H * 0.25;

    // Circuit box
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(schX, schY, schW, schH, 10);
    ctx.stroke();

    // Capacitor (left side)
    const capX = schX + schW * 0.2;
    const capY = schY + schH / 2;
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(capX - 3, capY - 20, 3, 40);
    ctx.fillRect(capX + 6, capY - 20, 3, 40);

    // Charge glow on capacitor
    const capGlow = Math.abs(Vc) / Math.max(1, p.initialVoltage);
    if (capGlow > 0.01) {
      const glow = ctx.createRadialGradient(capX + 1.5, capY, 3, capX + 1.5, capY, 30);
      glow.addColorStop(0, `rgba(96, 165, 250, ${capGlow * 0.4})`);
      glow.addColorStop(1, 'transparent');
      ctx.fillStyle = glow;
      ctx.fillRect(capX - 30, capY - 30, 60, 60);
    }

    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.fillStyle = '#60a5fa';
    ctx.textAlign = 'center';
    ctx.fillText('C', capX + 1.5, capY + 30);

    // Inductor (top)
    const indX = schX + schW * 0.5;
    const indY = schY + 10;
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      const lx = indX - 30 + i * 20;
      ctx.arc(lx, indY + 5, 8, Math.PI, 0, false);
    }
    ctx.strokeStyle = '#a78bfa';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Inductor glow
    const indGlow = Math.abs(I) / Math.max(0.1, p.initialVoltage / Math.sqrt(L / C));
    if (indGlow > 0.01) {
      const glow = ctx.createRadialGradient(indX, indY, 3, indX, indY, 30);
      glow.addColorStop(0, `rgba(167, 139, 250, ${Math.min(0.4, indGlow * 0.4)})`);
      glow.addColorStop(1, 'transparent');
      ctx.fillStyle = glow;
      ctx.fillRect(indX - 30, indY - 20, 60, 40);
    }

    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.fillStyle = '#a78bfa';
    ctx.textAlign = 'center';
    ctx.fillText('L', indX, indY + 22);

    // Resistor (right side)
    const resX = schX + schW * 0.8;
    const resY = schY + schH / 2;
    ctx.beginPath();
    ctx.moveTo(resX, resY - 15);
    for (let i = 0; i < 6; i++) {
      ctx.lineTo(resX + (i % 2 === 0 ? 8 : -8), resY - 15 + (i + 1) * 5);
    }
    ctx.strokeStyle = '#fb923c';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Resistor heat glow
    const heatGlow = I * I * R;
    if (heatGlow > 0.001) {
      const glow = ctx.createRadialGradient(resX, resY, 3, resX, resY, 20);
      glow.addColorStop(0, `rgba(251, 146, 60, ${Math.min(0.3, heatGlow * 10)})`);
      glow.addColorStop(1, 'transparent');
      ctx.fillStyle = glow;
      ctx.fillRect(resX - 25, resY - 25, 50, 50);
    }

    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.fillStyle = '#fb923c';
    ctx.textAlign = 'center';
    ctx.fillText('R', resX, resY + 28);

    // Current arrow
    if (Math.abs(I) > 0.0001) {
      const arrowAlpha = Math.min(1, Math.abs(I) * 50);
      ctx.fillStyle = `rgba(74, 222, 128, ${arrowAlpha})`;
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      const arrow = I > 0 ? '→' : '←';
      ctx.fillText(arrow, indX, indY - 6);
    }

    // ── Energy Bars (bottom left) ──
    const barX = W * 0.08;
    const barY = H * 0.5;
    const barH = H * 0.35;
    const barW = 35;

    // Electric energy bar
    const ueH = (UE / maxU) * barH;
    const ueGrad = ctx.createLinearGradient(0, barY + barH - ueH, 0, barY + barH);
    ueGrad.addColorStop(0, '#3b82f6');
    ueGrad.addColorStop(1, '#1d4ed8');
    ctx.fillStyle = ueGrad;
    ctx.fillRect(barX, barY + barH - ueH, barW, ueH);

    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barW, barH);

    ctx.font = 'bold 8px "JetBrains Mono", monospace';
    ctx.fillStyle = '#60a5fa';
    ctx.textAlign = 'center';
    ctx.fillText('U_E', barX + barW / 2, barY + barH + 12);
    ctx.fillText('(Cap)', barX + barW / 2, barY + barH + 22);

    // Magnetic energy bar
    const ubH = (UB / maxU) * barH;
    const ubGrad = ctx.createLinearGradient(0, barY + barH - ubH, 0, barY + barH);
    ubGrad.addColorStop(0, '#a78bfa');
    ubGrad.addColorStop(1, '#7c3aed');
    ctx.fillStyle = ubGrad;
    ctx.fillRect(barX + barW + 15, barY + barH - ubH, barW, ubH);
    ctx.strokeRect(barX + barW + 15, barY, barW, barH);

    ctx.fillStyle = '#a78bfa';
    ctx.fillText('U_B', barX + barW + 15 + barW / 2, barY + barH + 12);
    ctx.fillText('(Ind)', barX + barW + 15 + barW / 2, barY + barH + 22);

    // ── Time series (right half) ──
    if (trail.length > 2) {
      const gx = W * 0.35;
      const gy = H * 0.5;
      const gw = W * 0.6;
      const gh = H * 0.4;

      // Background
      ctx.fillStyle = 'rgba(15, 23, 42, 0.5)';
      ctx.beginPath();
      ctx.roundRect(gx, gy, gw, gh, 6);
      ctx.fill();

      // Find max values
      let maxQ = 0,
        maxI = 0;
      for (const pt of trail) {
        maxQ = Math.max(maxQ, Math.abs(pt.Q));
        maxI = Math.max(maxI, Math.abs(pt.I));
      }
      maxQ = Math.max(maxQ, 1e-6);
      maxI = Math.max(maxI, 1e-6);

      // Q(t) — voltage proxy
      ctx.beginPath();
      for (let i = 0; i < trail.length; i++) {
        const px = gx + (i / trail.length) * gw;
        const py = gy + gh / 2 - (trail[i].Q / maxQ) * (gh / 2) * 0.85;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.strokeStyle = '#60a5fa';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // I(t)
      ctx.beginPath();
      for (let i = 0; i < trail.length; i++) {
        const px = gx + (i / trail.length) * gw;
        const py = gy + gh / 2 - (trail[i].I / maxI) * (gh / 2) * 0.85;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.strokeStyle = '#a78bfa';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Zero line
      ctx.setLineDash([2, 3]);
      ctx.beginPath();
      ctx.moveTo(gx, gy + gh / 2);
      ctx.lineTo(gx + gw, gy + gh / 2);
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.lineWidth = 0.5;
      ctx.stroke();
      ctx.setLineDash([]);

      // Legend
      ctx.font = '9px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillStyle = '#60a5fa';
      ctx.fillText('V_C (voltage)', gx + 10, gy + 14);
      ctx.fillStyle = '#a78bfa';
      ctx.fillText('I (current)', gx + 10, gy + 26);
    }

    // ── HUD ──
    const hudX = W - 200;
    const hudY = 10;
    const hudW = 190;
    const hudH = 145;

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
    ctx.fillText('RLC OSCILLATOR', hudX + 10, hudY + 8);

    const w0 = getW0();
    const zeta = getZeta();
    const regime = zeta < 0.99 ? 'UNDERDAMPED' : zeta > 1.01 ? 'OVERDAMPED' : 'CRITICAL';
    const regimeColor = zeta < 0.99 ? '#60a5fa' : zeta > 1.01 ? '#f87171' : '#fbbf24';

    const lines = [
      { label: 'V_C', value: Vc.toFixed(2) + ' V', color: '#60a5fa' },
      { label: 'I', value: (I * 1000).toFixed(1) + ' mA', color: '#a78bfa' },
      { label: 'U_E', value: (UE * 1e6).toFixed(1) + ' μJ', color: '#3b82f6' },
      { label: 'U_B', value: (UB * 1e6).toFixed(1) + ' μJ', color: '#a78bfa' },
      { label: 'ω₀', value: w0.toFixed(1) + ' rad/s', color: '#e4e4e7' },
      { label: 'ζ', value: zeta.toFixed(3), color: regimeColor },
      { label: 'Regime', value: regime, color: regimeColor },
    ];

    ctx.font = '9px "JetBrains Mono", monospace';
    lines.forEach((line, i) => {
      const ly = hudY + 24 + i * 16;
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

  let rafId,
    lastTs,
    running = false;

  function loop(ts) {
    if (!running) return;
    const dt = lastTs === undefined ? 1 / 60 : Math.min((ts - lastTs) / 1000, 1 / 20);
    lastTs = ts;
    tick(dt);
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
    getData() {
      const C = getC();
      const L = getL();
      const Vc = Q / C;
      return {
        time: simTime,
        voltage: Vc,
        current: I,
        energy: (Q * Q) / (2 * C) + 0.5 * L * I * I,
      };
    },
  };
}
