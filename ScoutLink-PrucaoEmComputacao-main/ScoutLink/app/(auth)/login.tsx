import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, KeyboardAvoidingView, Platform, ScrollView,
  Modal, FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ScoutColors, Spacing, Radius, Typography } from '@/constants/theme';
import {
  getAuthSession, login, signupWithEmail, signupWithGoogle,
  fetchUELsForRegistration, fetchPerfisForRegistration,
} from '@/services/auth';
import type { UELOption, PerfilOption } from '@/services/auth';

type AuthMode = 'login' | 'signup';

export default function LoginScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>('login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [registro, setRegistro] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // UEL & Perfil selection
  const [uels, setUels] = useState<UELOption[]>([]);
  const [perfis, setPerfis] = useState<PerfilOption[]>([]);
  const [selectedUel, setSelectedUel] = useState<UELOption | null>(null);
  const [selectedPerfil, setSelectedPerfil] = useState<PerfilOption | null>(null);
  const [showUelPicker, setShowUelPicker] = useState(false);
  const [showPerfilPicker, setShowPerfilPicker] = useState(false);
  const [uelSearch, setUelSearch] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadSession = async () => {
      const session = await getAuthSession();
      if (isMounted && session) {
        router.replace({ pathname: '/(tabs)/' } as any);
      }
    };

    void loadSession();

    return () => {
      isMounted = false;
    };
  }, [router]);

  // Load UELs and Perfis when switching to signup
  useEffect(() => {
    if (mode === 'signup' && uels.length === 0) {
      fetchUELsForRegistration().then(setUels);
      fetchPerfisForRegistration().then(setPerfis);
    }
  }, [mode]);

  const resetMessages = () => {
    setError('');
    setSuccess('');
  };

  const handleLogin = async () => {
    if (isLoading) {
      return;
    }

    resetMessages();
    if (!email || !password) {
      setError('Preencha e-mail e senha para continuar.');
      return;
    }

    try {
      setIsLoading(true);
      await login({ email: email.trim().toLowerCase(), password });
      router.replace({ pathname: '/(tabs)/' } as any);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao autenticar.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignupWithEmail = async () => {
    if (isLoading) {
      return;
    }

    resetMessages();

    if (!fullName.trim() || !email || !password || !confirmPassword) {
      setError('Preencha nome, e-mail e senha para cadastrar.');
      return;
    }

    if (!selectedUel) {
      setError('Selecione sua UEL (grupo escoteiro).');
      return;
    }

    if (!selectedPerfil) {
      setError('Selecione seu perfil.');
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter ao menos 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas nao coincidem.');
      return;
    }

    try {
      setIsLoading(true);
      await signupWithEmail({
        fullName,
        email: email.trim().toLowerCase(),
        password,
        uelId: selectedUel.id,
        perfilId: selectedPerfil.id,
        registro: registro.trim() || undefined,
      });
      setSuccess('Cadastro realizado. Verifique seu e-mail para confirmar a conta.');
      setMode('login');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao cadastrar.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignupWithGoogle = async () => {
    if (isLoading) {
      return;
    }

    resetMessages();
    try {
      setIsLoading(true);
      const session = await signupWithGoogle();
      if (session) {
        router.replace({ pathname: '/(tabs)/' } as any);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao autenticar com Google.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = (nextMode: AuthMode) => {
    if (mode === nextMode) {
      return;
    }

    setMode(nextMode);
    resetMessages();
  };

  const filteredUels = uelSearch
    ? uels.filter(u => u.nome.toLowerCase().includes(uelSearch.toLowerCase()))
    : uels;

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {/* Logo */}
          <View style={styles.logoWrap}>
            <Text style={styles.logoEmoji}>⚜️</Text>
            <Text style={styles.appName}>ScoutLink</Text>
            <Text style={styles.appSub}>Região Escoteira do Distrito Federal</Text>
            <View style={styles.badge}><Text style={styles.badgeText}>📱 Área do Associado</Text></View>
          </View>

          {/* Card */}
          <View style={styles.card}>
            <View style={styles.modeSwitch}>
              <TouchableOpacity
                style={[styles.modeButton, mode === 'login' && styles.modeButtonActive]}
                onPress={() => switchMode('login')}
                disabled={isLoading}
              >
                <Text style={[styles.modeButtonText, mode === 'login' && styles.modeButtonTextActive]}>Entrar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modeButton, mode === 'signup' && styles.modeButtonActive]}
                onPress={() => switchMode('signup')}
                disabled={isLoading}
              >
                <Text style={[styles.modeButtonText, mode === 'signup' && styles.modeButtonTextActive]}>Cadastrar</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.cardTitle}>{mode === 'login' ? 'Entrar na sua conta' : 'Criar conta de associado'}</Text>

            {mode === 'signup' ? (
              <View style={styles.formGroup}>
                <Text style={styles.label}>Nome completo *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Seu nome completo"
                  placeholderTextColor={ScoutColors.textMuted}
                  autoCapitalize="words"
                  value={fullName}
                  onChangeText={setFullName}
                />
              </View>
            ) : null}

            <View style={styles.formGroup}>
              <Text style={styles.label}>E-mail *</Text>
              <TextInput
                style={styles.input}
                placeholder="seu@email.com"
                placeholderTextColor={ScoutColors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none" autoCorrect={false}
                value={email} onChangeText={setEmail}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Senha *</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor={ScoutColors.textMuted}
                secureTextEntry
                autoCapitalize="none"
                value={password} onChangeText={setPassword}
              />
            </View>

            {mode === 'signup' ? (
              <>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Confirmar senha *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="••••••••"
                    placeholderTextColor={ScoutColors.textMuted}
                    secureTextEntry
                    autoCapitalize="none"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                  />
                </View>

                {/* UEL Selector */}
                <View style={styles.formGroup}>
                  <Text style={styles.label}>UEL (Grupo Escoteiro) *</Text>
                  <TouchableOpacity
                    style={[styles.input, styles.pickerBtn]}
                    onPress={() => setShowUelPicker(true)}
                  >
                    <Text style={selectedUel ? styles.pickerText : styles.pickerPlaceholder}>
                      {selectedUel ? selectedUel.nome : 'Selecione sua UEL'}
                    </Text>
                    <Text style={{ color: ScoutColors.textMuted }}>▼</Text>
                  </TouchableOpacity>
                </View>

                {/* Perfil Selector */}
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Perfil *</Text>
                  <TouchableOpacity
                    style={[styles.input, styles.pickerBtn]}
                    onPress={() => setShowPerfilPicker(true)}
                  >
                    <Text style={selectedPerfil ? styles.pickerText : styles.pickerPlaceholder}>
                      {selectedPerfil ? selectedPerfil.nome : 'Selecione seu perfil'}
                    </Text>
                    <Text style={{ color: ScoutColors.textMuted }}>▼</Text>
                  </TouchableOpacity>
                </View>

                {/* Registro Escoteiro (opcional) */}
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Registro Escoteiro (opcional)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Seu código de registro"
                    placeholderTextColor={ScoutColors.textMuted}
                    autoCapitalize="none"
                    value={registro}
                    onChangeText={setRegistro}
                  />
                </View>
              </>
            ) : null}

            {mode === 'login' ? (
              <TouchableOpacity style={styles.forgotWrap}>
                <Text style={styles.forgot}>Esqueci minha senha</Text>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity
              style={[styles.loginBtn, isLoading && styles.loginBtnDisabled]}
              activeOpacity={0.85}
              onPress={mode === 'login' ? handleLogin : handleSignupWithEmail}
              disabled={isLoading}
            >
              <Text style={styles.loginBtnText}>
                {isLoading
                  ? 'Processando...'
                  : mode === 'login'
                    ? '🔑  Entrar'
                    : '📝  Cadastrar com e-mail'}
              </Text>
            </TouchableOpacity>

            {mode === 'signup' ? (
              <TouchableOpacity
                style={[styles.googleBtn, isLoading && styles.loginBtnDisabled]}
                activeOpacity={0.85}
                onPress={handleSignupWithGoogle}
                disabled={isLoading}
              >
                <Text style={styles.googleBtnText}>G  Cadastrar com Google</Text>
              </TouchableOpacity>
            ) : null}

            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            {success ? <Text style={styles.successText}>{success}</Text> : null}

            {mode === 'signup' ? (
              <View style={styles.notice}>
                <Text style={{ fontSize: 14 }}>ℹ️</Text>
                <Text style={styles.noticeText}>
                  O perfil determina quais notificações você receberá. Não há validação — selecione o perfil que melhor descreve sua função.
                </Text>
              </View>
            ) : null}
          </View>

          {/* Escoteiros DF branding */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>União dos Escoteiros do Brasil</Text>
            <Text style={styles.footerSub}>escoteirosdf.org.br · IDP — 2026</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* UEL Picker Modal */}
      <Modal visible={showUelPicker} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecione sua UEL</Text>
              <TouchableOpacity onPress={() => { setShowUelPicker(false); setUelSearch(''); }}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.modalSearch}
              placeholder="Buscar grupo escoteiro..."
              placeholderTextColor={ScoutColors.textMuted}
              value={uelSearch}
              onChangeText={setUelSearch}
            />
            <FlatList
              data={filteredUels}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.modalItem, selectedUel?.id === item.id && styles.modalItemActive]}
                  onPress={() => { setSelectedUel(item); setShowUelPicker(false); setUelSearch(''); }}
                >
                  <Text style={[styles.modalItemText, selectedUel?.id === item.id && { color: '#fff' }]}>
                    ⚜️ {item.nome}
                  </Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={<Text style={styles.modalEmpty}>Nenhuma UEL encontrada</Text>}
            />
          </View>
        </View>
      </Modal>

      {/* Perfil Picker Modal */}
      <Modal visible={showPerfilPicker} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecione seu perfil</Text>
              <TouchableOpacity onPress={() => setShowPerfilPicker(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={perfis}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.modalItem, selectedPerfil?.id === item.id && styles.modalItemActive]}
                  onPress={() => { setSelectedPerfil(item); setShowPerfilPicker(false); }}
                >
                  <Text style={[styles.modalItemText, selectedPerfil?.id === item.id && { color: '#fff' }]}>
                    {item.nome}
                  </Text>
                  {item.descricao ? (
                    <Text style={[styles.modalItemSub, selectedPerfil?.id === item.id && { color: 'rgba(255,255,255,0.7)' }]}>
                      {item.descricao}
                    </Text>
                  ) : null}
                </TouchableOpacity>
              )}
              ListEmptyComponent={<Text style={styles.modalEmpty}>Carregando perfis...</Text>}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: ScoutColors.bgBase },
  scroll: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.md, paddingVertical: Spacing.xxl },

  logoWrap: { alignItems: 'center', gap: 6, marginBottom: Spacing.lg },
  logoEmoji: { fontSize: 56 },
  appName: { fontSize: 32, fontWeight: '800', color: ScoutColors.navy, letterSpacing: -0.5 },
  appSub: { fontSize: 12, color: ScoutColors.textMuted, textAlign: 'center', maxWidth: 220 },
  badge: { backgroundColor: ScoutColors.bgNavyTint, borderRadius: Radius.full, paddingVertical: 5, paddingHorizontal: 16, borderWidth: 1, borderColor: ScoutColors.borderNavy, marginTop: 4 },
  badgeText: { fontSize: 12, fontWeight: '700', color: ScoutColors.navy },

  card: {
    width: '100%', maxWidth: 400,
    backgroundColor: ScoutColors.bgWhite, borderRadius: Radius.xl,
    borderWidth: 1, borderColor: ScoutColors.borderLight, padding: Spacing.lg, gap: 14,
    shadowColor: ScoutColors.navy, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 20,
  },
  cardTitle: { fontSize: 18, fontWeight: '700', color: ScoutColors.navy, marginBottom: 4 },

  modeSwitch: {
    flexDirection: 'row',
    backgroundColor: ScoutColors.bgBase,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: ScoutColors.borderLight,
    padding: 4,
    gap: 6,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: Radius.sm,
    alignItems: 'center',
  },
  modeButtonActive: {
    backgroundColor: ScoutColors.navy,
  },
  modeButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: ScoutColors.textSecondary,
  },
  modeButtonTextActive: {
    color: '#fff',
  },

  formGroup: { gap: 7 },
  label: { fontSize: 13, fontWeight: '600', color: ScoutColors.textSecondary },
  input: {
    backgroundColor: ScoutColors.bgBase, borderRadius: Radius.md,
    borderWidth: 1.5, borderColor: ScoutColors.borderLight,
    color: ScoutColors.textPrimary, padding: Spacing.sm + 4, fontSize: 15,
  },
  pickerBtn: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  pickerText: { fontSize: 15, color: ScoutColors.textPrimary, flex: 1 },
  pickerPlaceholder: { fontSize: 15, color: ScoutColors.textMuted, flex: 1 },
  forgotWrap: { alignSelf: 'flex-end', marginTop: -6 },
  forgot: { fontSize: 12, color: ScoutColors.navy, fontWeight: '600' },

  loginBtn: {
    backgroundColor: ScoutColors.navy, borderRadius: Radius.md, padding: 15, alignItems: 'center',
    shadowColor: ScoutColors.navy, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 12,
  },
  loginBtnDisabled: { opacity: 0.7 },
  loginBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  googleBtn: {
    backgroundColor: ScoutColors.bgWhite,
    borderRadius: Radius.md,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: ScoutColors.borderNavy,
  },
  googleBtnText: { color: ScoutColors.navy, fontWeight: '700', fontSize: 15 },
  errorText: { color: '#B42318', fontSize: 13, fontWeight: '600' },
  successText: { color: '#0f7a38', fontSize: 13, fontWeight: '600' },

  notice: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: 'rgba(0,65,118,0.06)', borderRadius: Radius.sm,
    borderWidth: 1, borderColor: 'rgba(0,65,118,0.15)', padding: Spacing.sm,
  },
  noticeText: { ...Typography.caption, flex: 1, lineHeight: 18 },

  footer: { marginTop: Spacing.lg, alignItems: 'center', gap: 4 },
  footerText: { ...Typography.caption, fontWeight: '600', color: ScoutColors.navy },
  footerSub: { ...Typography.caption },

  // Modal styles
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: ScoutColors.bgWhite,
    borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl,
    maxHeight: '70%', padding: Spacing.md,
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingBottom: Spacing.sm, borderBottomWidth: 1, borderBottomColor: ScoutColors.borderLight,
    marginBottom: Spacing.sm,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: ScoutColors.navy },
  modalClose: { fontSize: 20, color: ScoutColors.textMuted, padding: 4 },
  modalSearch: {
    backgroundColor: ScoutColors.bgBase, borderRadius: Radius.md,
    borderWidth: 1, borderColor: ScoutColors.borderLight,
    padding: Spacing.sm, fontSize: 14, marginBottom: Spacing.sm,
    color: ScoutColors.textPrimary,
  },
  modalItem: {
    padding: Spacing.md, borderRadius: Radius.md,
    borderWidth: 1, borderColor: ScoutColors.borderLight,
    marginBottom: 6,
  },
  modalItemActive: {
    backgroundColor: ScoutColors.navy, borderColor: ScoutColors.navy,
  },
  modalItemText: { fontSize: 14, fontWeight: '600', color: ScoutColors.navy },
  modalItemSub: { fontSize: 12, color: ScoutColors.textMuted, marginTop: 2 },
  modalEmpty: { textAlign: 'center', color: ScoutColors.textMuted, paddingVertical: Spacing.lg },
});
