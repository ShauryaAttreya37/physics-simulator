import * as vectorAddition from './basics/vectorAddition';
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
import * as rotationalKinematicsLab from './mechanics/rotationalKinematicsLab';

import * as wavePool from './fluid/wavePool';
import * as buoyancyLab from './fluid/buoyancyLab';
import * as windTunnel from './fluid/windTunnel';
import * as electricCharges from './electromagnetism/electricCharges';
import * as coulombLaw from './electromagnetism/coulombLaw';
import * as electrostaticFields from './electromagnetism/electrostaticFields';
import * as maxwellWaves from './electromagnetism/maxwellWaves';
import * as faradayLaw from './electromagnetism/faradayLaw';

import * as harmonicOscillator from './quantum/harmonicOscillator';
import * as doubleSlit from './quantum/doubleSlit';
import * as hydrogenOrbitals from './quantum/hydrogenOrbitals';
import * as rayOptics from './optics/rayOptics';
import * as totalInternalReflection from './optics/totalInternalReflection';
import * as collisions from './mechanics/collisions';
import * as idealGas from './thermodynamics/idealGas';
import * as waveOnAString from './waves/waveOnAString';
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
  'rotational-kinematics-lab': {
    targetOmega: [
      { value: 2.0, label: 'Slow Spin' },
      { value: 4.0, label: 'Nominal' },
      { value: 7.0, label: 'High Spin' },
    ],
    alpha: [
      { value: 0.5, label: 'Low Accel' },
      { value: 1.2, label: 'Nominal' },
      { value: 2.5, label: 'High Accel' },
    ],
    radiusA: [
      { value: 0.8, label: 'Inner A' },
      { value: 1.5, label: 'Mid A' },
      { value: 2.8, label: 'Outer A' },
    ],
    radiusB: [
      { value: 0.8, label: 'Inner B' },
      { value: 2.0, label: 'Mid B' },
      { value: 3.2, label: 'Outer B' },
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
  basics: {
    label: 'Basics',
    sims: [
      {
        id: 'vector-addition',
        title: 'Vector Addition',
        description:
          'Drag two vectors on a 2D grid and see the resultant, components, magnitude, and direction in real time.',
        tags: ['Vectors', 'Components', 'Resultant'],
        method: 'interactive',
        create: vectorAddition.create,
        controls: vectorAddition.controls,
        defaultParams: vectorAddition.defaultParams,
        equations: vectorAddition.equations,
        equationSections: vectorAddition.equationSections,
        graphParams: vectorAddition.graphParams,
        guidedExperiments: vectorAddition.guidedExperiments,
        scenarios: vectorAddition.scenarios,
        classroomGuide: vectorAddition.classroomGuide,
      },
    ],
  },
  mechanics: {
    label: 'Mechanics',
    sims: [
      {
        id: 'double-pendulum',
        title: 'Double Pendulum',
        description:
          'Two linked pendulums with sensitive dependence on starting conditions. Compare angle, velocity, and energy over time.',
        tags: ['Chaos Theory', 'RK45 Adaptive', 'Lagrangian'],
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
          'Ballistic motion with optional air drag. Adjust launch speed, angle, mass, and gravity, then compare the path with the vacuum solution.',
        tags: ['Air Drag', 'Parabola', 'RK4', 'Ballistics'],

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
          'Three coupled differential equations that produce a strange attractor. Adjust the parameters and watch the trajectory change.',
        tags: ['Strange Attractor', 'RK4', 'Chaos'],

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
          'A three-body gravity model using a symplectic integrator. Track orbital paths, energy, and angular momentum.',
        tags: ['N-Body', 'Yoshida⁴ Symplectic', 'Celestial'],

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
          'Mass-spring-damper motion across underdamped, critically damped, and overdamped cases.',
        tags: ['Analytical vs Numerical', 'Phase Portrait', 'Damping'],

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
        id: 'collisions-lab',
        title: 'Collisions Lab',
        description:
          'Explore 1D elastic and inelastic collisions. Adjust masses, velocities, and restitution to see momentum and energy conservation in action.',
        tags: ['Momentum', 'Conservation', 'Elasticity'],
        method: 'analytic',
        create: collisions.create,
        controls: collisions.controls,
        defaultParams: collisions.defaultParams,
        equations: collisions.equations,
        equationSections: collisions.equationSections,
        graphParams: collisions.graphParams,
      },
      {
        id: 'newtons-cradle',
        title: "Newton's Cradle",
        description:
          'Five suspended balls showing momentum and energy transfer through elastic collisions.',
        tags: ['Conservation', 'Elastic Collision', 'Matter.js'],

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
          'Two pendulums connected by a spring. Watch energy move between the two oscillators.',
        tags: ['Normal Modes', 'Synchronization', 'Coupled ODE'],

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
          'A pendulum with a spring instead of a rigid rod. Compare radial motion with angular motion.',
        tags: ['Chaotic Dynamics', 'Energy Exchange', 'RK4', 'Lagrangian'],

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
          'A single mass on a rigid rod. Change length, gravity, and starting angle to compare period and motion.',
        tags: ['SHM', 'Large-Angle', 'Phase Space'],

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
          'Launch particles on a rotating disk and compare fixed and rotating reference frames.',
        tags: ['Reference Frames', 'Coriolis', 'Inertial'],

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
          'Pull a block up an incline and compare kinetic, potential, thermal energy, and power.',
        tags: ['Work-Energy', 'Conservation', 'Friction'],

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
          'Vary force, lever arm, and moment of inertia to compare torque with angular acceleration.',
        tags: ['Rotational Dynamics', 'Torque', 'Moment of Inertia'],

        method: 'euler',
        create: torqueAngularAccelerationLab.create,
        controls: torqueAngularAccelerationLab.controls,
        defaultParams: torqueAngularAccelerationLab.defaultParams,
        equations: torqueAngularAccelerationLab.equations,
        equationSections: torqueAngularAccelerationLab.equationSections,
        graphParams: torqueAngularAccelerationLab.graphParams,
        scenarios: torqueAngularAccelerationLab.scenarios,
        guidedExperiments: torqueAngularAccelerationLab.guidedExperiments,
      },
      {
        id: 'rotational-kinematics-lab',
        title: 'Rotational Kinematics Lab',
        description:
          'Explore the relationship between angular parameters (velocity, acceleration) and linear quantities (tangential speed, radial and tangential acceleration) using interactive probes and vectors.',
        tags: ['Rotational Kinematics', 'Tangential Velocity', 'Centripetal Acceleration'],
        method: 'analytical',
        create: rotationalKinematicsLab.create,
        controls: rotationalKinematicsLab.controls,
        defaultParams: rotationalKinematicsLab.defaultParams,
        equations: rotationalKinematicsLab.equations,
        equationSections: rotationalKinematicsLab.equationSections,
        graphParams: rotationalKinematicsLab.graphParams,
        scenarios: rotationalKinematicsLab.scenarios,
        guidedExperiments: rotationalKinematicsLab.guidedExperiments,
      },
      {
        id: 'gyroscope-precession-3d',
        title: 'Gyroscope & Precession (3D)',
        description: 'A 3D gyroscope model showing torque, spin angular momentum, and precession.',
        tags: ['Gyroscope', 'Precession', '3D Rigid Body'],

        method: 'euler',
        create: gyroscopePrecession3d.create,
        controls: gyroscopePrecession3d.controls,
        defaultParams: gyroscopePrecession3d.defaultParams,
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
          'Solve a two-dimensional wave equation on a grid. Click the surface to create ripples and interference.',
        tags: ['Wave Equation', 'FDM', 'Grid Simulation'],

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
          'Compare blocks with different densities in different fluids and inspect buoyancy, weight, and displacement.',
        tags: ['Archimedes', 'Buoyancy', 'Fluids'],

        method: 'euler',
        create: buoyancyLab.create,
        controls: buoyancyLab.controls,
        defaultParams: buoyancyLab.defaultParams,
        equationSections: buoyancyLab.equationSections,
        graphParams: buoyancyLab.graphParams,
      },
      {
        id: 'wind-tunnel',
        title: 'Wind Tunnel',
        description:
          'Drag models through a live WebGL2 flow field and connect wake patterns to drag, lift, Reynolds number, and tunnel blockage.',
        tags: ['WebGL2 Flow', 'Aerodynamics', 'Drag'],

        method: 'webgl2',
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
          'Compare the electrostatic force between two point charges as charge and distance change.',
        tags: ['Coulomb', 'Force', 'Electrostatics'],

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
          'Model alpha-particle scattering from a charged nucleus using Coulomb repulsion.',
        tags: ['Coulomb', 'Nuclear', 'Scattering'],

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
          "Measure electric field, potential, equipotentials, and Gauss's-law flux for point charges, dipoles, plates, rings, spheres, cylinders, and discs.",
        tags: ['Gauss Law', 'Potential', 'Field Probe'],

        method: 'superposition',
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
          'Show how changing electric and magnetic fields form a propagating electromagnetic wave.',
        tags: ['Maxwell', 'EM Waves', 'Induction'],

        method: 'analytical',
        create: maxwellWaves.create,
        controls: maxwellWaves.controls,
        defaultParams: maxwellWaves.defaultParams,
        equations: maxwellWaves.equations,
        equationSections: maxwellWaves.equationSections,
        graphParams: [],
      },
      {
        id: 'faraday-law',
        title: "Faraday's Law of Induction",
        description:
          'Move a magnet through a coil and compare magnetic flux, induced EMF, and current direction.',
        tags: ['Faraday', 'Induction', 'EMF', 'Lenz'],

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
    ],
  },
  optics: {
    label: 'Optics',
    sims: [
      {
        id: 'ray-optics',
        title: 'Thin-Lens Optics Bench',
        description:
          'Trace rays with the ideal thin-lens model, plus mirror and glass-slab comparisons. Compare focal length, image location, and magnification.',
        tags: ['Thin Lens', 'Snell', 'Virtual Images'],

        method: 'analytical',
        create: rayOptics.create,
        controls: rayOptics.controls,
        defaultParams: rayOptics.defaultParams,
        equationSections: rayOptics.equationSections,
        graphParams: rayOptics.graphParams,
        scenarios: rayOptics.scenarios,
      },
      {
        id: 'total-internal-reflection',
        title: 'Total Internal Reflection',
        description: 'Explore light behavior at interfaces and the critical angle for TIR.',
        tags: ['Snell Law', 'Refraction', 'TIR'],
        method: 'analytic',
        create: totalInternalReflection.create,
        controls: totalInternalReflection.controls,
        defaultParams: totalInternalReflection.defaultParams,
        equationSections: totalInternalReflection.equationSections,
        graphParams: totalInternalReflection.graphParams,
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
          'Compare harmonic oscillator wavefunctions, energy levels, probability density, and phase-space views.',
        tags: ['Hermite-Gauss', 'Wigner Function', 'QHO'],

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
          'Build an interference pattern from individual detections and compare slit spacing, wavelength, and screen distance.',
        tags: ['Interference', 'Wave-Particle', 'Huygens-Fresnel'],

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
        description: 'Explore hydrogen orbital probability density for s, p, d, and f states.',
        tags: ['Schrödinger', '3D Atoms', 'Spherical Harmonics'],

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
  thermodynamics: {
    label: 'Thermodynamics',
    icon: 'Thermometer',
    sims: [
      {
        id: 'ideal-gas',
        title: 'Ideal Gas Law',
        description: 'Explore the relationship between pressure, volume, and temperature of a gas.',
        tags: ['P-V-T', 'Kinetic Theory', 'Entropy'],
        method: 'euler',
        create: idealGas.create,
        controls: idealGas.controls,
        defaultParams: idealGas.defaultParams,
        equationSections: idealGas.equationSections,
        graphParams: idealGas.graphParams,
        scenarios: idealGas.scenarios,
        guidedExperiments: idealGas.guidedExperiments,
      },
    ],
  },
  waves: {
    label: 'Waves',
    sims: [
      {
        id: 'wave-on-a-string',
        title: 'Wave on a String',
        description:
          'Wiggle the end of a string to create waves. Adjust tension, damping, and frequency to study propagation and boundary reflections.',
        tags: ['1D Waves', 'Reflection', 'Boundary Conditions', 'Tension'],
        method: 'euler-chromer',
        create: waveOnAString.create,
        controls: waveOnAString.controls,
        defaultParams: waveOnAString.defaultParams,
        equationSections: waveOnAString.equationSections,
        graphParams: waveOnAString.graphParams,
        scenarios: waveOnAString.scenarios,
        guidedExperiments: waveOnAString.guidedExperiments,
        classroomGuide: waveOnAString.classroomGuide,
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
