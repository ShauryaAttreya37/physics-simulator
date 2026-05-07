import { create } from 'zustand';

export const useSandboxStore = create((set) => ({
  isRunning: false,
  selectedId: null,
  bodies: {}, // id -> { id, type, matterBody, props }
  constraints: {}, // id -> { id, type, matterConstraint, props }
  gravity: { x: 0, y: 1 },
  activeTool: 'select',
  showPropertiesPanel: window.innerWidth > 768,
  showReadout: false,

  setActiveTool: (tool) => set({ activeTool: tool, selectedId: null }),
  setRunning: (v) => set({ isRunning: v }),
  setSelectedId: (id) => set({ selectedId: id }),
  togglePropertiesPanel: () => set((s) => ({ showPropertiesPanel: !s.showPropertiesPanel })),
  toggleReadout: () => set((s) => ({ showReadout: !s.showReadout })),

  addBody: (id, data) => set((s) => ({ bodies: { ...s.bodies, [id]: data } })),
  removeBody: (id) =>
    set((s) => {
      const bodies = { ...s.bodies };
      delete bodies[id];
      return { bodies, selectedId: s.selectedId === id ? null : s.selectedId };
    }),
  updateBodyProp: (id, key, value) =>
    set((s) => {
      if (!s.bodies[id]) return {};
      return {
        bodies: {
          ...s.bodies,
          [id]: { ...s.bodies[id], props: { ...s.bodies[id].props, [key]: value } },
        },
      };
    }),

  addConstraint: (id, data) => set((s) => ({ constraints: { ...s.constraints, [id]: data } })),
  removeConstraint: (id) =>
    set((s) => {
      const constraints = { ...s.constraints };
      delete constraints[id];
      return { constraints, selectedId: s.selectedId === id ? null : s.selectedId };
    }),
  updateConstraintProp: (id, key, value) =>
    set((s) => {
      if (!s.constraints[id]) return {};
      return {
        constraints: {
          ...s.constraints,
          [id]: { ...s.constraints[id], props: { ...s.constraints[id].props, [key]: value } },
        },
      };
    }),

  setGravity: (x, y) => set({ gravity: { x, y } }),
}));
