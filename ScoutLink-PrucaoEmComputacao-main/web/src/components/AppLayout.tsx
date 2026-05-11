import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/comunicacao': 'Comunicação & Notificações',
  '/taaec': 'TAAEC Digital',
  '/malotes': 'Gestão de Malotes',
  '/chamados': 'Chamados',
};

const AppLayout: React.FC = () => {
  const location = useLocation();
  const title = pageTitles[location.pathname] ?? 'ScoutLink';

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        {/* Topbar */}
        <header className="topbar">
          <div className="topbar-left">
            <span className="topbar-title">{title}</span>
          </div>
          <div className="topbar-right">
            <div className="topbar-notif">
              🔔 <span className="dot" />
            </div>
            <div className="topbar-user">
              <div className="topbar-user-name">Administrador</div>
              <div className="topbar-user-role">Diretor Regional</div>
            </div>
            <div className="topbar-avatar">AD</div>
          </div>
        </header>

        {/* Page Content */}
        <main className="page-body">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
