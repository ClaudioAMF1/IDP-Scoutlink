import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Switch, ScrollView,
  Alert, Linking, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ScoutColors, Spacing, Radius, Typography } from '@/constants/theme';
import {
  getNotificationsEnabled,
  setNotificationsEnabled,
  showLocalTestNotification,
} from '@/services/notifications';

export default function SettingsScreen() {
  const router = useRouter();

  // Settings states
  const [notifications, setNotifications] = useState(false);
  const [darkTheme, setDarkTheme] = useState(false);
  const [locationEnabled, setLocationEnabled] = useState(true);

  useEffect(() => {
    getNotificationsEnabled().then(setNotifications).catch(() => {});
  }, []);

  const onToggleNotifications = async (value: boolean) => {
    const granted = await setNotificationsEnabled(value);
    setNotifications(granted);

    if (value && !granted) {
      Alert.alert(
        'Permissão necessária',
        'Para receber notificações pop-up, habilite-as nas configurações do sistema.',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Abrir configurações',
            onPress: () => {
              if (Platform.OS === 'ios') Linking.openURL('app-settings:');
              else Linking.openSettings();
            },
          },
        ],
      );
      return;
    }

    if (granted) {
      await showLocalTestNotification(
        'Notificações habilitadas',
        'Você receberá avisos sobre eventos e chamados.',
      );
    }
  };

  const SectionTitle = ({ title }: { title: string }) => (
    <Text style={styles.sectionTitle}>{title}</Text>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Text style={styles.backBtnText}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Configurações</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={{ flex: 1, backgroundColor: ScoutColors.bgBase }}>
        <ScrollView contentContainerStyle={styles.scroll}>
        <SectionTitle title="PREFERÊNCIAS" />
        <View style={styles.card}>
          <View style={styles.settingItem}>
            <View style={styles.iconContainer}><Text>🔔</Text></View>
            <View style={styles.settingLabelContainer}>
              <Text style={styles.settingLabel}>Notificações Push</Text>
              <Text style={styles.settingSub}>Avisos sobre eventos e chamados</Text>
            </View>
            <Switch
              value={notifications}
              onValueChange={onToggleNotifications}
              trackColor={{ false: ScoutColors.borderLight, true: ScoutColors.orange }}
              thumbColor="#fff"
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.settingItem}>
            <View style={styles.iconContainer}><Text>📳</Text></View>
            <View style={styles.settingLabelContainer}>
              <Text style={styles.settingLabel}>Sincronização de Fundo</Text>
              <Text style={styles.settingSub}>Atualiza dados quando o app está fechado</Text>
            </View>
            <Switch
              value={true}
              onValueChange={() => {}}
              trackColor={{ false: ScoutColors.borderLight, true: ScoutColors.orange }}
              thumbColor="#fff"
            />
          </View>
        </View>

        <SectionTitle title="APARÊNCIA" />
        <View style={styles.card}>
          <View style={styles.settingItem}>
            <View style={styles.iconContainer}><Text>🌙</Text></View>
            <View style={styles.settingLabelContainer}>
              <Text style={styles.settingLabel}>Tema Escuro</Text>
              <Text style={styles.settingSub}>Reduz o cansaço visual e economiza bateria</Text>
            </View>
            <Switch
              value={darkTheme}
              onValueChange={setDarkTheme}
              trackColor={{ false: ScoutColors.borderLight, true: ScoutColors.orange }}
              thumbColor="#fff"
            />
          </View>
        </View>

        <SectionTitle title="PRIVACIDADE E SEGURANÇA" />
        <View style={styles.card}>
          <View style={styles.settingItem}>
            <View style={styles.iconContainer}><Text>📍</Text></View>
            <View style={styles.settingLabelContainer}>
              <Text style={styles.settingLabel}>Compartilhar Localização</Text>
              <Text style={styles.settingSub}>Necessário para UELs próximas no mapa</Text>
            </View>
            <Switch
              value={locationEnabled}
              onValueChange={setLocationEnabled}
              trackColor={{ false: ScoutColors.borderLight, true: ScoutColors.orange }}
              thumbColor="#fff"
            />
          </View>
          <View style={styles.divider} />
          
          <TouchableOpacity style={styles.settingItem} activeOpacity={0.7}>
            <View style={styles.iconContainer}><Text>🔒</Text></View>
            <View style={styles.settingLabelContainer}>
              <Text style={styles.settingLabel}>Alterar Senha</Text>
            </View>
            <Text style={styles.arrowIcon}>›</Text>
          </TouchableOpacity>
        </View>

        <SectionTitle title="SOBRE O SCOUTLINK" />
        <View style={styles.card}>
          <TouchableOpacity style={styles.settingItem} activeOpacity={0.7}>
            <View style={styles.iconContainer}><Text>📜</Text></View>
            <View style={styles.settingLabelContainer}>
              <Text style={styles.settingLabel}>Termos de Serviço</Text>
            </View>
            <Text style={styles.arrowIcon}>›</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.settingItem} activeOpacity={0.7}>
            <View style={styles.iconContainer}><Text>🛡️</Text></View>
            <View style={styles.settingLabelContainer}>
              <Text style={styles.settingLabel}>Política de Privacidade</Text>
            </View>
            <Text style={styles.arrowIcon}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>ScoutLink App Versão 1.0.4 (Build 42)</Text>
          <Text style={styles.versionSubText}>© 2026 Escoteiros do DF</Text>
        </View>

        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: ScoutColors.navy },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, 
    paddingVertical: 14, 
    backgroundColor: ScoutColors.navy,
  },
  backBtn: { width: 60, paddingVertical: 5 },
  backBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },

  scroll: { padding: Spacing.md, paddingBottom: Spacing.xxl },

  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: ScoutColors.textMuted,
    letterSpacing: 1.2,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
    marginLeft: 4,
  },

  card: {
    backgroundColor: ScoutColors.bgWhite,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: ScoutColors.borderLight,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },

  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: ScoutColors.bgWhite,
  },

  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(31, 65, 114, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },

  settingLabelContainer: {
    flex: 1,
    paddingRight: Spacing.sm,
  },
  
  settingLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: ScoutColors.navy,
  },
  
  settingSub: {
    ...Typography.caption,
    fontSize: 12,
    marginTop: 2,
    color: ScoutColors.textMuted,
  },

  divider: {
    height: 1,
    backgroundColor: ScoutColors.borderLight,
    marginLeft: 70, // Align with text
  },

  arrowIcon: {
    color: ScoutColors.textMuted,
    fontSize: 22,
    fontWeight: '300',
  },

  versionContainer: {
    marginTop: Spacing.xl,
    alignItems: 'center',
  },
  
  versionText: {
    fontSize: 13,
    color: ScoutColors.textMuted,
    fontWeight: '600',
  },
  
  versionSubText: {
    fontSize: 11,
    color: ScoutColors.textMuted,
    marginTop: 4,
  }
});
