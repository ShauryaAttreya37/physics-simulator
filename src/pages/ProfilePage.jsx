import { useState, useRef, useEffect } from 'react';
import './ProfilePage.css';
import { supabase } from '../lib/supabase';

export default function ProfilePage({ onBack, onLogout }) {
  const containerRef = useRef(null);
  const [user, setUser] = useState(null);
  const [isExiting, setIsExiting] = useState(false);
  const [loading, setLoading] = useState(true);

  // Change password state
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      if (!supabase) { setLoading(false); return; }
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };
    loadUser();
  }, []);

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

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess(false);

    if (!newPassword || !confirmPassword) {
      setPwError('Please fill in both fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setPwError('Password must be at least 6 characters');
      return;
    }

    setPwLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setPwSuccess(true);
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setShowChangePassword(false);
        setPwSuccess(false);
      }, 2500);
    } catch (err) {
      setPwError(err.message);
    } finally {
      setPwLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const getInitials = (email) => {
    if (!email) return '?';
    return email.charAt(0).toUpperCase();
  };

  if (loading) {
    return (
      <div className="profile-wrapper page-fade-in">
        <div className="profile-frame">
          <div className="profile-loading">
            <span className="spinner"></span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`profile-wrapper ${isExiting ? 'page-fade-out' : 'page-fade-in'}`} ref={containerRef}>
      <div className="profile-frame">
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
        <button className="profile-back-btn" onClick={handleNavigateBack} type="button">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back to Home
        </button>

        {/* Profile Card */}
        <div className="profile-card-wrapper parallax-front">
          <div className="profile-card">
            {/* Avatar & Identity */}
            <div className="profile-identity">
              <div className="profile-avatar">
                {getInitials(user?.email)}
              </div>
              <h2>{user?.email || 'Unknown User'}</h2>
              <span className="profile-badge">Researcher</span>
            </div>

            {/* Info Grid */}
            <div className="profile-info-grid">
              <div className="profile-info-item">
                <div className="info-label">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                  Email
                </div>
                <div className="info-value">{user?.email}</div>
              </div>
              <div className="profile-info-item">
                <div className="info-label">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
                  Member Since
                </div>
                <div className="info-value">{formatDate(user?.created_at)}</div>
              </div>
              <div className="profile-info-item">
                <div className="info-label">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  Auth Provider
                </div>
                <div className="info-value" style={{ textTransform: 'capitalize' }}>{user?.app_metadata?.provider || 'email'}</div>
              </div>
              <div className="profile-info-item">
                <div className="info-label">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  Last Sign In
                </div>
                <div className="info-value">{formatDate(user?.last_sign_in_at)}</div>
              </div>
            </div>

            {/* Actions */}
            <div className="profile-actions">
              <button
                className="profile-action-btn"
                onClick={() => { setShowChangePassword(!showChangePassword); setPwError(''); setPwSuccess(false); }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                Change Password
              </button>
              <button className="profile-action-btn danger" onClick={onLogout}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
                Log Out
              </button>
            </div>

            {/* Change Password Form (collapsible) */}
            {showChangePassword && (
              <form className="change-pw-form" onSubmit={handleChangePassword}>
                {pwError && <div className="auth-error">{pwError}</div>}
                {pwSuccess && <div className="pw-success">Password updated successfully!</div>}
                <div className="input-group">
                  <label htmlFor="new-pw">New Password</label>
                  <input type="password" id="new-pw" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••••" autoComplete="new-password" required />
                </div>
                <div className="input-group">
                  <label htmlFor="confirm-pw">Confirm New Password</label>
                  <input type="password" id="confirm-pw" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••••" autoComplete="new-password" required />
                </div>
                <button type="submit" className="login-submit-btn" disabled={pwLoading} style={{ marginTop: '0.5rem' }}>
                  {pwLoading ? <span className="btn-loading"><span className="spinner"></span>Updating…</span> : 'Update Password'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
