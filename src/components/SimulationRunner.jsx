import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
  ArrowLeft,
  Play,
  Pause,
  RotateCcw,
  LineChart as LineChartIcon,
  BookOpen,
  Sliders,
  Download,
  Gauge,
  Video,
  Square,
  X,
} from 'lucide-react';
import { ArrayBufferTarget, Muxer } from 'mp4-muxer';
import MakieGraph, { drawMakieGraph } from './MakieGraph';
import DataReadout from './DataReadout';
import TheoryChalkboard, { legacyToSections } from './TheoryChalkboard';
import { inferControlTooltip } from '../constants/physicsTooltips';
import { usePhysicsEngine } from '../hooks/usePhysicsEngine';
import { useSandboxStore } from '../store/sandboxStore';

const EXPORT_VIDEO_WIDTH = 1920;
const EXPORT_VIDEO_HEIGHT = 1080;
const EXPORT_VIDEO_FPS = 60;
const EXPORT_VIDEO_BITRATE = 12_000_000;

function formatValue(value, step) {
  if (typeof value !== 'number') return String(value);
  if (!Number.isFinite(step)) return value.toFixed(3);
  if (step >= 1) return value.toFixed(0);
  if (step >= 0.1) return value.toFixed(2);
  if (step >= 0.01) return value.toFixed(3);
  return value.toFixed(4);
}

function clampControlValue(control, nextValue) {
  if (control.type === 'toggle' || control.type === 'tiles') return nextValue;
  const next = Number.parseFloat(nextValue);
  if (!Number.isFinite(next)) return null;
  const min = Number(control.min);
  const max = Number(control.max);
  let clamped = next;
  if (Number.isFinite(min)) clamped = Math.max(min, clamped);
  if (Number.isFinite(max)) clamped = Math.min(max, clamped);
  return control.step && control.step >= 1 ? Math.round(clamped) : clamped;
}

function ParamControl({ control, value, onChange }) {
  if (control.type === 'toggle') {
    return (
      <div className="form-group toggle-group">
        <label
          style={{
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>{control.label}</span>
          <div
            className={`toggle-switch ${value ? 'active' : ''}`}
            onClick={() => onChange(!value)}
          >
            <div className="toggle-handle" />
          </div>
        </label>
      </div>
    );
  }

  if (control.type === 'tiles') {
    return (
      <div className="form-group">
        <label>{control.label}</label>
        <div className="tile-grid">
          {control.tiles.map((tile) => (
            <button
              key={tile.value}
              className={`tile-btn ${value === tile.value ? 'active' : ''}`}
              onClick={() => onChange(tile.value)}
              style={{ '--tile-color': tile.color }}
            >
              <div className="tile-label">{tile.label}</div>
              {tile.sub && <div className="tile-sub">{tile.sub}</div>}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (control.type === 'counter') {
    const step = control.step ?? 1;
    const tooltip = control.tooltip ?? inferControlTooltip(control);
    return (
      <div className="form-group">
        <label title={tooltip || undefined}>
          <span>{control.label}</span>
          <span className="value-pill">{formatValue(value, step)}</span>
        </label>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className="btn panel-action-btn"
            style={{ flex: 1 }}
            onClick={() => {
              const next = clampControlValue(control, value - step);
              if (next !== null) onChange(next);
            }}
          >
            -
          </button>
          <input
            type="number"
            min={control.min}
            max={control.max}
            step={step}
            value={value}
            className="form-input number-input"
            style={{ flex: 2, textAlign: 'center' }}
            onChange={(e) => {
              const next = clampControlValue(control, e.target.value);
              if (next !== null) onChange(next);
            }}
          />
          <button
            className="btn panel-action-btn"
            style={{ flex: 1 }}
            onClick={() => {
              const next = clampControlValue(control, value + step);
              if (next !== null) onChange(next);
            }}
          >
            +
          </button>
        </div>
      </div>
    );
  }

  const step = control.step ?? 0.01;
  const tooltip = control.tooltip ?? inferControlTooltip(control);

  return (
    <div className="form-group">
      <label title={tooltip || undefined}>
        <span>{control.label}</span>
        <span className="value-pill">{formatValue(value, step)}</span>
      </label>
      <div className="input-row">
        <div className="slider-stack">
          <input
            type="range"
            min={control.min}
            max={control.max}
            step={step}
            value={value}
            className="slider-input"
            onChange={(e) => {
              const next = clampControlValue(control, e.target.value);
              if (next !== null) onChange(next);
            }}
          />
        </div>
        <input
          type="number"
          min={control.min}
          max={control.max}
          step={step}
          value={value}
          className="form-input number-input"
          onChange={(e) => {
            const next = clampControlValue(control, e.target.value);
            if (next !== null) onChange(next);
          }}
        />
      </div>
    </div>
  );
}

function formatOverlayValue(value) {
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return '-';
    const abs = Math.abs(value);
    if (abs !== 0 && (abs >= 10000 || abs < 0.001)) return value.toExponential(2);
    return Math.abs(value) >= 100 ? value.toFixed(1) : value.toFixed(3);
  }
  if (typeof value === 'boolean') return value ? 'On' : 'Off';
  if (value === undefined || value === null) return '-';
  return String(value);
}

function drawExportOverlayFrame({
  targetCanvas,
  sourceCanvas,
  sim,
  controls,
  params,
  readoutData,
  speed,
}) {
  if (!targetCanvas || !sourceCanvas) return;
  const ctx = targetCanvas.getContext('2d');

  // High-definition export (1920x1080)
  const width = EXPORT_VIDEO_WIDTH;
  const height = EXPORT_VIDEO_HEIGHT;
  const panelWidth = 480;
  const simWidth = width - panelWidth;

  targetCanvas.width = width;
  targetCanvas.height = height;

  // Background
  ctx.fillStyle = '#050608';
  ctx.fillRect(0, 0, width, height);

  // Draw Simulation Canvas
  const srcW = sourceCanvas.width || simWidth;
  const srcH = sourceCanvas.height || height;
  const scale = Math.min(simWidth / srcW, height / srcH);
  const drawW = srcW * scale;
  const drawH = srcH * scale;
  const dx = (simWidth - drawW) / 2;
  const dy = (height - drawH) / 2;

  ctx.imageSmoothingEnabled = false; // Keep it crisp
  ctx.drawImage(sourceCanvas, dx, dy, drawW, drawH);

  // Sidebar Panel
  const panelX = simWidth;
  ctx.fillStyle = '#0c0e14';
  ctx.fillRect(panelX, 0, panelWidth, height);

  // Vertical separator
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(panelX, 0);
  ctx.lineTo(panelX, height);
  ctx.stroke();

  const x = panelX + 40;
  let y = 60;

  // Title
  ctx.fillStyle = '#f1f5f9';
  ctx.font = '700 32px "Source Serif 4", serif';
  ctx.fillText(sim.title, x, y);
  y += 32;

  // Metadata
  ctx.fillStyle = '#94a3b8';
  ctx.font = '600 14px "JetBrains Mono", monospace';
  ctx.fillText(`SOLVER: ${String(sim.method || 'RK4').toUpperCase()}`, x, y);
  y += 20;
  ctx.fillText(`TIMESTEP_SCALE: ${speed}x`, x, y);

  const section = (label) => {
    y += 60;
    ctx.fillStyle = '#3b82f6';
    ctx.font = '800 13px "Inter", sans-serif';
    ctx.fillText(label.toUpperCase(), x, y);
    y += 16;
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.3)';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(width - 40, y);
    ctx.stroke();
    y += 32;
  };

  const row = (label, value, color = '#f1f5f9') => {
    if (y > height - 60) return;
    ctx.fillStyle = '#64748b';
    ctx.font = '500 15px "Inter", sans-serif';
    ctx.fillText(label, x, y);

    ctx.fillStyle = color;
    ctx.font = '600 15px "JetBrains Mono", monospace';
    ctx.textAlign = 'right';
    ctx.fillText(formatOverlayValue(value), width - 40, y);
    ctx.textAlign = 'left';
    y += 28;
  };

  section('System Parameters');
  const visibleControls = controls.length
    ? controls
    : Object.keys(params).map((key) => ({ key, label: key }));
  visibleControls.slice(0, 15).forEach((control) => {
    row(control.label || control.key, params[control.key]);
  });

  section('Instrumentation');
  const entries = readoutData
    ? Object.entries(readoutData).filter(
        ([, value]) => typeof value === 'number' && Number.isFinite(value),
      )
    : [];
  entries.slice(0, 12).forEach(([key, value]) => {
    row(key, value, key.toLowerCase().includes('error') ? '#f59e0b' : '#10b981');
  });
}

export default function SimulationRunner({ sim, onBack }) {
  const canvasRef = useRef(null);
  const simRef = useRef(null);
  const runningRef = useRef(false);
  const recordingSessionRef = useRef(null);
  const recordingFrameTimerRef = useRef(null);
  const recordingCanvasRef = useRef(null);

  const [running, setRunning] = useState(false);
  const [params, setParams] = useState(() => ({ ...(sim.defaultParams ?? {}) }));
  const [sideTab, setSideTab] = useState('controls');
  const [graphKey, setGraphKey] = useState(sim.graphParams?.[0]?.key);
  const [graphData, setGraphData] = useState([]);
  const [readoutData, setReadoutData] = useState(null);
  const [speed, setSpeed] = useState(1);
  const [reloadNonce, setReloadNonce] = useState(0);
  const [runnerError, setRunnerError] = useState('');
  const [exportToast, setExportToast] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isExportingVideo, setIsExportingVideo] = useState(false);
  const [globalPan, setGlobalPan] = useState({ x: 0, y: 0 });
  const [sidePanelOpen, setSidePanelOpen] = useState(false);

  const isModern = !!(sim.init && sim.update);
  const engine = usePhysicsEngine(
    isModern ? sim : null,
    { ...params, panX: globalPan.x, panY: globalPan.y },
    canvasRef,
  );

  const controls = useMemo(() => sim.controls ?? [], [sim.controls]);
  const paramsRef = useRef(params);
  const readoutDataRef = useRef(readoutData);
  const controlsRef = useRef(controls);
  const speedRef = useRef(speed);

  useEffect(() => {
    paramsRef.current = params;
  }, [params]);
  useEffect(() => {
    readoutDataRef.current = readoutData;
  }, [readoutData]);
  useEffect(() => {
    controlsRef.current = controls;
  }, [controls]);
  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  // Collect graph data
  useEffect(() => {
    if (isModern) {
      if (engine.state) {
        const d = sim.getData ? sim.getData(engine.state, params) : engine.state;
        setReadoutData(d);
        setGraphData((prev) => {
          const next = [...prev, d];
          if (next.length > 500) next.shift(); // Higher resolution history
          return next;
        });
      }
    } else {
      let timer;
      if (running) {
        timer = setInterval(() => {
          if (!simRef.current || !simRef.current.getData) return;
          const d = simRef.current.getData();
          if (!d) return;
          setReadoutData(d);
          setGraphData((prev) => {
            const next = [...prev, d];
            if (next.length > 500) next.shift();
            return next;
          });
        }, 32); // Slightly faster polling
      }
      return () => clearInterval(timer);
    }
  }, [running, engine.state, isModern, sim, params]);

  useEffect(() => {
    if (!exportToast) return undefined;
    const timer = setTimeout(() => setExportToast(''), 6000);
    return () => clearTimeout(timer);
  }, [exportToast]);

  // Instantiate simulation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let resizeRaf = null;

    const destroyCurrent = () => {
      if (simRef.current) {
        simRef.current.destroy();
        simRef.current = null;
      }
    };

    const resizeCanvas = () => {
      const wrapper = canvas.parentElement;
      if (!wrapper) return false;
      const nextWidth = wrapper.offsetWidth;
      const nextHeight = wrapper.offsetHeight;
      if (canvas.width === nextWidth && canvas.height === nextHeight) return false;

      canvas.width = nextWidth;
      canvas.height = nextHeight;
      canvas.style.width = `${nextWidth}px`;
      canvas.style.height = `${nextHeight}px`;
      return true;
    };

    instantiate();

    function instantiate() {
      if (isModern) return;
      try {
        if (!resizeCanvas() && simRef.current) return;
        destroyCurrent();
        const instance = sim.create(canvas, params, {
          onParamChange: (newParams) => {
            setParams((prev) => ({ ...prev, ...newParams }));
          },
        });
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
    }

    function onResize() {
      if (resizeRaf !== null) cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(() => {
        resizeRaf = null;
        if (!resizeCanvas()) return;
        simRef.current?.setParams?.({});
      });
    }
    window.addEventListener('resize', onResize);
    return () => {
      if (resizeRaf !== null) cancelAnimationFrame(resizeRaf);
      window.removeEventListener('resize', onResize);
      destroyCurrent();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sim, reloadNonce]);

  // Push params to the live simulation instance
  useEffect(() => {
    if (!simRef.current) return;
    simRef.current.setParams?.({ ...params, panX: globalPan.x, panY: globalPan.y });
  }, [params, globalPan]);

  const togglePlay = useCallback(() => {
    if (isModern) {
      if (engine.running) engine.stop();
      else engine.start();
      setRunning(!engine.running);
      return;
    }
    const instance = simRef.current;
    if (!instance) return;
    if (runningRef.current) {
      instance.stop();
      runningRef.current = false;
      setRunning(false);
    } else {
      instance.start();
      runningRef.current = true;
      setRunning(true);
    }
  }, [isModern, engine]);

  const reset = useCallback(() => {
    setGlobalPan({ x: 0, y: 0 });
    if (isModern) {
      engine.reset();
      setRunning(true);
      setGraphData([]);
      setSpeed(1);
      engine.setSpeed(1);
      return;
    }
    simRef.current?.reset();
    runningRef.current = true;
    setRunning(true);
    setGraphData([]);
    setSpeed(1);
    if (simRef.current?.setSpeed) simRef.current.setSpeed(1);
  }, [isModern, engine]);

  const resetParams = useCallback(() => {
    setParams({ ...(sim.defaultParams ?? {}) });
  }, [sim.defaultParams]);

  const exportCSV = useCallback(() => {
    if (graphData.length === 0) {
      setExportToast('No data collected for export.');
      return;
    }
    const keys = Object.keys(graphData[0]);
    const header = keys.join(',');
    const rows = graphData.map((d) => keys.map((k) => d[k] ?? '').join(','));
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `simulation_export_${sim.id}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setExportToast('CSV export complete.');
  }, [graphData, sim.id]);

  const downloadGraphPlot = useCallback(
    ({ series, title, xLabel = 't [s]', yLabel, phaseSpace = false, filename }) => {
      if (graphData.length < 2) return false;
      const canvas = document.createElement('canvas');
      const ok = drawMakieGraph(canvas, {
        data: graphData,
        series,
        xKey: 'time',
        xLabel,
        yLabel,
        title,
        width: 1200,
        height: phaseSpace ? 1200 : 720,
        colormap: phaseSpace ? 'plasma' : 'viridis',
        phaseSpace,
        showLegend: !phaseSpace && series.length > 1,
        dpr: 2,
      });
      if (!ok) return false;
      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/png');
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return true;
    },
    [graphData],
  );

  const exportCurrentGraphPlot = useCallback(() => {
    const gp = sim.graphParams?.find((item) => item.key === graphKey);
    if (!gp) return;
    downloadGraphPlot({
      series: [{ key: gp.key, label: gp.label }],
      title: `${sim.title} Analysis - ${gp.label}`,
      yLabel: gp.label,
      filename: `${sim.id}_${gp.key}_plot.png`,
    });
  }, [downloadGraphPlot, graphKey, sim]);

  const clearRecordingFrameTimer = useCallback(() => {
    if (recordingFrameTimerRef.current) {
      clearInterval(recordingFrameTimerRef.current);
      recordingFrameTimerRef.current = null;
    }
  }, []);

  const drawRecordingFrame = useCallback(() => {
    drawExportOverlayFrame({
      targetCanvas: recordingCanvasRef.current,
      sourceCanvas: canvasRef.current,
      sim,
      controls: controlsRef.current,
      params: paramsRef.current,
      readoutData: readoutDataRef.current,
      speed: speedRef.current,
    });
  }, [sim]);

  const downloadBlob = useCallback((blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }, []);

  const startRecording = useCallback(() => {
    if (runnerError || isExportingVideo) return;
    const recordingCanvas = recordingCanvasRef.current;
    if (!recordingCanvas) return;
    if (typeof VideoEncoder === 'undefined' || typeof VideoFrame === 'undefined') {
      setExportToast('MP4 export requires a browser with WebCodecs support.');
      return;
    }

    drawRecordingFrame();

    let encoder;
    let muxer;
    let target;
    try {
      target = new ArrayBufferTarget();
      muxer = new Muxer({
        target,
        video: {
          codec: 'avc',
          width: EXPORT_VIDEO_WIDTH,
          height: EXPORT_VIDEO_HEIGHT,
          frameRate: EXPORT_VIDEO_FPS,
        },
        fastStart: 'in-memory',
        firstTimestampBehavior: 'offset',
      });

      encoder = new VideoEncoder({
        output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
        error: (error) => {
          console.error('Video export failed:', error);
        },
      });

      encoder.configure({
        codec: 'avc1.420028',
        width: EXPORT_VIDEO_WIDTH,
        height: EXPORT_VIDEO_HEIGHT,
        bitrate: EXPORT_VIDEO_BITRATE,
        framerate: EXPORT_VIDEO_FPS,
        avc: { format: 'avc' },
      });
    } catch (error) {
      console.error('Unable to start MP4 export:', error);
      setExportToast('This browser could not start the MP4 encoder.');
      try {
        encoder?.close();
      } catch {
        // Ignore encoder shutdown errors after failed initialization.
      }
      return;
    }

    recordingSessionRef.current = {
      encoder,
      muxer,
      target,
      frameIndex: 0,
      startedAt: Date.now(),
    };

    recordingFrameTimerRef.current = window.setInterval(() => {
      drawRecordingFrame();
      const session = recordingSessionRef.current;
      if (!session) return;
      const timestamp = Math.round((session.frameIndex * 1_000_000) / EXPORT_VIDEO_FPS);
      const frame = new VideoFrame(recordingCanvas, { timestamp });
      session.encoder.encode(frame, {
        keyFrame: session.frameIndex % EXPORT_VIDEO_FPS === 0,
      });
      frame.close();
      session.frameIndex += 1;
    }, 1000 / EXPORT_VIDEO_FPS);

    setIsRecording(true);
    setExportToast('Recording 1080p MP4...');
  }, [drawRecordingFrame, isExportingVideo, runnerError]);

  const stopRecording = useCallback(async () => {
    const session = recordingSessionRef.current;
    if (!session) return;

    clearRecordingFrameTimer();
    setIsRecording(false);
    setIsExportingVideo(true);
    setExportToast('Encoding MP4...');

    try {
      await session.encoder.flush();
      session.muxer.finalize();
      const blob = new Blob([session.target.buffer], { type: 'video/mp4' });
      downloadBlob(blob, `${sim.id}_recording_${session.startedAt}.mp4`);
      setExportToast('MP4 export complete.');
    } catch (error) {
      console.error('Unable to finalize MP4 export:', error);
      setExportToast('MP4 export failed.');
    } finally {
      session.encoder.close();
      recordingSessionRef.current = null;
      setIsExportingVideo(false);
    }
  }, [clearRecordingFrameTimer, downloadBlob, sim.id]);

  useEffect(() => {
    return () => {
      clearRecordingFrameTimer();
      const session = recordingSessionRef.current;
      if (!session) return;
      try {
        session.encoder.close();
      } catch {
        // Ignore encoder shutdown errors during unmount.
      }
      recordingSessionRef.current = null;
    };
  }, [clearRecordingFrameTimer]);

  const eqSections = useMemo(() => {
    return sim.equationSections || legacyToSections(sim.equations, sim.title);
  }, [sim]);

  const [showMobilePanel, setShowMobilePanel] = useState(false);
  const { showReadout, toggleReadout } = useSandboxStore();

  const openSidePanel = useCallback((tab) => {
    setSideTab(tab);
    setSidePanelOpen(true);
    setShowMobilePanel(true);
  }, []);

  const closeSidePanel = useCallback(() => {
    setSidePanelOpen(false);
    setShowMobilePanel(false);
  }, []);

  return (
    <div
      className={`sim-runner ${sidePanelOpen ? 'side-panel-open' : ''} ${
        showMobilePanel ? 'mobile-panel-open' : ''
      }`}
    >
      <div className="sim-main-area">
        <div className="sim-runner-top-bar">
          <button className="icon-btn" onClick={onBack} title="Return to lab">
            <ArrowLeft size={16} />
          </button>
          <div className="sim-title-block">
            <div className="sim-title">{sim.title}</div>
            <div className="sim-meta">
              <span className="method-badge rk45">{String(sim.method || 'RK4').toUpperCase()}</span>
              <span>Running model</span>
            </div>
          </div>

          <div className="sim-toolbar-group">
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
          </div>

          <div className="sim-panel-actions" aria-label="Simulation panels">
            <button
              className={`btn panel-action-btn ${sidePanelOpen && sideTab === 'controls' ? 'active' : ''}`}
              onClick={() => openSidePanel('controls')}
            >
              <Sliders size={14} /> Params
            </button>
            <button
              className={`btn panel-action-btn ${sidePanelOpen && sideTab === 'graph' ? 'active' : ''}`}
              onClick={() => openSidePanel('graph')}
            >
              <LineChartIcon size={14} /> Data
            </button>
            <button
              className={`btn panel-action-btn ${sidePanelOpen && sideTab === 'equations' ? 'active' : ''}`}
              onClick={() => openSidePanel('equations')}
            >
              <BookOpen size={14} /> Theory
            </button>
          </div>

          <div className="export-actions hide-mobile">
            <button className="btn-export" onClick={exportCSV}>
              <Download size={12} /> CSV
            </button>
            <button
              className={`btn-export ${isRecording ? 'active' : ''}`}
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isExportingVideo}
            >
              {isRecording ? <Square size={11} /> : <Video size={12} />}{' '}
              {isRecording ? 'Stop' : isExportingVideo ? 'Encoding...' : 'Record MP4'}
            </button>
          </div>

          <div className="sim-toolbar-group sim-speed-control hide-mobile">
            <Gauge size={14} />
            <select
              className="form-input speed-select"
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
            >
              <option value={0.25}>0.25x</option>
              <option value={0.5}>0.5x</option>
              <option value={1}>1.00x</option>
              <option value={2}>2.00x</option>
            </select>
          </div>

          <div className="sim-toolbar-group sim-display-toggle hide-mobile">
            <span
              style={{
                fontSize: '11px',
                fontWeight: '600',
                color: 'var(--text-sub)',
                marginRight: '8px',
              }}
            >
              HUD
            </span>
            <div
              className={`toggle-switch ${showReadout ? 'active' : ''}`}
              onClick={toggleReadout}
              title="Toggle HUD Readout"
              style={{ cursor: 'pointer' }}
            >
              <div className="toggle-handle" />
            </div>
          </div>
        </div>

        <div className="sim-canvas-wrapper">
          <canvas ref={canvasRef} className="sim-runner-canvas" style={{ touchAction: 'none' }} />
          <canvas ref={recordingCanvasRef} style={{ display: 'none' }} />
          {showReadout && <DataReadout data={readoutData} method={sim.method || 'rk4'} />}

          {runnerError && (
            <div className="sim-error-overlay">
              <div className="sim-error-card">
                <div className="sim-error-title">Simulation error</div>
                <div className="sim-error-msg">{runnerError}</div>
                <button className="btn" onClick={() => setReloadNonce((n) => n + 1)}>
                  Restart simulation
                </button>
              </div>
            </div>
          )}
        </div>

        {exportToast && <div className="sim-toast">{exportToast}</div>}
      </div>

      <div className="sim-side-panel" aria-hidden={!sidePanelOpen}>
        <div className="sim-side-panel-header">
          <span className="sim-side-panel-title">
            {sideTab === 'controls' ? 'Parameters' : sideTab === 'graph' ? 'Data' : 'Theory'}
          </span>
          <button className="icon-btn" onClick={closeSidePanel} title="Close panel">
            <X size={16} />
          </button>
        </div>
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
            <LineChartIcon size={13} /> Data
          </button>
          <button
            className={`sim-side-tab ${sideTab === 'equations' ? 'active' : ''}`}
            onClick={() => setSideTab('equations')}
          >
            <BookOpen size={13} /> Theory
          </button>
        </div>

        <div className="sim-side-content custom-scroll">
          {sideTab === 'controls' && (
            <div className="side-pane">
              <div className="side-pane-header">
                <span className="side-pane-title">Parameters</span>
                <button className="btn" onClick={resetParams}>
                  Reset
                </button>
              </div>
              {controls.map((control) => (
                <ParamControl
                  key={control.key}
                  control={control}
                  value={params[control.key]}
                  onChange={(value) => setParams((prev) => ({ ...prev, [control.key]: value }))}
                />
              ))}
              <div className="sim-description">{sim.description}</div>
            </div>
          )}

          {sideTab === 'graph' && (
            <div className="side-pane">
              <select
                className="form-input"
                value={graphKey}
                onChange={(e) => setGraphKey(e.target.value)}
              >
                {sim.graphParams?.map((gp) => (
                  <option key={gp.key} value={gp.key}>
                    {gp.label}
                  </option>
                ))}
              </select>
              <MakieGraph
                data={graphData}
                series={[{ key: graphKey, label: graphKey }]}
                xKey="time"
                height={240}
              />
              <button className="btn" onClick={exportCurrentGraphPlot}>
                <Download size={14} /> Download plot
              </button>
            </div>
          )}

          {sideTab === 'equations' && <TheoryChalkboard sections={eqSections} title={sim.title} />}
        </div>
      </div>

      {!sidePanelOpen && (
        <div className="sim-mobile-dock" aria-label="Simulation quick actions">
          <button className="icon-btn" onClick={() => openSidePanel('graph')} title="Open data">
            <LineChartIcon size={17} />
          </button>
          <button
            className="icon-btn"
            onClick={() => openSidePanel('equations')}
            title="Open theory"
          >
            <BookOpen size={17} />
          </button>
          <button
            className={`icon-btn ${showReadout ? 'active' : ''}`}
            onClick={toggleReadout}
            title="Toggle HUD"
          >
            <Gauge size={17} />
          </button>
        </div>
      )}
    </div>
  );
}
