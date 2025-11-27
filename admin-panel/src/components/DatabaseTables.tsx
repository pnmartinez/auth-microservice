import { useEffect, useState } from 'react';
import api from '../services/api';
import Layout from './Layout';

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

  const columns = data.length > 0 ? Object.keys(data[0]) : [];

  return (
    <Layout title="Database tables" subtitle="Peek into whitelisted tables without leaving the browser">
      <div className="card" style={{ marginBottom: '20px' }}>
        <span className="stat-sub">Select table</span>
        <div
          style={{
            marginTop: '12px',
            display: 'flex',
            gap: '10px',
            overflowX: 'auto',
            paddingBottom: '4px',
          }}
        >
          {TABLES.map((table) => {
            const active = table === selectedTable;
            return (
              <button
                key={table}
                type="button"
                className={`btn ${active ? 'btn-primary' : 'btn-ghost'}`}
                style={{ whiteSpace: 'nowrap' }}
                onClick={() => {
                  setSelectedTable(table);
                  setPage(1);
                }}
              >
                {table.replace('_', ' ')}
              </button>
            );
          })}
        </div>
      </div>

      <div className="card table-wrapper" style={{ fontSize: '0.85rem' }}>
        {loading ? (
          'Loading records…'
        ) : data.length === 0 ? (
          <p>No records for this table.</p>
        ) : (
          <table>
            <thead>
              <tr>
                {columns.map((col) => (
                  <th key={col}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, idx) => (
                <tr key={idx}>
                  {columns.map((col) => (
                    <td key={col} title={String(row[col])}>
                      {typeof row[col] === 'boolean'
                        ? row[col]
                          ? 'true'
                          : 'false'
                        : row[col]?.toString() ?? 'null'}
                    </td>
                  ))}
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

