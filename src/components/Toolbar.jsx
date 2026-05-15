import { useEffect } from 'react';
import PropTypes from 'prop-types';
import { useSandboxStore } from '../store/sandboxStore';
import {
  MousePointer2,
  Circle,
  Square,
  RectangleHorizontal,
  Activity,
  Minus,
  Play,
  Pause,
  RotateCcw,
  Home,
  Triangle,
  CircleDot,
  Package,
  GripHorizontal,
  Link,
  Wifi,
  Car,
  List,
  MoreHorizontal,
} from 'lucide-react';

const tools = [
  { id: 'select', label: 'Select (S)', icon: <MousePointer2 size={18} />, key: 's' },
  { id: 'circle', label: 'Circle (1)', icon: <Circle size={18} />, key: '1' },
  { id: 'box', label: 'Box (2)', icon: <Square size={18} />, key: '2' },
  { id: 'wood', label: 'Wood (3)', icon: <Package size={18} />, key: '3' },
  { id: 'beam', label: 'Beam (4)', icon: <GripHorizontal size={18} />, key: '4' },
  { id: 'wedge', label: 'Wedge (5)', icon: <Triangle size={18} />, key: '5' },
  { id: 'wall', label: 'Wall (6)', icon: <RectangleHorizontal size={18} />, key: '6' },
  { id: 'spring', label: 'Spring (7)', icon: <Activity size={18} />, key: '7' },
  { id: 'string', label: 'String (8)', icon: <Minus size={18} />, key: '8' },
  { id: 'pivot', label: 'Pivot (9)', icon: <Link size={18} />, key: '9' },
  { id: 'oscillator', label: 'Oscillator (O)', icon: <Wifi size={18} />, key: 'o' },
  { id: 'pulley', label: 'Pulley (U)', icon: <CircleDot size={18} />, key: 'u' },
];

const systems = [
  { id: 'car', label: 'Car System', icon: <Car size={18} /> },
  { id: 'bridge', label: 'Bridge', icon: <List size={18} /> },
  { id: 'cradle', label: 'Newton Cradle', icon: <MoreHorizontal size={18} /> },
];

export default function Toolbar({ onReset, onHome }) {
  const { activeTool, setActiveTool, isRunning, setRunning } = useSandboxStore();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.key.toLowerCase() === ' ') {
        e.preventDefault();
        setRunning(!isRunning);
      } else if (e.key.toLowerCase() === 'r') {
        onReset();
      } else {
        const tool = tools.find((t) => t.key === e.key.toLowerCase());
        if (tool) setActiveTool(tool.id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRunning, setActiveTool, setRunning, onReset]);

  return (
    <aside className="left-sidebar">
      {/* Home button */}
      <button
        className="icon-btn"
        title="Home"
        onClick={onHome}
        style={{ marginBottom: 'var(--sp-1)' }}
      >
        <Home size={16} />
      </button>

      <div className="sidebar-sep" />

      {/* Tool buttons */}
      <div
        className="tool-grid"
        style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-1)' }}
      >
        {tools.map((t) => (
          <button
            key={t.id}
            title={t.label}
            onClick={() => setActiveTool(t.id)}
            className={`tool-btn${activeTool === t.id ? ' active' : ''}`}
          >
            {t.icon}
          </button>
        ))}
      </div>

      <div className="sidebar-sep mobile-hide" style={{ margin: 'var(--sp-3) 0' }} />

      {/* Systems section */}
      <div
        className="mobile-hide"
        style={{
          fontSize: '10px',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
          marginBottom: '8px',
          textAlign: 'center',
          fontWeight: '600',
        }}
      >
        Systems
      </div>
      {systems.map((s) => (
        <button
          key={s.id}
          title={s.label}
          onClick={() => setActiveTool(s.id)}
          className={`tool-btn${activeTool === s.id ? ' active' : ''} mobile-hide`}
        >
          {s.icon}
        </button>
      ))}

      {/* Push playback to bottom */}
      <div className="sidebar-actions">
        <div className="sidebar-sep" />
        <button
          title={isRunning ? 'Pause' : 'Play'}
          onClick={() => setRunning(!isRunning)}
          className={`icon-btn ${isRunning ? 'pause-btn' : 'play-btn'}`}
        >
          {isRunning ? <Pause size={17} /> : <Play size={17} fill="currentColor" />}
        </button>
        <button title="Reset" onClick={onReset} className="icon-btn">
          <RotateCcw size={16} />
        </button>
      </div>
    </aside>
  );
}

Toolbar.propTypes = {
  onReset: PropTypes.func.isRequired,
  onHome: PropTypes.func.isRequired,
};
