import React from 'react';
import { NavLink } from 'react-router-dom';
import { clearSession } from '../services/auth';
import './Sidebar.css';

const NAV_ITEMS = [
  { to: '/dashboard', emoji: '📊', label: 'Dashboard' },
  { to: '/comunicacao', emoji: '📢', label: 'Comunicação' },
  { to: '/malotes', emoji: '📦', label: 'Malotes' },
  { to: '/admin', emoji: '🛡️', label: 'Admin' },
];

const Sidebar: React.FC = () => {

  const handleLogout = async () => {
    await clearSession();
    window.location.href = '/login';
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <span className="sidebar-logo-icon">⚜️</span>
        <div>
          <div className="sidebar-logo-name">ScoutLink</div>
          <div className="sidebar-logo-sub">Painel Administrativo</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-nav-label">MENU PRINCIPAL</div>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `sidebar-nav-item${isActive ? ' active' : ''}`
            }
          >
            <span className="nav-icon">{item.emoji}</span>
            <span className="nav-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <div className="sidebar-divider" />
        <button className="sidebar-nav-item sidebar-logout" onClick={handleLogout} style={{ justifyContent: 'center' }}>
          🚪 Sair do Sistema
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
