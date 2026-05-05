const DEFAULTS = {
  gridWidth: 280,
  gridHeight: 200,
  waveSpeed: 0.48,
  damping: 0.9985,
  splashRadius: 6,
  splashStrength: 1.5,
  stepsPerFrame: 3,
};

export const defaultParams = {
  gridWidth: 280,
  gridHeight: 200,
  waveSpeed: 0.48,
  damping: 0.9985,
  splashRadius: 6,
  splashStrength: 1.5,
  stepsPerFrame: 3,
};

export const equationSections = [
  {
    title: 'Introduction',
    content:
      'Water waves demonstrate how energy propagates through a medium. This simulation shows 2D waves on a surface, like ripples in a pond. Waves can interfere, reflect, and dissipate. You can create splashes and watch how they spread and interact.',
  },
  {
    title: 'Wave Equation',
    equations: [
      {
        latex: String.raw`\frac{\partial^2 u}{\partial t^2} = c^2 \nabla^2 u`,
        description:
          'The 2D wave equation. u is the wave height, c is wave speed, ∇² is the Laplacian (curvature). This governs how waves propagate.',
      },
      {
        latex: String.raw`u_{t+1} = 2u_t - u_{t-1} + c^2(\Delta u_t) \times \text{damping}`,
        description:
          "Numerical solution using finite differences. Each point's future height depends on current and past values plus neighboring curvature.",
      },
    ],
    variables: [
      { symbol: 'u', description: 'Wave amplitude (height of water surface)' },
      { symbol: 'c', description: 'Wave speed - how fast disturbances travel' },
      { symbol: '∇²u', description: 'Laplacian - measures how curved the surface is' },
    ],
  },
  {
    title: 'Wave Properties',
    equations: [
      {
        latex: String.raw`v = f \lambda`,
        description:
          'Wave speed equals frequency times wavelength. Faster waves have longer wavelengths at same frequency.',
      },
      {
        latex: String.raw`E \propto A^2`,
        description:
          'Wave energy is proportional to amplitude squared. Bigger splashes carry more energy.',
      },
    ],
  },
  {
    title: 'How to Use',
    content:
      '1. Click anywhere on the water surface to create a splash.\n2. Adjust wave speed - faster waves travel quicker but may become unstable.\n3. Change damping - higher damping makes waves die out faster.\n4. Try different splash sizes and strengths.\n5. Watch waves reflect off boundaries and interfere with each other.\n6. Look at the amplitude graphs to see how energy dissipates.',
  },
  {
    title: 'Beginner Tips',
    content:
      'Waves add up when they meet (superposition). Crest + crest = bigger wave, crest + trough = flat. Waves lose energy to friction. Try making multiple splashes to see interference patterns. The grid shows wave propagation in real time.',
  },
];

export const equations = [
  String.raw`\frac{\partial^2 u}{\partial t^2} = c^2 \nabla^2 u`,
  String.raw`u_{t+1} = 2u_t - u_{t-1} + c^2(\Delta u_t) \times \text{damp}`,
];

export const graphParams = [
  { key: 'centerAmp', label: 'Center Amplitude' },
  { key: 'totalEnergyP', label: 'Average Absolute Amplitude' },
];

export const controls = [
  { key: 'gridWidth', label: 'Grid Width', min: 120, max: 420, step: 1 },
  { key: 'gridHeight', label: 'Grid Height', min: 90, max: 300, step: 1 },
  { key: 'waveSpeed', label: 'Wave Speed', min: 0.2, max: 0.499, step: 0.001 },
  { key: 'damping', label: 'Damping', min: 0.985, max: 0.9999, step: 0.0001 },
  { key: 'splashRadius', label: 'Splash Radius', min: 2, max: 20, step: 1 },
  { key: 'splashStrength', label: 'Splash Strength', min: 0.2, max: 3, step: 0.05 },
  { key: 'stepsPerFrame', label: 'Steps / Frame', min: 1, max: 8, step: 1 },
];

const LUT_SIZE = 512;
const LUT = new Uint8Array(LUT_SIZE * 3);
(function buildLUT() {
  for (let i = 0; i < LUT_SIZE; i++) {
    const t = (i / (LUT_SIZE - 1)) * 2 - 1;
    let r;
    let g;
    let b;
    if (t >= 0) {
      const s = t;
      r = Math.round(10 + s * 220);
      g = Math.round(50 + s * 210);
      b = Math.round(160 + s * 95);
    } else {
      const s = -t;
      r = Math.round(10 - s * 8);
      g = Math.round(50 - s * 40);
      b = Math.round(160 - s * 80);
    }
    LUT[i * 3] = clamp255(r);
    LUT[i * 3 + 1] = clamp255(g);
    LUT[i * 3 + 2] = clamp255(b);
  }
})();

function clamp255(v) {
  return Math.max(0, Math.min(255, v));
}

function lutColor(h) {
  const i = Math.round(((Math.max(-1, Math.min(1, h)) + 1) / 2) * (LUT_SIZE - 1));
  return [LUT[i * 3], LUT[i * 3 + 1], LUT[i * 3 + 2]];
}

export function create(canvas, initParams = {}) {
  const ctx = canvas.getContext('2d');
  const p = { ...DEFAULTS, ...initParams };

  const GW = Math.max(40, Math.floor(p.gridWidth));
  const GH = Math.max(40, Math.floor(p.gridHeight));
  const C2 = p.waveSpeed * p.waveSpeed;

  let cur = new Float32Array(GW * GH);
  let prev = new Float32Array(GW * GH);

  const pixels = new Uint8ClampedArray(GW * GH * 4);
  let imgData;

  const offscreen = document.createElement('canvas');
  offscreen.width = GW;
  offscreen.height = GH;
  const offCtx = offscreen.getContext('2d');

  function splashAt(gx, gy, amp) {
    const R = Math.max(1, Math.floor(p.splashRadius));
    for (let dy = -R; dy <= R; dy++) {
      for (let dx = -R; dx <= R; dx++) {
        const ix = Math.round(gx + dx);
        const iy = Math.round(gy + dy);
        if (ix < 0 || ix >= GW || iy < 0 || iy >= GH) continue;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d <= R) cur[iy * GW + ix] += amp * Math.cos(((d / R) * Math.PI) / 2);
      }
    }
  }

  function initState() {
    cur.fill(0);
    prev.fill(0);
    splashAt(GW * 0.5, GH * 0.5, 1.0);
    splashAt(GW * 0.25, GH * 0.35, 0.8);
    splashAt(GW * 0.75, GH * 0.65, 0.7);
  }

  function tick() {
    const next = prev;
    for (let y = 1; y < GH - 1; y++) {
      for (let x = 1; x < GW - 1; x++) {
        const i = y * GW + x;
        const lap = cur[i - 1] + cur[i + 1] + cur[i - GW] + cur[i + GW] - 4 * cur[i];
        next[i] = (2 * cur[i] - prev[i] + C2 * lap) * p.damping;
      }
    }
    prev = cur;
    cur = next;
  }

  function renderGrid() {
    for (let i = 0; i < GW * GH; i++) {
      const [r, g, b] = lutColor(cur[i]);
      const o = i * 4;
      pixels[o] = r;
      pixels[o + 1] = g;
      pixels[o + 2] = b;
      pixels[o + 3] = 255;
    }
    if (!imgData) imgData = offCtx.createImageData(GW, GH);
    imgData.data.set(pixels);
    offCtx.putImageData(imgData, 0, 0);
  }

  function render() {
    const W = canvas.width;
    const H = canvas.height;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'medium';
    ctx.drawImage(offscreen, 0, 0, W, H);

    const vig = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.9);
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, 'rgba(0,0,12,0.5)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, W, H);
  }

  function onPointer(e) {
    const rect = canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const gx = (sx / canvas.width) * GW;
    const gy = (sy / canvas.height) * GH;
    splashAt(gx, gy, p.splashStrength);
  }

  canvas.addEventListener('pointerdown', onPointer);

  let rafId;
  let running = false;

  function loop() {
    if (!running) return;
    const steps = Math.max(1, Math.floor(p.stepsPerFrame));
    for (let i = 0; i < steps; i++) tick();
    renderGrid();
    render();
    rafId = requestAnimationFrame(loop);
  }

  initState();
  renderGrid();
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
      this.stop();
      initState();
      renderGrid();
      render();
      this.start();
    },
    setParams(next) {
      Object.assign(p, next);
      render();
    },
    destroy() {
      this.stop();
      canvas.removeEventListener('pointerdown', onPointer);
    },
    getData() {
      let sum = 0;
      for (let i = 0; i < cur.length; i++) sum += Math.abs(cur[i]);
      const centerIdx = Math.floor(GH / 2) * GW + Math.floor(GW / 2);
      return {
        time: (Date.now() / 1000) % 10000,
        centerAmp: cur[centerIdx] || 0,
        totalEnergyP: cur.length ? sum / cur.length : 0,
      };
    },
  };
}
