import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { ArrowLeft, Play, Pause, RotateCcw, LineChart as LineChartIcon, BookOpen, Sliders, Download, Crosshair, Gauge, FlaskConical, Layers, Video, Square } from 'lucide-react';
import 'katex/dist/katex.min.css';
import MakieGraph from './MakieGraph';
import DataReadout from './DataReadout';
import TheoryNotebook, { legacyToSections } from './TheoryNotebook';
import GuidedExperiment from './GuidedExperiment';
import { inferControlTooltip } from '../constants/physicsTooltips';

function formatValue(value, step) {
  if (typeof value !== 'number') return String(value);
  if (!Number.isFinite(step)) return value.toFixed(3);
  if (step >= 1) return value.toFixed(0);
  if (step >= 0.1) return value.toFixed(2);
  if (step >= 0.01) return value.toFixed(3);
  return value.toFixed(4);
}

function formatClock(seconds) {
  const safe = Math.max(0, Number(seconds) || 0);
  const mins = Math.floor(safe / 60);
  const secs = Math.floor(safe % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function ParamControl({ control, value, onChange }) {
  const step = control.step ?? 0.01;
  const tooltip = control.tooltip ?? inferControlTooltip(control);
  const markers = control.markers ?? [];
  const markerPosition = (markerValue) => {
    const min = Number(control.min);
    const max = Number(control.max);
    if (!Number.isFinite(min) || !Number.isFinite(max) || max <= min) return 0;
    const pct = ((markerValue - min) / (max - min)) * 100;
    return Math.max(0, Math.min(100, pct));
  };

  return (
    <div className="form-group">
      <label title={tooltip || undefined}>
        <span>{control.label}</span>
        <span className="value-pill">{formatValue(value, step)}</span>
      </label>
      <div className="input-row">
        <div className={`slider-stack${markers.length > 0 ? ' has-markers' : ''}`}>
          <input
            type="range"
            min={control.min} max={control.max} step={step}
            value={value}
            className="slider-input"
            onChange={(e) => onChange(Number.parseFloat(e.target.value))}
          />
          {markers.length > 0 && (
            <div className="slider-markers">
              {markers.map((marker) => (
                <div
                  key={`${control.key}-${marker.value}-${marker.label}`}
                  className="slider-marker"
                  style={{ left: `${markerPosition(marker.value)}%` }}
                  title={`${marker.label}: ${marker.value}`}
                >
                  <span className="slider-marker-tick" />
                  <span className="slider-marker-label">{marker.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <input
          type="number"
          min={control.min} max={control.max} step={step}
          value={value}
          className="form-input number-input"
          onChange={(e) => {
            const next = Number.parseFloat(e.target.value);
            if (Number.isFinite(next)) onChange(next);
          }}
        />
      </div>
    </div>
  );
}

export default function SimulationRunner({ sim, onBack }) {
  const canvasRef = useRef(null);
  const simRef = useRef(null);
  const runningRef = useRef(false);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const recordingStartedAtRef = useRef(0);

  const [running, setRunning] = useState(false);
  const [params, setParams] = useState(() => ({ ...(sim.defaultParams ?? {}) }));
  const [sideTab, setSideTab] = useState('controls');
  const [graphKey, setGraphKey] = useState(sim.graphParams?.[0]?.key);
  const [graphData, setGraphData] = useState([]);
  const [readoutData, setReadoutData] = useState(null);
  const [speed, setSpeed] = useState(1);
  const [activeExperiment, setActiveExperiment] = useState(null);
  const [reloadNonce, setReloadNonce] = useState(0);
  const [runnerError, setRunnerError] = useState('');
  const [exportToast, setExportToast] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingElapsed, setRecordingElapsed] = useState(0);
  const [recordQuality, setRecordQuality] = useState('standard');

  const controls = useMemo(() => sim.controls ?? [], [sim.controls]);

  // Collect graph data
  useEffect(() => {
    let timer;
    if (running) {
      timer = setInterval(() => {
        if (!simRef.current || !simRef.current.getData) return;
        const d = simRef.current.getData();
        if (!d) return;
        setReadoutData(d);
        setGraphData(prev => {
          const next = [...prev, d];
          if (next.length > 300) next.shift();
          return next;
        });
      }, 40);
    }
    return () => clearInterval(timer);
  }, [running]);

  useEffect(() => {
    if (!exportToast) return undefined;
    const timer = setTimeout(() => setExportToast(''), 6000);
    return () => clearTimeout(timer);
  }, [exportToast]);

  useEffect(() => {
    if (!isRecording) return undefined;
    const timer = setInterval(() => {
      setRecordingElapsed((Date.now() - recordingStartedAtRef.current) / 1000);
    }, 250);
    return () => clearInterval(timer);
  }, [isRecording]);

  // Instantiate simulation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let resizeRaf = null;

    const destroyCurrent = () => {
      if (simRef.current) { simRef.current.destroy(); simRef.current = null; }
    };

    const instantiate = () => {
      try {
        const wrapper = canvas.parentElement;
        if (!wrapper) return;
        canvas.width = wrapper.offsetWidth;
        canvas.height = wrapper.offsetHeight;
        destroyCurrent();
        const instance = sim.create(canvas, params);
        simRef.current = instance;
        if (instance.setSpeed) instance.setSpeed(speed);
        if (runningRef.current) instance.start();
        else instance.stop();
        setRunnerError('');
      } catch (err) {
        destroyCurrent();
        runningRef.current = false;
        setRunning(false);
        setRunnerError(err?.message || 'Failed to initialize simulation.');
      }
    };

    instantiate();

    function onResize() {
      if (resizeRaf !== null) cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(instantiate);
    }
    window.addEventListener('resize', onResize);
    return () => {
      if (resizeRaf !== null) cancelAnimationFrame(resizeRaf);
      window.removeEventListener('resize', onResize);
      destroyCurrent();
    };
  }, [sim, params, reloadNonce]);

  const togglePlay = useCallback(() => {
    const instance = simRef.current;
    if (!instance) return;
    if (runningRef.current) {
      instance.stop(); runningRef.current = false; setRunning(false);
    } else {
      instance.start(); runningRef.current = true; setRunning(true);
    }
  }, []);

  const reset = useCallback(() => {
    simRef.current?.reset();
    runningRef.current = true;
    setRunning(true);
    setGraphData([]);
    setSpeed(1);
    if (simRef.current?.setSpeed) simRef.current.setSpeed(1);
  }, []);

  const resetParams = useCallback(() => {
    setParams({ ...(sim.defaultParams ?? {}) });
  }, [sim.defaultParams]);

  const exportCSV = useCallback(() => {
    if (graphData.length === 0) {
      setExportToast('No data yet. Press Play for a few seconds, then export again.');
      return;
    }
    const keys = Object.keys(graphData[0]);
    const header = keys.join(',');
    const rows = graphData.map(d => keys.map(k => d[k] ?? '').join(','));
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${sim.id}_data.csv`;
    a.click(); URL.revokeObjectURL(url);
    setExportToast('Exported. Open in Sheets or Excel and plot velocity vs time to compare runs.');
  }, [graphData, sim.id]);

  const stopRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;
    if (recorder.state !== 'inactive') recorder.stop();
  }, []);

  const startRecording = useCallback(() => {
    if (runnerError) {
      setExportToast('Cannot start recording while the simulation is in an error state.');
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas || typeof canvas.captureStream !== 'function') {
      setExportToast('Video export is not supported in this browser.');
      return;
    }

    if (typeof MediaRecorder === 'undefined') {
      setExportToast('MediaRecorder is not available in this browser.');
      return;
    }

    const fps = recordQuality === 'high' ? 60 : 30;
    const stream = canvas.captureStream(fps);
    const preferredTypes = [
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8',
      'video/webm',
    ];
    const mimeType = preferredTypes.find((type) => MediaRecorder.isTypeSupported(type)) || '';
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);

    recordedChunksRef.current = [];
    recordingStartedAtRef.current = Date.now();
    setRecordingElapsed(0);

    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) recordedChunksRef.current.push(event.data);
    };

    recorder.onerror = () => {
      setExportToast('Recording failed. Please try again.');
      setIsRecording(false);
      mediaRecorderRef.current = null;
      stream.getTracks().forEach((track) => track.stop());
    };

    recorder.onstop = () => {
      stream.getTracks().forEach((track) => track.stop());
      const chunks = recordedChunksRef.current;
      mediaRecorderRef.current = null;
      setIsRecording(false);

      if (!chunks.length) {
        setExportToast('Recording ended, but no video frames were captured.');
        return;
      }

      const blobType = mimeType || 'video/webm';
      const blob = new Blob(chunks, { type: blobType });
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `${sim.id}_${timestamp}.webm`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      setExportToast(`Video exported (${formatClock((Date.now() - recordingStartedAtRef.current) / 1000)}).`);
    };

    recorder.start(250);
    mediaRecorderRef.current = recorder;
    setIsRecording(true);
    setExportToast('Recording started. Press Stop Video when you are done.');

    if (!runningRef.current && simRef.current) {
      simRef.current.start?.();
      runningRef.current = true;
      setRunning(true);
    }
  }, [recordQuality, runnerError, sim.id]);

  // Apply scenario preset
  const applyScenario = useCallback((scenario) => {
    if (scenario.params) {
      setParams(prev => ({ ...prev, ...scenario.params }));
    }
  }, []);

  // Apply params from guided experiment step (no auto-play)
  const handleGuideApplyParams = useCallback((stepParams) => {
    setParams(prev => ({ ...prev, ...stepParams }));
  }, []);

  useEffect(() => {
    return () => {
      const recorder = mediaRecorderRef.current;
      if (recorder && recorder.state !== 'inactive') recorder.stop();
    };
  }, []);

  useEffect(() => {
    if (isRecording) stopRecording();
  }, [sim.id, isRecording, stopRecording]);

  // Build graph series from graphParams
  const graphSeries = useMemo(() => {
    if (!sim.graphParams) return [];
    if (sideTab === 'phase' && sim.graphParams.length >= 2) {
      return sim.graphParams.slice(0, 2).map(gp => ({ key: gp.key, label: gp.label }));
    }
    if (graphKey) {
      return [{ key: graphKey, label: sim.graphParams.find(gp => gp.key === graphKey)?.label || graphKey }];
    }
    return [];
  }, [sim.graphParams, graphKey, sideTab]);

  // Equation sections
  const eqSections = useMemo(() => {
    return sim.equationSections || legacyToSections(sim.equations, sim.title);
  }, [sim]);

  // Graph dimensions
  const graphWidth = 300;
  const graphHeight = 220;

  return (
    <div className="sim-runner-research">
      {/* ── Main area (canvas + controls) ────────────────────── */}
      <div className="sim-main-area">
        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', flexShrink: 0 }}>
          <button className="icon-btn" onClick={onBack} title="Back">
            <ArrowLeft size={16} />
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>
              {sim.title}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, display: 'flex', gap: 6, alignItems: 'center' }}>
              {sim.method && (
                <span className={`method-badge ${sim.method === 'rk45' ? 'rk45' : sim.method === 'yoshida4' ? 'symplectic' : sim.method === 'fdm' ? 'fdm' : 'rk45'}`}>
                  {sim.method === 'rk45' ? 'RK45 Adaptive' : sim.method === 'yoshida4' ? 'Yoshida⁴' : sim.method === 'fdm' ? 'FDM' : 'RK4'}
                </span>
              )}
              {sim.tags?.slice(0, 2).map(t => (
                <span key={t} className="sim-tag">{t}</span>
              ))}
            </div>
          </div>
          {/* Playback controls */}
          <button
            className={`icon-btn ${running ? 'pause-btn' : 'play-btn'}`}
            onClick={togglePlay}
            title={running ? 'Pause' : 'Play'}
          >
            {running ? <Pause size={14} /> : <Play size={14} fill="currentColor" />}
          </button>
          <button className="icon-btn" onClick={reset} title="Reset">
            <RotateCcw size={14} />
          </button>
          <div className="export-actions">
            <button className="btn-export" onClick={exportCSV} title="Export CSV">
              <Download size={12} /> CSV
            </button>
            <button
              className={`btn-export btn-record${isRecording ? ' active' : ''}`}
              onClick={isRecording ? stopRecording : startRecording}
              title={isRecording ? 'Stop video recording' : 'Export video'}
            >
              {isRecording ? <Square size={11} /> : <Video size={12} />}
              {isRecording ? 'Stop Video' : 'Video'}
            </button>
            <select
              className={`speed-select record-quality${isRecording ? ' active' : ''}`}
              value={recordQuality}
              onChange={(e) => setRecordQuality(e.target.value)}
              disabled={isRecording}
              title="Video recording quality"
            >
              <option value="standard">30fps</option>
              <option value="high">60fps</option>
            </select>
            {isRecording && <span className="record-pill">REC {formatClock(recordingElapsed)}</span>}
          </div>
          {/* Speed control */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginLeft: 2 }}>
            <Gauge size={13} style={{ color: speed !== 1 ? '#FFD166' : 'var(--text-muted)', transition: 'color 0.2s' }} />
            <select
              className={`speed-select${speed !== 1 ? ' active' : ''}`}
              value={speed}
              onChange={(e) => {
                const s = Number(e.target.value);
                setSpeed(s);
                if (simRef.current?.setSpeed) simRef.current.setSpeed(s);
              }}
            >
              <option value={0.25}>×0.25</option>
              <option value={0.5}>×0.5</option>
              <option value={1}>×1</option>
              <option value={2}>×2</option>
            </select>
          </div>
        </div>

        {/* Canvas with figure frame */}
        <div className="sim-canvas-wrapper">
          <canvas ref={canvasRef} className="sim-runner-canvas" />
          {runnerError && (
            <div className="sim-runner-error">
              <div className="sim-runner-error-title">Simulation paused</div>
              <div className="sim-runner-error-msg">{runnerError}</div>
              <button className="btn" onClick={() => setReloadNonce((n) => n + 1)}>Retry</button>
            </div>
          )}
          <DataReadout data={readoutData} method={sim.method || 'rk4'} />
        </div>
        {exportToast && <div className="sim-toast">{exportToast}</div>}
      </div>

      {/* ── Side panel ───────────────────────────────────────── */}
      <div className="sim-side-panel">
        <div className="sim-side-tabs">
          <button
            className={`sim-side-tab ${sideTab === 'controls' ? 'active' : ''}`}
            onClick={() => setSideTab('controls')}
          >
            <Sliders size={13} /> Controls
          </button>
          <button
            className={`sim-side-tab ${sideTab === 'graph' ? 'active' : ''}`}
            onClick={() => setSideTab('graph')}
          >
            <LineChartIcon size={13} /> Graph
          </button>
          {sim.graphParams?.length >= 2 && (
            <button
              className={`sim-side-tab ${sideTab === 'phase' ? 'active' : ''}`}
              onClick={() => setSideTab('phase')}
            >
              <Crosshair size={13} /> Phase
            </button>
          )}
          <button
            className={`sim-side-tab ${sideTab === 'equations' ? 'active' : ''}`}
            onClick={() => setSideTab('equations')}
            title="Theory Notebook"
            style={{ flex: 0, padding: '0 16px' }}
          >
            <BookOpen size={16} />
          </button>
          {(sim.guidedExperiments?.length > 0 || sim.scenarios?.length > 0) && (
            <button
              className={`sim-side-tab ${sideTab === 'guide' ? 'active' : ''}`}
              onClick={() => setSideTab('guide')}
              title="Guided Experiments & Scenarios"
              style={{ flex: 0, padding: '0 16px' }}
            >
              <FlaskConical size={15} />
            </button>
          )}
        </div>

        <div className="sim-side-content">
          {/* ── Controls tab ────────────────────────────────── */}
          {sideTab === 'controls' && (
            <div style={{ padding: '14px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted)' }}>
                  Parameters
                </span>
                <button className="btn" style={{ padding: '3px 8px', fontSize: 10 }} onClick={resetParams}>
                  Defaults
                </button>
              </div>
              {controls.length > 0 ? (
                <div className="property-section" style={{ paddingTop: 0, borderBottom: 'none' }}>
                  {controls.map(control => (
                    <ParamControl
                      key={control.key}
                      control={control}
                      value={params[control.key] ?? control.min ?? 0}
                      onChange={(next) => setParams(prev => ({ ...prev, [control.key]: next }))}
                    />
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <p>No runtime parameters available.</p>
                </div>
              )}
              {/* Sim description */}
              <div style={{ marginTop: 16, padding: '12px 14px', background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--r-sm)', border: '1px solid rgba(255,255,255,0.04)' }}>
                <p style={{ fontSize: 12, color: 'var(--text-sub)', lineHeight: 1.6, fontFamily: 'var(--font-serif)' }}>
                  {sim.description}
                </p>
              </div>
            </div>
          )}

          {/* ── Graph tab ───────────────────────────────────── */}
          {sideTab === 'graph' && sim.graphParams && (
            <div style={{ padding: '14px 12px' }}>
              <div style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                <select
                  className="graph-select"
                  style={{ flex: 1 }}
                  value={graphKey}
                  onChange={(e) => setGraphKey(e.target.value)}
                >
                  {sim.graphParams.map(gp => (
                    <option key={gp.key} value={gp.key}>{gp.label}</option>
                  ))}
                </select>
              </div>
              <MakieGraph
                data={graphData}
                series={graphSeries}
                xKey="time"
                xLabel="t [s]"
                yLabel={graphSeries[0]?.label || ''}
                title={graphSeries[0]?.label || ''}
                width={graphWidth}
                height={graphHeight}
                colormap="viridis"
                showLegend={false}
              />
              {graphData.length > 0 && graphData[graphData.length - 1] && (
                <div style={{ marginTop: 8, padding: '8px 10px', background: 'rgba(0,0,0,0.2)', borderRadius: 6, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-sub)' }}>
                  Current: {(graphData[graphData.length - 1][graphKey] ?? 0).toFixed(6)}
                </div>
              )}
            </div>
          )}

          {/* ── Phase space tab ──────────────────────────────── */}
          {sideTab === 'phase' && sim.graphParams?.length >= 2 && (
            <div style={{ padding: '14px 12px' }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted)', marginBottom: 8 }}>
                Phase Space Plot
              </div>
              <MakieGraph
                data={graphData}
                series={graphSeries}
                xLabel={graphSeries[0]?.label || ''}
                yLabel={graphSeries[1]?.label || ''}
                title={`${graphSeries[0]?.label} vs ${graphSeries[1]?.label}`}
                width={graphWidth}
                height={graphWidth}
                colormap="plasma"
                phaseSpace={true}
                showLegend={false}
              />
            </div>
          )}

          {/* ── Equations tab ───────────────────────────────── */}
          {sideTab === 'equations' && (
            <div className="panel-content custom-scroll">
              <TheoryNotebook sections={eqSections} title={sim.title} />
            </div>
          )}

          {/* ── Guide tab (Scenarios + Guided Experiments) ──── */}
          {sideTab === 'guide' && (
            <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Active guided experiment */}
              {activeExperiment && (
                <GuidedExperiment
                  experiment={activeExperiment}
                  onApplyParams={handleGuideApplyParams}
                  onClose={() => setActiveExperiment(null)}
                />
              )}

              {/* Scenarios section */}
              {!activeExperiment && sim.scenarios?.length > 0 && (
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--accent)', marginBottom: 10 }}>
                    Preset Scenarios
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {sim.scenarios.map((scenario, i) => (
                      <button
                        key={i}
                        onClick={() => applyScenario(scenario)}
                        style={{
                          textAlign: 'left',
                          padding: '10px 12px',
                          background: 'rgba(255,255,255,0.03)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          borderRadius: 'var(--r-sm)',
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 4,
                        }}
                        className="scenario-btn"
                      >
                        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>
                          {scenario.name}
                        </span>
                        {scenario.description && (
                          <span style={{ fontSize: 11, color: 'var(--text-sub)', lineHeight: 1.5 }}>
                            {scenario.description}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Guided experiments launcher */}
              {!activeExperiment && sim.guidedExperiments?.length > 0 && (
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--sci-green)', marginBottom: 10 }}>
                    Guided Experiments
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {sim.guidedExperiments.map((exp, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveExperiment(exp)}
                        style={{
                          textAlign: 'left',
                          padding: '10px 12px',
                          background: 'rgba(94,201,98,0.05)',
                          border: '1px solid rgba(94,201,98,0.15)',
                          borderRadius: 'var(--r-sm)',
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                        }}
                        className="scenario-btn"
                      >
                        <FlaskConical size={14} style={{ color: 'var(--sci-green)', flexShrink: 0 }} />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>
                            {exp.title}
                          </span>
                          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                            {exp.steps.length} steps · Predict → Observe → Explain
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty state */}
              {!activeExperiment && !sim.scenarios?.length && !sim.guidedExperiments?.length && (
                <div className="empty-state">
                  <p>No guided experiments available for this simulation yet.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
