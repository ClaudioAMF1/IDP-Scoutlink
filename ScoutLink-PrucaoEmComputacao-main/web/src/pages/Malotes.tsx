import React, { useEffect, useState } from 'react';
import './Malotes.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface UELOption {
  id: number;
  nome: string;
}

interface MaloteItem {
  id: number;
  uel_id: number;
  uel_nome: string | null;
  tipo: string;
  descricao: string | null;
  status: string;
  data_registro: string;
  data_retirada: string | null;
}

const TIPO_LABELS: Record<string, { emoji: string; label: string }> = {
  certificado: { emoji: '📜', label: 'Certificado de Conclusão' },
  distintivo_regional: { emoji: '🏅', label: 'Distintivo Regional' },
  distintivo_nacional: { emoji: '🎖️', label: 'Distintivo Nacional' },
  registro_escoteiro: { emoji: '📋', label: 'Registro Escoteiro' },
  condecoracao: { emoji: '🏆', label: 'Condecoração' },
  reconhecimento_ramo: { emoji: '⭐', label: 'Reconhecimento de Ramo' },
  outros: { emoji: '📦', label: 'Outros' },
};

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  aguardando_retirada: { label: 'Aguardando Retirada', className: 'aguardando' },
  retirado: { label: 'Retirado', className: 'retirado' },
};

function timeAgo(iso: string) {
  const dIso = iso.endsWith('Z') || iso.includes('+') ? iso : iso + 'Z';
  const diff = Date.now() - new Date(dIso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'agora';
  if (mins < 60) return `${mins}min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
}

function formatDate(iso: string) {
  const dIso = iso.endsWith('Z') || iso.includes('+') ? iso : iso + 'Z';
  return new Date(dIso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    timeZone: 'America/Sao_Paulo',
  });
}

const MalotesPage: React.FC = () => {
  const [malotes, setMalotes] = useState<MaloteItem[]>([]);
  const [uels, setUels] = useState<UELOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [tipoFilter, setTipoFilter] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  // Create modal
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ uel_id: '', tipo: 'certificado', descricao: '' });
  const [creating, setCreating] = useState(false);

  // Delete
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<MaloteItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const triggerRefresh = () => setRefreshKey(k => k + 1);

  // Load UELs
  useEffect(() => {
    fetch(`${API_URL}/api/uels/`)
      .then(r => r.json())
      .then(setUels)
      .catch(() => {});
  }, []);

  // Load malotes
  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.set('status', statusFilter);
    if (tipoFilter) params.set('tipo', tipoFilter);
    fetch(`${API_URL}/api/malotes/?${params}`)
      .then(r => r.json())
      .then(setMalotes)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [statusFilter, tipoFilter, refreshKey]);

  const handleCreate = async () => {
    if (!createForm.uel_id) return;
    setCreating(true);
    try {
      const payload: any = {
        uel_id: Number(createForm.uel_id),
        tipo: createForm.tipo,
      };
      if (createForm.descricao.trim()) payload.descricao = createForm.descricao.trim();
      const res = await fetch(`${API_URL}/api/malotes/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Erro ao criar malote');
      setShowCreate(false);
      setCreateForm({ uel_id: '', tipo: 'certificado', descricao: '' });
      triggerRefresh();
    } catch { /* silent */ }
    setCreating(false);
  };

  const handleStatusChange = async (maloteId: number, newStatus: string) => {
    try {
      await fetch(`${API_URL}/api/malotes/${maloteId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      triggerRefresh();
    } catch { /* silent */ }
  };

  const handleDelete = async () => {
    if (!showDeleteConfirm) return;
    setDeleting(true);
    try {
      await fetch(`${API_URL}/api/malotes/${showDeleteConfirm.id}`, { method: 'DELETE' });
      setShowDeleteConfirm(null);
      triggerRefresh();
    } catch { /* silent */ }
    setDeleting(false);
  };

  // Stats
  const counts = {
    aguardando: malotes.filter(m => m.status === 'aguardando_retirada').length,
    retirado: malotes.filter(m => m.status === 'retirado').length,
  };

  return (
    <div className="malotes-page">
      {/* Header */}
      <div className="malotes-header">
        <div className="malotes-header-left">
          <h1>📦 Gestão de Malotes</h1>
          <p>Pacotes disponíveis para retirada no Escritório Regional.</p>
        </div>
        <button className="btn-primary" id="btn-novo-malote" onClick={() => setShowCreate(true)}>
          + Novo Malote
        </button>
      </div>

      {/* Stats */}
      <div className="malotes-stats">
        <div className="m-stat-card">
          <div className="m-stat-icon aguardando">⏳</div>
          <div className="m-stat-info">
            <div className="m-stat-value">{counts.aguardando}</div>
            <div className="m-stat-label">Aguardando Retirada</div>
          </div>
        </div>
        <div className="m-stat-card">
          <div className="m-stat-icon retirado">✅</div>
          <div className="m-stat-info">
            <div className="m-stat-value">{counts.retirado}</div>
            <div className="m-stat-label">Retirados</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="malotes-toolbar">
        <div className="toolbar-group">
          {[
            { key: '', label: 'Todos' },
            { key: 'aguardando_retirada', label: '⏳ Aguardando' },
            { key: 'retirado', label: '✅ Retirado' },
          ].map(f => (
            <button
              key={f.key}
              className={`m-filter-chip${statusFilter === f.key ? ' active' : ''}`}
              onClick={() => setStatusFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="toolbar-separator" />
        <div className="toolbar-group">
          {[
            { key: '', label: 'Todos os tipos' },
            ...Object.entries(TIPO_LABELS).map(([key, val]) => ({
              key,
              label: `${val.emoji} ${val.label}`,
            })),
          ].map(f => (
            <button
              key={f.key}
              className={`m-filter-chip${tipoFilter === f.key ? ' active' : ''}`}
              onClick={() => setTipoFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="malotes-loading">Carregando malotes...</div>
      ) : malotes.length === 0 ? (
        <div className="malotes-table-wrap">
          <div className="malotes-empty">
            <div className="empty-icon">📭</div>
            <p>Nenhum malote encontrado.</p>
          </div>
        </div>
      ) : (
        <div className="malotes-table-wrap">
          <table className="malotes-table" id="malotes-table">
            <thead>
              <tr>
                <th>#</th>
                <th>UEL</th>
                <th>Tipo</th>
                <th>Descrição</th>
                <th>Status</th>
                <th>Registrado</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {malotes.map(m => {
                const tipo = TIPO_LABELS[m.tipo] || { emoji: '📦', label: m.tipo };
                const st = STATUS_LABELS[m.status] || { label: m.status, className: '' };
                return (
                  <tr key={m.id}>
                    <td style={{ fontWeight: 700, color: 'var(--text-muted)' }}>#{m.id}</td>
                    <td style={{ fontWeight: 600 }}>⚜️ {m.uel_nome || `UEL #${m.uel_id}`}</td>
                    <td>
                      <span className={`tipo-badge ${m.tipo}`}>
                        {tipo.emoji} {tipo.label}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {m.descricao || '—'}
                    </td>
                    <td>
                      <span className={`m-status-chip ${st.className}`}>
                        {st.label}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>{formatDate(m.data_registro)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {m.status === 'aguardando_retirada' && (
                          <button
                            className="action-btn confirm"
                            onClick={() => handleStatusChange(m.id, 'retirado')}
                            title="Marcar como Retirado"
                          >
                            ✅ Retirado
                          </button>
                        )}
                        <button
                          className="action-btn delete"
                          onClick={() => setShowDeleteConfirm(m)}
                          title="Excluir"
                        >
                          🗑
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📦 Novo Malote</h2>
              <button className="modal-close" onClick={() => setShowCreate(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>UEL destinatária *</label>
                <select
                  id="select-malote-uel"
                  value={createForm.uel_id}
                  onChange={e => setCreateForm(f => ({ ...f, uel_id: e.target.value }))}
                >
                  <option value="">Selecione a UEL</option>
                  {uels.map(u => (
                    <option key={u.id} value={u.id}>⚜️ {u.nome}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Tipo de Malote *</label>
                <select
                  id="select-malote-tipo"
                  value={createForm.tipo}
                  onChange={e => setCreateForm(f => ({ ...f, tipo: e.target.value }))}
                >
                  {Object.entries(TIPO_LABELS).map(([key, val]) => (
                    <option key={key} value={key}>
                      {val.emoji} {val.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Descrição (opcional)</label>
                <textarea
                  id="input-malote-descricao"
                  placeholder="O que contém o malote..."
                  value={createForm.descricao}
                  onChange={e => setCreateForm(f => ({ ...f, descricao: e.target.value }))}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-ghost" onClick={() => setShowCreate(false)}>Cancelar</button>
              <button
                className="btn-primary"
                id="btn-submit-malote"
                disabled={creating || !createForm.uel_id}
                onClick={handleCreate}
              >
                {creating ? 'Salvando...' : 'Criar Malote'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <h2>⚠️ Confirmar Exclusão</h2>
              <button className="modal-close" onClick={() => setShowDeleteConfirm(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Tem certeza que deseja excluir o malote <strong>#{showDeleteConfirm.id}</strong> da UEL <strong>{showDeleteConfirm.uel_nome}</strong>?
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn-ghost" onClick={() => setShowDeleteConfirm(null)}>Cancelar</button>
              <button
                className="btn-primary"
                style={{ background: '#dc3545', boxShadow: '0 2px 8px rgba(220,53,69,0.35)' }}
                disabled={deleting}
                onClick={handleDelete}
              >
                {deleting ? 'Excluindo...' : '🗑 Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MalotesPage;
