import { useState, useRef, useEffect } from 'react';
import './LoginPage.css';
import { supabase } from '../lib/supabase';

export default function LoginPage({ onBack, onLogin }) {
  const containerRef = useRef(null);
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isExiting, setIsExiting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showWelcome, setShowWelcome] = useState(false); // For post-signup message

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!containerRef.current) return;
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      
      containerRef.current.style.setProperty('--mouse-x', x);
      containerRef.current.style.setProperty('--mouse-y', y);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleNavigateBack = () => {
    setIsExiting(true);
    setTimeout(() => {
      onBack();
    }, 400);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      if (isLoginMode) {
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (authError) throw authError;
        if (onLogin) onLogin(data.user);
      } else {
        const { data, error: authError } = await supabase.auth.signUp({
          email,
          password,
        });
        
        if (authError) throw authError;
        // Show heartfelt welcome message on signup
        setShowWelcome(true);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleContinueToLab = () => {
    if (onLogin) onLogin();
  };

  return (
    <div className={`login-wrapper ${isExiting ? 'page-fade-out' : 'page-fade-in'}`} ref={containerRef}>
      <div className="bg-mesh">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
      </div>
      <div className="grid-overlay parallax-back"></div>

      <button className="back-btn glass-btn" onClick={handleNavigateBack} type="button">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        Back to Home
      </button>

      <div className="login-container parallax-front">
        <div className="login-card glass-panel">
          <div className="login-header">
            <img src="/favicon.svg" alt="Logo" className="login-logo" />
            <h2>{isLoginMode ? 'Sign In' : 'Create Account'}</h2>
            <p>Access your saved simulations and collaborate.</p>
          </div>

          {showWelcome ? (
            <div className="success-state">
              <div className="success-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 13V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h8"></path>
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
                  <path d="m16 19 2 2 4-4"></path>
                </svg>
              </div>
              <h3>Account Created!</h3>
              <p>Welcome to the Physics Simulator Community, <strong>{email}</strong>.</p>
              
              <div className="mock-email-preview" style={{ marginBottom: '1.5rem' }}>
                <div className="mock-email-header">
                  <span>From: The Physics Simulator Team</span>
                  <span>Subject: Welcome to the Physics Simulator Community!</span>
                </div>
                <div className="mock-email-body">
                  <p>Dear Researcher,</p>
                  <p>Thank you for exploring the mechanics of the universe with us. We built this simulator not just as a tool, but as a bridge for curious minds to uncover the elegance of physics together. Your journey into the unseen forces that govern our reality inspires us every single day.</p>
                  <p>We would be incredibly honored if you joined our growing family of physicists, engineers, and thinkers. Let's collaborate, share insights, and push the boundaries of what we can create.</p>
                  <p><a href="https://discord.gg/pbDm2rRECb" target="_blank" rel="noreferrer" className="discord-link">Join our Discord Community here!</a></p>
                  <p className="mock-signature">With immense gratitude,<br/>The Physics Simulator Team</p>
                </div>
              </div>

              <button className="primary-btn submit-btn" onClick={handleContinueToLab}>
                Enter Laboratory
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="login-form">
              {error && <div className="auth-error">{error}</div>}
              
              <div className="input-group">
                <label htmlFor="email">Email Address</label>
                <input 
                  type="email" 
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="researcher@university.edu"
                  required
                />
              </div>

              <div className="input-group">
                <label htmlFor="password">Password</label>
                <input 
                  type="password" 
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              <button type="submit" className="primary-btn submit-btn" disabled={loading}>
                {loading ? 'Processing...' : (isLoginMode ? 'Sign In' : 'Create Account')}
              </button>

              <div className="auth-toggle">
                <p>
                  {isLoginMode ? "Don't have an account? " : "Already have an account? "}
                  <button type="button" className="text-btn" onClick={() => { setIsLoginMode(!isLoginMode); setError(''); }}>
                    {isLoginMode ? 'Sign Up' : 'Sign In'}
                  </button>
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
