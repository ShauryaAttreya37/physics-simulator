import * as doublePendulum from './mechanics/doublePendulum';
import * as newtonsCradle from './mechanics/newtonsCradle';
import * as orbitalGravity from './mechanics/orbitalGravity';
import * as coupledPendulums from './mechanics/coupledPendulums';
import * as tunedMassDamper from './mechanics/tunedMassDamper';

import * as projectileMotion from './mechanics/projectileMotion';
import * as atwoodsMachine from './mechanics/atwoodsMachine';
import * as lorenzAttractor from './mechanics/lorenzAttractor';
import * as dampedOscillator from './mechanics/dampedHarmonicOscillator';

import * as wavePool from './fluid/wavePool';
import * as electricCharges from './electromagnetism/electricCharges';
import * as electrostaticFields from './electromagnetism/electrostaticFields';

import * as particleInBox from './quantum/particleInBox';
import * as harmonicOscillator from './quantum/harmonicOscillator';
import * as doubleSlit from './quantum/doubleSlit';
import * as hydrogenOrbitals from './quantum/hydrogenOrbitals';
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
};

function withControlTooltips(simId, controls = []) {
  const markerMap = CONTROL_MARKERS[simId] || {};
  return controls.map((control) => ({
    ...control,
    tooltip: control.tooltip ?? inferControlTooltip(control),
    markers: control.markers ?? markerMap[control.key],
  }));
}

export const TOPICS = {
  mechanics: {
    label: 'Mechanics',
    sims: [
      {
        id: 'double-pendulum',
        title: 'Double Pendulum',
        description: 'Two linked pendulums exhibiting deterministic chaos. Tiny changes in initial conditions lead to wildly different trajectories — a hallmark of nonlinear dynamics.',
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
        description: 'Pulley system with real-time force vectors, tension analysis, energy tracking, and displacement/velocity graphs. Includes optional friction and pulley inertia.',
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
        description: 'RK4-integrated ballistic trajectory with quadratic air drag, cannon launcher, terrain, velocity/drag/gravity vectors, impact effects, and analytical vacuum comparison.',
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
        description: 'The iconic butterfly-shaped strange attractor — three coupled ODEs that produce deterministic chaos. The canonical Julia/Makie visualization.',
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
        description: 'The figure-8 three-body choreography — a rare stable solution to the N-body problem. Integrated with a 4th-order Yoshida symplectic method for superior energy conservation.',
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
        description: 'Mass-spring-damper system showing underdamped, critically damped, and overdamped regimes. Analytical vs numerical solution comparison with phase portrait.',
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
        description: 'Five steel balls suspended on strings demonstrate conservation of momentum and kinetic energy through elastic collisions.',
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
        description: 'Two nonlinear pendulums connected by a coupling spring. Energy sloshes between modes and synchronization regimes emerge.',
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
        description: 'A 2-DOF structural model under harmonic forcing. Tune secondary mass, stiffness, and damping to suppress primary oscillation.',
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
    ],
  },
  fluid: {
    label: 'Fluid Dynamics',
    sims: [

      {
        id: 'wave-pool',
        title: 'Wave Pool',
        description: 'A 2D wave equation solved on a discrete grid. Click anywhere to create ripples that propagate, reflect, and interfere.',
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
    ],
  },
  electromagnetism: {
    label: 'Electromagnetism',
    sims: [
      {
        id: 'electric-charges',
        title: 'Interacting Charges',
        description: 'Simulates point charges using Coulomb\'s Law with adaptive RK45 integration. Computes and renders the instantaneous electric vector field.',
        tags: ['Coulomb', 'Vector Field', 'Charge'],
        gradient: 'linear-gradient(135deg, #050a14 0%, #03060c 100%)',
        accentColor: '#3b82f6',
        method: 'rk4',
        create: electricCharges.create,
        controls: electricCharges.controls,
        defaultParams: electricCharges.defaultParams,
        equations: electricCharges.equations,
        equationSections: electricCharges.equationSections,
        graphParams: electricCharges.graphParams,
      },
      {
        id: 'electrostatic-fields',
        title: 'Electrostatic Geometries',
        description: 'Explore the continuous vector fields and potentials of standard shapes (Rings, Plates, Dipoles) and complex geometries like the Reuleaux Triangle via discrete integral superposition.',
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
    ],
  },
  quantum: {
    label: 'Quantum Mechanics',
    sims: [
      {
        id: 'particle-in-box',
        title: 'Particle in a Box',
        description: 'Infinite square well with time-evolving superposition of eigenstates. Watch probability density slosh and interference fringes form in real time.',
        tags: ['Schrödinger', 'Eigenstates', 'Born Rule'],
        gradient: 'linear-gradient(135deg, #0a0520 0%, #150835 100%)',
        accentColor: '#4FC3F7',
        method: 'exact',
        create: particleInBox.create,
        controls: particleInBox.controls,
        defaultParams: particleInBox.defaultParams,
        equations: particleInBox.equations,
        equationSections: particleInBox.equationSections,
        graphParams: particleInBox.graphParams,
      },
      {
        id: 'quantum-harmonic-oscillator',
        title: 'Quantum Harmonic Oscillator',
        description: 'Hermite-Gauss wavefunctions in a quadratic potential. Features Wigner quasi-probability phase-space distribution — quantum negativity visualised.',
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
        description: 'The quintessential quantum experiment. Watch individual particle detections progressively build up the famous interference pattern — wave-particle duality in action.',
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
        description: 'Interactive 3D visualization of Hydrogen probability density clouds. Explore s, p, d, and f orbitals with real analytical solutions to the Schrödinger equation.',
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
  topic.sims = topic.sims.map((sim) => ({
    ...sim,
    controls: withControlTooltips(sim.id, sim.controls),
  }));
});

export const SIM_BY_ID = Object.fromEntries(
  Object.values(TOPICS).flatMap((topic) => topic.sims).map((sim) => [sim.id, sim])
);
