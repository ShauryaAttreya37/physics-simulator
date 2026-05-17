/**
 * Faraday Generator — Induction in Action
 *
 * Direct Manipulation: Drag the blue faucet handle to turn on the water.
 * The water turns the wheel, rotating the magnet, changing flux in the coil.
 */

const DEFAULTS = {
  waterFlow: 0.5, // 0 to 1
  magnetStrength: 3.0,
  coilTurns: 20,
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
  { key: 'coilTurns', label: 'Coil Turns', type: 'counter', min: 5, max: 50, step: 5 },
  { key: 'showFieldGrid', label: 'Field Grid', type: 'toggle' },
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
    const scale = Math.min(1, canvas.width / 600);
    const vW = canvas.width / scale;
    const dist = vW * 0.35;
    const { bx } = getB(dist, 0, angle);
    const flux = p.coilTurns * bx * 240; // scaled area (increased so bulb glows nicely at lower turns)
    emf = emf * 0.5 + 0.5 * (-(flux - prevFlux) / Math.max(dt, 0.001));
    current = emf / 20; // 20 ohms
    prevFlux = flux;
  }

  function render() {
    const W = canvas.width,
      H = canvas.height;
    ctx.fillStyle = '#ffffff'; // Light theme background
    ctx.fillRect(0, 0, W, H);

    const scale = Math.min(1, W / 600);
    ctx.save();
    ctx.scale(scale, scale);

    const vW = W / scale;
    const vH = H / scale;

    // Centers
    const cx = vW * 0.35;
    const cy = vH * 0.55;
    const cX = vW * 0.7;

    // Background Grid
    if (p.showFieldGrid) {
      for (let x = 30; x < vW; x += 50) {
        for (let y = 30; y < vH; y += 50) {
          const { bx, by, mag } = getB(x - cx, y - cy, angle);
          if (mag > 0.01) {
            const ang = Math.atan2(by, bx);
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(ang);
            ctx.fillStyle = `rgba(59,130,246,${Math.min(0.3, mag)})`;
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

    // --- FAUCET (Clean flat vector style) ---
    // Positioned on the right side so clockwise rotation makes physical sense
    const fX = cx + 65,
      fY = cy - 220;

    // Main horizontal pipe
    ctx.fillStyle = '#e2e8f0'; // Light grey pipe
    ctx.fillRect(fX - 350, fY, 400, 45); // Extend pipe further left to the edge
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2;
    ctx.strokeRect(fX - 350, fY, 400, 45);

    // Spout (vertical)
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(fX, fY, 40, 70);
    ctx.strokeRect(fX, fY, 40, 70);

    // Spout lip
    ctx.fillStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.ellipse(fX + 20, fY + 70, 20, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Faucet Handle
    const handleY = fY - 25;
    const handleW = 60;
    const hX = fX - 30 + p.waterFlow * 40;

    ctx.fillStyle = '#94a3b8'; // Stem
    ctx.fillRect(fX + 10, handleY + 10, 20, 20);

    ctx.fillStyle = isDraggingFaucet ? '#3b82f6' : '#eff6ff';
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(hX, handleY, handleW, 25, 4);
    ctx.fill();
    ctx.stroke();

    // Grip ridges
    ctx.fillStyle = isDraggingFaucet ? '#2563eb' : '#bfdbfe';
    for (let i = 0; i < 3; i++) ctx.fillRect(hX + 20 + i * 8, handleY + 5, 4, 15);

    // --- WATER STREAM ---
    if (p.waterFlow > 0.01) {
      const wW = 8 + p.waterFlow * 20;
      const landY = cy - 85; // Land exactly on the wheel rim at x = +85 from center

      ctx.fillStyle = `rgba(147, 197, 253, ${p.waterFlow * 0.8})`; // Light blue water
      ctx.beginPath();
      ctx.moveTo(fX + 20 - wW / 2, fY + 75);
      ctx.lineTo(fX + 20 + wW / 2, fY + 75);
      // Main water body
      ctx.lineTo(fX + 20 + wW / 2 + 5, landY);
      ctx.lineTo(fX + 20 - wW / 2 - 5, landY);
      ctx.fill();

      // Animated droplets falling
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      for (let i = 0; i < 5; i++) {
        const dropY = fY + 75 + ((simTime * 400 + i * 40) % (landY - (fY + 75)));
        ctx.beginPath();
        ctx.arc(fX + 20 + (Math.random() - 0.5) * wW, dropY, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Splash Effect on the wheel
      const splashCount = Math.floor(p.waterFlow * 12);
      ctx.fillStyle = 'rgba(147,197,253,0.7)';
      for (let i = 0; i < splashCount; i++) {
        const t = (simTime * 2.5 + i * 0.2) % 1; // 0 to 1 life cycle
        const sX = fX + 20 + (Math.random() - 0.5) * 30 * t + 10 * t; // splash slightly outwards
        const sY = landY - Math.sin(t * Math.PI) * 20 + t * 15; // arc up and fall
        ctx.beginPath();
        ctx.arc(sX, sY, 1.5 + Math.random() * 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // --- WHEEL ---
    ctx.save();
    ctx.translate(cx, cy);
    const wR = 110;

    // Outer Rim
    ctx.beginPath();
    ctx.arc(0, 0, wR, 0, Math.PI * 2);
    ctx.strokeStyle = '#334155'; // Dark grey wheel for clean contrast
    ctx.lineWidth = 16;
    ctx.stroke();

    // Spokes and Paddles
    ctx.rotate(angle);
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 8;
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      ctx.save();
      ctx.rotate(a);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(wR + 15, 0);
      ctx.stroke();
      // Paddle
      ctx.fillStyle = '#334155';
      ctx.fillRect(wR + 5, -15, 12, 30);
      ctx.restore();
    }

    // --- MAGNET ---
    const magW = 160,
      magH = 50;

    // S pole (Blue)
    ctx.fillStyle = '#3b82f6';
    ctx.beginPath();
    ctx.roundRect(-magW / 2, -magH / 2, magW / 2, magH, { tl: 4, bl: 4 });
    ctx.fill();

    // N pole (Red)
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.roundRect(0, -magH / 2, magW / 2, magH, { tr: 4, br: 4 });
    ctx.fill();

    // Magnet Outline
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-magW / 2, -magH / 2, magW, magH, 4);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px "Inter", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('S', -magW / 4, 2);
    ctx.fillText('N', magW / 4, 2);
    ctx.restore();

    // Center Hub & RPM
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx, cy, 35, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 18px "Inter", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(rpm.toFixed(0), cx, cy - 4);
    ctx.font = '10px "Inter", sans-serif';
    ctx.fillStyle = '#475569';
    ctx.fillText('RPM', cx, cy + 12);

    // --- CIRCUIT WIRES ---
    const bY_wire = cy - 110;
    ctx.strokeStyle = '#475569'; // Grey insulating wire
    ctx.lineWidth = 5;
    ctx.lineJoin = 'round';
    ctx.beginPath();

    // Left wire
    ctx.moveTo(cX - 100, cy);
    ctx.lineTo(cX - 110, cy);
    ctx.lineTo(cX - 110, bY_wire + 12);
    ctx.lineTo(cX - 20, bY_wire + 12);

    // Right wire
    ctx.moveTo(cX + 88, cy);
    ctx.lineTo(cX + 110, cy);
    ctx.lineTo(cX + 110, bY_wire + 12);
    ctx.lineTo(cX + 20, bY_wire + 12);

    ctx.stroke();

    // Draw little connection joints at the socket
    ctx.fillStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.arc(cX - 20, bY_wire + 12, 4, 0, Math.PI * 2);
    ctx.arc(cX + 20, bY_wire + 12, 4, 0, Math.PI * 2);
    ctx.fill();

    // --- COIL ---
    const coilR = 40;
    const coilH = 120;
    const numLoops = p.coilTurns;
    const spacing = 120 / Math.max(1, numLoops);
    const backLw = Math.max(1, Math.min(4, spacing * 1.2));
    const frontLw = Math.max(1.5, Math.min(6, spacing * 1.5));

    // Draw back of loops
    ctx.strokeStyle = '#b45309'; // Darker copper
    ctx.lineWidth = backLw;
    for (let i = 0; i < numLoops; i++) {
      ctx.beginPath();
      ctx.ellipse(
        cX + (i - numLoops / 2) * spacing,
        cy,
        coilR,
        coilH / 2,
        0,
        Math.PI / 2,
        Math.PI * 1.5,
      );
      ctx.stroke();
    }

    // Draw front of loops
    ctx.strokeStyle = '#f59e0b'; // Bright copper
    ctx.lineWidth = frontLw;
    for (let i = 0; i < numLoops; i++) {
      ctx.beginPath();
      ctx.ellipse(
        cX + (i - numLoops / 2) * spacing,
        cy,
        coilR,
        coilH / 2,
        0,
        -Math.PI / 2,
        Math.PI / 2,
      );
      ctx.stroke();
    }

    // --- ELECTRONS ---
    if (Math.abs(current) > 0.05) {
      const speed = current * 2.5;
      const offset = (simTime * speed) % (Math.PI * 2);
      ctx.fillStyle = '#2563eb'; // Clear blue electrons
      for (let i = 0; i < numLoops; i++) {
        const px = cX + (i - numLoops / 2) * spacing + coilR * Math.cos(offset + i);
        // Only draw electrons on the front half of the coil
        if (Math.cos(offset + i) > 0) {
          const py = cy + (coilH / 2) * Math.sin(offset + i);
          ctx.beginPath();
          ctx.arc(px, py, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // --- LIGHTBULB ---
    const bX = cX,
      bY = cy - 110;
    const power = Math.abs(emf * current);

    // Make the bulb much more sensitive to power changes so it lights up clearly
    const bright = Math.min(1, Math.sqrt(power) / 80);

    // Base Socket
    ctx.fillStyle = '#64748b'; // Darker base for strong contrast
    ctx.fillRect(bX - 20, bY, 40, 25);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.strokeRect(bX - 20, bY, 40, 25);

    ctx.fillStyle = '#334155';
    ctx.fillRect(bX - 15, bY + 25, 30, 8);
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(bX - 20, bY + 5 + i * 7);
      ctx.lineTo(bX + 20, bY + 5 + i * 7);
      ctx.stroke();
    }

    // Light Rays (Drawn BEHIND the bulb so they radiate out)
    if (bright > 0.05) {
      ctx.strokeStyle = `rgba(217, 119, 6, ${bright})`; // Deep amber rays for contrast on white
      ctx.lineWidth = 3 + bright * 3;
      ctx.lineCap = 'round';
      const numRays = 12;
      for (let i = 0; i < numRays; i++) {
        const rayAng = (i / numRays) * Math.PI * 2 + simTime * 0.2;
        const rStart = 45;
        const rEnd = 55 + bright * 40; // Expand far outwards
        ctx.beginPath();
        ctx.moveTo(bX + Math.cos(rayAng) * rStart, bY - 45 + Math.sin(rayAng) * rStart);
        ctx.lineTo(bX + Math.cos(rayAng) * rEnd, bY - 45 + Math.sin(rayAng) * rEnd);
        ctx.stroke();
      }
      ctx.lineCap = 'butt'; // Reset
    }

    // Glass Bulb
    ctx.beginPath();
    ctx.arc(bX, bY - 45, 40, 0, Math.PI * 2);

    // Interpolate from a cool off-white to a bright piercing yellow
    const bgOff = { r: 241, g: 245, b: 249, a: 0.8 }; // Off state: faint slate
    const bgOn = { r: 250, g: 204, b: 21, a: 0.95 }; // On state: yellow-400
    const rC = Math.round(bgOff.r + (bgOn.r - bgOff.r) * bright);
    const gC = Math.round(bgOff.g + (bgOn.g - bgOff.g) * bright);
    const bC = Math.round(bgOff.b + (bgOn.b - bgOff.b) * bright);
    const aC = bgOff.a + (bgOn.a - bgOff.a) * bright;

    ctx.fillStyle = `rgba(${rC}, ${gC}, ${bC}, ${aC})`;
    ctx.fill();

    ctx.strokeStyle = bright > 0.1 ? '#ca8a04' : '#94a3b8'; // Amber border when on
    ctx.lineWidth = 3;
    ctx.stroke();

    // Filament Structure
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(bX - 15, bY);
    ctx.lineTo(bX - 10, bY - 45);
    ctx.lineTo(bX + 10, bY - 45);
    ctx.lineTo(bX + 15, bY);
    ctx.stroke();

    // Glowing Tungsten Wire
    if (bright > 0.05) {
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.5 + bright * 0.5})`; // White-hot center
      ctx.lineWidth = 4 + bright * 3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(bX - 10, bY - 45);
      ctx.lineTo(bX + 10, bY - 45);
      ctx.stroke();
      ctx.lineCap = 'butt';
    } else {
      ctx.strokeStyle = '#94a3b8'; // Cold wire
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(bX - 10, bY - 45);
      ctx.lineTo(bX + 10, bY - 45);
      ctx.stroke();
    }

    // --- LARGE COMPASS ---
    const compX = cX + 110,
      compY = cy;

    // Casing
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(compX, compY, 40, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Needle
    const { bx: cxB, by: cyB } = getB(compX - cx, compY - cy, angle);
    const cAng = Math.atan2(cyB, cxB);
    ctx.save();
    ctx.translate(compX, compY);
    ctx.rotate(cAng);

    // N pole (Red)
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(30, 0);
    ctx.lineTo(0, 6);
    ctx.lineTo(0, -6);
    ctx.fill();
    // S pole (Blue for contrast)
    ctx.fillStyle = '#3b82f6';
    ctx.beginPath();
    ctx.moveTo(-30, 0);
    ctx.lineTo(0, 6);
    ctx.lineTo(0, -6);
    ctx.fill();

    // Center pin
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // --- HUD Overlay (Clean Light Theme) ---
    ctx.restore(); // Restore global scale
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.beginPath();
    ctx.roundRect(W - 170, 20, 150, 80, 8);
    ctx.fill();
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#0f172a';
    ctx.textAlign = 'left';
    ctx.font = 'bold 11px "Inter", sans-serif';
    ctx.fillText('GENERATOR STATS', W - 160, 40);
    ctx.font = '11px "Inter", sans-serif';
    ctx.fillStyle = '#334155';
    ctx.fillText(`Flow: ${(p.waterFlow * 100).toFixed(0)}%`, W - 160, 60);
    ctx.fillText(`EMF:  ${emf.toFixed(1)} V`, W - 160, 80);
  }

  function handlePointerDown(e) {
    const rect = canvas.getBoundingClientRect();
    let hX = e.clientX - rect.left;
    let hY = e.clientY - rect.top;
    const W = canvas.width,
      H = canvas.height;

    const scale = Math.min(1, W / 600);
    const vW = W / scale;
    const vH = H / scale;

    hX /= scale;
    hY /= scale;

    // Faucet handle bounds check
    const cx = vW * 0.35,
      cy = vH * 0.55;
    const fX = cx + 65,
      fY = cy - 220;
    const handleY = fY - 25;

    if (hX > fX - 40 && hX < fX + 60 && hY > handleY - 20 && hY < handleY + 40) {
      isDraggingFaucet = true;
    }
  }

  function handlePointerMove(e) {
    if (!isDraggingFaucet) return;
    const rect = canvas.getBoundingClientRect();
    let hX = e.clientX - rect.left;
    const W = canvas.width;

    const scale = Math.min(1, W / 600);
    const vW = W / scale;
    hX /= scale;

    const cx = vW * 0.35;
    const fX = cx + 65;

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
