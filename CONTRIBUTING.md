# Contributing to Physics Simulator

Thank you for your interest in contributing to Physics Simulator! Our community relies on the expertise, passion, and collaborative spirit of developers, educators, and physicists around the world. Whether you're fixing a minor UI bug, optimizing an algorithm, or engineering an entirely new physics simulation block, your contributions are highly valued.

This document outlines the guidelines and architectural philosophy to ensure a smooth, professional, and efficient contribution process.

---

## 🏛️ Project Ideology & Standards

When adding or modifying code, we ask contributors to adhere to the following principles:

1. **Scientific Accuracy over Flashiness:** While we strive for an aesthetically pleasing UI, the mathematical integrity and physical accuracy of the simulations take precedence.
2. **Modular Architecture:** Physics logic should remain decoupled from React UI components where possible. Treat simulations as independent modules that are injected into the application.
3. **Educational Transparency:** New phenomena must include academic context. Code implementing physical formulas should ideally align with the `TheoryNotebook` to explain the theory to the end-user.

---

## 🚀 How to Contribute

There are several ways you can actively improve the Physics Simulator.

### 1. Proposing a New Simulation
We highly encourage the expansion of our physics library. Before writing code for a complex new simulation:
- Please open an issue using the **[New Simulation Proposal template](.github/ISSUE_TEMPLATE/new_simulation_proposal.md)**.
- Outline the governing equations, the necessary user parameters (e.g., toggles, mass sliders), and the targeted topic directory (`mechanics`, `quantum`, `fluid`, or `electromagnetism`).
- Once the architecture is discussed and approved by maintainers, proceed with the implementation!

### 2. Engineering a New Simulation (Implementation Guide)
If you are developing a new module, please ensure it follows the repository's structural pattern:

1. **File Location:** Place your logic file in the appropriate domain folder: `src/simulations/[domain]/yourSimulationName.js`.
2. **Expose an Initializer:** Standardize your module to export an API that the routing layer expects:
   ```javascript
   export default {
     id: 'your-simulation-id',
     title: 'Simulation Title',
     init: (engine, render) => {
       // Setup Matter.js bodies and constraints here
     },
     teardown: () => {
       // Clean up listeners or memory when component unmounts
     }
   }
   ```
3. **Integrate into the UI:** Register your new simulation within `src/simulations/index.js` or attach it to the `TopicsPage.jsx` directory.

### 3. Reporting and Fixing Bugs
If you encounter a physics engine anomaly or a UI breakdown:
1. Check the [Issues tracker](https://github.com/[PLACEHOLDER_USER]/physics_simulator/issues) to ensure it hasn't already been reported.
2. If it's a new bug, submit an issue via the **[Bug Report template](.github/ISSUE_TEMPLATE/bug_report.md)**.
3. If you'd like to fix it yourself, fork the repository, resolve the issue, and reference the Issue ID in your Pull Request.

---

## 🛠️ The Pull Request (PR) Workflow

To maintain a pristine repository, please adhere to the standard open-source workflow:

1. **Fork the Repository** and clone it locally.
2. **Synchronize Main:** Ensure your fork's `main` branch is up to date with the upstream repository.
3. **Branch Out:** Create a categorically semantic branch from `main`:
   - `git checkout -b feat/quantum-tunneling`
   - `git checkout -b fix/gravity-vector-bug`
   - `git checkout -b docs/update-theory`
4. **Develop and Test:** Write clean, modular React hooks, ensure the physics engine remains stable at high frame rates, and verify that your additions do not pollute the global CSS namespaces.
5. **Commit Intelligently:** Write clear, concise commit messages identifying the rationale behind your changes.
6. **Submit a PR:** Push your branch to your fork and submit a Pull Request to our upstream `main` branch. Please fill out the provided `pull_request_template.md` thoroughly.

All PRs will undergo a code review by current maintainers. Feedback is given constructively to ensure the code meets our quality and academic standards.

---

## 💻 Local Development Environment

Setting up the project locally is straightforward:

```bash
# 1. Clone your fork
git clone https://github.com/YOUR_USERNAME/physics_simulator.git

# 2. Enter the directory
cd physics_simulator

# 3. Install NPM dependencies
npm install

# 4. Spin up the Vite development server
npm run dev
```

We utilize ESLint for code quality. Please ensure your IDE is configured to respect the `eslint.config.js` settings to avoid linting conflicts during your PR!

---

By participating in this project, you agree to abide by the Physics Simulator [Code of Conduct](CODE_OF_CONDUCT.md). We look forward to reviewing your groundbreaking simulations and improvements!
