/**
 * Buoyancy Lab Simulation
 * High-fidelity Archimedes' Principle Laboratory
 */

const FLUIDS = [
  {
    id: 'water',
    name: 'Water',
    density: 1.0,
    color: '#1a5fb4',
    colorTop: '#2b8fea',
    alpha: 0.78,
    viscFactor: 1.0,
  },
  {
    id: 'saltwater',
    name: 'Salt Water',
    density: 1.025,
    color: '#14518a',
    colorTop: '#1e72b8',
    alpha: 0.82,
    viscFactor: 1.1,
  },
  {
    id: 'ethanol',
    name: 'Ethanol (96%)',
    density: 0.789,
    color: '#2255a0',
    colorTop: '#3a7ace',
    alpha: 0.6,
    viscFactor: 0.7,
  },
  {
    id: 'oil',
    name: 'Vegetable Oil',
    density: 0.92,
    color: '#6b7c15',
    colorTop: '#99b422',
    alpha: 0.72,
    viscFactor: 6.0,
  },
  {
    id: 'glycerin',
    name: 'Glycerol',
    density: 1.261,
    color: '#5a2b90',
    colorTop: '#8040c0',
    alpha: 0.8,
    viscFactor: 100.0,
  },
  {
    id: 'mercury',
    name: 'Mercury (Hg)',
    density: 13.6,
    color: '#888890',
    colorTop: '#c0c0c8',
    alpha: 0.92,
    viscFactor: 1.8,
  },
  {
    id: 'honey',
    name: 'Honey',
    density: 1.42,
    color: '#a07200',
    colorTop: '#e0a800',
    alpha: 0.88,
    viscFactor: 400.0,
  },
];

const MATERIALS = [
  { id: 'foam', name: 'Foam', density: 0.05, color: '#f5f0e0', stroke: '#c8c0a0', w: 64, h: 44 },
  { id: 'wood', name: 'Wood', density: 0.6, color: '#c07840', stroke: '#9a5820', w: 56, h: 36 },
  { id: 'ice', name: 'Ice', density: 0.917, color: '#d0ecf8', stroke: '#80b8d8', w: 54, h: 38 },
  { id: 'plastic', name: 'HDPE', density: 0.95, color: '#28c8b8', stroke: '#188878', w: 52, h: 32 },
  { id: 'rubber', name: 'Rubber', density: 1.2, color: '#d82020', stroke: '#980808', w: 48, h: 34 },
  { id: 'glass', name: 'Glass', density: 2.5, color: '#b8d8f0', stroke: '#70a8c8', w: 44, h: 28 },
  { id: 'alum', name: 'Aluminum', density: 2.7, color: '#b8c0c8', stroke: '#889098', w: 42, h: 26 },
  { id: 'steel', name: 'Steel', density: 7.8, color: '#5878a0', stroke: '#384858', w: 38, h: 24 },
  { id: 'lead', name: 'Lead', density: 11.3, color: '#383848', stroke: '#181828', w: 34, h: 22 },
];

const PX_M = 0.003;
const DEPTH_M = 0.08;
const G = 9.81;
const G_SIM = 900;
const DENSITY_UNIT_SCALE = 1000; // g/cm^3 -> kg/m^3

function bVol(mat) {
  return mat.w * PX_M * mat.h * PX_M * DEPTH_M;
}
function bWeight(mat) {
  return mat.density * DENSITY_UNIT_SCALE * bVol(mat) * G;
}
function bBuoy(mat, fl, subFrac) {
  return fl.density * DENSITY_UNIT_SCALE * bVol(mat) * subFrac * G;
}
function bApparent(mat, fl, subFrac) {
  return Math.max(0, bWeight(mat) - bBuoy(mat, fl, subFrac));
}

function hexAlpha(hex, a) {
  const r = parseInt(hex.slice(1, 3), 16),
    g = parseInt(hex.slice(3, 5), 16),
    b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
}
function lighten(hex, f) {
  return `rgb(${Math.min(255, parseInt(hex.slice(1, 3), 16) + Math.round(f * 255))},${Math.min(255, parseInt(hex.slice(5, 7), 16) + Math.round(f * 255))},${Math.min(255, parseInt(hex.slice(5, 7), 16) + Math.round(f * 255))})`;
}
function blend(h1, h2, t) {
  const r = Math.round(parseInt(h1.slice(1, 3), 16) * (1 - t) + parseInt(h2.slice(1, 3), 16) * t);
  const g = Math.round(parseInt(h1.slice(3, 5), 16) * (1 - t) + parseInt(h2.slice(3, 5), 16) * t);
  const b = Math.round(parseInt(h1.slice(5, 7), 16) * (1 - t) + parseInt(h2.slice(5, 7), 16) * t);
  return `rgb(${r},${g},${b})`;
}
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

export const defaultParams = {
  fluidIdx: 0,
  matIdx: 1,
};

export const controls = [
  {
    key: 'fluidIdx',
    label: 'Tank Fluid',
    type: 'tiles',
    tiles: FLUIDS.map((f, i) => ({
      value: i,
      label: f.name,
      sub: `ρ ${f.density}`,
      color: f.color,
    })),
  },
  {
    key: 'matIdx',
    label: 'Drop Material (click canvas to spawn)',
    type: 'tiles',
    tiles: MATERIALS.map((m, i) => ({
      value: i,
      label: m.name,
      sub: `ρ ${m.density}`,
      color: m.color,
    })),
  },
];

export const equationSections = [
  {
    title: 'Introduction',
    content:
      'Buoyancy is the upward force that fluids exert on objects submerged in them. This principle explains why objects float or sink, and why submarines can control their depth. The buoyant force depends on the fluid density and the volume of fluid displaced.',
  },
  {
    title: "Archimedes' Principle",
    equations: [
      {
        latex: String.raw`F_b = \rho_{f} \cdot g \cdot V_{sub}`,
        description:
          'The buoyant force equals the weight of the fluid displaced by the object. ρ_f is fluid density, g is gravity, V_sub is submerged volume.',
      },
    ],
    variables: [
      { symbol: 'F_b', description: 'Buoyant force (upward)' },
      { symbol: 'ρ_f', description: 'Density of the fluid' },
      { symbol: 'V_sub', description: 'Volume of fluid displaced' },
    ],
  },
  {
    title: 'Floating & Sinking',
    content:
      'An object floats if its density is less than the fluid density. In this state, it displaces exactly its own weight in fluid. If it is denser, it sinks to the bottom, though it still feels an upward buoyant force that reduces its "apparent weight".',
    equations: [
      {
        latex: String.raw`W_{apparent} = W_{actual} - F_b`,
        description: 'The weight measured when the object is submerged.',
      },
    ],
  },
];

export const graphParams = [
  { key: 'weight', label: 'Weight (N)', color: '#FF6B6B' },
  { key: 'buoyancy', label: 'Buoyancy (N)', color: '#60a5fa' },
  { key: 'appWeight', label: 'Apparent Weight (N)', color: '#FFD166' },
];

export function create(canvas, initParams = {}) {
  const ctx = canvas.getContext('2d');
  let p = { ...defaultParams, ...initParams };

  const TK_W = 390,
    TK_H = 380,
    TK_Y = 50;
  const FLUID_FILL = 0.75;
  const SCALE_BOX_W = 140;
  const LAYOUT_GAP = 60;
  const MAX_SCALE_FORCE = 120; // Newtons for full spring extension

  let blocks = [];
  let bubbles = [];
  let time = 0;
  let dragging = null;
  let selectedId = null;

  function getLayout() {
    const W = canvas.width;
    const viewScale = p.viewScale ?? 1.0;
    const currentTK_W = TK_W * viewScale;
    const contentW = currentTK_W + LAYOUT_GAP * viewScale + SCALE_BOX_W * viewScale;
    const startX = (W - contentW) / 2;
    return {
      tkX: startX,
      scX: startX + currentTK_W + LAYOUT_GAP * viewScale + (SCALE_BOX_W * viewScale) / 2,
      viewScale,
    };
  }

  canvas.addEventListener('pointerdown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const sx = (e.clientX - rect.left) * scaleX;
    const sy = (e.clientY - rect.top) * scaleY;

    const { tkX } = getLayout();

    let hit = null;
    for (let i = blocks.length - 1; i >= 0; i--) {
      const b = blocks[i];
      const hw = b.mat.w / 2,
        hh = b.mat.h / 2;
      if (sx >= b.x - hw && sx <= b.x + hw && sy >= b.y - hh && sy <= b.y + hh) {
        hit = b;
        break;
      }
    }

    if (hit) {
      dragging = { block: hit, offX: sx - hit.x, offY: sy - hit.y };
      hit.dragging = true;
      selectedId = hit.id;
    } else {
      const mat = MATERIALS[p.matIdx];
      if (blocks.length < 10) {
        const newBlock = {
          id: Date.now() + Math.random(),
          mat,
          x: Math.max(tkX + mat.w / 2 + 5, Math.min(sx, tkX + TK_W - mat.w / 2 - 5)),
          y: Math.max(TK_Y + mat.h / 2 + 5, sy),
          vy: 0,
        };
        blocks.push(newBlock);
        selectedId = newBlock.id;
      }
    }
  });

  canvas.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const sx = (e.clientX - rect.left) * scaleX;
    const sy = (e.clientY - rect.top) * scaleY;

    const { tkX } = getLayout();

    dragging.block.x = sx - dragging.offX;
    dragging.block.y = sy - dragging.offY;
    dragging.block.vy = 0;

    const hw = dragging.block.mat.w / 2,
      hh = dragging.block.mat.h / 2;
    dragging.block.x = Math.max(tkX + hw + 2, Math.min(tkX + TK_W - hw - 2, dragging.block.x));
    dragging.block.y = Math.max(TK_Y + hh + 2, Math.min(TK_Y + TK_H - hh - 2, dragging.block.y));
  });

  const stopDrag = () => {
    if (dragging) {
      dragging.block.dragging = false;
      dragging = null;
    }
  };
  canvas.addEventListener('pointerup', stopDrag);
  canvas.addEventListener('pointerleave', stopDrag);

  function dynamicFluidTopPx() {
    const baseH = TK_H * FLUID_FILL;
    const tankInnerW = TK_W - 4;
    let hLevel = baseH;

    for (let i = 0; i < 3; i++) {
      let totalDisplacedVol = 0;
      const currentFTop = TK_Y + TK_H - hLevel;
      for (const b of blocks) {
        const hh = b.mat.h / 2;
        const subPx = Math.max(0, Math.min(b.mat.h, b.y + hh - currentFTop));
        totalDisplacedVol += b.mat.w * subPx;
      }
      hLevel = baseH + totalDisplacedVol / tankInnerW;
    }
    return Math.max(TK_Y + 12, TK_Y + TK_H - hLevel);
  }

  function computeSubFrac(block, fTop) {
    const ft = fTop !== undefined ? fTop : dynamicFluidTopPx();
    const bBottom = block.y + block.mat.h / 2;
    return Math.max(0, Math.min(1, (bBottom - ft) / block.mat.h));
  }

  function tick(dt) {
    const fl = FLUIDS[p.fluidIdx];
    const fTop = dynamicFluidTopPx();
    const tankBot = TK_Y + TK_H - 4;
    const tankTop = TK_Y + 4;
    const { tkX } = getLayout();

    for (const b of blocks) {
      if (b.dragging) continue;

      const hw = b.mat.w / 2;
      b.x = Math.max(tkX + hw + 2, Math.min(tkX + TK_W - hw - 2, b.x));

      const subFrac = computeSubFrac(b, fTop);
      const accelB = (fl.density / b.mat.density) * G_SIM * subFrac;
      const net = G_SIM - accelB;

      const baseDamp = 0.45;
      const fluidDamp = fl.viscFactor * 0.12 * subFrac;
      const dampingCoeff = (baseDamp + fluidDamp) / Math.sqrt(b.mat.density);

      const oldVy = b.vy;
      b.vy += (net - b.vy * dampingCoeff) * dt;
      b.vy = Math.max(-1000, Math.min(1000, b.vy));
      b.y += b.vy * dt;

      if (b.y + b.mat.h / 2 > tankBot) {
        b.y = tankBot - b.mat.h / 2;
        b.vy = -b.vy * 0.15;
      }
      if (b.y - b.mat.h / 2 < tankTop) {
        b.y = tankTop + b.mat.h / 2;
        b.vy = Math.max(0, b.vy);
      }

      if (subFrac > 0.1 && subFrac < 0.9 && Math.abs(oldVy) > 100) {
        const nBub = Math.floor(Math.abs(oldVy) / 150);
        for (let i = 0; i < Math.min(nBub, 4); i++) {
          bubbles.push({
            x: b.x + (Math.random() - 0.5) * b.mat.w,
            y: fTop + (b.y + b.mat.h / 2 - fTop) * Math.random(),
            r: 1.0 + Math.random() * 2.5,
            vy: -30 - Math.random() * 50,
            life: 1.0,
          });
        }
      }

      for (const other of blocks) {
        if (other === b) continue;
        const dx = Math.abs(b.x - other.x),
          dy = Math.abs(b.y - other.y);
        const overlapX = (b.mat.w + other.mat.w) / 2 - dx,
          overlapY = (b.mat.h + other.mat.h) / 2 - dy;
        if (overlapX > 0 && overlapY > 0) {
          const pushY = overlapY * 0.5 + 0.1;
          if (b.y < other.y) {
            b.y -= pushY * 0.5;
            other.y += pushY * 0.5;
            b.vy *= 0.8;
            other.vy *= 0.8;
          } else {
            b.y += pushY * 0.5;
            other.y -= pushY * 0.5;
            b.vy *= 0.8;
            other.vy *= 0.8;
          }
        }
      }
    }

    for (let i = bubbles.length - 1; i >= 0; i--) {
      const bub = bubbles[i];
      bub.y += bub.vy * dt;
      bub.x += Math.sin(bub.y * 0.05 + time * 2) * 0.5;
      bub.life -= dt * 0.7;
      if (bub.life <= 0 || bub.y < fTop - 10) bubbles.splice(i, 1);
    }
    time += dt;
  }

  function bDrawBlock(b, fl, isSelected, fTop, tkX) {
    const { mat, x, y } = b;
    const hw = mat.w / 2,
      hh = mat.h / 2;
    const bLeft = x - hw,
      bTop = y - hh;
    const sub = Math.max(0, Math.min(mat.h, y + hh - fTop));
    const subFrac = sub / mat.h;
    const dryH = mat.h * (1 - subFrac),
      wetH = mat.h * subFrac;
    const r = 4;

    ctx.save();
    ctx.beginPath();
    ctx.rect(tkX + 2, TK_Y + 2, TK_W - 4, TK_H - 4);
    ctx.clip();

    ctx.shadowBlur = isSelected ? 20 : 8;
    ctx.shadowColor = isSelected ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.5)';
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 3;
    roundRect(ctx, bLeft, bTop, mat.w, mat.h, r);
    ctx.fillStyle = 'rgba(0,0,0,0.01)';
    ctx.fill();
    ctx.shadowBlur = 0;

    if (dryH > 0) {
      ctx.save();
      ctx.beginPath();
      roundRect(ctx, bLeft, bTop, mat.w, mat.h, r);
      ctx.clip();
      const g1 = ctx.createLinearGradient(bLeft, bTop, bLeft + mat.w, bTop + dryH);
      g1.addColorStop(0, lighten(mat.color, 0.25));
      g1.addColorStop(0.5, mat.color);
      g1.addColorStop(1, lighten(mat.color, -0.1));
      ctx.fillStyle = g1;
      ctx.fillRect(bLeft, bTop, mat.w, dryH);
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.fillRect(bLeft, bTop, mat.w, 2);
      ctx.restore();
    }

    if (wetH > 0) {
      ctx.save();
      ctx.beginPath();
      roundRect(ctx, bLeft, bTop, mat.w, mat.h, r);
      ctx.clip();
      const wetTop = bTop + dryH;
      const g2 = ctx.createLinearGradient(bLeft, wetTop, bLeft + mat.w, wetTop + wetH);
      g2.addColorStop(0, blend(mat.color, fl.color, 0.35));
      g2.addColorStop(0.5, blend(mat.color, fl.color, 0.5));
      g2.addColorStop(1, blend(mat.color, fl.color, 0.65));
      ctx.fillStyle = g2;
      ctx.fillRect(bLeft, wetTop, mat.w, wetH);
      ctx.restore();
    }

    ctx.beginPath();
    roundRect(ctx, bLeft, bTop, mat.w, mat.h, r);
    ctx.strokeStyle = isSelected ? '#ffffff' : mat.stroke;
    ctx.lineWidth = isSelected ? 2.5 : 1.5;
    ctx.stroke();

    ctx.fillStyle = isSelected ? '#ffffff' : 'rgba(255,255,255,0.8)';
    ctx.font = `bold ${Math.max(9, Math.min(12, mat.h / 3))}px "Montserrat", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(mat.name, x, y - 1);
    ctx.restore();
  }

  function bDrawScale(sel, fl, fTop, sx) {
    const mountY = TK_Y;

    // Scale Mount
    ctx.fillStyle = '#1e293b';
    roundRect(ctx, sx - 45, mountY - 16, 90, 18, 4);
    ctx.fill();
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(sx - 45, mountY - 16, 90, 18);

    const hookY = mountY + 2;
    const subFrac = sel ? computeSubFrac(sel, fTop) : 0;
    const wt = sel ? bWeight(sel.mat) : 0;
    const bf = sel ? bBuoy(sel.mat, fl, subFrac) : 0;
    const appW = Math.max(0, wt - bf); // Apparent weight is what the spring feels

    const baseLen = 70;
    const maxExt = 120;
    // Spring extension is proportional to the LOAD (apparent weight)
    const ext = sel ? Math.min(maxExt, (appW / MAX_SCALE_FORCE) * maxExt) : 0;
    const springLen = baseLen + ext;
    const panY = hookY + springLen;

    // Spring Coils (Dynamic length)
    const coils = 12;
    ctx.beginPath();
    ctx.moveTo(sx, hookY);
    for (let i = 0; i <= coils * 2; i++) {
      const t = i / (coils * 2);
      const side = (i % 2 === 0 ? 1 : -1) * 8;
      ctx.lineTo(sx + side, hookY + springLen * t);
    }
    ctx.lineTo(sx, panY);
    ctx.strokeStyle = '#60a5fa';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Pan (Moves with spring extension)
    ctx.beginPath();
    ctx.moveTo(sx - 30, panY);
    ctx.lineTo(sx + 30, panY);
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 4;
    ctx.stroke();

    if (sel) {
      const sc = 0.6;
      const mw = sel.mat.w * sc,
        mh = sel.mat.h * sc;
      // Object sits ON the pan
      roundRect(ctx, sx - mw / 2, panY - mh, mw, mh, 3);
      ctx.fillStyle = sel.mat.color;
      ctx.fill();
      ctx.strokeStyle = sel.mat.stroke;
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Readout Box
    const boxY = TK_Y + 220,
      boxW = 140,
      boxH = 140;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
    roundRect(ctx, sx - boxW / 2, boxY, boxW, boxH, 12);
    ctx.fill();
    ctx.strokeStyle = '#334155';
    ctx.stroke();

    if (sel) {
      const wt = bWeight(sel.mat);
      const bf = bBuoy(sel.mat, fl, subFrac);
      const aw = bApparent(sel.mat, fl, subFrac);

      const drawMetric = (label, val, unit, color, yOff) => {
        ctx.textAlign = 'center';
        ctx.fillStyle = '#94a3b8';
        ctx.font = '10px "Montserrat", sans-serif';
        ctx.fillText(label, sx, boxY + yOff);
        ctx.fillStyle = color;
        ctx.font = 'bold 13px "JetBrains Mono", monospace';
        ctx.fillText(`${val.toFixed(3)} ${unit}`, sx, boxY + yOff + 16);
      };

      drawMetric('Actual Weight', wt, 'N', '#fca5a5', 24);
      drawMetric('Buoyant Force', bf, 'N', '#60a5fa', 64);
      drawMetric('Apparent Weight', aw, 'N', aw > 0 ? '#fde047' : '#86efac', 104);

      if (aw <= 0.0001 && subFrac > 0) {
        ctx.fillStyle = '#86efac';
        ctx.font = 'bold 9px "Montserrat", sans-serif';
        ctx.fillText('NEUTRAL / FLOATING', sx, boxY + 130);
      }
    } else {
      ctx.fillStyle = '#64748b';
      ctx.font = 'italic 11px "Montserrat", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Select an object', sx, boxY + 70);
    }
  }

  function render() {
    const W = canvas.width,
      H = canvas.height;
    const { tkX, scX } = getLayout();
    ctx.clearRect(0, 0, W, H);
    const fl = FLUIDS[p.fluidIdx];

    // Background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, W, H);

    // Tank
    const tankGrad = ctx.createLinearGradient(tkX, TK_Y, tkX, TK_Y + TK_H);
    tankGrad.addColorStop(0, '#1e293b');
    tankGrad.addColorStop(1, '#0f172a');
    ctx.fillStyle = tankGrad;
    ctx.fillRect(tkX, TK_Y, TK_W, TK_H);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 3;
    ctx.strokeRect(tkX, TK_Y, TK_W, TK_H);

    const fTop = dynamicFluidTopPx();
    const fH = TK_Y + TK_H - fTop;

    // Fluid
    ctx.save();
    ctx.beginPath();
    ctx.rect(tkX + 2, fTop, TK_W - 4, fH);
    ctx.clip();
    const fGrad = ctx.createLinearGradient(tkX, fTop, tkX, TK_Y + TK_H);
    fGrad.addColorStop(0, hexAlpha(fl.colorTop, fl.alpha * 0.8));
    fGrad.addColorStop(1, hexAlpha(fl.color, fl.alpha));
    ctx.fillStyle = fGrad;
    ctx.fillRect(tkX + 2, fTop, TK_W - 4, fH);
    ctx.restore();

    // Surface Wave
    ctx.beginPath();
    ctx.moveTo(tkX + 2, fTop);
    for (let px = tkX + 2; px <= tkX + TK_W - 2; px += 4) {
      const wave = Math.sin(px / 40 + time * 3) * 2;
      ctx.lineTo(px, fTop + wave);
    }
    ctx.strokeStyle = fl.colorTop;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Bubbles
    for (const bub of bubbles) {
      ctx.beginPath();
      ctx.arc(bub.x, bub.y, bub.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${bub.life * 0.4})`;
      ctx.fill();
    }

    // Blocks
    for (const b of blocks) {
      if (b.id !== selectedId) bDrawBlock(b, fl, false, fTop, tkX);
    }
    const sel = blocks.find((b) => b.id === selectedId);
    if (sel) bDrawBlock(sel, fl, true, fTop, tkX);

    // Forces visualization
    if (sel) {
      const subFrac = computeSubFrac(sel, fTop);
      const wt = bWeight(sel.mat);
      const bf = bBuoy(sel.mat, fl, subFrac);
      const maxF = Math.max(wt, bf, 1);

      const arrowLen = (f) => (f / maxF) * 80;
      const bx = sel.x,
        by = sel.y + sel.mat.h / 2;

      // Weight arrow
      ctx.beginPath();
      ctx.moveTo(bx - 15, by);
      ctx.lineTo(bx - 15, by + arrowLen(wt));
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Buoyancy arrow
      if (bf > 0.01) {
        ctx.beginPath();
        ctx.moveTo(bx + 15, by);
        ctx.lineTo(bx + 15, by - arrowLen(bf));
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 3;
        ctx.stroke();
      }
    }

    bDrawScale(sel, fl, fTop, scX);

    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 12px "Montserrat", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText("ARCHIMEDES' BUOYANCY LAB", tkX + TK_W / 2, TK_Y - 15);
  }

  let rafId,
    running = false,
    lastTs;

  function loop(ts) {
    if (!running) return;
    const dt = Math.min((ts - (lastTs || ts)) / 1000, 0.05);
    lastTs = ts;
    tick(dt);
    render();
    rafId = requestAnimationFrame(loop);
  }

  return {
    start() {
      running = true;
      lastTs = performance.now();
      loop(lastTs);
    },
    stop() {
      running = false;
      cancelAnimationFrame(rafId);
    },
    reset() {
      blocks = [];
      bubbles = [];
      time = 0;
      selectedId = null;
      render();
    },
    destroy() {
      this.stop();
    },
    setParams(newP) {
      p = { ...p, ...newP };
    },
    getData() {
      const fl = FLUIDS[p.fluidIdx];
      const sel = blocks.find((b) => b.id === selectedId);
      if (!sel) return { time };
      const fTop = dynamicFluidTopPx();
      const subFrac = computeSubFrac(sel, fTop);
      return {
        time,
        fluidDensity: fl.density,
        weight: bWeight(sel.mat),
        buoyancy: bBuoy(sel.mat, fl, subFrac),
        appWeight: bApparent(sel.mat, fl, subFrac),
      };
    },
  };
}
