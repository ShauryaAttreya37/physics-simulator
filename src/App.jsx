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
import { ChevronUp, Home as HomeIcon } from 'lucide-react';
import './App.css';

export default function App() {
  const [page, setPage] = useState('home');
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

  const handleNavigate = (targetPage) => {
    setPage(targetPage);
  };

  const renderHeader = () => {
    if (page === 'home' || page === 'topics') return null;
    return (
      <header className="app-header">
        <div className="header-left">
          <button
            className="header-logo icon-btn"
            onClick={() => handleNavigate('home')}
            title="Home"
          >
            <HomeIcon size={18} />
          </button>
          <div className="header-nav">
            <button
              className={`nav-item${page === 'topics' ? ' active' : ''}`}
              onClick={() => handleNavigate('topics')}
            >
              Laboratory
            </button>
            <button
              className={`nav-item${page === 'integrators' ? ' active' : ''}`}
              onClick={() => handleNavigate('integrators')}
            >
              Integrators
            </button>
            <button
              className={`nav-item${page === 'docs' ? ' active' : ''}`}
              onClick={() => handleNavigate('docs')}
            >
              Docs
            </button>
          </div>
        </div>
      </header>
    );
  };

  if (page === 'home') {
    return <Home onNavigate={handleNavigate} />;
  }

  return (
    <div className="page-wrapper">
      {renderHeader()}
      {page === 'topics' && <TopicsPage onBack={() => handleNavigate('home')} />}
      {page === 'docs' && <DocsPage onBack={() => handleNavigate('home')} />}
      {page === 'integrators' && <IntegratorsPage onBack={() => handleNavigate('home')} />}
      {page === 'sandbox' && (
        <div className="app-container">
          <Toolbar onReset={handleReset} onHome={() => handleNavigate('home')} />
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
      )}
    </div>
  );
}
