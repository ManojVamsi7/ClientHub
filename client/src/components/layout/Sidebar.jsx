import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { 
  LayoutDashboard, 
  Users, 
  MessageSquare, 
  PhoneCall, 
  AlertTriangle, 
  LogOut, 
  Activity,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const Sidebar = ({ isOpen, isCollapsed, onClose, onToggleCollapse }) => {
  const { user, logout } = useAuth();

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/clients', label: 'Clients', icon: Users },
    { to: '/queries', label: 'Queries', icon: MessageSquare },
    { to: '/interviews', label: 'Interviews', icon: PhoneCall },
    { to: '/mistakes', label: 'Mistakes', icon: AlertTriangle },
  ];

  const handleLogout = () => {
    logout();
    if (onClose) onClose();
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <aside className={`app-sidebar ${isOpen ? 'sidebar-open' : ''} ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
      {/* Header / Logo */}
      <div className="sidebar-header">
        <div className="logo-container">
          <Activity size={20} />
        </div>
        {!isCollapsed && <span className="logo-text">ClientHub</span>}
      </div>

      {/* Nav items */}
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              end={item.to === '/'}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon size={18} className="nav-icon" />
              {!isCollapsed && <span>{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        {user && !isCollapsed && (
          <div className="user-profile">
            <div className="user-avatar">
              {getInitials(user.username)}
            </div>
            <div className="user-details">
              <span className="user-name">{user.username}</span>
              <span className="user-role">{user.role}</span>
            </div>
          </div>
        )}
        {user && isCollapsed && (
          <div className="user-profile" style={{ justifyContent: 'center', padding: '8px 0' }}>
            <div className="user-avatar" title={user.username}>
              {getInitials(user.username)}
            </div>
          </div>
        )}
        <button onClick={handleLogout} className={`logout-btn ${isCollapsed ? 'logout-btn-icon' : ''}`} title="Log Out">
          <LogOut size={16} />
          {!isCollapsed && <span>Log Out</span>}
        </button>

        {/* Desktop collapse toggle */}
        <button
          onClick={onToggleCollapse}
          className="sidebar-collapse-btn"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          {!isCollapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
