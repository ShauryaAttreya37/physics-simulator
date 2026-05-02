import { useRef, useState, useEffect } from 'react';
import Toolbar from './components/Toolbar';
import SandboxCanvas from './components/SandboxCanvas';
import PropertiesPanel from './components/PropertiesPanel';
import Home from './pages/Home';
import TopicsPage from './pages/TopicsPage';
import DocsPage from './pages/DocsPage';
import IntegratorsPage from './pages/IntegratorsPage';
import LoginPage from './pages/LoginPage';
import { useSandboxStore } from './store/sandboxStore';
import { resetEngine } from './physics/engine';
import Matter from 'matter-js';
import { supabase } from './lib/supabase';
import './App.css';

export default function App() {
  const [page, setPage] = useState('home'); // 'home' | 'sandbox' | 'topics' | 'docs' | 'integrators' | 'login'
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const engineRef = useRef(null);
  const { setRunning } = useSandboxStore();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
      setIsLoadingAuth(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

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

  const handleNavigate = (targetPage) => {
    if ((targetPage === 'topics' || targetPage === 'sandbox') && !isAuthenticated) {
      setPage('login');
    } else {
      setPage(targetPage);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setPage('home');
  };

  if (isLoadingAuth) {
    return (
      <div className="app-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--text-muted)', fontFamily: 'var(--font)' }}>Loading...</div>
      </div>
    );
  }

  if (page === 'home') {
    return <Home onNavigate={handleNavigate} isAuthenticated={isAuthenticated} />;
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

  if (page === 'login') {
    return <LoginPage 
      onBack={() => handleNavigate('home')} 
      onLogin={() => {
        setIsAuthenticated(true);
        setPage('topics');
      }} 
    />;
  }

  // Sandbox
  return (
    <div className="app-container">
      <Toolbar onReset={handleReset} onHome={() => handleNavigate('home')} onLogout={handleLogout} />
      <div className="canvas-container">
        <SandboxCanvas engineRef={engineRef} />
      </div>
      <PropertiesPanel />
    </div>
  );
}
