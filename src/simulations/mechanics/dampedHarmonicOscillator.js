/**
 * Damped Harmonic Oscillator — Analytical vs Numerical Comparison
 * 
 * Shows underdamped, critically damped, and overdamped regimes.
 * Plots both the analytical solution and the RK4 numerical solution
 * side by side, plus phase portrait.
 */

const DEFAULTS = {
  mass: 1.0,
  springK: 40,
  damping: 2.0,
  x0: 2.0,
  v0: 0,
  trailMax: 400,
};

export const defaultParams = { ...DEFAULTS };

export const equationSections = [
  {
    title: 'Equation of Motion',
    equations: [
      {
        latex: String.raw`m\ddot{x} + c\dot{x} + kx = 0`,
        description: 'Second-order linear ODE for a mass-spring-damper system.',
      },
      {
        latex: String.raw`\ddot{x} + 2\zeta\omega_n\dot{x} + \omega_n^2 x = 0, \quad \omega_n = \sqrt{k/m}, \quad \zeta = \frac{c}{2\sqrt{mk}}`,
        description: 'Standard form with damping ratio ζ and natural frequency ωₙ.',
      },
    ],
    variables: [
      { symbol: 'm', description: 'Mass' },
      { symbol: 'k', description: 'Spring constant' },
      { symbol: 'c', description: 'Damping coefficient' },
      { symbol: 'ζ', description: 'Damping ratio (ζ<1 underdamped, ζ=1 critical, ζ>1 overdamped)' },
      { symbol: 'ωₙ', description: 'Natural frequency' },
    ],
  },
  {
    title: 'Analytical Solutions',
    equations: [
      {
        latex: String.raw`\zeta < 1: \quad x(t) = A e^{-\zeta\omega_n t}\cos(\omega_d t + \phi), \quad \omega_d = \omega_n\sqrt{1-\zeta^2}`,
        description: 'Underdamped: oscillatory decay with damped frequency ωd.',
      },
      {
        latex: String.raw`\zeta = 1: \quad x(t) = (A + Bt)e^{-\omega_n t}`,
        description: 'Critically damped: fastest non-oscillatory return to equilibrium.',
      },
      {
        latex: String.raw`\zeta > 1: \quad x(t) = A e^{r_1 t} + B e^{r_2 t}, \quad r_{1,2} = -\zeta\omega_n \pm \omega_n\sqrt{\zeta^2-1}`,
        description: 'Overdamped: slow exponential decay, no oscillation.',
      },
    ],
  },
  {
    title: 'Energy',
    equations: [
      {
        latex: String.raw`E(t) = \frac{1}{2}m\dot{x}^2 + \frac{1}{2}kx^2, \quad \frac{dE}{dt} = -c\dot{x}^2 \leq 0`,
        description: 'Total mechanical energy; dissipated by damping at rate c·v².',
      },
    ],
  },
];

export const equations = [
  String.raw`m\ddot{x} + c\dot{x} + kx = 0`,
  String.raw`\omega_n = \sqrt{k/m}, \quad \zeta = \frac{c}{2\sqrt{mk}}`,
];

export const graphParams = [
  { key: 'x', label: 'x(t) [m]' },
  { key: 'v', label: 'ẋ(t) [m/s]' },
  { key: 'xAnalytical', label: 'x_exact(t)' },
  { key: 'energy', label: 'E [J]' },
];

export const controls = [
  { key: 'mass', label: 'Mass m [kg]', min: 0.1, max: 5, step: 0.05 },
  { key: 'springK', label: 'Spring k [N/m]', min: 5, max: 200, step: 1 },
  { key: 'damping', label: 'Damping c [Ns/m]', min: 0, max: 30, step: 0.1 },
  { key: 'x0', label: 'x₀ [m]', min: -4, max: 4, step: 0.1 },
  { key: 'v0', label: 'v₀ [m/s]', min: -10, max: 10, step: 0.1 },
];

export const method = 'rk4';

// ── Analytical solution ────────────────────────────────────────────────────
function analyticalSolution(t, p) {
  const wn = Math.sqrt(p.springK / p.mass);
  const zeta = p.damping / (2 * Math.sqrt(p.mass * p.springK));

  if (zeta < 1 - 1e-6) {
    // Underdamped
    const wd = wn * Math.sqrt(1 - zeta * zeta);
    const A = p.x0;
    const B = (p.v0 + zeta * wn * p.x0) / wd;
    const decay = Math.exp(-zeta * wn * t);
    return decay * (A * Math.cos(wd * t) + B * Math.sin(wd * t));
  } else if (zeta > 1 + 1e-6) {
    // Overdamped
    const s = wn * Math.sqrt(zeta * zeta - 1);
    const r1 = -zeta * wn + s;
    const r2 = -zeta * wn - s;
    const A = (p.v0 - r2 * p.x0) / (r1 - r2);
    const B = p.x0 - A;
    return A * Math.exp(r1 * t) + B * Math.exp(r2 * t);
  } else {
    // Critically damped
    const A = p.x0;
    const B = p.v0 + wn * p.x0;
    return (A + B * t) * Math.exp(-wn * t);
  }
}

// ── Simulation ─────────────────────────────────────────────────────────────
export const scenarios = [
  {
    name: 'Underdamped',
    description: 'Light damping — the mass oscillates with exponentially decaying amplitude.',
    params: { mass: 1.0, springK: 40, damping: 2.0, x0: 2.0, v0: 0 },
  },
  {
    name: 'Critically Damped',
    description: 'Exact critical damping (ζ = 1). Fastest non-oscillatory return to equilibrium.',
    params: { mass: 1.0, springK: 40, damping: 12.649, x0: 2.0, v0: 0 },
  },
  {
    name: 'Overdamped',
    description: 'Heavy damping — sluggish exponential decay with no oscillation.',
    params: { mass: 1.0, springK: 40, damping: 25, x0: 2.0, v0: 0 },
  },
  {
    name: 'Zero Damping (SHM)',
    description: 'Pure simple harmonic motion — no energy loss, perpetual oscillation.',
    params: { mass: 1.0, springK: 40, damping: 0, x0: 2.0, v0: 0 },
  },
  {
    name: 'Near Critical (ζ = 0.99)',
    description: 'Just barely underdamped — the system completes less than one oscillation before settling.',
    params: { mass: 1.0, springK: 40, damping: 12.52, x0: 2.0, v0: 0 },
  },
];

export const guidedExperiments = [
  {
    title: 'Finding Critical Damping',
    steps: [
      {
        instruction: 'Start with zero damping (c = 0). Press Play and observe.',
        params: { mass: 1.0, springK: 40, damping: 0, x0: 2.0, v0: 0 },
        question: 'With no damping, what will happen?',
        choices: ['The mass will oscillate forever', 'It will slow down and stop', 'It will oscillate faster and faster'],
        correctIndex: 0,
        explanation: 'With zero damping, total mechanical energy E = ½mv² + ½kx² is conserved. The system is a perfect simple harmonic oscillator. In the Phase tab, the trajectory draws a perfect ellipse.',
      },
      {
        instruction: 'Now set damping to c = 2.0 (light damping). Reset and play.',
        params: { mass: 1.0, springK: 40, damping: 2.0, x0: 2.0, v0: 0 },
        question: 'The mass still oscillates. What happens to each successive peak?',
        choices: ['Peaks stay the same height', 'Each peak is slightly lower (exponential decay)', 'Peaks increase then decrease'],
        correctIndex: 1,
        explanation: 'This is the underdamped regime (ζ < 1). The amplitude decays as e^(-ζωₙt). Watch the yellow dashed envelope — that\'s the exponential decay curve.',
        tryThis: 'Look at the energy readout: E is decreasing because damping dissipates energy at rate dE/dt = -cv².',
      },
      {
        instruction: 'Set damping to c = 12.649 (critical damping for these parameters). Reset and play.',
        params: { mass: 1.0, springK: 40, damping: 12.649, x0: 2.0, v0: 0 },
        question: 'At exactly critical damping, will the mass overshoot x = 0?',
        choices: ['Yes, it will overshoot once', 'No — it returns to zero without overshooting', 'It will oscillate exactly once'],
        correctIndex: 1,
        commonMisconception: 'Students think "more damping = faster settling." Critical damping (ζ = 1) is actually the sweet spot — the fastest return without oscillation. Overdamping is slower.',
        explanation: 'At ζ = 1, the solution is x(t) = (A + Bt)e^(-ωₙt). No oscillation, no overshoot. This is why car shock absorbers are tuned to near-critical damping — you want fast settling without bouncing.',
        tryThis: 'Now increase to c = 25 (overdamped). Notice it settles MORE SLOWLY than critical — that\'s counterintuitive!',
      },
    ],
  },
];

export function create(canvas, initParams = {}) {
  const ctx = canvas.getContext('2d');
  const p = { ...DEFAULTS, ...initParams };

  let x, v, simTime, stepCount;
  let trail; // [{x, v, t}]
  let E0;

  const wn = () => Math.sqrt(p.springK / p.mass);
  const zeta = () => p.damping / (2 * Math.sqrt(p.mass * p.springK));
  const energy = () => 0.5 * p.mass * v * v + 0.5 * p.springK * x * x;
  const regime = () => {
    const z = zeta();
    if (z < 1 - 1e-4) return 'underdamped';
    if (z > 1 + 1e-4) return 'critical';
    return 'overdamped';
  };

  function initState() {
    x = p.x0;
    v = p.v0;
    simTime = 0;
    stepCount = 0;
    trail = [];
    E0 = energy();
  }

  // RK4
  function derivs(x, v) {
    return [v, -(p.damping / p.mass) * v - (p.springK / p.mass) * x];
  }

  function rk4Step(x, v, h) {
    const [k1x, k1v] = derivs(x, v);
    const [k2x, k2v] = derivs(x + k1x*h/2, v + k1v*h/2);
    const [k3x, k3v] = derivs(x + k2x*h/2, v + k2v*h/2);
    const [k4x, k4v] = derivs(x + k3x*h, v + k3v*h);
    return [
      x + h*(k1x + 2*k2x + 2*k3x + k4x)/6,
      v + h*(k1v + 2*k2v + 2*k3v + k4v)/6,
    ];
  }

  function tick(dt) {
    const steps = 20;
    const h = dt / steps;
    for (let i = 0; i < steps; i++) {
      [x, v] = rk4Step(x, v, h);
      simTime += h;
      stepCount++;
    }
    trail.push({ x, v, t: simTime });
    if (trail.length > p.trailMax) trail.shift();
  }

  // ── Rendering ─────────────────────────────────────────────────────────
  function render() {
    const W = canvas.width, H = canvas.height;
    ctx.fillStyle = '#0B0F14';
    ctx.fillRect(0, 0, W, H);

    // Layout: left half = mass-spring visual, right half = time series + phase
    const midX = W * 0.35;
    const rightW = W - midX;

    // ── Left: Mass-spring visualization ──────────────────────
    const eqY = H * 0.5;
    const wallX = midX * 0.15;
    const massW = 40, massH = 30;
    const restLen = midX * 0.4;
    const scale = midX * 0.12;
    const massX = wallX + restLen + x * scale;

    // Wall
    ctx.fillStyle = '#3f3f46';
    ctx.fillRect(wallX - 5, eqY - 50, 5, 100);
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(wallX - 5, eqY - 45 + i * 22);
      ctx.lineTo(wallX - 15, eqY - 35 + i * 22);
      ctx.strokeStyle = '#52525b';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Spring (zigzag)
    const coils = 12;
    const springEnd = massX - massW / 2;
    ctx.beginPath();
    ctx.moveTo(wallX, eqY);
    for (let i = 0; i <= coils * 2; i++) {
      const t = i / (coils * 2);
      const sx = wallX + (springEnd - wallX) * t;
      const sy = eqY + (i % 2 === 0 ? 1 : -1) * 8;
      ctx.lineTo(sx, sy);
    }
    ctx.lineTo(springEnd, eqY);
    
    // Spring color based on stretch
    const stretch = Math.abs(x / 2);
    const springColor = stretch > 0.5 ? '#FF6B6B' : stretch > 0.2 ? '#FFD166' : '#60a5fa';
    ctx.strokeStyle = springColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Damper (parallel)
    const dampX = wallX + (springEnd - wallX) * 0.5;
    ctx.fillStyle = 'rgba(79, 195, 247,0.15)';
    ctx.fillRect(dampX - 8, eqY + 20, 16, 24);
    ctx.strokeStyle = 'rgba(79, 195, 247,0.4)';
    ctx.lineWidth = 1;
    ctx.strokeRect(dampX - 8, eqY + 20, 16, 24);

    // Mass block
    ctx.shadowBlur = 15;
    ctx.shadowColor = 'rgba(96,165,250,0.5)';
    ctx.fillStyle = '#60a5fa';
    ctx.fillRect(massX - massW/2, eqY - massH/2, massW, massH);
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#93c5fd';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(massX - massW/2, eqY - massH/2, massW, massH);

    // Mass label
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('m', massX, eqY);

    // Equilibrium line
    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(wallX + restLen, eqY - 60);
    ctx.lineTo(wallX + restLen, eqY + 60);
    ctx.stroke();
    ctx.setLineDash([]);

    // Regime label
    const r = regime();
    const z = zeta();
    const regimeLabel = z < 1 - 1e-4 ? 'UNDERDAMPED' : z > 1 + 1e-4 ? 'OVERDAMPED' : 'CRITICALLY DAMPED';
    const regimeColor = z < 1 - 1e-4 ? '#60a5fa' : z > 1 + 1e-4 ? '#FF6B6B' : '#FFD166';
    ctx.fillStyle = regimeColor;
    ctx.font = 'bold 10px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(regimeLabel, midX * 0.5, H * 0.18);
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.fillText(`ζ = ${z.toFixed(3)}   ωₙ = ${wn().toFixed(2)}`, midX * 0.5, H * 0.22);

    // ── Right top: Time series ───────────────────────────────
    if (trail.length >= 2) {
      const gx = midX + 20;
      const gy = 30;
      const gw = rightW - 40;
      const gh = H * 0.4;

      // Grid
      ctx.strokeStyle = 'rgba(255,255,255,0.04)';
      ctx.lineWidth = 0.5;
      for (let i = 0; i <= 4; i++) {
        const y = gy + gh * i / 4;
        ctx.beginPath(); ctx.moveTo(gx, y); ctx.lineTo(gx + gw, y); ctx.stroke();
      }

      // Axes
      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(gx, gy + gh); ctx.lineTo(gx + gw, gy + gh); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx, gy + gh); ctx.stroke();

      const tMin = trail[0].t;
      const tMax = trail[trail.length - 1].t;
      if (tMax > tMin) {
        let xMax = 0;
        for (const pt of trail) xMax = Math.max(xMax, Math.abs(pt.x));
        xMax = Math.max(xMax, 0.5) * 1.2;

        // Analytical solution overlay
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.lineWidth = 1;
        let started = false;
        for (let i = 0; i < trail.length; i++) {
          const px = gx + (trail[i].t - tMin) / (tMax - tMin) * gw;
          const xa = analyticalSolution(trail[i].t, p);
          const py = gy + gh / 2 - (xa / xMax) * gh / 2;
          if (!started) { ctx.moveTo(px, py); started = true; }
          else ctx.lineTo(px, py);
        }
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Numerical solution
        ctx.beginPath();
        started = false;
        for (let i = 0; i < trail.length; i++) {
          const px = gx + (trail[i].t - tMin) / (tMax - tMin) * gw;
          const py = gy + gh / 2 - (trail[i].x / xMax) * gh / 2;
          if (!started) { ctx.moveTo(px, py); started = true; }
          else ctx.lineTo(px, py);
        }
        ctx.strokeStyle = '#60a5fa';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Envelope (underdamped only)
        if (z < 1 - 1e-4) {
          ctx.setLineDash([2, 4]);
          ctx.strokeStyle = 'rgba(255, 209, 102,0.3)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          started = false;
          for (let i = 0; i < trail.length; i++) {
            const px = gx + (trail[i].t - tMin) / (tMax - tMin) * gw;
            const env = p.x0 * Math.exp(-zeta() * wn() * trail[i].t);
            const py = gy + gh / 2 - (env / xMax) * gh / 2;
            if (!started) { ctx.moveTo(px, py); started = true; }
            else ctx.lineTo(px, py);
          }
          ctx.stroke();
          ctx.beginPath();
          started = false;
          for (let i = 0; i < trail.length; i++) {
            const px = gx + (trail[i].t - tMin) / (tMax - tMin) * gw;
            const env = -p.x0 * Math.exp(-zeta() * wn() * trail[i].t);
            const py = gy + gh / 2 - (env / xMax) * gh / 2;
            if (!started) { ctx.moveTo(px, py); started = true; }
            else ctx.lineTo(px, py);
          }
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // Labels
        ctx.font = '11px "Source Serif 4", serif';
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.textAlign = 'center';
        ctx.fillText('t [s]', gx + gw / 2, gy + gh + 16);
        ctx.save();
        ctx.translate(gx - 14, gy + gh / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText('x [m]', 0, 0);
        ctx.restore();

        // Legend
        ctx.font = '9px "JetBrains Mono", monospace';
        ctx.textAlign = 'left';
        ctx.strokeStyle = '#60a5fa'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(gx + gw - 100, gy + 12); ctx.lineTo(gx + gw - 80, gy + 12); ctx.stroke();
        ctx.fillStyle = '#60a5fa'; ctx.fillText('RK4', gx + gw - 76, gy + 15);
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(gx + gw - 100, gy + 26); ctx.lineTo(gx + gw - 80, gy + 26); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.fillText('Exact', gx + gw - 76, gy + 29);
      }

      // ── Right bottom: Phase portrait ────────────────────────
      const py0 = gy + gh + 40;
      const pww = gw;
      const phh = H - py0 - 30;

      if (phh > 50) {
        // Axes
        ctx.strokeStyle = 'rgba(255,255,255,0.25)';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(gx, py0 + phh); ctx.lineTo(gx + pww, py0 + phh); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(gx, py0); ctx.lineTo(gx, py0 + phh); ctx.stroke();

        let xMax = 0, vMax = 0;
        for (const pt of trail) {
          xMax = Math.max(xMax, Math.abs(pt.x));
          vMax = Math.max(vMax, Math.abs(pt.v));
        }
        xMax = Math.max(xMax, 0.5) * 1.3;
        vMax = Math.max(vMax, 0.5) * 1.3;

        // Phase trail
        for (let i = 1; i < trail.length; i++) {
          const t = i / trail.length;
          const px0 = gx + pww/2 + trail[i-1].x / xMax * pww/2;
          const ppy0 = py0 + phh/2 - trail[i-1].v / vMax * phh/2;
          const px1 = gx + pww/2 + trail[i].x / xMax * pww/2;
          const ppy1 = py0 + phh/2 - trail[i].v / vMax * phh/2;
          ctx.beginPath();
          ctx.moveTo(px0, ppy0);
          ctx.lineTo(px1, ppy1);
          ctx.strokeStyle = `rgba(79, 195, 247,${0.1 + t * 0.8})`;
          ctx.lineWidth = 0.8 + t * 1.2;
          ctx.stroke();
        }

        // Current point
        if (trail.length > 0) {
          const last = trail[trail.length - 1];
          const cpx = gx + pww/2 + last.x / xMax * pww/2;
          const cpy = py0 + phh/2 - last.v / vMax * phh/2;
          ctx.beginPath();
          ctx.arc(cpx, cpy, 4, 0, Math.PI * 2);
          ctx.fillStyle = '#81D4FA';
          ctx.shadowBlur = 10;
          ctx.shadowColor = '#4FC3F7';
          ctx.fill();
          ctx.shadowBlur = 0;
        }

        // Labels
        ctx.font = '11px "Source Serif 4", serif';
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.textAlign = 'center';
        ctx.fillText('x [m]', gx + pww / 2, py0 + phh + 16);
        ctx.save();
        ctx.translate(gx - 14, py0 + phh / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText('ẋ [m/s]', 0, 0);
        ctx.restore();

        // Title
        ctx.font = '10px "JetBrains Mono", monospace';
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.textAlign = 'left';
        ctx.fillText('Phase Portrait', gx + 4, py0 + 14);
      }
    }
  }

  let rafId, lastTs, running = false;

  function loop(ts) {
    if (!running) return;
    const dt = lastTs === undefined ? 1/60 : Math.min((ts - lastTs) / 1000, 1/20);
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
      running = true; lastTs = undefined;
      rafId = requestAnimationFrame(loop);
    },
    stop() { running = false; cancelAnimationFrame(rafId); },
    reset() { this.stop(); initState(); render(); this.start(); },
    destroy() { this.stop(); },
    getData() {
      const xA = analyticalSolution(simTime, p);
      return {
        time: simTime,
        x, v,
        xAnalytical: xA,
        energy: energy(),
        totalEnergy: energy(),
        energyError: E0 !== 0 ? (energy() - E0) / Math.abs(E0) : 0,
        steps: stepCount,
        dampingRatio: zeta(),
        naturalFreq: wn(),
      };
    },
  };
}
