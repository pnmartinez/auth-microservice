import { useEffect, useState } from 'react';
import Layout from './Layout';
import api from '../services/api';

interface LoginAttempt {
  id: string;
  email: string;
  ip_address: string;
  success: boolean;
  created_at: string;
}

type FilterState = 'all' | 'success' | 'failed';

export default function LoginAttempts() {
  const [attempts, setAttempts] = useState<LoginAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [emailFilter, setEmailFilter] = useState('');
  const [filterState, setFilterState] = useState<FilterState>('all');

  useEffect(() => {
    loadAttempts();
  }, [page, emailFilter]);

  const loadAttempts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '40',
        ...(emailFilter && { email: emailFilter }),
      });
      const response = await api.get(`/admin/login-attempts?${params.toString()}`);
      setAttempts(response.data.attempts);
      setTotalPages(response.data.pagination.totalPages);
    } catch (error) {
      console.error('Failed to load login attempts:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAttempts = attempts.filter((attempt) => {
    if (filterState === 'success') {
      return attempt.success;
    }
    if (filterState === 'failed') {
      return !attempt.success;
    }
    return true;
  });

  return (
    <Layout title="Login attempts" subtitle="Investigate unusual or failed sign-ins in real time">
      <div className="card" style={{ marginBottom: '20px', display: 'grid', gap: '12px', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        <input
          className="input"
          placeholder="Filter by email"
          value={emailFilter}
          onChange={(e) => {
            setEmailFilter(e.target.value);
            setPage(1);
          }}
        />
        <select
          className="input"
          value={filterState}
          onChange={(e) => {
            setFilterState(e.target.value as FilterState);
          }}
        >
          <option value="all">All attempts</option>
          <option value="success">Only successful</option>
          <option value="failed">Only failed</option>
        </select>
      </div>

      <div className="card table-wrapper">
        {loading ? (
          'Loading attempts…'
        ) : filteredAttempts.length === 0 ? (
          <p>No attempts match the current filters.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Email</th>
                <th>Status</th>
                <th>IP address</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {filteredAttempts.map((attempt) => (
                <tr key={attempt.id}>
                  <td>{attempt.email}</td>
                  <td>
                    <span className={`badge ${attempt.success ? 'badge-success' : 'badge-danger'}`}>
                      {attempt.success ? 'Success' : 'Failed'}
                    </span>
                  </td>
                  <td>{attempt.ip_address || 'N/A'}</td>
                  <td>{new Date(attempt.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="pagination">
        <button className="btn btn-ghost" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
          Previous
        </button>
        <span>
          Page {page} of {totalPages}
        </span>
        <button
          className="btn btn-ghost"
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
        >
          Next
        </button>
      </div>
    </Layout>
  );
}

