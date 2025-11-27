import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import AuthLayout from '../AuthLayout';

export default function PasswordReset() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.post('/auth/password-reset', { email });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to request password reset');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      await api.post('/auth/password-reset/confirm', { token, password });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (success && !token) {
    return (
      <AuthLayout title="Check your inbox">
        <p className="stat-sub">We sent password reset instructions to {email || 'your email'}.</p>
      </AuthLayout>
    );
  }

  if (success && token) {
    return (
      <AuthLayout title="Password updated">
        <p className="stat-sub">Your password is now updated. You can sign in with your new credentials.</p>
        <a href="/login" className="link">
          Go to login
        </a>
      </AuthLayout>
    );
  }

  if (token) {
    return (
      <AuthLayout title="Choose a new password">
        <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label className="stat-sub" htmlFor="password">
              New password
            </label>
            <input
              id="password"
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>
          <div>
            <label className="stat-sub" htmlFor="confirmPassword">
              Confirm new password
            </label>
            <input
              id="confirmPassword"
              className="input"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="error-text">{error}</p>}
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Updating…' : 'Reset password'}
          </button>
        </form>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Forgot password?" subtitle="We’ll email you a secure link to create a new one">
      <form onSubmit={handleRequestReset} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
        {error && <p className="error-text">{error}</p>}
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Sending link…' : 'Send reset link'}
        </button>
      </form>
      <div style={{ marginTop: 16, textAlign: 'center' }}>
        <a href="/login" className="link">
          Back to login
        </a>
      </div>
    </AuthLayout>
  );
}

