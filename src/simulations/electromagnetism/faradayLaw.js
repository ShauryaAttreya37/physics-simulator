/**
 * Faraday Generator — Induction in Action
 *
 * Direct Manipulation: Drag the blue faucet handle to turn on the water.
 * The water turns the wheel, rotating the magnet, changing flux in the coil.
 */

const DEFAULTS = {
  waterFlow: 0.5, // 0 to 1
  magnetStrength: 3.0,
  coilTurns: 60,
  showFieldGrid: 1,
};

export const defaultParams = { ...DEFAULTS };

export const equationSections = [
  {
    title: 'The Electric Generator',
    content:
      'Mechanical energy (water turning a wheel) rotates a magnet. The changing magnetic flux induces an EMF (voltage) in the coil, lighting the bulb. This is how power plants work!',
  },
  {
    title: "Faraday's Law",
    equations: [
      {
        latex: String.raw`\mathcal{E} = -N\frac{d\Phi_B}{dt}`,
        description:
          'Induced voltage depends on how FAST the flux changes (RPM of the wheel) and the number of turns N.',
      },
    ],
  },
];

export const equations = [String.raw`\mathcal{E} = -N\frac{d\Phi_B}{dt}`];
export const graphParams = [
  { key: 'emf', label: 'Voltage [V]' },
  { key: 'power', label: 'Power [W]' },
];

export const controls = [
  { key: 'waterFlow', label: 'Water Flow', min: 0, max: 1, step: 0.05 },
  { key: 'magnetStrength', label: 'Magnet', min: 1, max: 5, step: 0.5 },
  { key: 'coilTurns', label: 'Coil Turns', min: 10, max: 100, step: 10 },
  { key: 'showFieldGrid', label: 'Field Grid', min: 0, max: 1, step: 1 },
];

export const scenarios = [];
export const guidedExperiments = [];

export function create(canvas, initParams = {}) {
  const ctx = canvas.getContext('2d');
  const p = { ...DEFAULTS, ...initParams };

  let simTime = 0,
    angle = 0,
    rpm = 0;
  let prevFlux = 0,
    emf = 0,
    current = 0;
  let isDraggingFaucet = false;

  // Dipole B field at (x,y) from magnet at origin rotated by 'angle'
  function getB(x, y, theta) {
    const lx = x * Math.cos(-theta) - y * Math.sin(-theta);
    const ly = x * Math.sin(-theta) + y * Math.cos(-theta);
    const r2 = lx * lx + ly * ly;
    const r = Math.sqrt(r2);
    if (r < 10) return { bx: 0, by: 0, mag: 0 };

    const B0 = p.magnetStrength * 40000;
    const bx_local = B0 * ((3 * lx * lx) / (r2 * r2 * r) - 1 / (r2 * r));
    const by_local = B0 * ((3 * lx * ly) / (r2 * r2 * r));

    const bx = bx_local * Math.cos(theta) - by_local * Math.sin(theta);
    const by = bx_local * Math.sin(theta) + by_local * Math.cos(theta);
    return { bx, by, mag: Math.hypot(bx, by) };
  }

  function tick(dt) {
    simTime += dt;
    const targetRpm = p.waterFlow * 120; // max 120 RPM
    rpm += (targetRpm - rpm) * dt * 2;
    angle += (rpm / 60) * Math.PI * 2 * dt;

    // Dist between wheel and coil centers
    const dist = canvas.width * 0.35;
    const { bx } = getB(dist, 0, angle);
    const flux = p.coilTurns * bx * 80; // scaled area
    emf = emf * 0.5 + 0.5 * (-(flux - prevFlux) / Math.max(dt, 0.001));
    current = emf / 20; // 20 ohms
    prevFlux = flux;
  }

  function render() {
    const W = canvas.width,
      H = canvas.height;
    ctx.fillStyle = '#050810';
    ctx.fillRect(0, 0, W, H);

    // Centers
    const cx = W * 0.35;
    const cy = H * 0.55;
    const cX = W * 0.7;

    // Background Grid
    if (p.showFieldGrid) {
      for (let x = 30; x < W; x += 50) {
        for (let y = 30; y < H; y += 50) {
          const { bx, by, mag } = getB(x - cx, y - cy, angle);
          if (mag > 0.01) {
            const ang = Math.atan2(by, bx);
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(ang);
            ctx.fillStyle = `rgba(255,100,100,${Math.min(0.4, mag)})`;
            ctx.beginPath();
            ctx.moveTo(6, 0);
            ctx.lineTo(-6, 3);
            ctx.lineTo(-6, -3);
            ctx.fill();
            ctx.restore();
          }
        }
      }
    }

    // --- FAUCET (3D metallic) ---
    const fX = cx - 30,
      fY = cy - 220;

    // Main horizontal pipe
    const pipeGrad = ctx.createLinearGradient(0, fY, 0, fY + 45);
    pipeGrad.addColorStop(0, '#cbd5e1');
    pipeGrad.addColorStop(0.5, '#f8fafc');
    pipeGrad.addColorStop(1, '#94a3b8');
    ctx.fillStyle = pipeGrad;
    ctx.fillRect(fX - 250, fY, 300, 45);

    // Spout (vertical)
    const spoutGrad = ctx.createLinearGradient(fX, 0, fX + 40, 0);
    spoutGrad.addColorStop(0, '#cbd5e1');
    spoutGrad.addColorStop(0.5, '#f8fafc');
    spoutGrad.addColorStop(1, '#94a3b8');
    ctx.fillStyle = spoutGrad;
    ctx.fillRect(fX, fY, 40, 70);
    // Spout lip
    ctx.fillStyle = '#64748b';
    ctx.beginPath();
    ctx.ellipse(fX + 20, fY + 70, 26, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Faucet Handle
    const handleY = fY - 25;
    const handleW = 60;
    // Map flow 0..1 to handle X position
    const hX = fX - 30 + p.waterFlow * 40;

    const handleGrad = ctx.createLinearGradient(0, handleY, 0, handleY + 25);
    handleGrad.addColorStop(0, isDraggingFaucet ? '#bfdbfe' : '#60a5fa');
    handleGrad.addColorStop(1, isDraggingFaucet ? '#3b82f6' : '#2563eb');

    ctx.fillStyle = '#475569';
    ctx.fillRect(fX + 10, handleY + 10, 20, 20); // base stem
    ctx.fillStyle = handleGrad;
    ctx.beginPath();
    ctx.roundRect(hX, handleY, handleW, 25, 8);
    ctx.fill();
    // Grip ridges
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    for (let i = 0; i < 3; i++) ctx.fillRect(hX + 20 + i * 8, handleY + 5, 4, 15);

    // --- WATER STREAM ---
    if (p.waterFlow > 0.01) {
      const wW = 8 + p.waterFlow * 20; // width based on flow
      ctx.fillStyle = `rgba(56, 189, 248, ${p.waterFlow * 0.9})`;
      ctx.beginPath();
      ctx.moveTo(fX + 20 - wW / 2, fY + 75);
      ctx.lineTo(fX + 20 + wW / 2, fY + 75);
      // Splashing down onto the wheel
      ctx.lineTo(fX + 20 + wW / 2 + 5, cy - 80);
      ctx.lineTo(fX + 20 - wW / 2 - 10, cy - 80);
      ctx.fill();

      // Animated droplets
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      for (let i = 0; i < 5; i++) {
        const dropY = fY + 75 + ((simTime * 400 + i * 40) % 150);
        if (dropY < cy - 80) ctx.fillRect(fX + 20 + (Math.random() - 0.5) * wW, dropY, 3, 6);
      }
    }

    // --- WHEEL ---
    ctx.save();
    ctx.translate(cx, cy);
    const wR = 110;

    // Outer Rim
    ctx.beginPath();
    ctx.arc(0, 0, wR, 0, Math.PI * 2);
    const rimGrad = ctx.createRadialGradient(0, 0, wR - 15, 0, 0, wR + 5);
    rimGrad.addColorStop(0, '#92400e');
    rimGrad.addColorStop(1, '#451a03');
    ctx.strokeStyle = rimGrad;
    ctx.lineWidth = 24;
    ctx.stroke();

    // Spokes and Paddles
    ctx.rotate(angle);
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 12;
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      ctx.save();
      ctx.rotate(a);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(wR + 15, 0);
      ctx.stroke();
      // Paddle
      ctx.fillStyle = '#451a03';
      ctx.fillRect(wR + 5, -15, 12, 30);
      ctx.restore();
    }

    // --- MAGNET ---
    const magW = 160,
      magH = 50;
    // Glow behind magnet
    ctx.shadowBlur = 20;
    ctx.shadowColor = 'rgba(255,255,255,0.2)';

    // S pole (Blue)
    const sGrad = ctx.createLinearGradient(-magW / 2, -magH / 2, 0, magH / 2);
    sGrad.addColorStop(0, '#60a5fa');
    sGrad.addColorStop(1, '#1e3a8a');
    ctx.fillStyle = sGrad;
    ctx.beginPath();
    ctx.roundRect(-magW / 2, -magH / 2, magW / 2, magH, { tl: 10, bl: 10 });
    ctx.fill();

    // N pole (Red)
    const nGrad = ctx.createLinearGradient(0, -magH / 2, magW / 2, magH / 2);
    nGrad.addColorStop(0, '#f87171');
    nGrad.addColorStop(1, '#7f1d1d');
    ctx.fillStyle = nGrad;
    ctx.beginPath();
    ctx.roundRect(0, -magH / 2, magW / 2, magH, { tr: 10, br: 10 });
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-magW / 2, -magH / 2, magW, magH, 10);
    ctx.stroke();

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 32px "JetBrains Mono", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('S', -magW / 4, 2);
    ctx.fillText('N', magW / 4, 2);
    ctx.restore();

    // Center Hub & RPM
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(cx, cy, 35, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 18px "JetBrains Mono"';
    ctx.textAlign = 'center';
    ctx.fillText(rpm.toFixed(0), cx, cy - 4);
    ctx.font = '10px "JetBrains Mono"';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('RPM', cx, cy + 12);

    // --- COIL ---
    const coilR = 40;
    const coilH = 120;
    const numLoops = 10;

    // Draw back of loops
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 6;
    for (let i = 0; i < numLoops; i++) {
      ctx.beginPath();
      ctx.ellipse(
        cX + (i - numLoops / 2) * 12,
        cy,
        coilR,
        coilH / 2,
        0,
        Math.PI / 2,
        Math.PI * 1.5,
      );
      ctx.stroke();
    }

    // Copper Wire Gradients
    const copGrad = ctx.createLinearGradient(cX - 60, 0, cX + 60, 0);
    copGrad.addColorStop(0, '#b45309');
    copGrad.addColorStop(0.5, '#f59e0b');
    copGrad.addColorStop(1, '#b45309');

    // Draw front of loops
    ctx.strokeStyle = copGrad;
    ctx.lineWidth = 8;
    for (let i = 0; i < numLoops; i++) {
      ctx.beginPath();
      ctx.ellipse(cX + (i - numLoops / 2) * 12, cy, coilR, coilH / 2, 0, -Math.PI / 2, Math.PI / 2);
      ctx.stroke();
    }

    // --- ELECTRONS ---
    if (Math.abs(current) > 0.05) {
      const speed = current * 2.5;
      const offset = (simTime * speed) % (Math.PI * 2);
      ctx.fillStyle = '#60a5fa'; // Blue electrons
      ctx.shadowBlur = 8;
      ctx.shadowColor = '#60a5fa';
      for (let i = 0; i < numLoops; i++) {
        const px = cX + (i - numLoops / 2) * 12 + coilR * Math.cos(offset + i);
        // Only draw electrons on the front half of the coil
        if (Math.cos(offset + i) > 0) {
          const py = cy + (coilH / 2) * Math.sin(offset + i);
          ctx.beginPath();
          ctx.arc(px, py, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.shadowBlur = 0;
    }

    // --- LIGHTBULB ---
    const bX = cX,
      bY = cy - 110;
    const power = Math.abs(emf * current);
    const bright = Math.min(1, power / 10000);

    // Base Socket
    ctx.fillStyle = '#475569';
    ctx.fillRect(bX - 30, bY, 60, 25);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(bX - 25, bY + 25, 50, 10);
    ctx.fillStyle = '#64748b';
    for (let i = 0; i < 3; i++) ctx.fillRect(bX - 32, bY + 4 + i * 8, 64, 4); // screw threads

    // Glow Effect
    if (bright > 0.02) {
      const glowR = 50 + bright * 100;
      const g = ctx.createRadialGradient(bX, bY - 45, 10, bX, bY - 45, glowR);
      g.addColorStop(0, `rgba(253, 224, 71, ${bright})`);
      g.addColorStop(0.4, `rgba(234, 179, 8, ${bright * 0.4})`);
      g.addColorStop(1, 'transparent');
      ctx.fillStyle = g;
      ctx.fillRect(bX - glowR, bY - 45 - glowR, glowR * 2, glowR * 2);
    }

    // Glass Bulb
    ctx.beginPath();
    ctx.arc(bX, bY - 45, 45, 0, Math.PI * 2);
    const bulbGrad = ctx.createRadialGradient(bX - 15, bY - 60, 5, bX, bY - 45, 45);
    bulbGrad.addColorStop(0, `rgba(255, 255, 255, ${0.4 + bright * 0.6})`);
    bulbGrad.addColorStop(1, `rgba(253, 224, 71, ${0.1 + bright * 0.4})`);
    ctx.fillStyle = bulbGrad;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Filament
    ctx.strokeStyle = `rgba(253, 224, 71, ${0.3 + bright})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(bX - 15, bY);
    ctx.lineTo(bX - 10, bY - 45);
    ctx.lineTo(bX + 10, bY - 45);
    ctx.lineTo(bX + 15, bY);
    ctx.stroke();
    // Glowing wire
    if (bright > 0.1) {
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#fef08a';
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(bX - 10, bY - 45);
      ctx.lineTo(bX + 10, bY - 45);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // --- LARGE COMPASS ---
    const compX = cX + 110,
      compY = cy;

    // Casing
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(compX, compY, 40, 0, Math.PI * 2);
    ctx.fill();
    const caseGrad = ctx.createLinearGradient(compX - 40, compY - 40, compX + 40, compY + 40);
    caseGrad.addColorStop(0, '#94a3b8');
    caseGrad.addColorStop(1, '#334155');
    ctx.strokeStyle = caseGrad;
    ctx.lineWidth = 8;
    ctx.stroke();

    // Needle
    const { bx, by } = getB(compX - cx, compY - cy, angle);
    const cAng = Math.atan2(by, bx);
    ctx.save();
    ctx.translate(compX, compY);
    ctx.rotate(cAng);

    // Drop shadow
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 4;
    // N pole (Red)
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(32, 0);
    ctx.lineTo(0, 8);
    ctx.lineTo(0, -8);
    ctx.fill();
    // S pole (White)
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.moveTo(-32, 0);
    ctx.lineTo(0, 8);
    ctx.lineTo(0, -8);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    // Center pin
    ctx.fillStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // --- HUD Overlay ---
    ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
    ctx.beginPath();
    ctx.roundRect(W - 170, 20, 150, 80, 8);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#fff';
    ctx.textAlign = 'left';
    ctx.font = 'bold 11px "JetBrains Mono"';
    ctx.fillText('GENERATOR STATS', W - 160, 40);
    ctx.font = '11px "JetBrains Mono"';
    ctx.fillStyle = '#93c5fd';
    ctx.fillText(`Flow: ${(p.waterFlow * 100).toFixed(0)}%`, W - 160, 60);
    ctx.fillStyle = '#fca5a5';
    ctx.fillText(`EMF:  ${emf.toFixed(1)} V`, W - 160, 80);
  }

  function handlePointerDown(e) {
    const rect = canvas.getBoundingClientRect();
    const hX = e.clientX - rect.left;
    const hY = e.clientY - rect.top;
    const W = canvas.width,
      H = canvas.height;

    // Faucet handle bounds check
    const cx = W * 0.35,
      cy = H * 0.55;
    const fX = cx - 30,
      fY = cy - 220;
    const handleY = fY - 25;

    if (hX > fX - 40 && hX < fX + 60 && hY > handleY - 20 && hY < handleY + 40) {
      isDraggingFaucet = true;
    }
  }

  function handlePointerMove(e) {
    if (!isDraggingFaucet) return;
    const rect = canvas.getBoundingClientRect();
    const hX = e.clientX - rect.left;
    const W = canvas.width;
    const cx = W * 0.35;
    const fX = cx - 30;

    // Map hX to flow 0..1 (range of 40px)
    p.waterFlow = Math.max(0, Math.min(1, (hX - (fX - 30)) / 40));
  }

  function handlePointerUp() {
    isDraggingFaucet = false;
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
    tick(dt);
    render();
    rafId = requestAnimationFrame(loop);
  }

  render();
  return {
    start() {
      if (!running) {
        running = true;
        lastTs = undefined;
        rafId = requestAnimationFrame(loop);
      }
    },
    stop() {
      running = false;
      cancelAnimationFrame(rafId);
    },
    reset() {
      simTime = 0;
      angle = 0;
      rpm = 0;
      render();
    },
    setParams(next) {
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
      return { time: simTime, emf: Math.abs(emf), power: Math.abs(emf * current) };
    },
  };
}
