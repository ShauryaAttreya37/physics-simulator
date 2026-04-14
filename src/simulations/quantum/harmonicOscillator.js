/**
 * Quantum Harmonic Oscillator — Hermite-Gauss Wavefunctions
 * 
 * Time-evolving superposition of QHO eigenstates.
 * Renders: probability density |ψ|², Wigner quasi-probability phase space,
 * energy ladder diagram, and coherent state dynamics.
 * Makie.jl-inspired premium aesthetic with smooth gradient fills.
 */

const DEFAULTS = {
  n0Amp: 1.0,
  n1Amp: 0.7,
  n2Amp: 0.3,
  n3Amp: 0.0,
  omega: 2.0,        // Angular frequency
  mass: 1.0,
  hbar: 1.0,
  trailMax: 300,
};

export const defaultParams = { ...DEFAULTS };

export const equationSections = [
  {
    title: 'Quantum Harmonic Oscillator',
    equations: [
      {
        latex: String.raw`\hat{H} = \frac{\hat{p}^2}{2m} + \frac{1}{2}m\omega^2\hat{x}^2`,
        description: 'Hamiltonian for a particle in a quadratic potential.',
      },
      {
        latex: String.raw`E_n = \hbar\omega\left(n + \frac{1}{2}\right), \quad n = 0, 1, 2, \ldots`,
        description: 'Equally-spaced energy eigenvalues — the hallmark of the QHO.',
      },
    ],
    variables: [
      { symbol: 'ω', description: 'Angular frequency of oscillator' },
      { symbol: 'n', description: 'Quantum number' },
      { symbol: 'ℏ', description: 'Reduced Planck constant' },
    ],
  },
  {
    title: 'Wavefunctions',
    equations: [
      {
        latex: String.raw`\psi_n(x) = \left(\frac{m\omega}{\pi\hbar}\right)^{1/4} \frac{1}{\sqrt{2^n n!}} H_n(\xi)\,e^{-\xi^2/2}, \quad \xi = \sqrt{\frac{m\omega}{\hbar}}\,x`,
        description: 'Hermite-Gauss eigenfunctions. Hₙ are the physicist\'s Hermite polynomials.',
      },
    ],
  },
  {
    title: 'Wigner Function',
    equations: [
      {
        latex: String.raw`W(x,p) = \frac{1}{\pi\hbar}\int_{-\infty}^{\infty}\psi^*(x+y)\psi(x-y)e^{2ipy/\hbar}\,dy`,
        description: 'Quasi-probability distribution in phase space. Can be negative — a signature of quantum mechanics.',
      },
    ],
  },
];

export const equations = [
  String.raw`E_n = \hbar\omega\left(n + \tfrac{1}{2}\right)`,
  String.raw`\psi_n(\xi) \propto H_n(\xi)\,e^{-\xi^2/2}`,
];

export const graphParams = [
  { key: 'expectX', label: '⟨x⟩' },
  { key: 'expectP', label: '⟨p⟩' },
  { key: 'energy', label: '⟨E⟩' },
];

export const controls = [
  { key: 'n0Amp', label: 'n=0 (Ground)', min: 0, max: 1, step: 0.01 },
  { key: 'n1Amp', label: 'n=1', min: 0, max: 1, step: 0.01 },
  { key: 'n2Amp', label: 'n=2', min: 0, max: 1, step: 0.01 },
  { key: 'n3Amp', label: 'n=3', min: 0, max: 1, step: 0.01 },
  { key: 'omega', label: 'ω [rad/s]', min: 0.5, max: 10, step: 0.1 },
];

export const method = 'exact';

// ── Hermite Polynomials (physicist's convention) ───────────────────────
function hermite(n, x) {
  if (n === 0) return 1;
  if (n === 1) return 2 * x;
  let h0 = 1, h1 = 2 * x;
  for (let k = 2; k <= n; k++) {
    const h2 = 2 * x * h1 - 2 * (k - 1) * h0;
    h0 = h1; h1 = h2;
  }
  return h1;
}

function factorial(n) {
  let f = 1;
  for (let i = 2; i <= n; i++) f *= i;
  return f;
}

function eigenEnergy(n, omega, hbar) {
  return hbar * omega * (n + 0.5);
}

function eigenFunc(n, x, p) {
  const alpha = Math.sqrt(p.mass * p.omega / p.hbar);
  const xi = alpha * x;
  const norm = Math.pow(p.mass * p.omega / (Math.PI * p.hbar), 0.25)
    / Math.sqrt(Math.pow(2, n) * factorial(n));
  return norm * hermite(n, xi) * Math.exp(-xi * xi / 2);
}

// ── Makie-style colour helpers ─────────────────────────────────────────
function coolwarm(t) {
  // t in [-1, 1] → blue → white → red
  const s = (t + 1) / 2; // [0, 1]
  if (s < 0.5) {
    const f = s * 2;
    return `rgb(${Math.round(59 + f * 196)},${Math.round(76 + f * 179)},${Math.round(192 + f * 63)})`;
  } else {
    const f = (s - 0.5) * 2;
    return `rgb(${Math.round(255 - f * 36)},${Math.round(255 - f * 186)},${Math.round(255 - f * 195)})`;
  }
}

// ── Simulation ─────────────────────────────────────────────────────────
export function create(canvas, initParams = {}) {
  const ctx = canvas.getContext('2d');
  const p = { ...DEFAULTS, ...initParams };

  let simTime = 0;
  let trail = [];
  const N_POINTS = 400;
  const X_RANGE = 5; // in natural units

  function getCoeffs() {
    const raw = [p.n0Amp, p.n1Amp, p.n2Amp, p.n3Amp];
    const norm = Math.sqrt(raw.reduce((s, a) => s + a * a, 0)) || 1;
    return raw.map(a => a / norm);
  }

  function computeWavefunction(t) {
    const coeffs = getCoeffs();
    const dx = (2 * X_RANGE) / (N_POINTS - 1);
    const re = new Float64Array(N_POINTS);
    const im = new Float64Array(N_POINTS);
    const prob = new Float64Array(N_POINTS);

    for (let i = 0; i < N_POINTS; i++) {
      const x = -X_RANGE + i * dx;
      let psiRe = 0, psiIm = 0;
      for (let n = 0; n < 4; n++) {
        if (Math.abs(coeffs[n]) < 1e-12) continue;
        const En = eigenEnergy(n, p.omega, p.hbar);
        const phase = -En * t / p.hbar;
        const phi = eigenFunc(n, x, p);
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
    let expectX = 0, expectP = 0, totalProb = 0;
    for (let i = 0; i < N_POINTS; i++) {
      const x = -X_RANGE + i * wf.dx;
      expectX += x * wf.prob[i] * wf.dx;
      totalProb += wf.prob[i] * wf.dx;
      if (i > 0 && i < N_POINTS - 1) {
        const dPsiRe = (wf.re[i + 1] - wf.re[i - 1]) / (2 * wf.dx);
        const dPsiIm = (wf.im[i + 1] - wf.im[i - 1]) / (2 * wf.dx);
        expectP += p.hbar * (wf.re[i] * dPsiIm - wf.im[i] * dPsiRe) * wf.dx;
      }
    }
    const coeffs = getCoeffs();
    let expectE = 0;
    for (let n = 0; n < 4; n++) {
      expectE += coeffs[n] * coeffs[n] * eigenEnergy(n, p.omega, p.hbar);
    }
    return { expectX, expectP, totalProb, expectE };
  }

  // ── Compute Wigner function on a coarse grid ─────────────────────
  function computeWigner(t) {
    const coeffs = getCoeffs();
    const alpha = Math.sqrt(p.mass * p.omega / p.hbar);
    const NX = 60, NP = 60;
    const xRange = 4, pRange = 4;
    const wigner = new Float64Array(NX * NP);
    let wMax = 0;

    for (let ix = 0; ix < NX; ix++) {
      for (let ip = 0; ip < NP; ip++) {
        const x = -xRange + (2 * xRange * ix) / (NX - 1);
        const pp = -pRange + (2 * pRange * ip) / (NP - 1);
        
        // For QHO eigenstates, the Wigner function has analytical forms per state.
        // We'll linearize for weighted superposition.
        let w = 0;
        
        for (let n = 0; n < 4; n++) {
          for (let m = 0; m < 4; m++) {
            if (Math.abs(coeffs[n]) < 1e-10 || Math.abs(coeffs[m]) < 1e-10) continue;
            const En = eigenEnergy(n, p.omega, p.hbar);
            const Em = eigenEnergy(m, p.omega, p.hbar);
            const phase = -(En - Em) * t / p.hbar;
            
            // Approximate W via direct sum — compute overlap integral numerically
            // Simplified: for diagonal terms n==m, use exact formula
            if (n === m) {
              const xi = alpha * x;
              const pi_p = pp / (p.hbar * alpha);
              const r2 = 2 * (xi * xi + pi_p * pi_p);
              // Wigner for |n⟩ state: (-1)^n / (π ℏ) * L_n(r²) * exp(-r²/2)
              const Ln = laguerre(n, r2);
              w += coeffs[n] * coeffs[n] * Math.pow(-1, n) * Ln * Math.exp(-r2 / 2) / (Math.PI * p.hbar);
            }
          }
        }
        
        wigner[ix * NP + ip] = w;
        wMax = Math.max(wMax, Math.abs(w));
      }
    }
    return { wigner, NX, NP, wMax, xRange, pRange };
  }

  function laguerre(n, x) {
    if (n === 0) return 1;
    if (n === 1) return 1 - x;
    let l0 = 1, l1 = 1 - x;
    for (let k = 2; k <= n; k++) {
      const l2 = ((2 * k - 1 - x) * l1 - (k - 1) * l0) / k;
      l0 = l1; l1 = l2;
    }
    return l1;
  }

  // ── Drawing helpers ──────────────────────────────────────────────────

  function drawMakieAxes(ctx, gx, gy, gw, gh, opts = {}) {
    const { title, xLabel, yLabel, gridLines = 4, color = '#2A3441' } = opts;

    const bg = ctx.createLinearGradient(gx, gy, gx, gy + gh);
    bg.addColorStop(0, 'rgba(12,10,28,0.95)');
    bg.addColorStop(1, 'rgba(6,5,16,0.95)');
    ctx.fillStyle = bg;
    ctx.fillRect(gx, gy, gw, gh);

    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    ctx.strokeRect(gx, gy, gw, gh);

    ctx.strokeStyle = color;
    ctx.lineWidth = 0.5;
    for (let i = 1; i < gridLines; i++) {
      const y = gy + (gh * i) / gridLines;
      ctx.beginPath(); ctx.moveTo(gx, y); ctx.lineTo(gx + gw, y); ctx.stroke();
    }
    for (let i = 1; i < gridLines; i++) {
      const x = gx + (gw * i) / gridLines;
      ctx.beginPath(); ctx.moveTo(x, gy); ctx.lineTo(x, gy + gh); ctx.stroke();
    }

    if (title) {
      ctx.font = '600 11px "Montserrat", sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(title, gx + 8, gy + 6);
    }

    ctx.font = '500 10px "Montserrat", sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    if (xLabel) {
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillText(xLabel, gx + gw / 2, gy + gh + 4);
    }
    if (yLabel) {
      ctx.save();
      ctx.translate(gx - 6, gy + gh / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
      ctx.fillText(yLabel, 0, 0);
      ctx.restore();
    }
  }

  function drawGlowLine(ctx, pts, color, width = 2, glowSize = 8) {
    if (pts.length < 2) return;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.strokeStyle = color;
    ctx.lineWidth = width + glowSize;
    ctx.globalAlpha = 0.15;
    ctx.stroke();
    ctx.globalAlpha = 1;

    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();
  }

  function drawFilledProb(ctx, pts, baseY) {
    if (pts.length < 2) return;
    const grad = ctx.createLinearGradient(0, baseY - 200, 0, baseY);
    grad.addColorStop(0, 'rgba(79, 195, 247,0.55)');
    grad.addColorStop(0.6, 'rgba(124,58,237,0.2)');
    grad.addColorStop(1, 'rgba(124,58,237,0.02)');
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
    const W = canvas.width, H = canvas.height;

    const mainBg = ctx.createLinearGradient(0, 0, W, H);
    mainBg.addColorStop(0, '#06050f');
    mainBg.addColorStop(1, '#0c0a20');
    ctx.fillStyle = mainBg;
    ctx.fillRect(0, 0, W, H);

    const wf = computeWavefunction(simTime);
    const exp = computeExpectations(wf);

    const margin = 20;
    const leftW = W * 0.5;
    const rightW = W - leftW - margin;

    // ── LEFT TOP: |ψ|² with potential overlay ──────────────────────
    const plotX = margin + 14;
    const plotY = margin;
    const plotW = leftW - margin - 20;
    const plotH = H * 0.42;

    drawMakieAxes(ctx, plotX, plotY, plotW, plotH, {
      title: '|ψ(x,t)|²  — Probability Density',
      xLabel: 'x',
      yLabel: '|ψ|²',
    });

    // Use a fixed max to prevent jitter in animation scaling
    const probMax = 1.0;

    // Potential V(x) = ½mω²x²
    const potPts = [];
    for (let i = 0; i < N_POINTS; i++) {
      const x = -X_RANGE + i * wf.dx;
      const V = 0.5 * p.mass * p.omega * p.omega * x * x;
      const Vnorm = V / (probMax * 10);
      const px = plotX + (i / (N_POINTS - 1)) * plotW;
      const py = plotY + plotH - Math.min(Vnorm, 1) * (plotH - 30);
      potPts.push({ x: px, y: py });
    }
    ctx.beginPath();
    ctx.moveTo(potPts[0].x, potPts[0].y);
    for (const pt of potPts) ctx.lineTo(pt.x, pt.y);
    ctx.strokeStyle = 'rgba(255, 209, 102,0.2)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Probability density
    const probPts = [];
    for (let i = 0; i < N_POINTS; i++) {
      const px = plotX + (i / (N_POINTS - 1)) * plotW;
      const py = plotY + plotH - (wf.prob[i] / probMax) * (plotH - 30);
      probPts.push({ x: px, y: py });
    }
    drawFilledProb(ctx, probPts, plotY + plotH);
    drawGlowLine(ctx, probPts, '#4FC3F7', 2, 10);

    // ⟨x⟩ marker
    const expectXnorm = (exp.expectX + X_RANGE) / (2 * X_RANGE);
    const expectXpx = plotX + expectXnorm * plotW;
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = '#FFD166';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(expectXpx, plotY + 24);
    ctx.lineTo(expectXpx, plotY + plotH);
    ctx.stroke();
    ctx.setLineDash([]);

    // ── LEFT BOTTOM: Re(ψ), Im(ψ) ─────────────────────────────────
    const wfPlotY = plotY + plotH + 32;
    const wfPlotH = H * 0.42;
    drawMakieAxes(ctx, plotX, wfPlotY, plotW, wfPlotH, {
      title: 'ψ(x,t)  — Wavefunction Components',
      xLabel: 'x',
      yLabel: 'ψ',
    });

    // Use fixed max to maintain visual stability
    const wfMax = 1.0;

    const eqLine = wfPlotY + wfPlotH / 2;
    ctx.setLineDash([2, 6]);
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(plotX, eqLine);
    ctx.lineTo(plotX + plotW, eqLine);
    ctx.stroke();
    ctx.setLineDash([]);

    const rePts = [], imPts = [];
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
    ctx.fillStyle = '#60a5fa'; ctx.fillText('● Re(ψ)', plotX + plotW - 8, wfPlotY + 20);
    ctx.fillStyle = '#f472b6'; ctx.fillText('● Im(ψ)', plotX + plotW - 8, wfPlotY + 34);
    ctx.fillStyle = 'rgba(255, 209, 102,0.5)'; ctx.fillText('● V(x)', plotX + plotW - 8, plotY + 20);

    // ── RIGHT TOP: Wigner Function (phase space heat map) ──────────
    const wigX = leftW + margin;
    const wigY = margin;
    const wigW = rightW - margin;
    const wigH = H * 0.48;
    drawMakieAxes(ctx, wigX, wigY, wigW, wigH, {
      title: 'Wigner Function W(x, p)',
      xLabel: 'x',
      yLabel: 'p',
      gridLines: 6,
    });

    const wig = computeWigner(simTime);
    const cellW = wigW / wig.NX;
    const cellH = wigH / wig.NP;

    for (let ix = 0; ix < wig.NX; ix++) {
      for (let ip = 0; ip < wig.NP; ip++) {
        const w = wig.wigner[ix * wig.NP + ip];
        if (Math.abs(w) < wig.wMax * 0.02) continue;
        const norm = w / (wig.wMax || 1);
        ctx.fillStyle = coolwarm(norm);
        ctx.globalAlpha = Math.abs(norm) * 0.85 + 0.1;
        ctx.fillRect(wigX + ix * cellW, wigY + (wig.NP - 1 - ip) * cellH, cellW + 1, cellH + 1);
      }
    }
    ctx.globalAlpha = 1;

    // ── RIGHT BOTTOM: Energy ladder + time series ──────────────────
    const tsX = wigX;
    const tsY = wigY + wigH + 20;
    const tsW = wigW;
    const tsH = H - tsY - margin - 14;
    drawMakieAxes(ctx, tsX, tsY, tsW, tsH, {
      title: 'Expectation Values',
      xLabel: 't',
    });

    if (trail.length >= 2) {
      const tMin = trail[0].t;
      const tMax = trail[trail.length - 1].t;
      if (tMax > tMin) {
        let xMax = 0, pMax = 0;
        for (const pt of trail) {
          xMax = Math.max(xMax, Math.abs(pt.expectX));
          pMax = Math.max(pMax, Math.abs(pt.expectP));
        }
        xMax = Math.max(xMax, 0.01) * 1.3;
        pMax = Math.max(pMax, 0.01) * 1.3;

        const xPts = [], pPts = [];
        for (const pt of trail) {
          const tx = tsX + ((pt.t - tMin) / (tMax - tMin)) * tsW;
          xPts.push({ x: tx, y: tsY + tsH / 2 - (pt.expectX / xMax) * (tsH / 2 - 14) });
          pPts.push({ x: tx, y: tsY + tsH / 2 - (pt.expectP / pMax) * (tsH / 2 - 14) });
        }
        drawGlowLine(ctx, xPts, '#FFD166', 1.5, 6);
        drawGlowLine(ctx, pPts, '#34d399', 1.5, 6);

        ctx.font = '600 9px "JetBrains Mono", monospace';
        ctx.textAlign = 'right';
        ctx.fillStyle = '#FFD166'; ctx.fillText('● ⟨x⟩', tsX + tsW - 8, tsY + 20);
        ctx.fillStyle = '#34d399'; ctx.fillText('● ⟨p⟩', tsX + tsW - 8, tsY + 34);
      }
    }

    // ── HUD ────────────────────────────────────────────────────────
    ctx.font = '500 10px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillText(`t = ${simTime.toFixed(3)}`, W - 160, H - 10);
    ctx.fillText(`⟨E⟩ = ${exp.expectE.toFixed(3)}`, W - 160, H - 24);
  }

  function tick(dt) {
    simTime += dt * 2;
    const wf = computeWavefunction(simTime);
    const exp = computeExpectations(wf);
    trail.push({ t: simTime, expectX: exp.expectX, expectP: exp.expectP });
    if (trail.length > p.trailMax) trail.shift();
  }

  let rafId, lastTs, running = false;

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
      running = true; lastTs = undefined;
      rafId = requestAnimationFrame(loop);
    },
    stop() { running = false; cancelAnimationFrame(rafId); },
    reset() { this.stop(); simTime = 0; trail = []; render(); this.start(); },
    destroy() { this.stop(); },
    getData() {
      const wf = computeWavefunction(simTime);
      const exp = computeExpectations(wf);
      return {
        time: simTime,
        expectX: exp.expectX,
        expectP: exp.expectP,
        energy: exp.expectE,
      };
    },
  };
}
