import { useEffect, useRef, useCallback } from 'react';
import Matter from 'matter-js';
import { useSandboxStore } from '../store/sandboxStore';
import {
  createEngine,
  getEngine,
  startEngine,
  stopEngine,
  createCircle,
  createBox,
  createWall,
  createWedge,
  createPulley,
  createSpring,
  createString,
  createBeam,
  createWoodBlock,
  createPivot,
  createOscillator,
  spawnCar,
  spawnBridge,
  spawnNewtonCradle,
  addToWorld,
  removeFromWorld,
  setGravity as engineSetGravity,
} from '../physics/engine';

const { Body, Composite, Vector } = Matter;

let idCounter = 0;
const uid = () => `body_${++idCounter}`;

// Module-level camera — stable across renders
const isMobile = window.innerWidth <= 768;
let cam = {
  x: window.innerWidth / 2,
  y: isMobile ? window.innerHeight * 0.4 : window.innerHeight / 2,
  zoom: isMobile ? 0.7 : 1,
};

function worldToScreen(wx, wy) {
  return { x: wx * cam.zoom + cam.x, y: wy * cam.zoom + cam.y };
}

function screenToWorld(sx, sy) {
  return { x: (sx - cam.x) / cam.zoom, y: (sy - cam.y) / cam.zoom };
}

export default function SandboxCanvas({ engineRef }) {
  const canvasRef = useRef(null);
  const activePointersRef = useRef(new Map());
  const pinchRef = useRef(null);
  const stateRef = useRef({
    dragging: null,
    springStart: null,
    isPanning: false,
    panStart: null,
  });

  const store = useSandboxStore();
  const storeRef = useRef(store);
  storeRef.current = store;

  // ---- Drawing helpers ----

  function drawGrid(ctx, canvas) {
    const spacing = 50 * cam.zoom;
    const ox = ((cam.x % spacing) + spacing) % spacing;
    const oy = ((cam.y % spacing) + spacing) % spacing;

    ctx.beginPath();
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';

    for (let x = ox; x < canvas.width; x += spacing) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
    }
    for (let y = oy; y < canvas.height; y += spacing) {
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
    }
    ctx.stroke();
  }

  function drawFloorBody(ctx, body) {
    const verts = body.vertices;
    ctx.beginPath();
    const sv = worldToScreen(verts[0].x, verts[0].y);
    ctx.moveTo(sv.x, sv.y);
    for (let i = 1; i < verts.length; i++) {
      const s = worldToScreen(verts[i].x, verts[i].y);
      ctx.lineTo(s.x, s.y);
    }
    ctx.closePath();
    ctx.fillStyle = '#1e293b';
    ctx.fill();
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  function drawSpringLine(ctx, a, b, selected) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < 2) return;

    const nx = -dy / len;
    const ny = dx / len;
    const coils = 12;
    const amp = 6;

    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    for (let i = 0; i <= coils * 2; i++) {
      const t = i / (coils * 2);
      const side = (i % 2 === 0 ? 1 : -1) * amp;
      ctx.lineTo(a.x + dx * t + nx * side, a.y + dy * t + ny * side);
    }
    ctx.lineTo(b.x, b.y);
    ctx.strokeStyle = selected ? '#60a5fa' : '#3b82f6';
    ctx.lineWidth = selected ? 3 : 2;
    ctx.stroke();

    // End points
    ctx.fillStyle = selected ? '#60a5fa' : '#3b82f6';
    [a, b].forEach((pt) => {
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 3, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function drawConstraints(ctx) {
    const { selectedId, constraints: storeConstraints } = storeRef.current;

    for (const [id, sc] of Object.entries(storeConstraints)) {
      const isSelected = id === selectedId;
      const c = sc.matterConstraint;
      const pA = c.bodyA ? Vector.add(c.bodyA.position, c.pointA) : c.pointA;
      const pB = c.bodyB ? Vector.add(c.bodyB.position, c.pointB) : c.pointB;
      const sA = worldToScreen(pA.x, pA.y);
      const sB = worldToScreen(pB.x, pB.y);

      if (sc.type === 'spring') {
        drawSpringLine(ctx, sA, sB, isSelected);
      } else if (sc.type === 'string') {
        ctx.beginPath();
        ctx.moveTo(sA.x, sA.y);
        ctx.lineTo(sB.x, sB.y);
        ctx.strokeStyle = isSelected ? '#fbbf24' : '#d97706';
        ctx.lineWidth = isSelected ? 3 : 1.5;
        ctx.stroke();
      } else if (sc.type === 'pivot') {
        ctx.beginPath();
        ctx.arc(sA.x, sA.y, isSelected ? 6 : 4, 0, Math.PI * 2);
        ctx.fillStyle = isSelected ? '#f87171' : '#ef4444';
        ctx.fill();
      } else if (sc.type === 'oscillator') {
        ctx.beginPath();
        ctx.moveTo(sA.x, sA.y);
        ctx.lineTo(sB.x, sB.y);
        ctx.strokeStyle = isSelected ? '#34d399' : '#10b981';
        ctx.lineWidth = isSelected ? 4 : 2;
        ctx.setLineDash([5, 5]);
        ctx.stroke();
        ctx.setLineDash([]);
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

    if (isSelected) {
      ctx.shadowBlur = 0; // Explicitly no shadows
    }

    if (isCircle) {
      const r = body.circleRadius * cam.zoom;

      // Base fill
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fillStyle = isStatic ? '#475569' : '#64748b';
      ctx.fill();

      // Simple direction indicator
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(r, 0);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.stroke();

      // Outline
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.strokeStyle = isSelected ? '#ffffff' : '#94a3b8';
      ctx.lineWidth = isSelected ? 3 : 1.5;
      ctx.stroke();
    } else {
      const localVerts = body.vertices.map((v) => ({
        x: (v.x - body.position.x) * cam.zoom,
        y: (v.y - body.position.y) * cam.zoom,
      }));

      ctx.beginPath();
      ctx.moveTo(localVerts[0].x, localVerts[0].y);
      for (let i = 1; i < localVerts.length; i++) ctx.lineTo(localVerts[i].x, localVerts[i].y);
      ctx.closePath();

      ctx.fillStyle = isStatic ? '#334155' : '#475569';
      ctx.fill();

      ctx.strokeStyle = isSelected ? '#ffffff' : '#94a3b8';
      ctx.lineWidth = isSelected ? 3 : 1.5;
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
      if (body._isFloor) {
        drawFloorBody(ctx, body);
        continue;
      }
      const isSel = Object.values(bodies).some((b) => b.matterBody === body && b.id === selectedId);
      if (isSel) {
        selected.push(body);
        continue;
      }
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
    drawConstraints(ctx);
    drawBodies(ctx, eng);
  }

  function getPointerPoint(event) {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }

  function getTouchPair() {
    const points = [...activePointersRef.current.values()].filter(
      (point) => point.pointerType === 'touch',
    );
    if (points.length < 2) return null;
    const [a, b] = points;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    return {
      center: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
      distance: Math.hypot(dx, dy),
    };
  }

  function endDrag() {
    const sr = stateRef.current;
    if (sr.dragging && sr.dragging.constraint) {
      removeFromWorld(sr.dragging.constraint);
    }
    sr.dragging = null;
    sr.isPanning = false;
    sr.panStart = null;
  }

  // ---- Physics helpers ----
  function addFloor(eng) {
    const canvas = canvasRef.current;
    const w = canvas?.width ?? window.innerWidth;
    const isMob = window.innerWidth <= 768;
    // Since camera is centered at wx=0, floor should be at wx=0
    const floorY = isMob ? 400 : 500;
    const floor = createWall(0, floorY, w * 2, 40);
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
      const isConnected = mc.isStringRope
        ? mc.bodyA === mb || mc.bodyB === mb
        : mc.bodyA === mb || mc.bodyB === mb;
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

  // Canvas resize with ResizeObserver
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      drawFrame();
    };

    const observer = new ResizeObserver(() => {
      // Use requestAnimationFrame to avoid "ResizeObserver loop limit exceeded" error
      requestAnimationFrame(resize);
    });

    observer.observe(canvas);
    resize();

    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cursorMap = {
    select: 'default',
    circle: 'crosshair',
    box: 'crosshair',
    wall: 'crosshair',
    wedge: 'crosshair',
    pulley: 'crosshair',
    spring: 'crosshair',
    string: 'crosshair',
  };

  // ---- Interaction handlers ----

  const onPointerDown = useCallback((e) => {
    const canvas = canvasRef.current;
    canvas.setPointerCapture?.(e.pointerId);
    const point = getPointerPoint(e);
    activePointersRef.current.set(e.pointerId, {
      ...point,
      pointerType: e.pointerType,
    });

    const touchPair = getTouchPair();
    if (touchPair) {
      endDrag();
      pinchRef.current = {
        distance: touchPair.distance,
        center: touchPair.center,
        camStart: { ...cam },
      };
      return;
    }

    const sx = point.x;
    const sy = point.y;
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
            length: 0,
          });
          Matter.Composite.add(eng.world, dragConstraint);
          sr.dragging = {
            body: hit,
            constraint: dragConstraint,
            offX: wp.x - hit.position.x,
            offY: wp.y - hit.position.y,
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
      addBody(id, {
        id,
        type: 'circle',
        matterBody: mb,
        props: {
          restitution: 0.6,
          friction: 0.1,
          frictionAir: 0.01,
          density: 0.001,
          isStatic: false,
          velocityX: 0,
          velocityY: 0,
        },
      });
      setSelectedId(id);
      return;
    }

    if (activeTool === 'box') {
      const mb = createBox(wp.x, wp.y, 60, 40, {});
      addToWorld(mb);
      const id = uid();
      addBody(id, {
        id,
        type: 'box',
        matterBody: mb,
        props: {
          restitution: 0.3,
          friction: 0.3,
          frictionAir: 0.01,
          density: 0.001,
          isStatic: false,
          velocityX: 0,
          velocityY: 0,
        },
      });
      setSelectedId(id);
      return;
    }

    if (activeTool === 'wall') {
      const mb = createBox(wp.x, wp.y, 150, 15, { isStatic: true });
      addToWorld(mb);
      const id = uid();
      addBody(id, {
        id,
        type: 'wall',
        matterBody: mb,
        props: {
          restitution: 0.3,
          friction: 0.5,
          frictionAir: 0,
          density: 0,
          isStatic: true,
          velocityX: 0,
          velocityY: 0,
        },
      });
      setSelectedId(id);
      return;
    }

    if (activeTool === 'wedge') {
      const mb = createWedge(wp.x, wp.y, 60, 40, {});
      addToWorld(mb);
      const id = uid();
      addBody(id, {
        id,
        type: 'wedge',
        matterBody: mb,
        props: {
          restitution: 0.3,
          friction: 0.3,
          frictionAir: 0.01,
          density: 0.001,
          isStatic: false,
          velocityX: 0,
          velocityY: 0,
        },
      });
      setSelectedId(id);
      return;
    }

    if (activeTool === 'beam') {
      const mb = createBeam(wp.x, wp.y, 160, 20, {});
      addToWorld(mb);
      const id = uid();
      addBody(id, {
        id,
        type: 'beam',
        matterBody: mb,
        props: {
          restitution: 0.1,
          friction: 0.6,
          frictionAir: 0.015,
          density: 0.008,
          isStatic: false,
          velocityX: 0,
          velocityY: 0,
        },
      });
      setSelectedId(id);
      return;
    }

    if (activeTool === 'wood') {
      const mb = createWoodBlock(wp.x, wp.y, 50, 50, {});
      addToWorld(mb);
      const id = uid();
      addBody(id, {
        id,
        type: 'wood',
        matterBody: mb,
        props: {
          restitution: 0.4,
          friction: 0.4,
          frictionAir: 0.01,
          density: 0.0006,
          isStatic: false,
          velocityX: 0,
          velocityY: 0,
        },
      });
      setSelectedId(id);
      return;
    }

    if (activeTool === 'pulley') {
      const mb = createPulley(wp.x, wp.y, 18, {});
      addToWorld(mb);
      const id = uid();
      addBody(id, {
        id,
        type: 'pulley',
        matterBody: mb,
        props: { restitution: 0.1, friction: 0.05, isStatic: true, velocityX: 0, velocityY: 0 },
      });
      setSelectedId(id);
      return;
    }

    if (activeTool === 'car' || activeTool === 'bridge' || activeTool === 'cradle') {
      let sys;
      if (activeTool === 'car') sys = spawnCar(wp.x, wp.y);
      if (activeTool === 'bridge') sys = spawnBridge(wp.x, wp.y);
      if (activeTool === 'cradle') sys = spawnNewtonCradle(wp.x, wp.y);

      addToWorld(...sys.bodies, ...sys.constraints);
      sys.bodies.forEach((b) => {
        const id = uid();
        const typeMap = { circle: 'circle', wood: 'wood', beam: 'beam' };
        addBody(id, {
          id,
          type: typeMap[b.label] || 'box',
          matterBody: b,
          props: { isStatic: b.isStatic },
        });
      });
      sys.constraints.forEach((c) => {
        const id = uid();
        addConstraint(id, { id, type: c.label || 'spring', matterConstraint: c, props: {} });
      });
      setActiveTool('select');
      return;
    }

    if (
      activeTool === 'spring' ||
      activeTool === 'string' ||
      activeTool === 'pivot' ||
      activeTool === 'oscillator'
    ) {
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
          createFn = createSpring;
          stiffness = 0.05;
          damping = 0.01;
        } else if (activeTool === 'string') {
          createFn = createString;
          stiffness = 1;
          damping = 0;
        } else if (activeTool === 'pivot') {
          createFn = createPivot;
          stiffness = 1;
          damping = 0;
        } else if (activeTool === 'oscillator') {
          createFn = createOscillator;
          stiffness = 1;
          damping = 0.1;
        }

        const opts = { stiffness, damping };

        if (start.body) opts.pointA = start.localPt;
        else opts.pointA = start.worldPt;

        if (hit)
          opts.pointB = { x: 0, y: 0 }; // Force center of mass
        else opts.pointB = { x: wp.x, y: wp.y };

        const mc = createFn(start.body, hit, opts);
        addToWorld(mc);
        const id = uid();
        addConstraint(id, {
          id,
          type: activeTool,
          matterConstraint: mc,
          props: { stiffness, damping, length: mc.length },
        });
        setSelectedId(id);
        setActiveTool('select');
      }
    }
  }, []);

  const onPointerMove = useCallback((e) => {
    const canvas = canvasRef.current;
    const sr = stateRef.current;
    const point = getPointerPoint(e);
    activePointersRef.current.set(e.pointerId, {
      ...point,
      pointerType: e.pointerType,
    });

    const touchPair = getTouchPair();
    if (touchPair && pinchRef.current) {
      e.preventDefault();
      const pinch = pinchRef.current;
      const factor = touchPair.distance / Math.max(1, pinch.distance);
      const nextZoom = Math.max(0.25, Math.min(4, pinch.camStart.zoom * factor));
      const centerWorld = {
        x: (pinch.center.x - pinch.camStart.x) / pinch.camStart.zoom,
        y: (pinch.center.y - pinch.camStart.y) / pinch.camStart.zoom,
      };

      cam.zoom = nextZoom;
      cam.x = touchPair.center.x - centerWorld.x * nextZoom;
      cam.y = touchPair.center.y - centerWorld.y * nextZoom;
      drawFrame();
      return;
    }

    const sx = point.x;
    const sy = point.y;

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
        Body.setPosition(sr.dragging.body, {
          x: wp.x - sr.dragging.offX,
          y: wp.y - sr.dragging.offY,
        });
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
          ? worldToScreen(
              springStart.body.position.x + springStart.localPt.x,
              springStart.body.position.y + springStart.localPt.y,
            )
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

  const onPointerUp = useCallback((e) => {
    activePointersRef.current.delete(e.pointerId);
    if (!getTouchPair()) pinchRef.current = null;
    canvasRef.current?.releasePointerCapture?.(e.pointerId);
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
      style={{
        display: 'block',
        width: '100%',
        height: '100%',
        cursor: cursorMap[store.activeTool] ?? 'default',
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onWheel={onWheel}
    />
  );
}
