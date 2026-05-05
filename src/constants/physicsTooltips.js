const CONTROL_KEY_TOOLTIPS = {
  theta1: 'Angle of the pendulum arm measured from straight down (vertical).',
  theta2: 'Angle of the pendulum arm measured from straight down (vertical).',
  omega1: 'Angular velocity: how fast the arm is spinning, in radians per second.',
  omega2: 'Angular velocity: how fast the arm is spinning, in radians per second.',
  l1: 'Length of the pendulum arm in pixels (longer length gives slower swings).',
  l2: 'Length of the pendulum arm in pixels (longer length gives slower swings).',
  m1: 'Mass of the bob: heavier bobs carry more momentum.',
  m2: 'Mass of the bob: heavier bobs carry more momentum.',
  g: 'Gravitational acceleration: 9.81 m/s^2 on Earth and 1.62 m/s^2 on the Moon.',
  gravity: 'Gravitational acceleration: 9.81 m/s^2 on Earth and 1.62 m/s^2 on the Moon.',
  mass: 'Mass of the object: heavier objects carry more momentum.',
  launchspeed: 'Launch speed: how fast the projectile leaves the cannon.',
  v0: 'Launch speed: how fast the projectile leaves the cannon.',
  dragcoeff: 'Drag-to-mass ratio: 0 means vacuum (no air), and larger values mean stronger drag.',
  b: 'Drag-to-mass ratio: 0 means vacuum (no air), and larger values mean stronger drag.',
  c_d: 'Drag coefficient: how much the shape resists airflow. Lower is more aerodynamic.',
  cd: 'Drag coefficient: how much the shape resists airflow. Lower is more aerodynamic.',
  c_l: 'Lift coefficient: how much upward force the shape generates.',
  cl: 'Lift coefficient: how much upward force the shape generates.',
  re: 'Reynolds number: smooth laminar flow is lower Re, turbulent flow is higher Re.',
  strouhal: 'Strouhal number controls vortex shedding frequency behind an object.',
  st: 'Strouhal number controls vortex shedding frequency behind an object.',
  tolerance: 'Allowed numerical error per adaptive step. Smaller is more accurate but slower.',
  trail: 'Number of past positions to draw as a fading trail behind the moving object.',
  trailmax: 'Number of past positions to draw as a fading trail behind the moving object.',
};

const READOUT_KEY_TOOLTIPS = {
  time: 'Simulation time elapsed.',
  dt: 'Integrator time step size used this frame.',
  steps: 'Total numerical integration steps completed.',
  energyError: 'Energy conservation error: should stay near zero for accurate integration.',
  totalEnergy: 'Total mechanical energy of the system.',
  angularMomentum: 'Total angular momentum of the system.',
  cfl: 'Courant-Friedrichs-Lewy number: should remain below 1 for stability.',
  maxVelocity: 'Maximum velocity magnitude currently observed in the domain.',
  lyapunov:
    'Lyapunov exponent: positive values indicate sensitive dependence on initial conditions.',
};

function normalize(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '');
}

function inferFromLabel(label) {
  const text = String(label ?? '').toLowerCase();
  if (text.includes('reynolds') || /^re(\b|\s)/.test(text)) return CONTROL_KEY_TOOLTIPS.re;
  if (text.includes('strouhal') || /^st(\b|\s)/.test(text)) return CONTROL_KEY_TOOLTIPS.st;
  if (text.includes('drag b/m') || text.includes('b/m')) return CONTROL_KEY_TOOLTIPS.dragcoeff;
  if (text.includes('v₀') || text.includes('v0') || text.includes('launch speed'))
    return CONTROL_KEY_TOOLTIPS.launchspeed;
  if (text.includes('c_d') || text.includes('drag coefficient')) return CONTROL_KEY_TOOLTIPS.cd;
  if (text.includes('c_l') || text.includes('lift coefficient')) return CONTROL_KEY_TOOLTIPS.cl;
  if (text.includes('dyn press') || text.includes('dynamic pressure')) {
    return 'Dynamic pressure = 1/2 rho v^2, the kinetic energy density of moving fluid.';
  }
  if (text.includes('trail')) return CONTROL_KEY_TOOLTIPS.trail;
  if (text.includes('tolerance')) return CONTROL_KEY_TOOLTIPS.tolerance;
  return '';
}

export function inferControlTooltip(control) {
  const key = normalize(control?.key);
  const fromKey = CONTROL_KEY_TOOLTIPS[key];
  if (fromKey) return fromKey;

  const fromLabel = inferFromLabel(control?.label);
  if (fromLabel) return fromLabel;

  return `Adjust ${control?.label ?? 'this parameter'} for the current simulation setup.`;
}

export function inferReadoutTooltip(metricKey, label) {
  const byKey = READOUT_KEY_TOOLTIPS[metricKey];
  if (byKey) return byKey;
  return inferFromLabel(label) || `Live telemetry for ${label}.`;
}
