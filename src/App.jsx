import { lazy, Suspense, useState } from 'react';
import Home from './pages/Home';
import './App.css';

const TopicsPage = lazy(() => import('./pages/TopicsPage'));
const DocsPage = lazy(() => import('./pages/DocsPage'));
const IntegratorsPage = lazy(() => import('./pages/IntegratorsPage'));
const SandboxPage = lazy(() => import('./pages/SandboxPage'));

export default function App() {
  const [page, setPage] = useState('home');

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
            <img src="/logo-mark.svg" alt="Physics Lab" className="header-logo-mark" />
          </button>
          <div className="header-nav">
            <button
              className={`nav-item${page === 'topics' ? ' active' : ''}`}
              onClick={() => handleNavigate('topics')}
            >
              Lab
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
      <Suspense fallback={<div className="page-loading">Loading Physics Lab...</div>}>
        {page === 'topics' && <TopicsPage onBack={() => handleNavigate('home')} />}
        {page === 'docs' && <DocsPage onBack={() => handleNavigate('home')} />}
        {page === 'integrators' && <IntegratorsPage onBack={() => handleNavigate('home')} />}
        {page === 'sandbox' && <SandboxPage onHome={() => handleNavigate('home')} />}
      </Suspense>
    </div>
  );
}
