import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #0f0c29 0%, #1a1a3e 50%, #0f0c29 100%)',
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    color: '#fff',
  },
  spinner: {
    width: '48px',
    height: '48px',
    border: '4px solid rgba(255,255,255,0.15)',
    borderTop: '4px solid #818cf8',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
    marginBottom: '1.5rem',
  },
  title: {
    fontSize: '1.25rem',
    fontWeight: 600,
    margin: '0 0 0.5rem',
  },
  sub: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: '0.875rem',
    margin: 0,
  },
  errorCard: {
    background: 'rgba(248,113,113,0.15)',
    border: '1px solid rgba(248,113,113,0.4)',
    borderRadius: '16px',
    padding: '2rem',
    maxWidth: '360px',
    textAlign: 'center',
  },
  errorTitle: {
    color: '#fca5a5',
    fontSize: '1.1rem',
    fontWeight: 600,
    margin: '0 0 0.5rem',
  },
  errorText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: '0.875rem',
    margin: '0 0 1.25rem',
  },
  btnBack: {
    padding: '0.6rem 1.5rem',
    background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontWeight: 600,
    cursor: 'pointer',
    fontSize: '0.9rem',
  },
};

/** Spin keyframe is injected once */
if (typeof document !== 'undefined' && !document.getElementById('oauth-spin-style')) {
  const s = document.createElement('style');
  s.id = 'oauth-spin-style';
  s.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
  document.head.appendChild(s);
}

export default function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();
  const [error, setError] = useState(null);

  useEffect(() => {
    const token        = searchParams.get('token');
    const refreshToken = searchParams.get('refreshToken');

    if (!token) {
      setError('No access token received from Google. Please try again.');
      return;
    }

    // loginWithToken(accessToken, refreshToken, sessionId)
    // OAuth2 logins don't use device-session tracking, so we pass null for sessionId
    loginWithToken(token, refreshToken ?? '', null)
      .then((ok) => {
        if (ok) {
          navigate('/');
        } else {
          setError('Failed to complete sign-in. Please try again.');
        }
      })
      .catch(() => {
        setError('An unexpected error occurred during sign-in.');
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (error) {
    return (
      <div style={styles.page}>
        <div style={styles.errorCard}>
          <p style={styles.errorTitle}>Sign-in failed</p>
          <p style={styles.errorText}>{error}</p>
          <button
            id="btn-back-to-login"
            style={styles.btnBack}
            onClick={() => navigate('/login')}
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.spinner} />
      <p style={styles.title}>Completing sign-in…</p>
      <p style={styles.sub}>You'll be redirected in a moment.</p>
    </div>
  );
}
