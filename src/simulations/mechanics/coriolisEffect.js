/**
 * Coriolis & Centrifugal Forces in Rotating Frames
 * 
 * Demonstrates the apparent deflection of a particle on a rotating disk.
 * Fully interactive: drag to slingshot new particles.
 */

const DEFAULTS = {
  rotationRate: 1.0, // rad/s
  launchSpeed: 1.5, // m/s
  launchAngle: 0,   // rad
  diskRadius: 4.0,  // m
  showInertial: true,
  trailMax: 400,
  maxParticles: 3,
};

export const defaultParams = { ...DEFAULTS };

export const equationSections = [
  {
    title: 'Introduction',
    content: 'The Coriolis effect is what makes objects seem to curve when viewed from a rotating frame, like Earth. It explains why hurricanes rotate differently in northern and southern hemispheres, and why projectiles seem to deflect. This simulation shows motion on a rotating disk to demonstrate these fictitious forces.',
  },
  {
    title: 'Newtonian Forces (Rotating Frame)',
    equations: [
      {
        latex: String.raw`\vec{F}_{eff} = \vec{F}_{ext} + \vec{F}_{cor} + \vec{F}_{cf}`,
        description: 'In a rotating frame, we add fictitious forces to make Newton\'s laws work. These aren\'t real forces but appear due to the rotation.',
      },
      {
        latex: String.raw`\vec{F}_{cor} = -2m(\vec{\Omega} \times \vec{v})`,
        description: 'Coriolis force deflects moving objects sideways. It\'s zero for objects at rest, maximum for fast-moving ones.',
      },
      {
        latex: String.raw`\vec{F}_{cf} = -m\vec{\Omega} \times (\vec{\Omega} \times \vec{r})`,
        description: 'Centrifugal force pushes objects outward from the center of rotation, like in a centrifuge.',
      },
    ],
    variables: [
      { symbol: 'Ω', description: 'Rotation rate of the frame (vector)' },
      { symbol: 'v', description: 'Velocity relative to rotating frame' },
      { symbol: 'r', description: 'Position from rotation axis' },
    ]
  },
  {
    title: 'Equations of Motion (2D Disk)',
    equations: [
      {
        latex: String.raw`\ddot{x} = 2\Omega\dot{y} + \Omega^2 x`,
        description: 'X-acceleration includes Coriolis (2Ω·y-velocity) and centrifugal (Ω²·x) terms.',
      },
      {
        latex: String.raw`\ddot{y} = -2\Omega\dot{x} + \Omega^2 y`,
        description: 'Y-acceleration has Coriolis (-2Ω·x-velocity) and centrifugal (Ω²·y) terms.',
      },
    ],
  },
  {
    title: 'How to Use',
    content: '1. Set rotation rate Ω - higher values make effects stronger.\n2. Launch particles with different speeds and directions.\n3. Try straight launches vs angled ones.\n4. Watch how paths curve due to Coriolis force.\n5. Compare with non-rotating frame.',
  },
  {
    title: 'Beginner Tips',
    content: 'Start with slow rotation and fast particles to see clear deflection. Notice objects moving with rotation don\'t feel Coriolis force. Try launching radially - centrifugal force pushes outward. Look at weather patterns on Earth - Coriolis explains their rotation.',
  },
];

export const equations = [
  String.raw`\vec{a}_{rot} = -2(\vec{\Omega} \times \vec{v}) - \vec{\Omega} \times (\vec{\Omega} \times \vec{r})`,
];

export const graphParams = [
  { key: 'v_cor', label: 'Max Coriolis Accel [m/s²]' },
  { key: 'v_cf', label: 'Max Centrifugal Accel [m/s²]' },
  { key: 'dist', label: 'Max Radius r [m]' },
];

export const controls = [
  { key: 'rotationRate', label: 'Rotation Ω [rad/s]', min: -5, max: 5, step: 0.1 },
  { key: 'showInertial', label: 'View: Inertial (Fixed)', type: 'toggle' },
];

export const scenarios = [
  {
    name: 'Center Launch',
    description: 'Launch from the center outwards. Notice the curved path (Coriolis deflection) in the rotating frame.',
    params: { rotationRate: 1.0, showInertial: false },
    setup: (sim) => sim.injectParticle(0, 0, 1.5, 0),
  },
  {
    name: 'Edge Launch (Inward)',
    description: 'Throw a particle from the edge towards the center. The Coriolis force now acts in the opposite relative direction.',
    params: { rotationRate: 1.5, showInertial: false },
    setup: (sim) => sim.injectParticle(3.8, 0, -2.0, 0),
  },
  {
    name: 'Stationary Drop',
    description: 'Drop a particle at rest relative to the rotating disk. It spirals outward due to the Centrifugal force, and is deflected by the Coriolis force.',
    params: { rotationRate: 2.0, showInertial: false },
    setup: (sim) => {
      const x_rot = 1.0, y_rot = 0;
      const Omega = 2.0;
      // v_in = Omega x r_in = (-Omega*y, Omega*x)
      sim.injectParticle(x_rot, y_rot, -Omega * y_rot, Omega * x_rot);
    },
  },
  {
    name: 'Inertial Perspective',
    description: 'Same as Center Launch, but viewing from above the disk. The particle travels in a straight line while the disk rotates beneath it.',
    params: { rotationRate: 1.0, showInertial: true },
    setup: (sim) => sim.injectParticle(0, 0, 1.5, 0),
  },
];

export function create(canvas, initParams = {}) {
  const ctx = canvas.getContext('2d');
  let p = { ...DEFAULTS, ...initParams };

  let simTime = 0;
  let totalAngle = 0;
  let particles = [];
  
  // Interactive Slingshot variables
  let isDragging = false;
  let dragStart = null;
  let dragCurrent = null;

  function spawnParticle(x0, y0, vx0, vy0) {
    if (particles.length >= 15) {
      particles.shift(); // Remove oldest
    }
    
    // Seed trails with initial position to prevent render crash and frame drops
    const cosP = Math.cos(totalAngle);
    const sinP = Math.sin(totalAngle);
    const xr = x0 * cosP + y0 * sinP;
    const yr = -x0 * sinP + y0 * cosP;

    particles.push({
      x: x0, y: y0,
      vx: vx0, vy: vy0,
      trailInertial: [{ x: x0, y: y0 }],
      trailRotating: [{ x: xr, y: yr }],
      active: true,
      color: `hsl(${Math.random() * 360}, 80%, 60%)`
    });
  }

  function initState() {
    simTime = 0;
    totalAngle = 0;
    particles = [];
    spawnParticle(0, 0, p.launchSpeed * Math.cos(p.launchAngle), p.launchSpeed * Math.sin(p.launchAngle));
  }
  
  function getMouseCanvasCoords(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX ?? e.touches?.[0]?.clientX;
    const clientY = e.clientY ?? e.touches?.[0]?.clientY;
    return {
      cx: clientX - rect.left,
      cy: clientY - rect.top,
    };
  }

  function getPhysicsCoords(cx, cy) {
    const W = canvas.width, H = canvas.height;
    const centerX = W / 2, centerY = H / 2;
    const scale = Math.min(W, H) * 0.1;
    return {
      x: (cx - centerX) / scale,
      y: (cy - centerY) / scale,
    };
  }

  function onDown(e) {
    const { cx, cy } = getMouseCanvasCoords(e);
    isDragging = true;
    dragStart = getPhysicsCoords(cx, cy);
    dragCurrent = Object.assign({}, dragStart);
  }

  function onMove(e) {
    if (!isDragging) return;
    const { cx, cy } = getMouseCanvasCoords(e);
    dragCurrent = getPhysicsCoords(cx, cy);
  }

  function onUp() {
    if (!isDragging) return;
    isDragging = false;
    
    // Slingshot velocity from canvas coordinates
    const factor = 1.0; 
    const cvx = (dragStart.x - dragCurrent.x) * factor;
    const cvy = (dragStart.y - dragCurrent.y) * factor;
    const cx0 = dragStart.x;
    const cy0 = dragStart.y;
    
    let x0, y0, vx0, vy0;
    
    if (p.showInertial) {
       x0 = cx0; y0 = cy0;
       vx0 = cvx; vy0 = cvy;
    } else {
       // Canvas represents the rotating disk at angle totalAngle
       const cP = Math.cos(totalAngle);
       const sP = Math.sin(totalAngle);
       
       // Rotate canvas position back to inertial frame
       x0 = cx0 * cP - cy0 * sP;
       y0 = cx0 * sP + cy0 * cP;
       
       // Coriolis kinematic transformation: V_inertial = V_rot + (Omega x r)
       // Omega x r in rotating frame is (-Omega*y_rot, Omega*x_rot)
       const v_in_rot_x = cvx - p.rotationRate * cy0;
       const v_in_rot_y = cvy + p.rotationRate * cx0;
       
       vx0 = v_in_rot_x * cP - v_in_rot_y * sP;
       vy0 = v_in_rot_x * sP + v_in_rot_y * cP;
    }
    
    spawnParticle(x0, y0, vx0, vy0);
  }

  canvas.addEventListener('mousedown', onDown);
  canvas.addEventListener('touchstart', onDown, { passive: true });
  window.addEventListener('mousemove', onMove);
  window.addEventListener('touchmove', onMove, { passive: true });
  window.addEventListener('mouseup', onUp);
  window.addEventListener('touchend', onUp);

  function tick(dt) {
    const steps = 10;
    const h = dt / steps;

    for (let i = 0; i < steps; i++) {
      simTime += h;
      totalAngle += p.rotationRate * h;
      const cosP = Math.cos(totalAngle);
      const sinP = Math.sin(totalAngle);

      particles.forEach(pt => {
        if (!pt.active) {
            if (pt.trailInertial.length > 0) pt.trailInertial.shift();
            if (pt.trailRotating.length > 0) pt.trailRotating.shift();
            return;
        }
        
        // Inertial frame kinematics (constant velocity)
        pt.x += pt.vx * h;
        pt.y += pt.vy * h;

        // Rotating observer coordinates
        const xr = pt.x * cosP + pt.y * sinP;
        const yr = -pt.x * sinP + pt.y * cosP;

        pt.trailInertial.push({ x: pt.x, y: pt.y });
        pt.trailRotating.push({ x: xr, y: yr });

        if (pt.trailInertial.length > p.trailMax) {
          pt.trailInertial.shift();
          pt.trailRotating.shift();
        }

        // Deactivate if far off disk
        const distSq = pt.x*pt.x + pt.y*pt.y;
        if (distSq > p.diskRadius * p.diskRadius * 2.0) {
          pt.active = false;
        }
      });
      
      // Filter completely inactive and old particles to prevent memory leaks
      if (Math.random() < 0.05) {
         particles = particles.filter(pt => pt.active || pt.trailInertial.length > 0);
      }
    }
  }

  function drawArrow(ctx, x1, y1, x2, y2, color) {
    const dx = x2 - x1, dy = y2 - y1;
    const len = Math.hypot(dx, dy);
    if (len < 1e-3) return;
    const nx = dx / len, ny = dy / len;
    ctx.strokeStyle = color; ctx.fillStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - nx*8 - ny*4, y2 - ny*8 + nx*4);
    ctx.lineTo(x2 - nx*8 + ny*4, y2 - ny*8 - nx*4);
    ctx.fill();
  }

  function render() {
    const W = canvas.width, H = canvas.height;
    ctx.fillStyle = '#0B0F14';
    ctx.fillRect(0, 0, W, H);

    const centerX = W / 2;
    const centerY = H / 2;
    const scale = Math.min(W, H) * 0.1;

    // ── Draw Disk ─────────────────────────────────────────────
    const diskR = p.diskRadius * scale;
    ctx.save();
    ctx.translate(centerX, centerY);
    
    // In inertial view, disk rotates visually. In rotating view, disk is fixed (angle 0).
    const diskAngle = p.showInertial ? totalAngle : 0;
    ctx.rotate(diskAngle);

    // Disk Body
    ctx.beginPath();
    ctx.arc(0, 0, diskR, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(30, 41, 59, 0.5)';
    ctx.fill();
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Disk Markings (Compass/Grid) to make visual rotation obvious
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    for (let i = 0; i < 8; i++) {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(diskR * Math.cos(i * Math.PI / 4), diskR * Math.sin(i * Math.PI / 4));
        ctx.stroke();
    }
    // Inner ring
    ctx.beginPath(); ctx.arc(0, 0, diskR * 0.5, 0, Math.PI*2); ctx.stroke();
    ctx.restore();

    // ── Draw Trajectories ──────────────────────────────────────
    particles.forEach(pt => {
      const trail = p.showInertial ? pt.trailInertial : pt.trailRotating;
      if (trail.length > 2) {
        ctx.beginPath();
        ctx.lineWidth = 2.5;
        for (let i = 0; i < trail.length; i++) {
          const tx = centerX + trail[i].x * scale;
          const ty = centerY + trail[i].y * scale;
          if (i === 0) ctx.moveTo(tx, ty);
          else ctx.lineTo(tx, ty);
        }
        ctx.strokeStyle = pt.color;
        
        ctx.shadowBlur = 10;
        ctx.shadowColor = pt.color;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      if (pt.active) {
        const last = trail[trail.length - 1];
        const px = centerX + last.x * scale;
        const py = centerY + last.y * scale;
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(px, py, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = pt.color;
        ctx.stroke();
      }
    });

    // ── Slingshot Preview ──────────────────────────────────────
    if (isDragging && dragStart && dragCurrent) {
        // If showing rotating frame, our dragStart is on the canvas which acts as the rotating frame.
        // But our physics runs in inertial frame.
        // Since launching maps Canvas -> Inertial natively inside our `getPhysicsCoords`, 
        // the visual preview just draws backwards in canvas space.
        const sx = centerX + dragStart.x * scale;
        const sy = centerY + dragStart.y * scale;
        const cx2 = centerX + dragCurrent.x * scale;
        const cy2 = centerY + dragCurrent.y * scale;
        
        ctx.setLineDash([5, 5]);
        drawArrow(ctx, sx, sy, sx + (sx - cx2), sy + (sy - cy2), '#facc15');
        ctx.setLineDash([]);
        
        ctx.fillStyle = '#e2e8f0';
        ctx.beginPath(); ctx.arc(sx, sy, 4, 0, Math.PI*2); ctx.fill();
    }

    // ── HUD Labels ─────────────────────────────────────────────
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 13px "JetBrains Mono"';
    ctx.textAlign = 'left';
    ctx.fillText(p.showInertial ? 'INERTIAL FRAME (FIXED)' : 'ROTATING FRAME (OBSERVER ON DISK)', 20, 30);
    
    ctx.font = '11px monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillText('Drag on the disk to slingshot new particles!', 20, 50);
  }

  let rafId, lastTs, running = false;
  let speedScale = 1;

  function loop(ts) {
    if (!running) return;
    const dt = lastTs === undefined ? 1/60 : Math.min((ts - lastTs) / 1000, 1/20);
    lastTs = ts;
    tick(dt * speedScale);
    render();
    rafId = requestAnimationFrame(loop);
  }

  initState();
  render();

  return {
    start() {
      if (running) return;
      running = true; lastTs = undefined;
      rafId = requestAnimationFrame(loop);
    },
    stop() { running = false; cancelAnimationFrame(rafId); },
    reset() { this.stop(); initState(); render(); this.start(); },
    setParams(next) {
      p = { ...p, ...next };
      // Let's not automatically wipe particles on param change, 
      // just immediately affect their physics (changing rotation rate visually affects rotating trail of new particles, 
      // but strictly speaking, changing rotationRate midway abruptly breaks the geometric projection of existing positions. 
      // It's fun to glitch it, or we can reset trails.
      render();
    },
    setSpeed(s) { speedScale = Number.isFinite(s) ? s : 1; },
    injectParticle(x, y, vx, vy) { // Custom action for scenarios
      spawnParticle(x, y, vx, vy);
    },
    destroy() {
      this.stop();
      canvas.removeEventListener('mousedown', onDown);
      canvas.removeEventListener('touchstart', onDown);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchend', onUp);
    },
    getData() {
      let maxDist = 0, maxVcor = 0, maxVcf = 0;
      particles.forEach(pt => {
        if (!pt.active) return;
        const dist = Math.sqrt(pt.x*pt.x + pt.y*pt.y);
        
        // Rotating frame velocity: v_rot = v_in - Omega x r
        // Omega x r in inertial frame is (-Omega*y, Omega*x)
        const v_rot_x = pt.vx + p.rotationRate * pt.y;
        const v_rot_y = pt.vy - p.rotationRate * pt.x;
        const v_rot_mag = Math.sqrt(v_rot_x*v_rot_x + v_rot_y*v_rot_y);

        const v_cor = 2 * Math.abs(p.rotationRate * v_rot_mag);
        const v_cf = Math.abs(p.rotationRate * p.rotationRate * dist);
        if (dist > maxDist) maxDist = dist;
        if (v_cor > maxVcor) maxVcor = v_cor;
        if (v_cf > maxVcf) maxVcf = v_cf;
      });
      return {
        time: simTime,
        dist: maxDist,
        v_cor: maxVcor,
        v_cf: maxVcf,
      };
    },
  };
}
