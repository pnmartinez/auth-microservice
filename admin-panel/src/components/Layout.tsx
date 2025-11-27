import { ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import api from '../services/api';

interface LayoutProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}

const navLinks = [
  { label: 'Overview', to: '/dashboard', emoji: '📊' },
  { label: 'Users', to: '/admin/users', emoji: '👥' },
  { label: 'Tokens', to: '/admin/tokens', emoji: '🔐' },
  { label: 'Login Attempts', to: '/admin/login-attempts', emoji: '🛡️' },
  { label: 'Tables', to: '/admin/tables', emoji: '🗃️' },
];

export default function Layout({ title, subtitle, actions, children }: LayoutProps) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore
    }
    localStorage.removeItem('accessToken');
    navigate('/login');
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="logo">Auto Microservice Admin</div>
        <nav className="nav-links">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            >
              <span>{link.emoji}</span>
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>
        <button type="button" className="logout-button" onClick={handleLogout}>
          Sign out
        </button>
      </aside>
      <section className="main-area">
        <div className="page-header">
          <div>
            <p className="eyebrow">Control Room</p>
            <h1>{title}</h1>
            {subtitle && <p>{subtitle}</p>}
          </div>
          {actions}
        </div>
        <div>{children}</div>
      </section>
    </div>
  );
}

