/**
 * Ray Optics Bench
 *
 * Geometric optics simulation for lenses, mirrors, and a parallel glass slab.
 * Uses paraxial ray tracing for calculations but renders rays hitting the curved surfaces.
 */
import { drawArrow } from '../../utils/canvas';

const ELEMENTS = [
  { id: 'convex-lens', name: 'Convex Lens', kind: 'lens', focalSign: 1, color: '#38bdf8' },
  { id: 'concave-lens', name: 'Concave Lens', kind: 'lens', focalSign: -1, color: '#a78bfa' },
  { id: 'concave-mirror', name: 'Concave Mirror', kind: 'mirror', focalSign: 1, color: '#f59e0b' },
  { id: 'convex-mirror', name: 'Convex Mirror', kind: 'mirror', focalSign: -1, color: '#fb7185' },
  { id: 'glass-slab', name: 'Glass Slab', kind: 'slab', focalSign: 0, color: '#22d3ee' },
];

const DEFAULTS = {
  elementIdx: 0,
  objectDistance: 220,
  objectHeight: 90,
  focalLength: 120,
  aperture: 170,
  rayCount: 9,
  refractiveIndex: 1.5,
  slabThickness: 92,
  incidenceAngle: 28,
  showNormals: 1,
  showConstruction: 1,
};

export const defaultParams = { ...DEFAULTS };

export const controls = [
  {
    key: 'elementIdx',
    label: 'Optical Element',
    type: 'tiles',
    tiles: ELEMENTS.map((element, index) => ({
      value: index,
      label: element.name,
      color: element.color,
    })),
  },
  { key: 'objectDistance', label: 'Object Distance [cm]', min: 20, max: 420, step: 2 },
  { key: 'objectHeight', label: 'Object Height [cm]', min: -155, max: 155, step: 5 },
  { key: 'focalLength', label: 'Focal Length |f| [cm]', min: 20, max: 300, step: 5 },
  { key: 'aperture', label: 'Aperture [cm]', min: 50, max: 300, step: 5 },
  { key: 'rayCount', label: 'Ray Count', min: 1, max: 31, step: 2 },
  { key: 'refractiveIndex', label: 'Slab Index n', min: 1.0, max: 2.5, step: 0.01 },
  { key: 'slabThickness', label: 'Slab Thickness [cm]', min: 10, max: 250, step: 5 },
  { key: 'incidenceAngle', label: 'Slab Incidence Angle [deg]', min: -85, max: 85, step: 1 },
  {
    key: 'showNormals',
    label: 'Normals',
    type: 'tiles',
    tiles: [{ value: 0, label: 'Off' }, { value: 1, label: 'On' }],
  },
  {
    key: 'showConstruction',
    label: 'Construction Rays',
    type: 'tiles',
    tiles: [{ value: 0, label: 'Off' }, { value: 1, label: 'On' }],
  },
];

export const equationSections = [
  {
    title: 'Thin Lens and Mirror Equation',
    equations: [
      {
        latex: String.raw`\frac{1}{f} = \frac{1}{d_o} + \frac{1}{d_i}`,
        description: 'Relates focal length, object distance, and image distance.',
      },
      {
        latex: String.raw`m = -\frac{d_i}{d_o} = \frac{h_i}{h_o}`,
        description: 'Lateral magnification determines image size and orientation.',
      },
    ],
    variables: [
      { symbol: 'f', description: 'Focal length (positive for converging, negative for diverging)' },
      { symbol: 'd_o', description: 'Object distance (always positive for real objects)' },
      { symbol: 'd_i', description: 'Image distance (positive for real, negative for virtual)' },
      { symbol: 'm', description: 'Magnification (negative means inverted)' },
    ],
  },
  {
    title: "Snell's Law & Slab Shift",
    equations: [
      {
        latex: String.raw`n_1 \sin\theta_1 = n_2 \sin\theta_2`,
        description: 'Refraction at each interface.',
      },
      {
        latex: String.raw`s = t \frac{\sin(\theta_1-\theta_2)}{\cos\theta_2}`,
        description: 'Lateral displacement through a parallel slab of thickness t.',
      },
    ],
  },
];

export const graphParams = [
  { key: 'imageDistance', label: 'Image Distance [cm]' },
  { key: 'magnification', label: 'Magnification' },
  { key: 'lateralShift', label: 'Slab Shift [cm]' },
];

export const method = 'paraxial ray tracing';

export const scenarios = [
  {
    name: 'Camera Lens',
    description: 'A distant object forms a small real image near the focal plane.',
    params: { elementIdx: 0, objectDistance: 390, focalLength: 85, objectHeight: 120, aperture: 145, rayCount: 9 },
  },
  {
    name: 'Magnifying Glass',
    description: 'Place the object inside the focal length to create a large upright virtual image.',
    params: { elementIdx: 0, objectDistance: 85, focalLength: 130, objectHeight: 70, aperture: 160, rayCount: 11 },
  },
  {
    name: 'Diverging Lens',
    description: 'Concave lenses always form upright virtual images for real objects.',
    params: { elementIdx: 1, objectDistance: 220, focalLength: 115, objectHeight: 90, aperture: 170, rayCount: 9 },
  },
  {
    name: 'Shaving Mirror',
    description: 'A concave mirror used inside its focal length gives an enlarged upright virtual image.',
    params: { elementIdx: 2, objectDistance: 80, focalLength: 135, objectHeight: 75, aperture: 165, rayCount: 9 },
  },
  {
    name: 'Security Mirror',
    description: 'Convex mirrors provide a wide field of view with small upright virtual images.',
    params: { elementIdx: 3, objectDistance: 150, focalLength: 100, objectHeight: 120, aperture: 200, rayCount: 13 },
  },
];

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function signedFocalLength(p) {
  const element = ELEMENTS[Math.round(p.elementIdx)] || ELEMENTS[0];
  return element.focalSign * Math.max(1, Math.abs(p.focalLength));
}

function lensImage(p) {
  const element = ELEMENTS[Math.round(p.elementIdx)] || ELEMENTS[0];
  if (element.kind === 'slab') {
    const theta1 = (p.incidenceAngle * Math.PI) / 180;
    const sinTheta2 = Math.sin(theta1) / Math.max(1.0, p.refractiveIndex);
    const theta2 = Math.asin(clamp(sinTheta2, -0.999, 0.999));
    const shift = p.slabThickness * Math.sin(theta1 - theta2) / Math.max(0.1, Math.cos(theta2));
    return {
      imageDistance: 0,
      magnification: 1,
      imageHeight: p.objectHeight,
      lateralShift: shift,
      theta1,
      theta2,
    };
  }

  const f = signedFocalLength(p);
  const doSafe = Math.max(1, p.objectDistance);
  const denom = (1 / f) - (1 / doSafe);
  
  const di = Math.abs(denom) < 1e-7 ? Infinity : 1 / denom;
  const m = Number.isFinite(di) ? -di / doSafe : (denom > 0 ? Infinity : -Infinity);
  const hi = p.objectHeight * m;

  return {
    imageDistance: di,
    magnification: m,
    imageHeight: hi,
    lateralShift: 0,
    theta1: 0,
    theta2: 0,
  };
}

export function create(canvas, initParams = {}, { onParamChange } = {}) {
  const ctx = canvas.getContext('2d');
  let p = { ...DEFAULTS, ...initParams };
  let running = false;
  let rafId = 0;
  let lastTs = 0;
  let hover = null;
  let dragging = null;

  const getMouse = (event) => {
    const rect = canvas.getBoundingClientRect();
    const sx = canvas.width / rect.width;
    const sy = canvas.height / rect.height;
    return {
      x: (event.clientX - rect.left) * sx,
      y: (event.clientY - rect.top) * sy,
    };
  };

  const onDown = (event) => {
    const m = getMouse(event);
    const L = layout();
    const element = ELEMENTS[Math.round(p.elementIdx)] || ELEMENTS[0];

    if (element.kind === 'slab') {
      const width = p.slabThickness * L.pixelsPerCm;
      const left = L.elementX - width / 2;
      const centerY = L.axisY - 50;
      if (Math.abs(m.x - left) < 30 && Math.abs(m.y - centerY) < 100) {
        dragging = { type: 'slab-incidence' };
        return;
      }
    } else {
      const ox = xWorldToScreen(-p.objectDistance, L);
      const oy = yWorldToScreen(p.objectHeight, L);
      if (Math.abs(m.x - ox) < 25 && Math.abs(m.y - oy) < 40) {
        dragging = { type: 'object' };
        return;
      }

      const fAbs = Math.abs(p.focalLength);
      const fx1 = xWorldToScreen(-fAbs, L);
      const fx2 = xWorldToScreen(fAbs, L);
      if (Math.abs(m.x - fx1) < 20 && Math.abs(m.y - L.axisY) < 30) {
        dragging = { type: 'focal' };
        return;
      }
      if (Math.abs(m.x - fx2) < 20 && Math.abs(m.y - L.axisY) < 30) {
        dragging = { type: 'focal' };
        return;
      }
    }
  };

  const onMove = (event) => {
    hover = getMouse(event);
    if (dragging) {
      const L = layout();
      if (dragging.type === 'object') {
        const nextDist = clamp((L.elementX - hover.x) / L.pixelsPerCm, 20, 420);
        const nextHeight = clamp((L.axisY - hover.y) / L.pixelsPerCm, -155, 155);
        p.objectDistance = nextDist;
        p.objectHeight = nextHeight;
        if (onParamChange) onParamChange({ objectDistance: p.objectDistance, objectHeight: p.objectHeight });
      } else if (dragging.type === 'focal') {
        const nextF = clamp(Math.abs(hover.x - L.elementX) / L.pixelsPerCm, 20, 300);
        p.focalLength = nextF;
        if (onParamChange) onParamChange({ focalLength: p.focalLength });
      } else if (dragging.type === 'slab-incidence') {
        const width = p.slabThickness * L.pixelsPerCm;
        const left = L.elementX - width / 2;
        const centerY = L.axisY - 50;
        const dy = hover.y - centerY;
        const dx = left - 30; // 30 is startX
        const nextAngle = (Math.atan2(dy, dx) * 180) / Math.PI;
        p.incidenceAngle = clamp(nextAngle, -80, 80);
        if (onParamChange) onParamChange({ incidenceAngle: p.incidenceAngle });
      }
    }
    if (!running) render();
  };

  const onUp = () => {
    dragging = null;
  };

  canvas.addEventListener('mousedown', onDown);
  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onUp);

  function layout() {
    const w = canvas.width || 1;
    const h = canvas.height || 1;
    const scale = Math.min(w / 900, h / 520);
    const axisY = h * 0.54;
    const elementX = w * 0.48;
    const pixelsPerCm = scale * 0.95;
    return { w, h, axisY, elementX, pixelsPerCm };
  }

  function xWorldToScreen(xWorld, L) {
    return L.elementX + xWorld * L.pixelsPerCm;
  }

  function yWorldToScreen(yWorld, L) {
    return L.axisY - yWorld * L.pixelsPerCm;
  }

  function drawGrid(L) {
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, L.w, L.h);

    // Minor grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    const spacing = 10 * L.pixelsPerCm; // 10cm grid
    for (let x = (L.elementX % spacing); x < L.w; x += spacing) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, L.h); ctx.stroke();
    }
    for (let y = (L.axisY % spacing); y < L.h; y += spacing) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(L.w, y); ctx.stroke();
    }

    // Optical Axis
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, L.axisY);
    ctx.lineTo(L.w, L.axisY);
    ctx.stroke();

    // Ticks on Optical Axis
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (let xCm = -500; xCm <= 500; xCm += 50) {
      if (xCm === 0) continue;
      const xPx = xWorldToScreen(xCm, L);
      if (xPx > 0 && xPx < L.w) {
        ctx.beginPath();
        ctx.moveTo(xPx, L.axisY - 4);
        ctx.lineTo(xPx, L.axisY + 4);
        ctx.stroke();
        ctx.fillText(`${xCm}`, xPx, L.axisY + 8);
      }
    }
  }

  function getElementSurfaces(L, element) {
    const aperturePx = p.aperture * L.pixelsPerCm;
    if (element.kind === 'lens') {
      const bulge = element.focalSign > 0 ? 25 : -25;
      return {
        front: (y) => {
          const t = (y - L.axisY) / (aperturePx / 2);
          if (Math.abs(t) > 1) return null;
          return L.elementX - bulge * (1 - t * t);
        },
        back: (y) => {
          const t = (y - L.axisY) / (aperturePx / 2);
          if (Math.abs(t) > 1) return null;
          return L.elementX + bulge * (1 - t * t);
        }
      };
    } else if (element.kind === 'mirror') {
      const curve = element.focalSign > 0 ? 35 : -35;
      return {
        front: (y) => {
          const t = (y - L.axisY) / (aperturePx / 2);
          if (Math.abs(t) > 1) return null;
          return L.elementX + curve * (1 - t * t);
        },
        back: null
      };
    }
    return null;
  }

  function drawElement(L, element) {
    const x = L.elementX;
    const aperturePx = p.aperture * L.pixelsPerCm;
    const top = L.axisY - aperturePx / 2;

    if (element.kind === 'slab') {
      const width = p.slabThickness * L.pixelsPerCm;
      const grad = ctx.createLinearGradient(x - width / 2, 0, x + width / 2, 0);
      grad.addColorStop(0, 'rgba(34,211,238,0.15)');
      grad.addColorStop(0.5, 'rgba(186,230,253,0.3)');
      grad.addColorStop(1, 'rgba(34,211,238,0.15)');
      ctx.fillStyle = grad;
      ctx.fillRect(x - width / 2, top, width, aperturePx);
      ctx.strokeStyle = 'rgba(125,211,252,0.8)';
      ctx.lineWidth = 2;
      ctx.strokeRect(x - width / 2, top, width, aperturePx);
      ctx.font = '700 12px "JetBrains Mono", monospace';
      ctx.fillStyle = '#bae6fd';
      ctx.textAlign = 'center';
      ctx.fillText(`n = ${p.refractiveIndex.toFixed(2)}`, x, top - 15);
      return;
    }

    ctx.save();
    ctx.strokeStyle = element.color;
    ctx.fillStyle = `${element.color}22`;
    ctx.lineWidth = 3;
    ctx.shadowBlur = 15;
    ctx.shadowColor = element.color;

    if (element.kind === 'lens') {
      const bulge = element.focalSign > 0 ? 25 : -25;
      ctx.beginPath();
      ctx.moveTo(x, L.axisY - aperturePx / 2);
      ctx.bezierCurveTo(x + bulge, L.axisY - aperturePx / 3, x + bulge, L.axisY + aperturePx / 3, x, L.axisY + aperturePx / 2);
      ctx.bezierCurveTo(x - bulge, L.axisY + aperturePx / 3, x - bulge, L.axisY - aperturePx / 3, x, L.axisY - aperturePx / 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else {
      const curve = element.focalSign > 0 ? 35 : -35;
      ctx.beginPath();
      ctx.moveTo(x, L.axisY - aperturePx / 2);
      ctx.quadraticCurveTo(x + curve, L.axisY, x, L.axisY + aperturePx / 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 1;
      const hashDir = element.focalSign > 0 ? 1 : -1;
      for (let y = -aperturePx / 2; y <= aperturePx / 2; y += 20) {
        ctx.beginPath(); 
        ctx.moveTo(x + (curve * (1 - (y/(aperturePx/2))**2)) * 0.5, L.axisY + y); 
        ctx.lineTo(x + (curve * (1 - (y/(aperturePx/2))**2)) * 0.5 + 12, L.axisY + y + 8); 
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  function drawRay(x1, y1, x2, y2, color, alpha = 0.8, dashed = false) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.6;
    if (dashed) {
      ctx.setLineDash([6, 5]);
    } else {
      ctx.shadowBlur = 4;
      ctx.shadowColor = color;
    }
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.restore();
  }

  function rayAt(p1, p2, targetX) {
    const dx = p2.x - p1.x;
    if (Math.abs(dx) < 1e-6) return p2.y;
    return p1.y + (p2.y - p1.y) * (targetX - p1.x) / dx;
  }

  function rayEndpoint(p1, p2, targetX) {
    return { x: targetX, y: rayAt(p1, p2, targetX) };
  }

  function drawLensOrMirrorRays(L, element, optics) {
    const objectX = xWorldToScreen(-p.objectDistance, L);
    const objectTipY = yWorldToScreen(p.objectHeight, L);
    const di = optics.imageDistance;
    const isLens = element.kind === 'lens';
    const imageWorldX = isLens ? di : -di;
    const imageX = Number.isFinite(di) ? xWorldToScreen(imageWorldX, L) : null;
    const imageY = Number.isFinite(di) ? yWorldToScreen(optics.imageHeight, L) : null;
    const virtual = di < 0;
    const surfaces = getElementSurfaces(L, element);
    
    const count = Math.max(1, Math.round(p.rayCount));
    const apertureHalf = p.aperture / 2;
    const rayColor = '#facc15';

    for (let i = 0; i < count; i++) {
      const t = count === 1 ? 0.5 : i / (count - 1);
      const targetYWorld = -apertureHalf * 0.85 + t * apertureHalf * 1.7;
      const targetY = yWorldToScreen(targetYWorld, L);
      
      const hitX = surfaces.front(targetY);
      if (hitX === null) continue;
      const hit = { x: hitX, y: targetY };

      // Incident
      drawRay(objectX, objectTipY, hit.x, hit.y, rayColor, 0.4);

      if (!Number.isFinite(di)) {
        const outX = isLens ? L.w - 10 : 10;
        drawRay(hit.x, hit.y, outX, hit.y, rayColor, 0.7);
        continue;
      }

      const img = { x: imageX, y: imageY };

      if (isLens) {
        const backX = surfaces.back(hit.y);
        drawRay(hit.x, hit.y, backX, hit.y, rayColor, 0.8);
        const exit = { x: backX, y: hit.y };
        if (!virtual) {
          drawRay(exit.x, exit.y, img.x, img.y, rayColor, 0.8);
          const end = rayEndpoint(exit, img, L.w - 10);
          drawRay(img.x, img.y, end.x, end.y, rayColor, 0.25);
        } else {
          const end = rayEndpoint(img, exit, L.w - 10);
          drawRay(exit.x, exit.y, end.x, end.y, rayColor, 0.8);
          drawRay(exit.x, exit.y, img.x, img.y, rayColor, 0.4, true);
        }
      } else { // Mirror
        if (!virtual) {
          drawRay(hit.x, hit.y, img.x, img.y, rayColor, 0.8);
          const end = rayEndpoint(hit, img, 10);
          drawRay(img.x, img.y, end.x, end.y, rayColor, 0.25);
        } else {
          const end = rayEndpoint(img, hit, 10);
          drawRay(hit.x, hit.y, end.x, end.y, rayColor, 0.8);
          drawRay(hit.x, hit.y, img.x, img.y, rayColor, 0.4, true);
        }
      }
    }

    if (p.showConstruction && Number.isFinite(di)) {
      const c1 = '#22d3ee'; // cyan
      const c2 = '#f472b6'; // pink
      const img = { x: imageX, y: imageY };

      if (isLens) {
        // Parallel ray
        const h1 = surfaces.front(objectTipY);
        const e1 = surfaces.back(objectTipY);
        drawRay(objectX, objectTipY, h1, objectTipY, c1, 0.8);
        drawRay(h1, objectTipY, e1, objectTipY, c1, 0.8);
        
        if (!virtual) {
          drawRay(e1, objectTipY, img.x, img.y, c1, 0.8);
          const end = rayEndpoint({x: e1, y: objectTipY}, img, L.w - 10);
          drawRay(img.x, img.y, end.x, end.y, c1, 0.4);
        } else {
          const end = rayEndpoint(img, {x: e1, y: objectTipY}, L.w - 10);
          drawRay(e1, objectTipY, end.x, end.y, c1, 0.8);
          drawRay(e1, objectTipY, img.x, img.y, c1, 0.4, true);
        }

        // Center ray
        drawRay(objectX, objectTipY, L.elementX, L.axisY, c2, 0.8);
        if (!virtual) {
          drawRay(L.elementX, L.axisY, img.x, img.y, c2, 0.8);
          const end = rayEndpoint({x: L.elementX, y: L.axisY}, img, L.w - 10);
          drawRay(img.x, img.y, end.x, end.y, c2, 0.4);
        } else {
          const end = rayEndpoint(img, {x: L.elementX, y: L.axisY}, L.w - 10);
          drawRay(L.elementX, L.axisY, end.x, end.y, c2, 0.8);
          drawRay(L.elementX, L.axisY, img.x, img.y, c2, 0.4, true);
        }
      } else {
        // Parallel ray
        const h1 = surfaces.front(objectTipY);
        drawRay(objectX, objectTipY, h1, objectTipY, c1, 0.8);
        
        if (!virtual) {
          drawRay(h1, objectTipY, img.x, img.y, c1, 0.8);
          const end = rayEndpoint({x: h1, y: objectTipY}, img, 10);
          drawRay(img.x, img.y, end.x, end.y, c1, 0.4);
        } else {
          const end = rayEndpoint(img, {x: h1, y: objectTipY}, 10);
          drawRay(h1, objectTipY, end.x, end.y, c1, 0.8);
          drawRay(h1, objectTipY, img.x, img.y, c1, 0.4, true);
        }

        // Vertex ray
        drawRay(objectX, objectTipY, L.elementX, L.axisY, c2, 0.8);
        if (!virtual) {
          drawRay(L.elementX, L.axisY, img.x, img.y, c2, 0.8);
          const end = rayEndpoint({x: L.elementX, y: L.axisY}, img, 10);
          drawRay(img.x, img.y, end.x, end.y, c2, 0.4);
        } else {
          const end = rayEndpoint(img, {x: L.elementX, y: L.axisY}, 10);
          drawRay(L.elementX, L.axisY, end.x, end.y, c2, 0.8);
          drawRay(L.elementX, L.axisY, img.x, img.y, c2, 0.4, true);
        }
      }
    }

    if (Number.isFinite(di)) {
      ctx.globalAlpha = di < 0 ? 0.5 : 1;
      drawArrow(ctx, imageX, L.axisY, imageX, imageY, {
        color: di > 0 ? '#4ade80' : '#fb7185',
        label: di > 0 ? 'real image' : 'virtual image'
      });
      ctx.globalAlpha = 1;
    }
  }

  function drawSlabRays(L, optics) {
    const width = p.slabThickness * L.pixelsPerCm;
    const left = L.elementX - width / 2;
    const right = L.elementX + width / 2;
    const centerY = L.axisY - 50;
    const count = Math.max(1, Math.round(p.rayCount));
    const spacing = 18;
    const t1 = optics.theta1, t2 = optics.theta2;
    const rayColor = '#facc15';

    for (let i = 0; i < count; i++) {
      const offset = (i - (count - 1) / 2) * spacing;
      const y1 = centerY + offset;
      const startX = 30;
      const startY = y1 - Math.tan(t1) * (left - startX);
      const y2 = y1 + Math.tan(t2) * width;
      const endX = L.w - 30;
      const endY = y2 + Math.tan(t1) * (endX - right);

      drawRay(startX, startY, left, y1, rayColor, 0.65);
      drawRay(left, y1, right, y2, rayColor, 0.9);
      drawRay(right, y2, endX, endY, rayColor, 0.65);

      if (p.showNormals && i === Math.floor(count / 2)) {
        ctx.strokeStyle = 'rgba(255,255,255,0.4)';
        ctx.setLineDash([5, 5]);
        [left, right].forEach(x => {
          ctx.beginPath(); ctx.moveTo(x, y1 - 80); ctx.lineTo(x, y1 + 80); ctx.stroke();
        });
        ctx.setLineDash([]);
      }
    }
  }

  function render() {
    const L = layout();
    drawGrid(L);
    
    const element = ELEMENTS[Math.round(p.elementIdx)] || ELEMENTS[0];
    const optics = lensImage(p);

    if (element.kind !== 'slab') {
      const fAbs = Math.abs(p.focalLength);
      [xWorldToScreen(-fAbs, L), xWorldToScreen(fAbs, L)].forEach((x, i) => {
        ctx.strokeStyle = i === 0 ? '#fb7185' : '#4ade80';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(x, L.axisY - 12); ctx.lineTo(x, L.axisY + 12); ctx.stroke();
        ctx.font = 'bold 11px monospace'; ctx.fillStyle = '#94a3b8'; ctx.textAlign = 'center';
        ctx.fillText(i === 0 ? 'F' : "F'", x, L.axisY + 28);
      });
      
      const ox = xWorldToScreen(-p.objectDistance, L);
      const oy = yWorldToScreen(p.objectHeight, L);
      drawArrow(ctx, ox, L.axisY, ox, oy, { color: '#e2e8f0', label: 'object' });
      drawLensOrMirrorRays(L, element, optics);
    } else {
      drawSlabRays(L, optics);
    }

    drawElement(L, element);

    // HUD
    const hudX = 25, hudY = 30;
    
    // Glassmorphic HUD background
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(hudX - 10, hudY - 20, 220, element.kind === 'slab' ? 70 : 90, 8);
    ctx.fill();
    ctx.stroke();
    
    ctx.font = '700 16px "Inter", sans-serif'; 
    ctx.fillStyle = element.color; 
    ctx.textAlign = 'left';
    ctx.fillText(element.name.toUpperCase(), hudX, hudY);
    
    const hud = element.kind === 'slab' 
      ? [`θ₁: ${p.incidenceAngle.toFixed(1)}°`, `Shift: ${optics.lateralShift.toFixed(2)} cm`]
      : [`dₒ: ${p.objectDistance.toFixed(1)} cm`, `dᵢ: ${Number.isFinite(optics.imageDistance) ? optics.imageDistance.toFixed(1) : '∞'} cm`, `m: ${Number.isFinite(optics.magnification) ? optics.magnification.toFixed(2) : '∞'}`];
    
    ctx.font = '500 13px "JetBrains Mono", monospace'; 
    ctx.fillStyle = '#f8fafc';
    hud.forEach((text, i) => {
      ctx.fillText(text, hudX, hudY + 24 + i * 20);
    });
    ctx.restore();

    if (hover && !dragging) {
      ctx.beginPath(); ctx.arc(hover.x, hover.y, 5, 0, Math.PI * 2); 
      ctx.strokeStyle = 'rgba(250, 204, 21, 0.8)'; 
      ctx.fillStyle = 'rgba(250, 204, 21, 0.2)';
      ctx.lineWidth = 2;
      ctx.fill();
      ctx.stroke();
    }
  }

  render();

  return {
    start() { running = true; },
    stop() { running = false; },
    reset() { render(); },
    setParams(next) { p = { ...p, ...next }; render(); },
    destroy() {
      canvas.removeEventListener('mousedown', onDown);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    },
    getData() {
      const optics = lensImage(p);
      return {
        time: Date.now() / 1000,
        imageDistance: Number.isFinite(optics.imageDistance) ? optics.imageDistance : 999,
        magnification: Number.isFinite(optics.magnification) ? optics.magnification : 0,
        lateralShift: optics.lateralShift,
      };
    }
  };
}
