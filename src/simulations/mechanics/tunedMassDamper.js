const DEFAULTS = {
  m1: 10,
  m2: 1.0,
  k1: 100,
  k2: 10,
  c1: 0.5,
  c2: 2.0,
  forcingAmp: 15,
  forcingFreq: 0.5,
  damperOn: true,
};

export const defaultParams = { ...DEFAULTS };

export const equationSections = [
  {
    title: 'Introduction to Tuned Mass Dampers',
    content:
      'A Tuned Mass Damper (TMD), also known as a harmonic absorber, is a device mounted in structures to reduce the amplitude of mechanical vibrations. From preventing skyscrapers like the Taipei 101 from swaying during typhoons, to stabilizing bridges against earthquakes, TMDs are a critical tool in structural engineering. They work not by magically making energy disappear, but by actively "stealing" the kinetic energy from the primary structure.',
  },
  {
    title: 'The Physics of Resonance',
    content:
      'Every physical structure has a "natural frequency" (ωₙ) at which it naturally wants to oscillate. If an external driving force (like wind or footsteps) pushes the structure at this exact frequency, a phenomenon called **resonance** occurs. During resonance, the structure absorbs energy optimally, causing the amplitude of its sway to grow dangerously large, potentially leading to catastrophic failure.',
  },
  {
    title: 'System Equations (Coupled Oscillators)',
    content:
      'We model this as a 2-Degree-of-Freedom (2-DOF) system. The primary structure (building) is m₁, and the damper is m₂.',
    equations: [
      {
        latex: String.raw`m_1 \ddot{x}_1 + c_1 \dot{x}_1 + k_1 x_1 = F_0 \sin(\omega t) + c_2(\dot{x}_2 - \dot{x}_1) + k_2(x_2 - x_1)`,
        description:
          'Primary Structure Equation: It experiences the external driving force F₀sin(ωt), but is ALSO pulled/pushed by the spring (k₂) and dashpot (c₂) connecting it to the damper mass.',
      },
      {
        latex: String.raw`m_2 \ddot{x}_2 + c_2(\dot{x}_2 - \dot{x}_1) + k_2(x_2 - x_1) = 0`,
        description:
          'Damper Equation: The damper has no external force acting on it. It moves purely in response to the motion of the primary mass.',
      },
    ],
    variables: [
      { symbol: 'm₁, m₂', description: 'Mass of the primary structure and the damper' },
      {
        symbol: 'k₁, k₂',
        description: 'Stiffness of the structural supports and the damper spring',
      },
      { symbol: 'c₁, c₂', description: 'Viscous damping (energy loss) coefficients' },
      { symbol: 'F₀, ω', description: 'Amplitude and angular frequency of the external force' },
    ],
  },
  {
    title: 'The Tuning Condition',
    content:
      'For the damper to be highly effective, its natural frequency MUST exactly match the natural frequency of the primary structure. This is what it means to be "tuned".',
    equations: [
      {
        latex: String.raw`\omega_{TMD} = \omega_{primary} \implies \sqrt{\frac{k_2}{m_2}} = \sqrt{\frac{k_1}{m_1}}`,
        description:
          'When tuned correctly, the damper mass will oscillate exactly 90 degrees out of phase with the primary mass. When the primary mass tries to move right, the damper mass pulls it left. The damper absorbs the energy, swaying wildly, while the primary structure remains almost entirely stationary.',
      },
    ],
  },
  {
    title: 'Mass Ratio (μ)',
    content:
      'Engineers must decide how heavy to make the damper. This is defined by the mass ratio μ = m₂ / m₁.',
    equations: [
      {
        latex: String.raw`\mu = \frac{m_2}{m_1}`,
        description:
          'Typical values range from 1% to 5% (0.01 to 0.05). A larger damper covers a wider range of frequencies and is more robust to tuning errors, but adds massive weight and cost to the building.',
      },
    ],
  },
  {
    title: 'Real World Applications',
    content:
      "- **Taipei 101**: Features a massive 730-ton steel pendulum suspended between the 87th and 92nd floors to counteract typhoon winds.\n- **Bridges**: London's Millennium Bridge was famously retrofitted with TMDs after it began wobbling violently on opening day due to pedestrian footsteps.\n- **Power Lines**: If you look closely at high-voltage power lines, you will often see small dumbbell-shaped weights hanging from the wires. These are Stockbridge dampers, a type of TMD used to prevent wind-induced vibrations from snapping the cables.",
  },
];

export const equations = [
  String.raw`m_1 \ddot{x}_1 + c_1 \dot{x}_1 + k_1 x_1 = F_0 \sin(\omega t) + c_2(\dot{x}_2 - \dot{x}_1) + k_2(x_2 - x_1)`,
  String.raw`m_2 \ddot{x}_2 + c_2(\dot{x}_2 - \dot{x}_1) + k_2(x_2 - x_1) = 0`,
];

export const graphParams = [
  { key: 'x1', label: 'Primary Displacement ($x_1$)' },
  { key: 'x2', label: 'Damper Displacement ($x_2$)' },
  { key: 'force', label: 'Driving Force' },
];

export const controls = [
  { type: 'toggle', key: 'damperOn', label: 'Enable Damper (TMD)' },
  { key: 'm1', label: 'Primary Mass (m₁)', min: 1, max: 20, step: 0.5 },
  { key: 'k1', label: 'Primary Stiffness (k₁)', min: 10, max: 200, step: 1 },
  { key: 'c1', label: 'Primary Damping (c₁)', min: 0, max: 5, step: 0.1 },
  { key: 'm2', label: 'Damper Mass (m₂)', min: 0.1, max: 5, step: 0.1 },
  { key: 'k2', label: 'Damper Stiffness (k₂)', min: 1, max: 50, step: 0.5 },
  { key: 'c2', label: 'Damper Damping (c₂)', min: 0, max: 10, step: 0.1 },
  { key: 'forcingAmp', label: 'Force Amplitude (F₀)', min: 0, max: 50, step: 1 },
  { key: 'forcingFreq', label: 'Force Frequency (f)', min: 0.1, max: 2, step: 0.01 },
];

export const scenarios = [
  {
    name: 'Optimal TMD',
    description:
      'TMD tuned to match the primary natural frequency. Notice how m₂ moves wildly while m₁ stays nearly still.',
    params: {
      m1: 10,
      k1: 100,
      c1: 0.5,
      m2: 1.0,
      k2: 10,
      c2: 2.0,
      forcingAmp: 20,
      forcingFreq: 0.503, // Resonance freq = sqrt(100/10)/(2PI) = ~0.503 Hz
      damperOn: true,
    },
  },
  {
    name: 'No Damper (Resonance)',
    description: 'Driving at natural frequency with no tuned mass — amplitude grows dangerously.',
    params: {
      m1: 10,
      k1: 100,
      c1: 0.5,
      m2: 1.0,
      k2: 10,
      c2: 2.0,
      forcingAmp: 20,
      forcingFreq: 0.503,
      damperOn: false,
    },
  },
  {
    name: 'Off-Tune TMD',
    description:
      'TMD frequency mismatched. The damper absorbs some energy but is highly inefficient.',
    params: {
      m1: 10,
      k1: 100,
      c1: 0.5,
      m2: 1.0,
      k2: 25,
      c2: 1.5,
      forcingAmp: 20,
      forcingFreq: 0.503,
      damperOn: true,
    },
  },
];

export const guidedExperiments = [
  {
    title: 'Taming Resonance',
    steps: [
      {
        instruction:
          'The system is driven near its natural frequency WITHOUT the damper. Press Play.',
        params: {
          m1: 10,
          k1: 100,
          c1: 0.2,
          m2: 1.0,
          k2: 10,
          c2: 1.5,
          forcingAmp: 10,
          forcingFreq: 0.5,
          damperOn: false,
        },
        question: 'What happens to the primary mass when driven at its natural frequency?',
        choices: [
          'Small steady oscillation',
          'Amplitude grows continuously (resonance)',
          'The system becomes still',
        ],
        correctIndex: 1,
        explanation:
          'At resonance, energy input exceeds dissipation. Amplitude grows continuously — this is why uncontrolled resonance destroys structures like bridges and buildings.',
      },
      {
        instruction:
          'Now enable the tuned mass damper (TMD). Notice k1/m1 equals k2/m2. Reset and play.',
        params: {
          m1: 10,
          k1: 100,
          c1: 0.2,
          m2: 1.0,
          k2: 10,
          c2: 1.5,
          forcingAmp: 10,
          forcingFreq: 0.5,
          damperOn: true,
        },
        question: 'With the optimal TMD active, what happens?',
        choices: [
          'No change',
          'Primary mass barely moves, damper mass swings wildly',
          'Both masses swing wildly',
        ],
        correctIndex: 1,
        explanation:
          'The TMD absorbs energy at the resonant frequency. The secondary mass oscillates out of phase with the driving force, canceling it out.',
      },
    ],
  },
];

// Physics Integration
function deriv(state, t, p) {
  const [x1, v1, x2, v2] = state;
  const force = p.forcingAmp * Math.sin(2 * Math.PI * p.forcingFreq * t);

  const relX = p.damperOn ? x1 - x2 : 0;
  const relV = p.damperOn ? v1 - v2 : 0;

  const F_coupling = p.damperOn ? p.c2 * relV + p.k2 * relX : 0;

  const a1 = (force - p.c1 * v1 - p.k1 * x1 - F_coupling) / p.m1;
  const a2 = p.damperOn ? F_coupling / p.m2 : 0;

  return [v1, a1, v2, a2];
}

function rk4(state, t, h, p) {
  const k1 = deriv(state, t, p);
  const s2 = state.map((v, i) => v + 0.5 * h * k1[i]);
  const k2 = deriv(s2, t + h / 2, p);
  const s3 = state.map((v, i) => v + 0.5 * h * k2[i]);
  const k3 = deriv(s3, t + h / 2, p);
  const s4 = state.map((v, i) => v + h * k3[i]);
  const k4 = deriv(s4, t + h, p);
  return state.map((v, i) => v + (h / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
}

// Rendering Helpers
function drawSpring(ctx, x1, y1, x2, y2, coils = 12, radius = 8) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.hypot(dx, dy);
  const ang = Math.atan2(dy, dx);

  ctx.save();
  ctx.translate(x1, y1);
  ctx.rotate(ang);

  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.beginPath();
  ctx.moveTo(0, 0);
  const straight = 20;
  if (dist <= straight * 2) {
    ctx.lineTo(dist, 0);
  } else {
    ctx.lineTo(straight, 0);
    const coilW = (dist - straight * 2) / coils;
    for (let i = 0; i < coils; i++) {
      const cx = straight + i * coilW;
      ctx.lineTo(cx + coilW * 0.25, -radius);
      ctx.lineTo(cx + coilW * 0.75, radius);
      ctx.lineTo(cx + coilW, 0);
    }
    ctx.lineTo(dist, 0);
  }
  ctx.stroke();
  ctx.restore();
}

function drawDashpot(ctx, x1, y1, x2, y2, width = 14) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.hypot(dx, dy);
  const ang = Math.atan2(dy, dx);

  ctx.save();
  ctx.translate(x1, y1);
  ctx.rotate(ang);

  const cylLen = 35;

  // Cylinder attached to x1
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'square';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(15, 0);
  ctx.moveTo(15, -width);
  ctx.lineTo(15 + cylLen, -width);
  ctx.moveTo(15, width);
  ctx.lineTo(15 + cylLen, width);
  ctx.moveTo(15, -width);
  ctx.lineTo(15, width);
  ctx.stroke();

  // Plunger attached to x2
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(dist, 0);
  ctx.lineTo(15 + cylLen - 5, 0); // rod
  ctx.stroke();

  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(15 + cylLen - 5, -width + 3);
  ctx.lineTo(15 + cylLen - 5, width - 3); // piston head
  ctx.stroke();

  ctx.restore();
}

export function create(canvas, initParams = {}) {
  const ctx = canvas.getContext('2d');
  let p = { ...DEFAULTS, ...initParams };

  let state;
  let time;
  let maxDisp = 2;
  let dragTarget = null;

  function initState() {
    state = [0, 0, 0, 0];
    time = 0;
    maxDisp = 2;
  }

  function getLayout() {
    const W = canvas.width;
    const H = canvas.height;
    const groundY = H * 0.7;
    const wallX = Math.max(50, W * 0.1);
    const m1Equil = wallX + (W - wallX) * 0.4;
    const maxSafePx = (W - wallX) * 0.35;
    const pxPerUnit = Math.min(100, maxSafePx / maxDisp);
    const m1X = m1Equil + state[0] * pxPerUnit;
    const m1W = 140;
    const m1H = 90;
    const m1Y = groundY - m1H / 2 - 12;
    const m2W = 60;
    const m2H = 40;
    const m2X = m1Equil + state[2] * pxPerUnit;
    const m2Y = m1Y - m1H / 2 - m2H / 2 - 10;
    return { m1Equil, pxPerUnit, m1X, m1Y, m1W, m1H, m2X, m2Y, m2W, m2H };
  }

  function pointerPosition(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  }

  function hitBox(pt, cx, cy, width, height) {
    return (
      pt.x >= cx - width / 2 &&
      pt.x <= cx + width / 2 &&
      pt.y >= cy - height / 2 &&
      pt.y <= cy + height / 2
    );
  }

  function setDisplacementFromPointer(event) {
    const pt = pointerPosition(event);
    const layout = getLayout();
    const nextX = Math.max(-5, Math.min(5, (pt.x - layout.m1Equil) / layout.pxPerUnit));
    if (dragTarget === 'm1') {
      state[0] = nextX;
      state[1] = 0;
    } else if (dragTarget === 'm2') {
      state[2] = nextX;
      state[3] = 0;
    }
    maxDisp = Math.max(2, Math.abs(state[0]), p.damperOn ? Math.abs(state[2]) : 0);
    render();
  }

  function tick(dt) {
    const sub = 20;
    const h = dt / sub;
    for (let i = 0; i < sub; i++) {
      state = rk4(state, time, h, p);
      time += h;
    }
    // Track maximum displacement to dynamically scale the view and keep masses on screen
    maxDisp = Math.max(maxDisp, Math.abs(state[0]), p.damperOn ? Math.abs(state[2]) : 0);
  }

  function render() {
    const W = canvas.width;
    const H = canvas.height;

    // Light Theme Background
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, W, H);

    const groundY = H * 0.7;
    const wallX = Math.max(50, W * 0.1);

    // Auto-scale pixels per unit so large amplitudes don't go off canvas
    const m1Equil = wallX + (W - wallX) * 0.4;
    const maxSafePx = (W - wallX) * 0.35;
    const pxPerUnit = Math.min(100, maxSafePx / maxDisp);

    // Track/Ground
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(wallX, groundY, W, H - groundY);
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(wallX, groundY);
    ctx.lineTo(W, groundY);
    ctx.stroke();

    // Track markings
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2;
    for (let i = wallX + 50; i < W; i += 50) {
      ctx.beginPath();
      ctx.moveTo(i, groundY);
      ctx.lineTo(i, groundY + 10);
      ctx.stroke();
    }

    // Rigid Wall
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(0, groundY - 200, wallX, 200 + (H - groundY));
    ctx.fillStyle = '#64748b';
    ctx.fillRect(wallX - 10, groundY - 200, 10, 200);

    // Mass 1 (Primary)
    const m1X = m1Equil + state[0] * pxPerUnit;
    const m1W = 140;
    const m1H = 90;
    const m1Y = groundY - m1H / 2 - 12; // 12 for wheels

    // Mass 2 (TMD)
    const m2W = 60;
    const m2H = 40;
    const m2X = m1Equil + state[2] * pxPerUnit;
    const m2Y = m1Y - m1H / 2 - m2H / 2 - 10; // resting on top of m1

    // M1 Wheels
    const wheelR = 10;
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.arc(m1X - m1W / 2 + 20, m1Y + m1H / 2 + 2, wheelR, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(m1X + m1W / 2 - 20, m1Y + m1H / 2 + 2, wheelR, 0, Math.PI * 2);
    ctx.fill();

    // M1 to Wall Connectors
    drawSpring(ctx, wallX, m1Y - 20, m1X - m1W / 2, m1Y - 20, 12, 10);
    drawDashpot(ctx, wallX, m1Y + 20, m1X - m1W / 2, m1Y + 20);

    // Render M1 Body
    ctx.fillStyle = '#3b82f6'; // Blue
    ctx.shadowColor = 'rgba(0,0,0,0.2)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 4;
    ctx.fillRect(m1X - m1W / 2, m1Y - m1H / 2, m1W, m1H);
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    // M1 Label
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px "Inter", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('m₁', m1X, m1Y + 6);

    if (dragTarget === 'm1') {
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 3;
      ctx.setLineDash([6, 5]);
      ctx.strokeRect(m1X - m1W / 2 - 6, m1Y - m1H / 2 - 6, m1W + 12, m1H + 12);
      ctx.setLineDash([]);
    }

    // Damper Bracket on M1
    ctx.fillStyle = '#475569';
    const bracketX = m1X - m1W / 2 + 10;
    ctx.fillRect(bracketX, m2Y - 20, 10, 40 + m2H / 2);

    if (p.damperOn) {
      // M2 Wheels
      const m2WheelR = 6;
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(m2X - m2W / 2 + 10, m2Y + m2H / 2 + 4, m2WheelR, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(m2X + m2W / 2 - 10, m2Y + m2H / 2 + 4, m2WheelR, 0, Math.PI * 2);
      ctx.fill();

      // M2 to M1 Connectors
      drawSpring(ctx, bracketX + 10, m2Y - 10, m2X - m2W / 2, m2Y - 10, 8, 6);
      drawDashpot(ctx, bracketX + 10, m2Y + 10, m2X - m2W / 2, m2Y + 10, 8);

      // Render M2 Body
      ctx.fillStyle = '#f59e0b'; // Amber
      ctx.shadowColor = 'rgba(0,0,0,0.2)';
      ctx.shadowBlur = 6;
      ctx.shadowOffsetY = 3;
      ctx.fillRect(m2X - m2W / 2, m2Y - m2H / 2, m2W, m2H);
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;

      // M2 Label
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px "Inter", sans-serif';
      ctx.fillText('m₂', m2X, m2Y + 6);

      if (dragTarget === 'm2') {
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 3;
        ctx.setLineDash([6, 5]);
        ctx.strokeRect(m2X - m2W / 2 - 6, m2Y - m2H / 2 - 6, m2W + 12, m2H + 12);
        ctx.setLineDash([]);
      }
    }

    // Driving Force Vector
    const force = p.forcingAmp * Math.sin(2 * Math.PI * p.forcingFreq * time);
    if (Math.abs(force) > 0.1) {
      const fLen = force * 2; // px scale for force vector
      const dir = Math.sign(force);
      const fStartX = m1X + m1W / 2;
      const fStartY = m1Y;

      ctx.strokeStyle = '#ef4444'; // Red force
      ctx.fillStyle = '#ef4444';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(fStartX, fStartY);
      ctx.lineTo(fStartX + fLen, fStartY);
      ctx.stroke();

      // Arrow head
      ctx.beginPath();
      ctx.moveTo(fStartX + fLen, fStartY);
      ctx.lineTo(fStartX + fLen - dir * 12, fStartY - 8);
      ctx.lineTo(fStartX + fLen - dir * 12, fStartY + 8);
      ctx.fill();

      ctx.font = '600 16px "Inter", sans-serif';
      ctx.textAlign = dir > 0 ? 'left' : 'right';
      ctx.fillText('F(t)', fStartX + fLen + dir * 10, fStartY + 5);
    }
  }

  function handlePointerDown(event) {
    const pt = pointerPosition(event);
    const layout = getLayout();
    if (p.damperOn && hitBox(pt, layout.m2X, layout.m2Y, layout.m2W, layout.m2H)) {
      dragTarget = 'm2';
    } else if (hitBox(pt, layout.m1X, layout.m1Y, layout.m1W, layout.m1H)) {
      dragTarget = 'm1';
    } else {
      return;
    }
    canvas.setPointerCapture?.(event.pointerId);
    setDisplacementFromPointer(event);
  }

  function handlePointerMove(event) {
    if (!dragTarget) return;
    setDisplacementFromPointer(event);
  }

  function handlePointerUp(event) {
    if (!dragTarget) return;
    dragTarget = null;
    canvas.releasePointerCapture?.(event.pointerId);
    render();
  }

  let rafId;
  let lastTs;
  let running = false;

  function loop(ts) {
    if (!running) return;
    const dt = lastTs === undefined ? 1 / 60 : Math.min((ts - lastTs) / 1000, 1 / 20);
    lastTs = ts;
    tick(dt);
    render();
    rafId = requestAnimationFrame(loop);
  }

  initState();
  canvas.addEventListener('pointerdown', handlePointerDown);
  canvas.addEventListener('pointermove', handlePointerMove);
  canvas.addEventListener('pointerup', handlePointerUp);
  canvas.addEventListener('pointercancel', handlePointerUp);
  render();

  return {
    start() {
      if (running) return;
      running = true;
      lastTs = undefined;
      rafId = requestAnimationFrame(loop);
    },
    stop() {
      running = false;
      cancelAnimationFrame(rafId);
    },
    reset() {
      this.stop();
      initState();
      render();
    },
    setParams(next) {
      Object.assign(p, next);
      render();
    },
    destroy() {
      this.stop();
      canvas.removeEventListener('pointerdown', handlePointerDown);
      canvas.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('pointerup', handlePointerUp);
      canvas.removeEventListener('pointercancel', handlePointerUp);
    },
    getData() {
      return {
        time,
        x1: state[0],
        x2: p.damperOn ? state[2] : state[0], // If no damper, it doesn't move relative to ground or just stays at 0? Return 0 for graph clarity.
        force: p.forcingAmp * Math.sin(2 * Math.PI * p.forcingFreq * time),
      };
    },
  };
}
