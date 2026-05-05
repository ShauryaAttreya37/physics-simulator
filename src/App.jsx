import { useRef, useState } from 'react';
import Toolbar from './components/Toolbar';
import SandboxCanvas from './components/SandboxCanvas';
import PropertiesPanel from './components/PropertiesPanel';
import Home from './pages/Home';
import TopicsPage from './pages/TopicsPage';
import DocsPage from './pages/DocsPage';
import IntegratorsPage from './pages/IntegratorsPage';
import { useSandboxStore } from './store/sandboxStore';
import { resetEngine } from './physics/engine';
import Matter from 'matter-js';
import './App.css';

export default function App() {
  const [page, setPage] = useState('home');
  const engineRef = useRef(null);
  const { setRunning } = useSandboxStore();

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

  const handleNavigate = (targetPage) => {
    setPage(targetPage);
  };

  if (page === 'home') {
    return <Home onNavigate={handleNavigate} />;
  }

  if (page === 'topics') {
    return <TopicsPage onBack={() => handleNavigate('home')} />;
  }

  if (page === 'docs') {
    return <DocsPage onBack={() => handleNavigate('home')} />;
  }

  if (page === 'integrators') {
    return <IntegratorsPage onBack={() => handleNavigate('home')} />;
  }

  // Sandbox
  return (
    <div className="app-container">
      <Toolbar onReset={handleReset} onHome={() => handleNavigate('home')} />
      <div className="canvas-container">
        <SandboxCanvas engineRef={engineRef} />
      </div>
      <PropertiesPanel />
    </div>
  );
}
