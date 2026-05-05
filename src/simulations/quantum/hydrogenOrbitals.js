/**
 * Hydrogen Atom 3D Orbitals
 *
 * Interactive 3D visualization of Hydrogen probability density clouds.
 * Calculates exact real solutions (p_x, p_y, d_xy, etc.) using Cartesian maps
 * for unparalleled performance without Three.js.
 * Features: Orbit controls, Rejection sampling, 3D Perspective Projection, Z-Sorting.
 */

const DEFAULTS = {
  n: 3,
  l: 2,
  m: 0,
  pointsScale: 12000,
  rotationSpeed: 0.5,
};

export const defaultParams = { ...DEFAULTS };

export const equationSections = [
  {
    title: 'Introduction',
    content:
      'Hydrogen orbitals describe the quantum states of an electron around a proton. Unlike classical orbits, quantum electrons exist in "clouds" of probability. The orbitals are labeled by three quantum numbers: n (energy level), l (shape), and m (orientation). This determines the electron\'s energy and where it\'s likely to be found. The simulation shows these 3D probability distributions.',
  },
  {
    title: '3D Schrödinger Equation',
    equations: [
      {
        latex: String.raw`-\frac{\hbar^2}{2\mu}\nabla^2\psi + V(r)\psi = E\psi, \quad V(r) = -\frac{e^2}{4\pi\epsilon_0 r}`,
        description:
          'The quantum equation for the electron in hydrogen. The potential V(r) is the attractive force between proton and electron. ∇² is the 3D version of d²/dx².',
      },
    ],
    variables: [
      { symbol: '∇²', description: 'Laplacian operator - measures curvature in 3D space' },
      { symbol: 'V(r)', description: 'Electric potential - gets stronger closer to the nucleus' },
    ],
  },
  {
    title: 'Separation of Variables',
    equations: [
      {
        latex: String.raw`\psi_{nlm}(r, \theta, \phi) = R_{nl}(r)\,Y_l^m(\theta, \phi)`,
        description:
          'The wavefunction splits into radial part (distance from nucleus) and angular part (direction). This makes the math solvable.',
      },
      {
        latex: String.raw`R_{nl}(r) = N_{nl} e^{-\rho/2} \rho^l L_{n-l-1}^{2l+1}(\rho), \quad \rho = \frac{2r}{n a_0}`,
        description:
          'The radial wavefunction. It describes how probability varies with distance. Higher n means electron can be farther out.',
      },
      {
        latex: String.raw`Y_l^{m}(\theta, \phi) = (-1)^m \sqrt{\frac{2l+1}{4\pi}\frac{(l-m)!}{(l+m)!}}\, P_l^m(\cos\theta)\,e^{i m\phi}`,
        description:
          'Angular part using spherical harmonics. These determine the orbital shapes: s (spherical), p (dumbbell), d (clover), etc.',
      },
    ],
    variables: [
      {
        symbol: 'n',
        description:
          'Principal quantum number - determines energy level and average distance from nucleus',
      },
      {
        symbol: 'l',
        description: 'Azimuthal quantum number - determines orbital shape (0=s, 1=p, 2=d, 3=f)',
      },
      { symbol: 'm', description: 'Magnetic quantum number - determines orientation in space' },
    ],
  },
  {
    title: 'Energy Levels',
    equations: [
      {
        latex: String.raw`E_n = -\frac{13.6 \text{ eV}}{n^2}`,
        description:
          'Electron energies decrease with n². n=1 is most bound (-13.6 eV), n=2 is -3.4 eV, etc. All states with same n have same energy.',
      },
    ],
  },
  {
    title: 'How to Use',
    content:
      '1. Start with n=1, l=0, m=0 - this is the 1s orbital, spherical cloud around nucleus.\n2. Try n=2, l=0, m=0 - 2s orbital, still spherical but larger with a node (zero probability ring).\n3. Set n=2, l=1, m=0 - 2p_z orbital, dumbbell shape along z-axis.\n4. Change m for p orbitals to see different orientations.\n5. Try d orbitals (l=2) - more complex shapes like clover leaves.\n6. Notice how higher n means more nodes and larger orbitals.',
  },
  {
    title: 'Beginner Tips',
    content:
      'Orbitals show where electrons are likely to be, not fixed paths. s orbitals are spherical, p orbitals have lobes, d orbitals are more complex. The number of nodes increases with quantum numbers. Real atoms have multiple electrons, but hydrogen shows the basic quantum structure.',
  },
];

export const equations = [
  String.raw`\psi(\mathbf{r}) = R_{nl}(r) Y_l^m(\theta, \phi)`,
  String.raw`E_n = -\frac{13.6 \text{ eV}}{n^2}`,
];

export const graphParams = [
  { key: 'shell', label: 'Shell' },
  { key: 'orbital', label: 'Nodes' },
];

export const controls = [
  { key: 'n', label: 'n (Principal: 1s, 2p, 3d...)', min: 1, max: 4, step: 1 },
  { key: 'l', label: 'l (Azimuthal: s=0, p=1, d=2...)', min: 0, max: 3, step: 1 },
  { key: 'm', label: 'm (Magnetic: orientation)', min: -3, max: 3, step: 1 },
];

export const method = 'monte-carlo integration';

// ── Exact Analytical Cartesian Wavefunctions ───────────────────────────
// Bypassing costly sphercal harmonic trig & factorials for high perf
function calcPsiReal(n, l, m, x, y, z) {
  const r2 = x * x + y * y + z * z;
  const r = Math.sqrt(r2);
  if (r === 0) return l === 0 ? 1 : 0;

  // Compute unnormalized radial part (decay)
  // rho = 2r / (n * a0). We choose a0 scaled for nice visuals.
  // Actually standard formulas scale differently based on n.
  // Let's standardise the scale factor alpha so the orbital fits in view
  const alpha = 2.0 / n;
  const p = alpha * r;
  let R = Math.exp(-p / 2) * Math.pow(p, l);

  // Laguerre polynomials (unnormalized)
  if (n === 1 && l === 0)
    R *= 1; // 1s
  else if (n === 2 && l === 0)
    R *= 2 - p; // 2s
  else if (n === 2 && l === 1)
    R *= 1; // 2p
  else if (n === 3 && l === 0)
    R *= 27 - 18 * p + 2 * p * p; // 3s
  else if (n === 3 && l === 1)
    R *= 6 - p; // 3p
  else if (n === 3 && l === 2)
    R *= 1; // 3d
  else if (n === 4 && l === 0)
    R *= 192 - 144 * p + 24 * p * p - p * p * p; // 4s
  else if (n === 4 && l === 1)
    R *= 80 - 20 * p + p * p; // 4p
  else if (n === 4 && l === 2)
    R *= 8 - p; // 4d
  else if (n === 4 && l === 3)
    R *= 1; // 4f
  else R *= 1; // fallback

  // Angular part (Real Solid Harmonics) purely in cartesian
  let Y = 1;
  if (l === 1) {
    // P orbitals
    if (m === 0)
      Y = z; // p_z
    else if (m === 1)
      Y = x; // p_x
    else if (m === -1) Y = y; // p_y
  } else if (l === 2) {
    // D orbitals
    if (m === 0)
      Y = 3 * z * z - r2; // d_z2
    else if (m === 1)
      Y = x * z; // d_xz
    else if (m === -1)
      Y = y * z; // d_yz
    else if (m === 2)
      Y = x * x - y * y; // d_x2-y2
    else if (m === -2) Y = x * y; // d_xy
  } else if (l === 3) {
    // F orbitals
    if (m === 0)
      Y = z * (5 * z * z - 3 * r2); // f_z3
    else if (m === 1)
      Y = x * (5 * z * z - r2); // f_xz2
    else if (m === -1)
      Y = y * (5 * z * z - r2); // f_yz2
    else if (m === 2)
      Y = z * (x * x - y * y); // f_z(x2-y2)
    else if (m === -2)
      Y = x * y * z; // f_xyz
    else if (m === 3)
      Y = x * (x * x - 3 * y * y); // f_x(x2-3y2)
    else if (m === -3) Y = y * (3 * x * x - y * y); // f_y(3x2-y2)
  }

  // To prevent the angular part blowing up r^l, we divide by r^l so it depends only on angles
  const normY = Y / (Math.pow(r, l) || 1);

  return R * normY;
}

export function create(canvas, initParams = {}) {
  const ctx = canvas.getContext('2d', { alpha: false });
  const p = { ...DEFAULTS, ...initParams };

  // View parameters
  let rotX = 0.3; // radians
  let rotY = 0.6; // radians
  let isDragging = false;
  let lastMouseX = 0;
  let lastMouseY = 0;

  // Cloud cache
  let pointCloud = [];
  let cachedN = -1,
    cachedL = -1,
    cachedM = -1;
  let maxPsiFound = 0.001;

  // Interaction handlers
  const handleDown = (e) => {
    isDragging = true;
    const clientX = e.clientX ?? e.touches[0].clientX;
    const clientY = e.clientY ?? e.touches[0].clientY;
    lastMouseX = clientX;
    lastMouseY = clientY;
  };

  const handleMove = (e) => {
    if (!isDragging) return;
    const clientX = e.clientX ?? e.touches[0].clientX;
    const clientY = e.clientY ?? e.touches[0].clientY;
    const dx = clientX - lastMouseX;
    const dy = clientY - lastMouseY;
    rotY += dx * 0.01 * p.rotationSpeed;
    rotX += dy * 0.01 * p.rotationSpeed;
    rotX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, rotX));
    lastMouseX = clientX;
    lastMouseY = clientY;
  };

  const handleUp = () => {
    isDragging = false;
  };

  canvas.addEventListener('mousedown', handleDown);
  window.addEventListener('mousemove', handleMove);
  window.addEventListener('mouseup', handleUp);
  canvas.addEventListener('touchstart', handleDown);
  window.addEventListener('touchmove', handleMove);
  window.addEventListener('touchend', handleUp);

  function getOrbitalSymbol(n, l, m) {
    const lChars = ['s', 'p', 'd', 'f'];
    const type = lChars[l] || 'g';
    let sub = '';
    if (l === 1) {
      if (m === 0) sub = 'z';
      if (m === 1) sub = 'x';
      if (m === -1) sub = 'y';
    } else if (l === 2) {
      if (m === 0) sub = 'z²';
      if (m === 1) sub = 'xz';
      if (m === -1) sub = 'yz';
      if (m === 2) sub = 'x²-y²';
      if (m === -2) sub = 'xy';
    } else if (l === 3) {
      sub = `_m=${m}`; // F orbitals have complex standard notations
    }
    return `${n}${type}${sub}`;
  }

  function enforceQuantumRules() {
    // n is 1 to 4 bounded by slider
    let L = Math.max(0, Math.min(p.l, p.n - 1));
    let M = Math.max(-L, Math.min(p.m, L));

    // Update params to reflect enforced rules
    p.l = L;
    p.m = M;

    if (p.n !== cachedN || L !== cachedL || M !== cachedM) {
      cachedN = p.n;
      cachedL = L;
      cachedM = M;
      generateCloud(p.n, L, M);
    }
  }

  function generateCloud(n, l, m) {
    pointCloud = [];
    maxPsiFound = 0.0001; // initial guess

    // Tighten rejection radius to concentrate points where probability is highest
    const rMax = n * n * 2.5 + 4.0;

    // Massive point density for clear clouds
    const TARGET_POINTS = Math.min(p.pointsScale * 3, 35000);

    // Auto-tune maxPsi
    for (let test = 0; test < 1000; test++) {
      const rx = (Math.random() * 2 - 1) * rMax;
      const ry = (Math.random() * 2 - 1) * rMax;
      const rz = (Math.random() * 2 - 1) * rMax;
      const val = Math.abs(calcPsiReal(n, l, m, rx, ry, rz));
      if (val > maxPsiFound) maxPsiFound = val;
    }

    maxPsiFound *= 0.85; // Allow slight overflow for better density

    let attempts = 0;
    while (pointCloud.length < TARGET_POINTS && attempts < TARGET_POINTS * 150) {
      attempts++;
      const x = (Math.random() * 2 - 1) * rMax;
      const y = (Math.random() * 2 - 1) * rMax;
      const z = (Math.random() * 2 - 1) * rMax;

      const psi = calcPsiReal(n, l, m, x, y, z);
      const prob = (psi * psi) / (maxPsiFound * maxPsiFound);

      if (Math.random() < prob) {
        // Point accepted. Store 3D coordinates and phase
        pointCloud.push({ x, y, z, phase: psi > 0 ? 1 : -1 });
      }
    }
  }

  // ── Render loop ──────────────────────────────────────────────────────
  let rafId,
    running = false;
  let autoPan = 0;

  function loop() {
    if (!running) return;

    // Enforce limits and regenerate if changed
    enforceQuantumRules();

    if (!isDragging) {
      rotY += 0.003; // passive auto-rotation
    }

    const W = canvas.width;
    const H = canvas.height;
    const cx = W / 2;
    const cy = H / 2;

    // Background Makie Style
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#04040a');
    bg.addColorStop(1, '#0c0a1a');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Draw 3D bounding box / axes
    const FOV = 600; // perspective depth

    // Calculate rotation matrices
    const cosX = Math.cos(rotX),
      sinX = Math.sin(rotX);
    const cosY = Math.cos(rotY),
      sinY = Math.sin(rotY);

    // Scaling to fit on screen
    const baseScale = Math.min(W, H) / (2.2 * p.n * p.n + 12);

    // Project points
    const projected = [];
    for (let i = 0; i < pointCloud.length; i++) {
      const pt = pointCloud[i];

      // Rotate Y
      const x1 = pt.x * cosY - pt.z * sinY;
      const z1 = pt.z * cosY + pt.x * sinY;

      // Rotate X
      const y2 = pt.y * cosX - z1 * sinX;
      const z2 = z1 * cosX + pt.y * sinX;

      // Perspective
      const scale = FOV / (FOV + z2 * baseScale);

      projected.push({
        x2d: cx + x1 * scale * baseScale,
        y2d: cy + y2 * scale * baseScale,
        z: z2,
        scale,
        phase: pt.phase,
      });
    }

    // Z-Sort for correct depth alpha blending
    projected.sort((a, b) => b.z - a.z);

    // Draw points (Electron Cloud)
    // Positive phase = Purple/Magenta, Negative phase = Cyan/Blue

    // For extreme performance, we use global alpha and fillRect
    ctx.globalCompositeOperation = 'screen';

    for (let i = 0; i < projected.length; i++) {
      const pt = projected[i];

      // Depth-based fading with higher baseline opacity for solid clouds
      const depthAlpha = Math.max(0, Math.min(1, 1 - pt.z / (p.n * p.n * 3 + 10)));
      const alpha = depthAlpha * 0.35 + 0.1;

      ctx.fillStyle =
        pt.phase > 0
          ? `rgba(192, 132, 252, ${alpha})` // Purple
          : `rgba(34, 211, 238, ${alpha})`; // Cyan

      // Smaller points to look like fine mist instead of blocks
      const size = Math.max(0.4, 1.8 * pt.scale);
      ctx.fillRect(pt.x2d, pt.y2d, size, size);
    }

    ctx.globalCompositeOperation = 'source-over';

    // HUD overlays
    ctx.font = '700 24px "Montserrat", sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`${getOrbitalSymbol(p.n, p.l, p.m)} Orbital`, 24, 24);

    ctx.font = '500 12px "JetBrains Mono", monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillText(`n = ${p.n}, l = ${p.l}, m = ${p.m}`, 24, 56);
    ctx.fillText(`Nodes: ${p.n - p.l - 1} radial, ${p.l} angular`, 24, 76);

    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillText(`points = ${pointCloud.length}`, W - 24, H - 36);
    ctx.fillText(`drag to rotate`, W - 24, H - 20);

    // Axis legend (bottom left)
    const axesLen = 30;
    const ax = 50,
      ay = H - 50;
    const axProjs = [
      { name: 'X', x: axesLen, y: 0, z: 0, color: '#FF6B6B' },
      { name: 'Y', x: 0, y: axesLen, z: 0, color: '#4ade80' },
      { name: 'Z', x: 0, y: 0, z: axesLen, color: '#60a5fa' },
    ];
    for (const a of axProjs) {
      const x1 = a.x * cosY - a.z * sinY;
      const z1 = a.z * cosY + a.x * sinY;
      const y2 = a.y * cosX - z1 * sinX;

      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(ax + x1, ay + y2);
      ctx.strokeStyle = a.color;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = a.color;
      ctx.font = '10px "JetBrains Mono"';
      ctx.fillText(a.name, ax + x1 + 5, ay + y2 + 5);
    }

    rafId = requestAnimationFrame(loop);
  }

  enforceQuantumRules(); // initial generate

  return {
    start() {
      if (running) return;
      running = true;
      rafId = requestAnimationFrame(loop);
    },
    stop() {
      running = false;
      cancelAnimationFrame(rafId);
    },
    reset() {
      this.stop();
      rotX = 0.3;
      rotY = 0.6;
      cachedN = -1; // force regen
      this.start();
    },
    setParams(next) {
      Object.assign(p, next);
      enforceQuantumRules();
    },
    destroy() {
      this.stop();
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleUp);
    },
    getData() {
      return {
        shell: p.n,
        orbital: p.n - 1,
      };
    },
  };
}
