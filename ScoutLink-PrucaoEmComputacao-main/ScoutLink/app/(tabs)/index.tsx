import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, SafeAreaView,
  TouchableOpacity, ActivityIndicator, RefreshControl, Linking,
} from 'react-native';
import { ScoutColors, Spacing, Radius, Typography } from '@/constants/theme';
import { getAuthSession } from '@/services/auth';
import { fetchWordPressPosts, NoticiaItem } from '@/services/wordpress';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';
const WP_POLL_INTERVAL_MS = 5 * 60 * 1000; // 5 minutos

// ── Tipos ────────────────────────────────────────────────

interface BackendItem {
  id: number;
  titulo: string;
  descricao: string;
  categoria: string;
  data_criacao: string;
  autor_nome: string | null;
  alvo_uel_nome: string | null;
  alvo_perfil_nome: string | null;
}

type FeedItem =
  | (BackendItem & { fonte: 'backend'; link?: undefined; imagem_url?: undefined })
  | (NoticiaItem & { fonte: 'wordpress' });

const CATEGORY_META: Record<string, { badge: string; color: string }> = {
  Evento:  { badge: '📅', color: ScoutColors.navy },
  Curso:   { badge: '📚', color: ScoutColors.orange },
  Noticia: { badge: '📰', color: ScoutColors.green },
  Malote:  { badge: '📦', color: ScoutColors.purple },
};

const FILTER_OPTIONS = ['Todos', 'Evento', 'Curso', 'Noticia', 'Malote'];

// ── Utilitários ──────────────────────────────────────────

function timeAgo(iso: string): string {
  const dIso = iso.endsWith('Z') || iso.includes('+') ? iso : iso + 'Z';
  const diff = Date.now() - new Date(dIso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Agora';
  if (mins < 60) return `Há ${mins}min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Há ${hrs}h`;
  return `Há ${Math.floor(hrs / 24)}d`;
}

function mergeAndSort(backend: BackendItem[], wp: NoticiaItem[]): FeedItem[] {
  const backendTitles = new Set(backend.map((i) => i.titulo.toLowerCase().trim()));
  const wpFiltered = wp.filter((w) => !backendTitles.has(w.titulo.toLowerCase().trim()));

  const all: FeedItem[] = [
    ...backend.map((i) => ({ ...i, fonte: 'backend' as const })),
    ...wpFiltered.map((i) => ({ ...i, fonte: 'wordpress' as const })),
  ];

  return all.sort(
    (a, b) => new Date(b.data_criacao).getTime() - new Date(a.data_criacao).getTime()
  );
}

// ── Componente ───────────────────────────────────────────

export default function FeedScreen() {
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('Todos');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [wpError, setWpError] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Busca backend ────────────────────────────────────
  const fetchBackend = useCallback(async (): Promise<BackendItem[]> => {
    const session = await getAuthSession();
    setIsLoggedIn(!!session);

    const params = new URLSearchParams();
    if (!session) {
      params.set('publico', 'true');
    } else {
      const perfilId = session.user?.user_metadata?.perfil_id;
      const uelId = session.user?.user_metadata?.uel_id;
      if (perfilId) params.set('perfil_id', String(perfilId));
      if (uelId) params.set('uel_id', String(uelId));
    }
    if (activeFilter !== 'Todos') params.set('categoria', activeFilter);

    const res = await fetch(`${API_URL}/api/notificacoes/?${params}`);
    if (!res.ok) return [];
    return res.json();
  }, [activeFilter]);

  // ── Busca WordPress ──────────────────────────────────
  const fetchWp = useCallback(async (): Promise<NoticiaItem[]> => {
    if (activeFilter !== 'Todos' && activeFilter !== 'Noticia') return [];
    try {
      const posts = await fetchWordPressPosts({ perPage: 15 });
      setWpError(false);
      return posts;
    } catch {
      setWpError(true);
      return [];
    }
  }, [activeFilter]);

  // ── Carrega tudo em paralelo ─────────────────────────
  const loadFeed = useCallback(async () => {
    try {
      const [backendData, wpData] = await Promise.all([fetchBackend(), fetchWp()]);
      setFeed(mergeAndSort(backendData, wpData));
    } catch (err) {
      console.error('Erro ao carregar feed:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [fetchBackend, fetchWp]);

  useEffect(() => {
    setLoading(true);
    loadFeed();
  }, [loadFeed]);

  // ── Polling silencioso do WP a cada 5 min ────────────
  useEffect(() => {
    pollingRef.current = setInterval(async () => {
      const wpData = await fetchWp();
      if (wpData.length === 0) return;
      setFeed((prev) => {
        const backendItems = prev
          .filter((i) => i.fonte === 'backend')
          .map((i) => i as BackendItem);
        return mergeAndSort(backendItems, wpData);
      });
    }, WP_POLL_INTERVAL_MS);
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [fetchWp]);

  const onRefresh = () => { setRefreshing(true); loadFeed(); };

  // ── Render de cada card ──────────────────────────────
  const renderCard = (item: FeedItem) => {
    const meta = CATEGORY_META[item.categoria] ?? CATEGORY_META.Noticia;
    const isWp = item.fonte === 'wordpress';

    return (
      <TouchableOpacity
        key={String(item.id)}
        style={styles.card}
        activeOpacity={0.85}
        onPress={() => {
          if (isWp && item.link) Linking.openURL(item.link).catch(() => {});
        }}
      >
        <View style={styles.cardTop}>
          <View style={[styles.catBadge, { backgroundColor: meta.color + '18', borderColor: meta.color + '44' }]}>
            <Text style={{ fontSize: 11 }}>{meta.badge}</Text>
            <Text style={[styles.catText, { color: meta.color }]}>{item.categoria}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            {isWp && (
              <View style={styles.wpBadge}>
                <Text style={styles.wpBadgeText}>🌐 site</Text>
              </View>
            )}
            <Text style={styles.dateText}>{timeAgo(item.data_criacao)}</Text>
          </View>
        </View>

        <Text style={styles.cardTitle}>{item.titulo}</Text>
        <Text style={styles.cardBody} numberOfLines={3}>{item.descricao}</Text>

        <View style={styles.cardFooter}>
          {item.alvo_uel_nome
            ? <Text style={styles.uelText}>📍 {item.alvo_uel_nome}</Text>
            : <Text style={styles.uelText}>📍 Todas as UELs</Text>
          }
          {item.autor_nome && <Text style={styles.autorText}>👤 {item.autor_nome}</Text>}
          {isWp && item.link && <Text style={[styles.autorText, { color: ScoutColors.green }]}>Ler mais →</Text>}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>⚜️  ScoutLink</Text>
          <Text style={styles.headerSub}>Região Escoteira do DF</Text>
        </View>
        <View style={styles.notifBtn}>
          <Text style={{ fontSize: 18 }}>🔔</Text>
          {feed.length > 0 && <View style={styles.notifDot} />}
        </View>
      </View>

      <View style={{ flex: 1, backgroundColor: ScoutColors.bgBase }}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ScoutColors.navy} />
          }
        >
          <View style={styles.banner}>
            <View style={styles.bannerLeft}>
              <Text style={styles.bannerTitle}>📢  Feed de Notícias</Text>
              <Text style={styles.bannerSub}>
                {isLoggedIn
                  ? 'Notificações do seu perfil + notícias do site'
                  : 'Notícias gerais, eventos públicos e site escoteirosdf.org.br'}
              </Text>
            </View>
            {!isLoggedIn && (
              <View style={styles.publicBadge}>
                <Text style={styles.publicBadgeText}>🌐 Público</Text>
              </View>
            )}
          </View>

          {wpError && (
            <View style={styles.wpErrorBanner}>
              <Text style={styles.wpErrorText}>⚠️ Não foi possível carregar notícias do site. Puxe para atualizar.</Text>
            </View>
          )}

          <ScrollView
            horizontal showsHorizontalScrollIndicator={false}
            style={{ marginBottom: Spacing.md }}
            contentContainerStyle={{ paddingHorizontal: Spacing.md, gap: 8 }}
          >
            {FILTER_OPTIONS.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.chip, activeFilter === cat && styles.chipActive]}
                onPress={() => setActiveFilter(cat)}
              >
                <Text style={[styles.chipText, activeFilter === cat && styles.chipTextActive]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {loading ? (
            <ActivityIndicator color={ScoutColors.navy} size="large" style={{ marginTop: Spacing.xl }} />
          ) : feed.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={{ fontSize: 40 }}>📭</Text>
              <Text style={styles.emptyTitle}>Nenhuma notificação</Text>
              <Text style={styles.emptyText}>
                {isLoggedIn
                  ? 'Não há notificações para o seu perfil no momento.'
                  : 'Faça login para ver todas as notificações.'}
              </Text>
            </View>
          ) : (
            <View style={styles.list}>{feed.map(renderCard)}</View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: ScoutColors.navy },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: 14, backgroundColor: ScoutColors.navy },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  headerSub: { fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 2 },
  notifBtn: { width: 40, height: 40, borderRadius: Radius.md, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  notifDot: { position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: 4, backgroundColor: ScoutColors.orange, borderWidth: 2, borderColor: ScoutColors.navy },
  scroll: { paddingTop: Spacing.md, paddingBottom: 80 },
  banner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: Spacing.md, marginBottom: Spacing.md, backgroundColor: ScoutColors.bgWhite, borderRadius: Radius.lg, borderWidth: 1, borderColor: ScoutColors.borderLight, padding: Spacing.md, shadowColor: ScoutColors.navy, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
  bannerLeft: { flex: 1 },
  bannerTitle: { fontSize: 15, fontWeight: '700', color: ScoutColors.navy },
  bannerSub: { fontSize: 11, color: ScoutColors.textMuted, marginTop: 3 },
  publicBadge: { backgroundColor: 'rgba(0,65,118,0.08)', borderRadius: Radius.full, paddingVertical: 4, paddingHorizontal: 10, borderWidth: 1, borderColor: 'rgba(0,65,118,0.2)' },
  publicBadgeText: { fontSize: 11, fontWeight: '700', color: ScoutColors.navy },
  wpErrorBanner: { marginHorizontal: Spacing.md, marginBottom: Spacing.md, backgroundColor: '#FFF3CD', borderRadius: Radius.md, padding: Spacing.sm, borderWidth: 1, borderColor: '#FFD700' },
  wpErrorText: { fontSize: 12, color: '#856404' },
  chip: { paddingVertical: 7, paddingHorizontal: 16, borderRadius: Radius.full, backgroundColor: ScoutColors.bgWhite, borderWidth: 1, borderColor: ScoutColors.borderLight },
  chipActive: { backgroundColor: ScoutColors.navy, borderColor: ScoutColors.navy },
  chipText: { fontSize: 13, fontWeight: '600', color: ScoutColors.textSecondary },
  chipTextActive: { color: '#fff' },
  list: { paddingHorizontal: Spacing.md, gap: 12 },
  card: { backgroundColor: ScoutColors.bgWhite, borderRadius: Radius.lg, borderWidth: 1, borderColor: ScoutColors.borderLight, padding: Spacing.md, shadowColor: ScoutColors.navy, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  catBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 3, paddingHorizontal: 10, borderRadius: Radius.full, borderWidth: 1 },
  catText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  dateText: { ...Typography.caption },
  wpBadge: { backgroundColor: 'rgba(34,139,34,0.1)', borderRadius: Radius.full, paddingVertical: 2, paddingHorizontal: 7, borderWidth: 1, borderColor: 'rgba(34,139,34,0.25)' },
  wpBadgeText: { fontSize: 10, fontWeight: '700', color: ScoutColors.green },
  cardTitle: { fontSize: 15, fontWeight: '700', color: ScoutColors.navy, marginBottom: 6 },
  cardBody: { ...Typography.body, lineHeight: 20, marginBottom: 12 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  uelText: { ...Typography.caption },
  autorText: { ...Typography.caption, color: ScoutColors.navy, fontWeight: '600' },
  emptyState: { alignItems: 'center', paddingVertical: Spacing.xl, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: ScoutColors.navy },
  emptyText: { ...Typography.body, textAlign: 'center', maxWidth: 260 },
});
