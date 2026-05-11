import { supabase } from '../lib/supabase';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (data.session?.access_token) {
    headers['Authorization'] = `Bearer ${data.session.access_token}`;
  }
  return headers;
}

async function getUserId(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? '';
}

// ── Chamados ─────────────────────────────────────────────

export interface ChamadoListItem {
  id: number;
  supabase_user_id: string;
  creator_name?: string;
  title: string;
  category: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Mensagem {
  id: number;
  chamado_id: number;
  sender_id: string;
  sender_role: string;
  content: string;
  created_at: string;
}

export interface ChamadoDetail extends ChamadoListItem {
  mensagens: Mensagem[];
}

export async function fetchChamados(statusFilter?: string): Promise<ChamadoListItem[]> {
  const params = new URLSearchParams();
  if (statusFilter) params.set('status', statusFilter);
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/api/chamados/?${params}`, { headers });
  if (!res.ok) throw new Error('Erro ao buscar chamados');
  return res.json();
}

export async function fetchChamado(id: number): Promise<ChamadoDetail> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/api/chamados/${id}`, { headers });
  if (!res.ok) throw new Error('Erro ao buscar chamado');
  return res.json();
}

export async function updateChamadoStatus(id: number, status: string): Promise<ChamadoDetail> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/api/chamados/${id}/status`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error('Erro ao atualizar status');
  return res.json();
}

export async function sendMensagem(chamadoId: number, content: string): Promise<Mensagem> {
  const headers = await getAuthHeaders();
  const userId = await getUserId();
  const params = new URLSearchParams({ sender_id: userId, sender_role: 'colaborador' });
  const res = await fetch(`${API_URL}/api/chamados/${chamadoId}/mensagens?${params}`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ content }),
  });
  if (!res.ok) throw new Error('Erro ao enviar mensagem');
  return res.json();
}
