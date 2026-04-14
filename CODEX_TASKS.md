# Codex Tasks — Physics Simulator Pedagogy Improvements

> **Model:** GPT 5.3 Codex  
> **Project:** `mechanics_sandbox` — React + Vite physics simulator  
> **Goal:** Make the app genuinely helpful for students who find physics hard or counter-intuitive  
> **Priority:** Tasks are ordered by impact. Work top-to-bottom.

---

## Task 1: Parameter Tooltip System (hover help for jargon)

**Files to modify:**  
- `src/components/SimulationRunner.jsx` — `ParamControl` component (line ~17)  
- `src/components/DataReadout.jsx` — HUD readout values  

**What to do:**  
Add a hover tooltip (`title` attribute or a custom tooltip component) to every parameter slider and every HUD readout value. Students don't know what "Lyapunov exponent", "Re", "Strouhal number", or "b/m" mean.

**Tooltip content to add:**

| Term | Plain-English Tooltip |
|------|----------------------|
| `θ₁, θ₂` | "Angle of the pendulum arm measured from straight down (vertical)" |
| `ω₁, ω₂` | "Angular velocity — how fast the arm is spinning, in radians per second" |
| `ℓ₁, ℓ₂` | "Length of the pendulum arm in pixels (longer = slower swings)" |
| `m₁, m₂` | "Mass of the bob — heavier bobs carry more momentum" |
| `g` | "Gravitational acceleration — 9.81 m/s² on Earth, 1.62 on the Moon" |
| `b/m` | "Drag-to-mass ratio — 0 means vacuum (no air), 0.01 is realistic for a ball in air" |
| `v₀` | "Launch speed — how fast the projectile leaves the cannon" |
| `Re` (Reynolds number) | "Tells you if flow is smooth (laminar, Re < 2300) or chaotic (turbulent, Re > 4000)" |
| `C_D` | "Drag coefficient — how much the shape resists airflow. Lower = more aerodynamic" |
| `C_L` | "Lift coefficient — how much upward force the shape generates" |
| `St` (Strouhal) | "Controls vortex shedding frequency — how fast eddies peel off behind the object" |
| `Dyn press` | "Dynamic pressure = ½ρv² — the kinetic energy per unit volume of the moving air" |
| `|ΔE/E₀|` | "Energy conservation error — should stay near zero. If it grows, the numerical method is losing accuracy" |
| `Lyapunov exp.` | "Measures chaos — positive means tiny changes in initial conditions grow exponentially (butterfly effect)" |
| `CFL` | "Courant-Friedrichs-Lewy number — must stay below 1 for the simulation to remain stable" |
| `tolerance` | "How much numerical error the adaptive integrator allows per step. Smaller = more accurate but slower" |
| `trail` | "Number of past positions to draw as a fading trail behind the moving object" |

**Implementation approach:**  
1. Add a `tooltip` field to each control object in every simulation file (`src/simulations/mechanics/*.js`, `src/simulations/quantum/*.js`, etc.)  
2. In `ParamControl`, render the tooltip on hover using a `<span className="tooltip">` positioned above the label  
3. Style the tooltip in `src/App.css` — dark background, rounded corners, 11px font, max-width 220px, fade-in animation  
4. For `DataReadout.jsx`, add tooltips to each metric label  

**Do NOT:**  
- Change any physics logic  
- Modify canvas rendering code  
- Add any new dependencies  

---

## Task 2: Reference Markers on Parameter Sliders

**Files to modify:**  
- `src/components/SimulationRunner.jsx` — `ParamControl` component  
- `src/App.css` — styling  
- Each simulation file's `controls` array  

**What to do:**  
Add real-world reference markers on parameter sliders so students know if their values are realistic. Currently a student has no idea if `drag = 0.01` is a feather or a bowling ball.

**Add a `markers` array to control definitions. Examples:**

```js
// In projectileMotion.js controls:
{ key: 'dragCoeff', label: 'Drag b/m', min: 0, max: 0.1, step: 0.001,
  markers: [
    { value: 0, label: 'Vacuum' },
    { value: 0.005, label: 'Baseball' },
    { value: 0.01, label: 'Tennis ball' },
    { value: 0.05, label: 'Badminton shuttle' },
  ]
}

// In projectileMotion.js controls:
{ key: 'gravity', label: 'Gravity [m/s²]', min: 1, max: 20, step: 0.1,
  markers: [
    { value: 1.62, label: 'Moon' },
    { value: 3.72, label: 'Mars' },
    { value: 9.81, label: 'Earth' },
    { value: 24.79, label: 'Jupiter' },
  ]
}

// In doublePendulum.js controls:
{ key: 'g', label: 'Gravity g', min: 200, max: 1600, step: 10,
  markers: [
    { value: 162, label: 'Moon' },
    { value: 980, label: 'Earth' },
    { value: 1600, label: 'Jupiter' },
  ]
}

// In dampedHarmonicOscillator.js:
{ key: 'damping', ...,
  markers: [
    { value: 0, label: 'Undamped' },
    { value: 1, label: 'Critical' },
  ]
}
```

**Rendering approach:**  
- Below each slider, render small tick marks at marker positions with tiny labels  
- Use `position: absolute` within a `position: relative` wrapper  
- Tick marks: 1px wide, 6px tall, color `#475569`  
- Labels: 9px font, color `#64748b`, positioned below ticks  
- Calculate position as `((value - min) / (max - min)) * 100%`  

**Apply markers to these simulations:**  
- `projectileMotion.js` — gravity, drag, launchSpeed, mass  
- `doublePendulum.js` — gravity, masses  
- `dampedHarmonicOscillator.js` — damping ratio (mark critical damping at 1.0)  
- `atwoodsMachine.js` — masses  
- `orbitalGravity.js` — if gravity param exists  
- `tunedMassDamper.js` — damping, frequency ratio  

---

## Task 3: "See Also" Cross-Links Between Simulations

**Files to modify:**  
- `src/simulations/index.js` — add `seeAlso` array to each sim  
- `src/components/SimulationRunner.jsx` — render links at bottom of controls tab  

**What to do:**  
Add concept-linking between related simulations. Each sim should list 1-3 related sims with a reason.

**Add `seeAlso` field to sim definitions in `src/simulations/index.js`:**

```js
{
  id: 'double-pendulum',
  // ... existing fields ...
  seeAlso: [
    { id: 'lorenz-attractor', reason: 'Another chaotic system — compare sensitivity to initial conditions' },
    { id: 'coupled-pendulums', reason: 'Two pendulums that sync up instead of going chaotic' },
  ],
}
```

**Full link map:**

| Simulation | Links to | Reason |
|-----------|----------|--------|
| Double Pendulum | Lorenz Attractor | Both show deterministic chaos |
| Double Pendulum | Coupled Pendulums | Contrast: chaos vs synchronization |
| Lorenz Attractor | Double Pendulum | Both chaotic, different state spaces |
| Projectile Motion | Wind Tunnel (fluid lab) | Both involve air drag |
| Atwood's Machine | Coupled Pendulums | Both use constraints and tension |
| Damped Oscillator | Tuned Mass Damper | Damping in 1DOF vs 2DOF |
| Tuned Mass Damper | Damped Oscillator | See single DOF version first |
| Coupled Pendulums | Double Pendulum | Compare cooperative vs chaotic coupling |
| Coupled Pendulums | Tuned Mass Damper | Both are coupled oscillating systems |
| Newton's Cradle | Atwood's Machine | Both demonstrate conservation of momentum |
| Particle in Box | Quantum Harmonic Oscillator | Compare infinite vs parabolic potential well |
| QHO | Particle in Box | Simpler potential well to build intuition first |
| Double Slit | Particle in Box | Wave-particle duality in different contexts |
| Hydrogen Orbitals | Particle in Box | 3D vs 1D quantum confinement |
| Electric Charges | Electrostatic Geometries | Point charges vs continuous distributions |
| Orbital Gravity | Projectile Motion | Same physics (gravity), different scales |

**Rendering:**  
- At bottom of the Controls tab in `SimulationRunner.jsx`, add a "Related Simulations" section  
- Each link: clickable card with sim title + reason text  
- Clicking navigates to that simulation (call `onBack()` then route, or use existing navigation)  
- Style: subtle border, 11px text, arrow icon, hover highlight  

---

## Task 4: Mobile Responsive Layout

**Files to modify:**  
- `src/App.css` — add media queries  
- `src/components/SimulationRunner.jsx` — conditional layout  
- `src/components/SandboxCanvas.jsx` — touch support  
- `src/pages/FluidSandboxPage.jsx` — responsive canvas  

**What to do:**  
Add responsive breakpoints so the app works on tablets and phones. Currently it's desktop-only.

**Breakpoints:**
- `>1024px`: Current desktop layout (no changes)  
- `768px–1024px`: Side panel moves to bottom drawer (collapsible)  
- `<768px`: Full-width canvas, controls in a bottom sheet overlay  

**Key changes:**
1. **SimulationRunner:** At `<768px`, move `.sim-side-panel` below the canvas as a collapsible drawer with a drag handle  
2. **TopicsPage / Home:** Stack cards vertically on mobile, reduce padding  
3. **Canvas:** Use `window.innerWidth` to set canvas size, maintain aspect ratio  
4. **Touch:** Ensure all sliders work with touch input (they should via HTML range inputs)  
5. **FluidSandboxPage:** Canvas 700px is too wide for mobile — scale to `min(window.innerWidth - 20, 700)`  

**CSS media queries to add in App.css:**
```css
@media (max-width: 768px) {
  .sim-runner-research { flex-direction: column; }
  .sim-side-panel { 
    width: 100%; height: 40vh; 
    border-left: none; border-top: 1px solid var(--border);
    overflow-y: auto;
  }
  .sim-canvas-wrapper { height: 55vh; }
}
```

---

## Task 5: Colorblind-Accessible Heatmap

**Files to modify:**  
- `src/pages/FluidSandboxPage.jsx` — `velColor()` function (line ~89)  

**What to do:**  
The velocity heatmap uses a rainbow colormap (blue→cyan→green→yellow→red) which is not distinguishable for the ~8% of male students with color vision deficiency.

**Replace `velColor` with a viridis-inspired perceptually uniform colormap:**

```js
function velColor(v, vmax) {
  const t = Math.min(1, Math.max(0, v / vmax));
  // Viridis-inspired: dark purple → blue → teal → green → yellow
  // Perceptually uniform, colorblind-safe
  const viridis = [
    [68, 1, 84],    // 0.00 - dark purple
    [72, 35, 116],  // 0.10
    [64, 67, 135],  // 0.20
    [52, 94, 141],  // 0.30
    [33, 145, 140], // 0.50
    [53, 183, 121], // 0.65
    [109, 205, 89], // 0.75
    [180, 222, 44], // 0.85
    [253, 231, 37], // 1.00 - bright yellow
  ];
  const idx = t * (viridis.length - 1);
  const i = Math.floor(idx);
  const f = idx - i;
  const c1 = viridis[Math.min(i, viridis.length - 1)];
  const c2 = viridis[Math.min(i + 1, viridis.length - 1)];
  return [
    Math.round(c1[0] + (c2[0] - c1[0]) * f),
    Math.round(c1[1] + (c2[1] - c1[1]) * f),
    Math.round(c1[2] + (c2[2] - c1[2]) * f),
  ];
}
```

Also update the velocity scale legend gradient (line ~1374) to match:
```js
background: 'linear-gradient(90deg, #440154 0%, #414487 20%, #2a788e 40%, #22a884 60%, #7ad151 80%, #fde725 100%)'
```

---

## Task 6: Derivation Walkthroughs (expandable "Why this equation?")

**Files to modify:**  
- `src/components/TheoryNotebook.jsx` — add expandable derivation sections  
- Each simulation's `equationSections` data  

**What to do:**  
Students see `F = ½ρv²CdA` and think "where did that come from?" Add expandable derivation steps.

**Add a `derivation` field to equation objects:**

```js
// In projectileMotion.js equationSections:
{
  latex: String.raw`\vec{a} = \vec{g} - \frac{b}{m} \|\vec{v}\| \vec{v}`,
  description: 'Acceleration with quadratic air drag.',
  derivation: [
    'Start with Newton\'s second law: F = ma',
    'Two forces act: gravity (mg downward) and drag (opposing velocity)',
    'Drag force for a sphere: F_D = ½ρv²C_D A (proportional to v²)',
    'Drag opposes motion, so direction is -v̂ = -v/|v|',
    'Combining: ma = mg - ½ρC_D A |v|v',
    'Divide by mass: a = g - (ρC_D A / 2m)|v|v',
    'Define b/m = ρC_D A / 2m as the drag coefficient per unit mass',
    'Final: a = g - (b/m)|v|v ✓',
  ],
}
```

**In TheoryNotebook.jsx:**  
- Below each equation description, add a clickable "Why this equation? ▸" link  
- On click, expand to show the derivation steps as a numbered list  
- Style: indented, 11px, muted color, left border accent line  
- Animate expand/collapse with CSS `max-height` transition  

**Add derivations for these key equations (high student confusion):**  
1. Projectile motion drag equation  
2. Double pendulum Lagrangian (why T - V?)  
3. Damped oscillator solution (why exponential decay?)  
4. Drag force F = ½ρv²CdA  
5. Buoyancy force (Archimedes)  
6. Schrödinger equation (particle in box)  

---

## Task 7: Learning Path / Concept Map Page

**Files to create:**  
- `src/pages/LearningPathPage.jsx`  

**Files to modify:**  
- `src/App.jsx` — add route  
- `src/pages/Home.jsx` — add navigation card  

**What to do:**  
Create a visual learning path page showing recommended order and concept connections.

**Layout:** A directed graph / flowchart showing:

```
[Projectile Motion] ──→ [Atwood's Machine] ──→ [Coupled Pendulums]
        │                       │                       │
        ↓                       ↓                       ↓
  [Wind Tunnel]         [Newton's Cradle]      [Double Pendulum]
                                                        │
                                                        ↓
                                              [Lorenz Attractor]

[Damped Oscillator] ──→ [Tuned Mass Damper]

[Particle in Box] ──→ [QHO] ──→ [Double Slit] ──→ [Hydrogen Orbitals]

[Electric Charges] ──→ [Electrostatic Geometries]
```

**Implementation:**  
- Use pure CSS/SVG — no graph library needed  
- Each node is a clickable card linking to the simulation  
- Arrows drawn with SVG `<line>` or `<path>` elements  
- Color-code by topic (blue = mechanics, purple = quantum, amber = EM, teal = fluid)  
- Add brief labels on arrows explaining the connection  
- Responsive: on mobile, collapse to a vertical list with indentation  

---

## Task 8: CSV Export Guidance

**Files to modify:**  
- `src/components/SimulationRunner.jsx` — area near the CSV export button (line ~203)  

**What to do:**  
When a student clicks "Export CSV", also show a brief tooltip or modal explaining what to do with the data:

> "Exported! Open this file in Google Sheets or Excel. Try plotting Column B (velocity) against Column A (time) to see how the quantity changes. Compare different parameter settings by exporting multiple files."

**Implementation:**  
- After export, show a toast notification (auto-dismiss after 6 seconds)  
- Toast content: 1-2 sentences of guidance  
- Style: bottom-right corner, dark background, subtle slide-in animation  
- Add to `App.css` — no toast library needed, just a `useState` + `setTimeout`  

---

## General Guidelines for All Tasks

1. **Do NOT modify any physics/simulation logic** — only UI, data, and styling  
2. **Do NOT add new npm dependencies** — use only what's already installed  
3. **Match existing code style** — dark theme, glass morphism, `var(--font-mono)`, etc.  
4. **Test the build** — run `npx vite build` after changes and fix any errors  
5. **Keep bundle size reasonable** — no large data files or images  
6. **Preserve existing functionality** — nothing should break  
