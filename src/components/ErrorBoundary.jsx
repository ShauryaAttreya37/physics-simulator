import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    // In a professional setting, we could log the error to an error reporting service here (like Sentry)
    console.error('Caught by ErrorBoundary:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    // Optionally reload the page or navigate home
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            backgroundColor: '#0B0F14',
            color: '#E2E8F0',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          <AlertTriangle size={64} color="#EF4444" style={{ marginBottom: '1.5rem' }} />
          <h1 style={{ fontSize: '2rem', marginBottom: '1rem', color: '#fff' }}>
            Something went wrong.
          </h1>
          <p
            style={{
              color: '#94A3B8',
              marginBottom: '2rem',
              maxWidth: '600px',
              textAlign: 'center',
              lineHeight: '1.6',
            }}
          >
            We encountered an unexpected error. Our systems have logged the incident. Please try
            resetting the application.
          </p>
          <button
            onClick={this.handleReset}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              backgroundColor: '#3B82F6',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
            }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#2563EB')}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#3B82F6')}
          >
            <RefreshCw size={18} />
            Reset Application
          </button>

          {import.meta.env.DEV && this.state.error && (
            <div
              style={{
                marginTop: '3rem',
                padding: '1rem',
                backgroundColor: '#1E293B',
                borderRadius: '8px',
                maxWidth: '800px',
                overflowX: 'auto',
              }}
            >
              <p style={{ color: '#F87171', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                {this.state.error.toString()}
              </p>
              <pre style={{ fontSize: '0.85rem', color: '#94A3B8' }}>
                {this.state.errorInfo?.componentStack}
              </pre>
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
