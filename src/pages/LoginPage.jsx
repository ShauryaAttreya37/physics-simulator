import { useState, useRef, useEffect } from 'react';
import './LoginPage.css';
import { supabase } from '../lib/supabase';

export default function LoginPage({ onBack, onLogin }) {
  const containerRef = useRef(null);
  const [mode, setMode] = useState('login'); // 'login' | 'signup' | 'forgot' | 'welcome' | 'reset-sent'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isExiting, setIsExiting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [showEmailNotConfirmed, setShowEmailNotConfirmed] = useState(false);

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

    if (!supabase) {
      setError('System Error: Authentication service is not configured.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (mode === 'login') {
        if (!email || !password) { setError('Please fill in all fields'); return; }
        const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) {
          // Handle "Email not confirmed" error specifically
          if (authError.message?.toLowerCase().includes('email not confirmed')) {
            setShowEmailNotConfirmed(true);
            setError('');
            return;
          }
          throw authError;
        }
        if (onLogin) onLogin(data.user);
      } else if (mode === 'signup') {
        if (!email || !password) { setError('Please fill in all fields'); return; }
        const { data, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
          },
        });
        if (authError) throw authError;
        // If user already exists but unconfirmed, Supabase returns a user with identities = []
        if (data?.user?.identities?.length === 0) {
          setError('An account with this email already exists. Please sign in instead.');
          return;
        }
        setMode('welcome');
      } else if (mode === 'forgot') {
        if (!email) { setError('Please enter your email address'); return; }
        const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/`,
        });
        if (authError) throw authError;
        setMode('reset-sent');
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

  const handleResendConfirmation = async () => {
    if (!email) {
      setError('Please enter your email address above.');
      return;
    }
    setResendLoading(true);
    try {
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      });
      if (resendError) throw resendError;
      setShowEmailNotConfirmed(false);
      setError('');
      setMode('reset-sent');
    } catch (err) {
      setError(err.message);
    } finally {
      setResendLoading(false);
    }
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setError('');
    setPassword('');
    setShowEmailNotConfirmed(false);
  };

  // --- Header config per mode ---
  const headers = {
    login:      { title: 'Welcome Back',     sub: 'Sign in to access your simulations.' },
    signup:     { title: 'Join the Lab',      sub: 'Create an account to start experimenting.' },
    forgot:     { title: 'Reset Password',    sub: 'Enter your email and we\'ll send a recovery link.' },
    welcome:    { title: 'Verify Your Email',    sub: 'One last step before you can start experimenting.' },
    'reset-sent': { title: 'Check Your Email', sub: 'We\'ve sent you an email — check your inbox.' },
  };

  const { title, sub } = headers[mode];

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
          <div className="login-card" key={mode}>
            <div className="login-header">
              <img src="/favicon.svg" alt="Logo" className="login-logo" />
              <h2>{title}</h2>
              <p>{sub}</p>
            </div>

            {/* ── Welcome (Post-Signup) ── */}
            {mode === 'welcome' && (
              <div className="success-state">
                <div className="success-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="20" height="16" x="2" y="4" rx="2"></rect>
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
                  </svg>
                </div>
                <h3>Confirmation Email Sent!</h3>
                <p>We've sent a verification link to <strong>{email}</strong>. Please check your inbox and click the link to activate your account.</p>

                <div className="mock-email-preview">
                  <div className="mock-email-header">
                    <span>From: The Physics Simulator Team</span>
                    <span>Subject: Confirm your email address</span>
                  </div>
                  <div className="mock-email-body">
                    <p>Dear Researcher,</p>
                    <p>Click the confirmation link in your email to verify your account. Once confirmed, you'll have full access to the laboratory.</p>
                    <p>Didn't receive the email? Check your spam folder or click below to resend.</p>
                    <p><a href="https://discord.gg/pbDm2rRECb" target="_blank" rel="noopener noreferrer" className="discord-link">→ Join our Discord Community</a></p>
                    <p className="mock-signature">With immense gratitude,<br/>The Physics Simulator Team</p>
                  </div>
                </div>

                <button className="login-submit-btn" onClick={() => switchMode('login')} style={{ marginTop: '1rem' }}>
                  ← Back to Sign In
                </button>
              </div>
            )}

            {/* ── Reset Email Sent ── */}
            {mode === 'reset-sent' && (
              <div className="success-state">
                <div className="success-icon" style={{ background: 'rgba(10, 132, 255, 0.1)', color: '#0A84FF', boxShadow: '0 0 30px rgba(10, 132, 255, 0.15)' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="20" height="16" x="2" y="4" rx="2"></rect>
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
                  </svg>
                </div>
                <h3>Email Sent!</h3>
                <p>A password reset link has been sent to <strong>{email}</strong>. Check your inbox and click the link to set a new password.</p>
                <button className="login-submit-btn" onClick={() => switchMode('login')} style={{ marginTop: '1rem' }}>
                  ← Back to Sign In
                </button>
              </div>
            )}

            {/* ── Login Form ── */}
            {mode === 'login' && (
              <form onSubmit={handleSubmit} className="login-form">
                {error && <div className="auth-error">{error}</div>}
                {showEmailNotConfirmed && (
                  <div className="email-not-confirmed-banner">
                    <div className="banner-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect width="20" height="16" x="2" y="4" rx="2"></rect>
                        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
                      </svg>
                    </div>
                    <div className="banner-content">
                      <strong>Email not confirmed</strong>
                      <p>Please check your inbox for a verification link, or click below to resend it.</p>
                    </div>
                    <button
                      type="button"
                      className="resend-btn"
                      onClick={handleResendConfirmation}
                      disabled={resendLoading}
                    >
                      {resendLoading ? 'Sending…' : 'Resend Email'}
                    </button>
                  </div>
                )}
                <div className="input-group">
                  <label htmlFor="email">Email</label>
                  <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@university.edu" autoComplete="email" required />
                </div>
                <div className="input-group">
                  <label htmlFor="password">Password</label>
                  <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••••" autoComplete="current-password" required />
                </div>
                <div className="forgot-link-row">
                  <button type="button" className="text-btn" onClick={() => switchMode('forgot')}>Forgot password?</button>
                </div>
                <button type="submit" className="login-submit-btn" disabled={loading}>
                  {loading ? <span className="btn-loading"><span className="spinner"></span>Signing in…</span> : 'Sign In'}
                </button>
                <div className="auth-divider"><span>New here?</span></div>
                <div className="auth-toggle">
                  <p><button type="button" className="text-btn" onClick={() => switchMode('signup')}>Create an account</button></p>
                </div>
              </form>
            )}

            {/* ── Signup Form ── */}
            {mode === 'signup' && (
              <form onSubmit={handleSubmit} className="login-form">
                {error && <div className="auth-error">{error}</div>}
                <div className="input-group">
                  <label htmlFor="email">Email</label>
                  <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@university.edu" autoComplete="email" required />
                </div>
                <div className="input-group">
                  <label htmlFor="password">Password</label>
                  <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••••" autoComplete="new-password" required />
                  {password && (
                    <div className="password-strength">
                      {[1, 2, 3].map(i => (
                        <div key={i} className={`strength-bar ${i <= strengthLevel ? `active ${strengthLabel}` : ''}`} />
                      ))}
                    </div>
                  )}
                </div>
                <button type="submit" className="login-submit-btn" disabled={loading}>
                  {loading ? <span className="btn-loading"><span className="spinner"></span>Creating…</span> : 'Create Account'}
                </button>
                <div className="auth-divider"><span>Already a member?</span></div>
                <div className="auth-toggle">
                  <p><button type="button" className="text-btn" onClick={() => switchMode('login')}>Sign in instead</button></p>
                </div>
              </form>
            )}

            {/* ── Forgot Password Form ── */}
            {mode === 'forgot' && (
              <form onSubmit={handleSubmit} className="login-form">
                {error && <div className="auth-error">{error}</div>}
                <div className="input-group">
                  <label htmlFor="email">Email Address</label>
                  <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@university.edu" autoComplete="email" required />
                </div>
                <button type="submit" className="login-submit-btn" disabled={loading}>
                  {loading ? <span className="btn-loading"><span className="spinner"></span>Sending…</span> : 'Send Reset Link'}
                </button>
                <div className="auth-divider"><span>Remember it?</span></div>
                <div className="auth-toggle">
                  <p><button type="button" className="text-btn" onClick={() => switchMode('login')}>Back to Sign In</button></p>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
