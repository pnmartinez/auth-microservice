import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useSearchParams } from 'react-router-dom';
import { useMsal } from '@azure/msal-react';
import { AuthProvider } from './contexts/AuthContext';
import Login from './components/Login/Login';
import Register from './components/Register/Register';
import PasswordReset from './components/PasswordReset/PasswordReset';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './components/Dashboard';
import api from './services/api';

function AuthCallback() {
  const [searchParams] = useSearchParams();
  const error = searchParams.get('error');
  const [status, setStatus] = React.useState<'processing' | 'error'>('processing');
  const [message, setMessage] = React.useState('Processing authentication...');

  useEffect(() => {
    if (error) {
      setStatus('error');
      setMessage(error);
      return;
    }

    const finalizeLogin = async () => {
      try {
        const response = await api.post('/auth/refresh');
        const token = response.data.accessToken;

        if (token) {
          localStorage.setItem('accessToken', token);
          window.location.href = '/dashboard';
        } else {
          throw new Error('Access token missing from response');
        }
      } catch (err: any) {
        const errorMessage = err?.response?.data?.error || 'Authentication failed. Please login again.';
        setStatus('error');
        setMessage(errorMessage);
      }
    };

    finalizeLogin();
  }, [error]);

  if (status === 'error') {
    return <div>{message}</div>;
  }

  return <div>{message}</div>;
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
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', textAlign: 'center' }}>
      {status === 'loading' && <p>Verifying email...</p>}
      {status === 'success' && (
        <>
          <h2>Email Verified!</h2>
          <p>{message}</p>
          <a href="/login" style={{ color: '#007bff', textDecoration: 'none' }}>
            Go to Login
          </a>
        </>
      )}
      {status === 'error' && (
        <>
          <h2>Verification Failed</h2>
          <p>{message}</p>
          <a href="/login" style={{ color: '#007bff', textDecoration: 'none' }}>
            Go to Login
          </a>
        </>
      )}
    </div>
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

