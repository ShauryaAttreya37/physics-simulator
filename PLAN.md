# Mechanics Sandbox Plan

The product should feel like a focused physics workspace: open a model, change a value, see the result, and export data when needed. The app should avoid inflated language, decorative UI, and features that do not directly help experimentation.

## 1. Clean Product Surface

- Keep the home screen direct and useful.
- Use plain labels: Lab, Sandbox, Integrators, Docs.
- Remove marketing copy from the README and in-app text.
- Keep visual styling quiet: clear spacing, readable controls, restrained color, and no decorative effects that compete with the simulation.

## 2. Better Lab Flow

- Make every simulation easy to start, reset, and inspect.
- Keep controls stable and predictable.
- Show live values and graphs only where they help the current experiment.
- Keep exports simple: CSV, plot image, and video recording.

## 3. Stronger Physics Coverage

- Add new simulations only when the model, controls, equations, and graph data are complete.
- Prefer tested numerical methods already in `src/physics/solvers.js`.
- Add focused tests for shared solvers and any simulation math that can be tested outside canvas rendering.

## 4. Accessibility

- Improve keyboard support for the sandbox tools.
- Add useful text labels and titles for controls.
- Keep color choices legible and avoid relying on color alone for meaning.

## 5. Performance

- Profile before replacing rendering technology.
- Use workers or WebGL only where Canvas 2D is a measured bottleneck.
- Keep the existing simulation API stable unless a migration clearly improves maintainability.

## Current Implementation Pass

- Simplify the home page copy and class names.
- Simplify the app shell styling.
- Replace README marketing language with practical project documentation.
- Keep existing physics behavior unchanged.
