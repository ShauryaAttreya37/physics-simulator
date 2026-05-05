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
  Settings2
} from 'lucide-react';

const tools = [
  { id: 'select', label: 'Select',  icon: <MousePointer2 size={18} /> },
  { id: 'circle', label: 'Circle',  icon: <Circle        size={18} /> },
  { id: 'box',    label: 'Box',     icon: <Square        size={18} /> },
  { id: 'wood',   label: 'Wood',    icon: <Package       size={18} /> },
  { id: 'beam',   label: 'Beam',    icon: <GripHorizontal size={18} /> },
  { id: 'wedge',  label: 'Wedge',   icon: <Triangle      size={18} /> },
  { id: 'wall',   label: 'Wall',    icon: <RectangleHorizontal size={18} /> },
  { id: 'spring', label: 'Spring',  icon: <Activity      size={18} /> },
  { id: 'string', label: 'String',  icon: <Minus         size={18} /> },
  { id: 'pivot',  label: 'Pivot',   icon: <Link          size={18} /> },
  { id: 'oscillator', label: 'Oscillator', icon: <Wifi size={18} /> },
  { id: 'pulley', label: 'Pulley',  icon: <CircleDot     size={18} /> },
];

const systems = [
  { id: 'car', label: 'Car System', icon: <Car size={18} /> },
  { id: 'bridge', label: 'Bridge', icon: <List size={18} /> },
  { id: 'cradle', label: 'Newton Cradle', icon: <MoreHorizontal size={18} /> },
];

export default function Toolbar({ onReset, onHome }) {
  const { activeTool, setActiveTool, isRunning, setRunning, togglePropertiesPanel } = useSandboxStore();

  return (
    <aside className="left-sidebar">
      {/* Home button */}
      <button className="icon-btn" title="Home" onClick={onHome} style={{ marginBottom: 4 }}>
        <Home size={16} />
      </button>

      {/* Brand logo mark */}
      <div className="sidebar-brand" title="Physics Simulator" />

      <div className="sidebar-sep" />

      {/* Tool buttons */}
      {tools.map(t => (
        <button
          key={t.id}
          title={t.label}
          onClick={() => setActiveTool(t.id)}
          className={`tool-btn${activeTool === t.id ? ' active' : ''}`}
        >
          {t.icon}
        </button>
      ))}

      <div className="sidebar-sep mobile-hide" style={{ margin: '12px 0' }} />

      {/* Systems section */}
      <div className="mobile-hide" style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px', textAlign: 'center', fontWeight: '600' }}>Systems</div>
      {systems.map(s => (
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
          title="Properties"
          onClick={togglePropertiesPanel}
          className="icon-btn mobile-only-flex"
        >
          <Settings2 size={17} />
        </button>
        <button
          title={isRunning ? 'Pause' : 'Play'}
          onClick={() => setRunning(!isRunning)}
          className={`icon-btn ${isRunning ? 'pause-btn' : 'play-btn'}`}
        >
          {isRunning ? <Pause size={17} /> : <Play size={17} fill="currentColor" />}
        </button>
        <button
          title="Reset"
          onClick={onReset}
          className="icon-btn"
        >
          <RotateCcw size={16} />
        </button>
      </div>
    </aside>
  );
}
