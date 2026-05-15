# Physics Simulator

A browser-based physics lab for running interactive simulations, changing parameters, viewing graphs, and exporting data.

## What It Includes

- A catalog of mechanics, fluids, electromagnetism, optics, and quantum simulations.
- A freeform 2D sandbox built on Matter.js.
- Numerical solvers for RK4, adaptive RK45, and Yoshida 4th-order symplectic integration.
- Live data readouts, graphing, CSV export, plot export, and video recording.
- Theory panels with equations for the simulation being viewed.

## Getting Started

Requirements:

- Node.js 18 or newer

Install and run:

```bash
npm install
npm run dev
```

Build for production:

```bash
npm run build
```

Run tests:

```bash
npm run test
```

Run lint:

```bash
npm run lint
```

## Project Structure

```text
src/
  components/       Shared UI, graphs, panels, and canvas runners
  hooks/            Simulation runtime hooks
  pages/            Home, laboratory, docs, and integrator pages
  physics/          Matter.js helpers and numerical solvers
  simulations/      Physics simulation modules grouped by domain
  store/            Zustand state for the sandbox
  utils/            Canvas and color helpers
tests/              Vitest coverage for physics solvers
```

## Simulation Contract

Most simulations export:

```js
export const defaultParams = {};
export const controls = [];
export function create(canvas, initParams = {}) {}
```

The object returned by `create` should support the runtime methods used by `SimulationRunner`, such as `start`, `stop`, `reset`, `destroy`, `setParams`, and optionally `getData` or `setSpeed`.

## License

GPL-3.0. See `LICENSE`.
