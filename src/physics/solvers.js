/**
 * Centralized Physics Solvers
 * 
 * Provides standard numerical integration methods for solving ordinary 
 * differential equations (ODEs).
 */

/**
 * Standard 4th-order Runge-Kutta (RK4) integrator.
 * @param {Array<number>} state - Current state vector [y1, y2, ..., yn]
 * @param {number} h - Time step
 * @param {Function} derivs - Derivative function (state, params) => dState/dt
 * @param {Object} params - Parameters for the derivative function
 * @returns {Array<number>} New state vector
 */
export function rk4(state, h, derivs, params = {}) {
  const k1 = derivs(state, params);
  const k2 = derivs(state.map((v, i) => v + k1[i] * h / 2), params);
  const k3 = derivs(state.map((v, i) => v + k2[i] * h / 2), params);
  const k4 = derivs(state.map((v, i) => v + k3[i] * h), params);

  return state.map((v, i) => v + (h / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
}

/**
 * Dormand-Prince RK45 adaptive step integrator (DOPRI5).
 * Used for high-precision simulations with error estimation.
 */
const A = [
  [],
  [1 / 5],
  [3 / 40, 9 / 40],
  [44 / 45, -56 / 15, 32 / 9],
  [19372 / 6561, -25360 / 2187, 64448 / 6561, -212 / 729],
  [9017 / 3168, -355 / 33, 46732 / 5247, 49 / 176, -5103 / 18656],
  [35 / 384, 0, 500 / 1113, 125 / 192, -2187 / 6784, 11 / 84],
];
const B5 = [35 / 384, 0, 500 / 1113, 125 / 192, -2187 / 6784, 11 / 84, 0];
const B4 = [5179 / 57600, 0, 7571 / 16695, 393 / 640, -92097 / 339200, 187 / 2100, 1 / 40];

/**
 * Single adaptive step using Dormand-Prince RK45.
 * @param {Array<number>} state - Current state vector
 * @param {number} h - Current step size
 * @param {Function} derivs - Derivative function
 * @param {Object} params - Physics parameters
 * @param {number} tol - Error tolerance
 * @returns {Object} { state: Array, hNew: number, accepted: boolean }
 */
export function rk45Step(state, h, derivs, params = {}, tol = 1e-8) {
  const k = [];
  const n = state.length;

  // Compute stages
  for (let i = 0; i < 7; i++) {
    const s = new Array(n).fill(0);
    for (let j = 0; j < i; j++) {
      for (let d = 0; d < n; d++) s[d] += A[i][j] * k[j][d];
    }
    k[i] = derivs(state.map((v, d) => v + h * s[d]), params);
  }

  // 5th order solution
  const y5 = state.map((v, d) => {
    let sum = v;
    for (let i = 0; i < 7; i++) sum += h * B5[i] * k[i][d];
    return sum;
  });

  // 4th order solution (for error estimation)
  const y4 = state.map((v, d) => {
    let sum = v;
    for (let i = 0; i < 7; i++) sum += h * B4[i] * k[i][d];
    return sum;
  });

  // Error estimate
  let errMax = 0;
  for (let d = 0; d < n; d++) {
    const scale = Math.max(Math.abs(y5[d]), Math.abs(state[d]), 1e-10);
    errMax = Math.max(errMax, Math.abs(y5[d] - y4[d]) / scale);
  }
  errMax /= tol;

  // Step size control
  const safety = 0.9;
  let hNew;
  if (errMax <= 1) {
    // Accept step, increase h
    hNew = errMax > 0 ? h * Math.min(5, safety * Math.pow(errMax, -0.2)) : h * 2;
    return { state: y5, hNew, accepted: true };
  } else {
    // Reject step, decrease h
    hNew = h * Math.max(0.2, safety * Math.pow(errMax, -0.25));
    return { state: null, hNew, accepted: false };
  }
}

/**
 * Yoshida 4th-order symplectic integrator.
 * Preserves the symplectic structure of Hamiltonian systems.
 */
const CBRT2 = Math.cbrt(2);
const W0 = -CBRT2 / (2 - CBRT2);
const W1 = 1 / (2 - CBRT2);
const YOSHIDA_C = [W1 / 2, (W0 + W1) / 2, (W0 + W1) / 2, W1 / 2];
const YOSHIDA_D = [W1, W0, W1, 0];

/**
 * Perform a single Yoshida4 step.
 * @param {Array<Array<number>>} q - Positions array [[x1, y1], ...]
 * @param {Array<Array<number>>} v - Velocities array [[vx1, vy1], ...]
 * @param {number} h - Time step
 * @param {Function} getAccel - Function to compute accelerations (q, params) => [[ax1, ay1], ...]
 * @param {Object} params - Physics parameters
 */
export function yoshida4Step(q, v, h, getAccel, params = {}) {
  const n = q.length;
  for (let s = 0; s < 4; s++) {
    // Drift
    const c = YOSHIDA_C[s] * h;
    for (let i = 0; i < n; i++) {
      for (let d = 0; d < q[i].length; d++) {
        q[i][d] += c * v[i][d];
      }
    }
    // Kick
    if (YOSHIDA_D[s] !== 0) {
      const kickCoeff = YOSHIDA_D[s] * h;
      const a = getAccel(q, params);
      for (let i = 0; i < n; i++) {
        for (let dim = 0; dim < v[i].length; dim++) {
          v[i][dim] += kickCoeff * a[i][dim];
        }
      }
    }
  }
}
