/**
 * Total Internal Reflection Lab 3.0
 * Includes Interface Mode and a magnified Fiber Optic mode for real-world context.
 */

const MATERIALS = [
  { name: 'Vacuum', n: 1.0, color: 'rgba(255,255,255,0)' },
  { name: 'Air', n: 1.0003, color: 'rgba(255,255,255,0.02)' },
  { name: 'Water', n: 1.33, color: 'rgba(56, 189, 248, 0.15)' },
  { name: 'Glass', n: 1.52, color: 'rgba(96, 165, 250, 0.25)' },
  { name: 'Diamond', n: 2.42, color: 'rgba(147, 197, 253, 0.4)' },
];

const DEFAULTS = {
  viewMode: 'interface', // 'interface' or 'fiber'
  material1Idx: 3, // Glass
  material2Idx: 1, // Air
  incidentAngle: 30,
  laserColor: '#00ff00',
  intensity: 0.8,
  showNormal: true,
  showProtractor: false,
  challengeMode: false,
};

export const defaultParams = { ...DEFAULTS };

export const equationSections = [
  {
    title: 'Mastering the Critical Angle',
    content:
      "When light hits the 'wall' of a less dense medium at just the right angle, it can't escape! This is the fundamental principle behind fiber optics.",
    equations: [
      {
        latex: String.raw`n_1 \sin \theta_1 = n_2 \sin \theta_2`,
        description: "Snell's Law determines how light bends at the interface.",
      },
      {
        latex: String.raw`\theta_c = \sin^{-1}\left(\frac{n_{cladding}}{n_{core}}\right)`,
        description:
          "The 'Critical Angle'. Anything beyond this = Total Internal Reflection (TIR).",
      },
    ],
  },
  {
    title: 'How the Internet Works',
    content: `The global internet is a massive network of glass threads called fiber optic cables. But how does light turn into YouTube videos or Instagram posts?

### 1. Binary Data as Light
Computers talk in **1s and 0s**. In a fiber cable, a pulse of light represents a '1', and no light represents a '0'. These lasers can blink on and off billions of times per second (gigabits per second!), carrying massive amounts of data instantly.

### 2. The Role of TIR
Without Total Internal Reflection, the light would leak out every time the cable curves. By ensuring the light always hits the core-cladding boundary at an angle steeper than the critical angle, the data stays **'trapped'** inside the glass, even if the cable is bent or buried under the ocean.

### 3. Construction
A standard fiber has a glass **Core** (where light travels) surrounded by a **Cladding** with a lower refractive index. This difference in 'n' is what enables TIR. A protective 'Buffer' and 'Jacket' then wrap the glass to keep it from breaking.`,
  },
];

export const controls = [
  {
    key: 'viewMode',
    label: 'Lab Setup',
    type: 'tiles',
    tiles: [
      { value: 'interface', label: 'Basic Interface' },
      { value: 'fiber', label: 'Fiber Optic Cable' },
    ],
  },
  {
    key: 'material1Idx',
    label: 'Core Material (n1)',
    type: 'tiles',
    tiles: MATERIALS.map((m, i) => ({ value: i, label: m.name })),
  },
  {
    key: 'material2Idx',
    label: 'Cladding Material (n2)',
    type: 'tiles',
    tiles: MATERIALS.map((m, i) => ({ value: i, label: m.name })),
  },
  { key: 'incidentAngle', label: 'Laser Aim Angle', min: 0, max: 90, step: 0.5 },
  {
    key: 'laserColor',
    label: 'Laser Color',
    type: 'tiles',
    tiles: [
      { value: '#ff0000', label: 'Red' },
      { value: '#00ff00', label: 'Green' },
      { value: '#4f46e5', label: 'Violet' },
    ],
  },
  { type: 'toggle', key: 'showProtractor', label: 'Show Tools' },
];

export const graphParams = [
  { key: 'theta1', label: 'Incident Angle' },
  { key: 'theta2', label: 'Refracted Angle' },
];

export function create(canvas, initialParams, options = {}) {
  let ctx = canvas.getContext('2d');
  let p = { ...initialParams };
  let draggingLaser = false;

  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (p.viewMode === 'fiber') {
      renderFiberMode();
    } else {
      renderInterfaceMode();
    }
  }

  function renderInterfaceMode() {
    const midX = canvas.width / 2;
    const midY = canvas.height / 2;
    const radius = Math.min(canvas.width, canvas.height) * 0.45;

    const n1 = MATERIALS[p.material1Idx].n;
    const n2 = MATERIALS[p.material2Idx].n;

    // Media
    ctx.fillStyle = MATERIALS[p.material1Idx].color;
    ctx.fillRect(0, 0, canvas.width, midY);
    ctx.fillStyle = MATERIALS[p.material2Idx].color;
    ctx.fillRect(0, midY, canvas.width, canvas.height);

    // Interface
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, midY);
    ctx.lineTo(canvas.width, midY);
    ctx.stroke();

    if (p.showProtractor) drawProtractor(ctx, midX, midY, radius);
    if (p.showNormal) drawNormal(ctx, midX, 20, canvas.height - 20);

    const theta1Rad = (p.incidentAngle * Math.PI) / 180;
    const criticalAngleRad = n1 > n2 ? Math.asin(n2 / n1) : null;
    const isTIR = criticalAngleRad !== null && theta1Rad >= criticalAngleRad;

    const beamColor = p.laserColor;
    const glowColor = beamColor + '66';

    const inX = midX - Math.sin(theta1Rad) * radius;
    const inY = midY - Math.cos(theta1Rad) * radius;
    drawLaserBeam(ctx, inX, inY, midX, midY, beamColor, glowColor, 4);
    drawFlare(ctx, midX, midY, beamColor, isTIR ? 1.5 : 1.0);

    if (isTIR) {
      const outX = midX + Math.sin(theta1Rad) * radius;
      const outY = midY - Math.cos(theta1Rad) * radius;
      drawLaserBeam(ctx, midX, midY, outX, outY, beamColor, glowColor, 4);
    } else {
      const sinTheta2 = (n1 / n2) * Math.sin(theta1Rad);
      const theta2Rad = Math.asin(sinTheta2);
      const outX = midX + Math.sin(theta2Rad) * radius;
      const outY = midY + Math.cos(theta2Rad) * radius;
      drawLaserBeam(ctx, midX, midY, outX, outY, beamColor, glowColor, 3);
      drawLaserBeam(
        ctx,
        midX,
        midY,
        midX + Math.sin(theta1Rad) * radius,
        midY - Math.cos(theta1Rad) * radius,
        beamColor,
        glowColor,
        1,
        0.2,
      );
    }

    drawHUD(ctx, canvas, p, n1, n2, criticalAngleRad, isTIR);
  }

  function renderFiberMode() {
    const n1 = MATERIALS[p.material1Idx].n;
    const n2 = MATERIALS[p.material2Idx].n;
    const coreHeight = canvas.height * 0.3;
    const midY = canvas.height / 2;
    const fiberStart = 100;
    const fiberEnd = canvas.width - 20;

    // ── Draw Cladding (Lower Index) ──
    ctx.fillStyle = MATERIALS[p.material2Idx].color;
    ctx.fillRect(fiberStart, midY - coreHeight, fiberEnd - fiberStart, coreHeight * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.strokeRect(fiberStart, midY - coreHeight, fiberEnd - fiberStart, coreHeight * 2);

    // ── Draw Core (Higher Index) ──
    ctx.fillStyle = MATERIALS[p.material1Idx].color;
    ctx.fillRect(fiberStart, midY - coreHeight / 2, fiberEnd - fiberStart, coreHeight);
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.strokeRect(fiberStart, midY - coreHeight / 2, fiberEnd - fiberStart, coreHeight);

    // ── Physics & Ray Tracing ──
    const theta1Rad = (p.incidentAngle * Math.PI) / 180;
    const criticalAngleRad = n1 > n2 ? Math.asin(n2 / n1) : null;

    // We assume the laser is aiming at (fiberStart, midY)
    const laserX = fiberStart - 80;
    const laserY = midY + Math.sin(theta1Rad) * 40; // Laser source moves vertically to change angle

    const beamColor = p.laserColor;
    const glowColor = beamColor + '66';

    // Draw Laser Source
    drawLaserSource(ctx, laserX, laserY, fiberStart, midY, beamColor);

    // Initial segment (laser to fiber entry)
    drawLaserBeam(ctx, laserX, laserY, fiberStart, midY, beamColor, glowColor, 4);
    drawFlare(ctx, fiberStart, midY, beamColor, 1.0);

    // Ray inside the fiber
    // 1. Air to Core Refraction (n_air=1 to n1)
    const nAir = 1.0;
    const sinPhi = (nAir / n1) * Math.sin(theta1Rad);
    const phiRad = Math.asin(sinPhi); // Angle relative to horizontal axis

    // The angle relative to the core-cladding normal is (90 - phi)
    const angleToNormal = Math.PI / 2 - phiRad;
    const isTIR = criticalAngleRad !== null && angleToNormal >= criticalAngleRad;

    let currX = fiberStart;
    let currY = midY;
    let currAngle = phiRad * (laserY > midY ? -1 : 1);

    // Iterative Bouncing
    ctx.save();
    for (let bounce = 0; bounce < 10; bounce++) {
      let nextX, nextY;
      const distToTop = currY - (midY - coreHeight / 2);
      const distToBottom = midY + coreHeight / 2 - currY;

      if (currAngle < 0) {
        // Moving towards top cladding
        const dist = distToTop;
        const dx = dist / Math.tan(Math.abs(currAngle));
        nextX = currX + dx;
        nextY = midY - coreHeight / 2;
      } else {
        // Moving towards bottom cladding
        const dist = distToBottom;
        const dx = dist / Math.tan(Math.abs(currAngle));
        nextX = currX + dx;
        nextY = midY + coreHeight / 2;
      }

      if (nextX > fiberEnd) {
        // Final segment exits or hits the end
        const remainingX = fiberEnd - currX;
        const remainingY = remainingX * Math.tan(currAngle);
        drawLaserBeam(ctx, currX, currY, fiberEnd, currY + remainingY, beamColor, glowColor, 4);
        break;
      }

      drawLaserBeam(ctx, currX, currY, nextX, nextY, beamColor, glowColor, 4);

      if (!isTIR) {
        // Light leaks out!
        const sinExit = (n1 / n2) * Math.sin(angleToNormal);
        if (sinExit <= 1) {
          const exitAngle = Math.asin(sinExit);
          const leakY = currAngle < 0 ? -100 : 100;
          const leakX = nextX + Math.abs(leakY / Math.tan(exitAngle));
          drawLaserBeam(ctx, nextX, nextY, leakX, nextY + leakY, beamColor, glowColor, 2, 0.4);
        }
        break; // Stop primary ray if it leaks
      }

      currX = nextX;
      currY = nextY;
      currAngle *= -1; // Reflect
    }
    ctx.restore();

    // HUD
    drawFiberHUD(ctx, canvas, p, n1, n2, criticalAngleRad, isTIR);
  }

  function drawLaserSource(ctx, x, y, tx, ty, color) {
    const angle = Math.atan2(ty - y, tx - x);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    // Laser Pointer Body
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-40, -10, 40, 20);
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1;
    ctx.strokeRect(-40, -10, 40, 20);

    // Laser Tip
    ctx.fillStyle = color;
    ctx.fillRect(0, -6, 5, 12);

    ctx.restore();
  }

  function drawLaserBeam(ctx, x1, y1, x2, y2, color, glow, width, alpha = 1) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.lineCap = 'round';
    ctx.shadowBlur = 10;
    ctx.shadowColor = color;
    ctx.strokeStyle = glow;
    ctx.lineWidth = width + 4;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = width * 0.4;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.restore();
  }

  function drawFlare(ctx, x, y, color, scale) {
    const grad = ctx.createRadialGradient(x, y, 0, x, y, 12 * scale);
    grad.addColorStop(0, '#fff');
    grad.addColorStop(0.3, color);
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, 12 * scale, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawProtractor(ctx, x, y, r) {
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.stroke();
    for (let a = 0; a < 360; a += 5) {
      const rad = (a * Math.PI) / 180;
      const t = a % 10 === 0 ? 12 : 6;
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(rad) * r, y + Math.sin(rad) * r);
      ctx.lineTo(x + Math.cos(rad) * (r - t), y + Math.sin(rad) * (r - t));
      ctx.stroke();
    }
  }

  function drawNormal(ctx, x, y1, y2) {
    ctx.setLineDash([4, 8]);
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.beginPath();
    ctx.moveTo(x, y1);
    ctx.lineTo(x, y2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  function drawHUD(ctx, canvas, p, n1, n2, criticalAngleRad, isTIR) {
    ctx.fillStyle = '#fff';
    ctx.font = '12px JetBrains Mono';
    ctx.textAlign = 'left';
    ctx.fillText(`Top: ${MATERIALS[p.material1Idx].name} (${n1.toFixed(2)})`, 20, 30);
    ctx.fillText(
      `Bottom: ${MATERIALS[p.material2Idx].name} (${n2.toFixed(2)})`,
      20,
      canvas.height - 25,
    );
    ctx.textAlign = 'right';
    if (criticalAngleRad) {
      const critDeg = (criticalAngleRad * 180) / Math.PI;
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(`CRITICAL ANGLE: ${critDeg.toFixed(1)}°`, canvas.width - 20, 30);
    }
    if (isTIR) {
      ctx.fillStyle = '#fb7185';
      ctx.font = '800 14px JetBrains Mono';
      ctx.fillText('TOTAL INTERNAL REFLECTION', canvas.width - 20, canvas.height / 2 - 20);
    }
  }

  function drawFiberHUD(ctx, canvas, p, n1, n2, criticalAngleRad, isTIR) {
    ctx.fillStyle = '#fff';
    ctx.font = '12px JetBrains Mono';
    ctx.textAlign = 'left';
    ctx.fillText(`Core (n1): ${MATERIALS[p.material1Idx].name}`, 110, canvas.height / 2);
    ctx.fillText(`Cladding (n2): ${MATERIALS[p.material2Idx].name}`, 110, 30);
    ctx.textAlign = 'right';
    if (isTIR) {
      ctx.fillStyle = '#4ade80';
      ctx.font = 'bold 16px Inter';
      ctx.fillText('SIGNAL TRANSMITTING', canvas.width - 20, 40);
    } else {
      ctx.fillStyle = '#fb7185';
      ctx.font = 'bold 16px Inter';
      ctx.fillText('SIGNAL LOSS: LEAKAGE', canvas.width - 20, 40);
    }
  }

  function aimLaserFromPointer(e) {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const midX = canvas.width / 2;
    const midY = canvas.height / 2;

    if (p.viewMode === 'fiber') {
      const fiberStart = 100;
      const angle = Math.atan2(Math.abs(my - midY), fiberStart - mx);
      const deg = (angle * 180) / Math.PI;
      p.incidentAngle = Math.max(0, Math.min(85, deg));
      options.onParamChange?.({ incidentAngle: p.incidentAngle });
      render();
    } else if (my < midY) {
      const angle = Math.atan2(mx - midX, midY - my);
      const deg = Math.abs((angle * 180) / Math.PI);
      if (deg <= 90) {
        p.incidentAngle = deg;
        options.onParamChange?.({ incidentAngle: p.incidentAngle });
        render();
      }
    }
  }

  function onPointerDown(e) {
    draggingLaser = true;
    canvas.setPointerCapture?.(e.pointerId);
    aimLaserFromPointer(e);
  }

  function onPointerMove(e) {
    if (!draggingLaser) return;
    aimLaserFromPointer(e);
  }

  function onPointerUp(e) {
    if (!draggingLaser) return;
    draggingLaser = false;
    canvas.releasePointerCapture?.(e.pointerId);
  }

  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointercancel', onPointerUp);
  render();

  return {
    start: () => {
      render();
    },
    stop: () => {
      render();
    },
    reset: () => {
      render();
    },
    setParams: (newParams) => {
      p = { ...p, ...newParams };
      render();
    },
    getData: () => ({
      theta1: p.incidentAngle,
      mode: p.viewMode === 'fiber' ? 1 : 0,
    }),
    destroy: () => {
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerUp);
    },
  };
}
