import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div style={{ maxWidth: '800px', margin: '50px auto', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1>Dashboard</h1>
        <button
          onClick={handleLogout}
          style={{
            padding: '8px 16px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Logout
        </button>
      </div>
      <div style={{ backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '8px' }}>
        <h2>Welcome, {user?.email}!</h2>
        <p>Email Verified: {user?.emailVerified ? 'Yes' : 'No'}</p>
        <p>User ID: {user?.id}</p>
      </div>
      <div style={{ marginTop: '20px' }}>
        <a href="/admin" style={{ color: '#007bff', textDecoration: 'none' }}>
          Go to Admin Panel
        </a>
      </div>
    </div>
  );
}

