import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import 'react-native-reanimated';

import { ScoutColors } from '@/constants/theme';
import { configureNotificationHandler, ensureAndroidChannel, requestPermissions } from '@/services/notifications';
import { registerWpBackgroundFetch, checkNowForNewPosts } from '@/services/wp-background-fetch';

// Configura como as notificações aparecem com o app aberto
configureNotificationHandler();

const ScoutTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary:    ScoutColors.orange,
    background: ScoutColors.bgBase,
    card:       ScoutColors.bgWhite,
    text:       ScoutColors.textPrimary,
    border:     ScoutColors.borderLight,
  },
};

export const unstable_settings = {
  anchor: '(auth)',
};

export default function RootLayout() {
  const router = useRouter();
  const notifListener = useRef<Notifications.EventSubscription | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    async function setup() {
      // 1. Canal Android (sem isso notificações não aparecem no Android 8+)
      await ensureAndroidChannel();

      // 2. Pede permissão de notificação ao usuário
      const granted = await requestPermissions();
      if (!granted) return;

      // 3. Registra a tarefa de background fetch
      await registerWpBackgroundFetch();

      // 4. Verifica imediatamente ao abrir o app
      checkNowForNewPosts();
    }

    setup();

    // 5. Usuário toca na notificação → vai para o feed
    notifListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as { tipo?: string };
      if (data?.tipo === 'wp_noticia') {
        router.replace('/(tabs)');
      }
    });

    // 6. App volta ao foreground → verifica posts novos silenciosamente
    const appStateSub = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (appStateRef.current.match(/inactive|background/) && nextState === 'active') {
        checkNowForNewPosts();
      }
      appStateRef.current = nextState;
    });

    return () => {
      notifListener.current?.remove();
      appStateSub.remove();
    };
  }, []);

  return (
    <ThemeProvider value={ScoutTheme}>
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="configuracoes" />
      </Stack>
      <StatusBar style="light" backgroundColor={ScoutColors.navy} />
    </ThemeProvider>
  );
}
