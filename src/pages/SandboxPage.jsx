import PropTypes from 'prop-types';
import { useRef } from 'react';
import Matter from 'matter-js';
import { ChevronUp } from 'lucide-react';
import Toolbar from '../components/Toolbar';
import SandboxCanvas from '../components/SandboxCanvas';
import PropertiesPanel from '../components/PropertiesPanel';
import { useSandboxStore } from '../store/sandboxStore';
import { resetEngine } from '../physics/engine';

export default function SandboxPage({ onHome }) {
  const engineRef = useRef(null);
  const { setRunning, showPropertiesPanel, togglePropertiesPanel } = useSandboxStore();

  function handleReset() {
    setRunning(false);
    useSandboxStore.setState({ bodies: {}, constraints: {}, selectedId: null });
    const eng = resetEngine();
    engineRef.current = eng;
    const isMob = window.innerWidth <= 768;
    const floorY = isMob ? 400 : 500;
    const floor = Matter.Bodies.rectangle(0, floorY, window.innerWidth * 2, 40, {
      isStatic: true,
      friction: 0.5,
      restitution: 0.3,
    });
    floor._isFloor = true;
    Matter.Composite.add(eng.world, floor);
  }

  return (
    <div className="app-container">
      <Toolbar onReset={handleReset} onHome={onHome} />
      <div className="canvas-container">
        <SandboxCanvas engineRef={engineRef} />
      </div>
      <button
        className={`mobile-bottom-toggle${showPropertiesPanel ? ' active' : ''}`}
        onClick={togglePropertiesPanel}
        title="Toggle Properties"
      >
        <ChevronUp size={24} />
      </button>
      <PropertiesPanel />
    </div>
  );
}

SandboxPage.propTypes = {
  onHome: PropTypes.func.isRequired,
};
