import React, { useEffect, useState } from 'react';
import { getSession } from '../services/auth';
import './GerenciamentoAdmin.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface AdminUser {
  id: number;
  supabase_user_id: string;
  email: string;
  full_name: string | null;
  is_admin: boolean;
  perfil_nome: string | null;
  uel_nome: string | null;
}

const GerenciamentoAdminPage: React.FC = () => {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [allUsers, setAllUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [search, setSearch] = useState('');
  const [toggling, setToggling] = useState<number | null>(null);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);

  const triggerRefresh = () => setRefreshKey(k => k + 1);

  useEffect(() => {
    getSession().then(session => {
      if (session?.user?.email) {
        setCurrentUserEmail(session.user.email);
      }
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    fetch(`${API_URL}/api/admin/users`)
      .then(r => r.json())
      .then(setAdmins)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [refreshKey]);

  const loadAllUsers = async () => {
    if (allUsers.length > 0) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/users/all`);
      const data = await res.json();
      setAllUsers(data);
    } catch { /* silent */ }
  };

  const handleToggle = async (userId: number, makeAdmin: boolean) => {
    setToggling(userId);
    try {
      await fetch(`${API_URL}/api/admin/users/${userId}/toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_admin: makeAdmin }),
      });
      triggerRefresh();
      if (!makeAdmin) {
        // Removed admin, refresh all users too
        setAllUsers([]);
      }
    } catch { /* silent */ }
    setToggling(null);
  };

  const nonAdminUsers = allUsers.filter(u => !u.is_admin).filter(u =>
    !search || (u.full_name || u.email).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="admin-page">
      {/* Header */}
      <div className="admin-header">
        <div className="admin-header-left">
          <h1>🛡️ Gerenciamento de Administradores</h1>
          <p>Visualize e gerencie permissões administrativas dos usuários.</p>
        </div>
        <button
          className="btn-primary"
          onClick={() => { setShowAddModal(true); loadAllUsers(); }}
        >
          + Adicionar Admin
        </button>
      </div>

      {/* Stats */}
      <div className="admin-stats">
        <div className="admin-stat-card">
          <div className="admin-stat-icon">🛡️</div>
          <div className="admin-stat-info">
            <div className="admin-stat-value">{admins.length}</div>
            <div className="admin-stat-label">Administradores</div>
          </div>
        </div>
      </div>

      {/* Admin list */}
      {loading ? (
        <div className="admin-loading">Carregando administradores...</div>
      ) : admins.length === 0 ? (
        <div className="admin-empty">
          <div className="empty-icon">👤</div>
          <p>Nenhum administrador cadastrado.</p>
          <p className="admin-hint">O primeiro admin deve ser definido pela equipe de desenvolvimento.</p>
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table" id="admin-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Email</th>
                <th>Perfil</th>
                <th>UEL</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {admins.map(a => (
                <tr key={a.id}>
                  <td style={{ fontWeight: 600 }}>
                    <div className="admin-name-cell">
                      <div className="admin-avatar">
                        {(a.full_name || a.email)[0].toUpperCase()}
                      </div>
                      {a.full_name || 'Sem nome'}
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>{a.email}</td>
                  <td>
                    {a.perfil_nome ? (
                      <span className="perfil-badge">{a.perfil_nome}</span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>—</span>
                    )}
                  </td>
                  <td>
                    {a.uel_nome ? (
                      <span className="uel-badge">⚜️ {a.uel_nome}</span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>—</span>
                    )}
                  </td>
                  <td>
                    {a.email === currentUserEmail ? (
                      <span className="current-user-badge">Você</span>
                    ) : (
                      <button
                        className="remove-admin-btn"
                        disabled={toggling === a.id}
                        onClick={() => handleToggle(a.id, false)}
                      >
                        {toggling === a.id ? '...' : '🚫 Remover Admin'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Admin Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 600 }}>
            <div className="modal-header">
              <h2>➕ Adicionar Administrador</h2>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label>Buscar usuário</label>
                <input
                  type="text"
                  placeholder="Nome ou email..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>

              {nonAdminUsers.length === 0 ? (
                <div className="admin-modal-empty">
                  {allUsers.length === 0 ? 'Carregando usuários...' : 'Nenhum usuário encontrado.'}
                </div>
              ) : (
                <div className="admin-user-list">
                  {nonAdminUsers.slice(0, 20).map(u => (
                    <div key={u.id} className="admin-user-item">
                      <div className="admin-user-info">
                        <div className="admin-avatar small">
                          {(u.full_name || u.email)[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="admin-user-name">{u.full_name || 'Sem nome'}</div>
                          <div className="admin-user-email">{u.email}</div>
                        </div>
                      </div>
                      <button
                        className="add-admin-btn"
                        disabled={toggling === u.id}
                        onClick={() => { handleToggle(u.id, true); setShowAddModal(false); setSearch(''); setAllUsers([]); }}
                      >
                        {toggling === u.id ? '...' : '🛡️ Tornar Admin'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GerenciamentoAdminPage;
