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
  Crosshair,
  Gauge,
  FlaskConical,
  Layers,
  Video,
  Square,
} from 'lucide-react';
import MakieGraph, { drawMakieGraph } from './MakieGraph';
import DataReadout from './DataReadout';
import TheoryChalkboard, { legacyToSections } from './TheoryChalkboard';
import GuidedExperiment from './GuidedExperiment';
import { inferControlTooltip } from '../constants/physicsTooltips';
import { usePhysicsEngine } from '../hooks/usePhysicsEngine';

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
            min={control.min}
            max={control.max}
            step={step}
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
          min={control.min}
          max={control.max}
          step={step}
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

function TileControl({ control, value, onChange }) {
  const tiles = control.tiles ?? [];
  return (
    <div className="form-group">
      <label>
        <span>{control.label}</span>
      </label>
      <div className="tile-grid">
        {tiles.map((tile) => (
          <button
            key={tile.value}
            className={`tile-btn${value === tile.value ? ' active' : ''}`}
            onClick={() => onChange(tile.value)}
            title={tile.sub || tile.label}
            style={tile.color ? { '--tile-accent': tile.color } : undefined}
          >
            {tile.color && <span className="tile-swatch" style={{ background: tile.color }} />}
            <span className="tile-label">{tile.label}</span>
            {tile.sub && <span className="tile-sub">{tile.sub}</span>}
          </button>
        ))}
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
  const width = 1280;
  const height = 720;
  const panelWidth = 360;
  const simWidth = width - panelWidth;
  targetCanvas.width = width;
  targetCanvas.height = height;

  ctx.fillStyle = '#070b10';
  ctx.fillRect(0, 0, width, height);

  const srcW = sourceCanvas.width || sourceCanvas.clientWidth || simWidth;
  const srcH = sourceCanvas.height || sourceCanvas.clientHeight || height;
  const scale = Math.min(simWidth / srcW, height / srcH);
  const drawW = srcW * scale;
  const drawH = srcH * scale;
  const dx = (simWidth - drawW) / 2;
  const dy = (height - drawH) / 2;
  ctx.drawImage(sourceCanvas, dx, dy, drawW, drawH);

  const panelX = simWidth;
  ctx.fillStyle = 'rgba(8, 13, 20, 0.96)';
  ctx.fillRect(panelX, 0, panelWidth, height);
  const grad = ctx.createLinearGradient(panelX, 0, width, height);
  grad.addColorStop(0, 'rgba(79, 195, 247, 0.08)');
  grad.addColorStop(1, 'rgba(251, 113, 133, 0.06)');
  ctx.fillStyle = grad;
  ctx.fillRect(panelX, 0, panelWidth, height);
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.beginPath();
  ctx.moveTo(panelX + 0.5, 0);
  ctx.lineTo(panelX + 0.5, height);
  ctx.stroke();

  const x = panelX + 28;
  let y = 42;
  ctx.fillStyle = '#E6EDF3';
  ctx.font = '700 24px Inter, system-ui, sans-serif';
  ctx.fillText(sim.title, x, y);
  y += 26;
  ctx.fillStyle = 'rgba(230,237,243,0.58)';
  ctx.font = '600 12px JetBrains Mono, monospace';
  ctx.fillText(`METHOD ${String(sim.method || 'rk4').toUpperCase()}   SPEED ${speed}x`, x, y);

  const section = (label) => {
    y += 38;
    ctx.fillStyle = '#81D4FA';
    ctx.font = '800 12px Inter, system-ui, sans-serif';
    ctx.fillText(label.toUpperCase(), x, y);
    y += 14;
    ctx.strokeStyle = 'rgba(129,212,250,0.22)';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(width - 28, y);
    ctx.stroke();
    y += 18;
  };

  const row = (label, value, color = '#E6EDF3') => {
    if (y > height - 38) return;
    ctx.fillStyle = 'rgba(230,237,243,0.62)';
    ctx.font = '500 13px Inter, system-ui, sans-serif';
    ctx.fillText(label, x, y);
    ctx.fillStyle = color;
    ctx.font = '700 13px JetBrains Mono, monospace';
    ctx.textAlign = 'right';
    ctx.fillText(formatOverlayValue(value), width - 28, y);
    ctx.textAlign = 'left';
    y += 22;
  };

  section('Parameters');
  const visibleControls = controls.length
    ? controls
    : Object.keys(params).map((key) => ({ key, label: key }));
  visibleControls.slice(0, 12).forEach((control) => {
    row(control.label || control.key, params[control.key]);
  });

  section('Stats');
  const entries = readoutData
    ? Object.entries(readoutData).filter(
        ([, value]) => typeof value === 'number' && Number.isFinite(value),
      )
    : [];
  entries.slice(0, 12).forEach(([key, value]) => {
    row(key, value, key.toLowerCase().includes('error') ? '#FFD166' : '#7dd3a8');
  });
}

export default function SimulationRunner({ sim, onBack }) {
  const canvasRef = useRef(null);
  const simRef = useRef(null);
  const runningRef = useRef(false);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const recordingStartedAtRef = useRef(0);
  const recordingFrameTimerRef = useRef(null);
  const recordingCanvasRef = useRef(null);

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
  const [globalPan, setGlobalPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const lastPanPosRef = useRef({ x: 0, y: 0 });

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
          if (next.length > 300) next.shift();
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
            if (next.length > 300) next.shift();
            return next;
          });
        }, 40);
      }
      return () => clearInterval(timer);
    }
  }, [running, engine.state, isModern, sim, params]);

  useEffect(() => {
    if (!exportToast) return undefined;
    const timer = setTimeout(() => setExportToast(''), 6000);
    return () => clearTimeout(timer);
  }, [exportToast]);

  // Instantiate simulation — only re-create when `sim` identity or reloadNonce changes
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
      return true;
    };

    const instantiate = () => {
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
    };

    instantiate();

    function onResize() {
      if (resizeRaf !== null) cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(() => {
        resizeRaf = null;
        if (!resizeCanvas()) return;
        // Canvas resize clears pixels; ask paused simulations to redraw without resetting state.
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

  // Push params to the live simulation instance and restart with new values
  const prevParamsRef = useRef(params);
  useEffect(() => {
    if (!simRef.current) return;
    const paramsChanged = prevParamsRef.current !== params;
    prevParamsRef.current = params;

    // Always sync params (including pan offsets)
    simRef.current.setParams?.({ ...params, panX: globalPan.x, panY: globalPan.y });

    // Auto-restart simulation when user tweaks sliders (but not on pan-only changes)
    if (paramsChanged && simRef.current.reset) {
      simRef.current.reset();
      runningRef.current = true;
      setRunning(true);
    }
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
  }, [isModern, engine, running]);

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
      setExportToast('No data yet. Press Play for a few seconds, then export again.');
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
    a.download = `${sim.id}_data.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setExportToast('Exported. Open in Sheets or Excel and plot velocity vs time to compare runs.');
  }, [graphData, sim.id]);

  const downloadGraphPlot = useCallback(
    ({ series, title, xLabel = 't [s]', yLabel, phaseSpace = false, filename }) => {
      if (graphData.length < 2) {
        setExportToast('No graph data yet. Press Play for a few seconds, then export again.');
        return false;
      }
      const canvas = document.createElement('canvas');
      const ok = drawMakieGraph(canvas, {
        data: graphData,
        series,
        xKey: 'time',
        xLabel,
        yLabel,
        title,
        width: 960,
        height: phaseSpace ? 960 : 600,
        colormap: phaseSpace ? 'plasma' : 'viridis',
        phaseSpace,
        showLegend: !phaseSpace && series.length > 1,
        dpr: 2,
      });
      if (!ok) {
        setExportToast('Could not render that graph from the current data.');
        return false;
      }
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
    const ok = downloadGraphPlot({
      series: [{ key: gp.key, label: gp.label }],
      title: `${sim.title} - ${gp.label}`,
      yLabel: gp.label,
      filename: `${sim.id}_${gp.key}_plot.png`,
    });
    if (ok) setExportToast('Graph plot downloaded.');
  }, [downloadGraphPlot, graphKey, sim]);

  const exportAllGraphPlots = useCallback(() => {
    const plots = sim.graphParams ?? [];
    if (!plots.length) return;
    let count = 0;
    plots.forEach((gp) => {
      if (
        downloadGraphPlot({
          series: [{ key: gp.key, label: gp.label }],
          title: `${sim.title} - ${gp.label}`,
          yLabel: gp.label,
          filename: `${sim.id}_${gp.key}_plot.png`,
        })
      ) {
        count += 1;
      }
    });
    if (count > 0) setExportToast(`Downloaded ${count} graph plot${count === 1 ? '' : 's'}.`);
  }, [downloadGraphPlot, sim]);

  const clearRecordingFrameTimer = useCallback(() => {
    if (recordingFrameTimerRef.current !== null) {
      window.clearInterval(recordingFrameTimerRef.current);
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
      readoutData: readoutDataRef.current || simRef.current?.getData?.(),
      speed: speedRef.current,
    });
  }, [sim]);

  const stopRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;
    if (recorder.state === 'inactive') return;
    drawRecordingFrame();
    const [videoTrack] = recorder.stream?.getVideoTracks?.() ?? [];
    videoTrack?.requestFrame?.();
    recorder.requestData?.();
    setExportToast('Finalizing video...');
    window.setTimeout(() => {
      if (recorder.state !== 'inactive') recorder.stop();
    }, 80);
  }, [drawRecordingFrame]);

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

    const recordingCanvas = recordingCanvasRef.current;
    if (!recordingCanvas || typeof recordingCanvas.captureStream !== 'function') {
      setExportToast('Composited video export is not supported in this browser.');
      return;
    }

    drawRecordingFrame();
    const stream = recordingCanvas.captureStream(30);
    const cleanupStream = () => {
      stream.getTracks().forEach((track) => track.stop());
    };

    let audioCtx = null;
    try {
      const AudioCtxConstructor = window.AudioContext || window.webkitAudioContext;
      if (AudioCtxConstructor) {
        audioCtx = new AudioCtxConstructor();
        if (audioCtx.state === 'suspended') {
          audioCtx.resume().catch(() => {});
        }
        const dest = audioCtx.createMediaStreamDestination();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        gain.gain.value = 0;
        osc.connect(gain);
        gain.connect(dest);
        osc.start();
        const dummyTrack = dest.stream.getAudioTracks()[0];
        if (dummyTrack) stream.addTrack(dummyTrack);
      }
    } catch (err) {
      audioCtx = null;
      console.warn('Video export continuing without silent audio track:', err);
    }

    const preferredTypes = ['video/webm', 'video/mp4'];
    const mimeType = preferredTypes.find((type) => MediaRecorder.isTypeSupported(type));
    const options = mimeType
      ? { mimeType, videoBitsPerSecond: 3000000 }
      : { videoBitsPerSecond: 3000000 };

    let recorder;
    try {
      recorder = new MediaRecorder(stream, options);
    } catch (err) {
      cleanupStream();
      audioCtx?.close?.().catch(() => {});
      setExportToast('Could not start video recording in this browser.');
      console.warn('MediaRecorder initialization failed:', err);
      return;
    }

    recordedChunksRef.current = [];
    recordingStartedAtRef.current = Date.now();

    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) recordedChunksRef.current.push(event.data);
    };

    recorder.onerror = () => {
      setExportToast('Recording failed. Please try again.');
      setIsRecording(false);
      clearRecordingFrameTimer();
      mediaRecorderRef.current = null;
      cleanupStream();
      audioCtx?.close?.().catch(() => {});
    };

    recorder.onstop = () => {
      clearRecordingFrameTimer();
      cleanupStream();
      audioCtx?.close?.().catch(() => {});
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
      const extension = blobType.includes('mp4') ? 'mp4' : 'webm';
      const filename = `${sim.id}_${timestamp}.${extension}`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setExportToast(
        `Video exported (${formatClock((Date.now() - recordingStartedAtRef.current) / 1000)}).`,
      );
    };

    if (!runningRef.current && simRef.current) {
      simRef.current.start?.();
      runningRef.current = true;
      setRunning(true);
    }

    const [videoTrack] = stream.getVideoTracks();
    recordingFrameTimerRef.current = window.setInterval(() => {
      drawRecordingFrame();
      videoTrack?.requestFrame?.();
    }, 1000 / 30);

    try {
      // Using a timeslice gives WebM its cluster timestamps so it properly plays with a correct duration format.
      recorder.start(100);
      mediaRecorderRef.current = recorder;
    } catch (err) {
      clearRecordingFrameTimer();
      cleanupStream();
      audioCtx?.close?.().catch(() => {});
      setExportToast('Could not start video recording in this browser.');
      console.warn('MediaRecorder start failed:', err);
      return;
    }

    setIsRecording(true);
    setExportToast('Recording started. Press Stop Video when you are done.');
  }, [clearRecordingFrameTimer, drawRecordingFrame, runnerError, sim.id]);

  // Apply scenario preset
  const applyScenario = useCallback((scenario) => {
    if (scenario.params) {
      setParams((prev) => ({ ...prev, ...scenario.params }));
    }
    if (scenario.setup && simRef.current) {
      scenario.setup(simRef.current);
    }
  }, []);

  // Apply params from guided experiment step (no auto-play)
  const handleGuideApplyParams = useCallback((stepParams) => {
    setParams((prev) => ({ ...prev, ...stepParams }));
  }, []);

  useEffect(() => {
    return () => {
      const recorder = mediaRecorderRef.current;
      if (recorder && recorder.state !== 'inactive') recorder.stop();
      clearRecordingFrameTimer();
    };
  }, [clearRecordingFrameTimer]);

  useEffect(() => {
    return () => {
      const recorder = mediaRecorderRef.current;
      if (recorder && recorder.state !== 'inactive') recorder.stop();
    };
  }, [sim.id]);

  // Build graph series from graphParams
  const graphSeries = useMemo(() => {
    if (!sim.graphParams) return [];
    if (sideTab === 'phase' && sim.graphParams.length >= 2) {
      return sim.graphParams.slice(0, 2).map((gp) => ({ key: gp.key, label: gp.label }));
    }
    if (graphKey) {
      return [
        {
          key: graphKey,
          label: sim.graphParams.find((gp) => gp.key === graphKey)?.label || graphKey,
        },
      ];
    }
    return [];
  }, [sim.graphParams, graphKey, sideTab]);

  const exportPhasePlot = useCallback(() => {
    if (graphSeries.length < 2) return;
    const ok = downloadGraphPlot({
      series: graphSeries,
      title: `${sim.title} - ${graphSeries[0].label} vs ${graphSeries[1].label}`,
      xLabel: graphSeries[0].label,
      yLabel: graphSeries[1].label,
      phaseSpace: true,
      filename: `${sim.id}_phase_plot.png`,
    });
    if (ok) setExportToast('Phase plot downloaded.');
  }, [downloadGraphPlot, graphSeries, sim]);

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
        <div className="sim-runner-top-bar">
          <button className="icon-btn" onClick={onBack} title="Back">
            <ArrowLeft size={16} />
          </button>
          <div style={{ flex: 1, minWidth: 120 }}>
            <div
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 15,
                fontWeight: 600,
                color: 'var(--text)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {sim.title}
            </div>
            <div
              style={{
                fontSize: 11,
                color: 'var(--text-muted)',
                marginTop: 2,
                display: 'flex',
                gap: 6,
                alignItems: 'center',
              }}
            >
              {sim.method && (
                <span
                  className={`method-badge ${sim.method === 'rk45' ? 'rk45' : sim.method === 'yoshida4' ? 'symplectic' : sim.method === 'fdm' ? 'fdm' : 'rk45'}`}
                >
                  {sim.method === 'rk45'
                    ? 'RK45'
                    : sim.method === 'yoshida4'
                      ? 'Yoshida⁴'
                      : sim.method === 'fdm'
                        ? 'FDM'
                        : 'RK4'}
                </span>
              )}
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
              title={isRecording ? 'Stop video recording' : 'Start video recording'}
            >
              {isRecording ? <Square size={11} /> : <Video size={12} />}
              {isRecording ? 'Stop' : 'Video'}
            </button>
          </div>
          {/* Speed control */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginLeft: 2 }}>
            <Gauge
              size={13}
              style={{
                color: speed !== 1 ? '#FFD166' : 'var(--text-muted)',
                transition: 'color 0.2s',
              }}
            />
            <select
              className={`speed-select${speed !== 1 ? ' active' : ''}`}
              value={speed}
              onChange={(e) => {
                const s = Number(e.target.value);
                setSpeed(s);
                if (simRef.current?.setSpeed) simRef.current.setSpeed(s);
              }}
            >
              <option value={0.25}>0.25x</option>
              <option value={0.5}>0.5x</option>
              <option value={1}>1x</option>
              <option value={2}>2x</option>
            </select>
          </div>
        </div>

        {/* Canvas with figure frame */}
        <div
          className="sim-canvas-wrapper"
          onPointerDown={(e) => {
            if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
              e.preventDefault();
              setIsPanning(true);
              lastPanPosRef.current = { x: e.clientX, y: e.clientY };
            }
          }}
          onPointerMove={(e) => {
            if (isPanning) {
              const dx = e.clientX - lastPanPosRef.current.x;
              const dy = e.clientY - lastPanPosRef.current.y;
              setGlobalPan((p) => ({ x: p.x + dx, y: p.y + dy }));
              lastPanPosRef.current = { x: e.clientX, y: e.clientY };
            }
          }}
          onPointerUp={() => setIsPanning(false)}
          onPointerLeave={() => setIsPanning(false)}
          style={{ cursor: isPanning ? 'grabbing' : undefined }}
        >
          <canvas ref={canvasRef} className="sim-runner-canvas" style={{ touchAction: 'none' }} />
          <canvas ref={recordingCanvasRef} className="recording-export-canvas" aria-hidden="true" />
          {runnerError && (
            <div className="sim-runner-error">
              <div className="sim-runner-error-title">Simulation paused</div>
              <div className="sim-runner-error-msg">{runnerError}</div>
              <button className="btn" onClick={() => setReloadNonce((n) => n + 1)}>
                Retry
              </button>
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
            title="Theory Chalkboard"
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
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 14,
                }}
              >
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em',
                    color: 'var(--text-muted)',
                  }}
                >
                  Parameters
                </span>
                <button
                  className="btn"
                  style={{ padding: '3px 8px', fontSize: 10 }}
                  onClick={resetParams}
                >
                  Defaults
                </button>
              </div>
              {controls.length > 0 ? (
                <div className="property-section" style={{ paddingTop: 0, borderBottom: 'none' }}>
                  {controls.map((control) => {
                    const handleChange = (next) => {
                      setParams((prev) => {
                        const updated = { ...prev, [control.key]: next };
                        // Sync linked angle controls (rad ↔ deg)
                        if (control.key === 'theta0' && 'theta0Deg' in prev) {
                          updated.theta0Deg = parseFloat(((next * 180) / Math.PI).toFixed(1));
                        } else if (control.key === 'theta0Deg' && 'theta0' in prev) {
                          updated.theta0 = parseFloat(((next * Math.PI) / 180).toFixed(4));
                        }
                        return updated;
                      });
                    };
                    return control.type === 'tiles' ? (
                      <TileControl
                        key={control.key}
                        control={control}
                        value={params[control.key] ?? 0}
                        onChange={handleChange}
                      />
                    ) : (
                      <ParamControl
                        key={control.key}
                        control={control}
                        value={params[control.key] ?? control.min ?? 0}
                        onChange={handleChange}
                      />
                    );
                  })}
                </div>
              ) : (
                <div className="empty-state">
                  <p>No runtime parameters available.</p>
                </div>
              )}
              {/* Sim description */}
              <div
                style={{
                  marginTop: 16,
                  padding: '12px 14px',
                  background: 'rgba(0,0,0,0.2)',
                  borderRadius: 'var(--r-sm)',
                  border: '1px solid rgba(255,255,255,0.04)',
                }}
              >
                <p
                  style={{
                    fontSize: 12,
                    color: 'var(--text-sub)',
                    lineHeight: 1.6,
                    fontFamily: 'var(--font-serif)',
                  }}
                >
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
                  {sim.graphParams.map((gp) => (
                    <option key={gp.key} value={gp.key}>
                      {gp.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="graph-export-actions">
                <button
                  className="btn-export"
                  onClick={exportCurrentGraphPlot}
                  title="Download selected plot"
                >
                  <Download size={12} /> Plot PNG
                </button>
                <button
                  className="btn-export"
                  onClick={exportAllGraphPlots}
                  title="Download one plot for each graph variable"
                >
                  <Download size={12} /> All Plots
                </button>
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
                <div
                  style={{
                    marginTop: 8,
                    padding: '8px 10px',
                    background: 'rgba(0,0,0,0.2)',
                    borderRadius: 6,
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    color: 'var(--text-sub)',
                  }}
                >
                  Current: {(graphData[graphData.length - 1][graphKey] ?? 0).toFixed(6)}
                </div>
              )}
            </div>
          )}

          {/* ── Phase space tab ──────────────────────────────── */}
          {sideTab === 'phase' && sim.graphParams?.length >= 2 && (
            <div style={{ padding: '14px 12px' }}>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  color: 'var(--text-muted)',
                  marginBottom: 8,
                }}
              >
                Phase Space Plot
              </div>
              <div className="graph-export-actions">
                <button
                  className="btn-export"
                  onClick={exportPhasePlot}
                  title="Download phase plot"
                >
                  <Download size={12} /> Phase PNG
                </button>
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
            <div className="panel-content custom-scroll" style={{ padding: 0 }}>
              <TheoryChalkboard sections={eqSections} title={sim.title} />
            </div>
          )}

          {/* ── Guide tab (Scenarios + Guided Experiments) ──── */}
          {sideTab === 'guide' && (
            <div
              style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}
            >
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
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.12em',
                      color: 'var(--accent)',
                      marginBottom: 10,
                    }}
                  >
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
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.12em',
                      color: 'var(--sci-green)',
                      marginBottom: 10,
                    }}
                  >
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
                        <FlaskConical
                          size={14}
                          style={{ color: 'var(--sci-green)', flexShrink: 0 }}
                        />
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
