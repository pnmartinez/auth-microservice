import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Layout from './Layout';

interface Stats {
  users: {
    total: number;
    active: number;
    verified: number;
  };
  sessions: {
    active: number;
  };
  security: {
    failedLoginsLast24h: number;
  };
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await api.get('/admin/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout title="Overview" subtitle="Loading system vitals…">
        <div className="card">Loading...</div>
      </Layout>
    );
  }

  return (
    <Layout title="Overview" subtitle="Monitor usage, sessions and security in one glance">
      <div className="stats-grid">
        <div className="card stat-card">
          <h3>Users</h3>
          <div className="stat-value">{stats?.users.total ?? 0}</div>
          <p className="stat-sub">Active {stats?.users.active ?? 0}</p>
          <p className="stat-sub">Verified {stats?.users.verified ?? 0}</p>
        </div>
        <div className="card stat-card">
          <h3>Sessions</h3>
          <div className="stat-value">{stats?.sessions.active ?? 0}</div>
          <p className="stat-sub">Active refresh tokens</p>
        </div>
        <div className="card stat-card">
          <h3>Security</h3>
          <div className="stat-value">{stats?.security.failedLoginsLast24h ?? 0}</div>
          <p className="stat-sub">Failed logins (24h)</p>
        </div>
      </div>

      <div className="card">
        <h3>Quick actions</h3>
        <p className="stat-sub" style={{ marginBottom: '16px' }}>
          Jump straight into the most frequent tasks.
        </p>
        <div className="button-row">
          <button className="btn btn-primary" onClick={() => navigate('/admin/users')}>
            Manage users
          </button>
          <button className="btn btn-success" onClick={() => navigate('/admin/tokens')}>
            Manage tokens
          </button>
          <button className="btn btn-warning" onClick={() => navigate('/admin/login-attempts')}>
            Login attempts
          </button>
          <button className="btn btn-ghost" onClick={() => navigate('/admin/tables')}>
            Database tables
          </button>
        </div>
      </div>
    </Layout>
  );
}

