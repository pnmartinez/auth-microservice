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
    <div className="user-dashboard">
      <div className="user-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <p className="eyebrow">Workspace</p>
            <h1 style={{ margin: 0 }}>Welcome back</h1>
            <p className="stat-sub">You are logged in as {user?.email}</p>
          </div>
          <button className="btn btn-ghost" onClick={handleLogout}>
            Logout
          </button>
        </div>

        <div style={{ marginTop: 32, display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
          <div>
            <p className="stat-sub">Email status</p>
            <span className={`badge ${user?.emailVerified ? 'badge-success' : 'badge-muted'}`}>
              {user?.emailVerified ? 'Verified' : 'Pending'}
            </span>
          </div>
          <div>
            <p className="stat-sub">User ID</p>
            <p style={{ margin: 0, fontWeight: 600 }}>{user?.id}</p>
          </div>
        </div>

        <div style={{ marginTop: 32 }}>
          <a href="/admin" className="btn btn-primary">
            Go to admin console
          </a>
        </div>
      </div>
    </div>
  );
}

