import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

const PREF_KEY = 'scoutlink:notifications:enabled';

export function configureNotificationHandler() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

export async function ensureAndroidChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('default', {
    name: 'Padrão',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#1F4172',
    sound: 'default',
  });
}

export async function getNotificationsEnabled(): Promise<boolean> {
  const stored = await AsyncStorage.getItem(PREF_KEY);
  if (stored === null) {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  }
  return stored === 'true';
}

export async function setNotificationsEnabled(enabled: boolean): Promise<boolean> {
  if (enabled) {
    const granted = await requestPermissions();
    await AsyncStorage.setItem(PREF_KEY, granted ? 'true' : 'false');
    if (granted) {
      await ensureAndroidChannel();
      await registerPushTokenSafely();
    }
    return granted;
  }
  await AsyncStorage.setItem(PREF_KEY, 'false');
  return false;
}

export async function requestPermissions(): Promise<boolean> {
  if (!Device.isDevice) {
    // Emulators/simulators do not receive remote push, but local notifications still work.
    return true;
  }
  const current = await Notifications.getPermissionsAsync();
  if (current.status === 'granted') return true;
  if (!current.canAskAgain) return false;
  const res = await Notifications.requestPermissionsAsync();
  return res.status === 'granted';
}

async function registerPushTokenSafely(): Promise<string | null> {
  try {
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      (Constants as any).easConfig?.projectId;
    if (!projectId) return null;
    const token = await Notifications.getExpoPushTokenAsync({ projectId });
    return token.data;
  } catch {
    return null;
  }
}

export async function showLocalTestNotification(title: string, body: string) {
  await Notifications.scheduleNotificationAsync({
    content: { title, body, sound: 'default' },
    trigger: null,
  });
}
