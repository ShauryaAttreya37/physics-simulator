import { useRef, useState } from 'react';
import { inferReadoutTooltip } from '../constants/physicsTooltips';

export default function DataReadout({ data, method }) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, initialX: 0, initialY: 0 });

  if (!data) return null;

  const handlePointerDown = (event) => {
    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      initialX: position.x,
      initialY: position.y,
    };
  };

  const handlePointerMove = (event) => {
    if (!isDragging) return;
    const dx = event.clientX - dragRef.current.startX;
    const dy = event.clientY - dragRef.current.startY;
    setPosition({
      x: Math.round(dragRef.current.initialX + dx),
      y: Math.round(dragRef.current.initialY + dy),
    });
  };

  const handlePointerUp = (event) => {
    setIsDragging(false);
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const rows = buildRows(data);
  const methodBadge = METHOD_BADGES[method] || null;

  const isMobile = window.innerWidth <= 900;
  if (isMobile) return null;

  const transform = `translate(${position.x}px, ${position.y}px)`;

  return (
    <div
      className="data-readout"
      style={{
        transform,
        cursor: isDragging ? 'grabbing' : 'grab',
        touchAction: 'none',
        userSelect: 'none',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div className="data-readout-title">Readout</div>
      {rows.map((row) => (
        <div key={row.key} className="data-readout-row">
          <span className="data-readout-label" title={inferReadoutTooltip(row.key, row.label)}>
            {row.label}
          </span>
          <span
            className={`data-readout-value ${row.status}`}
            title={inferReadoutTooltip(row.key, row.label)}
          >
            {row.value}
          </span>
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

function buildRows(data) {
  const rows = [];

  if (data.time !== undefined) {
    rows.push({ key: 'time', label: 'Time', value: formatSci(data.time, 's'), status: 'ok' });
  }
  if (data.dt !== undefined) {
    rows.push({ key: 'dt', label: 'Step', value: formatSci(data.dt, 's'), status: 'ok' });
  }
  if (data.steps !== undefined) {
    rows.push({ key: 'steps', label: 'Steps', value: data.steps.toLocaleString(), status: 'ok' });
  }
  if (data.energyError !== undefined) {
    const error = Math.abs(data.energyError);
    const status = error < 1e-6 ? 'ok' : error < 1e-3 ? 'warn' : 'err';
    rows.push({
      key: 'energyError',
      label: 'Energy error',
      value: error.toExponential(4),
      status,
    });
  }
  if (data.totalEnergy !== undefined) {
    rows.push({
      key: 'totalEnergy',
      label: 'Energy',
      value: formatSci(data.totalEnergy, 'J'),
      status: 'ok',
    });
  }
  if (data.angularMomentum !== undefined) {
    rows.push({
      key: 'angularMomentum',
      label: 'Angular momentum',
      value: formatSci(data.angularMomentum, ''),
      status: 'ok',
    });
  }
  if (data.cfl !== undefined) {
    const status = data.cfl < 0.5 ? 'ok' : data.cfl < 1.0 ? 'warn' : 'err';
    rows.push({ key: 'cfl', label: 'CFL number', value: data.cfl.toFixed(4), status });
  }
  if (data.maxVelocity !== undefined) {
    rows.push({
      key: 'maxVelocity',
      label: 'Max velocity',
      value: formatSci(data.maxVelocity, 'm/s'),
      status: 'ok',
    });
  }
  if (data.lyapunov !== undefined) {
    rows.push({
      key: 'lyapunov',
      label: 'Lyapunov',
      value: data.lyapunov.toFixed(6),
      status: 'ok',
    });
  }

  // Buoyancy / Fluid specific rows
  if (data.weight !== undefined) {
    rows.push({ key: 'weight', label: 'Weight', value: formatSci(data.weight, 'N'), status: 'ok' });
  }
  if (data.buoyancy !== undefined) {
    rows.push({
      key: 'buoyancy',
      label: 'Buoyant force',
      value: formatSci(data.buoyancy, 'N'),
      status: 'ok',
    });
  }
  if (data.appWeight !== undefined) {
    rows.push({
      key: 'appWeight',
      label: 'Apparent weight',
      value: formatSci(data.appWeight, 'N'),
      status: 'ok',
    });
  }
  if (data.tension !== undefined) {
    rows.push({
      key: 'tension',
      label: 'Scale tension',
      value: formatSci(data.tension, 'N'),
      status: 'ok',
    });
  }
  if (data.fluidDensity !== undefined) {
    rows.push({
      key: 'fluidDensity',
      label: 'Fluid density',
      value: formatSci(data.fluidDensity, 'g/cm³'),
      status: 'ok',
    });
  }

  return rows;
}

function formatSci(value, unit) {
  if (!Number.isFinite(value)) return '-';
  const abs = Math.abs(value);
  let text;
  if (abs === 0) text = '0.000000';
  else if (abs >= 100000 || abs < 0.0001) text = value.toExponential(6);
  else text = value.toFixed(6);
  return unit ? `${text} ${unit}` : text;
}

const METHOD_BADGES = {
  rk4: { label: 'Runge-Kutta 4', cls: 'rk45' },
  rk45: { label: 'RK45 adaptive', cls: 'rk45' },
  yoshida4: { label: 'Yoshida symplectic 4', cls: 'symplectic' },
  leapfrog: { label: 'Leapfrog symplectic', cls: 'symplectic' },
  sph: { label: 'SPH fluid', cls: 'sph' },
  'sph-xsph': { label: 'SPH XSPH', cls: 'sph' },
  fdm: { label: 'FDM', cls: 'fdm' },
  'fdm-pml': { label: 'FDM PML', cls: 'fdm' },
};
