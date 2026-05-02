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
  const [showWelcome, setShowWelcome] = useState(false);

  // Password strength (only shown during signup)
  const getPasswordStrength = (pw) => {
    if (!pw) return 0;
    let score = 0;
    if (pw.length >= 6) score++;
    if (pw.length >= 8 && /[A-Z]/.test(pw) && /[0-9]/.test(pw)) score++;
    if (pw.length >= 10 && /[^A-Za-z0-9]/.test(pw)) score++;
    return score;
  };

  const strengthLevel = getPasswordStrength(password);
  const strengthLabel = ['weak', 'medium', 'strong'][strengthLevel - 1] || '';

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
    setTimeout(() => onBack(), 400);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    if (!supabase) {
      setError('System Error: Authentication service is not configured.');
      setLoading(false);
      return;
    }

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

  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
    setError('');
    setPassword('');
  };

  return (
    <div className={`login-wrapper ${isExiting ? 'page-fade-out' : 'page-fade-in'}`} ref={containerRef}>
      <div className="login-frame">
        {/* Background Effects */}
        <div className="bg-mesh">
          <div className="orb orb-1"></div>
          <div className="orb orb-2"></div>
          <div className="orb orb-3"></div>
        </div>
        <div className="grid-overlay parallax-back"></div>
        <div className="horizontal-axis parallax-back"></div>
        <div className="vertical-axis parallax-back"></div>

        {/* Back Button */}
        <button className="login-back-btn" onClick={handleNavigateBack} type="button">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back to Home
        </button>

        {/* Card */}
        <div className="login-card-wrapper parallax-front">
          <div className="login-card">
            <div className="login-header">
              <img src="/favicon.svg" alt="Logo" className="login-logo" />
              <h2>{showWelcome ? 'Welcome Aboard' : (isLoginMode ? 'Welcome Back' : 'Join the Lab')}</h2>
              <p>{showWelcome ? 'Your account has been created successfully.' : (isLoginMode ? 'Sign in to access your simulations.' : 'Create an account to start experimenting.')}</p>
            </div>

            {showWelcome ? (
              <div className="success-state">
                <div className="success-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                </div>
                <h3>Account Created!</h3>
                <p>Welcome to the community, <strong>{email}</strong>.</p>

                <div className="mock-email-preview">
                  <div className="mock-email-header">
                    <span>From: The Physics Simulator Team</span>
                    <span>Subject: Welcome to the Physics Simulator Community!</span>
                  </div>
                  <div className="mock-email-body">
                    <p>Dear Researcher,</p>
                    <p>Thank you for exploring the mechanics of the universe with us. We built this simulator not just as a tool, but as a bridge for curious minds to uncover the elegance of physics together.</p>
                    <p>Your journey into the unseen forces that govern our reality inspires us every single day.</p>
                    <p><a href="https://discord.gg/pbDm2rRECb" target="_blank" rel="noreferrer" className="discord-link">→ Join our Discord Community</a></p>
                    <p className="mock-signature">With immense gratitude,<br/>The Physics Simulator Team</p>
                  </div>
                </div>

                <button className="login-submit-btn" onClick={handleContinueToLab}>
                  Enter Laboratory →
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="login-form">
                {error && <div className="auth-error">{error}</div>}

                <div className="input-group">
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@university.edu"
                    autoComplete="email"
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
                    placeholder="••••••••••"
                    autoComplete={isLoginMode ? 'current-password' : 'new-password'}
                    required
                  />
                  {!isLoginMode && password && (
                    <div className="password-strength">
                      {[1, 2, 3].map(i => (
                        <div
                          key={i}
                          className={`strength-bar ${i <= strengthLevel ? `active ${strengthLabel}` : ''}`}
                        />
                      ))}
                    </div>
                  )}
                </div>

                <button type="submit" className="login-submit-btn" disabled={loading}>
                  {loading ? (
                    <span className="btn-loading">
                      <span className="spinner"></span>
                      Processing…
                    </span>
                  ) : (
                    isLoginMode ? 'Sign In' : 'Create Account'
                  )}
                </button>

                <div className="auth-divider">
                  <span>{isLoginMode ? 'New here?' : 'Already a member?'}</span>
                </div>

                <div className="auth-toggle">
                  <p>
                    <button type="button" className="text-btn" onClick={toggleMode}>
                      {isLoginMode ? 'Create an account' : 'Sign in instead'}
                    </button>
                  </p>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
