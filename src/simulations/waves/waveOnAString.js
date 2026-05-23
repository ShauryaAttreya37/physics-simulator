/**
 * Wave on a String - Smooth & Large Cyber-Arcade Edition
 *
 * Simulates a high-resolution, transverse wave propagating through a hanging/slack string.
 * High-resolution physics (150 beads) and sub-stepped integration provide buttery smoothness.
 * Stripped of rulers, featuring large, bold 2000s arcade vector elements.
 */

const DEFAULTS = {
  sourceType: 'oscillate', // 'oscillate', 'pulse', 'manual'
  endType: 'fixed', // 'fixed', 'free', 'none' (absorbing)
  amplitude: 50, // Peak driving displacement (pixels)
  frequency: 1.5, // Driving frequency (Hz)
  damping: 0.015, // Base damping across the string
  tension: 'medium', // 'low', 'medium', 'high' -> changes wave speed
  showReferenceLine: true, // Horizontal equilibrium reference line
  showGrid: true,
  viewScale: 1.0,
};

export const defaultParams = { ...DEFAULTS };

export const equationSections = [
  {
    title: 'Wave Propagation',
    content:
      'A transverse wave is a disturbance that travels through a medium, where the individual particles move perpendicular to the direction of wave travel. The particles themselves only oscillate up and down; they do not travel down the string.',
    equations: [
      {
        latex: String.raw`v = f \lambda`,
        description: 'Wave Speed Formula (v = speed, f = frequency, lambda = wavelength)',
      },
      {
        latex: String.raw`v = \sqrt{\frac{T}{\mu}}`,
        description: 'Speed of a wave on a string (T = tension, mu = linear mass density)',
      },
    ],
  },
  {
    title: 'Boundary Behavior',
    content:
      "When a wave hits a boundary, it reflects. The phase of the reflection depends on the boundary constraint:\n1. Fixed End: The wave reflects and inverts (180° phase shift) due to Newton's third law.\n2. Loose End: The wave reflects upright (0° phase shift) as the end ring slides frictionlessly.\n3. Open End: Waves exit without reflection, transferring energy out of the system.",
    equations: [
      {
        latex: String.raw`y_{\text{reflected}}(x, t) = -y_{\text{incident}}(-x, t)`,
        description: 'Fixed boundary reflection (inversion)',
      },
    ],
  },
];

export const equations = equationSections.flatMap((s) => s.equations || []);

export const controls = [
  {
    key: 'sourceType',
    label: 'Wave Source',
    type: 'select',
    options: [
      { label: 'Oscillator (Sine)', value: 'oscillate' },
      { label: 'Single Pulse', value: 'pulse' },
      { label: 'Manual Wiggle', value: 'manual' },
    ],
  },
  {
    key: 'endType',
    label: 'String Boundary',
    type: 'select',
    options: [
      { label: 'Fixed End (Clamp)', value: 'fixed' },
      { label: 'Loose End (Ring on Rod)', value: 'free' },
      { label: 'No End (Infinite String)', value: 'none' },
    ],
  },
  { key: 'amplitude', label: 'Amplitude [cm]', min: 0, max: 100, step: 1 },
  { key: 'frequency', label: 'Frequency [Hz]', min: 0.2, max: 3.0, step: 0.1 },
  { key: 'damping', label: 'Damping (Friction)', min: 0.0, max: 0.1, step: 0.002 },
  {
    key: 'tension',
    label: 'String Tension',
    type: 'select',
    options: [
      { label: 'Low (Slow Waves)', value: 'low' },
      { label: 'Medium (Normal)', value: 'medium' },
      { label: 'High (Fast Waves)', value: 'high' },
    ],
  },
  { key: 'showReferenceLine', label: 'Show Reference Lines', type: 'toggle' },
];

export const graphParams = [
  { key: 'centerBeadY', label: 'Green Tracker Displacement' },
  { key: 'mechanicalEnergy', label: 'Total String Mechanical Energy' },
];

export const scenarios = [
  {
    name: 'Standing Wave (Fixed End)',
    description: 'Perfect constructive/destructive resonance on a clamped string.',
    params: {
      sourceType: 'oscillate',
      endType: 'fixed',
      frequency: 1.5,
      amplitude: 45,
      damping: 0.004,
      tension: 'medium',
    },
  },
  {
    name: 'Pulse Reflection (Inversion)',
    description: 'Trigger a single pulse and watch it invert when reflecting off a fixed clamp.',
    params: {
      sourceType: 'pulse',
      endType: 'fixed',
      amplitude: 60,
      damping: 0.002,
      tension: 'medium',
    },
  },
  {
    name: 'Loose End Bounce (Upright)',
    description: 'A single pulse reflects upright off a frictionless sliding ring.',
    params: {
      sourceType: 'pulse',
      endType: 'free',
      amplitude: 60,
      damping: 0.002,
      tension: 'medium',
    },
  },
  {
    name: 'No Reflection (Absorbing)',
    description: 'Watch waves exit smoothly on an infinite string with an absorbing boundary.',
    params: {
      sourceType: 'oscillate',
      endType: 'none',
      frequency: 1.8,
      amplitude: 50,
      damping: 0.005,
      tension: 'medium',
    },
  },
];

export const guidedExperiments = [
  {
    title: 'Project 1: Wave Speed vs Tension',
    steps: [
      'Set Wave Source to Single Pulse and Boundary to No End (Infinite String).',
      'Set String Tension to Low.',
      'Click the "TRIGGER PULSE" button on the bottom of the screen, and use a stopwatch to measure the time it takes for the pulse peak to travel across the grid.',
      'Now, set String Tension to High. Trigger another pulse.',
      'Observe: How does increasing tension affect the propagation speed of the wave? State the physical relationship.',
    ],
  },
  {
    title: 'Project 2: Boundary Reflection Phase Shifts',
    steps: [
      'Select the Scenario "Pulse Reflection (Inversion)". Click Reset and play.',
      "Observe: When the upward-pointing pulse hits the fixed red clamp on the right, does it bounce back pointing up or pointing down? Explain why this inversion happens in terms of Newton's Third Law.",
      'Now, change String Boundary to Loose End (Ring on Rod). Trigger a pulse.',
      'Observe: Describe the difference in reflection. Explain why the ring shoots up higher than the original pulse height.',
    ],
  },
];

export const classroomGuide = {
  objective:
    'Students will visually verify the wave speed relation to tension, identify nodes/antinodes in a standing wave, and discover phase changes during reflection.',
  starter: [
    'Introduce the "Sports Stadium Wave". Ask: When fans perform a wave, do individual people run around the stadium? Or do they stay in their seats? How is this related to how a physical wave carries energy?',
  ],
  teacherMoves: [
    'Demonstrate the Piston Hook: Click and drag the left golden ring from the ground, lift it against gravity, and hook it to the green engine loop to trigger wave motion.',
    'Point out the Green Tracker band on the solid string: Note how this point only moves vertically up and down, demonstrating wave propagation is energy transport, not mass transport!',
    'Change the Boundary to "No End" (Infinite String) to show a clean traveling wave before introducing the complexity of reflections.',
    'Introduce "Loose End" and guide students to observe that the free-moving ring reaches double the amplitude of the incoming wave.',
  ],
  studentChecks: [
    'Why does the wave travel faster when the tension is set to High?',
    'Under what boundary condition (Fixed, Free, or Absorbing) does a wave NOT reflect back?',
    'What happens to the wavelength on the string if you increase the frequency of the oscillator? (Higher frequency = shorter wavelength).',
  ],
  exitTicket:
    'Explain in terms of forces why a fixed boundary causes a wave to invert upon reflection, while a loose boundary does not.',
};

export function create(canvas, initialParams) {
  const ctx = canvas.getContext('2d');
  let dpr = window.devicePixelRatio || 1;
  let p = { ...DEFAULTS, ...initialParams };
  let simTime = 0;
  let running = false;
  let raf;

  // High-Resolution Smooth Physics state
  const NUM_BEADS = 150; // Doubled resolution for buttery smoothness
  let y = new Float32Array(NUM_BEADS);
  let v = new Float32Array(NUM_BEADS);

  // Hook-snapping & Slack states
  let isHooked = false; // Initially unhooked and slack
  let bead0X = 80 - 16; // Starts at piston column coordinate

  // Pulse generator state
  let pulseTriggered = false;
  let lastPulseTriggerTime = -100;

  // History buffer for manual wiggling delay line
  let history = [];

  function getHistoryY(targetTime) {
    if (history.length === 0) return 0;
    if (targetTime > history[history.length - 1].time) {
      return history[history.length - 1].y;
    }
    if (targetTime < history[0].time) {
      return 0;
    }

    // Binary search for efficiency
    let low = 0;
    let high = history.length - 1;
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const t = history[mid].time;
      if (t === targetTime) return history[mid].y;
      if (t < targetTime) {
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    // If not found exactly, interpolate between high and low
    const idx1 = Math.max(0, Math.min(history.length - 2, high));
    const idx2 = idx1 + 1;
    const h1 = history[idx1];
    const h2 = history[idx2];
    const dt = h2.time - h1.time;
    if (dt === 0) return h1.y;
    const fraction = (targetTime - h1.time) / dt;
    return h1.y + fraction * (h2.y - h1.y);
  }

  // Interactivity state
  let draggedBeadIdx = -1; // index 0 represents the left ring
  let hoverBeadIdx = -1;

  // Sound/Vibration impact flash
  let impactFlash = 0;

  // Setup canvas size
  function setupCanvas() {
    dpr = window.devicePixelRatio || 1;
    const wrapper = canvas.parentElement;
    if (!wrapper) return;
    const w = wrapper.offsetWidth;
    const h = wrapper.offsetHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
  }

  function getWaveSpeed() {
    if (p.tension === 'low') return 3.5;
    if (p.tension === 'high') return 8.5;
    return 5.5; // medium
  }

  function getWaveSpeedPx() {
    if (p.tension === 'low') return 160;
    if (p.tension === 'high') return 400;
    return 260; // medium
  }

  function updatePhysics(dt) {
    const vWave = getWaveSpeedPx();
    const omega = 2 * Math.PI * p.frequency;
    const alpha = p.damping * 0.015;
    const floorY = 125;

    const bx = isHooked ? 80 - 16 : bead0X;
    const paddingX = 80;
    const stringW = canvas.width / dpr - paddingX - 100;
    const rx = paddingX + (NUM_BEADS - 1) * (stringW / (NUM_BEADS - 1));
    const L = rx - bx;

    const nextY = new Float32Array(NUM_BEADS);

    if (isHooked || draggedBeadIdx === 0) {
      // 1. ACTIVE WAVE MODE (Hooked or actively dragging ring)

      // Update Bead 0 position (driver input)
      if (draggedBeadIdx === 0) {
        nextY[0] = y[0];
      } else {
        if (p.sourceType === 'oscillate') {
          nextY[0] = p.amplitude * Math.sin(omega * simTime);
        } else if (p.sourceType === 'pulse') {
          if (pulseTriggered) {
            const tElapsed = simTime - lastPulseTriggerTime;
            const t0 = 0.25;
            const sigma = 0.08;
            nextY[0] = p.amplitude * Math.exp(-Math.pow((tElapsed - t0) / sigma, 2));
            if (tElapsed > 4.0) {
              pulseTriggered = false;
            }
          } else {
            nextY[0] = 0;
          }
        } else if (p.sourceType === 'manual') {
          nextY[0] = 0;
        }
      }

      // Record driver's actual displacement into history
      history.push({ time: simTime, y: nextY[0] });

      // Keep only enough history to cover double path length (reflection roundtrip)
      const maxDelay = (2 * L) / vWave;
      const cutoffTime = simTime - maxDelay - 2.0;
      while (history.length > 0 && history[0].time < cutoffTime) {
        history.shift();
      }

      // Propagate wave along the string using history lookup
      for (let i = 1; i < NUM_BEADS; i++) {
        const px = bx + (i / (NUM_BEADS - 1)) * L;
        const d = px - bx;

        const dampFactor = Math.exp(-alpha * d);
        const dReflect = 2 * L - d;
        const dampFactorReflect = Math.exp(-alpha * dReflect);
        const reflectFactor = d / L;

        // Incident wave
        const tIncident = simTime - d / vWave;
        const yIncident = getHistoryY(tIncident) * dampFactor;

        // Reflected wave
        let yReflected = 0;
        const tReflect = simTime - dReflect / vWave;
        if (tReflect >= 0) {
          if (p.endType === 'fixed') {
            yReflected = -getHistoryY(tReflect) * dampFactorReflect * reflectFactor;
          } else if (p.endType === 'free') {
            yReflected = getHistoryY(tReflect) * dampFactorReflect * reflectFactor;
          }
        }

        nextY[i] = yIncident + yReflected;
      }
    } else {
      // 2. SLACK ROPE MODE (Unhooked, lying on the floor)
      const yLeft = y[0];
      const yRight = 0;

      const L1 = Math.max(40, (floorY - yLeft) * 0.8);
      const L2 = Math.max(40, (floorY - yRight) * 0.8);
      let scale = 1.0;
      if (L1 + L2 > L) {
        scale = L / (L1 + L2);
      }
      const effL1 = L1 * scale;
      const effL2 = L2 * scale;

      nextY[0] = yLeft;
      for (let i = 1; i < NUM_BEADS; i++) {
        const px = bx + (i / (NUM_BEADS - 1)) * L;
        const d = px - bx;

        if (d < effL1) {
          const t = d / effL1;
          nextY[i] = yLeft + (floorY - yLeft) * (3 * t * t - 2 * t * t * t);
        } else if (L - d < effL2) {
          const t = (L - d) / effL2;
          nextY[i] = yRight + (floorY - yRight) * (3 * t * t - 2 * t * t * t);
        } else {
          nextY[i] = floorY;
        }
      }
    }

    for (let i = 0; i < NUM_BEADS; i++) {
      v[i] = (nextY[i] - y[i]) / (dt || 0.016);
    }

    y.set(nextY);

    if (impactFlash > 0) impactFlash -= dt * 2.5;
  }

  function drawTitle() {
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 15px "Montserrat", sans-serif';
    ctx.fillText('WAVE ON A STRING', 20, 32);

    ctx.font = '11px "Montserrat", sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(
      `Transverse Wave Speed: v = \u221a(T/\u03bc) = ${(getWaveSpeed() * 1.5).toFixed(1)} m/s (Tension: ${p.tension.toUpperCase()})`,
      20,
      50,
    );
  }

  function drawGrid(W, H) {
    if (!p.showGrid) return;
    ctx.strokeStyle = 'rgba(20, 184, 166, 0.12)';
    ctx.lineWidth = 1;

    const spacing = 40;
    for (let x = 80; x < W; x += spacing) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }

    const centerY = H / 2;
    for (let dy = -160; dy <= 160; dy += spacing) {
      ctx.beginPath();
      ctx.moveTo(0, centerY + dy);
      ctx.lineTo(W, centerY + dy);
      ctx.stroke();
    }
  }

  function drawGround(W, H) {
    const centerY = H / 2;
    const floorY = centerY + 125;

    ctx.save();

    // Concrete-like floor gradient
    const floorGrad = ctx.createLinearGradient(0, floorY, 0, H);
    floorGrad.addColorStop(0, '#334155');
    floorGrad.addColorStop(0.3, '#1e293b');
    floorGrad.addColorStop(1, '#0f172a');
    ctx.fillStyle = floorGrad;
    ctx.fillRect(0, floorY, W, H - floorY);

    // Subtle diagonal hash marks (workshop floor)
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.06)';
    ctx.lineWidth = 1;
    const stripeSpacing = 12;
    for (let x = -H; x < W + H; x += stripeSpacing) {
      ctx.beginPath();
      ctx.moveTo(x, floorY);
      ctx.lineTo(x + (H - floorY), H);
      ctx.stroke();
    }

    // Beveled edge highlight
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, floorY + 1);
    ctx.lineTo(W, floorY + 1);
    ctx.stroke();

    // Surface line
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, floorY);
    ctx.lineTo(W, floorY);
    ctx.stroke();

    ctx.restore();
  }

  function drawMachine(W, H) {
    const centerY = H / 2;
    const pistonX = 80 - 16;

    ctx.save();

    // --- Base plate (bolted to floor) ---
    const baseY = centerY + 115;
    const baseGrad = ctx.createLinearGradient(pistonX - 30, 0, pistonX + 30, 0);
    baseGrad.addColorStop(0, '#475569');
    baseGrad.addColorStop(0.5, '#64748b');
    baseGrad.addColorStop(1, '#475569');
    ctx.fillStyle = baseGrad;
    ctx.beginPath();
    ctx.roundRect(pistonX - 28, baseY, 56, 10, 2);
    ctx.fill();
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Base bolts
    for (const bx of [pistonX - 18, pistonX + 18]) {
      ctx.fillStyle = '#94a3b8';
      ctx.beginPath();
      ctx.arc(bx, baseY + 5, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#64748b';
      ctx.beginPath();
      ctx.arc(bx, baseY + 5, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // --- Guide column (brushed steel) ---
    const colTop = centerY - 110;
    const colBot = baseY;
    const colGrad = ctx.createLinearGradient(pistonX - 8, 0, pistonX + 8, 0);
    colGrad.addColorStop(0, '#334155');
    colGrad.addColorStop(0.3, '#64748b');
    colGrad.addColorStop(0.5, '#94a3b8');
    colGrad.addColorStop(0.7, '#64748b');
    colGrad.addColorStop(1, '#334155');
    ctx.fillStyle = colGrad;
    ctx.fillRect(pistonX - 7, colTop, 14, colBot - colTop);
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.strokeRect(pistonX - 7, colTop, 14, colBot - colTop);

    // Brushed steel lines on column
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.15)';
    ctx.lineWidth = 0.5;
    for (let ly = colTop + 4; ly < colBot; ly += 6) {
      ctx.beginPath();
      ctx.moveTo(pistonX - 6, ly);
      ctx.lineTo(pistonX + 6, ly);
      ctx.stroke();
    }

    // --- Top mount bracket ---
    const mountGrad = ctx.createLinearGradient(0, colTop - 6, 0, colTop + 8);
    mountGrad.addColorStop(0, '#64748b');
    mountGrad.addColorStop(1, '#334155');
    ctx.fillStyle = mountGrad;
    ctx.beginPath();
    ctx.roundRect(pistonX - 24, colTop - 4, 48, 12, 3);
    ctx.fill();
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Mount bolts
    for (const bx of [pistonX - 16, pistonX + 16]) {
      ctx.fillStyle = '#cbd5e1';
      ctx.beginPath();
      ctx.arc(bx, colTop + 2, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }

    // --- Motor housing ---
    const motorY = colTop - 4;
    const motorH = 30;
    const motorGrad = ctx.createLinearGradient(pistonX - 22, 0, pistonX + 22, 0);
    motorGrad.addColorStop(0, '#1e293b');
    motorGrad.addColorStop(0.3, '#334155');
    motorGrad.addColorStop(0.7, '#334155');
    motorGrad.addColorStop(1, '#1e293b');
    ctx.fillStyle = motorGrad;
    ctx.beginPath();
    ctx.roundRect(pistonX - 22, motorY - motorH, 44, motorH, 4);
    ctx.fill();
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Motor indicator LED
    const ledOn = running;
    ctx.fillStyle = ledOn ? '#22c55e' : '#475569';
    ctx.shadowColor = ledOn ? '#22c55e' : 'transparent';
    ctx.shadowBlur = ledOn ? 6 : 0;
    ctx.beginPath();
    ctx.arc(pistonX, motorY - motorH + 8, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // --- Piston calculation ---
    let py = 0;
    if (isHooked) {
      py = y[0];
    } else {
      if (p.sourceType === 'oscillate') {
        const omega = 2 * Math.PI * p.frequency;
        py = p.amplitude * Math.sin(omega * simTime);
      } else if (p.sourceType === 'pulse' && pulseTriggered) {
        const tElapsed = simTime - lastPulseTriggerTime;
        const t0 = 0.25;
        const sigma = 0.08;
        py = p.amplitude * Math.exp(-Math.pow((tElapsed - t0) / sigma, 2));
      }
    }

    // --- Piston shaft (metallic cylinder) ---
    const shaftTop = centerY + py - 50;
    const shaftBot = centerY + py;
    const shaftGrad = ctx.createLinearGradient(pistonX - 5, 0, pistonX + 5, 0);
    shaftGrad.addColorStop(0, '#b45309');
    shaftGrad.addColorStop(0.3, '#f59e0b');
    shaftGrad.addColorStop(0.5, '#fbbf24');
    shaftGrad.addColorStop(0.7, '#f59e0b');
    shaftGrad.addColorStop(1, '#b45309');
    ctx.fillStyle = shaftGrad;
    ctx.fillRect(pistonX - 4, shaftTop, 8, shaftBot - shaftTop);
    ctx.strokeStyle = '#92400e';
    ctx.lineWidth = 0.8;
    ctx.strokeRect(pistonX - 4, shaftTop, 8, shaftBot - shaftTop);

    // --- Piston head block (3D beveled) ---
    const headW = 32;
    const headH = 14;
    const headX = pistonX - headW / 2;
    const headY = shaftTop - headH + 4;
    const headGrad = ctx.createLinearGradient(0, headY, 0, headY + headH);
    headGrad.addColorStop(0, '#64748b');
    headGrad.addColorStop(0.4, '#475569');
    headGrad.addColorStop(1, '#334155');
    ctx.fillStyle = headGrad;
    ctx.beginPath();
    ctx.roundRect(headX, headY, headW, headH, 2);
    ctx.fill();
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // Highlight bevel
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(headX + 2, headY + 1);
    ctx.lineTo(headX + headW - 2, headY + 1);
    ctx.stroke();

    // --- Hook ring (green, glowing) ---
    ctx.shadowColor = '#22c55e';
    ctx.shadowBlur = 8;
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(pistonX, centerY + py, 12, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.arc(pistonX, centerY + py, 3.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function drawString(W, H) {
    const centerY = H / 2;
    const paddingX = 80;
    const stringW = W - paddingX - 100;
    const dx = stringW / (NUM_BEADS - 1);

    const rx = paddingX + (NUM_BEADS - 1) * dx;
    const bx = isHooked ? paddingX - 16 : bead0X;

    // Reference equilibrium line
    if (p.showReferenceLine) {
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.12)';
      ctx.lineWidth = 1;
      ctx.setLineDash([6, 8]);
      ctx.beginPath();
      ctx.moveTo(paddingX, centerY);
      ctx.lineTo(W - 80, centerY);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Compute string coordinates in 2D
    const points = [];
    for (let i = 0; i < NUM_BEADS; i++) {
      const px = bx + (i / (NUM_BEADS - 1)) * (rx - bx);
      const py = centerY + y[i];
      points.push({ x: px, y: py });
    }

    // Draw string with depth: shadow, dark outline, bright core, highlight
    ctx.save();

    // Drop shadow
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.lineWidth = 12;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y + 3);
    for (let i = 1; i < NUM_BEADS; i++) {
      ctx.lineTo(points[i].x, points[i].y + 3);
    }
    ctx.stroke();

    // Dark outline
    ctx.strokeStyle = '#164e63';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < NUM_BEADS; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.stroke();

    // Core color
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < NUM_BEADS; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.stroke();

    // Highlight line (top edge shine)
    ctx.strokeStyle = 'rgba(165, 243, 252, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y - 2);
    for (let i = 1; i < NUM_BEADS; i++) {
      ctx.lineTo(points[i].x, points[i].y - 2);
    }
    ctx.stroke();

    ctx.restore();

    // Green tracker band
    const midIdx = Math.floor(NUM_BEADS / 2);
    const mx = points[midIdx].x;
    const my = points[midIdx].y;

    ctx.save();
    // Glow
    ctx.shadowColor = '#22c55e';
    ctx.shadowBlur = 6;
    ctx.fillStyle = '#22c55e';
    ctx.strokeStyle = '#15803d';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(mx, my, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Highlight dot
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath();
    ctx.arc(mx - 2, my - 2, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function drawLeftRing(W, H) {
    const centerY = H / 2;
    const bx = isHooked ? 80 - 16 : bead0X;
    const by = centerY + y[0];

    ctx.save();

    // Hover glow
    if (hoverBeadIdx === 0 || draggedBeadIdx === 0) {
      ctx.shadowColor = '#fbbf24';
      ctx.shadowBlur = 15;
      ctx.fillStyle = 'rgba(251, 191, 36, 0.2)';
      ctx.beginPath();
      ctx.arc(bx, by, 24, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // Metallic golden ring with 3D gradient
    const ringGrad = ctx.createRadialGradient(bx - 3, by - 3, 2, bx, by, 14);
    ringGrad.addColorStop(0, '#fde68a');
    ringGrad.addColorStop(0.4, '#fbbf24');
    ringGrad.addColorStop(0.8, '#d97706');
    ringGrad.addColorStop(1, '#92400e');
    ctx.fillStyle = ringGrad;
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(bx, by, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Inner ring hole
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(bx, by, 5, 0, Math.PI * 2);
    ctx.fill();

    // Specular highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.beginPath();
    ctx.arc(bx - 3, by - 4, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function drawRightAttachment(W, H) {
    const centerY = H / 2;
    const paddingX = 80;
    const stringW = W - paddingX - 100;
    const dx = stringW / (NUM_BEADS - 1);
    const rx = paddingX + (NUM_BEADS - 1) * dx;

    if (p.endType === 'fixed') {
      ctx.save();
      ctx.translate(rx, centerY);

      // --- Wall block (concrete/metal) ---
      const wallGrad = ctx.createLinearGradient(0, -50, 30, -50);
      wallGrad.addColorStop(0, '#475569');
      wallGrad.addColorStop(0.5, '#64748b');
      wallGrad.addColorStop(1, '#475569');
      ctx.fillStyle = wallGrad;
      ctx.beginPath();
      ctx.roundRect(4, -50, 28, 100, 3);
      ctx.fill();
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Brushed texture
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.12)';
      ctx.lineWidth = 0.5;
      for (let ly = -48; ly < 48; ly += 4) {
        ctx.beginPath();
        ctx.moveTo(6, ly);
        ctx.lineTo(30, ly);
        ctx.stroke();
      }

      // Wall edge highlight
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(5, -49);
      ctx.lineTo(5, 49);
      ctx.stroke();

      // --- Clamp jaws (red metallic) ---
      const jawGrad = ctx.createLinearGradient(0, 0, 0, -12);
      jawGrad.addColorStop(0, '#dc2626');
      jawGrad.addColorStop(0.5, '#f87171');
      jawGrad.addColorStop(1, '#dc2626');

      // Top jaw
      ctx.fillStyle = jawGrad;
      ctx.beginPath();
      ctx.roundRect(-10, -10, 18, 8, 2);
      ctx.fill();
      ctx.strokeStyle = '#991b1b';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Bottom jaw
      ctx.fillStyle = jawGrad;
      ctx.beginPath();
      ctx.roundRect(-10, 2, 18, 8, 2);
      ctx.fill();
      ctx.strokeStyle = '#991b1b';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Jaw teeth lines
      ctx.strokeStyle = '#7f1d1d';
      ctx.lineWidth = 1;
      for (let tx = -7; tx <= 5; tx += 4) {
        ctx.beginPath();
        ctx.moveTo(tx, -3);
        ctx.lineTo(tx, -1);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(tx, 1);
        ctx.lineTo(tx, 3);
        ctx.stroke();
      }

      // Bolts on wall
      for (const boltY of [-30, 30]) {
        ctx.fillStyle = '#94a3b8';
        ctx.beginPath();
        ctx.arc(18, boltY, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillStyle = '#64748b';
        ctx.beginPath();
        ctx.arc(18, boltY, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    } else if (p.endType === 'free') {
      ctx.save();

      // --- Vertical rod (polished steel) ---
      const rodGrad = ctx.createLinearGradient(rx - 4, 0, rx + 4, 0);
      rodGrad.addColorStop(0, '#334155');
      rodGrad.addColorStop(0.3, '#94a3b8');
      rodGrad.addColorStop(0.5, '#cbd5e1');
      rodGrad.addColorStop(0.7, '#94a3b8');
      rodGrad.addColorStop(1, '#334155');
      ctx.fillStyle = rodGrad;
      ctx.fillRect(rx - 3.5, centerY - 130, 7, 260);
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      ctx.strokeRect(rx - 3.5, centerY - 130, 7, 260);

      // Top stopper
      const stopGrad = ctx.createLinearGradient(0, centerY - 134, 0, centerY - 126);
      stopGrad.addColorStop(0, '#475569');
      stopGrad.addColorStop(1, '#1e293b');
      ctx.fillStyle = stopGrad;
      ctx.beginPath();
      ctx.roundRect(rx - 12, centerY - 134, 24, 8, 2);
      ctx.fill();
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Bottom stopper
      ctx.fillStyle = stopGrad;
      ctx.beginPath();
      ctx.roundRect(rx - 12, centerY + 126, 24, 8, 2);
      ctx.fill();
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1;
      ctx.stroke();

      // --- Sliding ring (golden, metallic) ---
      const ringY = centerY + y[NUM_BEADS - 1];
      const slideGrad = ctx.createRadialGradient(rx - 2, ringY - 2, 2, rx, ringY, 13);
      slideGrad.addColorStop(0, '#fde68a');
      slideGrad.addColorStop(0.4, '#fbbf24');
      slideGrad.addColorStop(0.8, '#d97706');
      slideGrad.addColorStop(1, '#92400e');
      ctx.fillStyle = slideGrad;
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(rx, ringY, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Inner hole
      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.arc(rx, ringY, 4.5, 0, Math.PI * 2);
      ctx.fill();

      // Specular highlight
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.beginPath();
      ctx.arc(rx - 3, ringY - 3, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    } else {
      ctx.save();
      ctx.translate(rx - 2, centerY - 130);

      // --- Absorbing foam panel ---
      const foamGrad = ctx.createLinearGradient(0, 0, 50, 0);
      foamGrad.addColorStop(0, '#1e293b');
      foamGrad.addColorStop(0.5, '#334155');
      foamGrad.addColorStop(1, '#1e293b');
      ctx.fillStyle = foamGrad;
      ctx.beginPath();
      ctx.roundRect(0, 0, 50, 260, 6);
      ctx.fill();
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Foam pyramid texture
      ctx.fillStyle = 'rgba(100, 116, 139, 0.15)';
      for (let fy = 8; fy < 252; fy += 14) {
        for (let fx = 6; fx < 44; fx += 14) {
          ctx.beginPath();
          ctx.moveTo(fx, fy + 10);
          ctx.lineTo(fx + 5, fy);
          ctx.lineTo(fx + 10, fy + 10);
          ctx.closePath();
          ctx.fill();
        }
      }

      // Cyan indicator strip
      ctx.fillStyle = '#06b6d4';
      ctx.globalAlpha = 0.4;
      ctx.fillRect(22, 10, 6, 240);
      ctx.globalAlpha = 1.0;

      ctx.restore();
    }
  }

  function drawPulseButton(W, H) {
    if (p.sourceType !== 'pulse') return;
    const bx = 160;
    const by = H - 54;
    const bw = 150;
    const bh = 36;

    ctx.save();
    const btnHover = mouseInRect(lastMouseX, lastMouseY, bx, by, bw, bh);

    ctx.fillStyle = pulseTriggered ? '#10b981' : btnHover ? '#06b6d4' : '#0891b2';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(bx, by, bw, bh, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(bx + 18, by + 12);
    ctx.lineTo(bx + 26, by + 18);
    ctx.lineTo(bx + 18, by + 24);
    ctx.closePath();
    ctx.fill();

    ctx.font = 'bold 11px "Montserrat", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(pulseTriggered ? 'GENERATING...' : 'TRIGGER PULSE', bx + 36, by + 22);
    ctx.restore();
  }

  function mouseInRect(mx, my, rx, ry, rw, rh) {
    return mx >= rx && mx <= rx + rw && my >= ry && my <= ry + rh;
  }

  let lastMouseX = 0;
  let lastMouseY = 0;

  function onPointerDown(e) {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const W = canvas.width / dpr;
    const H = canvas.height / dpr;
    const centerY = H / 2;

    // 1. Check if user clicked pulse button
    if (p.sourceType === 'pulse') {
      const bx = 160;
      const by = H - 54;
      if (mouseInRect(mx, my, bx, by, 150, 36)) {
        pulseTriggered = true;
        lastPulseTriggerTime = simTime;
        return;
      }
    }

    // 2. Proximity check for grab left ring (Bead 0) - Enlarged click hitbox
    const paddingX = 80;
    const bx = isHooked ? paddingX - 16 : bead0X;
    const by = centerY + y[0];
    const dist = Math.hypot(mx - bx, my - by);

    if (dist < 36) {
      draggedBeadIdx = 0;
      isHooked = false; // Grabbing instantly unhooks
      canvas.setPointerCapture(e.pointerId);
      return;
    }
  }

  function onPointerMove(e) {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    lastMouseX = mx;
    lastMouseY = my;

    const W = canvas.width / dpr;
    const H = canvas.height / dpr;
    const centerY = H / 2;

    // Left Ring hover detection
    const paddingX = 80;
    const bx = isHooked ? paddingX - 16 : bead0X;
    const by = centerY + y[0];
    const isOverRing = Math.hypot(mx - bx, my - by) < 36;
    hoverBeadIdx = isOverRing ? 0 : -1;

    // Drag left ring move in 2D
    if (draggedBeadIdx === 0) {
      bead0X = Math.max(20, Math.min(W - 120, mx));
      y[0] = Math.max(-140, Math.min(140, my - centerY));
      v[0] = 0;
      if (!running) renderAll();
      return;
    }

    // Update cursor style
    const hasActiveDrag = draggedBeadIdx === 0;
    const hasHoverElement = hoverBeadIdx === 0;

    if (hasActiveDrag) {
      canvas.style.cursor = 'grabbing';
    } else if (hasHoverElement) {
      canvas.style.cursor = 'grab';
    } else {
      canvas.style.cursor = 'default';
    }
  }

  function onPointerUp(e) {
    if (draggedBeadIdx === 0) {
      draggedBeadIdx = -1;
      canvas.releasePointerCapture(e.pointerId);

      const W = canvas.width / dpr;
      const H = canvas.height / dpr;
      const centerY = H / 2;

      // Snap distance check
      const omega = 2 * Math.PI * p.frequency;
      const pistonX = 80 - 16;
      let pistonY = centerY;
      if (p.sourceType === 'oscillate') {
        pistonY += p.amplitude * Math.sin(omega * simTime);
      } else if (p.sourceType === 'pulse' && pulseTriggered) {
        const tElapsed = simTime - lastPulseTriggerTime;
        const t0 = 0.25;
        const sigma = 0.08;
        pistonY += p.amplitude * Math.exp(-Math.pow((tElapsed - t0) / sigma, 2));
      }

      const dist = Math.hypot(bead0X - pistonX, centerY + y[0] - pistonY);

      if (dist < 36) {
        isHooked = true;
        bead0X = pistonX;
        y[0] = pistonY - centerY;
        v[0] = 0;
        impactFlash = 1.0;
      } else {
        isHooked = false;
      }
    }

    canvas.style.cursor = hoverBeadIdx === 0 ? 'grab' : 'default';
    renderAll();
  }

  function renderAll() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.scale(dpr, dpr);

    const W = canvas.width / dpr;
    const H = canvas.height / dpr;

    // Draw deep cyber-arcade blueprint background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, W, H);

    drawGrid(W, H);
    drawGround(W, H);
    drawMachine(W, H);
    drawString(W, H);
    drawLeftRing(W, H);
    drawRightAttachment(W, H);
    drawTitle();
    drawPulseButton(W, H);

    ctx.restore();
  }

  // Animation cycle (With exact analytical update)
  function loop() {
    if (!running) return;
    simTime += 0.016;

    updatePhysics(0.016);

    renderAll();
    raf = requestAnimationFrame(loop);
  }

  // Initialize
  setupCanvas();
  isHooked = true;
  bead0X = 80 - 16;
  y.fill(0);
  v.fill(0);
  renderAll();

  // Resize listener
  const handleResize = () => {
    setupCanvas();
    renderAll();
  };
  window.addEventListener('resize', handleResize);

  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointercancel', onPointerUp);

  return {
    start: () => {
      running = true;
      loop();
    },
    stop: () => {
      running = false;
      cancelAnimationFrame(raf);
    },
    reset: () => {
      simTime = 0;
      pulseTriggered = false;
      lastPulseTriggerTime = -100;
      history = [];
      isHooked = true;
      bead0X = 80 - 16;
      y.fill(0);
      v.fill(0);
      renderAll();
    },
    setParams: (next) => {
      p = { ...p, ...next };

      if (p.sourceType !== 'pulse') {
        pulseTriggered = false;
        lastPulseTriggerTime = -100;
      }

      // Auto-hook presets when loaded so they play immediately
      if (next.sourceType === 'oscillate' || next.sourceType === 'pulse') {
        isHooked = true;
        bead0X = 80 - 16;
      }
      renderAll();
    },
    getData: () => {
      let ke = 0;
      let pe = 0;
      const speed = getWaveSpeed();
      const c2 = speed * speed;
      const scaleN = (NUM_BEADS - 1) / 64;
      const coupling = c2 * scaleN * scaleN;

      for (let i = 0; i < NUM_BEADS; i++) {
        ke += 0.5 * v[i] * v[i];
        if (i < NUM_BEADS - 1) {
          const dy = y[i + 1] - y[i];
          pe += 0.5 * coupling * dy * dy;
        }
      }

      const greenBeadIdx = Math.floor(NUM_BEADS / 2);
      return {
        time: simTime,
        centerBeadY: y[greenBeadIdx] || 0,
        mechanicalEnergy: (ke + pe) / 1000,
      };
    },
    destroy: () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerUp);
    },
  };
}
