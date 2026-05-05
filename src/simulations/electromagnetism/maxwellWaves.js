/**
 * Maxwell's Equations: Wave Emergence
 *
 * Visualizes how a time-varying Electric field induces a Magnetic field,
 * leading to a self-propagating electromagnetic wave.
 */

const DEFAULTS = {
  frequency: 1.0,
  amplitude: 1.0,
  wavelength: 4.0,
  phase: 0,
  speed: 2.0,
  showVectors: true,
};

export const defaultParams = { ...DEFAULTS };

export const equationSections = [
  {
    title: 'Introduction',
    content:
      'Electromagnetic waves are oscillating electric and magnetic fields that travel through space. Light is an EM wave! This simulation shows a plane wave propagating in 3D space. The electric and magnetic fields oscillate perpendicular to each other and to the direction of travel. You can see how frequency, wavelength, and amplitude affect the wave.',
  },
  {
    title: "Maxwell's Equations (Vacuum)",
    equations: [
      {
        latex: String.raw`\nabla \times \vec{E} = -\frac{\partial \vec{B}}{\partial t}`,
        description:
          "Faraday's Law: A changing magnetic field creates a circulating electric field. This is how generators work.",
      },
      {
        latex: String.raw`\nabla \times \vec{B} = \mu_0 \epsilon_0 \frac{\partial \vec{E}}{\partial t}`,
        description:
          'Ampère-Maxwell Law: A changing electric field creates a circulating magnetic field. Maxwell added the displacement current term.',
      },
    ],
    variables: [
      { symbol: '∇ × E', description: 'Curl of electric field - measures field circulation' },
      { symbol: '∂B/∂t', description: 'Rate of change of magnetic field' },
      { symbol: 'μ₀, ε₀', description: 'Permeability and permittivity of free space' },
    ],
  },
  {
    title: 'Wave Propagation',
    equations: [
      {
        latex: String.raw`E(z,t) = E_0 \cos(kz - \omega t)`,
        description:
          'Electric field oscillates in the x-direction as the wave moves in z-direction. k is wavenumber (2π/λ), ω is angular frequency (2πf).',
      },
      {
        latex: String.raw`B(z,t) = B_0 \cos(kz - \omega t)`,
        description:
          'Magnetic field oscillates in y-direction, perpendicular to E. The ratio E/B = c (speed of light).',
      },
      {
        latex: String.raw`c = \frac{1}{\sqrt{\mu_0 \epsilon_0}} = 3 \times 10^8 \text{ m/s}`,
        description: 'Speed of light in vacuum. EM waves always travel at this speed.',
      },
    ],
    variables: [
      { symbol: 'E₀, B₀', description: 'Amplitudes of electric and magnetic fields' },
      { symbol: 'k = 2π/λ', description: 'Wave number - higher k means shorter wavelength' },
      { symbol: 'ω = 2πf', description: 'Angular frequency - higher ω means faster oscillation' },
    ],
  },
  {
    title: 'EM Wave Properties',
    equations: [
      {
        latex: String.raw`\vec{E} \perp \vec{B} \perp \vec{k}`,
        description:
          'Electric field, magnetic field, and direction of propagation are all mutually perpendicular.',
      },
      {
        latex: String.raw`c = f \lambda`,
        description: 'Speed equals frequency times wavelength. All EM waves obey this.',
      },
    ],
  },
  {
    title: 'How to Use',
    content:
      '1. Adjust frequency f - higher frequency means more oscillations per second.\n2. Change wavelength λ - shorter wavelength means higher frequency (since c = fλ).\n3. Modify amplitude A - controls how strong the fields are.\n4. Toggle vector field to see field directions at each point.\n5. Watch the wave propagate - notice E and B are in phase but perpendicular.\n6. Look at the graphs showing E and B vs time at a fixed point.',
  },
  {
    title: 'Beginner Tips',
    content:
      'All electromagnetic waves (radio, microwave, infrared, visible light, UV, X-rays, gamma rays) follow these same equations. They only differ in frequency/wavelength. The wave carries energy - higher amplitude means more energy. Polarization is the direction of E-field oscillation.',
  },
];

export const equations = [
  String.raw`c = \frac{1}{\sqrt{\mu_0 \epsilon_0}}`,
  String.raw`\vec{E} \perp \vec{B} \perp \vec{k}`,
];

export const graphParams = [
  { key: 'e_val', label: 'E-Field (x) [V/m]' },
  { key: 'b_val', label: 'B-Field (y) [T]' },
];

export const controls = [
  { key: 'frequency', label: 'Frequency f', min: 0.1, max: 3, step: 0.1 },
  { key: 'wavelength', label: 'Wavelength λ', min: 1, max: 10, step: 0.5 },
  { key: 'amplitude', label: 'Amplitude A', min: 0.1, max: 2, step: 0.1 },
  { key: 'showVectors', label: 'Show Vector Field', type: 'toggle' },
];

export function create(canvas, initParams = {}) {
  const ctx = canvas.getContext('2d');
  let p = { ...DEFAULTS, ...initParams };

  let simTime = 0;

  function tick(dt) {
    simTime += dt;
  }

  function project(x, y, z) {
    const W = canvas.width,
      H = canvas.height;
    const centerX = W * 0.15;
    const centerY = H * 0.55;

    const scaleZ = (W - centerX * 2) / 10;
    const scaleAmp = H * 0.22;

    const zx = 1.0 * scaleZ;
    const zy = -0.1 * scaleZ;

    const xx = 0;
    const xy = -1 * scaleAmp;

    const yx = 0.5 * scaleAmp;
    const yy = 0.3 * scaleAmp;

    return {
      px: centerX + z * zx + x * xx + y * yx,
      py: centerY + z * zy + x * xy + y * yy,
    };
  }

  function drawVector(ctx, x1, y1, z1, dx, dy, dz, color) {
    const p1 = project(x1, y1, z1);
    const p2 = project(x1 + dx, y1 + dy, z1 + dz);

    ctx.strokeStyle = color;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(p1.px, p1.py);
    ctx.lineTo(p2.px, p2.py);
    ctx.stroke();

    const headlen = 6;
    const angle = Math.atan2(p2.py - p1.py, p2.px - p1.px);
    ctx.beginPath();
    ctx.moveTo(p2.px, p2.py);
    ctx.lineTo(
      p2.px - headlen * Math.cos(angle - Math.PI / 6),
      p2.py - headlen * Math.sin(angle - Math.PI / 6),
    );
    ctx.lineTo(
      p2.px - headlen * Math.cos(angle + Math.PI / 6),
      p2.py - headlen * Math.sin(angle + Math.PI / 6),
    );
    ctx.fillStyle = color;
    ctx.fill();
  }

  function render() {
    const W = canvas.width,
      H = canvas.height;

    ctx.globalCompositeOperation = 'source-over';
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#020308');
    bg.addColorStop(0.5, '#060B14');
    bg.addColorStop(1, '#020308');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    const k = (2 * Math.PI) / p.wavelength;
    const omega = 2 * Math.PI * p.frequency;

    p._cachedOmega = omega;

    ctx.globalCompositeOperation = 'screen';

    // ── Axis and Grids ──────────────────────────────
    ctx.lineWidth = 1;
    const zStart = project(0, 0, -0.5);
    const zEnd = project(0, 0, 10.5);
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.beginPath();
    ctx.moveTo(zStart.px, zStart.py);
    ctx.lineTo(zEnd.px, zEnd.py);
    ctx.stroke();

    const gridSize = 10;
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.04)';
    ctx.beginPath();
    for (let z = 0; z <= gridSize; z++) {
      let p1 = project(-1.5, 0, z);
      let p2 = project(1.5, 0, z);
      ctx.moveTo(p1.px, p1.py);
      ctx.lineTo(p2.px, p2.py);
    }
    for (let x = -1.5; x <= 1.5; x += 0.5) {
      let p1 = project(x, 0, 0);
      let p2 = project(x, 0, gridSize);
      ctx.moveTo(p1.px, p1.py);
      ctx.lineTo(p2.px, p2.py);
    }
    ctx.stroke();

    ctx.strokeStyle = 'rgba(52, 211, 153, 0.04)';
    ctx.beginPath();
    for (let z = 0; z <= gridSize; z++) {
      let p1 = project(0, -1.5, z);
      let p2 = project(0, 1.5, z);
      ctx.moveTo(p1.px, p1.py);
      ctx.lineTo(p2.px, p2.py);
    }
    for (let y = -1.5; y <= 1.5; y += 0.5) {
      let p1 = project(0, y, 0);
      let p2 = project(0, y, gridSize);
      ctx.moveTo(p1.px, p1.py);
      ctx.lineTo(p2.px, p2.py);
    }
    ctx.stroke();

    const points = 250;

    const renderWave = (pts, offset, eColor, bColor, strokeW, isCore) => {
      ctx.beginPath();
      for (let i = 0; i <= pts; i++) {
        const z = (i / pts) * 10;
        const env = Math.min(1, z * 2);
        const phase = k * z - omega * simTime;
        const b =
          p.amplitude * env * Math.cos(phase + offset * 2) * Math.exp(-offset * offset * 20);
        const pt = project(0, b + offset * 0.5, z);
        if (i === 0) ctx.moveTo(pt.px, pt.py);
        else ctx.lineTo(pt.px, pt.py);
      }
      ctx.strokeStyle = bColor;
      ctx.lineWidth = strokeW;
      if (isCore) {
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#10b981';
      }
      ctx.stroke();
      if (isCore) ctx.shadowBlur = 0;

      ctx.beginPath();
      for (let i = 0; i <= pts; i++) {
        const z = (i / pts) * 10;
        const env = Math.min(1, z * 2);
        const phase = k * z - omega * simTime;
        const e =
          p.amplitude * env * Math.cos(phase + offset * 2) * Math.exp(-offset * offset * 20);
        const pt = project(e + offset * 0.5, 0, z);
        if (i === 0) ctx.moveTo(pt.px, pt.py);
        else ctx.lineTo(pt.px, pt.py);
      }
      ctx.strokeStyle = eColor;
      ctx.lineWidth = strokeW;
      if (isCore) {
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#06b6d4';
      }
      ctx.stroke();
      if (isCore) ctx.shadowBlur = 0;
    };

    // ── Holographic surrounding fields ──────────────────────────
    const strands = 6;
    for (let s = 0; s < strands; s++) {
      const strandOffset = (s - strands / 2) * 0.12;
      const alpha = Math.max(0, 0.3 - Math.abs(strandOffset));
      renderWave(
        points,
        strandOffset,
        `rgba(34, 211, 238, ${alpha})`,
        `rgba(52, 211, 153, ${alpha})`,
        1.5,
        false,
      );
    }

    // ── Bright Core Wave ────────────────────────────────────────
    ctx.globalCompositeOperation = 'lighter';
    renderWave(points, 0, '#a5f3fc', '#a7f3d0', 3, true);

    // ── Vector field arrows ─────────────────────────────────────
    if (p.showVectors) {
      const vecCount = Math.floor((10 / p.wavelength) * 8);
      for (let i = 0; i <= vecCount; i++) {
        const z = (i / vecCount) * 10;
        const env = Math.min(1, z * 2);
        const phase = k * z - omega * simTime;
        const e = p.amplitude * env * Math.cos(phase);
        const b = p.amplitude * env * Math.cos(phase);

        if (Math.abs(e) > 0.05) {
          drawVector(ctx, 0, 0, z, e, 0, 0, `rgba(34, 211, 238, ${0.4 + 0.6 * env})`);
          drawVector(ctx, 0, 0, z, 0, b, 0, `rgba(52, 211, 153, ${0.4 + 0.6 * env})`);
        }
      }
    }

    // ── Energy Particles (Photons riding crests) ────────────────
    const particleCount = 60;
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < particleCount; i++) {
      let zPos = (simTime * p.speed * 2 + i * (10 / particleCount)) % 10;
      const env = Math.min(1, zPos * 2);
      if (env > 0.01) {
        const phase = k * zPos - omega * simTime;
        const e = p.amplitude * env * Math.cos(phase);
        const b = p.amplitude * env * Math.cos(phase);

        const pE = project(e, 0, zPos);
        ctx.beginPath();
        ctx.arc(pE.px, pE.py, 2, 0, Math.PI * 2);
        ctx.fill();

        const pB = project(0, b, zPos);
        ctx.beginPath();
        ctx.arc(pB.px, pB.py, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // ── Source Antenna ──────────────────────────────────────────
    ctx.globalCompositeOperation = 'source-over';
    const originE = p.amplitude * Math.cos(-omega * simTime);
    const oPtE = project(originE * 1.3, 0, 0);
    const oPtNegE = project(-originE * 1.3, 0, 0);

    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 4;
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#60a5fa';
    ctx.beginPath();
    ctx.moveTo(oPtNegE.px, oPtNegE.py);
    ctx.lineTo(oPtE.px, oPtE.py);
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(oPtE.px, oPtE.py, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(oPtNegE.px, oPtNegE.py, 4, 0, Math.PI * 2);
    ctx.fill();

    // ── HUD Text ────────────────────────────────────────────────
    ctx.font = 'bold 12px "Inter", "JetBrains Mono", sans-serif';
    ctx.shadowBlur = 4;
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.fillStyle = '#22d3ee';
    ctx.fillText('Electric Field (E)', 20, 30);
    ctx.fillStyle = '#34d399';
    ctx.fillText('Magnetic Field (B)', 20, 50);
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fillText('Direction of Propagation (z) →', zEnd.px + 10, zEnd.py);
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
      render();
      this.start();
    },
    setParams(next) {
      p = { ...p, ...next };
      render();
    },
    destroy() {
      this.stop();
    },
    getData() {
      const currentOmega = p._cachedOmega || 2 * Math.PI * p.frequency;
      const e_val = p.amplitude * Math.cos(-currentOmega * simTime);
      const b_val = p.amplitude * Math.cos(-currentOmega * simTime);
      return {
        time: simTime,
        e_val,
        b_val,
      };
    },
  };
}
