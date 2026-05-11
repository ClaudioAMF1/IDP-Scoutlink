import React, { useEffect, useState, useRef } from 'react';
import './Chamados.css';
import { fetchChamados, fetchChamado, updateChamadoStatus, sendMensagem } from '../services/api';
import type { ChamadoListItem, ChamadoDetail } from '../services/api';

const CATEGORY_LABELS: Record<string, { emoji: string; label: string }> = {
  duvida: { emoji: '❓', label: 'Dúvida' },
  evento: { emoji: '📅', label: 'Evento' },
  administrativo: { emoji: '📋', label: 'Administrativo' },
};

const STATUS_LABELS: Record<string, string> = {
  aberto: 'Aberto',
  em_andamento: 'Em andamento',
  resolvido: 'Resolvido',
};

function timeAgo(iso: string) {
  const dIso = iso.endsWith('Z') || iso.includes('+') || (iso.split('-').length > 3) ? iso : iso + 'Z';
  const diff = Date.now() - new Date(dIso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'agora';
  if (mins < 60) return `${mins}min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
}

function formatMsgTime(iso: string) {
  const dIso = iso.endsWith('Z') || iso.includes('+') || (iso.split('-').length > 3) ? iso : iso + 'Z';
  const d = new Date(dIso);
  const now = new Date();
  const timeZone = 'America/Sao_Paulo';
  const time = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone });
  const dDate = d.toLocaleDateString('pt-BR', { timeZone });
  const nowDate = now.toLocaleDateString('pt-BR', { timeZone });
  const sameDay = dDate === nowDate;
  if (sameDay) return time;
  return `${d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone })} ${time}`;
}

const ChamadosPage: React.FC = () => {
  const [chamados, setChamados] = useState<ChamadoListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<ChamadoDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEnd = useRef<HTMLDivElement>(null);
  const [allChamados, setAllChamados] = useState<ChamadoListItem[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadList = async () => {
    try {
      const data = await fetchChamados(filter || undefined);
      setChamados(data);
    } catch (_e) { /* fail silently */ }
    setLoading(false);
  };

  useEffect(() => { setLoading(true); loadList(); }, [filter, refreshKey]);

  // Load unfiltered stats separately — only on refreshKey, not chamados
  useEffect(() => {
    fetchChamados().then(setAllChamados).catch(() => {});
  }, [refreshKey]);

  const triggerRefresh = () => setRefreshKey((k) => k + 1);

  const openDetail = async (id: number) => {
    setSelectedId(id);
    setDetailLoading(true);
    try {
      const d = await fetchChamado(id);
      setDetail(d);
    } catch (_e) { /* fail silently */ }
    setDetailLoading(false);
  };

  // Auto-polling: refresh messages every 3s when detail is open
  useEffect(() => {
    if (!selectedId) return;
    const interval = setInterval(async () => {
      try {
        const updated = await fetchChamado(selectedId);
        setDetail(updated);
      } catch (_e) { /* silent */ }
    }, 3000);
    return () => clearInterval(interval);
  }, [selectedId]);

  const closeDetail = () => { setSelectedId(null); setDetail(null); setReply(''); };

  const handleStatusChange = async (newStatus: string) => {
    if (!detail) return;
    try {
      const updated = await updateChamadoStatus(detail.id, newStatus);
      setDetail(updated);
      triggerRefresh();
    } catch (_e) { /* fail silently */ }
  };

  const handleSendReply = async () => {
    if (!detail || !reply.trim()) return;
    setSending(true);
    try {
      await sendMensagem(detail.id, reply.trim());
      setReply('');
      const updated = await fetchChamado(detail.id);
      setDetail(updated);
      setTimeout(() => messagesEnd.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (_e) { /* fail silently */ }
    setSending(false);
  };

  const allCounts = {
    aberto: (allChamados.length ? allChamados : chamados).filter(c => c.status === 'aberto').length,
    em_andamento: (allChamados.length ? allChamados : chamados).filter(c => c.status === 'em_andamento').length,
    resolvido: (allChamados.length ? allChamados : chamados).filter(c => c.status === 'resolvido').length,
  };

  return (
    <div className="chamados-page">
      <div className="chamados-header">
        <h1>💬 Canal de Chamados</h1>
        <p>Gerencie chamados dos associados — acompanhe, responda e resolva solicitações.</p>
      </div>

      {/* Stats */}
      <div className="chamados-stats">
        <div className="stat-card">
          <div className="stat-icon open">📩</div>
          <div className="stat-info">
            <div className="stat-value">{allCounts.aberto}</div>
            <div className="stat-label">Abertos</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon progress">⏳</div>
          <div className="stat-info">
            <div className="stat-value">{allCounts.em_andamento}</div>
            <div className="stat-label">Em andamento</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon resolved">✅</div>
          <div className="stat-info">
            <div className="stat-value">{allCounts.resolvido}</div>
            <div className="stat-label">Resolvidos</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="chamados-filters">
        {[
          { key: '', label: 'Todos' },
          { key: 'aberto', label: 'Abertos' },
          { key: 'em_andamento', label: 'Em andamento' },
          { key: 'resolvido', label: 'Resolvidos' },
        ].map(f => (
          <button
            key={f.key}
            className={`filter-chip${filter === f.key ? ' active' : ''}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="chamados-loading">Carregando chamados...</div>
      ) : chamados.length === 0 ? (
        <div className="chamados-table-wrap">
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <p>Nenhum chamado encontrado.</p>
          </div>
        </div>
      ) : (
        <div className="chamados-table-wrap">
          <table className="chamados-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Autor</th>
                <th>Título</th>
                <th>Categoria</th>
                <th>Status</th>
                <th>Aberto há</th>
              </tr>
            </thead>
            <tbody>
              {chamados.map(c => {
                const cat = CATEGORY_LABELS[c.category] || { emoji: '📌', label: c.category };
                return (
                  <tr key={c.id} onClick={() => openDetail(c.id)}>
                    <td style={{ fontWeight: 700, color: 'var(--text-muted)' }}>#{c.id}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{c.creator_name || 'Desconhecido'}</td>
                    <td style={{ fontWeight: 600 }}>{c.title}</td>
                    <td>
                      <span className={`cat-badge ${c.category}`}>
                        {cat.emoji} {cat.label}
                      </span>
                    </td>
                    <td>
                      <span className={`status-chip ${c.status}`}>
                        {STATUS_LABELS[c.status] || c.status}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>{timeAgo(c.created_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail panel */}
      {selectedId !== null && (
        <>
          <div className="detail-overlay" onClick={closeDetail} />
          <div className="detail-panel">
            {detailLoading || !detail ? (
              <div className="chamados-loading">Carregando detalhes...</div>
            ) : (
              <>
                <div className="detail-header">
                  <div className="detail-header-info">
                    <h2>#{detail.id} — {detail.title}</h2>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                      Aberto por: <strong>{detail.creator_name || 'Desconhecido'}</strong>
                    </p>
                    <div className="detail-meta">
                      <span className={`cat-badge ${detail.category}`}>
                        {(CATEGORY_LABELS[detail.category] || { emoji: '📌', label: detail.category }).emoji}{' '}
                        {(CATEGORY_LABELS[detail.category] || { emoji: '📌', label: detail.category }).label}
                      </span>
                      <span className={`status-chip ${detail.status}`}>
                        {STATUS_LABELS[detail.status] || detail.status}
                      </span>
                    </div>
                  </div>
                  <button className="detail-close" onClick={closeDetail}>✕</button>
                </div>

                <div className="detail-status-bar">
                  <label>Alterar status:</label>
                  <select
                    className="status-select"
                    value={detail.status}
                    onChange={e => handleStatusChange(e.target.value)}
                  >
                    <option value="aberto">Aberto</option>
                    <option value="em_andamento">Em andamento</option>
                    <option value="resolvido">Resolvido</option>
                  </select>
                </div>

                <div className="detail-messages">
                  {detail.mensagens.map(m => (
                    <div key={m.id} className={`msg-bubble ${m.sender_role}`}>
                      <div>{m.content}</div>
                      <div className="msg-meta">
                        {m.sender_role === 'associado' ? '👤 Associado' : '🏢 Colaborador'} · {formatMsgTime(m.created_at)}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEnd} />
                </div>

                <div className="detail-reply">
                  <textarea
                    placeholder="Escreva uma resposta..."
                    value={reply}
                    onChange={e => setReply(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendReply(); } }}
                  />
                  <button className="reply-btn" disabled={sending || !reply.trim()} onClick={handleSendReply}>
                    {sending ? '...' : 'Enviar'}
                  </button>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ChamadosPage;
