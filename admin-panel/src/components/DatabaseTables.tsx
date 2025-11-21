import React, { useState, useEffect } from 'react';
import api from '../services/api';

const TABLES = ['users', 'email_verifications', 'password_resets', 'refresh_tokens', 'login_attempts'];

export default function DatabaseTables() {
  const [selectedTable, setSelectedTable] = useState('users');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadTableData();
  }, [selectedTable, page]);

  const loadTableData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
      });
      const response = await api.get(`/admin/tables/${selectedTable}?${params}`);
      setData(response.data.data);
      setTotalPages(response.data.pagination.totalPages);
    } catch (error) {
      console.error('Failed to load table data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  const columns = data.length > 0 ? Object.keys(data[0]) : [];

  return (
    <div style={{ padding: '20px' }}>
      <h1>Database Tables</h1>
      <div style={{ marginBottom: '20px' }}>
        <label>
          Select Table:
          <select
            value={selectedTable}
            onChange={(e) => {
              setSelectedTable(e.target.value);
              setPage(1);
            }}
            style={{ padding: '8px', marginLeft: '10px', width: '200px' }}
          >
            {TABLES.map((table) => (
              <option key={table} value={table}>
                {table}
              </option>
            ))}
          </select>
        </label>
      </div>

      {data.length > 0 ? (
        <>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa' }}>
                  {columns.map((col) => (
                    <th
                      key={col}
                      style={{
                        padding: '8px',
                        textAlign: 'left',
                        border: '1px solid #dee2e6',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row, idx) => (
                  <tr key={idx}>
                    {columns.map((col) => (
                      <td
                        key={col}
                        style={{
                          padding: '8px',
                          border: '1px solid #dee2e6',
                          maxWidth: '200px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                        title={String(row[col])}
                      >
                        {typeof row[col] === 'boolean'
                          ? row[col]
                            ? 'true'
                            : 'false'
                          : row[col]?.toString().substring(0, 50) || 'null'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
        </>
      ) : (
        <p>No data available</p>
      )}
    </div>
  );
}

