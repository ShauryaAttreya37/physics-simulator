/**
 * Electrostatic Geometries
 *
 * A 2D teaching lab for electric fields, potentials, equipotentials, and
 * Gauss's law. The solver uses analytic point-charge superposition for the
 * visible field and overlays symmetry/Gaussian-surface measurements.
 */

const EPS = 14;
const FIELD_SCALE = 900;
const POTENTIAL_SCALE = 1200;
const WORLD_LIMIT = 320;

const GEOMETRIES = [
  { id: 'point', label: 'Point Charge', sub: '1/r^2 field' },
  { id: 'dipole', label: 'Dipole', sub: '+ and - pair' },
  { id: 'line', label: 'Line Charge', sub: 'cylindrical symmetry' },
  { id: 'ring', label: 'Ring', sub: 'zero center field' },
  { id: 'plates', label: 'Parallel Plates', sub: 'capacitor field' },
  { id: 'hollowSphere', label: 'Hollow Sphere', sub: 'Faraday cage' },
  { id: 'solidSphere', label: 'Solid Sphere', sub: 'E grows inside' },
  { id: 'cylinder', label: 'Cylinder', sub: 'Gauss cylinder' },
  { id: 'disc', label: 'Charged Disc', sub: 'finite sheet' },
];

const DEFAULTS = {
  geometry: 5,
  charge: 2.5,
  separation: 150,
  size: 130,
  viewMode: 0,
  showVectors: 1,
  showEquipotentials: 1,
  gaussianRadius: 150,
  probeX: 150,
  probeY: -80,
};

export const defaultParams = { ...DEFAULTS };

export const controls = [
  {
    key: 'geometry',
    label: 'Geometry',
    type: 'tiles',
    tiles: GEOMETRIES.map((item, index) => ({
      value: index,
      label: item.label,
      sub: item.sub,
    })),
  },
  { key: 'charge', label: 'Total Charge Q', min: -5, max: 5, step: 0.1 },
  { key: 'separation', label: 'Separation / Gap', min: 60, max: 240, step: 5 },
  { key: 'size', label: 'Size / Radius', min: 60, max: 220, step: 5 },
  {
    key: 'viewMode',
    label: 'Field View',
    type: 'tiles',
    tiles: [
      { value: 0, label: 'Potential', sub: 'voltage landscape' },
      { value: 1, label: 'Field', sub: 'force strength' },
      { value: 2, label: 'Gauss', sub: 'inside vs outside' },
    ],
  },
  {
    key: 'showVectors',
    label: 'Field Arrows',
    type: 'tiles',
    tiles: [
      { value: 0, label: 'Off' },
      { value: 1, label: 'On' },
    ],
  },
  {
    key: 'showEquipotentials',
    label: 'Equipotentials',
    type: 'tiles',
    tiles: [
      { value: 0, label: 'Off' },
      { value: 1, label: 'On' },
    ],
  },
  { key: 'gaussianRadius', label: 'Gaussian Radius', min: 40, max: 280, step: 5 },
  { key: 'probeX', label: 'Probe X', min: -300, max: 300, step: 5 },
  { key: 'probeY', label: 'Probe Y', min: -220, max: 220, step: 5 },
];

export const graphParams = [
  { key: 'E', label: 'Field |E|' },
  { key: 'V', label: 'Potential V' },
  { key: 'fluxRatio', label: 'Flux / Qenc' },
  { key: 'enclosedCharge', label: 'Enclosed Charge' },
];

export const equations = [];

export const equationSections = [
  {
    title: 'What To Learn',
    content:
      'Electric fields are force maps: arrows show the force direction on a positive test charge, while color shows potential or field strength. Drag the yellow probe to measure E and V anywhere. Change the Gaussian radius and watch when the enclosed charge changes.',
  },
  {
    title: "Gauss's Law",
    equations: [
      {
        latex: String.raw`\Phi_E = \oint \mathbf{E}\cdot d\mathbf{A} = \frac{Q_{\text{enc}}}{\epsilon_0}`,
        description:
          'Only charge inside the Gaussian surface contributes to net flux. Charges outside still affect local E, but their net flux through a closed surface cancels.',
      },
      {
        latex: String.raw`E_{\text{hollow sphere}} = 0 \quad (r<R)`,
        description:
          'A charged conducting shell has zero electric field inside. That is the Faraday cage idea.',
      },
      {
        latex: String.raw`E_{\text{solid sphere}} \propto r \quad (r<R)`,
        description:
          'Inside a uniformly charged solid sphere, enclosed charge grows like r cubed, so the field grows linearly with radius.',
      },
    ],
  },
  {
    title: 'Field And Potential',
    equations: [
      {
        latex: String.raw`\mathbf{E} = -\nabla V`,
        description:
          'Field arrows point downhill on the potential landscape. Equipotential curves cross field lines at right angles.',
      },
      {
        latex: String.raw`V = \sum_i \frac{k q_i}{r_i}, \qquad \mathbf{E} = \sum_i \frac{k q_i}{r_i^2}\hat{\mathbf{r}}_i`,
        description:
          'Most geometries here are built from small charge elements, so the field is a superposition of many point-charge contributions.',
      },
    ],
  },
  {
    title: 'Useful Experiments',
    content:
      'Try Dipole in Potential view and watch the zero-voltage saddle between charges. Try Hollow Sphere in Gauss view and move the probe inside the shell: E should be nearly zero. Try Parallel Plates and notice the field is strongest and most uniform between the plates but frays near the edges.',
  },
];

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function geometryId(p) {
  return GEOMETRIES[Math.round(p.geometry)]?.id || GEOMETRIES[0].id;
}

function colorForSigned(value, maxAbs) {
  const t = clamp(Math.abs(value) / Math.max(maxAbs, 1e-6), 0, 1);
  if (value >= 0) {
    return `rgba(${Math.round(35 + 220 * t)}, ${Math.round(70 + 70 * (1 - t))}, ${Math.round(120 + 50 * (1 - t))}, 1)`;
  }
  return `rgba(${Math.round(30 + 40 * (1 - t))}, ${Math.round(90 + 120 * t)}, ${Math.round(150 + 95 * t)}, 1)`;
}

function magnitudeColor(value, maxValue) {
  const t = clamp(value / Math.max(maxValue, 1e-6), 0, 1);
  const r = Math.round(20 + 235 * Math.pow(t, 1.6));
  const g = Math.round(40 + 160 * Math.sin(t * Math.PI));
  const b = Math.round(70 + 150 * (1 - t));
  return `rgba(${r}, ${g}, ${b}, 1)`;
}

function addDiscCharges(charges, radius, totalQ, rings = 8, pointsPerRing = 28) {
  let count = 1;
  for (let ring = 1; ring <= rings; ring += 1) {
    count += Math.max(8, Math.round((pointsPerRing * ring) / rings));
  }

  charges.push({ x: 0, y: 0, q: totalQ / count });
  for (let ring = 1; ring <= rings; ring += 1) {
    const r = (radius * ring) / rings;
    const n = Math.max(8, Math.round((pointsPerRing * ring) / rings));
    for (let i = 0; i < n; i += 1) {
      const theta = (i / n) * Math.PI * 2 + ring * 0.27;
      charges.push({
        x: r * Math.cos(theta),
        y: r * Math.sin(theta),
        q: totalQ / count,
      });
    }
  }
}

function buildCharges(p, livePoints) {
  const id = geometryId(p);
  const q = p.charge;
  const radius = p.size;
  const separation = p.separation;
  const charges = [];

  if (id === 'point') {
    charges.push({ x: livePoints.point.x, y: livePoints.point.y, q });
  } else if (id === 'dipole') {
    charges.push({ x: livePoints.positive.x, y: livePoints.positive.y, q: Math.abs(q) || 1 });
    charges.push({ x: livePoints.negative.x, y: livePoints.negative.y, q: -(Math.abs(q) || 1) });
  } else if (id === 'line') {
    const n = 36;
    for (let i = 0; i < n; i += 1) {
      charges.push({ x: -radius + (2 * radius * i) / (n - 1), y: 0, q: q / n });
    }
  } else if (id === 'ring' || id === 'hollowSphere') {
    const n = id === 'hollowSphere' ? 80 : 64;
    for (let i = 0; i < n; i += 1) {
      const theta = (i / n) * Math.PI * 2;
      charges.push({ x: radius * Math.cos(theta), y: radius * Math.sin(theta), q: q / n });
    }
  } else if (id === 'plates') {
    const n = 30;
    for (let i = 0; i < n; i += 1) {
      const y = -radius + (2 * radius * i) / (n - 1);
      charges.push({ x: -separation / 2, y, q: q / n });
      charges.push({ x: separation / 2, y, q: -q / n });
    }
  } else if (id === 'solidSphere' || id === 'disc') {
    addDiscCharges(
      charges,
      radius,
      q,
      id === 'solidSphere' ? 9 : 7,
      id === 'solidSphere' ? 30 : 24,
    );
  } else if (id === 'cylinder') {
    const rings = 9;
    const around = 20;
    let total = rings * around;
    for (let row = 0; row < rings; row += 1) {
      const y0 = -radius + (2 * radius * row) / (rings - 1);
      for (let i = 0; i < around; i += 1) {
        const theta = (i / around) * Math.PI * 2;
        charges.push({
          x: 0.55 * radius * Math.cos(theta),
          y: y0,
          q: q / total,
        });
      }
    }
  }

  return charges;
}

function fieldAt(x, y, charges, p) {
  const id = geometryId(p);
  const r = Math.hypot(x, y);

  if (id === 'hollowSphere' && r < p.size * 0.96) {
    return { Ex: 0, Ey: 0, E: 0, V: (POTENTIAL_SCALE * p.charge) / Math.max(p.size, 1) };
  }

  if (id === 'solidSphere' && r < p.size && r > 0.001) {
    const e = (FIELD_SCALE * p.charge * r) / Math.max(p.size ** 3, 1);
    return {
      Ex: e * (x / r),
      Ey: e * (y / r),
      E: Math.abs(e),
      V: (POTENTIAL_SCALE * p.charge * (3 * p.size * p.size - r * r)) / (2 * p.size ** 3),
    };
  }

  let Ex = 0;
  let Ey = 0;
  let V = 0;
  for (const charge of charges) {
    const dx = x - charge.x;
    const dy = y - charge.y;
    const r2 = dx * dx + dy * dy + EPS * EPS;
    const rMag = Math.sqrt(r2);
    const coeff = (FIELD_SCALE * charge.q) / (r2 * rMag);
    Ex += coeff * dx;
    Ey += coeff * dy;
    V += (POTENTIAL_SCALE * charge.q) / rMag;
  }

  return { Ex, Ey, E: Math.hypot(Ex, Ey), V };
}

function enclosedChargeForRadius(radius, charges, p) {
  const id = geometryId(p);
  if (id === 'solidSphere') {
    if (radius >= p.size) return p.charge;
    return p.charge * Math.pow(Math.max(radius, 0) / Math.max(p.size, 1), 3);
  }
  if (id === 'hollowSphere' || id === 'ring') return radius >= p.size ? p.charge : 0;
  return charges.reduce((sum, charge) => {
    return Math.hypot(charge.x, charge.y) <= radius ? sum + charge.q : sum;
  }, 0);
}

function fluxEstimate(radius, charges, p) {
  const samples = 96;
  let flux = 0;
  for (let i = 0; i < samples; i += 1) {
    const theta = (i / samples) * Math.PI * 2;
    const nx = Math.cos(theta);
    const ny = Math.sin(theta);
    const f = fieldAt(radius * nx, radius * ny, charges, p);
    flux += (f.Ex * nx + f.Ey * ny) * radius * ((2 * Math.PI) / samples);
  }
  return flux / FIELD_SCALE;
}

export function create(canvas, initParams = {}, options = {}) {
  const ctx = canvas.getContext('2d');
  let p = { ...DEFAULTS, ...initParams };
  let running = false;
  let rafId = null;
  let simTime = 0;
  let heatCanvas = null;
  let heatKey = '';
  let dragging = null;

  const livePoints = {
    point: { x: 0, y: 0 },
    positive: { x: -DEFAULTS.separation / 2, y: 0 },
    negative: { x: DEFAULTS.separation / 2, y: 0 },
  };

  function dims() {
    return { w: canvas.width, h: canvas.height, cx: canvas.width / 2, cy: canvas.height / 2 };
  }

  function toWorld(event) {
    const rect = canvas.getBoundingClientRect();
    const scale = p.viewScale ?? 1;
    return {
      x: ((event.clientX - rect.left) * (canvas.width / rect.width) - canvas.width / 2) / scale,
      y: ((event.clientY - rect.top) * (canvas.height / rect.height) - canvas.height / 2) / scale,
    };
  }

  function syncDipoleToSeparation() {
    if (geometryId(p) !== 'dipole') return;
    if (dragging === 'positive' || dragging === 'negative') return;
    livePoints.positive.x = -p.separation / 2;
    livePoints.positive.y = 0;
    livePoints.negative.x = p.separation / 2;
    livePoints.negative.y = 0;
  }

  function makeHeatmap(charges) {
    const { w, h } = dims();
    const scale = 5;
    const sw = Math.max(1, Math.ceil(w / scale));
    const sh = Math.max(1, Math.ceil(h / scale));
    if (!heatCanvas) heatCanvas = document.createElement('canvas');
    heatCanvas.width = sw;
    heatCanvas.height = sh;
    const hctx = heatCanvas.getContext('2d');
    const image = hctx.createImageData(sw, sh);

    let maxE = 1;
    let maxV = 1;
    const samples = [];
    for (let py = 0; py < sh; py += 1) {
      for (let px = 0; px < sw; px += 1) {
        const x = px * scale - w / 2;
        const y = py * scale - h / 2;
        const f = fieldAt(x, y, charges, p);
        samples.push(f);
        maxE = Math.max(maxE, Math.log1p(f.E));
        maxV = Math.max(maxV, Math.abs(f.V));
      }
    }

    samples.forEach((f, index) => {
      const pixel = index * 4;
      let color;
      if (p.viewMode === 0) color = colorForSigned(f.V, maxV);
      else if (p.viewMode === 1) color = magnitudeColor(Math.log1p(f.E), maxE);
      else {
        const radial = Math.hypot(
          (index % sw) * scale - w / 2,
          Math.floor(index / sw) * scale - h / 2,
        );
        const qEnc = enclosedChargeForRadius(radial, charges, p);
        color = colorForSigned(qEnc, Math.max(Math.abs(p.charge), 1));
      }
      const parts = color.match(/\d+/g).map(Number);
      image.data[pixel] = parts[0];
      image.data[pixel + 1] = parts[1];
      image.data[pixel + 2] = parts[2];
      image.data[pixel + 3] = 210;
    });

    hctx.putImageData(image, 0, 0);
  }

  function drawArrow(x, y, vx, vy, color, width = 1.4) {
    const length = Math.hypot(vx, vy);
    if (length < 0.001) return;
    const nx = vx / length;
    const ny = vy / length;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + vx, y + vy);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + vx, y + vy);
    ctx.lineTo(x + vx - 5 * nx + 3 * ny, y + vy - 5 * ny - 3 * nx);
    ctx.lineTo(x + vx - 5 * nx - 3 * ny, y + vy - 5 * ny + 3 * nx);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  }

  function drawEquipotentials(charges) {
    if (!p.showEquipotentials) return;
    const { w, h } = dims();
    const spacing = 18;
    ctx.save();
    ctx.globalAlpha = 0.34;
    ctx.lineWidth = 1;
    for (let y = -h / 2; y < h / 2; y += spacing) {
      ctx.beginPath();
      let started = false;
      for (let x = -w / 2; x < w / 2; x += spacing) {
        const f = fieldAt(x, y, charges, p);
        const level = Math.sin(f.V * 0.045);
        if (Math.abs(level) < 0.08) {
          if (!started) {
            ctx.moveTo(x, y);
            started = true;
          } else {
            ctx.lineTo(x, y);
          }
        } else if (started) {
          ctx.strokeStyle = f.V >= 0 ? '#fecaca' : '#bfdbfe';
          ctx.stroke();
          ctx.beginPath();
          started = false;
        }
      }
      if (started) {
        ctx.strokeStyle = '#dbeafe';
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  function drawVectors(charges) {
    if (!p.showVectors) return;
    const { w, h } = dims();
    const spacing = 52;
    for (let x = -w / 2 + 34; x < w / 2; x += spacing) {
      for (let y = -h / 2 + 34; y < h / 2; y += spacing) {
        const f = fieldAt(x, y, charges, p);
        if (f.E < 0.0001) continue;
        const arrow = clamp(Math.log1p(f.E) * 7, 3, 24);
        drawArrow(x, y, (f.Ex / f.E) * arrow, (f.Ey / f.E) * arrow, 'rgba(226, 232, 240, 0.62)');
      }
    }
  }

  function drawSources(charges) {
    const id = geometryId(p);
    ctx.save();
    if (id === 'line') {
      ctx.strokeStyle = p.charge >= 0 ? '#fb7185' : '#60a5fa';
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.moveTo(-p.size, 0);
      ctx.lineTo(p.size, 0);
      ctx.stroke();
    } else if (id === 'plates') {
      ctx.strokeStyle = '#fb7185';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(-p.separation / 2, -p.size);
      ctx.lineTo(-p.separation / 2, p.size);
      ctx.stroke();
      ctx.strokeStyle = '#60a5fa';
      ctx.beginPath();
      ctx.moveTo(p.separation / 2, -p.size);
      ctx.lineTo(p.separation / 2, p.size);
      ctx.stroke();
    } else if (id === 'ring' || id === 'hollowSphere') {
      ctx.strokeStyle = p.charge >= 0 ? '#fb7185' : '#60a5fa';
      ctx.lineWidth = id === 'hollowSphere' ? 5 : 3;
      ctx.beginPath();
      ctx.arc(0, 0, p.size, 0, Math.PI * 2);
      ctx.stroke();
    } else if (id === 'solidSphere' || id === 'disc') {
      const grad = ctx.createRadialGradient(-p.size * 0.25, -p.size * 0.25, 0, 0, 0, p.size);
      grad.addColorStop(
        0,
        p.charge >= 0 ? 'rgba(254, 202, 202, 0.55)' : 'rgba(191, 219, 254, 0.55)',
      );
      grad.addColorStop(1, p.charge >= 0 ? 'rgba(185, 28, 28, 0.28)' : 'rgba(30, 64, 175, 0.28)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = p.charge >= 0 ? '#fb7185' : '#60a5fa';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    for (const charge of charges) {
      if (Math.abs(charge.q) < 0.0001) continue;
      const r = geometryId(p) === 'point' || geometryId(p) === 'dipole' ? 15 : 3.4;
      ctx.beginPath();
      ctx.arc(charge.x, charge.y, r, 0, Math.PI * 2);
      ctx.fillStyle = charge.q >= 0 ? '#ef4444' : '#3b82f6';
      ctx.fill();
      if (r > 8) {
        ctx.fillStyle = '#fff';
        ctx.font = '700 18px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(charge.q >= 0 ? '+' : '-', charge.x, charge.y + 1);
      }
    }
    ctx.restore();
  }

  function drawGaussian(charges) {
    const r = p.gaussianRadius;
    const qEnc = enclosedChargeForRadius(r, charges, p);
    const flux = fluxEstimate(r, charges, p);
    ctx.save();
    ctx.setLineDash([9, 7]);
    ctx.strokeStyle = Math.abs(qEnc) > 0.001 ? '#fde047' : 'rgba(226, 232, 240, 0.42)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.font = '600 12px "JetBrains Mono", monospace';
    ctx.fillStyle = '#fde047';
    ctx.textAlign = 'left';
    ctx.fillText(`Gaussian surface: Qenc=${qEnc.toFixed(2)}  flux~${flux.toFixed(2)}`, -r, -r - 12);
    ctx.restore();
  }

  function drawProbe(charges) {
    const f = fieldAt(p.probeX, p.probeY, charges, p);
    ctx.save();
    const glow = ctx.createRadialGradient(p.probeX, p.probeY, 2, p.probeX, p.probeY, 32);
    glow.addColorStop(0, 'rgba(250, 204, 21, 0.42)');
    glow.addColorStop(1, 'rgba(250, 204, 21, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(p.probeX - 34, p.probeY - 34, 68, 68);
    ctx.beginPath();
    ctx.arc(p.probeX, p.probeY, 9, 0, Math.PI * 2);
    ctx.fillStyle = '#facc15';
    ctx.fill();
    ctx.strokeStyle = '#713f12';
    ctx.lineWidth = 2;
    ctx.stroke();
    if (f.E > 0.001) {
      const len = clamp(Math.log1p(f.E) * 16, 24, 110);
      drawArrow(p.probeX, p.probeY, (f.Ex / f.E) * len, (f.Ey / f.E) * len, '#facc15', 3);
    }
    ctx.font = '600 12px "JetBrains Mono", monospace';
    ctx.fillStyle = '#fef3c7';
    ctx.textAlign = 'left';
    ctx.fillText(`V=${f.V.toFixed(1)}`, p.probeX + 16, p.probeY - 7);
    ctx.fillText(`|E|=${f.E.toFixed(1)}`, p.probeX + 16, p.probeY + 10);
    ctx.restore();
  }

  function drawHud(charges) {
    const { w } = dims();
    const f = fieldAt(p.probeX, p.probeY, charges, p);
    const qEnc = enclosedChargeForRadius(p.gaussianRadius, charges, p);
    const flux = fluxEstimate(p.gaussianRadius, charges, p);
    const fluxRatio = Math.abs(qEnc) > 0.001 ? flux / qEnc : 0;
    const rows = [
      ['Geometry', GEOMETRIES[Math.round(p.geometry)]?.label || 'Unknown'],
      ['Probe |E|', f.E.toFixed(2)],
      ['Probe V', f.V.toFixed(2)],
      ['Q enclosed', qEnc.toFixed(2)],
      ['Flux / Qenc', Math.abs(qEnc) > 0.001 ? fluxRatio.toFixed(2) : 'n/a'],
    ];

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = 'rgba(5, 10, 22, 0.78)';
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.20)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(18, 18, 235, 142, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '700 13px "Inter", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Electrostatic Lab', 34, 38);
    ctx.font = '600 11px "JetBrains Mono", monospace';
    rows.forEach(([label, value], index) => {
      const y = 62 + index * 18;
      ctx.fillStyle = 'rgba(148, 163, 184, 0.9)';
      ctx.fillText(label, 34, y);
      ctx.fillStyle = '#f8fafc';
      ctx.textAlign = 'right';
      ctx.fillText(String(value), 238, y);
      ctx.textAlign = 'left';
    });
    ctx.fillStyle = 'rgba(226, 232, 240, 0.55)';
    ctx.textAlign = 'right';
    ctx.fillText('Drag probe to measure', w - 22, 34);
    ctx.fillText('Use Gauss radius to test Qenc', w - 22, 52);
    ctx.restore();
  }

  function render() {
    syncDipoleToSeparation();
    const charges = buildCharges(p, livePoints);
    const { w, h, cx, cy } = dims();
    const scale = p.viewScale ?? 1;
    const key = [
      w,
      h,
      p.geometry,
      p.charge,
      p.separation,
      p.size,
      p.viewMode,
      livePoints.point.x,
      livePoints.point.y,
      livePoints.positive.x,
      livePoints.positive.y,
      livePoints.negative.x,
      livePoints.negative.y,
    ].join(':');

    if (key !== heatKey) {
      makeHeatmap(charges);
      heatKey = key;
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, w, h);
    if (heatCanvas) {
      ctx.imageSmoothingEnabled = true;
      ctx.globalAlpha = 0.88;
      ctx.drawImage(heatCanvas, 0, 0, w, h);
      ctx.globalAlpha = 1;
    }

    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);

    ctx.strokeStyle = 'rgba(226, 232, 240, 0.06)';
    ctx.lineWidth = 1 / scale;
    for (let x = -WORLD_LIMIT; x <= WORLD_LIMIT; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, -WORLD_LIMIT);
      ctx.lineTo(x, WORLD_LIMIT);
      ctx.stroke();
    }
    for (let y = -WORLD_LIMIT; y <= WORLD_LIMIT; y += 40) {
      ctx.beginPath();
      ctx.moveTo(-WORLD_LIMIT, y);
      ctx.lineTo(WORLD_LIMIT, y);
      ctx.stroke();
    }

    drawEquipotentials(charges);
    drawVectors(charges);
    drawGaussian(charges);
    drawSources(charges);
    drawProbe(charges);
    ctx.restore();

    drawHud(charges);
  }

  function updateProbe(world, notify = true) {
    const nextX = clamp(world.x, -320, 320);
    const nextY = clamp(world.y, -240, 240);
    p = { ...p, probeX: nextX, probeY: nextY };
    if (notify) options.onParamChange?.({ probeX: nextX, probeY: nextY });
  }

  function pointerDown(event) {
    const world = toWorld(event);
    const id = geometryId(p);
    const charges = buildCharges(p, livePoints);
    if (Math.hypot(world.x - p.probeX, world.y - p.probeY) < 28) {
      dragging = 'probe';
      canvas.setPointerCapture?.(event.pointerId);
      return;
    }
    if (
      id === 'point' &&
      Math.hypot(world.x - livePoints.point.x, world.y - livePoints.point.y) < 28
    ) {
      dragging = 'point';
      canvas.setPointerCapture?.(event.pointerId);
      return;
    }
    if (id === 'dipole') {
      const nearPositive =
        Math.hypot(world.x - livePoints.positive.x, world.y - livePoints.positive.y) < 28;
      const nearNegative =
        Math.hypot(world.x - livePoints.negative.x, world.y - livePoints.negative.y) < 28;
      if (nearPositive || nearNegative) {
        dragging = nearPositive ? 'positive' : 'negative';
        canvas.setPointerCapture?.(event.pointerId);
        return;
      }
    }
    updateProbe(world);
    heatKey = '';
    render(charges);
  }

  function pointerMove(event) {
    const world = toWorld(event);
    if (!dragging) {
      const id = geometryId(p);
      const nearProbe = Math.hypot(world.x - p.probeX, world.y - p.probeY) < 28;
      const nearPoint =
        id === 'point' &&
        Math.hypot(world.x - livePoints.point.x, world.y - livePoints.point.y) < 28;
      const nearDipole =
        id === 'dipole' &&
        (Math.hypot(world.x - livePoints.positive.x, world.y - livePoints.positive.y) < 28 ||
          Math.hypot(world.x - livePoints.negative.x, world.y - livePoints.negative.y) < 28);
      canvas.style.cursor = nearProbe || nearPoint || nearDipole ? 'grab' : 'crosshair';
      return;
    }

    event.preventDefault();
    if (dragging === 'probe') updateProbe(world);
    else if (dragging === 'point') livePoints.point = { x: world.x, y: world.y };
    else if (dragging === 'positive') livePoints.positive = { x: world.x, y: world.y };
    else if (dragging === 'negative') livePoints.negative = { x: world.x, y: world.y };
    heatKey = '';
    render();
  }

  function pointerUp(event) {
    if (!dragging) return;
    dragging = null;
    canvas.releasePointerCapture?.(event.pointerId);
    canvas.style.cursor = 'crosshair';
  }

  canvas.style.cursor = 'crosshair';
  canvas.addEventListener('pointerdown', pointerDown);
  canvas.addEventListener('pointermove', pointerMove);
  canvas.addEventListener('pointerup', pointerUp);
  canvas.addEventListener('pointercancel', pointerUp);

  function loop() {
    if (!running) return;
    simTime += 1 / 30;
    render();
    rafId = requestAnimationFrame(loop);
  }

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
      p = { ...DEFAULTS };
      livePoints.point = { x: 0, y: 0 };
      livePoints.positive = { x: -DEFAULTS.separation / 2, y: 0 };
      livePoints.negative = { x: DEFAULTS.separation / 2, y: 0 };
      heatKey = '';
      render();
      this.start();
    },
    setParams(next) {
      p = { ...p, ...next };
      heatKey = '';
      render();
    },
    destroy() {
      this.stop();
      canvas.removeEventListener('pointerdown', pointerDown);
      canvas.removeEventListener('pointermove', pointerMove);
      canvas.removeEventListener('pointerup', pointerUp);
      canvas.removeEventListener('pointercancel', pointerUp);
      canvas.style.cursor = '';
    },
    getData() {
      const charges = buildCharges(p, livePoints);
      const f = fieldAt(p.probeX, p.probeY, charges, p);
      const qEnc = enclosedChargeForRadius(p.gaussianRadius, charges, p);
      const flux = fluxEstimate(p.gaussianRadius, charges, p);
      return {
        time: simTime,
        V: f.V,
        E: f.E,
        Ex: f.Ex,
        Ey: f.Ey,
        gaussianRadius: p.gaussianRadius,
        enclosedCharge: qEnc,
        fluxEstimate: flux,
        fluxRatio: Math.abs(qEnc) > 0.001 ? flux / qEnc : 0,
      };
    },
  };
}
