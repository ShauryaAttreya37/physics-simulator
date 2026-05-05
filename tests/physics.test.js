import { describe, it, expect } from 'vitest';
import { rk4, rk45Step, yoshida4Step } from '../src/physics/solvers';

describe('Physics Solvers', () => {
  it('RK4 should solve SHM within tolerance', () => {
    const shoDerivs = (state, p) => [state[1], (-p.k / p.m) * state[0]];
    const p = { k: 1, m: 1 };
    let state = [1, 0];
    const h = 0.1;
    const steps = 10;

    for (let i = 0; i < steps; i++) {
      state = rk4(state, h, shoDerivs, p);
    }

    const time = h * steps;
    const exact = Math.cos(time);
    expect(Math.abs(state[0] - exact)).toBeLessThan(1e-6);
  });

  it('RK45 should adapt step size to maintain tolerance', () => {
    const shoDerivs = (state, p) => [state[1], (-p.k / p.m) * state[0]];
    const p = { k: 1, m: 1 };
    let state = [1, 0];
    let h = 0.1;
    let time = 0;
    const tol = 1e-8;

    for (let i = 0; i < 5; i++) {
      const result = rk45Step(state, h, shoDerivs, p, tol);
      if (result.accepted) {
        state = result.state;
        time += h;
      }
      h = result.hNew;
    }

    const exact = Math.cos(time);
    expect(Math.abs(state[0] - exact)).toBeLessThan(tol * 100); // Loose check for global error
  });
});

describe('Double Pendulum Conservation', () => {
  // Re-implementing simplified derivs and energy for testing
  const p = { m1: 1, m2: 1, l1: 1, l2: 1, g: 9.81 };

  function derivs(state, p) {
    const [th1, th2, om1, om2] = state;
    const d = th1 - th2;
    const cosD = Math.cos(d);
    const den = 2 * p.m1 + p.m2 - p.m2 * Math.cos(2 * d);

    const dom1 =
      (-p.g * (2 * p.m1 + p.m2) * Math.sin(th1) -
        p.m2 * p.g * Math.sin(th1 - 2 * th2) -
        2 * Math.sin(d) * p.m2 * (om2 * om2 * p.l2 + om1 * om1 * p.l1 * cosD)) /
      (p.l1 * den);
    const dom2 =
      (2 *
        Math.sin(d) *
        (om1 * om1 * p.l1 * (p.m1 + p.m2) +
          p.g * (p.m1 + p.m2) * Math.cos(th1) +
          om2 * om2 * p.l2 * p.m2 * cosD)) /
      (p.l2 * den);
    return [om1, om2, dom1, dom2];
  }

  function energy(state, p) {
    const [th1, th2, om1, om2] = state;
    const cosD = Math.cos(th1 - th2);
    const T =
      0.5 * (p.m1 + p.m2) * p.l1 * p.l1 * om1 * om1 +
      0.5 * p.m2 * p.l2 * p.l2 * om2 * om2 +
      p.m2 * p.l1 * p.l2 * om1 * om2 * cosD;
    const V = -(p.m1 + p.m2) * p.g * p.l1 * Math.cos(th1) - p.m2 * p.g * p.l2 * Math.cos(th2);
    return T + V;
  }

  it('Energy should be conserved within RK45 tolerance', () => {
    let state = [1.0, 0.5, 0, 0]; // Non-zero energy state
    const E0 = energy(state, p);
    let h = 0.005;
    const tol = 1e-10;

    for (let i = 0; i < 100; i++) {
      const result = rk45Step(state, h, derivs, p, tol);
      if (result.accepted) {
        state = result.state;
      }
      h = Math.max(1e-4, Math.min(result.hNew, 0.01));
    }

    const E1 = energy(state, p);
    const relError = Math.abs((E1 - E0) / E0);
    expect(relError).toBeLessThan(1e-8);
  });
});

describe('Orbital Gravity (N-Body) Conservation', () => {
  const p = { g: 1, softening: 1e-6 };

  function accel(bodies, params) {
    const { g, softening } = params;
    const a = bodies.map(() => [0, 0]);
    for (let i = 0; i < bodies.length; i++) {
      for (let j = i + 1; j < bodies.length; j++) {
        const dx = bodies[j][0] - bodies[i][0];
        const dy = bodies[j][1] - bodies[i][1];
        const r2 = dx * dx + dy * dy + softening;
        const r = Math.sqrt(r2);
        const f = g / (r2 * r);
        a[i][0] += f * dx;
        a[i][1] += f * dy;
        a[j][0] -= f * dx;
        a[j][1] -= f * dy;
      }
    }
    return a;
  }

  function computeEnergy(q, v, params) {
    const { g, softening } = params;
    let ke = 0,
      pe = 0;
    for (let i = 0; i < q.length; i++) {
      ke += 0.5 * (v[i][0] ** 2 + v[i][1] ** 2);
      for (let j = i + 1; j < q.length; j++) {
        const dx = q[j][0] - q[i][0],
          dy = q[j][1] - q[i][1];
        pe -= g / Math.sqrt(dx * dx + dy * dy + softening);
      }
    }
    return ke + pe;
  }

  function computeAngularMomentum(q, v) {
    let L = 0;
    for (let i = 0; i < q.length; i++) {
      L += q[i][0] * v[i][1] - q[i][1] * v[i][0];
    }
    return L;
  }

  it('Yoshida4 should conserve energy in figure-8 orbit', () => {
    // Initial conditions for Chenciner's Figure-8
    const q = [
      [-0.97000436, 0.24308753],
      [0.97000436, -0.24308753],
      [0, 0],
    ];
    const v = [
      [0.93240737 / 2, 0.86473146 / 2],
      [0.93240737 / 2, 0.86473146 / 2],
      [-0.93240737, -0.86473146],
    ];

    const E0 = computeEnergy(q, v, p);
    const L0 = computeAngularMomentum(q, v);
    const h = 0.01;

    for (let i = 0; i < 200; i++) {
      yoshida4Step(q, v, h, accel, p);
    }

    const E1 = computeEnergy(q, v, p);
    const L1 = computeAngularMomentum(q, v);

    const absEnergyError = Math.abs(E1 - E0);
    const absMomentumError = Math.abs(L1 - L0);

    // Symplectic integrators have excellent long-term energy stability
    expect(absEnergyError).toBeLessThan(1e-7);
    expect(absMomentumError).toBeLessThan(1e-12);
  });
});
