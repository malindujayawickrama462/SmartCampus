import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import toast from 'react-hot-toast';

/* ─────────────────────────────────────────
   Inline styles – no Tailwind dependency
   ───────────────────────────────────────── */
const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #0f0c29 0%, #1a1a3e 50%, #0f0c29 100%)',
    padding: '1.5rem',
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
  },
  card: {
    width: '100%',
    maxWidth: '420px',
    background: 'rgba(255,255,255,0.05)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '24px',
    padding: '2.5rem 2rem',
    boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
  },
  logo: {
    textAlign: 'center',
    marginBottom: '2rem',
  },
  logoIcon: {
    width: '56px',
    height: '56px',
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    borderRadius: '16px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '0.75rem',
    boxShadow: '0 8px 24px rgba(99,102,241,0.4)',
  },
  title: {
    color: '#fff',
    fontSize: '1.6rem',
    fontWeight: 700,
    margin: '0 0 0.25rem',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: '0.875rem',
    margin: 0,
  },
  label: {
    display: 'block',
    color: 'rgba(255,255,255,0.75)',
    fontSize: '0.85rem',
    fontWeight: 500,
    marginBottom: '0.4rem',
  },
  inputWrap: { marginBottom: '1rem' },
  input: {
    width: '100%',
    padding: '0.7rem 1rem',
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: '10px',
    color: '#fff',
    fontSize: '0.95rem',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    boxSizing: 'border-box',
  },
  inputError: {
    borderColor: '#f87171',
    boxShadow: '0 0 0 2px rgba(248,113,113,0.25)',
  },
  errorText: {
    color: '#f87171',
    fontSize: '0.78rem',
    marginTop: '0.3rem',
  },
  btnPrimary: {
    width: '100%',
    padding: '0.8rem',
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    fontWeight: 600,
    fontSize: '1rem',
    cursor: 'pointer',
    transition: 'opacity 0.2s, transform 0.15s',
    marginTop: '0.5rem',
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    margin: '1.25rem 0',
    color: 'rgba(255,255,255,0.3)',
    fontSize: '0.8rem',
  },
  dividerLine: {
    flex: 1,
    height: '1px',
    background: 'rgba(255,255,255,0.1)',
  },
  btnGoogle: {
    width: '100%',
    padding: '0.75rem',
    background: '#fff',
    color: '#1f1f1f',
    border: '1px solid rgba(0,0,0,0.1)',
    borderRadius: '12px',
    fontWeight: 600,
    fontSize: '0.95rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.6rem',
    transition: 'box-shadow 0.2s, transform 0.15s',
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
  },
  footer: {
    textAlign: 'center',
    marginTop: '1.25rem',
    color: 'rgba(255,255,255,0.45)',
    fontSize: '0.85rem',
  },
  link: {
    color: '#818cf8',
    textDecoration: 'none',
    fontWeight: 500,
  },
  errorBanner: {
    background: 'rgba(248,113,113,0.15)',
    border: '1px solid rgba(248,113,113,0.4)',
    borderRadius: '10px',
    padding: '0.75rem 1rem',
    color: '#fca5a5',
    fontSize: '0.875rem',
    marginBottom: '1rem',
  },
};

/* ─────────────────────────────────────────
   Google SVG logo
   ───────────────────────────────────────── */
function GoogleLogo() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
      <path fill="none" d="M0 0h48v48H0z"/>
    </svg>
  );
}

/* ─────────────────────────────────────────
   Component
   ───────────────────────────────────────── */
export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loginWithToken } = useAuth();

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  // Check for OAuth2 error redirect (e.g. deactivated account)
  const oauthError = searchParams.get('error');

  useEffect(() => {
    if (user) navigate('/');
  }, [user, navigate]);

  // ── Validation ──────────────────────────────────────────────────────────────
  const validate = () => {
    const newErrors = {};
    if (!form.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(form.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!form.password) {
      newErrors.password = 'Password is required';
    }
    return newErrors;
  };

  // ── Device fingerprint (for session tracking) ───────────────────────────────
  const generateDeviceFingerprint = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'alphabetic';
    ctx.font = '14px Arial';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('SmartCampus', 2, 15);
    return canvas.toDataURL().slice(0, 50);
  };

  // ── Submit local login ───────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    try {
      setSubmitting(true);
      const deviceFingerprint = generateDeviceFingerprint();
      const res = await api.post('/auth/login', {
        email: form.email,
        password: form.password,
        deviceFingerprint,
      });
      await loginWithToken(
        res.data.accessToken,
        res.data.refreshToken,
        res.data.sessionId,
        deviceFingerprint,
      );
      toast.success('Welcome back! 👋');
      navigate('/');
    } catch (error) {
      const data = error.response?.data;
      if (data?.fieldErrors) {
        setErrors(data.fieldErrors);
      } else {
        toast.error(data?.error || 'Login failed. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ── Initiate Google OAuth2 ───────────────────────────────────────────────────
  const handleGoogleLogin = async () => {
    try {
      setGoogleLoading(true);
      // Spring Security handles /oauth2/authorization/google and redirects
      window.location.href = 'http://localhost:8081/oauth2/authorization/google';
    } catch (error) {
      console.error('Failed to initiate Google login', error);
      toast.error('Unable to start Google login');
      setGoogleLoading(false);
    }
  };

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const inputStyle = (field) => ({
    ...styles.input,
    ...(errors[field] ? styles.inputError : {}),
    ...(focusedField === field && !errors[field]
      ? { borderColor: '#6366f1', boxShadow: '0 0 0 3px rgba(99,102,241,0.25)' }
      : {}),
  });

  const oauthErrorMessage = oauthError === 'account_deactivated'
    ? 'Your account has been deactivated. Please contact an administrator.'
    : oauthError
    ? 'Google sign-in failed. Please try again.'
    : null;

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {/* Logo */}
        <div style={styles.logo}>
          <div style={styles.logoIcon}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="#fff" strokeWidth="2" strokeLinejoin="round"/>
              <path d="M2 17l10 5 10-5" stroke="#fff" strokeWidth="2" strokeLinejoin="round"/>
              <path d="M2 12l10 5 10-5" stroke="#fff" strokeWidth="2" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 style={styles.title}>Smart Campus Hub</h1>
          <p style={styles.subtitle}>Sign in to your account</p>
        </div>

        {/* OAuth error banner */}
        {oauthErrorMessage && (
          <div style={styles.errorBanner}>
            ⚠️ {oauthErrorMessage}
          </div>
        )}

        {/* Local login form */}
        <form onSubmit={handleSubmit} noValidate>
          <div style={styles.inputWrap}>
            <label htmlFor="login-email" style={styles.label}>Email address</label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(e) => { setForm({ ...form, email: e.target.value }); setErrors(p => ({ ...p, email: '' })); }}
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField(null)}
              style={inputStyle('email')}
              placeholder="you@example.com"
            />
            {errors.email && <p style={styles.errorText}>{errors.email}</p>}
          </div>

          <div style={styles.inputWrap}>
            <label htmlFor="login-password" style={styles.label}>Password</label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              value={form.password}
              onChange={(e) => { setForm({ ...form, password: e.target.value }); setErrors(p => ({ ...p, password: '' })); }}
              onFocus={() => setFocusedField('password')}
              onBlur={() => setFocusedField(null)}
              style={inputStyle('password')}
              placeholder="••••••••"
            />
            {errors.password && <p style={styles.errorText}>{errors.password}</p>}
          </div>

          <button
            id="btn-sign-in"
            type="submit"
            disabled={submitting}
            style={{
              ...styles.btnPrimary,
              opacity: submitting ? 0.7 : 1,
              cursor: submitting ? 'not-allowed' : 'pointer',
            }}
            onMouseOver={(e) => { if (!submitting) e.target.style.opacity = '0.9'; }}
            onMouseOut={(e) => { e.target.style.opacity = submitting ? '0.7' : '1'; }}
          >
            {submitting ? '⏳ Signing in…' : 'Sign in'}
          </button>
        </form>

        {/* Divider */}
        <div style={styles.divider}>
          <div style={styles.dividerLine} />
          <span>or continue with</span>
          <div style={styles.dividerLine} />
        </div>

        {/* Google OAuth2 button */}
        <button
          id="btn-google-signin"
          onClick={handleGoogleLogin}
          disabled={googleLoading}
          style={{
            ...styles.btnGoogle,
            opacity: googleLoading ? 0.7 : 1,
            cursor: googleLoading ? 'not-allowed' : 'pointer',
          }}
          onMouseOver={(e) => {
            if (!googleLoading) {
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.25)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.boxShadow = styles.btnGoogle.boxShadow;
            e.currentTarget.style.transform = 'none';
          }}
        >
          <GoogleLogo />
          {googleLoading ? 'Redirecting…' : 'Sign in with Google'}
        </button>

        {/* Footer */}
        <p style={styles.footer}>
          Don't have an account?{' '}
          <Link to="/register" style={styles.link}>Create one</Link>
        </p>
      </div>
    </div>
  );
}
