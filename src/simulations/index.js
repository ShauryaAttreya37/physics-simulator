import * as doublePendulum from './mechanics/doublePendulum';
import * as newtonsCradle from './mechanics/newtonsCradle';
import * as orbitalGravity from './mechanics/orbitalGravity';
import * as coupledPendulums from './mechanics/coupledPendulums';
import * as tunedMassDamper from './mechanics/tunedMassDamper';

import * as projectileMotion from './mechanics/projectileMotion';
import * as atwoodsMachine from './mechanics/atwoodsMachine';
import * as lorenzAttractor from './mechanics/lorenzAttractor';
import * as dampedOscillator from './mechanics/dampedHarmonicOscillator';
import * as springPendulum from './mechanics/springPendulum';
import * as simplePendulum from './mechanics/simplePendulum';
import * as workEnergyLab from './mechanics/workEnergyLab';
import * as coriolisEffect from './mechanics/coriolisEffect';
import * as torqueAngularAccelerationLab from './mechanics/torqueAngularAccelerationLab';
import * as gyroscopePrecession3d from './mechanics/gyroscopePrecession3d';

import * as wavePool from './fluid/wavePool';
import * as buoyancyLab from './fluid/buoyancyLab';
import * as windTunnel from './fluid/windTunnel';
import * as electricCharges from './electromagnetism/electricCharges';
import * as coulombLaw from './electromagnetism/coulombLaw';
import * as electrostaticFields from './electromagnetism/electrostaticFields';
import * as maxwellWaves from './electromagnetism/maxwellWaves';
import * as faradayLaw from './electromagnetism/faradayLaw';
import * as lorentzForce from './electromagnetism/lorentzForce';
import * as biotSavart from './electromagnetism/biotSavart';
import * as capacitor from './electromagnetism/capacitor';
import * as rlcCircuit from './electromagnetism/rlcCircuit';

import * as harmonicOscillator from './quantum/harmonicOscillator';
import * as doubleSlit from './quantum/doubleSlit';
import * as hydrogenOrbitals from './quantum/hydrogenOrbitals';
import * as rayOptics from './optics/rayOptics';
import { inferControlTooltip } from '../constants/physicsTooltips';

const CONTROL_MARKERS = {
  'projectile-motion': {
    gravity: [
      { value: 1.62, label: 'Moon' },
      { value: 3.72, label: 'Mars' },
      { value: 9.81, label: 'Earth' },
      { value: 20, label: 'High-g' },
    ],
    dragCoeff: [
      { value: 0, label: 'Vacuum' },
      { value: 0.005, label: 'Baseball' },
      { value: 0.01, label: 'Tennis ball' },
      { value: 0.05, label: 'Shuttle' },
    ],
    launchSpeed: [
      { value: 12, label: 'Soccer kick' },
      { value: 44, label: 'MLB pitch' },
      { value: 70, label: 'Fast projectile' },
    ],
    mass: [
      { value: 0.145, label: 'Baseball' },
      { value: 0.58, label: 'Soccer ball' },
      { value: 4.5, label: 'Shot put' },
    ],
  },
  'double-pendulum': {
    g: [
      { value: 200, label: 'Low-g' },
      { value: 980, label: 'Earth' },
      { value: 1600, label: 'High-g' },
    ],
    m1: [
      { value: 0.5, label: 'Light' },
      { value: 1, label: 'Balanced' },
      { value: 3, label: 'Heavy' },
    ],
    m2: [
      { value: 0.5, label: 'Light' },
      { value: 1, label: 'Balanced' },
      { value: 3, label: 'Heavy' },
    ],
  },
  'damped-oscillator': {
    damping: [
      { value: 0, label: 'Undamped' },
      { value: 12.6, label: 'Critical*' },
    ],
  },
  'atwoods-machine': {
    m1: [
      { value: 1, label: 'Light' },
      { value: 5, label: 'Medium' },
      { value: 9, label: 'Heavy' },
    ],
    m2: [
      { value: 1, label: 'Light' },
      { value: 5, label: 'Medium' },
      { value: 9, label: 'Heavy' },
    ],
  },
  'orbital-gravity': {
    g: [
      { value: 0.7, label: 'Weak field' },
      { value: 1, label: 'Baseline' },
      { value: 1.8, label: 'Strong field' },
    ],
  },
  'tuned-mass-damper': {
    c1: [
      { value: 0, label: 'No damping' },
      { value: 1.5, label: 'Moderate' },
      { value: 3.5, label: 'High damping' },
    ],
    c2: [
      { value: 0, label: 'No damping' },
      { value: 2, label: 'Moderate' },
      { value: 5, label: 'High damping' },
    ],
    forcingFreq: [
      { value: 1, label: 'Low ratio' },
      { value: 2.2, label: 'Near resonance' },
      { value: 4, label: 'High ratio' },
    ],
  },
  'torque-angular-acceleration-lab': {
    force: [
      { value: 15, label: 'Light push' },
      { value: 40, label: 'Medium push' },
      { value: 70, label: 'Hard push' },
    ],
    radius: [
      { value: 0.3, label: 'Short arm' },
      { value: 1, label: 'Standard' },
      { value: 1.8, label: 'Long arm' },
    ],
    inertia: [
      { value: 0.6, label: 'Low inertia' },
      { value: 3, label: 'Medium' },
      { value: 8, label: 'High inertia' },
    ],
  },
  'simple-pendulum': {
    gravity: [
      { value: 1.62, label: 'Moon' },
      { value: 9.81, label: 'Earth' },
      { value: 24.79, label: 'Jupiter' },
    ],
    damping: [
      { value: 0, label: 'None' },
      { value: 0.1, label: 'Light' },
      { value: 1, label: 'Heavy' },
    ],
    theta0Deg: [
      { value: 0, label: '0°' },
      { value: 45, label: '45°' },
      { value: 90, label: '90°' },
      { value: 180, label: '180°' },
    ],
    length: [
      { value: 1, label: 'Short' },
      { value: 2, label: 'Standard' },
      { value: 4, label: 'Long' },
    ],
  },
  'gyroscope-precession-3d': {
    spinRate: [
      { value: 40, label: 'Low spin' },
      { value: 140, label: 'Nominal' },
      { value: 260, label: 'High spin' },
    ],
    gravity: [
      { value: 1.62, label: 'Moon' },
      { value: 9.81, label: 'Earth' },
      { value: 15, label: 'High-g' },
    ],
  },
};

function withCommonControls(simId, controls = []) {
  const markerMap = CONTROL_MARKERS[simId] || {};
  const hasScale = controls.some((c) => c.key === 'viewScale');

  const finalControls = controls.map((control) => ({
    ...control,
    tooltip: control.tooltip ?? inferControlTooltip(control),
    markers: control.markers ?? markerMap[control.key],
  }));

  if (!hasScale) {
    finalControls.push({
      key: 'viewScale',
      label: 'View Scale',
      min: 0.1,
      max: 2.5,
      step: 0.1,
      tooltip: 'Zoom level of the simulation view.',
    });
  }

  return finalControls;
}

export const TOPICS = {
  mechanics: {
    label: 'Mechanics',
    sims: [
      {
        id: 'double-pendulum',
        title: 'Double Pendulum',
        description:
          'Two linked pendulums exhibiting deterministic chaos. Tiny changes in initial conditions lead to wildly different trajectories — a hallmark of nonlinear dynamics.',
        tags: ['Chaos Theory', 'RK45 Adaptive', 'Lagrangian'],
        gradient: 'linear-gradient(135deg, #1a0533 0%, #0d1a4a 100%)',
        accentColor: '#4FC3F7',
        method: 'rk45',
        create: doublePendulum.create,
        controls: doublePendulum.controls,
        defaultParams: doublePendulum.defaultParams,
        equations: doublePendulum.equations,
        equationSections: doublePendulum.equationSections,
        graphParams: doublePendulum.graphParams,
        guidedExperiments: doublePendulum.guidedExperiments,
        scenarios: doublePendulum.scenarios,
      },
      {
        id: 'atwoods-machine',
        title: "Atwood's Machine",
        description:
          'Pulley system with real-time force vectors, tension analysis, energy tracking, and displacement/velocity graphs. Includes optional friction and pulley inertia.',
        tags: ['Kinematics', 'Analytical', 'Force Vectors'],
        gradient: 'linear-gradient(135deg, #0d0d1a 0%, #1a1a2e 100%)',
        accentColor: '#fde047',
        method: 'analytical',
        create: atwoodsMachine.create,
        controls: atwoodsMachine.controls,
        defaultParams: atwoodsMachine.defaultParams,
        equations: atwoodsMachine.equations,
        equationSections: atwoodsMachine.equationSections,
        graphParams: atwoodsMachine.graphParams,
      },
      {
        id: 'projectile-motion',
        title: 'Projectile Motion',
        description:
          'RK4-integrated ballistic trajectory with quadratic air drag, cannon launcher, terrain, velocity/drag/gravity vectors, impact effects, and analytical vacuum comparison.',
        tags: ['Air Drag', 'Parabola', 'RK4', 'Ballistics'],
        gradient: 'linear-gradient(135deg, #0a0e1a 0%, #1a2540 100%)',
        accentColor: '#fb7185',
        method: 'rk4',
        create: projectileMotion.create,
        controls: projectileMotion.controls,
        defaultParams: projectileMotion.defaultParams,
        equations: projectileMotion.equations,
        equationSections: projectileMotion.equationSections,
        graphParams: projectileMotion.graphParams,
        guidedExperiments: projectileMotion.guidedExperiments,
        scenarios: projectileMotion.scenarios,
      },
      {
        id: 'lorenz-attractor',
        title: 'Lorenz Attractor',
        description:
          'The iconic butterfly-shaped strange attractor — three coupled ODEs that produce deterministic chaos. The canonical Julia/Makie visualization.',
        tags: ['Strange Attractor', 'RK4', 'Chaos'],
        gradient: 'linear-gradient(135deg, #0a0520 0%, #1a0a30 100%)',
        accentColor: '#fde725',
        method: 'rk4',
        create: lorenzAttractor.create,
        controls: lorenzAttractor.controls,
        defaultParams: lorenzAttractor.defaultParams,
        equations: lorenzAttractor.equations,
        equationSections: lorenzAttractor.equationSections,
        graphParams: lorenzAttractor.graphParams,
      },
      {
        id: 'orbital-gravity',
        title: 'Orbital Gravity',
        description:
          'The figure-8 three-body choreography — a rare stable solution to the N-body problem. Integrated with a 4th-order Yoshida symplectic method for superior energy conservation.',
        tags: ['N-Body', 'Yoshida⁴ Symplectic', 'Celestial'],
        gradient: 'linear-gradient(135deg, #02020d 0%, #0a0820 100%)',
        accentColor: '#f97316',
        method: 'yoshida4',
        create: orbitalGravity.create,
        controls: orbitalGravity.controls,
        defaultParams: orbitalGravity.defaultParams,
        equations: orbitalGravity.equations,
        equationSections: orbitalGravity.equationSections,
        graphParams: orbitalGravity.graphParams,
        guidedExperiments: orbitalGravity.guidedExperiments,
        scenarios: orbitalGravity.scenarios,
      },
      {
        id: 'damped-oscillator',
        title: 'Damped Harmonic Oscillator',
        description:
          'Mass-spring-damper system showing underdamped, critically damped, and overdamped regimes. Analytical vs numerical solution comparison with phase portrait.',
        tags: ['Analytical vs Numerical', 'Phase Portrait', 'Damping'],
        gradient: 'linear-gradient(135deg, #0a1628 0%, #061020 100%)',
        accentColor: '#60a5fa',
        method: 'rk4',
        create: dampedOscillator.create,
        controls: dampedOscillator.controls,
        defaultParams: dampedOscillator.defaultParams,
        equations: dampedOscillator.equations,
        equationSections: dampedOscillator.equationSections,
        graphParams: dampedOscillator.graphParams,
        guidedExperiments: dampedOscillator.guidedExperiments,
        scenarios: dampedOscillator.scenarios,
      },
      {
        id: 'newtons-cradle',
        title: "Newton's Cradle",
        description:
          'Five steel balls suspended on strings demonstrate conservation of momentum and kinetic energy through elastic collisions.',
        tags: ['Conservation', 'Elastic Collision', 'Matter.js'],
        gradient: 'linear-gradient(135deg, #150826 0%, #0e1232 100%)',
        accentColor: '#81D4FA',
        method: 'rk4',
        create: newtonsCradle.create,
        controls: newtonsCradle.controls,
        defaultParams: newtonsCradle.defaultParams,
        equations: newtonsCradle.equations,
        graphParams: newtonsCradle.graphParams,
      },
      {
        id: 'coupled-pendulums',
        title: 'Coupled Pendulums',
        description:
          'Two nonlinear pendulums connected by a coupling spring. Energy sloshes between modes and synchronization regimes emerge.',
        tags: ['Normal Modes', 'Synchronization', 'Coupled ODE'],
        gradient: 'linear-gradient(135deg, #09142c 0%, #0b1f45 100%)',
        accentColor: '#60a5fa',
        method: 'rk4',
        create: coupledPendulums.create,
        controls: coupledPendulums.controls,
        defaultParams: coupledPendulums.defaultParams,
        equations: coupledPendulums.equations,
        graphParams: coupledPendulums.graphParams,
      },
      {
        id: 'tuned-mass-damper',
        title: 'Tuned Mass Damper',
        description:
          'A 2-DOF structural model under harmonic forcing. Tune secondary mass, stiffness, and damping to suppress primary oscillation.',
        tags: ['Vibration Control', '2DOF', 'Resonance'],
        gradient: 'linear-gradient(135deg, #10200b 0%, #1f3f16 100%)',
        accentColor: '#4ade80',
        method: 'rk4',
        create: tunedMassDamper.create,
        controls: tunedMassDamper.controls,
        defaultParams: tunedMassDamper.defaultParams,
        equations: tunedMassDamper.equations,
        graphParams: tunedMassDamper.graphParams,
        guidedExperiments: tunedMassDamper.guidedExperiments,
        scenarios: tunedMassDamper.scenarios,
      },
      {
        id: 'spring-pendulum',
        title: 'Spring Pendulum',
        description:
          'A pendulum where the rod is replaced by a spring. This system exhibits rich, often chaotic dynamics and complex energy exchange between radial and angular modes.',
        tags: ['Chaotic Dynamics', 'Energy Exchange', 'RK4', 'Lagrangian'],
        gradient: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        accentColor: '#60a5fa',
        method: 'rk4',
        create: springPendulum.create,
        controls: springPendulum.controls,
        defaultParams: springPendulum.defaultParams,
        equations: springPendulum.equations,
        equationSections: springPendulum.equationSections,
        graphParams: springPendulum.graphParams,
        scenarios: springPendulum.scenarios,
      },
      {
        id: 'simple-pendulum',
        title: 'Simple Pendulum',
        description:
          'A single mass on a rigid rod. Accurate for large angles where the small-angle approximation fails. Explore the relationship between length, gravity, and period.',
        tags: ['SHM', 'Large-Angle', 'Phase Space'],
        gradient: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
        accentColor: '#fb7185',
        method: 'rk4',
        create: simplePendulum.create,
        controls: simplePendulum.controls,
        defaultParams: simplePendulum.defaultParams,
        equations: simplePendulum.equations,
        equationSections: simplePendulum.equationSections,
        graphParams: simplePendulum.graphParams,
        scenarios: simplePendulum.scenarios,
      },
      {
        id: 'coriolis-effect',
        title: 'Rotating Frames (Coriolis)',
        description:
          'Observe the apparent deflection of particles on a rotating disk. Compare Inertial (Fixed) and Non-Inertial (Rotating) reference frames to see Coriolis and Centrifugal forces emerge.',
        tags: ['Reference Frames', 'Coriolis', 'Inertial'],
        gradient: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
        accentColor: '#60a5fa',
        method: 'analytical',
        create: coriolisEffect.create,
        controls: coriolisEffect.controls,
        defaultParams: coriolisEffect.defaultParams,
        equations: coriolisEffect.equations,
        equationSections: coriolisEffect.equationSections,
        graphParams: coriolisEffect.graphParams,
        scenarios: coriolisEffect.scenarios,
      },
      {
        id: 'work-energy-lab',
        title: 'Work & Energy Lab',
        description:
          'Pull a block up an incline to explore the Work-Energy Theorem. Real-time tracking of Kinetic, Potential, and Thermal energy plus a Power gauge.',
        tags: ['Work-Energy', 'Conservation', 'Friction'],
        gradient: 'linear-gradient(135deg, #064e3b 0%, #065f46 100%)',
        accentColor: '#4ade80',
        method: 'euler',
        create: workEnergyLab.create,
        controls: workEnergyLab.controls,
        defaultParams: workEnergyLab.defaultParams,
        equations: workEnergyLab.equations,
        equationSections: workEnergyLab.equationSections,
        graphParams: workEnergyLab.graphParams,
      },
      {
        id: 'torque-angular-acceleration-lab',
        title: 'Torque vs Angular Acceleration Lab',
        description:
          'A rotary dynamics bench where you vary tangential force, lever arm radius, and moment of inertia to directly test tau = I alpha.',
        tags: ['Rotational Dynamics', 'Torque', 'Moment of Inertia'],
        gradient: 'linear-gradient(135deg, #0a1f38 0%, #0f3b5f 100%)',
        accentColor: '#38bdf8',
        method: 'euler',
        create: torqueAngularAccelerationLab.create,
        controls: torqueAngularAccelerationLab.controls,
        defaultParams: torqueAngularAccelerationLab.defaultParams,
        equations: torqueAngularAccelerationLab.equations,
        equationSections: torqueAngularAccelerationLab.equationSections,
        graphParams: torqueAngularAccelerationLab.graphParams,
      },
      {
        id: 'gyroscope-precession-3d',
        title: 'Gyroscope & Precession (3D)',
        description:
          'Interactive 3D gyroscope with gravity-driven torque, spin angular momentum, steady precession, and speed-dependent stability.',
        tags: ['Gyroscope', 'Precession', '3D Rigid Body'],
        gradient: 'linear-gradient(135deg, #090b18 0%, #132449 100%)',
        accentColor: '#60a5fa',
        method: 'euler',
        create: gyroscopePrecession3d.create,
        controls: gyroscopePrecession3d.controls,
        defaultParams: gyroscopePrecession3d.defaultParams,
        equations: gyroscopePrecession3d.equations,
        equationSections: gyroscopePrecession3d.equationSections,
        graphParams: gyroscopePrecession3d.graphParams,
      },
    ],
  },
  fluid: {
    label: 'Fluid Dynamics',
    sims: [
      {
        id: 'wave-pool',
        title: 'Wave Pool',
        description:
          'A 2D wave equation solved on a discrete grid. Click anywhere to create ripples that propagate, reflect, and interfere.',
        tags: ['Wave Equation', 'FDM', 'Grid Simulation'],
        gradient: 'linear-gradient(135deg, #020a18 0%, #051428 100%)',
        accentColor: '#22d3ee',
        method: 'fdm',
        create: wavePool.create,
        controls: wavePool.controls,
        defaultParams: wavePool.defaultParams,
        equations: wavePool.equations,
        graphParams: wavePool.graphParams,
      },
      {
        id: 'buoyancy-lab',
        title: 'Buoyancy Lab',
        description:
          'Interact with blocks of varying densities in different fluids. Measure forces using the integrated Spring Scale and understand displacement.',
        tags: ['Archimedes', 'Buoyancy', 'Fluids'],
        gradient: 'linear-gradient(135deg, #0f172a 0%, #172554 100%)',
        accentColor: '#3b82f6',
        method: 'euler',
        create: buoyancyLab.create,
        controls: buoyancyLab.controls,
        defaultParams: buoyancyLab.defaultParams,
        equations: buoyancyLab.equations,
        equationSections: buoyancyLab.equationSections,
        graphParams: buoyancyLab.graphParams,
      },
      {
        id: 'wind-tunnel',
        title: 'Wind Tunnel',
        description:
          'Simulates fluid flow around various profiles like Airfoils and Cylinders. Visualises streamlines, drag crisis, and Reynolds-dependent vortex shedding.',
        tags: ['Potential Flow', 'Aerodynamics', 'Drag'],
        gradient: 'linear-gradient(135deg, #0f172a 0%, #064e3b 100%)',
        accentColor: '#10b981',
        method: 'analytical',
        create: windTunnel.create,
        controls: windTunnel.controls,
        defaultParams: windTunnel.defaultParams,
        equations: windTunnel.equations,
        equationSections: windTunnel.equationSections,
        graphParams: windTunnel.graphParams,
      },
    ],
  },
  electromagnetism: {
    label: 'Electromagnetism',
    sims: [
      {
        id: 'coulomb-law',
        title: "Coulomb's Law",
        description:
          'Visualize the electrostatic force between two point charges. Drag charges with sliders, see force vectors scale with F = kq₁q₂/r² in real time.',
        tags: ['Coulomb', 'Force', 'Electrostatics'],
        gradient: 'linear-gradient(135deg, #0a0410 0%, #050208 100%)',
        accentColor: '#ef4444',
        method: 'static',
        create: coulombLaw.create,
        controls: coulombLaw.controls,
        defaultParams: coulombLaw.defaultParams,
        equations: coulombLaw.equations,
        equationSections: coulombLaw.equationSections,
        graphParams: coulombLaw.graphParams,
        scenarios: coulombLaw.scenarios,
      },
      {
        id: 'electric-charges',
        title: 'Rutherford Scattering',
        description:
          'Alpha particles scatter off a gold nucleus via Coulomb repulsion — the experiment that discovered the atomic nucleus. Watch inverse-square law physics in action.',
        tags: ['Coulomb', 'Nuclear', 'Scattering'],
        gradient: 'linear-gradient(135deg, #050a14 0%, #0a0604 100%)',
        accentColor: '#ffa500',
        method: 'rk4',
        create: electricCharges.create,
        controls: electricCharges.controls,
        defaultParams: electricCharges.defaultParams,
        equations: electricCharges.equations,
        equationSections: electricCharges.equationSections,
        graphParams: electricCharges.graphParams,
        scenarios: electricCharges.scenarios,
      },
      {
        id: 'electrostatic-fields',
        title: 'Electrostatic Geometries',
        description:
          'Explore the continuous vector fields and potentials of standard shapes (Rings, Plates, Dipoles) and complex geometries like the Reuleaux Triangle via discrete integral superposition.',
        tags: ['Maxwell', 'Gauss', 'Streamlines', 'Vector Field'],
        gradient: 'linear-gradient(135deg, #0f0514 0%, #080312 100%)',
        accentColor: '#3b82f6',
        method: 'discrete integration',
        create: electrostaticFields.create,
        controls: electrostaticFields.controls,
        defaultParams: electrostaticFields.defaultParams,
        equations: electrostaticFields.equations,
        equationSections: electrostaticFields.equationSections,
        graphParams: electrostaticFields.graphParams,
      },
      {
        id: 'maxwell-waves',
        title: 'Maxwell Wave Emergence',
        description:
          'Visualize the birth of an electromagnetic wave. See how a time-varying electric field induces a magnetic field, creating a self-propagating wave based on Maxwell’s equations.',
        tags: ['Maxwell', 'EM Waves', 'Induction'],
        gradient: 'linear-gradient(135deg, #0f172a 0%, #030617 100%)',
        accentColor: '#22d3ee',
        method: 'analytical',
        create: maxwellWaves.create,
        controls: maxwellWaves.controls,
        defaultParams: maxwellWaves.defaultParams,
        equations: maxwellWaves.equations,
        equationSections: maxwellWaves.equationSections,
        graphParams: maxwellWaves.graphParams,
      },
      {
        id: 'faraday-law',
        title: "Faraday's Law of Induction",
        description:
          'Drag a bar magnet through a coil and watch the galvanometer respond. The lightbulb glows brighter when you move faster — because EMF depends on the RATE of flux change, not the flux itself.',
        tags: ['Faraday', 'Induction', 'EMF', 'Lenz'],
        gradient: 'linear-gradient(135deg, #0a0e1a 0%, #1a0a2e 100%)',
        accentColor: '#f87171',
        method: 'analytical',
        create: faradayLaw.create,
        controls: faradayLaw.controls,
        defaultParams: faradayLaw.defaultParams,
        equations: faradayLaw.equations,
        equationSections: faradayLaw.equationSections,
        graphParams: faradayLaw.graphParams,
        guidedExperiments: faradayLaw.guidedExperiments,
        scenarios: faradayLaw.scenarios,
      },
      {
        id: 'lorentz-force',
        title: 'Lorentz Force & Mass Spectrometer',
        description:
          'Charged particles curve in a magnetic field. Drag the detector to catch them. The radius r = mv/(qB) directly reveals the mass-to-charge ratio — this is how real mass spectrometers work.',
        tags: ['Lorentz', 'Mass Spectrometer', 'Cross Product'],
        gradient: 'linear-gradient(135deg, #050810 0%, #0a1628 100%)',
        accentColor: '#4ade80',
        method: 'rk4',
        create: lorentzForce.create,
        controls: lorentzForce.controls,
        defaultParams: lorentzForce.defaultParams,
        equations: lorentzForce.equations,
        equationSections: lorentzForce.equationSections,
        graphParams: lorentzForce.graphParams,
        guidedExperiments: lorentzForce.guidedExperiments,
        scenarios: lorentzForce.scenarios,
      },
      {
        id: 'biot-savart',
        title: 'Biot-Savart Law & Compass Field',
        description:
          'A current-carrying wire surrounded by responsive compass needles. Drag the test compass to explore the 1/r field. Flip the current to reverse every needle — the Right-Hand Rule in action.',
        tags: ['Biot-Savart', 'Right-Hand Rule', 'Magnetism'],
        gradient: 'linear-gradient(135deg, #0a0520 0%, #1a0a30 100%)',
        accentColor: '#c084fc',
        method: 'analytical',
        create: biotSavart.create,
        controls: biotSavart.controls,
        defaultParams: biotSavart.defaultParams,
        equations: biotSavart.equations,
        equationSections: biotSavart.equationSections,
        graphParams: biotSavart.graphParams,
        guidedExperiments: biotSavart.guidedExperiments,
        scenarios: biotSavart.scenarios,
      },
      {
        id: 'capacitor',
        title: 'Parallel Plate Capacitor',
        description:
          'Drag the plates apart, insert a dielectric, toggle the battery. The classic exam trap: battery connected vs disconnected gives OPPOSITE energy changes.',
        tags: ['Capacitor', 'Dielectric', 'Energy Storage'],
        gradient: 'linear-gradient(135deg, #0a0e1a 0%, #061020 100%)',
        accentColor: '#22d3ee',
        method: 'analytical',
        create: capacitor.create,
        controls: capacitor.controls,
        defaultParams: capacitor.defaultParams,
        equations: capacitor.equations,
        equationSections: capacitor.equationSections,
        graphParams: capacitor.graphParams,
        guidedExperiments: capacitor.guidedExperiments,
        scenarios: capacitor.scenarios,
      },
      {
        id: 'rlc-circuit',
        title: 'RLC Circuit Oscillator',
        description:
          'The electrical analog of a mass-spring-damper. Watch energy slosh between the capacitor (electric field) and inductor (magnetic field). Mathematically identical to the Damped Harmonic Oscillator.',
        tags: ['RLC', 'Resonance', 'Oscillator', 'Analog'],
        gradient: 'linear-gradient(135deg, #0a1628 0%, #061020 100%)',
        accentColor: '#a78bfa',
        method: 'rk4',
        create: rlcCircuit.create,
        controls: rlcCircuit.controls,
        defaultParams: rlcCircuit.defaultParams,
        equations: rlcCircuit.equations,
        equationSections: rlcCircuit.equationSections,
        graphParams: rlcCircuit.graphParams,
        guidedExperiments: rlcCircuit.guidedExperiments,
        scenarios: rlcCircuit.scenarios,
      },
    ],
  },
  optics: {
    label: 'Optics',
    sims: [
      {
        id: 'ray-optics',
        title: 'Ray Optics Bench',
        description:
          'Trace paraxial rays through lenses, mirrors, and a glass slab. Explore real and virtual images, magnification, focal points, and Snell-law lateral shift.',
        tags: ['Thin Lens', 'Snell', 'Virtual Images'],
        gradient: 'linear-gradient(135deg, #03111f 0%, #082f49 100%)',
        accentColor: '#38bdf8',
        method: 'analytical',
        create: rayOptics.create,
        controls: rayOptics.controls,
        defaultParams: rayOptics.defaultParams,
        equations: rayOptics.equations,
        equationSections: rayOptics.equationSections,
        graphParams: rayOptics.graphParams,
        guidedExperiments: rayOptics.guidedExperiments,
        scenarios: rayOptics.scenarios,
      },
    ],
  },
  quantum: {
    label: 'Quantum Mechanics',
    sims: [
      {
        id: 'quantum-harmonic-oscillator',
        title: 'Quantum Harmonic Oscillator',
        description:
          'Hermite-Gauss wavefunctions in a quadratic potential. Features Wigner quasi-probability phase-space distribution — quantum negativity visualised.',
        tags: ['Hermite-Gauss', 'Wigner Function', 'QHO'],
        gradient: 'linear-gradient(135deg, #06050f 0%, #120a28 100%)',
        accentColor: '#81D4FA',
        method: 'exact',
        create: harmonicOscillator.create,
        controls: harmonicOscillator.controls,
        defaultParams: harmonicOscillator.defaultParams,
        equations: harmonicOscillator.equations,
        equationSections: harmonicOscillator.equationSections,
        graphParams: harmonicOscillator.graphParams,
      },
      {
        id: 'double-slit',
        title: 'Double Slit Experiment',
        description:
          'The quintessential quantum experiment. Watch individual particle detections progressively build up the famous interference pattern — wave-particle duality in action.',
        tags: ['Interference', 'Wave-Particle', 'Huygens-Fresnel'],
        gradient: 'linear-gradient(135deg, #04040e 0%, #0a0828 100%)',
        accentColor: '#22d3ee',
        method: 'analytical',
        create: doubleSlit.create,
        controls: doubleSlit.controls,
        defaultParams: doubleSlit.defaultParams,
        equations: doubleSlit.equations,
        equationSections: doubleSlit.equationSections,
        graphParams: doubleSlit.graphParams,
        guidedExperiments: doubleSlit.guidedExperiments,
        scenarios: doubleSlit.scenarios,
      },
      {
        id: 'hydrogen-orbitals',
        title: 'Hydrogen Orbitals',
        description:
          'Interactive 3D visualization of Hydrogen probability density clouds. Explore s, p, d, and f orbitals with real analytical solutions to the Schrödinger equation.',
        tags: ['Schrödinger', '3D Atoms', 'Spherical Harmonics'],
        gradient: 'linear-gradient(135deg, #04040a 0%, #150a28 100%)',
        accentColor: '#f472b6',
        method: 'monte-carlo',
        create: hydrogenOrbitals.create,
        controls: hydrogenOrbitals.controls,
        defaultParams: hydrogenOrbitals.defaultParams,
        equations: hydrogenOrbitals.equations,
        equationSections: hydrogenOrbitals.equationSections,
        graphParams: hydrogenOrbitals.graphParams,
      },
    ],
  },
};

Object.values(TOPICS).forEach((topic) => {
  topic.sims = topic.sims.map((sim) => {
    const isMobile = window.innerWidth <= 900;
    const defaultScale = isMobile ? 0.65 : 1.0;

    return {
      ...sim,
      controls: withCommonControls(sim.id, sim.controls),
      defaultParams: {
        ...sim.defaultParams,
        viewScale: sim.defaultParams.viewScale ?? defaultScale,
      },
    };
  });
});

export const SIM_BY_ID = Object.fromEntries(
  Object.values(TOPICS)
    .flatMap((topic) => topic.sims)
    .map((sim) => [sim.id, sim]),
);
