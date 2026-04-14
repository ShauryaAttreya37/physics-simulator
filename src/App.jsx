import { useRef, useState } from 'react';
import Toolbar from './components/Toolbar';
import SandboxCanvas from './components/SandboxCanvas';
import PropertiesPanel from './components/PropertiesPanel';
import Home from './pages/Home';
import TopicsPage from './pages/TopicsPage';
import FluidSandboxPage from './pages/FluidSandboxPage';
import { useSandboxStore } from './store/sandboxStore';
import { resetEngine } from './physics/engine';
import Matter from 'matter-js';
import './App.css';

export default function App() {
  const [page, setPage] = useState('home'); // 'home' | 'sandbox' | 'topics' | 'fluid'
  const engineRef = useRef(null);
  const { setRunning } = useSandboxStore();

  function handleReset() {
    setRunning(false);
    useSandboxStore.setState({ bodies: {}, constraints: {}, selectedId: null });
    const eng = resetEngine();
    engineRef.current = eng;
    const floor = Matter.Bodies.rectangle(
      window.innerWidth / 2, 580,
      window.innerWidth + 200, 20,
      { isStatic: true, friction: 0.5, restitution: 0.3 }
    );
    floor._isFloor = true;
    Matter.Composite.add(eng.world, floor);
  }

  if (page === 'home') {
    return (
      <Home
        onSimulations={() => setPage('topics')}
        onFluidSandbox={() => setPage('fluid')}
      />
    );
  }

  if (page === 'topics') {
    return <TopicsPage onBack={() => setPage('home')} />;
  }

  if (page === 'fluid') {
    return <FluidSandboxPage onBack={() => setPage('home')} />;
  }

  // Sandbox
  return (
    <div className="app-container">
      <Toolbar onReset={handleReset} onHome={() => setPage('home')} />
      <div className="canvas-container">
        <SandboxCanvas engineRef={engineRef} />
      </div>
      <PropertiesPanel />
    </div>
  );
}
