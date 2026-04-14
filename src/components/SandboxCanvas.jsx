import { useEffect, useRef, useCallback } from 'react';
import Matter from 'matter-js';
import { useSandboxStore } from '../store/sandboxStore';
import {
  createEngine, getEngine, startEngine, stopEngine,
  createCircle, createBox, createWall, createWedge, createPulley, createSpring, createString,
  createBeam, createWoodBlock, createPivot, createOscillator,
  spawnCar, spawnBridge, spawnNewtonCradle,
  addToWorld, removeFromWorld, setGravity as engineSetGravity,
} from '../physics/engine';

const { Body, Composite, Vector } = Matter;

let idCounter = 0;
const uid = () => `body_${++idCounter}`;

// Module-level camera — stable across renders
let cam = { x: 0, y: 0, zoom: 1 };

function worldToScreen(wx, wy) {
  return { x: wx * cam.zoom + cam.x, y: wy * cam.zoom + cam.y };
}

function screenToWorld(sx, sy) {
  return { x: (sx - cam.x) / cam.zoom, y: (sy - cam.y) / cam.zoom };
}

export default function SandboxCanvas({ engineRef }) {
  const canvasRef = useRef(null);
  const stateRef = useRef({
    dragging: null,
    springStart: null,
    isPanning: false,
    panStart: null,
  });

  const store = useSandboxStore();
  const storeRef = useRef(store);
  storeRef.current = store;

  // ---- Drawing helpers (declared before effects) ----

  function drawGrid(ctx, canvas) {
    const spacing = 20 * cam.zoom;
    const spacingMajor = 100 * cam.zoom;
    const ox = ((cam.x % spacing) + spacing) % spacing;
    const oy = ((cam.y % spacing) + spacing) % spacing;
    
    ctx.lineWidth = 1;
    
    // minor grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
    for (let x = ox; x < canvas.width; x += spacing) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
    }
    for (let y = oy; y < canvas.height; y += spacing) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }
    
    // major grid
    const oxMajor = ((cam.x % spacingMajor) + spacingMajor) % spacingMajor;
    const oyMajor = ((cam.y % spacingMajor) + spacingMajor) % spacingMajor;
    ctx.strokeStyle = '#2A3441';
    for (let x = oxMajor; x < canvas.width; x += spacingMajor) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
    }
    for (let y = oyMajor; y < canvas.height; y += spacingMajor) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }
  }

  function drawFloorBody(ctx, body) {
    const verts = body.vertices;
    // Build the floor path
    const sv = worldToScreen(verts[0].x, verts[0].y);
    ctx.beginPath();
    ctx.moveTo(sv.x, sv.y);
    for (let i = 1; i < verts.length; i++) {
      const s = worldToScreen(verts[i].x, verts[i].y);
      ctx.lineTo(s.x, s.y);
    }
    ctx.closePath();

    // Get bounding box for gradient
    const minX = Math.min(...verts.map(v => worldToScreen(v.x, v.y).x));
    const maxX = Math.max(...verts.map(v => worldToScreen(v.x, v.y).x));
    const minY = Math.min(...verts.map(v => worldToScreen(v.x, v.y).y));
    const maxY = Math.max(...verts.map(v => worldToScreen(v.x, v.y).y));

    // Gradient fill: dark stone look
    const grad = ctx.createLinearGradient(minX, minY, minX, maxY);
    grad.addColorStop(0, 'rgba(100, 80, 180, 0.25)');
    grad.addColorStop(0.4, 'rgba(60, 40, 120, 0.18)');
    grad.addColorStop(1, 'rgba(20, 10, 50, 0.35)');
    ctx.fillStyle = grad;
    ctx.fill();

    // Hatch texture overlay
    ctx.save();
    ctx.clip();
    ctx.strokeStyle = 'rgba(79, 195, 247, 0.06)';
    ctx.lineWidth = 1;
    for (let hx = minX - 20; hx < maxX + 20; hx += 12) {
      ctx.beginPath();
      ctx.moveTo(hx, minY);
      ctx.lineTo(hx + (maxY - minY), maxY);
      ctx.stroke();
    }
    ctx.restore();

    // Top edge highlight
    ctx.beginPath();
    ctx.moveTo(sv.x, sv.y);
    for (let i = 1; i < verts.length; i++) {
      const s = worldToScreen(verts[i].x, verts[i].y);
      ctx.lineTo(s.x, s.y);
    }
    ctx.closePath();
    ctx.strokeStyle = '#4FC3F7';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Purple glow pass
    ctx.shadowBlur = 18;
    ctx.shadowColor = 'rgba(79, 195, 247, 0.5)';
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  function drawSpringLine(ctx, a, b, selected) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < 2) return;
    const nx = -dy / len;
    const ny = dx / len;
    const coils = 12;
    const amp = 7;

    // Shadow pass
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    for (let i = 0; i <= coils * 2; i++) {
      const t = i / (coils * 2);
      const side = (i % 2 === 0 ? 1 : -1) * amp;
      ctx.lineTo(a.x + dx * t + nx * (side + 1.5), a.y + dy * t + ny * (side + 1.5));
    }
    ctx.lineTo(b.x, b.y);
    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.lineWidth = selected ? 3.5 : 3;
    ctx.stroke();

    // Main coil
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    for (let i = 0; i <= coils * 2; i++) {
      const t = i / (coils * 2);
      const side = (i % 2 === 0 ? 1 : -1) * amp;
      ctx.lineTo(a.x + dx * t + nx * side, a.y + dy * t + ny * side);
    }
    ctx.lineTo(b.x, b.y);
    ctx.strokeStyle = selected ? '#93c5fd' : '#3b82f6';
    ctx.lineWidth = selected ? 2.5 : 2;
    ctx.stroke();

    // Highlight pass (lighter top edge)
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    for (let i = 0; i <= coils * 2; i++) {
      const t = i / (coils * 2);
      const side = (i % 2 === 0 ? 1 : -1) * amp;
      ctx.lineTo(a.x + dx * t + nx * (side - 1.2), a.y + dy * t + ny * (side - 1.2));
    }
    ctx.lineTo(b.x, b.y);
    ctx.strokeStyle = selected ? 'rgba(200,230,255,0.5)' : 'rgba(147,197,253,0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Glow if selected
    if (selected) {
      ctx.shadowBlur = 12;
      ctx.shadowColor = '#3b82f6';
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      for (let i = 0; i <= coils * 2; i++) {
        const t = i / (coils * 2);
        const side = (i % 2 === 0 ? 1 : -1) * amp;
        ctx.lineTo(a.x + dx * t + nx * side, a.y + dy * t + ny * side);
      }
      ctx.lineTo(b.x, b.y);
      ctx.strokeStyle = 'rgba(99,179,255,0.4)';
      ctx.lineWidth = 5;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // End-cap dots
    [a, b].forEach(pt => {
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = selected ? '#93c5fd' : '#60a5fa';
      ctx.fill();
    });
  }

  function drawConstraints(ctx, eng) {
    const { selectedId, constraints: storeConstraints } = storeRef.current;

    for (const [id, sc] of Object.entries(storeConstraints)) {
      const isSelected = id === selectedId;
      const c = sc.matterConstraint;

      if (sc.type === 'spring') {
        const pA = c.bodyA ? Matter.Vector.add(c.bodyA.position, c.pointA) : c.pointA;
        const pB = c.bodyB ? Matter.Vector.add(c.bodyB.position, c.pointB) : c.pointB;
        const sA = worldToScreen(pA.x, pA.y);
        const sB = worldToScreen(pB.x, pB.y);
        drawSpringLine(ctx, sA, sB, isSelected);
      } else if (sc.type === 'string') {
        const pA = c.bodyA ? Matter.Vector.add(c.bodyA.position, c.pointA) : c.pointA;
        const pB = c.bodyB ? Matter.Vector.add(c.bodyB.position, c.pointB) : c.pointB;
        const sA = worldToScreen(pA.x, pA.y);
        const sB = worldToScreen(pB.x, pB.y);

        // Single rigid line
        ctx.beginPath();
        ctx.moveTo(sA.x, sA.y);
        ctx.lineTo(sB.x, sB.y);
        ctx.strokeStyle = isSelected ? '#fde68a' : '#d97706';
        ctx.lineWidth = isSelected ? 3.5 : 2;
        ctx.stroke();

        [sA, sB].forEach(pt => {
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 3, 0, Math.PI * 2);
          ctx.fillStyle = isSelected ? '#fde68a' : '#f59e0b';
          ctx.fill();
        });
      } else if (sc.type === 'pivot') {
        const pA = c.bodyA ? Matter.Vector.add(c.bodyA.position, c.pointA) : c.pointA;
        const sA = worldToScreen(pA.x, pA.y);
        ctx.beginPath();
        ctx.arc(sA.x, sA.y, isSelected ? 6 : 4, 0, Math.PI * 2);
        ctx.fillStyle = isSelected ? '#fca5a5' : '#FF6B6B';
        ctx.fill();
        ctx.strokeStyle = '#450a0a';
        ctx.lineWidth = 1;
        ctx.stroke();
      } else if (sc.type === 'oscillator') {
        const pA = c.bodyA ? Matter.Vector.add(c.bodyA.position, c.pointA) : c.pointA;
        const pB = c.bodyB ? Matter.Vector.add(c.bodyB.position, c.pointB) : c.pointB;
        const sA = worldToScreen(pA.x, pA.y);
        const sB = worldToScreen(pB.x, pB.y);

        ctx.beginPath();
        ctx.moveTo(sA.x, sA.y);
        ctx.lineTo(sB.x, sB.y);
        ctx.strokeStyle = isSelected ? '#34d399' : '#059669'; // Emerald green
        ctx.lineWidth = isSelected ? 5.5 : 4;
        ctx.setLineDash([8, 6]);
        ctx.stroke();
        ctx.setLineDash([]);

        [sA, sB].forEach(pt => {
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
          ctx.fillStyle = isSelected ? '#a7f3d0' : '#10b981';
          ctx.fill();
        });
      }
    }
  }

  function drawBody(ctx, body, isSelected) {
    const isCircle = body.label === 'circle' || body.label === 'pulley';
    const isStatic = body.isStatic;
    const pos = worldToScreen(body.position.x, body.position.y);

    ctx.save();
    ctx.translate(pos.x, pos.y);
    ctx.rotate(body.angle);

    if (isCircle) {
      const r = body.circleRadius * cam.zoom;

      // ── Smart Pulley Wall Bracket ──
      if (body.label === 'pulley' && isStatic) {
        const eng = getEngine();
        if (eng) {
          const all = Matter.Composite.allBodies(eng.world);
          let closestWall = null;
          let minDist = Infinity;
          for (const b of all) {
            if ((b.label === 'wall' || b.label === 'box' || b.label === 'wedge') && b.isStatic) {
              const dx = b.position.x - body.position.x;
              const dy = b.position.y - body.position.y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist < 200 && dist < minDist) {
                closestWall = b;
                minDist = dist;
              }
            }
          }
          if (closestWall) {
            const dx = (closestWall.position.x - body.position.x) * cam.zoom;
            const dy = (closestWall.position.y - body.position.y) * cam.zoom;
            const angle = Math.atan2(dy, dx);
            const distRender = Math.sqrt(dx * dx + dy * dy);
            
            ctx.save();
            ctx.rotate(angle - body.angle);
            
            // Bracket metal bar
            ctx.fillStyle = '#64748b';
            ctx.fillRect(0, -5, distRender, 10);
            ctx.strokeStyle = '#334155';
            ctx.lineWidth = 1;
            ctx.strokeRect(0, -5, distRender, 10);
            
            // Pivot bolt
            ctx.beginPath();
            ctx.arc(0, 0, r * 0.45, 0, Math.PI * 2);
            ctx.fillStyle = '#94a3b8';
            ctx.fill();
            ctx.stroke();

            ctx.restore();
          }
        }
      }

      // ── Selection glow ring ──
      if (isSelected) {
        ctx.beginPath();
        ctx.arc(0, 0, r + 5, 0, Math.PI * 2);
        ctx.strokeStyle = isStatic ? 'rgba(192,132,252,0.5)' : 'rgba(255,255,255,0.5)';
        ctx.lineWidth = 3;
        ctx.shadowBlur = 20;
        ctx.shadowColor = isStatic ? '#4FC3F7' : '#ffffff';
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // ── Drop shadow ──
      ctx.beginPath();
      ctx.arc(2, 4, r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.fill();

      // ── Base gradient fill (lit top-left) ──
      const grad = ctx.createRadialGradient(-r * 0.35, -r * 0.35, r * 0.05, 0, 0, r);
      if (isStatic) {
        grad.addColorStop(0, '#81D4FA');
        grad.addColorStop(0.45, '#7c3aed');
        grad.addColorStop(1, '#3b0764');
      } else {
        grad.addColorStop(0, '#e2e8f0');
        grad.addColorStop(0.4, '#94a3b8');
        grad.addColorStop(1, '#1e293b');
      }
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      // ── Rim / edge darkening ──
      const rimGrad = ctx.createRadialGradient(0, 0, r * 0.7, 0, 0, r);
      rimGrad.addColorStop(0, 'rgba(0,0,0,0)');
      rimGrad.addColorStop(1, 'rgba(0,0,0,0.55)');
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fillStyle = rimGrad;
      ctx.fill();

      if (body.label === 'pulley') {
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.35, 0, Math.PI * 2);
        ctx.fillStyle = '#0f172a';
        ctx.fill();

        ctx.beginPath();
        for (let i = 0; i < 4; i++) {
          ctx.moveTo(0, 0);
          ctx.lineTo(r * Math.cos(i * Math.PI/2), r * Math.sin(i * Math.PI/2));
        }
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2;
        ctx.stroke();
      } else {
        // Specular highlight
        ctx.beginPath();
        ctx.arc(-r * 0.25, -r * 0.28, r * 0.18, 0, Math.PI * 2);
        ctx.fillStyle = isStatic ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.7)';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(r * 0.4, 0, r * 0.15, 0, Math.PI * 2);
        ctx.fillStyle = isStatic ? 'rgba(255,255,255,0.5)' : 'rgba(50,50,60,0.6)';
        ctx.fill();
      }

      // ── Outer stroke ──
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.strokeStyle = isStatic
        ? (isSelected ? '#e9d5ff' : '#9333ea')
        : (isSelected ? '#ffffff' : 'rgba(148,163,184,0.6)');
      ctx.lineWidth = isSelected ? 2 : 1.5;
      ctx.stroke();

      // ── Center dot for all circles ──
      ctx.beginPath();
      ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = isStatic ? 'rgba(233,213,255,0.7)' : 'rgba(255,255,255,0.6)';
      ctx.fill();

    } else {
      // ── POLYGON / BOX / WALL ──
      const localVerts = body.vertices.map(v => ({
        x: (v.x - body.position.x) * cam.zoom,
        y: (v.y - body.position.y) * cam.zoom,
      }));

      // Compute local bounding box
      const xs = localVerts.map(v => v.x);
      const ys = localVerts.map(v => v.y);
      const bx0 = Math.min(...xs), bx1 = Math.max(...xs);
      const by0 = Math.min(...ys), by1 = Math.max(...ys);
      const bw = bx1 - bx0, bh = by1 - by0;

      const buildPath = () => {
        ctx.beginPath();
        ctx.moveTo(localVerts[0].x, localVerts[0].y);
        for (let i = 1; i < localVerts.length; i++) ctx.lineTo(localVerts[i].x, localVerts[i].y);
        ctx.closePath();
      };

      // ── Selection glow ──
      if (isSelected) {
        buildPath();
        ctx.strokeStyle = isStatic ? 'rgba(192,132,252,0.5)' : 'rgba(255,255,255,0.5)';
        ctx.lineWidth = 8;
        ctx.shadowBlur = 20;
        ctx.shadowColor = isStatic ? '#4FC3F7' : '#ffffff';
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // ── Drop shadow ──
      ctx.save();
      ctx.translate(3, 5);
      buildPath();
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.fill();
      ctx.restore();

      // ── Base gradient fill ──
      const faceGrad = ctx.createLinearGradient(bx0, by0, bx0, by1);
      if (body.label === 'wood') {
        faceGrad.addColorStop(0, '#d97706');
        faceGrad.addColorStop(0.5, '#b45309');
        faceGrad.addColorStop(1, '#78350f');
      } else if (body.label === 'beam') {
        faceGrad.addColorStop(0, '#94a3b8');
        faceGrad.addColorStop(0.5, '#475569');
        faceGrad.addColorStop(1, '#1e293b');
      } else if (isStatic) {
        faceGrad.addColorStop(0, '#7c3aed');
        faceGrad.addColorStop(0.5, '#5b21b6');
        faceGrad.addColorStop(1, '#2e1065');
      } else {
        faceGrad.addColorStop(0, '#475569');
        faceGrad.addColorStop(0.5, '#1e293b');
        faceGrad.addColorStop(1, '#0f172a');
      }
      buildPath();
      ctx.fillStyle = faceGrad;
      ctx.fill();

      // ── Bevel & Texture ──
      ctx.save();
      ctx.clip();
      const bevelGrad = ctx.createLinearGradient(bx0, by0, bx1, by1);
      bevelGrad.addColorStop(0, 'rgba(255,255,255,0.15)');
      bevelGrad.addColorStop(0.35, 'rgba(255,255,255,0.04)');
      bevelGrad.addColorStop(1, 'rgba(0,0,0,0.2)');
      ctx.fillStyle = bevelGrad;
      ctx.fillRect(bx0, by0, bw, bh);

      if (body.label === 'wood') {
        ctx.strokeStyle = 'rgba(0,0,0,0.15)';
        ctx.lineWidth = 1;
        for (let di = by0; di < by1; di += 6) {
          ctx.beginPath(); ctx.moveTo(bx0, di); ctx.lineTo(bx1, di + (Math.random()*4-2)); ctx.stroke();
        }
      } else if (body.label === 'beam') {
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        for (let dx = bx0 + 8; dx < bx1; dx += 20) {
          ctx.beginPath(); ctx.arc(dx, (by0+by1)/2, 2.5, 0, Math.PI*2); ctx.fill();
        }
      } else {
        ctx.strokeStyle = 'rgba(255,255,255,0.03)';
        ctx.lineWidth = 1;
        for (let di = bx0 - bh; di < bx1 + bh; di += 10) {
          ctx.beginPath(); ctx.moveTo(di, by0); ctx.lineTo(di + bh, by1); ctx.stroke();
        }
      }
      ctx.restore();

      // ── Bottom-right inner shadow ──
      const shadowGrad = ctx.createLinearGradient(bx0, by0, bx1, by1);
      shadowGrad.addColorStop(0, 'rgba(0,0,0,0)');
      shadowGrad.addColorStop(0.6, 'rgba(0,0,0,0)');
      shadowGrad.addColorStop(1, 'rgba(0,0,0,0.45)');
      buildPath();
      ctx.fillStyle = shadowGrad;
      ctx.fill();

      // ── Top edge white highlight ──
      const n = localVerts.length;
      // Find the edge with the most upward normal
      let topEdgeI = 0, topDotMin = Infinity;
      for (let i = 0; i < n; i++) {
        const a = localVerts[i], bv = localVerts[(i + 1) % n];
        const midY = (a.y + bv.y) / 2;
        if (midY < topDotMin) { topDotMin = midY; topEdgeI = i; }
      }
      const ea = localVerts[topEdgeI], eb = localVerts[(topEdgeI + 1) % n];
      ctx.beginPath();
      ctx.moveTo(ea.x, ea.y);
      ctx.lineTo(eb.x, eb.y);
      ctx.strokeStyle = isStatic ? 'rgba(220,180,255,0.6)' : 'rgba(255,255,255,0.35)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // ── Outer stroke ──
      buildPath();
      ctx.strokeStyle = isStatic
        ? (isSelected ? '#d8b4fe' : '#7c3aed')
        : (isSelected ? '#cbd5e1' : '#334155');
      ctx.lineWidth = isSelected ? 2 : 1.5;
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawBodies(ctx, eng) {
    const { bodies, selectedId } = storeRef.current;
    const all = Composite.allBodies(eng.world);

    // Draw non-selected first, then selected on top
    const selected = [];
    for (const body of all) {
      if (body._isFloor) { drawFloorBody(ctx, body); continue; }
      const isSel = Object.values(bodies).some(b => b.matterBody === body && b.id === selectedId);
      if (isSel) { selected.push(body); continue; }
      drawBody(ctx, body, false);
    }
    for (const body of selected) drawBody(ctx, body, true);
  }

  function drawFrame() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const eng = getEngine();
    if (!eng) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid(ctx, canvas);
    drawConstraints(ctx, eng);
    drawBodies(ctx, eng);
  }

  // ---- Physics helpers ----

  function addFloor(eng) {
    const canvas = canvasRef.current;
    const w = canvas?.width ?? window.innerWidth - 220;
    const floor = createWall(w / 2, 580, w + 200, 20);
    floor._isFloor = true;
    Matter.Composite.add(eng.world, floor);
  }

  function getBodyAtScreen(sx, sy) {
    const wp = screenToWorld(sx, sy);
    const eng = getEngine();
    const all = Composite.allBodies(eng.world);
    for (let i = all.length - 1; i >= 0; i--) {
      if (!all[i]._isFloor && Matter.Query.point([all[i]], wp).length > 0) {
        return all[i];
      }
    }
    return null;
  }

  function findStoreId(matterBody) {
    const { bodies, constraints } = storeRef.current;
    for (const [id, b] of Object.entries(bodies)) {
      if (b.matterBody === matterBody) return id;
    }
    for (const [id, c] of Object.entries(constraints)) {
      if (c.matterConstraint === matterBody) return id;
    }
    return null;
  }

  function getConstraintAtScreen(sx, sy) {
    const { constraints: storeConstraints } = storeRef.current;
    const threshold = 10; // pixels

    for (const [cid, sc] of Object.entries(storeConstraints)) {
      const c = sc.matterConstraint;

      if (sc.type === 'spring') {
        const pA = c.bodyA ? Vector.add(c.bodyA.position, c.pointA) : c.pointA;
        const pB = c.bodyB ? Vector.add(c.bodyB.position, c.pointB) : c.pointB;
        const sA = worldToScreen(pA.x, pA.y);
        const sB = worldToScreen(pB.x, pB.y);

        const dx = sB.x - sA.x;
        const dy = sB.y - sA.y;
        const lenSq = dx * dx + dy * dy;
        if (lenSq < 1) continue;

        const t = Math.max(0, Math.min(1, ((sx - sA.x) * dx + (sy - sA.y) * dy) / lenSq));
        const closestX = sA.x + t * dx;
        const closestY = sA.y + t * dy;
        const dist = Math.sqrt((sx - closestX) ** 2 + (sy - closestY) ** 2);

        if (dist < threshold) return cid;
      } else if (sc.type === 'string' && c.isStringRope) {
        // Iterate over bodies
        const bodies = c.bodies;
        for (let i = 0; i < bodies.length - 1; i++) {
          const sA = worldToScreen(bodies[i].position.x, bodies[i].position.y);
          const sB = worldToScreen(bodies[i + 1].position.x, bodies[i + 1].position.y);
          const dx = sB.x - sA.x;
          const dy = sB.y - sA.y;
          const lenSq = dx * dx + dy * dy;
          if (lenSq < 1) continue;
          
          const t = Math.max(0, Math.min(1, ((sx - sA.x) * dx + (sy - sA.y) * dy) / lenSq));
          const closestX = sA.x + t * dx;
          const closestY = sA.y + t * dy;
          const dist = Math.sqrt((sx - closestX) ** 2 + (sy - closestY) ** 2);
          if (dist < threshold) return cid;
        }
      }
    }
    return null;
  }

  // Remove a body AND all constraints that reference it
  function deleteBodyAndConstraints(bodyId) {
    const { bodies, constraints, removeBody, removeConstraint } = storeRef.current;
    const mb = bodies[bodyId]?.matterBody;
    if (!mb) return;
    for (const [cid, c] of Object.entries(constraints)) {
      const mc = c.matterConstraint;
      const isConnected = mc.isStringRope ? (mc.bodyA === mb || mc.bodyB === mb) : (mc.bodyA === mb || mc.bodyB === mb);
      if (isConnected) {
        removeFromWorld(mc);
        removeConstraint(cid);
      }
    }
    removeFromWorld(mb);
    removeBody(bodyId);
  }

  // ---- Effects ----

  // Boot engine once, start always-on render loop
  useEffect(() => {
    const eng = createEngine();
    if (engineRef) engineRef.current = eng;
    addFloor(eng);
    startEngine(drawFrame, () => storeRef.current.isRunning);
    return () => stopEngine();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync gravity to engine
  useEffect(() => {
    engineSetGravity(store.gravity.x, store.gravity.y);
  }, [store.gravity.x, store.gravity.y]);

  // Trigger a render when paused and state changes
  useEffect(() => {
    if (!storeRef.current.isRunning) drawFrame();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.selectedId, store.bodies, store.constraints, store.isRunning]);

  // Keyboard delete with cascading constraint removal
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Delete' && e.key !== 'Backspace') return;
      // Do not delete if typing in inputs
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      const { selectedId, bodies, constraints, removeConstraint } = storeRef.current;
      if (!selectedId) return;
      if (bodies[selectedId]) {
        deleteBodyAndConstraints(selectedId);
      } else if (constraints[selectedId]) {
        removeFromWorld(constraints[selectedId].matterConstraint);
        removeConstraint(selectedId);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Global pointerup — prevents stuck drag/pan when mouse released outside canvas
  useEffect(() => {
    const onWindowPointerUp = () => {
      const sr = stateRef.current;
      if (sr.dragging && sr.dragging.constraint) {
        removeFromWorld(sr.dragging.constraint);
      }
      sr.dragging = null;
      sr.isPanning = false;
      sr.panStart = null;
      if (canvasRef.current && storeRef.current.activeTool === 'select') {
        canvasRef.current.style.cursor = 'default';
      }
    };
    window.addEventListener('pointerup', onWindowPointerUp);
    return () => window.removeEventListener('pointerup', onWindowPointerUp);
  }, []);

  // Canvas resize
  useEffect(() => {
    const resize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      drawFrame();
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cursorMap = {
    select: 'default', circle: 'crosshair', box: 'crosshair',
    wall: 'crosshair', wedge: 'crosshair', pulley: 'crosshair',
    spring: 'crosshair', string: 'crosshair',
  };

  // ---- Interaction handlers ----

  const onPointerDown = useCallback((e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const wp = screenToWorld(sx, sy);
    const { activeTool, setSelectedId, addBody, addConstraint, setActiveTool } = storeRef.current;
    const sr = stateRef.current;

    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      sr.isPanning = true;
      sr.panStart = { x: e.clientX - cam.x, y: e.clientY - cam.y };
      canvas.style.cursor = 'grabbing';
      return;
    }

    if (activeTool === 'select') {
      // First check if clicking near a constraint (spring/string)
      const hitConstraint = getConstraintAtScreen(sx, sy);
      if (hitConstraint) {
        setSelectedId(hitConstraint);
        return;
      }
      const hit = getBodyAtScreen(sx, sy);
      if (hit) {
        setSelectedId(findStoreId(hit));
        // Create temporary drag constraint
        const eng = getEngine();
        if (eng) {
          const dragConstraint = Matter.Constraint.create({
            bodyB: hit,
            pointB: { x: wp.x - hit.position.x, y: wp.y - hit.position.y },
            pointA: { x: wp.x, y: wp.y },
            stiffness: 0.2, // soft physical pull
            damping: 0.1,
            length: 0
          });
          Matter.Composite.add(eng.world, dragConstraint);
          sr.dragging = { 
            body: hit, 
            constraint: dragConstraint,
            offX: wp.x - hit.position.x,
            offY: wp.y - hit.position.y
          };
          canvas.style.cursor = 'grabbing';
        }
      } else {
        setSelectedId(null);
        sr.isPanning = true;
        sr.panStart = { x: e.clientX - cam.x, y: e.clientY - cam.y };
        canvas.style.cursor = 'grabbing';
      }
      return;
    }

    if (activeTool === 'circle') {
      const mb = createCircle(wp.x, wp.y, 25, {});
      addToWorld(mb);
      const id = uid();
      addBody(id, { id, type: 'circle', matterBody: mb,
        props: { restitution: 0.6, friction: 0.1, frictionAir: 0.01, density: 0.001, isStatic: false, velocityX: 0, velocityY: 0 } });
      setSelectedId(id);
      return;
    }

    if (activeTool === 'box') {
      const mb = createBox(wp.x, wp.y, 60, 40, {});
      addToWorld(mb);
      const id = uid();
      addBody(id, { id, type: 'box', matterBody: mb,
        props: { restitution: 0.3, friction: 0.3, frictionAir: 0.01, density: 0.001, isStatic: false, velocityX: 0, velocityY: 0 } });
      setSelectedId(id);
      return;
    }

    if (activeTool === 'wall') {
      const mb = createBox(wp.x, wp.y, 150, 15, { isStatic: true });
      addToWorld(mb);
      const id = uid();
      addBody(id, { id, type: 'wall', matterBody: mb,
        props: { restitution: 0.3, friction: 0.5, frictionAir: 0, density: 0, isStatic: true, velocityX: 0, velocityY: 0 } });
      setSelectedId(id);
      return;
    }

    if (activeTool === 'wedge') {
      const mb = createWedge(wp.x, wp.y, 60, 40, {});
      addToWorld(mb);
      const id = uid();
      addBody(id, { id, type: 'wedge', matterBody: mb,
        props: { restitution: 0.3, friction: 0.3, frictionAir: 0.01, density: 0.001, isStatic: false, velocityX: 0, velocityY: 0 } });
      setSelectedId(id);
      return;
    }

    if (activeTool === 'beam') {
      const mb = createBeam(wp.x, wp.y, 160, 20, {});
      addToWorld(mb);
      const id = uid();
      addBody(id, { id, type: 'beam', matterBody: mb,
        props: { restitution: 0.1, friction: 0.6, frictionAir: 0.015, density: 0.008, isStatic: false, velocityX: 0, velocityY: 0 } });
      setSelectedId(id);
      return;
    }

    if (activeTool === 'wood') {
      const mb = createWoodBlock(wp.x, wp.y, 50, 50, {});
      addToWorld(mb);
      const id = uid();
      addBody(id, { id, type: 'wood', matterBody: mb,
        props: { restitution: 0.4, friction: 0.4, frictionAir: 0.01, density: 0.0006, isStatic: false, velocityX: 0, velocityY: 0 } });
      setSelectedId(id);
      return;
    }

    if (activeTool === 'pulley') {
      const mb = createPulley(wp.x, wp.y, 18, {});
      addToWorld(mb);
      const id = uid();
      addBody(id, { id, type: 'pulley', matterBody: mb,
        props: { restitution: 0.1, friction: 0.05, isStatic: true, velocityX: 0, velocityY: 0 } });
      setSelectedId(id);
      return;
    }

    if (activeTool === 'car' || activeTool === 'bridge' || activeTool === 'cradle') {
      let sys;
      if (activeTool === 'car') sys = spawnCar(wp.x, wp.y);
      if (activeTool === 'bridge') sys = spawnBridge(wp.x, wp.y);
      if (activeTool === 'cradle') sys = spawnNewtonCradle(wp.x, wp.y);
      
      addToWorld(...sys.bodies, ...sys.constraints);
      sys.bodies.forEach(b => {
        const id = uid();
        const typeMap = { 'circle': 'circle', 'wood': 'wood', 'beam': 'beam' };
        addBody(id, { id, type: typeMap[b.label] || 'box', matterBody: b, props: { isStatic: b.isStatic } });
      });
      sys.constraints.forEach(c => {
        const id = uid();
        addConstraint(id, { id, type: c.label || 'spring', matterConstraint: c, props: {} });
      });
      setActiveTool('select');
      return;
    }

    if (activeTool === 'spring' || activeTool === 'string' || activeTool === 'pivot' || activeTool === 'oscillator') {
      const hit = getBodyAtScreen(sx, sy);
      if (!sr.springStart) {
        // First click: set start point (Strictly forcing to Center of Mass)
        sr.springStart = {
          body: hit || null,
          localPt: hit ? { x: 0, y: 0 } : null,
          worldPt: hit ? null : { x: wp.x, y: wp.y },
        };
      } else {
        // Second click: create the constraint
        const start = sr.springStart;
        sr.springStart = null;

        if (!start.body && !hit) return;
        if (start.body && hit && start.body === hit) return;

        let createFn, stiffness, damping;
        if (activeTool === 'spring') {
          createFn = createSpring; stiffness = 0.05; damping = 0.01;
        } else if (activeTool === 'string') {
          createFn = createString; stiffness = 1; damping = 0;
        } else if (activeTool === 'pivot') {
          createFn = createPivot; stiffness = 1; damping = 0;
        } else if (activeTool === 'oscillator') {
          createFn = createOscillator; stiffness = 1; damping = 0.1;
        }

        const opts = { stiffness, damping };

        if (start.body) opts.pointA = start.localPt;
        else opts.pointA = start.worldPt;

        if (hit) opts.pointB = { x: 0, y: 0 }; // Force center of mass
        else opts.pointB = { x: wp.x, y: wp.y };

        const mc = createFn(start.body, hit, opts);
        addToWorld(mc);
        const id = uid();
        addConstraint(id, { id, type: activeTool, matterConstraint: mc,
          props: { stiffness, damping, length: mc.length } });
        setSelectedId(id);
        setActiveTool('select');
      }
    }
  }, []);

  const onPointerMove = useCallback((e) => {
    const canvas = canvasRef.current;
    const sr = stateRef.current;
    const rect = canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;

    if (sr.isPanning && sr.panStart) {
      cam.x = e.clientX - sr.panStart.x;
      cam.y = e.clientY - sr.panStart.y;
      drawFrame();
      return;
    }

    if (sr.dragging) {
      const wp = screenToWorld(sx, sy);
      const isPaused = !storeRef.current.isRunning;
      
      if (isPaused) {
        // Direct teleport while paused for easy building
        Body.setPosition(sr.dragging.body, { x: wp.x - sr.dragging.offX, y: wp.y - sr.dragging.offY });
        Body.setVelocity(sr.dragging.body, { x: 0, y: 0 });
        drawFrame();
      } else {
        // Physical drag restraint while playing
        sr.dragging.constraint.pointA = { x: wp.x, y: wp.y };
        Matter.Sleeping.set(sr.dragging.body, false);
      }
    }

    if (storeRef.current.activeTool !== 'select') {
      drawFrame();
      const { springStart } = sr;
      if (springStart) {
        // Draw ghost line for spring/string placement
        const ctx = canvas.getContext('2d');
        const startPos = springStart.body
          ? worldToScreen(springStart.body.position.x + springStart.worldPt.x, springStart.body.position.y + springStart.worldPt.y)
          : worldToScreen(springStart.worldPt.x, springStart.worldPt.y);
        ctx.beginPath();
        ctx.moveTo(startPos.x, startPos.y);
        ctx.lineTo(sx, sy);
        ctx.strokeStyle = 'rgba(180,160,255,0.4)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 5]);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onWheel = useCallback((e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    cam.x = mx - (mx - cam.x) * factor;
    cam.y = my - (my - cam.y) * factor;
    cam.zoom = Math.max(0.2, Math.min(5, cam.zoom * factor));
    drawFrame();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ display: 'block', width: '100%', height: '100%', cursor: cursorMap[store.activeTool] ?? 'default' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onWheel={onWheel}
    />
  );
}
