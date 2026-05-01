import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * usePhysicsEngine
 * 
 * Orchestrates simulation lifecycle.
 * Supports both main-thread and worker-thread execution.
 */
export function usePhysicsEngine(sim, params, canvasRef) {
  const [state, setState] = useState(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState(null);
  const workerRef = useRef(null);
  const stateRef = useRef(null);
  const runningRef = useRef(false);
  const lastTsRef = useRef(0);
  const rafRef = useRef(null);
  const speedRef = useRef(1);

  // Sync refs
  useEffect(() => { runningRef.current = running; }, [running]);
  useEffect(() => { stateRef.current = state; }, [state]);

  const initParamsRef = useRef(params);

  const initWorker = useCallback(() => {
    if (workerRef.current) workerRef.current.terminate();
    if (!sim) return;
    
    // Create worker using Vite's URL syntax
    workerRef.current = new Worker(
      new URL('../physics/physics.worker.js', import.meta.url),
      { type: 'module' }
    );

    workerRef.current.onmessage = (e) => {
      const { type, payload } = e.data;
      if (type === 'INIT_DONE') {
        setState(payload.state);
        setError(null);
      } else if (type === 'UPDATE_DONE') {
        setState(payload.state);
      } else if (type === 'ERROR') {
        setError(payload);
        setRunning(false);
      }
    };

    workerRef.current.postMessage({
      type: 'INIT',
      payload: { simId: sim.id, params: initParamsRef.current }
    });
  }, [sim]);

  const loop = useCallback((ts) => {
    if (!runningRef.current) return;

    const dt = lastTsRef.current === 0 ? 1/60 : Math.min((ts - lastTsRef.current) / 1000, 1/20);
    lastTsRef.current = ts;

    const effectiveDt = dt * speedRef.current;

    if (workerRef.current) {
      workerRef.current.postMessage({
        type: 'UPDATE',
        payload: { state: stateRef.current, dt: effectiveDt, params }
      });
    } else if (sim && sim.update) {
      const nextState = sim.update(stateRef.current, effectiveDt, params);
      setState(nextState);
    }

    // Render on main thread
    if (canvasRef.current && stateRef.current && sim && sim.render) {
      const ctx = canvasRef.current.getContext('2d');
      sim.render(ctx, stateRef.current, params, canvasRef.current);
    }

    rafRef.current = requestAnimationFrame(loop);
  }, [sim, params, canvasRef]);

  // Handle Play/Pause
  const start = useCallback(() => {
    if (running) return;
    setRunning(true);
    lastTsRef.current = 0;
    rafRef.current = requestAnimationFrame(loop);
  }, [running, loop]);

  const stop = useCallback(() => {
    setRunning(false);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, []);

  const reset = useCallback(() => {
    stop();
    initWorker();
  }, [stop, initWorker]);

  const setSpeed = useCallback((s) => {
    speedRef.current = s;
  }, []);

  // Initialize
  useEffect(() => {
    initWorker();
    return () => {
      if (workerRef.current) workerRef.current.terminate();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [initWorker]);

  return {
    state,
    running,
    error,
    start,
    stop,
    reset,
    setSpeed,
  };
}
