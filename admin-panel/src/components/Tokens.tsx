import { useEffect, useMemo, useState } from 'react';
import Layout from './Layout';
import api from '../services/api';

interface RefreshToken {
  id: string;
  email: string;
  token: string;
  created_at: string;
  last_used_at: string | null;
  expires_at: string;
  revoked: boolean;
}

export default function Tokens() {
  const [tokens, setTokens] = useState<RefreshToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [emailFilter, setEmailFilter] = useState('');
  const [showRevoked, setShowRevoked] = useState(false);

  useEffect(() => {
    loadTokens();
  }, [page]);

  const loadTokens = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });
      const response = await api.get(`/admin/tokens?${params.toString()}`);
      setTokens(response.data.tokens);
      setTotalPages(response.data.pagination.totalPages);
    } catch (error) {
      console.error('Failed to load tokens:', error);
    } finally {
      setLoading(false);
    }
  };

  const revokeToken = async (id: string) => {
    try {
      await api.post(`/admin/tokens/${id}/revoke`);
      loadTokens();
    } catch (error) {
      console.error('Failed to revoke token:', error);
    }
  };

  const visibleTokens = useMemo(() => {
    return tokens.filter((token) => {
      if (!showRevoked && token.revoked) return false;
      if (emailFilter && !token.email.toLowerCase().includes(emailFilter.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [tokens, emailFilter, showRevoked]);

  return (
    <Layout title="Refresh tokens" subtitle="Audit and revoke long-lived sessions">
      <div className="card" style={{ marginBottom: '20px', display: 'grid', gap: '12px', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        <input
          className="input"
          placeholder="Filter by email"
          value={emailFilter}
          onChange={(e) => setEmailFilter(e.target.value)}
        />
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="checkbox"
            checked={showRevoked}
            onChange={(e) => setShowRevoked(e.target.checked)}
          />
          Show revoked tokens
        </label>
      </div>

      <div className="card table-wrapper">
        {loading ? (
          'Loading tokens…'
        ) : visibleTokens.length === 0 ? (
          <p>No tokens found with current filters.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Email</th>
                <th>Token</th>
                <th>Issued</th>
                <th>Last used</th>
                <th>Expires</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {visibleTokens.map((token) => (
                <tr key={token.id}>
                  <td>{token.email}</td>
                  <td>{token.token}</td>
                  <td>{new Date(token.created_at).toLocaleString()}</td>
                  <td>{token.last_used_at ? new Date(token.last_used_at).toLocaleString() : 'Never'}</td>
                  <td>{new Date(token.expires_at).toLocaleString()}</td>
                  <td>
                    <span className={`badge ${token.revoked ? 'badge-danger' : 'badge-success'}`}>
                      {token.revoked ? 'Revoked' : 'Active'}
                    </span>
                  </td>
                  <td>
                    {!token.revoked && (
                      <button className="btn btn-ghost" onClick={() => revokeToken(token.id)}>
                        Revoke
                      </button>
                    )}
                  </td>
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

