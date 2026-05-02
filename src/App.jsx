import { useRef, useState, useEffect } from 'react';
import Toolbar from './components/Toolbar';
import SandboxCanvas from './components/SandboxCanvas';
import PropertiesPanel from './components/PropertiesPanel';
import Home from './pages/Home';
import TopicsPage from './pages/TopicsPage';
import DocsPage from './pages/DocsPage';
import IntegratorsPage from './pages/IntegratorsPage';
import LoginPage from './pages/LoginPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ProfilePage from './pages/ProfilePage';
import { useSandboxStore } from './store/sandboxStore';
import { resetEngine } from './physics/engine';
import Matter from 'matter-js';
import { supabase } from './lib/supabase';
import './App.css';

export default function App() {
  const [page, setPage] = useState('home');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const engineRef = useRef(null);
  const { setRunning } = useSandboxStore();

  useEffect(() => {
    if (!supabase) {
      console.error("Supabase client is not initialized. Check your environment variables.");
      setIsLoadingAuth(false);
      return;
    }

    // Check for password recovery hash in the URL
    const hash = window.location.hash;
    if (hash && hash.includes('type=recovery')) {
      setPage('reset-password');
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
      setIsLoadingAuth(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);

      // When Supabase fires PASSWORD_RECOVERY, show the reset page
      if (event === 'PASSWORD_RECOVERY') {
        setPage('reset-password');
      }
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
    if (supabase) {
      await supabase.auth.signOut();
    }
    setPage('home');
    setIsAuthenticated(false);
  };

  if (isLoadingAuth) {
    return (
      <div className="app-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--text-muted)', fontFamily: 'var(--font)' }}>Loading...</div>
      </div>
    );
  }

  if (page === 'reset-password') {
    return <ResetPasswordPage onComplete={() => {
      // Clear the hash from the URL
      window.history.replaceState(null, '', window.location.pathname);
      setPage('home');
    }} />;
  }

  if (page === 'home') {
    return <Home onNavigate={handleNavigate} isAuthenticated={isAuthenticated} onLogout={handleLogout} />;
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

  if (page === 'profile') {
    return <ProfilePage 
      onBack={() => handleNavigate('home')} 
      onLogout={handleLogout}
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
