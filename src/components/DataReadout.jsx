/**
 * DataReadout — Research instrument-style HUD overlay
 * Shows simulation telemetry: time, energy conservation, step count, method.
 */
import { inferReadoutTooltip } from '../constants/physicsTooltips';

export default function DataReadout({ data, method }) {
  if (!data) return null;

  const rows = [];

  if (data.time !== undefined) {
    rows.push({ key: 'time', label: 'Time', value: formatSci(data.time, 's'), status: 'ok' });
  }
  if (data.dt !== undefined) {
    rows.push({ key: 'dt', label: 'Δt', value: formatSci(data.dt, 's'), status: 'ok' });
  }
  if (data.steps !== undefined) {
    rows.push({ key: 'steps', label: 'Steps', value: data.steps.toLocaleString(), status: 'ok' });
  }
  if (data.energyError !== undefined) {
    const err = Math.abs(data.energyError);
    const status = err < 1e-6 ? 'ok' : err < 1e-3 ? 'warn' : 'err';
    rows.push({ key: 'energyError', label: '|ΔE/E₀|', value: err.toExponential(2), status });
  }
  if (data.totalEnergy !== undefined) {
    rows.push({ key: 'totalEnergy', label: 'E_total', value: formatSci(data.totalEnergy, 'J'), status: 'ok' });
  }
  if (data.angularMomentum !== undefined) {
    rows.push({ key: 'angularMomentum', label: 'L_total', value: formatSci(data.angularMomentum, ''), status: 'ok' });
  }
  if (data.cfl !== undefined) {
    const status = data.cfl < 0.5 ? 'ok' : data.cfl < 1.0 ? 'warn' : 'err';
    rows.push({ key: 'cfl', label: 'CFL', value: data.cfl.toFixed(3), status });
  }
  if (data.maxVelocity !== undefined) {
    rows.push({ key: 'maxVelocity', label: 'v_max', value: formatSci(data.maxVelocity, 'm/s'), status: 'ok' });
  }
  if (data.lyapunov !== undefined) {
    rows.push({ key: 'lyapunov', label: 'Lyapunov exp.', value: data.lyapunov.toFixed(4), status: 'ok' });
  }

  const methodBadge = METHOD_BADGES[method] || null;

  return (
    <div className="data-readout">
      <div className="data-readout-title">Simulation Telemetry</div>
      {rows.map((row, i) => (
        <div key={i} className="data-readout-row">
          <span className="data-readout-label" title={inferReadoutTooltip(row.key, row.label)}>{row.label}</span>
          <span className={`data-readout-value ${row.status}`} title={inferReadoutTooltip(row.key, row.label)}>{row.value}</span>
        </div>
      ))}
      {methodBadge && (
        <div className="data-readout-method">
          <span className={`method-badge ${methodBadge.cls}`}>{methodBadge.label}</span>
        </div>
      )}
    </div>
  );
}

function formatSci(value, unit) {
  if (!Number.isFinite(value)) return '—';
  const abs = Math.abs(value);
  let str;
  if (abs === 0) str = '0.000';
  else if (abs >= 10000 || abs < 0.01) str = value.toExponential(3);
  else str = value.toFixed(4);
  return unit ? `${str} ${unit}` : str;
}

const METHOD_BADGES = {
  'rk4':       { label: 'RK4',          cls: 'rk45' },
  'rk45':      { label: 'RK45 Adaptive', cls: 'rk45' },
  'yoshida4':  { label: 'Yoshida⁴',     cls: 'symplectic' },
  'leapfrog':  { label: 'Leapfrog',     cls: 'symplectic' },
  'sph':       { label: 'SPH',          cls: 'sph' },
  'sph-xsph':  { label: 'SPH+XSPH',    cls: 'sph' },
  'fdm':       { label: 'FDM',          cls: 'fdm' },
  'fdm-pml':   { label: 'FDM+PML',     cls: 'fdm' },
};
