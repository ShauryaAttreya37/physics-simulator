/**
 * Buoyancy Lab Simulation
 * Ported from FluidSandboxPage.jsx
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
    viscFactor: 250.0,
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

function bVol(mat) {
  return mat.w * PX_M * mat.h * PX_M * DEPTH_M;
}
function bWeight(mat) {
  return mat.density * bVol(mat) * G;
}
function bBuoy(mat, fl, subFrac) {
  return fl.density * G * bVol(mat) * subFrac;
}
function bApparent(mat, fl, sub) {
  return bWeight(mat) - bBuoy(mat, fl, sub);
}

function hexAlpha(hex, a) {
  const r = parseInt(hex.slice(1, 3), 16),
    g = parseInt(hex.slice(3, 5), 16),
    b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
}
function lighten(hex, f) {
  return `rgb(${Math.min(255, parseInt(hex.slice(1, 3), 16) + Math.round(f * 255))},${Math.min(255, parseInt(hex.slice(3, 5), 16) + Math.round(f * 255))},${Math.min(255, parseInt(hex.slice(5, 7), 16) + Math.round(f * 255))})`;
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
      'Buoyancy is the upward force that fluids exert on objects submerged in them. This principle explains why objects float or sink, and why submarines can control their depth. The buoyant force depends on the fluid density and the volume of fluid displaced. This simulation lets you experiment with different materials and fluids to see buoyancy in action.',
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
      { symbol: 'ρ_f', description: 'Density of the fluid (mass per volume)' },
      { symbol: 'V_sub', description: 'Volume of fluid displaced (submerged volume)' },
    ],
  },
  {
    title: 'Floating Condition',
    equations: [
      {
        latex: String.raw`F_b = W_{object}`,
        description: 'Object floats when buoyant force equals object weight.',
      },
      {
        latex: String.raw`\rho_{object} < \rho_{fluid}`,
        description: 'Object density must be less than fluid density to float.',
      },
    ],
  },
  {
    title: 'Apparent Weight',
    equations: [
      {
        latex: String.raw`W_{apparent} = W_{object} - F_b`,
        description: "Weight you feel when lifting submerged object. It's less than actual weight.",
      },
    ],
  },
  {
    title: 'How to Use',
    content:
      '1. Click in the tank to add blocks of different materials.\n2. Select different fluids (water, oil, mercury) to see how density affects buoyancy.\n3. Try materials denser than fluid (sink) vs less dense (float).\n4. Drag blocks around to see how depth affects buoyant force.\n5. Watch the graphs: weight, buoyancy, and apparent weight.\n6. Experiment with partial submersion.',
  },
  {
    title: 'Beginner Tips',
    content:
      'Denser fluids provide more buoyancy. Objects float when their average density is less than the fluid. The buoyant force increases with depth. Steel ships float because they displace a lot of water. Try the "Eureka!" moment - objects lose weight in water!',
  },
];

export const equations = [];

export const graphParams = [
  { key: 'weight', label: 'Object Weight (in air)', color: '#FF6B6B' },
  { key: 'buoyancy', label: 'Buoyant Force', color: '#60a5fa' },
  { key: 'appWeight', label: 'Apparent Weight', color: '#FFD166' },
];

export function create(canvas, initParams = {}) {
  const ctx = canvas.getContext('2d');
  let p = { ...defaultParams, ...initParams };

  const TK_X = 72,
    TK_Y = 50,
    TK_W = 390,
    TK_H = 380;
  const FLUID_FILL = 0.75;
  const SC_X = TK_X + TK_W + 60;

  let blocks = [];
  let bubbles = [];
  let time = 0;
  let dragging = null;
  let selectedId = null;

  canvas.addEventListener('pointerdown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const sx = (e.clientX - rect.left) * scaleX;
    const sy = (e.clientY - rect.top) * scaleY;

    // hit test
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
      // Spawn new block if clicked in top area or empty space
      const mat = MATERIALS[p.matIdx];
      if (blocks.length < 10) {
        const newBlock = {
          id: Date.now() + Math.random(),
          mat,
          x: Math.max(TK_X + 20, Math.min(sx, TK_X + TK_W - 20)),
          y: Math.max(TK_Y + 20, sy),
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

    dragging.block.x = sx - dragging.offX;
    dragging.block.y = sy - dragging.offY;
    dragging.block.vy = 0;

    const hw = dragging.block.mat.w / 2,
      hh = dragging.block.mat.h / 2;
    dragging.block.x = Math.max(TK_X + hw + 2, Math.min(TK_X + TK_W - hw - 2, dragging.block.x));
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
    const baseTop = TK_Y + TK_H * (1 - FLUID_FILL);
    let totalDisplacedArea = 0;
    const tankInnerW = TK_W - 4;
    for (const b of blocks) {
      const hh = b.mat.h / 2;
      const subPx = Math.max(0, Math.min(b.mat.h, b.y + hh - baseTop));
      totalDisplacedArea += b.mat.w * subPx;
    }
    const rise = totalDisplacedArea / tankInnerW;
    return Math.max(TK_Y + 8, baseTop - rise);
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

    for (const b of blocks) {
      if (b.dragging) continue;
      const hh = b.mat.h / 2;
      const sub = Math.max(0, Math.min(b.mat.h, b.y + hh - fTop));
      const subFrac = sub / b.mat.h;
      const accelB = (fl.density / b.mat.density) * G_SIM * subFrac;
      const net = G_SIM - accelB;
      const viscDamp = fl.viscFactor * 0.012;
      const damp = b.vy * (0.5 + viscDamp);
      const oldVy = b.vy;
      b.vy += (net - damp) * dt;
      b.vy = Math.max(-800, Math.min(800, b.vy));
      b.y += b.vy * dt;

      if (subFrac > 0.05 && Math.abs(oldVy) > 40) {
        const nBub = Math.floor(Math.abs(oldVy) / 60);
        for (let i = 0; i < Math.min(nBub, 3); i++) {
          bubbles.push({
            x: b.x + (Math.random() - 0.5) * b.mat.w * 0.8,
            y: fTop + sub * Math.random(),
            r: 1.5 + Math.random() * 2.5,
            vy: -20 - Math.random() * 40,
            life: 1.0,
          });
        }
      }

      if (b.y + hh > tankBot) {
        b.y = tankBot - hh;
        b.vy = -b.vy * 0.12;
      }
      if (b.y - hh < tankTop) {
        b.y = tankTop + hh;
        b.vy = Math.max(0, b.vy);
      }

      for (const other of blocks) {
        if (other === b) continue;
        const dx = Math.abs(b.x - other.x),
          dy = Math.abs(b.y - other.y);
        const overlapX = (b.mat.w + other.mat.w) / 2 - dx,
          overlapY = (b.mat.h + other.mat.h) / 2 - dy;
        if (overlapX > 0 && overlapY > 0) {
          const pushY = overlapY * 0.5 + 0.5;
          if (b.y < other.y) {
            b.y -= pushY * 0.3;
            other.y += pushY * 0.3;
          } else {
            b.y += pushY * 0.3;
            other.y -= pushY * 0.3;
          }
        }
      }
    }

    for (let i = bubbles.length - 1; i >= 0; i--) {
      const bub = bubbles[i];
      bub.y += bub.vy * dt;
      bub.x += Math.sin(bub.y * 0.1) * 0.3;
      bub.life -= dt * 0.8;
      if (bub.life <= 0 || bub.y < fTop - 5) bubbles.splice(i, 1);
    }
    time += dt;
  }

  function bDrawBlock(b, fl, isSelected, fTop) {
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
    ctx.rect(TK_X + 2, TK_Y + 2, TK_W - 4, TK_H - 4);
    ctx.clip();

    ctx.shadowBlur = isSelected ? 18 : 8;
    ctx.shadowColor = isSelected ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.5)';
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 3;
    roundRect(ctx, bLeft, bTop, mat.w, mat.h, r);
    ctx.fillStyle = 'rgba(0,0,0,0.01)';
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    if (dryH > 0) {
      ctx.save();
      ctx.beginPath();
      roundRect(ctx, bLeft, bTop, mat.w, mat.h, r);
      ctx.clip();
      const g1 = ctx.createLinearGradient(bLeft, bTop, bLeft + mat.w, bTop + dryH);
      g1.addColorStop(0, lighten(mat.color, 0.22));
      g1.addColorStop(0.5, mat.color);
      g1.addColorStop(1, lighten(mat.color, -0.05));
      ctx.fillStyle = g1;
      ctx.fillRect(bLeft, bTop, mat.w, dryH);
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      ctx.fillRect(bLeft, bTop, mat.w, 2);
      ctx.fillStyle = '#2A3441';
      ctx.fillRect(bLeft, bTop, 2, dryH);
      ctx.restore();
    }

    if (wetH > 0) {
      ctx.save();
      ctx.beginPath();
      roundRect(ctx, bLeft, bTop, mat.w, mat.h, r);
      ctx.clip();
      const wetTop = bTop + dryH;
      const g2 = ctx.createLinearGradient(bLeft, wetTop, bLeft + mat.w, wetTop + wetH);
      g2.addColorStop(0, blend(mat.color, fl.color, 0.3));
      g2.addColorStop(0.5, blend(mat.color, fl.color, 0.42));
      g2.addColorStop(1, blend(mat.color, fl.color, 0.55));
      ctx.fillStyle = g2;
      ctx.fillRect(bLeft, wetTop, mat.w, wetH);
      ctx.fillStyle = hexAlpha(fl.colorTop, 0.1);
      ctx.fillRect(bLeft, wetTop, mat.w, wetH);
      ctx.restore();
    }

    ctx.beginPath();
    roundRect(ctx, bLeft, bTop, mat.w, mat.h, r);
    if (isSelected) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.shadowBlur = 12;
      ctx.shadowColor = 'rgba(255,255,255,0.4)';
    } else {
      ctx.strokeStyle = mat.stroke;
      ctx.lineWidth = 1.5;
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.fillStyle = isSelected ? '#ffffff' : 'rgba(255,255,255,0.78)';
    ctx.font = `bold ${Math.max(8, Math.min(11, mat.h / 3.5))}px "Montserrat", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(mat.name, x, y - 1);
    ctx.fillStyle = isSelected ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.30)';
    ctx.font = `${Math.max(7, Math.min(9, mat.h / 5))}px "JetBrains Mono", monospace`;
    ctx.fillText(`${mat.density}`, x, y + Math.max(7, mat.h / 4));
    ctx.restore();
  }

  function bDrawScale(sel, fl, fTop) {
    const sx = SC_X;
    const mountY = TK_Y;

    ctx.fillStyle = '#1a2538';
    roundRect(ctx, sx - 40, mountY - 14, 80, 16, 4);
    ctx.fill();
    ctx.strokeStyle = '#2d4060';
    ctx.lineWidth = 1;
    roundRect(ctx, sx - 40, mountY - 14, 80, 16, 4);
    ctx.stroke();
    ctx.fillStyle = '#3a5070';
    ctx.fillRect(sx - 3, mountY + 2, 6, 22);

    const hookY = mountY + 24;
    const appW = sel ? bApparent(sel.mat, fl, computeSubFrac(sel, fTop)) : 0;
    const maxW = sel ? Math.max(bWeight(sel.mat), 0.001) : 1;
    const baseLen = 85,
      maxExt = 105;
    const ext = sel ? Math.max(0, (Math.abs(appW) / maxW) * maxExt) : 0;
    const springLen = baseLen + ext;
    const panY = hookY + springLen;

    const coils = 11;
    ctx.beginPath();
    ctx.moveTo(sx, hookY);
    for (let i = 0; i <= coils * 2; i++) {
      const t = i / (coils * 2);
      const side = (i % 2 === 0 ? 1 : -1) * 10;
      ctx.lineTo(sx + side, hookY + springLen * t);
    }
    ctx.lineTo(sx, panY);
    ctx.strokeStyle = '#60a5fa';
    ctx.lineWidth = 2;
    ctx.shadowBlur = 6;
    ctx.shadowColor = '#3b82f680';
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.beginPath();
    ctx.moveTo(sx - 26, panY);
    ctx.lineTo(sx + 26, panY);
    ctx.strokeStyle = '#8899aa';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(sx - 26, panY);
    ctx.lineTo(sx - 20, panY + 5);
    ctx.lineTo(sx + 20, panY + 5);
    ctx.lineTo(sx + 26, panY);
    ctx.strokeStyle = '#556677';
    ctx.lineWidth = 1;
    ctx.stroke();

    if (sel) {
      const sc = 0.5,
        mw = sel.mat.w * sc,
        mh = sel.mat.h * sc;
      roundRect(ctx, sx - mw / 2, panY - mh + 1, mw, mh, 3);
      ctx.fillStyle = sel.mat.color;
      ctx.fill();
      ctx.strokeStyle = sel.mat.stroke;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.65)';
      ctx.font = 'bold 7px "Montserrat", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(sel.mat.name, sx, panY - mh / 2 + 1);
    }

    const boxY = panY + 16,
      boxW = 136,
      boxH = 130;
    ctx.fillStyle = 'rgba(8,14,26,0.94)';
    roundRect(ctx, sx - boxW / 2, boxY, boxW, boxH, 8);
    ctx.fill();
    ctx.strokeStyle = '#1a3050';
    ctx.lineWidth = 1;
    roundRect(ctx, sx - boxW / 2, boxY, boxW, boxH, 8);
    ctx.stroke();

    ctx.textAlign = 'center';
    if (sel) {
      const subFrac = computeSubFrac(sel, fTop);
      const wt = bWeight(sel.mat),
        buoyF = bBuoy(sel.mat, fl, subFrac),
        appWt = bApparent(sel.mat, fl, subFrac);
      const floats = appWt < -0.00005,
        neutral = Math.abs(appWt) <= 0.00005;

      ctx.fillStyle = '#5a6a7a';
      ctx.font = '9px "Montserrat", sans-serif';
      ctx.fillText('Weight (in air)', sx, boxY + 16);
      ctx.fillStyle = '#f1f5f9';
      ctx.font = 'bold 12px "JetBrains Mono", monospace';
      ctx.fillText(`${wt.toFixed(4)} N`, sx, boxY + 30);
      ctx.fillStyle = '#5a6a7a';
      ctx.font = '9px "Montserrat", sans-serif';
      ctx.fillText('Buoyant force', sx, boxY + 46);
      ctx.fillStyle = '#60a5fa';
      ctx.font = 'bold 12px "JetBrains Mono", monospace';
      ctx.fillText(`${buoyF.toFixed(4)} N`, sx, boxY + 60);
      ctx.fillStyle = '#5a6a7a';
      ctx.font = '9px "Montserrat", sans-serif';
      ctx.fillText('Apparent weight', sx, boxY + 76);
      ctx.fillStyle = floats ? '#86efac' : neutral ? '#FFD166' : '#fca5a5';
      ctx.font = 'bold 13px "JetBrains Mono", monospace';
      ctx.fillText(`${appWt >= 0 ? '' : '−'}${Math.abs(appWt).toFixed(4)} N`, sx, boxY + 92);

      const tag = floats ? '↑ FLOATS' : neutral ? '◆ NEUTRAL' : '↓ SINKS';
      const tagCol = floats ? '#86efac' : neutral ? '#FFD166' : '#FF6B6B';
      const tagBg = floats
        ? 'rgba(134,239,172,0.10)'
        : neutral
          ? 'rgba(255, 209, 102,0.10)'
          : 'rgba(248,113,113,0.10)';
      roundRect(ctx, sx - 36, boxY + 102, 72, 18, 4);
      ctx.fillStyle = tagBg;
      ctx.fill();
      ctx.strokeStyle = floats
        ? 'rgba(134,239,172,0.25)'
        : neutral
          ? 'rgba(255, 209, 102,0.25)'
          : 'rgba(248,113,113,0.25)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = tagCol;
      ctx.font = 'bold 9px "Montserrat", sans-serif';
      ctx.fillText(tag, sx, boxY + 114);
    } else {
      ctx.fillStyle = '#334050';
      ctx.font = '11px "Montserrat", sans-serif';
      ctx.fillText('Click empty space', sx, boxY + 42);
      ctx.fillText('to spawn blocks.', sx, boxY + 58);
      ctx.fillText('Click blocks to', sx, boxY + 74);
      ctx.fillText('drag & inspect.', sx, boxY + 90);
    }

    ctx.fillStyle = 'rgba(148,163,184,0.4)';
    ctx.font = '9px "Montserrat", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('⚖  SPRING SCALE', sx, TK_Y - 2);
  }

  function render() {
    const W = canvas.width,
      H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const fl = FLUIDS[p.fluidIdx];

    const bgGrad = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W * 0.8);
    bgGrad.addColorStop(0, '#0a0c16');
    bgGrad.addColorStop(1, '#050610');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(255,255,255,0.02)';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 30) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    for (let y = 0; y < H; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }

    ctx.save();
    const tankGrad = ctx.createLinearGradient(TK_X, TK_Y, TK_X, TK_Y + TK_H);
    tankGrad.addColorStop(0, 'rgba(8,14,28,0.95)');
    tankGrad.addColorStop(1, 'rgba(4,8,18,0.98)');
    ctx.fillStyle = tankGrad;
    ctx.fillRect(TK_X, TK_Y, TK_W, TK_H);
    ctx.fillStyle = 'rgba(255,255,255,0.015)';
    ctx.fillRect(TK_X, TK_Y, 3, TK_H);
    ctx.fillRect(TK_X + TK_W - 3, TK_Y, 3, TK_H);
    ctx.restore();

    ctx.strokeStyle = '#2a3650';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(TK_X, TK_Y, TK_W, TK_H);
    ctx.strokeStyle = 'rgba(100,140,200,0.08)';
    ctx.lineWidth = 1;
    ctx.strokeRect(TK_X + 1, TK_Y + 1, TK_W - 2, TK_H - 2);

    const fTop = dynamicFluidTopPx(),
      fH = TK_Y + TK_H - fTop;

    ctx.save();
    ctx.beginPath();
    ctx.rect(TK_X + 2, fTop, TK_W - 4, fH);
    ctx.clip();
    const fGrad = ctx.createLinearGradient(TK_X, fTop, TK_X, TK_Y + TK_H);
    fGrad.addColorStop(0, hexAlpha(fl.colorTop, fl.alpha * 0.85));
    fGrad.addColorStop(0.06, hexAlpha(fl.color, fl.alpha * 0.95));
    fGrad.addColorStop(0.5, hexAlpha(fl.color, fl.alpha));
    fGrad.addColorStop(1, hexAlpha(fl.color, Math.min(1, fl.alpha + 0.15)));
    ctx.fillStyle = fGrad;
    ctx.fillRect(TK_X + 2, fTop, TK_W - 4, fH);

    ctx.globalAlpha = 0.04;
    for (let i = 0; i < 6; i++) {
      const rx = TK_X + 20 + ((i * 67 + time * 15) % (TK_W - 40));
      const rw = 8 + Math.sin(time * 1.2 + i * 2) * 4;
      const cGrad = ctx.createLinearGradient(rx, fTop, rx, fTop + fH * 0.7);
      cGrad.addColorStop(0, 'rgba(255,255,255,0.8)');
      cGrad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = cGrad;
      ctx.fillRect(rx, fTop, rw, fH * 0.7);
    }
    ctx.globalAlpha = 1;
    ctx.restore();

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(TK_X + 2, fTop);
    for (let px = TK_X + 2; px <= TK_X + TK_W - 2; px += 2) {
      const wave =
        Math.sin(((px - TK_X) / TK_W) * Math.PI * 6 + time * 3) * 1.2 +
        Math.sin(((px - TK_X) / TK_W) * Math.PI * 10 + time * 5) * 0.5;
      ctx.lineTo(px, fTop + wave);
    }
    ctx.lineTo(TK_X + TK_W - 2, fTop + 8);
    ctx.lineTo(TK_X + 2, fTop + 8);
    ctx.closePath();
    const surfGrad = ctx.createLinearGradient(0, fTop - 2, 0, fTop + 8);
    surfGrad.addColorStop(0, hexAlpha(fl.colorTop, 0.95));
    surfGrad.addColorStop(1, hexAlpha(fl.color, 0.3));
    ctx.fillStyle = surfGrad;
    ctx.fill();
    ctx.restore();

    ctx.beginPath();
    ctx.moveTo(TK_X + 2, fTop);
    for (let px = TK_X + 2; px <= TK_X + TK_W - 2; px += 2) {
      const wave =
        Math.sin(((px - TK_X) / TK_W) * Math.PI * 6 + time * 3) * 1.2 +
        Math.sin(((px - TK_X) / TK_W) * Math.PI * 10 + time * 5) * 0.5;
      ctx.lineTo(px, fTop + wave);
    }
    ctx.strokeStyle = hexAlpha(fl.colorTop, 0.9);
    ctx.lineWidth = 1.5;
    ctx.shadowBlur = 4;
    ctx.shadowColor = hexAlpha(fl.colorTop, 0.4);
    ctx.stroke();
    ctx.shadowBlur = 0;

    for (const bub of bubbles) {
      ctx.beginPath();
      ctx.arc(bub.x, bub.y, bub.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(180,220,255,${bub.life * 0.3})`;
      ctx.fill();
      ctx.strokeStyle = `rgba(200,235,255,${bub.life * 0.25})`;
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }

    for (const b of blocks) {
      if (b.id !== selectedId) bDrawBlock(b, fl, false, fTop);
    }
    const sel = blocks.find((b) => b.id === selectedId);
    if (sel) bDrawBlock(sel, fl, true, fTop);

    if (sel) {
      const subFrac = computeSubFrac(sel, fTop),
        wt = bWeight(sel.mat),
        buoyF = bBuoy(sel.mat, fl, subFrac);
      const maxF = Math.max(wt, buoyF, 0.001),
        arrowScale = 60,
        wtLen = (wt / maxF) * arrowScale;
      const bCx = sel.x,
        bCy = sel.y + sel.mat.h / 2;

      ctx.beginPath();
      ctx.moveTo(bCx - 12, bCy + 2);
      ctx.lineTo(bCx - 12, bCy + 2 + wtLen);
      ctx.strokeStyle = '#FF6B6B';
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(bCx - 12, bCy + 2 + wtLen);
      ctx.lineTo(bCx - 16, bCy + 2 + wtLen - 6);
      ctx.lineTo(bCx - 8, bCy + 2 + wtLen - 6);
      ctx.closePath();
      ctx.fillStyle = '#FF6B6B';
      ctx.fill();

      if (subFrac > 0.001) {
        const buoyLen = (buoyF / maxF) * arrowScale;
        ctx.beginPath();
        ctx.moveTo(bCx + 12, bCy + 2);
        ctx.lineTo(bCx + 12, bCy + 2 - buoyLen);
        ctx.strokeStyle = '#60a5fa';
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(bCx + 12, bCy + 2 - buoyLen);
        ctx.lineTo(bCx + 8, bCy + 2 - buoyLen + 6);
        ctx.lineTo(bCx + 16, bCy + 2 - buoyLen + 6);
        ctx.closePath();
        ctx.fillStyle = '#60a5fa';
        ctx.fill();
      }
    }

    bDrawScale(sel, fl, fTop);
    ctx.fillStyle = 'rgba(255,255,255,0.14)';
    ctx.font = 'bold 11px "Montserrat", sans-serif';
    ctx.textAlign = 'center';
    ctx.letterSpacing = '0.1em';
    ctx.fillText("ARCHIMEDES' BUOYANCY TANK", TK_X + TK_W / 2, TK_Y - 10);
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
      this.stop();
      blocks = [];
      bubbles = [];
      time = 0;
      selectedId = null;
      render();
      this.start();
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
      if (!sel) return {};
      const fTop = dynamicFluidTopPx();
      const subFrac = computeSubFrac(sel, fTop);
      return {
        blocks: blocks.length,
        fluidDensity: fl.density,
        weight: bWeight(sel.mat),
        buoyancy: bBuoy(sel.mat, fl, subFrac),
        appWeight: bApparent(sel.mat, fl, subFrac),
      };
    },
  };
}
