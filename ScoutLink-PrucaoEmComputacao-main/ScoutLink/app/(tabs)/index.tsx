import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, SafeAreaView,
  TouchableOpacity, ActivityIndicator, RefreshControl,
} from 'react-native';
import { ScoutColors, Spacing, Radius, Typography } from '@/constants/theme';
import { getAuthSession } from '@/services/auth';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

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

const CATEGORY_META: Record<string, { badge: string; color: string }> = {
  Evento: { badge: '📅', color: ScoutColors.navy },
  Curso: { badge: '📚', color: ScoutColors.orange },
  Noticia: { badge: '📰', color: ScoutColors.green },
  Malote: { badge: '📦', color: ScoutColors.purple },
};

const FILTER_OPTIONS = ['Todos', 'Evento', 'Curso', 'Noticia', 'Malote'];

function timeAgo(iso: string): string {
  const dIso = iso.endsWith('Z') || iso.includes('+') ? iso : iso + 'Z';
  const diff = Date.now() - new Date(dIso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Agora';
  if (mins < 60) return `Há ${mins}min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Há ${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `Há ${days}d`;
}

export default function FeedScreen() {
  const [notificacoes, setNotificacoes] = useState<NotificacaoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('Todos');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const loadFeed = useCallback(async () => {
    try {
      const session = await getAuthSession();
      setIsLoggedIn(!!session);

      const params = new URLSearchParams();

      if (!session) {
        // Usuário deslogado: apenas notícias gerais e eventos públicos
        params.set('publico', 'true');
      } else {
        // Usuário logado: feed filtrado pelo perfil e UEL
        const perfilId = session.user?.user_metadata?.perfil_id;
        const uelId = session.user?.user_metadata?.uel_id;
        if (perfilId) params.set('perfil_id', String(perfilId));
        if (uelId) params.set('uel_id', String(uelId));
      }

      if (activeFilter !== 'Todos') {
        params.set('categoria', activeFilter);
      }

      const res = await fetch(`${API_URL}/api/notificacoes/?${params}`);
      if (res.ok) {
        const data = await res.json();
        setNotificacoes(data);
      }
    } catch (err) {
      console.error('Erro ao carregar feed:', err);
    }
    setLoading(false);
    setRefreshing(false);
  }, [activeFilter]);

  useEffect(() => {
    setLoading(true);
    loadFeed();
  }, [loadFeed]);

  const onRefresh = () => {
    setRefreshing(true);
    loadFeed();
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>⚜️  ScoutLink</Text>
          <Text style={styles.headerSub}>Região Escoteira do DF</Text>
        </View>
        <View style={styles.notifBtn}>
          <Text style={{ fontSize: 18 }}>🔔</Text>
          {notificacoes.length > 0 && <View style={styles.notifDot} />}
        </View>
      </View>

      <View style={{ flex: 1, backgroundColor: ScoutColors.bgBase }}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ScoutColors.navy} />}
        >
        {/* Banner */}
        <View style={styles.banner}>
          <View style={styles.bannerLeft}>
            <Text style={styles.bannerTitle}>📢  Feed de Notícias</Text>
            <Text style={styles.bannerSub}>
              {isLoggedIn ? 'Notificações filtradas pelo seu perfil' : 'Notícias gerais e eventos públicos'}
            </Text>
          </View>
          {!isLoggedIn && (
            <View style={styles.publicBadge}>
              <Text style={styles.publicBadgeText}>🌐 Público</Text>
            </View>
          )}
        </View>

        {/* Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          style={{ marginBottom: Spacing.md }}
          contentContainerStyle={{ paddingHorizontal: Spacing.md, gap: 8 }}>
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

        {/* Content */}
        {loading ? (
          <ActivityIndicator color={ScoutColors.navy} size="large" style={{ marginTop: Spacing.xl }} />
        ) : notificacoes.length === 0 ? (
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
          <View style={styles.list}>
            {notificacoes.map((item) => {
              const meta = CATEGORY_META[item.categoria] || CATEGORY_META.Noticia;
              return (
                <TouchableOpacity key={item.id} style={styles.card} activeOpacity={0.85}>
                  <View style={styles.cardTop}>
                    <View style={[styles.catBadge, { backgroundColor: meta.color + '18', borderColor: meta.color + '44' }]}>
                      <Text style={{ fontSize: 11 }}>{meta.badge}</Text>
                      <Text style={[styles.catText, { color: meta.color }]}>{item.categoria}</Text>
                    </View>
                    <Text style={styles.dateText}>{timeAgo(item.data_criacao)}</Text>
                  </View>
                  <Text style={styles.cardTitle}>{item.titulo}</Text>
                  <Text style={styles.cardBody} numberOfLines={3}>{item.descricao}</Text>
                  <View style={styles.cardFooter}>
                    {item.alvo_uel_nome ? (
                      <Text style={styles.uelText}>📍 {item.alvo_uel_nome}</Text>
                    ) : (
                      <Text style={styles.uelText}>📍 Todas as UELs</Text>
                    )}
                    {item.autor_nome && (
                      <Text style={styles.autorText}>👤 {item.autor_nome}</Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: ScoutColors.navy },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: 14,
    backgroundColor: ScoutColors.navy,
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  headerSub: { fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 2 },
  notifBtn: {
    width: 40, height: 40, borderRadius: Radius.md,
    backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  notifDot: { position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: 4, backgroundColor: ScoutColors.orange, borderWidth: 2, borderColor: ScoutColors.navy },

  scroll: { paddingTop: Spacing.md, paddingBottom: Spacing.xxl },

  banner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginHorizontal: Spacing.md, marginBottom: Spacing.md,
    backgroundColor: ScoutColors.bgWhite, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: ScoutColors.borderLight,
    padding: Spacing.md,
    shadowColor: ScoutColors.navy, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8,
  },
  bannerLeft: { flex: 1 },
  bannerTitle: { fontSize: 15, fontWeight: '700', color: ScoutColors.navy },
  bannerSub: { fontSize: 11, color: ScoutColors.textMuted, marginTop: 3 },
  publicBadge: { backgroundColor: 'rgba(0,65,118,0.08)', borderRadius: Radius.full, paddingVertical: 4, paddingHorizontal: 10, borderWidth: 1, borderColor: 'rgba(0,65,118,0.2)' },
  publicBadgeText: { fontSize: 11, fontWeight: '700', color: ScoutColors.navy },

  chip: { paddingVertical: 7, paddingHorizontal: 16, borderRadius: Radius.full, backgroundColor: ScoutColors.bgWhite, borderWidth: 1, borderColor: ScoutColors.borderLight },
  chipActive: { backgroundColor: ScoutColors.navy, borderColor: ScoutColors.navy },
  chipText: { fontSize: 13, fontWeight: '600', color: ScoutColors.textSecondary },
  chipTextActive: { color: '#fff' },

  list: { paddingHorizontal: Spacing.md, gap: 12 },

  card: {
    backgroundColor: ScoutColors.bgWhite, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: ScoutColors.borderLight, padding: Spacing.md,
    shadowColor: ScoutColors.navy, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  catBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 3, paddingHorizontal: 10, borderRadius: Radius.full, borderWidth: 1 },
  catText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  dateText: { ...Typography.caption },
  cardTitle: { fontSize: 15, fontWeight: '700', color: ScoutColors.navy, marginBottom: 6 },
  cardBody: { ...Typography.body, lineHeight: 20, marginBottom: 12 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  uelText: { ...Typography.caption },
  autorText: { ...Typography.caption, color: ScoutColors.navy, fontWeight: '600' },

  emptyState: { alignItems: 'center', paddingVertical: Spacing.xxl, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: ScoutColors.navy },
  emptyText: { ...Typography.body, textAlign: 'center', maxWidth: 260 },
});
