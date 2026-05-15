/**
 * Ideal Gas Law Simulation — Research-Grade Implementation
 *
 * Models a collection of particles in a 2D container with a draggable piston.
 * Demonstrates the relationship between Pressure (P), Volume (V), and Temperature (T).
 */

const DEFAULTS = {
  particleCount: 80,
  temperature: 300,
  volume: 0.8, // Fraction of canvas width
  particleMass: 1.0,
  particleRadius: 4,
  showVectors: false,
};

export const defaultParams = { ...DEFAULTS };

export const equationSections = [
  {
    title: 'The Ideal Gas Law',
    content:
      'The state of an amount of gas is determined by its pressure, volume, and temperature. For an "ideal" gas where particles are point-like and do not interact except via elastic collisions, these variables are linked by a simple equation.',
    equations: [
      {
        latex: String.raw`PV = nRT`,
        description:
          'P is pressure, V is volume, n is the amount of substance, R is the gas constant, and T is absolute temperature.',
      },
    ],
  },
  {
    title: 'Kinetic Theory of Gases',
    content:
      'Pressure is the result of countless microscopic collisions between gas particles and the walls of their container. Temperature is a macroscopic measure of the average kinetic energy of these particles.',
    equations: [
      {
        latex: String.raw`P = \frac{F}{A} = \frac{1}{A} \frac{\Delta p}{\Delta t}`,
        description:
          'Pressure is force per unit area. Force is the rate of momentum transfer (Δp) from particles to the walls.',
      },
      {
        latex: String.raw`E_k = \frac{1}{2}mv^2 = \frac{3}{2}kT`,
        description:
          'Individual particle energy scales linearly with temperature. Hotter gas means faster particles.',
      },
    ],
  },
];

export const controls = [
  { key: 'temperature', label: 'Temperature [K]', min: 50, max: 2000, step: 10 },
  { key: 'particleCount', label: 'Particle Count', min: 10, max: 300, step: 1 },
  { key: 'volume', label: 'Volume (Piston Pos)', min: 0.2, max: 0.95, step: 0.01 },
  { type: 'toggle', key: 'showVectors', label: 'Velocity Vectors' },
];

export const graphParams = [
  { key: 'pressure', label: 'Pressure [arb]' },
  { key: 'temperature', label: 'Temp [K]' },
  { key: 'volume', label: 'Volume [arb]' },
];

export const scenarios = [
  {
    name: "Boyle's Law (Isothermal)",
    description:
      'Keep temperature constant and move the piston. Pressure increases as volume decreases (P ∝ 1/V).',
    params: { temperature: 300, volume: 0.8, particleCount: 100 },
  },
  {
    name: "Charles's Law (Isobaric)",
    description:
      'Heat the gas and observe how you must increase volume to maintain the same pressure (V ∝ T).',
    params: { temperature: 300, volume: 0.4, particleCount: 80 },
  },
  {
    name: "Gay-Lussac's Law (Isochoric)",
    description:
      'Fix the volume and increase temperature. Watch pressure rise as collisions become more violent (P ∝ T).',
    params: { temperature: 100, volume: 0.6, particleCount: 100 },
  },
];

export const guidedExperiments = [
  {
    title: "Exploring Boyle's Law",
    steps: [
      {
        instruction:
          'Set temperature to 300K and observe the pressure. Now, drag the piston (the vertical blue bar) to the left to halve the volume.',
        params: { temperature: 300, volume: 0.8, particleCount: 100 },
        question: 'As the volume decreases at constant temperature, what happens to the pressure?',
        choices: ['It decreases', 'It stays the same', 'It increases'],
        correctIndex: 2,
        explanation:
          'In a smaller volume, particles strike the walls more frequently. Since temperature (speed) is constant, this increased frequency of collisions directly increases the measured pressure.',
      },
    ],
  },
];

export function create(canvas, initialParams) {
  const ctx = canvas.getContext('2d');
  let p = { ...DEFAULTS, ...initialParams };
  let particles = [];
  let running = false;
  let simTime = 0;
  let raf;

  // Measurement State
  let pressure = 0;
  let impulseAccumulator = 0;
  let lastPressureUpdate = 0;
  const PRESSURE_WINDOW = 0.5; // Update pressure every 0.5s

  // Interaction State
  let isDraggingPiston = false;
  const PISTON_WIDTH = 12;

  function initParticles() {
    const prevCount = particles.length;
    const newCount = p.particleCount;

    if (newCount < prevCount) {
      particles = particles.slice(0, newCount);
    } else if (newCount > prevCount) {
      const vBase = Math.sqrt(p.temperature / p.particleMass);
      const width = canvas.width * p.volume;
      const height = canvas.height;

      for (let i = prevCount; i < newCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = vBase * (0.8 + Math.random() * 0.4); // Distribute speeds slightly
        particles.push({
          x: Math.random() * (width - 20) + 10,
          y: Math.random() * (height - 20) + 10,
          vx: speed * Math.cos(angle),
          vy: speed * Math.sin(angle),
          r: p.particleRadius,
        });
      }
    }

    // Rescale all velocities if temperature changed
    const vTarget = Math.sqrt(p.temperature / p.particleMass);
    particles.forEach((part) => {
      const vCurr = Math.hypot(part.vx, part.vy);
      if (vCurr === 0) return;
      const ratio = vTarget / vCurr;
      part.vx *= ratio;
      part.vy *= ratio;
    });
  }

  function update(dt) {
    simTime += dt;
    const width = canvas.width * p.volume;
    const height = canvas.height;

    particles.forEach((part) => {
      part.x += part.vx * dt * 40; // Scale for visual smoothness
      part.y += part.vy * dt * 40;

      // Wall Collisions (Elastic)
      // Left
      if (part.x < part.r) {
        part.x = part.r;
        impulseAccumulator += 2 * Math.abs(part.vx) * p.particleMass;
        part.vx *= -1;
      }
      // Right (Piston)
      else if (part.x > width - part.r) {
        part.x = width - part.r;
        impulseAccumulator += 2 * Math.abs(part.vx) * p.particleMass;
        part.vx *= -1;
      }

      // Top
      if (part.y < part.r) {
        part.y = part.r;
        impulseAccumulator += 2 * Math.abs(part.vy) * p.particleMass;
        part.vy *= -1;
      }
      // Bottom
      else if (part.y > height - part.r) {
        part.y = height - part.r;
        impulseAccumulator += 2 * Math.abs(part.vy) * p.particleMass;
        part.vy *= -1;
      }
    });

    // Pressure Calculation: P = F / Area
    // F = Total Impulse / Time
    if (simTime - lastPressureUpdate > PRESSURE_WINDOW) {
      const dtActual = simTime - lastPressureUpdate;
      const perimeter = 2 * (width + height);
      // Normalized pressure for visualization
      pressure = impulseAccumulator / dtActual / perimeter;
      impulseAccumulator = 0;
      lastPressureUpdate = simTime;
    }
  }

  function getParticleColor(speed) {
    // 300K is baseline blue. Lower is deeper blue, higher is deep red.
    const vBase = Math.sqrt(300 / p.particleMass);
    const ratio = speed / vBase;

    if (ratio < 1) {
      // Scale from deep Navy (0) to Steel Blue (1)
      const r = Math.floor(30 + 70 * ratio);
      const g = Math.floor(58 + 110 * ratio);
      const b = Math.floor(138 + 90 * ratio);
      return `rgb(${r}, ${g}, ${b})`;
    } else {
      // Scale from Steel Blue (1) to Deep Red (2+)
      const r = Math.floor(Math.min(220, 100 + 120 * (ratio - 1)));
      const g = Math.floor(Math.max(20, 168 - 148 * (ratio - 1)));
      const b = Math.floor(Math.max(20, 228 - 208 * (ratio - 1)));
      return `rgb(${r}, ${g}, ${b})`;
    }
  }

  function render() {
    const W = canvas.width,
      H = canvas.height;
    ctx.fillStyle = '#f8fafc'; // Subtle off-white for laboratory feel
    ctx.fillRect(0, 0, W, H);

    const padding = 40;
    const internalH = H - padding * 2;
    const width = W * p.volume;

    // --- Laboratory Background Grid ---
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x < W; x += 50) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
    }
    for (let y = 0; y < H; y += 50) {
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
    }
    ctx.stroke();

    // --- Cylinder Walls (Real mechanical look) ---
    ctx.fillStyle = '#334155'; // Dark slate for housing
    // Top wall
    ctx.fillRect(0, padding - 8, W, 8);
    // Bottom wall (Heat Plate)
    const heatColor = p.temperature > 500 ? '#ef4444' : '#334155';
    ctx.fillStyle = heatColor;
    ctx.fillRect(0, H - padding, W, 12);
    if (p.temperature > 500) {
      // Heat glow
      const grad = ctx.createLinearGradient(0, H - padding, 0, H - padding - 40);
      grad.addColorStop(0, 'rgba(239, 68, 68, 0.15)');
      grad.addColorStop(1, 'rgba(239, 68, 68, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, H - padding - 40, width, 40);
    }

    // --- Container Interior ---
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, padding, width, internalH);

    // --- Piston Assembly ---
    const pistonHeadW = 24;
    const rodW = W - width;

    // Connecting Rod
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(width, H / 2 - 6, rodW, 12);
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1;
    ctx.strokeRect(width, H / 2 - 6, rodW, 12);

    // Piston Head
    ctx.fillStyle = isDraggingPiston ? '#3b82f6' : '#475569';
    ctx.fillRect(width - pistonHeadW, padding, pistonHeadW, internalH);

    // Piston Seals/Detail
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect(width - pistonHeadW, padding + 10, 4, internalH - 20);
    ctx.fillRect(width - 8, padding + 10, 4, internalH - 20);

    // Interaction Handle
    ctx.beginPath();
    ctx.arc(W - 20, H / 2, 12, 0, Math.PI * 2);
    ctx.fillStyle = isDraggingPiston ? '#3b82f6' : '#64748b';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // --- Particles ---
    particles.forEach((part) => {
      const speed = Math.hypot(part.vx, part.vy);
      ctx.fillStyle = getParticleColor(speed);

      // Map y to internal container space
      const renderY = padding + (part.y / H) * internalH;

      ctx.beginPath();
      ctx.arc(part.x, renderY, part.r, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 0.5;
      ctx.stroke();

      if (p.showVectors) {
        ctx.beginPath();
        ctx.moveTo(part.x, renderY);
        ctx.lineTo(part.x + part.vx * 2, renderY + part.vy * 2);
        ctx.strokeStyle = 'rgba(71, 85, 105, 0.4)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    });

    // --- HUD (Integrated Lab Display) ---
    const hudX = 20,
      hudY = padding + 20;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillRect(hudX, hudY, 150, 100);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.strokeRect(hudX, hudY, 150, 100);

    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 10px "JetBrains Mono", monospace';
    ctx.fillText('SENSOR DATA', hudX + 10, hudY + 20);

    ctx.font = '11px "JetBrains Mono", monospace';
    ctx.fillText(`P: ${pressure.toFixed(3)} atm`, hudX + 10, hudY + 45);
    ctx.fillText(`V: ${p.volume.toFixed(2)} L`, hudX + 10, hudY + 65);
    ctx.fillText(`T: ${p.temperature} K`, hudX + 10, hudY + 85);
  }

  function handlePointerDown(e) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pistonX = canvas.width * p.volume;

    if (Math.abs(x - pistonX) < 30) {
      isDraggingPiston = true;
    }
  }

  function handlePointerMove(e) {
    if (!isDraggingPiston) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;

    let nextVol = x / canvas.width;
    if (nextVol < 0.15) nextVol = 0.15;
    if (nextVol > 0.98) nextVol = 0.98;

    p.volume = nextVol;

    // Instantly push particles inside if volume decreased
    const width = canvas.width * p.volume;
    particles.forEach((part) => {
      if (part.x > width - part.r) part.x = width - part.r;
    });

    if (!running) render();
  }

  function handlePointerUp() {
    isDraggingPiston = false;
  }

  canvas.addEventListener('pointerdown', handlePointerDown);
  window.addEventListener('pointermove', handlePointerMove);
  window.addEventListener('pointerup', handlePointerUp);

  function loop() {
    if (!running) return;
    update(0.016);
    render();
    raf = requestAnimationFrame(loop);
  }

  initParticles();
  render();

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
      initParticles();
      render();
    },
    setParams: (next) => {
      const oldCount = p.particleCount;
      const oldTemp = p.temperature;
      p = { ...p, ...next };

      if (p.particleCount !== oldCount || p.temperature !== oldTemp) {
        initParticles();
      }
      render();
    },
    getData: () => ({
      time: simTime,
      pressure,
      temperature: p.temperature,
      volume: p.volume,
      avgKE: (3 / 2) * p.temperature,
    }),
    destroy: () => {
      running = false;
      cancelAnimationFrame(raf);
      canvas.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    },
  };
}
