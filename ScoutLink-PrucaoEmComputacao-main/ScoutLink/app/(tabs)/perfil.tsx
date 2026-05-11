import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, SafeAreaView, TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ScoutColors, Spacing, Radius, Typography } from '@/constants/theme';
import { clearAuthSession, getAuthSession } from '@/services/auth';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

const menuItems = [
  { icon: '📢', label: 'Feed de Notícias', route: '/(tabs)/' },
  { icon: '🗺️', label: 'Mapa de UELs', route: '/(tabs)/mapa' },
  { icon: '🔔', label: 'Notificações', sub: 'Em breve' },
  { icon: '⚙️', label: 'Configurações', sub: 'Ajustes do app', route: '/configuracoes' },
];

export default function PerfilScreen() {
  const router = useRouter();
  
  const [userName, setUserName] = useState('Associado');
  const [userInitials, setUserInitials] = useState('AS');
  const [userUel, setUserUel] = useState<string | null>(null);
  const [userPerfil, setUserPerfil] = useState<string | null>(null);
  const [userRegistro, setUserRegistro] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    async function loadUser() {
      const session = await getAuthSession();
      if (session?.user) {
        const metadata = session.user.user_metadata;
        const name = metadata?.full_name || 'Associado';
        setUserName(name);
        setUserEmail(session.user.email || null);
        setUserRegistro(metadata?.registro || null);
        
        const parts = name.trim().split(' ');
        if (parts.length > 1) {
          setUserInitials(`${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase());
        } else if (name.length > 0) {
          setUserInitials(name.substring(0, 2).toUpperCase());
        }

        // Fetch UEL name
        const uelId = metadata?.uel_id;
        if (uelId) {
          try {
            const res = await fetch(`${API_URL}/api/uels/${uelId}`);
            if (res.ok) {
              const uel = await res.json();
              setUserUel(uel.nome);
            }
          } catch { /* silent */ }
        }

        // Fetch Perfil name
        const perfilId = metadata?.perfil_id;
        if (perfilId) {
          try {
            const res = await fetch(`${API_URL}/api/perfis/${perfilId}`);
            if (res.ok) {
              const perfil = await res.json();
              setUserPerfil(perfil.nome);
            }
          } catch { /* silent */ }
        }
      }
    }
    loadUser();
  }, []);

  const handleLogout = async () => {
    await clearAuthSession();
    router.replace('/(auth)/login');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>👤  Perfil</Text>
        <Text style={styles.headerSub}>Área do Associado</Text>
      </View>

      <View style={{ flex: 1, backgroundColor: ScoutColors.bgBase }}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Avatar card */}
        <View style={styles.avatarCard}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{userInitials}</Text></View>
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <Text style={styles.userName}>{userName}</Text>
            {userEmail && <Text style={styles.userEmail}>{userEmail}</Text>}
          </View>
        </View>

        {/* Info cards */}
        <View style={styles.infoSection}>
          {userUel && (
            <View style={styles.infoCard}>
              <Text style={{ fontSize: 18 }}>⚜️</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoLabel}>UEL / Grupo Escoteiro</Text>
                <Text style={styles.infoValue}>{userUel}</Text>
              </View>
            </View>
          )}
          {userPerfil && (
            <View style={styles.infoCard}>
              <Text style={{ fontSize: 18 }}>🏷️</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoLabel}>Perfil</Text>
                <Text style={styles.infoValue}>{userPerfil}</Text>
              </View>
            </View>
          )}
          {userRegistro && (
            <View style={styles.infoCard}>
              <Text style={{ fontSize: 18 }}>📋</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoLabel}>Registro Escoteiro</Text>
                <Text style={styles.infoValue}>{userRegistro}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {[
            { icon: '📅', label: 'Eventos', value: '—' },
          ].map((s) => (
            <View key={s.label} style={styles.statItem}>
              <Text style={{ fontSize: 22 }}>{s.icon}</Text>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Menu */}
        <Text style={styles.sectionLabel}>MENU</Text>
        <View style={styles.menuList}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.label} style={styles.menuItem} activeOpacity={0.8}
              onPress={() => item.route && router.push(item.route as any)}
            >
              <View style={styles.menuIcon}><Text style={{ fontSize: 20 }}>{item.icon}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <Text style={styles.menuSub}>{item.sub}</Text>
              </View>
              <Text style={{ color: ScoutColors.textMuted, fontSize: 18 }}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={styles.logoutBtn} activeOpacity={0.8}
          onPress={handleLogout}
        >
          <Text style={styles.logoutText}>🚪  Sair da conta</Text>
        </TouchableOpacity>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: ScoutColors.navy },
  header: { paddingHorizontal: Spacing.md, paddingVertical: 14, backgroundColor: ScoutColors.navy },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 2 },

  scroll: { paddingTop: Spacing.md, paddingBottom: Spacing.xxl },

  avatarCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    marginHorizontal: Spacing.md, marginBottom: Spacing.sm,
    backgroundColor: ScoutColors.bgWhite, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: ScoutColors.borderLight, padding: Spacing.md,
  },
  avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: ScoutColors.navy, borderWidth: 2, borderColor: ScoutColors.borderNavy, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 20 },
  userName: { fontSize: 17, fontWeight: '700', color: ScoutColors.navy },
  userEmail: { fontSize: 12, color: ScoutColors.textMuted, marginTop: 2 },

  infoSection: {
    paddingHorizontal: Spacing.md, gap: 8, marginBottom: Spacing.md,
  },
  infoCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: ScoutColors.bgWhite, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: ScoutColors.borderLight, padding: Spacing.md,
  },
  infoLabel: { fontSize: 11, fontWeight: '600', color: ScoutColors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  infoValue: { fontSize: 14, fontWeight: '700', color: ScoutColors.navy, marginTop: 2 },

  statsRow: {
    flexDirection: 'row', marginHorizontal: Spacing.md,
    backgroundColor: ScoutColors.bgWhite, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: ScoutColors.borderLight, marginBottom: Spacing.lg,
    borderTopWidth: 3, borderTopColor: ScoutColors.navy,
  },
  statItem: { flex: 1, alignItems: 'center', paddingVertical: Spacing.md, gap: 4 },
  statValue: { fontSize: 22, fontWeight: '800', color: ScoutColors.navy },
  statLabel: { ...Typography.caption },

  sectionLabel: { fontSize: 10, fontWeight: '700', color: ScoutColors.textMuted, letterSpacing: 1.2, paddingHorizontal: Spacing.md, marginBottom: Spacing.sm, textTransform: 'uppercase' },

  menuList: { paddingHorizontal: Spacing.md, gap: 8, marginBottom: Spacing.lg },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: ScoutColors.bgWhite, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: ScoutColors.borderLight, padding: Spacing.md,
  },
  menuIcon: { width: 40, height: 40, borderRadius: Radius.md, backgroundColor: ScoutColors.bgNavyTint, borderWidth: 1, borderColor: ScoutColors.borderNavy, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { fontSize: 14, fontWeight: '600', color: ScoutColors.navy },
  menuSub: { ...Typography.caption, marginTop: 2 },

  logoutBtn: {
    marginHorizontal: Spacing.md,
    backgroundColor: '#fff', borderRadius: Radius.lg,
    borderWidth: 1.5, borderColor: 'rgba(200,0,0,0.25)', padding: Spacing.md, alignItems: 'center',
  },
  logoutText: { fontSize: 15, fontWeight: '700', color: '#c00000' },
});
