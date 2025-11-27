import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useSearchParams } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Login from './components/Login/Login';
import Register from './components/Register/Register';
import PasswordReset from './components/PasswordReset/PasswordReset';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './components/Dashboard';
import api from './services/api';
import AuthLayout from './components/AuthLayout';

function AuthCallback() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const error = searchParams.get('error');

  useEffect(() => {
    if (token) {
      localStorage.setItem('accessToken', token);
      window.location.href = '/dashboard';
    } else if (error) {
      window.location.href = `/login?error=${encodeURIComponent(error)}`;
    }
  }, [token, error]);

  return (
    <AuthLayout title="Processing authentication">
      <p className="stat-sub">Please wait while we finalize your session…</p>
    </AuthLayout>
  );
}

function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = React.useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = React.useState('');

  useEffect(() => {
    if (token) {
      api
        .get(`/auth/verify-email?token=${token}`)
        .then(() => {
          setStatus('success');
          setMessage('Email verified successfully!');
        })
        .catch((err) => {
          setStatus('error');
          setMessage(err.response?.data?.error || 'Email verification failed');
        });
    } else {
      setStatus('error');
      setMessage('Verification token is required');
    }
  }, [token]);

  return (
    <AuthLayout title="Email verification">
      {status === 'loading' && <p className="stat-sub">Verifying email…</p>}
      {status === 'success' && (
        <>
          <p className="stat-sub">{message}</p>
          <a href="/login" className="link">
            Go to login
          </a>
        </>
      )}
      {status === 'error' && (
        <>
          <p className="error-text">{message}</p>
          <a href="/login" className="link">
            Go to login
          </a>
        </>
      )}
    </AuthLayout>
  );
}

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<PasswordReset />} />
        <Route path="/reset-password" element={<PasswordReset />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;

