import { useState, useRef, useEffect } from 'react';
import './LoginPage.css';
import { supabase } from '../lib/supabase';

export default function ResetPasswordPage({ onComplete }) {
  const containerRef = useRef(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password || !confirmPassword) {
      setError('Please fill in both fields');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper page-fade-in" ref={containerRef}>
      <div className="login-frame">
        <div className="bg-mesh">
          <div className="orb orb-1"></div>
          <div className="orb orb-2"></div>
          <div className="orb orb-3"></div>
        </div>
        <div className="grid-overlay parallax-back"></div>
        <div className="horizontal-axis parallax-back"></div>
        <div className="vertical-axis parallax-back"></div>

        <div className="login-card-wrapper parallax-front">
          <div className="login-card">
            <div className="login-header">
              <img src="/favicon.svg" alt="Logo" className="login-logo" />
              <h2>{success ? 'Password Updated' : 'Set New Password'}</h2>
              <p>{success ? 'Your password has been changed successfully.' : 'Choose a strong, unique password for your account.'}</p>
            </div>

            {success ? (
              <div className="success-state">
                <div className="success-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                </div>
                <h3>All Set!</h3>
                <p>You can now sign in with your new password.</p>
                <button className="login-submit-btn" onClick={onComplete}>
                  Continue to Lab →
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="login-form">
                {error && <div className="auth-error">{error}</div>}
                <div className="input-group">
                  <label htmlFor="new-password">New Password</label>
                  <input
                    type="password"
                    id="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••"
                    autoComplete="new-password"
                    required
                  />
                  {password && (
                    <div className="password-strength">
                      {[1, 2, 3].map(i => (
                        <div key={i} className={`strength-bar ${i <= strengthLevel ? `active ${strengthLabel}` : ''}`} />
                      ))}
                    </div>
                  )}
                </div>
                <div className="input-group">
                  <label htmlFor="confirm-password">Confirm Password</label>
                  <input
                    type="password"
                    id="confirm-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••"
                    autoComplete="new-password"
                    required
                  />
                </div>
                <button type="submit" className="login-submit-btn" disabled={loading}>
                  {loading ? <span className="btn-loading"><span className="spinner"></span>Updating…</span> : 'Update Password'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
