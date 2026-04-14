import { useRef, useEffect, useCallback, useState } from 'react';
import { sampleColormap, colormapPalette } from '../utils/colormaps';

/**
 * MakieGraph — Publication-quality canvas graph component
 * Aesthetics inspired by Makie.jl's CairoMakie backend.
 *
 * Props:
 *   data        — [{time, ...values}]  array of data points
 *   series      — [{key, label, color?}]  which keys to plot
 *   xKey        — key for x-axis (default 'time')
 *   xLabel      — x-axis label with units e.g. "t [s]"
 *   yLabel      — y-axis label with units
 *   title       — figure title (rendered in serif)
 *   width       — canvas width in px
 *   height      — canvas height in px
 *   colormap    — colormap name for auto-coloring series
 *   phaseSpace  — if true, plot series[0].key vs series[1].key (x vs y)
 *   showLegend  — show legend box
 *   showMinorGrid — show minor gridlines
 */
export default function MakieGraph({
  data = [],
  series = [],
  xKey = 'time',
  xLabel = 't [s]',
  yLabel = '',
  title = '',
  width = 500,
  height = 300,
  colormap = 'viridis',
  phaseSpace = false,
  showLegend = true,
  showMinorGrid = true,
}) {
  const canvasRef = useRef(null);
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // Color palette for series
  const colors = series.length > 0
    ? series.map((s, i) => s.color || colormapPalette(colormap, series.length)[i])
    : [];

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length < 2) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    // Layout margins (Makie-style: generous for labels)
    const ml = 65, mr = 20, mt = title ? 42 : 22, mb = 50;
    const pw = width - ml - mr;
    const ph = height - mt - mb;

    // Background
    ctx.fillStyle = '#0B0F14';
    ctx.fillRect(0, 0, width, height);

    // Compute data ranges
    let xMin, xMax, yMin, yMax;

    if (phaseSpace && series.length >= 2) {
      const xs = data.map(d => d[series[0].key]).filter(Number.isFinite);
      const ys = data.map(d => d[series[1].key]).filter(Number.isFinite);
      if (xs.length === 0 || ys.length === 0) return;
      xMin = Math.min(...xs); xMax = Math.max(...xs);
      yMin = Math.min(...ys); yMax = Math.max(...ys);
    } else {
      const xs = data.map(d => d[xKey]).filter(Number.isFinite);
      if (xs.length === 0) return;
      xMin = Math.min(...xs); xMax = Math.max(...xs);
      yMin = Infinity; yMax = -Infinity;
      for (const s of series) {
        for (const d of data) {
          const v = d[s.key];
          if (Number.isFinite(v)) {
            if (v < yMin) yMin = v;
            if (v > yMax) yMax = v;
          }
        }
      }
    }

    if (yMin === yMax) { yMin -= 1; yMax += 1; }
    if (xMin === xMax) { xMin -= 1; xMax += 1; }

    // Add 5% padding
    const xPad = (xMax - xMin) * 0.05;
    const yPad = (yMax - yMin) * 0.08;
    xMin -= xPad; xMax += xPad;
    yMin -= yPad; yMax += yPad;

    // Coordinate mapping
    const toX = v => ml + (v - xMin) / (xMax - xMin) * pw;
    const toY = v => mt + ph - (v - yMin) / (yMax - yMin) * ph;

    // ── Grid lines ──────────────────────────────────────────
    const niceInterval = (range, targetTicks) => {
      const rough = range / targetTicks;
      const mag = Math.pow(10, Math.floor(Math.log10(rough)));
      const norm = rough / mag;
      let nice;
      if (norm <= 1.5) nice = 1;
      else if (norm <= 3.5) nice = 2;
      else if (norm <= 7.5) nice = 5;
      else nice = 10;
      return nice * mag;
    };

    const xInterval = niceInterval(xMax - xMin, 6);
    const yInterval = niceInterval(yMax - yMin, 5);
    const xStart = Math.ceil(xMin / xInterval) * xInterval;
    const yStart = Math.ceil(yMin / yInterval) * yInterval;

    // Minor grid
    if (showMinorGrid) {
      ctx.strokeStyle = 'rgba(255,255,255,0.025)';
      ctx.lineWidth = 0.5;
      const xMinor = xInterval / 5;
      for (let v = Math.ceil(xMin / xMinor) * xMinor; v <= xMax; v += xMinor) {
        const x = toX(v);
        ctx.beginPath(); ctx.moveTo(x, mt); ctx.lineTo(x, mt + ph); ctx.stroke();
      }
      const yMinor = yInterval / 5;
      for (let v = Math.ceil(yMin / yMinor) * yMinor; v <= yMax; v += yMinor) {
        const y = toY(v);
        ctx.beginPath(); ctx.moveTo(ml, y); ctx.lineTo(ml + pw, y); ctx.stroke();
      }
    }

    // Major grid
    ctx.strokeStyle = '#2A3441';
    ctx.lineWidth = 0.5;
    for (let v = xStart; v <= xMax; v += xInterval) {
      const x = toX(v);
      ctx.beginPath(); ctx.moveTo(x, mt); ctx.lineTo(x, mt + ph); ctx.stroke();
    }
    for (let v = yStart; v <= yMax; v += yInterval) {
      const y = toY(v);
      ctx.beginPath(); ctx.moveTo(ml, y); ctx.lineTo(ml + pw, y); ctx.stroke();
    }

    // ── Axes ────────────────────────────────────────────────
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 1;
    // Bottom axis
    ctx.beginPath(); ctx.moveTo(ml, mt + ph); ctx.lineTo(ml + pw, mt + ph); ctx.stroke();
    // Left axis
    ctx.beginPath(); ctx.moveTo(ml, mt); ctx.lineTo(ml, mt + ph); ctx.stroke();

    // ── Tick marks (outside, Makie-style) ───────────────────
    const tickLen = 5;
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = 1;

    // Format a number for axis display  
    const formatTick = (v) => {
      if (Math.abs(v) >= 10000 || (Math.abs(v) < 0.01 && v !== 0)) {
        return v.toExponential(1);
      }
      if (Math.abs(v) < 0.001) return '0';
      const s = v.toPrecision(3);
      return parseFloat(s).toString();
    };

    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.textBaseline = 'top';
    ctx.textAlign = 'center';

    for (let v = xStart; v <= xMax; v += xInterval) {
      const x = toX(v);
      ctx.beginPath(); ctx.moveTo(x, mt + ph); ctx.lineTo(x, mt + ph + tickLen); ctx.stroke();
      ctx.fillText(formatTick(v), x, mt + ph + tickLen + 3);
    }

    ctx.textBaseline = 'middle';
    ctx.textAlign = 'right';

    for (let v = yStart; v <= yMax; v += yInterval) {
      const y = toY(v);
      ctx.beginPath(); ctx.moveTo(ml, y); ctx.lineTo(ml - tickLen, y); ctx.stroke();
      ctx.fillText(formatTick(v), ml - tickLen - 4, y);
    }

    // ── Axis labels ─────────────────────────────────────────
    ctx.font = '12px "Source Serif 4", "Crimson Pro", serif';
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    // X label
    const effectiveXLabel = phaseSpace && series.length >= 2 ? series[0].label : xLabel;
    ctx.fillText(effectiveXLabel, ml + pw / 2, height - 18);

    // Y label (rotated)
    const effectiveYLabel = phaseSpace && series.length >= 2 ? series[1].label : yLabel;
    if (effectiveYLabel) {
      ctx.save();
      ctx.translate(14, mt + ph / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(effectiveYLabel, 0, 0);
      ctx.restore();
    }

    // ── Title ───────────────────────────────────────────────
    if (title) {
      ctx.font = '14px "Source Serif 4", "Crimson Pro", serif';
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(title, ml + pw / 2, 10);
    }

    // ── Plot area clip ──────────────────────────────────────
    ctx.save();
    ctx.beginPath();
    ctx.rect(ml, mt, pw, ph);
    ctx.clip();

    // ── Data lines ──────────────────────────────────────────
    if (phaseSpace && series.length >= 2) {
      // Phase space: plot series[0] vs series[1]
      ctx.beginPath();
      let started = false;
      for (let i = 0; i < data.length; i++) {
        const xv = data[i][series[0].key];
        const yv = data[i][series[1].key];
        if (!Number.isFinite(xv) || !Number.isFinite(yv)) continue;
        const sx = toX(xv);
        const sy = toY(yv);
        if (!started) { ctx.moveTo(sx, sy); started = true; }
        else ctx.lineTo(sx, sy);
      }
      // Color gradient along trail
      ctx.strokeStyle = colors[0] || '#81D4FA';
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = 0.85;
      ctx.stroke();
      ctx.globalAlpha = 1;

      // Optional: color by time
      if (data.length > 10) {
        for (let i = 1; i < data.length; i++) {
          const xv0 = data[i-1][series[0].key], yv0 = data[i-1][series[1].key];
          const xv1 = data[i][series[0].key],   yv1 = data[i][series[1].key];
          if (!Number.isFinite(xv0) || !Number.isFinite(yv0) ||
              !Number.isFinite(xv1) || !Number.isFinite(yv1)) continue;
          const t = i / data.length;
          const [r, g, b] = sampleColormap(colormap, t);
          ctx.beginPath();
          ctx.moveTo(toX(xv0), toY(yv0));
          ctx.lineTo(toX(xv1), toY(yv1));
          ctx.strokeStyle = `rgba(${r},${g},${b},${0.3 + t * 0.7})`;
          ctx.lineWidth = 1 + t * 1.5;
          ctx.stroke();
        }
      }
    } else {
      // Time series
      for (let si = 0; si < series.length; si++) {
        const s = series[si];
        ctx.beginPath();
        let started = false;
        for (let i = 0; i < data.length; i++) {
          const xv = data[i][xKey];
          const yv = data[i][s.key];
          if (!Number.isFinite(xv) || !Number.isFinite(yv)) continue;
          const sx = toX(xv);
          const sy = toY(yv);
          if (!started) { ctx.moveTo(sx, sy); started = true; }
          else ctx.lineTo(sx, sy);
        }
        ctx.strokeStyle = colors[si];
        ctx.lineWidth = 1.8;
        ctx.stroke();
      }
    }

    ctx.restore(); // unclip

    // ── Legend ───────────────────────────────────────────────
    if (showLegend && !phaseSpace && series.length > 0) {
      const lx = ml + pw - 10;
      const ly = mt + 10;
      const lh = series.length * 18 + 12;
      const lw = 120;

      ctx.fillStyle = 'rgba(5,5,12,0.8)';
      ctx.strokeStyle = 'rgba(255,255,255,0.1)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(lx - lw, ly, lw, lh, 6);
      ctx.fill();
      ctx.stroke();

      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';

      for (let i = 0; i < series.length; i++) {
        const ey = ly + 10 + i * 18;
        // Line sample
        ctx.strokeStyle = colors[i];
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(lx - lw + 10, ey);
        ctx.lineTo(lx - lw + 28, ey);
        ctx.stroke();
        // Label
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.fillText(series[i].label, lx - lw + 34, ey);
      }
    }
  }, [data, series, xKey, xLabel, yLabel, title, width, height, colormap, phaseSpace, showLegend, showMinorGrid, colors]);

  useEffect(() => {
    draw();
  }, [draw]);

  return (
    <div className="makie-graph-container" style={{ width, height }}>
      <canvas ref={canvasRef} className="makie-graph-canvas" />
    </div>
  );
}
