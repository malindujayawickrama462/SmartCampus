import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import toast from 'react-hot-toast';

export default function Login() {
  const navigate = useNavigate();
  const { user, loginWithToken } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleGoogleLogin = async () => {
    try {
      const res = await api.get('/auth/login/google');
      window.location.href = `http://localhost:8081${res.data.url}`;
    } catch (error) {
      console.error('Failed to initiate login', error);
      toast.error('Unable to start Google login');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      toast.error('Email and password are required');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post('/auth/login', { email: form.email, password: form.password });
      await loginWithToken(res.data.token);
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Smart Campus Hub</h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl sm:rounded-lg sm:px-10 border border-gray-100 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring focus:ring-blue-200"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring focus:ring-blue-200"
                required
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-md bg-blue-600 text-white py-2 font-semibold hover:bg-blue-700 disabled:bg-gray-300"
            >
              {submitting ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <button
            onClick={handleGoogleLogin}
            className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Sign in with Google
          </button>

          <p className="text-sm text-gray-500 text-center">
            Don’t have an account? <Link to="/register" className="text-blue-600 hover:underline">Register</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
