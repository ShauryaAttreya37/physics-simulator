import { useState, useEffect, useRef, useCallback } from 'react';
import { BlockMath, InlineMath } from 'react-katex';
import 'katex/dist/katex.min.css';

// ─── Data ────────────────────────────────────────────────────────────────────

const FLUIDS = [
  { id:'water',     name:'Water',          density:1.000, color:'#1a5fb4', colorTop:'#2b8fea', alpha:0.78, viscFactor:1.0   },
  { id:'saltwater', name:'Salt Water',     density:1.025, color:'#14518a', colorTop:'#1e72b8', alpha:0.82, viscFactor:1.1   },
  { id:'ethanol',   name:'Ethanol (96%)',  density:0.789, color:'#2255a0', colorTop:'#3a7ace', alpha:0.60, viscFactor:0.7   },
  { id:'oil',       name:'Vegetable Oil',  density:0.920, color:'#6b7c15', colorTop:'#99b422', alpha:0.72, viscFactor:6.0   },
  { id:'glycerin',  name:'Glycerol',       density:1.261, color:'#5a2b90', colorTop:'#8040c0', alpha:0.80, viscFactor:100.0 },
  { id:'mercury',   name:'Mercury (Hg)',   density:13.60, color:'#888890', colorTop:'#c0c0c8', alpha:0.92, viscFactor:1.8   },
  { id:'honey',     name:'Honey',          density:1.420, color:'#a07200', colorTop:'#e0a800', alpha:0.88, viscFactor:250.0 },
];

const MATERIALS = [
  { id:'foam',    name:'Foam',       density:0.050, color:'#f5f0e0', stroke:'#c8c0a0', w:64, h:44 },
  { id:'wood',    name:'Wood',       density:0.600, color:'#c07840', stroke:'#9a5820', w:56, h:36 },
  { id:'ice',     name:'Ice',        density:0.917, color:'#d0ecf8', stroke:'#80b8d8', w:54, h:38 },
  { id:'plastic', name:'HDPE',       density:0.950, color:'#28c8b8', stroke:'#188878', w:52, h:32 },
  { id:'rubber',  name:'Rubber',     density:1.200, color:'#d82020', stroke:'#980808', w:48, h:34 },
  { id:'glass',   name:'Glass',      density:2.500, color:'#b8d8f0', stroke:'#70a8c8', w:44, h:28 },
  { id:'alum',    name:'Aluminum',   density:2.700, color:'#b8c0c8', stroke:'#889098', w:42, h:26 },
  { id:'steel',   name:'Steel',      density:7.800, color:'#5878a0', stroke:'#384858', w:38, h:24 },
  { id:'lead',    name:'Lead',       density:11.30, color:'#383848', stroke:'#181828', w:34, h:22 },
];

const SHAPES = [
  { id:'circle',  name:'Cylinder',   cd:1.20, cl:0,    st:0.20 },  // infinite cylinder Re>1e4
  { id:'box',     name:'Flat Plate', cd:1.98, cl:0,    st:0.15 },  // finite plate normal to flow
  { id:'sphere3d',name:'Sphere 3D',  cd:0.47, cl:0,    st:0.19 },  // subcritical sphere
  { id:'airfoil', name:'Airfoil',    cd:0.008,cl:0.30, st:0.0  },  // NACA 0012 ~2° AoA
  { id:'diamond', name:'Diamond',    cd:1.50, cl:0,    st:0.18 },  // square at 45°
];

// Reynolds-dependent drag coefficient (accounts for drag crisis & laminar/turbulent transition)
function cdForRe(shape, Re) {
  const base = shape.cd;
  if (shape.id === 'sphere3d') {
    // Sphere drag crisis: Cd drops from 0.47 to ~0.20 around Re ≈ 3×10⁵
    if (Re < 1e3)  return 24/Re + 6/(1+Math.sqrt(Re)) + 0.4; // Schiller-Naumann approx
    if (Re < 2e5)  return 0.47;
    if (Re < 4e5)  return 0.47 - 0.27 * ((Re-2e5)/2e5); // transition
    return 0.20; // supercritical
  }
  if (shape.id === 'circle') {
    // Cylinder drag crisis: Cd drops from 1.2 to ~0.3 around Re ≈ 5×10⁵
    if (Re < 1e3)  return 10 / Math.pow(Re, 0.5); // low-Re approx
    if (Re < 3e5)  return 1.20;
    if (Re < 6e5)  return 1.20 - 0.90 * ((Re-3e5)/3e5); // transition
    return 0.30; // supercritical
  }
  if (shape.id === 'airfoil') {
    // Airfoil: Cd increases at very low Re due to laminar separation
    if (Re < 1e4) return 0.05;
    if (Re < 1e5) return 0.015;
    return 0.008; // turbulent attached flow
  }
  return base; // box, diamond — Cd roughly constant
}

// Real-world volume scale: 1 px = 3 mm, depth = 8 cm
const PX_M = 0.003;
const DEPTH_M = 0.08;
const G = 9.81;
const G_SIM = 900; // px/s² visual gravity

function bVol(mat)               { return mat.w * PX_M * mat.h * PX_M * DEPTH_M; }
function bWeight(mat)            { return mat.density * bVol(mat) * G; }
function bBuoy(mat, fl, subFrac) { return fl.density * G * bVol(mat) * subFrac; }
function bApparent(mat, fl, sub) { return bWeight(mat) - bBuoy(mat, fl, sub); }

// ─── Colour helpers ──────────────────────────────────────────────────────────

function hexAlpha(hex, a) {
  const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
  return `rgba(${r},${g},${b},${a})`;
}
function lighten(hex, f) {
  return `rgb(${Math.min(255,parseInt(hex.slice(1,3),16)+Math.round(f*255))},${Math.min(255,parseInt(hex.slice(3,5),16)+Math.round(f*255))},${Math.min(255,parseInt(hex.slice(5,7),16)+Math.round(f*255))})`;
}
function blend(h1, h2, t) {
  const r=Math.round(parseInt(h1.slice(1,3),16)*(1-t)+parseInt(h2.slice(1,3),16)*t);
  const g=Math.round(parseInt(h1.slice(3,5),16)*(1-t)+parseInt(h2.slice(3,5),16)*t);
  const b=Math.round(parseInt(h1.slice(5,7),16)*(1-t)+parseInt(h2.slice(5,7),16)*t);
  return `rgb(${r},${g},${b})`;
}
function velColor(v, vmax) {
  const t = Math.min(1, Math.max(0, v / vmax));
  if (t < 0.25) { const s=t/0.25; return [0, Math.round(s*255), 255]; }
  if (t < 0.50) { const s=(t-0.25)/0.25; return [0, 255, Math.round((1-s)*255)]; }
  if (t < 0.75) { const s=(t-0.50)/0.25; return [Math.round(s*255), 255, 0]; }
  const s=(t-0.75)/0.25; return [255, Math.round((1-s)*255), 0];
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.arcTo(x+w,y,x+w,y+r,r);
  ctx.lineTo(x+w,y+h-r); ctx.arcTo(x+w,y+h,x+w-r,y+h,r);
  ctx.lineTo(x+r,y+h); ctx.arcTo(x,y+h,x,y+h-r,r);
  ctx.lineTo(x,y+r); ctx.arcTo(x,y,x+r,y,r);
  ctx.closePath();
}

// ─── Wind-tunnel velocity field (potential flow around cylinder) ─────────────

function velField(px, py, cx, cy, R, U, shapeId='circle', simTime=0) {
  let dx = px - cx, dy = py - cy;
  if (shapeId === 'airfoil') dy *= 2.5; // Transform space to make it 'thinner'
  
  const r2 = dx*dx + dy*dy;
  const R2 = R * R;
  
  // Boundary logic
  if (shapeId === 'diamond') {
    if (Math.abs(dx) + Math.abs(dy) < R * 0.95) return { vx:0, vy:0 };
  } else if (shapeId === 'box') {
    if (Math.abs(dx) < 25 && Math.abs(dy) < 45) return { vx:0, vy:0 };
  } else if (r2 < R2 * 1.02 && dx > -R) {
    return { vx: 0, vy: 0 };
  }
  
  const r4 = Math.max(1, r2 * r2);
  let vx = U * (1.0 - R2*(dx*dx - dy*dy) / r4);
  let vy = U * (-R2 * 2*dx*dy / r4);

  // Airfoil: add circulation (Kutta-Joukowski) for lift-induced flow deflection
  if (shapeId === 'airfoil' && r2 > R2 * 1.1) {
    // Γ = π * c * U * Cl  (thin airfoil theory: Γ = π * c * U * sin(α) ≈ π*c*U*α)
    // This adds bound vortex to produce asymmetric flow (faster over top, slower under)
    const Cl = 0.30; // matches SHAPES definition
    const Gamma = Math.PI * R * 2 * U * Cl * 0.15; // scaled for visual
    const r2safe = Math.max(r2, R2);
    vx += Gamma * dy / (2 * Math.PI * r2safe);
    vy -= Gamma * dx / (2 * Math.PI * r2safe);
  }

  // Turbulent Karman wake — per-shape Strouhal number & calibrated intensities
  if (dx > 0) {
    // Shape-dependent wake parameters
    const shapeData = SHAPES.find(s => s.id === shapeId) || SHAPES[0];
    const St = shapeData.st; // Strouhal number: St = f*D/U
    const shedFreq = St * U / R;

    // Wake width scales with Cd (higher drag = wider wake)
    const wakeWidth = R * (shapeId === 'box' ? 3.5 : shapeId === 'airfoil' ? 0.6 : shapeId === 'diamond' ? 3.0 : 2.5);
    // Wake persistence length (higher Cd shapes have longer wakes)
    const wakePersist = R * (shapeId === 'box' ? 10 : shapeId === 'airfoil' ? 3 : shapeId === 'diamond' ? 7 : 6);
    const wDecay = Math.exp(-(dy*dy) / (wakeWidth*wakeWidth)) * Math.exp(-dx / wakePersist);

    // Von Karman vortex street oscillation
    const osc = Math.sin(dx * 0.08 - simTime * shedFreq);

    if (shapeId === 'box') {
      // Bluff body: strong separation, wide turbulent wake
      vy += wDecay * U * 0.85 * osc + wDecay * U * 0.35 * (Math.random() - 0.5);
      vx *= (1 - wDecay * 0.75);
    } else if (shapeId === 'airfoil') {
      // Streamlined: thin wake, minimal vortex shedding
      vy += wDecay * U * 0.03 * osc;
      vx *= (1 - wDecay * 0.03);
    } else if (shapeId === 'diamond') {
      // Sharp leading edge: strong separation at vertices
      vy += wDecay * U * 0.7 * osc + wDecay * U * 0.25 * (Math.random() - 0.5);
      vx *= (1 - wDecay * 0.6);
    } else {
      // Cylinder / sphere: classic Karman street
      vy += wDecay * U * 0.5 * osc + wDecay * U * 0.15 * (Math.random() - 0.5);
      vx *= (1 - wDecay * 0.5);
    }
  }
  return { vx, vy };
}

function getShapeR(shape) {
  if (shape.id === 'airfoil') return 20;
  if (shape.id === 'box')     return 48;
  return 42;
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function FluidSandboxPage({ onBack }) {
  const [tab, setTab] = useState('buoyancy');

  // ── Buoyancy ──
  const [fluidId, setFluidId]       = useState('water');
  const [selBlockId, setSelBlockId] = useState(null);
  const bCanvasRef = useRef(null);
  const bSimRef    = useRef({ blocks: [], dragging: null });
  const bRafRef    = useRef(null);
  const fluidRef   = useRef(FLUIDS[0]);
  const selIdRef   = useRef(null);
  // force re-render for UI readouts
  const [readout, setReadout] = useState(null);

  // ── Wind Tunnel ──
  const [windSpeed,      setWindSpeed]      = useState(180);
  const [shapeId,        setShapeId]        = useState('circle');
  const [showPressure,   setShowPressure]   = useState(true);
  const [showStreamlines,setShowStreamlines]= useState(true);
  const [mouseProbe, setMouseProbe] = useState(null);
  const wCanvasRef = useRef(null);
  const wSimRef    = useRef({ particles: [], bgDirty: true });
  const wRafRef    = useRef(null);
  const windRef    = useRef(180);
  const shapeRef   = useRef(SHAPES[0]);

  // Sync refs to state
  useEffect(() => {
    fluidRef.current = FLUIDS.find(f => f.id === fluidId) || FLUIDS[0];
  }, [fluidId]);
  useEffect(() => { windRef.current = windSpeed; }, [windSpeed]);
  useEffect(() => {
    shapeRef.current = SHAPES.find(s => s.id === shapeId) || SHAPES[0];
    wSimRef.current.bgDirty = true;
  }, [shapeId]);
  useEffect(() => { wSimRef.current.bgDirty = true; }, [showPressure]);
  useEffect(() => { selIdRef.current = selBlockId; }, [selBlockId]);

  const fluid = FLUIDS.find(f => f.id === fluidId) || FLUIDS[0];
  const shape = SHAPES.find(s => s.id === shapeId) || SHAPES[0];

  // ════════════════════════════════════════════════════════════════════
  //  BUOYANCY  —  Dynamic Water Level + Enhanced Visuals
  // ════════════════════════════════════════════════════════════════════

  // Layout (canvas 700 × 540)
  const TK_X = 72, TK_Y = 50, TK_W = 390, TK_H = 380;
  const FLUID_FILL = 0.75;            // base fill fraction (no blocks)
  const SC_X = TK_X + TK_W + 60;     // spring-scale centre x

  // Track bubbles & animation time in the sim ref
  if (!bSimRef.current.bubbles)  bSimRef.current.bubbles = [];
  if (!bSimRef.current.time)     bSimRef.current.time = 0;

  // ── Dynamic water level ──
  // When blocks are submerged, they displace px-area = w × submergedPx.
  // That displaced area, divided by tank width, gives the rise in px.
  function dynamicFluidTopPx() {
    const baseTop = TK_Y + TK_H * (1 - FLUID_FILL);
    const blocks  = bSimRef.current.blocks;
    let totalDisplacedArea = 0;
    const tankInnerW = TK_W - 4;
    for (const b of blocks) {
      const hh = b.mat.h / 2;
      // How many pixels of this block are below the *current estimated* surface?
      // We use the base level first, then iteratively converge (one pass is fine visually)
      const subPx = Math.max(0, Math.min(b.mat.h, (b.y + hh) - baseTop));
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

  const spawnBlock = useCallback((matId) => {
    const mat = MATERIALS.find(m => m.id === matId);
    if (!mat || bSimRef.current.blocks.length >= 7) return;
    const x = TK_X + TK_W / 2 + (Math.random() - 0.5) * (TK_W * 0.4);
    const newBlock = { id: Date.now(), mat, x, y: TK_Y + mat.h, vy: 0 };
    bSimRef.current.blocks.push(newBlock);
    bSimRef.current.selectedId = newBlock.id;
    selIdRef.current = newBlock.id;
    setSelBlockId(newBlock.id);
  }, []);

  const clearTank = useCallback(() => {
    bSimRef.current.blocks = [];
    bSimRef.current.bubbles = [];
    bSimRef.current.selectedId = null;
    selIdRef.current = null;
    setSelBlockId(null);
    setReadout(null);
  }, []);

  // ── Physics ──
  function bPhysicsStep(dt, fl) {
    const fTop    = dynamicFluidTopPx();
    const tankBot = TK_Y + TK_H - 4;
    const tankTop = TK_Y + 4;
    const sim = bSimRef.current;

    for (const b of sim.blocks) {
      if (b.dragging) continue;
      const hh = b.mat.h / 2;
      const sub = Math.max(0, Math.min(b.mat.h, (b.y + hh) - fTop));
      const subFrac = sub / b.mat.h;
      const accelG = G_SIM;
      const accelB = (fl.density / b.mat.density) * G_SIM * subFrac;
      const net    = accelG - accelB;
      // Viscous damping proportional to velocity and fluid viscosity
      const viscDamp = fl.viscFactor * 0.012;
      const damp   = b.vy * (0.5 + viscDamp);
      const oldVy  = b.vy;
      b.vy += (net - damp) * dt;
      b.vy  = Math.max(-800, Math.min(800, b.vy));
      b.y  += b.vy * dt;

      // Spawn bubbles when block enters water with velocity
      if (subFrac > 0.05 && Math.abs(oldVy) > 40) {
        const nBub = Math.floor(Math.abs(oldVy) / 60);
        for (let i = 0; i < Math.min(nBub, 3); i++) {
          sim.bubbles.push({
            x: b.x + (Math.random() - 0.5) * b.mat.w * 0.8,
            y: fTop + sub * Math.random(),
            r: 1.5 + Math.random() * 2.5,
            vy: -20 - Math.random() * 40,
            life: 1.0,
          });
        }
      }

      if (b.y + hh > tankBot) { b.y = tankBot - hh; b.vy = -b.vy * 0.12; }
      if (b.y - hh < tankTop) { b.y = tankTop + hh; b.vy = Math.max(0, b.vy); }

      // Block-to-block collision (simple vertical push-apart)
      for (const other of sim.blocks) {
        if (other === b) continue;
        const dx = Math.abs(b.x - other.x);
        const dy = Math.abs(b.y - other.y);
        const overlapX = (b.mat.w + other.mat.w) / 2 - dx;
        const overlapY = (b.mat.h + other.mat.h) / 2 - dy;
        if (overlapX > 0 && overlapY > 0) {
          const pushY = overlapY * 0.5 + 0.5;
          if (b.y < other.y) { b.y -= pushY * 0.3; other.y += pushY * 0.3; }
          else               { b.y += pushY * 0.3; other.y -= pushY * 0.3; }
        }
      }
    }

    // Update bubbles
    for (let i = sim.bubbles.length - 1; i >= 0; i--) {
      const bub = sim.bubbles[i];
      bub.y += bub.vy * dt;
      bub.x += Math.sin(bub.y * 0.1) * 0.3;
      bub.life -= dt * 0.8;
      if (bub.life <= 0 || bub.y < fTop - 5) {
        sim.bubbles.splice(i, 1);
      }
    }

    sim.time += dt;
  }

  // ── Rendering ──
  function bDrawFrame(canvas, fl) {
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const simTime = bSimRef.current.time;

    // Dark background with subtle grid
    const bgGrad = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W * 0.8);
    bgGrad.addColorStop(0, '#0a0c16');
    bgGrad.addColorStop(1, '#050610');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = 'rgba(255,255,255,0.02)';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 30) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 30) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

    // Tank body — glass walls
    ctx.save();
    const tankGrad = ctx.createLinearGradient(TK_X, TK_Y, TK_X, TK_Y + TK_H);
    tankGrad.addColorStop(0, 'rgba(8,14,28,0.95)');
    tankGrad.addColorStop(1, 'rgba(4,8,18,0.98)');
    ctx.fillStyle = tankGrad;
    ctx.fillRect(TK_X, TK_Y, TK_W, TK_H);

    // Glass wall highlights
    ctx.fillStyle = 'rgba(255,255,255,0.015)';
    ctx.fillRect(TK_X, TK_Y, 3, TK_H);
    ctx.fillRect(TK_X + TK_W - 3, TK_Y, 3, TK_H);
    ctx.restore();

    // Tank border (glass effect)
    ctx.strokeStyle = '#2a3650';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(TK_X, TK_Y, TK_W, TK_H);
    // Inner bevel highlight
    ctx.strokeStyle = 'rgba(100,140,200,0.08)';
    ctx.lineWidth = 1;
    ctx.strokeRect(TK_X + 1, TK_Y + 1, TK_W - 2, TK_H - 2);

    const fTop = dynamicFluidTopPx();
    const fH   = TK_Y + TK_H - fTop;

    // ── Fluid body ──
    ctx.save();
    ctx.beginPath(); ctx.rect(TK_X + 2, fTop, TK_W - 4, fH); ctx.clip();

    // Main fluid gradient
    const fGrad = ctx.createLinearGradient(TK_X, fTop, TK_X, TK_Y + TK_H);
    fGrad.addColorStop(0,    hexAlpha(fl.colorTop, fl.alpha * 0.85));
    fGrad.addColorStop(0.06, hexAlpha(fl.color,    fl.alpha * 0.95));
    fGrad.addColorStop(0.5,  hexAlpha(fl.color,    fl.alpha));
    fGrad.addColorStop(1,    hexAlpha(fl.color,    Math.min(1, fl.alpha + 0.15)));
    ctx.fillStyle = fGrad;
    ctx.fillRect(TK_X + 2, fTop, TK_W - 4, fH);

    // Caustic light rays (underwater shimmer)
    ctx.globalAlpha = 0.04;
    for (let i = 0; i < 6; i++) {
      const rx = TK_X + 20 + ((i * 67 + simTime * 15) % (TK_W - 40));
      const rw = 8 + Math.sin(simTime * 1.2 + i * 2) * 4;
      const cGrad = ctx.createLinearGradient(rx, fTop, rx, fTop + fH * 0.7);
      cGrad.addColorStop(0, 'rgba(255,255,255,0.8)');
      cGrad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = cGrad;
      ctx.fillRect(rx, fTop, rw, fH * 0.7);
    }
    ctx.globalAlpha = 1;

    ctx.restore();

    // ── Animated wave surface ──
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(TK_X + 2, fTop);
    for (let px = TK_X + 2; px <= TK_X + TK_W - 2; px += 2) {
      const nx = (px - TK_X) / TK_W;
      const wave = Math.sin(nx * Math.PI * 6 + simTime * 3) * 1.2
                 + Math.sin(nx * Math.PI * 10 + simTime * 5) * 0.5;
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

    // Surface highlight line
    ctx.beginPath();
    ctx.moveTo(TK_X + 2, fTop);
    for (let px = TK_X + 2; px <= TK_X + TK_W - 2; px += 2) {
      const nx = (px - TK_X) / TK_W;
      const wave = Math.sin(nx * Math.PI * 6 + simTime * 3) * 1.2
                 + Math.sin(nx * Math.PI * 10 + simTime * 5) * 0.5;
      ctx.lineTo(px, fTop + wave);
    }
    ctx.strokeStyle = hexAlpha(fl.colorTop, 0.9);
    ctx.lineWidth = 1.5;
    ctx.shadowBlur = 4;
    ctx.shadowColor = hexAlpha(fl.colorTop, 0.4);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Fluid label
    ctx.fillStyle = hexAlpha(fl.colorTop, 0.35);
    ctx.font = 'italic 11px "Montserrat", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`${fl.name}  ρ = ${fl.density} g/cm³`, TK_X + 10, fTop + 20);

    // ── Level markers (left wall) ──
    for (let i = 0; i <= 10; i++) {
      const my = TK_Y + TK_H - TK_H * i / 10;
      const maj = i % 5 === 0;
      ctx.beginPath();
      ctx.moveTo(TK_X + 3, my);
      ctx.lineTo(TK_X + (maj ? 16 : 9), my);
      ctx.strokeStyle = 'rgba(255,255,255,0.18)';
      ctx.lineWidth = maj ? 1.2 : 0.8;
      ctx.stroke();
      if (maj) {
        ctx.fillStyle = 'rgba(255,255,255,0.28)';
        ctx.font = '9px "JetBrains Mono", monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`${i * 10}`, TK_X + 19, my + 3);
      }
    }

    // Water-level-rise indicator arrow (right wall)
    const baseFTop = TK_Y + TK_H * (1 - FLUID_FILL);
    const rise = baseFTop - fTop;
    if (rise > 2) {
      const arrowX = TK_X + TK_W + 8;
      ctx.beginPath();
      ctx.moveTo(arrowX, baseFTop);
      ctx.lineTo(arrowX, fTop);
      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      // Arrowhead up
      ctx.beginPath();
      ctx.moveTo(arrowX - 4, fTop + 6);
      ctx.lineTo(arrowX, fTop);
      ctx.lineTo(arrowX + 4, fTop + 6);
      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      // Rise label
      ctx.fillStyle = '#22d3ee';
      ctx.font = 'bold 9px "Montserrat", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`+${rise.toFixed(1)}px`, arrowX + 6, (baseFTop + fTop) / 2 + 3);
    }

    // ── Draw bubbles ──
    for (const bub of bSimRef.current.bubbles) {
      ctx.beginPath();
      ctx.arc(bub.x, bub.y, bub.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(180,220,255,${bub.life * 0.3})`;
      ctx.fill();
      ctx.strokeStyle = `rgba(200,235,255,${bub.life * 0.25})`;
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }

    // ── Blocks: non-selected first, then selected on top ──
    const blocks = bSimRef.current.blocks;
    const selId  = selIdRef.current;
    for (const b of blocks) { if (b.id !== selId) bDrawBlock(ctx, b, fl, false, fTop); }
    const sel = blocks.find(b => b.id === selId);
    if (sel) bDrawBlock(ctx, sel, fl, true, fTop);

    // ── Force vectors on selected block ──
    if (sel) {
      const subFrac = computeSubFrac(sel, fTop);
      const wt   = bWeight(sel.mat);
      const buoyF = bBuoy(sel.mat, fl, subFrac);
      const maxF  = Math.max(wt, buoyF, 0.001);
      const arrowScale = 60;

      // Weight arrow (red, downward)
      const wtLen = (wt / maxF) * arrowScale;
      const bCx = sel.x, bCy = sel.y + sel.mat.h / 2;
      ctx.beginPath();
      ctx.moveTo(bCx - 12, bCy + 2);
      ctx.lineTo(bCx - 12, bCy + 2 + wtLen);
      ctx.strokeStyle = '#FF6B6B'; ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(bCx - 12, bCy + 2 + wtLen);
      ctx.lineTo(bCx - 16, bCy + 2 + wtLen - 6);
      ctx.lineTo(bCx - 8, bCy + 2 + wtLen - 6);
      ctx.closePath();
      ctx.fillStyle = '#FF6B6B'; ctx.fill();
      ctx.fillStyle = '#FF6B6B';
      ctx.font = 'bold 8px "Montserrat", sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`W=${wt.toFixed(3)}N`, bCx - 18, bCy + 2 + wtLen / 2 + 3);

      // Buoyancy arrow (blue, upward) — only if submerged
      if (subFrac > 0.001) {
        const buoyLen = (buoyF / maxF) * arrowScale;
        ctx.beginPath();
        ctx.moveTo(bCx + 12, bCy + 2);
        ctx.lineTo(bCx + 12, bCy + 2 - buoyLen);
        ctx.strokeStyle = '#60a5fa'; ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(bCx + 12, bCy + 2 - buoyLen);
        ctx.lineTo(bCx + 8, bCy + 2 - buoyLen + 6);
        ctx.lineTo(bCx + 16, bCy + 2 - buoyLen + 6);
        ctx.closePath();
        ctx.fillStyle = '#60a5fa'; ctx.fill();
        ctx.fillStyle = '#60a5fa';
        ctx.font = 'bold 8px "Montserrat", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`Fb=${buoyF.toFixed(3)}N`, bCx + 18, bCy + 2 - buoyLen / 2 + 3);
      }
    }

    // Spring scale
    bDrawScale(ctx, sel, fl, fTop);

    // Title
    ctx.fillStyle = 'rgba(255,255,255,0.14)';
    ctx.font = 'bold 11px "Montserrat", sans-serif';
    ctx.textAlign = 'center';
    ctx.letterSpacing = '0.1em';
    ctx.fillText('ARCHIMEDES\' BUOYANCY TANK', TK_X + TK_W / 2, TK_Y - 10);
  }

  function bDrawBlock(ctx, block, fl, isSelected, fTop) {
    const { mat, x, y } = block;
    const hw = mat.w / 2, hh = mat.h / 2;
    const bLeft = x - hw, bTop = y - hh;
    const sub     = Math.max(0, Math.min(mat.h, (y + hh) - fTop));
    const subFrac = sub / mat.h;
    const dryH    = mat.h * (1 - subFrac);
    const wetH    = mat.h * subFrac;
    const r       = 4; // corner radius

    ctx.save();
    ctx.beginPath(); ctx.rect(TK_X + 2, TK_Y + 2, TK_W - 4, TK_H - 4); ctx.clip();

    // Drop shadow
    ctx.shadowBlur = isSelected ? 18 : 8;
    ctx.shadowColor = isSelected ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.5)';
    ctx.shadowOffsetX = 2; ctx.shadowOffsetY = 3;
    roundRect(ctx, bLeft, bTop, mat.w, mat.h, r);
    ctx.fillStyle = 'rgba(0,0,0,0.01)';
    ctx.fill();
    ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;

    // Dry part
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
      // 3D highlight bevel
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      ctx.fillRect(bLeft, bTop, mat.w, 2);
      ctx.fillStyle = '#2A3441';
      ctx.fillRect(bLeft, bTop, 2, dryH);
      ctx.restore();
    }

    // Wet part
    if (wetH > 0) {
      ctx.save();
      ctx.beginPath();
      roundRect(ctx, bLeft, bTop, mat.w, mat.h, r);
      ctx.clip();
      const wetTop = bTop + dryH;
      const g2 = ctx.createLinearGradient(bLeft, wetTop, bLeft + mat.w, wetTop + wetH);
      g2.addColorStop(0, blend(mat.color, fl.color, 0.30));
      g2.addColorStop(0.5, blend(mat.color, fl.color, 0.42));
      g2.addColorStop(1, blend(mat.color, fl.color, 0.55));
      ctx.fillStyle = g2;
      ctx.fillRect(bLeft, wetTop, mat.w, wetH);
      // Underwater shimmer overlay
      ctx.fillStyle = hexAlpha(fl.colorTop, 0.10);
      ctx.fillRect(bLeft, wetTop, mat.w, wetH);
      ctx.restore();
    }

    // Border
    ctx.beginPath();
    roundRect(ctx, bLeft, bTop, mat.w, mat.h, r);
    if (isSelected) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth   = 2;
      ctx.shadowBlur = 12;
      ctx.shadowColor = 'rgba(255,255,255,0.4)';
    } else {
      ctx.strokeStyle = mat.stroke;
      ctx.lineWidth   = 1.5;
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Label
    ctx.fillStyle = isSelected ? '#ffffff' : 'rgba(255,255,255,0.78)';
    ctx.font = `bold ${Math.max(8, Math.min(11, mat.h / 3.5))}px "Montserrat", sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(mat.name, x, y - 1);
    // Density sub-label
    ctx.fillStyle = isSelected ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.30)';
    ctx.font = `${Math.max(7, Math.min(9, mat.h / 5))}px "JetBrains Mono", monospace`;
    ctx.fillText(`${mat.density}`, x, y + Math.max(7, mat.h / 4));

    ctx.restore();
  }

  function bDrawScale(ctx, block, fl, fTop) {
    const sx = SC_X;
    const mountY = TK_Y;

    // Mount bracket
    ctx.fillStyle = '#1a2538';
    roundRect(ctx, sx - 40, mountY - 14, 80, 16, 4);
    ctx.fill();
    ctx.strokeStyle = '#2d4060'; ctx.lineWidth = 1;
    roundRect(ctx, sx - 40, mountY - 14, 80, 16, 4);
    ctx.stroke();
    ctx.fillStyle = '#3a5070';
    ctx.fillRect(sx - 3, mountY + 2, 6, 22);

    const hookY = mountY + 24;
    const appW  = block ? bApparent(block.mat, fl, computeSubFrac(block, fTop)) : 0;
    const maxW  = block ? Math.max(bWeight(block.mat), 0.001) : 1;
    const baseLen = 85, maxExt = 105;
    const ext   = block ? Math.max(0, (Math.abs(appW) / maxW) * maxExt) : 0;
    const springLen = baseLen + ext;
    const panY  = hookY + springLen;

    // Coil spring with glow
    const coils = 11;
    ctx.beginPath(); ctx.moveTo(sx, hookY);
    for (let i = 0; i <= coils * 2; i++) {
      const t    = i / (coils * 2);
      const side = (i % 2 === 0 ? 1 : -1) * 10;
      ctx.lineTo(sx + side, hookY + springLen * t);
    }
    ctx.lineTo(sx, panY);
    ctx.strokeStyle = '#60a5fa'; ctx.lineWidth = 2;
    ctx.shadowBlur = 6; ctx.shadowColor = '#3b82f680';
    ctx.stroke(); ctx.shadowBlur = 0;

    // Pan
    ctx.beginPath();
    ctx.moveTo(sx - 26, panY); ctx.lineTo(sx + 26, panY);
    ctx.strokeStyle = '#8899aa'; ctx.lineWidth = 3;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(sx - 26, panY); ctx.lineTo(sx - 20, panY + 5);
    ctx.lineTo(sx + 20, panY + 5); ctx.lineTo(sx + 26, panY);
    ctx.strokeStyle = '#556677'; ctx.lineWidth = 1;
    ctx.stroke();

    // Mini block on pan
    if (block) {
      const sc  = 0.5;
      const mw  = block.mat.w * sc, mh = block.mat.h * sc;
      roundRect(ctx, sx - mw / 2, panY - mh + 1, mw, mh, 3);
      ctx.fillStyle   = block.mat.color;
      ctx.fill();
      ctx.strokeStyle = block.mat.stroke;
      ctx.lineWidth   = 1;
      ctx.stroke();
      ctx.fillStyle    = 'rgba(255,255,255,0.65)';
      ctx.font         = 'bold 7px "Montserrat", sans-serif';
      ctx.textAlign    = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(block.mat.name, sx, panY - mh / 2 + 1);
    }

    // Readout panel
    const boxY = panY + 16;
    const boxW = 136, boxH = 130;
    ctx.fillStyle = 'rgba(8,14,26,0.94)';
    roundRect(ctx, sx - boxW / 2, boxY, boxW, boxH, 8);
    ctx.fill();
    ctx.strokeStyle = '#1a3050'; ctx.lineWidth = 1;
    roundRect(ctx, sx - boxW / 2, boxY, boxW, boxH, 8);
    ctx.stroke();
    // Inner top glow line
    ctx.strokeStyle = 'rgba(96,165,250,0.12)'; ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(sx - boxW / 2 + 8, boxY + 1);
    ctx.lineTo(sx + boxW / 2 - 8, boxY + 1);
    ctx.stroke();

    ctx.textAlign = 'center';

    if (block) {
      const subFrac  = computeSubFrac(block, fTop);
      const wt       = bWeight(block.mat);
      const buoyF    = bBuoy(block.mat, fl, subFrac);
      const appWt    = bApparent(block.mat, fl, subFrac);
      const floats   = appWt < -0.00005;
      const neutral  = Math.abs(appWt) <= 0.00005;

      ctx.fillStyle = '#5a6a7a'; ctx.font = '9px "Montserrat", sans-serif';
      ctx.fillText('Weight (in air)', sx, boxY + 16);
      ctx.fillStyle = '#f1f5f9'; ctx.font = 'bold 12px "JetBrains Mono", monospace';
      ctx.fillText(`${wt.toFixed(4)} N`, sx, boxY + 30);

      ctx.fillStyle = '#5a6a7a'; ctx.font = '9px "Montserrat", sans-serif';
      ctx.fillText('Buoyant force', sx, boxY + 46);
      ctx.fillStyle = '#60a5fa'; ctx.font = 'bold 12px "JetBrains Mono", monospace';
      ctx.fillText(`${buoyF.toFixed(4)} N`, sx, boxY + 60);

      ctx.fillStyle = '#5a6a7a'; ctx.font = '9px "Montserrat", sans-serif';
      ctx.fillText('Apparent weight', sx, boxY + 76);
      ctx.fillStyle = floats ? '#86efac' : neutral ? '#FFD166' : '#fca5a5';
      ctx.font = 'bold 13px "JetBrains Mono", monospace';
      ctx.fillText(`${appWt >= 0 ? '' : '−'}${Math.abs(appWt).toFixed(4)} N`, sx, boxY + 92);

      // Float/sink badge
      const tag    = floats ? '↑ FLOATS' : neutral ? '◆ NEUTRAL' : '↓ SINKS';
      const tagCol = floats ? '#86efac' : neutral ? '#FFD166' : '#FF6B6B';
      const tagBg  = floats ? 'rgba(134,239,172,0.10)' : neutral ? 'rgba(255, 209, 102,0.10)' : 'rgba(248,113,113,0.10)';
      roundRect(ctx, sx - 36, boxY + 102, 72, 18, 4);
      ctx.fillStyle = tagBg; ctx.fill();
      ctx.strokeStyle = floats ? 'rgba(134,239,172,0.25)' : neutral ? 'rgba(255, 209, 102,0.25)' : 'rgba(248,113,113,0.25)';
      ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = tagCol;
      ctx.font = 'bold 9px "Montserrat", sans-serif';
      ctx.fillText(tag, sx, boxY + 114);
    } else {
      ctx.fillStyle = '#334050'; ctx.font = '11px "Montserrat", sans-serif';
      ctx.fillText('Select a block', sx, boxY + 52);
      ctx.fillText('to measure', sx, boxY + 68);
    }

    // Scale title
    ctx.fillStyle = 'rgba(148,163,184,0.4)';
    ctx.font = '9px "Montserrat", sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('⚖  SPRING SCALE', sx, TK_Y - 2);
  }

  // Buoyancy mouse helpers
  function bHitTest(sx, sy) {
    const blocks = bSimRef.current.blocks;
    for (let i = blocks.length - 1; i >= 0; i--) {
      const b  = blocks[i];
      const hw = b.mat.w / 2, hh = b.mat.h / 2;
      if (sx >= b.x - hw && sx <= b.x + hw && sy >= b.y - hh && sy <= b.y + hh) return b;
    }
    return null;
  }

  const onBPointerDown = useCallback((e) => {
    const canvas = bCanvasRef.current;
    const rect   = canvas.getBoundingClientRect();
    const scaleX = canvas.width  / rect.width;
    const scaleY = canvas.height / rect.height;
    const sx = (e.clientX - rect.left) * scaleX;
    const sy = (e.clientY - rect.top)  * scaleY;
    const hit = bHitTest(sx, sy);
    if (hit) {
      bSimRef.current.dragging = { block: hit, offX: sx - hit.x, offY: sy - hit.y };
      hit.dragging = true;
      selIdRef.current = hit.id;
      setSelBlockId(hit.id);
    } else {
      selIdRef.current = null;
      setSelBlockId(null);
    }
  }, []);

  const onBPointerMove = useCallback((e) => {
    const d = bSimRef.current.dragging;
    if (!d) return;
    const canvas = bCanvasRef.current;
    const rect   = canvas.getBoundingClientRect();
    const scaleX = canvas.width  / rect.width;
    const scaleY = canvas.height / rect.height;
    const sx = (e.clientX - rect.left) * scaleX;
    const sy = (e.clientY - rect.top)  * scaleY;
    d.block.x  = sx - d.offX;
    d.block.y  = sy - d.offY;
    d.block.vy = 0;
    // clamp inside tank
    const hw = d.block.mat.w / 2, hh = d.block.mat.h / 2;
    d.block.x = Math.max(TK_X + hw + 2, Math.min(TK_X + TK_W - hw - 2, d.block.x));
    d.block.y = Math.max(TK_Y + hh + 2, Math.min(TK_Y + TK_H - hh - 2, d.block.y));
  }, []);

  const onBPointerUp = useCallback(() => {
    if (bSimRef.current.dragging) {
      bSimRef.current.dragging.block.dragging = false;
      bSimRef.current.dragging = null;
    }
  }, []);

  // Buoyancy RAF
  useEffect(() => {
    if (tab !== 'buoyancy') return;
    const canvas = bCanvasRef.current;
    if (!canvas) return;
    canvas.width  = 700;
    canvas.height = 540;

    let last = performance.now();
    let running = true;

    function tick(now) {
      if (!running) return;
      const dt = Math.min((now - last) / 1000, 0.033);
      last = now;
      bPhysicsStep(dt, fluidRef.current);
      bDrawFrame(canvas, fluidRef.current);
      // Update readout for selected block
      const selB = bSimRef.current.blocks.find(b => b.id === selIdRef.current);
      if (selB) {
        const fTop = dynamicFluidTopPx();
        const sub  = computeSubFrac(selB, fTop);
        setReadout({
          wt:   bWeight(selB.mat),
          buoy: bBuoy(selB.mat, fluidRef.current, sub),
          app:  bApparent(selB.mat, fluidRef.current, sub),
          sub,
        });
      } else {
        setReadout(null);
      }
      bRafRef.current = requestAnimationFrame(tick);
    }
    bRafRef.current = requestAnimationFrame(tick);
    return () => { running = false; cancelAnimationFrame(bRafRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  // ════════════════════════════════════════════════════════════════════
  //  WIND TUNNEL
  // ════════════════════════════════════════════════════════════════════

  const TN_TOP = 45, TN_BOT = 405, TN_LEFT = 20, TN_RIGHT = 680;
  const OBJ_CX = 280, OBJ_CY = 225;
  const N_PARTICLES = 300;

  function initParticle() {
    return {
      x: TN_LEFT - Math.random() * 30,
      y: TN_TOP + Math.random() * (TN_BOT - TN_TOP),
      trail: [],
    };
  }

  function drawTunnelShape(ctx, shape, cx, cy) {
    ctx.save();
    ctx.translate(cx, cy);

    if (shape.id === 'circle' || shape.id === 'sphere3d') {
      const R = 42;
      if (shape.id === 'sphere3d') {
        // 3D shading
        const g = ctx.createRadialGradient(-R*0.3, -R*0.3, R*0.05, 0, 0, R);
        g.addColorStop(0, '#d0d8e8');
        g.addColorStop(0.4,'#7090b0');
        g.addColorStop(1, '#1a2a3a');
        ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI*2);
        ctx.fillStyle = g; ctx.fill();
        ctx.strokeStyle = '#3a5070'; ctx.lineWidth = 1.5;
        ctx.stroke();
        // highlight
        const hg = ctx.createRadialGradient(-R*0.3, -R*0.3, 0, -R*0.28, -R*0.28, R*0.45);
        hg.addColorStop(0, 'rgba(255,255,255,0.55)');
        hg.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI*2);
        ctx.fillStyle = hg; ctx.fill();
      } else {
        const g = ctx.createLinearGradient(-R, -R, R, R);
        g.addColorStop(0, '#5090c0'); g.addColorStop(1, '#1a3a5a');
        ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI*2);
        ctx.fillStyle = g; ctx.fill();
        ctx.strokeStyle = '#4a80aa'; ctx.lineWidth = 1.5; ctx.stroke();
      }

    } else if (shape.id === 'box') {
      const w = 50, h = 90;
      const g = ctx.createLinearGradient(-w/2, -h/2, w/2, h/2);
      g.addColorStop(0, '#8080a0'); g.addColorStop(1, '#282838');
      ctx.fillStyle = g;
      ctx.fillRect(-w/2, -h/2, w, h);
      ctx.strokeStyle = '#6060a0'; ctx.lineWidth = 1.5;
      ctx.strokeRect(-w/2, -h/2, w, h);

    } else if (shape.id === 'airfoil') {
      const W = 110, H = 28;
      ctx.beginPath();
      ctx.moveTo(-W/2, 0);
      ctx.bezierCurveTo(-W/2 + W*0.3, -H*0.6, W/2 - W*0.2, -H*0.5, W/2, 0);
      ctx.bezierCurveTo(W/2 - W*0.15, H*0.3, -W/2 + W*0.25, H*0.2, -W/2, 0);
      ctx.closePath();
      const g = ctx.createLinearGradient(-W/2, -H, W/2, H);
      g.addColorStop(0, '#a0c8f0'); g.addColorStop(1, '#2060a0');
      ctx.fillStyle = g; ctx.fill();
      ctx.strokeStyle = '#5090d0'; ctx.lineWidth = 1.5; ctx.stroke();

    } else if (shape.id === 'diamond') {
      const R = 42;
      ctx.beginPath();
      ctx.moveTo(0, -R); ctx.lineTo(R, 0); ctx.lineTo(0, R); ctx.lineTo(-R, 0);
      ctx.closePath();
      const g = ctx.createLinearGradient(-R, -R, R, R);
      g.addColorStop(0, '#c060a0'); g.addColorStop(1, '#401028');
      ctx.fillStyle = g; ctx.fill();
      ctx.strokeStyle = '#a04080'; ctx.lineWidth = 1.5; ctx.stroke();
    }

    ctx.restore();
  }

  // Precompute background pressure/velocity heatmap
  function buildBgImageData(canvas, U, shape) {
    const iw = Math.floor((TN_RIGHT - TN_LEFT) / 4);
    const ih = Math.floor((TN_BOT   - TN_TOP)  / 4);
    const R  = getShapeR(shape);
    const data = new Uint8ClampedArray(iw * ih * 4);
    const cx = OBJ_CX - TN_LEFT, cy = OBJ_CY - TN_TOP;

    for (let j = 0; j < ih; j++) {
      for (let i = 0; i < iw; i++) {
        const px = i * 4, py = j * 4;
        const { vx, vy } = velField(TN_LEFT + px, TN_TOP + py, OBJ_CX, OBJ_CY, R, U, shape ? shape.id : "circle", 0);
        const speed  = Math.sqrt(vx*vx + vy*vy);
        const [r, g, b] = velColor(speed, U * 2.2);
        const idx = (j * iw + i) * 4;
        data[idx]   = r; data[idx+1] = g; data[idx+2] = b; data[idx+3] = 60;
      }
    }
    return { iw, ih, data };
  }

  function wDrawFrame(canvas, U, shape, showPres, showSL, simTime, mouseProbe) {
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // bg
    ctx.fillStyle = '#06080f';
    ctx.fillRect(0, 0, W, H);

    // grid
    ctx.strokeStyle = 'rgba(255,255,255,0.025)';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 28) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
    for (let y = 0; y < H; y += 28) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }

    // pressure background
    if (showPres && wSimRef.current.bgCache) {
      const { iw, ih, data } = wSimRef.current.bgCache;
      const offCanvas = new OffscreenCanvas(iw, ih);
      const offCtx    = offCanvas.getContext('2d');
      const imgData   = offCtx.createImageData(iw, ih);
      imgData.data.set(data);
      offCtx.putImageData(imgData, 0, 0);
      ctx.drawImage(offCanvas, TN_LEFT, TN_TOP, TN_RIGHT - TN_LEFT, TN_BOT - TN_TOP);
    }

    // tunnel walls
    ctx.fillStyle   = 'rgba(255,255,255,0.04)';
    ctx.fillRect(TN_LEFT, 0, TN_RIGHT - TN_LEFT, TN_TOP);
    ctx.fillRect(TN_LEFT, TN_BOT, TN_RIGHT - TN_LEFT, H - TN_BOT);
    ctx.strokeStyle = '#3a4a60'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(TN_LEFT, TN_TOP); ctx.lineTo(TN_RIGHT, TN_TOP); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(TN_LEFT, TN_BOT); ctx.lineTo(TN_RIGHT, TN_BOT); ctx.stroke();

    // inlet arrows
    for (let y = TN_TOP + 20; y < TN_BOT; y += 38) {
      const lenY = OBJ_CY - y;
      const dist = Math.sqrt((TN_LEFT - OBJ_CX)**2 + lenY**2);
      const speed = Math.min(1, U / (U + 20));
      const arrowLen = 18 + speed * 10;
      ctx.beginPath();
      ctx.moveTo(TN_LEFT + 5, y);
      ctx.lineTo(TN_LEFT + 5 + arrowLen, y);
      ctx.strokeStyle = `rgba(96,165,250,${0.3 + speed * 0.3})`;
      ctx.lineWidth = 1;
      ctx.stroke();
      // arrowhead
      ctx.beginPath();
      ctx.moveTo(TN_LEFT + 5 + arrowLen, y);
      ctx.lineTo(TN_LEFT + 5 + arrowLen - 5, y - 3);
      ctx.lineTo(TN_LEFT + 5 + arrowLen - 5, y + 3);
      ctx.closePath();
      ctx.fillStyle = `rgba(96,165,250,${0.3 + speed * 0.3})`;
      ctx.fill();
    }

    // streamlines
    if (showSL) {
      const R = getShapeR(shape);
      const nLines = 12;
      for (let si = 0; si < nLines; si++) {
        const startY = TN_TOP + 15 + (si / (nLines - 1)) * (TN_BOT - TN_TOP - 30);
        ctx.beginPath();
        let px = TN_LEFT + 5, py = startY;
        ctx.moveTo(px, py);
        for (let step = 0; step < 200; step++) {
          const { vx, vy } = velField(px, py, OBJ_CX, OBJ_CY, R, U, shape ? shape.id : "circle", simTime);
          const speed = Math.sqrt(vx*vx + vy*vy);
          if (speed < 0.1) break;
          const dt = 3 / speed;
          px += vx * dt; py += vy * dt;
          if (px > TN_RIGHT + 10 || py < TN_TOP - 5 || py > TN_BOT + 5) break;
          const dx = px - OBJ_CX, dy = py - OBJ_CY;
          if (dx*dx + dy*dy < R*R) break;
          ctx.lineTo(px, py);
        }
        const norm = si / (nLines - 1);
        ctx.strokeStyle = `rgba(${Math.round(60+norm*100)},${Math.round(150-norm*80)},${Math.round(255-norm*100)},0.35)`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    // particles
    const R = getShapeR(shape);
    for (const p of wSimRef.current.particles) {
      const { vx, vy } = velField(p.x, p.y, OBJ_CX, OBJ_CY, R, U, shape.id, simTime);
      const speed = Math.sqrt(vx*vx + vy*vy);
      const [r,g,b] = velColor(speed, U * 2.2);

      if (p.trail.length > 1) {
        ctx.beginPath();
        ctx.moveTo(p.trail[0].x, p.trail[0].y);
        for (let ti = 1; ti < p.trail.length; ti++) ctx.lineTo(p.trail[ti].x, p.trail[ti].y);
        ctx.strokeStyle = `rgba(${r},${g},${b},0.0)`;
        
        const grad = ctx.createLinearGradient(p.trail[0].x, p.trail[0].y, p.x, p.y);
        grad.addColorStop(0, `rgba(${r},${g},${b},0.0)`);
        grad.addColorStop(1, `rgba(${r},${g},${b},0.6)`);
        ctx.strokeStyle = grad;
        
        ctx.lineWidth = 1.5;
        ctx.shadowBlur = 6;
        ctx.shadowColor = `rgba(${r},${g},${b},0.4)`;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
      
      ctx.beginPath(); ctx.arc(p.x, p.y, 1.8, 0, Math.PI*2);
      ctx.fillStyle = `rgba(255,255,255,0.9)`;
      ctx.shadowBlur = 8;
      ctx.shadowColor = `rgba(${r},${g},${b},1)`;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
    
    // Draw mouse probe
    if (mouseProbe && mouseProbe.active) {
      const { vx: probeVx, vy: probeVy } = velField(mouseProbe.x, mouseProbe.y, OBJ_CX, OBJ_CY, R, U, shape.id, simTime);
      const probeSpd = Math.sqrt(probeVx*probeVx + probeVy*probeVy);
      
      ctx.beginPath();
      ctx.arc(mouseProbe.x, mouseProbe.y, 4, 0, Math.PI*2);
      ctx.strokeStyle = '#4FC3F7';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      const arrowLen = Math.min(60, probeSpd * 0.2);
      if (arrowLen > 2) {
        const normX = probeVx / probeSpd, normY = probeVy / probeSpd;
        ctx.beginPath();
        ctx.moveTo(mouseProbe.x, mouseProbe.y);
        ctx.lineTo(mouseProbe.x + normX * arrowLen, mouseProbe.y + normY * arrowLen);
        ctx.strokeStyle = '#FFD166'; ctx.lineWidth = 2;
        ctx.stroke();
      }
      
      ctx.fillStyle = '#E6EDF3';
      ctx.font = 'bold 12px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`${(probeSpd * 0.1).toFixed(1)} m/s`, mouseProbe.x + 10, mouseProbe.y - 10);
    }
    
    drawTunnelShape(ctx, shape, OBJ_CX, OBJ_CY);  }

  // Wind tunnel RAF
  useEffect(() => {
    if (tab !== 'tunnel') return;
    const canvas = wCanvasRef.current;
    if (!canvas) return;
    canvas.width  = 710;
    canvas.height = 460;

    // Initialise particles
    const sim = wSimRef.current;
    if (sim.particles.length < N_PARTICLES) {
      sim.particles = Array.from({ length: N_PARTICLES }, initParticle);
    }
    sim.bgDirty = true;

    let last    = performance.now();
    let running = true;
    let simTime = 0;

    function tick(now) {
      if (!running) return;
      const dt = Math.min((now - last) / 1000, 0.033);
      last = now;
      simTime += dt * 3;

      const U  = windRef.current;
      const sh = shapeRef.current;
      const R  = getShapeR(sh);

      // Rebuild background heatmap when dirty
      if (sim.bgDirty) {
        sim.bgCache = buildBgImageData(canvas, U, sh);
        sim.bgDirty = false;
      }

      // Update particles
      for (const p of sim.particles) {
        p.trail.push({ x: p.x, y: p.y });
        if (p.trail.length > 9) p.trail.shift();

        const { vx, vy } = velField(p.x, p.y, OBJ_CX, OBJ_CY, R, U, shape ? shape.id : "circle", simTime);
        p.x += vx * dt;
        p.y += vy * dt;

        const dx = p.x - OBJ_CX, dy = p.y - OBJ_CY;
        const reset = p.x > TN_RIGHT + 20 || p.x < TN_LEFT - 40
                   || p.y < TN_TOP - 5    || p.y > TN_BOT + 5
                   || dx*dx + dy*dy < R*R * 0.98;
        if (reset) {
          p.x = TN_LEFT - Math.random() * 25;
          p.y = TN_TOP + Math.random() * (TN_BOT - TN_TOP);
          p.trail = [];
        }
      }

      wDrawFrame(canvas, U, sh, showPressure, showStreamlines, simTime, mouseProbe);
      wRafRef.current = requestAnimationFrame(tick);
    }
    wRafRef.current = requestAnimationFrame(tick);
    return () => { running = false; cancelAnimationFrame(wRafRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, showPressure, showStreamlines]);

  // ════════════════════════════════════════════════════════════════════
  //  RENDER
  // ════════════════════════════════════════════════════════════════════

  const selBlock = bSimRef.current.blocks.find(b => b.id === selBlockId);

  return (
    <div style={{ display:'flex', flexDirection:'column', width:'100vw', height:'100vh', background:'#07080f', color:'#e2e8f0', fontFamily:'var(--font)', overflow:'hidden' }}>

      {/* ── Header ── */}
      <div style={{ display:'flex', alignItems:'center', gap:16, padding:'10px 18px', borderBottom:'1px solid rgba(255,255,255,0.07)', background:'rgba(14,14,22,0.8)', flexShrink:0 }}>
        <button
          onClick={onBack}
          style={{ background:'#2A3441', border:'1px solid rgba(255,255,255,0.1)', color:'#a1a1aa', padding:'5px 14px', borderRadius:8, cursor:'pointer', fontSize:13 }}
        >← Back</button>
        <span style={{ fontWeight:700, fontSize:16, letterSpacing:'0.05em', color:'#e2e8f0' }}>FLUID DYNAMICS LAB</span>
        <div style={{ display:'flex', gap:4, marginLeft:'auto' }}>
          {['buoyancy','tunnel'].map(t => (
            <button key={t}
              onClick={() => setTab(t)}
              style={{
                padding:'5px 18px', borderRadius:8, fontSize:13, cursor:'pointer', fontWeight:600,
                background: tab===t ? 'rgba(96,165,250,0.2)' : 'rgba(255,255,255,0.04)',
                border:     tab===t ? '1px solid rgba(96,165,250,0.5)' : '1px solid rgba(255,255,255,0.08)',
                color:      tab===t ? '#93c5fd' : '#71717a',
              }}
            >{ t === 'buoyancy' ? '⚗ Buoyancy Lab' : '💨 Wind Tunnel' }</button>
          ))}
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ display:'flex', flex:1, overflow:'hidden' }}>

        {/* Canvas area */}
        <div style={{ flex:1, position:'relative', display:'flex', alignItems:'center', justifyContent:'center', minWidth:0 }}>
          <canvas ref={bCanvasRef}
            style={{ display: tab==='buoyancy'?'block':'none', maxWidth:'100%', maxHeight:'100%', cursor:'grab' }}
            onPointerDown={onBPointerDown}
            onPointerMove={onBPointerMove}
            onPointerUp={onBPointerUp}
            onPointerLeave={onBPointerUp}
          />
                    <canvas ref={wCanvasRef}
            style={{ display: tab==='tunnel'?'block':'none', maxWidth:'100%', maxHeight:'100%', cursor:'crosshair' }}
            onMouseMove={e => {
              if(tab !== 'tunnel') return;
              const bounds = e.target.getBoundingClientRect();
              const scaleX = e.target.width / bounds.width;
              const scaleY = e.target.height / bounds.height;
              setMouseProbe({ x: (e.clientX - bounds.left)*scaleX, y: (e.clientY - bounds.top)*scaleY, active:true });
            }}
            onMouseLeave={() => setMouseProbe(null)}
          />
        </div>

        {/* ── Right controls panel ── */}
        <div style={{ width:220, flexShrink:0, borderLeft:'1px solid rgba(255,255,255,0.07)', background:'rgba(10,12,22,0.9)', overflowY:'auto', padding:14, display:'flex', flexDirection:'column', gap:14 }}>

          {tab === 'buoyancy' && (<>
            {/* Fluid selector */}
            <div>
              <div style={{ fontSize:11, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:7 }}>Fluid</div>
              <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                {FLUIDS.map(fl => (
                  <button key={fl.id}
                    onClick={() => setFluidId(fl.id)}
                    style={{
                      display:'flex', alignItems:'center', gap:8,
                      padding:'5px 9px', borderRadius:7, cursor:'pointer',
                      background: fluidId===fl.id ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.03)',
                      border: fluidId===fl.id ? `1px solid ${fl.colorTop}50` : '1px solid #2A3441',
                      color: fluidId===fl.id ? '#f1f5f9' : '#94a3b8',
                    }}
                  >
                    <div style={{ width:14, height:14, borderRadius:3, background:fl.color, border:`1px solid ${fl.colorTop}`, flexShrink:0 }} />
                    <span style={{ fontSize:12, fontWeight: fluidId===fl.id ? 600 : 400 }}>{fl.name}</span>
                    <span style={{ fontSize:10, color:'#475569', marginLeft:'auto' }}>{fl.density}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Add blocks */}
            <div>
              <div style={{ fontSize:11, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:7 }}>Add Block</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                {MATERIALS.map(mat => (
                  <button key={mat.id}
                    onClick={() => spawnBlock(mat.id)}
                    title={`ρ = ${mat.density} g/cm³`}
                    style={{
                      padding:'4px 7px', borderRadius:6, cursor:'pointer', fontSize:11,
                      background:`${mat.color}22`,
                      border:`1px solid ${mat.color}55`,
                      color: '#e2e8f0',
                    }}
                  >{mat.name}</button>
                ))}
              </div>
              <button
                onClick={clearTank}
                style={{ marginTop:8, width:'100%', padding:'5px', borderRadius:7, cursor:'pointer', fontSize:12, background:'rgba(255, 107, 107,0.10)', border:'1px solid rgba(255, 107, 107,0.25)', color:'#FF6B6B' }}
              >Clear Tank</button>
            </div>

            {/* Measurements for selected block */}
            {selBlock && readout && (
              <div>
                <div style={{ fontSize:12, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:7 }}>Measurements</div>
                <div style={{ background:'rgba(15,23,42,0.8)', border:'1px solid #1e3a5f', borderRadius:8, padding:10, display:'flex', flexDirection:'column', gap:6 }}>
                  <MeasRow label="Material"   value={selBlock.mat.name} />
                  <MeasRow label="Density"    value={`${selBlock.mat.density} g/cm³`} />
                  <MeasRow label="Fluid ρ"    value={`${fluid.density} g/cm³`} />
                  <div style={{ height:1, background:'#2A3441' }} />
                  <MeasRow label="Weight"        value={`${readout.wt.toFixed(4)} N`} />
                  <MeasRow label="Buoyancy"      value={`${readout.buoy.toFixed(4)} N`} color="#60a5fa" />
                  <MeasRow label="Apparent wt"   value={`${readout.app >= 0 ? '' : '−'}${Math.abs(readout.app).toFixed(4)} N`}
                    color={readout.app < -0.00005 ? '#86efac' : Math.abs(readout.app) < 0.00005 ? '#FFD166' : '#fca5a5'} />
                  <MeasRow label="Submerged"     value={`${(readout.sub*100).toFixed(1)}%`} />
                  {selBlock.mat.density < fluid.density && (
                    <MeasRow label="Equil. depth" value={`${(selBlock.mat.density/fluid.density*100).toFixed(1)}%`} color="#a78bfa" />
                  )}
                  <div style={{ marginTop:2, textAlign:'center', fontSize:11, fontWeight:700,
                    color: readout.app < -0.00005 ? '#86efac' : Math.abs(readout.app) < 0.00005 ? '#FFD166' : '#fca5a5' }}>
                    {readout.app < -0.00005 ? '↑ FLOATS' : Math.abs(readout.app) < 0.00005 ? '◆ NEUTRAL BUOYANCY' : '↓ SINKS'}
                  </div>
                </div>
              </div>
            )}

            {/* Archimedes info */}
            <div>
              <div style={{ fontSize:11, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:7 }}>Velocity Scale</div>
              <div style={{ height: 10, borderRadius: 4, background: 'linear-gradient(90deg, #0000ff 0%, #00ffff 25%, #00ff00 50%, #ffff00 75%, #ff0000 100%)', border: '1px solid #2A3441' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#64748b', marginTop: 4 }}>
                <span>Low</span>
                <span>High</span>
              </div>
            </div>

            <div style={{ fontSize:12, color:'#94a3b8', lineHeight:1.6, marginTop:'auto', padding:'14px', background:'rgba(0,0,0,0.3)', borderRadius:8, border:'1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ color:'#e2e8f0', marginBottom:8, fontSize:13, fontWeight:600 }}>Archimedes' Principle</div>
              <BlockMath math="F_b = \rho_{f} \cdot g \cdot V_{sub}" />
              <div style={{ marginTop: 8 }}>
                Block floats when <InlineMath math="\rho_{b} < \rho_{f}" /><br/>
                Eq. depth: <InlineMath math="\left(\frac{\rho_b}{\rho_f}\right) \times 100\%" />
              </div>
            </div>
          </>)}

          {tab === 'tunnel' && (<>
            {/* Wind speed */}
            <div>
              <div style={{ fontSize:12, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:7 }}>
                Wind Speed  <span style={{ color:'#60a5fa', fontWeight:600 }}>{(windSpeed * 0.1).toFixed(1)} m/s</span>
              </div>
              <input type="range" min={20} max={500} value={windSpeed}
                onChange={e => { const v=Number(e.target.value); setWindSpeed(v); windRef.current=v; wSimRef.current.bgDirty=true; }}
                style={{ width:'100%', accentColor:'#60a5fa' }} />
            </div>

            {/* Shape selector */}
            <div>
              <div style={{ fontSize:11, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:7 }}>Object</div>
              <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                {SHAPES.map(sh => (
                  <button key={sh.id}
                    onClick={() => setShapeId(sh.id)}
                    style={{
                      padding:'5px 9px', borderRadius:7, cursor:'pointer', fontSize:12,
                      display:'flex', justifyContent:'space-between',
                      background: shapeId===sh.id ? 'rgba(249,115,22,0.15)' : 'rgba(255,255,255,0.03)',
                      border: shapeId===sh.id ? '1px solid rgba(249,115,22,0.4)' : '1px solid #2A3441',
                      color: shapeId===sh.id ? '#fdba74' : '#94a3b8',
                    }}
                  >
                    <span style={{ fontWeight: shapeId===sh.id ? 600 : 400 }}>{sh.name}</span>
                    <span style={{ fontSize:10, color:'#64748b' }}>C_D {sh.cd}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Options */}
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              <label style={{ display:'flex', gap:8, alignItems:'center', cursor:'pointer', fontSize:12, color:'#94a3b8' }}>
                <input type="checkbox" checked={showPressure} onChange={e => setShowPressure(e.target.checked)} style={{ accentColor:'#60a5fa' }} />
                Velocity heatmap
              </label>
              <label style={{ display:'flex', gap:8, alignItems:'center', cursor:'pointer', fontSize:12, color:'#94a3b8' }}>
                <input type="checkbox" checked={showStreamlines} onChange={e => setShowStreamlines(e.target.checked)} style={{ accentColor:'#60a5fa' }} />
                Streamlines
              </label>
            </div>

            {/* Computed values */}
            <div>
              <div style={{ fontSize:12, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:7 }}>Computed</div>
              <div style={{ background:'rgba(15,23,42,0.8)', border:'1px solid #1e3a5f', borderRadius:8, padding:10, display:'flex', flexDirection:'column', gap:6 }}>
                {(() => {
                  const U = windSpeed;
                  const sh = shape;
                  const v = U * 0.1; // m/s
                  const D = 2 * getShapeR(sh) * PX_M; // characteristic length
                  const Afront = sh.id==='box' ? 50*PX_M : sh.id==='airfoil' ? 28*PX_M : D;
                  const Re = (1.225 * v * D) / 1.81e-5;
                  const Cd = cdForRe(sh, Re);
                  const q = 0.5 * 1.225 * v * v; // dynamic pressure
                  const Fd = q * Cd * Afront;
                  const Fl = q * (sh.cl || 0) * Afront;
                  return (<>
                    <MeasRow label="C_D"       value={Cd.toFixed(3)} />
                    {sh.cl > 0 && <MeasRow label="C_L" value={sh.cl.toFixed(3)} />}
                    <MeasRow label="Velocity"  value={`${v.toFixed(1)} m/s`} />
                    <MeasRow label="Re"        value={Re < 1e4 ? Re.toFixed(0) : Re.toExponential(2)} />
                    <MeasRow label="Drag F"    value={`${Fd.toFixed(4)} N`} color="#f97316" />
                    {Fl > 0 && <MeasRow label="Lift F" value={`${Fl.toFixed(4)} N`} color="#22d3ee" />}
                    <MeasRow label="Dyn press" value={`${q.toFixed(2)} Pa`} />
                  </>);
                })()}
              </div>
            </div>

            <div>
              <div style={{ fontSize:11, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:7 }}>Velocity Scale</div>
              <div style={{ height: 10, borderRadius: 4, background: 'linear-gradient(90deg, #0000ff 0%, #00ffff 25%, #00ff00 50%, #ffff00 75%, #ff0000 100%)', border: '1px solid #2A3441' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#64748b', marginTop: 4 }}>
                <span>Low</span>
                <span>High</span>
              </div>
            </div>

            <div style={{ fontSize:12, color:'#94a3b8', lineHeight:1.6, marginTop:'auto', padding:'14px', background:'rgba(0,0,0,0.3)', borderRadius:8, border:'1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ color:'#e2e8f0', marginBottom:8, fontSize:13, fontWeight:600 }}>Aerodynamic Equations</div>
              <BlockMath math="F_D = \frac{1}{2} \rho v^2 C_D A" />
              <BlockMath math="F_L = \frac{1}{2} \rho v^2 C_L A" />
              <BlockMath math="Re = \frac{\rho v D}{\mu}" />
              <BlockMath math="St = \frac{f D}{U}" />
              <div style={{ marginTop: 8, fontSize: 11 }}>
                C<sub>D</sub> varies with Re (drag crisis modeled)
              </div>
            </div>
          </>)}

        </div>
      </div>
    </div>
  );
}

function MeasRow({ label, value, color }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', fontSize:12 }}>
      <span style={{ color:'#cbd5e1' }}>{label}</span>
      <span style={{ fontFamily:'var(--font-mono)', color: color || '#f1f5f9', fontWeight:600 }}>{value}</span>
    </div>
  );
}
