import React, { useState, useEffect } from 'react';
import api from '../services/api';

interface User {
  id: string;
  email: string;
  email_verified: boolean;
  azure_id: string | null;
  created_at: string;
  last_login: string | null;
  is_active: boolean;
}

export default function UsersTable() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadUsers();
  }, [page, search]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(search && { search }),
      });
      const response = await api.get(`/admin/users?${params}`);
      setUsers(response.data.users);
      setTotalPages(response.data.pagination.totalPages);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      await api.patch(`/admin/users/${userId}`, { is_active: !currentStatus });
      loadUsers();
    } catch (error) {
      console.error('Failed to update user:', error);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>Users Management</h1>
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Search by email..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          style={{ padding: '8px', width: '300px', marginRight: '10px' }}
        />
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: '#f8f9fa' }}>
            <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #dee2e6' }}>Email</th>
            <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #dee2e6' }}>Verified</th>
            <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #dee2e6' }}>Active</th>
            <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #dee2e6' }}>Created</th>
            <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #dee2e6' }}>Last Login</th>
            <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #dee2e6' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td style={{ padding: '10px', border: '1px solid #dee2e6' }}>{user.email}</td>
              <td style={{ padding: '10px', border: '1px solid #dee2e6' }}>
                {user.email_verified ? '✓' : '✗'}
              </td>
              <td style={{ padding: '10px', border: '1px solid #dee2e6' }}>
                {user.is_active ? '✓' : '✗'}
              </td>
              <td style={{ padding: '10px', border: '1px solid #dee2e6' }}>
                {new Date(user.created_at).toLocaleDateString()}
              </td>
              <td style={{ padding: '10px', border: '1px solid #dee2e6' }}>
                {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
              </td>
              <td style={{ padding: '10px', border: '1px solid #dee2e6' }}>
                <button
                  onClick={() => toggleUserStatus(user.id, user.is_active)}
                  style={{
                    padding: '5px 10px',
                    backgroundColor: user.is_active ? '#dc3545' : '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  {user.is_active ? 'Deactivate' : 'Activate'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginTop: '20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          style={{ padding: '8px 16px', cursor: page === 1 ? 'not-allowed' : 'pointer' }}
        >
          Previous
        </button>
        <span>
          Page {page} of {totalPages}
        </span>
        <button
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
          style={{ padding: '8px 16px', cursor: page === totalPages ? 'not-allowed' : 'pointer' }}
        >
          Next
        </button>
      </div>
    </div>
  );
}

