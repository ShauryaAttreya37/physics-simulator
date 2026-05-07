/**
 * Quantum Particle in a Box — Infinite Square Well
 *
 * Time-evolving superposition of energy eigenstates.
 * Renders: probability density |ψ|², real/imaginary wavefunction,
 * energy spectrum, expectation values ⟨x⟩ and ⟨p⟩.
 * Makie.jl-inspired premium aesthetic.
 */

const DEFAULTS = {
  n1Amp: 1.0,
  n2Amp: 0.5,
  n3Amp: 0.3,
  n4Amp: 0.0,
  boxLength: 1.0,
  mass: 1.0,
  hbar: 1.0,
  trailMax: 300,
};

export const defaultParams = { ...DEFAULTS };

export const equationSections = [
  {
    title: 'Introduction',
    content:
      "The particle in a box is a fundamental quantum mechanics problem. Imagine a tiny particle, like an electron, trapped inside an infinitely high box (walls it can't escape). In classical physics, the particle could have any energy and be anywhere. But quantum mechanics says it can only have specific energies, and the probability of finding it follows wave patterns. This simulation shows how quantum states combine and evolve over time, creating interesting interference effects.",
  },
  {
    title: 'Schrödinger Equation (Time-Independent)',
    equations: [
      {
        latex: String.raw`-\frac{\hbar^2}{2m}\frac{d^2\psi}{dx^2} = E\psi, \quad V(x) = \begin{cases} 0 & 0 < x < L \\ \infty & \text{otherwise} \end{cases}`,
        description:
          "This is the quantum equation for the particle. Inside the box (V=0), it's like a free particle. The infinite walls mean the wavefunction must be zero at the edges, creating standing waves.",
      },
      {
        latex: String.raw`\psi_n(x) = \sqrt{\frac{2}{L}}\sin\!\left(\frac{n\pi x}{L}\right), \quad E_n = \frac{n^2\pi^2\hbar^2}{2mL^2}`,
        description:
          'These are the allowed wavefunctions and energies. n=1 is the lowest energy state (ground state), n=2 is excited, etc. Higher n means more "bumps" in the wave and higher energy.',
      },
    ],
    variables: [
      {
        symbol: 'n',
        description: 'Energy level number (n = 1, 2, 3, …) - like floors in a building',
      },
      { symbol: 'L', description: 'Length of the box - longer box means closer energy levels' },
      {
        symbol: 'ℏ',
        description: 'Quantum constant (very small number, about 1.0545718 × 10^{-34} J⋅s)',
      },
      { symbol: 'm', description: 'Mass of the particle - heavier particles have lower energies' },
    ],
  },
  {
    title: 'Time Evolution',
    equations: [
      {
        latex: String.raw`\Psi(x,t) = \sum_n c_n\,\psi_n(x)\,e^{-iE_n t/\hbar}`,
        description:
          'When you mix different energy states, the total wavefunction changes with time. Each state oscillates at its own frequency, creating beating patterns.',
      },
      {
        latex: String.raw`|\Psi(x,t)|^2 = \text{probability density — oscillates due to beating between modes}`,
        description:
          'This is what you would measure: the probability of finding the particle at position x at time t. It moves around as the waves interfere.',
      },
    ],
  },
  {
    title: 'Expectation Values',
    equations: [
      {
        latex: String.raw`\langle x \rangle = \int_0^L x|\Psi|^2\,dx, \quad \langle p \rangle = -i\hbar\int_0^L \Psi^*\frac{\partial\Psi}{\partial x}\,dx`,
        description:
          'These are quantum averages. ⟨x⟩ is the average position, ⟨p⟩ is average momentum. They show how the particle behaves on average.',
      },
    ],
  },
  {
    title: 'How to Use',
    content:
      '1. Start with just n=1 amplitude = 1, others = 0. This is the ground state - particle most likely in center.\n2. Add some n=2 amplitude. See how the wave oscillates between states.\n3. Try equal amplitudes for n=1 and n=2. Watch the probability density move back and forth.\n4. Look at ⟨x⟩ and ⟨p⟩ graphs - they show average position and momentum over time.\n5. Experiment with different combinations to see interference patterns.',
  },
  {
    title: 'Beginner Tips',
    content:
      'Think of energy levels like rungs on a ladder - you can only stand on specific rungs. The wavefunction shows where you\'re likely to be found. When states mix, the particle seems to "tunnel" between positions. This is quantum superposition in action!',
  },
];

export const equations = [
  String.raw`\hat{H}\psi_n = E_n\psi_n, \quad E_n = \frac{n^2\pi^2\hbar^2}{2mL^2}`,
  String.raw`\Psi(x,t) = \sum_n c_n\psi_n(x)e^{-iE_n t/\hbar}`,
];

export const graphParams = [
  { key: 'expectX', label: '⟨x⟩' },
  { key: 'expectP', label: '⟨p⟩' },
  { key: 'totalProb', label: '∫|ψ|²dx' },
];

export const controls = [
  { key: 'n1Amp', label: 'n=1 Amplitude', min: 0, max: 1, step: 0.01 },
  { key: 'n2Amp', label: 'n=2 Amplitude', min: 0, max: 1, step: 0.01 },
  { key: 'n3Amp', label: 'n=3 Amplitude', min: 0, max: 1, step: 0.01 },
  { key: 'n4Amp', label: 'n=4 Amplitude', min: 0, max: 1, step: 0.01 },
];

export const method = 'exact';

// ── Physics helpers ────────────────────────────────────────────────────
function eigenEnergy(n, p) {
  return (n * n * Math.PI * Math.PI * p.hbar * p.hbar) / (2 * p.mass * p.boxLength * p.boxLength);
}

function eigenFunc(n, x, L) {
  return Math.sqrt(2 / L) * Math.sin((n * Math.PI * x) / L);
}

// ── Makie-style color palette (viridis-inspired) ─────────────────────
function viridis(t) {
  t = Math.max(0, Math.min(1, t));
  const r = Math.round(68 + t * (253 - 68));
  const g = Math.round(1 + t * (231 - 1));
  const b = Math.round(84 + t * (37 - 84));
  return `rgb(${r},${g},${b})`;
}

// ── Simulation ─────────────────────────────────────────────────────────
export function create(canvas, initParams = {}) {
  const ctx = canvas.getContext('2d');
  const p = { ...DEFAULTS, ...initParams };

  let simTime = 0;
  let trail = [];
  const N_POINTS = 500;

  function getCoeffs() {
    const raw = [p.n1Amp, p.n2Amp, p.n3Amp, p.n4Amp];
    const norm = Math.sqrt(raw.reduce((s, a) => s + a * a, 0)) || 1;
    return raw.map((a) => a / norm);
  }

  function computeWavefunction(t) {
    const coeffs = getCoeffs();
    const L = p.boxLength;
    const dx = L / (N_POINTS - 1);
    const re = new Float64Array(N_POINTS);
    const im = new Float64Array(N_POINTS);
    const prob = new Float64Array(N_POINTS);

    for (let i = 0; i < N_POINTS; i++) {
      const x = i * dx;
      let psiRe = 0,
        psiIm = 0;
      for (let n = 0; n < 4; n++) {
        if (Math.abs(coeffs[n]) < 1e-12) continue;
        const En = eigenEnergy(n + 1, p);
        const phase = (-En * t) / p.hbar;
        const phi = eigenFunc(n + 1, x, L);
        psiRe += coeffs[n] * phi * Math.cos(phase);
        psiIm += coeffs[n] * phi * Math.sin(phase);
      }
      re[i] = psiRe;
      im[i] = psiIm;
      prob[i] = psiRe * psiRe + psiIm * psiIm;
    }
    return { re, im, prob, dx };
  }

  function computeExpectations(wf) {
    const L = p.boxLength;
    let expectX = 0,
      expectP = 0,
      totalProb = 0;
    for (let i = 0; i < N_POINTS; i++) {
      const x = i * wf.dx;
      expectX += x * wf.prob[i] * wf.dx;
      totalProb += wf.prob[i] * wf.dx;
      // ⟨p⟩ via finite difference of ψ
      if (i > 0 && i < N_POINTS - 1) {
        const dPsiRe = (wf.re[i + 1] - wf.re[i - 1]) / (2 * wf.dx);
        const dPsiIm = (wf.im[i + 1] - wf.im[i - 1]) / (2 * wf.dx);
        // p = -iℏ(ψ* dψ/dx) → Re part = ℏ(ψ_re * dψ_im/dx - ψ_im * dψ_re/dx)
        expectP += p.hbar * (wf.re[i] * dPsiIm - wf.im[i] * dPsiRe) * wf.dx;
      }
    }
    return { expectX, expectP, totalProb };
  }

  // ── Drawing helpers (Makie.jl style) ─────────────────────────────────

  function drawMakieAxes(ctx, gx, gy, gw, gh, opts = {}) {
    const { title, xLabel, yLabel, gridLines = 4, color = '#2A3441' } = opts;

    // Background panel with subtle gradient
    const bg = ctx.createLinearGradient(gx, gy, gx, gy + gh);
    bg.addColorStop(0, 'rgba(11, 15, 20, 0.95)');
    bg.addColorStop(1, 'rgba(11, 15, 20, 0.95)');
    ctx.fillStyle = bg;
    ctx.fillRect(gx, gy, gw, gh);

    // Border
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    ctx.strokeRect(gx, gy, gw, gh);

    // Grid
    ctx.strokeStyle = color;
    ctx.lineWidth = 0.5;
    for (let i = 1; i < gridLines; i++) {
      const y = gy + (gh * i) / gridLines;
      ctx.beginPath();
      ctx.moveTo(gx, y);
      ctx.lineTo(gx + gw, y);
      ctx.stroke();
    }
    for (let i = 1; i < gridLines; i++) {
      const x = gx + (gw * i) / gridLines;
      ctx.beginPath();
      ctx.moveTo(x, gy);
      ctx.lineTo(x, gy + gh);
      ctx.stroke();
    }

    // Title
    if (title) {
      ctx.font = '600 12px "Montserrat", sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(title, gx + 8, gy + 6);
    }

    // Axis labels
    ctx.font = '500 10px "Montserrat", sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    if (xLabel) {
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(xLabel, gx + gw / 2, gy + gh + 4);
    }
    if (yLabel) {
      ctx.save();
      ctx.translate(gx - 6, gy + gh / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(yLabel, 0, 0);
      ctx.restore();
    }
  }

  function drawGlowLine(ctx, pts, color, width = 2, glowSize = 8) {
    if (pts.length < 2) return;
    // Glow pass
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.strokeStyle = color;
    ctx.lineWidth = width + glowSize;
    ctx.globalAlpha = 0.15;
    ctx.stroke();
    ctx.globalAlpha = 1;

    // Main line
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();
  }

  function drawFilledProb(ctx, pts, gx, baseY) {
    if (pts.length < 2) return;
    const grad = ctx.createLinearGradient(gx, baseY - 200, gx, baseY);
    grad.addColorStop(0, 'rgba(99,102,241,0.6)');
    grad.addColorStop(0.5, 'rgba(79, 195, 247,0.3)');
    grad.addColorStop(1, 'rgba(79, 195, 247,0.02)');
    ctx.beginPath();
    ctx.moveTo(pts[0].x, baseY);
    for (const pt of pts) ctx.lineTo(pt.x, pt.y);
    ctx.lineTo(pts[pts.length - 1].x, baseY);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();
  }

  // ── Main render ──────────────────────────────────────────────────────
  function render() {
    const W = canvas.width,
      H = canvas.height;

    // Deep dark background
    const mainBg = ctx.createLinearGradient(0, 0, W, H);
    mainBg.addColorStop(0, '#0B0F14');
    mainBg.addColorStop(1, '#111822');
    ctx.fillStyle = mainBg;
    ctx.fillRect(0, 0, W, H);

    const wf = computeWavefunction(simTime);
    const exp = computeExpectations(wf);
    const L = p.boxLength;

    // Layout
    const margin = 24;
    const leftW = W * 0.55;
    const rightW = W - leftW - margin;

    // ── LEFT: Probability density + wavefunction ───────────────────
    const plotX = margin + 14;
    const plotY = margin;
    const plotW = leftW - margin - 20;
    const plotH = H * 0.42;

    drawMakieAxes(ctx, plotX, plotY, plotW, plotH, {
      title: '|ψ(x,t)|²  — Probability Density',
      xLabel: 'x / L',
      yLabel: '|ψ|²',
    });

    // Use a theoretical fixed max to prevent chaotic jitter scaling each frame
    const probMax = 4.0;

    // Probability density filled + line
    const probPts = [];
    for (let i = 0; i < N_POINTS; i++) {
      const px = plotX + (i / (N_POINTS - 1)) * plotW;
      const py = plotY + plotH - (wf.prob[i] / probMax) * (plotH - 30);
      probPts.push({ x: px, y: py });
    }
    drawFilledProb(ctx, probPts, plotX, plotY + plotH);
    drawGlowLine(ctx, probPts, '#4FC3F7', 2, 10);

    // ⟨x⟩ marker
    const expectXpx = plotX + (exp.expectX / L) * plotW;
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = '#FFD166';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(expectXpx, plotY + 24);
    ctx.lineTo(expectXpx, plotY + plotH);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.font = '600 9px "JetBrains Mono", monospace';
    ctx.fillStyle = '#FFD166';
    ctx.textAlign = 'center';
    ctx.fillText('⟨x⟩', expectXpx, plotY + plotH + 16);

    // ── LEFT BOTTOM: Re(ψ) and Im(ψ) ──────────────────────────────
    const wfPlotY = plotY + plotH + 36;
    const wfPlotH = H * 0.42;
    drawMakieAxes(ctx, plotX, wfPlotY, plotW, wfPlotH, {
      title: 'ψ(x,t)  — Real & Imaginary',
      xLabel: 'x / L',
      yLabel: 'ψ',
    });

    // Use a fixed scale for wavefunction to maintain visual consistency
    const wfMax = 2.0;

    // Equilibrium line
    const eqLine = wfPlotY + wfPlotH / 2;
    ctx.setLineDash([2, 6]);
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(plotX, eqLine);
    ctx.lineTo(plotX + plotW, eqLine);
    ctx.stroke();
    ctx.setLineDash([]);

    const rePts = [],
      imPts = [];
    for (let i = 0; i < N_POINTS; i++) {
      const px = plotX + (i / (N_POINTS - 1)) * plotW;
      rePts.push({ x: px, y: eqLine - (wf.re[i] / wfMax) * (wfPlotH / 2 - 16) });
      imPts.push({ x: px, y: eqLine - (wf.im[i] / wfMax) * (wfPlotH / 2 - 16) });
    }
    drawGlowLine(ctx, rePts, '#60a5fa', 2, 8);
    drawGlowLine(ctx, imPts, '#f472b6', 1.5, 6);

    // Legend
    ctx.font = '600 9px "JetBrains Mono", monospace';
    ctx.textAlign = 'right';
    ctx.fillStyle = '#60a5fa';
    ctx.fillText('● Re(ψ)', plotX + plotW - 8, wfPlotY + 20);
    ctx.fillStyle = '#f472b6';
    ctx.fillText('● Im(ψ)', plotX + plotW - 8, wfPlotY + 34);

    // ── RIGHT TOP: Energy Spectrum ─────────────────────────────────
    const specX = leftW + margin;
    const specY = margin;
    const specW = rightW - margin;
    const specH = H * 0.32;
    drawMakieAxes(ctx, specX, specY, specW, specH, {
      title: 'Energy Spectrum',
      yLabel: 'Eₙ',
    });

    const coeffs = getCoeffs();
    const energies = [1, 2, 3, 4].map((n) => eigenEnergy(n, p));
    const Emax = Math.max(...energies) * 1.15;

    for (let n = 0; n < 4; n++) {
      const barH = (energies[n] / Emax) * (specH - 40);
      const barW = specW * 0.12;
      const barX = specX + 30 + (n * (specW - 60)) / 3.5;
      const barY = specY + specH - 20 - barH;
      const alpha = 0.3 + Math.abs(coeffs[n]) * 0.7;

      // Bar gradient
      const bg = ctx.createLinearGradient(barX, barY + barH, barX, barY);
      bg.addColorStop(0, `rgba(99,102,241,${alpha * 0.3})`);
      bg.addColorStop(1, viridis(n / 3));
      ctx.fillStyle = bg;
      ctx.fillRect(barX, barY, barW, barH);
      ctx.strokeStyle = viridis(n / 3);
      ctx.lineWidth = 1;
      ctx.strokeRect(barX, barY, barW, barH);

      // Label
      ctx.font = '600 10px "JetBrains Mono", monospace';
      ctx.fillStyle = viridis(n / 3);
      ctx.textAlign = 'center';
      ctx.fillText(`n=${n + 1}`, barX + barW / 2, specY + specH - 6);

      // Coefficient
      ctx.font = '500 8px "JetBrains Mono", monospace';
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.fillText(`c=${coeffs[n].toFixed(2)}`, barX + barW / 2, barY - 6);
    }

    // ── RIGHT BOTTOM: Expectation values time series ───────────────
    const tsX = specX;
    const tsY = specY + specH + 24;
    const tsW = specW;
    const tsH = H - tsY - margin - 14;
    drawMakieAxes(ctx, tsX, tsY, tsW, tsH, {
      title: 'Expectation Values',
      xLabel: 't',
    });

    if (trail.length >= 2) {
      const tMin = trail[0].t;
      const tMax = trail[trail.length - 1].t;
      if (tMax > tMin) {
        let xMax = 0,
          pMax = 0;
        for (const pt of trail) {
          xMax = Math.max(xMax, Math.abs(pt.expectX - L / 2));
          pMax = Math.max(pMax, Math.abs(pt.expectP));
        }
        xMax = Math.max(xMax, 0.01) * 1.3;
        pMax = Math.max(pMax, 0.01) * 1.3;

        const xPts = [],
          pPts = [];
        for (const pt of trail) {
          const tx = tsX + ((pt.t - tMin) / (tMax - tMin)) * tsW;
          xPts.push({ x: tx, y: tsY + tsH / 2 - ((pt.expectX - L / 2) / xMax) * (tsH / 2 - 14) });
          pPts.push({ x: tx, y: tsY + tsH / 2 - (pt.expectP / pMax) * (tsH / 2 - 14) });
        }
        drawGlowLine(ctx, xPts, '#FFD166', 1.5, 6);
        drawGlowLine(ctx, pPts, '#34d399', 1.5, 6);

        // Legend
        ctx.font = '600 9px "JetBrains Mono", monospace';
        ctx.textAlign = 'right';
        ctx.fillStyle = '#FFD166';
        ctx.fillText('● ⟨x⟩', tsX + tsW - 8, tsY + 20);
        ctx.fillStyle = '#34d399';
        ctx.fillText('● ⟨p⟩', tsX + tsW - 8, tsY + 34);
      }
    }

    // ── HUD overlay ────────────────────────────────────────────────
    ctx.font = '500 10px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillText(`t = ${simTime.toFixed(3)}`, W - 140, H - 10);
    ctx.fillText(`∫|ψ|² = ${exp.totalProb.toFixed(6)}`, W - 140, H - 24);
  }

  function tick(dt) {
    simTime += dt * 3; // speed factor
    const wf = computeWavefunction(simTime);
    const exp = computeExpectations(wf);
    trail.push({ t: simTime, expectX: exp.expectX, expectP: exp.expectP });
    if (trail.length > p.trailMax) trail.shift();
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

  simTime = 0;
  trail = [];
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
      simTime = 0;
      trail = [];
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
      const wf = computeWavefunction(simTime);
      const exp = computeExpectations(wf);
      return {
        time: simTime,
        expectX: exp.expectX,
        expectP: exp.expectP,
        totalProb: exp.totalProb,
      };
    },
  };
}
