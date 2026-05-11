import React, { useEffect, useState } from 'react';
import './Comunicacao.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface UELOption {
  id: number;
  nome: string;
}

interface PerfilOption {
  id: number;
  nome: string;
  descricao: string | null;
}

interface NotificacaoItem {
  id: number;
  titulo: string;
  descricao: string;
  categoria: string;
  data_criacao: string;
  autor_nome: string | null;
  alvo_uel_nome: string | null;
  alvo_perfil_nome: string | null;
}

const CATEGORIAS = [
  { key: 'Evento', label: 'Evento', emoji: '📅' },
  { key: 'Curso', label: 'Curso / Formação', emoji: '📚' },
  { key: 'Noticia', label: 'Notícia Geral', emoji: '📰' },
  { key: 'Malote', label: 'Malote', emoji: '📦' },
];

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

const ComunicacaoPage: React.FC = () => {
  const [uels, setUels] = useState<UELOption[]>([]);
  const [perfis, setPerfis] = useState<PerfilOption[]>([]);
  const [notificacoes, setNotificacoes] = useState<NotificacaoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    titulo: '',
    descricao: '',
    categoria: 'Evento',
    alvo_uel_id: '',
    alvo_perfil_id: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Filter state
  const [filterCat, setFilterCat] = useState('');

  // Load data
  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/api/uels/`).then(r => r.json()).catch(() => []),
      fetch(`${API_URL}/api/perfis/`).then(r => r.json()).catch(() => []),
    ]).then(([u, p]) => {
      setUels(u);
      setPerfis(p);
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterCat) params.set('categoria', filterCat);
    fetch(`${API_URL}/api/notificacoes/?${params}`)
      .then(r => r.json())
      .then(setNotificacoes)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filterCat, refreshKey]);

  const handleSubmit = async () => {
    if (!form.titulo.trim() || !form.descricao.trim()) return;
    setSubmitting(true);
    setStatusMsg(null);

    try {
      const payload: any = {
        titulo: form.titulo.trim(),
        descricao: form.descricao.trim(),
        categoria: form.categoria,
      };
      if (form.alvo_uel_id) payload.alvo_uel_id = Number(form.alvo_uel_id);
      if (form.alvo_perfil_id) payload.alvo_perfil_id = Number(form.alvo_perfil_id);

      const res = await fetch(`${API_URL}/api/notificacoes/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Erro ao enviar');

      setStatusMsg({ type: 'success', text: 'Notificação disparada com sucesso!' });
      setForm({ titulo: '', descricao: '', categoria: 'Evento', alvo_uel_id: '', alvo_perfil_id: '' });
      setShowForm(false);
      setRefreshKey(k => k + 1);
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Erro ao disparar notificação.' });
    }
    setSubmitting(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir esta notificação?')) return;
    try {
      await fetch(`${API_URL}/api/notificacoes/${id}`, { method: 'DELETE' });
      setRefreshKey(k => k + 1);
    } catch { /* silent */ }
  };

  // Stats
  const stats = {
    total: notificacoes.length,
    evento: notificacoes.filter(n => n.categoria === 'Evento').length,
    curso: notificacoes.filter(n => n.categoria === 'Curso').length,
    noticia: notificacoes.filter(n => n.categoria === 'Noticia').length,
    malote: notificacoes.filter(n => n.categoria === 'Malote').length,
  };

  return (
    <div className="comunicacao-page">
      {/* Header */}
      <div className="comunicacao-header">
        <div className="comunicacao-header-left">
          <h1>📢 Comunicação & Notificações</h1>
          <p>Dispare notificações para associados, filtre por UEL e perfil.</p>
        </div>
        <button className="btn-primary" id="btn-nova-notificacao" onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ Fechar' : '+ Nova Notificação'}
        </button>
      </div>

      {/* Stats */}
      <div className="comunicacao-stats">
        <div className="com-stat-card">
          <div className="com-stat-icon total">📊</div>
          <div className="com-stat-info">
            <div className="com-stat-value">{stats.total}</div>
            <div className="com-stat-label">Total</div>
          </div>
        </div>
        <div className="com-stat-card">
          <div className="com-stat-icon evento">📅</div>
          <div className="com-stat-info">
            <div className="com-stat-value">{stats.evento}</div>
            <div className="com-stat-label">Eventos</div>
          </div>
        </div>
        <div className="com-stat-card">
          <div className="com-stat-icon curso">📚</div>
          <div className="com-stat-info">
            <div className="com-stat-value">{stats.curso}</div>
            <div className="com-stat-label">Cursos</div>
          </div>
        </div>
        <div className="com-stat-card">
          <div className="com-stat-icon noticia">📰</div>
          <div className="com-stat-info">
            <div className="com-stat-value">{stats.noticia}</div>
            <div className="com-stat-label">Notícias</div>
          </div>
        </div>
      </div>

      {/* Status message */}
      {statusMsg && (
        <div className={`comunicacao-alert ${statusMsg.type}`}>
          {statusMsg.type === 'success' ? '✅' : '❌'} {statusMsg.text}
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <div className="comunicacao-form-card">
          <h2>Disparar Notificação</h2>

          <div className="form-row">
            <div className="form-group" style={{ flex: 2 }}>
              <label>Título da notificação *</label>
              <input
                type="text"
                placeholder="Ex: Acampamento Regional 2026"
                value={form.titulo}
                onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Tipo de notificação *</label>
              <select
                value={form.categoria}
                onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))}
              >
                {CATEGORIAS.map(c => (
                  <option key={c.key} value={c.key}>{c.emoji} {c.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label>Público alvo (Perfil)</label>
              <select
                value={form.alvo_perfil_id}
                onChange={e => setForm(f => ({ ...f, alvo_perfil_id: e.target.value }))}
              >
                <option value="">Todos os perfis</option>
                {perfis.map(p => (
                  <option key={p.id} value={p.id}>{p.nome}</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>UEL</label>
              <select
                value={form.alvo_uel_id}
                onChange={e => setForm(f => ({ ...f, alvo_uel_id: e.target.value }))}
              >
                <option value="">Todas as UELs</option>
                {uels.map(u => (
                  <option key={u.id} value={u.id}>{u.nome}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Mensagem / Corpo da notificação *</label>
            <textarea
              placeholder="Descreva a notificação..."
              rows={4}
              value={form.descricao}
              onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
            />
          </div>

          <div className="form-actions">
            <button className="btn-ghost" onClick={() => setShowForm(false)}>Cancelar</button>
            <button
              className="btn-primary"
              disabled={submitting || !form.titulo.trim() || !form.descricao.trim()}
              onClick={handleSubmit}
            >
              {submitting ? 'Enviando...' : '📢 Disparar Notificação'}
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="comunicacao-filters">
        {[
          { key: '', label: 'Todas' },
          ...CATEGORIAS.map(c => ({ key: c.key, label: `${c.emoji} ${c.label}` })),
        ].map(f => (
          <button
            key={f.key}
            className={`filter-chip${filterCat === f.key ? ' active' : ''}`}
            onClick={() => setFilterCat(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="comunicacao-loading">Carregando notificações...</div>
      ) : notificacoes.length === 0 ? (
        <div className="comunicacao-empty">
          <div className="empty-icon">📭</div>
          <p>Nenhuma notificação encontrada.</p>
        </div>
      ) : (
        <div className="comunicacao-table-wrap">
          <table className="comunicacao-table" id="notificacoes-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Título</th>
                <th>Categoria</th>
                <th>Público Alvo</th>
                <th>UEL</th>
                <th>Criado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {notificacoes.map(n => {
                const cat = CATEGORIAS.find(c => c.key === n.categoria);
                return (
                  <tr key={n.id}>
                    <td style={{ fontWeight: 700, color: 'var(--text-muted)' }}>#{n.id}</td>
                    <td style={{ fontWeight: 600 }}>{n.titulo}</td>
                    <td>
                      <span className={`cat-badge ${n.categoria.toLowerCase()}`}>
                        {cat?.emoji} {cat?.label || n.categoria}
                      </span>
                    </td>
                    <td>{n.alvo_perfil_nome || 'Todos'}</td>
                    <td>{n.alvo_uel_nome || 'Todas'}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{timeAgo(n.data_criacao)}</td>
                    <td>
                      <button className="delete-btn" onClick={() => handleDelete(n.id)} title="Excluir">🗑</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ComunicacaoPage;
