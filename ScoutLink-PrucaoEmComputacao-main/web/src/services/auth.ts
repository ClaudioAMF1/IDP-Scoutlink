import type { Session } from '@supabase/supabase-js';

import { supabase } from '../lib/supabase';

type LoginPayload = {
  email: string;
  password: string;
};

export async function login(payload: LoginPayload): Promise<Session> {
  const { data, error } = await supabase.auth.signInWithPassword(payload);
  if (error || !data.session) {
    throw new Error(error?.message ?? 'Nao foi possivel autenticar no momento.');
  }

  const platform = data.session.user?.user_metadata?.platform as string | undefined;
  const role = data.session.user?.user_metadata?.role as string | undefined;

  // Se o usuário já tiver o role 'colaborador' (como o admin geral que criamos via script), deixamos passar.
  // Caso contrário, precisamos verificar no banco de dados se algum admin deu a permissão (is_admin = true).
  if (role !== 'colaborador') {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const res = await fetch(`${API_URL}/api/admin/users`);
      if (res.ok) {
        const admins = await res.json();
        const isAdmin = admins.some((a: any) => a.email === data.session.user?.email);
        
        if (!isAdmin) {
          await supabase.auth.signOut();
          throw new Error('Acesso negado: Este painel é exclusivo para colaboradores e administradores. Por favor, utilize o aplicativo mobile.');
        }
      }
    } catch (e) {
      if (e instanceof Error && e.message.includes('Acesso negado')) throw e;
      console.error("Failed to verify admin status:", e);
    }
  }

  return data.session;
}

export async function getSession(): Promise<Session | null> {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    return null;
  }

  return data.session;
}

export async function clearSession(): Promise<void> {
  await supabase.auth.signOut();
}
