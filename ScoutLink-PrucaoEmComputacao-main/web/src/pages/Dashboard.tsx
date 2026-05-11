import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import './Dashboard.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface DashStats {
  notificacoes: number;
  chamados_abertos: number;
  malotes_aguardando: number;
  uels: number;
}

const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashStats>({
    notificacoes: 0,
    chamados_abertos: 0,
    malotes_aguardando: 0,
    uels: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/api/notificacoes/`).then(r => r.json()).catch(() => []),
      fetch(`${API_URL}/api/chamados/?status=aberto`).then(r => r.json()).catch(() => []),
      fetch(`${API_URL}/api/malotes/?status=aguardando_retirada`).then(r => r.json()).catch(() => []),
      fetch(`${API_URL}/api/uels/`).then(r => r.json()).catch(() => []),
    ]).then(([notifs, chamados, malotes, uels]) => {
      setStats({
        notificacoes: Array.isArray(notifs) ? notifs.length : 0,
        chamados_abertos: Array.isArray(chamados) ? chamados.length : 0,
        malotes_aguardando: Array.isArray(malotes) ? malotes.length : 0,
        uels: Array.isArray(uels) ? uels.length : 0,
      });
      setLoading(false);
    });
  }, []);

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h1>📊 Dashboard</h1>
        <p>Visão geral do ScoutLink — Escritório Regional do DF</p>
      </div>

      <div className="dash-stats">
        <NavLink to="/comunicacao" className="dash-stat-card" style={{ textDecoration: 'none' }}>
          <div className="dash-stat-icon notif">📢</div>
          <div className="dash-stat-info">
            <div className="dash-stat-value">{loading ? '...' : stats.notificacoes}</div>
            <div className="dash-stat-label">Notificações</div>
          </div>
        </NavLink>
        <NavLink to="/malotes" className="dash-stat-card" style={{ textDecoration: 'none' }}>
          <div className="dash-stat-icon malote">📦</div>
          <div className="dash-stat-info">
            <div className="dash-stat-value">{loading ? '...' : stats.malotes_aguardando}</div>
            <div className="dash-stat-label">Malotes Pendentes</div>
          </div>
        </NavLink>
        <div className="dash-stat-card">
          <div className="dash-stat-icon uel">⚜️</div>
          <div className="dash-stat-info">
            <div className="dash-stat-value">{loading ? '...' : stats.uels}</div>
            <div className="dash-stat-label">UELs Cadastradas</div>
          </div>
        </div>
      </div>

      <div className="dash-modules">
        <h2>Módulos Ativos</h2>
        <div className="dash-module-grid">
          <NavLink to="/comunicacao" className="dash-module-card">
            <div className="module-emoji">📢</div>
            <div className="module-name">Comunicação</div>
            <div className="module-desc">Disparo de notificações por perfil e UEL</div>
            <div className="module-status active">● Ativo</div>
          </NavLink>
          <NavLink to="/malotes" className="dash-module-card">
            <div className="module-emoji">📦</div>
            <div className="module-name">Malotes</div>
            <div className="module-desc">Gestão de pacotes para retirada no ER</div>
            <div className="module-status active">● Ativo</div>
          </NavLink>
          <NavLink to="/admin" className="dash-module-card">
            <div className="module-emoji">🛡️</div>
            <div className="module-name">Admin</div>
            <div className="module-desc">Gerenciamento de permissões administrativas</div>
            <div className="module-status active">● Ativo</div>
          </NavLink>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
