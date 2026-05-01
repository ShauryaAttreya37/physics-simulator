const DEFAULTS = {
  m1: 1.2,
  m2: 0.25,
  k1: 55,
  k2: 22,
  c1: 0.25,
  c2: 0.9,
  forcingAmp: 20,
  forcingFreq: 1.4,
};

export const defaultParams = {
  m1: 1.2,
  m2: 0.25,
  k1: 55,
  k2: 22,
  c1: 0.25,
  c2: 0.9,
  forcingAmp: 20,
  forcingFreq: 1.4,
};

export const equationSections = [
  {
    title: 'Introduction',
    content: 'A tuned mass damper (TMD) is a secondary mass attached to a primary structure to reduce vibrations. Tall buildings, bridges, and machines use TMDs to dampen oscillations from wind, earthquakes, or mechanical forces. The key is tuning the secondary mass and spring to absorb the primary structure\'s vibrations.',
  },
  {
    title: 'System Equations',
    equations: [
      {
        latex: String.raw`m_1 \ddot{x}_1 + c_1 \dot{x}_1 + k_1 x_1 = F_0 \sin(\omega t) + c_2(\dot{x}_2 - \dot{x}_1) + k_2(x_2 - x_1)`,
        description: 'Primary structure: external force, primary damping/spring, plus coupling forces from the secondary mass.',
      },
      {
        latex: String.raw`m_2 \ddot{x}_2 + c_2(\dot{x}_2 - \dot{x}_1) + k_2(x_2 - x_1) = 0`,
        description: 'Secondary damper: no external force, only coupling with primary structure.',
      },
    ],
    variables: [
      { symbol: 'm₁, m₂', description: 'Primary and secondary masses' },
      { symbol: 'k₁, k₂', description: 'Primary and secondary spring stiffnesses' },
      { symbol: 'c₁, c₂', description: 'Primary and secondary damping coefficients' },
      { symbol: 'F₀ sin(ωt)', description: 'Forcing function on primary structure' },
    ],
  },
  {
    title: 'Tuning Condition',
    equations: [
      {
        latex: String.raw`\omega_{TMD} = \omega_{primary} = \sqrt{k_2/m_2} = \sqrt{k_1/m_1}`,
        description: 'Optimal tuning: the TMD natural frequency matches the primary frequency for maximum energy transfer.',
      },
      {
        latex: String.raw`m_2/m_1 = 0.01 \text{ to } 0.1`,
        description: 'Typical mass ratio: secondary mass is 1-10% of primary mass.',
      },
    ],
  },
  {
    title: 'How to Use',
    content: '1. Set the primary mass m₁ and stiffness k₁ (determines natural frequency).\n2. Set secondary mass m₂ (usually smaller than m₁).\n3. Adjust secondary stiffness k₂ to tune the TMD frequency.\n4. Set damping c₂ for the damper - balances energy absorption vs stability.\n5. Apply forcing and watch x₁ and x₂ graphs.\n6. Try to minimize x₁ amplitude by tuning.',
  },
  {
    title: 'Beginner Tips',
    content: 'Start with "Optimal TMD" scenario to see full suppression. Then switch to "No Damper" to see resonance without TMD. Understand that the damper reduces primary amplitude by amplifying secondary displacement. Tuning is critical - slightly off-tune can reduce effectiveness. Many real-world structures use TMDs.',
  },
];

export const equations = [
  String.raw`m_1 \ddot{x}_1 + c_1 \dot{x}_1 + k_1 x_1 = F_0 \sin(\omega t) + c_2(\dot{x}_2 - \dot{x}_1) + k_2(x_2 - x_1)`,
  String.raw`m_2 \ddot{x}_2 + c_2(\dot{x}_2 - \dot{x}_1) + k_2(x_2 - x_1) = 0`
];

export const graphParams = [
  { key: 'x1', label: 'Primary Displacement ($x_1$)' },
  { key: 'x2', label: 'Damper Displacement ($x_2$)' }
];

export const controls = [
  { key: 'm1', label: 'Primary Mass', min: 0.4, max: 4, step: 0.05 },
  { key: 'm2', label: 'Damper Mass', min: 0.05, max: 2, step: 0.01 },
  { key: 'k1', label: 'Primary Stiffness', min: 5, max: 150, step: 1 },
  { key: 'k2', label: 'Damper Stiffness', min: 2, max: 80, step: 1 },
  { key: 'c1', label: 'Primary Damping', min: 0, max: 4, step: 0.01 },
  { key: 'c2', label: 'Damper Damping', min: 0, max: 6, step: 0.01 },
  { key: 'forcingAmp', label: 'Force Amplitude', min: 0, max: 100, step: 1 },
  { key: 'forcingFreq', label: 'Force Frequency', min: 0.1, max: 5, step: 0.01 },
];

function deriv(state, t, p) {
  const [x1, v1, x2, v2] = state;
  const force = p.forcingAmp * Math.sin(2 * Math.PI * p.forcingFreq * t);

  const relX = x1 - x2;
  const relV = v1 - v2;

  const a1 = (force - p.c1 * v1 - p.k1 * x1 - p.c2 * relV - p.k2 * relX) / p.m1;
  const a2 = (p.c2 * relV + p.k2 * relX) / p.m2;

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

export const scenarios = [
  {
    name: 'No Damper (Resonance)',
    description: 'Driving at natural frequency with no tuned mass — amplitude grows dramatically.',
    params: { m1: 10, k1: 100, c1: 0.5, m2: 0.5, k2: 5, c2: 0.1, F0: 5, driveFreq: 3.16, damperOn: false },
  },
  {
    name: 'Optimal TMD',
    description: 'TMD tuned to match the primary natural frequency — vibration suppressed.',
    params: { m1: 10, k1: 100, c1: 0.5, m2: 1.0, k2: 10, c2: 2.0, F0: 5, driveFreq: 3.16, damperOn: true },
  },
  {
    name: 'Off-Tune TMD',
    description: 'TMD frequency mismatched — partial suppression with split-peak resonance.',
    params: { m1: 10, k1: 100, c1: 0.5, m2: 1.0, k2: 25, c2: 1.5, F0: 5, driveFreq: 3.16, damperOn: true },
  },
  {
    name: 'Earthquake Excitation',
    description: 'Low-frequency high-amplitude driving — simulating seismic ground motion.',
    params: { m1: 10, k1: 100, c1: 0.5, m2: 1.5, k2: 10, c2: 3.0, F0: 15, driveFreq: 1.5, damperOn: true },
  },
];

export const guidedExperiments = [
  {
    title: 'Taming Resonance',
    steps: [
      {
        instruction: 'The building is being driven at its natural frequency with no TMD. Press Play and watch the amplitude.',
        params: { m1: 10, k1: 100, c1: 0.5, m2: 0.5, k2: 5, c2: 0.1, F0: 5, driveFreq: 3.16, damperOn: false },
        question: 'What happens when driving frequency equals natural frequency?',
        choices: ['Small steady oscillation', 'Amplitude grows continuously (resonance)', 'The system becomes still'],
        correctIndex: 1,
        explanation: 'At resonance (ω_drive = ωₙ), energy input exceeds dissipation. Without damping, amplitude grows without bound — in reality, structures fail. This is why the Tacoma Narrows Bridge collapsed.',
      },
      {
        instruction: 'Now enable the tuned mass damper with optimal parameters. Reset and play.',
        params: { m1: 10, k1: 100, c1: 0.5, m2: 1.0, k2: 10, c2: 2.0, F0: 5, driveFreq: 3.16, damperOn: true },
        question: 'With the TMD active, what happens to the primary mass amplitude?',
        choices: ['No change', 'Dramatically reduced', 'It oscillates faster'],
        correctIndex: 1,
        explanation: 'The TMD absorbs energy at the resonant frequency. The secondary mass oscillates in anti-phase with the primary, canceling the driving force. Taipei 101 uses a 730-ton TMD for exactly this purpose.',
        tryThis: 'Watch how the secondary mass swings wildly — it\'s absorbing all the energy so the building doesn\'t have to.',
      },
    ],
  },
];

export function create(canvas, initParams = {}) {
  const ctx = canvas.getContext('2d');
  const p = { ...DEFAULTS, ...initParams };

  let state;
  let time;
  let trace = [];

  function initState() {
    state = [0, 0, 0, 0];
    time = 0;
    trace = [];
  }

  function tick(dt) {
    const sub = 10;
    const h = dt / sub;
    for (let i = 0; i < sub; i++) {
      state = rk4(state, time, h, p);
      time += h;
    }

    trace.push([time, state[0], state[2]]);
    if (trace.length > 500) trace.shift();
  }

  function render() {
    const W = canvas.width;
    const H = canvas.height;
    ctx.fillStyle = '#090911';
    ctx.fillRect(0, 0, W, H);

    const baseY = H * 0.72;
    const centerX = W * 0.5;
    const pxPerUnit = Math.min(120, H * 0.15);

    const x1 = centerX + state[0] * pxPerUnit;
    const x2 = centerX + state[2] * pxPerUnit;

    ctx.fillStyle = 'rgba(79, 195, 247,0.2)';
    ctx.fillRect(0, baseY + 40, W, 6);

    ctx.strokeStyle = 'rgba(203,213,225,0.55)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerX - 190, baseY + 22);
    ctx.lineTo(x1 - 35, baseY + 22);
    ctx.moveTo(x1 + 35, baseY + 22);
    ctx.lineTo(x2 - 24, baseY + 22);
    ctx.stroke();

    ctx.fillStyle = '#334155';
    ctx.fillRect(centerX - 190, baseY - 50, 8, 72);

    ctx.shadowBlur = 18;
    ctx.shadowColor = '#4FC3F7';
    ctx.fillStyle = '#7c3aed';
    ctx.fillRect(x1 - 35, baseY - 50, 70, 72);

    ctx.shadowColor = '#22d3ee';
    ctx.fillStyle = '#0891b2';
    ctx.fillRect(x2 - 24, baseY - 86, 48, 36);
    ctx.shadowBlur = 0;

    if (trace.length > 2) {
      const gx = 24;
      const gy = 24;
      const gw = Math.min(360, W * 0.44);
      const gh = 120;

      ctx.fillStyle = 'rgba(15,23,42,0.65)';
      ctx.fillRect(gx, gy, gw, gh);
      ctx.strokeStyle = 'rgba(255,255,255,0.1)';
      ctx.strokeRect(gx, gy, gw, gh);

      const minT = trace[0][0];
      const maxT = trace[trace.length - 1][0];
      const scaleY = 24;

      for (let k = 1; k <= 2; k++) {
        ctx.beginPath();
        for (let i = 0; i < trace.length; i++) {
          const [tt, p1, p2] = trace[i];
          const xx = gx + ((tt - minT) / Math.max(1e-6, (maxT - minT))) * gw;
          const yy = gy + gh / 2 - (k === 1 ? p1 : p2) * scaleY;
          if (i === 0) ctx.moveTo(xx, yy);
          else ctx.lineTo(xx, yy);
        }
        ctx.strokeStyle = k === 1 ? 'rgba(167,139,250,0.95)' : 'rgba(34,211,238,0.95)';
        ctx.lineWidth = 1.8;
        ctx.stroke();
      }
    }
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
      this.start();
    },
    setParams(next) { Object.assign(p, next); render(); },
    destroy() {
      this.stop();
    },
    getData() {
      return {
        time,
        x1: state[0],
        x2: state[2]
      };
    }
  };
}
