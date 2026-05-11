import { useEffect } from 'react';
import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { ScoutColors } from '@/constants/theme';
import { configureNotificationHandler, ensureAndroidChannel } from '@/services/notifications';

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
  useEffect(() => {
    ensureAndroidChannel();
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
