/**
 * Physics Worker
 * 
 * Offloads heavy numerical integration (update loops) to a background thread.
 */

// Registry of available simulations
const SIMS = {
  'orbital-gravity': () => import('../simulations/mechanics/orbitalGravity'),
  'double-pendulum': () => import('../simulations/mechanics/doublePendulum'),
};

let currentSim = null;
let currentSimId = null;

self.onmessage = async (e) => {
  const { type, payload } = e.data;

  switch (type) {
    case 'INIT': {
      const { simId, params } = payload;
      try {
        const mod = await SIMS[simId]();
        currentSim = mod;
        currentSimId = simId;
        const state = mod.init(params);
        self.postMessage({ type: 'INIT_DONE', payload: { state } });
      } catch (err) {
        self.postMessage({ type: 'ERROR', payload: err.message });
      }
      break;
    }

    case 'UPDATE': {
      const { state, dt, params } = payload;
      if (!currentSim) return;
      try {
        const nextState = currentSim.update(state, dt, params);
        self.postMessage({ type: 'UPDATE_DONE', payload: { state: nextState } });
      } catch (err) {
        self.postMessage({ type: 'ERROR', payload: err.message });
      }
      break;
    }
  }
};
