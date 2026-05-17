/**
 * Maxwell's Equations: Wave Emergence
 *
 * Visualizes a self-propagating EM wave.
 * Interactive: Drag background to orbit the 3D view.
 */

const DEFAULTS = {
  frequency: 1.0,
  amplitude: 1.0,
  wavelength: 4.0,
  showVectors: true,
  viewScale: 1.0,
};

export const defaultParams = { ...DEFAULTS };

export const equationSections = [
  {
    title: 'Introduction',
    content:
      'Light is an electromagnetic wave! It consists of oscillating electric (E) and magnetic (B) fields that are mutually perpendicular and travel through space at the speed of light.',
  },
];

export const equations = [
  String.raw`c = \frac{1}{\sqrt{\mu_0 \epsilon_0}}`,
  String.raw`\vec{E} \perp \vec{B} \perp \vec{k}`,
];

export const controls = [
  { key: 'frequency', label: 'Frequency f', min: 0.1, max: 3, step: 0.1 },
  { key: 'wavelength', label: 'Wavelength λ', min: 1, max: 10, step: 0.5 },
  { key: 'amplitude', label: 'Amplitude A', min: 0.1, max: 2, step: 0.1 },
  { key: 'showVectors', label: 'Show Vectors', type: 'toggle' },
];

export function create(canvas, initParams = {}) {
  const ctx = canvas.getContext('2d');
  let p = { ...DEFAULTS, ...initParams };
  let simTime = 0;
  let yaw = 0.4,
    pitch = 0.3;
  let isDragging = false,
    lastMouse = { x: 0, y: 0 };

  function project(x, y, z) {
    const W = canvas.width,
      H = canvas.height;
    const scale = W * 0.08 * (p.viewScale ?? 1.0);

    // Rotation
    const cy = Math.cos(yaw),
      sy = Math.sin(yaw);
    const cp = Math.cos(pitch),
      sp = Math.sin(pitch);

    // World centered at z=5
    const zw = z - 5;
    const x1 = x * cy + zw * sy;
    const z1 = -x * sy + zw * cy;
    const y1 = y * cp - z1 * sp;
    const z2 = y * sp + z1 * cp;

    const focal = 10;
    const s = focal / (focal + z2);
    return { px: W / 2 + x1 * s * scale, py: H / 2 + y1 * s * scale, s };
  }

  function render() {
    const W = canvas.width,
      H = canvas.height;
    ctx.fillStyle = '#020308';
    ctx.fillRect(0, 0, W, H);

    const k = (2 * Math.PI) / p.wavelength;
    const omega = 2 * Math.PI * p.frequency;

    // Grid / Axis
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    const pS = project(0, 0, 0),
      pE = project(0, 0, 10);
    ctx.moveTo(pS.px, pS.py);
    ctx.lineTo(pE.px, pE.py);
    ctx.stroke();

    // Waves
    const pts = 200;
    const drawWave = (color, isE) => {
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      for (let i = 0; i <= pts; i++) {
        const z = (i / pts) * 10;
        const val = p.amplitude * Math.cos(k * z - omega * simTime);
        const pt = isE ? project(val, 0, z) : project(0, val, z);
        if (i === 0) ctx.moveTo(pt.px, pt.py);
        else ctx.lineTo(pt.px, pt.py);
      }
      ctx.stroke();
    };

    drawWave('#22d3ee', true); // E Field
    drawWave('#34d399', false); // B Field

    // HUD
    const hudX = 20,
      hudY = 20,
      hudW = 180,
      hudH = 80;
    ctx.fillStyle = 'rgba(20, 25, 40, 0.8)';
    ctx.beginPath();
    ctx.roundRect(hudX, hudY, hudW, hudH, 12);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.stroke();
    ctx.font = 'bold 10px monospace';
    ctx.fillStyle = '#22d3ee';
    ctx.fillText('E Field', hudX + 12, hudY + 25);
    ctx.fillStyle = '#34d399';
    ctx.fillText('B Field', hudX + 12, hudY + 45);
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillText('Drag to Orbit', hudX + 12, hudY + 65);
  }

  const onDown = (e) => {
    isDragging = true;
    lastMouse = { x: e.clientX, y: e.clientY };
  };
  const onMove = (e) => {
    if (!isDragging) return;
    yaw += (e.clientX - lastMouse.x) * 0.01;
    pitch += (e.clientY - lastMouse.y) * 0.01;
    lastMouse = { x: e.clientX, y: e.clientY };
    render();
  };
  const onUp = () => {
    isDragging = false;
  };

  canvas.addEventListener('mousedown', onDown);
  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onUp);

  let running = false,
    rafId;
  function loop() {
    if (!running) return;
    simTime += 0.016;
    render();
    rafId = requestAnimationFrame(loop);
  }

  render();
  return {
    start() {
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
      canvas.removeEventListener('mousedown', onDown);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    },
    getData() {
      return { time: simTime };
    },
  };
}
