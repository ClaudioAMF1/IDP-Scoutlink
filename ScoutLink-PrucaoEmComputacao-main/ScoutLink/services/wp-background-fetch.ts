/**
 * services/wp-background-fetch.ts
 *
 * Registra tarefa de background que roda a cada ~15 min (mínimo do SO),
 * mesmo com o app fechado. Quando detecta posts novos no WordPress,
 * dispara notificações locais no celular.
 *
 * IMPORTANTE: requer build nativo (não funciona no Expo Go).
 * Instale: npx expo install expo-background-fetch expo-task-manager
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';

import { fetchNewWordPressPosts, NoticiaItem } from './wordpress';

const TASK_NAME = 'WP_NEWS_BACKGROUND_FETCH';
const LAST_SEEN_KEY = 'scoutlink:wp:last_seen_date';
const FETCH_INTERVAL_SECONDS = 15 * 60; // 15 minutos

// ── Definição da tarefa (escopo global — obrigatório) ─────

TaskManager.defineTask(TASK_NAME, async () => {
  try {
    const lastSeen = await AsyncStorage.getItem(LAST_SEEN_KEY);
    // Primeira execução: janela de 24h para não inundar o usuário
    const after = lastSeen ?? new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const novos = await fetchNewWordPressPosts(after);
    if (novos.length === 0) return BackgroundFetch.BackgroundFetchResult.NoData;

    // Ordena do mais antigo para o mais novo
    const ordenados = [...novos].sort(
      (a, b) => new Date(a.data_criacao).getTime() - new Date(b.data_criacao).getTime()
    );

    // Dispara no máximo 3 notificações por ciclo
    for (const post of ordenados.slice(-3)) {
      await _dispararNotificacao(post);
    }

    // Salva a data do post mais recente
    const maisRecente = ordenados[ordenados.length - 1];
    await AsyncStorage.setItem(LAST_SEEN_KEY, maisRecente.data_criacao);

    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (err) {
    console.error('[WP BG Fetch] Erro:', err);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

// ── Helper privado ───────────────────────────────────────

async function _dispararNotificacao(post: NoticiaItem): Promise<void> {
  const corpo = post.descricao.length > 120
    ? post.descricao.slice(0, 117) + '...'
    : post.descricao;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: post.titulo,
      body: corpo,
      sound: 'default',
      data: {
        tipo: 'wp_noticia',
        wp_id: post.id,
        link: post.link,
      },
    },
    trigger: null, // disparo imediato
  });
}

// ── API pública ──────────────────────────────────────────

/** Registra a tarefa de background. Chamar uma vez no _layout.tsx. */
export async function registerWpBackgroundFetch(): Promise<void> {
  try {
    const status = await BackgroundFetch.getStatusAsync();
    if (
      status === BackgroundFetch.BackgroundFetchStatus.Restricted ||
      status === BackgroundFetch.BackgroundFetchStatus.Denied
    ) {
      console.warn('[WP BG Fetch] Background fetch não permitido neste dispositivo.');
      return;
    }

    const jaRegistrado = await TaskManager.isTaskRegisteredAsync(TASK_NAME);
    if (jaRegistrado) return;

    await BackgroundFetch.registerTaskAsync(TASK_NAME, {
      minimumInterval: FETCH_INTERVAL_SECONDS,
      stopOnTerminate: false, // continua após o app ser fechado (Android)
      startOnBoot: true,      // retoma após reiniciar o dispositivo (Android)
    });

    console.log('[WP BG Fetch] Tarefa registrada.');
  } catch (err) {
    console.error('[WP BG Fetch] Erro ao registrar:', err);
  }
}

/**
 * Verifica posts novos imediatamente (sem esperar o intervalo do SO).
 * Chamar ao abrir o app e ao voltar do background.
 * Retorna a quantidade de posts novos encontrados.
 */
export async function checkNowForNewPosts(): Promise<number> {
  try {
    const lastSeen = await AsyncStorage.getItem(LAST_SEEN_KEY);
    const after = lastSeen ?? new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const novos = await fetchNewWordPressPosts(after);
    if (novos.length === 0) return 0;

    const ordenados = [...novos].sort(
      (a, b) => new Date(a.data_criacao).getTime() - new Date(b.data_criacao).getTime()
    );

    for (const post of ordenados.slice(-3)) {
      await _dispararNotificacao(post);
    }

    const maisRecente = ordenados[ordenados.length - 1];
    await AsyncStorage.setItem(LAST_SEEN_KEY, maisRecente.data_criacao);
    return novos.length;
  } catch (err) {
    console.error('[WP BG Fetch] Erro no checkNow:', err);
    return 0;
  }
}
