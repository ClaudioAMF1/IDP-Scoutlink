import type { Session } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

import { supabase } from '@/lib/supabase';

WebBrowser.maybeCompleteAuthSession();

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

type LoginPayload = {
  email: string;
  password: string;
};

type SignUpPayload = {
  fullName: string;
  email: string;
  password: string;
  uelId: number;
  perfilId: number;
  registro?: string;
};

function mapAuthErrorMessage(rawMessage: string): string {
  const message = rawMessage.toLowerCase();

  if (message.includes('email rate limit exceeded')) {
    return 'Limite de e-mails excedido no Supabase. Aguarde alguns minutos antes de tentar novamente.';
  }

  if (message.includes('for security purposes you can only request this after')) {
    return 'Muitas tentativas em pouco tempo. Aguarde um pouco e tente novamente.';
  }

  return rawMessage;
}

function getAuthRedirectUrl(): string {
  return Linking.createURL('/');
}

export async function login(payload: LoginPayload): Promise<Session> {
  const { data, error } = await supabase.auth.signInWithPassword(payload);
  if (error || !data.session) {
    throw new Error(mapAuthErrorMessage(error?.message ?? 'Nao foi possivel autenticar no momento.'));
  }

  return data.session;
}

export async function signupWithEmail(payload: SignUpPayload): Promise<void> {
  const normalizedEmail = payload.email.trim().toLowerCase();
  const trimmedFullName = payload.fullName.trim();

  const { data, error } = await supabase.auth.signUp({
    email: normalizedEmail,
    password: payload.password,
    options: {
      data: {
        full_name: trimmedFullName,
        role: 'associado',
        is_active: true,
        uel_id: payload.uelId,
        perfil_id: payload.perfilId,
        registro: payload.registro || null,
      },
    },
  });

  if (error) {
    throw new Error(mapAuthErrorMessage(error.message));
  }
}

export async function signupWithGoogle(): Promise<Session | null> {
  const redirectTo = getAuthRedirectUrl();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      skipBrowserRedirect: true,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });

  if (error || !data?.url) {
    throw new Error(mapAuthErrorMessage(error?.message ?? 'Nao foi possivel iniciar login com Google.'));
  }

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== 'success' || !result.url) {
    return null;
  }

  const callbackUrl = new URL(result.url);
  const authCode = callbackUrl.searchParams.get('code');

  if (authCode) {
    const { data: sessionData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(authCode);
    if (exchangeError || !sessionData.session) {
      throw new Error(mapAuthErrorMessage(exchangeError?.message ?? 'Falha ao concluir autenticacao com Google.'));
    }
    return sessionData.session;
  }

  const { data: currentSessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !currentSessionData.session) {
    throw new Error(mapAuthErrorMessage(sessionError?.message ?? 'Falha ao recuperar sessao apos login com Google.'));
  }
  return currentSessionData.session;
}

export async function getAuthSession(): Promise<Session | null> {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    return null;
  }

  return data.session;
}

export async function clearAuthSession(): Promise<void> {
  await supabase.auth.signOut();
}

// ── Fetch UELs and Perfis for registration ───────────────

export interface UELOption {
  id: number;
  nome: string;
}

export interface PerfilOption {
  id: number;
  nome: string;
  descricao: string | null;
}

export async function fetchUELsForRegistration(): Promise<UELOption[]> {
  try {
    const res = await fetch(`${API_URL}/api/uels/`);
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export async function fetchPerfisForRegistration(): Promise<PerfilOption[]> {
  try {
    const res = await fetch(`${API_URL}/api/perfis/`);
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}
