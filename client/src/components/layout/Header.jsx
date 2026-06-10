import React from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Menu, User } from 'lucide-react';

const Header = ({ onMenuToggle }) => {
  const location = useLocation();
  const params = useParams();
  const { user } = useAuth();

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Dashboard';
    if (path === '/clients') return 'Clients';
    if (path.startsWith('/clients/') && params.id) return 'Client Details';
    if (path === '/queries') return 'Queries';
    if (path === '/interviews') return 'Interviews';
    if (path === '/mistakes') return 'Recruiter QA & Mistakes';
    return 'ClientHub';
  };

  return (
    <header className="app-header">
      <div className="header-title-area">
        <button onClick={onMenuToggle} className="menu-toggle" aria-label="Toggle Menu">
          <Menu size={24} />
        </button>
        <h1 className="page-title">{getPageTitle()}</h1>
      </div>

      <div className="header-actions">
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="user-role-badge" style={{
              fontSize: '0.75rem',
              padding: '4px 8px',
              borderRadius: '9999px',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              color: 'var(--accent-blue)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              fontWeight: 600,
              textTransform: 'capitalize'
            }}>
              {user.role}
            </span>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
