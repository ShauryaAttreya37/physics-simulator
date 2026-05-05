/**
 * 3D Electrostatic Geometries
 *
 * True 3D particle engine to compute internal/external volumetric fields
 * evaluated against a 2D camera cross-section scalar and vector field map.
 */

const SHAPE_NAMES = [
  'Point Charge', // 0
  'Electric Dipole', // 1
  'Finite Line Charge', // 2
  'Charged Ring', // 3
  'Parallel Plates', // 4
  'Hollow Sphere', // 5
  'Solid Sphere', // 6
  'Cylinder', // 7
  'Charged Disc', // 8
];

const DEFAULTS = {
  shape: 5, // Default to Hollow Sphere to show Faraday physics
  chargeDensity: 1.0,
  probeX: 120,
  probeY: -120,
};

export const defaultParams = { ...DEFAULTS };

export const equationSections = [
  {
    title: 'Introduction',
    content:
      'Electric fields exist around any charged object. This simulation shows how fields vary with shape and charge distribution. You can explore different geometries: spheres, cylinders, plates. The field lines show force direction, and you can probe the field strength at different points. Understanding field patterns is crucial for capacitors, particle accelerators, and electronic devices.',
  },
  {
    title: "Gauss's Law & Internal Fields",
    equations: [
      {
        latex: String.raw`\oint \mathbf{E} \cdot d\mathbf{A} = \frac{Q_{\text{enc}}}{\varepsilon_0}`,
        description:
          "Gauss's Law: The total electric flux through a closed surface equals the charge inside divided by ε₀. This makes field calculations much easier for symmetric charge distributions.",
      },
      {
        latex: String.raw`E_{\text{hollow}} = \begin{cases} 0 & r < R \\[4pt] \dfrac{Q}{4\pi\varepsilon_0 r^2} & r > R \end{cases}`,
        description:
          "For a hollow sphere, field inside is zero (like a Faraday cage - charges on surface cancel internal field). Outside, it's like a point charge.",
      },
      {
        latex: String.raw`E_{\text{solid}} = \begin{cases} \dfrac{Q r}{4\pi\varepsilon_0 R^3} & r < R \\[4pt] \dfrac{Q}{4\pi\varepsilon_0 r^2} & r > R \end{cases}`,
        description:
          'For a solid uniform sphere, field inside increases linearly with r (because enclosed charge ∝ r³). Outside, same as point charge.',
      },
    ],
    variables: [
      { symbol: 'ε₀', description: 'Permittivity of free space (8.85 × 10^{-12} F/m)' },
      { symbol: 'Q_enc', description: 'Total charge enclosed by the Gaussian surface' },
      { symbol: 'R', description: 'Radius of the sphere' },
    ],
  },
  {
    title: '3D Field Projections',
    equations: [
      {
        latex: String.raw`r_{3D} = \sqrt{(\Delta x)^2 + (\Delta y)^2 + (\Delta z)^2}`,
        description:
          'The simulation calculates full 3D distances to all charge elements, even though you see a 2D cross-section.',
      },
      {
        latex: String.raw`\mathbf{E}_{2D} = \langle E_x, E_y \rangle, \quad |\mathbf{E}| = \sqrt{E_x^2 + E_y^2 + E_z^2}`,
        description:
          'Field lines show the 2D projection, but the magnitude includes the z-component. Move the probe to see how field varies in 3D.',
      },
    ],
  },
  {
    title: 'How to Use',
    content:
      '1. Select different geometries (sphere, cylinder, plate, etc.) from the shape control.\n2. Adjust charge density - positive for attraction, negative for repulsion.\n3. Move the probe (yellow dot) around to see field strength and potential at different points.\n4. Watch field lines - they point from positive to negative charge.\n5. Try hollow vs solid spheres - notice the field inside hollow ones is zero.\n6. Look at the graphs for potential V and field magnitude |E|.',
  },
  {
    title: 'Beginner Tips',
    content:
      'Field lines never cross - they show force direction on a positive test charge. Closer lines mean stronger fields. Conductors have zero field inside (Faraday cage effect). The potential is like electric "height" - work is needed to move against the field.',
  },
];

export const controls = [
  { key: 'shape', label: 'Geometry (0–8)', min: 0, max: 8, step: 1 },
  { key: 'chargeDensity', label: 'Charge Density λ', min: -3, max: 3, step: 0.1 },
];

export const graphParams = [
  { key: 'V', label: 'Potential V' },
  { key: 'E', label: 'Field |E|' },
];

export const equations = [];

export const method = '3D integral superposition';

export function create(canvas, initParams = {}) {
  const ctx = canvas.getContext('2d');
  let p = { ...DEFAULTS, ...initParams };

  // Base 3D charges [ {xw, yw, zw, q} ]
  let baseCharges = [];
  // Rotated camera space charges [ {cx, cy, cz, q} ]
  let camCharges = [];
  let fieldLines = [];
  let cachedShape = -1;
  let cachedDensity = -999;

  let heatCanvas = null;
  let heatNeedsRedraw = true;
  let yaw = 0.3;
  let pitch = 0.2;
  let isOrbiting = false;
  let lastMouse = { x: 0, y: 0 };

  const focal = 600; // perspective depth

  function dims() {
    return { w: canvas.width, h: canvas.height, cX: canvas.width / 2, cY: canvas.height / 2 };
  }

  // ── Geometry Construction (World Space centered at 0,0,0) ──────
  function buildShape() {
    baseCharges = [];
    const qBase = p.chargeDensity;
    const s = Math.round(p.shape);

    if (s === 0) {
      // Point
      baseCharges.push({ xw: 0, yw: 0, zw: 0, q: qBase });
    } else if (s === 1) {
      // Dipole
      baseCharges.push({ xw: -60, yw: 0, zw: 0, q: qBase });
      baseCharges.push({ xw: 60, yw: 0, zw: 0, q: -qBase });
    } else if (s === 2) {
      // Line
      const N = 50;
      const L = 220;
      for (let i = 0; i < N; i++) {
        baseCharges.push({ xw: -L / 2 + (L * i) / (N - 1), yw: 0, zw: 0, q: qBase / N });
      }
    } else if (s === 3) {
      // Ring (XY plane so it's face-on in default view)
      const N = 80;
      const R = 90;
      for (let i = 0; i < N; i++) {
        const th = (i / N) * 2 * Math.PI;
        baseCharges.push({ xw: R * Math.cos(th), yw: R * Math.sin(th), zw: 0, q: qBase / N });
      }
    } else if (s === 4) {
      // Parallel Plates (Two 2D grids separated in X so field points X)
      const gridSize = 10;
      const W = 160;
      const gap = 60;
      const step = W / (gridSize - 1);
      for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
          const py = -W / 2 + i * step;
          const pz = -W / 2 + j * step;
          baseCharges.push({ xw: -gap / 2, yw: py, zw: pz, q: qBase / (gridSize * gridSize) });
          baseCharges.push({ xw: gap / 2, yw: py, zw: pz, q: -qBase / (gridSize * gridSize) });
        }
      }
    } else if (s === 5) {
      // Hollow Sphere (Fibonacci Lattice)
      const N = 300;
      const R = 90;
      const phi = Math.PI * (3 - Math.sqrt(5));
      for (let i = 0; i < N; i++) {
        const y = 1 - (i / (N - 1)) * 2;
        const r = Math.sqrt(1 - y * y);
        const th = phi * i;
        baseCharges.push({
          xw: Math.cos(th) * r * R,
          yw: y * R,
          zw: Math.sin(th) * r * R,
          q: qBase / N,
        });
      }
    } else if (s === 6) {
      // Solid Sphere (Nested Fibonacci Lattices)
      const shells = 8;
      const R = 100;
      const phi = Math.PI * (3 - Math.sqrt(5));
      let totalPts = 0;

      // Calculate total points first to normalize charge
      for (let si = 1; si <= shells; si++) {
        totalPts += Math.floor(100 * (si / shells) ** 2) + 10;
      }

      for (let si = 1; si <= shells; si++) {
        const rad = (si / shells) * R;
        const nPts = Math.floor(100 * (si / shells) ** 2) + 10;
        for (let i = 0; i < nPts; i++) {
          const y = 1 - (i / (nPts - 1)) * 2;
          const r = Math.sqrt(1 - y * y);
          const th = phi * i;
          baseCharges.push({
            xw: Math.cos(th) * r * rad,
            yw: y * rad,
            zw: Math.sin(th) * r * rad,
            q: qBase / totalPts,
          });
        }
      }
    } else if (s === 7) {
      // Cylinder (Vertical Stack of Rings)
      const R = 60;
      const H = 160;
      const rings = 12;
      const ptsPerRing = 40;
      for (let ri = 0; ri < rings; ri++) {
        const y = -H / 2 + (H * ri) / Math.max(1, rings - 1);
        for (let i = 0; i < ptsPerRing; i++) {
          const th = (i / ptsPerRing) * 2 * Math.PI;
          baseCharges.push({
            xw: R * Math.cos(th),
            yw: y,
            zw: R * Math.sin(th),
            q: qBase / (rings * ptsPerRing),
          });
        }
      }
    } else if (s === 8) {
      // Charged Disc
      const R = 100;
      const rings = 12;
      let totalPts = 0;
      for (let ri = 1; ri <= rings; ri++) {
        totalPts += Math.max(6, Math.floor(30 * (ri / rings)));
      }
      for (let ri = 1; ri <= rings; ri++) {
        const r = (ri / rings) * R;
        const nPts = Math.max(6, Math.floor(30 * (ri / rings)));
        for (let i = 0; i < nPts; i++) {
          const th = (i / nPts) * 2 * Math.PI + ri * 0.5;
          baseCharges.push({
            xw: r * Math.cos(th),
            yw: r * Math.sin(th),
            zw: 0,
            q: qBase / totalPts,
          });
        }
      }
    }

    rotateAndProject();
  }

  // ── Rotation Transform ───────────────────────────────────────────
  function rotateAndProject() {
    camCharges = [];
    const cyaw = Math.cos(yaw);
    const syaw = Math.sin(yaw);
    const cpit = Math.cos(pitch);
    const spit = Math.sin(pitch);

    for (const c of baseCharges) {
      // Yaw (around Y)
      const x1 = c.xw * cyaw + c.zw * syaw;
      const z1 = -c.xw * syaw + c.zw * cyaw;
      const y1 = c.yw;

      // Pitch (around X)
      const y2 = y1 * cpit - z1 * spit;
      const z2 = y1 * spit + z1 * cpit;

      camCharges.push({ cx: x1, cy: y2, cz: z2, q: c.q });
    }

    // Sort by depth (back to front) for occlusion
    camCharges.sort((a, b) => b.cz - a.cz);
    heatNeedsRedraw = true;
  }

  // ── 3D Electric Field Math (Evaluated at Camera Z=0 plane) ──────
  function getField(x_cam, y_cam) {
    let Ex = 0,
      Ey = 0,
      Ez = 0,
      V = 0;
    const k = 1000;
    for (let i = 0; i < camCharges.length; i++) {
      const c = camCharges[i];
      const dx = x_cam - c.cx;
      const dy = y_cam - c.cy;
      const dz = 0 - c.cz; // Evaluated at z=0 plane!

      const r2 = dx * dx + dy * dy + dz * dz;
      if (r2 < 1) continue;
      const r = Math.sqrt(r2);

      V += (k * c.q) / r;
      const eCoeff = (k * c.q) / r2;
      Ex += eCoeff * (dx / r);
      Ey += eCoeff * (dy / r);
      Ez += eCoeff * (dz / r);
    }
    return { Ex, Ey, Ez, V };
  }

  // ── Steamlines (RK2) in the Cross-Section ────────────────────────
  function computeFieldLines() {
    fieldLines = [];
    if (camCharges.length === 0 || p.chargeDensity === 0) return;

    const step = 4;
    const maxSteps = 250;
    const sign = p.chargeDensity > 0 ? 1 : -1;
    const { cX, cY } = dims();

    // To prevent total chaos, we seed lines uniformly across the screen
    const seeds = [];
    if (baseCharges.length < 5) {
      for (const c of camCharges) {
        for (let i = 0; i < 16; i++) {
          const th = (i * Math.PI) / 8;
          seeds.push({ x: c.cx + 10 * Math.cos(th), y: c.cy + 10 * Math.sin(th) });
        }
      }
    } else {
      // Grid seeding for uniform coverage
      for (let x = -cX + 20; x < cX; x += 40) {
        for (let y = -cY + 20; y < cY; y += 40) {
          seeds.push({ x, y });
        }
      }
    }

    // Trace
    for (const seed of seeds) {
      let px = seed.x,
        py = seed.y;

      // Prevent rendering lines born deeply inside solid objects (low E field magnitude generally)
      const f0 = getField(px, py);
      if (Math.abs(f0.V) < 0.1) continue;

      const path = [{ x: px, y: py }];

      for (let s = 0; s < maxSteps; s++) {
        const f1 = getField(px, py);
        const m1 = Math.sqrt(f1.Ex * f1.Ex + f1.Ey * f1.Ey); // 2D path!
        if (m1 < 0.01) break;
        const dx1 = sign * step * (f1.Ex / m1);
        const dy1 = sign * step * (f1.Ey / m1);

        const f2 = getField(px + dx1 * 0.5, py + dy1 * 0.5);
        const m2 = Math.sqrt(f2.Ex * f2.Ex + f2.Ey * f2.Ey);
        if (m2 < 0.01) break;

        px += sign * step * (f2.Ex / m2);
        py += sign * step * (f2.Ey / m2);
        path.push({ x: px, y: py });

        if (px < -cX - 50 || px > cX + 50 || py < -cY - 50 || py > cY + 50) break;
      }
      if (path.length > 3) fieldLines.push(path);
    }
  }

  // ── Heatmap ───────────────────────────────────────────────────────
  function drawHeatmap(W, H, cX, cY) {
    if (!heatCanvas) heatCanvas = document.createElement('canvas');
    const scale = 5;
    const ew = Math.ceil(W / scale);
    const eh = Math.ceil(H / scale);
    heatCanvas.width = ew;
    heatCanvas.height = eh;
    const ectx = heatCanvas.getContext('2d');
    const imgData = ectx.createImageData(ew, eh);
    const data = imgData.data;

    for (let py = 0; py < eh; py++) {
      for (let px = 0; px < ew; px++) {
        const sx = px * scale - cX;
        const sy = py * scale - cY;

        let V = 0;
        const k = 1000;
        for (let i = 0; i < camCharges.length; i++) {
          const c = camCharges[i];
          const dx = sx - c.cx;
          const dy = sy - c.cy;
          const dz = 0 - c.cz;
          const r = Math.sqrt(dx * dx + dy * dy + dz * dz + 10);
          V += (k * c.q) / r;
        }

        const idx = (py * ew + px) * 4;
        const intensity = Math.min(1, Math.log1p(Math.abs(V) * 0.02) * 0.75);
        if (V > 0) {
          data[idx] = Math.floor(intensity * 140);
          data[idx + 1] = Math.floor(intensity * 20);
          data[idx + 2] = Math.floor(intensity * 200);
        } else {
          data[idx] = Math.floor(intensity * 20);
          data[idx + 1] = Math.floor(intensity * 160);
          data[idx + 2] = Math.floor(intensity * 220);
        }
        data[idx + 3] = Math.floor(intensity * 180);
      }
    }
    ectx.putImageData(imgData, 0, 0);

    ctx.save();
    ctx.globalAlpha = 0.6;
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(heatCanvas, 0, 0, W, H);
    ctx.restore();
    heatNeedsRedraw = false;
  }

  // ── Probe ───────────────────────────────────────────────────────
  let probe = { x: DEFAULTS.probeX, y: DEFAULTS.probeY, dragging: false };

  const getMouse = (e) => {
    const rect = canvas.getBoundingClientRect();
    const sx = canvas.width / rect.width;
    const sy = canvas.height / rect.height;
    return {
      x: ((e.clientX ?? e.touches?.[0]?.clientX) - rect.left) * sx - canvas.width / 2,
      y: ((e.clientY ?? e.touches?.[0]?.clientY) - rect.top) * sy - canvas.height / 2,
    };
  };

  const onDown = (e) => {
    const { x, y } = getMouse(e);
    if (Math.hypot(x - probe.x, y - probe.y) < 30) {
      probe.dragging = true;
    } else {
      isOrbiting = true;
      lastMouse = { x, y };
    }
  };
  const onMove = (e) => {
    const { x, y } = getMouse(e);
    if (probe.dragging) {
      probe.x = x;
      probe.y = y;
    } else if (isOrbiting) {
      const dx = x - lastMouse.x;
      const dy = y - lastMouse.y;
      yaw += dx * 0.01;
      pitch -= dy * 0.01;
      pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, pitch));
      lastMouse = { x, y };
      rotateAndProject();
    }
  };
  const onUp = () => {
    probe.dragging = false;
    isOrbiting = false;
  };

  canvas.addEventListener('mousedown', onDown);
  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onUp);
  canvas.addEventListener('touchstart', onDown, { passive: false });
  window.addEventListener('touchmove', onMove, { passive: false });
  window.addEventListener('touchend', onUp);

  // ── Render loop ─────────────────────────────────────────────────
  let rafId,
    running = false;
  let animTimer = 0;

  function loop() {
    if (!running) return;
    const { w, h, cX, cY } = dims();

    if (Math.round(p.shape) !== cachedShape || p.chargeDensity !== cachedDensity) {
      buildShape();
      cachedShape = Math.round(p.shape);
      cachedDensity = p.chargeDensity;
    }

    // Auto-rotation if untouched
    animTimer++;
    if (!isOrbiting && animTimer > 60) {
      yaw += 0.002;
      rotateAndProject();
    }

    // Always compute field lines to avoid jitter, it is optimized enough
    computeFieldLines();

    // BG
    ctx.fillStyle = '#020512';
    ctx.fillRect(0, 0, w, h);

    if (heatNeedsRedraw) drawHeatmap(w, h, cX, cY);
    else if (heatCanvas) {
      ctx.globalAlpha = 0.5;
      ctx.drawImage(heatCanvas, 0, 0, w, h);
      ctx.globalAlpha = 1.0;
    }

    ctx.save();
    ctx.translate(cX, cY);

    // ── Field Lines ──
    ctx.globalCompositeOperation = 'screen';
    for (const path of fieldLines) {
      if (path.length < 3) continue;
      for (let i = 1; i < path.length; i++) {
        const t = 1 - i / path.length;
        const alpha = t * 0.4 + 0.05;
        ctx.beginPath();
        ctx.moveTo(path[i - 1].x, path[i - 1].y);
        ctx.lineTo(path[i].x, path[i].y);
        ctx.strokeStyle =
          p.chargeDensity > 0
            ? `rgba(120,180,255,${alpha.toFixed(2)})`
            : `rgba(255,120,120,${alpha.toFixed(2)})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }
    ctx.globalCompositeOperation = 'source-over';

    // ── 3D Charges with Z-Sorting & Perspective Size ──
    for (const c of camCharges) {
      // Perspective scale factor
      const s = focal / (focal + c.cz);
      if (s < 0) continue; // Behind camera

      ctx.beginPath();
      // Radius depends on shape point count and perspective depth
      const baseR = baseCharges.length <= 2 ? 8 : baseCharges.length < 100 ? 3 : 1.5;
      ctx.arc(c.cx * s, c.cy * s, baseR * s, 0, Math.PI * 2);

      const isPos = c.q > 0;
      // Depth fading (fog)
      const op = Math.max(0.1, Math.min(1, 1 - c.cz / 400));
      ctx.fillStyle = isPos ? `rgba(99,102,241,${op})` : `rgba(255, 107, 107,${op})`;
      ctx.fill();
    }

    // ── Probe & Data Readout ──
    const pf = getField(probe.x, probe.y);
    const pEmag2x = Math.sqrt(pf.Ex * pf.Ex + pf.Ey * pf.Ey);
    const pEmag3D = Math.sqrt(pf.Ex * pf.Ex + pf.Ey * pf.Ey + pf.Ez * pf.Ez);

    const pg = ctx.createRadialGradient(probe.x, probe.y, 2, probe.x, probe.y, 25);
    pg.addColorStop(0, 'rgba(253,224,71,0.4)');
    pg.addColorStop(1, 'transparent');
    ctx.fillStyle = pg;
    ctx.fillRect(probe.x - 25, probe.y - 25, 50, 50);

    ctx.beginPath();
    ctx.arc(probe.x, probe.y, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#fde047';
    ctx.fill();
    ctx.strokeStyle = '#ca8a04';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    if (pEmag2x > 0.1) {
      const vecLen = Math.min(120, Math.max(30, Math.log1p(pEmag2x * 0.3) * 30));
      const nx = vecLen * (pf.Ex / pEmag2x);
      const ny = vecLen * (pf.Ey / pEmag2x);

      ctx.beginPath();
      ctx.moveTo(probe.x, probe.y);
      ctx.lineTo(probe.x + nx, probe.y + ny);
      ctx.strokeStyle = '#fde047';
      ctx.lineWidth = 3;
      ctx.stroke();

      const ang = Math.atan2(ny, nx);
      ctx.save();
      ctx.translate(probe.x + nx, probe.y + ny);
      ctx.rotate(ang);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-12, -6);
      ctx.lineTo(-12, 6);
      ctx.closePath();
      ctx.fillStyle = '#fde047';
      ctx.fill();
      ctx.restore();
    }

    ctx.font = '600 11px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#fde047';
    ctx.fillText(`V(3D) = ${pf.V.toFixed(1)}`, probe.x + 16, probe.y - 8);
    ctx.fillText(`|E(3D)| = ${pEmag3D.toFixed(1)}`, probe.x + 16, probe.y + 8);

    ctx.restore(); // Undo translate

    // ── HUD ──
    ctx.font = '700 18px "Montserrat", sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    const shapeName = SHAPE_NAMES[Math.round(p.shape)] || '';
    ctx.fillText(shapeName, 20, 16);

    ctx.font = '500 12px "JetBrains Mono", monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.fillText(
      `Rot: [${yaw.toFixed(1)}, ${pitch.toFixed(1)}] • ${baseCharges.length} 3D Charges`,
      20,
      42,
    );

    ctx.textAlign = 'right';
    ctx.fillText('Drag background to ORBIT 3D', w - 16, h - 38);
    ctx.fillText('Drag probe to MEASURE', w - 16, h - 20);

    rafId = requestAnimationFrame(loop);
  }

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
      cachedShape = -1;
      probe.x = DEFAULTS.probeX;
      probe.y = DEFAULTS.probeY;
      yaw = 0.3;
      pitch = 0.2;
      this.start();
    },
    setParams(next) {
      Object.assign(p, next);
    },
    destroy() {
      this.stop();
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    },
    getData() {
      const pf = getField(probe.x, probe.y);
      const pEmag3D = Math.sqrt(pf.Ex * pf.Ex + pf.Ey * pf.Ey + pf.Ez * pf.Ez);
      return { V: pf.V, E: pEmag3D };
    },
  };
}
