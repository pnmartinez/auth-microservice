import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import AuthLayout from '../AuthLayout';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleAzureLogin = async () => {
    try {
      const response = await api.get('/auth/azure');
      window.location.href = response.data.authUrl;
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to initiate Azure login');
    }
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Access your Auto Microservice workspace">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label className="stat-sub" htmlFor="email">
            Email address
          </label>
          <input
            id="email"
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label className="stat-sub" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
          />
        </div>
        {error && <p className="error-text">{error}</p>}
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <button
          onClick={handleAzureLogin}
          className="btn btn-ghost"
          style={{ width: '100%', marginTop: 12 }}
        >
          Continue with Azure AD
        </button>

      <div style={{ marginTop: 16, textAlign: 'center' }}>
        <a href="/forgot-password" className="link" style={{ display: 'block', marginBottom: 6 }}>
          Forgot password?
        </a>
        <a href="/register" className="link">
          Create an account
        </a>
      </div>
    </AuthLayout>
  );
}

