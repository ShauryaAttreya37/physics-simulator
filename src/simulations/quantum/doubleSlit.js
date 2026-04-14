/**
 * Double Slit Experiment — Wave Mechanics
 * 
 * Simulates the interference pattern from two slits using Huygens-Fresnel
 * diffraction. Renders: real-time intensity build-up, individual slit
 * contributions, and the classic fringe pattern on a detection screen.
 * Makie.jl-inspired premium aesthetic.
 */

const DEFAULTS = {
  slitSeparation: 0.5,  // d (mm)
  slitWidth: 0.1,       // a (mm)
  wavelength: 0.0005,   // λ (mm) ~ 500nm green
  screenDist: 200,      // L (mm)
  numParticles: 0,
  particleRate: 5,
  trailMax: 400,
};

export const defaultParams = { ...DEFAULTS };

export const equationSections = [
  {
    title: 'Double Slit Intensity',
    equations: [
      {
        latex: String.raw`I(\theta) = I_0 \cos^2\!\left(\frac{\pi d \sin\theta}{\lambda}\right)\,\mathrm{sinc}^2\!\left(\frac{\pi a \sin\theta}{\lambda}\right)`,
        description: 'Combined interference (cos²) and single-slit diffraction (sinc²) envelope.',
      },
      {
        latex: String.raw`y_m = \frac{m\lambda L}{d}, \quad m = 0, \pm 1, \pm 2, \ldots`,
        description: 'Positions of constructive interference maxima on the screen.',
      },
    ],
    variables: [
      { symbol: 'd', description: 'Slit separation' },
      { symbol: 'a', description: 'Slit width' },
      { symbol: 'λ', description: 'Wavelength' },
      { symbol: 'L', description: 'Screen distance' },
    ],
  },
  {
    title: 'Wave-Particle Duality',
    equations: [
      {
        latex: String.raw`p = \frac{h}{\lambda} = \frac{2\pi\hbar}{\lambda}`,
        description: 'de Broglie relation — every quantum particle has an associated wavelength.',
      },
      {
        latex: String.raw`|\psi|^2 \propto I(\theta) \quad \text{(Born rule: probability ∝ intensity)}`,
        description: 'Individual photon/electron detections build up the interference pattern statistically.',
      },
    ],
  },
];

export const equations = [
  String.raw`I(\theta) = I_0\cos^2\!\left(\frac{\pi d\sin\theta}{\lambda}\right)\mathrm{sinc}^2\!\left(\frac{\pi a\sin\theta}{\lambda}\right)`,
  String.raw`\Delta y = \frac{\lambda L}{d}`,
];

export const graphParams = [
  { key: 'numParticles', label: 'Detections' },
  { key: 'peakIntensity', label: 'I_peak' },
  { key: 'fringeSpacing', label: 'Δy [mm]' },
];

export const controls = [
  { key: 'slitSeparation', label: 'd — Slit Separation [mm]', min: 0.1, max: 2.0, step: 0.01 },
  { key: 'slitWidth', label: 'a — Slit Width [mm]', min: 0.01, max: 0.5, step: 0.005 },
  { key: 'wavelength', label: 'λ — Wavelength [mm]', min: 0.0002, max: 0.001, step: 0.00001 },
  { key: 'screenDist', label: 'L — Screen Distance [mm]', min: 50, max: 500, step: 5 },
  { key: 'particleRate', label: 'Particle Rate', min: 1, max: 50, step: 1 },
];

export const method = 'analytical';

// ── Physics ────────────────────────────────────────────────────────────
function sinc(x) {
  if (Math.abs(x) < 1e-10) return 1;
  return Math.sin(x) / x;
}

function intensity(y, p) {
  const sinTheta = y / Math.sqrt(y * y + p.screenDist * p.screenDist);
  const alpha = Math.PI * p.slitWidth * sinTheta / p.wavelength;
  const beta = Math.PI * p.slitSeparation * sinTheta / p.wavelength;
  return sinc(alpha) * sinc(alpha) * Math.cos(beta) * Math.cos(beta);
}

function wavelengthToRGB(lambda_mm) {
  // lambda in mm, convert to nm
  const nm = lambda_mm * 1e6;
  let r = 0, g = 0, b = 0;
  if (nm >= 380 && nm < 440) {
    r = -(nm - 440) / (440 - 380); g = 0; b = 1;
  } else if (nm >= 440 && nm < 490) {
    r = 0; g = (nm - 440) / (490 - 440); b = 1;
  } else if (nm >= 490 && nm < 510) {
    r = 0; g = 1; b = -(nm - 510) / (510 - 490);
  } else if (nm >= 510 && nm < 580) {
    r = (nm - 510) / (580 - 510); g = 1; b = 0;
  } else if (nm >= 580 && nm < 645) {
    r = 1; g = -(nm - 645) / (645 - 580); b = 0;
  } else if (nm >= 645 && nm <= 780) {
    r = 1; g = 0; b = 0;
  }
  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
}

// ── Simulation ─────────────────────────────────────────────────────────
export const scenarios = [
  {
    name: 'Standard Interference',
    description: 'Default double-slit parameters showing clear interference fringes.',
    params: { slitSep: 0.15, slitWidth: 0.03, wavelength: 0.02, particleRate: 15 },
  },
  {
    name: 'Wide Slit Separation',
    description: 'Increase slit spacing — fringes become closer together.',
    params: { slitSep: 0.35, slitWidth: 0.03, wavelength: 0.02, particleRate: 15 },
  },
  {
    name: 'Single Slit',
    description: 'Close one slit — observe diffraction but no interference pattern.',
    params: { slitSep: 0, slitWidth: 0.05, wavelength: 0.02, particleRate: 15 },
  },
  {
    name: 'Long Wavelength',
    description: 'Increase wavelength — fringes spread out, diffraction dominates.',
    params: { slitSep: 0.15, slitWidth: 0.03, wavelength: 0.06, particleRate: 15 },
  },
  {
    name: 'Particle by Particle',
    description: 'Very slow rate — watch individual "particle" detections build the pattern one by one.',
    params: { slitSep: 0.15, slitWidth: 0.03, wavelength: 0.02, particleRate: 2 },
  },
];

export const guidedExperiments = [
  {
    title: 'Wave-Particle Duality',
    steps: [
      {
        instruction: 'We start with a single slit. Press Play and observe where particles land on the detector screen.',
        params: { slitSep: 0, slitWidth: 0.05, wavelength: 0.02, particleRate: 15 },
        question: 'With a single slit, what pattern will the particles form?',
        choices: ['A sharp line directly behind the slit', 'A smooth blob/bell curve (single-slit diffraction)', 'Alternating bright and dark fringes'],
        correctIndex: 1,
        explanation: 'Single-slit diffraction produces a broad central peak with weak side lobes. The width of the central peak is inversely proportional to the slit width — narrower slits spread the pattern more.',
      },
      {
        instruction: 'Now open the second slit (slitSep = 0.15). Reset and play. Watch carefully as particles accumulate.',
        params: { slitSep: 0.15, slitWidth: 0.03, wavelength: 0.02, particleRate: 15 },
        question: 'With two slits open, what pattern will emerge?',
        choices: ['Two blobs (one behind each slit)', 'Interference fringes (alternating bright/dark bands)', 'Same as single slit but brighter'],
        correctIndex: 1,
        commonMisconception: 'Intuition says: two slits → two blobs. But quantum mechanics says each particle interferes with itself, passing through both slits simultaneously. The probability distribution shows interference fringes.',
        explanation: 'Each particle arrives as a point (particle-like detection), but the statistical distribution follows the wave-like interference pattern. This is the central mystery of quantum mechanics — Feynman called it "the only mystery."',
        tryThis: 'Slow down the particle rate to 2 and watch individual dots accumulate into fringes.',
      },
      {
        instruction: 'Increase the slit separation to 0.35. Reset and observe.',
        params: { slitSep: 0.35, slitWidth: 0.03, wavelength: 0.02, particleRate: 15 },
        question: 'As slit separation increases, what happens to the fringe spacing?',
        choices: ['Fringes get wider apart', 'Fringes get closer together', 'No change'],
        correctIndex: 1,
        explanation: 'Fringe spacing Δy = λL/d. As slit separation d increases, fringes become closer together. This is the inverse relationship that makes diffraction so useful — we can measure nanometer features using millimeter-spaced fringes.',
      },
    ],
  },
];

export function create(canvas, initParams = {}) {
  const ctx = canvas.getContext('2d');
  const p = { ...DEFAULTS, ...initParams };

  let simTime = 0;
  let particles = []; // Accumulated detection points
  let histogram = new Float64Array(200); // Binned detections

  function sampleParticleY() {
    // Rejection sampling from intensity distribution
    const yMax = p.screenDist * Math.tan(Math.asin(3 * p.wavelength / p.slitSeparation || 0.05));
    const yRange = Math.max(yMax, 5);
    for (let attempt = 0; attempt < 100; attempt++) {
      const y = (Math.random() * 2 - 1) * yRange;
      const I = intensity(y, p);
      if (Math.random() < I) return y;
    }
    return 0; // fallback
  }

  function addParticles(count) {
    for (let i = 0; i < count; i++) {
      const y = sampleParticleY();
      particles.push(y);
      p.numParticles++;
      // Bin it
      const yMax = 5;
      const bin = Math.floor(((y + yMax) / (2 * yMax)) * histogram.length);
      if (bin >= 0 && bin < histogram.length) histogram[bin]++;
    }
  }

  // ── Drawing helpers ──────────────────────────────────────────────────
  function drawMakieAxes(gx, gy, gw, gh, opts = {}) {
    const { title, xLabel, yLabel, gridLines = 4 } = opts;

    const bg = ctx.createLinearGradient(gx, gy, gx, gy + gh);
    bg.addColorStop(0, 'rgba(10,8,22,0.95)');
    bg.addColorStop(1, 'rgba(5,4,14,0.95)');
    ctx.fillStyle = bg;
    ctx.fillRect(gx, gy, gw, gh);

    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    ctx.strokeRect(gx, gy, gw, gh);

    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 0.5;
    for (let i = 1; i < gridLines; i++) {
      const y = gy + (gh * i) / gridLines;
      ctx.beginPath(); ctx.moveTo(gx, y); ctx.lineTo(gx + gw, y); ctx.stroke();
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

  function drawGlowLine(pts, color, width = 2, glowSize = 8) {
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

  // ── Main render ──────────────────────────────────────────────────────
  function render() {
    const W = canvas.width, H = canvas.height;

    const mainBg = ctx.createLinearGradient(0, 0, W, H);
    mainBg.addColorStop(0, '#04040e');
    mainBg.addColorStop(1, '#080818');
    ctx.fillStyle = mainBg;
    ctx.fillRect(0, 0, W, H);

    const margin = 20;
    const rgb = wavelengthToRGB(p.wavelength);
    const beamColor = `rgb(${rgb.r},${rgb.g},${rgb.b})`;
    const beamColorAlpha = (a) => `rgba(${rgb.r},${rgb.g},${rgb.b},${a})`;

    // Layout: left = apparatus schematic, right top = intensity curve, right bottom = histogram
    const leftW = W * 0.4;
    const rightW = W - leftW - margin;

    // ── LEFT: Apparatus schematic ──────────────────────────────────
    const appX = margin;
    const appY = margin;
    const appW = leftW - margin;
    const appH = H - 2 * margin;

    drawMakieAxes(appX, appY, appW, appH, { title: 'Double Slit Apparatus' });

    // Source
    const srcX = appX + 30;
    const srcY = appY + appH / 2;
    ctx.beginPath();
    ctx.arc(srcX, srcY, 8, 0, Math.PI * 2);
    ctx.fillStyle = beamColorAlpha(0.8);
    ctx.shadowBlur = 20;
    ctx.shadowColor = beamColor;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.font = '500 8px "JetBrains Mono", monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.textAlign = 'center';
    ctx.fillText('source', srcX, srcY + 20);

    // Barrier with slits
    const barrierX = appX + appW * 0.45;
    const slitPixGap = Math.min(appH * 0.3, 100);
    const slitPixWidth = Math.max(4, slitPixGap * 0.2);

    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillRect(barrierX - 3, appY + 10, 6, (appH / 2 - slitPixGap / 2 - slitPixWidth / 2) - 10);
    ctx.fillRect(barrierX - 3, srcY - slitPixGap / 2 + slitPixWidth / 2, 6, slitPixGap - slitPixWidth);
    ctx.fillRect(barrierX - 3, srcY + slitPixGap / 2 + slitPixWidth / 2, 6, (appH / 2 - slitPixGap / 2 - slitPixWidth / 2) - 10);

    // Slit glow
    const slit1Y = srcY - slitPixGap / 2;
    const slit2Y = srcY + slitPixGap / 2;
    [slit1Y, slit2Y].forEach(sy => {
      ctx.fillStyle = beamColorAlpha(0.6);
      ctx.fillRect(barrierX - 2, sy - slitPixWidth / 2, 4, slitPixWidth);
    });

    // Beams from source to slits
    ctx.strokeStyle = beamColorAlpha(0.15);
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(srcX, srcY); ctx.lineTo(barrierX, slit1Y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(srcX, srcY); ctx.lineTo(barrierX, slit2Y); ctx.stroke();

    // Spreading wavefronts after slits
    for (let i = 1; i <= 6; i++) {
      const r = i * 18;
      ctx.strokeStyle = beamColorAlpha(0.06 + 0.02 * (6 - i));
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(barrierX, slit1Y, r, -Math.PI / 3, Math.PI / 3); ctx.stroke();
      ctx.beginPath(); ctx.arc(barrierX, slit2Y, r, -Math.PI / 3, Math.PI / 3); ctx.stroke();
    }

    // Detection screen
    const screenX = appX + appW - 20;
    ctx.fillStyle = '#2A3441';
    ctx.fillRect(screenX - 2, appY + 10, 4, appH - 20);

    // Particle hits on screen
    const yPixRange = (appH - 40) / 2;
    const yDataRange = 5;
    const recentN = Math.min(particles.length, 2000);
    for (let i = particles.length - recentN; i < particles.length; i++) {
      const yNorm = particles[i] / yDataRange;
      const py = srcY - yNorm * yPixRange;
      const age = (particles.length - i) / recentN;
      ctx.fillStyle = beamColorAlpha(0.15 + (1 - age) * 0.6);
      ctx.fillRect(screenX - 1, py, 2, 1);
    }

    ctx.font = '500 8px "JetBrains Mono", monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.textAlign = 'center';
    ctx.fillText('screen', screenX, appY + appH - 4);

    // ── RIGHT TOP: Theoretical intensity curve ─────────────────────
    const curveX = leftW + margin;
    const curveY = margin;
    const curveW = rightW - margin;
    const curveH = H * 0.42;
    drawMakieAxes(curveX, curveY, curveW, curveH, {
      title: 'I(y) — Theoretical Intensity',
      xLabel: 'y [mm]',
      yLabel: 'I / I₀',
    });

    const N_CURVE = 500;
    const yMax = 5;
    const curvePts = [];
    for (let i = 0; i < N_CURVE; i++) {
      const y = -yMax + (2 * yMax * i) / (N_CURVE - 1);
      const I = intensity(y, p);
      const px = curveX + (i / (N_CURVE - 1)) * curveW;
      const py = curveY + curveH - I * (curveH - 30) - 15;
      curvePts.push({ x: px, y: py });
    }

    // Fill under curve
    ctx.beginPath();
    ctx.moveTo(curvePts[0].x, curveY + curveH);
    for (const pt of curvePts) ctx.lineTo(pt.x, pt.y);
    ctx.lineTo(curvePts[curvePts.length - 1].x, curveY + curveH);
    ctx.closePath();
    const fillGrad = ctx.createLinearGradient(0, curveY, 0, curveY + curveH);
    fillGrad.addColorStop(0, beamColorAlpha(0.4));
    fillGrad.addColorStop(1, beamColorAlpha(0.02));
    ctx.fillStyle = fillGrad;
    ctx.fill();

    drawGlowLine(curvePts, beamColor, 2, 10);

    // Single-slit envelope
    const envPts = [];
    for (let i = 0; i < N_CURVE; i++) {
      const y = -yMax + (2 * yMax * i) / (N_CURVE - 1);
      const sinTheta = y / Math.sqrt(y * y + p.screenDist * p.screenDist);
      const alpha = Math.PI * p.slitWidth * sinTheta / p.wavelength;
      const env = sinc(alpha) * sinc(alpha);
      const px = curveX + (i / (N_CURVE - 1)) * curveW;
      const py = curveY + curveH - env * (curveH - 30) - 15;
      envPts.push({ x: px, y: py });
    }
    ctx.beginPath();
    ctx.moveTo(envPts[0].x, envPts[0].y);
    for (const pt of envPts) ctx.lineTo(pt.x, pt.y);
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = 'rgba(255, 209, 102,0.4)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.setLineDash([]);

    // Legend
    ctx.font = '600 9px "JetBrains Mono", monospace';
    ctx.textAlign = 'right';
    ctx.fillStyle = beamColor; ctx.fillText('● Double Slit', curveX + curveW - 8, curveY + 20);
    ctx.fillStyle = 'rgba(255, 209, 102,0.6)'; ctx.fillText('╌ Envelope', curveX + curveW - 8, curveY + 34);

    // ── RIGHT BOTTOM: Detection histogram ──────────────────────────
    const histX = curveX;
    const histY = curveY + curveH + 28;
    const histW = curveW;
    const histH = H - histY - margin - 14;
    drawMakieAxes(histX, histY, histW, histH, {
      title: `Detection Histogram (n = ${p.numParticles})`,
      xLabel: 'y [mm]',
      yLabel: 'Counts',
    });

    let histMax = 0;
    for (let i = 0; i < histogram.length; i++) histMax = Math.max(histMax, histogram[i]);
    histMax = Math.max(histMax, 1);

    const barW = histW / histogram.length;
    for (let i = 0; i < histogram.length; i++) {
      const h = (histogram[i] / histMax) * (histH - 30);
      if (h < 0.5) continue;
      const bx = histX + i * barW;
      const by = histY + histH - h;

      const barGrad = ctx.createLinearGradient(bx, by + h, bx, by);
      barGrad.addColorStop(0, beamColorAlpha(0.15));
      barGrad.addColorStop(1, beamColorAlpha(0.7));
      ctx.fillStyle = barGrad;
      ctx.fillRect(bx, by, barW + 0.5, h);
    }

    // Fringe spacing annotation
    const fringeSpacing = p.wavelength * p.screenDist / p.slitSeparation;
    ctx.font = '500 10px "JetBrains Mono", monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.textAlign = 'left';
    ctx.fillText(`Δy = λL/d = ${fringeSpacing.toFixed(4)} mm`, histX + 8, histY + histH + 16);

    // ── HUD ────────────────────────────────────────────────────────
    ctx.font = '500 10px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillText(`t = ${simTime.toFixed(2)}`, W - 140, H - 10);
    ctx.fillText(`n = ${p.numParticles}`, W - 140, H - 24);
  }

  function tick(dt) {
    simTime += dt;
    addParticles(p.particleRate);
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

  // Init
  simTime = 0;
  particles = [];
  histogram = new Float64Array(200);
  p.numParticles = 0;
  render();

  return {
    start() {
      if (running) return;
      running = true; lastTs = undefined;
      rafId = requestAnimationFrame(loop);
    },
    stop() { running = false; cancelAnimationFrame(rafId); },
    reset() {
      this.stop();
      simTime = 0; particles = []; histogram = new Float64Array(200); p.numParticles = 0;
      render(); this.start();
    },
    destroy() { this.stop(); },
    getData() {
      const fringeSpacing = p.wavelength * p.screenDist / p.slitSeparation;
      return {
        time: simTime,
        numParticles: p.numParticles,
        peakIntensity: 1.0,
        fringeSpacing,
      };
    },
  };
}
