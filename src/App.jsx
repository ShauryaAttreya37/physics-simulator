import { lazy, Suspense } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import './App.css';

const TopicsPage = lazy(() => import('./pages/TopicsPage'));
const DocsPage = lazy(() => import('./pages/DocsPage'));
const IntegratorsPage = lazy(() => import('./pages/IntegratorsPage'));
const SandboxPage = lazy(() => import('./pages/SandboxPage'));

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigate = (targetPage) => {
    navigate(targetPage === 'home' ? '/' : `/${targetPage}`);
  };

  const renderHeader = () => {
    const isHome = location.pathname === '/';
    const isLab = location.pathname === '/topics' || location.pathname.startsWith('/lab');
    if (isHome || isLab) return null;

    return (
      <header className="app-header">
        <div className="header-left">
          <button
            className="header-logo icon-btn"
            onClick={() => handleNavigate('home')}
            title="Home"
          >
            <img src="/logo-mark.svg" alt="Physiverse" className="header-logo-mark" />
          </button>
          <div className="header-nav">
            <button
              className={`nav-item${location.pathname === '/topics' ? ' active' : ''}`}
              onClick={() => handleNavigate('topics')}
            >
              Lab
            </button>
            <button
              className={`nav-item${location.pathname === '/integrators' ? ' active' : ''}`}
              onClick={() => handleNavigate('integrators')}
            >
              Integrators
            </button>
            <button
              className={`nav-item${location.pathname === '/docs' ? ' active' : ''}`}
              onClick={() => handleNavigate('docs')}
            >
              Docs
            </button>
          </div>
        </div>
      </header>
    );
  };

  return (
    <div className="page-wrapper">
      {renderHeader()}
      <Suspense fallback={<div className="page-loading">Loading Physiverse...</div>}>
        <Routes>
          <Route path="/" element={<Home onNavigate={handleNavigate} />} />
          <Route path="/topics" element={<TopicsPage onBack={() => handleNavigate('home')} />} />
          <Route
            path="/lab/:simId"
            element={<TopicsPage onBack={() => handleNavigate('home')} />}
          />
          <Route path="/docs" element={<DocsPage onBack={() => handleNavigate('home')} />} />
          <Route
            path="/integrators"
            element={<IntegratorsPage onBack={() => handleNavigate('home')} />}
          />
          <Route path="/sandbox" element={<SandboxPage onHome={() => handleNavigate('home')} />} />
        </Routes>
      </Suspense>
    </div>
  );
}
